# The Reconciler

The reconciler is the engine that takes a `ServerBlueprint` and a live Discord guild and makes them match. It reads the current server state, computes the difference between what exists and what the blueprint declares, and produces a list of actions — which it can either print (dry run) or execute (apply).

---

## Mental model

Think of the blueprint as a migration file and the reconciler as the migration runner — except it is idempotent. Running it twice on an already-correct server does nothing. Running it after a change applies only what changed. There is no "already applied" state to track.

---

## Pipeline

The reconciler works in four sequential stages. The first three stages are read-only. The fourth stage is the only one that touches Discord.

```mermaid
flowchart TD
    A([Start]) --> B[1. Validate]
    B -->|error| ABORT1([Abort — nothing touched])
    B -->|ok| C[2. Fetch guild state]
    C -->|API error| ABORT2([Abort — nothing touched])
    C -->|ok| D[3. Diff]
    D --> E{Action list empty?}
    E -->|yes| DONE([No changes needed])
    E -->|no| F{Mode?}
    F -->|dry run| G[Print Action list]
    G --> DONE2([Exit])
    F -->|apply| H[4. Apply actions sequentially]
    H --> I{All succeeded?}
    I -->|yes| DONE3([Complete])
    I -->|partial failure| J[Report all errors]
    J --> DONE4([Complete with errors])
```

---

## Stage 1 — Validate

Before touching the network, the reconciler checks that the blueprint itself is internally consistent.

Checks performed:
- No duplicate channel names across the entire structure
- No duplicate category names
- No duplicate role names
- All channel names used in the structure are declared in the `ServerContext` type *(compile-time — cannot reach here if violated)*

**Error behaviour:** abort immediately. Nothing has been fetched or changed. The user fixes the blueprint and reruns.

---

## Stage 2 — Fetch

The reconciler reads the live guild state from the Discord API in a single pass:

- All roles (name, color, permissions, hoist, position, mentionable)
- All categories (name, position, permission overwrites)
- All channels (name, type, topic, position, parent category, permission overwrites, and all type-specific fields)

The result is a snapshot of the live server that the diff stage works against.

**Error behaviour:** abort immediately. A partial fetch could produce an incorrect diff.

---

## Stage 3 — Diff

The diff stage compares the blueprint's desired state against the fetched live state and produces an `Action[]`. No Discord API calls are made here.

```mermaid
flowchart LR
    BP[Blueprint desired state] --> DIFF[Diff engine]
    LS[Live guild state] --> DIFF
    DIFF --> AL[Action list]
```

For each declared resource, the diff checks:
- Does it exist on the live server? → `create-*` action if not
- Does it match the blueprint exactly? → `update-*` action if not
- Are its permission overwrites exact? → `sync-permission-overwrite` actions for each discrepancy

For each live resource not in the blueprint:
- **Conservative mode (default):** emit a warning, no action added
- **Strict mode:** add a `delete-*` action

The action list is a typed discriminated union. Each action carries everything needed to describe itself in a dry run and execute itself in apply mode.

```typescript
type Action =
  | { type: 'create-role';                name: string;     def: RoleDef }
  | { type: 'update-role';                id: string;       name: string; changes: Partial<RoleDef> }
  | { type: 'delete-role';                id: string;       name: string }
  | { type: 'create-category';            name: string;     def: CategoryDef<ServerContext> }
  | { type: 'update-category';            id: string;       name: string; changes: Partial<CategoryDef<ServerContext>> }
  | { type: 'delete-category';            id: string;       name: string }
  | { type: 'create-channel';             name: string;     def: ChannelDef<ServerContext> }
  | { type: 'update-channel';             id: string;       name: string; changes: Partial<ChannelDef<ServerContext>> }
  | { type: 'delete-channel';             id: string;       name: string }
  | { type: 'sync-permission-overwrite';  targetId: string; targetName: string; overwrite: PermissionOverwrite<ServerContext> }
  | { type: 'delete-permission-overwrite'; targetId: string; targetName: string; subject: string }
```

---

## Stage 4 — Dry run or Apply

### Dry run

The action list is printed in a human-readable format and the process exits. Nothing is sent to Discord.

```
  CREATE role "moderator"
  UPDATE channel "general" — topic changed
  SYNC   permission overwrite on "staff-chat" for role "admin"
  WARN   channel "#memes" is unmanaged (not in blueprint)
```

Dry run is the recommended first step any time the blueprint changes.

### Apply

Actions are executed against the Discord API **sequentially**, one at a time. Sequential execution is intentional:

- Predictable — each action completes before the next begins
- Safe — discord.js handles rate limiting automatically per route; sequential calls cooperate naturally with its internal queue
- Debuggable — failures are attributable to a specific action

**Error behaviour in apply:** errors are collected, not thrown. If an action fails, the reconciler logs the error and continues with the remaining actions. All failures are reported together at the end.

This is the correct behaviour because:
1. Most actions are independent — a failed role update does not affect channel creation
2. Applying as much as possible leaves the server closer to desired state
3. On the next reconcile run, the diff naturally includes whatever failed — no special retry logic is needed

```mermaid
flowchart TD
    AL[Action list] --> LOOP[For each action]
    LOOP --> EXEC[Execute against Discord API]
    EXEC -->|success| EVT1[Emit action:applied]
    EXEC -->|failure| EVT2[Emit action:failed]
    EVT1 --> NEXT{More actions?}
    EVT2 --> COLLECT[Collect error]
    COLLECT --> NEXT
    NEXT -->|yes| LOOP
    NEXT -->|no| REPORT[Emit complete with results]
```

---

## Progress events

The reconciler emits typed events during apply so callers can display live progress:

```typescript
reconciler.on('action:applied', (action) => {
  console.log(`  ✓ ${describeAction(action)}`);
});

reconciler.on('action:failed', (action, error) => {
  console.error(`  ✗ ${describeAction(action)}: ${error.message}`);
});

reconciler.on('complete', (result) => {
  console.log(`Done. ${result.applied} applied, ${result.errors.length} failed.`);
});
```

---

## Unmanaged resources

Resources that exist on the live server but are not declared in the blueprint are called **unmanaged**. The reconciler's behaviour toward them depends on the mode:

| Mode | Behaviour |
|---|---|
| Conservative (default) | Warn in output, leave untouched |
| Strict (`--strict` or `strict: true`) | Add a `delete-*` action to the plan |

Declared resources are **always enforced exactly**, regardless of mode. If a channel exists in the blueprint but has drifted (wrong topic, wrong permissions), the reconciler corrects it. The conservative/strict distinction only applies to resources not mentioned in the blueprint at all.

See [ADR-0003](../adr/0003-unmanaged-resource-policy.md) for the full reasoning.

---

## Channel identity

In v1, the reconciler identifies channels by name. The blueprint channel name is the lookup key against the live server. This means:

- **Renaming a channel in the blueprint creates a new Discord channel.** The old channel becomes unmanaged.
- Message history is not preserved on rename.
- This is a known v1 limitation. A lock file system (`infracord.lock.json`) is planned for v2 to enable in-place renames by tracking Discord channel IDs.

See [ADR-0004](../adr/0004-channel-identity.md) for full details and the v2 path.

---

## Rate limiting

The reconciler does not implement any rate limit logic. discord.js maintains per-route rate limit buckets, reads `X-RateLimit-*` headers on every response, and queues requests automatically. Sequential action application cooperates naturally with this — there is nothing for infracord to add on top.

The highest-volume operation is permission overwrites: each overwrite on each channel is a separate API call. A large blueprint can produce many overwrite calls on a fresh apply. This is handled correctly by discord.js and is acceptable given reconciliation runs infrequently.

See [ADR-0005](../adr/0005-rate-limiting.md) for full details.

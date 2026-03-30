# Reconciliation Pipeline

* Status: accepted
* Date: 2026-03-30

## Context and Problem Statement

When a user runs the reconciler, how should infracord apply the blueprint to a live Discord server? Should it apply changes as it goes and stop on failure, or build a complete picture of all required changes before touching anything?

## Decision Drivers

* Dry run is a first-class feature — users must be able to see every change before it happens
* Destructive changes (deleting a channel, removing a role) must be visible and intentional
* A crash halfway through apply must not leave the server in an unknown, unrecoverable state
* The reconciler operates on a single guild — multi-guild wiring is the caller's concern

## Considered Options

* **Option A** — Plan-then-apply: validate → fetch → diff → `Action[]` → dry run or apply
* **Option B** — Imperative loop: walk the blueprint, create/update as you go, stop on error

## Decision Outcome

Chosen option: **Option A — plan-then-apply**, because it is the only model that can support a genuine dry run, gives users full visibility before any API calls are made, and separates the "what will change" question from the "apply the changes" question.

### Positive Consequences

* Dry run is trivially printable — the `Action[]` is a serialisable list
* The plan phase is read-only; if it fails, nothing has been touched
* Actions are independent of execution — the same list can be logged, inspected, or applied

### Negative Consequences

* Two Discord API round trips (fetch state + apply) instead of one pass
* More code surface than an imperative loop

## Pipeline Design

```
1. Validate   — check blueprint integrity (duplicate names, etc.)
                abort on any error — nothing has been touched
2. Fetch      — read live guild state from Discord (roles, channels, categories, overwrites)
                abort on API failure
3. Diff       — compare desired state vs live state → produce Action[]
4. Dry run    — print Action[] with human-readable descriptions, exit
   Apply      — execute each action against the Discord API
```

**Action type shape:**

```typescript
type Action =
  | { type: 'create-role';               name: string;  def: RoleDef }
  | { type: 'update-role';               id: string;    name: string; changes: Partial<RoleDef> }
  | { type: 'delete-role';               id: string;    name: string }
  | { type: 'create-category';           name: string;  def: CategoryDef<ServerContext> }
  | { type: 'update-category';           id: string;    name: string; changes: Partial<CategoryDef<ServerContext>> }
  | { type: 'delete-category';           id: string;    name: string }
  | { type: 'create-channel';            name: string;  def: ChannelDef<ServerContext> }
  | { type: 'update-channel';            id: string;    name: string; changes: Partial<ChannelDef<ServerContext>> }
  | { type: 'delete-channel';            id: string;    name: string }
  | { type: 'sync-permission-overwrite'; targetId: string; targetName: string; overwrite: PermissionOverwrite<ServerContext> }
  | { type: 'delete-permission-overwrite'; targetId: string; targetName: string; subject: string }
```

## Error Handling

Two distinct phases, two distinct behaviours:

**Plan phase (validate + fetch + diff)** — abort immediately on any error. No changes have been made, so aborting is safe. The user fixes the problem and reruns.

**Apply phase** — collect errors, continue applying remaining actions, report all failures at the end. Rationale: actions are largely independent (creating a role does not depend on updating a channel topic). Applying as much as possible means the server is closer to desired state even after a partial failure. On the next reconcile run, the diff will naturally include whatever failed — no special retry logic required.

## Links

* Informed by [ADR-0001](0001-blueprint-api-shape.md)
* Resource management policy: [ADR-0003](0003-unmanaged-resource-policy.md)
* Channel identity: [ADR-0004](0004-channel-identity.md)
* Rate limiting: [ADR-0005](0005-rate-limiting.md)

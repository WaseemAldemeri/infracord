# InfracordClient

The `InfracordClient` is the runtime core of infracord. It receives the blueprint and features at construction time, wires everything together when `start()` is called, and routes incoming Discord interactions to the correct handlers.

For the decisions behind this design, see [ADR-0007](../adr/0007-ic-context-and-client-wiring.md). For how features are defined, see [feature-system.md](./feature-system.md).

> **Design status:** the client interface is specified here as an architecture document. Formal ADRs will be written during implementation as gaps surface.

---

## Interface

```typescript
interface InfracordClient<Ctx extends ServerContext> {
  /** Raw discord.js Client — always accessible for escape-hatch usage */
  readonly discord: Client

  /** Typed live channel objects, keyed by names declared in the blueprint */
  readonly channels: { [K in keyof Ctx["_channels"]]: DiscordChannelFor<Ctx["_channels"][K]> }

  /** Typed live role objects, keyed by names declared in the blueprint */
  readonly roles: Record<Ctx["_roles"], Role>

  /** Connect to Discord, reconcile, deploy commands, call onStart hooks */
  start(): Promise<void>
}
```

`channels` and `roles` are populated from the live guild after the `ready` event, before any `onStart` hooks run. Accessing them before `start()` resolves is undefined behaviour.

`client.channels["general"]` returns `TextChannel`. `client.channels["voice-lounge"]` returns `VoiceChannel`. The specific discord.js type is inferred from the `type` field declared in `defineChannels`. A channel name not in the blueprint is a compile error.

---

## Construction

All configuration is passed at construction time. The client is inert until `start()` is called — construction performs no I/O and makes no Discord API calls.

```typescript
const client = new InfracordClient({
  token:    process.env.DISCORD_TOKEN,
  blueprint: myBlueprint,
  features: [moderationFeature, welcomeFeature, loggingFeature],
})

await client.start()
```

`blueprint` carries the full server type — `channels`, `roles`, `structure`, and `permissions`. `features` is the complete list of features the bot will run. Both must be provided before `start()`.

---

## `start()` sequence

```
1. Build routing maps from all registered features:
     commandMap  — Map<commandName, execute handler>
     staticMap   — Map<customId, handler>
     dynamicMap  — Map<prefix, { parse, handler }>
   → Throw immediately on any duplicate command name, customId, or prefix

2. Wire event listeners — one discord.js .on() per declared EventParams entry

3. Login to Discord (discord.js client.login)

4. On "ready":
     a. Run reconciler against the blueprint
     b. Populate client.channels and client.roles from the live guild
     c. Deploy slash commands to Discord via REST
     d. Call onStart hooks from all features, sequentially

5. Begin routing incoming interactions via the maps
```

Steps 4a–4d run in order. `onStart` hooks fire last — they can safely assume the server structure matches the blueprint and all commands are registered.

---

## Interaction routing

On every `interactionCreate` event the client dispatches as follows:

**Slash command** — look up `interaction.commandName` in `commandMap`, call `execute` with the interaction and the client.

**Component or modal** — check `staticMap` for an exact match on `interaction.customId`. If not found, split `customId` on the first `:`, check `dynamicMap` for the prefix, call `parse` on the remainder, pass the typed data and client to `handler`.

**No match** — log a warning and ignore. No crash, no unhandled rejection.

### Internal map types

The routing maps use type-erased signatures internally. This is safe: the `type: "button"` discriminant on a registered interaction guarantees it was produced by a button handler and will only be matched against `ButtonInteraction` events. The compile-time conditional types are the guarantee — the runtime router trusts them.

```typescript
// Internal only — not user-facing
type AnyHandler      = (interaction: AnyInteraction, client: InfracordClient) => void | Promise<void>
type AnyDynamicEntry = { parse: (raw: string) => unknown; handler: (interaction: AnyInteraction, data: unknown, client: InfracordClient) => void | Promise<void> }

const commandMap = new Map<string, AnyCommandHandler>()
const staticMap  = new Map<string, AnyHandler>()
const dynamicMap = new Map<string, AnyDynamicEntry>()
```

---

## `InfracordClient` vs `ic`

These are distinct objects with distinct roles:

| | `ic` | `InfracordClient` |
|---|---|---|
| Created by | `createIc(blueprint)` | `new InfracordClient(...)` |
| Has runtime state | No | Yes |
| Has lifecycle | No | Yes (`start()`) |
| Purpose | Typed factory for defining features | Wires and runs the bot |
| When used | At module load time | At runtime |

`ic` is a compile-time tool. The client is the runtime engine. They are separate by design — features can be defined without any client being constructed, which makes them trivially portable and testable.

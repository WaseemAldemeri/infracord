# Feature System

The feature system is the application layer of infracord. This document covers the feature API: how `ic` is constructed and used, and how features, commands, events, and interactions are defined.

For the decisions behind these choices, see [ADR-0006](../adr/0006-feature-api-shape.md) and [ADR-0007](../adr/0007-ic-context-and-client-wiring.md). For how the client receives and wires features at runtime, see [client.md](./client.md).

---

## The `ic` factory

`createIc(blueprint)` is the entry point to the feature system. It takes the blueprint value, extracts the full inferred `ServerContext` type from it, and returns a plain object of typed factory functions. It holds no runtime state — no connection to Discord, no internal registry.

Define it once, export it, import it from every feature file:

```typescript
// src/ic.ts
import { createIc } from "infracord"
import { blueprint } from "./blueprint.js"

export const ic = createIc(blueprint)
```

```typescript
// src/features/moderation.ts
import { ic } from "../ic.js"

export const moderationFeature = ic.feature({ ... })
```

---

## Feature shape

A feature is a plain object with no required name. Its identity comes from the commands, events, and interactions it registers — not from a label.

```typescript
ic.feature({
  commands?:     CommandParams[],
  events?:       EventParams[],
  interactions?: (StaticInteraction | DynamicInteraction)[],
  onStart?:      (client: InfracordClient<Ctx>) => void | Promise<void>,
})
```

All fields are optional — a feature may declare only events, or only commands, or any combination.

**`onStart`** is called once after the client is ready, the reconciler has run, and slash commands have been deployed. It receives the typed `InfracordClient`. It must be idempotent — it may run on every bot startup.

---

## Slash commands

`name` and `description` are first-class fields. Options are defined via a discord.js builder callback: infracord creates a fresh builder, passes it to the callback, and uses the result. This exposes the full discord.js options API without wrapping it.

```typescript
ic.command({
  name: "ban",
  description: "Ban a user from the server",
  build: (cmd) =>
    cmd.addUserOption((o) =>
      o.setName("user").setDescription("User to ban").setRequired(true)
    ),
  execute: async (interaction, client) => {
    const target = interaction.options.getUser("user", true)
    // client.channels, client.roles are typed from the blueprint
  },
})
```

The `execute` handler receives a `ChatInputCommandInteraction` from discord.js and the typed `InfracordClient`. The `build` callback is optional — omit it if the command takes no options.

---

## Event handlers

Event handlers are typed directly from discord.js's `ClientEvents` map. The `event` field is a key of `ClientEvents`; the handler receives the typed `InfracordClient` as its **first** argument, followed by the spread event args.

```typescript
ic.event({
  event: "guildMemberAdd",
  handler: async (client, member) => {
    // member is typed as GuildMember
    const role = client.roles["member"]
    await member.roles.add(role)
  },
})
```

The client is first because TypeScript requires rest parameters (`...args: ClientEvents[E]`) to be last in a variadic signature.

---

## Interactions

Interactions bundle a component's definition and its handler into one object. There are two factories:

### `ic.interaction` — static

Use when the component is always the same (same label, style, etc.).

The `type` field is a string from the `InteractionType` union and drives the types of both `build` and `handler`. infracord creates a fresh builder of the correct type, pre-sets `customId = id`, then passes it to the `build` callback. **Users never set `customId` directly** — infracord owns it.

The returned object exposes `.build()` for constructing the component when composing a message or showing a modal.

```typescript
const confirmButton = ic.interaction({
  type: "button",
  id: "moderation:confirm",
  build: (b) => b.setLabel("Confirm").setStyle(ButtonStyle.Success),
  handler: async (interaction, client) => {
    await interaction.reply({ content: "Confirmed.", ephemeral: true })
  },
})

// when composing a message reply:
new ActionRowBuilder().addComponents(confirmButton.build())
```

### `ic.dynamicInteraction` — dynamic

Use when the component must carry per-message data — for example, a ban button encoding a target user ID.

The `customId` becomes `prefix:encode(data)`. The router splits on the first `:`, looks up the prefix, calls `parse` on the remainder, and passes the typed result to `handler`. `TData` is inferred from `encode`/`parse` — no annotation needed.

```typescript
const banButton = ic.dynamicInteraction({
  type: "button",
  prefix: "moderation:ban",
  encode: (userId: string) => userId,
  parse: (raw) => raw,
  build: (b, data) => b.setLabel("Ban").setStyle(ButtonStyle.Danger),
  handler: async (interaction, userId, client) => {
    // userId is typed as string
    await interaction.guild!.members.ban(userId)
  },
})

// .build() requires the typed data argument:
new ActionRowBuilder().addComponents(banButton.build(target.id))
```

### Supported interaction types

The `type` field accepts:

| Value | Builder | Handler |
|---|---|---|
| `"button"` | `ButtonBuilder` | `ButtonInteraction` |
| `"stringSelectMenu"` | `StringSelectMenuBuilder` | `StringSelectMenuInteraction` |
| `"userSelectMenu"` | `UserSelectMenuBuilder` | `UserSelectMenuInteraction` |
| `"roleSelectMenu"` | `RoleSelectMenuBuilder` | `RoleSelectMenuInteraction` |
| `"channelSelectMenu"` | `ChannelSelectMenuBuilder` | `ChannelSelectMenuInteraction` |
| `"mentionableSelectMenu"` | `MentionableSelectMenuBuilder` | `MentionableSelectMenuInteraction` |
| `"modal"` | `ModalBuilder` | `ModalSubmitInteraction` |

Modals follow the same pattern — `.build()` returns a `ModalBuilder` passed to `interaction.showModal()`.

### ID uniqueness

Users are responsible for choosing unique IDs and prefixes across all features. A naming convention of `featureName:interactionId` is recommended. Duplicate IDs are detected at startup before the bot connects — see [client.md](./client.md).

---

## Recommended project structure

```
src/
  blueprint.ts     — defineRoles, defineChannels, createBlueprint — exported
  ic.ts            — createIc(blueprint) — exported
  client.ts        — new InfracordClient({ blueprint, features })
  features/
    moderation.ts  — imports ic, exports moderationFeature
    welcome.ts     — imports ic, exports welcomeFeature
```

`blueprint.ts` is the single source of truth — it is the foundation everything else imports from. `ic.ts` imports the blueprint and exports the typed factory. Feature files import `ic`. `client.ts` imports features and the blueprint and assembles everything. There are no circular dependencies in this layout.

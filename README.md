# infracord

infracord is a TypeScript framework for Discord bots that brings structure to both your server and your code. You declare your server's channels and permissions as a blueprint that stays in sync with Discord, and you build your bot's functionality as self-contained features that bundle commands, events, and interactions together — with type-safe access to every resource you declared.

## Why

Managing a Discord bot's server structure and logic by hand doesn't scale. Channels get created inconsistently, permissions drift, and there's no source of truth. On the code side, commands and their interaction handlers end up scattered across separate files with magic string IDs tying them together loosely.

infracord solves both. It treats your server layout the same way Terraform treats cloud infrastructure — declare the desired state, let the framework reconcile it — and gives you a feature system that keeps related commands, events, and interactions in one place.

## How it works

infracord has two layers that work together.

**Server blueprint** — you declare your server's roles, channels, and permission overwrites as plain TypeScript values. infracord compares that against the live Discord server and applies only the necessary changes to bring it into sync. The framework infers full type information from your blueprint with no annotations required — reference a channel that doesn't exist and it's a compile error, not a runtime crash.

**Feature system** — you organise your bot's functionality into self-contained features. Each feature bundles its slash commands, event listeners, and interaction handlers together. Buttons, select menus, and modals are defined as single objects that carry both the component's appearance and its handler. Features are passed to the client at construction time; infracord wires everything up before the bot connects.

Everything flows from the blueprint. `createIc(blueprint)` and `new InfracordClient({ blueprint, ... })` both infer your server's full type from it — typed channel objects, typed role objects, compile-time validation across the whole codebase from one source.

```typescript
import { defineRoles, defineChannels, createBlueprint, createIc, InfracordClient } from "infracord"

const roles = defineRoles({
  moderator: { permissions: [PermissionFlagsBits.BanMembers] },
  member:    { permissions: [] },
})

const channels = defineChannels({
  general:        { type: "text",  topic: "General chat" },
  "voice-lounge": { type: "voice", bitrate: 64000 },
})

const blueprint = createBlueprint({
  roles,
  channels,
  structure: [
    { category: "Community", channels: ["general"] },
    { channel: "voice-lounge" },
  ],
  permissions: [
    { channel: "general", role: "moderator", allow: [PermissionFlagsBits.ManageMessages] },
  ],
})

export const ic = createIc(blueprint)

// client.channels["general"]  → TextChannel
// client.channels["typo"]     → compile error
```

## Learn more

- [Philosophy](docs/philosophy.md) — the principles behind infracord and why it is designed the way it is
- [Architecture overview](docs/architecture/overview.md) — the two layers, how they connect, and how the framework is structured
- [Blueprint](docs/architecture/blueprint.md) — `defineRoles`, `defineChannels`, `createBlueprint`, full field reference
- [Feature system](docs/architecture/feature-system.md) — `ic` factory, features, commands, events, interactions
- [Client](docs/architecture/client.md) — `InfracordClient` interface, startup sequence, interaction routing
- [Reconciler](docs/architecture/reconciler.md) — plan-then-apply pipeline, diffing, error handling

## Status

Early development. Not ready for production use.

## License

MIT

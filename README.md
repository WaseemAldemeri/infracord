# infracord

infracord is a TypeScript framework for Discord bots that brings structure to both your server and your code. You declare your server's channels and permissions as a blueprint that stays in sync with Discord, and you build your bot's functionality as self-contained features that bundle commands, events, and interactions together — with type-safe access to every resource you declared.

## Why

Managing a Discord bot's server structure and logic by hand doesn't scale. Channels get created inconsistently, permissions drift, and there's no source of truth. On the code side, commands and their interaction handlers end up scattered across separate files with magic string IDs tying them together loosely.

infracord solves both. It treats your server layout the same way Terraform treats cloud infrastructure — declare the desired state, let the framework reconcile it — and gives you a feature system that keeps related commands, events, and interactions in one place.

## How it works

infracord has two layers that work together.

**Server blueprint** — you declare your server's categories, channels, and permission overrides as a TypeScript definition. infracord compares that against the live Discord server and applies only the necessary changes to bring it into sync.

**Feature system** — you organize your bot's functionality into self-contained features. Each feature bundles its slash commands, event listeners, and interaction handlers (buttons, select menus, modals) together. Features are registered on startup, and infracord wires everything up — commands get deployed, events get listened to, and interactions get routed.

Because everything is defined in TypeScript, you get compile-time type safety and autocompletion throughout — from the channels you declared in your blueprint to the interaction handlers in your features.

## Learn more

- [Philosophy](docs/philosophy.md) — the principles behind infracord and why it is designed the way it is
- [Architecture overview](docs/architecture/overview.md) — the two layers, how they connect, and how the framework is structured
- [How the reconciler works](docs/architecture/reconciler.md) — the full pipeline from blueprint to live server

## Status

Early development. Not ready for production use.

## License

MIT

# Blueprint API Shape

* Status: accepted
* Date: 2026-03-29

## Context and Problem Statement

How should users declare their Discord server's structure in TypeScript? We need to decide how roles, channels, and categories are defined; how the type system enforces correctness; and how structural mistakes are surfaced.

## Decision Drivers

* Role, channel, and category names referenced anywhere in the blueprint must be validated at compile time
* Channel order must be explicit — Discord uses position to order channels in the sidebar
* The API should support all Discord guild channel types (text, voice, announcement, stage, forum, media)
* Structural mistakes (duplicate names) should surface before the reconciler touches the live server

## Considered Options

* **Option A** — Array-based structure with a `ServerContext` phantom type bundling all three name unions
* **Option B** — Object-keyed structure (`Record<MyChannels, ChannelDef>` for channels)
* **Option C** — Flat list with no explicit category grouping

## Decision Outcome

Chosen option: **Option A**, because it preserves explicit channel ordering (Discord uses position), keeps the structure readable top-to-bottom like a real server sidebar, and the `ServerContext` phantom type means the three name unions are defined once and flow through the entire framework without re-threading three generics everywhere.

### Positive Consequences

* Channel array order maps directly to Discord channel positions — no separate `position` field needed
* Discriminated unions on `type` give per-channel-type autocompletion with no extra ceremony
* All name references (roles, channels, categories) in the blueprint are compile-time checked
* `Record<Roles<Ctx>, RoleDef>` means a missing or extra role definition is a compile error
* The same `ServerContext` token flows to `ServerBlueprint`, `ic`, and any future API surface

### Negative Consequences

* Duplicate channel/category names cannot be caught at compile time — detected by the dry run instead

## Design Decisions

**`ServerContext` phantom type.** Rather than passing three generics to every class and function, they are bundled into a single phantom type. It holds no runtime value.

```typescript
type ServerContext<R extends string = string, C extends string = string, K extends string = string> = {
  readonly _roles: R;
  readonly _channels: C;
  readonly _categories: K;
};

// Usage
type MyServer = ServerContext<'admin' | 'member', 'general' | 'mod-log', 'Community' | 'Staff'>;

const blueprint = new ServerBlueprint<MyServer>({ ... });
const ic        = createIc<MyServer>(blueprint); // same token, no re-threading
```

**Array-based structure.** Categories and top-level channels are declared in an ordered array. Array position maps to Discord channel position.

**Permission overwrite targets.** Role targets are typed as `Roles<Ctx> | '@everyone'` — a compile error if the role isn't declared. User targets take a plain Discord snowflake `id: string` (user IDs cannot be statically typed).

**All six Discord guild channel types** are supported via a discriminated union on `type`: `text`, `voice`, `announcement`, `stage`, `forum`, `media`. Each variant exposes only the fields relevant to that channel type.

## Pros and Cons of the Options

### Option A — Array-based structure with ServerContext (chosen)

* Good, because array order = Discord position, no extra bookkeeping
* Good, because readable top-to-bottom like a real server sidebar
* Bad, because duplicate names require a runtime dry-run check

### Option B — Object-keyed channels

* Good, because duplicate channel names are impossible at the type level
* Bad, because object keys have no guaranteed order — positions would need a separate field
* Bad, because nesting objects inside objects (channels inside categories) hurts readability

### Option C — Flat list, categories inferred from position

* Bad, because category membership becomes implicit — against the no-magic philosophy
* Bad, because permission overwrite inheritance from category to channel becomes ambiguous

## Links

* Informed by [ADR-0000](0000-record-architecture-decisions.md)
* Implemented in `packages/core/src/blueprint/`

# Blueprint API Shape

* Status: accepted (revised 2026-04-06)
* Date: 2026-03-30

## Context and Problem Statement

How should users declare their Discord server's structure in TypeScript? We need to decide how roles, channels, and permission overwrites are defined; how the type system enforces correctness; and how the framework infers all necessary type information without requiring explicit annotations.

## Decision Drivers

* Channel and role names must be validated at compile time across the whole codebase
* Channel types (`text`, `voice`, etc.) must drive autocomplete and field validation — wrong fields on the wrong channel type must be a compile error
* Permission overwrites must be validated against declared role names with full autocomplete
* Users should write plain values — no type annotations, no `as const`, no generics
* `ServerContext` (the internal phantom type) must be invisible to users
* Adding a new channel should require touching one place only — the channel, its category, and its permissions should be co-located

## Considered Options

* **Option A** — Explicit `ServerContext` type annotation by the user; array-based structure with embedded channel config
* **Option B** — Value-driven three-step API: `defineRoles` + `defineChannels` + `createBlueprint` as the connector; `ServerContext` fully inferred
* **Option C** — Two-step API: `defineRoles` + `createBlueprint` with channels inline in `structure`; permissions co-located on channel and category definitions

## Decision Outcome

Chosen option: **Option C**. It gives full compile-time validation while matching the user's mental model: when adding a channel, everything about it — name, type, config fields, category membership, and permission overwrites — lives in one place. Option A was ruled out because it forced users to write `ServerContext` annotations that merely restated values already in the blueprint. Option B was initially preferred for type-safety reasons (see prior revision, 2026-03-30), but Option C turns out to be safe: because `roles` and `structure` are sibling keys in the single `createBlueprint` call, TypeScript infers `R` from `roles: ServerRoles<R>` and then uses that resolved `R` to check `PermissionMap<R>` inside `structure`. Excess property checking catches role names not present in `defineRoles`.

### Positive Consequences

* Zero type annotations — purely value-driven
* `ServerContext` is an internal detail, never written by the user
* Channel config, category placement, and permission overwrites are co-located — adding a channel touches one place
* Category permissions live on the category object, which mirrors how Discord presents them
* `createIc(blueprint)` and `new InfracordClient({ blueprint })` both infer the full server type from one value

### Negative Consequences

* Channel names are `name` fields inside an array, not object keys — duplicate names are not caught at the type level (the reconciler must handle this at runtime)
* Role name autocomplete inside `permissions` objects may not trigger in all editors, because `R` is inferred from the sibling `roles` key rather than from explicit contextual typing at the cursor position

## Pros and Cons of the Options

### Option A — Explicit `ServerContext` annotation

* Good, because one call for the blueprint
* Bad, because users must write type annotations that restate values already in the blueprint
* Bad, because channel names as string union values are widened to `string` — `client.channels` cannot return specific discord.js types

### Option B — Value-driven three-step API

* Good, because zero type annotations — purely value-driven
* Good, because channel names as object keys are inherently unique — duplicate names are a compile error
* Good, because full autocomplete everywhere including permissions
* Bad, because three calls instead of one
* Bad, because permissions are defined separately from channel config — adding a channel requires touching three places

### Option C — Two-step API with co-located permissions (chosen)

* Good, because zero type annotations — purely value-driven
* Good, because one call, minimal API surface
* Good, because channel config, position, and permissions are co-located
* Good, because full compile-time validation: invalid channel type fields, undeclared role names in permissions
* Bad, because channel names are array fields — no compile-time duplicate detection

## Links

* Full API specification: [docs/architecture/blueprint.md](../architecture/blueprint.md)
* See [ADR-0007](0007-ic-context-and-client-wiring.md) — how `createIc(blueprint)` and the client extract `Ctx`

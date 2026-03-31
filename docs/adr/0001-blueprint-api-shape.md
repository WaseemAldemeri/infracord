# Blueprint API Shape

* Status: accepted (revised 2026-03-30)
* Date: 2026-03-30

## Context and Problem Statement

How should users declare their Discord server's structure in TypeScript? We need to decide how roles, channels, and permission overwrites are defined; how the type system enforces correctness; and how the framework infers all necessary type information without requiring explicit annotations.

## Decision Drivers

* Channel and role names must be validated at compile time across the whole codebase
* Channel types (`text`, `voice`, etc.) must drive autocomplete and field validation — wrong fields on the wrong channel type must be a compile error
* Permission overwrites must be validated against declared role and channel names with full autocomplete
* Users should write plain values — no type annotations, no `as const`, no generics
* `ServerContext` (the internal phantom type) must be invisible to users

## Considered Options

* **Option A** — Explicit `ServerContext` type annotation by the user; array-based structure with embedded channel config
* **Option B** — Value-driven API: `defineRoles` + `defineChannels` + `createBlueprint` as the connector; `ServerContext` fully inferred
* **Option C** — Single `createBlueprint` call with everything inline; `ServerContext` inferred from the call

## Decision Outcome

Chosen option: **Option B**. It gives full autocomplete and compile-time validation everywhere — including permission overwrites — without any type annotations. Option C was ruled out because TypeScript infers `roles` and `channels` simultaneously in a single call and cannot use one to contextually type the other, which breaks autocomplete for permission overwrite role names. Option A was ruled out because it forced users to write `ServerContext` annotations that merely restated values already in the blueprint.

### Positive Consequences

* Zero type annotations — purely value-driven
* `ServerContext` is an internal detail, never written by the user
* Full autocomplete: channel fields narrow by `type`, channel names validate in `structure`, role names validate in `permissions`
* `createIc(blueprint)` and `new InfracordClient({ blueprint })` both infer the full server type from one value

### Negative Consequences

* Three API calls instead of one
* Permission overwrites live in `createBlueprint` rather than alongside channel config, which differs from Discord's UI mental model

## Pros and Cons of the Options

### Option A — Explicit `ServerContext` annotation

* Good, because one call for the blueprint
* Bad, because users must write type annotations that restate values already in the blueprint
* Bad, because channel names as string union values are widened to `string` — `client.channels` cannot return specific discord.js types

### Option B — Value-driven three-step API (chosen)

* Good, because zero type annotations — purely value-driven
* Good, because full autocomplete everywhere including permissions
* Good, because `ic` and client infer everything from the blueprint value
* Bad, because three calls instead of one
* Bad, because permissions are defined separately from channel config

### Option C — Single `createBlueprint` call

* Good, because one call, minimal API surface
* Bad, because TypeScript infers `roles` and `channels` simultaneously — role names in permission overwrites cannot be autocompleted or validated
* Bad, because permission overwrites inside channel definitions reference roles TypeScript hasn't resolved yet

## Links

* Full API specification: [docs/architecture/blueprint.md](../architecture/blueprint.md)
* See [ADR-0007](0007-ic-context-and-client-wiring.md) — how `createIc(blueprint)` and the client extract `Ctx`

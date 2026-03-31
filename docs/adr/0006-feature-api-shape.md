# Feature API Shape

* Status: accepted
* Date: 2026-03-30

## Context and Problem Statement

How should users define bot logic in infracord? We need a unit of organisation that co-locates related slash commands, event listeners, and interaction handlers, provides type-safe access to blueprint resources throughout, and registers with the client without magic or hidden conventions.

## Decision Drivers

* Bot logic for a domain area should live in one place — commands, events, and interactions that belong together should not be split across separate files
* Interaction handlers and their components should be defined together — having a button's appearance and its handler in separate places is a common source of drift
* All handlers must receive a typed `InfracordClient` without the user repeating the `ServerContext` generic at every call site
* Dynamic interactions — components that carry per-message data in their `customId` — must be supported without pattern-matching on strings
* The API must be explicit: no file-system scanning, no decorators, no implicit discovery

## Considered Options

* **Option A** — Named factory per interaction type (`ic.button()`, `ic.selectMenu()`, `ic.modal()`, …)
* **Option B** — Single `ic.interaction()` factory with a `type` discriminant driving builder and handler types
* **Option C** — Plain objects with no factory, features assembled manually by the user

## Decision Outcome

Chosen option: **Option B**, with a consistent named-params-object API across all factory functions (`ic.command`, `ic.event`, `ic.interaction`, `ic.dynamicInteraction`, `ic.feature`).

The `type` discriminant on `ic.interaction` and `ic.dynamicInteraction` maps to the correct discord.js builder and interaction types via conditional types — no annotations needed at the call site, and adding a new Discord interaction type requires only a new entry in the union.

Features are plain objects with no `name` field. A feature's identity is its registrations (commands by name, interactions by id or prefix), not a label. infracord throws at startup on any duplicate command name, interaction id, or prefix.

### Positive Consequences

* One interaction mental model regardless of component type
* Builder and handler types are fully inferred from `type` — no generics at the call site
* Component definition and handler live in one object — no drift
* Dynamic interactions carry typed data with an explicit encode/parse contract
* `ic` captures `ServerContext` once — no threading at every definition

### Negative Consequences

* Two factories (`ic.interaction` vs `ic.dynamicInteraction`) — users must know which to reach for
* Conditional types in framework internals are more complex than one class per type

## Pros and Cons of the Options

### Option A — One factory per interaction type

* Good, because the function name communicates the type immediately
* Bad, because every new Discord interaction type requires a new framework function
* Bad, because the implementation repeats the same pattern for each type

### Option B — Single factory with type discriminant (chosen)

* Good, because adding a new interaction type is one line in the union
* Good, because users learn one consistent shape
* Bad, because two factories (static vs dynamic) add a decision point

### Option C — Plain objects, no factory

* Good, because no factory API to learn
* Bad, because without the factory there is no mechanism to capture `ServerContext` — typed client access would require threading generics manually everywhere

## Links

* Depends on [ADR-0001](0001-blueprint-api-shape.md) — ServerContext phantom type
* See [ADR-0007](0007-ic-context-and-client-wiring.md) — how `ic` is constructed and features are registered
* Full API specification: [docs/architecture/feature-system.md](../architecture/feature-system.md)

# ic Context Object and Client Wiring

* Status: accepted
* Date: 2026-03-30

## Context and Problem Statement

Two coupled questions: what is `ic`, how is it constructed, and what does it expose? And how are features registered with the client, and how does the client wire everything up at runtime?

## Decision Drivers

* `ServerContext` must never be written by the user — it is an internal type inferred from the blueprint
* `ic` must have zero runtime state — it is a typed factory, not a connection or a registry
* Feature registration must be explicit and visible in one place
* ID collisions must be detected at startup, not at interaction time
* The underlying discord.js `Client` must remain accessible to users at all times

## Considered Options

**For `ic` construction:**
* **Option A** — `createIc(blueprint)` — stateless factory, `Ctx` inferred from the blueprint value
* **Option B** — `ic` is derived from the live client after construction
* **Option C** — `ic` is a global singleton with no type parameter

**For feature registration:**
* **Option X** — Features passed in the client constructor
* **Option Y** — Features registered via `client.register()` calls before `start()`

## Decision Outcome

Chosen option: **Option A + Option X**. `createIc(blueprint)` extracts `Ctx` from the blueprint and returns a stateless factory. The blueprint is the single source of truth — `ic` and the client both receive it and infer their types from it. Features are passed in the constructor. The client is inert until `start()` is called.

### Positive Consequences

* `ServerContext` is never written by the user — it flows from blueprint to `ic` to client invisibly
* All features visible at the constructor call site — no scattered `register()` calls
* Collision detection runs before Discord login — failures are early and loud
* `ic` has no lifecycle and cannot be misused

### Negative Consequences

* All features must be known at construction time — runtime-dynamic feature loading is not supported (intentional)

## Pros and Cons of the Options

### Option A — `createIc(blueprint)` (chosen)

* Good, because no lifecycle to manage — cannot fail, cannot be misused
* Good, because the blueprint is already the source of truth — `ic` simply extracts the type from it
* Good, because features can be defined in any file without depending on the client being constructed first
* Good, because the user never writes a type annotation — `Ctx` is fully inferred

### Option B — `ic` derived from the live client

* Good, because `ic` and client are always in sync
* Bad, because features would depend on the client being constructed first — module ordering requirements
* Bad, because `ic` would have a lifecycle, complicating testing and scripting

### Option C — Global singleton with no type parameter

* Bad, because without a type parameter `ic` cannot carry `ServerContext` — all type safety is lost

### Option X — Features in constructor (chosen)

* Good, because the full bot configuration is visible in one place
* Good, because the client can validate everything before connecting to Discord
* Good, because no "forgot to register" footgun

### Option Y — `client.register()` before start

* Good, because slightly more flexibility at module boundaries
* Bad, because registration and construction are decoupled — easy to call `start()` before all features are registered
* Bad, because the feature set is not visible without reading multiple call sites

## Links

* Depends on [ADR-0001](0001-blueprint-api-shape.md) — blueprint API, `ServerContext` inference
* Depends on [ADR-0006](0006-feature-api-shape.md) — feature and interaction shape
* Full API specification: [docs/architecture/feature-system.md](../architecture/feature-system.md)

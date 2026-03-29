# infracord — Project Context for Claude

## What this project is

infracord is a TypeScript framework for building Discord bots on top of Discord.js. It has two complementary layers:

1. **Server blueprint** — declare your Discord server's structure (categories, channels, permissions) as TypeScript. infracord reconciles that against the live server, applying only the necessary changes. Think Terraform for Discord servers.

2. **Feature system** — organize bot logic into self-contained features. Each feature co-locates its slash commands, event listeners, and interaction handlers (buttons, select menus, modals). A context-aware object gives features type-safe access to the resources declared in the blueprint.

## Design philosophy

- **No magic.** No file-system scanning, no implicit loading, no decorators. Everything is registered explicitly.
- **No DI.** Wiring is done through a context-aware factory object, not a dependency injection container.
- **Explicit routing.** Interaction IDs (buttons, modals, etc.) are routed via maps — no magic string matching or `customId.startsWith(...)` patterns.
- **Type safety throughout.** The blueprint is the source of truth. Declared resources are accessible in a type-safe way inside features — no raw string IDs scattered across the codebase.
- **Good developer experience over framework cleverness.** The framework should be auditable, debuggable, and unsurprising.

## Design decisions still to be made

These are open questions that need ADRs before or during implementation:

- Exact shape of the blueprint API (how categories/channels/permissions are declared)
- Shape of the feature API (what `ic.feature()` accepts, how handlers are defined)
- How the context object (`ic`) is constructed and what it exposes
- How interaction ID maps are structured and typed
- Whether the blueprint and feature layers are independently adoptable or always coupled
- Build output format (CJS vs ESM vs dual)
- How the reconciliation loop handles destructive changes (e.g. deleting a channel that exists in Discord but not in the blueprint)

## Current phase

Design and philosophy definition. No implementation has started. The next step is to work through the open design decisions above, record them as ADRs, and then begin implementation.

## Project setup

- Language: TypeScript (strict, NodeNext modules)
- Bundler: tsdown
- Linter/formatter: Biome
- ADRs: MADR format via adr-tool, stored in `docs/adr/`
- Future: Docusaurus docs, hosted on .js.org, published to npm

## Scope notes

- Solo developer for now. No need to optimize for contributor onboarding yet.
- Not worrying about npm publishing setup (exports, peerDependencies, etc.) until there is something working.
- The framework is open source and intended to go on the developer's CV — correctness and good architecture matter more than shipping fast.

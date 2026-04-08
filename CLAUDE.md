# infracord — Project Context for Claude

## What this project is

infracord is a general-purpose TypeScript framework for building Discord bots on top of discord.js. Its two core features are:

1. **Server blueprint** — declare your Discord server's structure (roles, channels, permissions) as plain TypeScript values using `defineRoles`, `defineChannels`, and `createBlueprint`. infracord reconciles that against the live server, applying only the necessary changes. Think Terraform for Discord servers. No type annotations required — the framework infers everything from your values.

2. **Feature system** — organize bot logic into self-contained features. Each feature co-locates its slash commands, event listeners, and interaction handlers (buttons, select menus, modals). `createIc(blueprint)` gives features type-safe access to all declared resources — typed channel objects, typed role objects — inferred entirely from the blueprint.

infracord wraps the discord.js `Client` and exposes it — users have full access to the underlying client and can use discord.js directly whenever they need to. The framework does not hide discord.js or lock users into infracord abstractions.

## The infracord client

infracord provides its own client that wraps discord.js. It is responsible for:
- Receiving features at construction time and wiring up their commands, event listeners, and interaction handlers
- Running `onStart` hooks defined in features after reconciliation completes
- Deploying slash commands to Discord
- Running the reconciler against the blueprint on startup or deploy

## Design philosophy

- **No magic, maximum flexibility.** No file-system scanning, no implicit loading, no decorators. Everything is registered explicitly — this gives users the freedom to structure their code however they want. The CLI scaffolding tool provides an opinionated project layout, but it is a starting point, not a requirement.
- **No DI.** Wiring is done through a context-aware factory object (`ic`), not a dependency injection container.
- **Explicit routing.** Interaction IDs (buttons, modals, etc.) are routed via maps — no magic string matching or `customId.startsWith(...)` patterns.
- **Type safety throughout.** The blueprint is the source of truth. Declared resources are accessible in a type-safe way inside features — no raw string IDs scattered across the codebase.
- **User control.** infracord exposes the discord.js client. Users can drop down to raw discord.js at any point. The framework provides structure and type safety, not walls.
- **Good developer experience over framework cleverness.** The framework should be auditable, debuggable, and approachable by small teams and solo developers.

## Target audience

Designed to scale from solo developers to larger teams. The explicit registration, type safety, and no-magic principles become more valuable as a team grows — no hidden conventions to learn, no global state to trip over, compile-time checks that catch mistakes across contributors. The framework is approachable for individuals and structured enough for teams.

## Design decisions still to be made

These are open questions that need ADRs before or during implementation:

- Build output format (CJS vs ESM vs dual)
- Multi-guild wiring (how blueprints map to guilds, `guildCreate` handling)
- Lock file system for channel identity tracking (v2)

## ADRs completed

- ADR-0001: Blueprint API shape (ServerContext phantom type, channel/role/category types)
- ADR-0002: Reconciliation pipeline (plan-then-apply, Action[], two-phase error handling)
- ADR-0003: Unmanaged resource policy (conservative default, strict opt-in)
- ADR-0004: Channel identity and rename behaviour (name-as-identity v1, lock file v2)
- ADR-0005: Rate limiting strategy (rely on discord.js, sequential apply, progress events)
- ADR-0006: Feature API shape (ic.feature, ic.command, ic.interaction, ic.dynamicInteraction)
- ADR-0007: ic context object and client wiring (createIc factory, InfracordClient, startup sequence)

## Current phase

Implementation phase — all core ADRs are complete. The reconciler pipeline is implemented (`Differ`, `Reconciler`, `Applier`/`LoggingApplier`, `Action` types). Role diffing is complete; channel and category diffing are stubbed.

The blueprint type system is scaffolded (`packages/core/src/blueprint/`) and will need updating to match the value-driven API (`defineRoles`, `defineChannels`, `createBlueprint`). The feature system and `ic` factory are designed and documented but not yet implemented.

## Project setup

- Monorepo: npm workspaces
- `packages/core` — the infracord framework (publishes as `infracord`)
- `packages/cli` — scaffolding CLI (planned, publishes as `create-infracord`)
- Language: TypeScript (strict, NodeNext modules)
- Bundler: tsdown
- Linter/formatter: Biome
- ADRs: MADR format, stored in `docs/adr/`
- Future: Docusaurus docs, hosted on .js.org, published to npm

## Scope notes

- Solo developer designing the core. Contributor onboarding is welcomed in the future — the project is open source and designed to eventually accept contributors.
- Not worrying about npm publishing setup (exports, peerDependencies, etc.) until there is something working.
- The framework is open source and intended to go on the developer's CV — correctness and good architecture matter more than shipping fast.

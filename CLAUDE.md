# infracord — Project Context for Claude

## What this project is

infracord is a TypeScript framework for building Discord bots on top of discord.js. Two core features:

1. **Server blueprint** — declare your Discord server's structure (roles, channels, permissions) as plain TypeScript values using `defineRoles`, `defineChannels`, and `createBlueprint`. infracord reconciles that against the live server, applying only the necessary changes. Think Terraform for Discord servers. No type annotations required — the framework infers everything from your values.

2. **Feature system** — organize bot logic into self-contained features. Each feature co-locates its slash commands, event listeners, and interaction handlers. `createIc(blueprint)` gives features type-safe access to all declared resources, inferred entirely from the blueprint.

infracord wraps and exposes the discord.js `Client` — users can drop down to raw discord.js at any point.

## Design philosophy

- **No magic, maximum flexibility.** No file-system scanning, no implicit loading, no decorators. Everything registered explicitly.
- **No DI.** Wiring is done through a context-aware factory object (`ic`), not a dependency injection container.
- **Explicit routing.** Interaction IDs routed via maps — no magic string matching or `customId.startsWith(...)` patterns.
- **Type safety throughout.** The blueprint is the source of truth. Declared resources accessible in a type-safe way — no raw string IDs scattered across the codebase.
- **User control.** The framework provides structure and type safety, not walls.
- Correctness and good architecture matter more than shipping fast.

## Project setup

- Monorepo: npm workspaces
- `packages/core` — publishes as `infracord`
- `packages/cli` — scaffolding CLI, planned, publishes as `create-infracord`
- Language: TypeScript (strict, NodeNext modules)
- Bundler: tsdown
- Linter/formatter: Biome
- Test runner: Vitest (`npm run test` in `packages/core`)
- ADRs: MADR format, stored in `docs/adr/`

## Workflow

After every file edit, run:

```
npx biome check --write
```

### Issues

Before starting a feature, check open issues with `gh issue list`. Every feature gets an issue before work starts. Bugs found during development get issues. Don't create issues for things that will be implemented in the same session — issues are for tracking work across sessions, not micro-tasks.

### ADRs

Any significant architectural or design decision gets an ADR in `docs/adr/` before implementation begins. If you'd need to explain the reasoning to a contributor, it needs an ADR.

### Branching

Never push directly to `main`. The flow is:

1. Check open issues with `gh issue list` — every feature needs a tracked issue
2. Create `feat/<name>` or `fix/<name>` from `main`
3. Do all work on the branch
4. Merge to `main` via a PR when the feature is complete and tests pass

`main` should always be in a working state.

### TDD

Follow RED → GREEN → REFACTOR when adding new behaviour, always on a branch:

**RED** — Create the source file with functions/classes/methods stubbed out (empty bodies or `throw new Error('not implemented')`). Write the test file importing from it. Tests fail because implementation is empty. Prompt the developer to commit before moving on.

**GREEN** — Implement until tests pass. Prompt the developer to commit before moving on.

**REFACTOR** — Clean up without changing behaviour. Tests must still pass. Prompt the developer to commit if there are meaningful changes.

TDD matters most when introducing a new module, class, or non-trivial function. Small additions to existing code can be a single commit.

### Claude tracking

At the start of any feature or fix session, Claude must track:
- The branch name (e.g. `feat/channel-diffing`)
- The issue number (e.g. `#3`)

After each TDD phase completes, Claude must prompt:

> "RED is done — we're on branch `feat/<name>` (issue #N). Want me to commit, or do you want to review first?"

Never proceed to the next phase without the developer confirming the commit. Never commit, push, or open a PR without being explicitly asked.

## Testing

- Test files live in `packages/core/tests/`, mirroring `src/` structure.
- One concern per file — split by logical area (`differ.validate.test.ts` and `differ.roles.test.ts` rather than one combined file).
- Classes with I/O tested by injecting pre-built state — keep tests pure and side-effect-free.
- Mock only what the code actually reads. Use `as unknown as T` casts for discord.js types.
- Test behaviour, not implementation. Assert on actions produced, errors returned — not internal state or call counts.
- Each test should have a single, clear failure reason.
- Correctness over coverage. A small set of precise, well-named tests beats broad coverage with vague assertions.

## Claude behaviour

Claude should not commit, push, open PRs, or create issues unless explicitly asked. When a natural checkpoint is reached, prompt the developer instead:

> "Tests are passing — want me to commit, or do you want to review first?"

When opening a PR, always reference the relevant issue in the body (`Closes #N`). When an issue's work is done, close it — either via the PR body or explicitly with `gh issue close <number>`. Before starting work on something new, run `gh issue list` to check what's already tracked.

# Unmanaged Resource Policy

* Status: accepted
* Date: 2026-03-30

## Context and Problem Statement

When the reconciler reads the live Discord server, it will encounter roles, channels, and categories that are not declared in the blueprint. What should it do with them?

## Decision Drivers

* Silently deleting a channel a user created manually is a destructive, potentially irreversible action
* Channels not in the blueprint do not affect bot function — features only reference declared resources
* Users running the reconciler for the first time on an existing server should not be surprised by mass deletions
* Power users migrating fully to blueprint-managed servers should be able to opt into strict cleanup

## Considered Options

* **Option A** — Conservative by default: ignore unmanaged resources, warn in output, opt-in strict mode
* **Option B** — Strict by default: delete anything not in the blueprint
* **Option C** — Error by default: fail if unmanaged resources are detected, force the user to decide

## Decision Outcome

Chosen option: **Option A — conservative by default**, because the cost of an unexpected deletion (lost message history, broken integrations) far outweighs the cost of a stale channel sitting unused. Strict mode is available for users who want full blueprint ownership of the server.

### Positive Consequences

* Safe default — first-time users on existing servers are not surprised
* Explicit opt-in for destructive behaviour via `--strict` flag or `strict: true` in blueprint options
* Unmanaged resources are surfaced in output (warn log) so users are always aware of drift

### Negative Consequences

* Conservative mode means the server can accumulate unmanaged resources over time if the user never uses strict mode

## Policy

| Resource type | In blueprint | Not in blueprint (conservative) | Not in blueprint (strict) |
|---|---|---|---|
| Role | Enforced exactly — permissions, color, hoist, etc. must match | Warn, leave untouched | Delete |
| Category | Enforced exactly | Warn, leave untouched | Delete |
| Channel | Enforced exactly | Warn, leave untouched | Delete |
| Permission overwrite | Enforced exactly on declared channels | N/A | N/A |

**Declared resources are always enforced exactly.** If a channel exists in the blueprint but its topic, permissions, or settings have drifted, the reconciler corrects them regardless of mode. The conservative/strict distinction only applies to resources that are *not* in the blueprint.

This is the core reasoning: declared resources are a contract — features depend on them being exactly right. Undeclared resources are irrelevant to bot function and should not be touched without explicit intent.

## Warn Output

In conservative mode, unmanaged resources appear in the reconciler output:

```
WARN  channel "#memes" exists on server but is not declared in the blueprint (unmanaged)
WARN  role "Nitro Booster" exists on server but is not declared in the blueprint (unmanaged)
```

In dry run mode, strict mode additions appear as:

```
DELETE channel "#memes"  (unmanaged, --strict)
DELETE role "Nitro Booster"  (unmanaged, --strict)
```

## Links

* Related: [ADR-0002](0002-reconciliation-pipeline.md)

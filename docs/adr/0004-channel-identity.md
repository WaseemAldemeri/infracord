# Channel Identity and Rename Behaviour

* Status: accepted
* Date: 2026-03-30

## Context and Problem Statement

How does the reconciler identify a channel between blueprint runs? If a channel is renamed in the blueprint, should it rename the existing Discord channel in place (preserving history), or treat it as a new channel and create a fresh one?

## Decision Drivers

* Channel message history is irreplaceable — accidental recreation loses it permanently
* Tracking channel identity requires storing state somewhere external to the blueprint
* The framework must have a clear, documented answer to "what happens if I rename a channel"
* The solution should not add operational complexity for simple use cases

## Considered Options

* **Option A** — Name is identity: the blueprint channel name is the lookup key. Rename = new channel.
* **Option B** — Lock file: a generated `infracord.lock.json` maps blueprint names → Discord channel IDs. Rename detected by ID, applied in place.
* **Option C** — Channel topic tag: store a hidden tag (e.g. `[infracord:general]`) in the channel topic. Reconciler identifies channels by tag, not name.

## Decision Outcome

Chosen option: **Option A for v1, Option B as the planned v2 path.**

Option A is chosen for v1 because it requires no external state, is easy to reason about, and covers the common case (channel names rarely change once a server is set up). The limitation is documented explicitly so users are not surprised.

Option B is the right long-term answer and the design should not preclude it. When implemented, the lock file will be committed alongside the blueprint and updated after every successful reconcile.

### Positive Consequences (Option A)

* No external state to manage, commit, or keep in sync
* Reconciler logic is straightforward — name lookup, no ID tracking
* Easy to explain: the name in the blueprint is the name on the server

### Negative Consequences (Option A)

* Renaming a channel in the blueprint creates a new Discord channel — message history is not preserved
* The old channel becomes unmanaged (warned in conservative mode, deleted in strict mode)
* Users must be aware of this before renaming

## v1 Behaviour

The reconciler matches blueprint channels to live Discord channels by name. The name is the identity.

```
Blueprint declares: { name: 'general-chat', type: 'text' }
Live server has:    #general (no channel named 'general-chat')

Result: CREATE channel #general-chat
        WARN  channel #general is unmanaged (conservative) / DELETE #general (strict)
```

This is documented prominently. Renaming a channel in the blueprint is a destructive operation in v1.

## v2 Path — Lock File

A generated `infracord.lock.json` will map blueprint channel names to Discord snowflake IDs:

```json
{
  "channels": {
    "general": "1234567890123456789",
    "announcements": "9876543210987654321"
  },
  "roles": {
    "admin": "1111111111111111111"
  }
}
```

On reconcile, the reconciler looks up the ID first. If found, it updates in place (including renaming). If not found, it creates and writes the new ID to the lock file. The lock file is committed to the repository alongside the blueprint.

The lock file path will be its own ADR when implemented.

## Links

* Related: [ADR-0002](0002-reconciliation-pipeline.md)
* Related: [ADR-0003](0003-unmanaged-resource-policy.md)

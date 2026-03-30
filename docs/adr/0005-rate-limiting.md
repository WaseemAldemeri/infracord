# Rate Limiting Strategy

* Status: accepted
* Date: 2026-03-30

## Context and Problem Statement

The reconciler applies a list of Discord API calls in sequence. Discord enforces per-route rate limits and returns `429 Too Many Requests` when they are exceeded. How should infracord handle this?

## Decision Drivers

* Discord returns rate limit metadata in response headers — limits are reported, not something we need to count manually
* discord.js already implements a complete rate limit handler internally
* Building a custom rate limit layer would duplicate existing, well-tested behaviour
* Permission overwrites are the highest-volume operation — each overwrite on each channel is a separate API call

## Considered Options

* **Option A** — Rely entirely on discord.js built-in rate limiting, apply actions sequentially
* **Option B** — Build a custom wrapper that intercepts responses and manages a request queue
* **Option C** — Apply actions in parallel, let discord.js queue and throttle

## Decision Outcome

Chosen option: **Option A — rely on discord.js, apply actions sequentially.**

discord.js maintains per-route buckets, reads `X-RateLimit-*` headers on every response, queues requests that would exceed limits, and retries automatically after `Retry-After` windows. There is nothing left for infracord to implement.

### Positive Consequences

* Zero rate limit code to write or maintain
* discord.js rate limiting is battle-tested across thousands of bots
* Sequential application is predictable and easy to reason about

### Negative Consequences

* Sequential application is slower than parallel for large blueprints — acceptable given reconcile runs infrequently (on deploy, not per request)
* No control over throughput beyond what discord.js exposes

## Known Consideration — Permission Overwrite Volume

Each permission overwrite on each channel is a separate Discord API call. A blueprint with 20 channels and 5 role overwrites per channel produces 100 overwrite API calls on a fresh apply. discord.js handles this correctly but it will take time. This is acceptable — reconciliation is not a hot path.

If this becomes a problem in practice, Discord's bulk permission overwrite endpoint can be adopted without changing the Action model.

## Progress Reporting

Because sequential application of a large blueprint can take several seconds, the reconciler emits a progress event after each action is applied. This allows callers to display a live progress indicator without polling.

```typescript
reconciler.on('action:applied', (action: Action) => { ... });
reconciler.on('action:failed',  (action: Action, error: Error) => { ... });
reconciler.on('complete',       (result: ReconcileResult) => { ... });
```

## Links

* Related: [ADR-0002](0002-reconciliation-pipeline.md)

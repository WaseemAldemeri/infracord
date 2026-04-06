# Architecture Overview

infracord wraps the discord.js `Client` and adds two layers on top: a server blueprint and a feature system. This document describes how they fit together. The linked documents cover each part in depth.

---

## The two layers

**Blueprint (infrastructure layer)** — you declare your server's roles, channels, and permission overwrites as plain TypeScript values. infracord reconciles that against the live Discord server, applying only the changes needed to bring it into sync. Runs at deploy time.

**Feature system (application layer)** — you organise bot logic into self-contained features. Each feature bundles its slash commands, event listeners, and interaction handlers. Runs continuously as the bot handles user activity.

---

## How they connect

The blueprint is the single source of truth. Both `createIc` and `InfracordClient` receive it and infer the full server type from it — typed channel and role objects, compile-time validation — with no annotations required from the user.

```
     defineRoles
          │
          ▼
   createBlueprint
   ┌──────┴──────┐
   ▼             ▼
createIc    InfracordClient
(features)  (runtime + reconciler)
```

---

## Startup sequence

```
1. defineRoles / createBlueprint
2. createIc(blueprint)               → src/ic.ts
3. Define features with ic.feature()
4. new InfracordClient({ token, blueprint, features })
5. client.start()
     → build routing maps, detect collisions
     → wire event listeners
     → login, reconcile, deploy commands
     → call onStart hooks
```

---

## Architecture documents

- [Blueprint](./blueprint.md) — `defineRoles`, `createBlueprint`, how types are inferred
- [Feature system](./feature-system.md) — `ic` factory, features, commands, events, interactions
- [Client](./client.md) — `InfracordClient` interface, `start()` sequence, interaction routing
- [Reconciler](./reconciler.md) — plan-then-apply pipeline, diffing, error handling

---

## What infracord does not own

- The full discord.js API — exposed via `client.discord`, never hidden
- Database access — no opinion on data storage
- Multi-guild state management — which blueprint applies to which guild is the caller's concern
- Application logic structure — services, repositories, and business logic are yours to organise

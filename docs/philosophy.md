# Philosophy

infracord is built around a small set of principles that inform every design decision. Understanding them helps you understand why the framework works the way it does — and how to get the most out of it.

---

## Declare, don't script

Most Discord bots manage their server by running setup scripts — functions that create channels if they don't exist, assign permissions when something goes wrong, or run on a schedule to patch drift. This works until it doesn't. Scripts accumulate special cases, order-dependency bugs, and silent failures. There is no single place that describes what the server is supposed to look like.

infracord flips this. You declare the desired state of your server as TypeScript. The framework reads the live server, computes the difference, and applies only what has changed. The blueprint is always the source of truth.

This is the same model Terraform uses for cloud infrastructure — declare desired state, let the tool reconcile it. The difference is that infracord is TypeScript, lives in the same codebase as your bot, and requires no new tools or languages to learn.

---

## Why not existing solutions?

Managing Discord server structure is a solved problem in some communities, but the existing solutions each come with real costs.

**Manual ClickOps** is the default — server admins clicking through the Discord UI to create channels and set permissions. It does not version control, cannot be reproduced across environments, and drifts silently over time. There is no way to know what the server is supposed to look like.

**Terraform with a Discord provider** introduces proper declarative infrastructure, but at a steep cost. It requires learning HCL — a separate language — and maintaining a separate deployment pipeline entirely disconnected from your bot. Channel IDs created by Terraform have to be exported, passed through CI, and injected into the bot as environment variables. The bot's code and its infrastructure live in different worlds, maintained with different tools, deployed separately. If the infrastructure changes, the bot can break at runtime with no compile-time warning.

**YAML-based GitOps tools** (like GitCord) give you version-controlled server structure, but they share the same fundamental problem: they are disconnected from your bot's application logic. A renamed channel in the YAML file is invisible to the bot code. There is no shared type system, no compiler, no guarantee that the structure the bot expects actually matches what was deployed.

infracord's answer is to bring the infrastructure declaration into the same TypeScript codebase as the bot. No new languages. No new tools. No separate pipeline. The blueprint and the bot are compiled together — which means the type system can enforce that the bot only references channels and roles that actually exist in the declared structure.

---

## No magic — your structure, your way

infracord does not scan your file system for commands. It does not use decorators to register handlers. It does not infer routing from file names or folder structure.

Everything is registered explicitly. This is a deliberate choice — not because we think there is only one right way to organise a project, but because explicit registration gives you the freedom to organise your code however makes sense for your team and your bot.

The CLI scaffolding tool (`create-infracord`) provides an opinionated starting layout that we think works well. But it is a starting point. Once your project is set up, the structure is yours. infracord does not enforce it.

---

## You are always in control

infracord wraps the discord.js `Client` and exposes it. At any point inside a feature, you can reach for the underlying client and use discord.js directly. The framework provides structure and type safety — it does not build walls around what you can do.

If you need to do something infracord does not have a specific abstraction for, you can. If you want to use a pattern the framework does not prescribe, you can. infracord is a foundation, not a cage.

---

## No dependency injection

infracord does not use a DI container. Wiring is done through `ic` — a context-aware factory object that gives features type-safe access to the resources they declared. There is no container, no tokens, no registration step separate from your feature definition.

This keeps the framework readable. You can trace what a feature has access to by reading its definition. There is no indirection through a container to follow.

That said, nothing stops you from bringing your own patterns on top. If your project benefits from a service layer or a repository pattern, you can build those and pass them into features through the factory. infracord does not prescribe how you manage your application logic — only how you wire up commands, events, and interactions.

---

## Type safety throughout — infrastructure and bot logic together

Because the blueprint is TypeScript and lives alongside the bot, the type system can connect the two. The channel names, role names, and categories you declare in the blueprint flow into the feature system as types. The compiler knows what your server looks like, and it enforces that the bot only references things that exist.

If you reference a channel that is not declared in the blueprint, your code does not compile. If you rename a role in the blueprint and forget to update a permission overwrite, the compiler tells you. If you add a new channel and a feature tries to access it before it is declared, it is a compile error — not a runtime crash.

This is the direct benefit of colocation. External tools like Terraform or YAML configs have no connection to your bot's type system. A channel can be removed from the config and the bot will compile and run fine — until it hits that code path at runtime and crashes. With infracord, the infrastructure and the logic that depends on it are part of the same compilation step. They are always in sync, or the code does not build.

---

## Explicit routing

Discord interactions — buttons, select menus, modals — are identified by a `customId` string. Most frameworks route interactions by pattern-matching on this string: `if (customId.startsWith('confirm_'))`. This is fragile, untestable, and invisible to the type system.

A subtler problem is orphaned interactions — a button that exists in the Discord client whose handler has been deleted, renamed, or moved. Users click it and nothing happens. There is no error, no log, no indication that anything went wrong. It just silently does not work.

infracord routes interactions through explicit maps. Each interaction ID is a key in a typed map. The handler is the value. There is no string matching, no convention to remember. If a handler is removed, the interaction ID is also removed from the map — and any code that references it stops compiling. Orphaned interactions are not possible.

---

## Designed to scale with you

infracord is approachable from day one. The concepts — blueprint, feature, `ic` — are small in number and consistent in shape. The type system guides you rather than getting in the way. A solo developer can be productive quickly.

The same properties that make it approachable also make it scale. Explicit registration means no hidden conventions for new contributors to discover. Type safety catches mistakes across team members, not just your own. No magic means the codebase is readable by anyone who knows TypeScript, regardless of their infracord experience.

infracord is designed to be as useful to a team of ten as it is to a team of one.

---

## What infracord is not

**Not a replacement for discord.js.** infracord builds on top of discord.js and exposes it. It does not try to abstract it away.

**Not a file-system-driven framework.** If you want automatic command loading from folders, infracord is not that. Everything is explicit by design — which also means everything is under your control.

**Not a framework that hides complexity.** infracord exposes what it does. The reconciler tells you exactly what it will change before it changes anything. Features are registered where you can see them. The framework should be auditable.

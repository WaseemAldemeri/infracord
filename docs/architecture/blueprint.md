# Blueprint

The blueprint is the infrastructure layer of infracord. It declares your Discord server's desired structure as plain TypeScript values. The framework infers full type information from those values and uses them to both validate your code at compile time and reconcile the live server at runtime.

For the decisions behind this design, see [ADR-0001](../adr/0001-blueprint-api-shape.md).

---

## Three-step API

The blueprint is built in three independent steps:

```
defineRoles      — declare what roles exist and their base permissions
defineChannels   — declare what channels exist and their config
createBlueprint  — connect everything: structure, categories, and permissions
```

`defineRoles` and `defineChannels` know nothing about each other. `createBlueprint` is the only place both are available simultaneously — which is why it is also where permission overwrites (a relationship between channels and roles) are defined.

---

## `defineRoles`

Declares the guild's roles. Object keys are always inferred as string literals by TypeScript — no helpers or `as const` needed.

```typescript
const roles = defineRoles({
  moderator: { permissions: [PermissionFlagsBits.BanMembers], hoist: true, color: "#ff0000" },
  member:    { permissions: [] },
})
```

Each role value is a `RoleDef`:

| Field | Type | Description |
|---|---|---|
| `permissions` | `PermissionResolvable[]` | Base permissions for the role |
| `color` | `ColorResolvable` | Role colour |
| `hoist` | `boolean` | Show separately in member list |
| `mentionable` | `boolean` | Allow @mention |
| `position` | `number` | Role position (higher = more powerful) |
| `unicodeEmoji` | `string` | Role icon emoji |

---

## `defineChannels`

Declares the guild's channels as a record. Keys are channel names — always inferred as string literals. Values are `ChannelConfig` — a discriminated union on `type`.

```typescript
const channels = defineChannels({
  general:        { type: "text",         topic: "General chat" },
  "mod-log":      { type: "text" },
  announcements:  { type: "announcement" },
  "voice-lounge": { type: "voice",        bitrate: 64000 },
  "stage-main":   { type: "stage" },
  feedback:       { type: "forum",        availableTags: [{ name: "bug" }, { name: "idea" }] },
  media:          { type: "media" },
})
```

The `type` field is constrained to a union of string literals — TypeScript preserves the specific literal during inference without `as const`. Once `type` is set, the remaining fields narrow to that channel type only. Writing `topic` on a `voice` channel is a compile error.

### Channel types and their fields

**`text`**
| Field | Type |
|---|---|
| `topic` | `string` |
| `nsfw` | `boolean` |
| `slowmode` | `number` (seconds) |
| `defaultAutoArchiveDuration` | `ThreadAutoArchiveDuration` |
| `defaultThreadSlowmode` | `number` |

**`voice`**
| Field | Type |
|---|---|
| `bitrate` | `number` |
| `userLimit` | `number` |
| `rtcRegion` | `string \| null` |
| `videoQualityMode` | `VideoQualityMode` |

**`announcement`**
| Field | Type |
|---|---|
| `topic` | `string` |
| `nsfw` | `boolean` |

**`stage`**
| Field | Type |
|---|---|
| `topic` | `string` |
| `bitrate` | `number` |
| `rtcRegion` | `string \| null` |

**`forum` and `media`**
| Field | Type |
|---|---|
| `topic` | `string` |
| `nsfw` | `boolean` |
| `availableTags` | `ForumTagDef[]` |
| `defaultReactionEmoji` | `string` |
| `defaultAutoArchiveDuration` | `ThreadAutoArchiveDuration` |
| `defaultThreadSlowmode` | `number` |
| `defaultSortOrder` | `SortOrderType` (forum only) |
| `defaultForumLayout` | `ForumLayoutType` (forum only) |

---

## `createBlueprint`

Receives `roles` and `channels` as fully-typed values and connects them with `structure` and `permissions`.

```typescript
const blueprint = createBlueprint({
  roles,
  channels,
  structure: [
    { category: "Community", channels: ["general", "announcements"] },
    { category: "Staff",     channels: ["mod-log", "feedback"]      },
    { channel:  "voice-lounge" },
  ],
  permissions: [
    { channel:  "mod-log",   role: "@everyone", deny:  [PermissionFlagsBits.ViewChannel]  },
    { channel:  "mod-log",   role: "moderator", allow: [PermissionFlagsBits.ViewChannel]  },
    { category: "Staff",     role: "@everyone", deny:  [PermissionFlagsBits.ViewChannel]  },
  ],
})
```

### `structure`

Defines channel ordering and category nesting. Array order maps directly to Discord channel positions — no separate `position` field needed.

Each entry is one of:
- `{ category: string, channels: string[] }` — a category with its ordered channel list
- `{ channel: string }` — a top-level channel outside any category

Both `category` names and `channel` names autocomplete from the declared values. A name not in `defineChannels` is a compile error.

### `permissions`

A flat list of permission overwrite relationships. Each entry is either channel-scoped or category-scoped:

```typescript
{ channel:  "mod-log",    role: "moderator", allow: [...], deny: [...] }
{ category: "Staff",      role: "@everyone", deny: [...]               }
```

`channel` and `category` autocomplete from declared names. `role` autocompletes from declared role names plus `"@everyone"`. `allow` and `deny` take `PermissionResolvable[]` from discord.js.

Both sides are fully validated because `roles` and `channels` are resolved before `permissions` is typed — this is why permissions live in `createBlueprint` rather than inside individual channel definitions.

---

## Type inference — how it works

`createBlueprint` returns `Blueprint<Ctx>` where `Ctx` is a `ServerContext` phantom type inferred from the inputs:

```typescript
// what TypeScript derives — the user never writes this
type Ctx = ServerContext<
  "moderator" | "member",                                            // role names
  { general: "text"; "mod-log": "text"; "voice-lounge": "voice" },  // channel name → type map
  "Community" | "Staff"                                             // category names
>
```

Two TypeScript properties make this work without `as const`:
1. **Object keys are always inferred as string literals** — `{ general: ... }` gives `"general"`, not `string`
2. **Values constrained to a union of literals preserve the specific literal** — `type: "text"` constrained to `"text" | "voice" | ...` is inferred as `"text"`, not widened

`createIc(blueprint)` and `new InfracordClient({ blueprint })` both extract `Ctx` from the blueprint. Everything flows from one value — typed channel objects, typed role objects, compile-time validation across the whole codebase.

```typescript
client.channels["general"]       // TextChannel
client.channels["voice-lounge"]  // VoiceChannel
client.channels["typo"]          // compile error
client.roles["moderator"]        // Role
client.roles["unknown"]          // compile error
```

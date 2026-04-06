# Blueprint

The blueprint is the infrastructure layer of infracord. It declares your Discord server's desired structure as plain TypeScript values. The framework infers full type information from those values and uses them to both validate your code at compile time and reconcile the live server at runtime.

For the decisions behind this design, see [ADR-0001](../adr/0001-blueprint-api-shape.md).

---

## Two-step API

The blueprint is built in two steps:

```
defineRoles      — declare what roles exist and their base permissions
createBlueprint  — declare channels inline in structure, with permissions co-located
```

Channels, their category placement, and their permission overwrites all live in `createBlueprint`. `defineRoles` is separate because roles must be resolved before `createBlueprint` can validate role names inside permission maps.

---

## `defineRoles`

Declares the guild's roles. Object keys are always inferred as string literals by TypeScript — no helpers or `as const` needed.

```typescript
const roles = defineRoles({
  moderator: { permissions: [PermissionFlagsBits.BanMembers], hoist: true, color: "#ff0000" },
  member:    {},
})
```

Each role value is a `RoleDef`, built on discord.js's [`RoleData`](https://discord.js.org/docs/packages/discord.js/main/RoleData:Interface) so the reconciler can pass it directly to `GuildRoleManager.create()` / `Role.edit()` with no translation.

| Field | Type | Description |
|---|---|---|
| `permissions` | `PermissionResolvable[]` | Base permissions for the role |
| `color` | `ColorResolvable` | Role colour |
| `colors` | `RoleColorsResolvable` | Role colour (new discord.js API, prefer over `color`) |
| `hoist` | `boolean` | Show separately in member list |
| `mentionable` | `boolean` | Allow @mention |
| `position` | `number` | Role position (higher = more powerful) |
| `unicodeEmoji` | `string \| null` | Role icon emoji (requires server boost level 2+) |

---

## `createBlueprint`

Receives `roles` and a `structure` array. Channels are declared inline inside `structure`, co-located with their category and permission overwrites.

```typescript
const blueprint = createBlueprint({
  roles,
  structure: [
    {
      category: { name: "Community" },
      channels: [
        { name: "general",       type: "text",         topic: "General chat" },
        { name: "voice-lounge",  type: "voice",        bitrate: 64000        },
        {
          name: "announcements",
          type: "announcement",
          topic: "Server announcements",
          permissions: {
            "@everyone": { deny:  [PermissionFlagsBits.SendMessages] },
            moderator:   { allow: [PermissionFlagsBits.SendMessages] },
          },
        },
      ],
    },
    {
      category: {
        name: "Staff",
        permissions: {
          "@everyone": { deny:  [PermissionFlagsBits.ViewChannel] },
          moderator:   { allow: [PermissionFlagsBits.ViewChannel] },
        },
      },
      channels: [
        { name: "mod-log",    type: "text", topic: "Moderation log"    },
        { name: "staff-chat", type: "text", topic: "Internal staff chat" },
      ],
    },
    {
      channels: [
        { name: "lounge", type: "voice", bitrate: 64000 },
      ],
    },
  ],
})
```

### `structure`

An array of entries, each describing an optional category and an ordered list of channels. Array order maps directly to Discord channel positions — no separate `position` field needed.

Each entry is:
```typescript
{
  category?: { name: string; permissions?: PermissionMap<R> }
  channels:  ChannelDef<R>[]
}
```

Omitting `category` creates top-level channels outside any category. The `channels` array order determines position within the category.

### Channel definitions

Each channel definition is a `ChannelDef` — a `ChannelConfig` (discriminated by `type`) plus `name` and optional `permissions`:

```typescript
{
  name:         string
  type:         "text" | "voice" | "announcement" | "stage" | "forum" | "media"
  permissions?: PermissionMap<R>
  // ...type-specific fields
}
```

The `type` field is the discriminant — TypeScript narrows the remaining fields to only those valid for that channel type. Writing `topic` on a `voice` channel is a compile error.

All field names match discord.js's [`GuildChannelEditOptions`](https://discord.js.org/docs/packages/discord.js/main/GuildChannelEditOptions:Interface) directly — the reconciler spreads them into `channel.edit()` with no translation layer.

### Channel types and their fields

**`text`**
| Field | Type |
|---|---|
| `topic` | `string \| null` |
| `nsfw` | `boolean` |
| `rateLimitPerUser` | `number` (seconds) |
| `defaultAutoArchiveDuration` | `ThreadAutoArchiveDuration` |
| `defaultThreadRateLimitPerUser` | `number` |

**`voice`**
| Field | Type |
|---|---|
| `bitrate` | `number` |
| `userLimit` | `number` |
| `rtcRegion` | `string \| null` |
| `videoQualityMode` | `VideoQualityMode \| null` |

**`announcement`**
| Field | Type |
|---|---|
| `topic` | `string \| null` |
| `nsfw` | `boolean` |

**`stage`**
| Field | Type |
|---|---|
| `topic` | `string \| null` |
| `bitrate` | `number` |
| `rtcRegion` | `string \| null` |

**`forum`**
| Field | Type |
|---|---|
| `topic` | `string \| null` |
| `nsfw` | `boolean` |
| `rateLimitPerUser` | `number` |
| `defaultAutoArchiveDuration` | `ThreadAutoArchiveDuration` |
| `defaultThreadRateLimitPerUser` | `number` |
| `defaultSortOrder` | `SortOrderType \| null` |
| `defaultForumLayout` | `ForumLayoutType` |
| `availableTags` | `GuildForumTagData[]` |
| `defaultReactionEmoji` | `DefaultReactionEmoji \| null` |

**`media`**
| Field | Type |
|---|---|
| `topic` | `string \| null` |
| `nsfw` | `boolean` |
| `availableTags` | `GuildForumTagData[]` |
| `defaultReactionEmoji` | `DefaultReactionEmoji \| null` |
| `defaultAutoArchiveDuration` | `ThreadAutoArchiveDuration` |
| `defaultThreadRateLimitPerUser` | `number` |

### Forum tags and reaction emoji

`availableTags` takes discord.js's [`GuildForumTagData`](https://discord.js.org/docs/packages/discord.js/main/GuildForumTagData:Interface) directly:

```typescript
availableTags: [
  { name: "open",     emoji: { id: null, name: "🟢" } },
  { name: "resolved", emoji: { id: null, name: "✅" }, moderated: true },
  // Custom emoji: { id: "<snowflake>", name: null }
]
```

`defaultReactionEmoji` takes discord.js's `DefaultReactionEmoji` (`{ id: Snowflake | null, name: string | null }`), the same shape as the tag emoji.

### Permission overwrites

`PermissionMap<R>` is a partial record of role names (plus `"@everyone"`) to permission overwrite objects:

```typescript
permissions: {
  "@everyone": { deny:  [PermissionFlagsBits.ViewChannel] },
  moderator:   { allow: [PermissionFlagsBits.ViewChannel] },
}
```

Each entry is either `{ allow, deny? }` or `{ deny, allow? }` — at least one side is required. Role names are validated against `defineRoles` at compile time via `PermissionMap<R>`. An undeclared role name is a type error.

Permissions can be set on a category (inherited by all channels in it) or on individual channels.

---

## Type inference — how it works

`createBlueprint` returns `Blueprint<Ctx>` where `Ctx` is a `ServerContext` phantom type inferred from the inputs:

```typescript
// what TypeScript derives — the user never writes this
type Ctx = ServerContext<
  "moderator" | "member",                                                    // role names
  { general: "text"; "voice-lounge": "voice"; announcements: "announcement" }, // channel name → type map
  "Community" | "Staff"                                                      // category names
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

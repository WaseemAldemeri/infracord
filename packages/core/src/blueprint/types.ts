import type {
  PermissionResolvable,
  ColorResolvable,
  VideoQualityMode,
  ThreadAutoArchiveDuration,
  SortOrderType,
  ForumLayoutType,
} from "discord.js";
import type { Channels, Categories, Roles, ServerContext } from "./context.js";

// ---------------------------------------------------------------------------
// Permission overwrites
// ---------------------------------------------------------------------------

export type RoleOverwriteTarget<Ctx extends ServerContext> = {
  type: "role";
  name: Roles<Ctx> | "@everyone";
};

export type UserOverwriteTarget = {
  type: "user";
  id: string;
};

export type PermissionOverwrite<Ctx extends ServerContext> = {
  target: RoleOverwriteTarget<Ctx> | UserOverwriteTarget;
  allow?: PermissionResolvable[];
  deny?: PermissionResolvable[];
};

// ---------------------------------------------------------------------------
// Role definition
// ---------------------------------------------------------------------------

export type RoleDef = {
  color?: ColorResolvable;
  hoist?: boolean;
  mentionable?: boolean;
  permissions: PermissionResolvable[];
  position?: number;
  unicodeEmoji?: string;
};

// ---------------------------------------------------------------------------
// Channel definitions — one per Discord guild channel type
// ---------------------------------------------------------------------------

export type TextChannelDef<Ctx extends ServerContext> = {
  name: Channels<Ctx>;
  type: "text";
  topic?: string;
  nsfw?: boolean;
  slowmode?: number;
  defaultAutoArchiveDuration?: ThreadAutoArchiveDuration;
  defaultThreadSlowmode?: number;
  permissionOverwrites?: PermissionOverwrite<Ctx>[];
};

export type VoiceChannelDef<Ctx extends ServerContext> = {
  name: Channels<Ctx>;
  type: "voice";
  bitrate?: number;
  userLimit?: number;
  rtcRegion?: string | null;
  videoQualityMode?: VideoQualityMode;
  permissionOverwrites?: PermissionOverwrite<Ctx>[];
};

export type AnnouncementChannelDef<Ctx extends ServerContext> = {
  name: Channels<Ctx>;
  type: "announcement";
  topic?: string;
  nsfw?: boolean;
  permissionOverwrites?: PermissionOverwrite<Ctx>[];
};

export type StageChannelDef<Ctx extends ServerContext> = {
  name: Channels<Ctx>;
  type: "stage";
  topic?: string;
  bitrate?: number;
  rtcRegion?: string | null;
  permissionOverwrites?: PermissionOverwrite<Ctx>[];
};

export type ForumTagDef = {
  name: string;
  emoji?: string;
  moderated?: boolean;
};

export type ForumChannelDef<Ctx extends ServerContext> = {
  name: Channels<Ctx>;
  type: "forum";
  topic?: string;
  nsfw?: boolean;
  defaultAutoArchiveDuration?: ThreadAutoArchiveDuration;
  defaultSortOrder?: SortOrderType;
  defaultForumLayout?: ForumLayoutType;
  availableTags?: ForumTagDef[];
  defaultReactionEmoji?: string;
  defaultThreadSlowmode?: number;
  permissionOverwrites?: PermissionOverwrite<Ctx>[];
};

export type MediaChannelDef<Ctx extends ServerContext> = {
  name: Channels<Ctx>;
  type: "media";
  topic?: string;
  nsfw?: boolean;
  availableTags?: ForumTagDef[];
  defaultReactionEmoji?: string;
  permissionOverwrites?: PermissionOverwrite<Ctx>[];
};

export type ChannelDef<Ctx extends ServerContext> =
  | TextChannelDef<Ctx>
  | VoiceChannelDef<Ctx>
  | AnnouncementChannelDef<Ctx>
  | StageChannelDef<Ctx>
  | ForumChannelDef<Ctx>
  | MediaChannelDef<Ctx>;

// ---------------------------------------------------------------------------
// Category definition
// ---------------------------------------------------------------------------

export type CategoryDef<Ctx extends ServerContext> = {
  type: "category";
  name: Categories<Ctx>;
  permissionOverwrites?: PermissionOverwrite<Ctx>[];
  channels: ChannelDef<Ctx>[];
};

// ---------------------------------------------------------------------------
// Top-level structure
// ---------------------------------------------------------------------------

/** A structure entry is either a category (with nested channels) or a top-level channel. */
export type StructureEntry<Ctx extends ServerContext> =
  | CategoryDef<Ctx>
  | ChannelDef<Ctx>;

export type ServerBlueprintOptions<Ctx extends ServerContext> = {
  roles: Record<Roles<Ctx>, RoleDef>;
  structure: StructureEntry<Ctx>[];
};

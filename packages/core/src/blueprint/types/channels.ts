import type { GuildChannelEditOptions, GuildForumTagData } from "discord.js";

export type { GuildForumTagData };

export type ForumTagDef = GuildForumTagData;

export type TextChannelConfig = { type: "text" } & Pick<
	GuildChannelEditOptions,
	| "topic"
	| "nsfw"
	| "rateLimitPerUser"
	| "defaultAutoArchiveDuration"
	| "defaultThreadRateLimitPerUser"
>;

export type VoiceChannelConfig = { type: "voice" } & Pick<
	GuildChannelEditOptions,
	"bitrate" | "userLimit" | "rtcRegion" | "videoQualityMode"
>;

export type AnnouncementChannelConfig = { type: "announcement" } & Pick<
	GuildChannelEditOptions,
	"topic" | "nsfw"
>;

export type StageChannelConfig = { type: "stage" } & Pick<
	GuildChannelEditOptions,
	"topic" | "bitrate" | "rtcRegion"
>;

export type ForumChannelConfig = { type: "forum" } & Pick<
	GuildChannelEditOptions,
	| "topic"
	| "nsfw"
	| "rateLimitPerUser"
	| "defaultAutoArchiveDuration"
	| "defaultThreadRateLimitPerUser"
	| "defaultSortOrder"
	| "defaultForumLayout"
	| "availableTags"
	| "defaultReactionEmoji"
>;

export type MediaChannelConfig = { type: "media" } & Pick<
	GuildChannelEditOptions,
	| "topic"
	| "nsfw"
	| "availableTags"
	| "defaultReactionEmoji"
	| "defaultAutoArchiveDuration"
	| "defaultThreadRateLimitPerUser"
>;

export type ChannelConfigByType = {
	text: TextChannelConfig;
	voice: VoiceChannelConfig;
	announcement: AnnouncementChannelConfig;
	stage: StageChannelConfig;
	forum: ForumChannelConfig;
	media: MediaChannelConfig;
};

export type ChannelConfig =
	| TextChannelConfig
	| VoiceChannelConfig
	| AnnouncementChannelConfig
	| StageChannelConfig
	| ForumChannelConfig
	| MediaChannelConfig;

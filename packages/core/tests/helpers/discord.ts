import {
	ChannelType,
	Collection,
	type GuildBasedChannel,
	type Role,
} from "discord.js";
import type { GuildState } from "../../src/reconciler/types/guildState.js";

export type RoleFields = {
	id?: string;
	name: string;
	color?: number;
	colors?: {
		primaryColor: number;
		secondaryColor?: number;
		tertiaryColor?: number;
	};
	hoist?: boolean;
	mentionable?: boolean;
	position?: number;
	unicodeEmoji?: string | null;
	permissionsEquals?: boolean;
};

/** Minimal Role mock — only the fields Differ reads. */
export function makeRole(fields: RoleFields): Role {
	return {
		id: fields.id ?? `snowflake-${fields.name}`,
		name: fields.name,
		color: fields.color ?? 0,
		colors: fields.colors ?? { primaryColor: 0 },
		hoist: fields.hoist ?? false,
		mentionable: fields.mentionable ?? false,
		position: fields.position ?? 0,
		unicodeEmoji: fields.unicodeEmoji ?? null,
		permissions: {
			equals: () => fields.permissionsEquals ?? true,
		},
	} as unknown as Role;
}

export type ChannelFields = {
	id?: string;
	name: string;
	type?: "text" | "voice" | "announcement" | "stage" | "forum" | "media";
	parentId?: string | null;
	topic?: string | null;
	nsfw?: boolean;
	rateLimitPerUser?: number;
	bitrate?: number;
	userLimit?: number;
	rtcRegion?: string | null;
};

export type CategoryFields = {
	id?: string;
	name: string;
};

const blueprintTypeToChannelType: Record<string, ChannelType> = {
	text: ChannelType.GuildText,
	voice: ChannelType.GuildVoice,
	announcement: ChannelType.GuildAnnouncement,
	stage: ChannelType.GuildStageVoice,
	forum: ChannelType.GuildForum,
	media: ChannelType.GuildMedia,
};

/** Minimal non-category channel mock — only the fields Differ reads. */
export function makeChannel(fields: ChannelFields): GuildBasedChannel {
	return {
		id: fields.id ?? `snowflake-${fields.name}`,
		name: fields.name,
		type: blueprintTypeToChannelType[fields.type ?? "text"],
		parentId: fields.parentId ?? null,
		topic: fields.topic ?? null,
		nsfw: fields.nsfw ?? false,
		rateLimitPerUser: fields.rateLimitPerUser ?? 0,
		bitrate: fields.bitrate ?? 64000,
		userLimit: fields.userLimit ?? 0,
		rtcRegion: fields.rtcRegion ?? null,
	} as unknown as GuildBasedChannel;
}

/** Minimal category channel mock — only the fields Differ reads. */
export function makeCategory(fields: CategoryFields): GuildBasedChannel {
	return {
		id: fields.id ?? `snowflake-${fields.name}`,
		name: fields.name,
		type: ChannelType.GuildCategory,
		parentId: null,
	} as unknown as GuildBasedChannel;
}

/** Build a GuildState with a list of roles and channels (keyed by snowflake ID, as discord.js does). */
export function makeGuildState(
	roles: Role[],
	channels: GuildBasedChannel[] = [],
): GuildState {
	const roleCollection = new Collection<string, Role>();
	for (const role of roles) {
		roleCollection.set(role.id, role);
	}

	const channelCollection = new Collection<string, GuildBasedChannel>();
	for (const channel of channels) {
		channelCollection.set(channel.id, channel);
	}

	return {
		roles: roleCollection,
		channels: channelCollection,
	};
}

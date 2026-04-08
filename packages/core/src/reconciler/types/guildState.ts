import type { Collection, GuildBasedChannel, Role } from "discord.js";

export type GuildState = {
	roles: Collection<string, Role>;
	channels: Collection<string, GuildBasedChannel>;
};

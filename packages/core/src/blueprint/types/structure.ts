import type { PermissionResolvable } from "discord.js";
import type { ChannelConfig } from "./channels.js";

export type PermissionOverwrite =
	| { allow: PermissionResolvable[]; deny?: PermissionResolvable[] }
	| { deny: PermissionResolvable[]; allow?: PermissionResolvable[] };

export type PermissionMap<R extends string> = Partial<
	Record<R | "@everyone", PermissionOverwrite>
>;

export type ChannelDef<R extends string> = ChannelConfig & {
	name: string;
	permissions?: PermissionMap<R>;
};

export type CategoryDef<R extends string> = {
	name: string;
	permissions?: PermissionMap<R>;
};

export type StructureEntry<R extends string> = {
	category?: CategoryDef<R>;
	channels: ReadonlyArray<ChannelDef<R>>;
};

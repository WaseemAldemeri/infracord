import { Collection, type Role } from "discord.js";
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

/** Build a GuildState with a list of roles (keyed by snowflake ID, as discord.js does). */
export function makeGuildState(roles: Role[]): GuildState {
	const collection = new Collection<string, Role>();
	for (const role of roles) {
		collection.set(role.id, role);
	}
	return {
		roles: collection,
		channels: new Collection(),
	};
}

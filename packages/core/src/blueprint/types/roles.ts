import type { PermissionResolvable, RoleData } from "discord.js";

export type RoleDef = Omit<RoleData, "name" | "icon" | "permissions"> & {
	permissions?: PermissionResolvable[];
};

export type ServerRoles<R extends string> = Record<R, RoleDef>;

import type { RoleDef, ServerRoles } from "./types/roles.js";

export function defineRoles<R extends string>(
	roles: Record<R, RoleDef>,
): ServerRoles<R> {
	return roles;
}

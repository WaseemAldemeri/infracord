import type { Roles, ServerContext } from "./context.js";
import type { ServerRoles } from "./roles.js";
import type { StructureEntry } from "./structure.js";

export type Blueprint<Ctx extends ServerContext> = {
	readonly roles: ServerRoles<Roles<Ctx>>;
	readonly structure: StructureEntry<Roles<Ctx>>[];
};

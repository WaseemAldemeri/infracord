import type { Blueprint } from "./types/blueprint.js";
import type { ChannelType, ServerContext } from "./types/context.js";
import type { ExtractCategories, ExtractChannelTypeMap } from "./types/inference.js";
import type { ServerRoles } from "./types/roles.js";
import type { StructureEntry } from "./types/structure.js";

export function createBlueprint<
	R extends string,
	const S extends ReadonlyArray<StructureEntry<R>>,
>(options: {
	roles?: ServerRoles<R>;
	structure: S & ReadonlyArray<StructureEntry<R>>;
}): Blueprint<
	ServerContext<
		R,
		ExtractChannelTypeMap<S> & Record<string, ChannelType>,
		ExtractCategories<S>
	>
> {
	return {
		roles: (options.roles ?? {}) as ServerRoles<R>,
		structure: options.structure as unknown as StructureEntry<R>[],
	};
}

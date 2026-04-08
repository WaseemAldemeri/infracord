import type { CategoryDef } from "../../blueprint/index.js";
import type { ChannelConfig, RoleDef } from "../../index.js";

export const ResourceType = {
	ROLE: "ROLE",
	CHANNEL: "CHANNEL",
	CATEGORY: "CATEGORY",
} as const;

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

type ActionConfig = RoleDef | ChannelConfig | CategoryDef<never>;

type BaseAction = {
	resource: ResourceType;
	name: string;
};

export type CreateAction = BaseAction & {
	type: "CREATE";
	config: ActionConfig;
};

export type UpdateAction = BaseAction & {
	type: "UPDATE";
	referenceId: string;
	config: ActionConfig;
};

export type DeleteAction = BaseAction & {
	type: "DELETE";
	referenceId: string;
};

export type Action = CreateAction | UpdateAction | DeleteAction;

/** Factory functions for constructing {@link Action} values, grouped by resource type. */
export namespace Actions {
	// --- Role ---

	export function createRoleAction(
		name: string,
		config: RoleDef,
	): CreateAction {
		return { type: "CREATE", resource: ResourceType.ROLE, name, config };
	}

	export function updateRoleAction(
		name: string,
		referenceId: string,
		config: RoleDef,
	): UpdateAction {
		return {
			type: "UPDATE",
			resource: ResourceType.ROLE,
			name,
			referenceId,
			config,
		};
	}

	export function deleteRoleAction(
		name: string,
		referenceId: string,
	): DeleteAction {
		return { type: "DELETE", resource: ResourceType.ROLE, name, referenceId };
	}

	// --- Channel ---

	export function createChannelAction(
		name: string,
		config: ChannelConfig,
	): CreateAction {
		return { type: "CREATE", resource: ResourceType.CHANNEL, name, config };
	}

	export function updateChannelAction(
		name: string,
		referenceId: string,
		config: ChannelConfig,
	): UpdateAction {
		return {
			type: "UPDATE",
			resource: ResourceType.CHANNEL,
			name,
			referenceId,
			config,
		};
	}

	export function deleteChannelAction(
		name: string,
		referenceId: string,
	): DeleteAction {
		return {
			type: "DELETE",
			resource: ResourceType.CHANNEL,
			name,
			referenceId,
		};
	}

	// --- Category ---

	export function createCategoryAction(
		name: string,
		config: CategoryDef<never>,
	): CreateAction {
		return { type: "CREATE", resource: ResourceType.CATEGORY, name, config };
	}

	export function updateCategoryAction(
		name: string,
		referenceId: string,
		config: CategoryDef<never>,
	): UpdateAction {
		return {
			type: "UPDATE",
			resource: ResourceType.CATEGORY,
			name,
			referenceId,
			config,
		};
	}

	export function deleteCategoryAction(
		name: string,
		referenceId: string,
	): DeleteAction {
		return {
			type: "DELETE",
			resource: ResourceType.CATEGORY,
			name,
			referenceId,
		};
	}
}

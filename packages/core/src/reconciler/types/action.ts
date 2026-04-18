import type { CategoryDef } from "../../blueprint/index.js";
import type { ChannelConfig, RoleDef } from "../../index.js";

export const ResourceType = {
	ROLE: "ROLE",
	CHANNEL: "CHANNEL",
	CATEGORY: "CATEGORY",
} as const;

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

// --- Role actions ---

export type CreateRoleAction = {
	type: "CREATE";
	resource: typeof ResourceType.ROLE;
	name: string;
	config: RoleDef;
};

export type UpdateRoleAction = {
	type: "UPDATE";
	resource: typeof ResourceType.ROLE;
	name: string;
	referenceId: string;
	config: RoleDef;
};

export type DeleteRoleAction = {
	type: "DELETE";
	resource: typeof ResourceType.ROLE;
	name: string;
	referenceId: string;
};

// --- Channel actions ---

export type CreateChannelAction = {
	type: "CREATE";
	resource: typeof ResourceType.CHANNEL;
	name: string;
	config: ChannelConfig;
};

export type UpdateChannelAction = {
	type: "UPDATE";
	resource: typeof ResourceType.CHANNEL;
	name: string;
	referenceId: string;
	config: ChannelConfig;
};

export type DeleteChannelAction = {
	type: "DELETE";
	resource: typeof ResourceType.CHANNEL;
	name: string;
	referenceId: string;
};

// --- Category actions ---

export type CreateCategoryAction = {
	type: "CREATE";
	resource: typeof ResourceType.CATEGORY;
	name: string;
	config: CategoryDef<never>;
};

export type UpdateCategoryAction = {
	type: "UPDATE";
	resource: typeof ResourceType.CATEGORY;
	name: string;
	referenceId: string;
	config: CategoryDef<never>;
};

export type DeleteCategoryAction = {
	type: "DELETE";
	resource: typeof ResourceType.CATEGORY;
	name: string;
	referenceId: string;
};

export type RoleAction = CreateRoleAction | UpdateRoleAction | DeleteRoleAction;
export type ChannelAction =
	| CreateChannelAction
	| UpdateChannelAction
	| DeleteChannelAction;
export type CategoryAction =
	| CreateCategoryAction
	| UpdateCategoryAction
	| DeleteCategoryAction;

export type Action = RoleAction | ChannelAction | CategoryAction;

/** Factory functions for constructing {@link Action} values, grouped by resource type. */
export namespace Actions {
	// --- Role ---

	export function createRoleAction(
		name: string,
		config: RoleDef,
	): CreateRoleAction {
		return { type: "CREATE", resource: ResourceType.ROLE, name, config };
	}

	export function updateRoleAction(
		name: string,
		referenceId: string,
		config: RoleDef,
	): UpdateRoleAction {
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
	): DeleteRoleAction {
		return { type: "DELETE", resource: ResourceType.ROLE, name, referenceId };
	}

	// --- Channel ---

	export function createChannelAction(
		name: string,
		config: ChannelConfig,
	): CreateChannelAction {
		return { type: "CREATE", resource: ResourceType.CHANNEL, name, config };
	}

	export function updateChannelAction(
		name: string,
		referenceId: string,
		config: ChannelConfig,
	): UpdateChannelAction {
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
	): DeleteChannelAction {
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
	): CreateCategoryAction {
		return { type: "CREATE", resource: ResourceType.CATEGORY, name, config };
	}

	export function updateCategoryAction(
		name: string,
		referenceId: string,
		config: CategoryDef<never>,
	): UpdateCategoryAction {
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
	): DeleteCategoryAction {
		return {
			type: "DELETE",
			resource: ResourceType.CATEGORY,
			name,
			referenceId,
		};
	}
}

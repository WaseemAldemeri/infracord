import type { Guild } from "discord.js";
import type {
	Action,
	CreateRoleAction,
	DeleteRoleAction,
	UpdateRoleAction,
} from "./types/action.js";
import { ResourceType } from "./types/action.js";

/**
 * Executes a planned {@link Action} against a live Discord guild.
 * Extend this class to provide a custom apply strategy — for example,
 * a dry-run applier that logs without making any API calls.
 */
export abstract class Applier {
	/** Executes a single action against the given guild. */
	abstract apply(action: Action, guild: Guild): Promise<void>;

	/** Executes all actions in sequence against the given guild. */
	async applyAll(actions: Action[], guild: Guild): Promise<void> {
		for (const action of actions) {
			await this.apply(action, guild);
		}
	}
}

/**
 * Default {@link Applier} used when no custom implementation is provided.
 * Logs each action to the console without making any Discord API calls.
 * Useful during development and for previewing a reconciliation plan.
 */
export class LoggingApplier extends Applier {
	async apply(action: Action): Promise<void> {
		console.log(
			`[reconciler] ${action.type} ${action.resource} "${action.name}"`,
		);
	}
}

/**
 * Live {@link Applier} that executes actions against the Discord API via discord.js.
 * Pass this to {@link Reconciler} for real reconciliation.
 */
export class GuildApplier extends Applier {
	async apply(action: Action, guild: Guild): Promise<void> {
		switch (action.resource) {
			case ResourceType.ROLE:
				await this.applyRoleAction(action, guild);
				break;
			case ResourceType.CHANNEL:
			case ResourceType.CATEGORY:
				// TODO: implement channel and category apply
				break;
		}
	}

	private async applyRoleAction(
		action: CreateRoleAction | UpdateRoleAction | DeleteRoleAction,
		guild: Guild,
	): Promise<void> {
		switch (action.type) {
			case "CREATE":
				await this.createRole(action, guild);
				break;
			case "UPDATE":
				await this.updateRole(action, guild);
				break;
			case "DELETE":
				await this.deleteRole(action, guild);
				break;
		}
	}

	private async createRole(
		action: CreateRoleAction,
		guild: Guild,
	): Promise<void> {
		await guild.roles.create({ name: action.name, ...action.config });
	}

	private async updateRole(
		action: UpdateRoleAction,
		guild: Guild,
	): Promise<void> {
		const role = await guild.roles.fetch(action.referenceId);
		await role?.edit(action.config);
	}

	private async deleteRole(
		action: DeleteRoleAction,
		guild: Guild,
	): Promise<void> {
		await guild.roles.delete(action.referenceId);
	}
}

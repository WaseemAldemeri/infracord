import type { Action } from "./types/action.js";

/**
 * Executes a planned {@link Action} against a live Discord guild.
 * Extend this class to provide a custom apply strategy — for example,
 * a dry-run applier that logs without making any API calls.
 */
export abstract class Applier {
	/** Executes a single action. */
	abstract apply(action: Action): Promise<void>;

	/** Executes all actions in sequence. */
	async applyAll(actions: Action[]): Promise<void> {
		for (const action of actions) {
			await this.apply(action);
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

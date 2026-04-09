import type { Guild } from "discord.js";
import type { Blueprint } from "../blueprint/index.js";
import type { ServerContext } from "../blueprint/types/context.js";
import { type Applier, LoggingApplier } from "./applier.js";
import { Differ } from "./differ.js";
import type { GuildState } from "./types/guildState.js";
import { BlueprintValidationError } from "./types/validationError.js";

/**
 * Orchestrates the full reconciliation pipeline for a single blueprint:
 * diff the live guild state against the blueprint, then apply the resulting actions.
 *
 * Constructed and owned by `InfracordClient` — not part of the public infracord API.
 * The blueprint is validated at construction time; an invalid blueprint throws immediately.
 *
 * @example
 * ```ts
 * const reconciler = new Reconciler(blueprint);
 * await reconciler.reconcile(guild);
 * ```
 */
export class Reconciler {
	private differ: Differ;

	/**
	 * @param blueprint - The server blueprint to reconcile against.
	 * @param applier - The strategy used to apply actions. Defaults to {@link LoggingApplier},
	 *   which logs each action without making any API calls. Pass a real `GuildApplier`
	 *   (injected with the Discord client) for live reconciliation.
	 * @throws If the blueprint fails validation.
	 */
	constructor(
		blueprint: Blueprint<ServerContext>,
		private applier: Applier = new LoggingApplier(),
	) {
		this.differ = new Differ(blueprint);
		const errors = this.differ.validate();
		if (errors.length > 0) {
			throw new BlueprintValidationError(errors);
		}
	}

	/**
	 * Fetches the live guild state, diffs it against the blueprint, and applies
	 * all resulting actions via the configured {@link Applier}.
	 *
	 * @param guild - The Discord guild to reconcile. Fetched and passed in by `InfracordClient`.
	 */
	public async reconcile(guild: Guild): Promise<void> {
		const guildState = await this.buildGuildState(guild);
		const { actions, messages } = this.differ.diff(guildState);

		for (const message of messages) {
			console.log(`[reconciler] ${message}`);
		}

		await this.applier.applyAll(actions);
	}

	/**
	 * Fetches roles and channels from the live guild and returns a normalised
	 * {@link GuildState} ready for diffing. Filters out the @everyone role and
	 * null channels, which are not managed by infracord.
	 */
	private async buildGuildState(guild: Guild): Promise<GuildState> {
		const roles = await guild.roles.fetch();
		const channels = await guild.channels.fetch();

		return {
			roles: roles.filter((role) => role.name !== "@everyone"),
			channels: channels.filter((chan) => chan !== null),
		};
	}
}

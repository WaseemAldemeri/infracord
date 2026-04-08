import { Collection, type Role } from "discord.js";
import type { Blueprint, RoleDef } from "../blueprint/index.js";
import type { ServerContext } from "../blueprint/types/context.js";
import { type Action, Actions } from "./types/action.js";
import type { GuildState } from "./types/guildState.js";

/** The result of a diff operation — a list of actions to apply and log messages describing the plan. */
export type DiffResult = {
  actions: Action[];
  messages: string[];
};

/**
 * Computes the difference between a blueprint and a {@link GuildState} snapshot,
 * producing a set of {@link Action}s that describe what needs to change.
 *
 * `Differ` is pure — it receives a pre-built `GuildState` at diff time and performs
 * no I/O of its own. Fetching the live guild state is the responsibility of the caller
 * (see {@link Reconciler}). The same instance can be reused across multiple guilds.
 */
export class Differ {
  constructor(private blueprint: Blueprint<ServerContext>) {}

  /**
   * Validates the blueprint for structural errors.
   * Called by {@link Reconciler} at construction time — a `Reconciler` built from
   * an invalid blueprint throws immediately rather than failing at reconcile time.
   *
   * @returns An array of error messages. Empty means the blueprint is valid.
   */
  public validate(): string[] {
    const errors: string[] = [];

    const roleNames = new Set<string>();
    for (const roleName of Object.keys(this.blueprint.roles)) {
      if (!roleName) {
        errors.push(
          "A role has an empty name — role names must be non-empty strings",
        );
        continue;
      }
      if (roleNames.has(roleName)) {
        errors.push(`Role "${roleName}" is defined more than once`);
      }
      roleNames.add(roleName);
    }

    const categoryNames = new Set<string>();
    const topLevelChannelNames = new Set<string>();

    this.blueprint.structure.forEach((entry, i) => {
      const catName = entry.category?.name;
      if (catName !== undefined && !catName) {
        errors.push(
          `Structure entry ${i} has a category with an empty name — category names must be non-empty strings`,
        );
      } else if (catName) {
        if (categoryNames.has(catName)) {
          errors.push(`Category "${catName}" is defined more than once`);
        }
        categoryNames.add(catName);
      }

      const scope = catName ? `category "${catName}"` : "top-level";
      const channelNames = catName ? new Set<string>() : topLevelChannelNames;
      for (const ch of entry.channels) {
        if (!ch.name) {
          errors.push(
            `A channel in ${scope} has an empty name — channel names must be non-empty strings`,
          );
          continue;
        }
        if (channelNames.has(ch.name)) {
          errors.push(
            `Channel "${ch.name}" in ${scope} is defined more than once`,
          );
        }
        channelNames.add(ch.name);
      }
    });

    return errors;
  }

  /**
   * Computes the full set of {@link Action}s needed to bring the guild in line
   * with the blueprint, given a pre-built {@link GuildState} snapshot.
   *
   * @remarks Channel and category diffing is not yet implemented — only roles are diffed.
   */
  public diff(guildState: GuildState): DiffResult {
    const roles = this.diffRoles(guildState);
    const categories = this.diffCategories(guildState);
    const channels = this.diffChannels(guildState);

    return {
      actions: [...roles.actions, ...categories.actions, ...channels.actions],
      messages: [
        ...roles.messages,
        ...categories.messages,
        ...channels.messages,
      ],
    };
  }

  /**
   * Returns true if any blueprint-defined field on `blueprintRole` differs from
   * the corresponding field on the live `guildRole`. Fields absent from the
   * blueprint are intentionally ignored — they are considered unmanaged.
   */
  private roleNeedsUpdate(blueprintRole: RoleDef, guildRole: Role): boolean {
    if (
      blueprintRole.colors !== undefined &&
      (blueprintRole.colors.primaryColor !== guildRole.colors.primaryColor ||
        (blueprintRole.colors.secondaryColor !== undefined &&
          blueprintRole.colors.secondaryColor !==
            guildRole.colors.secondaryColor) ||
        (blueprintRole.colors.tertiaryColor !== undefined &&
          blueprintRole.colors.tertiaryColor !==
            guildRole.colors.tertiaryColor))
    ) {
      return true;
    }

    if (
      // color (deprecated) — to be replaced with colors once confirmed safe
      (blueprintRole.color !== undefined &&
        blueprintRole.color !== guildRole.color) ||
      (blueprintRole.hoist !== undefined &&
        blueprintRole.hoist !== guildRole.hoist) ||
      (blueprintRole.mentionable !== undefined &&
        blueprintRole.mentionable !== guildRole.mentionable) ||
      (blueprintRole.position !== undefined &&
        blueprintRole.position !== guildRole.position) ||
      (blueprintRole.unicodeEmoji !== undefined &&
        blueprintRole.unicodeEmoji !== guildRole.unicodeEmoji) ||
      (blueprintRole.permissions !== undefined &&
        !guildRole.permissions.equals(blueprintRole.permissions))
    ) {
      return true;
    }

    return false;
  }

  private diffRoles(guildState: GuildState): DiffResult {
    const actions: Action[] = [];
    const messages: string[] = [];

    // Re-key guild roles by name; discord.js keys them by snowflake ID
    const guildRoles = new Collection<string, Role>();
    for (const [, role] of guildState.roles) {
      if (guildRoles.has(role.name)) {
        messages.push(
          `Role "${role.name}" has a duplicate name in the guild — using first occurrence, skipping subsequent`,
        );
        continue;
      }
      guildRoles.set(role.name, role);
    }

    for (const [name, blueprintRole] of Object.entries(this.blueprint.roles)) {
      const guildRole = guildRoles.get(name);

      if (!guildRole) {
        messages.push(
          `Role "${name}" is defined in the blueprint but does not exist in the guild — will create`,
        );
        actions.push(Actions.createRoleAction(name, blueprintRole));
        continue;
      }

      if (this.roleNeedsUpdate(blueprintRole, guildRole)) {
        messages.push(
          `Role "${name}" differs from the blueprint — will update`,
        );
        actions.push(
          Actions.updateRoleAction(name, guildRole.id, blueprintRole),
        );
      } else {
        messages.push(`Role "${name}" matches the blueprint — skipping`);
      }
    }

    for (const [, role] of guildState.roles) {
      if (!(role.name in this.blueprint.roles)) {
        messages.push(
          `Role "${role.name}" exists in the guild but is not defined in the blueprint — skipping (unmanaged)`,
        );
      }
    }

    return { actions, messages };
  }

  // TODO: implement category diffing
  private diffCategories(_guildState: GuildState): DiffResult {
    return { actions: [], messages: [] };
  }

  // TODO: implement channel diffing
  private diffChannels(_guildState: GuildState): DiffResult {
    return { actions: [], messages: [] };
  }
}

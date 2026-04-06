import type { Blueprint } from "../blueprint/index.js";
import type { ServerContext } from "../blueprint/types/context.js";

export class Reconciler {
  constructor(private blueprint: Blueprint<ServerContext>) {}

  public validate(): string[] {
    const errors: string[] = [];

    // check for duplicate roles
    const roleNames = new Set<string>();
    Object.keys(this.blueprint.roles).forEach((roleName) => {
      if (!roleName) {
        errors.push(
          "A role has an empty name — role names must be non-empty strings",
        );
        return;
      }
      if (roleNames.has(roleName)) {
        errors.push(`Role "${roleName}" is defined more than once`);
      }
      roleNames.add(roleName);
    });

    // check for duplicate categories
    const categoryNames = new Set<string>();

    // check for duplicate top-level channels
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

      // check for duplicate channels in the same category
      const scope = catName ? `category "${catName}"` : "top-level";
      const channelNames = catName ? new Set<string>() : topLevelChannelNames;
      entry.channels.forEach((ch) => {
        if (!ch.name) {
          errors.push(
            `A channel in ${scope} has an empty name — channel names must be non-empty strings`,
          );
          return;
        }
        if (channelNames.has(ch.name)) {
          errors.push(
            `Channel "${ch.name}" in ${scope} is defined more than once`,
          );
        }
        channelNames.add(ch.name);
      });
    });

    return errors;
  }
}

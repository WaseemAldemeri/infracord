import type { ServerContext } from "./context.js";
import type { ServerBlueprintOptions } from "./types.js";

export class ServerBlueprint<Ctx extends ServerContext> {
  readonly options: ServerBlueprintOptions<Ctx>;

  constructor(options: ServerBlueprintOptions<Ctx>) {
    this.options = options;
  }
}

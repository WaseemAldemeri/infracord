/**
 * A phantom type that bundles the three name unions for a server definition.
 * It carries no runtime value — it exists only at the type level to propagate
 * role, channel, and category sets through the framework (ServerBlueprint, ic, etc.).
 *
 * Usage:
 *   type MyServer = ServerContext<MyRoles, MyChannels, MyCategories>;
 *   const blueprint = new ServerBlueprint<MyServer>({ ... });
 */
export type ServerContext<
  R extends string = string,
  C extends string = string,
  K extends string = string,
> = {
  readonly _roles: R;
  readonly _channels: C;
  readonly _categories: K;
};

// Convenience extractors — used internally throughout the framework
export type Roles<Ctx extends ServerContext> = Ctx["_roles"];
export type Channels<Ctx extends ServerContext> = Ctx["_channels"];
export type Categories<Ctx extends ServerContext> = Ctx["_categories"];

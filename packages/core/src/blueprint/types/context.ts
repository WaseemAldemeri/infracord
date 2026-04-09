export type ChannelType =
	| "text"
	| "voice"
	| "announcement"
	| "stage"
	| "forum"
	| "media";

export type ServerContext<
	R extends string = string,
	C extends Record<string, ChannelType> = Record<string, ChannelType>,
	K extends string = string,
> = {
	readonly _roles: R;
	readonly _channels: C;
	readonly _categories: K;
};

export type Roles<Ctx extends ServerContext> = Ctx["_roles"];
export type ChannelTypeMap<Ctx extends ServerContext> = Ctx["_channels"];
export type ChannelNames<Ctx extends ServerContext> = keyof Ctx["_channels"] &
	string;
export type Categories<Ctx extends ServerContext> = Ctx["_categories"];

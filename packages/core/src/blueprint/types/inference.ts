import type { ChannelType } from "./context.js";

type UnionToIntersection<U> = (
	U extends unknown
		? (k: U) => void
		: never
) extends (k: infer I) => void
	? I
	: never;

type ChannelsFromEntry<E> = E extends {
	channels: infer Ch extends ReadonlyArray<{ name: string; type: ChannelType }>;
}
	? UnionToIntersection<
			Ch[number] extends {
				name: infer N extends string;
				type: infer T extends ChannelType;
			}
				? { [K in N]: T }
				: never
		>
	: Record<never, never>;

export type ExtractChannelTypeMap<S extends ReadonlyArray<unknown>> =
	UnionToIntersection<{ [K in keyof S]: ChannelsFromEntry<S[K]> }[number]>;

export type ExtractCategories<S extends ReadonlyArray<unknown>> = {
	[K in keyof S]: S[K] extends { category: { name: infer Cat extends string } }
		? Cat
		: never;
}[number];

type PermissionKeysOf<P> = keyof NonNullable<P> & string;

type AllPermissionKeys<S extends ReadonlyArray<unknown>> = {
	[I in keyof S]:
		| (S[I] extends { category: { permissions?: infer P } }
				? PermissionKeysOf<P>
				: never)
		| (S[I] extends { channels: ReadonlyArray<infer C> }
				? C extends { permissions?: infer P }
					? PermissionKeysOf<P>
					: never
				: never);
}[number];

/** Role keys referenced in permissions that were not declared in `defineRoles()`. */
export type InvalidRoles<
	S extends ReadonlyArray<unknown>,
	R extends string,
> = Exclude<AllPermissionKeys<S>, R | "@everyone">;

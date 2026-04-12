import type { ResourceType } from "./action.js";

export const DiffEventKind = {
	/** A resource exists in both and matches the blueprint — no action needed. */
	SKIP: "SKIP",
	/** A guild resource is not defined in the blueprint — left untouched. */
	UNMANAGED: "UNMANAGED",
	/** Multiple guild resources share the same name — first occurrence used, rest skipped. */
	DUPLICATE: "DUPLICATE",
} as const;

export type DiffEventKind = (typeof DiffEventKind)[keyof typeof DiffEventKind];

export type DiffEvent = {
	kind: DiffEventKind;
	resource: ResourceType;
	name: string;
};

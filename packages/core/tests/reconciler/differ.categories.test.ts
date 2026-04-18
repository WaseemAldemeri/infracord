import { describe, expect, it } from "vitest";
import { createBlueprint } from "../../src/blueprint/createBlueprint.js";
import { Differ } from "../../src/reconciler/differ.js";
import { ResourceType } from "../../src/reconciler/types/action.js";
import { DiffEventKind } from "../../src/reconciler/types/diffEvent.js";
import { makeCategory, makeGuildState } from "../helpers/discord.js";

describe("Differ.diff — categories", () => {
	it("emits a CREATE action for a category in blueprint but not guild", () => {
		const bp = createBlueprint({
			structure: [{ category: { name: "Text Channels" }, channels: [] }],
		});

		const { actions } = new Differ(bp).diff(makeGuildState([]));

		expect(actions).toContainEqual(
			expect.objectContaining({
				type: "CREATE",
				resource: ResourceType.CATEGORY,
				name: "Text Channels",
			}),
		);
	});

	it("emits no action and a SKIP event for a matching category", () => {
		const bp = createBlueprint({
			structure: [{ category: { name: "Text Channels" }, channels: [] }],
		});

		const cat = makeCategory({ name: "Text Channels" });
		const { actions, events } = new Differ(bp).diff(makeGuildState([], [cat]));

		expect(actions).toHaveLength(0);
		expect(events).toContainEqual({
			kind: DiffEventKind.SKIP,
			resource: ResourceType.CATEGORY,
			name: "Text Channels",
		});
	});

	it("emits UNMANAGED for a guild category not in the blueprint", () => {
		const bp = createBlueprint({ structure: [] });

		const cat = makeCategory({ name: "Archive" });
		const { actions, events } = new Differ(bp).diff(makeGuildState([], [cat]));

		expect(actions).toHaveLength(0);
		expect(events).toContainEqual({
			kind: DiffEventKind.UNMANAGED,
			resource: ResourceType.CATEGORY,
			name: "Archive",
		});
	});

	it("warns about duplicate guild category names and uses the first occurrence", () => {
		const bp = createBlueprint({
			structure: [{ category: { name: "Text" }, channels: [] }],
		});

		const first = makeCategory({ id: "cat-first", name: "Text" });
		const second = makeCategory({ id: "cat-second", name: "Text" });

		const { actions, events } = new Differ(bp).diff(
			makeGuildState([], [first, second]),
		);

		expect(events).toContainEqual({
			kind: DiffEventKind.DUPLICATE,
			resource: ResourceType.CATEGORY,
			name: "Text",
		});
		// First occurrence matches → no CREATE
		expect(actions).toHaveLength(0);
	});

	it("handles a mix of create, skip, and unmanaged categories", () => {
		const bp = createBlueprint({
			structure: [
				{ category: { name: "Text" }, channels: [] },
				{ category: { name: "Voice" }, channels: [] },
			],
		});

		const guildState = makeGuildState(
			[],
			[
				makeCategory({ name: "Text" }), // SKIP
				// Voice → CREATE
				makeCategory({ name: "Archive" }), // UNMANAGED
			],
		);

		const { actions, events } = new Differ(bp).diff(guildState);

		expect(actions).toContainEqual(
			expect.objectContaining({
				type: "CREATE",
				resource: ResourceType.CATEGORY,
				name: "Voice",
			}),
		);
		expect(events).toContainEqual({
			kind: DiffEventKind.SKIP,
			resource: ResourceType.CATEGORY,
			name: "Text",
		});
		expect(events).toContainEqual({
			kind: DiffEventKind.UNMANAGED,
			resource: ResourceType.CATEGORY,
			name: "Archive",
		});
	});
});

describe("Differ.diff — categories — strict mode", () => {
	it("emits DELETE for an unmanaged category in strict mode", () => {
		const bp = createBlueprint({ structure: [] });

		const cat = makeCategory({ name: "Archive" });
		const { actions, events } = new Differ(bp, { strict: true }).diff(
			makeGuildState([], [cat]),
		);

		expect(actions).toContainEqual({
			type: "DELETE",
			resource: ResourceType.CATEGORY,
			name: "Archive",
			referenceId: "snowflake-Archive",
		});
		expect(events.some((e) => e.kind === DiffEventKind.UNMANAGED)).toBe(false);
	});

	it("emits DELETE actions for all categories on an empty blueprint in strict mode", () => {
		const bp = createBlueprint({ structure: [] });

		const guildState = makeGuildState(
			[],
			[makeCategory({ name: "Text" }), makeCategory({ name: "Voice" })],
		);
		const { actions } = new Differ(bp, { strict: true }).diff(guildState);

		const names = actions.map((a) => a.name);
		expect(names).toContain("Text");
		expect(names).toContain("Voice");
		expect(actions.every((a) => a.type === "DELETE")).toBe(true);
	});
});

describe("Differ.diff — categories — deleteDuplicates mode", () => {
	it("emits DELETE for the duplicate category and a DUPLICATE event", () => {
		const bp = createBlueprint({
			structure: [{ category: { name: "Text" }, channels: [] }],
		});

		const first = makeCategory({ id: "cat-first", name: "Text" });
		const second = makeCategory({ id: "cat-second", name: "Text" });

		const { actions, events } = new Differ(bp, { deleteDuplicates: true }).diff(
			makeGuildState([], [first, second]),
		);

		expect(events).toContainEqual({
			kind: DiffEventKind.DUPLICATE,
			resource: ResourceType.CATEGORY,
			name: "Text",
		});
		expect(actions).toContainEqual({
			type: "DELETE",
			resource: ResourceType.CATEGORY,
			name: "Text",
			referenceId: "cat-second",
		});
	});
});

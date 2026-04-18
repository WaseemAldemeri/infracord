import { describe, expect, it } from "vitest";
import { createBlueprint } from "../../src/blueprint/createBlueprint.js";
import { Differ } from "../../src/reconciler/differ.js";
import { ResourceType } from "../../src/reconciler/types/action.js";
import { DiffEventKind } from "../../src/reconciler/types/diffEvent.js";
import {
	makeCategory,
	makeChannel,
	makeGuildState,
} from "../helpers/discord.js";

describe("Differ.diff — channels", () => {
	it("emits a CREATE action for a top-level channel in blueprint but not guild", () => {
		const bp = createBlueprint({
			structure: [{ channels: [{ name: "general", type: "text" }] }],
		});

		const { actions } = new Differ(bp).diff(makeGuildState([]));

		expect(actions).toHaveLength(1);
		expect(actions[0]).toMatchObject({
			type: "CREATE",
			resource: ResourceType.CHANNEL,
			name: "general",
		});
	});

	it("emits CREATE actions for both a missing category and its channel", () => {
		const bp = createBlueprint({
			structure: [
				{
					category: { name: "Text Channels" },
					channels: [{ name: "general", type: "text" }],
				},
			],
		});

		const { actions } = new Differ(bp).diff(makeGuildState([]));

		const types = actions.map((a) => `${a.type}:${a.resource}:${a.name}`);
		expect(types).toContain("CREATE:CATEGORY:Text Channels");
		expect(types).toContain("CREATE:CHANNEL:general");
	});

	it("emits a CREATE action for a channel when its category exists but the channel does not", () => {
		const bp = createBlueprint({
			structure: [
				{
					category: { name: "Text Channels" },
					channels: [{ name: "general", type: "text" }],
				},
			],
		});

		const cat = makeCategory({ name: "Text Channels" });
		const { actions } = new Differ(bp).diff(makeGuildState([], [cat]));

		expect(actions).toContainEqual(
			expect.objectContaining({
				type: "CREATE",
				resource: ResourceType.CHANNEL,
				name: "general",
			}),
		);
	});

	it("emits no action and a SKIP event for a matching top-level channel", () => {
		const bp = createBlueprint({
			structure: [{ channels: [{ name: "general", type: "text" }] }],
		});

		const channel = makeChannel({ name: "general", type: "text" });
		const { actions, events } = new Differ(bp).diff(
			makeGuildState([], [channel]),
		);

		expect(actions).toHaveLength(0);
		expect(events).toContainEqual({
			kind: DiffEventKind.SKIP,
			resource: ResourceType.CHANNEL,
			name: "general",
		});
	});

	it("emits no action and a SKIP event for a channel matching its category", () => {
		const bp = createBlueprint({
			structure: [
				{
					category: { name: "Text Channels" },
					channels: [{ name: "general", type: "text" }],
				},
			],
		});

		const cat = makeCategory({ name: "Text Channels" });
		const channel = makeChannel({
			name: "general",
			type: "text",
			parentId: cat.id,
		});
		const { actions, events } = new Differ(bp).diff(
			makeGuildState([], [cat, channel]),
		);

		expect(actions).toHaveLength(0);
		expect(events).toContainEqual({
			kind: DiffEventKind.SKIP,
			resource: ResourceType.CHANNEL,
			name: "general",
		});
	});

	it("does not emit UPDATE when a field differs but is not managed by the blueprint", () => {
		const bp = createBlueprint({
			structure: [{ channels: [{ name: "general", type: "text" }] }],
		});

		const channel = makeChannel({
			name: "general",
			type: "text",
			topic: "some topic",
		});
		const { actions } = new Differ(bp).diff(makeGuildState([], [channel]));

		expect(actions).toHaveLength(0);
	});

	it("emits UNMANAGED for a guild channel not in the blueprint", () => {
		const bp = createBlueprint({ structure: [] });

		const channel = makeChannel({ name: "general", type: "text" });
		const { actions, events } = new Differ(bp).diff(
			makeGuildState([], [channel]),
		);

		expect(actions).toHaveLength(0);
		expect(events).toContainEqual({
			kind: DiffEventKind.UNMANAGED,
			resource: ResourceType.CHANNEL,
			name: "general",
		});
	});

	it("emits UPDATE when topic differs for a text channel", () => {
		const bp = createBlueprint({
			structure: [
				{
					channels: [{ name: "general", type: "text", topic: "New topic" }],
				},
			],
		});

		const channel = makeChannel({
			name: "general",
			type: "text",
			topic: "Old topic",
		});
		const { actions } = new Differ(bp).diff(makeGuildState([], [channel]));

		expect(actions).toHaveLength(1);
		expect(actions[0]).toMatchObject({
			type: "UPDATE",
			resource: ResourceType.CHANNEL,
			name: "general",
			referenceId: "snowflake-general",
		});
	});

	it("emits UPDATE when bitrate differs for a voice channel", () => {
		const bp = createBlueprint({
			structure: [
				{
					channels: [{ name: "voice-chat", type: "voice", bitrate: 128000 }],
				},
			],
		});

		const channel = makeChannel({
			name: "voice-chat",
			type: "voice",
			bitrate: 64000,
		});
		const { actions } = new Differ(bp).diff(makeGuildState([], [channel]));

		expect(actions[0]).toMatchObject({ type: "UPDATE", name: "voice-chat" });
	});

	it("emits CREATE when a same-named channel exists under a different parent", () => {
		const bp = createBlueprint({
			structure: [
				{
					category: { name: "Text Channels" },
					channels: [{ name: "general", type: "text" }],
				},
			],
		});

		const cat = makeCategory({ name: "Text Channels" });
		// "general" exists but at top level — wrong parent
		const channel = makeChannel({
			name: "general",
			type: "text",
			parentId: null,
		});
		const { actions } = new Differ(bp).diff(makeGuildState([], [cat, channel]));

		expect(actions).toContainEqual(
			expect.objectContaining({
				type: "CREATE",
				resource: ResourceType.CHANNEL,
				name: "general",
			}),
		);
	});

	it("handles a mix of create, update, skip, and unmanaged channels", () => {
		const bp = createBlueprint({
			structure: [
				{
					channels: [
						{ name: "general", type: "text", topic: "Welcome" },
						{ name: "announcements", type: "text" },
						{ name: "music", type: "voice" },
					],
				},
			],
		});

		const guildState = makeGuildState(
			[],
			[
				makeChannel({ name: "general", type: "text", topic: "Old topic" }), // UPDATE
				makeChannel({ name: "announcements", type: "text" }), // SKIP
				// music → CREATE
				makeChannel({ name: "extra", type: "text" }), // UNMANAGED
			],
		);

		const { actions, events } = new Differ(bp).diff(guildState);

		const actionMap = Object.fromEntries(actions.map((a) => [a.name, a.type]));
		expect(actionMap.general).toBe("UPDATE");
		expect(actionMap.music).toBe("CREATE");
		expect(actionMap.announcements).toBeUndefined();
		expect(events).toContainEqual({
			kind: DiffEventKind.UNMANAGED,
			resource: ResourceType.CHANNEL,
			name: "extra",
		});
	});

	it("warns about duplicate guild channel names and uses the first occurrence", () => {
		const bp = createBlueprint({
			structure: [
				{
					channels: [{ name: "general", type: "text", topic: "Welcome" }],
				},
			],
		});

		const first = makeChannel({
			id: "id-first",
			name: "general",
			type: "text",
			topic: "Welcome",
		});
		const second = makeChannel({
			id: "id-second",
			name: "general",
			type: "text",
			topic: "Other",
		});

		const { actions, events } = new Differ(bp).diff(
			makeGuildState([], [first, second]),
		);

		expect(events).toContainEqual({
			kind: DiffEventKind.DUPLICATE,
			resource: ResourceType.CHANNEL,
			name: "general",
		});
		// First occurrence matches blueprint topic → no update
		expect(actions).toHaveLength(0);
	});
});

describe("Differ.diff — channels — strict mode", () => {
	it("emits a DELETE action for an unmanaged channel in strict mode", () => {
		const bp = createBlueprint({ structure: [] });

		const channel = makeChannel({ name: "unmanaged", type: "text" });
		const { actions, events } = new Differ(bp, { strict: true }).diff(
			makeGuildState([], [channel]),
		);

		expect(actions).toContainEqual({
			type: "DELETE",
			resource: ResourceType.CHANNEL,
			name: "unmanaged",
			referenceId: "snowflake-unmanaged",
		});
		expect(events.some((e) => e.kind === DiffEventKind.UNMANAGED)).toBe(false);
	});

	it("emits DELETE actions for all channels on an empty blueprint in strict mode", () => {
		const bp = createBlueprint({ structure: [] });

		const guildState = makeGuildState(
			[],
			[
				makeChannel({ name: "alpha", type: "text" }),
				makeChannel({ name: "beta", type: "voice" }),
			],
		);
		const { actions } = new Differ(bp, { strict: true }).diff(guildState);

		const names = actions.map((a) => a.name);
		expect(names).toContain("alpha");
		expect(names).toContain("beta");
		expect(actions.every((a) => a.type === "DELETE")).toBe(true);
	});
});

describe("Differ.diff — channels — deleteDuplicates mode", () => {
	it("emits DELETE for the duplicate occurrence and a DUPLICATE event", () => {
		const bp = createBlueprint({
			structure: [{ channels: [{ name: "general", type: "text" }] }],
		});

		const first = makeChannel({
			id: "id-first",
			name: "general",
			type: "text",
		});
		const second = makeChannel({
			id: "id-second",
			name: "general",
			type: "text",
		});

		const { actions, events } = new Differ(bp, { deleteDuplicates: true }).diff(
			makeGuildState([], [first, second]),
		);

		expect(events).toContainEqual({
			kind: DiffEventKind.DUPLICATE,
			resource: ResourceType.CHANNEL,
			name: "general",
		});
		expect(actions).toContainEqual({
			type: "DELETE",
			resource: ResourceType.CHANNEL,
			name: "general",
			referenceId: "id-second",
		});
		expect(actions.some((a) => a.type === "UPDATE")).toBe(false);
	});
});

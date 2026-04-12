import { describe, expect, it } from "vitest";
import { createBlueprint } from "../../src/blueprint/createBlueprint.js";
import { Differ } from "../../src/reconciler/differ.js";
import { ResourceType } from "../../src/reconciler/types/action.js";
import { DiffEventKind } from "../../src/reconciler/types/diffEvent.js";
import { makeGuildState, makeRole } from "../helpers/discord.js";

describe("Differ.diff — roles", () => {
	it("emits a CREATE action for a role that exists in the blueprint but not the guild", () => {
		const bp = createBlueprint({
			roles: { mod: { color: 0x00ff00 } },
			structure: [],
		});

		const { actions } = new Differ(bp).diff(makeGuildState([]));

		expect(actions).toHaveLength(1);
		expect(actions[0]).toMatchObject({
			type: "CREATE",
			resource: ResourceType.ROLE,
			name: "mod",
		});
	});

	it("emits no action and a skip message when a role matches the blueprint", () => {
		const bp = createBlueprint({
			roles: { mod: {} },
			structure: [],
		});

		const guildState = makeGuildState([makeRole({ name: "mod" })]);
		const { actions, events } = new Differ(bp).diff(guildState);

		expect(actions).toHaveLength(0);
		expect(events).toContainEqual({
			kind: DiffEventKind.SKIP,
			resource: ResourceType.ROLE,
			name: "mod",
		});
	});

	it("does not emit an action for a role with no managed fields defined", () => {
		const bp = createBlueprint({
			roles: { mod: {} },
			structure: [],
		});

		const guildState = makeGuildState([
			makeRole({ name: "mod", color: 0xabcdef }),
		]);
		const { actions } = new Differ(bp).diff(guildState);

		expect(actions).toHaveLength(0);
	});

	it("emits no action and an unmanaged message for a guild role not in the blueprint", () => {
		const bp = createBlueprint({ structure: [] });

		const guildState = makeGuildState([makeRole({ name: "some-role" })]);
		const { actions, events } = new Differ(bp).diff(guildState);

		expect(actions).toHaveLength(0);
		expect(events).toContainEqual({
			kind: DiffEventKind.UNMANAGED,
			resource: ResourceType.ROLE,
			name: "some-role",
		});
	});

	it("emits an UPDATE action when color differs", () => {
		const bp = createBlueprint({
			roles: { mod: { color: 0xff0000 } },
			structure: [],
		});

		const guildState = makeGuildState([
			makeRole({ name: "mod", color: 0x00ff00 }),
		]);
		const { actions } = new Differ(bp).diff(guildState);

		expect(actions).toHaveLength(1);
		expect(actions[0]).toMatchObject({
			type: "UPDATE",
			resource: ResourceType.ROLE,
			name: "mod",
			referenceId: "snowflake-mod",
		});
	});

	it("emits an UPDATE action when hoist differs", () => {
		const bp = createBlueprint({
			roles: { mod: { hoist: true } },
			structure: [],
		});

		const guildState = makeGuildState([
			makeRole({ name: "mod", hoist: false }),
		]);
		const { actions } = new Differ(bp).diff(guildState);

		expect(actions[0]).toMatchObject({ type: "UPDATE", name: "mod" });
	});

	it("emits an UPDATE action when mentionable differs", () => {
		const bp = createBlueprint({
			roles: { mod: { mentionable: true } },
			structure: [],
		});

		const guildState = makeGuildState([
			makeRole({ name: "mod", mentionable: false }),
		]);
		const { actions } = new Differ(bp).diff(guildState);

		expect(actions[0]).toMatchObject({ type: "UPDATE", name: "mod" });
	});

	it("emits an UPDATE action when position differs", () => {
		const bp = createBlueprint({
			roles: { mod: { position: 3 } },
			structure: [],
		});

		const guildState = makeGuildState([makeRole({ name: "mod", position: 1 })]);
		const { actions } = new Differ(bp).diff(guildState);

		expect(actions[0]).toMatchObject({ type: "UPDATE", name: "mod" });
	});

	it("emits an UPDATE action when unicodeEmoji differs", () => {
		const bp = createBlueprint({
			roles: { mod: { unicodeEmoji: "🔥" } },
			structure: [],
		});

		const guildState = makeGuildState([
			makeRole({ name: "mod", unicodeEmoji: null }),
		]);
		const { actions } = new Differ(bp).diff(guildState);

		expect(actions[0]).toMatchObject({ type: "UPDATE", name: "mod" });
	});

	it("emits an UPDATE action when permissions differ", () => {
		const bp = createBlueprint({
			roles: { mod: { permissions: ["BanMembers"] } },
			structure: [],
		});

		const guildState = makeGuildState([
			makeRole({ name: "mod", permissionsEquals: false }),
		]);
		const { actions } = new Differ(bp).diff(guildState);

		expect(actions[0]).toMatchObject({ type: "UPDATE", name: "mod" });
	});

	it("emits an UPDATE action when colors.primaryColor differs", () => {
		const bp = createBlueprint({
			roles: { mod: { colors: { primaryColor: 0xff0000 } } },
			structure: [],
		});

		const guildState = makeGuildState([
			makeRole({ name: "mod", colors: { primaryColor: 0x00ff00 } }),
		]);
		const { actions } = new Differ(bp).diff(guildState);

		expect(actions[0]).toMatchObject({ type: "UPDATE", name: "mod" });
	});

	it("emits an UPDATE action when colors.secondaryColor differs", () => {
		const bp = createBlueprint({
			roles: {
				mod: { colors: { primaryColor: 0xff0000, secondaryColor: 0x0000ff } },
			},
			structure: [],
		});

		const guildState = makeGuildState([
			makeRole({
				name: "mod",
				colors: { primaryColor: 0xff0000, secondaryColor: 0x00ff00 },
			}),
		]);
		const { actions } = new Differ(bp).diff(guildState);

		expect(actions[0]).toMatchObject({ type: "UPDATE", name: "mod" });
	});

	it("handles a mix of create, update, skip, and unmanaged roles", () => {
		const bp = createBlueprint({
			roles: {
				admin: { color: 0xff0000 },
				mod: { hoist: true },
				member: {},
			},
			structure: [],
		});

		const guildState = makeGuildState([
			makeRole({ name: "admin", color: 0x0000ff }), // color differs → UPDATE
			makeRole({ name: "mod", hoist: true }), // matches → skip
			// member missing → CREATE
			makeRole({ name: "extra" }), // not in blueprint → unmanaged
		]);

		const { actions, events } = new Differ(bp).diff(guildState);

		const types = actions.map((a) => `${a.type}:${a.name}`);
		expect(types).toContain("UPDATE:admin");
		expect(types).toContain("CREATE:member");
		expect(types).not.toContain("UPDATE:mod");
		expect(events).toContainEqual({
			kind: DiffEventKind.UNMANAGED,
			resource: ResourceType.ROLE,
			name: "extra",
		});
	});

	it("warns about duplicate guild role names and uses the first occurrence", () => {
		const bp = createBlueprint({
			roles: { mod: { color: 0xff0000 } },
			structure: [],
		});

		const first = makeRole({ id: "id-first", name: "mod", color: 0xff0000 });
		const second = makeRole({ id: "id-second", name: "mod", color: 0x00ff00 });

		const guildState = makeGuildState([first, second]);
		const { actions, events } = new Differ(bp).diff(guildState);

		expect(events).toContainEqual({
			kind: DiffEventKind.DUPLICATE,
			resource: ResourceType.ROLE,
			name: "mod",
		});
		// First occurrence matches blueprint color → no update
		expect(actions).toHaveLength(0);
	});
});

describe("Differ.diff — roles — strict mode", () => {
	it("emits a DELETE action for an unmanaged role in strict mode", () => {
		const bp = createBlueprint({ structure: [] });

		const guildState = makeGuildState([makeRole({ name: "unmanaged" })]);
		const { actions, events } = new Differ(bp, { strict: true }).diff(
			guildState,
		);

		expect(actions).toContainEqual({
			type: "DELETE",
			resource: ResourceType.ROLE,
			name: "unmanaged",
			referenceId: "snowflake-unmanaged",
		});
		// No UNMANAGED event — action replaces it
		expect(events.some((e) => e.kind === DiffEventKind.UNMANAGED)).toBe(false);
	});

	it("emits DELETE actions for all roles on an empty blueprint in strict mode", () => {
		const bp = createBlueprint({ structure: [] });

		const guildState = makeGuildState([
			makeRole({ name: "alpha" }),
			makeRole({ name: "beta" }),
		]);
		const { actions } = new Differ(bp, { strict: true }).diff(guildState);

		const names = actions.map((a) => a.name);
		expect(names).toContain("alpha");
		expect(names).toContain("beta");
		expect(actions.every((a) => a.type === "DELETE")).toBe(true);
	});
});

describe("Differ.diff — roles — deleteDuplicates mode", () => {
	it("emits a DELETE action for the duplicate occurrence and a DUPLICATE event", () => {
		const bp = createBlueprint({
			roles: { mod: { color: 0xff0000 } },
			structure: [],
		});

		const first = makeRole({ id: "id-first", name: "mod", color: 0xff0000 });
		const second = makeRole({ id: "id-second", name: "mod", color: 0x00ff00 });

		const guildState = makeGuildState([first, second]);
		const { actions, events } = new Differ(bp, {
			deleteDuplicates: true,
		}).diff(guildState);

		// Event still emitted — explains why the delete is happening
		expect(events).toContainEqual({
			kind: DiffEventKind.DUPLICATE,
			resource: ResourceType.ROLE,
			name: "mod",
		});
		// DELETE targets the second (duplicate) occurrence
		expect(actions).toContainEqual({
			type: "DELETE",
			resource: ResourceType.ROLE,
			name: "mod",
			referenceId: "id-second",
		});
		// First occurrence matches blueprint → no UPDATE
		expect(actions.some((a) => a.type === "UPDATE")).toBe(false);
	});
});

import { describe, expect, it } from "vitest";
import { createBlueprint } from "../../src/blueprint/createBlueprint.js";
import { Differ } from "../../src/reconciler/differ.js";
import { ValidationErrorCode } from "../../src/reconciler/types/validationError.js";

describe("Differ.validate", () => {
	it("returns no errors for an empty blueprint", () => {
		const bp = createBlueprint({ structure: [] });
		expect(new Differ(bp).validate()).toEqual([]);
	});

	it("returns no errors for a valid blueprint with roles and structure", () => {
		const bp = createBlueprint({
			roles: {
				admin: { color: 0xff0000 },
				member: {},
			},
			structure: [
				{
					category: { name: "General" },
					channels: [
						{ name: "chat", type: "text" },
						{ name: "voice", type: "voice" },
					],
				},
				{
					channels: [{ name: "announcements", type: "announcement" }],
				},
			],
		});

		expect(new Differ(bp).validate()).toEqual([]);
	});

	it("reports an empty category name", () => {
		const bp = createBlueprint({
			structure: [{ category: { name: "" }, channels: [] }],
		});

		const errors = new Differ(bp).validate();
		expect(errors).toHaveLength(1);
		expect(errors[0].code).toBe(ValidationErrorCode.EMPTY_CATEGORY_NAME);
	});

	it("reports a duplicate category name", () => {
		const bp = createBlueprint({
			structure: [
				{ category: { name: "General" }, channels: [] },
				{ category: { name: "General" }, channels: [] },
			],
		});

		const errors = new Differ(bp).validate();
		expect(errors).toHaveLength(1);
		expect(errors[0].code).toBe(ValidationErrorCode.DUPLICATE_CATEGORY_NAME);
	});

	it("reports an empty channel name", () => {
		const bp = createBlueprint({
			structure: [{ channels: [{ name: "", type: "text" }] }],
		});

		const errors = new Differ(bp).validate();
		expect(errors).toHaveLength(1);
		expect(errors[0].code).toBe(ValidationErrorCode.EMPTY_CHANNEL_NAME);
	});

	it("reports a duplicate top-level channel name", () => {
		const bp = createBlueprint({
			structure: [
				{
					channels: [
						{ name: "general", type: "text" },
						{ name: "general", type: "text" },
					],
				},
			],
		});

		const errors = new Differ(bp).validate();
		expect(errors).toHaveLength(1);
		expect(errors[0].code).toBe(ValidationErrorCode.DUPLICATE_CHANNEL_NAME);
	});

	it("reports a duplicate channel name within a category", () => {
		const bp = createBlueprint({
			structure: [
				{
					category: { name: "Text" },
					channels: [
						{ name: "chat", type: "text" },
						{ name: "chat", type: "text" },
					],
				},
			],
		});

		const errors = new Differ(bp).validate();
		expect(errors).toHaveLength(1);
		expect(errors[0].code).toBe(ValidationErrorCode.DUPLICATE_CHANNEL_NAME);
	});

	it("allows the same channel name in different categories", () => {
		const bp = createBlueprint({
			structure: [
				{
					category: { name: "A" },
					channels: [{ name: "chat", type: "text" }],
				},
				{
					category: { name: "B" },
					channels: [{ name: "chat", type: "text" }],
				},
			],
		});

		expect(new Differ(bp).validate()).toEqual([]);
	});

	it("accumulates multiple errors", () => {
		const bp = createBlueprint({
			structure: [
				{ category: { name: "" }, channels: [{ name: "", type: "text" }] },
				{ category: { name: "Dup" }, channels: [] },
				{ category: { name: "Dup" }, channels: [] },
			],
		});

		const errors = new Differ(bp).validate();
		expect(errors.length).toBeGreaterThanOrEqual(3);
	});
});

export const ValidationErrorCode = {
	EMPTY_ROLE_NAME: "EMPTY_ROLE_NAME",
	DUPLICATE_ROLE_NAME: "DUPLICATE_ROLE_NAME",
	EMPTY_CATEGORY_NAME: "EMPTY_CATEGORY_NAME",
	DUPLICATE_CATEGORY_NAME: "DUPLICATE_CATEGORY_NAME",
	EMPTY_CHANNEL_NAME: "EMPTY_CHANNEL_NAME",
	DUPLICATE_CHANNEL_NAME: "DUPLICATE_CHANNEL_NAME",
} as const;

export type ValidationErrorCode =
	(typeof ValidationErrorCode)[keyof typeof ValidationErrorCode];

export type ValidationError = {
	code: ValidationErrorCode;
	message: string;
};

/**
 * Thrown by {@link Reconciler} when the blueprint fails validation.
 * Inspect `.errors` for the full list of structured validation errors.
 */
export class BlueprintValidationError extends Error {
	constructor(public readonly errors: ValidationError[]) {
		super(
			`Blueprint validation failed:\n${errors.map((e) => e.message).join("\n")}`,
		);
		this.name = "BlueprintValidationError";
	}
}

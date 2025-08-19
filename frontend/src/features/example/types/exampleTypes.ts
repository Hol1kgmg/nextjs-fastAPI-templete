/**
 * Example機能の型定義（共通基盤使用例）
 */

export type ExampleResponse = {
	id: string;
	name: string;
	status: "active" | "inactive";
	createdAt: string;
};

export type ExampleApiError = {
	message: string;
	code: "EXAMPLE_ERROR" | "VALIDATION_ERROR" | "NOT_FOUND";
	timestamp: string;
	details?: unknown;
};

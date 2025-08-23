/**
 * Example機能のServer Actions（共通基盤使用例）
 */

import type { Result } from "@praha/byethrow";
import { createApiAction, createPostApiAction } from "@/actions";
import type { ApiError } from "@/types";
import type { ExampleResponse } from "../types/exampleTypes";

/**
 * Example一覧を取得するServer Action
 */
export const getExamplesAction = (): Result.ResultAsync<
	ExampleResponse[],
	ApiError
> => {
	return createApiAction<ExampleResponse[]>("/examples");
};

/**
 * 新しいExampleを作成するServer Action
 */
export const createExampleAction = (
	data: Omit<ExampleResponse, "id" | "createdAt">,
): Result.ResultAsync<ExampleResponse, ApiError> => {
	return createPostApiAction<typeof data, ExampleResponse>("/examples", data);
};

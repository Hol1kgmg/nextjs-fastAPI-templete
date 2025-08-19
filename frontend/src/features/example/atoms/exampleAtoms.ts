/**
 * Example機能のAtoms（共通基盤使用例）
 */

import { createApiStateAtoms } from "@/atoms";
import type { ApiError } from "@/types";
import type { ExampleResponse } from "../types/exampleTypes";

// 共通基盤を使用してExample用のAtomセットを生成
const {
	dataAtom: exampleDataAtom,
	loadingAtom: exampleLoadingAtom,
	errorAtom: exampleErrorAtom,
	stateAtom: exampleStateAtom,
} = createApiStateAtoms<ExampleResponse, ApiError>();

export {
	exampleDataAtom,
	exampleLoadingAtom,
	exampleErrorAtom,
	exampleStateAtom,
};

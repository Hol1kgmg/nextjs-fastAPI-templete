/**
 * Health機能のJotai Atoms
 *
 * 共通基盤のcreateApiStateAtomsを使用してHealth機能の状態管理を実装します。
 */

import { createApiStateAtoms } from "@/atoms";
import type {
	HealthApiError,
	HealthResponse,
} from "@/features/health/types/healthTypes";

// 共通基盤を使用してHealth APIの状態管理Atomsを生成
export const {
	dataAtom: healthDataAtom,
	loadingAtom: healthLoadingAtom,
	errorAtom: healthErrorAtom,
	stateAtom: healthStateAtom,
} = createApiStateAtoms<HealthResponse, HealthApiError>();

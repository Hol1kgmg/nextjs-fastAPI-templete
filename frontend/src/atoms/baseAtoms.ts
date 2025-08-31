/**
 * 共通のJotai Atoms基盤
 *
 * このファイルはAPI状態管理のためのAtomファクトリーを提供します。
 * 各機能でこのファクトリーを使用して一貫したAPI状態管理を実装してください。
 */

import { atom } from "jotai";
import { atomWithReset } from "jotai/utils";
import type { ApiError, ApiState } from "@/types";

/**
 * API状態管理用のAtomセットを生成するファクトリー関数
 *
 * @template TData - APIレスポンスデータの型
 * @template TError - APIエラーの型（デフォルト: ApiError）
 * @returns API状態管理用のAtomセット
 *
 * @example
 * ```typescript
 * // Health機能での使用例
 * const {
 *   dataAtom: healthDataAtom,
 *   loadingAtom: healthLoadingAtom,
 *   errorAtom: healthErrorAtom,
 *   stateAtom: healthStateAtom,
 * } = createApiStateAtoms<HealthResponse, HealthApiError>();
 * ```
 */
export const createApiStateAtoms = <TData, TError = ApiError>() => {
	// データAtom（リセット可能）
	const dataAtom = atomWithReset<TData | null>(null);

	// ローディング状態Atom
	const loadingAtom = atom<boolean>(false);

	// エラー状態Atom（リセット可能）
	const errorAtom = atomWithReset<TError | null>(null);

	// 統合状態Atom（読み取り専用）
	const stateAtom = atom<ApiState<TData, TError>>((get) => ({
		data: get(dataAtom),
		loading: get(loadingAtom),
		error: get(errorAtom),
	}));

	return {
		dataAtom,
		loadingAtom,
		errorAtom,
		stateAtom,
	};
};

/**
 * API状態をリセットするヘルパー関数を生成
 *
 * @param atoms - createApiStateAtomsで生成されたAtomセット
 * @returns リセット関数
 */
export const createApiStateReset = <TData, TError = ApiError>(
	atoms: ReturnType<typeof createApiStateAtoms<TData, TError>>,
) => {
	return () => {
		// リセット可能なAtomsをリセット
		atoms.dataAtom.init;
		atoms.errorAtom.init;
		// loadingAtomは通常の値なのでfalseに設定
		atoms.loadingAtom.init = false;
	};
};

import { Result } from "@praha/byethrow";
import { useAtom } from "jotai";
import { useCallback } from "react";
import { healthApiClient } from "../../api/healthClient";
import {
	healthDataAtom,
	healthErrorAtom,
	healthLoadingAtom,
} from "../../atoms/healthAtoms";

/**
 * Health機能のプレゼンテーション層フック
 *
 * 既存のhealthApiClientを使用しつつ、将来のClean Architectureへの移行に備えた
 * インターフェースを提供します。
 */
export const useHealth = () => {
	const [data, setData] = useAtom(healthDataAtom);
	const [loading, setLoading] = useAtom(healthLoadingAtom);
	const [error, setError] = useAtom(healthErrorAtom);

	const fetchHealth = useCallback(async () => {
		setLoading(true);
		setError(null);

		const result = await healthApiClient.getHealth();

		if (Result.isSuccess(result)) {
			setData(result.value);
			setLoading(false);
			setError(null);
		} else {
			setData(null);
			setLoading(false);
			setError(result.error);
		}
	}, [setData, setLoading, setError]);

	const retry = useCallback(() => {
		fetchHealth();
	}, [fetchHealth]);

	return {
		data,
		loading,
		error,
		fetchHealth,
		retry,
	};
};

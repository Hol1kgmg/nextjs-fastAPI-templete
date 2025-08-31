import { Result } from "@praha/byethrow";
import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";
import { healthApiClient } from "@/features/health/api/healthClient";
import {
	healthDataAtom,
	healthErrorAtom,
	healthLoadingAtom,
	healthStateAtom,
} from "@/features/health/atoms/healthAtoms";

export const useHealthHook = () => {
	const [state] = useAtom(healthStateAtom);
	const setData = useSetAtom(healthDataAtom);
	const setLoading = useSetAtom(healthLoadingAtom);
	const setError = useSetAtom(healthErrorAtom);

	const fetchHealth = useCallback(async () => {
		setLoading(true);
		setError(null);

		const result = await healthApiClient.getHealth();

		if (Result.isSuccess(result)) {
			setData(result.value);
		} else {
			setError(result.error);
		}

		setLoading(false);
	}, [setData, setLoading, setError]);

	const retry = useCallback(() => {
		fetchHealth();
	}, [fetchHealth]);

	return { ...state, fetchHealth, retry };
};

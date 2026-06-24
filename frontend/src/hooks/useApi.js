import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useApi — reusable hook for async API calls.
 *
 * Usage (auto-fetch on mount):
 *   const { data, loading, error, refetch } = useApi(dsaService.getAll);
 *
 * Usage (manual trigger):
 *   const { execute, loading, error } = useApi(dsaService.create, { manual: true });
 *   await execute(payload);
 */
const useApi = (apiFn, options = {}) => {
  const { manual = false, initialData = null, onSuccess, onError } = options;

  const [data, setData]       = useState(initialData);
  const [loading, setLoading] = useState(!manual);
  const [error, setError]     = useState(null);

  // Use a ref to track if the component is still mounted (avoids setState on unmounted components)
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(
    async (...args) => {
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await apiFn(...args);
        const result = response.data;

        if (mountedRef.current) {
          setData(result);
          onSuccess?.(result);
        }

        return result;
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.message ||
          'Something went wrong. Please try again.';

        if (mountedRef.current) {
          setError(message);
          onError?.(message, err);
        }

        throw err;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiFn]
  );

  // Auto-fetch on mount unless manual mode
  useEffect(() => {
    if (!manual) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
    setData,
  };
};

export default useApi;

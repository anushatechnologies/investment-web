import { useState, useCallback, useEffect } from 'react';
import { fetchDashboard } from '../services/dashboardApi';

export function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboard();
      setData(result);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}

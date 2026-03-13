import { useCallback, useEffect, useState } from 'react';
import { api } from 'services/api-client';

import { ICoachPlan } from 'types/coach/coach-plan';

export const useCoachPlan = () => {
  const [plans, setPlans] = useState<ICoachPlan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.subscription.fetchCoachPlans();
      setPlans(data ?? []);
      return { success: true };
    } catch (e) {
      console.error('Error loading plans:', e);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    plans,
    loading,

    loadPlans
  };
};

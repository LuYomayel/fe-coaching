import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api-client';
import { useToast } from '../../contexts/ToastContext';

export interface CoachSubscriptionPlan {
  id: number;
  name: string;
  price: number;
  max_clients: number;
}

export const useSubscriptionTab = (currentPlanId: number | null | undefined) => {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<CoachSubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.subscription.fetchCoachSubscriptionPlans();
      setPlans(res.data ?? []);
    } catch (e) {
      showToast('error', 'Error', (e as Error).message || 'No se pudieron cargar los planes');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  return {
    plans,
    loading,
    currentPlanId: currentPlanId ?? null
  };
};

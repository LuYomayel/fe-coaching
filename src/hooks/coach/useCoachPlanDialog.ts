import { useCallback, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api-client';

export type PaymentFrequency = 'monthly' | 'weekly' | 'per_session';

export type CoachPlanForm = {
  id?: number;
  name: string;
  price: number;
  paymentFrequency: PaymentFrequency;
};

export function useCoachPlanDialog(onSaved?: () => void) {
  const { user } = useUser();
  const { showToast } = useToast();

  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState<CoachPlanForm>({
    name: '',
    price: 0,
    paymentFrequency: 'monthly'
  });
  const [loading, setLoading] = useState(false);

  const openCreate = useCallback(() => {
    if (!user) return;
    setMode('create');
    setForm({ name: '', price: 0, paymentFrequency: 'monthly' });
    setVisible(true);
  }, [user]);

  const openEdit = useCallback(
    (plan: CoachPlanForm) => {
      if (!user) return;
      setMode('edit');
      setForm({
        id: plan.id,
        name: plan.name,
        price: Number(plan.price) || 0,
        paymentFrequency: plan.paymentFrequency || 'monthly'
      });
      setVisible(true);
    },
    [user]
  );

  const close = useCallback(() => setVisible(false), []);

  const setField = useCallback(<K extends keyof CoachPlanForm>(key: K, value: CoachPlanForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = useCallback(async () => {
    if (!user) return { success: false };
    if (!form.name || form.price <= 0 || !form.paymentFrequency) {
      showToast('error', 'Error', 'Completa los campos obligatorios');
      return { success: false };
    }

    try {
      setLoading(true);
      await api.subscription.createOrUpdateCoachPlan(form, form.id, mode);
      showToast('success', 'Success', mode === 'create' ? 'Plan creado' : 'Plan actualizado');
      setVisible(false);
      onSaved && onSaved();
      return { success: true };
    } catch (e) {
      console.error('Error saving coach plan:', e);
      showToast('error', 'Error', (e as Error).message || 'No se pudo guardar el plan');
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [form, mode, onSaved, showToast, user]);

  return { visible, mode, form, loading, openCreate, openEdit, close, setField, save };
}

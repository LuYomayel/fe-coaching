import { useCallback, useMemo, useState } from 'react';
import { api } from '../../services/api-client';

export interface RpeValueMeta {
  value: number;
  color?: string;
  emoji?: string;
}

export interface RpeMethodForm {
  id?: number;
  name: string;
  minValue: number;
  maxValue: number;
  step: number;
  valuesMeta: RpeValueMeta[];
  isDefault: boolean;
}

export type DialogMode = 'create' | 'edit';

export const useRpeMethodDialog = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<DialogMode>('create');
  const [form, setForm] = useState<RpeMethodForm>({
    name: '',
    minValue: 0,
    maxValue: 10,
    step: 1,
    valuesMeta: [],
    isDefault: false
  });

  const openCreate = useCallback(() => {
    setMode('create');
    setForm({ name: '', minValue: 0, maxValue: 10, step: 1, valuesMeta: [], isDefault: false });
    setVisible(true);
  }, []);

  const openEdit = useCallback((method: RpeMethodForm) => {
    setMode('edit');
    setForm({ ...method });
    setVisible(true);
  }, []);

  const close = useCallback(() => setVisible(false), []);

  const setField = useCallback(<K extends keyof RpeMethodForm>(key: K, value: RpeMethodForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addValueMeta = useCallback(() => {
    setForm((prev) => ({ ...prev, valuesMeta: [...prev.valuesMeta, { value: 0, color: '', emoji: '' }] }));
  }, []);

  const updateValueMeta = useCallback((index: number, patch: Partial<RpeValueMeta>) => {
    setForm((prev) => ({
      ...prev,
      valuesMeta: prev.valuesMeta.map((vm, i) => (i === index ? { ...vm, ...patch } : vm))
    }));
  }, []);

  const removeValueMeta = useCallback((index: number) => {
    setForm((prev) => ({ ...prev, valuesMeta: prev.valuesMeta.filter((_, i) => i !== index) }));
  }, []);

  const canGenerate = useMemo(
    () => form.step > 0 && form.minValue < form.maxValue,
    [form.minValue, form.maxValue, form.step]
  );

  const generateValues = useCallback(() => {
    if (!canGenerate) return;
    const list: RpeValueMeta[] = [];
    for (let v = form.minValue; v <= form.maxValue; v += form.step) list.push({ value: v });
    setForm((prev) => ({ ...prev, valuesMeta: list.slice(0, 20) }));
  }, [canGenerate, form.maxValue, form.minValue, form.step]);

  const save = useCallback(async () => {
    setLoading(true);
    try {
      await api.rpe.createOrUpdateRpeMethod(mode, form);
      setVisible(false);
      return { success: true } as const;
    } catch (e) {
      return { success: false, error: (e as Error).message } as const;
    } finally {
      setLoading(false);
    }
  }, [form, mode]);

  return {
    // state
    visible,
    loading,
    mode,
    form,
    // actions
    openCreate,
    openEdit,
    close,
    setField,
    addValueMeta,
    updateValueMeta,
    removeValueMeta,
    generateValues,
    save
  };
};

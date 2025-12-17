import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api-client';
import { IRpeMethod } from '../../types/rpe/rpe-method-assigned';

export const useRpeMethods = () => {
  const { showToast } = useToast();
  const [rpeMethods, setRpeMethods] = useState<IRpeMethod[]>([]);
  const [defaultRpeMethod, setDefaultRpeMethod] = useState<IRpeMethod | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRpeMethods();
  }, []);

  const loadRpeMethods = async () => {
    setLoading(true);
    try {
      const { data } = await api.rpe.getRpeMethods();
      console.log('data', data);
      setRpeMethods(data || []);

      // Encontrar el método por defecto
      const defaultMethod = data?.find((method: IRpeMethod) => method.isDefault);
      if (defaultMethod) {
        setDefaultRpeMethod(defaultMethod);
      }
    } catch (error) {
      console.error('Error loading RPE methods:', error);
      showToast('error', 'Error', 'No se pudieron cargar los métodos RPE');
    } finally {
      setLoading(false);
    }
  };

  return {
    rpeMethods,
    defaultRpeMethod,
    loading,
    loadRpeMethods
  };
};

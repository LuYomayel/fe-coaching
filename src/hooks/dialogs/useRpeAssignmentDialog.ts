import { useCallback, useState } from 'react';
import { api } from '../../services/api-client';

export type RpeTargetType = 'exercise' | 'trainingCycle' | 'client' | 'user' | string;

export interface RpeAssignmentState {
  type: RpeTargetType | null;
  targetId: number | null;
  rpeMethodId: number | null;
}

export const useRpeAssignmentDialog = (userId: number) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<RpeAssignmentState>({ type: null, targetId: null, rpeMethodId: null });

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  const setType = useCallback((type: RpeTargetType | null) => setState((s) => ({ ...s, type })), []);
  const setTargetId = useCallback((targetId: number | null) => setState((s) => ({ ...s, targetId })), []);
  const setRpeMethodId = useCallback((rpeMethodId: number | null) => setState((s) => ({ ...s, rpeMethodId })), []);

  const assign = useCallback(async () => {
    if (!state.type || !state.targetId || !state.rpeMethodId)
      return { success: false, error: 'Missing fields' } as const;
    setLoading(true);
    try {
      await api.rpe.assignRpeToTarget(state.rpeMethodId, state.type, state.targetId, userId);
      setVisible(false);
      return { success: true } as const;
    } catch (e) {
      return { success: false, error: (e as Error).message } as const;
    } finally {
      setLoading(false);
    }
  }, [state.rpeMethodId, state.targetId, state.type, userId]);

  return { visible, loading, state, open, close, setType, setTargetId, setRpeMethodId, assign };
};

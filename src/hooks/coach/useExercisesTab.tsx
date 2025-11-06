import { useCallback, useEffect, useRef, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import {
  fetchCoachExercises,
  fetchBodyAreas,
  deleteExercise,
  massUpdateExercises,
  fetchExerciseTypes
} from '../../services/exercisesService';
import { FilterMatchMode } from 'primereact/api';

export function useExercisesTab() {
  const { coach } = useUser();
  const { showToast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [isEditingExercises, setIsEditingExercises] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);
  const [originalExercisesForEdit, setOriginalExercisesForEdit] = useState<any[]>([]);
  const [modifiedExercises, setModifiedExercises] = useState<Record<number, any>>({});
  const [exerciseTypes, setExerciseTypes] = useState<any[]>([]);
  const [bodyAreas, setBodyAreas] = useState<any[]>([]);
  const [missingExercises, setMissingExercises] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    exerciseType: { value: null, matchMode: FilterMatchMode.CONTAINS },
    description: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [exerciseDialogVisible, setExerciseDialogVisible] = useState(false);
  const [newExercise, setNewExercise] = useState<any>({
    name: '',
    description: '',
    multimedia: '',
    exerciseType: '',
    equipmentNeeded: ''
  });
  const [selectedBodyAreas, setSelectedBodyAreas] = useState<any[]>([]);

  const [videoDialogVisible, setVideoDialogVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);

  const fileUploadRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [saveTimeouts, setSaveTimeouts] = useState<Record<number, any>>({});

  useEffect(() => {
    const load = async () => {
      const [exRes, typesRes, areasRes] = await Promise.all([
        fetchCoachExercises(coach?.id),
        fetchExerciseTypes(),
        fetchBodyAreas()
      ]);
      setExercises(exRes.data || []);
      setExerciseTypes(typesRes.data || []);
      if (!areasRes.data?.error) setBodyAreas(areasRes.data || []);
      const missing = (exRes.data || []).filter(
        (e: any) => !e.multimedia || !e.exerciseType || !e.description || !e.equipmentNeeded
      );
      setMissingExercises(missing);
    };
    load();
  }, [coach, refreshKey]);

  const openCreateExerciseDialog = useCallback(() => {
    setDialogMode('create');
    setNewExercise({ name: '', description: '', multimedia: '', exerciseType: '', equipmentNeeded: '' });
    setSelectedBodyAreas([]);
    setExerciseDialogVisible(true);
  }, []);

  const openEditExerciseDialog = useCallback((exercise: any) => {
    setDialogMode('edit');
    setNewExercise(exercise);
    setSelectedBodyAreas([]);
    setExerciseDialogVisible(true);
  }, []);

  const closeExerciseDialog = useCallback(() => {
    setNewExercise({ name: '', description: '', multimedia: '', exerciseType: '', equipmentNeeded: '' });
    setSelectedBodyAreas([]);
    setExerciseDialogVisible(false);
  }, []);

  const handleDeleteExercise = useCallback(
    async (exerciseId: number) => {
      try {
        const response = await deleteExercise(exerciseId);
        if (response.error) throw new Error(response.message);
        setRefreshKey((old) => old + 1);
        showToast('success', 'Success', 'Exercise deleted successfully');
      } catch (error: any) {
        showToast('error', 'Error', error.message);
      }
    },
    [showToast]
  );

  const debouncedSaveExercise = useCallback(
    (options: any, delay = 300) => {
      const exerciseId = options.rowData.id;
      if (saveTimeouts[exerciseId]) clearTimeout(saveTimeouts[exerciseId]);
      const timeoutId = setTimeout(() => {
        saveEditedExercise(options);
        setSaveTimeouts((prev) => {
          const n = { ...prev };
          delete n[exerciseId];
          return n;
        });
      }, delay);
      setSaveTimeouts((prev) => ({ ...prev, [exerciseId]: timeoutId }));
    },
    [saveTimeouts]
  );

  const saveEditedExercise = useCallback(
    (options: any) => {
      const { rowData, value: newValue, field } = options;
      const currentValue = rowData[field];
      if (field !== 'exerciseBodyAreas' && field !== 'exerciseType') {
        if (newValue === currentValue || (newValue === '' && !currentValue) || (!newValue && currentValue === ''))
          return;
      }
      const _exercises = exercises.map((ex) => (ex.id === rowData.id ? { ...ex, [field]: newValue ?? '' } : ex));
      setExercises(_exercises);

      const updated = _exercises.find((ex) => ex.id === rowData.id);
      const original = originalExercisesForEdit.find((ex) => ex.id === rowData.id);
      const hasChanged = JSON.stringify(original?.[field]) !== JSON.stringify(updated?.[field]);
      if (hasChanged) setModifiedExercises((prev) => ({ ...prev, [rowData.id]: updated }));
      else
        setModifiedExercises((prev) => {
          const n = { ...prev };
          delete n[rowData.id];
          return n;
        });
    },
    [exercises, originalExercisesForEdit]
  );

  const handleMassUpdateExercises = useCallback(async () => {
    const updates = Object.values(modifiedExercises);
    if (updates.length === 0) {
      showToast('info', 'Sin cambios', 'No hay cambios para guardar');
      setIsEditingExercises(false);
      return;
    }
    try {
      const formatted = updates.map((exercise: any) => {
        let exerciseTypeId: number | null = null;
        if (exercise.exerciseType) {
          if (typeof exercise.exerciseType === 'object' && exercise.exerciseType.id)
            exerciseTypeId = exercise.exerciseType.id;
          else if (typeof exercise.exerciseType === 'number') exerciseTypeId = exercise.exerciseType;
        }
        let bodyAreaIds: number[] = [];
        if (exercise.exerciseBodyAreas && Array.isArray(exercise.exerciseBodyAreas)) {
          bodyAreaIds = exercise.exerciseBodyAreas
            .map((eba: any) => (eba.bodyArea && eba.bodyArea.id ? eba.bodyArea.id : eba.id))
            .filter(Boolean);
        }
        return {
          id: exercise.id,
          name: exercise.name || '',
          description: exercise.description || '',
          multimedia: exercise.multimedia || '',
          exerciseType: exerciseTypeId,
          equipmentNeeded: exercise.equipmentNeeded || '',
          bodyArea: bodyAreaIds
        };
      });
      await massUpdateExercises(formatted);
      setModifiedExercises({});
      setIsEditingExercises(false);
      setOriginalExercisesForEdit(exercises);
      setRefreshKey((k) => k + 1);
    } catch (error: any) {
      showToast('error', 'Error', error.message || 'Error updating exercises');
    }
  }, [exercises, modifiedExercises, showToast]);

  const cancelMassUpdate = useCallback(() => {
    setIsEditingExercises(false);
    setModifiedExercises({});
    setExercises(originalExercisesForEdit);
    showToast('info', 'Edición cancelada', 'No se realizaron cambios');
  }, [originalExercisesForEdit, showToast]);

  const hasMissingData = useCallback((rowData: any) => {
    const missingFields = ['multimedia', 'exerciseType', 'description', 'equipmentNeeded'].filter(
      (field) => !rowData[field]
    );
    return missingFields.length > 0;
  }, []);

  return {
    // state
    exercises,
    exerciseTypes,
    bodyAreas,
    filters,
    missingExercises,
    isEditingExercises,
    exerciseDialogVisible,
    dialogMode,
    newExercise,
    selectedBodyAreas,
    videoDialogVisible,
    currentVideoUrl,
    // setters
    setFilters,
    setIsEditingExercises,
    setOriginalExercisesForEdit,
    setNewExercise,
    setSelectedBodyAreas,
    setVideoDialogVisible,
    setCurrentVideoUrl,
    // refs
    fileUploadRef,
    fileInputRef,
    // actions
    openCreateExerciseDialog,
    openEditExerciseDialog,
    closeExerciseDialog,
    handleDeleteExercise,
    debouncedSaveExercise,
    saveEditedExercise,
    handleMassUpdateExercises,
    cancelMassUpdate,
    setRefreshKey,
    // helpers
    hasMissingData
  };
}

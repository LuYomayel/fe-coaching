import { useCallback, useEffect, useRef, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import { deleteExercise } from '../../services/exercisesService';
import { FilterMatchMode } from 'primereact/api';
import { api } from '../../services/api-client';
import {
  ICategory,
  IContractionType,
  IDifficultyLevel,
  IEquipment,
  IExercise,
  IMovementPattern,
  IMovementPlane,
  IMuscle,
  IUnilateralType,
  IVariant
} from 'types/workout/exercise';
export function useExercisesTab() {
  const { coach } = useUser();
  const { showToast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [isEditingExercises, setIsEditingExercises] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);
  const [originalExercisesForEdit, setOriginalExercisesForEdit] = useState<any[]>([]);
  const [modifiedExercises, setModifiedExercises] = useState<Record<number, any>>({});

  const [missingExercises, setMissingExercises] = useState<any[]>([]);

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    category: { value: null, matchMode: FilterMatchMode.CONTAINS },
    contraction: { value: null, matchMode: FilterMatchMode.CONTAINS },
    difficulty: { value: null, matchMode: FilterMatchMode.CONTAINS },
    equipment: { value: null, matchMode: FilterMatchMode.CONTAINS },
    movementPattern: { value: null, matchMode: FilterMatchMode.CONTAINS },
    movementPlane: { value: null, matchMode: FilterMatchMode.CONTAINS },
    muscle: { value: null, matchMode: FilterMatchMode.CONTAINS },
    unilateralType: { value: null, matchMode: FilterMatchMode.CONTAINS },
    variant: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [contractions, setContractions] = useState<IContractionType[]>([]);
  const [difficulties, setDifficulties] = useState<IDifficultyLevel[]>([]);
  const [equipments, setEquipments] = useState<IEquipment[]>([]);
  const [movementPatterns, setMovementPatterns] = useState<IMovementPattern[]>([]);
  const [movementPlanes, setMovementPlanes] = useState<IMovementPlane[]>([]);
  const [muscles, setMuscles] = useState<IMuscle[]>([]);
  const [unilateralTypes, setUnilateralTypes] = useState<IUnilateralType[]>([]);
  const [variants, setVariants] = useState<IVariant[]>([]);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [exerciseDialogVisible, setExerciseDialogVisible] = useState(false);
  const [newExercise, setNewExercise] = useState<IExercise>({
    id: 0,
    name: '',
    createdByCoach: false,
    createdByAdmin: false,
    multimedia: '',
    category: null,
    variant: null,
    contractionType: null,
    difficultyLevel: null,
    movementPlane: null,
    unilateralType: null,
    movementPattern: null,
    regressionExercise: null,
    progressionExercise: null,
    equipments: [],
    muscles: [],
    coach: null
  });

  const [videoDialogVisible, setVideoDialogVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);

  const fileUploadRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [saveTimeouts, setSaveTimeouts] = useState<Record<number, any>>({});

  // Función para cargar ejercicios con paginación
  const loadExercises = useCallback(
    async (page: number = currentPage, rows: number = limit, search: string = searchTerm) => {
      if (!coach) return;

      setLoading(true);
      try {
        const { data } = await api.exercise.fetchCoachExercises({ page, limit: rows, search });

        setExercises(data?.items || []);
        setTotalRecords(data?.total || 0);
        setTotalPages(data?.totalPages || 0);

        const missing =
          data?.items?.filter((e: any) => !e.multimedia || !e.exerciseType || !e.description || !e.equipmentNeeded) ||
          [];
        setMissingExercises(missing || []);
      } catch (error: any) {
        showToast('error', 'Error', error.message || 'Error al cargar ejercicios');
      } finally {
        setLoading(false);
      }
    },
    [coach, currentPage, limit, searchTerm, showToast]
  );

  useEffect(() => {
    loadExercises();
  }, [coach, refreshKey]);

  // Manejar cambio de página
  const onPageChange = useCallback(
    (event: any) => {
      const newPage = event.page + 1; // PrimeReact usa base 0, la API usa base 1
      const newLimit = event.rows;

      setCurrentPage(newPage);
      setLimit(newLimit);
      loadExercises(newPage, newLimit, searchTerm);
    },
    [searchTerm, loadExercises]
  );

  // Manejar búsqueda global
  const onGlobalFilterChange = useCallback(
    (value: string) => {
      setSearchTerm(value || '');
      setCurrentPage(1); // Resetear a la primera página al buscar
      loadExercises(1, limit, value || '');
    },
    [limit, loadExercises]
  );

  useEffect(() => {
    const loadExerciseProperties = async () => {
      const [
        categories,
        contractions,
        difficulties,
        equipments,
        movementPatterns,
        movementPlanes,
        muscles,
        unilateralTypes,
        variants
      ] = await Promise.all([
        api.exercise.fetchCategories(),
        api.exercise.fetchContractions(),
        api.exercise.fetchDifficulties(),
        api.exercise.fetchEquipments(),
        api.exercise.fetchMovementPatterns(),
        api.exercise.fetchMovementPlanes(),
        api.exercise.fetchMuscles(),
        api.exercise.fetchUnilateralTypes(),
        api.exercise.fetchVariants()
      ]);

      setCategories(categories.data || []);
      setContractions(contractions.data || []);
      setDifficulties(difficulties.data || []);
      setEquipments(equipments.data || []);
      setMovementPatterns(movementPatterns.data || []);
      setMovementPlanes(movementPlanes.data || []);
      setMuscles(muscles.data || []);
      setUnilateralTypes(unilateralTypes.data || []);
      setVariants(variants.data || []);
    };
    loadExerciseProperties();
  }, []);

  const openCreateExerciseDialog = useCallback(() => {
    setDialogMode('create');
    setNewExercise({
      id: 0,
      name: '',
      createdByCoach: false,
      createdByAdmin: false,
      multimedia: '',
      category: null,
      variant: null,
      contractionType: null,
      difficultyLevel: null,
      movementPlane: null,
      unilateralType: null,
      movementPattern: null,
      regressionExercise: null,
      progressionExercise: null,
      equipments: [],
      muscles: [],
      coach: null
    });
    setExerciseDialogVisible(true);
  }, []);

  const openEditExerciseDialog = useCallback((exercise: any) => {
    setDialogMode('edit');
    setNewExercise(exercise);
    setExerciseDialogVisible(true);
  }, []);

  const closeExerciseDialog = useCallback(() => {
    setNewExercise({
      id: 0,
      name: '',
      createdByCoach: false,
      createdByAdmin: false,
      multimedia: '',
      category: null,
      variant: null,
      contractionType: null,
      difficultyLevel: null,
      movementPlane: null,
      unilateralType: null,
      movementPattern: null,
      regressionExercise: null,
      progressionExercise: null,
      equipments: [],
      muscles: [],
      coach: null
    });
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
        // Mapear equipmentIds desde IExerciseEquipment[] o IEquipment[]
        const equipmentIds: number[] = [];
        if (exercise.equipments && Array.isArray(exercise.equipments)) {
          exercise.equipments.forEach((eq: any) => {
            if (typeof eq === 'object' && eq.equipment && eq.equipment.id) {
              equipmentIds.push(eq.equipment.id);
            } else if (typeof eq === 'object' && eq.id) {
              equipmentIds.push(eq.id);
            } else if (typeof eq === 'number') {
              equipmentIds.push(eq);
            }
          });
        }

        // Mapear muscleIds desde IExerciseMuscle[] o IMuscle[]
        const muscleIds: number[] = [];
        if (exercise.muscles && Array.isArray(exercise.muscles)) {
          exercise.muscles.forEach((m: any) => {
            if (typeof m === 'object' && m.muscle && m.muscle.id) {
              muscleIds.push(m.muscle.id);
            } else if (typeof m === 'object' && m.id) {
              muscleIds.push(m.id);
            } else if (typeof m === 'number') {
              muscleIds.push(m);
            }
          });
        }

        return {
          id: exercise.id,
          name: exercise.name || '',
          multimedia: exercise.multimedia || '',
          categoryId: exercise.category?.id ?? null,
          variantId: exercise.variant?.id ?? null,
          contractionTypeId: exercise.contractionType?.id ?? null,
          difficultyLevelId: exercise.difficultyLevel?.id ?? null,
          movementPlaneId: exercise.movementPlane?.id ?? null,
          unilateralTypeId: exercise.unilateralType?.id ?? null,
          movementPatternId: exercise.movementPattern?.id ?? null,
          regressionExerciseId: exercise.regressionExercise?.id ?? null,
          progressionExerciseId: exercise.progressionExercise?.id ?? null,
          equipmentIds: equipmentIds.length > 0 ? equipmentIds : null,
          muscleIds: muscleIds.length > 0 ? muscleIds : null,
          createdByCoach: exercise.createdByCoach ?? false,
          createdByAdmin: exercise.createdByAdmin ?? false
        };
      });

      // Usar api.exercise.updateExercise para cada ejercicio
      await Promise.all(formatted.map((exercise: any) => api.exercise.updateExercise(exercise.id, exercise)));

      setModifiedExercises({});
      setIsEditingExercises(false);
      setOriginalExercisesForEdit(exercises);
      setRefreshKey((k) => k + 1);
      showToast('success', 'Éxito', 'Ejercicios actualizados correctamente');
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
    const missingFields = ['multimedia', 'category'].filter((field) => !rowData[field]);
    return missingFields.length > 0;
  }, []);

  // Editores
  const textEditor = useCallback((options: any) => {
    return options.value || '';
  }, []);

  const dropdownEditor = useCallback(
    (options: any, dataOptions: any[]) => {
      return {
        value: options.value,
        options: dataOptions,
        onChange: (selectedValue: any) => {
          const selectedItem = selectedValue ? dataOptions.find((item: any) => item.id === selectedValue) : null;
          options.editorCallback(selectedItem);
          const updatedOptions = { ...options, value: selectedItem };
          debouncedSaveExercise(updatedOptions);
        }
      };
    },
    [debouncedSaveExercise]
  );

  const multiSelectEditor = useCallback(
    (options: any, dataOptions: any[]) => {
      // Extraer IDs desde IExerciseEquipment[] o IExerciseMuscle[]
      let selectedIds: number[] = [];
      if (options.value && Array.isArray(options.value)) {
        selectedIds = options.value
          .map((item: any) => {
            if (typeof item === 'object' && item.equipment && item.equipment.id) {
              return item.equipment.id;
            }
            if (typeof item === 'object' && item.muscle && item.muscle.id) {
              return item.muscle.id;
            }
            if (typeof item === 'object' && item.id) {
              return item.id;
            }
            return item;
          })
          .filter(Boolean);
      }

      return {
        value: selectedIds,
        options: dataOptions,
        onChange: (selectedIds: number[]) => {
          const selectedItems = selectedIds
            .map((id: number) => dataOptions.find((item: any) => item.id === id))
            .filter(Boolean);
          options.editorCallback(selectedItems);
          const updatedOptions = { ...options, value: selectedItems };
          debouncedSaveExercise(updatedOptions);
        }
      };
    },
    [debouncedSaveExercise]
  );

  // Body templates
  const categoryBodyTemplate = useCallback((rowData: any) => {
    return rowData.category?.name || '-';
  }, []);

  const variantBodyTemplate = useCallback((rowData: any) => {
    return rowData.variant?.name || '-';
  }, []);

  const contractionTypeBodyTemplate = useCallback((rowData: any) => {
    return rowData.contractionType?.name || '-';
  }, []);

  const difficultyLevelBodyTemplate = useCallback((rowData: any) => {
    return rowData.difficultyLevel?.name || '-';
  }, []);

  const movementPlaneBodyTemplate = useCallback((rowData: any) => {
    return rowData.movementPlane?.name || '-';
  }, []);

  const unilateralTypeBodyTemplate = useCallback((rowData: any) => {
    return rowData.unilateralType?.name || '-';
  }, []);

  const movementPatternBodyTemplate = useCallback((rowData: any) => {
    return rowData.movementPattern?.name || '-';
  }, []);

  const regressionExerciseBodyTemplate = useCallback((rowData: any) => {
    return rowData.regressionExercise?.name || '-';
  }, []);

  const progressionExerciseBodyTemplate = useCallback((rowData: any) => {
    return rowData.progressionExercise?.name || '-';
  }, []);

  const equipmentsBodyTemplate = useCallback((rowData: any) => {
    if (!rowData.equipments || rowData.equipments.length === 0) return '-';
    return rowData.equipments
      .map((eq: any) => (typeof eq === 'object' && eq.equipment?.name ? eq.equipment.name : eq.name || '-'))
      .join(', ');
  }, []);

  const musclesBodyTemplate = useCallback((rowData: any) => {
    if (!rowData.muscles || rowData.muscles.length === 0) return '-';
    return rowData.muscles
      .map((m: any) => (typeof m === 'object' && m.muscle?.name ? m.muscle.name : m.name || '-'))
      .join(', ');
  }, []);

  return {
    // state
    exercises,
    filters,
    missingExercises,
    isEditingExercises,
    exerciseDialogVisible,
    dialogMode,
    newExercise,
    videoDialogVisible,
    currentVideoUrl,
    loading,
    // pagination state
    currentPage,
    limit,
    totalRecords,
    totalPages,
    searchTerm,
    // setters
    setFilters,
    setIsEditingExercises,
    setOriginalExercisesForEdit,
    setNewExercise,
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
    loadExercises,
    onPageChange,
    onGlobalFilterChange,
    // helpers
    hasMissingData,
    // editores
    textEditor,
    dropdownEditor,
    multiSelectEditor,
    // body templates
    categoryBodyTemplate,
    variantBodyTemplate,
    contractionTypeBodyTemplate,
    difficultyLevelBodyTemplate,
    movementPlaneBodyTemplate,
    unilateralTypeBodyTemplate,
    movementPatternBodyTemplate,
    regressionExerciseBodyTemplate,
    progressionExerciseBodyTemplate,
    equipmentsBodyTemplate,
    musclesBodyTemplate,
    // data
    categories,
    contractions,
    difficulties,
    equipments,
    movementPatterns,
    movementPlanes,
    muscles,
    unilateralTypes,
    variants
  };
}

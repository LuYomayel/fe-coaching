import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../../services/api-client';
import { validateExercisesHaveIds } from '../../schemas/createPlanSchema';
import { useToast } from '../../contexts/ToastContext';
import {
  IPlanExercise,
  IPlanGroup,
  IPlanInfo,
  ISetConfiguration,
  IUpsertWorkoutTemplatePayload,
  IWorkoutTemplateResponse
} from '../../types/workout/plan-state';
import { IExercise } from '../../types/workout/exercise';
import { useNavigate } from 'react-router-dom';

interface UseNewCreatePlanProps {
  coachId?: number;
  planId?: number;
  isTemplate?: boolean;
}

interface UseNewCreatePlanReturn {
  plan: IPlanInfo;
  groups: IPlanGroup[];
  exercises: IExercise[];
  isLoading: boolean;
  isSaving: boolean;

  updatePlanName: (newName: string) => void;
  handleSavePlan: () => Promise<void>;

  updateGroupName: (groupNumber: string | number, newName: string) => void;
  addGroup: () => void;
  removeGroup: (groupId: string | number) => void;

  updateExerciseSelection: (
    groupId: string | number,
    exerciseId: string | number,
    newExerciseId: number | null
  ) => void;
  updateExerciseProperty: (groupId: string | number, exerciseId: string | number, property: string, value: any) => void;
  initializeSetConfiguration: (groupId: string | number, exerciseId: string | number, numberOfSets: number) => void;
  updateSetConfiguration: (
    groupId: string | number,
    exerciseId: string | number,
    setIndex: number,
    property: string,
    value: any
  ) => void;
  toggleSetConfiguration: (groupId: string | number, exerciseId: string | number, enable: boolean) => void;
  addExerciseToGroup: (groupId: string | number) => void;
  removeExerciseFromGroup: (groupId: string | number, exerciseId: string | number) => void;
  addExerciseAtPosition: (groupIndex: number, exerciseIndex: number, above?: boolean) => void;

  hoverRowIndex: number | null;
  showInsertButton: boolean;
  isInsertButtonHovered: boolean;
  insertPosition: 'above' | 'below';
  setHoverRowIndex: (index: number | null) => void;
  setShowInsertButton: (show: boolean) => void;
  setIsInsertButtonHovered: (hovered: boolean) => void;
  setInsertPosition: (position: 'above' | 'below') => void;

  selectedGroup: IPlanGroup | null;
  selectedExercise: IPlanExercise | null;
  setSelectedGroup: (group: IPlanGroup | null) => void;
  setSelectedExercise: (exercise: IPlanExercise | null) => void;

  getExerciseKey: (groupId: string | number, exercise: IPlanExercise) => string;
  setGroups: (updater: IPlanGroup[] | ((prev: IPlanGroup[]) => IPlanGroup[])) => void;

  editingGroupName: number | null;
  setEditingGroupName: (index: number | null) => void;
}

const sanitizeValue = (value: any): string | number | null => {
  if (value === undefined || value === null || value === '') return null;
  return value;
};

const createEmptyExercise = (): IPlanExercise => ({
  id: uuidv4(),
  dragId: uuidv4(),
  exercise: { id: null, name: '' },
  rowIndex: 0,
  sets: '',
  repetitions: '',
  weight: '',
  time: '',
  restInterval: '',
  tempo: '',
  notes: '',
  difficulty: '',
  duration: '',
  distance: '',
  rpe: '',
  setConfiguration: null
});

const createEmptyGroup = (index: number): IPlanGroup => ({
  id: uuidv4(),
  groupNumber: index,
  name: `Grupo ${index}`,
  set: '',
  rest: '',
  isRestPeriod: false,
  restDuration: null,
  exercises: [createEmptyExercise()],
  createdAt: new Date(),
  updatedAt: new Date()
});

const ensureExerciseDragId = (exercise: any): string => {
  if (exercise.dragId) return exercise.dragId;
  if (exercise.id) return `existing-${exercise.id}`;
  return uuidv4();
};

const normalizeGroups = (groups: IPlanGroup[]): IPlanGroup[] =>
  groups.map((group, groupIndex) => ({
    ...group,
    id: group.id ?? uuidv4(),
    groupNumber: groupIndex + 1,
    exercises: (group.exercises || []).map((exercise, exerciseIndex) => ({
      ...exercise,
      id: exercise.id ?? uuidv4(),
      dragId: ensureExerciseDragId(exercise),
      rowIndex: exerciseIndex,
      setConfiguration:
        exercise.setConfiguration && exercise.setConfiguration.length > 0 ? exercise.setConfiguration : null
    }))
  }));

const transformTemplateToState = (
  template: IWorkoutTemplateResponse | null
): { planInfo: IPlanInfo; groupList: IPlanGroup[] } => {
  if (!template) {
    return {
      planInfo: {
        planName: '',
        workoutId: null,
        workoutInstanceTemplateId: null,
        instanceName: '',
        clientFacingName: '',
        personalizedNotes: ''
      },
      groupList: []
    };
  }

  const instance =
    template.workoutInstanceTemplates && template.workoutInstanceTemplates.length > 0
      ? template.workoutInstanceTemplates[0]
      : null;

  const groupsFromTemplate =
    instance?.groups?.slice().sort((a, b) => (a.groupNumber ?? 0) - (b.groupNumber ?? 0)) ?? [];

  const mappedGroups: IPlanGroup[] = groupsFromTemplate.map((group) => {
    const exercises = group.exercises?.slice().sort((a, b) => (a.rowIndex ?? 0) - (b.rowIndex ?? 0)) ?? [];

    return {
      id: group.id ?? uuidv4(),
      name: group.name ?? '',
      groupNumber: group.groupNumber ?? 0,
      set: group.set ?? '',
      rest: group.rest ?? '',
      isRestPeriod: group.isRestPeriod ?? false,
      restDuration: group.restDuration ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      exercises: exercises.map((exercise) => ({
        id: exercise.id ?? uuidv4(),
        dragId: `existing-${exercise.id ?? uuidv4()}`,
        exercise: exercise.exercise
          ? {
              id: exercise.exercise.id,
              name: exercise.exercise.name
            }
          : { id: null, name: '' },
        rowIndex: exercise.rowIndex ?? 0,
        sets: exercise.sets ?? '',
        repetitions: exercise.repetitions ?? '',
        weight: exercise.weight ?? '',
        time: exercise.time ?? '',
        restInterval: exercise.restInterval ?? '',
        tempo: exercise.tempo ?? '',
        notes: exercise.notes ?? '',
        difficulty: exercise.difficulty ?? '',
        duration: exercise.duration ?? '',
        distance: exercise.distance ?? '',
        rpe: '',
        setConfiguration:
          exercise.setConfiguration && exercise.setConfiguration.length > 0 ? exercise.setConfiguration : null
      }))
    };
  });

  return {
    planInfo: {
      planName: template.planName ?? '',
      workoutId: template.id ?? null,
      workoutInstanceTemplateId: instance?.id ?? null,
      instanceName: instance?.instanceName ?? template.planName ?? '',
      clientFacingName: instance?.clientFacingName ?? instance?.instanceName ?? template.planName ?? '',
      personalizedNotes: instance?.personalizedNotes ?? ''
    },
    groupList: normalizeGroups(mappedGroups)
  };
};

export const useNewCreatePlan = ({
  coachId,
  planId,
  isTemplate = true
}: UseNewCreatePlanProps = {}): UseNewCreatePlanReturn => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<IPlanInfo>({
    planName: '',
    workoutId: null,
    workoutInstanceTemplateId: null,
    instanceName: '',
    clientFacingName: '',
    personalizedNotes: ''
  });
  const [groupsState, setGroupsState] = useState<IPlanGroup[]>(() => normalizeGroups([createEmptyGroup(1)]));
  const [exercises, setExercises] = useState<IExercise[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [hoverRowIndex, setHoverRowIndex] = useState<number | null>(null);
  const [showInsertButton, setShowInsertButton] = useState(false);
  const [isInsertButtonHovered, setIsInsertButtonHovered] = useState(false);
  const [insertPosition, setInsertPosition] = useState<'above' | 'below'>('below');

  const [selectedGroup, setSelectedGroup] = useState<IPlanGroup | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<IPlanExercise | null>(null);

  const [editingGroupName, setEditingGroupName] = useState<number | null>(null);

  const getExerciseKey = useCallback(
    (groupId: string | number, exercise: IPlanExercise) => exercise.dragId ?? `${groupId}::${exercise.id}`,
    []
  );

  const setGroups = useCallback((updater: IPlanGroup[] | ((prev: IPlanGroup[]) => IPlanGroup[])) => {
    setGroupsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return normalizeGroups(next);
    });
  }, []);

  // Load exercises
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const { data } = await api.exercise.fetchCoachExercises();
        setExercises(data ?? []);
      } catch (error) {
        console.error('Error fetching exercises', error);
        showToast('error', 'Error', 'No se pudieron cargar los ejercicios');
      }
    };

    loadExercises();
  }, []);

  // Load plan if planId exists
  useEffect(() => {
    if (!planId) {
      setPlan({
        planName: '',
        workoutId: null,
        workoutInstanceTemplateId: null,
        instanceName: '',
        clientFacingName: '',
        personalizedNotes: ''
      });
      setGroupsState(normalizeGroups([createEmptyGroup(1)]));
      return;
    }

    const loadPlan = async () => {
      try {
        setIsLoading(true);
        const response = await api.workout.fetchWorkoutTemplate(planId);
        const template = response?.data as IWorkoutTemplateResponse;
        const { planInfo, groupList } = transformTemplateToState(template);
        setPlan(planInfo);
        setGroupsState(groupList.length > 0 ? groupList : normalizeGroups([createEmptyGroup(1)]));
      } catch (error) {
        console.error('Error fetching workout template', error);
        showToast('error', 'Error', 'No se pudo cargar el plan');
      } finally {
        setIsLoading(false);
      }
    };

    loadPlan();
  }, [planId]);

  // Sync selected exercise with groups state
  useEffect(() => {
    if (selectedGroup && selectedExercise) {
      const currentGroup = groupsState.find((group) => group.id === selectedGroup.id);
      if (!currentGroup) return;
      const currentExercise = currentGroup.exercises.find((exercise) => exercise.id === selectedExercise.id);
      if (currentExercise) {
        setSelectedExercise(currentExercise);
      }
    }
  }, [groupsState, selectedGroup, selectedExercise]);

  const updatePlanName = (newName: string) => {
    setPlan((prev) => ({
      ...prev,
      planName: newName,
      instanceName: prev.instanceName || newName,
      clientFacingName: prev.clientFacingName || newName
    }));
  };

  const updateGroupName = (groupNumber: string | number, newName: string) => {
    setGroups((prev) => prev.map((group) => (group.groupNumber === groupNumber ? { ...group, name: newName } : group)));
  };

  const updateExerciseSelection = (
    groupId: string | number,
    exerciseId: string | number,
    newExerciseId: number | null
  ) => {
    if (newExerciseId === null || newExerciseId === undefined) {
      setGroups((prev) =>
        prev.map((group) =>
          group.id !== groupId
            ? group
            : {
                ...group,
                exercises: group.exercises.map((exercise) =>
                  exercise.id === exerciseId
                    ? {
                        ...exercise,
                        exercise: { id: null, name: '' }
                      }
                    : exercise
                )
              }
        )
      );
      return;
    }

    const exercisesData: any = exercises;
    const newExerciseOption = (exercisesData?.data ?? exercisesData)?.find?.(
      (ex: IExercise) => ex.id === newExerciseId
    );
    if (!newExerciseOption) return;

    setGroups((prev) =>
      prev.map((group) =>
        group.id !== groupId
          ? group
          : {
              ...group,
              exercises: group.exercises.map((exercise) =>
                exercise.id === exerciseId
                  ? {
                      ...exercise,
                      exercise: { id: newExerciseOption.id, name: newExerciseOption.name }
                    }
                  : exercise
              )
            }
      )
    );
  };

  const updateExerciseProperty = (
    groupId: string | number,
    exerciseId: string | number,
    property: string,
    value: any
  ) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id !== groupId
          ? group
          : {
              ...group,
              exercises: group.exercises.map((exercise) =>
                exercise.id === exerciseId ? { ...exercise, [property]: value } : exercise
              )
            }
      )
    );
  };

  const initializeSetConfiguration = (groupId: string | number, exerciseId: string | number, numberOfSets: number) => {
    const setConfig: ISetConfiguration[] = Array.from({ length: parseInt(String(numberOfSets), 10) || 0 }, (_, i) => ({
      setNumber: (i + 1) as number,
      repetitions: '',
      weight: '',
      time: '',
      restInterval: '',
      tempo: '',
      notes: '',
      difficulty: '',
      duration: '',
      distance: ''
    }));

    setGroups((prev) =>
      prev.map((group) =>
        group.id !== groupId
          ? group
          : {
              ...group,
              exercises: group.exercises.map((exercise) =>
                exercise.id === exerciseId ? { ...exercise, setConfiguration: setConfig } : exercise
              )
            }
      )
    );
  };

  const updateSetConfiguration = (
    groupId: string | number,
    exerciseId: string | number,
    setIndex: number,
    property: string,
    value: any
  ) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id !== groupId
          ? group
          : {
              ...group,
              exercises: group.exercises.map((exercise) => {
                if (exercise.id === exerciseId && exercise.setConfiguration) {
                  const newSetConfig = [...exercise.setConfiguration];
                  newSetConfig[setIndex] = {
                    ...newSetConfig[setIndex],
                    [property]: value
                  };
                  return { ...exercise, setConfiguration: newSetConfig };
                }
                return exercise;
              })
            }
      )
    );
  };

  const toggleSetConfiguration = (groupId: string | number, exerciseId: string | number, enable: boolean) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id !== groupId
          ? group
          : {
              ...group,
              exercises: group.exercises.map((exercise) => {
                if (exercise.id !== exerciseId) return exercise;
                if (enable) {
                  const numberOfSets = parseInt(String(exercise.sets), 10) || 3;
                  const setConfig: ISetConfiguration[] = Array.from({ length: numberOfSets }, (_, i) => ({
                    setNumber: (i + 1) as number,
                    repetitions: exercise.repetitions || '',
                    weight: '',
                    time: '',
                    restInterval: '',
                    tempo: '',
                    notes: '',
                    difficulty: '',
                    duration: '',
                    distance: ''
                  }));
                  return {
                    ...exercise,
                    sets: exercise.sets || String(numberOfSets),
                    setConfiguration: setConfig
                  };
                }
                return { ...exercise, setConfiguration: null };
              })
            }
      )
    );
  };

  const addGroup = () => {
    setGroups((prev) => [...prev, createEmptyGroup(prev.length + 1)]);
  };

  const removeGroup = (groupId: string | number) => {
    setGroups((prev) => prev.filter((group) => group.id !== groupId));
  };

  const addExerciseToGroup = (groupId: string | number) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, exercises: [...group.exercises, createEmptyExercise()] } : group
      )
    );
  };

  const removeExerciseFromGroup = (groupId: string | number, exerciseId: string | number) => {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        const filtered = group.exercises.filter((exercise) => exercise.id !== exerciseId);
        const nextExercises = filtered.length > 0 ? filtered : [createEmptyExercise()];
        return {
          ...group,
          exercises: nextExercises
        };
      })
    );
  };

  const addExerciseAtPosition = (groupIndex: number, exerciseIndex: number, above = false) => {
    setGroups((prev) => {
      const targetGroup = prev[groupIndex];
      if (!targetGroup) return prev;

      const newExercise = createEmptyExercise();
      const newExercises = [...targetGroup.exercises];
      const insertIndex = above ? exerciseIndex : exerciseIndex + 1;
      newExercises.splice(insertIndex, 0, newExercise);

      return prev.map((group, idx) => (idx === groupIndex ? { ...group, exercises: newExercises } : group));
    });

    setHoverRowIndex(null);
    setShowInsertButton(false);
  };

  const buildPayload = (): IUpsertWorkoutTemplatePayload => {
    groupsState.forEach((group) => {
      if (group.isRestPeriod) return;
      else if (group.exercises.length === 0) throw new Error('Cada grupo debe tener al menos un ejercicio');
    });
    const normalizedGroups = groupsState.map((group, groupIndex) => {
      const exercisesPayload = group.isRestPeriod
        ? []
        : group.exercises.map((exercise, exerciseIndex) => {
            const exerciseIdRaw = exercise.exercise?.id;
            const parsedExerciseId =
              exerciseIdRaw === null || exerciseIdRaw === undefined ? null : Number(exerciseIdRaw);

            if (parsedExerciseId === null) {
              throw new Error('Cada ejercicio debe estar seleccionado antes de guardar.');
            }

            if (Number.isNaN(parsedExerciseId)) {
              throw new Error(
                'Algunos ejercicios nuevos aún no fueron guardados en la librería. Guardalos antes de asignarlos al plan.'
              );
            }

            return {
              id: typeof exercise.id === 'number' ? exercise.id : undefined,
              rowIndex: exerciseIndex,
              exercise: {
                id: parsedExerciseId,
                name: exercise.exercise?.name ?? ''
              },
              repetitions: sanitizeValue(exercise.repetitions) as string | null,
              sets: sanitizeValue(exercise.sets) as string | null,
              time: sanitizeValue(exercise.time) as string | null,
              weight: sanitizeValue(exercise.weight) as string | null,
              restInterval: sanitizeValue(exercise.restInterval) as string | null,
              tempo: sanitizeValue(exercise.tempo) as string | null,
              notes: sanitizeValue(exercise.notes) as string | null,
              difficulty: sanitizeValue(exercise.difficulty) as string | null,
              duration: sanitizeValue(exercise.duration) as string | null,
              distance: sanitizeValue(exercise.distance) as string | null,
              setConfiguration:
                exercise.setConfiguration && exercise.setConfiguration.length > 0
                  ? exercise.setConfiguration.map((config, idx) => ({
                      ...config,
                      setNumber: config.setNumber ?? idx + 1
                    }))
                  : null
            };
          });

      return {
        groupNumber: groupIndex + 1,
        name: group.name ?? `Grupo ${groupIndex + 1}`,
        set: sanitizeValue(group.set) as string | number | null,
        rest: sanitizeValue(group.rest) as string | number | null,
        isRestPeriod: !!group.isRestPeriod,
        restDuration: group.isRestPeriod ? (sanitizeValue(group.restDuration) as number | null) : null,
        exercises: exercisesPayload
      };
    });

    const workoutPayload: IUpsertWorkoutTemplatePayload['workout'] = {
      planName: plan.planName
    };

    if (plan.workoutId) {
      workoutPayload.id = plan.workoutId;
    }

    if (plan.workoutInstanceTemplateId) {
      workoutPayload.workoutInstanceTemplates = [{ id: plan.workoutInstanceTemplateId }];
    }

    if (!plan.workoutId && coachId) {
      workoutPayload.coach = { id: coachId };
    }

    return {
      workout: workoutPayload,
      instanceName: plan.instanceName ?? '',
      clientFacingName: plan.clientFacingName ?? '',
      personalizedNotes: plan.personalizedNotes ?? '',
      groups: normalizedGroups,
      isTemplate,
      coachId
    };
  };

  const handleSavePlan = async () => {
    if (!plan.planName || !plan.planName.trim()) {
      showToast('warn', 'Campos incompletos', 'El plan debe tener un nombre');
      return;
    }

    if (!groupsState.length) {
      showToast('warn', 'Campos incompletos', 'El plan debe tener al menos un grupo');
      return;
    }

    if (!plan.workoutId && !coachId) {
      showToast('error', 'Error', 'No se identificó el coach para asociar el plan.');
      return;
    }

    const validation = validateExercisesHaveIds(groupsState);
    if (!validation.valid) {
      showToast('warn', 'Ejercicio sin seleccionar', `Seleccioná un ejercicio para "${validation.exerciseName}"`);
      return;
    }

    try {
      const payload = buildPayload();
      setIsSaving(true);

      const { data } = await api.workout.createOrUpdateWorkoutTemplate(payload);
      if (!data) {
        showToast('error', 'Error', 'No se pudo guardar el plan');
        return;
      }
      const { planInfo, groupList } = transformTemplateToState(data as IWorkoutTemplateResponse);
      setPlan(planInfo);
      setGroupsState(groupList.length > 0 ? groupList : normalizeGroups([createEmptyGroup(1)]));
      setTimeout(() => {
        navigate('/coach/plans');
      }, 1000);
      showToast('success', 'Plan guardado', 'El plan se guardó correctamente');
    } catch (error: any) {
      console.error('Error saving workout template', error);
      const detail =
        error?.message || error?.response?.data?.message || 'Ocurrió un error inesperado al guardar el plan';
      showToast('error', 'Error', detail);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    plan,
    groups: groupsState,
    exercises,
    isLoading,
    isSaving,

    updatePlanName,
    handleSavePlan,

    updateGroupName,
    addGroup,
    removeGroup,

    updateExerciseSelection,
    updateExerciseProperty,
    editingGroupName,
    setEditingGroupName,
    initializeSetConfiguration,
    updateSetConfiguration,
    toggleSetConfiguration,
    addExerciseToGroup,
    removeExerciseFromGroup,
    addExerciseAtPosition,

    hoverRowIndex,
    showInsertButton,
    isInsertButtonHovered,
    insertPosition,
    setHoverRowIndex,
    setShowInsertButton,
    setIsInsertButtonHovered,
    setInsertPosition,

    selectedGroup,
    selectedExercise,
    setSelectedGroup,
    setSelectedExercise,

    getExerciseKey,
    setGroups
  };
};

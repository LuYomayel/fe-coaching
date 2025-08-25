import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useSearchParams, usePathname } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card } from 'primereact/card';
import { InputTextarea } from 'primereact/inputtextarea';
import {
  createAndAssignWorkout,
  fetchWorkoutInstance,
  fetchWorkoutInstanceTemplate,
  submitPlan
} from '../services/workoutService';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { useIntl, FormattedMessage } from 'react-intl'; // Agregar este import
import '../styles/CreatePlan.css';
import { FaGripVertical } from 'react-icons/fa'; // Importa el ícono de "handle"
import { useTheme } from '../utils/ThemeContext';
import { extractYouTubeVideoId } from '../utils/UtilFunctions';
import { fetchCoachExercises, createExercises } from '../services/exercisesService';
import { InputNumber } from 'primereact/inputnumber';
import { ButtonGroup } from 'primereact/buttongroup';
import VideoDialog from '../dialogs/VideoDialog';
import {
  IExercise,
  IExerciseGroup,
  IWorkout,
  IWorkoutTemplate,
  IWorkoutInstance,
  IWorkoutInstanceTemplate,
  ExerciseInstanceDto,
  EUserType,
  ICoach,
  IUser
} from '../types/shared-types';
import { useUserSettings } from '../hooks/useUserSettings';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useRouter } from 'next/navigation';
import { UserContextType } from '../types/shared-types';
import { authService } from '@/services/authService';

// Types usando utility types de TypeScript - mucho más limpio!
type CreatePlanExercise = IExercise & {
  isTemporary?: boolean;
};

type CreatePlanExerciseInstance = Omit<ExerciseInstanceDto, 'group'> & {
  id: string | number;
  exercise: CreatePlanExercise;
  // Permitir null en las propiedades de ejercicio
  sets?: string | null;
  repetitions?: string | null;
  time?: string | null;
  weight?: string | null;
  restInterval?: string | null;
  tempo?: string | null;
  difficulty?: string | null;
  duration?: string | null;
  distance?: string | null;
};

type CreatePlanGroup = Partial<
  Omit<IExerciseGroup, 'workoutInstance' | 'exercises' | 'createdAt' | 'updatedAt' | 'deletedAt'>
> & {
  groupNumber: number;
  exercises: CreatePlanExerciseInstance[];
};

type CreatePlanState = {
  workout?: Partial<IWorkout>;
  workoutTemplate?: Partial<IWorkoutTemplate>;
  isTemplate: boolean;
  dateAssigned?: string;
  dateCompleted?: string;
  expectedEndDate?: string;
  expectedStartDate?: string;
  feedback?: string;
  instanceName?: string;
  isRepeated?: boolean;
  personalizedNotes?: string;
  realEndDate?: string;
  realStartedDate?: string;
  repeatDays?: any[];
  status?: string;
  groups: CreatePlanGroup[];
};

interface PropertyListItem {
  name: string;
  key: string;
  default: boolean;
  suffix: string;
}

interface SelectedExerciseState {
  [groupIndex: number]: CreatePlanExercise | null;
}

interface EditingExerciseState {
  [groupIndex: number]: {
    [exerciseIndex: number]: boolean;
  };
}

interface EditingGroupNameState {
  [groupIndex: number]: boolean;
}

interface CreatePlanProps {
  isEdit?: boolean;
}

const CreatePlan: React.FC<CreatePlanProps> = () => {
  const intl = useIntl();
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [videoDialogVisible, setVideoDialogVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  // Obtener parámetros de query string
  const changeToTemplate = searchParams?.get('changeToTemplate') === 'true';
  const clientId = searchParams?.get('clientId');
  const sessionDate = searchParams?.get('sessionDate');
  const isEdit = searchParams?.get('isEdit') === 'true';
  const isTemplate = searchParams?.get('isTemplate') === 'true';
  console.log('searchParams:', {
    changeToTemplate,
    clientId,
    sessionDate,
    isEdit,
    pathname
  });

  const { propertyUnits } = useUserSettings();
  const propertyList: PropertyListItem[] = [
    {
      name: intl.formatMessage({ id: 'exercise.properties.sets' }),
      key: 'sets',
      default: true,
      suffix: propertyUnits?.sets || ''
    },
    {
      name: intl.formatMessage({ id: 'exercise.properties.reps' }),
      key: 'repetitions',
      default: true,
      suffix: propertyUnits?.repetitions || ''
    },
    {
      name: intl.formatMessage({ id: 'exercise.properties.time' }),
      key: 'time',
      default: false,
      suffix: propertyUnits?.time || ''
    },
    {
      name: intl.formatMessage({ id: 'exercise.properties.weight' }),
      key: 'weight',
      default: false,
      suffix: propertyUnits?.weight || ''
    },
    {
      name: intl.formatMessage({ id: 'exercise.properties.restInterval' }),
      key: 'restInterval',
      default: false,
      suffix: propertyUnits?.restInterval || ''
    },
    {
      name: intl.formatMessage({ id: 'exercise.properties.tempo' }),
      key: 'tempo',
      default: false,
      suffix: propertyUnits?.tempo || ''
    },
    {
      name: intl.formatMessage({ id: 'exercise.properties.difficulty' }),
      key: 'difficulty',
      default: false,
      suffix: propertyUnits?.difficulty || ''
    },
    {
      name: intl.formatMessage({ id: 'exercise.properties.duration' }),
      key: 'duration',
      default: false,
      suffix: propertyUnits?.duration || ''
    },
    {
      name: intl.formatMessage({ id: 'exercise.properties.distance' }),
      key: 'distance',
      default: false,
      suffix: propertyUnits?.distance || ''
    }
  ];
  const router = useRouter();
  const planId = params?.planId as string;
  const userContext = useContext(UserContext) as UserContextType;
  if (!userContext) {
    throw new Error('CreatePlan must be used within a UserProvider');
  }
  const { user, coach } = userContext;
  const showToast = useToast();
  const { setLoading } = useSpinner();
  const { showConfirmationDialog } = useConfirmationDialog();
  const { isDarkMode } = useTheme();
  // Usar hooks de localStorage seguros para Next.js
  const [unsavedPlan, setUnsavedPlan, removeUnsavedPlan] = useLocalStorage<CreatePlanState | null>('unsavedPlan', null);
  const [newExercisesLS, setNewExercisesLS, removeNewExercisesLS] = useLocalStorage<CreatePlanExercise[]>(
    'newExercises',
    []
  );

  const [newExercises, setNewExercises] = useState<CreatePlanExercise[]>([]);
  const [editingExercise, setEditingExercise] = useState<EditingExerciseState>({});
  //const [isTemplate, setIsTemplate] = useState(pathname?.includes('edit-template') || false);
  const [plan, setPlan] = useState<CreatePlanState>(() => {
    const defaultPlan: CreatePlanState = {
      workout: {
        planName: ''
      },
      workoutTemplate: {
        planName: ''
      },
      isTemplate: true,
      dateAssigned: '',
      dateCompleted: '',
      expectedEndDate: '',
      expectedStartDate: '',
      feedback: '',
      instanceName: '',
      isRepeated: false,
      personalizedNotes: '',
      realEndDate: '',
      realStartedDate: '',
      repeatDays: [],
      status: '',
      groups: []
    };

    return unsavedPlan && !isEdit ? unsavedPlan : defaultPlan;
  });

  useEffect(() => {
    // Este if es porque si se esta editando un plan, no se quiere que se guarde en el localStorage
    if (!isEdit) {
      setUnsavedPlan(plan);
    }
  }, [plan, isEdit]);

  const [editingGroupName, setEditingGroupName] = useState<EditingGroupNameState>({});
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<any>({});
  // eslint-disable-next-line
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [exercises, setExercises] = useState<CreatePlanExercise[]>([]);
  const toast = useRef<Toast>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [exerciseCounter, setExerciseCounter] = useState(0);
  const [deletedGroup, setDeletedGroup] = useState<CreatePlanGroup | null>(null);
  const [deletedGroupIndex, setDeletedGroupIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si hay algún ejercicio en modo edición
      if (Object.keys(editingExercise).length > 0) {
        // Buscar si el click fue dentro de un dropdown
        const dropdownClicked = event.target.closest('.p-dropdown, .p-dropdown-panel, .p-dropdown-items-wrapper');

        // Si el click no fue en un dropdown, resetear el estado
        if (!dropdownClicked) {
          setEditingExercise({});
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingExercise]);

  useEffect(() => {
    setIsUploading(isUploading);
  }, [isUploading]);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (isEdit && planId) {
        try {
          const { data } = isTemplate ? await fetchWorkoutInstanceTemplate(planId) : await fetchWorkoutInstance(planId);

          data?.groups?.sort((groupA, groupB) => groupA.groupNumber - groupB.groupNumber);

          // Iterate through each group
          data?.groups?.forEach((group) => {
            // Iterate through each exercise in the group
            group.exercises.forEach((exercise) => {
              // Check and modify the properties
              if (exercise) {
                const properties = [
                  'sets',
                  'repetitions',
                  'tempo',
                  'time',
                  'weight',
                  'restInterval',
                  'difficulty',
                  'duration',
                  'distance'
                ];

                properties.forEach((prop) => {
                  exercise[prop] = exercise[prop] === '' ? null : exercise[prop];
                });
              }
            });
          });

          setPlan(data as CreatePlanState);
        } catch (error) {
          showToast('error', 'Error fetching plan details', `${error.message}`);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPlanDetails();
    // eslint-disable-next-line
  }, [isTemplate]);

  useEffect(() => {
    const cargarEjercicios = async () => {
      try {
        const { data } = await fetchCoachExercises(coach?.id);
        const ejerciciosGuardados = typeof window !== 'undefined' ? localStorage.getItem('newExercises') : null;
        const ejerciciosFiltrados = data?.filter((ejercicio) => ejercicio.exerciseType !== null);

        if (ejerciciosGuardados) {
          const ejerciciosParsed = JSON.parse(ejerciciosGuardados) as IExercise[];

          setExercises([...(ejerciciosFiltrados || []), ...ejerciciosParsed]);
        } else {
          setExercises(ejerciciosFiltrados || []);
        }
      } catch (error) {
        showToast('error', 'Error fetching exercises', `${error.message}`);
      }
    };

    cargarEjercicios();
    // eslint-disable-next-line
  }, [showToast]);

  const addExerciseGroup = () => {
    const newGroup = {
      name: '',
      groupNumber: plan.groups.length + 1,
      exercises: [],
      isRestPeriod: false,
      restDuration: 0
    };
    setPlan({ ...plan, groups: [...plan.groups, newGroup] });
  };

  const addRestPeriod = () => {
    const newGroup = {
      name: intl.formatMessage({ id: 'plan.group.restPeriod' }),
      groupNumber: plan.groups.length + 1,
      exercises: [],
      isRestPeriod: true,
      restDuration: 0
    };
    setPlan({ ...plan, groups: [...plan.groups, newGroup] });
  };

  const removeGroup = (index) => {
    const groupToRemove = plan.groups[index];
    const newGroups = plan.groups.filter((_, idx) => idx !== index);
    newGroups.forEach((group, idx) => {
      group.groupNumber = idx + 1;
    });
    setDeletedGroup(groupToRemove);
    setDeletedGroupIndex(index);
    setPlan({ ...plan, groups: newGroups });
    groupToRemove.name
      ? showToast(
          'info',
          intl.formatMessage({ id: 'plan.group.removed' }),
          intl.formatMessage({ id: 'plan.group.removed.message.name' }, { name: groupToRemove.name })
        )
      : showToast(
          'info',
          intl.formatMessage({ id: 'plan.group.removed' }),
          intl.formatMessage({ id: 'plan.group.removed.message.number' }, { number: groupToRemove.groupNumber })
        );
  };

  const handleUndoDelete = () => {
    if (deletedGroup !== null && deletedGroupIndex !== null) {
      const newGroups = [...plan.groups];
      newGroups.splice(deletedGroupIndex, 0, deletedGroup);
      newGroups.forEach((group, idx) => {
        group.groupNumber = idx + 1;
      });
      setPlan({ ...plan, groups: newGroups });
      setDeletedGroup(null);
      setDeletedGroupIndex(null);
    }
  };

  const clearPlan = () => {
    showConfirmationDialog({
      message: 'Are you sure you want to clear the entire workout plan?',
      header: 'Confirm Clear Plan',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        setPlan({
          workout: {
            planName: '',
            coach: {
              user: {
                id: parseInt(user?.userId || '0')
              }
            }
          } as any,
          isTemplate: true,
          dateAssigned: '',
          dateCompleted: '',
          expectedEndDate: '',
          expectedStartDate: '',
          feedback: '',
          instanceName: '',
          isRepeated: false,
          personalizedNotes: '',
          realEndDate: '',
          realStartedDate: '',
          repeatDays: [],
          status: '',
          groups: []
        });
        localStorage.removeItem('unsavedPlan');
        showToast('info', 'Plan Cleared', 'The workout plan has been cleared');
      },
      reject: () => {}
    });
  };

  const addExercise = (groupIndex) => {
    if (selectedExercise?.[groupIndex]) {
      const newExercise: CreatePlanExerciseInstance = {
        exercise: {
          ...(selectedExercise[groupIndex] as IExercise)
        },
        id: exerciseCounter,
        notes: '',
        sets: propertyList.find((prop) => prop.key === 'sets')?.default ? '' : undefined,
        repetitions: propertyList.find((prop) => prop.key === 'repetitions')?.default ? '' : undefined,
        weight: propertyList.find((prop) => prop.key === 'weight')?.default ? '' : undefined,
        time: propertyList.find((prop) => prop.key === 'time')?.default ? '' : undefined,
        tempo: propertyList.find((prop) => prop.key === 'tempo')?.default ? '' : undefined,
        distance: propertyList.find((prop) => prop.key === 'distance')?.default ? '' : undefined,
        restInterval: propertyList.find((prop) => prop.key === 'restInterval')?.default ? '' : undefined,
        difficulty: propertyList.find((prop) => prop.key === 'difficulty')?.default ? '' : undefined,
        duration: propertyList.find((prop) => prop.key === 'duration')?.default ? '' : undefined
      };
      const newGroups = [...plan.groups];
      newGroups[groupIndex].exercises.push(newExercise);
      setPlan({ ...plan, groups: newGroups });
      setExerciseCounter(exerciseCounter + 1);
      setShowExerciseDialog(false);
      setSelectedExercise((prev: any) => ({ ...prev, [groupIndex]: null }));
    }
  };

  const removeExercise = (groupIndex, exerciseIndex) => {
    const newGroups = [...plan.groups];
    newGroups[groupIndex].exercises.splice(exerciseIndex, 1);
    setPlan({ ...plan, groups: newGroups });
  };

  const openPropertyDialog = (groupIndex, exerciseIndex) => {
    setSelectedGroup(groupIndex);
    setSelectedExercise(exerciseIndex);
    setShowPropertyDialog(true);
  };

  const addProperty = (property) => {
    const newGroups = [...plan.groups];
    if (selectedGroup !== null && selectedExercise !== null) {
      const exercise = newGroups[selectedGroup].exercises[selectedExercise];
      if (!exercise[property.key]) {
        exercise[property.key] = '';
        setPlan({ ...plan, groups: newGroups });
      }
    }
  };

  const removeProperty = (groupIndex, exerciseIndex, propertyKey) => {
    const newGroups = [...plan.groups];
    const exercise = newGroups[groupIndex].exercises[exerciseIndex];
    delete exercise[propertyKey];
    setPlan({ ...plan, groups: newGroups });
  };

  const updatePropertyValue = (groupIndex, exerciseIndex, key, value) => {
    const newGroups = [...plan.groups];
    newGroups[groupIndex].exercises[exerciseIndex][key] = value || 0;
    setPlan({ ...plan, groups: newGroups });
  };

  const updateGroupName = (groupIndex, value) => {
    const newGroups = [...plan.groups];
    newGroups[groupIndex].name = value;
    setPlan({ ...plan, groups: newGroups });
  };

  const editGroupName = (groupIndex) => {
    // Now i need to enable the input text and the buttons without a dialog
    setEditingGroupName((prev: any) => ({ ...prev, [groupIndex]: true }));
  };

  const saveGroupName = (groupIndex) => {
    setEditingGroupName((prev: any) => ({ ...prev, [groupIndex]: false }));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === 'groups' && destination.droppableId === 'groups') {
      // Mover grupos
      const newGroups = Array.from(plan.groups);
      const [movedGroup] = newGroups.splice(source.index, 1);
      newGroups.splice(destination.index, 0, movedGroup);

      // Actualizar el número de grupo
      newGroups.forEach((group, index) => {
        (group as IExerciseGroup).groupNumber = index + 1;
      });

      setPlan({ ...plan, groups: newGroups });
    } else {
      // Mover ejercicios
      const sourceGroupIndex = parseInt(source.droppableId.split('-')[1]);
      const destinationGroupIndex = parseInt(destination.droppableId.split('-')[1]);

      const newGroups = Array.from(plan.groups);
      const [movedExercise] = (newGroups[sourceGroupIndex] as IExerciseGroup).exercises.splice(source.index, 1);
      (newGroups[destinationGroupIndex] as IExerciseGroup).exercises.splice(destination.index, 0, movedExercise);

      // Actualizar el índice de cada ejercicio en ambos grupos
      (newGroups[sourceGroupIndex] as IExerciseGroup).exercises.forEach((exercise, index) => {
        exercise.rowIndex = index;
      });
      (newGroups[destinationGroupIndex] as IExerciseGroup).exercises.forEach((exercise, index) => {
        exercise.rowIndex = index;
      });

      setPlan({ ...plan, groups: newGroups });
    }
  };

  const submitPlanClick = () => {
    if (isTemplate && !plan?.workoutTemplate?.planName?.trim()) {
      showToast('error', 'Error', intl.formatMessage({ id: 'plan.error.nameRequired' }));
      return;
    }

    if (plan.groups.length === 0) {
      showToast('error', 'Error', intl.formatMessage({ id: 'plan.error.groupRequired' }));
      return;
    }

    for (const group of plan.groups) {
      if (!group.isRestPeriod && group.exercises.length === 0) {
        showToast('error', 'Error', intl.formatMessage({ id: 'plan.error.exerciseRequired' }));
        return;
      }

      if (group.isRestPeriod && group.restDuration === 0) {
        showToast('error', 'Error', intl.formatMessage({ id: 'plan.error.restDurationRequired' }));
        return;
      }

      if (!group.isRestPeriod) {
        for (const exercise of group.exercises) {
          if (!exercise.exercise.id) {
            showToast(
              'error',
              'Error',
              intl.formatMessage({ id: 'plan.error.exerciseSelect' }, { name: exercise.exercise.name })
            );
            return;
          }
        }
      }
    }
    let contador = 0;
    if (changeToTemplate) {
      plan.isTemplate = true;
    }
    // Create a clean version of the plan object
    const cleanPlan = JSON.parse(
      JSON.stringify({
        ...plan,
        workout: {
          ...plan.workout,
          planName: plan.workoutTemplate ? plan.workoutTemplate.planName : plan?.workout?.planName || '',
          coach: {
            id: '',
            user: {
              id: user?.userId || ''
            }
          }
        },
        groups: plan.groups.map((group) => {
          return {
            ...group,
            exercises: group.exercises.map((exercise) => {
              return {
                ...exercise,
                rowIndex: contador++,
                exercise: {
                  id: exercise.exercise.id,
                  name: exercise.exercise.name
                }
              };
            })
          };
        })
      })
    );

    console.log(cleanPlan);

    showConfirmationDialog({
      message: intl.formatMessage({
        id: isEdit ? 'plan.dialog.confirmEdit' : 'plan.dialog.confirmCreate'
      }),
      header: intl.formatMessage({
        id: isEdit ? 'plan.edit.title' : 'plan.create.title'
      }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => fetchSubmit(cleanPlan),
      reject: () => {}
    });
  };

  const fetchSubmit = async (cleanPlan) => {
    try {
      if (newExercises.length > 0) {
        const {
          data,
          error: errorCreateExercises,
          message: messageCreateExercises
        } = await createExercises(newExercises);
        setNewExercises([]);
        // Actualizar cleanPlan con los ejercicios recién creados
        cleanPlan.groups = cleanPlan.groups.map((group) => ({
          ...group,
          exercises: group.exercises.map((exercise) => {
            // Buscar si el ejercicio actual corresponde a uno recién creado
            const createdExercise = data?.find(
              // eslint-disable-next-line
              (created) => created.name.toLowerCase() === exercise.exercise.name.toLowerCase()
            );

            if (createdExercise) {
              // Si encontramos coincidencia, actualizamos con el ejercicio creado
              return {
                ...exercise,
                exercise: {
                  id: createdExercise.id,
                  name: createdExercise.name
                }
              };
            }
            return exercise;
          })
        }));
        if (errorCreateExercises) {
          showToast('error', 'Error', messageCreateExercises);
        }
        const { error, message } = await submitPlan(cleanPlan, planId, changeToTemplate ? false : isEdit, isTemplate);
        if (error) {
          showToast('error', 'Error', message);
        }
      } else {
        if (clientId && sessionDate) {
          const { error, message } = await createAndAssignWorkout({
            assignSessionToClientDTO: {
              clientId,
              sessionDate
            },
            createWorkoutDTO: cleanPlan
          });
          if (error) {
            showToast('error', 'Error', message);
          }
        } else {
          const { error, message } = await submitPlan(cleanPlan, planId, changeToTemplate ? false : isEdit, isTemplate);
          if (error) {
            showToast('error', 'Error', message);
          }
        }
      }
      if (isEdit) {
        showToast(
          'success',
          intl.formatMessage({ id: 'coach.plan.success.updated' }),
          intl.formatMessage(
            { id: 'coach.plan.success.updated.message' },
            { name: cleanPlan.instanceName ? cleanPlan.instanceName : cleanPlan.workout.planName }
          )
        );
      } else {
        showToast(
          'success',
          intl.formatMessage({ id: 'coach.plan.success.created' }),
          intl.formatMessage(
            { id: 'coach.plan.success.created.message' },
            { name: cleanPlan.instanceName ? cleanPlan.instanceName : cleanPlan.workout.planName }
          )
        );
      }
      localStorage.removeItem('unsavedPlan');
      localStorage.removeItem('newExercises');
      router.back();
    } catch (error) {
      console.log(error);
      showToast('error', 'Something went wrong!', error.message);
    }
  };

  const handleCreateNewExercise = (groupIndex, exerciseIndex) => {
    // Obtener el texto del filtro del Dropdown
    const filterInput = document.querySelector('.p-dropdown-filter');
    const exerciseName = filterInput ? (filterInput as HTMLInputElement).value : '';

    if (exerciseName) {
      // Crear nuevo ejercicio temporal
      const newExercise = {
        id: Date.now(), // Usar timestamp como número
        name: exerciseName,
        description: '',
        exerciseType: {
          id: 0,
          name: 'OTHER'
        }, // Tipo por defecto
        videoUrl: '',
        isTemporary: true, // Flag para identificar ejercicios temporales
        coachId: coach?.id,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;

      // Actualizar el estado de nuevos ejercicios
      setNewExercises((prevExercises: any) => {
        const updatedExercises = [...prevExercises, newExercise];
        localStorage.setItem('newExercises', JSON.stringify(updatedExercises)); // Guardar en local storage
        return updatedExercises;
      });

      // Actualizar el estado de ejercicios
      setExercises((prevExercises: any) => [...prevExercises, newExercise]);

      // Seleccionar el nuevo ejercicio
      if (exerciseIndex !== null) {
        console.log('groupIndex', groupIndex, exerciseIndex);
        const newGroups = [...plan.groups];
        newGroups[groupIndex].exercises[exerciseIndex].exercise = newExercise;
        setPlan({ ...plan, groups: newGroups });
        setEditingExercise((prev) => ({
          ...prev,
          [groupIndex]: {
            ...prev?.[groupIndex],
            [exerciseIndex]: false
          }
        }));
      } else {
        const newSelectedExercises = { ...selectedExercise };
        newSelectedExercises[groupIndex] = newExercise;
        setSelectedExercise(newSelectedExercises);
      }

      // Mostrar un toast con el nuevo ejercicio
      showToast('info', 'Nuevo ejercicio creado', `Se ha creado el ejercicio: ${exerciseName}`);
    } else {
      showToast('error', 'Error', 'No se pudo obtener el nombre del ejercicio');
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsUploading(true);
      try {
        const planFromImage = await getPlanFromImage(file);

        // Array para almacenar nuevos ejercicios
        setNewExercises([]);

        // Filtramos los grupos y sus ejercicios
        const newGroups = planFromImage.groups.reduce((acc, group) => {
          const exercisesToAdd = group.exercises.map((exercise) => {
            const existingExercise = exercises.find(
              (e) => e.name.toLowerCase() === exercise.exercise.name.toLowerCase()
            );

            if (!existingExercise) {
              // Crear nuevo ejercicio temporal
              const newExercise = {
                id: Date.now(),
                name: exercise.exercise.name,
                description: '',
                exerciseType: {
                  id: 0,
                  name: 'OTHER'
                }, // Tipo por defecto
                videoUrl: '',
                isTemporary: true, // Flag para identificar ejercicios temporales
                coachId: coach?.id,
                createdAt: new Date(),
                updatedAt: new Date()
              } as any;
              setNewExercises((prevExercises: any) => [...prevExercises, newExercise]);
              return {
                ...exercise,
                id: uuidv4(),
                notes: exercise.notes,
                exercise: newExercise
              };
            }

            return {
              ...exercise,
              id: uuidv4(),
              notes: exercise.notes,
              exercise: { ...existingExercise }
            };
          });

          const newGroup = {
            set: group.set,
            rest: group.rest,
            groupNumber: group.groupNumber,
            exercises: exercisesToAdd
          };
          acc.push(newGroup);
          return acc;
        }, []);

        // Actualizamos los grupos en el plan
        planFromImage.groups = newGroups;

        setPlan(() => ({
          isTemplate: true,
          instanceName: '',
          ...planFromImage
        }));
        console.log(planFromImage);
        // Actualizamos el estado de ejercicios con los nuevos
        setExercises((prevExercises: IExercise[]) => [...prevExercises, ...newExercises]);

        // Mostramos un toast con los nuevos ejercicios
        if (newExercises.length > 0) {
          const message = `New exercises to be created: ${newExercises.map((e) => e.name).join(', ')}`;
          showToast('info', 'New exercises detected', message, true);
        }

        showToast('success', 'Plan imported!', 'The workout plan has been imported from the image successfully.');
      } catch (error) {
        showToast('error', 'Error importing plan', error.message, true);
        // Clean up the input
        event.target.value = null;
      } finally {
        event.target.value = null;
        setIsUploading(false);
      }
    }
  };

  const getPlanFromImage = async (imageFile) => {
    // Create a FormData object to send the image file
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('purpose', 'plan_extraction');
    console.log(formData);
    // Set up the API request
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workout/import-plan-from-image`, {
      method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
      //   },
      body: formData
    });

    const data = await response.json();
    // Assuming the API returns the plan object in the response
    if (data.error) {
      throw new Error(data.message);
    }
    return data.data;
  };

  const handleVideoClick = (url) => {
    try {
      const videoId = extractYouTubeVideoId(url);
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      setSelectedVideo(embedUrl);
      setVideoDialogVisible(true);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  };
  return (
    <div className="workout-plan-builder p-4 ">
      <Toast ref={toast} />

      <Card className="mb-4">
        <div className="flex flex-column md:flex-row align-items-center justify-content-between">
          <div className="w-full md:w-6 mb-3 md:mb-0">
            <label htmlFor="plan-name" className="block text-lg font-medium mb-2">
              <FormattedMessage id="plan.name" />
            </label>
            <InputText
              id="plan-name"
              value={
                isTemplate
                  ? plan.workoutTemplate?.planName
                  : plan.instanceName
                    ? plan.instanceName
                    : plan.workout?.planName
              }
              //value={plan.workoutTemplate.planName}
              onChange={(e) => {
                if (isTemplate) {
                  setPlan({ ...plan, workoutTemplate: { ...plan.workoutTemplate, planName: e.target.value } });
                } else {
                  setPlan({ ...plan, instanceName: e.target.value });
                }
              }}
              className="w-full"
            />
          </div>
          <div className="w-full md:w-6 flex justify-content-end">
            <Button
              label={intl.formatMessage({ id: 'plan.buttons.import' })}
              icon="pi pi-upload"
              onClick={() => document.getElementById('image-upload-input')?.click()}
              className="mr-2"
              disabled={isUploading}
              loading={isUploading}
            />
            <input
              type="file"
              id="image-upload-input"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <Button
              label={intl.formatMessage({ id: 'plan.buttons.undoDelete' })}
              icon="pi pi-undo"
              onClick={handleUndoDelete}
              className="p-button-info responsive-button mr-2"
              disabled={!deletedGroup}
            />
            <Button
              label={intl.formatMessage({ id: 'plan.buttons.clearPlan' })}
              icon="pi pi-trash"
              onClick={clearPlan}
              className="p-button-danger"
            />
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <label htmlFor="personalized-notes" className="block text-sm font-medium mb-1">
          <FormattedMessage id="plan.notes" />
        </label>
        <InputTextarea
          rows={1}
          id="personalized-notes"
          value={plan.personalizedNotes ? plan.personalizedNotes : ''}
          onChange={(e) => setPlan({ ...plan, personalizedNotes: e.target.value })}
          className="w-full"
        />
      </Card>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="groups" direction="horizontal" type="group">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: 'flex', overflowX: 'auto' }}>
              {plan.groups.map((group, groupIndex) => (
                <Draggable
                  key={group.id ? `group-${group.id}` : `group-${group.groupNumber}`}
                  draggableId={group.id ? `group-${group.id}` : `group-${group.groupNumber}`}
                  index={groupIndex}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`col-12 md:col-6 lg:col-4 xl:col-3 p-2 ${snapshot.isDragging ? 'opacity-50' : ''}`}
                      style={{
                        ...provided.draggableProps.style,
                        transition: snapshot.isDropAnimating ? 'all 0.3s ease' : undefined
                      }}
                    >
                      <Card className="h-full">
                        <div className="flex justify-content-between align-items-center mb-3">
                          <div className="flex align-items-center">
                            <span {...provided.dragHandleProps}>
                              <FaGripVertical className="mr-2 cursor-pointer" />
                            </span>
                            {group.isRestPeriod ? (
                              <div className="flex flex-c justify-content-between align-items-center">
                                <div>
                                  <h3 className="text-xl m-0">
                                    <FormattedMessage id="plan.group.restPeriod" />
                                  </h3>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-content-between align-items-center">
                                <div className="w-4/5 pr-2">
                                  <h3 className="text-xl m-0">
                                    {editingGroupName?.[groupIndex] ? (
                                      <InputText
                                        value={group.name}
                                        onChange={(e) => updateGroupName(groupIndex, e.target.value)}
                                      />
                                    ) : (
                                      <span>
                                        {group.name ? (
                                          group.name
                                        ) : (
                                          <FormattedMessage
                                            id="plan.group.title"
                                            values={{ number: group.groupNumber }}
                                          />
                                        )}
                                      </span>
                                    )}
                                  </h3>
                                </div>
                                <div className="w-1/5">
                                  {editingGroupName?.[groupIndex] ? (
                                    <Button
                                      icon="pi pi-check"
                                      raised
                                      className="p-button-text"
                                      onClick={() => saveGroupName(groupIndex)}
                                    />
                                  ) : (
                                    <Button
                                      icon="pi pi-pencil"
                                      raised
                                      className="p-button-text"
                                      onClick={() => editGroupName(groupIndex)}
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <Button
                            icon="pi pi-trash"
                            raised
                            className="p-button-danger p-button-text"
                            onClick={() => removeGroup(groupIndex)}
                          />
                        </div>
                        <Droppable droppableId={`group-${groupIndex}`} type="exercise">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="exercise-container"
                              style={
                                !group.isRestPeriod
                                  ? {
                                      minHeight: '50px',
                                      padding: '5px',
                                      border: group.exercises.length === 0 ? '2px dashed #ccc' : 'none',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'stretch',
                                      justifyContent: 'center',
                                      backgroundColor:
                                        group.exercises.length === 0
                                          ? isDarkMode
                                            ? '#2a2a2a'
                                            : '#f9f9f9'
                                          : 'transparent'
                                    }
                                  : {}
                              }
                            >
                              {!group.isRestPeriod && (
                                <>
                                  {group.exercises.length === 0 && (
                                    <span style={{ color: '#999' }}>
                                      {intl.formatMessage({ id: 'plan.group.empty' })}
                                    </span> // Texto visible si está vacío
                                  )}
                                  {group.exercises
                                    .sort((a, b) => (a.rowIndex || 0) - (b.rowIndex || 0))
                                    .map((exercise, exerciseIndex) => (
                                      <Draggable
                                        key={`exercise-${exercise.id}`}
                                        draggableId={`exercise-${exercise.id}`}
                                        index={exerciseIndex}
                                        isDragDisabled={exercise.exercise.isTemporary}
                                      >
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="mb-3 p-2 border-1 border-gray-200 border-round"
                                            style={{
                                              ...provided.draggableProps.style
                                              //width: '100%',
                                            }}
                                          >
                                            <div className="flex justify-content-between align-items-center mb-2">
                                              <div className="flex align-items-center w-full">
                                                <span {...provided.dragHandleProps}>
                                                  <FaGripVertical className="mr-2 cursor-pointer" />
                                                </span>
                                                {editingExercise?.[groupIndex]?.[exerciseIndex] ? (
                                                  <Dropdown
                                                    id={`exercise-dropdown-${groupIndex}-${exerciseIndex}`}
                                                    value={exercise.exercise}
                                                    options={exercises}
                                                    onChange={(e) => {
                                                      // Solo actualizar si hay un valor seleccionado
                                                      // if (e.value) {
                                                      const newGroups = [...plan.groups];
                                                      newGroups[groupIndex].exercises[exerciseIndex].exercise = e.value;
                                                      setPlan({ ...plan, groups: newGroups });
                                                      setEditingExercise((prev) => ({
                                                        ...prev,
                                                        [groupIndex]: {
                                                          ...prev?.[groupIndex],
                                                          [exerciseIndex]: false
                                                        }
                                                      }));
                                                      //}
                                                    }}
                                                    optionLabel="name"
                                                    filter
                                                    filterBy="name,exerciseType"
                                                    filterInputAutoFocus
                                                    resetFilterOnHide
                                                    emptyFilterMessage={
                                                      <Button
                                                        label={intl.formatMessage({ id: 'common.createNew' })}
                                                        icon="pi pi-plus"
                                                        text
                                                        raised
                                                        onClick={() =>
                                                          handleCreateNewExercise(groupIndex, exerciseIndex)
                                                        }
                                                      />
                                                    }
                                                    onShow={() => {
                                                      const filterInput = document.querySelector(`.p-dropdown-filter`);
                                                      console.log(filterInput);
                                                      if (filterInput) {
                                                        (filterInput as HTMLInputElement).focus();
                                                        filterInput.addEventListener(
                                                          'keydown',
                                                          (event: KeyboardEvent) => {
                                                            if (event.key === 'Enter') {
                                                              const emptyMessage =
                                                                document.querySelector(`.p-dropdown-empty-message`);
                                                              if (emptyMessage) {
                                                                handleCreateNewExercise(groupIndex, exerciseIndex);
                                                              }
                                                            }
                                                          }
                                                        );
                                                      }
                                                    }}
                                                    onFilter={(e) => {
                                                      if (
                                                        e.originalEvent instanceof KeyboardEvent &&
                                                        (e.originalEvent as KeyboardEvent).key === 'Enter'
                                                      ) {
                                                        (e.originalEvent as KeyboardEvent).preventDefault();
                                                        handleCreateNewExercise(groupIndex, exerciseIndex);
                                                      }
                                                    }}
                                                    itemTemplate={(option) => {
                                                      console.log('option', option);
                                                      return (
                                                        <div
                                                          className="flex justify-content-between align-items-center w-full"
                                                          style={{ gap: '1rem' }}
                                                        >
                                                          <div className="flex flex-column flex-grow-1">
                                                            <span>{option.name}</span>
                                                            {option.exerciseType && (
                                                              <small className="text-xs">{option.exerciseType}</small>
                                                            )}
                                                          </div>
                                                          <div className="flex align-items-center flex-shrink-0">
                                                            {option.isTemporary && (
                                                              <Button
                                                                icon="pi pi-trash"
                                                                text
                                                                severity="danger"
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  setExercises((prev) =>
                                                                    prev.filter((ex) => ex.id !== option.id)
                                                                  );
                                                                  setNewExercises((prev) =>
                                                                    prev.filter((ex) => ex.id !== option.id)
                                                                  );

                                                                  // Eliminar el ejercicio de todos los grupos donde esté
                                                                  setPlan((prevPlan) => ({
                                                                    ...prevPlan,
                                                                    groups: prevPlan.groups.map((group) => ({
                                                                      ...group,
                                                                      exercises: group.exercises.filter(
                                                                        (ex) =>
                                                                          ex.exercise.id !== option.id &&
                                                                          ex.exercise.name.toLowerCase() !==
                                                                            option.name.toLowerCase()
                                                                      )
                                                                    }))
                                                                  }));
                                                                }}
                                                              />
                                                            )}
                                                          </div>
                                                        </div>
                                                      );
                                                    }}
                                                  />
                                                ) : (
                                                  <h6
                                                    className="text-lg m-0 cursor-pointer"
                                                    onClick={() =>
                                                      setEditingExercise((prev) => ({
                                                        ...prev,
                                                        [groupIndex]: {
                                                          ...prev?.[groupIndex],
                                                          [exerciseIndex]: true
                                                        }
                                                      }))
                                                    }
                                                  >
                                                    {exercise.exercise?.name}
                                                  </h6>
                                                )}
                                              </div>
                                              <div className="flex align-items-center">
                                                {!editingExercise?.[groupIndex]?.[exerciseIndex] && (
                                                  <>
                                                    <ButtonGroup>
                                                      <Button
                                                        icon="pi pi-video"
                                                        text
                                                        raised
                                                        tooltip={intl.formatMessage({ id: 'exercise.video.view' })}
                                                        onClick={() => {
                                                          handleVideoClick(exercise.exercise?.multimedia);
                                                        }}
                                                      />
                                                      <Button
                                                        icon="pi pi-plus"
                                                        text
                                                        raised
                                                        onClick={() => openPropertyDialog(groupIndex, exerciseIndex)}
                                                      />
                                                      <Button
                                                        icon="pi pi-trash"
                                                        className="p-button-danger"
                                                        text
                                                        raised
                                                        onClick={() => removeExercise(groupIndex, exerciseIndex)}
                                                      />
                                                    </ButtonGroup>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                            <div className="grid">
                                              {Object.entries(exercise).map(([key, value]) => {
                                                if (
                                                  key !== 'exercise' &&
                                                  key !== 'id' &&
                                                  value !== null &&
                                                  key !== 'notes' &&
                                                  key !== 'setLogs' &&
                                                  key !== 'rowIndex'
                                                ) {
                                                  return (
                                                    <div key={key} className="col-12 md:col-6 lg:col-6 mb-2">
                                                      <div className="flex flex-column">
                                                        <label className="">
                                                          {propertyList.find((p) => p.key === key)?.name || key}{' '}
                                                          {propertyList.find((p) => p.key === key)?.suffix
                                                            ? `(${propertyList.find((p) => p.key === key)?.suffix})`
                                                            : ''}
                                                        </label>
                                                        <div className="flex align-items-center">
                                                          <InputNumber
                                                            value={exercise[key]}
                                                            onChange={(e) =>
                                                              updatePropertyValue(
                                                                groupIndex,
                                                                exerciseIndex,
                                                                key,
                                                                e.value
                                                              )
                                                            }
                                                            className="w-full"
                                                            suffix={propertyList.find((p) => p.key === key)?.suffix}
                                                          />
                                                          <Button
                                                            icon="pi pi-times"
                                                            raised
                                                            className="p-button-danger p-button-text p-button-sm"
                                                            onClick={() =>
                                                              removeProperty(groupIndex, exerciseIndex, key)
                                                            }
                                                          />
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              })}
                                            </div>
                                            <div className="mt-2">
                                              <label
                                                htmlFor={`exercise-${exercise.id}-notes`}
                                                className="block text-sm font-medium mb-1"
                                              >
                                                <FormattedMessage id="plan.exercise.notes" />
                                              </label>
                                              <InputTextarea
                                                id={`exercise-${exercise.id}-notes`}
                                                value={exercise.notes ? exercise.notes : ''}
                                                onChange={(e) =>
                                                  updatePropertyValue(
                                                    groupIndex,
                                                    exerciseIndex,
                                                    'notes',
                                                    e.target.value
                                                  )
                                                }
                                                rows={1}
                                                className="w-full"
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                  {provided.placeholder}
                                </>
                              )}
                            </div>
                          )}
                        </Droppable>
                        {!group.isRestPeriod ? (
                          <div className="flex align-items-center">
                            <div className="w-10 mr-2">
                              <Dropdown
                                id={`exercise-dropdown-${groupIndex}`}
                                value={selectedExercise?.[groupIndex]}
                                options={
                                  exercises.length > 0
                                    ? exercises
                                    : [
                                        {
                                          name: `${intl.formatMessage({ id: 'common.noResults' })}`,
                                          value: null,
                                          exerciseType: null,
                                          disabled: true
                                        }
                                      ]
                                }
                                optionLabel="name"
                                filter
                                filterBy="name"
                                filterInputAutoFocus
                                resetFilterOnHide
                                onChange={(e) => {
                                  if (e.value) {
                                    const newSelectedExercises = { ...selectedExercise };
                                    newSelectedExercises[groupIndex] = e.value;
                                    setSelectedExercise(newSelectedExercises);
                                  }
                                }}
                                placeholder={intl.formatMessage({ id: 'plan.exercise.select' })}
                                className="w-full"
                                onHide={() => {
                                  const dropdown = document.querySelector(`#exercise-dropdown-button-${groupIndex}`);
                                  if (dropdown) {
                                    dropdown.setAttribute('data-p-focus', 'true');
                                    (dropdown as HTMLInputElement).focus();
                                  }
                                }}
                                itemTemplate={(option) => {
                                  return (
                                    <div
                                      className="flex justify-content-between align-items-center w-full"
                                      style={{ gap: '1rem' }}
                                    >
                                      <div className="flex flex-column flex-grow-1">
                                        <span>{option.name}</span>
                                        {option.exerciseType && (
                                          <small className="text-xs">{option.exerciseType.name}</small>
                                        )}
                                      </div>
                                      <div className="flex align-items-center flex-shrink-0">
                                        {option.isTemporary && (
                                          <Button
                                            icon="pi pi-trash"
                                            text
                                            severity="danger"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setExercises((prev) => prev.filter((ex) => ex.id !== option.id));
                                              setNewExercises((prev) => prev.filter((ex) => ex.id !== option.id));

                                              // Eliminar el ejercicio de todos los grupos donde esté
                                              setPlan((prevPlan) => ({
                                                ...prevPlan,
                                                groups: prevPlan.groups.map((group) => ({
                                                  ...group,
                                                  exercises: group.exercises.filter(
                                                    (ex) =>
                                                      ex.exercise.id !== option.id &&
                                                      ex.exercise.name.toLowerCase() !== option.name.toLowerCase()
                                                  )
                                                }))
                                              }));
                                            }}
                                          />
                                        )}
                                      </div>
                                    </div>
                                  );
                                }}
                                emptyFilterMessage={
                                  <Button
                                    label={intl.formatMessage({ id: 'common.createNew' })}
                                    icon="pi pi-plus"
                                    text
                                    raised
                                    onClick={() => handleCreateNewExercise(groupIndex, null)}
                                  />
                                }
                                onShow={() => {
                                  const filterInput = document.querySelector('.p-dropdown-filter');
                                  if (filterInput) {
                                    (filterInput as HTMLInputElement).focus();
                                    filterInput.addEventListener('keydown', (event: KeyboardEvent) => {
                                      if (event.key === 'Enter') {
                                        const emptyMessage = document.querySelector('.p-dropdown-empty-message');
                                        if (emptyMessage) {
                                          handleCreateNewExercise(groupIndex, null); // Llamar a la función para crear un nuevo ejercicio
                                        }
                                      }
                                    });
                                  }
                                }}
                                onFilter={(e) => {
                                  if (
                                    e.originalEvent instanceof KeyboardEvent &&
                                    (e.originalEvent as KeyboardEvent).key === 'Enter'
                                  ) {
                                    e.originalEvent.preventDefault(); // Prevenir el comportamiento por defecto
                                    handleCreateNewExercise(groupIndex, null);
                                  }
                                }}
                                //style={{ height: '40px' }}
                              />
                            </div>
                            <div className="w-1">
                              <Button
                                id={`exercise-dropdown-button-${groupIndex}`}
                                icon="pi pi-plus"
                                raised
                                text
                                onClick={() => addExercise(groupIndex)}
                                style={{
                                  height: '40px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <InputNumber
                              value={group.restDuration}
                              onChange={(e) => {
                                const newGroups = [...plan.groups];
                                newGroups[groupIndex].restDuration = e.value || undefined;
                                setPlan({ ...plan, groups: newGroups });
                              }}
                              suffix={propertyUnits?.restInterval}
                              min={0}
                              placeholder={intl.formatMessage({ id: 'plan.group.restDuration' })}
                            />
                          </div>
                        )}
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              <div className="col-12 md:col-6 lg:col-4 xl:col-3 p-2">
                <Card className="h-full flex justify-content-center align-items-center cursor-pointer">
                  <div className="flex flex-column sm:flex-row gap-2 justify-content-center align-items-center">
                    <Button
                      raised
                      text
                      label={intl.formatMessage({ id: 'plan.group.addGroup' })}
                      icon="pi pi-plus-circle"
                      onClick={addExerciseGroup}
                      className="p-button-text w-full sm:w-auto"
                    />
                    <Button
                      raised
                      text
                      label={intl.formatMessage({ id: 'plan.group.addRest' })}
                      icon="pi pi-plus-circle"
                      onClick={addRestPeriod}
                      className="p-button-text w-full sm:w-auto"
                    />
                  </div>
                </Card>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex justify-content-end mt-2">
        <Button
          label={intl.formatMessage({
            id: isEdit ? 'plan.buttons.editPlan' : 'plan.buttons.createPlan'
          })}
          icon="pi pi-check"
          onClick={submitPlanClick}
          className="p-button-success"
        />
      </div>

      <Dialog
        header={intl.formatMessage({ id: 'plan.exercise.property.add' })}
        draggable={false}
        resizable={false}
        dismissableMask
        visible={showPropertyDialog}
        onHide={() => setShowPropertyDialog(false)}
        className="w-30rem"
      >
        {propertyList.map((property) => (
          <div key={property.key} className="flex justify-content-between align-items-center mb-2">
            <span>{property.name}</span>
            <Button
              icon="pi pi-plus"
              className="p-button-text p-button-sm"
              onClick={() => addProperty(property)}
              disabled={
                plan.groups[selectedGroup || 0]?.exercises[selectedExercise || 0]?.hasOwnProperty(property.key) &&
                plan.groups[selectedGroup || 0]?.exercises[selectedExercise || 0][property.key] !== null
              }
            />
          </div>
        ))}
      </Dialog>

      <VideoDialog visible={videoDialogVisible} onHide={() => setVideoDialogVisible(false)} videoUrl={selectedVideo} />
    </div>
  );
};

export default CreatePlan;

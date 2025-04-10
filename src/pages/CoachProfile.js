import React, { useContext, useEffect, useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { FileUpload } from 'primereact/fileupload';
import { classNames } from 'primereact/utils';
import { UserContext } from '../utils/UserContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { useToast } from '../utils/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
  assignRpeToTarget,
  createOrUpdateRpeMethod,
  deleteRpe,
  fetchTrainingCyclesByCoachId,
  getRpeMethods,
  deleteWorkoutPlan,
  findAllWorkoutTemplatesByCoachId,
  getRpeAssignments,
  removeRpeAssignment
} from '../services/workoutService';
import { fetchCoach, fetchCoachPlans, fetchCoachStudents } from '../services/usersService';
import {
  createOrUpdateCoachPlan,
  fetchCoachSubscription,
  fetchCoachSubscriptionPlans
} from '../services/subscriptionService';
import { useSpinner } from '../utils/GlobalSpinner'; // <- spinner context
import { extractYouTubeVideoId, formatDate, getYouTubeThumbnail, isValidYouTubeUrl } from '../utils/UtilFunctions';
import { MultiSelect } from 'primereact/multiselect';
import { FilterMatchMode } from 'primereact/api';
import * as XLSX from 'xlsx';
import { useIntl, FormattedMessage } from 'react-intl'; // Agregar este import
import {
  createExercise,
  deleteExercise,
  fetchBodyAreas,
  fetchCoachExercises,
  importExercises,
  updateExercise
} from '../services/exercisesService';
import { ProgressBar } from 'primereact/progressbar';
import { Tooltip } from 'primereact/tooltip';
import NewPlanDetailHorizontal from '../dialogs/PlanDetails';
import { ColorPicker } from 'primereact/colorpicker';
import { OverlayPanel } from 'primereact/overlaypanel';
import '../styles/CoachProfile.css'; // Importar los nuevos estilos
import { CreateExerciseDialog } from '../dialogs/CreateExerciseDialog';
const apiUrl = process.env.REACT_APP_API_URL;

// Conjunto de emojis comunes para usar en el selector
const commonEmojis = [
  '😀',
  '😁',
  '😂',
  '🤣',
  '😃',
  '😄',
  '😅',
  '😆',
  '😉',
  '😊',
  '😋',
  '😎',
  '😍',
  '😘',
  '🥰',
  '😗',
  '😙',
  '😚',
  '🙂',
  '🤗',
  '🤩',
  '🤔',
  '🤨',
  '😐',
  '😑',
  '😶',
  '🙄',
  '😏',
  '😣',
  '😥',
  '😮',
  '🤐',
  '😯',
  '😪',
  '😫',
  '🥱',
  '😴',
  '😌',
  '😛',
  '😜',
  '😝',
  '🤤',
  '😒',
  '😓',
  '😔',
  '😕',
  '🙃',
  '🤑',
  '😲',
  '☹️',
  '🙁',
  '😖',
  '😞',
  '😟',
  '😤',
  '😢',
  '😭',
  '😦',
  '😧',
  '😨',
  '😩',
  '🤯',
  '😬',
  '😰',
  '😱',
  '🥵',
  '🥶',
  '😳',
  '🤪',
  '😵',
  '🥴',
  '😠',
  '😡',
  '🤬',
  '😷',
  '🤒',
  '🤕',
  '🤢',
  '🤮',
  '🤧',
  '😇',
  '🥳',
  '🥺',
  '🤠',
  '🤡',
  '🤥',
  '🤫',
  '🤭',
  '🧐',
  '🤓',
  '😈',
  '👹',
  '👺',
  '💀',
  '👻',
  '👽',
  '🤖',
  '💩',
  '😺',
  '😸',
  '😹',
  '😻',
  '😼',
  '��',
  '🙀',
  '😿',
  '😾',
  '🙈',
  '🙉',
  '🙊',
  '💪',
  '👍',
  '👎',
  '👏',
  '🙌',
  '👐',
  '🤲',
  '🤝',
  '🙏',
  '✌️',
  '🤞',
  '🤟',
  '🤘',
  '🤙',
  '👈',
  '👉',
  '👆',
  '🖕',
  '👇',
  '☝️',
  '👋',
  '🤚',
  '🖐️',
  '✋',
  '🖖',
  '👌',
  '✊',
  '👊',
  '🤛',
  '🤜',
  '💅',
  '🚶',
  '🏃',
  '💃',
  '🕺',
  '👨‍❤️‍👨',
  '👩‍❤️‍👩',
  '❤️',
  '🧡',
  '💛',
  '💚',
  '💙',
  '💜',
  '🤎',
  '🖤',
  '🤍',
  '💔',
  '❣️',
  '💕',
  '💞',
  '💓',
  '💗',
  '💖',
  '💘',
  '💝',
  '💟',
  '💌',
  '💤',
  '💢',
  '💣',
  '💥',
  '💦',
  '💨',
  '💫',
  '🦠',
  '🚨',
  '🔥',
  '👑',
  '💯',
  '🏆'
];

export default function CoachProfilePage() {
  const intl = useIntl();
  const [activeIndex, setActiveIndex] = useState(0);
  const { user, coach } = useContext(UserContext);
  const { showConfirmationDialog } = useConfirmationDialog();
  const showToast = useToast();
  const navigate = useNavigate();
  const { setLoading } = useSpinner(); // <- spinner function

  const [isWorkoutsLoading, setIsWorkoutsLoading] = useState(true);
  const [isCoachInfoLoading, setIsCoachInfoLoading] = useState(true);
  const [isExercisesLoading, setIsExercisesLoading] = useState(true);
  // eslint-disable-next-line
  const [isCoachSubscriptionLoading, setIsCoachSubscriptionLoading] = useState(true);
  // eslint-disable-next-line
  const [isCoachPlansLoading, setIsCoachPlansLoading] = useState(true);
  // eslint-disable-next-line
  const [isBodyAreasLoading, setIsBodyAreasLoading] = useState(true);
  // eslint-disable-next-line
  const [isSubscriptionPlansLoading, setIsSubscriptionPlansLoading] = useState(true);
  // State variables
  const [refreshKey, setRefreshKey] = useState(0);

  // Coach info
  const [coachInfo, setCoachInfo] = useState(null); // <- state for coach info

  // Data arrays
  const [workouts, setWorkouts] = useState([]); // <- state for workouts
  const [trainingCycles, setTrainingCycles] = useState([]); // <- state for training cycles
  const [users, setUsers] = useState([]); // <- state for users
  const [coachPlans, setCoachPlans] = useState([]); // <- state for coach plans
  const [subscriptionPlans, setSubscriptionPlans] = useState([]); // <- state for subscription plans
  const [exercises, setExercises] = useState([]); // <- state for exercises
  const [missingExercises, setMissingExercises] = useState([]); // <- state for missing exercises
  const [bodyAreas, setBodyAreas] = useState([]); // <- state for body areas

  // Current plan
  const [currentPlanId, setCurrentPlanId] = useState(null);

  // Modals visibility
  const [exerciseDialogVisible, setExerciseDialogVisible] = useState(false);
  const [createPlanDialogVisible, setCreatePlanDialogVisible] = useState(false);
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [videoDialogVisible, setVideoDialogVisible] = useState(false);

  // Other states
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedBodyAreas, setSelectedBodyAreas] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileUploadRef = useRef(null);
  const fileInputRef = useRef(null);
  const [totalSize, setTotalSize] = useState(0);

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    exerciseType: { value: null, matchMode: FilterMatchMode.CONTAINS },
    description: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });
  // eslint-disable-next-line
  const [numRows, setNumRows] = useState(0);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [newExercise, setNewExercise] = useState({
    name: '',
    description: '',
    multimedia: '',
    exerciseType: '',
    equipmentNeeded: ''
  });
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: 0,
    workoutsPerWeek: 0,
    includeMealPlan: false
  });

  // States for RPE methods
  const [rpeMethods, setRpeMethods] = useState([]);
  const [rpeAssignments, setRpeAssignments] = useState([]);
  const [isRpeLoading, setIsRpeLoading] = useState(false);
  const [rpeDialogVisible, setRpeDialogVisible] = useState(false);
  const [rpeAssignmentDialogVisible, setRpeAssignmentDialogVisible] = useState(false);
  const [newRpe, setNewRpe] = useState({
    name: '',
    minValue: 0,
    maxValue: 10,
    step: 1,
    valuesMeta: []
  });
  const [selectedType, setSelectedType] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedRpe, setSelectedRpe] = useState(null);

  const typeOptions = [
    { label: 'Workout', value: 'workout' },
    { label: 'Training Cycle', value: 'trainingCycle' },
    { label: 'User', value: 'user' }
  ];

  const renderTargetDropdown = () => {
    let options = [];

    if (selectedType === 'workout') {
      options = workouts.map((workout) => ({
        label: workout.planName,
        value: workout.id
      }));
    } else if (selectedType === 'trainingCycle') {
      options = trainingCycles.map((cycle) => ({
        label: cycle.name,
        value: cycle.id
      }));
    } else if (selectedType === 'user') {
      options = users.map((user) => ({
        label: `${user.name}`,
        value: user.id
      }));
    }

    return (
      <Dropdown
        value={selectedTarget}
        options={options}
        onChange={(e) => setSelectedTarget(e.value)}
        placeholder={`Select ${selectedType}`}
        className="w-full"
      />
    );
  };

  const fetchRpeMethods = async () => {
    setIsRpeLoading(true);
    try {
      // Cargar los métodos RPE
      const { data: rpeData } = await getRpeMethods(user.userId);
      setRpeMethods(rpeData);

      // Cargar las asignaciones de RPE
      const { data: assignmentsData } = await getRpeAssignments(user.userId);
      setRpeAssignments(assignmentsData);
    } catch (error) {
      console.error('Error fetching RPE methods', error);
      showToast('error', 'Error', 'Failed to fetch RPE methods');
    } finally {
      setIsRpeLoading(false);
    }
  };

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setIsWorkoutsLoading(true);
        const { data } = await findAllWorkoutTemplatesByCoachId(coach.id);
        setWorkouts(data);
      } catch (error) {
        console.log('error', error);
        showToast('error', 'Error', error.message);
      } finally {
        setIsWorkoutsLoading(false);
      }
    };

    const fetchCoachInfo = async () => {
      try {
        setIsCoachInfoLoading(true);
        const { data } = await fetchCoach(user.userId);
        setCoachInfo(data);
      } catch (error) {
        if (error.message === 'Coach not found') {
          navigate('/complete-coach-profile');
        }
        showToast('error', 'Error', error.message);
      } finally {
        setIsCoachInfoLoading(false);
      }
    };

    const fetchCoachSubscriptionData = async () => {
      try {
        setIsCoachSubscriptionLoading(true);
        const { data } = await fetchCoachSubscription(coach.id);
        setCurrentPlanId(data.subscriptionPlan.id);
      } catch (error) {
        console.log('error', error);
        showToast('error', 'Error', error.message);
      } finally {
        setIsCoachSubscriptionLoading(false);
      }
    };

    const fetchCoachPlansData = async () => {
      try {
        setIsCoachPlansLoading(true);
        const { data } = await fetchCoachPlans(user.userId);

        setCoachPlans(data);
      } catch (error) {
        console.log('error', error);
        showToast('error', 'Error', error.message);
      } finally {
        setIsCoachPlansLoading(false);
      }
    };

    const fetchExercises = async () => {
      try {
        setIsExercisesLoading(true);
        const { data } = await fetchCoachExercises(coach.id);
        if (data.error) {
          throw new Error(data.message || 'Something went wrong');
        }

        const missingExercises = data.filter(
          (exercise) =>
            !exercise.multimedia || !exercise.exerciseType || !exercise.description || !exercise.equipmentNeeded
        );
        setMissingExercises(missingExercises);
        setExercises(data);
      } catch (error) {
        console.error('error', error);
        showToast('error', 'Error', error.message);
      } finally {
        setIsExercisesLoading(false);
      }
    };

    const fetchBodyAreasData = async () => {
      try {
        setIsBodyAreasLoading(true);
        const { data } = await fetchBodyAreas();
        if (data.error) {
          throw new Error(data.message || 'Something went wrong');
        }
        const formattedBodyAreas = data.map((bodyArea) => ({
          label: bodyArea.name,
          value: bodyArea.id
        }));
        setBodyAreas(formattedBodyAreas);
      } catch (error) {
        console.log('error', error);
        showToast('error', 'Error', error.message);
      } finally {
        setIsBodyAreasLoading(false);
      }
    };

    const fetchSubscriptionPlans = async () => {
      try {
        setIsSubscriptionPlansLoading(true);
        const { data } = await fetchCoachSubscriptionPlans();
        setSubscriptionPlans(data);
      } catch (error) {
        console.log('error', error);
        showToast('error', 'Error', error.message);
      } finally {
        setIsSubscriptionPlansLoading(false);
      }
    };

    const fetchClients = async () => {
      try {
        const { data } = await fetchCoachStudents(user.userId);
        const activeClients = data.filter((client) => client.user.subscription.status === 'Active');
        setUsers(activeClients);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    const fetchTrainingPlans = async () => {
      try {
        const { data } = await fetchTrainingCyclesByCoachId(user.userId);
        setTrainingCycles(data);
      } catch (error) {
        console.error('Error fetching training plans:', error);
      }
    };

    fetchWorkouts();
    fetchCoachInfo();
    fetchCoachSubscriptionData();
    fetchCoachPlansData();
    fetchExercises();
    fetchBodyAreasData();
    fetchSubscriptionPlans();
    fetchRpeMethods();
    fetchClients();
    fetchTrainingPlans();
    console.log('Hola');
    // eslint-disable-next-line
  }, [user.userId, showToast, navigate, refreshKey]);

  const handleViewPlanDetails = (workoutInstanceId) => {
    setLoading(true);
    setSelectedPlan(workoutInstanceId);
    setPlanDetailsVisible(true);
  };

  // Handle save RPE method function
  const handleSaveRpeMethod = async () => {
    try {
      setIsRpeLoading(true);
      const response = await createOrUpdateRpeMethod(dialogMode, newRpe, user.userId);
      if (response) {
        showToast(
          'success',
          'Success',
          dialogMode === 'create' ? 'New RPE Method created successfully' : 'RPE Method updated successfully'
        );
        setRpeDialogVisible(false);
        setNewRpe({ name: '', minValue: 0, maxValue: 10, step: 1 });
        fetchRpeMethods();
      } else {
        showToast('error', 'Error', 'RPE Method not created or edited');
      }
    } catch (error) {
      console.log('error', error);
      showToast('error', 'Error', error.message);
    } finally {
      setIsRpeLoading(false);
    }
  };

  const renderHeader = (text) => {
    return (
      <div className="flex justify-content-between align-items-center">
        <div className="flex align-items-center gap-2">
          <h2 className="text-xl font-bold">{text}</h2>
          {text === intl.formatMessage({ id: 'coach.tabs.exercises' }) && missingExercises.length > 0 && (
            <Button
              icon="pi pi-exclamation-triangle"
              className="p-button-danger p-button-text"
              tooltip={intl.formatMessage({ id: 'common.missingData' })}
              tooltipOptions={{ position: 'right' }}
              onClick={() => {
                if (filters.name.value) {
                  // Si ya hay un filtro activo, lo eliminamos
                  setFilters({
                    ...filters,
                    global: {
                      value: null,
                      matchMode: FilterMatchMode.CONTAINS
                    },
                    name: {
                      value: null,
                      matchMode: FilterMatchMode.STARTS_WITH
                    }
                  });
                } else {
                  // Si no hay filtro activo, lo activamos
                  setFilters({
                    ...filters,
                    global: {
                      value: null,
                      matchMode: FilterMatchMode.CONTAINS
                    },
                    name: {
                      value: missingExercises.map((ex) => ex.name),
                      matchMode: FilterMatchMode.IN
                    }
                  });
                }
              }}
              badge={missingExercises.length.toString()}
              badgeClassName="p-badge-danger"
            />
          )}
        </div>
        <div className="flex align-items-center gap-2">
          <Button
            label={intl.formatMessage({ id: 'common.add', defaultMessage: 'Add {item}' }, { item: text.slice(0, -1) })}
            icon="pi pi-plus"
            onClick={() =>
              text === intl.formatMessage({ id: 'coach.tabs.exercises' })
                ? openCreateExerciseDialog()
                : text === intl.formatMessage({ id: 'coach.tabs.workouts' })
                  ? navigate('/plans/create')
                  : openCreatePlanDialog()
            }
          />
        </div>
      </div>
    );
  };

  const missingDataIconTemplate = (rowData) => {
    const missingFields = ['multimedia', 'exerciseType', 'description', 'equipmentNeeded'].filter(
      (field) => !rowData[field]
    );

    return missingFields.length > 0 ? (
      <div>
        <Tooltip target=".custom-target-icon" />
        <i
          className="custom-target-icon pi pi-exclamation-triangle"
          data-pr-tooltip={intl.formatMessage({ id: 'common.missingData' })}
          data-pr-position="right"
          data-pr-at="right+5 top"
          data-pr-my="left center-2"
          style={{ color: 'red', cursor: 'pointer' }}
        />
      </div>
    ) : null;
  };

  const handleDeleteExercise = async (exerciseId) => {
    try {
      const response = await deleteExercise(exerciseId);
      if (response.error) {
        throw new Error(response.message);
      }

      setRefreshKey((old) => old + 1);
      showToast('success', 'Success', 'Exercise deleted successfully');
    } catch (error) {
      console.log('error', error);
      showToast('error', 'Error', error.message);
    }
  };

  const openCreateExerciseDialog = () => {
    setDialogMode('create');
    setNewExercise({
      name: '',
      description: '',
      multimedia: '',
      exerciseType: '',
      equipmentNeeded: ''
    });
    setSelectedBodyAreas([]);
    setExerciseDialogVisible(true);
  };

  const openEditExerciseDialog = (exercise) => {
    setDialogMode('edit');
    setNewExercise(exercise);
    const arrayBodyAreas = exercise.exerciseBodyAreas.map((exerciseBodyArea) => exerciseBodyArea.bodyArea.id);
    setSelectedBodyAreas(arrayBodyAreas);
    setExerciseDialogVisible(true);
  };

  const closeExerciseDialog = () => {
    setNewExercise({
      name: '',
      description: '',
      multimedia: '',
      exerciseType: '',
      equipmentNeeded: ''
    });
    setSelectedBodyAreas([]);
    setExerciseDialogVisible(false);
  };

  const handleSaveExercise = async () => {
    const body = {
      ...newExercise,
      bodyArea: selectedBodyAreas,
      coachId: user.userId
    };

    try {
      if (dialogMode === 'create') {
        const { message } = await createExercise(body);
        if (message !== 'success') {
          throw new Error(message);
        } else {
          showToast('success', 'Success', intl.formatMessage({ id: 'coach.exercise.success.created' }));
        }
      } else {
        const { message } = await updateExercise(newExercise.id, body);
        if (message !== 'success') {
          throw new Error(message);
        } else {
          showToast('success', 'Success', intl.formatMessage({ id: 'coach.exercise.success.updated' }));
        }
      }

      closeExerciseDialog();
      setRefreshKey((old) => old + 1);
    } catch (error) {
      console.log('error', error);
      showToast('error', 'Error', error.message);
    }
  };

  const renderExerciseModal = () => {
    return (
      <Dialog
        draggable={false}
        resizable={false}
        dismissableMask
        header={
          dialogMode === 'create'
            ? intl.formatMessage({ id: 'coach.exercise.create' })
            : intl.formatMessage({ id: 'coach.exercise.edit' })
        }
        className="responsive-dialog"
        visible={exerciseDialogVisible}
        style={{ width: '50vw' }}
        onHide={closeExerciseDialog}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="name">
              {dialogMode === 'create'
                ? intl.formatMessage({ id: 'coach.exercise.name' })
                : intl.formatMessage({ id: 'coach.exercise.name' })}
            </label>
            <InputText
              id="name"
              value={newExercise.name}
              onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="description">{intl.formatMessage({ id: 'coach.exercise.description' })}</label>
            <InputTextarea
              id="description"
              className="overflow-hidden text-overflow-ellipsis"
              value={newExercise.description}
              onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="p-field">
            <label htmlFor="multimedia">{intl.formatMessage({ id: 'coach.exercise.video' })}</label>
            <InputText
              id="multimedia"
              value={newExercise.multimedia}
              onChange={(e) => setNewExercise({ ...newExercise, multimedia: e.target.value })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="exerciseType">{intl.formatMessage({ id: 'coach.exercise.type' })}</label>
            <InputText
              id="exerciseType"
              value={newExercise.exerciseType}
              onChange={(e) => setNewExercise({ ...newExercise, exerciseType: e.target.value })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="equipmentNeeded">{intl.formatMessage({ id: 'coach.exercise.equipment' })}</label>
            <InputText
              id="equipmentNeeded"
              value={newExercise.equipmentNeeded}
              onChange={(e) =>
                setNewExercise({
                  ...newExercise,
                  equipmentNeeded: e.target.value
                })
              }
            />
          </div>
          <div className="p-field">
            <label htmlFor="equipmentNeeded">{intl.formatMessage({ id: 'coach.exercise.bodyArea' })}</label>
            <MultiSelect
              options={bodyAreas}
              filter
              showClear
              required
              placeholder="Select a body area"
              value={selectedBodyAreas}
              onChange={(e) => setSelectedBodyAreas(e.value)}
            />
          </div>
          <div className="p-field">
            <Button
              label={
                dialogMode === 'create'
                  ? intl.formatMessage({ id: 'coach.exercise.create' })
                  : intl.formatMessage({ id: 'coach.exercise.edit' })
              }
              icon="pi pi-check"
              onClick={() => {
                if (newExercise.name === '')
                  return showToast(
                    'error',
                    'Error',
                    intl.formatMessage({
                      id: 'coach.exercise.error.name.empty'
                    })
                  );
                if (!isValidYouTubeUrl(newExercise.multimedia)) {
                  return showToast(
                    'error',
                    'Error',
                    intl.formatMessage({
                      id: 'coach.exercise.error.video.invalid'
                    })
                  );
                }
                showConfirmationDialog({
                  message:
                    dialogMode === 'create'
                      ? intl.formatMessage({
                          id: 'createExercise.confirmation.message'
                        })
                      : intl.formatMessage({
                          id: 'updateExercise.confirmation.message'
                        }),
                  header: intl.formatMessage({ id: 'common.confirmation' }),
                  icon: 'pi pi-exclamation-triangle',
                  accept: () => handleSaveExercise(),
                  reject: () => console.log('Rejected')
                });
              }}
            />
          </div>
        </div>
      </Dialog>
    );
  };

  const renderPlanModal = () => {
    return (
      <Dialog
        draggable={false}
        resizable={false}
        dismissableMask
        header={
          dialogMode === 'create'
            ? intl.formatMessage({ id: 'coach.plan.create' })
            : intl.formatMessage({ id: 'coach.plan.edit' })
        }
        className="responsive-dialog"
        visible={createPlanDialogVisible}
        style={{ width: '50vw' }}
        onHide={closeCreatePlanDialog}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="name">{intl.formatMessage({ id: 'coach.plan.name' })}</label>
            <InputText
              id="name"
              value={newPlan.name}
              onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="price">{intl.formatMessage({ id: 'coach.plan.price' })}</label>
            <InputNumber
              id="price"
              value={newPlan.price}
              onChange={(e) => setNewPlan({ ...newPlan, price: e.value })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="workoutsPerWeek">{intl.formatMessage({ id: 'coach.plan.workoutsPerWeek' })}</label>
            <InputNumber
              id="workoutsPerWeek"
              value={newPlan.workoutsPerWeek}
              onChange={(e) => setNewPlan({ ...newPlan, workoutsPerWeek: e.value })}
            />
          </div>
          <div className="p-field-checkbox">
            <Checkbox
              inputId="includeMealPlan"
              checked={newPlan.includeMealPlan}
              onChange={(e) => setNewPlan({ ...newPlan, includeMealPlan: e.checked })}
            />
            <label htmlFor="includeMealPlan">{intl.formatMessage({ id: 'coach.plan.includeMealPlan' })}</label>
          </div>
          <div className="p-field">
            <Button
              label={
                dialogMode === 'create'
                  ? intl.formatMessage({ id: 'coach.plan.create' })
                  : intl.formatMessage({ id: 'coach.plan.edit' })
              }
              icon="pi pi-check"
              onClick={confirmCreatePlan}
            />
          </div>
        </div>
      </Dialog>
    );
  };

  const renderVideoModal = () => {
    return (
      <Dialog
        draggable={false}
        dismissableMask
        resizable={false}
        header="Video"
        visible={videoDialogVisible}
        className="responsive-dialog"
        style={{ width: '50vw' }}
        onHide={() => setVideoDialogVisible(false)}
      >
        <iframe
          width="100%"
          height="400px"
          src={currentVideoUrl}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Exercise Video"
        />
      </Dialog>
    );
  };

  const renderRpeMethodDialog = () => {
    return (
      <Dialog
        draggable={false}
        resizable={false}
        dismissableMask
        header={
          dialogMode === 'create'
            ? intl.formatMessage({ id: 'coach.rpe.create' })
            : intl.formatMessage({ id: 'coach.rpe.edit' })
        }
        className="responsive-dialog"
        visible={rpeDialogVisible}
        style={{ width: '50vw', height: '80vh' }}
        onHide={() => setRpeDialogVisible(false)}
      >
        <div className="p-fluid">
          <div className="grid">
            {/* Información básica */}
            <div className="col-12">
              <h3 className="text-xl font-bold mb-3">
                <i className="pi pi-info-circle mr-2" />
                {intl.formatMessage({ id: 'coach.rpe.basicInfo' })}
              </h3>
              <div className="grid">
                <div className="col-12 md:col-6 field">
                  <label htmlFor="name" className="block mb-2">
                    {intl.formatMessage({ id: 'coach.rpe.name' })}
                  </label>
                  <InputText
                    id="name"
                    value={newRpe?.name || ''}
                    onChange={(e) => setNewRpe({ ...newRpe, name: e.target.value })}
                    className="w-full"
                    tooltip={intl.formatMessage({ id: 'coach.rpe.name.tooltip' })}
                    tooltipOptions={{ position: 'top' }}
                  />
                </div>
                <div className="col-12 md:col-6 field">
                  <label htmlFor="step" className="block mb-2">
                    {intl.formatMessage({ id: 'coach.rpe.step' })}
                  </label>
                  <InputNumber
                    id="step"
                    value={newRpe?.step || 0}
                    onValueChange={(e) => setNewRpe({ ...newRpe, step: e.value })}
                    className="w-full"
                    tooltip={intl.formatMessage({ id: 'coach.rpe.step.tooltip' })}
                    tooltipOptions={{ position: 'top' }}
                  />
                </div>
                <div className="col-12 md:col-6 field">
                  <label htmlFor="minValue" className="block mb-2">
                    {intl.formatMessage({ id: 'coach.rpe.minValue' })}
                  </label>
                  <InputNumber
                    id="minValue"
                    value={newRpe?.minValue || 0}
                    onValueChange={(e) => setNewRpe({ ...newRpe, minValue: e.value })}
                    className="w-full"
                    tooltip={intl.formatMessage({ id: 'coach.rpe.minValue.tooltip' })}
                    tooltipOptions={{ position: 'top' }}
                  />
                </div>
                <div className="col-12 md:col-6 field">
                  <label htmlFor="maxValue" className="block mb-2">
                    {intl.formatMessage({ id: 'coach.rpe.maxValue' })}
                  </label>
                  <InputNumber
                    id="maxValue"
                    value={newRpe?.maxValue || 0}
                    onValueChange={(e) => setNewRpe({ ...newRpe, maxValue: e.value })}
                    className="w-full"
                    tooltip={intl.formatMessage({ id: 'coach.rpe.maxValue.tooltip' })}
                    tooltipOptions={{ position: 'top' }}
                  />
                </div>
                <div className="col-12 flex justify-content-end gap-2">
                  <Button
                    label={intl.formatMessage({ id: 'coach.rpe.generateValues' })}
                    icon="pi pi-cog"
                    className="p-button-secondary"
                    onClick={() => {
                      if (
                        newRpe.minValue !== undefined &&
                        newRpe.maxValue !== undefined &&
                        newRpe.step !== undefined &&
                        newRpe.step > 0
                      ) {
                        const min = newRpe.minValue;
                        const max = newRpe.maxValue;
                        const step = newRpe.step;

                        // Generar valores basados en el rango y el paso
                        const valuesMeta = [];
                        for (let i = min; i <= max; i += step) {
                          valuesMeta.push({
                            value: i,
                            color: '',
                            emoji: ''
                          });
                        }

                        setNewRpe({
                          ...newRpe,
                          valuesMeta: valuesMeta
                        });
                      } else {
                        toast.current.show({
                          severity: 'warn',
                          summary: intl.formatMessage({ id: 'common.warning' }),
                          detail: intl.formatMessage({ id: 'coach.rpe.error.invalidRange' }),
                          life: 3000
                        });
                      }
                    }}
                    disabled={
                      newRpe.minValue === undefined ||
                      newRpe.maxValue === undefined ||
                      newRpe.step === undefined ||
                      newRpe.step <= 0 ||
                      newRpe.minValue >= newRpe.maxValue ||
                      (newRpe.minValue !== undefined &&
                        newRpe.maxValue !== undefined &&
                        newRpe.step !== undefined &&
                        Math.floor((newRpe.maxValue - newRpe.minValue) / newRpe.step) + 1 > 10)
                    }
                    tooltip={intl.formatMessage({ id: 'coach.rpe.generateValues.tooltip' })}
                    tooltipOptions={{ position: 'left' }}
                  />
                  <Button
                    label={intl.formatMessage({ id: 'coach.rpe.clearValues' })}
                    icon="pi pi-trash"
                    className="p-button-danger"
                    onClick={() => {
                      setNewRpe({
                        ...newRpe,
                        valuesMeta: []
                      });
                    }}
                    disabled={!newRpe.valuesMeta || newRpe.valuesMeta.length === 0}
                    tooltip={intl.formatMessage({ id: 'coach.rpe.clearValues.tooltip' })}
                    tooltipOptions={{ position: 'left' }}
                  />
                </div>
              </div>
            </div>

            {/* Values Meta section */}
            <div className="col-12 mt-4">
              <h3 className="text-xl font-bold mb-3">
                <i className="pi pi-list mr-2" />
                {intl.formatMessage({ id: 'coach.rpe.valuesMeta' })}
              </h3>
              <div className="p-card">
                {newRpe.valuesMeta &&
                  Array.isArray(newRpe.valuesMeta) &&
                  newRpe.valuesMeta.map((valueMeta, index) => (
                    <div key={index} className="p-card mb-3">
                      <div className="grid">
                        <div className="col-12 md:col-3">
                          <div className="p-field">
                            <label className="block mb-2">{intl.formatMessage({ id: 'coach.rpe.value' })}</label>
                            <InputNumber
                              value={valueMeta.value}
                              onChange={(e) =>
                                setNewRpe({
                                  ...newRpe,
                                  valuesMeta: newRpe.valuesMeta.map((meta, i) =>
                                    i === index ? { ...meta, value: e.value } : meta
                                  )
                                })
                              }
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div className="col-12 md:col-3">
                          <div className="p-field">
                            <label className="block mb-2">{intl.formatMessage({ id: 'coach.rpe.color' })}</label>
                            <div className="flex align-items-center">
                              <ColorPicker
                                value={valueMeta.color}
                                onChange={(e) =>
                                  setNewRpe({
                                    ...newRpe,
                                    valuesMeta: newRpe.valuesMeta.map((meta, i) =>
                                      i === index ? { ...meta, color: e.value } : meta
                                    )
                                  })
                                }
                                className="mr-2"
                                tooltip={intl.formatMessage({ id: 'coach.rpe.color.tooltip' })}
                                tooltipOptions={{ position: 'top' }}
                              />
                              {valueMeta.color && (
                                <div
                                  className="color-preview"
                                  style={{
                                    backgroundColor: `#${valueMeta.color}`,
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '4px',
                                    border: '1px solid #dee2e6'
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="col-12 md:col-3">
                          <div className="p-field">
                            <label className="block mb-2">{intl.formatMessage({ id: 'coach.rpe.emoji' })}</label>
                            <div className="flex align-items-center">
                              <Button
                                icon="pi pi-smile"
                                className="p-button-rounded p-button-outlined mr-2"
                                onClick={(e) => {
                                  emojiPanelRef.current.toggle(e);
                                  // Guardar el índice actual para saber qué valor estamos editando
                                  emojiPanelRef.current.currentEmojiIndex = index;
                                }}
                                tooltip={intl.formatMessage({ id: 'coach.rpe.emoji.tooltip' })}
                                tooltipOptions={{ position: 'top' }}
                              />
                              <span className="emoji-preview text-2xl">{valueMeta.emoji}</span>
                            </div>
                          </div>
                        </div>
                        <div className="col-12 md:col-3 flex align-items-end">
                          <Button
                            icon="pi pi-trash"
                            className="p-button-danger p-button-outlined w-full"
                            onClick={() =>
                              setNewRpe({
                                ...newRpe,
                                valuesMeta: newRpe.valuesMeta.filter((_, i) => i !== index)
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                <div className="flex justify-content-center mt-3">
                  <Button
                    label={intl.formatMessage({ id: 'coach.rpe.addValue' })}
                    icon="pi pi-plus"
                    className="p-button-outlined"
                    onClick={() =>
                      setNewRpe({
                        ...newRpe,
                        valuesMeta: [...(newRpe.valuesMeta || []), { value: 0, color: '', emoji: '' }]
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-content-end mt-4">
            <Button
              label={intl.formatMessage({ id: 'common.cancel' })}
              icon="pi pi-times"
              className="p-button-text mr-2"
              onClick={() => setRpeDialogVisible(false)}
            />
            <Button
              label={
                dialogMode === 'create'
                  ? intl.formatMessage({ id: 'coach.rpe.create' })
                  : intl.formatMessage({ id: 'coach.rpe.edit' })
              }
              icon="pi pi-check"
              onClick={handleSaveRpeMethod}
              loading={isRpeLoading}
            />
          </div>
        </div>
        <Tooltip target=".pi-info-circle" />

        {/* Panel de emojis */}
        <OverlayPanel ref={emojiPanelRef} showCloseIcon>
          <div className="emoji-grid p-2" style={{ maxWidth: '300px' }}>
            <div className="grid">
              {commonEmojis.map((emoji, index) => (
                <div key={index} className="col-2 text-center">
                  <Button
                    className="p-button-text p-button-rounded emoji-button"
                    style={{ fontSize: '1.5rem' }}
                    label={emoji}
                    onClick={() => {
                      // Obtener el índice actual del valor meta que se está editando
                      const currentIndex = emojiPanelRef.current.currentEmojiIndex;
                      if (currentIndex !== undefined) {
                        setNewRpe({
                          ...newRpe,
                          valuesMeta: newRpe.valuesMeta.map((meta, i) =>
                            i === currentIndex ? { ...meta, emoji: emoji } : meta
                          )
                        });
                        emojiPanelRef.current.hide();
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </OverlayPanel>
      </Dialog>
    );
  };

  const handleCreatePlan = async () => {
    try {
      const data = await createOrUpdateCoachPlan(newPlan, newPlan.id, user.userId, dialogMode);
      if (data === 'updated') {
        showToast(
          'success',
          intl.formatMessage({ id: 'coach.plan.success.updated' }),
          intl.formatMessage({ id: 'coach.plan.success.updated.message' }, { name: newPlan.name })
        );
      } else {
        showToast(
          'success',
          intl.formatMessage({ id: 'coach.plan.success.created' }),
          intl.formatMessage({ id: 'coach.plan.success.created.message' }, { name: newPlan.name })
        );
      }
      closeCreatePlanDialog();
      setRefreshKey((old) => old + 1);
    } catch (error) {
      console.log('error', error);
      showToast('error', 'Error', error.message);
    }
  };

  const confirmCreatePlan = async () => {
    if (newPlan.name === '')
      return showToast('error', 'Error', intl.formatMessage({ id: 'coach.plan.error.name.empty' }));
    if (newPlan.price <= 0)
      return showToast('error', 'Error', intl.formatMessage({ id: 'coach.plan.error.price.zero' }));
    if (newPlan.workoutsPerWeek <= 0)
      return showToast('error', 'Error', intl.formatMessage({ id: 'coach.plan.error.workouts.zero' }));

    showConfirmationDialog({
      message:
        dialogMode === 'create'
          ? intl.formatMessage({ id: 'coach.plan.confirm.create' })
          : intl.formatMessage({ id: 'coach.plan.confirm.update' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleCreatePlan(),
      reject: () => console.log('Rejected')
    });
  };

  const closeCreatePlanDialog = () => {
    setNewPlan({
      name: '',
      price: 0,
      workoutsPerWeek: 0,
      includeMealPlan: false
    });
    setCreatePlanDialogVisible(false);
  };

  const openCreatePlanDialog = () => {
    setDialogMode('create');
    setNewPlan({
      name: '',
      price: 0,
      workoutsPerWeek: 0,
      includeMealPlan: false
    });
    setCreatePlanDialogVisible(true);
  };

  const openEditPlanDialog = (plan) => {
    plan.price = Number(plan.price);
    setDialogMode('edit');
    setNewPlan(plan);
    setCreatePlanDialogVisible(true);
  };

  const handleDeletePlan = async (planId) => {
    try {
      const response = await fetch(`${apiUrl}/subscription/coach/coachPlan/${planId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error || 'Something went wrong');
      }

      setRefreshKey((old) => old + 1);
      showToast('success', 'Success', 'Plan deleted successfully');
    } catch (error) {
      console.log('error', error);
      showToast('error', 'Error', error.message);
    }
  };

  const confirmDeletePlan = async (planId) => {
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'coach.plan.confirm.delete' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleDeletePlan(planId),
      reject: () => console.log('Rejected')
    });
  };

  const confirmDeleteWorkout = async (workoutId) => {
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'coach.workout.confirm.delete' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleDeleteWorkout(workoutId),
      reject: () => console.log('Rejected')
    });
  };

  const handleDeleteWorkout = async (workoutInstanceTemplateId) => {
    try {
      const response = await deleteWorkoutPlan(workoutInstanceTemplateId, true);
      if (response.error) {
        throw new Error(response.error || 'Something went wrong');
      }
      setRefreshKey((old) => old + 1);
      showToast(
        'success',
        intl.formatMessage({ id: 'common.success' }),
        intl.formatMessage({ id: 'coach.workout.success.deleted.message' })
      );
    } catch (error) {
      console.log('error', error);
      showToast('error', 'Error', error.message);
    }
  };
  // Excel import functions
  const onTemplateUpload = (e) => {
    console.log(e);
  };

  const onTemplateSelect = (e) => {
    let _totalSize = totalSize;
    let files = e.files;

    Object.keys(files).forEach((key) => {
      _totalSize = files[key].size || 0;
    });

    setTotalSize(_totalSize);
    setSelectedFile(e.files[0]);
  };

  const onTemplateError = (e) => {
    setTotalSize(0);
    console.error('Error during upload:', e);
    console.log({
      severity: 'error',
      summary: 'Error',
      detail: 'File Upload Failed'
    });
  };

  const onTemplateClear = () => {
    setSelectedFile(null);
    setTotalSize(0);
    console.log('FileUpload cleared');
  };

  const handleUpload = async (formData, files) => {
    try {
      setLoading(true);
      const { data } = await importExercises(coach.id, formData);
      console.log('data', data);
      onTemplateUpload({ files });
      setRefreshKey((old) => old + 1);
      if (data.duplicateExercises.length > 0) {
        showToast(
          'warn',
          `${intl.formatMessage({ id: 'coach.exercise.upload.success' })}: ${data.registeredExercisesCount}. ${intl.formatMessage({ id: 'coach.exercise.upload.duplicated' })}: ${data.duplicatesCount}`,
          `${data.duplicateExercises.map((ex) => `${ex.name} at row ${ex.row}`)}`,
          true
        );
      } else {
        showToast('success', 'Success', `${data.registeredExercises.map((ex) => `${ex.name} at row ${ex.row}. `)}`);
      }
      fileUploadRef.current.clear();
      setSelectedFile(null);
      setTotalSize(0);
    } catch (error) {
      onTemplateError(error);
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadHandler = async ({ files }) => {
    const formData = new FormData();
    formData.append('file', files[0]);
    const rowsCount = await readFile(files[0]);
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'coach.exercise.confirm.upload' }, { rowsCount }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleUpload(formData, files),
      reject: () => console.log('Rejected')
    });
  };

  const readFile = (file) => {
    console.log(file);
    return new Promise((resolve, reject) => {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        const sheetDataMapped = sheetData.filter((array) => array.length > 0);
        setNumRows(sheetDataMapped.length - 1); // Assuming first row is header
        resolve(sheetDataMapped.length - 1);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
      setLoading(false);
    });
  };

  const handleVideoClick = (url) => {
    try {
      const videoId = extractYouTubeVideoId(url);
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      setCurrentVideoUrl(embedUrl);
      setVideoDialogVisible(true);
    } catch (error) {
      console.log('error', error);
      showToast('error', 'Error', error.message);
    }
  };

  const videoBodyTemplate = (rowData) => {
    return (
      <a href="#/" onClick={() => handleVideoClick(rowData.multimedia ? rowData.multimedia : '')}>
        <img
          src={getYouTubeThumbnail(rowData.multimedia ? rowData.multimedia : '')}
          alt="Video thumbnail"
          style={{ width: '100px', cursor: 'pointer' }}
        />
      </a>
    );
  };

  const nameFilterTemplate = (options) => {
    return (
      <InputText
        value={options.value}
        onChange={(e) => options.filterApplyCallback(e.target.value)}
        placeholder="Search by name"
        className="p-column-filter"
      />
    );
  };

  const exerciseTypeFilterTemplate = (options) => {
    return (
      <InputText
        value={options.value}
        onChange={(e) => options.filterApplyCallback(e.target.value)}
        placeholder="Search by type"
        className="p-column-filter"
      />
    );
  };

  const descriptionFilterTemplate = (options) => {
    return (
      <InputText
        value={options.value}
        onChange={(e) => options.filterApplyCallback(e.target.value)}
        placeholder="Search by description"
        className="p-column-filter"
      />
    );
  };

  const actionsBodyTemplate = (rowData) => {
    return (
      <>
        <Button
          icon="pi pi-pencil"
          rounded
          text
          className=" p-button-success p-button-sm p-mr-2"
          onClick={() => openEditExerciseDialog(rowData)}
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          className=" p-button-danger p-button-sm"
          onClick={() => {
            showConfirmationDialog({
              message: intl.formatMessage({
                id: 'deleteExercise.confirmation.message'
              }),
              header: intl.formatMessage({ id: 'common.confirmation' }),
              icon: 'pi pi-exclamation-triangle',
              accept: () => handleDeleteExercise(rowData.id),
              reject: () => console.log('Rejected')
            });
          }}
        />
      </>
    );
  };

  const rpeActionsBodyTemplate = (rowData) => (
    <React.Fragment>
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger p-button-text"
        onClick={() =>
          showConfirmationDialog({
            message: intl.formatMessage({ id: 'coach.rpe.confirm.delete' }),
            header: intl.formatMessage({ id: 'common.confirmation' }),
            icon: 'pi pi-exclamation-triangle',
            accept: () => handleDeleteRpeMethod(rowData.id),
            reject: () => console.log('Rejected')
          })
        }
      />
    </React.Fragment>
  );

  const openEditRpeDialog = (rpeMethod) => {
    setDialogMode('edit');
    setNewRpe(rpeMethod);
    setRpeDialogVisible(true);
  };

  const handleDeleteRpeMethod = async (rpeId) => {
    try {
      setIsRpeLoading(true);
      const response = await deleteRpe(rpeId, user.userId);
      if (response) {
        showToast('success', 'Success', 'RPE Method deleted successfully');
        fetchRpeMethods();
      } else {
        showToast('error', 'Error', 'RPE Method not deleted');
      }
    } catch (error) {
      console.log('error', error);
      showToast('error', 'Error', error.message);
    } finally {
      setIsRpeLoading(false);
    }
  };

  const handleAssign = async () => {
    try {
      const response = await assignRpeToTarget(selectedRpe, selectedType, selectedTarget, user.userId);
      if (!response) {
        showToast('error', 'Error', 'RPE Method not assigned');
        return;
      }
      showToast('success', 'Success', `RPE Method assigned successfully to the selected ${selectedType}`);
      setSelectedType(null);
      setSelectedTarget(null);
      setSelectedRpe(null);
      setRpeAssignmentDialogVisible(false);
    } catch (error) {
      console.log('error', error);
      showToast('error', 'Error', error.message);
    }
  };

  const renderRpeAssignmentDialog = () => (
    <Dialog
      draggable={false}
      resizable={false}
      header="Assign RPE Method"
      className="responsive-dialog"
      dismissableMask
      visible={rpeAssignmentDialogVisible}
      style={{ width: '50vw' }}
      onHide={() => setRpeAssignmentDialogVisible(false)}
    >
      <div className="assign-rpe p-4">
        <h2 className="text-2xl mb-4">Assign RPE Method</h2>
        <div className="p-grid p-fluid">
          <div className="p-col-12 p-md-4">
            <Dropdown
              value={selectedType}
              options={typeOptions}
              onChange={(e) => setSelectedType(e.value)}
              placeholder={intl.formatMessage({ id: 'coach.rpe.assign.type' })}
              className="w-full"
            />
          </div>
          <div className="p-col-12 p-md-4">{selectedType && renderTargetDropdown()}</div>
          <div className="p-col-12 p-md-4">
            <Dropdown
              value={selectedRpe}
              options={rpeMethods.map((rpe) => ({
                label: rpe.name,
                value: rpe.id
              }))}
              onChange={(e) => setSelectedRpe(e.value)}
              placeholder={intl.formatMessage({ id: 'coach.rpe.assign.rpe' })}
              className="w-full"
            />
          </div>
        </div>

        <div className="p-d-flex p-jc-end mt-4">
          <Button
            label="Assign RPE Method"
            icon="pi pi-check"
            onClick={handleConfirmAssign}
            disabled={!selectedRpe || !selectedType || !selectedTarget}
          />
        </div>
      </div>
    </Dialog>
  );

  // Función para confirmar la asignación usando showConfirmationDialog
  const handleConfirmAssign = () => {
    if (!selectedRpe || !selectedType || !selectedTarget) {
      showToast(
        'error',
        'Error',
        intl.formatMessage({
          id: 'coach.rpe.error.missingFields',
          defaultMessage: 'Por favor selecciona todos los campos requeridos'
        })
      );
      return;
    }

    let targetName = '';
    if (selectedType === 'exercise') {
      const exercise = exercises.find((e) => e.id === selectedTarget.id);
      targetName = exercise ? exercise.name : '';
    } else if (selectedType === 'user') {
      const user = users.find((u) => u.id === selectedTarget.id);
      targetName = user ? user.name : '';
    }

    const rpeMethod = rpeMethods.find((r) => r.id === selectedRpe);

    showConfirmationDialog({
      message: intl.formatMessage(
        {
          id: 'coach.rpe.confirm.assign',
          defaultMessage: '¿Estás seguro que deseas asignar el método RPE "{rpe}" a {target}?'
        },
        {
          rpe: rpeMethod ? rpeMethod.name : '',
          target:
            targetName || intl.formatMessage({ id: `coach.rpe.target.${selectedType}`, defaultMessage: selectedType })
        }
      ),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: handleAssign,
      reject: () => console.log('Assignment cancelled.')
    });
  };

  const headerTemplate = (options) => {
    const { className, chooseButton, uploadButton, cancelButton } = options;
    const value = totalSize / 10000;
    const formatedValue = fileUploadRef && fileUploadRef.current ? fileUploadRef.current.formatSize(totalSize) : '0 B';

    return (
      <div
        className={className}
        style={{
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {chooseButton}
        {uploadButton}
        {cancelButton}
        <div className="flex align-items-center gap-3 ml-auto">
          <span>{formatedValue} / 1 MB</span>
          <ProgressBar value={value} showValue={false} style={{ width: '10rem', height: '12px' }}></ProgressBar>
        </div>
      </div>
    );
  };

  const ConfirmDeleteCertificationRef = useRef(null);
  const editCategoryDialogRef = useRef(null);
  const toast = useRef(null);
  const emojiPanelRef = useRef(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Función para obtener el nombre del RPE a partir de su ID
  const getRpeNameById = (id) => {
    const method = rpeMethods.find((method) => method.id === id);
    return method ? method.name : 'N/A';
  };

  // Función para formatear el tipo de objetivo en texto legible
  const formatTargetType = (type) => {
    switch (type) {
      case 'exercise':
        return intl.formatMessage({ id: 'exercise.title' });
      case 'user':
        return intl.formatMessage({ id: 'client.title' });
      default:
        return type;
    }
  };

  // Función para confirmar y eliminar una asignación de RPE
  const confirmRemoveRpeAssignment = (assignmentId) => {
    showConfirmationDialog({
      message: intl.formatMessage({
        id: 'coach.rpe.confirm.removeAssignment',
        defaultMessage: '¿Estás seguro de que deseas eliminar esta asignación de RPE?'
      }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleRemoveRpeAssignment(assignmentId),
      reject: () => console.log('Assignment removal cancelled.')
    });
  };

  // Función para manejar la eliminación de asignaciones de RPE
  const handleRemoveRpeAssignment = async (assignmentId) => {
    try {
      const response = await removeRpeAssignment(assignmentId, user.userId);
      if (!response) {
        showToast('error', 'Error', 'RPE Assignment could not be removed');
        return;
      }
      showToast('success', 'Success', 'RPE Assignment removed successfully');
      // Actualizar la lista de asignaciones
      fetchRpeMethods();
    } catch (error) {
      console.error('Error removing RPE assignment', error);
      showToast('error', 'Error', error.message || 'Error removing RPE assignment');
    }
  };

  return (
    <div className="coach-profile-container">
      {/* Sección de cabecera del perfil */}
      <div className="profile-header">
        <div className="profile-header-content">
          <img
            src={coachInfo?.profilePictureUrl || '/image.webp'}
            alt={coachInfo?.name || 'Coach'}
            className="profile-avatar"
          />
          <div className="profile-info">
            <div className="profile-name-container">
              <h1 className="profile-name">{coachInfo?.name || 'Coach Profile'}</h1>
              <p className="profile-subtitle">{coachInfo?.user.email || 'Loading...'}</p>
            </div>
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">{users.length}</span>
                <span className="stat-label">Clients</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{workouts.length}</span>
                <span className="stat-label">Workouts</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{exercises.length}</span>
                <span className="stat-label">Exercises</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal con pestañas */}
      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)} className="coach-tabs">
        {/* Pestaña de Ejercicios */}
        <TabPanel header={intl.formatMessage({ id: 'coach.tabs.exercises' })} leftIcon="pi pi-heart">
          <div className="tab-content">
            <div className="action-buttons">
              <Button
                label={intl.formatMessage(
                  { id: 'common.add' },
                  { item: intl.formatMessage({ id: 'coach.exercise.title' }) }
                )}
                icon="pi pi-plus-circle"
                onClick={openCreateExerciseDialog}
                className="p-button-primary"
              />
              <Button
                label={intl.formatMessage({ id: 'coach.importExercises' })}
                icon="pi pi-upload"
                onClick={() => fileInputRef.current.click()}
                className="p-button-outlined"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const files = { 0: e.target.files[0] };
                    onTemplateSelect({ files });
                    uploadHandler({ files });
                  }
                }}
              />
              <FileUpload
                ref={fileUploadRef}
                customUpload
                uploadHandler={uploadHandler}
                onUpload={onTemplateUpload}
                onSelect={onTemplateSelect}
                onError={onTemplateError}
                onClear={onTemplateClear}
                multiple={false}
                maxFileSize={1000000}
                accept=".xlsx, .xls"
                emptyTemplate={<p className="m-0">{intl.formatMessage({ id: 'coach.dragAndDropExercises' })}</p>}
                style={{ display: 'none' }}
              />
            </div>

            <Card className="section-card" title={intl.formatMessage({ id: 'coach.exercises.title' })}>
              <DataTable
                value={exercises}
                className="coach-table"
                stripedRows
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25, 50]}
                emptyMessage={intl.formatMessage({ id: 'coach.noExercisesFound' })}
                filters={filters}
                filterDisplay="menu"
                globalFilterFields={['name', 'exerciseType', 'description']}
                header={renderHeader(intl.formatMessage({ id: 'coach.exerciseList' }))}
                globalFilter={filters.global.value}
                responsiveLayout="stack"
                breakpoint="960px"
                dataKey="id"
                scrollable
                scrollHeight="600px"
              >
                <Column
                  field="name"
                  header={intl.formatMessage({ id: 'exercise.name' })}
                  filter
                  filterField="name"
                  filterPlaceholder={intl.formatMessage({ id: 'exercise.searchByName' })}
                  filterElement={nameFilterTemplate}
                  sortable
                  style={{ minWidth: '250px' }}
                  body={(rowData) => (
                    <div className="exercise-name-cell">
                      <span className="exercise-name">{rowData.name}</span>
                      {missingDataIconTemplate(rowData)}
                    </div>
                  )}
                />
                <Column
                  field="multimedia"
                  header={intl.formatMessage({ id: 'exercise.video' })}
                  body={videoBodyTemplate}
                  style={{ minWidth: '200px' }}
                />
                <Column
                  field="exerciseType"
                  header={intl.formatMessage({ id: 'exercise.type' })}
                  filter
                  filterField="exerciseType"
                  filterPlaceholder={intl.formatMessage({ id: 'exercise.searchByType' })}
                  filterElement={exerciseTypeFilterTemplate}
                  sortable
                  style={{ minWidth: '200px' }}
                />
                <Column
                  field="description"
                  header={intl.formatMessage({ id: 'exercise.description' })}
                  filter
                  filterField="description"
                  filterPlaceholder={intl.formatMessage({ id: 'exercise.searchByDescription' })}
                  filterElement={descriptionFilterTemplate}
                  style={{ minWidth: '300px' }}
                  body={(rowData) => (
                    <div className="description-cell">
                      <p className="description-text">{rowData.description}</p>
                    </div>
                  )}
                />
                <Column
                  field="equipmentNeeded"
                  header={intl.formatMessage({ id: 'exercise.equipment' })}
                  style={{ minWidth: '200px' }}
                />
                <Column
                  header={intl.formatMessage({ id: 'common.actions' })}
                  body={(rowData) => (
                    <div className="action-button-cell">
                      <Button
                        icon="pi pi-pencil"
                        className="p-button-rounded p-button-outlined"
                        onClick={() => openEditExerciseDialog(rowData)}
                        tooltip={intl.formatMessage({ id: 'common.edit' })}
                        tooltipOptions={{ position: 'top' }}
                      />
                      <Button
                        icon="pi pi-trash"
                        className="p-button-rounded p-button-outlined p-button-danger"
                        onClick={() => {
                          showConfirmationDialog({
                            message: intl.formatMessage({
                              id: 'deleteExercise.confirmation.message'
                            }),
                            header: intl.formatMessage({ id: 'common.confirmation' }),
                            icon: 'pi pi-exclamation-triangle',
                            accept: () => handleDeleteExercise(rowData.id),
                            reject: () => console.log('Rejected')
                          });
                        }}
                        tooltip={intl.formatMessage({ id: 'common.delete' })}
                        tooltipOptions={{ position: 'top' }}
                      />
                    </div>
                  )}
                  style={{ minWidth: '150px' }}
                />
              </DataTable>
            </Card>

            {missingExercises.length > 0 && (
              <Card
                className="section-card missing-exercises-card"
                title={intl.formatMessage({ id: 'coach.missingExercises' })}
              >
                <div className="missing-exercises-header">
                  <i className="pi pi-exclamation-triangle" style={{ color: 'var(--yellow-500)' }}></i>
                  <span>{intl.formatMessage({ id: 'coach.missingExercisesWarning' })}</span>
                </div>
                <DataTable
                  value={missingExercises}
                  className="coach-table"
                  stripedRows
                  emptyMessage={intl.formatMessage({ id: 'coach.noMissingExercises' })}
                  scrollable
                  scrollHeight="300px"
                >
                  <Column field="name" header={intl.formatMessage({ id: 'exercise.name' })} sortable />
                  <Column
                    header={intl.formatMessage({ id: 'exercise.missingData' })}
                    body={(rowData) => {
                      const missingFields = ['multimedia', 'exerciseType', 'description', 'equipmentNeeded'].filter(
                        (field) => !rowData[field]
                      );
                      return (
                        <div className="missing-fields">
                          {missingFields.map((field, index) => (
                            <span key={index} className="missing-field-tag">
                              {intl.formatMessage({ id: `exercise.${field}` })}
                            </span>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Column
                    header={intl.formatMessage({ id: 'common.actions' })}
                    body={(rowData) => (
                      <Button
                        icon="pi pi-pencil"
                        label={intl.formatMessage({ id: 'common.complete' })}
                        className="p-button-sm p-button-warning"
                        onClick={() => openEditExerciseDialog(rowData)}
                      />
                    )}
                  />
                </DataTable>
              </Card>
            )}
          </div>
        </TabPanel>

        {/* Pestaña de RPE */}
        <TabPanel header={intl.formatMessage({ id: 'coach.tabs.rpe' })} leftIcon="pi pi-chart-line">
          <div className="tab-content">
            <div className="action-buttons">
              <Button
                label={intl.formatMessage({ id: 'coach.createRpeMethod' })}
                icon="pi pi-plus-circle"
                onClick={() => {
                  setDialogMode('create');
                  setNewRpe({
                    name: '',
                    minValue: 0,
                    maxValue: 10,
                    step: 1,
                    valuesMeta: []
                  });
                  setRpeDialogVisible(true);
                }}
                className="p-button-primary"
              />
              <Button
                label={intl.formatMessage({ id: 'coach.assignRpe' })}
                icon="pi pi-link"
                onClick={() => {
                  setSelectedType(null);
                  setSelectedTarget(null);
                  setSelectedRpe(null);
                  setRpeAssignmentDialogVisible(true);
                }}
                className="p-button-outlined"
                disabled={rpeMethods.length === 0}
              />
            </div>

            <Card className="section-card" title={intl.formatMessage({ id: 'coach.rpeMethods' })}>
              <div className="rpe-grid">
                {rpeMethods.map((rpe) => (
                  <div key={rpe.id} className="rpe-card">
                    <h3 className="rpe-name">{rpe.name}</h3>
                    <div className="rpe-range">
                      <i className="pi pi-sliders-h" style={{ marginRight: '0.5rem' }}></i>
                      <span>
                        {rpe.minValue} - {rpe.maxValue} ({intl.formatMessage({ id: 'rpe.step' })}: {rpe.step})
                      </span>
                    </div>
                    <div className="rpe-values">
                      {rpe.valuesMeta && Array.isArray(rpe.valuesMeta) ? (
                        rpe.valuesMeta.map((value, idx) => (
                          <div key={idx} className="rpe-value flex align-items-center gap-2">
                            <strong>{value.value}</strong>: {value.emoji || ''}{' '}
                            {value.color && (
                              <div
                                className="color-preview"
                                style={{
                                  backgroundColor: `#${value.color}`,
                                  width: '2rem',
                                  height: '2rem',
                                  borderRadius: '4px',
                                  border: '1px solid #dee2e6'
                                }}
                              />
                            )}
                          </div>
                        ))
                      ) : (
                        <div>No hay valores definidos</div>
                      )}
                    </div>
                    <div className="rpe-actions">
                      <Button
                        icon="pi pi-pencil"
                        className="p-button-text p-button-rounded"
                        onClick={() => openEditRpeDialog(rpe)}
                        tooltip={intl.formatMessage({ id: 'common.edit' })}
                        tooltipOptions={{ position: 'top' }}
                      />
                      <Button
                        icon="pi pi-trash"
                        className="p-button-text p-button-rounded p-button-danger"
                        onClick={() => {
                          showConfirmationDialog({
                            message: intl.formatMessage({ id: 'coach.rpe.confirm.delete' }),
                            header: intl.formatMessage({ id: 'common.confirmation' }),
                            icon: 'pi pi-exclamation-triangle',
                            accept: () => handleDeleteRpeMethod(rpe.id),
                            reject: () => console.log('Rejected')
                          });
                        }}
                        tooltip={intl.formatMessage({ id: 'common.delete' })}
                        tooltipOptions={{ position: 'top' }}
                      />
                    </div>
                  </div>
                ))}

                {rpeMethods.length === 0 && (
                  <div className="empty-message">
                    <i
                      className="pi pi-info-circle"
                      style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-color-secondary)' }}
                    ></i>
                    <p>{intl.formatMessage({ id: 'coach.noRpeMethods' })}</p>
                    <Button
                      label={intl.formatMessage({ id: 'coach.createFirstRpeMethod' })}
                      icon="pi pi-plus-circle"
                      onClick={() => {
                        setDialogMode('create');
                        setNewRpe({
                          name: '',
                          minValue: 0,
                          maxValue: 10,
                          step: 1,
                          valuesMeta: []
                        });
                        setRpeDialogVisible(true);
                      }}
                      className="p-button-outlined"
                    />
                  </div>
                )}
              </div>
            </Card>

            <Card className="section-card" title={intl.formatMessage({ id: 'coach.rpeAssignments' })}>
              <DataTable
                value={rpeAssignments}
                className="coach-table"
                stripedRows
                paginator
                rows={10}
                emptyMessage={intl.formatMessage({ id: 'coach.noRpeAssignments' })}
                responsiveLayout="stack"
                breakpoint="960px"
                dataKey="id"
              >
                <Column
                  field="rpeId"
                  header={intl.formatMessage({ id: 'rpe.method' })}
                  sortable
                  body={(rowData) => getRpeNameById(rowData.rpeId)}
                  style={{ minWidth: '200px' }}
                />
                <Column
                  field="targetType"
                  header={intl.formatMessage({ id: 'rpe.targetType' })}
                  sortable
                  body={(rowData) => (
                    <span className="target-type-badge">
                      <i className={`pi ${rowData.targetType === 'exercise' ? 'pi-heart' : 'pi-user'}`}></i>
                      {formatTargetType(rowData.targetType)}
                    </span>
                  )}
                  style={{ minWidth: '150px' }}
                />
                <Column
                  field="targetName"
                  header={intl.formatMessage({ id: 'rpe.targetName' })}
                  sortable
                  style={{ minWidth: '200px' }}
                />
                <Column
                  field="createdAt"
                  header={intl.formatMessage({ id: 'common.createdAt' })}
                  sortable
                  body={(rowData) => formatDate(rowData.createdAt)}
                  style={{ minWidth: '150px' }}
                />
                <Column
                  header={intl.formatMessage({ id: 'common.actions' })}
                  body={(rowData) => (
                    <Button
                      icon="pi pi-trash"
                      className="p-button-rounded p-button-outlined p-button-danger"
                      onClick={() => confirmRemoveRpeAssignment(rowData.id)}
                      tooltip={intl.formatMessage({ id: 'common.delete' })}
                      tooltipOptions={{ position: 'top' }}
                    />
                  )}
                  style={{ width: '100px' }}
                />
              </DataTable>
            </Card>
          </div>
        </TabPanel>

        {/* Pestaña de Planes */}
        <TabPanel header={intl.formatMessage({ id: 'coach.tabs.plans' })} leftIcon="pi pi-list">
          <div className="tab-content">
            <div className="action-buttons">
              <Button
                label={intl.formatMessage(
                  { id: 'common.add' },
                  { item: intl.formatMessage({ id: 'coach.plan.title' }) }
                )}
                icon="pi pi-plus-circle"
                onClick={openCreatePlanDialog}
                className="p-button-primary"
              />
            </div>

            <Card className="section-card" title={intl.formatMessage({ id: 'coach.plans.title' })}>
              <div className="plans-grid">
                {coachPlans.map((plan) => (
                  <div key={plan.id} className="plan-card">
                    <div className="plan-header">
                      <h3 className="plan-name">{plan.name}</h3>
                      <span className="plan-price">${plan.price}</span>
                    </div>
                    <div className="plan-details">
                      <div className="plan-detail-item">
                        <i className="pi pi-calendar"></i>
                        <span>
                          {intl.formatMessage({ id: 'coach.workoutsPerWeek' })}: <strong>{plan.workoutsPerWeek}</strong>
                        </span>
                      </div>
                      {plan.includeMealPlan && (
                        <div className="plan-detail-item">
                          <i className="pi pi-check-circle"></i>
                          <span>{intl.formatMessage({ id: 'coach.includeMealPlan' })}</span>
                        </div>
                      )}
                      <div className="plan-detail-item">
                        <i className="pi pi-clock"></i>
                        <span>
                          {intl.formatMessage({ id: 'common.created' })}: <strong>{formatDate(plan.createdAt)}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="plan-actions">
                      <Button
                        icon="pi pi-pencil"
                        className="p-button-rounded p-button-outlined"
                        onClick={() => openEditPlanDialog(plan)}
                        tooltip={intl.formatMessage({ id: 'common.edit' })}
                        tooltipOptions={{ position: 'top' }}
                      />
                      <Button
                        icon="pi pi-trash"
                        className="p-button-rounded p-button-outlined p-button-danger"
                        onClick={() => confirmDeletePlan(plan.id)}
                        tooltip={intl.formatMessage({ id: 'common.delete' })}
                        tooltipOptions={{ position: 'top' }}
                      />
                    </div>
                  </div>
                ))}

                {coachPlans.length === 0 && (
                  <div className="empty-message">
                    <i className="pi pi-info-circle"></i>
                    <p>{intl.formatMessage({ id: 'coach.noPlans' })}</p>
                    <Button
                      label={intl.formatMessage({ id: 'coach.createFirstPlan' })}
                      icon="pi pi-plus-circle"
                      onClick={openCreatePlanDialog}
                      className="p-button-outlined"
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabPanel>

        {/* Pestaña de Suscripción */}
        <TabPanel header={intl.formatMessage({ id: 'coach.tabs.subscription' })} leftIcon="pi pi-credit-card">
          <div className="tab-content">
            <Card className="section-card" title={intl.formatMessage({ id: 'coach.subscription.plans' })}>
              <div className="subscription-grid">
                {subscriptionPlans.map((plan) => (
                  <div key={plan.id} className={`subscription-card ${plan.id === currentPlanId ? 'current-plan' : ''}`}>
                    {plan.id === currentPlanId && (
                      <div className="current-plan-badge">
                        <i className="pi pi-check-circle"></i>
                        <span>{intl.formatMessage({ id: 'coach.subscription.currentPlan' })}</span>
                      </div>
                    )}
                    <div className="subscription-header">
                      <h3 className="subscription-name">{plan.name}</h3>
                      <span className="subscription-price">
                        ${plan.price}
                        <span className="subscription-period">/mes</span>
                      </span>
                    </div>
                    <div className="subscription-features">
                      <div className="subscription-feature">
                        <i className="pi pi-users"></i>
                        <span>
                          <strong>{plan.max_clients}</strong>{' '}
                          {intl.formatMessage({ id: 'coach.subscription.maxClients' })}
                        </span>
                      </div>
                      <div className="subscription-feature">
                        <i className="pi pi-calendar"></i>
                        <span>{intl.formatMessage({ id: 'coach.subscription.includedFeatures' })}</span>
                      </div>
                    </div>
                    {plan.id !== currentPlanId && (
                      <div className="subscription-actions">
                        <Button
                          label={intl.formatMessage({ id: 'coach.subscription.upgrade' })}
                          className="p-button-outlined"
                          icon="pi pi-arrow-up"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {currentPlanId && (
              <Card className="section-card" title={intl.formatMessage({ id: 'coach.subscription.details' })}>
                <div className="subscription-details">
                  <div className="subscription-detail-item">
                    <i className="pi pi-calendar"></i>
                    <div className="subscription-detail-content">
                      <span className="detail-label">{intl.formatMessage({ id: 'coach.subscription.startDate' })}</span>
                      <span className="detail-value">{formatDate(new Date())}</span>
                    </div>
                  </div>
                  <div className="subscription-detail-item">
                    <i className="pi pi-sync"></i>
                    <div className="subscription-detail-content">
                      <span className="detail-label">
                        {intl.formatMessage({ id: 'coach.subscription.renewalDate' })}
                      </span>
                      <span className="detail-value">
                        {formatDate(new Date(new Date().setMonth(new Date().getMonth() + 1)))}
                      </span>
                    </div>
                  </div>
                  <div className="subscription-detail-item">
                    <i className="pi pi-credit-card"></i>
                    <div className="subscription-detail-content">
                      <span className="detail-label">
                        {intl.formatMessage({ id: 'coach.subscription.paymentMethod' })}
                      </span>
                      <span className="detail-value">XXXX-XXXX-XXXX-4242</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </TabPanel>

        {/* Pestaña de Clientes */}
        {/*
        <TabPanel header={intl.formatMessage({ id: 'coach.tabs.clients' })} leftIcon="pi pi-users">
          <div className="tab-content">
            <Card className="section-card" title={intl.formatMessage({ id: 'coach.myClients' })}>
              <DataTable
                value={users}
                className="coach-table"
                stripedRows
                paginator
                rows={10}
                emptyMessage={intl.formatMessage({ id: 'coach.noClientsFound' })}
                responsiveLayout="stack"
                breakpoint="960px"
                dataKey="id"
              >
                <Column
                  field="name"
                  header={intl.formatMessage({ id: 'client.name' })}
                  sortable
                  body={(rowData) => (
                    <div className="client-name-cell">
                      <img
                        src={rowData.profilePictureUrl || '/image.webp'}
                        alt={rowData.name}
                        className="client-avatar"
                      />
                      <span>{rowData.name}</span>
                    </div>
                  )}
                  style={{ minWidth: '200px' }}
                />
                <Column
                  field="user.email"
                  header={intl.formatMessage({ id: 'client.email' })}
                  sortable
                  style={{ minWidth: '200px' }}
                />
                <Column
                  field="subscription.status"
                  header={intl.formatMessage({ id: 'client.status' })}
                  sortable
                  body={(rowData) => (
                    <span className={`status-badge ${rowData.subscription?.status?.toLowerCase() || 'inactive'}`}>
                      <i
                        className={`pi ${rowData.subscription?.status === 'Active' ? 'pi-check-circle' : 'pi-times-circle'}`}
                      ></i>
                      {rowData.subscription?.status || 'Inactive'}
                    </span>
                  )}
                  style={{ minWidth: '150px' }}
                />
                <Column
                  field="subscription.expirationDate"
                  header={intl.formatMessage({ id: 'client.expiresOn' })}
                  sortable
                  body={(rowData) =>
                    rowData.subscription?.expirationDate ? formatDate(rowData.subscription.expirationDate) : 'N/A'
                  }
                  style={{ minWidth: '150px' }}
                />
                <Column
                  header={intl.formatMessage({ id: 'common.actions' })}
                  body={(rowData) => (
                    <div className="action-button-cell">
                      <Button
                        icon="pi pi-eye"
                        className="p-button-rounded p-button-outlined"
                        onClick={() => navigate(`/user-detail/${rowData.id}`)}
                        tooltip={intl.formatMessage({ id: 'common.view' })}
                        tooltipOptions={{ position: 'top' }}
                      />
                      <Button
                        icon="pi pi-envelope"
                        className="p-button-rounded p-button-outlined p-button-info"
                        tooltip={intl.formatMessage({ id: 'client.sendMessage' })}
                        tooltipOptions={{ position: 'top' }}
                      />
                    </div>
                  )}
                  style={{ width: '150px' }}
                />
              </DataTable>
            </Card>
          </div>
        </TabPanel>
        */}
      </TabView>

      {/* Diálogo para crear/editar un ejercicio */}
      {exerciseDialogVisible && (
        <CreateExerciseDialog
          newExercise={newExercise}
          setNewExercise={setNewExercise}
          exerciseDialogVisible={exerciseDialogVisible}
          closeExerciseDialog={closeExerciseDialog}
          dialogMode={dialogMode}
          setExerciseDialogVisible={setExerciseDialogVisible}
          setRefreshKey={setRefreshKey}
          user={user}
        />
      )}

      {/* Dialog para crear/editar un plan */}
      {createPlanDialogVisible && (
        <Dialog
          visible={createPlanDialogVisible}
          style={{ width: '650px' }}
          header={
            dialogMode === 'create'
              ? intl.formatMessage({ id: 'coach.createNewPlan' })
              : intl.formatMessage({ id: 'coach.editPlan' })
          }
          modal
          className="coach-dialog"
          onHide={closeCreatePlanDialog}
          footer={
            <div>
              <Button
                label={intl.formatMessage({ id: 'common.cancel' })}
                icon="pi pi-times"
                onClick={closeCreatePlanDialog}
                className="p-button-text"
              />
              <Button
                label={intl.formatMessage({ id: 'common.save' })}
                icon="pi pi-check"
                onClick={handleCreatePlan}
                autoFocus
              />
            </div>
          }
        >
          {renderPlanModal()}
        </Dialog>
      )}
      {/* Modal Video */}

      <Dialog
        visible={videoDialogVisible}
        style={{ width: '80vw', maxWidth: '800px' }}
        header={intl.formatMessage({ id: 'exercise.video' })}
        modal
        className="coach-dialog"
        onHide={() => setVideoDialogVisible(false)}
      >
        {renderVideoModal()}
      </Dialog>

      {/* Modal RPE Method */}
      <Dialog
        visible={rpeDialogVisible}
        style={{ width: '650px' }}
        header={
          dialogMode === 'create'
            ? intl.formatMessage({ id: 'coach.createNewRpeMethod' })
            : intl.formatMessage({ id: 'coach.editRpeMethod' })
        }
        modal
        className="coach-dialog"
        onHide={() => setRpeDialogVisible(false)}
        footer={
          <div>
            <Button
              label={intl.formatMessage({ id: 'common.cancel' })}
              icon="pi pi-times"
              onClick={() => setRpeDialogVisible(false)}
              className="p-button-text"
            />
            <Button
              label={intl.formatMessage({ id: 'common.save' })}
              icon="pi pi-check"
              onClick={handleSaveRpeMethod}
              autoFocus
            />
          </div>
        }
      >
        {renderRpeMethodDialog()}
      </Dialog>

      {/* RPE Assignment Dialog */}
      <Dialog
        visible={rpeAssignmentDialogVisible}
        style={{ width: '650px' }}
        header={intl.formatMessage({ id: 'coach.assignRpeMethod' })}
        modal
        className="coach-dialog"
        onHide={() => setRpeAssignmentDialogVisible(false)}
        footer={
          <div>
            <Button
              label={intl.formatMessage({ id: 'common.cancel' })}
              icon="pi pi-times"
              onClick={() => setRpeAssignmentDialogVisible(false)}
              className="p-button-text"
            />
            <Button
              label={intl.formatMessage({ id: 'common.assign' })}
              icon="pi pi-check"
              onClick={handleConfirmAssign}
              disabled={!selectedRpe || !selectedType || !selectedTarget}
              autoFocus
            />
          </div>
        }
      >
        {renderRpeAssignmentDialog()}
      </Dialog>

      {/* Dialog para detalles del plan */}
      <Dialog
        visible={planDetailsVisible}
        header={intl.formatMessage({ id: 'plan.details' })}
        modal
        className="coach-dialog responsive-dialog"
        style={{ width: '80vw' }}
        onHide={() => setPlanDetailsVisible(false)}
      >
        <NewPlanDetailHorizontal
          planId={selectedPlan}
          setPlanDetailsVisible={setPlanDetailsVisible}
          setRefreshKey={setRefreshKey}
          setLoading={setLoading}
          isTemplate={true}
        />
      </Dialog>
    </div>
  );
}

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
import { assignRpeToTarget, createOrUpdateRpeMethod, deleteRpe, fetchTrainingCyclesByCoachId, getRpeMethods, deleteWorkoutPlan, findAllWorkoutTemplatesByCoachId } from '../services/workoutService';
import { fetchCoach, fetchCoachPlans, fetchCoachStudents } from '../services/usersService';
import {
  createOrUpdateCoachPlan,
  fetchCoachSubscription,
  fetchCoachSubscriptionPlans,
} from '../services/subscriptionService';
import { useSpinner } from '../utils/GlobalSpinner'; // <- spinner context
import { extractYouTubeVideoId, getYouTubeThumbnail, isValidYouTubeUrl } from '../utils/UtilFunctions';
import { MultiSelect } from 'primereact/multiselect';
import { FilterMatchMode } from 'primereact/api';
import * as XLSX from 'xlsx';
import Spinner from '../utils/LittleSpinner';
import { useIntl, FormattedMessage } from 'react-intl'; // Agregar este import
import { createExercise, deleteExercise, fetchBodyAreas, fetchCoachExercises, importExercises, updateExercise } from '../services/exercisesService';
import { ProgressBar } from 'primereact/progressbar';
import { Tooltip } from 'primereact/tooltip';
import NewPlanDetailHorizontal from '../dialogs/PlanDetails';
const apiUrl = process.env.REACT_APP_API_URL;

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
  // eslint-disable-next-line
  const [selectedFile, setSelectedFile] = useState(null);
  const fileUploadRef = useRef(null);
  const [totalSize, setTotalSize] = useState(0);

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    exerciseType: { value: null, matchMode: FilterMatchMode.CONTAINS },
    description: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  // eslint-disable-next-line
  const [numRows, setNumRows] = useState(0);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [newExercise, setNewExercise] = useState({
    name: '',
    description: '',
    multimedia: '',
    exerciseType: '',
    equipmentNeeded: '',
  });
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: 0,
    workoutsPerWeek: 0,
    includeMealPlan: false,
  });

  // States for RPE methods
    const [rpeMethods, setRpeMethods] = useState([
      { id: 1, name: 'RPE', minValue: 0, maxValue: 10, step: 1 },
    ]);
    const [isRpeLoading, setIsRpeLoading] = useState(true);
    const [rpeDialogVisible, setRpeDialogVisible] = useState(false);
    const [rpeAssignmentDialogVisible, setRpeAssignmentDialogVisible] = useState(false);
    const [newRpe, setNewRpe] = useState({ name: '', minValue: 0, maxValue: 10, step: 1, valuesMeta: [] });
    const [selectedType, setSelectedType] = useState(null);
    const [selectedTarget, setSelectedTarget] = useState(null);
    const [selectedRpe, setSelectedRpe] = useState(null);

    const typeOptions = [
      { label: 'Workout', value: 'workout' },
      { label: 'Training Cycle', value: 'trainingCycle' },
      { label: 'User', value: 'user' },
    ];

    const renderTargetDropdown = () => {
      let options = [];
  
      if (selectedType === 'workout') {
        options = workouts.map((workout) => ({
          label: workout.planName,
          value: workout.id,
        }));
      } else if (selectedType === 'trainingCycle') {
        options = trainingCycles.map((cycle) => ({
          label: cycle.name,
          value: cycle.id,
        }));
      } else if (selectedType === 'user') {
        options = users.map((user) => ({
          label: `${user.name}`,
          value: user.id,
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
        const {data} = await getRpeMethods(user.userId);
        setRpeMethods(data);
      } catch (error) {
        console.log('error', error);
        showToast('error', 'Error', error.message);
      } finally {
        setIsRpeLoading(false);
      }
    };

    useEffect(() => {
      const fetchWorkouts = async () => { 
        try {
          setIsWorkoutsLoading(true);
          //const {data} = await fetchCoachWorkouts(user.userId);
          const {data} = await findAllWorkoutTemplatesByCoachId(coach.id);
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
          const {data} = await fetchCoach(user.userId);
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
          const {data} = await fetchCoachSubscription(coach.id);
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
          const {data} = await fetchCoachPlans(user.userId);
          
          setCoachPlans(data);
        } catch (error) {
          console.log('error', error);
          showToast('error', 'Error', error.message);
        } finally{
          setIsCoachPlansLoading(false);
        }
      };

      const fetchExercises = async () => {
        try {
          setIsExercisesLoading(true);
          const {data} = await fetchCoachExercises(coach.id);
          if (data.error) {
            throw new Error(data.message || 'Something went wrong');
          }
          
          const missingExercises = data.filter(exercise => !exercise.multimedia || !exercise.exerciseType || !exercise.description || !exercise.equipmentNeeded);
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
          const {data} = await fetchBodyAreas();
          if (data.error) {
            throw new Error(data.message || 'Something went wrong');
          }
          const formattedBodyAreas = data.map((bodyArea) => ({ label: bodyArea.name, value: bodyArea.id }));
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
          const {data} = await fetchCoachSubscriptionPlans();
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
          const {data} = await fetchCoachStudents(user.userId);
          const activeClients = data.filter(client => client.user.subscription.status === 'Active');
          setUsers(activeClients);
        } catch (error) {
          console.error('Error fetching clients:', error);
        } finally {
        }
      };
  
      const fetchTrainingPlans = async () => {
        try {
          const {data} = await fetchTrainingCyclesByCoachId(user.userId);
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
      if(response){
        showToast('success', 'Success', dialogMode === 'create' ? 'New RPE Method created successfully' : 'RPE Method updated successfully');
        setRpeDialogVisible(false);
        setNewRpe({ name: '', minValue: 0, maxValue: 10, step: 1 });
        fetchRpeMethods();
      }
      else {
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
                  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
                  name: { value: null, matchMode: FilterMatchMode.STARTS_WITH }
                });
              } else {
                // Si no hay filtro activo, lo activamos
                setFilters({
                  ...filters,
                  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
                  name: { value: missingExercises.map(ex => ex.name), matchMode: FilterMatchMode.IN }
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
            label={intl.formatMessage(
              { id: 'common.add', defaultMessage: 'Add {item}' },
              { item: text.slice(0, -1) }
            )}
          icon="pi pi-plus"
          onClick={() =>
            text === intl.formatMessage({ id: 'coach.tabs.exercises' }) ? openCreateExerciseDialog() : text === intl.formatMessage({ id: 'coach.tabs.workouts' }) ? navigate('/plans/create') : openCreatePlanDialog()
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
        <i className="custom-target-icon pi pi-exclamation-triangle" 
          data-pr-tooltip={intl.formatMessage({ id: 'common.missingData' })}
          data-pr-position="right"
          data-pr-at="right+5 top"
          data-pr-my="left center-2"
          style={{ color: 'red', cursor: 'pointer' }} />
      </div>
    ) : null;
  };

  const actionBodyTemplate = (rowData, type) => {
    console.log('rowData', rowData);
    return (
      <React.Fragment>
        <Button
          tooltip="View Details"
          icon="pi pi-eye"
          className="p-button-rounded p-button-info p-button-text"
          onClick={() => {
            if (type === 'exercise') {
              handleVideoClick(rowData.multimedia);
            } else {
              handleViewPlanDetails(rowData.workoutInstanceTemplates[0].id);
            }
          }}
        />
        <Button
          tooltip="Edit"
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning p-button-text"
          onClick={() => {
            if (type === 'exercise') {
              openEditExerciseDialog(rowData);
            } else if (type === 'workout') {
              navigate(`/plans/edit-template/${rowData.workoutInstanceTemplates[0].id}`);
            } else if (type === 'plan') {
              console.log('rowData', rowData);
              openEditPlanDialog(rowData);
            }
          }}
        />
        <Button
          tooltip={intl.formatMessage({ id: 'common.delete' })}
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-text"
          onClick={() => {
            if (type === 'exercise') {
              showConfirmationDialog({
                message: intl.formatMessage({ id: 'deleteExercise.confirmation.message' }),
                header: intl.formatMessage({ id: 'common.confirmation' }),
                icon: 'pi pi-exclamation-triangle',
                accept: () => handleDeleteExercise(rowData.id),
                reject: () => console.log('Rejected'),
              });
            } else if (type === 'plan') {
              console.log('rowData', rowData);
              confirmDeletePlan(rowData.id);
            } else if (type === 'workout') {
              console.log('rowData', rowData);
              confirmDeleteWorkout(rowData.workoutInstanceTemplates[0].id);
            }

          }}
        />
      </React.Fragment>
    );
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
      equipmentNeeded: '',
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
      equipmentNeeded: '',
    });
    setSelectedBodyAreas([]);
    setExerciseDialogVisible(false);
  };

  const handleSaveExercise = async () => {
    const body = {
      ...newExercise,
      bodyArea: selectedBodyAreas,
      coachId: user.userId,
    };

    try {
      
      if (dialogMode === 'create') {
        const {message} = await createExercise(body);
        if (message !== 'success') {
          throw new Error(message);
        } else {
          showToast('success', 'Success', intl.formatMessage({ id: 'coach.exercise.success.created' }));
        }
      } else {
        const {message} = await updateExercise(newExercise.id, body);
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
        header={dialogMode === 'create' ? intl.formatMessage({ id: 'coach.exercise.create' }) : intl.formatMessage({ id: 'coach.exercise.edit' })}
        className="responsive-dialog"
        visible={exerciseDialogVisible}
        style={{ width: '50vw' }}
        onHide={closeExerciseDialog}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="name">{dialogMode === 'create' ? intl.formatMessage({ id: 'coach.exercise.name' }) : intl.formatMessage({ id: 'coach.exercise.name' })}</label>
            <InputText id="name" value={newExercise.name} onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })} />
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
            <InputText id="multimedia" value={newExercise.multimedia} onChange={(e) => setNewExercise({ ...newExercise, multimedia: e.target.value })} />
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
              onChange={(e) => setNewExercise({ ...newExercise, equipmentNeeded: e.target.value })}
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
              label={dialogMode === 'create' ? intl.formatMessage({ id: 'coach.exercise.create' }) : intl.formatMessage({ id: 'coach.exercise.edit' })}
              icon="pi pi-check"
              onClick={() => {
                if (newExercise.name === '') return showToast('error', 'Error', intl.formatMessage({ id: 'coach.exercise.error.name.empty' }));
                if (!isValidYouTubeUrl(newExercise.multimedia)) {
                  return showToast('error', 'Error', intl.formatMessage({ id: 'coach.exercise.error.video.invalid' }));
                }
                showConfirmationDialog({
                  message:
                    dialogMode === 'create'
                      ? intl.formatMessage({ id: 'createExercise.confirmation.message' })
                      : intl.formatMessage({ id: 'updateExercise.confirmation.message' }),
                  header: intl.formatMessage({ id: 'common.confirmation' }),
                  icon: 'pi pi-exclamation-triangle',
                  accept: () => handleSaveExercise(),
                  reject: () => console.log('Rejected'),
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
        header={dialogMode === 'create' ?  intl.formatMessage({ id: 'coach.plan.create' }) : intl.formatMessage({ id: 'coach.plan.edit' })}
        className="responsive-dialog"
        visible={createPlanDialogVisible}
        style={{ width: '50vw' }}
        onHide={closeCreatePlanDialog}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="name">{intl.formatMessage({ id: 'coach.plan.name' })}</label>
            <InputText id="name" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} />
          </div>
          <div className="p-field">
            <label htmlFor="price">{intl.formatMessage({ id: 'coach.plan.price' })}</label>
            <InputNumber id="price" value={newPlan.price} onChange={(e) => setNewPlan({ ...newPlan, price: e.value })} />
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
              label={dialogMode === 'create' ? intl.formatMessage({ id: 'coach.plan.create' }) : intl.formatMessage({ id: 'coach.plan.edit' })}
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
        <Dialog draggable={false} dismissableMask resizable={false} header="Video" visible={videoDialogVisible} className="responsive-dialog" style={{ width: '50vw' }} onHide={() => setVideoDialogVisible(false)}>
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

    const renderRpeMethodDialog = () => (
      <Dialog
        draggable={false}
        resizable={false}
        dismissableMask
        header={dialogMode === 'create' ? intl.formatMessage({ id: 'coach.rpe.create' }) : intl.formatMessage({ id: 'coach.rpe.edit' })}
        className="responsive-dialog"
        visible={rpeDialogVisible}
        style={{ width: '50vw' }}
        onHide={() => setRpeDialogVisible(false)}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="name">{intl.formatMessage({ id: 'coach.rpe.name' })}</label>
            <InputText
              id="name"
              value={newRpe.name}
              onChange={(e) => setNewRpe({ ...newRpe, name: e.target.value })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="minValue">{intl.formatMessage({ id: 'coach.rpe.minValue' })}</label>
            <InputNumber
              id="minValue"
              value={newRpe.minValue}
              onChange={(e) => setNewRpe({ ...newRpe, minValue: e.value })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="maxValue">{intl.formatMessage({ id: 'coach.rpe.maxValue' })}</label>
            <InputNumber
              id="maxValue"
              value={newRpe.maxValue}
              onChange={(e) => setNewRpe({ ...newRpe, maxValue: e.value })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="step">{intl.formatMessage({ id: 'coach.rpe.step' })}</label>
            <InputNumber
              id="step"
              value={newRpe.step}
              onChange={(e) => setNewRpe({ ...newRpe, step: e.value })}
            />
          </div>
    
          {/* Campo para agregar valoresMeta */}
          <div className="p-field">
            <label>{intl.formatMessage({ id: 'coach.rpe.valuesMeta' })}</label>
            {newRpe.valuesMeta && Array.isArray(newRpe.valuesMeta) && newRpe.valuesMeta.map((valueMeta, index) => (
              <div key={index} className="p-grid p-align-center p-mb-2">
                <div className="p-col-3">
                  <InputNumber
                    value={valueMeta.value}
                    onChange={(e) =>
                      setNewRpe({
                        ...newRpe,
                        valuesMeta: newRpe.valuesMeta.map((meta, i) =>
                          i === index ? { ...meta, value: e.value } : meta
                        ),
                      })
                    }
                    placeholder={intl.formatMessage({ id: 'coach.rpe.value' })}
                  />
                </div>
                <div className="p-col-3">
                  <InputText
                    value={valueMeta.color}
                    onChange={(e) =>
                      setNewRpe({
                        ...newRpe,
                        valuesMeta: newRpe.valuesMeta.map((meta, i) =>
                          i === index ? { ...meta, color: e.target.value } : meta
                        ),
                      })
                    }
                    placeholder={intl.formatMessage({ id: 'coach.rpe.color' })}
                  />
                </div>
                <div className="p-col-3">
                  <InputText
                    value={valueMeta.emoji}
                    onChange={(e) =>
                      setNewRpe({
                        ...newRpe,
                        valuesMeta: newRpe.valuesMeta.map((meta, i) =>
                          i === index ? { ...meta, emoji: e.target.value } : meta
                        ),
                      })
                    }
                    placeholder={intl.formatMessage({ id: 'coach.rpe.emoji' })}
                  />
                </div>
                <div className="p-col-3">
                  <Button
                    icon="pi pi-trash"
                    className="p-button-danger"
                    onClick={() =>
                      setNewRpe({
                        ...newRpe,
                        valuesMeta: newRpe.valuesMeta.filter((_, i) => i !== index),
                      })
                    }
                  />
                </div>
              </div>
            ))}
            {/* Botón para agregar nuevo valor */}
            <Button
              label={intl.formatMessage({ id: 'coach.rpe.addValue' })}
              icon="pi pi-plus"
              onClick={() =>
                setNewRpe({
                  ...newRpe,
                  valuesMeta: [...newRpe.valuesMeta, { value: 0, color: '', emoji: '' }],
                })
              }
            />
          </div>
    
          <div className="p-field">
            <Button
              label={dialogMode === 'create' ? intl.formatMessage({ id: 'coach.rpe.create' }) : intl.formatMessage({ id: 'coach.rpe.edit' })}
              icon="pi pi-check"
              onClick={handleSaveRpeMethod}
              loading={isRpeLoading}
            />
          </div>
        </div>
      </Dialog>
    );
  const handleCreatePlan = async () => {
    try {
      const data = await createOrUpdateCoachPlan(newPlan, newPlan.id, user.userId, dialogMode);
      console.log('data', data, newPlan.name);
      if(data === 'updated') {
        showToast('success', intl.formatMessage({ id: 'coach.plan.success.updated' }), intl.formatMessage({ id: 'coach.plan.success.updated.message'}, { name: newPlan.name } ));
      } else {
        showToast('success', intl.formatMessage({ id: 'coach.plan.success.created' }), intl.formatMessage({ id: 'coach.plan.success.created.message'}, { name: newPlan.name }));
      }
      closeCreatePlanDialog();
      setRefreshKey((old) => old + 1);
    } catch (error) {
      console.log('error', error);
      showToast('error', 'Error', error.message);
    }
  };

  const confirmCreatePlan = async () => {
    if (newPlan.name === '') return showToast('error', 'Error', intl.formatMessage({ id: 'coach.plan.error.name.empty' }));
    if (newPlan.price <= 0) return showToast('error', 'Error', intl.formatMessage({ id: 'coach.plan.error.price.zero' }));
    if (newPlan.workoutsPerWeek <= 0) return showToast('error', 'Error', intl.formatMessage({ id: 'coach.plan.error.workouts.zero' }));

    showConfirmationDialog({
      message:
        dialogMode === 'create' ? intl.formatMessage({ id: 'coach.plan.confirm.create' }) : intl.formatMessage({ id: 'coach.plan.confirm.update' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleCreatePlan(),
      reject: () => console.log('Rejected'),
    });
  };

  const closeCreatePlanDialog = () => {
    setNewPlan({
      name: '',
      price: 0,
      workoutsPerWeek: 0,
      includeMealPlan: false,
    });
    setCreatePlanDialogVisible(false);
  };

  const openCreatePlanDialog = () => {
    setDialogMode('create');
    setNewPlan({
      name: '',
      price: 0,
      workoutsPerWeek: 0,
      includeMealPlan: false,
    });
    setCreatePlanDialogVisible(true);
  };

  const openEditPlanDialog = (plan) => {
    plan.price = Number(plan.price);
    console.log('plan', plan);
    setDialogMode('edit');
    setNewPlan(plan);
    setCreatePlanDialogVisible(true);
  };

  const handleDeletePlan = async (planId) => {
    try {
      const response = await fetch(`${apiUrl}/subscription/coach/coachPlan/${planId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      console.log('data', data);
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
      reject: () => console.log('Rejected'),
    });
  };

  const confirmDeleteWorkout = async (workoutId) => {
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'coach.workout.confirm.delete' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleDeleteWorkout(workoutId),
      reject: () => console.log('Rejected'),
    });
  };

  const handleDeleteWorkout = async (workoutInstanceTemplateId) => {
    try {
      const response = await deleteWorkoutPlan(workoutInstanceTemplateId, true);
      if (response.error) {
        throw new Error(response.error || 'Something went wrong');
      }
      setRefreshKey((old) => old + 1);
      showToast('success', intl.formatMessage({ id: 'common.success' }), intl.formatMessage({ id: 'coach.workout.success.deleted.message' }));
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
    console.log({ severity: 'error', summary: 'Error', detail: 'File Upload Failed' });
  };

  const onTemplateClear = () => {
    setSelectedFile(null);
    setTotalSize(0);
    console.log('FileUpload cleared');
  };

  const handleUpload = async (formData, files) => {
    try {
      setLoading(true);
      const {data} = await importExercises(coach.id, formData);
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
      reject: () => console.log('Rejected'),
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
        <img src={getYouTubeThumbnail(rowData.multimedia ? rowData.multimedia : ''  )} alt="Video thumbnail" style={{ width: '100px', cursor: 'pointer' }} />
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
        <Button icon="pi pi-pencil" rounded text className=" p-button-success p-button-sm p-mr-2" onClick={() => openEditExerciseDialog(rowData)} />
        <Button icon="pi pi-trash" rounded text className=" p-button-danger p-button-sm" onClick={() => {
                
                showConfirmationDialog({
                    message: intl.formatMessage({ id: 'deleteExercise.confirmation.message' }),
                    header: intl.formatMessage({ id: 'common.confirmation' }),
                    icon: "pi pi-exclamation-triangle",
                    accept: () => handleDeleteExercise(rowData.id),
                    reject: () => console.log('Rejected'),
                
                })
            }}
        />
      </>
    );
  };

  const rpeActionsBodyTemplate = (rowData) => (
    <React.Fragment>
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-warning p-button-text"
        onClick={() => openEditRpeDialog(rowData)}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger p-button-text"
        onClick={() =>
          showConfirmationDialog({
            message: intl.formatMessage({ id: 'coach.rpe.confirm.delete' }),
            header: intl.formatMessage({ id: 'common.confirmation' }),
            icon: 'pi pi-exclamation-triangle',
            accept: () => handleDeleteRpeMethod(rowData.id),
            reject: () => console.log('Rejected'),
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
      if(response){
        showToast('success', 'Success', 'RPE Method deleted successfully');
        fetchRpeMethods();
      }
      else {  
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
                value: rpe.id,
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
            disabled={!selectedType || !selectedTarget || !selectedRpe}
          />
        </div>
      </div>
    </Dialog>
  );
  
  // Función para confirmar la asignación usando showConfirmationDialog
  const handleConfirmAssign = () => {
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'coach.rpe.confirm.assign' }, { rpe: rpeMethods.find((r) => r.id === selectedRpe)?.name, type: selectedType }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: handleAssign,
      reject: () => console.log('Assignment cancelled.'),
    });
  };

  const headerTemplate = (options) => {
    
    const { className, chooseButton, uploadButton, cancelButton } = options;
    const value = totalSize / 10000;
    const formatedValue = fileUploadRef && fileUploadRef.current ? fileUploadRef.current.formatSize(totalSize) : '0 B';

    return (
        <div className={className} style={{ backgroundColor: 'transparent', display: 'flex', alignItems: 'center' }}>
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

  return (
    <div className="coach-profile p-4">
      <Card className={isCoachInfoLoading ? 'flex justify-content-center' : 'mb-4'}>
        {isCoachInfoLoading ? <Spinner/> : (
          <div className="flex flex-column md:flex-row">
            <div className="flex-grow-1">
              <h1 className="text-3xl font-bold mb-2">
                <FormattedMessage id="coach.welcome" values={{ name: coachInfo?.name }} />
              </h1>
              <p className="mb-2">
                <strong><FormattedMessage id="coach.email" />:</strong> {coachInfo?.user.email}
              </p>
              <p className="mb-2">
                <strong><FormattedMessage id="coach.experience" />:</strong> {coachInfo?.experience}
              </p>
              <p className="mb-2">
                <strong><FormattedMessage id="coach.trainingType" />:</strong> {coachInfo?.trainingType.join(', ')}
              </p>
              {coachInfo?.hasGym && (
                <p>
                  <strong><FormattedMessage id="coach.gymLocation" />:</strong> {coachInfo?.gymLocation}
                </p>
              )}
            </div>
            <div className="flex-grow-1 mt-4 md:mt-0">
              <h2 className="text-xl font-bold mb-2">
                <FormattedMessage id="coach.biography" />
              </h2>
              <p>{coachInfo?.bio}</p>
            </div>
          </div>
        )}
      </Card>

      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        <TabPanel header={intl.formatMessage({ id: 'coach.tabs.workouts' })}>
          <DataTable
            value={workouts}
            className="p-datatable-sm"
            header={renderHeader(intl.formatMessage({ id: 'coach.tabs.workouts' }))}
            loading={isWorkoutsLoading}
          >
            <Column field="planName" header={intl.formatMessage({ id: 'coach.workouts.title' })}></Column>
            <Column body={(rowData) => actionBodyTemplate(rowData, 'workout')} style={{ width: '120px' }}></Column>
          </DataTable>
        </TabPanel>

        <TabPanel header={intl.formatMessage({ id: 'coach.tabs.plans' })}>
          <div>{renderHeader(intl.formatMessage({ id: 'coach.tabs.plans' }))}</div>
          <div className="grid">
            {coachPlans.map((plan) => (
              <div key={plan.id} className="col-12 md:col-6 lg:col-4">
                <Card title={plan.name} subTitle={`$${plan.price} / month`} className="h-full">
                  
                  <p className="m-0">{intl.formatMessage({ id: 'coach.workoutsPerWeek' })}: {plan.workoutsPerWeek}</p>
                  <div className="flex justify-content-between mt-4">
                    <Button
                      label="Edit"
                      icon="pi pi-pencil"
                      className="p-button-text"
                      onClick={() => {
                        openEditPlanDialog(plan);
                      }}
                    />
                    <Button
                      label="Delete"
                      icon="pi pi-trash"
                      className="p-button-danger p-button-text"
                      onClick={() => confirmDeletePlan(plan.id)}
                    />
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </TabPanel>

        <TabPanel header={intl.formatMessage({ id: 'coach.tabs.exercises' })}>
          <DataTable
            value={exercises}
            responsiveLayout="scroll"
            className="p-datatable-sm"
            header={renderHeader(intl.formatMessage({ id: 'coach.tabs.exercises' }))}
            filters={filters}
            globalFilterFields={['name', 'exerciseType', 'description']}
            onFilter={(e) => setFilters(e.filters)}
            loading={isExercisesLoading}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 20, 50]}
          >
            <Column
              field="name"
              header={intl.formatMessage({ id: 'coach.exercise.name' })}
              style={{ width: '20%' }}
              filter
              filterElement={nameFilterTemplate}
              body={(rowData) => {
                return (
                  <div className="flex align-items-center gap-2">
                    {rowData.name} 
                    {missingDataIconTemplate(rowData)}
                  </div>
                )
              }}
            />
            <Column 
              field="multimedia" 
              header={intl.formatMessage({ id: 'coach.exercise.video' })} 
              body={videoBodyTemplate} 
            />
            <Column 
              field="exerciseType" 
              header={intl.formatMessage({ id: 'coach.exercise.type' })} 
              filter 
              filterElement={exerciseTypeFilterTemplate} 
            />
            <Column
              field="description"
              header={intl.formatMessage({ id: 'coach.exercise.description' })}
              style={{ width: '30%' }}
              filter
              filterElement={descriptionFilterTemplate}
            />
            <Column 
              field="equipmentNeeded" 
              header={intl.formatMessage({ id: 'coach.exercise.equipment' })} 
            />
            <Column
              field="actions"
              header={intl.formatMessage({ id: 'common.actions' })}
              body={(rowData) => actionsBodyTemplate(rowData, 'exercise')}
            />
          </DataTable>
        </TabPanel>

        <TabPanel header={intl.formatMessage({ id: 'coach.tabs.subscription' })}>
          <div className="grid">
            {subscriptionPlans.map((plan) => (
              <div key={plan.id} className="col-12 md:col-6 lg:col-4">
                <Card
                  title={plan.name}
                  subTitle={`$${plan.price} / month`}
                  className={classNames('h-full relative', { 'border-primary': plan.id === currentPlanId })}
                >
                  <ul className="list-none p-0 m-0">
                    <li className="flex align-items-center mb-2">
                      <i className="pi pi-check-circle mr-2 text-green-500"></i>
                      <FormattedMessage 
                        id="coach.subscription.maxClients" 
                        values={{ max: plan.max_clients }} 
                      />
                    </li>
                  </ul>
                  {plan.id === currentPlanId && (
                    <div className="absolute top-0 right-0 bg-primary text-white px-2 py-1 text-xs font-bold">
                      <FormattedMessage id="coach.subscription.currentPlan" />
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </TabPanel>

        <TabPanel header={intl.formatMessage({ id: 'coach.tabs.rpe' })}>
          <div className="flex justify-content-end mb-3">
            <Button 
              label={intl.formatMessage({ id: 'common.add' }, { item: 'RPE Method' })} 
              icon="pi pi-plus" 
              onClick={() => setRpeDialogVisible(true)} 
            />
            <Button 
              label={intl.formatMessage({ id: 'common.assign' }, { item: 'RPE Method' })} 
              icon="pi pi-plus" 
              onClick={() => setRpeAssignmentDialogVisible(true)} 
            />
          </div>
          <DataTable value={rpeMethods} className="mt-4" loading={isRpeLoading}>
            <Column field="name" header={intl.formatMessage({ id: 'coach.rpe.name' })} />
            <Column field="minValue" header={intl.formatMessage({ id: 'coach.rpe.minValue' })} />
            <Column field="maxValue" header={intl.formatMessage({ id: 'coach.rpe.maxValue' })} />
            <Column field="step" header={intl.formatMessage({ id: 'coach.rpe.step' })} />
            <Column header={intl.formatMessage({ id: 'common.actions' })} body={rpeActionsBodyTemplate} />
          </DataTable>
        </TabPanel>
      </TabView>

      {activeIndex === 2 && <Card className="mt-4">
        <h2 className="text-xl font-bold mb-3">
          <FormattedMessage id="coach.buttons.import" />
        </h2>
        <FileUpload
          name="file"
          ref={fileUploadRef}
          customUpload
          headerTemplate={headerTemplate}
          uploadHandler={uploadHandler}
          onUpload={onTemplateUpload}
          onSelect={onTemplateSelect}
          onError={onTemplateError}
          onClear={onTemplateClear}
          accept=".csv,.xlsx"
          maxFileSize={1000000}
          emptyTemplate={
            <p className="m-0">
              <FormattedMessage id="coach.exercise.dragDrop" />
            </p>
          }
        />
      </Card>}

      <Dialog
        draggable={false}
        resizable={false}
        dismissableMask
        header={intl.formatMessage({ id: 'coach.workout.details' })}
        visible={planDetailsVisible}
        className="responsive-dialog"
        style={{ width: '80vw' }}
        onHide={() => setPlanDetailsVisible(false)}
      >
        {/*<NewPlanDetail
          isCoach={true}
          planId={selectedPlan}
          setPlanDetailsIsVisible={setPlanDetailsVisible}
          setRefreshKey={setRefreshKey}
          isTemplate={true}
          setLoading={setLoading}
        />*/}
        <NewPlanDetailHorizontal
          planId={selectedPlan}
          setPlanDetailsVisible={setPlanDetailsVisible}
          setRefreshKey={setRefreshKey}
          setLoading={setLoading}
          isTemplate={true}
        />
      </Dialog>
      {renderRpeMethodDialog()}
      {renderExerciseModal()}
      {renderPlanModal()}
      {renderVideoModal()}
      {renderRpeAssignmentDialog()}
    </div>
  );
}
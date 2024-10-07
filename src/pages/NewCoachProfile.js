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
import { assignRpeToTarget, createOrUpdateRpeMethod, deleteRpe, fetchCoachWorkouts, fetchTrainingCyclesByCoachId, getRpeMethods } from '../services/workoutService';
import { fetchCoach, fetchCoachPlans, fetchCoachStudents, fetchWorkoutProgressByCoachId } from '../services/usersService';
import {
  createOrUpdateCoachPlan,
  fetchCoachSubscription,
  fetchCoachSubscriptionPlans,
} from '../services/subscriptionService';
import { useSpinner } from '../utils/GlobalSpinner'; // <- spinner context
import NewPlanDetail from '../dialogs/NewPlanDetails';
import { extractYouTubeVideoId, getYouTubeThumbnail, isValidYouTubeUrl } from '../utils/UtilFunctions';
import { MultiSelect } from 'primereact/multiselect';
import { FilterMatchMode } from 'primereact/api';
import * as XLSX from 'xlsx';
import { ProgressSpinner } from 'primereact/progressspinner';
import Spinner from '../utils/LittleSpinner';

const apiUrl = process.env.REACT_APP_API_URL;

export default function CoachProfilePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { user, coach } = useContext(UserContext);
  const { showConfirmationDialog } = useConfirmationDialog();
  const showToast = useToast();
  const navigate = useNavigate();
  const { setLoading } = useSpinner(); // <- spinner function

  const [isWorkoutsLoading, setIsWorkoutsLoading] = useState(true);
  const [isCoachInfoLoading, setIsCoachInfoLoading] = useState(true);
  const [isCoachSubscriptionLoading, setIsCoachSubscriptionLoading] = useState(true);
  const [isCoachPlansLoading, setIsCoachPlansLoading] = useState(true);
  const [isExercisesLoading, setIsExercisesLoading] = useState(true);
  const [isBodyAreasLoading, setIsBodyAreasLoading] = useState(true);
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

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    exerciseType: { value: null, matchMode: FilterMatchMode.CONTAINS },
    description: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
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
        const response = await getRpeMethods(user.userId);
        console.log(response);
        setRpeMethods(response);
      } catch (error) {
        showToast('error', 'Error', error.message);
      } finally {
        setIsRpeLoading(false);
      }
    };

    useEffect(() => {
      const fetchWorkouts = async () => { 
        try {
          setIsWorkoutsLoading(true);
          const workoutData = await fetchCoachWorkouts(user.userId);
          const mappedWorkouts = workoutData.map((workout) => {
            const instance = workout.workoutInstances.find((instance) => instance.isTemplate);
            return {
              ...workout,
              workoutInstance: instance,
            };
          });
          setWorkouts(mappedWorkouts);
        } catch (error) {
          showToast('error', 'Error', error.message);
        } finally {
          setIsWorkoutsLoading(false);
        }
      };

      const fetchCoachInfo = async () => {
        try {
          setIsCoachInfoLoading(true);
          const data = await fetchCoach(user.userId);
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
          const subscriptionData = await fetchCoachSubscription(user.userId);
          setCurrentPlanId(subscriptionData.subscriptionPlan.id);
        } catch (error) {
          showToast('error', 'Error', error.message);
        } finally {
          setIsCoachSubscriptionLoading(false);
        }
      };

      const fetchCoachPlansData = async () => {
        try {
          setIsCoachPlansLoading(true);
          const coachPlansData = await fetchCoachPlans(user.userId);
          setCoachPlans(coachPlansData);
        } catch (error) {
          showToast('error', 'Error', error.message);
        } finally{
          setIsCoachPlansLoading(false);
        }
      };

      const fetchExercises = async () => {
        try {
          setIsExercisesLoading(true);
          const exercisesResponse = await fetch(`${apiUrl}/exercise/coach/${user.userId}`);
          if (!exercisesResponse.ok) {
            const errorData = await exercisesResponse.json();
            throw new Error(errorData.message || 'Something went wrong');
          }
          const exercisesData = await exercisesResponse.json();
          setExercises(exercisesData);
        } catch (error) {
          showToast('error', 'Error', error.message);
        } finally {
          setIsExercisesLoading(false);
        }

      };

      const fetchBodyAreas = async () => {
        try {
          setIsBodyAreasLoading(true);
          const bodyAreasResponse = await fetch(`${apiUrl}/exercise/body-area`);
          if (!bodyAreasResponse.ok) {
            const errorData = await bodyAreasResponse.json();
            throw new Error(errorData.message || 'Something went wrong');
          }
          const bodyAreasData = await bodyAreasResponse.json();
          const formattedBodyAreas = bodyAreasData.map((bodyArea) => ({ label: bodyArea.name, value: bodyArea.id }));
          setBodyAreas(formattedBodyAreas);
        } catch (error) {
          showToast('error', 'Error', error.message);
        } finally {
          setIsBodyAreasLoading(false);
        }
      };

      const fetchSubscriptionPlans = async () => {
        try {
          setIsSubscriptionPlansLoading(true);
          const subscriptionPlansData = await fetchCoachSubscriptionPlans();
          setSubscriptionPlans(subscriptionPlansData);
        } catch (error) {
          showToast('error', 'Error', error.message);
        } finally {
          setIsSubscriptionPlansLoading(false);
        }
      };

      const fetchClients = async () => {
        try {
          const clientsData = await fetchCoachStudents(user.userId);
          const activeClients = clientsData.filter(client => client.user.subscription.status === 'Active');
          setUsers(activeClients);
        } catch (error) {
          console.error('Error fetching clients:', error);
        } finally {
        }
      };
  
      const fetchTrainingPlans = async () => {
        try {
          const trainingPlansData = await fetchTrainingCyclesByCoachId(user.userId);
          console.log(trainingPlansData);
          setTrainingCycles(trainingPlansData);
        } catch (error) {
          console.error('Error fetching training plans:', error);
        }
      };
      

      fetchWorkouts();
      fetchCoachInfo();
      fetchCoachSubscriptionData();
      fetchCoachPlansData();
      fetchExercises();
      fetchBodyAreas();
      fetchSubscriptionPlans();
      fetchRpeMethods(); 
      fetchClients();
      fetchTrainingPlans(); 
    }, [user.userId, showToast, navigate, refreshKey]);

  const handleViewPlanDetails = (workoutInstanceId) => {
    setLoading(true);
    setSelectedPlan(workoutInstanceId);
    setPlanDetailsVisible(true);
  };

  const hidePlanDetails = () => {
    setPlanDetailsVisible(false);
    setSelectedPlan(null);
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
      showToast('error', 'Error', error.message);
    } finally {
      setIsRpeLoading(false);
    }

  };

  const renderHeader = (text) => {
    return (
      <div className="flex justify-content-between align-items-center">
        <h2 className="text-xl font-bold">{text}</h2>
        <Button
          label={`Add New ${text.slice(0, -1)}`}
          icon="pi pi-plus"
          onClick={() =>
            text === 'Exercises' ? openCreateExerciseDialog() : text === 'Workouts' ? navigate('/plans/create') : openCreatePlanDialog()
          }
        />
      </div>
    );
  };

  const actionBodyTemplate = (rowData, type) => {
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
              handleViewPlanDetails(rowData.workoutInstance.id);
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
              navigate(`/plans/edit/${rowData.workoutInstance.id}`);
            } else if (type === 'plan') {
              openEditPlanDialog(rowData);
            }
          }}
        />
        <Button
          tooltip="Delete"
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-text"
          onClick={() => {
            if (type === 'exercise') {
              showConfirmationDialog({
                message: 'Are you sure you want to delete this exercise?',
                header: 'Confirmation',
                icon: 'pi pi-exclamation-triangle',
                accept: () => handleDeleteExercise(rowData.id),
                reject: () => console.log('Rejected'),
              });
            } else if (type === 'plan') {
              confirmDeletePlan(rowData.id);
            }
          }}
        />
      </React.Fragment>
    );
  };

  const handleDeleteExercise = async (exerciseId) => {
    try {
      const response = await fetch(`${apiUrl}/exercise/${exerciseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
      }

      setRefreshKey((old) => old + 1);
      showToast('success', 'Success', 'Exercise deleted successfully');
    } catch (error) {
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
    const url = dialogMode === 'create' ? `${apiUrl}/exercise` : `${apiUrl}/exercise/${newExercise.id}`;
    const method = dialogMode === 'create' ? 'POST' : 'PUT';
    const body = {
      ...newExercise,
      bodyArea: selectedBodyAreas,
      coachId: user.userId,
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
      }

      if (dialogMode === 'create') {
        showToast('success', 'Success', 'New exercise created successfully');
      } else {
        showToast('success', 'Success', 'Exercise updated successfully');
      }

      closeExerciseDialog();
      setRefreshKey((old) => old + 1);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  };

  const renderExerciseModal = () => {
    return (
      <Dialog
        draggable={false}
        resizable={false}
        header={dialogMode === 'create' ? 'Create New Exercise' : 'Edit Exercise'}
        className="responsive-dialog"
        visible={exerciseDialogVisible}
        style={{ width: '50vw' }}
        onHide={closeExerciseDialog}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="name">{dialogMode === 'create' ? 'Exercise Name' : 'Edit Exercise Name'}</label>
            <InputText id="name" value={newExercise.name} onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })} />
          </div>
          <div className="p-field">
            <label htmlFor="description">Description</label>
            <InputTextarea
              id="description"
              className="overflow-hidden text-overflow-ellipsis"
              value={newExercise.description}
              onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="p-field">
            <label htmlFor="multimedia">Video URL</label>
            <InputText id="multimedia" value={newExercise.multimedia} onChange={(e) => setNewExercise({ ...newExercise, multimedia: e.target.value })} />
          </div>
          <div className="p-field">
            <label htmlFor="exerciseType">Type</label>
            <InputText
              id="exerciseType"
              value={newExercise.exerciseType}
              onChange={(e) => setNewExercise({ ...newExercise, exerciseType: e.target.value })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="equipmentNeeded">Equipment Needed</label>
            <InputText
              id="equipmentNeeded"
              value={newExercise.equipmentNeeded}
              onChange={(e) => setNewExercise({ ...newExercise, equipmentNeeded: e.target.value })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="equipmentNeeded">Body area involved</label>
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
              label={dialogMode === 'create' ? 'Create Exercise' : 'Update Exercise'}
              icon="pi pi-check"
              onClick={() => {
                if (newExercise.name === '') return showToast('error', 'Error', 'Exercise name can not be empty.');
                if (!isValidYouTubeUrl(newExercise.multimedia)) {
                  return showToast('error', 'Error', 'Please enter a valid YouTube URL');
                }
                showConfirmationDialog({
                  message:
                    dialogMode === 'create'
                      ? 'Are you sure you want to create this exercise?'
                      : 'Are you sure you want to update this exercise?',
                  header: 'Confirmation',
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
        header={dialogMode === 'create' ? 'Create New Coach Plan' : 'Edit Coach Plan'}
        className="responsive-dialog"
        visible={createPlanDialogVisible}
        style={{ width: '50vw' }}
        onHide={closeCreatePlanDialog}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="name">Plan Name</label>
            <InputText id="name" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} />
          </div>
          <div className="p-field">
            <label htmlFor="price">Price</label>
            <InputNumber id="price" value={newPlan.price} onChange={(e) => setNewPlan({ ...newPlan, price: e.value })} />
          </div>
          <div className="p-field">
            <label htmlFor="workoutsPerWeek">Workouts per Week</label>
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
            <label htmlFor="includeMealPlan">Include Meal Plan</label>
          </div>
          <div className="p-field">
            <Button
              label={dialogMode === 'create' ? 'Create Plan' : 'Update Plan'}
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
        <Dialog draggable={false}  resizable={false} header="Video" visible={videoDialogVisible} className="responsive-dialog" style={{ width: '50vw' }} onHide={() => setVideoDialogVisible(false)}>
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
        header={dialogMode === 'create' ? 'Create New RPE Method' : 'Edit RPE Method'}
        className="responsive-dialog"
        visible={rpeDialogVisible}
        style={{ width: '50vw' }}
        onHide={() => setRpeDialogVisible(false)}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="name">RPE Method Name</label>
            <InputText
              id="name"
              value={newRpe.name}
              onChange={(e) => setNewRpe({ ...newRpe, name: e.target.value })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="minValue">Min Value</label>
            <InputNumber
              id="minValue"
              value={newRpe.minValue}
              onChange={(e) => setNewRpe({ ...newRpe, minValue: e.value })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="maxValue">Max Value</label>
            <InputNumber
              id="maxValue"
              value={newRpe.maxValue}
              onChange={(e) => setNewRpe({ ...newRpe, maxValue: e.value })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="step">Step</label>
            <InputNumber
              id="step"
              value={newRpe.step}
              onChange={(e) => setNewRpe({ ...newRpe, step: e.value })}
            />
          </div>
    
          {/* Field to add valuesMeta */}
          <div className="p-field">
            <label>Values Meta</label>
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
                    placeholder="Value"
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
                    placeholder="Color (e.g., #FF0000)"
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
                    placeholder="Emoji (e.g., 🔥)"
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
            {/* Button to add new value */}
            <Button
              label="Add Value"
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
              label={dialogMode === 'create' ? 'Create RPE Method' : 'Update RPE Method'}
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
      if (dialogMode === 'create') {
        if (data) showToast('success', 'Success', 'New plan created successfully');
      } else {
        if (data) showToast('success', 'Success', 'Plan updated successfully');
        else {
          showToast('error', 'Error', 'Plan not updated');
        }
      }
      closeCreatePlanDialog();
      setRefreshKey((old) => old + 1);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  };

  const confirmCreatePlan = async () => {
    if (newPlan.name === '') return showToast('error', 'Error', 'Plan name can not be empty');
    if (newPlan.price <= 0) return showToast('error', 'Error', 'Price can not be 0 or less');
    if (newPlan.workoutsPerWeek <= 0) return showToast('error', 'Error', 'Workouts per week can not be 0 or less');

    showConfirmationDialog({
      message:
        dialogMode === 'create' ? 'Are you sure you want to create this plan?' : 'Are you sure you want to update this plan?',
      header: 'Confirmation',
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
    setDialogMode('edit');
    setNewPlan(plan);
    setCreatePlanDialogVisible(true);
  };

  const handleDeletePlan = async (planId) => {
    try {
      const response = await fetch(`${apiUrl}/subscription/coach/coachPlan/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
      }

      setCoachPlans(coachPlans.filter((plan) => plan.id !== planId));
      showToast('success', 'Success', 'Plan deleted successfully');
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  };

  const confirmDeletePlan = async (planId) => {
    showConfirmationDialog({
      message: 'Are you sure you want to delete this plan?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleDeletePlan(planId),
      reject: () => console.log('Rejected'),
    });
  };

  // Excel import functions
  const onTemplateUpload = (e) => {
    for (let file of e.files) {
      console.log('Uploaded file:', file);
    }
    console.log({ severity: 'info', summary: 'Success', detail: 'File Uploaded' });
  };

  const onTemplateSelect = (e) => {
    setSelectedFile(e.files[0]);
    console.log('Selected file:', e.files);
  };

  const onTemplateError = (e) => {
    console.error('Error during upload:', e);
    console.log({ severity: 'error', summary: 'Error', detail: 'File Upload Failed' });
  };

  const onTemplateClear = () => {
    setSelectedFile(null);
    console.log('FileUpload cleared');
  };

  const handleUpload = async (formData, files) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/exercise/import/${coach.id}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      onTemplateUpload({ files });
      setRefreshKey((old) => old + 1);
      if (result.duplicateExercises.length > 0) {
        showToast(
          'warn',
          `Exercises uploaded: ${result.registeredExercisesCount}. Duplicated Exercises: ${result.duplicatesCount}`,
          `${result.duplicateExercises.map((ex) => `${ex.name} at row ${ex.row}`)}`,
          true
        );
      } else {
        showToast('success', 'Success', `${result.registeredExercisesCount.map((ex) => `${ex.name} at row ${ex.row}`)}`);
      }
      console.log(result.duplicateExercises);
      fileUploadRef.current.clear();
    } catch (error) {
      onTemplateError(error);
      console.error('Error during upload:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadHandler = async ({ files }) => {
    const formData = new FormData();
    formData.append('file', files[0]);
    const rowsCount = await readFile(files[0]);
    showConfirmationDialog({
      message: `Are you sure you want to upload ${rowsCount} exercises?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleUpload(formData, files),
      reject: () => console.log('Rejected'),
    });
  };

  const readFile = (file) => {
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
      showToast('error', 'Error', error.message);
    }
  };

  const videoBodyTemplate = (rowData) => {
    return (
      <a href="#/" onClick={() => handleVideoClick(rowData.multimedia)}>
        <img src={getYouTubeThumbnail(rowData.multimedia)} alt="Video thumbnail" style={{ width: '100px', cursor: 'pointer' }} />
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
                    message: "Are you sure you want to delete this exercise?",
                    header: "Confirmation",
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
            message: 'Are you sure you want to delete this RPE Method?',
            header: 'Confirmation',
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
      showToast('error', 'Error', error.message);
    }
  };

  const renderRpeAssignmentDialog = () => (
    <Dialog
        draggable={false}
        resizable={false}
        header="Assign RPE Method"
        className="responsive-dialog"
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
              placeholder="Select Assignment Type"
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
              placeholder="Select RPE Method"
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
      message: `Are you sure you want to assign ${rpeMethods.find((r) => r.id === selectedRpe)?.name} to the selected ${selectedType}?`,
      header: 'Confirm Assignment',
      icon: 'pi pi-exclamation-triangle',
      accept: handleAssign,
      reject: () => console.log('Assignment cancelled.'),
    });
  };



  return (
    <div className="coach-profile p-4">
      <Card className={isCoachInfoLoading ? 'flex justify-content-center' : 'mb-4'}>
        {isCoachInfoLoading ? <Spinner/> : (
          <div className="flex flex-column md:flex-row">
            <div className="flex-grow-1">
              <h1 className="text-3xl font-bold mb-2">Welcome, {coachInfo?.name}!</h1>
              <p className="mb-2">
                <strong>Email:</strong> {coachInfo?.user.email}
              </p>
              <p className="mb-2">
                <strong>Experience:</strong> {coachInfo?.experience}
              </p>
              <p className="mb-2">
                <strong>Training Type:</strong> {coachInfo?.trainingType.join(', ')}
              </p>
              {coachInfo?.hasGym && (
                <p>
                  <strong>Gym Location:</strong> {coachInfo?.gymLocation}
                </p>
              )}
            </div>
            <div className="flex-grow-1 mt-4 md:mt-0">
              <h2 className="text-xl font-bold mb-2">Biography</h2>
              <p>{coachInfo?.bio}</p>
            </div>
          </div>
        )}
      </Card>

      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        <TabPanel header="Workouts">
          <DataTable
              value={workouts}
              responsiveLayout="scroll"
              className="p-datatable-sm"
              header={renderHeader('Workouts')}
              loading={isWorkoutsLoading}
          >
            <Column field="planName" header="Workout Name"></Column>
            <Column
              body={(rowData) => actionBodyTemplate(rowData, 'workout')}
              style={{ width: '120px' }}
            ></Column>
          </DataTable>
        </TabPanel>
        <TabPanel header="Coach Plans">
          <div> {renderHeader('Plans')} </div>
          <div className="grid">
            {coachPlans.map((plan) => (
              <div key={plan.id} className="col-12 md:col-6 lg:col-4">
                <Card title={plan.name} subTitle={`$${plan.price.toFixed(2)} / month`} className="h-full">
                  
                  <p className="m-0">Workouts per week: {plan.workoutsPerWeek}</p>
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
        <TabPanel header="Exercise Library">
          <DataTable
            value={exercises}
            responsiveLayout="scroll"
            className="p-datatable-sm"
            header={renderHeader('Exercises')}
            filters={filters}
            globalFilterFields={['name', 'exerciseType', 'description']}
            onFilter={(e) => setFilters(e.filters)}
            loading={isExercisesLoading}
          >
            <Column
              field="name"
              header="Exercise Name"
              style={{ width: '20%' }}
              filter
              filterElement={nameFilterTemplate}
            />
            <Column field="multimedia" header="Video" body={videoBodyTemplate} />
            <Column field="exerciseType" header="Type" filter filterElement={exerciseTypeFilterTemplate} />
            <Column
              field="description"
              header="Description"
              style={{ width: '30%' }}
              filter
              filterElement={descriptionFilterTemplate}
            />
            <Column field="equipmentNeeded" header="Equipment Needed" />
            <Column
              field="actions"
              header="Actions"
              body={(rowData) => actionsBodyTemplate(rowData, 'exercise')}
            />
          </DataTable>
        </TabPanel>
        <TabPanel header="Subscription Plans">
          <div className="grid">
            {subscriptionPlans.map((plan) => (
              <div key={plan.id} className="col-12 md:col-6 lg:col-4">
                <Card
                  title={plan.name}
                  subTitle={`$${plan.price.toFixed(2)} / month`}
                  className={classNames('h-full relative', { 'border-primary': plan.id == currentPlanId })}
                >
                  <ul className="list-none p-0 m-0">
                    <li className="flex align-items-center mb-2">
                      <i className="pi pi-check-circle mr-2 text-green-500"></i>
                      <span>Max Clients: {plan.max_clients}</span>
                    </li>
                  </ul>
                  {plan.id == currentPlanId && (
                    <div className="absolute top-0 right-0 bg-primary text-white px-2 py-1 text-xs font-bold">
                      Current Plan
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </TabPanel>
        <TabPanel header="RPE Methods">
          <div className="flex justify-content-end mb-3">
            <Button label="Add RPE Method" icon="pi pi-plus" onClick={() => setRpeDialogVisible(true)} />
            <Button label="Assign RPE Method" icon="pi pi-plus" onClick={() => setRpeAssignmentDialogVisible(true)} />
          </div>
          <DataTable value={rpeMethods} className="mt-4" loading={isRpeLoading}>
            <Column field="name" header="RPE Name" />
            <Column field="minValue" header="Min Value" />
            <Column field="maxValue" header="Max Value" />
            <Column field="step" header="Step" />
            <Column header="Actions" body={rpeActionsBodyTemplate} />
          </DataTable>
          
        </TabPanel>
      </TabView>

      <Card className="mt-4">
        <h2 className="text-xl font-bold mb-3">Import Exercises</h2>
        <FileUpload
          name="file"
          ref={fileUploadRef}
          customUpload
          uploadHandler={uploadHandler}
          onUpload={onTemplateUpload}
          onSelect={onTemplateSelect}
          onError={onTemplateError}
          onClear={onTemplateClear}
          accept=".csv,.xlsx"
          maxFileSize={1000000}
          emptyTemplate={<p className="m-0">Drag and drop a file here to upload.</p>}
        />
      </Card>

      <Dialog
        draggable={false}
        resizable={false}
        header="Workout details"
        visible={planDetailsVisible}
        className="responsive-dialog"
        style={{ width: '50vw' }}
        onHide={() => setPlanDetailsVisible(false)}
      >
        <NewPlanDetail
          isCoach={true}
          planId={selectedPlan}
          setPlanDetailsIsVisible={setPlanDetailsVisible}
          setRefreshKey={setRefreshKey}
          setLoading={setLoading}
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
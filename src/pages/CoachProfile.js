import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Checkbox } from 'primereact/checkbox';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { isValidYouTubeUrl, extractYouTubeVideoId, getYouTubeThumbnail } from '../utils/UtilFunctions';
import '../styles/CoachProfile.css'
import { MultiSelect } from 'primereact/multiselect';
import PlanDetails from '../dialogs/PlanDetails';
import { useSpinner } from '../utils/GlobalSpinner';

import * as XLSX from 'xlsx';
import { FileUpload } from 'primereact/fileupload';
import { fetchCoachWorkouts } from '../services/workoutService';
import { fetchCoach, fetchCoachPlans } from '../services/usersService';
import { createOrUpdateCoachPlan, fetchCoachSubscription, fetchCoachSubscriptionPlans } from '../services/subscriptionService';
        
const apiUrl = process.env.REACT_APP_API_URL;

const CoachProfile = () => {
    const { user, coach } = useContext(UserContext);
    const { showConfirmationDialog } = useConfirmationDialog();
    const showToast = useToast();
    const navigate = useNavigate();
    const { setLoading } = useSpinner();
    const [coachInfo, setCoachInfo] = useState(null);
    const [coachPlans, setCoachPlans] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [bodyAreas, setBodyAreas] = useState([]);
    const [selectedBodyAreas, setSelectedBodyAreas] = useState([]);
    const [currentVideoUrl, setCurrentVideoUrl] = useState('');
    const [workouts, setWorkouts] = useState([{
        planName: '',
        id: '',
        workoutInstance: {},
        coach: {}
    }]);
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [currentPlanId, setCurrentPlanId] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [file, setFile] = useState(null);
    const fileUploadRef = useRef(null);
    const [numRows, setNumRows] = useState(0)
    const [videoDialogVisible, setVideoDialogVisible] = useState(false);
    const [createPlanDialogVisible, setCreatePlanDialogVisible] = useState(false);
    const [exerciseDialogVisible, setExerciseDialogVisible] = useState(false);
    const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        exerciseType: { value: null, matchMode: FilterMatchMode.CONTAINS },
        description: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });

    const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'

    const [refreshKey, setRefreshKey] = useState(0);

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

    useEffect(() => {
        const fetchData = async () => {
          try {
            setLoading(true);
    
            const subscriptionData = await fetchCoachSubscription(user.userId);
            setCurrentPlanId(subscriptionData.subscriptionPlan.id);

            const workoutData = await fetchCoachWorkouts(user.userId)
            const mappedWorkouts = workoutData.map(workout => {
                const instance = workout.workoutInstances.find(instance => instance.isTemplate)
                return {
                    ...workout,
                    workoutInstance: instance
                }
            })
            // console.log(mappedWorkouts)
            setWorkouts(mappedWorkouts);
    
            const data = await fetchCoach(user.userId)
            setCoachInfo(data);
    
            const coachPlansData = await fetchCoachPlans(user.userId);
            setCoachPlans(coachPlansData);
    
            const exercisesResponse = await fetch(`${apiUrl}/exercise/coach/${user.userId}`);
            if (!exercisesResponse.ok) {
              const errorData = await exercisesResponse.json();
              throw new Error(errorData.message || 'Something went wrong');
            }
            const exercisesData = await exercisesResponse.json();
            setExercises(exercisesData);
    
            const bodyAreasResponse = await fetch(`${apiUrl}/exercise/body-area`);
            if (!bodyAreasResponse.ok) {
              const errorData = await bodyAreasResponse.json();
              throw new Error(errorData.message || 'Something went wrong');
            }
            const bodyAreasData = await bodyAreasResponse.json();
            const formattedBodyAreas = bodyAreasData.map(bodyArea => ({ label: bodyArea.name, value: bodyArea.id }));
            setBodyAreas(formattedBodyAreas);
    
            const subscriptionPlansData = await fetchCoachSubscriptionPlans();
            setSubscriptionPlans(subscriptionPlansData);
    
          } catch (error) {
            if (error.message === 'Coach not found') {
                navigate('/complete-coach-profile');
            }
            showToast('error', 'Error', error.message);
          } finally {
            setLoading(false);
          }
        };
    
        fetchData();
      }, [user.userId, showToast, navigate, refreshKey]);

    const openCreateExerciseDialog = () => {
        setDialogMode('create');
        setSelectedBodyAreas([]);
        setExerciseDialogVisible(true);
      };
      
    const openEditExerciseDialog = (exercise) => {
        setDialogMode('edit');
        setNewExercise(exercise);
        const arrayBodyAreas = exercise.exerciseBodyAreas.map( exerciseBodyArea => exerciseBodyArea.bodyArea.id)
        setSelectedBodyAreas(arrayBodyAreas)
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
        setExerciseDialogVisible(false);
    };

    const openCreatePlanDialog = () => {
        setDialogMode('create');
        setCreatePlanDialogVisible(true);
    };

    const openEditPlanDialog = (plan) => {
        setDialogMode('edit');
        setNewPlan(plan);
        setCreatePlanDialogVisible(true);
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

    const handleVideoClick = (url) => {
        try {
            const videoId = extractYouTubeVideoId(url);
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            setCurrentVideoUrl(embedUrl);
            setVideoDialogVisible(true);
        } catch (error) {
            showToast('error', 'Error', error.message)
        }
    };

    const handleSaveExercise = async () => {
        const url = dialogMode === 'create' ? `${apiUrl}/exercise` : `${apiUrl}/exercise/${newExercise.id}`;
        const method = dialogMode === 'create' ? 'POST' : 'PUT';
        const body = {
            ...newExercise,
            bodyArea: selectedBodyAreas,
            coachId: user.userId
        }
        // return
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
            setRefreshKey(old => old + 1);
            setSelectedBodyAreas([]);
        } catch (error) {
          showToast('error', 'Error', error.message);
        }
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
      
          setRefreshKey(old => old + 1);
          showToast('success', 'Success', 'Exercise deleted successfully');
        } catch (error) {
          showToast('error', 'Error', error.message);
        }
    };

    const confirmCreatePlan = async () =>{
        if(newPlan.name === '')
            return showToast('error', 'Error', 'Plan name can not be empty')
        if(newPlan.price <= 0)
            return showToast('error', 'Error', 'Price can not be 0 or less')
        if(newPlan.workoutsPerWeek <= 0)
            return showToast('error', 'Error', 'Workouts per week can not be 0 or less')

        showConfirmationDialog({
            message: "Are you sure you want to create this plan?",
            header: "Confirmation",
            icon: "pi pi-exclamation-triangle",
            accept: () => handleCreatePlan(),
            reject: () => console.log('Rejected u mf')
        });
    }
    const handleCreatePlan = async () => {
        try {
            const data = await createOrUpdateCoachPlan(newPlan, newPlan.id, user.userId, dialogMode);
            if (dialogMode === 'create') {
                if(data)
                    showToast('success', 'Success', 'New plan created successfully');
            } else {
                if(data)
                    showToast('success', 'Success', 'Plan updated successfully');
                else{
                    showToast('error', 'Error', 'Plan not updated');
                }
            }
            closeCreatePlanDialog();
            setRefreshKey(old => old + 1);
        } catch (error) {
            showToast('error', 'Error', error.message);
        }
    };

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
        console.log('FileUpload cl  eared');
    };

    const handleUpload = async (formData, files) => {
        try {
            setLoading(true)
            const response = await fetch(`${apiUrl}/exercise/import/${coach.id}`, {
                method: 'POST',
                body: formData,
              });
        
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
        
              const result = await response.json();
              onTemplateUpload({ files });
              setRefreshKey(old => old+1)
              if(result.duplicateExercises.length > 0 ){
                showToast('warn', `Exercises uploaded: ${result.registeredExercisesCount}. Duplicated Exercises: ${result.duplicatesCount}` , `${result.duplicateExercises.map(ex => `${ex.name} at row ${ex.row}`)}`, true)
              }else {
                showToast('success', 'Success', `${result.registeredExercisesCount.map(ex => `${ex.name} at row ${ex.row}`)}`)
              }
              console.log(result.duplicateExercises);
              fileUploadRef.current.clear();
        } catch (error) {
            onTemplateError(error);
            console.error('Error during upload:', error);
        }finally{
            setLoading(false)
        }
    }
    const uploadHandler = async ({ files }) => {
        const formData = new FormData();
        formData.append('file', files[0]);
        const rowsCount = await readFile(files[0]);
        // console.log(numRows)
        // console.log(formData, files[0], coach.id)
        // return
        showConfirmationDialog({
            message: `Are you sure you want to upload ${rowsCount} exercises?`,
            header: "Confirmation",
            icon: "pi pi-exclamation-triangle",
            accept: () => handleUpload(formData, files),
            reject: () => console.log('Rejected u mf')
        });
    
    };

    const readFile = (file) => {
        return new Promise((resolve, reject) => {
            setLoading(true)
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                const sheetDataMapped = sheetData.filter(array => array.length > 0)
                setNumRows(sheetDataMapped.length - 1); // Asumiendo que la primera fila es el encabezado
                resolve(sheetDataMapped.length - 1);
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
            setLoading(false)
        });
    };

    const confirmDeletePlan = async (planId) =>{
        showConfirmationDialog({
            message: "Are you sure you want to delete this plan?",
            header: "Confirmation",
            icon: "pi pi-exclamation-triangle",
            accept: () => handleDeletePlan(planId),
            reject: () => console.log('Rejected u mf')
        });
    }
    const handleDeletePlan = async (planId) => {
        try {
          const response = await fetch(`${apiUrl}/subscription/coach/coachPlan/${planId}`, {
            method: 'DELETE',
          });
      
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Something went wrong');
          }
      
          setCoachPlans(coachPlans.filter(plan => plan.id !== planId));
          showToast('success', 'Success', 'Plan deleted successfully');
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

    const subtitleBody = (plan) => {
        const perMonth = 'per month'
        return (
            <div>
                <h2 className='subscription-plan-h2'>{plan.price === 0 ? 'Free' : `$${plan.price}`}</h2>
                <p className='text-center'>{plan.price === 0 ? (<br></br>) : perMonth}</p>
            </div>
        )
    }

    const subscriptionTemplate = (plan) => {
        const isCurrent = plan.id === currentPlanId;
        return (
        <div className={`subscription-card ${isCurrent ? 'current-subscription' : ''}`}>
            <Card title={plan.name} className='subscription-card' subTitle={() => subtitleBody(plan)}>
            <p>Max Clients: {plan.max_clients}</p>
            {/* {isCurrent && <Button label="Current Plan" icon="pi pi-check" className="p-button-rounded p-button-success" />} */}
            </Card>
        </div>
        );
    };

    const coachPlanTemplate = (plan) => {
        return (
        <div className='subscription-card'>
            <Card title={plan.name} className='subscription-card' subTitle={() => subtitleBody(plan)} 
                footer={
                <div className="flex justify-content-around">
                    <Button icon="pi pi-pencil" className="p-button-rounded p-button-success p-mr-2" onClick={() => openEditPlanDialog(plan)}/>
                    <Button icon="pi pi-trash" className="p-button-rounded p-button-danger" onClick={() => confirmDeletePlan(plan.id)}/>
                </div>
                }
            >
            <p>Workouts per Week: {plan.workoutsPerWeek}</p>
            <p>Include Meal Plan: {plan.includeMealPlan ? 'Yes' : 'No'}</p>
            {/* <div className="flex justify-content-around">
                <Button icon="pi pi-pencil" className="p-button-rounded p-button-success p-mr-2" />
                <Button icon="pi pi-trash" className="p-button-rounded p-button-danger" />
            </div> */}
            </Card>
        </div>
        );
    };

    const actionsBodyTemplate = (rowData) => {
        return (
          <>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-success p-button-sm p-mr-2" onClick={() => openEditExerciseDialog(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-danger p-button-sm" onClick={() => {
                    
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

      const hidePlanDetails = () => {

        setPlanDetailsVisible(false);
        setSelectedPlan(null);
      };
    
      const handleViewPlanDetails = (workoutInstanceId) => {
        // const workoutInstanceId = plan.workoutInstances.find(instances => instances.isTemplate === true).id
        setLoading(true)
        setSelectedPlan(workoutInstanceId);
        setPlanDetailsVisible(true);
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

    return (
        <div className="flex flex-column align-items-center justify-content-center w-11 mx-auto responsive-table">
            <h1>Coach Profile</h1>
            <div className="flex flex-column md:flex-row gap-2 justify-content-between w-full overflow-auto h-45">
                <div className='flex flex-column gap-3 w-full md:w-3'>
                    {coachInfo && (
                        <Card title="Coach Information" className="mb-4">
                            <div className="p-grid">
                                <div className="p-col-12 p-md-6">
                                <p><strong>Name:</strong> {coachInfo.name}</p>
                                <p><strong>Email:</strong> {coachInfo.user.email}</p>
                                <p  className='overflow-hidden text-overflow-ellipsis'><strong>Biography:</strong> {coachInfo.bio}</p>
                                <p  className='overflow-hidden text-overflow-ellipsis'><strong>Experience:</strong> {coachInfo.experience}</p>
                                <p><strong>Training type:</strong> {coachInfo.trainingType.join(', ')}</p>
                                {coachInfo.hasGym && 
                                    <p><strong>Gym Location:</strong> {coachInfo.gymLocation}</p>
                                }
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
                <div className='w-full md:w-8'>
                    <TabView className='hola'>
                        <TabPanel header="Workouts">
                        <DataTable value={workouts} paginator rows={10}>
                            <Column field="planName" header="Name"  className='overflow-hidden text-overflow-ellipsis'/>
                            <Column field="workoutInstance.personalizedNotes" header="Description" />
                            
                            <Column
                                body={(rowData) => (
                                    <div className='flex gap-2'>
                                        <Button tooltip='View Details' icon="pi pi-eye"    className="p-button-rounded p-button-info" onClick={() => handleViewPlanDetails(rowData.workoutInstance.id)} />
                                        <Button tooltip='Edit'         icon="pi pi-pencil" className="p-button-rounded p-button-warning" onClick={() => navigate(`/plans/edit/${rowData.workoutInstance.id}`)} />
                                    </div>
                                )}
                                header="Actions"
                            />
                        </DataTable>
                        </TabPanel>
                        <TabPanel header="Coach Plans">
                            {/* <div className="flex gap-2 align-items-center justify-content-evenly flex-wrap"> */}
                            <div className="flex gap-2 align-items-center justify-content-between">
                                {coachPlans.map(plan => (
                                <div key={plan.id} className="">
                                    {coachPlanTemplate(plan)}
                                </div>
                                ))}
                            </div>
                            {coachPlans.length < 4 && (
                                <div className="flex justify-content-center mt-4">
                                    <Button label="Add New Plan" icon="pi pi-plus" className="p-button-rounded p-button-info" onClick={openCreatePlanDialog} />
                                </div>
                            )}
                        </TabPanel>
                        <TabPanel header="Exercises Library">
                             
                            <DataTable 
                                value={exercises} 
                                paginator 
                                rows={10} 
                                rowsPerPageOptions={[10, 20, 50, 100]}
                                className='exercises-table'
                                filters={filters}
                                globalFilterFields={['name', 'exerciseType', 'description']}
                                onFilter={(e) => setFilters(e.filters)}
                                rowClassName={'row'}
                            >
                                <Column field="name" header="Exercise Name" style={{ width: '20%' }} filter  filterElement={nameFilterTemplate}/>
                                <Column field="multimedia" header="Video" body={videoBodyTemplate} />
                                <Column field="exerciseType" header="Type" filter filterElement={exerciseTypeFilterTemplate} />
                                <Column field="description" header="Description" style={{ width: '30%' }} filter filterElement={descriptionFilterTemplate}/>
                                <Column field="equipmentNeeded" header="Equipment Needed" />

                                <Column field="actions" header="Actions" body={(rowData) => actionsBodyTemplate(rowData)}/>
                            </DataTable>
                            <div className="flex justify-content-center align-items-center gap-3 mt-2">
                                    <FileUpload 
                                        ref={fileUploadRef}
                                        name="file"
                                        mode='basic'
                                        customUpload
                                        uploadHandler={uploadHandler}
                                        onSelect={onTemplateSelect}
                                        onError={onTemplateError}
                                        onClear={onTemplateClear}
                                        accept=".xlsx"
                                        maxFileSize={1000000}
                                        chooseOptions={{ 
                                            icon: selectedFile ? 'pi pi-fw pi-cloud-upload' : 'pi pi-fw pi-file', 
                                            iconOnly: selectedFile ? true : false, 
                                            className: 'custom-upload-btn p-button-success p-button-rounded p-button-outlined', 
                                            label: selectedFile ? 'Upload' : 'Import exercises' 
                                        }}
                                        uploadOptions={{ icon: 'pi pi-fw pi-cloud-upload', iconOnly: true, className: 'custom-upload-btn p-button-success p-button-rounded p-button-outlined' }}
                                        
                                        // emptyTemplate={<p className="m-0">Drag and drop files to here to upload and import exercises.</p>}
                                        // chooseLabel="Import Exercises"
                                        // uploadLabel="Upload"
                                        // cancelLabel="Cancel"
                                        
                                    />
                                {/* </div> */}
                                <div>
                                    <Button label="Add New Exercise" icon="pi pi-plus" className="p-button-rounded p-button-info" onClick={openCreateExerciseDialog} />
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel header="Subscription Plans">
                            <div className="flex gap-2 align-items-center justify-content-between">
                                {subscriptionPlans.map(plan => (
                                    <div key={plan.id}>
                                        {subscriptionTemplate(plan)}
                                    </div>
                                ))}
                            </div>
                        </TabPanel>
                    </TabView>
                </div>
            </div>
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

            <Dialog draggable={false}  resizable={false} header={dialogMode === 'create' ? "Create New Coach Plan" : "Edit Coach Plan"} className="responsive-dialog" visible={createPlanDialogVisible} style={{ width: '50vw' }} onHide={closeCreatePlanDialog}>
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
                    <InputNumber id="workoutsPerWeek" value={newPlan.workoutsPerWeek} onChange={(e) => setNewPlan({ ...newPlan, workoutsPerWeek: e.value })} />
                    </div>
                    <div className="p-field-checkbox">
                    <Checkbox inputId="includeMealPlan" checked={newPlan.includeMealPlan} onChange={(e) => setNewPlan({ ...newPlan, includeMealPlan: e.checked })} />
                    <label htmlFor="includeMealPlan">Include Meal Plan</label>
                    </div>
                    <div className="p-field">
                    <Button label="Create Plan" icon="pi pi-check" onClick={confirmCreatePlan} />
                    </div>
                </div>
            </Dialog>
            
            <Dialog draggable={false}  resizable={false} header={dialogMode === 'create' ? "Create New Exercise" : "Edit Exercise"}  className="responsive-dialog" visible={exerciseDialogVisible} style={{ width: '50vw' }} onHide={closeExerciseDialog}>
                <div className="p-fluid">
                    <div className="p-field">
                        <label htmlFor="name">{dialogMode === 'create' ? 'Exercise Name' : 'Edit Exercise Name'}</label>
                        <InputText id="name" value={newExercise.name} onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })} />
                    </div>
                    <div className="p-field">
                        <label htmlFor="description">Description</label>
                        <InputTextarea id="description"  className='overflow-hidden text-overflow-ellipsis' value={newExercise.description} onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })} rows={3} />
                    </div>
                    <div className="p-field">
                        <label htmlFor="multimedia">Video URL</label>
                        <InputText id="multimedia" value={newExercise.multimedia} onChange={(e) => setNewExercise({ ...newExercise, multimedia: e.target.value })} />
                    </div>
                    <div className="p-field">
                        <label htmlFor="exerciseType">Type</label>
                        <InputText id="exerciseType" value={newExercise.exerciseType} onChange={(e) => setNewExercise({ ...newExercise, exerciseType: e.target.value })} />
                    </div>
                    <div className="p-field">
                        <label htmlFor="equipmentNeeded">Equipment Needed</label>
                        <InputText id="equipmentNeeded" value={newExercise.equipmentNeeded} onChange={(e) => setNewExercise({ ...newExercise, equipmentNeeded: e.target.value })} />
                    </div>
                    <div className="p-field">
                        <label htmlFor="equipmentNeeded">Body area involved</label>
                        <MultiSelect options={bodyAreas}  filter showClear required placeholder="Select a body area" value={selectedBodyAreas} 
  onChange={(e) => setSelectedBodyAreas(e.value)}  />
                    </div>
                    <div className="p-field">
                    <Button label={dialogMode === 'create' ? "Create Exercise" : "Update Exercise"} icon="pi pi-check" onClick={() => {
                            if(newExercise.name === '')
                                return showToast('error', 'Error', 'Exercise name can not be empty.')
                            if (!isValidYouTubeUrl(newExercise.multimedia)) {
                                return showToast('error', 'Error', 'Please enter a valid YouTube URL');
                            }
                            showConfirmationDialog({
                                message: dialogMode === 'create' ? "Are you sure you want to create this exercise?" : "Are you sure you want to update this exercise?",
                                header: "Confirmation",
                                icon: "pi pi-exclamation-triangle",
                                accept: () => handleSaveExercise(),
                                reject: () => console.log('Rejected'),
                            })
                        }}
                    />
                    </div>
                </div>
            </Dialog>

            <Dialog draggable={false}  resizable={false} header="Plan Details" visible={planDetailsVisible} style={{ width: '80vw' }} onHide={hidePlanDetails}>
                {selectedPlan && <PlanDetails planId={selectedPlan} setPlanDetailsVisible={setPlanDetailsVisible} 
                    setRefreshKey={setRefreshKey} setLoading={setLoading} />}
            </Dialog>
        </div>
    );
};

export default CoachProfile;
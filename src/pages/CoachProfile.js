import React, { useEffect, useState, useContext } from 'react';
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
import { Checkbox } from 'primereact/checkbox';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { isValidYouTubeUrl, extractYouTubeVideoId } from '../utils/UtilFunctions';
import '../styles/CoachProfile.css'
import { MultiSelect } from 'primereact/multiselect';
const apiUrl = process.env.REACT_APP_API_URL;

const CoachProfile = () => {
    const { user } = useContext(UserContext);
    const { showConfirmationDialog } = useConfirmationDialog();
    const showToast = useToast();
    const navigate = useNavigate();

    const [coachInfo, setCoachInfo] = useState(null);
    const [coachPlans, setCoachPlans] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [bodyAreas, setBodyAreas] = useState([]);
    const [selectedBodyAreas, setSelectedBodyAreas] = useState([]);
    const [currentVideoUrl, setCurrentVideoUrl] = useState('');

    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [currentPlanId, setCurrentPlanId] = useState(null);
    
    const [videoDialogVisible, setVideoDialogVisible] = useState(false);
    const [createPlanDialogVisible, setCreatePlanDialogVisible] = useState(false);
    const [exerciseDialogVisible, setExerciseDialogVisible] = useState(false);

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
        fetch(`${apiUrl}/subscription/coach/${user.userId}`)
            .then(async (response) => {
                if (!response.ok) {
                    const errorData = await response.json();
                    if(errorData.message && errorData.message === 'Coach not found')
                        return navigate('/complete-coach-profile')
                    throw new Error(errorData.message || 'Something went wrong');
                }
                const data = await response.json();
                setCurrentPlanId(data.subscriptionPlan.id)
            })
            .catch(error => showToast('error', 'Error' `${error.message}`));
        // Fetch coach information
        fetch(`${apiUrl}/users/coach/${user.userId}`)
            .then(async (response) => {
                if(!response.ok){
                    const errorData = await response.json();
                    if(errorData.message && errorData.message === 'Coach not found')
                        return navigate('/complete-coach-profile')
                    throw new Error(errorData.message || 'Something went wrong')
                }else{
                    const data = await response.json();
                    setCoachInfo(data)
                }
            })
            .catch(error => showToast('error', 'Error', error.message));

        // Fetch coach plans
        fetch(`${apiUrl}/users/coach/coachPlan/${user.userId}`)
            .then(async (response) => {
                if(!response.ok){
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Something went wrong')
                }else{
                    const data = await response.json();
                    setCoachPlans(data)
                }
            })
            .catch(error => showToast('error', 'Error', error.message));

        // Fetch exercises library
        fetch(`${apiUrl}/exercise/coach/${user.userId}`)
        .then(async (response) => {
            if(!response.ok){
                const errorData = await response.json();
                throw new Error(errorData.message || 'Something went wrong')
            }else{
                const data = await response.json();
                setExercises(data)
            }
        })
        .catch(error => showToast('error', 'Error', error.message));

        fetch(`${apiUrl}/exercise/body-area`)
            .then(async (response) => {
                if(!response.ok){
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Something went wrong')
                }else{
                    const data = await response.json();
                    const formatedbodyareas = data.map(bodyArea => ({ label: bodyArea.name, value: bodyArea.id }));
                    setBodyAreas(formatedbodyareas)
                }
            })
            .catch(error => showToast('error', 'Error', error.message));

        fetch(`${apiUrl}/subscription/coach-subscription-plans`)
            .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                console.log(errorData)
                throw new Error(errorData.message || 'Something went wrong');
            }
            const data = await response.json()
            setSubscriptionPlans(data)
            })
            .catch(error => showToast('error', 'Error fetching plans' `${error.message}`));
    }, [user.userId, showToast, refreshKey]);

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
        console.log(body)
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
            const url = dialogMode === 'create' ? `${apiUrl}/subscription/coach/coachPlan` : `${apiUrl}/subscription/coach/coachPlan/${newPlan.id}`;
            const method = dialogMode === 'create' ? 'POST' : 'PUT';
            const response = await fetch(url, {
                method: method,
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({...newPlan, coachId: user.userId}),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Something went wrong');
            }
            if (dialogMode === 'create') {
                showToast('success', 'Success', 'New plan created successfully');
            } else {
                showToast('success', 'Success', 'Plan updated successfully');
            }
            closeCreatePlanDialog();
            setRefreshKey(old=> old+1)
        } catch (error) {
            showToast('error', 'Error', error.message);
        }
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
            Watch video
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
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-success p-mr-2" onClick={() => openEditExerciseDialog(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-danger" onClick={() => {
                    
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

    return (
        <div className="flex flex-column align-items-center justify-content-center w-11 mx-auto">
            <h1>Coach Profile</h1>
            <div className="flex flex-row gap-2 justify-content-between w-full">
                <div className=' flex flex-column gap-3'>
                {coachInfo && (
                    <Card title="Coach Information" className="mb-4">
                        <div className="p-grid">
                            <div className="p-col-12 p-md-6">
                            <p><strong>Name:</strong> {coachInfo.name}</p>
                            <p><strong>Email:</strong> {coachInfo.user.email}</p>
                            <p><strong>Biography:</strong> {coachInfo.bio}</p>
                            <p><strong>Experience:</strong> {coachInfo.experience}</p>
                            <p><strong>Training type:</strong> {coachInfo.trainingType.join(', ')}</p>
                            {coachInfo.hasGym && 
                                <p><strong>Gym Location:</strong> {coachInfo.gymLocation}</p>
                            }
                            </div>
                        </div>
                    </Card>
                )}
                </div>
                <div className='w-10'>
                    <TabView className='hola'>
                        <TabPanel header="Coach Plans">
                            <div className="flex gap-2 align-items-center justify-content-evenly flex-wrap">
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
                            <DataTable value={exercises}>
                                <Column field="name" header="Exercise Name" />
                                <Column field="multimedia" header="Video" body={videoBodyTemplate} />
                                <Column field="exerciseType" header="Type" />
                                <Column field="description" header="Description" />
                                <Column field="equipmentNeeded" header="Equipment Needed" />

                                <Column field="actions" header="Actions" body={(rowData) => actionsBodyTemplate(rowData)}/>
                            </DataTable>
                            <div className="flex justify-content-center mt-4">
                                <Button label="Add New Exercise" icon="pi pi-plus" className="p-button-rounded p-button-info" onClick={openCreateExerciseDialog} />
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
            <Dialog header="Video" visible={videoDialogVisible} style={{ width: '50vw' }} onHide={() => setVideoDialogVisible(false)}>
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

            <Dialog header="Create New Coach Plan" visible={createPlanDialogVisible} style={{ width: '50vw' }} onHide={closeCreatePlanDialog}>
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
            
            <Dialog header={dialogMode === 'create' ? "Create New Exercise" : "Edit Exercise"} visible={exerciseDialogVisible} style={{ width: '50vw' }} onHide={closeExerciseDialog}>
                <div className="p-fluid">
                    <div className="p-field">
                        <label htmlFor="name">{dialogMode === 'create' ? 'Exercise Name' : 'Edit Exercise Name'}</label>
                        <InputText id="name" value={newExercise.name} onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })} />
                    </div>
                    <div className="p-field">
                        <label htmlFor="description">Description</label>
                        <InputTextarea id="description" value={newExercise.description} onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })} rows={3} />
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

        </div>
    );
};

export default CoachProfile;
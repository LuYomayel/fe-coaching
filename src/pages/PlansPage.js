import React, { useState, useContext, useEffect } from 'react';
import { Card } from 'primereact/card';
import Spinner from '../utils/LittleSpinner';
import { FormattedMessage } from 'react-intl';
import { Button } from 'primereact/button';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';
import { fetchCoachWorkouts, deleteWorkoutPlan } from '../services/workoutService';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { MultiSelect } from 'primereact/multiselect';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { fetchCoachStudents } from '../services/usersService';
import { assignWorkoutToClient, unassignWorkoutFromClient } from '../services/workoutService';
import { ButtonGroup } from 'primereact/buttongroup';
import { Checkbox } from 'primereact/checkbox';

export default function PlansPage() {
    const [workouts, setWorkouts] = useState([]);
    const intl = useIntl();
    const navigate = useNavigate();
    const { user } = useContext(UserContext);
    const [refreshKey, setRefreshKey] = useState(0);
    const { setLoading, isLoading } = useSpinner();
    const { showConfirmationDialog } = useConfirmationDialog();
    const showToast = useToast();

    const [selectedWorkouts, setSelectedWorkouts] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [isDialogVisible, setDialogVisible] = useState(false);
    const [students, setStudents] = useState([]);
    const [filterOption, setFilterOption] = useState('all');
    const [filteredWorkouts, setFilteredWorkouts] = useState(workouts);


    
    useEffect(() => {
        fetchWorkoutPlans();
        const loadStudents = async () => {
            try {
                const userId = user.userId;
                const {data} = await fetchCoachStudents(userId);
                setStudents(data);
            } catch (error) {
                console.error('Error loading students:', error);
            }
        };
        loadStudents();
    }, [refreshKey]);

    useEffect(() => {
        const filterWorkouts = () => {
            if (filterOption === 'all') {
                setFilteredWorkouts(workouts);
            } else if (filterOption === 'general') {
                console.log(workouts);
                setFilteredWorkouts(workouts.filter(workout => workout.clientWorkouts.length === 0));
            } else {
                setFilteredWorkouts(workouts.filter(workout => workout.clientWorkouts.some(cw => cw.clientSubscription.client.id === filterOption)));
            }
        };

        filterWorkouts();
        // eslint-disable-next-line
    }, [filterOption, workouts, refreshKey]);

    const fetchWorkoutPlans = async () => {
        setLoading(true);
        try {
            const response = await fetchCoachWorkouts(user.userId);
            if(response.message === 'success') {
                console.log(response.data);
                setWorkouts(response.data);
            } else {
                showToast('error', intl.formatMessage({ id: 'coach.delete.error.generic' }), response.message);
            }
        } catch (error) {
            console.error('Error fetching workout plans:', error);
            showToast('error', intl.formatMessage({ id: 'coach.delete.error.generic' }), error.message);
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (workoutInstanceTemplateId) => {
        showConfirmationDialog({
          message: intl.formatMessage({ id: 'coach.delete.confirmation' }),
          header: intl.formatMessage({ id: 'coach.delete.header' }),
          icon: 'pi pi-exclamation-triangle',
          accept: async () => {
            setLoading(true);
            try {
              await deleteWorkoutPlan(workoutInstanceTemplateId, true);
              setRefreshKey(prev => prev + 1);
            } catch (error) {
              console.error('Error deleting workout plan:', error.message);
              
              if(error.message === 'ER_ROW_IS_REFERENCED_2') {
                showToast('error', intl.formatMessage({ id: 'coach.delete.error.referenced' }), intl.formatMessage({ id: 'coach.delete.error.referenced.detail' }));
              } else {
                showToast('error', intl.formatMessage({ id: 'coach.delete.error.generic' }), error.message);
              }
            }
          },
          reject: () => {
            // Manejar el rechazo si es necesario
            setLoading(true);
          },
          finally: () => {
            setLoading(false);
          }
    
        });
      }

    const handleUnassignFromClient = async (workoutInstanceTemplateId) => {
        setLoading(true);
        try {
            console.log(workoutInstanceTemplateId, filterOption);
            if(filterOption !== 'all' && filterOption !== 'general') {
                await unassignWorkoutFromClient([workoutInstanceTemplateId], filterOption);
                setRefreshKey(prev => prev + 1);
            } else {
                showToast('error', intl.formatMessage({ id: 'coach.unassign.error' }), intl.formatMessage({ id: 'coach.unassign.error.detail' }));
            }
        } catch (error) {
            console.error('Error unassigning workout from client:', error);
            showToast('error', intl.formatMessage({ id: 'coach.unassign.error' }), error.message);
        } finally {
            setLoading(false);
            setSelectedWorkouts([]);
            setSelectedClient(null);
            setDialogVisible(false);
        }
    }

    const handleUnassignAllFromClient = async () => {
        setLoading(true);
        try {
            console.log(selectedWorkouts.map(workout => workout.id), filterOption);
            if(filterOption !== 'all' && filterOption !== 'general') {
                await unassignWorkoutFromClient(selectedWorkouts.map(workout => workout.id), filterOption);
                setRefreshKey(prev => prev + 1);
            } else {
                showToast('error', intl.formatMessage({ id: 'coach.unassign.error' }), intl.formatMessage({ id: 'coach.unassign.error.detail' }));
            }
            setSelectedWorkouts([]);
            setSelectedClient(null);
            
        } catch (error) {
            console.error('Error unassigning workout from client:', error);
            showToast('error', intl.formatMessage({ id: 'coach.unassign.error' }), error.message);
        } finally {
            setLoading(false);
        }
    }

    /*const statusTemplate = (rowData) => {
        const workoutInstanceTemplate = rowData.workoutInstances.find(w => w.isTemplate === true);
        return (
            <div>
                {(filterOption === 'all' || filterOption === 'general') ? <Button label={intl.formatMessage({ id: 'common.assign' })} icon="pi pi-user-plus" className="p-button-success" onClick={() => handleAssignToClient(workoutInstanceTemplate.id)} /> 
                : <Button label={intl.formatMessage({ id: 'common.unassign' })} icon="pi pi-user-minus" className="p-button-danger" onClick={() => handleUnassignFromClient(rowData.id)} />}
                <Button label={intl.formatMessage({ id: 'common.edit' })} icon="pi pi-pencil" className="p-button-secondary" onClick={() => navigate(`/plans/edit/${workoutInstanceTemplate.id}`)} />
                <Button label={intl.formatMessage({ id: 'common.delete' })} icon="pi pi-trash" className="p-button-danger" onClick={() => handleDelete(workoutInstanceTemplate.id)} />
            </div>
        )
    };*/

    const handleAssignToClient = async () => {
        setLoading(true);
        try {
            if (selectedWorkouts.length === 0 || !selectedClient) {
                showToast('error', intl.formatMessage({ id: 'coach.assign.error' }), intl.formatMessage({ id: 'coach.assign.error.detail' }));
                return;
            }

            await assignWorkoutToClient(selectedWorkouts.map(workout => workout.id), selectedClient.id);

            setDialogVisible(false);
            setSelectedWorkouts([]);
            setSelectedClient(null);
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Error assigning workout to client:', error);
            showToast('error', intl.formatMessage({ id: 'coach.assign.error' }), error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAssignDialog = (workoutId) => {
        console.log(workoutId);
        setSelectedWorkouts([workouts.find(w => w.id === workoutId)]);
        setDialogVisible(true);
    }

    const filterOptions = [
        { label: 'Todos', value: 'all' },
        { label: 'Generales', value: 'general' },
        ...students.map(student => ({ label: student.name, value: student.id }))
    ];

    const renderPlanName = (rowData) => {
        const workoutInstanceTemplate = rowData.workoutInstances.find(w => w.isTemplate === true);
        return (
            <div className="flex justify-content-between align-items-center">
                <div className="flex gap-2 align-items-center">
                    <Checkbox 
                        checked={selectedWorkouts.some(w => w.id === rowData.id)}
                        onChange={(e) => {
                            if (e.checked) {
                                setSelectedWorkouts([...selectedWorkouts, rowData]);
                            } else {
                                setSelectedWorkouts(selectedWorkouts.filter(w => w.id !== rowData.id));
                            }
                        }}
                    />
                    <span>{rowData.planName}</span>
                </div>
                <ButtonGroup>
                {(filterOption === 'all' || filterOption === 'general') ? 
                    <Button tooltip={intl.formatMessage({ id: 'common.assign' })} icon="pi pi-user-plus" className="p-button-success" onClick={() => handleOpenAssignDialog(rowData.id)} /> 
                :   <Button tooltip={intl.formatMessage({ id: 'common.unassign' })} icon="pi pi-user-minus" className="p-button-warning" onClick={() => handleUnassignFromClient(rowData.id)} />}
                <Button tooltip={intl.formatMessage({ id: 'common.edit' })} icon="pi pi-pencil" className="p-button-secondary" onClick={() => navigate(`/plans/edit/${workoutInstanceTemplate.id}`)} />
                <Button tooltip={intl.formatMessage({ id: 'common.delete' })} icon="pi pi-trash" className="p-button-danger" onClick={() => handleDelete(workoutInstanceTemplate.id)} />
                </ButtonGroup>
            </div>
        )
    }

    return <div>
        <Card className={isLoading ? 'flex justify-content-center mb-4' : 'mb-4'} >
                {isLoading ? <Spinner /> :
                    <>
                        <h2 className="text-2xl font-bold mb-3">
                            <FormattedMessage id="coach.sections.trainingPlans" />
                        </h2>
                        <small className="block text-gray-600 mb-4">
                            <FormattedMessage id="coach.plan.description" />
                        </small>
                        <Dropdown value={filterOption} options={filterOptions} onChange={(e) => setFilterOption(e.value)} placeholder="Filtrar por" />
                        <div className="grid">
                            {filteredWorkouts.map((plan, index) => (
                                <div key={index} className="col-12 md:col-4">
                                    <Card title={renderPlanName(plan)} subTitle={plan.workoutInstances[0].personalizedNotes} className="mb-3">
                                    </Card>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-content-end gap-2 ">
                            <Button label={intl.formatMessage({ id: 'coach.buttons.newPlan' })} icon="pi pi-plus" className="p-button-rounded p-button-lg p-button-primary" onClick={() => navigate('/plans/create')} />
                            {(filterOption === 'all' || filterOption === 'general') ? <Button 
                                label={intl.formatMessage({ id: 'coach.buttons.assignPlans' })} 
                                icon="pi pi-user-plus" 
                                className="p-button-rounded p-button-lg p-button-primary" 
                                onClick={() => setDialogVisible(true)}
                                disabled={selectedWorkouts.length === 0}
                            /> : <Button 
                                label={intl.formatMessage({ id: 'coach.buttons.unassignPlans' })} 
                                icon="pi pi-user-minus" 
                                className="p-button-rounded p-button-lg p-button-primary" 
                                onClick={() => handleUnassignAllFromClient()}
                                disabled={selectedWorkouts.length === 0}
                            />}
                        </div>
                        <Dialog header={intl.formatMessage({ id: 'coach.assign.dialog.header' })} visible={isDialogVisible} style={{ width: '50vw' }} onHide={() => setDialogVisible(false)}>
                            <div className="flex flex-column gap-3">
                                <div>
                                    <label className="block mb-2">Planes seleccionados:</label>
                                    <ul className="list-none p-0 m-0">
                                        {selectedWorkouts.map(workout => (
                                            <li key={workout.id} className="mb-2">{workout.planName}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <label className="block mb-2">{intl.formatMessage({ id: 'coach.assign.selectClient' })}</label>
                                    <Dropdown 
                                        value={selectedClient} 
                                        options={students} 
                                        onChange={(e) => setSelectedClient(e.value)} 
                                        optionLabel="name" 
                                        placeholder={intl.formatMessage({ id: 'coach.assign.selectClient' })}
                                        className="w-full"
                                    />
                                </div>
                                <Button 
                                    label={intl.formatMessage({ id: 'coach.assign.confirm' })} 
                                    icon="pi pi-check" 
                                    onClick={handleAssignToClient}
                                    className="w-full"
                                />
                            </div>
                        </Dialog>
                    </>
                }
            </Card>
    </div>;
};
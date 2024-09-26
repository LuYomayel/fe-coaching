import React, { useState, useEffect, useContext, Suspense, lazy } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { ProgressBar } from 'primereact/progressbar';
import { Avatar } from 'primereact/avatar';
import { Tag } from 'primereact/tag';
import { Timeline } from 'primereact/timeline';
import { Badge } from 'primereact/badge';
import { Chart } from 'primereact/chart';
import { Panel } from 'primereact/panel';
import { ListBox } from 'primereact/listbox';
import { Calendar } from 'primereact/calendar';
import { InputIcon } from 'primereact/inputicon';
import { IconField } from 'primereact/iconfield';
import { formatDate } from '../utils/UtilFunctions';

import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { useNavigate } from 'react-router-dom';
import { fetchCoachStudents, fetchRecentActivitiesByCoachId, fetchWorkoutProgressByCoachId, fetchUpcomingSessionsByCoachId, fetchLastMessages } from '../services/usersService';
import { fetchCoachWorkouts, fetchTrainingCyclesByCoachId } from '../services/workoutService';
import { ProgressSpinner } from 'primereact/progressspinner';
import Spinner from '../utils/LittleSpinner';

export default function CoachHomePage() {
    const [globalFilter, setGlobalFilter] = useState('');
    const { setLoading } = useSpinner();
    const showToast = useToast();
    const { user, coach } = useContext(UserContext);
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [trainingPlans, setTrainingPlans] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [recentActivities, setRecentActivities] = useState([]);
    const [workoutProgress, setWorkoutProgress] = useState([]);
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [workouts, setWorkouts] = useState([]);
    const [lastMessages, setLastMessages] = useState([]);

    const [isClientsLoading, setIsClientsLoading] = useState(true);
    const [isTrainingPlansLoading, setIsTrainingPlansLoading] = useState(true);
    const [isRecentActivitiesLoading, setIsRecentActivitiesLoading] = useState(true);
    const [isUpcomingSessionsLoading, setIsUpcomingSessionsLoading] = useState(true);
    const [isLastMessagesLoading, setIsLastMessagesLoading] = useState(true);
    const [isWorkoutProgressLoading, setIsWorkoutProgressLoading] = useState(true);

    const processWorkoutProgressData = (workoutProgress) => {
        let completedCount = 0;
        let pendingCount = 0;
        let expiredCount = 0;
    
        // Recorrer el progreso de cada cliente
        workoutProgress.forEach(clientProgress => {
            clientProgress.progress.forEach(workout => {
                if (workout.status === 'Completed') {
                    completedCount++;
                } else if (workout.status === 'Pending') {
                    pendingCount++;
                } else if (workout.status === 'Expired') {
                    expiredCount++;
                }
            });
        });
    
        return { completedCount, pendingCount, expiredCount };
    };

    const colorPalette = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F', '#9B59B6'];

    const assignColorsToClients = (upcomingSessions) => {
        return upcomingSessions.map((session, index) => ({
            ...session,
            color: colorPalette[index % colorPalette.length], // Asigna un color cíclicamente
        }));
    };

    const upcomingSessionsWithColors = assignColorsToClients(upcomingSessions);

    useEffect(() => {
        const fetchClients = async () => {
          try {
            setIsClientsLoading(true);
            const clientsData = await fetchCoachStudents(user.userId);
            const activeClients = clientsData.filter(client => client.user.subscription.status === 'Active');
            setClients(activeClients);
          } catch (error) {
            console.error('Error fetching clients:', error);
          } finally {
            setIsClientsLoading(false);
          }
        };
    
        const fetchTrainingPlans = async () => {
          try {
            setIsTrainingPlansLoading(true);
            const trainingPlansData = await fetchWorkoutProgressByCoachId(user.userId);
            const plans = trainingPlansData.map(cycle => ({
                name: cycle.name,
                status: cycle.status, // Puedes mapear el estado real de cada ciclo
            }));
            setTrainingPlans(plans);
          } catch (error) {
            console.error('Error fetching training plans:', error);
          } finally {
            setIsTrainingPlansLoading(false);
          }
        };
    
        const fetchActivities = async () => {
          try {
            setIsRecentActivitiesLoading(true);
            const activities = await fetchRecentActivitiesByCoachId(coach.id);
            setRecentActivities(activities);
          } catch (error) {
            console.error('Error fetching activities:', error);
          } finally {
            setIsRecentActivitiesLoading(false);
          }
        };
    
        const fetchSessions = async () => {
          try {
            setIsUpcomingSessionsLoading(true);
            const sessions = await fetchUpcomingSessionsByCoachId(coach.id);
            setUpcomingSessions(sessions);
          } catch (error) {
            console.error('Error fetching upcoming sessions:', error);
          } finally {
            setIsUpcomingSessionsLoading(false);
          }
        };
    
        const fetchMessages = async () => {
          try {
            setIsLastMessagesLoading(true);
            const messages = await fetchLastMessages(user.userId);
            setLastMessages(messages);
          } catch (error) {
            console.error('Error fetching messages:', error);
          } finally {
            setIsLastMessagesLoading(false);
          }
        };
    
        const fetchProgress = async () => {
          try {
            setIsWorkoutProgressLoading(true);
            const workoutProgress = await fetchWorkoutProgressByCoachId(coach.id);

            const clientsData = await fetchCoachStudents(user.userId);
            // Assign workout progress to client via email
            const clientsWithProgress = clientsData.map(client => {
                const progress = workoutProgress.find(progress => progress.client === client.user.email);    
                return {
                    ...client,
                    progress: progress ? progress.progress : 0,
                };
            });
            setClients(clientsWithProgress);

            setWorkoutProgress(workoutProgress);
          } catch (error) {
            console.error('Error fetching workout progress:', error);
          } finally {
            setIsWorkoutProgressLoading(false);
          }
        };
    
        const fetchWorkouts = async () => {
            try {
                const workouts = await fetchCoachWorkouts(user.userId);
                setWorkouts(workouts);
            } catch (error) {
                console.error('Error fetching workouts:', error);
            }
        };

        // Llama las funciones de forma asíncrona
        fetchClients();
        fetchTrainingPlans();
        fetchActivities();
        fetchSessions();
        fetchMessages();
        fetchProgress();
        fetchWorkouts();
      }, [user.userId, coach.id]);

  const header = (
    <div className="flex justify-content-between align-items-center">
      <h5 className="m-0">Manage Clients</h5>
      <IconField iconPosition="left">
            <InputIcon className="pi pi-search"> </InputIcon>
            <InputText
                type="search"
                onInput={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search clients..."
                />
        </IconField>
    </div>
  );

    const clientNameTemplate = (rowData) => {
        return (
            <div className="flex align-items-center gap-2">
                <Avatar image={rowData.user.profilePicture || '/image.webp'} shape="circle" />
                <span>{rowData.name}</span>
            </div>
        );
    };

    const progressTemplate = (rowData) => {
        if(!rowData.progress) {
            return null;
        }
        const progress = rowData.progress;
        const totalWorkouts = progress.length;

        // Contar el número de entrenamientos completados, pendientes y expirados
        const completedCount = progress.filter(p => p.status === 'Completed').length;
        const pendingCount = progress.filter(p => p.status === 'Pending').length;
        const expiredCount = progress.filter(p => p.status === 'Expired').length;

        return (
            <div className="flex align-items-center gap-2">
                {/* Etiquetas para los distintos estados */}
                <Tag value={`Completed: ${completedCount}`} severity="success" />
                <Tag value={`Pending: ${pendingCount}`} severity="warning" />
                <Tag value={`Expired: ${expiredCount}`} severity="danger" />
                {/* {completedCount > 0 && (
                )}
                {pendingCount >= 0 && (
                )}
                {expiredCount > 0 && (
                )} */}
                {/* Mostrar una barra de progreso del total */}
                <div style={{ width: '100%' }}>
                    <ProgressBar 
                        value={(completedCount / totalWorkouts) * 100} 
                        showValue={false} 
                        style={{ height: '10px', backgroundColor: '#e0e0e0' }}
                    />
                    <small>{completedCount}/{totalWorkouts} Completed</small>
                </div>
            </div>
        );
    };

    const actionTemplate = (student) => {
        return (
        <div>
            {/* <Button icon="pi pi-eye" className="p-button-rounded p-button-text" /> */}
            <Button icon="pi pi-eye" className="p-button-rounded p-button-text" onClick={() => navigateToClientProfile(student.id)} />
            {/* <Button icon="pi pi-pencil" className="p-button-rounded p-button-text" /> */}
        </div>
        );
    };

    const statusTemplate = (rowData) => {

        const workoutInstanceTemplate = rowData.workoutInstances.find(w => w.isTemplate === true);

        const statusMap = {
            active: { severity: 'success', label: 'Active' },
            pending: { severity: 'warning', label: 'Pending' },
            completed: { severity: 'danger', label: 'Completed' },
        };
        const status = statusMap[rowData.status] || { severity: 'info', label: rowData.status };
        // return <Tag severity={status.severity} value={status.label} />;
        return <Button label="Edit Plan" icon="pi pi-pencil" className="p-button-secondary" onClick={() => navigate(`/plans/edit/${workoutInstanceTemplate.id}`)} />
    };

    const { completedCount, pendingCount, expiredCount } = processWorkoutProgressData(workoutProgress);
    const chartData = {
            labels: ['Completed', 'Pending', 'Expired'],
            datasets: [
                {
                    data: [completedCount, pendingCount, expiredCount],
                    backgroundColor: ['#36A2EB', '#FFCE56', '#FF6384'],
                },
            ],
        };

    const chartOptions = {
        plugins: {
            legend: {
                labels: {
                    usePointStyle: true,
                },
            },
        },
    };

    const navigateToClientProfile = (clientId) => {
        navigate(`/client-dashboard/${clientId}`);
    };

  return (
    <div className="p-4">
      {/* Welcome Header */}
      <Card className={isClientsLoading ? 'flex justify-content-center mb-4' : 'mb-4'}>
        {isClientsLoading ? <Spinner/> :
            <>
                <div className="flex align-items-center justify-content-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Welcome back, {coach.name}!</h1>
                    <div className="flex gap-4">
                    <div>
                        <span className="font-bold">Total Clients:</span> {clients.length}
                    </div>
                    <div>
                        <span className="font-bold">Active Plans:</span> {trainingPlans.filter(p => p.status === 'active').length}
                    </div>
                    <div>
                        <span className="font-bold">Upcoming Sessions:</span> {upcomingSessions.length}
                    </div>
                    </div>
                </div>
                {/* <img src="/logo.png" alt="EaseTrain Logo" className="w-4rem" /> */}
                </div>
            </>
        }
      </Card>

      {/* Client Management Section */}
        <DataTable
            value={clients}
            header={header}
            globalFilter={globalFilter}
            emptyMessage="No clients found."
            className="p-datatable-sm"
            loading={isClientsLoading}
        >
            <Column field="name" header="Client" body={clientNameTemplate} />
            <Column field="progress" header="Progress" body={progressTemplate} />
            <Column body={actionTemplate} />
        </DataTable>

        

      {/* Training Plans Overview */}

      <Card className={isWorkoutProgressLoading ? 'flex justify-content-center mb-4' : 'mb-4'} >
            {isWorkoutProgressLoading ? <Spinner /> :
                <>
                    <h2 className="text-2xl font-bold mb-3">Training Plans</h2>
                    <div className="grid">
                        {workouts.map((plan, index) => (
                            <div key={index} className="col-12 md:col-4">
                                <Card title={plan.planName} className="mb-3">
                                    {statusTemplate(plan)}
                                </Card>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-content-end gap-2">
                        <Button label="New Plan" icon="pi pi-plus" className="p-button-rounded p-button-lg p-button-primary" onClick={() => navigate('/plans/create')} />
                        {/* <Button label="Edit Plan" icon="pi pi-pencil" className="p-button-secondary" onClick={() => navigate('/plans/edit')} /> */}
                    </div>
                </>
            }
        </Card>

      <div className="grid">
        <div className="col-12 md:col-6 lg:col-4">
          {/* Recent Activity and Notifications */}
          <Card className={isRecentActivitiesLoading ? 'flex justify-content-center mb-4' : 'mb-4'}>
            {isRecentActivitiesLoading ? <Spinner /> :
                 <>
                    <div className="flex justify-content-between align-items-center mb-3">
                    <h2 className="text-2xl font-bold m-0">Recent Activity</h2>
                    {/* <Button icon="pi pi-bell" className="p-button-rounded p-button-text" badge="3" badgeClassName="p-badge-danger" /> */}
                    </div>
                    <Timeline value={recentActivities} conte className='overflow-hidden text-overflow-ellipsis' content={(item) => `${item.user.client.name} - ${item.description}`} opposite={(item) => formatDate(item.timestamp)} />
                </>
                }
          </Card>

          {/* Messaging Section */}
          <Card className={isLastMessagesLoading ? 'flex justify-content-center mb-4' : 'mb-4'} >
            {isLastMessagesLoading ? <Spinner /> :
                <>
                    <h2 className="text-2xl font-bold mb-3">Recent Messages</h2>
                    <ListBox
                        options={lastMessages}
                        optionLabel="content"
                        className="w-full mb-3"
                        itemTemplate={(option) => (
                            <div className="flex align-items-center">
                                <span>{option.sender.client?.name}: &nbsp;</span>
                                <span>{option.content ? option.content : 'File'}</span>
                            </div>
                        )}
                    />
                    <Button label="Open Chat" icon="pi pi-comments" className="mt-3" />
                </>
                }
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-4">

            <Card className={isWorkoutProgressLoading ? 'flex justify-content-center mb-4' : 'mb-4'}>
                {isWorkoutProgressLoading ? <Spinner/> :
                    <>
                        <h2 className="text-2xl font-bold mb-3">Workout Progress</h2>
                        <Chart type="pie" data={chartData} options={chartOptions} className="w-full" />
                    </>
                }
            </Card>

            {isClientsLoading ? <Spinner /> :
             
                <Panel header="Subscription Status" className="mb-4">
                    <p>Current Plan: Premium</p>
                    <p>Clients Managed: {clients.length}/50</p>
                    <Button label="Upgrade Plan" className="mt-3" />
                </Panel>
            }
        </div>

        <div className="col-12 md:col-6 lg:col-4">
          {/* Upcoming Sessions & Appointments */}
          <Card className={isUpcomingSessionsLoading ? 'flex justify-content-center mb-4': 'mb-4'}>
            {isUpcomingSessionsLoading ? <Spinner /> :
                <>
                    <h2 className="text-2xl font-bold mb-3">Upcoming Sessions</h2>
                    <ListBox
                        options={upcomingSessionsWithColors}
                        optionLabel="client"
                        className="w-full mb-3"
                        itemTemplate={(option) => (
                            <div className="flex align-items-center justify-content-between">
                                <span style={{ color: option.color }}>{option.client}</span>
                                <small>{option.nextSession ? formatDate(option.nextSession) : 'No upcoming session'}</small>
                            </div>
                        )}
                    />
                
                    <Calendar 
                        inline 
                        dateTemplate={(date) => {
                            const session = upcomingSessionsWithColors.find(session => {
                                const sessionDate = new Date(session.nextSession);
                                
                                const dateNew = new Date(date.year, date.month, date.day);
                                // console.log(sessionDate.toDateString() === dateNew.toDateString());    
                                return sessionDate.toDateString() === dateNew.toDateString(); // Compara las fechas
                            });

                            // Si hay una sesión en esta fecha, devolver un fondo coloreado
                            if (session) {
                                return (
                                    <div style={{ 
                                        backgroundColor: session.color, 
                                        borderRadius: '50%', 
                                        width: '100%', 
                                        height: '100%', 
                                        display: 'flex', 
                                        justifyContent: 'center', 
                                        alignItems: 'center' 
                                    }}>
                                        {date.day}
                                    </div>
                                );
                            }

                            // Devolver la fecha sin formato si no es una sesión
                            return date.day;
                        }}
                    />
            </>
            }
          </Card>
        </div>
      </div>
    </div>
  );
}
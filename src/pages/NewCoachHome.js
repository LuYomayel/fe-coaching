import React, { useState, useEffect, useContext } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Avatar } from 'primereact/avatar';
import { Tag } from 'primereact/tag';
import { Timeline } from 'primereact/timeline';
import { Chart } from 'primereact/chart';
import { Panel } from 'primereact/panel';
import { ListBox } from 'primereact/listbox';
import { Calendar } from 'primereact/calendar';
import { InputIcon } from 'primereact/inputicon';
import { IconField } from 'primereact/iconfield';
import { formatDate } from '../utils/UtilFunctions';
import { UserContext } from '../utils/UserContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { useNavigate } from 'react-router-dom';
import { fetchCoachStudents, fetchRecentActivitiesByCoachId, fetchWorkoutProgressByCoachId, fetchUpcomingSessionsByCoachId, fetchLastMessages } from '../services/usersService';
import { findAllWorkoutTemplatesByCoachId, deleteWorkoutPlan } from '../services/workoutService';
import Spinner from '../utils/LittleSpinner';
import { useIntl, FormattedMessage } from 'react-intl';
import '../styles/Timeline.css';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { useToast } from '../utils/ToastContext';
export default function CoachHomePage() {
    const intl = useIntl();
    const [globalFilter, setGlobalFilter] = useState('');
    // eslint-disable-next-line
    const { setLoading } = useSpinner();
    const { showConfirmationDialog } = useConfirmationDialog();
    const showToast = useToast();
    const { user, coach } = useContext(UserContext);
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [trainingPlans, setTrainingPlans] = useState([]);
    
    const [recentActivities, setRecentActivities] = useState([]);
    const [workoutProgress, setWorkoutProgress] = useState([]);
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [workouts, setWorkouts] = useState([]);
    const [lastMessages, setLastMessages] = useState([]);

    const [isClientsLoading, setIsClientsLoading] = useState(true);
    // eslint-disable-next-line
    const [isTrainingPlansLoading, setIsTrainingPlansLoading] = useState(true);
    const [isRecentActivitiesLoading, setIsRecentActivitiesLoading] = useState(true);
    const [isUpcomingSessionsLoading, setIsUpcomingSessionsLoading] = useState(true);
    const [isLastMessagesLoading, setIsLastMessagesLoading] = useState(true);
    const [isWorkoutProgressLoading, setIsWorkoutProgressLoading] = useState(true);

    const [refreshWorkouts, setRefreshWorkouts] = useState(0);
    // eslint-disable-next-line
    const [refreshClients, setRefreshClients] = useState(0);
    // eslint-disable-next-line
    const [refreshTrainingPlans, setRefreshTrainingPlans] = useState(0);
    // eslint-disable-next-line
    const [refreshActivities, setRefreshActivities] = useState(0);
    // eslint-disable-next-line
    const [refreshSessions, setRefreshSessions] = useState(0);
    // eslint-disable-next-line
    const [refreshMessages, setRefreshMessages] = useState(0);
    // eslint-disable-next-line
    const [refreshProgress, setRefreshProgress] = useState(0);

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

    const fetchClients = async () => {
        try {
          setIsClientsLoading(true);
          const clientsData = await fetchCoachStudents(user.userId);
          const activeClients = clientsData.data.filter(client => client.user.subscription.status === 'Active');
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
          const trainingPlansData = await fetchWorkoutProgressByCoachId(coach.id);
          const plans = trainingPlansData.data.map(cycle => ({
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
          setRecentActivities(activities.data);
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
          setUpcomingSessions(sessions.data);
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
          setLastMessages(messages.data);
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
          const activeClients = clientsData.data.filter(client => client.user.subscription.status === 'Active');
          // Assign workout progress to client via email
          const clientsWithProgress = activeClients.map(client => {
              const progress = workoutProgress.data.find(progress => progress.client === client.user.email);    
              return {
                  ...client,
                  progress: progress ? progress.progress : 0,
              };
          });
          setClients(clientsWithProgress);

          setWorkoutProgress(workoutProgress.data);
        } catch (error) {
          console.error('Error fetching workout progress:', error);
        } finally {
          setIsWorkoutProgressLoading(false);
        }
      };
  
      const fetchWorkouts = async () => {
          try {
              const workouts = await findAllWorkoutTemplatesByCoachId(coach.id);
              setWorkouts(workouts.data);
          } catch (error) {
              console.error('Error fetching workouts:', error);
          }
      };

    useEffect(() => {
        fetchWorkouts();
        // eslint-disable-next-line
    }, [refreshWorkouts]);

    useEffect(() => {
        fetchClients();
        // eslint-disable-next-line
    }, [refreshClients]);

    useEffect(() => {
        fetchTrainingPlans();
        // eslint-disable-next-line
    }, [refreshTrainingPlans]);

    useEffect(() => {
        fetchActivities();
        // eslint-disable-next-line
    }, [refreshActivities]);

    useEffect(() => {
        fetchSessions();
        // eslint-disable-next-line
    }, [refreshSessions]);

    useEffect(() => {
        fetchMessages();
        // eslint-disable-next-line
    }, [refreshMessages]);

    useEffect(() => {
        fetchProgress();
        // eslint-disable-next-line
    }, [refreshProgress]);

  const handleDelete = async (workoutInstanceTemplateId) => {
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'coach.delete.confirmation' }),
      header: intl.formatMessage({ id: 'coach.delete.header' }),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await deleteWorkoutPlan(workoutInstanceTemplateId, true);
          setRefreshWorkouts(prev => prev + 1);
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
      }

    });
  }

  const header = (
    <div className="flex justify-content-between align-items-center">
      {/* <h5 className="m-0">
        <FormattedMessage id="clients.title" />
      </h5> */}
      <IconField iconPosition="left">
            <InputIcon className="pi pi-search"> </InputIcon>
            <InputText
                type="search"
                onInput={(e) => setGlobalFilter(e.target.value)}
                placeholder={intl.formatMessage({ id: 'clients.search' })}
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

    const progressBodyTemplate = (rowData) => {
        if (!rowData.progress) {
            return null;
        }
        const progress = rowData.progress;
        const totalWorkouts = progress.length;
        const completedCount = progress.filter(p => p.status === 'Completed').length;
        const pendingCount = progress.filter(p => p.status === 'Pending').length;
        const expiredCount = progress.filter(p => p.status === 'Expired').length;

        const completedPercentage = (completedCount / totalWorkouts) * 100;
        const pendingPercentage = (pendingCount / totalWorkouts) * 100;
        const expiredPercentage = (expiredCount / totalWorkouts) * 100;

        return (
            <div className="flex align-items-center gap-2">
                <Tag value={intl.formatMessage({ id: 'coach.progress.completed' }, { count: completedCount })} severity="success" />
                <Tag value={intl.formatMessage({ id: 'coach.progress.pending' }, { count: pendingCount })} severity="warning" />
                <Tag value={intl.formatMessage({ id: 'coach.progress.expired' }, { count: expiredCount })} severity="danger" />
                <div style={{ width: '100%', position: 'relative', height: '10px', backgroundColor: '#e0e0e0' }}>
                    <div style={{ width: `${completedPercentage}%`, backgroundColor: '#22C55E', height: '100%', position: 'absolute', left: 0 }} />
                    <div style={{ width: `${pendingPercentage}%`, backgroundColor: '#FACC15', height: '100%', position: 'absolute', left: `${completedPercentage}%` }} />
                    <div style={{ width: `${expiredPercentage}%`, backgroundColor: '#EF4444', height: '100%', position: 'absolute', left: `${completedPercentage + pendingPercentage}%` }} />
                </div>
                <small>
                    <FormattedMessage 
                        id="coach.progress.total" 
                        values={{ completed: completedCount, total: totalWorkouts }} 
                    />
                </small>
            </div>
        );
    };

    const actionTemplate = (student) => {
        return (
        <div>
            <Button icon="pi pi-eye" className="p-button-rounded p-button-text" onClick={() => navigateToClientProfile(student.id)} />
        </div>
        );
    };

    const statusTemplate = (rowData) => {
        const workoutInstanceTemplate = rowData.workoutInstanceTemplates[0]
        return (
            <div>
                <Button label={intl.formatMessage({ id: 'common.edit' })} icon="pi pi-pencil" className="p-button-secondary" onClick={() => navigate(`/plans/edit-template/${workoutInstanceTemplate.id}`)} />
                <Button label={intl.formatMessage({ id: 'common.delete' })} icon="pi pi-trash" className="p-button-danger" onClick={() => handleDelete(workoutInstanceTemplate.id)} />
            </div>
        )
        
    };

    const { completedCount, pendingCount, expiredCount } = processWorkoutProgressData(workoutProgress);
    const chartData = {
            labels: [
                intl.formatMessage({ id: 'coach.chart.completed' }),
                intl.formatMessage({ id: 'coach.chart.pending' }),
                intl.formatMessage({ id: 'coach.chart.expired' })
            ],
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
                    <h1 className="text-3xl font-bold mb-2">
                        <FormattedMessage 
                            id="welcome.back" 
                            values={{ name: coach.name }}
                        />
                    </h1>
                    <div className="flex gap-4">
                    <div>
                        <span className="font-bold">
                            <FormattedMessage id="stats.totalClients" />:
                        </span> {clients.length}
                    </div>
                    <div>
                        <span className="font-bold">
                            <FormattedMessage id="stats.activePlans" />:
                        </span> {trainingPlans.filter(p => p.status === 'active').length}
                    </div>
                    <div>
                        <span className="font-bold">
                            <FormattedMessage id="stats.upcomingSessions" />:
                        </span> {upcomingSessions.length}
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
            emptyMessage={intl.formatMessage({ id: 'clients.noClientsFound' })}
            className="p-datatable-sm"
            loading={isClientsLoading}
        >
            <Column field="name" header={intl.formatMessage({ id: 'clients.title' })} body={clientNameTemplate} />
            <Column field="progress" header={intl.formatMessage({ id: 'coach.sections.workoutProgress' })} body={progressBodyTemplate} />
            <Column body={actionTemplate} />
        </DataTable>

        

      {/* Training Plans Overview */}

      <Card className={isWorkoutProgressLoading ? 'flex justify-content-center mb-4' : 'mb-4'} >
            {isWorkoutProgressLoading ? <Spinner /> :
                <>
                    <h2 className="text-2xl font-bold mb-3">
                        <FormattedMessage id="coach.sections.trainingPlans" />
                    </h2>
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
                        <Button label={intl.formatMessage({ id: 'coach.buttons.newPlan' })} icon="pi pi-plus" className="p-button-rounded p-button-lg p-button-primary" onClick={() => navigate('/plans/create')} />
                    </div>
                </>
            }
        </Card>

      <div className="grid">
        <div className="col-12 md:col-6 lg:col-4">
          {/* Recent Activity and Notifications */}
          {/*
          <Card className={isRecentActivitiesLoading ? 'flex justify-content-center mb-4' : 'mb-4'}>
            {isRecentActivitiesLoading ? <Spinner /> :
                 <>
                    <div className="flex justify-content-between align-items-center mb-3">
                    <h2 className="text-2xl font-bold m-0">
                        <FormattedMessage id="coach.sections.recentActivity" />
                    </h2>
                    </div>
                    <Timeline
                        value={recentActivities}
                        className="timeline"
                        content={(item) => `${item.user.client.name} - ${item.description}`}
                        opposite={(item) => formatDate(item.timestamp)}
                    />
                </>
                }
          </Card>

          <Card className={isLastMessagesLoading ? 'flex justify-content-center mb-4' : 'mb-4'} >
            {isLastMessagesLoading ? <Spinner /> :
                <>
                    <h2 className="text-2xl font-bold mb-3">
                        <FormattedMessage id="coach.sections.recentMessages" />
                    </h2>
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
                    <Button label={intl.formatMessage({ id: 'coach.buttons.openChat' })} icon="pi pi-comments" className="mt-3" />
                </>
                }
          </Card>
          */}
        </div>

        <div className="col-12 md:col-6 lg:col-4">
            {/*
            <Card className={isWorkoutProgressLoading ? 'flex justify-content-center mb-4' : 'mb-4'}>
                {isWorkoutProgressLoading ? <Spinner/> :
                    <>
                        <h2 className="text-2xl font-bold mb-3">
                            <FormattedMessage id="coach.sections.workoutProgress" />
                        </h2>
                        <Chart type="pie" data={chartData} options={chartOptions} className="w-full" />
                    </>
                }
            </Card>

            {isClientsLoading ? <Spinner /> :
             
                <Panel header={intl.formatMessage({ id: 'coach.subscription.status' })} className="mb-4">
                    <p>
                        <FormattedMessage id="coach.subscription.currentPlan" />
                    </p>
                    <p>
                        <FormattedMessage id="coach.subscription.clientsManaged" values={{ current: clients.length, max: 50 }} />
                    </p>
                    <Button label={intl.formatMessage({ id: 'coach.buttons.upgradePlan' })} className="mt-3" />
                </Panel>
            }
            */}
        </div>

        <div className="col-12 md:col-6 lg:col-4">
          {/* Upcoming Sessions & Appointments */}
          {/*
          <Card className={isUpcomingSessionsLoading ? 'flex justify-content-center mb-4': 'mb-4'}>
            {isUpcomingSessionsLoading ? <Spinner /> :
                <>
                    <h2 className="text-2xl font-bold mb-3">
                        <FormattedMessage id="coach.sections.upcomingSessions" />
                    </h2>
                    <ListBox
                        options={upcomingSessionsWithColors}
                        optionLabel="client"
                        className="w-full mb-3"
                        itemTemplate={(option) => (
                            <div className="flex align-items-center justify-content-between">
                                <span style={{ color: option.color }}>{option.client}</span>
                                <small>{option.nextSession ? formatDate(option.nextSession) : intl.formatMessage({ id: 'coach.calendar.noUpcomingSession' })}</small>
                            </div>
                        )}
                    />
                
                    <Calendar 
                        inline 
                        dateTemplate={(date) => {
                            const session = upcomingSessionsWithColors.find(session => {
                                const sessionDate = new Date(session.nextSession);
                                
                                const dateNew = new Date(date.year, date.month, date.day);
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
          */}
        </div>
      </div>
    </div>
  );
}
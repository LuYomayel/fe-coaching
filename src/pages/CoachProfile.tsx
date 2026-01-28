import { useEffect, useState } from 'react';

import { TabView, TabPanel } from 'primereact/tabview';
//import { Button } from 'primereact/button';

import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

import { fetchCoach } from '../services/usersService';
import { useSpinner } from '../utils/GlobalSpinner';

import { useIntl } from 'react-intl';
import { RpeTab } from '../components/coach/RpeTab';
import { SubscriptionTab } from '../components/coach/SubscriptionTab';
import { CoachPlansTab } from '../components/coach/CoachPlansTab';
import { ExercisesTab } from '../components/coach/ExercisesTab';
import BankDataDialog from '../dialogs/BankDataDialog';
import { api } from '../services/api-client';
import { ICoach, IUser } from '../types/models';
import { IWorkoutTemplate } from '../types/workout/workout-template';
import { IClient } from '../types/models';
import { ESubscriptionStatus } from '../types/enums/subscription-status';

interface CoachInfo extends ICoach {
  profilePictureUrl?: string;
  user?: IUser;
}

export default function CoachProfilePage() {
  const intl = useIntl();
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const { user, coach } = useUser();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { setLoading } = useSpinner();

  // State variables
  const [refreshKey, setRefreshKey] = useState<number>(0);
  // Coach info
  const [coachInfo, setCoachInfo] = useState<CoachInfo | null>(null);

  // Data arrays
  const [users, setUsers] = useState<IClient[]>([]);
  const [totalExercises, setTotalExercises] = useState<number>(0);
  const [workouts, setWorkouts] = useState<IWorkoutTemplate[]>([]);

  // Current plan
  const [currentPlanId] = useState<number | null>(null);

  // Modals visibility
  const [isBankDataDialogVisible, setIsBankDataDialogVisible] = useState<boolean>(false);

  // Carga inicial crítica (datos necesarios para mostrar la página)
  useEffect(() => {
    if (!user?.userId) return;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Cargar datos críticos en paralelo
        const { data } = await fetchCoach(user.userId);
        // Procesar respuesta del coach
        if (data) {
          setCoachInfo(data as CoachInfo);
        } else {
          navigate('/complete-coach-profile');
          return;
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showToast('error', 'Error', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user?.userId, coach?.id, navigate, showToast, setLoading]);

  /*
  const handleOpenBankDataDialog = () => {
    setIsBankDataDialogVisible(true);
  };
  */

  const handleBankDataDialogClose = () => {
    setIsBankDataDialogVisible(false);
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.exercise.fetchCoachExercises({ page: 1, limit: 10, search: '' });
        setTotalExercises(data?.total || 0);
        const { data: workoutsData } = await api.workout.findAllWorkoutTemplatesByCoachId();
        setWorkouts(workoutsData || []);
        const { data: usersData } = await api.coach.fetchStudents();
        const activeStudents =
          usersData?.filter((student) => student.user?.subscription?.status === ESubscriptionStatus.ACTIVE) || [];
        setUsers(activeStudents);
      } catch (error) {
        console.error('Error fetching data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showToast('error', 'Error', errorMessage);
      }
    };
    if (coach) fetchData();
  }, [refreshKey, coach?.id, showToast]);

  return (
    <div className="p-4">
      {/* Sección de cabecera del perfil */}
      <div className="surface-card shadow-2 border-round p-4 mb-4">
        <div className="flex flex-column md:flex-row align-items-center gap-4">
          <img
            src={coachInfo?.profilePictureUrl || '/image.webp'}
            alt={coachInfo?.name || 'Coach'}
            className="border-circle w-8rem h-8rem"
            style={{ objectFit: 'cover' }}
          />
          <div className="flex-1 w-full">
            <div className="mb-3">
              <h1 className="text-4xl font-bold m-0 mb-2">{coachInfo?.name || 'Coach Profile'}</h1>
              <p className="text-600 m-0">{coachInfo?.user?.email || 'Loading...'}</p>
            </div>
            <div className="flex flex-wrap gap-4 mb-3">
              <div className="flex flex-column align-items-center">
                <span className="text-3xl font-bold text-primary">{users.length}</span>
                <span className="text-500 text-sm">Clients</span>
              </div>
              <div className="flex flex-column align-items-center">
                <span className="text-3xl font-bold text-primary">{workouts.length}</span>
                <span className="text-500 text-sm">Workouts</span>
              </div>
              <div className="flex flex-column align-items-center">
                <span className="text-3xl font-bold text-primary">{totalExercises}</span>
                <span className="text-500 text-sm">Exercises</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              {/*
              <Button
                label={intl.formatMessage({ id: 'profile.edit' })}
                icon="pi pi-pencil"
                className="p-button-rounded p-button-warning"
                onClick={handleEditPersonalInfo}
              />
              <Button
                label={intl.formatMessage({ id: 'payment.bankData' })}
                icon="pi pi-credit-card"
                className="p-button-rounded p-button-info"
                onClick={handleOpenBankDataDialog}
              />
              */}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal con pestañas */}
      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        {/* Pestaña de Ejercicios */}
        <TabPanel header={intl.formatMessage({ id: 'coach.tabs.exercises' })} leftIcon="pi pi-heart">
          <ExercisesTab />
        </TabPanel>

        {/* Pestaña de RPE */}
        <TabPanel header={intl.formatMessage({ id: 'coach.tabs.rpe' })} leftIcon="pi pi-chart-line">
          <RpeTab />
        </TabPanel>

        {/* Pestaña de Planes */}
        <TabPanel header={intl.formatMessage({ id: 'coach.tabs.plans' })} leftIcon="pi pi-list">
          <CoachPlansTab />
        </TabPanel>

        {/* Pestaña de Suscripción */}
        <TabPanel header={intl.formatMessage({ id: 'coach.tabs.subscription' })} leftIcon="pi pi-credit-card">
          <SubscriptionTab currentPlanId={currentPlanId ?? null} />
        </TabPanel>
      </TabView>

      {/* Diálogo para crear/editar un ejercicio */}

      {coach?.id && (
        <BankDataDialog visible={isBankDataDialogVisible} onHide={handleBankDataDialogClose} coachId={coach.id} />
      )}
    </div>
  );
}

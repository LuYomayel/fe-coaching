import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

import { RadioButton } from 'primereact/radiobutton';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';

import { ProgressSpinner } from 'primereact/progressspinner';
import { useIntl, FormattedMessage } from 'react-intl';

import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { fetchWorkoutInstance, submitFeedback } from '../services/workoutService';
import FinishTrainingDialog from '../dialogs/FinishTrainingDialog';
import VideoDialog from '../dialogs/VideoDialog';
import { extractYouTubeVideoId, getYouTubeThumbnail } from '../utils/UtilFunctions';
import RpeDropdownComponent from '../components/RpeDropdown';
import '../styles/TrainingPlanStyle.css';

export default function TrainingPlanDetails({ setPlanDetailsVisible, setRefreshKey }) {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { clientId } = state;
  const { user, client, coach } = useContext(UserContext);
  const showToast = useToast();
  const { loading, setLoading } = useSpinner();
  const intl = useIntl();

  const [plan, setPlan] = useState(null);
  const [exerciseProgress, setExerciseProgress] = useState({});
  const [videoDialogVisible, setVideoDialogVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [finishDialogVisible, setFinishDialogVisible] = useState(false);
  //const [completedGroups, setCompletedGroups] = useState([]);

  const [currentCycle, setCurrentCycle] = useState(null);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [sessionTimer, setSessionTimer] = useState(0); // tiempo en segundos
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const propertyUnits = JSON.parse(localStorage.getItem('propertyUnits'));

  // Función auxiliar para formatear tiempo en formato HH:MM:SS
  const formatSessionTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Función para pausar/reanudar el cronómetro
  const handleToggleTimer = () => {
    if (isTimerPaused) {
      // Reanudar: ajustar el tiempo de inicio para mantener el tiempo transcurrido
      const now = Date.now();
      const newStartTime = now - sessionTimer * 1000;
      setSessionStartTime(newStartTime);
      setIsTimerPaused(false);
    } else {
      // Pausar
      setIsTimerPaused(true);
    }
  };

  // Función auxiliar para normalizar el progreso de ejercicios
  const normalizeExerciseProgress = (exerciseProgress) => {
    const normalizedProgress = {};

    Object.entries(exerciseProgress).forEach(([exerciseId, prog]) => {
      const exerciseData = prog || {};

      let setsArray = [];
      if (Array.isArray(exerciseData.sets)) {
        setsArray = exerciseData.sets;
      } else if (exerciseData.sets && typeof exerciseData.sets === 'object') {
        setsArray = Object.values(exerciseData.sets);
      }

      const normalizedSets = setsArray.map((set) => ({
        repetitions: set?.repetitions || null,
        weight: set?.weight || null,
        time: set?.time || null,
        distance: set?.distance || null,
        tempo: set?.tempo || null,
        notes: set?.notes || null,
        difficulty: set?.difficulty || null,
        duration: set?.duration || null,
        restInterval: set?.restInterval || null,
        completed: set?.completed === true ? true : set?.completed === false ? false : null,
        rating: set?.rating || null
      }));

      normalizedProgress[exerciseId] = {
        sets: normalizedSets,
        completed: exerciseData.completed === true ? true : exerciseData.completed === false ? false : null,
        comments: exerciseData.comments || ''
      };
    });

    return normalizedProgress;
  };

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const { data } = await fetchWorkoutInstance(planId);

        data.groups.sort((groupA, groupB) => groupA.groupNumber - groupB.groupNumber);
        setPlan(data);

        setCurrentCycle(data.trainingSession?.trainingWeek?.trainingCycle || -1);

        // Check if there's saved progress first
        const savedProgress = localStorage.getItem(`exerciseProgress_${planId}`);

        const initializeDefaultProgress = () => {
          const initialProgress = {};
          data.groups.forEach((group) => {
            group.exercises.forEach((exercise) => {
              const numSets = parseInt(exercise.sets) || group.set || 1;

              const exerciseData = {
                sets: Array.from({ length: numSets }).map(() => ({
                  repetitions: exercise.repetitions || null,
                  weight: exercise.weight || null,
                  time: exercise.time || null,
                  distance: exercise.distance || null,
                  tempo: exercise.tempo || null,
                  notes: exercise.notes || null,
                  difficulty: exercise.difficulty || null,
                  duration: exercise.duration || null,
                  restInterval: exercise.restInterval || null,
                  completed: null,
                  rating: null // RPE por set
                })),
                completed: null,
                comments: ''
              };

              initialProgress[exercise.id] = exerciseData;
            });
          });

          setExerciseProgress(initialProgress);
        };

        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress);

            // Validar que el objeto parseado sea válido
            if (!parsed || typeof parsed !== 'object') {
              throw new Error('Datos guardados inválidos');
            }

            const normalized = {};
            Object.entries(parsed).forEach(([exerciseId, prog]) => {
              // Validar que prog sea un objeto válido
              if (!prog || typeof prog !== 'object') {
                return;
              }

              // Normalizar los sets
              let setsArray = [];
              if (Array.isArray(prog.sets)) {
                setsArray = prog.sets;
              } else if (prog.sets && typeof prog.sets === 'object') {
                setsArray = Object.values(prog.sets);
              }

              // Validar cada set y asegurar estructura correcta
              const validSets = setsArray.map((set) => ({
                repetitions: set?.repetitions || null,
                weight: set?.weight || null,
                time: set?.time || null,
                distance: set?.distance || null,
                tempo: set?.tempo || null,
                notes: set?.notes || null,
                difficulty: set?.difficulty || null,
                duration: set?.duration || null,
                restInterval: set?.restInterval || null,
                completed: set?.completed === true ? true : set?.completed === false ? false : null,
                rating: set?.rating || null
              }));

              normalized[exerciseId] = {
                sets: validSets,
                completed: prog.completed === true ? true : prog.completed === false ? false : null,
                comments: prog.comments || ''
              };
            });

            setExerciseProgress(normalized);
          } catch (error) {
            console.error('Error al cargar progreso guardado:', error);
            initializeDefaultProgress();
          }
        } else {
          initializeDefaultProgress();
        }
      } catch (error) {
        console.error('Error al cargar plan:', error);
        showToast('error', 'Error', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId, showToast, setLoading, setPlanDetailsVisible]);

  // NOTA: La carga desde localStorage ahora se hace dentro de fetchPlan para evitar conflictos de timing

  // Inicialización y manejo del cronómetro de sesión
  useEffect(() => {
    // Intentar cargar cronómetro existente desde localStorage
    const savedSessionData = localStorage.getItem(`sessionTimer_${planId}`);
    const now = Date.now();

    if (savedSessionData) {
      try {
        const { startTime, elapsedSeconds } = JSON.parse(savedSessionData);

        // Calcular tiempo total transcurrido desde el inicio guardado
        const totalElapsed = elapsedSeconds + Math.floor((now - startTime) / 1000);

        setSessionStartTime(startTime);
        setSessionTimer(totalElapsed);
      } catch (error) {
        // Si hay error, iniciar nuevo cronómetro
        initializeNewTimer();
      }
    } else {
      // No hay datos guardados, iniciar nuevo cronómetro
      initializeNewTimer();
    }

    function initializeNewTimer() {
      setSessionStartTime(now);
      setSessionTimer(0);

      // Guardar tiempo de inicio
      const sessionData = {
        startTime: now,
        elapsedSeconds: 0
      };
      localStorage.setItem(`sessionTimer_${planId}`, JSON.stringify(sessionData));
    }
  }, [planId]);

  // Actualización del cronómetro cada segundo
  useEffect(() => {
    if (!sessionStartTime || isTimerPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - sessionStartTime) / 1000);
      setSessionTimer(elapsed);

      // Guardar progreso del cronómetro cada 10 segundos
      if (elapsed % 10 === 0) {
        const sessionData = {
          startTime: sessionStartTime,
          elapsedSeconds: elapsed
        };
        localStorage.setItem(`sessionTimer_${planId}`, JSON.stringify(sessionData));
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [sessionStartTime, planId, isTimerPaused]);

  // Guardado automático con debounce
  useEffect(() => {
    if (!plan || Object.keys(exerciseProgress).length === 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        // Usar la función auxiliar para normalizar
        const normalizedProgress = normalizeExerciseProgress(exerciseProgress);
        const progressToSave = JSON.stringify(normalizedProgress);
        localStorage.setItem(`exerciseProgress_${planId}`, progressToSave);
      } catch (error) {
        console.error('Error al guardar progreso automáticamente:', error);
      }
    }, 1000); // Debounce de 1 segundo

    return () => {
      clearTimeout(timeoutId);
    };
  }, [exerciseProgress, planId, plan]);

  const handleExerciseChange = (exerciseId, setIndex, field, value) => {
    setExerciseProgress((prevProgress) => {
      if (typeof setIndex === 'number') {
        const prev = prevProgress[exerciseId] || {};
        const prevSets = Array.isArray(prev.sets) ? prev.sets : [];
        const newSets = [...prevSets];

        newSets[setIndex] = {
          ...newSets[setIndex],
          [field]: value
        };

        const newProgress = {
          ...prevProgress,
          [exerciseId]: {
            ...prev,
            sets: newSets
          }
        };

        return newProgress;
      } else {
        const newProgress = {
          ...prevProgress,

          [exerciseId]: {
            ...prevProgress[exerciseId],
            [field]: value
          }
        };

        return newProgress;
      }
    });
  };

  const handleSetCompletedChange = (exerciseId, setIndex, completed) => {
    setExerciseProgress((prevProgress) => {
      const newProgress = { ...prevProgress };
      const group = plan.groups.find((group) => group.exercises.some((ex) => ex.id === exerciseId));
      if (!group) {
        return newProgress;
      }
      const exercise = group.exercises.find((ex) => ex.id === exerciseId);
      if (!exercise) {
        return newProgress;
      }

      // Asegurarse de que el set existe
      if (!newProgress[exerciseId]?.sets) {
        const numSets = parseInt(exercise.sets) || group.set;

        const initialSets = Array.from({ length: numSets }).map(() => ({
          repetitions: exercise.repetitions,
          weight: exercise.weight,
          time: exercise.time,
          distance: exercise.distance,
          tempo: exercise.tempo,
          notes: exercise.notes,
          difficulty: exercise.difficulty,
          duration: exercise.duration,
          restInterval: exercise.restInterval,
          completed: exercise.completed
        }));

        newProgress[exerciseId] = {
          ...newProgress[exerciseId],
          sets: initialSets
        };
      }

      // Actualizar el estado completado del set
      newProgress[exerciseId].sets[setIndex] = {
        ...newProgress[exerciseId].sets[setIndex],
        completed: completed
      };

      // Verificar si todos los sets están completados
      const allSetsCompleted = Object.values(newProgress[exerciseId].sets).every((set) => set.completed);

      newProgress[exerciseId].completed = allSetsCompleted;

      // Verificar si todos los ejercicios del grupo están completados
      //const allExercisesCompleted = group.exercises.every((ex) => newProgress[ex.id]?.completed);

      // Actualizar el estado del grupo
      /*
      setCompletedGroups((prevCompletedGroups) => {
        const newCompletedGroups = [...prevCompletedGroups];
        const groupIndex = newCompletedGroups.findIndex((g) => g.id === group.id);

        if (groupIndex >= 0) {
          newCompletedGroups[groupIndex] = { ...newCompletedGroups[groupIndex], completed: allExercisesCompleted };
        } else {
          newCompletedGroups.push({ id: group.id, completed: allExercisesCompleted });
        }

        return newCompletedGroups;
      });
      */
      return newProgress;
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

  const handleSaveProgress = () => {
    try {
      if (!plan || Object.keys(exerciseProgress).length === 0) {
        showToast('warn', 'Advertencia', 'No hay progreso para guardar');
        return;
      }

      // Normalizar y validar los datos antes de guardar
      const normalizedProgress = normalizeExerciseProgress(exerciseProgress);

      const progressToSave = JSON.stringify(normalizedProgress);
      localStorage.setItem(`exerciseProgress_${planId}`, progressToSave);

      // Verificar que se guardó correctamente
      const saved = localStorage.getItem(`exerciseProgress_${planId}`);

      if (saved) {
        try {
          showToast('success', 'Éxito', intl.formatMessage({ id: 'training.success.saved' }));
        } catch (parseError) {
          console.error('Error al parsear datos guardados:', parseError);
          throw new Error('Los datos guardados están corruptos');
        }
      } else {
        throw new Error('El progreso no se guardó correctamente');
      }
    } catch (error) {
      console.error('Error al guardar progreso manualmente:', error);
      showToast('error', 'Error', `No se pudo guardar el progreso: ${error.message}`);

      // Intentar limpiar datos corruptos
      try {
        localStorage.removeItem(`exerciseProgress_${planId}`);
      } catch (cleanupError) {
        console.error('Error al limpiar datos corruptos:', cleanupError);
      }
    }
  };

  const handleClearProgress = () => {
    try {
      // Limpiar progreso y cronómetro
      localStorage.removeItem(`exerciseProgress_${planId}`);
      localStorage.removeItem(`sessionTimer_${planId}`);

      setExerciseProgress({});
      setSessionTimer(0);
      setSessionStartTime(Date.now()); // Reiniciar cronómetro
      setIsTimerPaused(false); // Resetear estado de pausa

      // Guardar nuevo tiempo de inicio
      const sessionData = {
        startTime: Date.now(),
        elapsedSeconds: 0
      };
      localStorage.setItem(`sessionTimer_${planId}`, JSON.stringify(sessionData));

      showToast('success', 'Éxito', 'Progreso y cronómetro reiniciados correctamente');
    } catch (error) {
      console.error('Error al eliminar progreso:', error);
      showToast('error', 'Error', 'No se pudo eliminar el progreso');
    }
  };

  const handleSubmitFeedback = ({ generalFeedback, energyLevel, mood, perceivedDifficulty, additionalNotes }) => {
    // Normalize any null completed to false before finishing
    const normalizedProgress = {};
    Object.entries(exerciseProgress).forEach(([exerciseId, prog]) => {
      const sets = (prog.sets || []).map((s) => ({
        ...s,
        completed: s.completed == null ? false : s.completed,
        rating: s.rating // Mantener el rating por set
      }));
      normalizedProgress[exerciseId] = {
        ...prog,
        sets,
        completed: prog.completed == null ? false : prog.completed
      };
    });

    const exerciseFeedbackArray = Object.entries(normalizedProgress)
      .map(([exerciseId, progress]) => {
        const sets = progress.sets || [];
        const group = plan.groups.find((group) => group.exercises.some((ex) => ex.id === parseInt(exerciseId)));
        if (!group) {
          showToast('error', 'Error', intl.formatMessage({ id: 'training.error.exerciseNotFound' }));
          return null;
        }
        group.exercises.find((ex) => ex.id === parseInt(exerciseId));

        return {
          exerciseId: parseInt(exerciseId),
          sets,
          completed: progress.completed,
          comments: progress.comments
        };
      })
      .filter((feedback) => feedback !== null);

    if (exerciseFeedbackArray.length === 0) {
      showToast('error', 'Error', intl.formatMessage({ id: 'training.error.noFeedback' }));
      return;
    }
    if (sessionTimer === 0) {
      showToast('error', 'Error', intl.formatMessage({ id: 'training.error.noSessionTime' }));
      return;
    }

    const body = {
      exerciseFeedbackArray,
      userId: user.userId,
      sessionTime: formatSessionTime(sessionTimer),
      generalFeedback,
      energyLevel,
      mood,
      perceivedDifficulty,
      additionalNotes,
      isCoachFeedback: user.userType === 'coach',
      providedBy: user.userType === 'coach' ? coach.id : client.id
    };

    console.log(body);

    setLoading(true);
    submitFeedback(planId, body, client ? client.id : clientId)
      .then(() => {
        // Limpiar progreso y cronómetro
        setExerciseProgress({});
        setSessionTimer(0);
        setSessionStartTime(null);
        setIsTimerPaused(false);

        // Limpiar localStorage
        localStorage.removeItem(`exerciseProgress_${planId}`);
        localStorage.removeItem(`sessionTimer_${planId}`);

        setFinishDialogVisible(false);
        if (setRefreshKey) {
          setRefreshKey((prev) => prev + 1);
        }
        showToast('success', 'Session finished!', 'Congratulations, you have finished your routine.');
        if (user.userType === 'coach') {
          navigate(`/client-dashboard/${clientId}`);
        } else {
          navigate('/student');
        }
      })
      .catch((error) => {
        showToast('error', 'Error', error.message);
        setFinishDialogVisible(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <i className="pi pi-check-circle text-green-500"></i>;
      case 'pending':
        return <i className="pi pi-clock text-yellow-500"></i>;
      case 'expired':
        return <i className="pi pi-exclamation-circle text-red-500"></i>;
      default:
        return <i className="pi pi-info-circle text-blue-500"></i>;
    }
  };

  const isExerciseCompleted = (exercise) => {
    const progress = exerciseProgress[exercise.id];
    if (!progress || !progress.sets) return false;

    const sets = progress.sets;

    // Verificar que todos los sets estén marcados (true o false)
    const allSetsAreMarked = sets.every((set) => set.completed === true || set.completed === false);

    if (!allSetsAreMarked) {
      return false; // Hay sets sin marcar
    }

    // Verificar que todos los sets completados (true) tengan RPE
    const completedSets = sets.filter((set) => set.completed === true);
    const allCompletedSetsHaveRpe = completedSets.every((set) => set.rating !== null && set.rating !== undefined);

    return allCompletedSetsHaveRpe;
  };

  const isGroupCompleted = (group) => {
    const allExercisesCompleted = group.exercises.every((exercise) => isExerciseCompleted(exercise));
    return allExercisesCompleted;
  };

  const canNavigateToNextGroup = () => {
    if (!plan || currentGroupIndex >= plan.groups.length - 1) return false;

    const currentGroup = plan.groups[currentGroupIndex];
    return isGroupCompleted(currentGroup);
  };

  const navigateToNextGroup = () => {
    if (canNavigateToNextGroup()) {
      setCurrentGroupIndex((prev) => prev + 1);
    }
  };

  const navigateToPreviousGroup = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex((prev) => prev - 1);
    }
  };

  const navigateToGroup = (index) => {
    // Solo permitir navegar a grupos anteriores o completados
    if (index < currentGroupIndex || isGroupCompleted(plan.groups[index])) {
      setCurrentGroupIndex(index);
    }
  };

  const renderExerciseGroup = (group) => {
    // Toggle all completed flags for this group's exercises
    const handleToggleAll = (flag, e) => {
      const exerciseId = parseInt(e.target.name.split('-')[1]);

      setExerciseProgress((prevProgress) => {
        const newProgress = { ...prevProgress };

        const existing = newProgress[exerciseId] || { sets: [] };
        const originalSets = existing.sets || [];
        const sets = originalSets.map((s) => ({ ...s, completed: flag }));

        newProgress[exerciseId] = { ...existing, sets, completed: flag };

        return newProgress;
      });
    };

    const isCompleted = isGroupCompleted(group);

    return (
      <div key={group.id} className={`exercise-group ${isCompleted ? 'completed' : ''}`}>
        <div className="exercise-group-header mb-3 sm:mb-4">
          <div className="exercise-group-title flex align-items-center justify-content-between border-round w-full">
            <h3 className="text-lg sm:text-xl font-bold text-primary m-0">
              <FormattedMessage id="training.group" values={{ number: group.groupNumber }} />
            </h3>
            <div className="exercise-group-progress bg-primary text-white px-2 py-1 border-round text-sm font-medium">
              {group.exercises.filter((ex) => exerciseProgress[ex.id]?.completed).length}/{group.exercises.length}
            </div>
          </div>
        </div>

        <div className="exercise-group-content">
          <div className="exercise-list flex flex-column gap-3 sm:gap-4">
            {group.exercises.map((exercise) => {
              const progress = exerciseProgress[exercise.id] || {};
              const isCompleted = isExerciseCompleted(exercise);

              return (
                <Card key={exercise.id} className={`exercise-card ${isCompleted ? 'completed' : ''} shadow-3`}>
                  <div className="exercise-card-header mb-1 w-full">
                    <div className="flex flex-column sm:flex-row align-items-start sm:align-items-center justify-content-between gap-2 sm:gap-3">
                      <div className="exercise-card-header-left flex-grow-1 w-full sm:w-auto">
                        <h3 className="exercise-name text-lg sm:text-xl font-medium text-900 m-0 line-height-2">
                          {exercise.exercise.name}
                        </h3>
                      </div>

                      <div className="exercise-card-header-right flex align-items-center justify-content-between sm:justify-content-end gap-2 w-full sm:w-auto">
                        <div className="exercise-group-info-right">
                          <div
                            className="exercise-group-thumbnail cursor-pointer border-round overflow-hidden shadow-2 w-4rem h-3rem sm:w-6rem sm:h-4rem"
                            onClick={() => {
                              handleVideoClick(exercise.exercise.multimedia);
                            }}
                          >
                            <img
                              className="exercise-group-thumbnail w-full h-full object-cover"
                              src={getYouTubeThumbnail(exercise.exercise.multimedia)}
                              alt="Video thumbnail"
                            />
                          </div>
                        </div>
                        <div className="flex flex-row gap-1">
                          <Button
                            icon="pi pi-check"
                            size="small"
                            className="p-button-success p-button-rounded p-button-outlined"
                            onClick={() => handleToggleAll(true, { target: { name: `completeAll-${exercise.id}` } })}
                            tooltip={intl.formatMessage(
                              { id: 'training.markAllCompleted' },
                              { default: 'Mark All Completed' }
                            )}
                            tooltipOptions={{ position: 'top' }}
                            style={{ width: '1.75rem', height: '1.75rem', padding: '0.25rem' }}
                          />
                          <Button
                            icon="pi pi-times"
                            size="small"
                            className="p-button-danger p-button-rounded p-button-outlined"
                            onClick={() => handleToggleAll(false, { target: { name: `completeAll-${exercise.id}` } })}
                            tooltip={intl.formatMessage(
                              { id: 'training.markAllSkipped' },
                              { default: 'Mark All Skipped' }
                            )}
                            tooltipOptions={{ position: 'top' }}
                            style={{ width: '1.75rem', height: '1.75rem', padding: '0.25rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="exercise-inputs">
                    <div className="exercise-sets">
                      <div className="sets-container flex flex-column gap-2">
                        {Array.from({ length: parseInt(exercise.sets) || group.set || 1 }).map((_, index) => {
                          const setData = progress.sets?.[index] || {};

                          return (
                            <div key={index} className="set-card surface-cardp-1 border-round">
                              <div className="flex align-items-center justify-content-between mb-1 p-1">
                                <div className="flex align-items-center gap-2">
                                  <span className="font-medium text-900">Set {index + 1}</span>
                                </div>
                                <div className="flex align-items-center gap-2">
                                  <div className="flex align-items-center gap-1">
                                    <RadioButton
                                      inputId={`completed-yes-${exercise.id}-${index + 1}`}
                                      name={`completed-${exercise.id}-${index + 1}`}
                                      value={true}
                                      onChange={(e) => handleSetCompletedChange(exercise.id, index, e.value)}
                                      checked={setData.completed === true}
                                    />
                                    <label
                                      htmlFor={`completed-yes-${exercise.id}-${index + 1}`}
                                      className="text-sm text-green-600 font-medium"
                                    >
                                      ✓
                                    </label>
                                  </div>
                                  <div className="flex align-items-center gap-1">
                                    <RadioButton
                                      inputId={`completed-no-${exercise.id}-${index + 1}`}
                                      name={`completed-${exercise.id}-${index + 1}`}
                                      value={false}
                                      onChange={(e) => handleSetCompletedChange(exercise.id, index, e.value)}
                                      checked={setData.completed === false}
                                    />
                                    <label
                                      htmlFor={`completed-no-${exercise.id}-${index + 1}`}
                                      className="text-sm text-red-600 font-medium"
                                    >
                                      ✗
                                    </label>
                                  </div>
                                </div>
                              </div>

                              <div className="grid">
                                {exercise.repetitions && (
                                  <div className="col-6 sm:col-6 md:col-4">
                                    <label className="block text-xs font-medium text-700 mb-1">
                                      {intl.formatMessage({ id: 'training.exercise.reps' })}
                                    </label>
                                    <div className="p-inputgroup">
                                      <InputText
                                        value={setData.repetitions || ''}
                                        onChange={(e) =>
                                          handleExerciseChange(exercise.id, index, 'repetitions', e.target.value)
                                        }
                                        className="p-inputtext-sm text-center"
                                        placeholder="0"
                                      />
                                      <span className="p-inputgroup-addon text-xs">
                                        {propertyUnits.repetitions || ''}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {exercise.weight && (
                                  <div className="col-6 sm:col-6 md:col-4">
                                    <label className="block text-xs font-medium text-700 mb-1">
                                      {intl.formatMessage({ id: 'training.exercise.weight' })}
                                    </label>
                                    <div className="p-inputgroup">
                                      <InputText
                                        value={setData.weight || ''}
                                        onChange={(e) =>
                                          handleExerciseChange(exercise.id, index, 'weight', e.target.value)
                                        }
                                        className="p-inputtext-sm text-center"
                                        placeholder="0"
                                      />
                                      <span className="p-inputgroup-addon text-xs">
                                        {propertyUnits?.weight || 'kg'}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {exercise.time && (
                                  <div className="col-6 sm:col-6 md:col-4">
                                    <label className="block text-xs font-medium text-700 mb-1">
                                      {intl.formatMessage({ id: 'training.exercise.time' })}
                                    </label>
                                    <div className="p-inputgroup">
                                      <InputText
                                        value={setData.time || ''}
                                        onChange={(e) =>
                                          handleExerciseChange(exercise.id, index, 'time', e.target.value)
                                        }
                                        className="p-inputtext-sm text-center"
                                        placeholder="0"
                                      />
                                      <span className="p-inputgroup-addon text-xs">{propertyUnits?.time || 's'}</span>
                                    </div>
                                  </div>
                                )}

                                {exercise.distance && (
                                  <div className="col-6 sm:col-6 md:col-4">
                                    <label className="block text-xs font-medium text-700 mb-1">
                                      {intl.formatMessage({ id: 'training.exercise.distance' })}
                                    </label>
                                    <div className="p-inputgroup">
                                      <InputText
                                        value={setData.distance || ''}
                                        onChange={(e) =>
                                          handleExerciseChange(exercise.id, index, 'distance', e.target.value)
                                        }
                                        className="p-inputtext-sm text-center"
                                        placeholder="0"
                                      />
                                      <span className="p-inputgroup-addon text-xs">
                                        {propertyUnits?.distance || 'km'}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {exercise.duration && (
                                  <div className="col-6 sm:col-6 md:col-4">
                                    <label className="block text-xs font-medium text-700 mb-1">
                                      {intl.formatMessage({ id: 'training.exercise.duration' })}
                                    </label>
                                    <div className="p-inputgroup">
                                      <InputText
                                        value={setData.duration || ''}
                                        onChange={(e) =>
                                          handleExerciseChange(exercise.id, index, 'duration', e.target.value)
                                        }
                                        className="p-inputtext-sm text-center"
                                        placeholder="0"
                                      />
                                      <span className="p-inputgroup-addon text-xs">
                                        {propertyUnits?.duration || 's'}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {exercise.difficulty && (
                                  <div className="col-6 sm:col-6 md:col-4">
                                    <label className="block text-xs font-medium text-700 mb-1">
                                      {intl.formatMessage({ id: 'training.exercise.difficulty' })}
                                    </label>
                                    <div className="p-inputgroup">
                                      <InputText
                                        value={setData.difficulty || ''}
                                        onChange={(e) =>
                                          handleExerciseChange(exercise.id, index, 'difficulty', e.target.value)
                                        }
                                        className="p-inputtext-sm text-center"
                                        placeholder="0"
                                      />
                                      <span className="p-inputgroup-addon text-xs">
                                        {propertyUnits?.difficulty || ''}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {exercise.tempo && (
                                  <div className="col-6 sm:col-6 md:col-4">
                                    <label className="block text-xs font-medium text-700 mb-1">
                                      {intl.formatMessage({ id: 'training.exercise.tempo' })}
                                    </label>
                                    <div className="p-inputgroup">
                                      <InputText
                                        value={setData.tempo || ''}
                                        onChange={(e) =>
                                          handleExerciseChange(exercise.id, index, 'tempo', e.target.value)
                                        }
                                        className="p-inputtext-sm text-center"
                                        placeholder="0"
                                      />
                                      <span className="p-inputgroup-addon text-xs">{propertyUnits?.tempo || 's'}</span>
                                    </div>
                                  </div>
                                )}

                                {(client || clientId) && currentCycle && (
                                  <div className="col-12 sm:col-6 md:col-4">
                                    <RpeDropdownComponent
                                      selectedRpe={setData.rating}
                                      onChange={(e) => handleExerciseChange(exercise.id, index, 'rating', e.value)}
                                      planId={planId}
                                      cycleId={currentCycle !== -1 ? currentCycle.id : currentCycle}
                                      clientId={client ? client.id : clientId}
                                      disabled={setData.completed !== true}
                                      className="w-full"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Indicador visual del estado del set 
                              <div className="mt-2">
                                <div
                                  className={`set-status-indicator h-1rem border-round ${
                                    setData.completed === true
                                      ? 'bg-green-400'
                                      : setData.completed === false
                                        ? 'bg-red-400'
                                        : 'bg-gray-300'
                                  }`}
                                ></div>
                              </div>
                              */}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid">
                      <div className="col-12 sm:col-6">
                        <label htmlFor={`notes-${exercise.id}`} className="block text-sm font-medium text-900 mb-2">
                          <FormattedMessage id="training.notes" defaultMessage="Notes" />
                        </label>
                        <InputTextarea
                          id={`notes-${exercise.id}`}
                          rows={2}
                          value={exercise.notes || ''}
                          disabled
                          className="w-full text-sm"
                          style={{ resize: 'none' }}
                        />
                      </div>
                      <div className="col-12 sm:col-6">
                        <label htmlFor={`comments-${exercise.id}`} className="block text-sm font-medium text-900 mb-2">
                          <FormattedMessage id="training.comments" defaultMessage="Comments" />
                        </label>
                        <InputTextarea
                          id={`comments-${exercise.id}`}
                          rows={2}
                          value={progress.comments || ''}
                          onChange={(e) => handleExerciseChange(exercise.id, null, 'comments', e.target.value)}
                          className="w-full text-sm"
                          placeholder={intl.formatMessage({
                            id: 'training.comments.placeholder',
                            defaultMessage: 'Add your comments here...'
                          })}
                          style={{ resize: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading || !plan) {
    return (
      <div className="loading-container flex flex-column align-items-center justify-content-center min-h-screen p-4">
        <ProgressSpinner className="loading-spinner mb-3" />
        <span className="text-center text-lg sm:text-xl text-700">
          <FormattedMessage id="training.loading" />
        </span>
      </div>
    );
  }

  return (
    <div className="training-plan-details px-2 sm:px-4 py-2 sm:py-4">
      <div className="training-plan-header mb-3 sm:mb-4">
        <div className="training-plan-header-content text-center sm:text-left">
          <h1 className="training-plan-title text-2xl sm:text-3xl font-bold mb-2">
            <FormattedMessage id="training.title" />
          </h1>
          <h2 className="training-plan-name text-lg sm:text-xl mb-2 text-700">
            {plan.instanceName ? plan.instanceName : plan.workout.planName}
          </h2>
          {!plan.isTemplate && (
            <div className="training-plan-status flex align-items-center justify-content-center sm:justify-content-start gap-2">
              {getStatusIcon(plan.status)}
              <span className="text-sm sm:text-base">
                <FormattedMessage id="training.status" />: {plan.status}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="exercise-groups-container">
        <div className="exercise-groups-navigation flex align-items-center gap-2 sm:gap-4">
          <Button
            icon="pi pi-chevron-left"
            className={`p-button-rounded p-button-text navigation-button flex-shrink-0 ${currentGroupIndex === 0 ? 'p-disabled' : ''}`}
            onClick={navigateToPreviousGroup}
            disabled={currentGroupIndex === 0}
            aria-label="Previous group"
            size="small"
          />

          <div className="exercise-groups-content flex-grow-1">
            {renderExerciseGroup(plan.groups[currentGroupIndex])}
          </div>

          <Button
            icon="pi pi-chevron-right"
            className={`p-button-rounded p-button-text navigation-button flex-shrink-0 ${!canNavigateToNextGroup() ? 'p-disabled' : ''}`}
            onClick={navigateToNextGroup}
            disabled={!canNavigateToNextGroup()}
            aria-label="Next group"
            size="small"
          />
        </div>

        <div className="exercise-groups-indicator flex justify-content-center gap-2 mt-3 sm:mt-4">
          {plan.groups.map((_, index) => (
            <div
              key={index}
              className={`group-indicator w-3rem h-1rem sm:w-4rem sm:h-1rem border-round cursor-pointer ${index === currentGroupIndex ? 'active bg-primary' : 'bg-300'} ${isGroupCompleted(plan.groups[index]) ? 'completed bg-green-500' : ''}`}
              onClick={() => navigateToGroup(index)}
            />
          ))}
        </div>
      </div>

      <div className="training-action-buttons flex justify-content-center gap-2 mt-2 px-2 sm:px-0">
        <div className="flex justify-content-center align-items-center">
          <div className="session-timer bg-primary text-white px-3 py-2 border-round-lg shadow-3">
            <div className="flex align-items-center gap-2">
              <i className="pi pi-clock text-lg"></i>
              <span className="font-bold text-lg">{formatSessionTime(sessionTimer)}</span>
              <Button
                icon={isTimerPaused ? 'pi pi-play' : 'pi pi-pause'}
                className="p-button-text p-button-sm text-white"
                onClick={handleToggleTimer}
                tooltip={isTimerPaused ? 'Reanudar cronómetro' : 'Pausar cronómetro'}
                tooltipOptions={{ position: 'top' }}
                style={{
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  width: '2rem',
                  height: '2rem'
                }}
              />
            </div>
          </div>
        </div>
        <Button
          icon="pi pi-save"
          className="p-button-primary p-button-rounded"
          onClick={handleSaveProgress}
          tooltip={intl.formatMessage({ id: 'training.buttons.saveProgress' })}
          tooltipOptions={{ position: 'top' }}
          style={{ width: '2.5rem', height: '2.5rem' }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-danger p-button-outlined p-button-rounded"
          onClick={handleClearProgress}
          tooltip="Limpiar Progreso"
          tooltipOptions={{ position: 'top' }}
          style={{ width: '2.5rem', height: '2.5rem' }}
        />
        <Button
          icon="pi pi-check"
          className="p-button-success p-button-rounded"
          onClick={() => setFinishDialogVisible(true)}
          tooltip={intl.formatMessage({ id: 'training.buttons.finishTraining' })}
          tooltipOptions={{ position: 'top' }}
          style={{ width: '2.5rem', height: '2.5rem' }}
          //disabled={!canFinishTraining()}
        />
      </div>

      <FinishTrainingDialog
        visible={finishDialogVisible}
        onHide={() => setFinishDialogVisible(false)}
        submitFeedback={handleSubmitFeedback}
        sessionTimer={sessionTimer}
      />

      <VideoDialog
        visible={videoDialogVisible}
        onHide={() => setVideoDialogVisible(false)}
        videoUrl={currentVideoUrl}
        className="video-dialog"
      />
    </div>
  );
}

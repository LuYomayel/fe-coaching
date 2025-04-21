const apiUrl = process.env.REACT_APP_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};

const findAllWorkoutTemplatesByCoachId = async (coachId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/workout-template/coachId/${coachId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error fetching workout templates:', error);
    throw error;
  }
};

const fetchTrainingCyclesTemplates = async (coachId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/training-cycle-templates/coachId/${coachId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error fetching training cycles templates:', error);
    throw error;
  }
};

const fetchWorkoutInstanceTemplate = async (templateId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/workout-instance-template/${templateId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error fetching workout instance template:', error);
    throw error;
  }
};

const fetchWorkoutInstance = async (planId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/workout-instance/${planId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error fetching workout instance:', error);
    throw error;
  }
};

const fetchTrainingCyclesByClient = async (clientId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/training-cycles/client/clientId/${clientId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }
    const cycles = data.data;

    if (cycles.length === 0) return { events: [], cycleOptions: [] };
    const events = cycles.flatMap((cycle) =>
      cycle.trainingWeeks.flatMap((week) =>
        week.trainingSessions.flatMap((session) => {
          const sessionEvents =
            session.workoutInstances.length > 0
              ? session.workoutInstances.map((workoutInstance) => {
                  workoutInstance.status = updateStatusLocal(workoutInstance, session);
                  if (session.notes) console.log(session);
                  return {
                    title: workoutInstance.instanceName
                      ? workoutInstance.instanceName
                      : workoutInstance.workout.planName,
                    start: session.sessionDate,
                    extendedProps: {
                      status: workoutInstance.status,
                      workoutInstanceId: workoutInstance.id,
                      sessionId: session.id,
                      trainingType: session.trainingType,
                      location: session.location,
                      sessionTime: session.sessionTime,
                      contactMethod: session.contactMethod,
                      notes: session.notes
                    }
                  };
                })
              : [
                  {
                    title: 'no title',
                    start: session.sessionDate,
                    extendedProps: {
                      sessionId: session.id,
                      cycle: cycle.name
                    }
                  }
                ];

          return sessionEvents;
        })
      )
    );
    return { events, cycleOptions: cycles };
  } catch (error) {
    console.error('Error fetching training cycles by client:', error);
    throw error;
  }
};

const fetchTrainingSessionWithNoWeekByClientId = async (clientId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/training-session-with-no-weeks/clientId/${clientId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error fetching training session with no week:', error);
    throw error;
  }
};

const fetchTrainingCyclesForClientByUserId = async (userId) => {
  try {
    const url = `${apiUrl}/workout/training-cycles/client/userId/${userId}`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error fetching training cycles for client by user ID:', error);
    throw error;
  }
};

const fetchTrainingCyclesByCoachId = async (coachId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/training-cycles/coachId/${coachId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error fetching training cycles by coach ID:', error);
    throw error;
  }
};

const fetchTrainingCycleTemplateById = async (cycleId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/training-cycle-templates/cycleId/${cycleId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error fetching training cycle template by ID:', error);
    throw error;
  }
};

const fetchDeletedWorkoutTemplatesByCoachId = async (coachId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/workout-template/coachId/${coachId}/deleted`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error fetching deleted workout templates:', error);
    throw error;
  }
};

const fetchWorkoutsByClientId = async (clientId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/clientId/${clientId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error fetching workouts by client ID:', error);
    throw error;
  }
};

const fetchAssignedWorkoutsForCycleDay = async (cycleId, dayNumber) => {
  try {
    const response = await fetch(`${apiUrl}/workout/training-cycle/${cycleId}/day/${dayNumber}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error fetching assigned workouts for cycle day:', error);
    throw error;
  }
};

const fetchExcelViewByCycleAndDay = async (cycleId, dayNumber) => {
  try {
    const response = await fetch(`${apiUrl}/workout/excel-view/${cycleId}/day/${dayNumber}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error fetching excel view by cycle and day:', error);
    throw error;
  }
};

const createTrainingCycle = async (body) => {
  try {
    const response = await fetch(`${apiUrl}/workout/training-cycles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error creating training cycle:', error);
    throw error;
  }
};

const updateStatusLocal = (workout, session) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sessionDate = new Date(session.sessionDate);
  const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
  if (workout.status === 'pending') {
    if (sessionDay < today) {
      return 'expired';
    } else if (sessionDay.getTime() === today.getTime()) {
      return 'current';
    }
  } else {
    return workout.status;
  }
};

const updateExercisesInstace = async (exercises) => {
  try {
    const response = await fetch(`${apiUrl}/workout/updateExercises`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(exercises)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error updating exercises instance:', error);
    throw error;
  }
};

const verifyExerciseChanges = async (exerciseData) => {
  try {
    const response = await fetch(`${apiUrl}/workout/verify-exercise-changes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(exerciseData)
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error verifying exercise changes:', error);
    throw error;
  }
};

const updatePlanName = async (planId, planName) => {
  try {
    const response = await fetch(`${apiUrl}/workout/update-name/${planId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name: planName })
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error updating plan name:', error);
    throw error;
  }
};

const submitPlan = async (plan, planId, isEdit, isTemplate) => {
  try {
    const requestMethod = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit
      ? `${apiUrl}/workout/${isTemplate ? 'template' : 'instance'}/${planId}`
      : `${apiUrl}/workout`;

    const response = await fetch(endpoint, {
      method: requestMethod,
      headers: getAuthHeaders(),
      body: JSON.stringify(plan)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error submitting plan:', error);
    throw error;
  }
};

const updateTrainingCycle = async (cycleId, body) => {
  try {
    const response = await fetch(`${apiUrl}/workout/training-cycle-templates/cycleId/${cycleId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error updating training cycle:', error);
    throw error;
  }
};

const deleteTrainingCycle = async (cycleId, forceDelete = false) => {
  try {
    const response = await fetch(`${apiUrl}/workout/training-cycle/cycleId/${cycleId}?forceDelete=${forceDelete}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error deleting training cycle:', error);
    throw error;
  }
};

const verifyTrainingCycleDeletion = async (cycleId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/training-cycle/cycleId/${cycleId}/verify-deletion`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error verifying training cycle deletion:', error);
    throw error;
  }
};

const deleteTrainingCycleTemplate = async (cycleId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/training-cycle-templates/cycleId/${cycleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error deleting training cycle:', error);
    throw error;
  }
};

const createNewTrainingFromExcelView = async (plan) => {
  try {
    const response = await fetch(`${apiUrl}/workout/from-excel-view`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(plan)
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error creating new training from excel view:', error);
    throw error;
  }
};

const submitFeedback = async (planId, body, clientId) => {
  try {
    const url = `${apiUrl}/workout/feedback/${planId}/clientId/${clientId}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};

const assignWorkoutToClient = async (workoutIds, clientId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/assign-workout-to-client/${clientId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(workoutIds)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error assigning workout to client:', error);
    throw error;
  }
};

const unassignWorkoutFromClient = async (workoutsIds, clientId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/unassign-workout-from-client/${clientId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify(workoutsIds)
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error unassigning workout from client:', error);
    throw error;
  }
};

const assignWorkout = async (data) => {
  try {
    const response = await fetch(`${apiUrl}/workout/assignWorkout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const responseData = await response.json();
    if (responseData.error) {
      throw new Error(responseData.message);
    }
    return responseData;
  } catch (error) {
    console.error('Error assigning workout:', error);
    throw error;
  }
};

const assignWorkoutsToCycle = async (cycleId, clientId, body) => {
  try {
    const response = await fetch(`${apiUrl}/workout/assign-cycle/${cycleId}/assign-workouts/${clientId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error assigning workouts to cycle:', error);
    throw error;
  }
};

const createTrainingCycleTemplate = async (body) => {
  try {
    const response = await fetch(`${apiUrl}/workout/training-cycle-templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error creating training cycle template:', error);
    throw error;
  }
};

const createCycleAndAssignWorkouts = async (body) => {
  try {
    const response = await fetch(`${apiUrl}/workout/create-cycle-and-assign-workouts/${body.clientId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error creating cycle and assigning workouts:', error);
    throw error;
  }
};

const assignSession = async (sessionId, body) => {
  try {
    const response = await fetch(`${apiUrl}/workout/assign-session/${sessionId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error assigning session:', error);
    throw error;
  }
};

const assignTrainingSessionToClient = async (body) => {
  try {
    const response = await fetch(`${apiUrl}/workout/assign-training-session-to-client`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error assigning training session to client:', error);
    throw error;
  }
};

const createAndAssignWorkout = async (body) => {
  try {
    const response = await fetch(`${apiUrl}/workout/create-workout-and-assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error creating and assigning workout:', error);
    throw error;
  }
};

const unassignWorkoutsFromCycle = async (cycleId, body) => {
  try {
    const response = await fetch(`${apiUrl}/workout/delete-instances-cycle/${cycleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error unassigning workouts from cycle:', error);
    throw error;
  }
};

const deleteWorkoutPlan = async (planId, isTemplate) => {
  try {
    const url = isTemplate ? `${apiUrl}/workout/${planId}` : `${apiUrl}/workout/deleteInstance/${planId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error deleting workout plan:', error);
    throw error;
  }
};

const deletePlan = async (workoutInstanceId) => {
  try {
    const url = `${apiUrl}/workout/deleteInstance/${workoutInstanceId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return true;
  } catch (error) {
    console.error('Error deleting plan:', error);
    throw error;
  }
};

const getRpeMethods = async (userId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/rpe/all/${userId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error getting RPE methods:', error);
    throw error;
  }
};

const getRpeMethodAssigned = async (clientId = -1, planId = -1, cycleId = -1) => {
  try {
    const response = await fetch(`${apiUrl}/workout/rpe/get-by-client-id/${clientId}/${planId}/${cycleId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error getting RPE method assigned:', error);
    throw error;
  }
};

const getRpeAssignments = async (userId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/rpe/get-all-assignments/${userId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error getting RPE assignments:', error);
    throw error;
  }
};

const createOrUpdateRpeMethod = async (dialogMode, newRpe, userId) => {
  try {
    const url =
      dialogMode === 'create'
        ? `${apiUrl}/workout/rpe/create/${userId}`
        : `${apiUrl}/workout/rpe/update/${newRpe.id}/${userId}`;
    const method = dialogMode === 'create' ? 'POST' : 'PUT';

    const response = await fetch(url, {
      method: method,
      headers: getAuthHeaders(),
      body: JSON.stringify(newRpe)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.message);
    }
    return true;
  } catch (error) {
    console.error('Error creating or updating RPE method:', error);
    throw error;
  }
};

const assignRpeToTarget = async (rpeMethodId, targetType, targetId, userId) => {
  try {
    const body = { rpeMethodId, targetType, targetId };
    const response = await fetch(`${apiUrl}/workout/rpe/assign/${userId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.message);
    }
    return true;
  } catch (error) {
    console.error('Error assigning RPE to target:', error);
    throw error;
  }
};

const removeRpeAssignment = async (assignmentId, userId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/rpe/remove-assignment/${assignmentId}/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.message);
    }
    return true;
  } catch (error) {
    console.error('Error removing RPE assignment:', error);
    throw error;
  }
};

const deleteRpe = async (rpeId, userId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/rpe/delete/${rpeId}/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.message);
    }
    return true;
  } catch (error) {
    console.error('Error deleting RPE:', error);
    throw error;
  }
};

const deleteExercises = async (exercises) => {
  try {
    const response = await fetch(`${apiUrl}/workout/delete-exercises`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(exercises)
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.message);
    }
    return data;
  } catch (error) {
    console.error('Error deleting exercises:', error);
    throw error;
  }
};

const assignCycleTemplateToClient = async (payload) => {
  try {
    const response = await fetch(`${apiUrl}/workout/assign-cycle-template-to-client`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.message);
    }
    return data;
  } catch (error) {
    console.error('Error assigning cycle template to client:', error);
    throw error;
  }
};

// Coach Home Page
const fetchLastTimeTrained = async (coachId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/last-time-trained/${coachId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error fetching last time trained:', error);
    throw error;
  }
};

const fetchHowLongToFinishCycle = async (coachId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/how-long-to-finish-cycle/${coachId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error fetching how long to finish cycle:', error);
    throw error;
  }
};

const fetchTrainingFrequency = async (coachId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/training-frequency/${coachId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error fetching training frequency:', error);
    throw error;
  }
};

const saveWorkoutChanges = async (payload) => {
  try {
    const response = await fetch(`${apiUrl}/workout/save-changes-from-excel-view`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error saving workout changes:', error);
    throw error;
  }
};

const updateWorkoutInstance = async (workoutInstanceId, body) => {
  try {
    const response = await fetch(`${apiUrl}/workout/session-details/${workoutInstanceId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error updating workout instance:', error);
    throw error;
  }
};

export {
  fetchTrainingCyclesByCoachId,
  findAllWorkoutTemplatesByCoachId,
  fetchWorkoutInstanceTemplate,
  fetchWorkoutInstance,
  fetchTrainingCyclesByClient,
  fetchTrainingCyclesForClientByUserId,
  fetchWorkoutsByClientId,
  createTrainingCycle,
  updateExercisesInstace,
  updatePlanName,
  submitPlan,
  submitFeedback,
  assignWorkout,
  assignWorkoutsToCycle,
  assignSession,
  unassignWorkoutsFromCycle,
  fetchAssignedWorkoutsForCycleDay,
  deleteWorkoutPlan,
  deletePlan,
  getRpeMethods,
  createOrUpdateRpeMethod,
  assignRpeToTarget,
  removeRpeAssignment,
  deleteRpe,
  createNewTrainingFromExcelView,
  verifyExerciseChanges,
  deleteExercises,
  createCycleAndAssignWorkouts,
  assignWorkoutToClient,
  unassignWorkoutFromClient,
  createTrainingCycleTemplate,
  fetchTrainingCyclesTemplates,
  updateTrainingCycle,
  deleteTrainingCycle,
  verifyTrainingCycleDeletion,
  fetchTrainingCycleTemplateById,
  deleteTrainingCycleTemplate,
  assignCycleTemplateToClient,
  fetchDeletedWorkoutTemplatesByCoachId,
  assignTrainingSessionToClient,
  fetchTrainingSessionWithNoWeekByClientId,
  fetchLastTimeTrained,
  fetchHowLongToFinishCycle,
  fetchTrainingFrequency,
  fetchExcelViewByCycleAndDay,
  saveWorkoutChanges,
  createAndAssignWorkout,
  getRpeMethodAssigned,
  getRpeAssignments,
  updateWorkoutInstance
};

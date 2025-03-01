import { getDayMonthYear } from "../utils/UtilFunctions";

const apiUrl = process.env.REACT_APP_API_URL;

const createExercises = async (exercises) => {
  const response = await fetch(`${apiUrl}/exercise/generate-exercises`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exercises)
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

const findAllWorkoutTemplatesByCoachId = async (coachId) => {
  const response = await fetch(`${apiUrl}/workout/workout-template/coachId/${coachId}`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

const findOneWorkoutTemplateByCoachId = async (coachId, templateId) => {
  const response = await fetch(`${apiUrl}/workout/workout-template/coachId/${coachId}/templateId/${templateId}`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

const fetchCoachWorkouts = async (userId) => {
  const response = await fetch(`${apiUrl}/workout/coach-workouts/userId/${userId}`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const fetchTrainingCyclesTemplates = async (coachId) => {
  const response = await fetch(`${apiUrl}/workout/training-cycle-templates/coachId/${coachId}`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

const fetchWorkoutInstanceTemplate = async (templateId) => {
  const response = await fetch(`${apiUrl}/workout/workout-instance-template/${templateId}`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

const fetchWorkoutInstance = async (planId) => {
  const response = await fetch(`${apiUrl}/workout/workout-instance/${planId}`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const fetchTrainingCyclesByClient = async (clientId) => {
  try {
    const response = await fetch(`${apiUrl}/workout/training-cycles/client/clientId/${clientId}`);
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    const cycles = data.data;

    if(cycles.length === 0) return { events: [], cycleOptions: [] };
    const events = cycles.flatMap(cycle => 
      cycle.trainingWeeks.flatMap(week => 
        week.trainingSessions.flatMap(session => {
          const sessionEvents = session.workoutInstances.length > 0
            ? session.workoutInstances.map(workoutInstance => {
              workoutInstance.status = updateStatusLocal(workoutInstance, session);
              if(session.id === 731) console.log(session)
              return {
                title: workoutInstance.instanceName ? workoutInstance.instanceName : workoutInstance.workout.planName,
                //start: getDayMonthYear(session).toISOString().split('T')[0],
                start: session.sessionDate,
                extendedProps: {
                  status: workoutInstance.status,
                  workoutInstanceId: workoutInstance.id,
                  sessionId: session.id
                }}
              }
              )
            : [{
                title: 'no title',
                //start: getDayMonthYear(session).toISOString().split('T')[0],
                start: session.sessionDate,
                extendedProps: {
                  sessionId: session.id,
                  cycle: cycle.name
                }
              }];
          
          return sessionEvents;
        })
      )
    );
    return { events, cycleOptions: cycles };
  } catch (error) {
    throw error;
  }
};

const fetchTrainingCyclesForClientByUserId = async (userId) => {
  const url = `${apiUrl}/workout/training-cycles/client/userId/${userId}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const fetchTrainingCyclesByCoachId = async (coachId) => {
  const response = await fetch(`${apiUrl}/workout/training-cycles/coachId/${coachId}`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const fetchTrainingCycleTemplateById = async (cycleId) => {
  const response = await fetch(`${apiUrl}/workout/training-cycle-templates/cycleId/${cycleId}`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}
const fetchWorkoutsByClientId = async (clientId) => {
  const response = await fetch(`${apiUrl}/workout/clientId/${clientId}`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const fetchAssignedWorkoutsForCycleDay = async (cycleId, dayNumber) => {
  const response = await fetch(`${apiUrl}/workout/training-cycle/${cycleId}/day/${dayNumber}`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const createTrainingCycle = async (body) => {
  const response = await fetch(`${apiUrl}/workout/training-cycles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
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
  }else {
    return workout.status
  }
}

const updateExercisesInstace = async (exercises) => {
  const response = await fetch(`${apiUrl}/workout/updateExercises`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(exercises),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

const verifyExerciseChanges = async (exerciseData) => {
  const response = await fetch(`${apiUrl}/workout/verify-exercise-changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exerciseData)
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

const updatePlanName = async (planId, planName) => {
  const response = await fetch(`${apiUrl}/workout/update-name/${planId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: planName })
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

const submitPlan = async (plan, planId, isEdit, isTemplate) => {
  const requestMethod = isEdit ? 'PUT' : 'POST';
  const endpoint = isEdit 
    ? `${apiUrl}/workout/${isTemplate ? 'template' : 'instance'}/${planId}` 
    : `${apiUrl}/workout`;

  console.log('OK: ', endpoint);
  const response = await fetch(endpoint, {
    method: requestMethod,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(plan),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const updateTrainingCycle = async (cycleId, body) => {
  const response = await fetch(`${apiUrl}/workout/training-cycle-templates/cycleId/${cycleId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json', 
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;

};

const deleteTrainingCycle = async (cycleId) => {
  const response = await fetch(`${apiUrl}/workout/training-cycle-templates/cycleId/${cycleId}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};


const createNewTrainingFromExcelView = async (plan) => {
  const response = await fetch(`${apiUrl}/workout/from-excel-view`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(plan),
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

const submitFeedback = async (planId, body) => {
  const url = `${apiUrl}/workout/feedback/${planId}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const assignWorkoutToClient = async (workoutIds, clientId) => {
  const response = await fetch(`${apiUrl}/workout/assign-workout-to-client/${clientId}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(workoutIds),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const unassignWorkoutFromClient = async (workoutsIds, clientId) => {
  const response = await fetch(`${apiUrl}/workout/unassign-workout-from-client/${clientId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workoutsIds),
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const assignWorkout = async (data) => {
  const response = await fetch(`${apiUrl}/workout/assignWorkout`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  const responseData = await response.json();
  if (responseData.error) {
    throw new Error(responseData.message);
  }
  return responseData;
};

const assignWorkoutsToCycle = async (cycleId, clientId, body) => {
  const response = await fetch(`${apiUrl}/workout/assign-cycle/${cycleId}/assign-workouts/${clientId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (data.error) {
    console.log(data)
    throw new Error(data.error);
  }
  return data;
};

const createTrainingCycleTemplate = async (body) => {
  const response = await fetch(`${apiUrl}/workout/training-cycle-templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
    if (data.error) {
      console.log(data)
      throw new Error(data.error);
    }
    return data;
};



const createCycleAndAssignWorkouts = async (body) => {
  const response = await fetch(`${apiUrl}/workout/create-cycle-and-assign-workouts/${body.clientId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

const assignSession = async (sessionId, body) => {
  const response = await fetch(`${apiUrl}/workout/assign-session/${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const unassignWorkoutsFromCycle = async (cycleId, body) => {
  const response = await fetch(`${apiUrl}/workout/delete-instances-cycle/${cycleId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const deleteWorkoutPlan = async (planId, isTemplate) => {
  const url = isTemplate ? `${apiUrl}/workout/${planId}` : `${apiUrl}/workout/deleteInstance/${planId}`;
  
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const deletePlan = async (workoutInstanceId) => {
  const url = `${apiUrl}/workout/deleteInstance/${workoutInstanceId}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return true;
};

const getRpeMethods = async (userId) => {
  const response = await fetch(`${apiUrl}/workout/rpe/all/${userId}`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

const createOrUpdateRpeMethod = async (dialogMode, newRpe, userId) => {
  const url = dialogMode === 'create' ? `${apiUrl}/workout/rpe/create/${userId}` : `${apiUrl}/workout/rpe/update/${newRpe.id}/${userId}`;
  const method = dialogMode === 'create' ? 'POST' : 'PUT';

  const response = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newRpe),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.message);
  }
  return true;
}

const assignRpeToTarget = async (rpeMethodId, targetType, targetId, userId) => {
  const body = { rpeMethodId, targetType, targetId };
  const response = await fetch(`${apiUrl}/workout/rpe/assign/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.message);
  }
  return true;
};

const getRpeAssignmentsByTarget = async (targetType, targetId) => {
  const response = await fetch(`${apiUrl}/rpe/target/${targetType}/${targetId}`, {
    method: 'POST',
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.message);
  }
  return data;
};

const deleteRpe = async (rpeId, userId) => {
  const response = await fetch(`${apiUrl}/workout/rpe/delete/${rpeId}/${userId}`, {
    method: 'DELETE',
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.message);
  }
  return true;
}

const deleteExercises = async (exercises) => {
  const response = await fetch(`${apiUrl}/workout/delete-exercises`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exercises)
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.message);
  }
  return data;
}

const assignCycleTemplateToClient = async (payload) => {
  const response = await fetch(`${apiUrl}/workout/assign-cycle-template-to-client`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.message);
  }
  return data;
}

export { 
    fetchTrainingCyclesByCoachId,
    fetchCoachWorkouts, 
    findAllWorkoutTemplatesByCoachId,
    findOneWorkoutTemplateByCoachId,
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
    getRpeAssignmentsByTarget,
    deleteRpe,
    createNewTrainingFromExcelView,
    verifyExerciseChanges,
    deleteExercises,
    createCycleAndAssignWorkouts,
    createExercises,
    assignWorkoutToClient,
    unassignWorkoutFromClient,
    createTrainingCycleTemplate,
    fetchTrainingCyclesTemplates,
    updateTrainingCycle,
    deleteTrainingCycle,
    fetchTrainingCycleTemplateById,
    assignCycleTemplateToClient
};
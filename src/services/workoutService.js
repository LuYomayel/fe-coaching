const apiUrl = process.env.REACT_APP_API_URL;
const fetchCoachWorkouts = async (userId) => {
    const response = await fetch(`${apiUrl}/workout/coach-workouts/userId/${userId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    }
    return response.json(); // Devuelve la respuesta para su uso posterior si es necesario
};

const fetchWorkoutInstance = async (planId) => {
    const response = await fetch(`${apiUrl}/workout/workout-instance/${planId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    }
    return response.json(); // Devuelve los datos del plan directamente
};

const fetchTrainingCyclesByClient = async (clientId) => {
    try {
      const response = await fetch(`${apiUrl}/workout/training-cycles/client/clientId/${clientId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
      }
      const cycles = await response.json();
      const events = cycles.flatMap(cycle => 
        cycle.trainingWeeks.flatMap(week => 
          week.trainingSessions.flatMap(session => {
            const sessionEvents = session.workoutInstances.length > 0
              ? session.workoutInstances.map(workoutInstance => {
                workoutInstance.status = updateStatusLocal(workoutInstance, session);
                if(new Date(session.sessionDate).getMonth() === 2)
                 console.log(getDayMonthYear(session).toISOString().split('T')[0])
                return {
                  title: workoutInstance.workout.planName,
                  start: getDayMonthYear(session).toISOString().split('T')[0],
                  extendedProps: {
                    status: workoutInstance.status,
                    workoutInstanceId: workoutInstance.id,
                    sessionId: session.id
                  }}
                }
                )
              : [{
                  title: 'no title', // Default title when no workouts are scheduled
                  start: getDayMonthYear(session).toISOString().split('T')[0],
                  extendedProps: {
                    sessionId: session.id,
                    cycle: cycle.name
                  }
                }];
            
            return sessionEvents;
          })
        )
      );
  
      const cycleMap = cycles.map(cycle => {
        const startDate = new Date(cycle.startDate);
        const monthYear = `${startDate.getMonth() + 1}-${startDate.getFullYear()}`;
        return { monthYear, id: cycle.id };
      });
  
      return { events, cycleMap };
    } catch (error) {
      throw error; // re-throw to handle it in the component
    }
};

// In workoutService.js
const fetchTrainingCyclesForClientByUserId = async (userId) => {
    const url = `${apiUrl}/workout/training-cycles/client/userId/${userId}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
      }
      const cycles = await response.json();
      return cycles;
    } catch (error) {
      throw error; // Throw error to be handled by the caller
    }
  };
const fetchTrainingCyclesByCoachId = async (coachId) => {
    try {
      const response = await fetch(`${apiUrl}/workout/training-cycles/coachId/${coachId}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching training cycles:', errorData);
        throw new Error(errorData.message || 'Something went wrong');
      }
      return await response.json();
    } catch (error) {
      throw error; // re-throw to handle it in the component
    }
};


const fetchWorkoutsByClientId = async (clientId) => {
    try {
      const response = await fetch(`${apiUrl}/workout/clientId/${clientId}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching workouts:', errorData);
        throw new Error(errorData.message || 'Something went wrong');
      }
      return await response.json();
    } catch (error) {
      throw error; // re-throw to handle it in the component
    }
};


const createTrainingCycle = async (body) => {
    const response = await fetch(`${apiUrl}/workout/training-cycles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    }
  
    return await response.json();  // Assuming you might want the response data
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

const getDayMonthYear = (session) => {
  const sessionDate = new Date(session.sessionDate);
  const year = sessionDate.getFullYear();
  const month = sessionDate.getMonth(); // 0-based
  const day = sessionDate.getDate();

  return new Date(year, month, day); // Esto crea una fecha sin hora
};

const submitPlan = async (plan, planId, isEdit) => {
    
    const requestMethod = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit 
      ? `${apiUrl}/workout/${plan.isTemplate ? 'template' : 'instance'}/${planId}` 
      : `${apiUrl}/workout`;
  
    const response = await fetch(endpoint, {
      method: requestMethod,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plan),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    }
    return response.json();
};

const submitFeedback = async (planId, body) => {
    const url = `${apiUrl}/workout/feedback/${planId}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
        throw new Error(errorData.message || 'Something went wrong');
      }
      return await response.json();  // Assuming you need data from the response
    } catch (error) {
      throw error; // Rethrow to be handled where the function is called
    }
  };


const assignWorkout = async (data) => {
    const response = await fetch(`${apiUrl}/workout/assignWorkout`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    }
  
    return response.json(); // Devuelve la respuesta para su uso posterior si es necesario
};

const assignWorkoutsToCycle = async (cycleId, clientId, body) => {
    const response = await fetch(`${apiUrl}/workout/assign-cycle/${cycleId}/assign-workouts/${clientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    }
  
    return response.json(); // Puede devolver la respuesta para confirmar la operación o manejarla como desees
};

const assignSession = async (sessionId, body) => {
    const response = await fetch(`${apiUrl}/workout/assign-session/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    }
  
    return response.json(); // Asumimos que la respuesta es JSON y puede ser útil devolverla
};

const deleteWorkoutPlan = async (planId, isTemplate) => {
    const url = isTemplate ? `${apiUrl}/workout/${planId}` : `${apiUrl}/workout/deleteInstance/${planId}`;
    
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        'Content-Type': 'application/json',
      },
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    }
  
    return response.ok; // Puedes devolver true o algún otro indicativo de éxito
};

const deletePlan = async (workoutInstanceId) => {
    const url = `${apiUrl}/workout/deleteInstance/${workoutInstanceId}`;
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error deleting plan:', errorData);
        throw new Error(errorData.message || 'Something went wrong');
      }
      return true;  // Indicate success
    } catch (error) {
      throw error;  // Re-throw to handle it in the component
    }
  };




export { 
    fetchTrainingCyclesByCoachId,
    fetchCoachWorkouts, 
    fetchWorkoutInstance, 
    fetchTrainingCyclesByClient,
    fetchTrainingCyclesForClientByUserId,
    fetchWorkoutsByClientId,
    createTrainingCycle,
    submitPlan,
    submitFeedback,
    assignWorkout, 
    assignWorkoutsToCycle, 
    assignSession, 
    deleteWorkoutPlan,
    deletePlan,
};

const apiUrl = process.env.REACT_APP_API_URL;

const fetchExercises = async () => {
  const response = await fetch(`${apiUrl}/exercise`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const fetchCoachExercises = async (userId) => {
  const response = await fetch(`${apiUrl}/exercise/coach/${userId}`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const fetchBodyAreas = async () => {
  const response = await fetch(`${apiUrl}/exercise/body-area`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const createExercise = async (exercise) => {
  const response = await fetch(`${apiUrl}/exercise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exercise)
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const importExercises = async (coachId, file) => {
  const response = await fetch(`${apiUrl}/exercise/import/${coachId}`, {
    method: 'POST',
    body: file
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const updateExercise = async (exerciseId, exercise) => {
  const response = await fetch(`${apiUrl}/exercise/${exerciseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exercise)
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const deleteExercise = async (exerciseId) => {
  const response = await fetch(`${apiUrl}/exercise/${exerciseId}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export { fetchExercises, fetchCoachExercises, fetchBodyAreas, deleteExercise, createExercise, updateExercise, importExercises };

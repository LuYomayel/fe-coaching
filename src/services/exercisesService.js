const apiUrl = process.env.REACT_APP_API_URL;

const fetchCoachExercises = async (coachId) => {
  const response = await fetch(`${apiUrl}/exercise/coach/${coachId}`);
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

const fetchExerciseTypes = async () => {
  const response = await fetch(`${apiUrl}/exercise/exercise-types`);
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
  const response = await fetch(`${apiUrl}/exercise/by-id/${exerciseId}`, {
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

const massUpdateExercises = async (exercises) => {
  try {
    const response = await fetch(`${apiUrl}/exercise/mass-update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exercises)
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error updating exercises', error);

    throw error;
  }
};

const deleteExercise = async (exerciseId) => {
  const response = await fetch(`${apiUrl}/exercise/${exerciseId}`, {
    method: 'DELETE'
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

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
};

const analyzeExcelFile = async (coachId, file) => {
  const response = await fetch(`${apiUrl}/exercise/analyze-import/${coachId}`, {
    method: 'POST',
    body: file
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const processImportExercises = async (coachId, importData) => {
  const response = await fetch(`${apiUrl}/exercise/process-import/${coachId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(importData)
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export {
  fetchCoachExercises, // checked
  fetchBodyAreas, // checked
  fetchExerciseTypes, // checked
  deleteExercise, // checked
  createExercise, // checked
  updateExercise, // checked
  importExercises, // checked
  createExercises, // checked
  analyzeExcelFile,
  processImportExercises,
  massUpdateExercises
};

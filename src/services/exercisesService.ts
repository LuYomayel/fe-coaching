import {
  ApiResponse,
  IBodyArea,
  IExercise,
  IExerciseType,
  IProcessImportExercisesResponse
} from '../types/shared-types';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const fetchCoachExercises = async (coachId: any): Promise<ApiResponse<IExercise[]>> => {
  const response = await fetch(`${apiUrl}/exercise/coach/${coachId}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const fetchBodyAreas = async (): Promise<ApiResponse<IBodyArea[]>> => {
  const response = await fetch(`${apiUrl}/exercise/body-area`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const fetchExerciseTypes = async (): Promise<ApiResponse<IExerciseType[]>> => {
  const response = await fetch(`${apiUrl}/exercise/exercise-type`);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};
const createExercise = async (exercise: any): Promise<ApiResponse<IExercise>> => {
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

const importExercises = async (coachId: any, file: any): Promise<ApiResponse<IExercise[]>> => {
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

const updateExercise = async (exerciseId: any, exercise: any): Promise<ApiResponse<IExercise>> => {
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

const massUpdateExercises = async (exercises: any): Promise<ApiResponse<IExercise[]>> => {
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

const deleteExercise = async (exerciseId: any): Promise<ApiResponse<IExercise>> => {
  const response = await fetch(`${apiUrl}/exercise/${exerciseId}`, {
    method: 'DELETE'
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

const createExercises = async (exercises: any): Promise<ApiResponse<IExercise[]>> => {
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

const analyzeExcelFile = async (coachId: any, file: any): Promise<ApiResponse<IExercise[]>> => {
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

const processImportExercises = async (
  coachId: any,
  importData: any
): Promise<ApiResponse<IProcessImportExercisesResponse>> => {
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

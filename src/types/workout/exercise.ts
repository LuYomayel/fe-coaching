import { ICoach } from 'types/models';
export interface IExercise {
  id: number;
  name: string;
  createdByCoach: boolean;
  createdByAdmin: boolean;
  multimedia: string;

  category: ICategory | null;
  variant: IVariant | null;
  contractionType: IContractionType | null;
  difficultyLevel: IDifficultyLevel | null;
  movementPlane: IMovementPlane | null;
  unilateralType: IUnilateralType | null;
  movementPattern: IMovementPattern | null;

  regressionExercise: IExercise | null;
  progressionExercise: IExercise | null;

  equipments: IExerciseEquipment[];
  muscles: IExerciseMuscle[];

  coach: ICoach | null;
}

export interface ICategory {
  id: number;
  name: string;
}
export interface IVariant {
  id: number;
  name: string;
}
export interface IEquipment {
  id: number;
  name: string;
}
export interface IExerciseEquipment {
  exercise: IExercise;
  equipment: IEquipment;
  exercise_id: number;
  equipment_id: number;
}
export interface IContractionType {
  id: number;
  name: string;
}
export interface IDifficultyLevel {
  id: number;
  name: string;
}
export interface IMovementPlane {
  id: number;
  name: string;
}
export interface IUnilateralType {
  id: number;
  name: string;
}
export interface IMovementPattern {
  id: number;
  name: string;
}
export interface IMuscle {
  id: number;
  name: string;
}
export interface IExerciseMuscle {
  exercise: IExercise;
  muscle: IMuscle;
  exercise_id: number;
  muscle_id: number;
}

// Frontend DTO interfaces for workout excel view changes

export interface WeeksDataDto {
  [weekNumber: number]: { [prop: string]: any };
}

export interface NewExerciseDto {
  exerciseId: number;
  name: string;
  groupNumber: number;
  rowIndex: number;
  weeksData: WeeksDataDto;
}

export interface MovedExerciseDto {
  name: string;
  exerciseInstanceId: number;
  oldGroupNumber: number;
  newGroupNumber: number;
  oldRowIndex: number;
  newRowIndex: number;
}

export interface MovedGroupDto {
  groupNumber: number;
  newOrder: number;
}

export interface UpdatedPropertyDto {
  name: string;
  exerciseInstanceId: number;
  weekNumber: number;
  property: string;
  value: any;
}

export interface ChangesDto {
  newExercises: NewExerciseDto[];
  movedExercises: MovedExerciseDto[];
  movedGroups: MovedGroupDto[];
  updatedProperties: UpdatedPropertyDto[];
  deletedExercises: number[];
}

export interface SaveChangesFromExcelViewDto {
  cycleId: number;
  dayNumber: number;
  changes: ChangesDto;
}

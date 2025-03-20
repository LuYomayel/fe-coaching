import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsObject, IsString, ValidateNested } from 'class-validator';

class WeeksDataDto {
  [weekNumber: number]: { [prop: string]: any };
}

class NewExerciseDto {
  @IsNumber()
  exerciseId: number;

  @IsString()
  name: string;

  @IsNumber()
  groupNumber: number;

  @IsNumber()
  rowIndex: number;

  @IsObject()
  weeksData: WeeksDataDto;
}

class MovedExerciseDto {
  @IsString()
  name: string;

  @IsNumber()
  exerciseInstanceId: number;

  @IsNumber()
  oldGroupNumber: number;

  @IsNumber()
  newGroupNumber: number;

  @IsNumber()
  oldRowIndex: number;

  @IsNumber()
  newRowIndex: number;
}

class MovedGroupDto {
  @IsNumber()
  groupNumber: number;

  @IsNumber()
  newOrder: number;
}

class UpdatedPropertyDto {
  @IsString()
  name: string;

  @IsNumber()
  exerciseInstanceId: number;

  @IsNumber()
  weekNumber: number;

  @IsString()
  property: string;

  value: any;
}

class ChangesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewExerciseDto)
  newExercises: NewExerciseDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MovedExerciseDto)
  movedExercises: MovedExerciseDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MovedGroupDto)
  movedGroups: MovedGroupDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatedPropertyDto)
  updatedProperties: UpdatedPropertyDto[];

  @IsArray()
  @Type(() => Number)
  deletedExercises: number[];
}

export class SaveChangesFromExcelViewDto {
  @IsNumber()
  cycleId: number;

  @IsNumber()
  dayNumber: number;

  @ValidateNested()
  @Type(() => ChangesDto)
  changes: ChangesDto;
}

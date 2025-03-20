import { HttpException, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ExerciseInstance } from '../entities/exercise-instance.entity';
import { SaveChangesFromExcelViewDto } from '../dtos/save-changes-from-excel-view.dto';

class WorkoutService {
  constructor(private dataSource: DataSource) {}

  async saveChangesFromExcelView(dto: SaveChangesFromExcelViewDto): Promise<{ message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 0. Procesa ejercicios eliminados
      if (dto.changes.deletedExercises && dto.changes.deletedExercises.length > 0) {
        console.log(`===== Procesando ${dto.changes.deletedExercises.length} ejercicios eliminados =====`);

        for (const exerciseInstanceId of dto.changes.deletedExercises) {
          try {
            await queryRunner.manager.delete(ExerciseInstance, exerciseInstanceId);
            console.log(`✅ Ejercicio ID=${exerciseInstanceId} eliminado correctamente`);
          } catch (error) {
            console.error(`Error al eliminar ejercicio ID=${exerciseInstanceId}:`, error);
            throw error;
          }
        }
      }

      // 1. Procesa nuevos ejercicios
      for (const newEx of dto.changes.newExercises) {
        // ... resto del código existente ...
      }

      console.log(`===== Transacción completada con éxito =====`);
      console.log(`Ejercicios eliminados: ${dto.changes.deletedExercises?.length || 0}`);
      console.log(`Ejercicios nuevos: ${dto.changes.newExercises?.length || 0}`);
      console.log(`Ejercicios movidos: ${dto.changes.movedExercises?.length || 0}`);
      console.log(`Grupos movidos: ${dto.changes.movedGroups?.length || 0}`);
      console.log(`Propiedades actualizadas: ${dto.changes.updatedProperties?.length || 0}`);

      await queryRunner.commitTransaction();
      return { message: 'Changes saved successfully' };
    } catch (error) {
      console.error('Error saving changes from excel view:', error);
      await queryRunner.rollbackTransaction();
      throw new HttpException(`Error saving changes: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }
}

export default WorkoutService;

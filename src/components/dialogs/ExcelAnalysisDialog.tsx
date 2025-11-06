import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useIntl } from 'react-intl';
import { Checkbox } from 'primereact/checkbox';
import { ProgressSpinner } from 'primereact/progressspinner';
import { api } from '../../services/api-client';
import {
  ICategory,
  IContractionType,
  IDifficultyLevel,
  IEquipment,
  IExercise,
  IMovementPattern,
  IMovementPlane,
  IMuscle,
  IUnilateralType,
  IVariant
} from 'types/workout/exercise';

interface ExerciseData {
  description?: string;
  exerciseType?: string;
  equipmentNeeded?: string;
  multimedia?: string;
  bodyArea?: string[];
  [key: string]: any;
}

interface ExerciseChange {
  old: any; // Puede ser un objeto { id, name }, un array de objetos, o un valor simple
  new: any; // Puede ser un objeto { id, name }, un array de objetos, o un valor simple
}

interface ExerciseToCreate {
  name: string;
  multimedia?: string;
  categoryId?: number;
  variantId?: number;
  contractionTypeId?: number;
  difficultyLevelId?: number;
  movementPlaneId?: number;
  unilateralTypeId?: number;
  movementPatternId?: number;
  regressionExerciseId?: number;
  progressionExerciseId?: number;
  equipmentIds?: number[];
  muscleIds?: number[];
  // Campos adicionales que pueden venir del backend
  [key: string]: any;
}

interface ExerciseAnalysisItem {
  id?: number;
  name: string;
  status?: 'NEW' | 'EXISTING';
  rowIndex?: number;
  // Para exercisesToUpdate
  updates?: {
    multimedia?: string;
    categoryId?: number;
    variantId?: number;
    contractionTypeId?: number;
    difficultyLevelId?: number;
    movementPlaneId?: number;
    unilateralTypeId?: number;
    movementPatternId?: number;
    regressionExerciseId?: number;
    progressionExerciseId?: number;
    equipmentIds?: number[];
    muscleIds?: number[];
    [key: string]: any;
  };
  changes?: Record<string, ExerciseChange>;
  selectedChanges?: Record<string, boolean>;
  // Para exercisesToCreate (legacy)
  currentData?: ExerciseData;
  newData?: ExerciseData | ExerciseToCreate;
  // Campos directos para exercisesToCreate (sin newData wrapper)
  multimedia?: string;
  categoryId?: number;
  variantId?: number;
  contractionTypeId?: number;
  difficultyLevelId?: number;
  movementPlaneId?: number;
  unilateralTypeId?: number;
  movementPatternId?: number;
  regressionExerciseId?: number;
  progressionExerciseId?: number;
  equipmentIds?: number[];
  muscleIds?: number[];
}

interface AnalysisData {
  exercisesToUpdate?: ExerciseAnalysisItem[];
  exercisesToCreate?: ExerciseAnalysisItem[];
}

interface ExcelAnalysisDialogProps {
  visible: boolean;
  onHide: () => void;
  analysisData: AnalysisData | null;
  onConfirm: () => void;
  setAnalysisData: (data: AnalysisData | null) => void;
}

const ExcelAnalysisDialog: React.FC<ExcelAnalysisDialogProps> = ({
  visible,
  onHide,
  analysisData,
  onConfirm,
  setAnalysisData
}) => {
  const intl = useIntl();
  const [localAnalysisData, setLocalAnalysisData] = useState<AnalysisData | null>(analysisData);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [contractions, setContractions] = useState<IContractionType[]>([]);
  const [difficulties, setDifficulties] = useState<IDifficultyLevel[]>([]);
  const [equipments, setEquipments] = useState<IEquipment[]>([]);
  const [movementPatterns, setMovementPatterns] = useState<IMovementPattern[]>([]);
  const [movementPlanes, setMovementPlanes] = useState<IMovementPlane[]>([]);
  const [muscles, setMuscles] = useState<IMuscle[]>([]);
  const [unilateralTypes, setUnilateralTypes] = useState<IUnilateralType[]>([]);
  const [variants, setVariants] = useState<IVariant[]>([]);
  const [exercises, setExercises] = useState<IExercise[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);

  // Cargar datos de referencia cuando el diálogo se abre
  useEffect(() => {
    if (visible) {
      setIsLoadingMetadata(true);
      const loadExerciseProperties = async () => {
        try {
          const [
            categoriesRes,
            contractionsRes,
            difficultiesRes,
            equipmentsRes,
            movementPatternsRes,
            movementPlanesRes,
            musclesRes,
            unilateralTypesRes,
            variantsRes,
            exercisesRes
          ] = await Promise.all([
            api.exercise.fetchCategories(),
            api.exercise.fetchContractions(),
            api.exercise.fetchDifficulties(),
            api.exercise.fetchEquipments(),
            api.exercise.fetchMovementPatterns(),
            api.exercise.fetchMovementPlanes(),
            api.exercise.fetchMuscles(),
            api.exercise.fetchUnilateralTypes(),
            api.exercise.fetchVariants(),
            api.exercise.fetchCoachExercises()
          ]);

          setCategories(categoriesRes.data || []);
          setContractions(contractionsRes.data || []);
          setDifficulties(difficultiesRes.data || []);
          setEquipments(equipmentsRes.data || []);
          setMovementPatterns(movementPatternsRes.data || []);
          setMovementPlanes(movementPlanesRes.data || []);
          setMuscles(musclesRes.data || []);
          setUnilateralTypes(unilateralTypesRes.data || []);
          setVariants(variantsRes.data || []);
          setExercises(exercisesRes.data || []);
        } catch (error) {
          console.error('Error loading exercise properties:', error);
        } finally {
          setIsLoadingMetadata(false);
        }
      };
      loadExerciseProperties();
    } else {
      // Resetear el estado cuando se cierra el diálogo
      setIsLoadingMetadata(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!analysisData) {
      setLocalAnalysisData(null);
      return;
    }

    // Solo inicializamos si no hay selectedChanges definidos
    const hasInitializedChanges = analysisData?.exercisesToUpdate?.some(
      (exercise) => exercise.selectedChanges && Object.keys(exercise.selectedChanges).length > 0
    );

    if (!hasInitializedChanges) {
      // Crear una copia profunda del analysisData
      const updatedAnalysisData = JSON.parse(JSON.stringify(analysisData)) as AnalysisData;

      // Inicializar selectedChanges como true para todos los campos en exercisesToUpdate
      if (updatedAnalysisData?.exercisesToUpdate) {
        updatedAnalysisData.exercisesToUpdate = updatedAnalysisData.exercisesToUpdate.map((exercise) => {
          if (exercise.changes) {
            exercise.selectedChanges = Object.keys(exercise.changes).reduce(
              (acc, field) => {
                acc[field] = true;
                return acc;
              },
              {} as Record<string, boolean>
            );
          }
          return exercise;
        });
      }

      setLocalAnalysisData(updatedAnalysisData);
    } else {
      setLocalAnalysisData(analysisData);
    }
  }, [analysisData]);

  const renderFooter = () => {
    return (
      <div>
        <Button
          label={intl.formatMessage({ id: 'common.cancel' })}
          icon="pi pi-times"
          onClick={onHide}
          className="p-button-text"
        />
        <Button
          label={intl.formatMessage({ id: 'common.confirm' })}
          icon="pi pi-check"
          onClick={() => {
            // Actualizar el analysisData del padre con los datos locales antes de confirmar
            setAnalysisData(localAnalysisData);
            onConfirm();
          }}
          autoFocus
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData: ExerciseAnalysisItem) => {
    return (
      <span className={`status-badge ${rowData.status?.toLowerCase()}`}>
        {rowData.status === 'NEW' ? <i className="pi pi-plus-circle mr-2" /> : <i className="pi pi-sync mr-2" />}
        {intl.formatMessage({ id: `exercises.status.${rowData.status?.toLowerCase()}` })}
      </span>
    );
  };

  const formatChangeValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.map((item: any) => (typeof item === 'object' && item?.name ? item.name : item)).join(', ');
      }
      if (value?.name) {
        return value.name;
      }
      if (value?.id) {
        return `ID: ${value.id}`;
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  const changesBodyTemplate = (rowData: ExerciseAnalysisItem) => {
    if (!rowData.changes || Object.keys(rowData.changes).length === 0) return null;
    return (
      <div className="changes-cell">
        {Object.entries(rowData.changes).map(([field, value], index) => {
          const oldValue = formatChangeValue(value.old);
          const newValue = formatChangeValue(value.new);
          return (
            <div key={index} className="change-item">
              <Checkbox
                checked={rowData.selectedChanges?.[field] !== false}
                onChange={(e) => {
                  // Crear una copia profunda del estado local
                  const updatedAnalysisData = JSON.parse(JSON.stringify(localAnalysisData)) as AnalysisData;

                  if (!updatedAnalysisData) return;

                  // Encontrar el ejercicio en exercisesToUpdate
                  const exerciseIndex = updatedAnalysisData.exercisesToUpdate?.findIndex(
                    (exercise) => exercise.id === rowData.id
                  );

                  if (
                    exerciseIndex !== undefined &&
                    exerciseIndex !== -1 &&
                    updatedAnalysisData.exercisesToUpdate &&
                    updatedAnalysisData.exercisesToUpdate[exerciseIndex]
                  ) {
                    const exercise = updatedAnalysisData.exercisesToUpdate[exerciseIndex];
                    // Inicializar selectedChanges si no existe
                    if (!exercise.selectedChanges) {
                      exercise.selectedChanges = {};
                    }

                    // Actualizar el estado del checkbox
                    exercise.selectedChanges[field] = e.checked ?? false;

                    // Actualizar el estado local y el estado del padre
                    setLocalAnalysisData(updatedAnalysisData);
                    setAnalysisData(updatedAnalysisData);
                  }
                }}
              />
              <i className="pi pi-info-circle mr-2" />
              <span>
                {intl.formatMessage({ id: `exercises.field.${field}` })}: {oldValue} → {newValue}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const currentDataBodyTemplate = (rowData: ExerciseAnalysisItem) => {
    // Para exercisesToUpdate, obtener los datos actuales desde changes.old
    if (rowData.changes && Object.keys(rowData.changes).length > 0) {
      const changes = rowData.changes;
      return (
        <div className="data-cell">
          {'category' in changes && changes.category?.old && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.category' })}:</strong>{' '}
              {typeof changes.category.old === 'object' && changes.category.old?.name
                ? changes.category.old.name
                : changes.category.old || '-'}
            </div>
          )}
          {'variant' in changes && changes.variant?.old && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.variant' })}:</strong>{' '}
              {typeof changes.variant.old === 'object' && changes.variant.old?.name
                ? changes.variant.old.name
                : changes.variant.old || '-'}
            </div>
          )}
          {'contractionType' in changes && changes.contractionType?.old && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.contractionType' })}:</strong>{' '}
              {typeof changes.contractionType.old === 'object' && changes.contractionType.old?.name
                ? changes.contractionType.old.name
                : changes.contractionType.old || '-'}
            </div>
          )}
          {'difficultyLevel' in changes && changes.difficultyLevel?.old && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.difficultyLevel' })}:</strong>{' '}
              {typeof changes.difficultyLevel.old === 'object' && changes.difficultyLevel.old?.name
                ? changes.difficultyLevel.old.name
                : changes.difficultyLevel.old || '-'}
            </div>
          )}
          {'movementPlane' in changes && changes.movementPlane?.old && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.movementPlane' })}:</strong>{' '}
              {typeof changes.movementPlane.old === 'object' && changes.movementPlane.old?.name
                ? changes.movementPlane.old.name
                : changes.movementPlane.old || '-'}
            </div>
          )}
          {'unilateralType' in changes && changes.unilateralType?.old && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.unilateralType' })}:</strong>{' '}
              {typeof changes.unilateralType.old === 'object' && changes.unilateralType.old?.name
                ? changes.unilateralType.old.name
                : changes.unilateralType.old || '-'}
            </div>
          )}
          {'movementPattern' in changes && changes.movementPattern?.old && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.movementPattern' })}:</strong>{' '}
              {typeof changes.movementPattern.old === 'object' && changes.movementPattern.old?.name
                ? changes.movementPattern.old.name
                : changes.movementPattern.old || '-'}
            </div>
          )}
          {'equipments' in changes && changes.equipments?.old && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.equipment' })}:</strong>{' '}
              {Array.isArray(changes.equipments.old)
                ? changes.equipments.old.map((eq: any) => (typeof eq === 'object' ? eq.name : eq)).join(', ')
                : changes.equipments.old || '-'}
            </div>
          )}
          {'muscles' in changes && changes.muscles?.old && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.muscles' })}:</strong>{' '}
              {Array.isArray(changes.muscles.old)
                ? changes.muscles.old.map((m: any) => (typeof m === 'object' ? m.name : m)).join(', ')
                : changes.muscles.old || '-'}
            </div>
          )}
          {'multimedia' in changes && changes.multimedia?.old && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.multimedia' })}:</strong> {changes.multimedia.old}
            </div>
          )}
        </div>
      );
    }

    // Fallback para exercisesToCreate (legacy)
    if (rowData.currentData) {
      return (
        <div className="data-cell">
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.description' })}:</strong>{' '}
            {rowData.currentData.description || '-'}
          </div>
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.exerciseType' })}:</strong>{' '}
            {rowData.currentData.exerciseType || '-'}
          </div>
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.equipmentNeeded' })}:</strong>{' '}
            {rowData.currentData.equipmentNeeded || '-'}
          </div>
        </div>
      );
    }

    return <div className="data-cell">-</div>;
  };

  // Funciones helper para mapear IDs a nombres
  const getCategoryName = (id?: number): string => {
    if (!id) return '-';
    const category = categories.find((c) => c.id === id);
    return category?.name || `ID: ${id}`;
  };

  const getVariantName = (id?: number): string => {
    if (!id) return '-';
    const variant = variants.find((v) => v.id === id);
    return variant?.name || `ID: ${id}`;
  };

  const getContractionTypeName = (id?: number): string => {
    if (!id) return '-';
    const contraction = contractions.find((c) => c.id === id);
    return contraction?.name || `ID: ${id}`;
  };

  const getDifficultyLevelName = (id?: number): string => {
    if (!id) return '-';
    const difficulty = difficulties.find((d) => d.id === id);
    return difficulty?.name || `ID: ${id}`;
  };

  const getMovementPlaneName = (id?: number): string => {
    if (!id) return '-';
    const plane = movementPlanes.find((p) => p.id === id);
    return plane?.name || `ID: ${id}`;
  };

  const getUnilateralTypeName = (id?: number): string => {
    if (!id) return '-';
    const type = unilateralTypes.find((t) => t.id === id);
    return type?.name || `ID: ${id}`;
  };

  const getMovementPatternName = (id?: number): string => {
    if (!id) return '-';
    const pattern = movementPatterns.find((p) => p.id === id);
    return pattern?.name || `ID: ${id}`;
  };

  const getEquipmentNames = (ids?: number[]): string => {
    if (!ids || ids.length === 0) return '-';
    const names = ids
      .map((id) => {
        const equipment = equipments.find((e) => e.id === id);
        return equipment?.name || `ID: ${id}`;
      })
      .filter(Boolean);
    return names.join(', ') || '-';
  };

  const getMuscleNames = (ids?: number[]): string => {
    if (!ids || ids.length === 0) return '-';
    const names = ids
      .map((id) => {
        const muscle = muscles.find((m) => m.id === id);
        return muscle?.name || `ID: ${id}`;
      })
      .filter(Boolean);
    return names.join(', ') || '-';
  };

  const getExerciseName = (id?: number): string => {
    if (!id) return '-';
    const exercise = exercises.find((e) => e.id === id);
    return exercise?.name || `ID: ${id}`;
  };

  const newDataBodyTemplate = (rowData: ExerciseAnalysisItem) => {
    // Para exercisesToUpdate, obtener los datos nuevos desde updates o changes.new
    if (rowData.updates) {
      const updates = rowData.updates;
      return (
        <div className="data-cell">
          {updates.multimedia && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.multimedia' })}:</strong> {updates.multimedia}
            </div>
          )}
          {updates.categoryId && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.category' })}:</strong>{' '}
              {getCategoryName(updates.categoryId)}
            </div>
          )}
          {updates.variantId && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.variant' })}:</strong>{' '}
              {getVariantName(updates.variantId)}
            </div>
          )}
          {updates.contractionTypeId && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.contractionType' })}:</strong>{' '}
              {getContractionTypeName(updates.contractionTypeId)}
            </div>
          )}
          {updates.difficultyLevelId && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.difficultyLevel' })}:</strong>{' '}
              {getDifficultyLevelName(updates.difficultyLevelId)}
            </div>
          )}
          {updates.movementPlaneId && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.movementPlane' })}:</strong>{' '}
              {getMovementPlaneName(updates.movementPlaneId)}
            </div>
          )}
          {updates.unilateralTypeId && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.unilateralType' })}:</strong>{' '}
              {getUnilateralTypeName(updates.unilateralTypeId)}
            </div>
          )}
          {updates.movementPatternId && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.movementPattern' })}:</strong>{' '}
              {getMovementPatternName(updates.movementPatternId)}
            </div>
          )}
          {updates.regressionExerciseId && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.regressionExercise' })}:</strong>{' '}
              {getExerciseName(updates.regressionExerciseId)}
            </div>
          )}
          {updates.progressionExerciseId && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.progressionExercise' })}:</strong>{' '}
              {getExerciseName(updates.progressionExerciseId)}
            </div>
          )}
          {updates.equipmentIds && updates.equipmentIds.length > 0 && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.equipment' })}:</strong>{' '}
              {getEquipmentNames(updates.equipmentIds)}
            </div>
          )}
          {updates.muscleIds && updates.muscleIds.length > 0 && (
            <div>
              <strong>{intl.formatMessage({ id: 'exercises.field.muscles' })}:</strong>{' '}
              {getMuscleNames(updates.muscleIds)}
            </div>
          )}
        </div>
      );
    }

    // Para exercisesToCreate, los datos pueden venir directamente en rowData o en newData
    const dataSource = (rowData.newData || rowData) as ExerciseData | ExerciseToCreate | ExerciseAnalysisItem;

    // Si no hay datos, mostrar guión
    if (!dataSource || (typeof dataSource === 'object' && Object.keys(dataSource).length === 0)) {
      return <div className="data-cell">-</div>;
    }

    return (
      <div className="data-cell">
        {'multimedia' in dataSource && dataSource.multimedia && (
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.multimedia' })}:</strong> {dataSource.multimedia}
          </div>
        )}
        {'categoryId' in dataSource && dataSource.categoryId && (
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.category' })}:</strong>{' '}
            {getCategoryName(dataSource.categoryId)}
          </div>
        )}
        {'variantId' in dataSource && dataSource.variantId && (
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.variant' })}:</strong>{' '}
            {getVariantName(dataSource.variantId)}
          </div>
        )}
        {'contractionTypeId' in dataSource && dataSource.contractionTypeId && (
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.contractionType' })}:</strong>{' '}
            {getContractionTypeName(dataSource.contractionTypeId)}
          </div>
        )}
        {'difficultyLevelId' in dataSource && dataSource.difficultyLevelId && (
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.difficultyLevel' })}:</strong>{' '}
            {getDifficultyLevelName(dataSource.difficultyLevelId)}
          </div>
        )}
        {'movementPlaneId' in dataSource && dataSource.movementPlaneId && (
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.movementPlane' })}:</strong>{' '}
            {getMovementPlaneName(dataSource.movementPlaneId)}
          </div>
        )}
        {'unilateralTypeId' in dataSource && dataSource.unilateralTypeId && (
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.unilateralType' })}:</strong>{' '}
            {getUnilateralTypeName(dataSource.unilateralTypeId)}
          </div>
        )}
        {'movementPatternId' in dataSource && dataSource.movementPatternId && (
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.movementPattern' })}:</strong>{' '}
            {getMovementPatternName(dataSource.movementPatternId)}
          </div>
        )}
        {'regressionExerciseId' in dataSource && dataSource.regressionExerciseId && (
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.regressionExercise' })}:</strong>{' '}
            {getExerciseName(dataSource.regressionExerciseId)}
          </div>
        )}
        {'progressionExerciseId' in dataSource && dataSource.progressionExerciseId && (
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.progressionExercise' })}:</strong>{' '}
            {getExerciseName(dataSource.progressionExerciseId)}
          </div>
        )}
        {'equipmentIds' in dataSource && dataSource.equipmentIds && dataSource.equipmentIds.length > 0 && (
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.equipment' })}:</strong>{' '}
            {getEquipmentNames(dataSource.equipmentIds)}
          </div>
        )}
        {'muscleIds' in dataSource && dataSource.muscleIds && dataSource.muscleIds.length > 0 && (
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.muscles' })}:</strong>{' '}
            {getMuscleNames(dataSource.muscleIds)}
          </div>
        )}
        {/* Campos legacy para compatibilidad */}
        {'description' in dataSource && dataSource.description && (
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.description' })}:</strong> {dataSource.description}
          </div>
        )}
        {'exerciseType' in dataSource && dataSource.exerciseType && (
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.exerciseType' })}:</strong> {dataSource.exerciseType}
          </div>
        )}
        {'equipmentNeeded' in dataSource && dataSource.equipmentNeeded && (
          <div>
            <strong>{intl.formatMessage({ id: 'exercises.field.equipmentNeeded' })}:</strong>{' '}
            {dataSource.equipmentNeeded}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog
      visible={visible}
      style={{ width: '90vw' }}
      header={intl.formatMessage({ id: 'exercises.analysis.title' })}
      modal
      className="p-fluid"
      footer={renderFooter()}
      onHide={onHide}
    >
      <div className="analysis-summary mb-4">
        <h3>{intl.formatMessage({ id: 'exercises.analysis.summary' })}</h3>
        <p>
          {intl.formatMessage(
            { id: 'exercises.analysis.total' },
            {
              total: (analysisData?.exercisesToUpdate?.length || 0) + (analysisData?.exercisesToCreate?.length || 0),
              new: analysisData?.exercisesToCreate?.length || 0,
              existing: analysisData?.exercisesToUpdate?.length || 0
            }
          )}
        </p>
      </div>

      {isLoadingMetadata ? (
        <div className="flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
          <ProgressSpinner />
        </div>
      ) : (
        <DataTable
          value={[
            ...(analysisData?.exercisesToUpdate || []).map((ex) => ({ ...ex, status: 'EXISTING' as const })),
            ...(analysisData?.exercisesToCreate || []).map((ex) => ({ ...ex, status: 'NEW' as const }))
          ]}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="p-datatable-sm"
        >
          <Column
            field="name"
            header={intl.formatMessage({ id: 'exercises.name' })}
            sortable
            filter
            filterPlaceholder={intl.formatMessage({ id: 'common.search' })}
          />
          <Column
            field="status"
            header={intl.formatMessage({ id: 'exercises.status' })}
            body={statusBodyTemplate}
            sortable
          />
          <Column
            field="currentData"
            header={intl.formatMessage({ id: 'exercises.currentData' })}
            body={currentDataBodyTemplate}
          />
          <Column field="newData" header={intl.formatMessage({ id: 'exercises.newData' })} body={newDataBodyTemplate} />
          <Column field="changes" header={intl.formatMessage({ id: 'exercises.changes' })} body={changesBodyTemplate} />
        </DataTable>
      )}
    </Dialog>
  );
};

export default ExcelAnalysisDialog;

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { FormattedMessage, useIntl } from 'react-intl';
import { useToast } from '../contexts/ToastContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { isValidYouTubeUrl } from '../utils/UtilFunctions';
import { useSpinner } from '../utils/GlobalSpinner';
import { api } from '../services/api-client';
import { useExercisesStore } from '../stores/useExercisesStore';
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
import { IRpeMethod } from 'types/rpe/rpe-method-assigned';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { ExerciseDropdown } from '../components/shared/ExerciseDropdown';

interface CreateExerciseDialogProps {
  exercise: IExercise;
  exerciseDialogVisible: boolean;
  closeExerciseDialog: () => void;
  dialogMode: 'create' | 'edit';
  setExerciseDialogVisible: (visible: boolean) => void;
  setRefreshKey: (updater: (old: number) => number) => void;
  categories: ICategory[];
  contractions: IContractionType[];
  difficulties: IDifficultyLevel[];
  equipments: IEquipment[];
  movementPatterns: IMovementPattern[];
  movementPlanes: IMovementPlane[];
  muscles: IMuscle[];
  unilateralTypes: IUnilateralType[];
  variants: IVariant[];
  exercises: IExercise[];
  rpeMethods?: IRpeMethod[];
}

const truncateMessage = (message: string, maxLength = 50) => {
  if (message && message.length > maxLength) {
    return message.substring(0, maxLength) + '...';
  }
  return message;
};

export const CreateExerciseDialog: React.NamedExoticComponent<CreateExerciseDialogProps> = React.memo(
  ({
    exercise,
    exerciseDialogVisible,
    closeExerciseDialog,
    dialogMode,
    setExerciseDialogVisible,
    setRefreshKey,
    categories,
    contractions,
    difficulties,
    equipments,
    movementPatterns,
    movementPlanes,
    muscles,
    unilateralTypes,
    variants,
    exercises,
    rpeMethods = []
  }: CreateExerciseDialogProps) => {
    const intl = useIntl();
    const [newExercise, setNewExercise] = useState<IExercise>(exercise);
    const { isLoading } = useSpinner();
    const invalidateExercises = useExercisesStore((s) => s.invalidate);
    const { showToast } = useToast();
    const { showConfirmationDialog } = useConfirmationDialog();
    const handleSaveExercise = async () => {
      // Transformar los objetos seleccionados a IDs según el DTO
      const body = {
        name: newExercise.name,
        multimedia: newExercise.multimedia,
        categoryId: newExercise.category?.id ?? null,
        variantId: newExercise.variant?.id ?? null,
        contractionTypeId: newExercise.contractionType?.id ?? null,
        difficultyLevelId: newExercise.difficultyLevel?.id ?? null,
        movementPlaneId: newExercise.movementPlane?.id ?? null,
        unilateralTypeId: newExercise.unilateralType?.id ?? null,
        movementPatternId: newExercise.movementPattern?.id ?? null,
        regressionExerciseId: newExercise.regressionExercise?.id ?? null,
        progressionExerciseId: newExercise.progressionExercise?.id ?? null,
        rpeMethodId: newExercise.rpeMethod?.id ?? null,
        equipmentIds:
          newExercise.equipments && Array.isArray(newExercise.equipments) && newExercise.equipments.length > 0
            ? newExercise.equipments.map((eq: any) => {
                // Si es IExerciseEquipment, acceder a eq.equipment.id
                if (typeof eq === 'object' && eq.equipment && eq.equipment.id) {
                  return eq.equipment.id;
                }
                // Si es directamente IEquipment, acceder a eq.id
                if (typeof eq === 'object' && eq.id) {
                  return eq.id;
                }
                // Si es un número directamente
                return eq;
              })
            : null,
        muscleIds:
          newExercise.muscles && Array.isArray(newExercise.muscles) && newExercise.muscles.length > 0
            ? newExercise.muscles.map((muscle: any) => {
                // Si es IExerciseMuscle, acceder a muscle.muscle.id
                if (typeof muscle === 'object' && muscle.muscle && muscle.muscle.id) {
                  return muscle.muscle.id;
                }
                // Si es directamente IMuscle, acceder a muscle.id
                if (typeof muscle === 'object' && muscle.id) {
                  return muscle.id;
                }
                // Si es un número directamente
                return muscle;
              })
            : null,
        createdByCoach: newExercise.createdByCoach ?? true,
        createdByAdmin: newExercise.createdByAdmin ?? false
      };

      try {
        if (dialogMode === 'create') {
          const response = await api.exercise.createExercise(body);
          if (response.data?.message && response.data.message !== 'success') {
            throw new Error(response.data.message);
          } else {
            const successMessage = intl.formatMessage({ id: 'coach.exercise.success.created' });
            showToast('success', 'Success', truncateMessage(successMessage));
          }
        } else {
          const response = await api.exercise.updateExercise((newExercise as any).id, body);
          if (response.data?.message && response.data.message !== 'success') {
            throw new Error(response.data.message);
          } else {
            const successMessage = intl.formatMessage({ id: 'coach.exercise.success.updated' });
            showToast('success', 'Success', truncateMessage(successMessage));
          }
        }

        invalidateExercises();
        setExerciseDialogVisible(false);
        setRefreshKey((old) => old + 1);
      } catch (error: any) {
        showToast('error', 'Error', truncateMessage(error.message));
      }
    };

    return (
      <Dialog
        draggable={false}
        resizable={false}
        dismissableMask
        header={
          dialogMode === 'create'
            ? intl.formatMessage({ id: 'coach.exercise.create' })
            : intl.formatMessage({ id: 'coach.exercise.edit' })
        }
        visible={exerciseDialogVisible}
        style={{ width: '50vw' }}
        onHide={closeExerciseDialog}
      >
        {!isLoading && (
          <div className="p-fluid">
            <div className="p-field">
              <label htmlFor="name">
                <FormattedMessage id="coach.exercise.name" /> <span className="text-red-500">*</span>
              </label>
              <InputText
                id="name"
                value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: (e.target as HTMLInputElement).value })}
              />
            </div>

            <div className="p-field">
              <label htmlFor="multimedia">
                <FormattedMessage id="coach.exercise.video" /> <span className="text-red-500">*</span>
              </label>
              <InputText
                id="multimedia"
                value={newExercise.multimedia}
                onChange={(e) => setNewExercise({ ...newExercise, multimedia: (e.target as HTMLInputElement).value })}
              />
            </div>

            <div className="flex gap-2">
              <div className="p-field w-full min-w-0">
                <label htmlFor="category">{intl.formatMessage({ id: 'exercises.field.category' })}</label>
                <Dropdown
                  id="category"
                  value={newExercise.category?.id ?? null}
                  options={categories}
                  optionLabel="name"
                  optionValue="id"
                  className="w-full"
                  onChange={(e) => {
                    const selectedId = (e as any).value;
                    const selectedCategory = selectedId ? (categories.find((c) => c.id === selectedId) ?? null) : null;
                    setNewExercise({ ...newExercise, category: selectedCategory });
                  }}
                />
              </div>

              <div className="p-field w-full min-w-0">
                <label htmlFor="variant">{intl.formatMessage({ id: 'exercises.field.variant' })}</label>
                <Dropdown
                  id="variant"
                  value={newExercise.variant?.id ?? null}
                  options={variants}
                  optionLabel="name"
                  optionValue="id"
                  className="w-full"
                  onChange={(e) => {
                    const selectedId = (e as any).value;
                    const selectedVariant = selectedId ? (variants.find((v) => v.id === selectedId) ?? null) : null;
                    setNewExercise({ ...newExercise, variant: selectedVariant });
                  }}
                />
              </div>

              <div className="p-field w-full min-w-0">
                <label htmlFor="contractionType">{intl.formatMessage({ id: 'exercises.field.contractionType' })}</label>
                <Dropdown
                  id="contractionType"
                  value={newExercise.contractionType?.id ?? null}
                  options={contractions}
                  optionLabel="name"
                  optionValue="id"
                  className="w-full"
                  onChange={(e) => {
                    const selectedId = (e as any).value;
                    const selectedContraction = selectedId
                      ? (contractions.find((c) => c.id === selectedId) ?? null)
                      : null;
                    setNewExercise({ ...newExercise, contractionType: selectedContraction });
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="p-field w-full min-w-0">
                <label htmlFor="movementPlane">{intl.formatMessage({ id: 'exercises.field.movementPlane' })}</label>
                <Dropdown
                  id="movementPlane"
                  value={newExercise.movementPlane?.id ?? null}
                  options={movementPlanes}
                  optionLabel="name"
                  optionValue="id"
                  className="w-full"
                  onChange={(e) => {
                    const selectedId = (e as any).value;
                    const selectedPlane = selectedId ? (movementPlanes.find((p) => p.id === selectedId) ?? null) : null;
                    setNewExercise({ ...newExercise, movementPlane: selectedPlane });
                  }}
                />
              </div>

              <div className="p-field w-full min-w-0">
                <label htmlFor="movementPattern">{intl.formatMessage({ id: 'exercises.field.movementPattern' })}</label>
                <Dropdown
                  id="movementPattern"
                  value={newExercise.movementPattern?.id ?? null}
                  options={movementPatterns}
                  optionLabel="name"
                  optionValue="id"
                  className="w-full"
                  onChange={(e) => {
                    const selectedId = (e as any).value;
                    const selectedPattern = selectedId
                      ? (movementPatterns.find((p) => p.id === selectedId) ?? null)
                      : null;
                    setNewExercise({ ...newExercise, movementPattern: selectedPattern });
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="p-field w-full min-w-0">
                <label htmlFor="unilateralType">{intl.formatMessage({ id: 'exercises.field.unilateralType' })}</label>
                <Dropdown
                  id="unilateralType"
                  value={newExercise.unilateralType?.id ?? null}
                  options={unilateralTypes}
                  optionLabel="name"
                  optionValue="id"
                  className="w-full"
                  onChange={(e) => {
                    const selectedId = (e as any).value;
                    const selectedType = selectedId ? (unilateralTypes.find((t) => t.id === selectedId) ?? null) : null;
                    setNewExercise({ ...newExercise, unilateralType: selectedType });
                  }}
                />
              </div>

              <div className="p-field w-full min-w-0">
                <label htmlFor="difficultyLevel">{intl.formatMessage({ id: 'exercises.field.difficultyLevel' })}</label>
                <Dropdown
                  id="difficultyLevel"
                  value={newExercise.difficultyLevel?.id ?? null}
                  options={difficulties}
                  optionLabel="name"
                  optionValue="id"
                  className="w-full"
                  onChange={(e) => {
                    const selectedId = (e as any).value;
                    const selectedDifficulty = selectedId
                      ? (difficulties.find((d) => d.id === selectedId) ?? null)
                      : null;
                    setNewExercise({ ...newExercise, difficultyLevel: selectedDifficulty });
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="p-field w-full min-w-0">
                <label htmlFor="regressionExercise">
                  {intl.formatMessage({ id: 'exercises.field.regressionExercise' })}
                </label>
                <ExerciseDropdown
                  exercises={exercises.map((ex) => ({ id: ex.id, name: ex.name }))}
                  value={newExercise.regressionExercise?.id ?? null}
                  onChange={(selectedId) => {
                    const selectedExercise = selectedId ? (exercises.find((ex) => ex.id === selectedId) ?? null) : null;
                    setNewExercise({ ...newExercise, regressionExercise: selectedExercise });
                  }}
                  placeholder={intl.formatMessage({ id: 'exercises.field.regressionExercise' })}
                />
              </div>

              <div className="p-field w-full min-w-0">
                <label htmlFor="progressionExercise">
                  {intl.formatMessage({ id: 'exercises.field.progressionExercise' })}
                </label>
                <ExerciseDropdown
                  exercises={exercises.map((ex) => ({ id: ex.id, name: ex.name }))}
                  value={newExercise.progressionExercise?.id ?? null}
                  onChange={(selectedId) => {
                    const selectedExercise = selectedId ? (exercises.find((ex) => ex.id === selectedId) ?? null) : null;
                    setNewExercise({ ...newExercise, progressionExercise: selectedExercise });
                  }}
                  placeholder={intl.formatMessage({ id: 'exercises.field.progressionExercise' })}
                />
              </div>
            </div>

            <div className="p-field">
              <label htmlFor="equipments">{intl.formatMessage({ id: 'exercises.field.equipment' })}</label>
              <MultiSelect
                id="equipments"
                value={
                  newExercise.equipments && Array.isArray(newExercise.equipments)
                    ? newExercise.equipments.map((eq: any) => {
                        // Si es IExerciseEquipment, acceder a eq.equipment.id
                        if (typeof eq === 'object' && eq.equipment && eq.equipment.id) {
                          return eq.equipment.id;
                        }
                        // Si es directamente IEquipment, acceder a eq.id
                        if (typeof eq === 'object' && eq.id) {
                          return eq.id;
                        }
                        // Si es un número directamente
                        return eq;
                      })
                    : []
                }
                options={equipments}
                optionLabel="name"
                optionValue="id"
                onChange={(e) => {
                  const selectedIds = (e as any).value as number[];
                  const selectedEquipments = selectedIds ? equipments.filter((eq) => selectedIds.includes(eq.id)) : [];
                  setNewExercise({ ...newExercise, equipments: selectedEquipments as any });
                }}
              />
            </div>

            <div className="p-field">
              <label htmlFor="muscles">{intl.formatMessage({ id: 'exercises.field.muscles' })}</label>
              <MultiSelect
                id="muscles"
                value={
                  newExercise.muscles && Array.isArray(newExercise.muscles)
                    ? newExercise.muscles.map((muscle: any) => {
                        // Si es IExerciseMuscle, acceder a muscle.muscle.id
                        if (typeof muscle === 'object' && muscle.muscle && muscle.muscle.id) {
                          return muscle.muscle.id;
                        }
                        // Si es directamente IMuscle, acceder a muscle.id
                        if (typeof muscle === 'object' && muscle.id) {
                          return muscle.id;
                        }
                        // Si es un número directamente
                        return muscle;
                      })
                    : []
                }
                options={muscles}
                optionLabel="name"
                optionValue="id"
                onChange={(e) => {
                  const selectedIds = (e as any).value as number[];
                  const selectedMuscles = selectedIds ? muscles.filter((m) => selectedIds.includes(m.id)) : [];
                  setNewExercise({ ...newExercise, muscles: selectedMuscles as any });
                }}
              />
            </div>

            {rpeMethods.length > 0 && (
              <div className="p-field">
                <label htmlFor="rpeMethod">{intl.formatMessage({ id: 'exercises.field.rpeMethod' })}</label>
                <Dropdown
                  id="rpeMethod"
                  value={newExercise.rpeMethod?.id ?? null}
                  options={rpeMethods}
                  optionLabel="name"
                  optionValue="id"
                  showClear
                  className="w-full"
                  placeholder={intl.formatMessage({ id: 'exercises.field.rpeMethod' })}
                  onChange={(e) => {
                    const selectedId = (e as any).value;
                    const selectedRpe = selectedId ? (rpeMethods.find((r) => r.id === selectedId) ?? null) : null;
                    setNewExercise({ ...newExercise, rpeMethod: selectedRpe });
                  }}
                />
              </div>
            )}

            <div className="mt-2">
              <Button
                label={
                  dialogMode === 'create'
                    ? intl.formatMessage({ id: 'coach.exercise.create' })
                    : intl.formatMessage({ id: 'coach.exercise.edit' })
                }
                icon="pi pi-check"
                onClick={() => {
                  if (newExercise.name === '')
                    return showToast(
                      'error',
                      'Error',
                      truncateMessage(
                        intl.formatMessage({
                          id: 'coach.exercise.error.name.empty'
                        })
                      )
                    );

                  if (!isValidYouTubeUrl(newExercise.multimedia)) {
                    return showToast(
                      'error',
                      'Error',
                      truncateMessage(
                        intl.formatMessage({
                          id: 'coach.exercise.error.video.invalid'
                        })
                      )
                    );
                  }
                  showConfirmationDialog({
                    message:
                      dialogMode === 'create'
                        ? intl.formatMessage({ id: 'createExercise.confirmation.message' })
                        : intl.formatMessage({ id: 'updateExercise.confirmation.message' }),
                    header: intl.formatMessage({ id: 'common.confirmation' }),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => handleSaveExercise(),
                    reject: () => console.log('Rejected')
                  });
                }}
              />
            </div>
          </div>
        )}
      </Dialog>
    );
  }
);

CreateExerciseDialog.displayName = 'CreateExerciseDialog';

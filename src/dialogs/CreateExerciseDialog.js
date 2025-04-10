import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { useIntl } from 'react-intl';
import { createExercise, updateExercise } from '../services/exercisesService';
import { useToast } from '../utils/ToastContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { isValidYouTubeUrl } from '../utils/UtilFunctions';
import { fetchBodyAreas } from '../services/exercisesService';
import { useSpinner } from '../utils/GlobalSpinner';

export const CreateExerciseDialog = React.memo(
  ({
    exercise,
    exerciseDialogVisible,
    closeExerciseDialog,
    dialogMode,
    setExerciseDialogVisible,
    setRefreshKey,
    user
  }) => {
    const intl = useIntl();
    const [newExercise, setNewExercise] = useState(exercise);
    const { isLoading, setLoading } = useSpinner();
    const showToast = useToast();
    const { showConfirmationDialog } = useConfirmationDialog();

    const [selectedBodyAreas, setSelectedBodyAreas] = useState([]);
    const [bodyAreas, setBodyAreas] = useState([]);

    useEffect(() => {
      const fetchBodyAreasData = async () => {
        try {
          setLoading(true);
          const { data } = await fetchBodyAreas();
          if (data.error) {
            throw new Error(data.message || 'Something went wrong');
          }
          const formattedBodyAreas = data.map((bodyArea) => ({
            label: bodyArea.name,
            value: bodyArea.id
          }));
          setBodyAreas(formattedBodyAreas);
        } catch (error) {
          console.log('error', error);
          showToast('error', 'Error', error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchBodyAreasData();
    }, []);

    useEffect(() => {
      if (bodyAreas.length > 0 && dialogMode === 'edit') {
        const arrayBodyAreas = newExercise.exerciseBodyAreas.map((exerciseBodyArea) => exerciseBodyArea.bodyArea.id);
        setSelectedBodyAreas(arrayBodyAreas);
      }
    }, [bodyAreas]);

    const handleSaveExercise = async () => {
      const body = {
        ...newExercise,
        bodyArea: selectedBodyAreas,
        coachId: user.userId
      };

      try {
        if (dialogMode === 'create') {
          const { message } = await createExercise(body);
          if (message !== 'success') {
            throw new Error(message);
          } else {
            showToast('success', 'Success', intl.formatMessage({ id: 'coach.exercise.success.created' }));
          }
        } else {
          const { message } = await updateExercise(newExercise.id, body);
          if (message !== 'success') {
            throw new Error(message);
          } else {
            showToast('success', 'Success', intl.formatMessage({ id: 'coach.exercise.success.updated' }));
          }
        }

        setExerciseDialogVisible(false);
        setRefreshKey((old) => old + 1);
      } catch (error) {
        console.log('error', error);
        showToast('error', 'Error', error.message);
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
        className="responsive-dialog"
        visible={exerciseDialogVisible}
        style={{ width: '50vw' }}
        onHide={closeExerciseDialog}
      >
        {!isLoading && (
          <div className="p-fluid">
            <div className="p-field">
              <label htmlFor="name">
                {dialogMode === 'create'
                  ? intl.formatMessage({ id: 'coach.exercise.name' })
                  : intl.formatMessage({ id: 'coach.exercise.name' })}
              </label>
              <InputText
                id="name"
                value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
              />
            </div>
            <div className="p-field">
              <label htmlFor="description">{intl.formatMessage({ id: 'coach.exercise.description' })}</label>
              <InputTextarea
                id="description"
                className="overflow-hidden text-overflow-ellipsis"
                value={newExercise.description}
                onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="p-field">
              <label htmlFor="multimedia">{intl.formatMessage({ id: 'coach.exercise.video' })}</label>
              <InputText
                id="multimedia"
                value={newExercise.multimedia}
                onChange={(e) => setNewExercise({ ...newExercise, multimedia: e.target.value })}
              />
            </div>
            <div className="p-field">
              <label htmlFor="exerciseType">{intl.formatMessage({ id: 'coach.exercise.type' })}</label>
              <InputText
                id="exerciseType"
                value={newExercise.exerciseType}
                onChange={(e) => setNewExercise({ ...newExercise, exerciseType: e.target.value })}
              />
            </div>
            <div className="p-field">
              <label htmlFor="equipmentNeeded">{intl.formatMessage({ id: 'coach.exercise.equipment' })}</label>
              <InputText
                id="equipmentNeeded"
                value={newExercise.equipmentNeeded}
                onChange={(e) =>
                  setNewExercise({
                    ...newExercise,
                    equipmentNeeded: e.target.value
                  })
                }
              />
            </div>
            <div className="p-field">
              <label htmlFor="equipmentNeeded">{intl.formatMessage({ id: 'coach.exercise.bodyArea' })}</label>
              <MultiSelect
                options={bodyAreas}
                filter
                showClear
                required
                placeholder="Select a body area"
                value={selectedBodyAreas}
                onChange={(e) => setSelectedBodyAreas(e.value)}
              />
            </div>
            <div className="p-field">
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
                      intl.formatMessage({
                        id: 'coach.exercise.error.name.empty'
                      })
                    );
                  if (!isValidYouTubeUrl(newExercise.multimedia)) {
                    return showToast(
                      'error',
                      'Error',
                      intl.formatMessage({
                        id: 'coach.exercise.error.video.invalid'
                      })
                    );
                  }
                  showConfirmationDialog({
                    message:
                      dialogMode === 'create'
                        ? intl.formatMessage({
                            id: 'createExercise.confirmation.message'
                          })
                        : intl.formatMessage({
                            id: 'updateExercise.confirmation.message'
                          }),
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

// Añadir displayName para facilitar la depuración
CreateExerciseDialog.displayName = 'CreateExerciseDialog';

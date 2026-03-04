import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { RadioButton } from 'primereact/radiobutton';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { ProgressSpinner } from 'primereact/progressspinner';
import { FormattedMessage } from 'react-intl';

import FinishTrainingDialog from '../components/dialogs/FinishTrainingDialog';
import VideoDialog from '../components/dialogs/VideoDialog';
import RpeDropdownComponent from '../components/RpeDropdown';
import { getYouTubeThumbnail } from '../utils/UtilFunctions';

import {
  useTrainingPlanDetails,
  ITrainingPlanDetailsProps,
  IExerciseProgressEntry
} from '../hooks/useTrainingPlanDetails';
import { IExerciseGroup } from 'types/workout/exercise-group';
import { IExerciseInstance } from 'types/workout/exercise-instance';

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function RenderExerciseGroup({
  group,
  exerciseProgress,
  isGroupCompleted,
  isExerciseCompleted,
  handleToggleAll,
  handleVideoClick,
  handleSetCompletedChange,
  handleExerciseChange,
  propertyUnits,
  client,
  clientId,
  currentCycle,
  intl
}: {
  group: IExerciseGroup;
  exerciseProgress: ReturnType<typeof useTrainingPlanDetails>['exerciseProgress'];
  isGroupCompleted: ReturnType<typeof useTrainingPlanDetails>['isGroupCompleted'];
  isExerciseCompleted: ReturnType<typeof useTrainingPlanDetails>['isExerciseCompleted'];
  handleToggleAll: ReturnType<typeof useTrainingPlanDetails>['handleToggleAll'];
  handleVideoClick: ReturnType<typeof useTrainingPlanDetails>['handleVideoClick'];
  handleSetCompletedChange: ReturnType<typeof useTrainingPlanDetails>['handleSetCompletedChange'];
  handleExerciseChange: ReturnType<typeof useTrainingPlanDetails>['handleExerciseChange'];
  propertyUnits: ReturnType<typeof useTrainingPlanDetails>['propertyUnits'];
  client: ReturnType<typeof useTrainingPlanDetails>['client'];
  clientId: ReturnType<typeof useTrainingPlanDetails>['clientId'];
  currentCycle: ReturnType<typeof useTrainingPlanDetails>['currentCycle'];
  intl: ReturnType<typeof useTrainingPlanDetails>['intl'];
}): JSX.Element {
  const isCompleted = isGroupCompleted(group);

  return (
    <div key={group.id} className={`exercise-group ${isCompleted ? 'completed' : ''}`}>
      <div className="exercise-group-header mb-3 sm:mb-4">
        <div className="exercise-group-title flex align-items-center justify-content-between border-round w-full">
          <h3 className="text-lg sm:text-xl font-bold text-primary m-0">
            <FormattedMessage id="training.group" values={{ number: group.groupNumber }} />
          </h3>
          <div className="exercise-group-progress bg-primary text-white px-2 py-1 border-round text-sm font-medium">
            {group.exercises.filter((ex: IExerciseInstance) => exerciseProgress[ex.id]?.completed).length}/
            {group.exercises.length}
          </div>
        </div>
      </div>

      <div className="exercise-group-content">
        <div className="exercise-list flex flex-column gap-3 sm:gap-4">
          {group.exercises.map((exercise: IExerciseInstance) => {
            const progress: IExerciseProgressEntry = exerciseProgress[exercise.id] || {
              sets: [],
              completed: null,
              comments: ''
            };
            const exerciseCompleted = isExerciseCompleted(exercise);

            return (
              <Card key={exercise.id} className={`exercise-card ${exerciseCompleted ? 'completed' : ''} shadow-3`}>
                <div className="exercise-card-header mb-1 w-full">
                  <div className="flex flex-column sm:flex-row align-items-start sm:align-items-center justify-content-between gap-2 sm:gap-3">
                    <div className="exercise-card-header-left flex-grow-1 w-full sm:w-auto">
                      <h3 className="exercise-name text-lg sm:text-xl font-medium text-900 m-0 line-height-2">
                        {exercise.exercise.name}
                      </h3>
                    </div>

                    <div className="exercise-card-header-right flex align-items-center justify-content-between sm:justify-content-end gap-2 w-full sm:w-auto">
                      <div className="exercise-group-info-right">
                        <div
                          className="exercise-group-thumbnail cursor-pointer border-round overflow-hidden shadow-2 w-4rem h-3rem sm:w-6rem sm:h-4rem"
                          onClick={() => {
                            handleVideoClick(exercise.exercise.multimedia);
                          }}
                        >
                          <img
                            className="exercise-group-thumbnail w-full h-full object-cover"
                            src={getYouTubeThumbnail(exercise.exercise.multimedia)}
                            alt="Video thumbnail"
                          />
                        </div>
                      </div>
                      <div className="flex flex-row gap-1">
                        <Button
                          icon="pi pi-check"
                          size="small"
                          className="p-button-success p-button-rounded p-button-outlined"
                          onClick={() => handleToggleAll(true, exercise.id)}
                          tooltip={intl.formatMessage(
                            { id: 'training.markAllCompleted' },
                            { default: 'Mark All Completed' }
                          )}
                          tooltipOptions={{ position: 'top' }}
                          style={{ width: '1.75rem', height: '1.75rem', padding: '0.25rem' }}
                        />
                        <Button
                          icon="pi pi-times"
                          size="small"
                          className="p-button-danger p-button-rounded p-button-outlined"
                          onClick={() => handleToggleAll(false, exercise.id)}
                          tooltip={intl.formatMessage(
                            { id: 'training.markAllSkipped' },
                            { default: 'Mark All Skipped' }
                          )}
                          tooltipOptions={{ position: 'top' }}
                          style={{ width: '1.75rem', height: '1.75rem', padding: '0.25rem' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="exercise-inputs">
                  <div className="exercise-sets">
                    <div className="sets-container flex flex-column gap-2">
                      {Array.from({ length: parseInt(exercise.sets as string) || group.set || 1 }).map((_, index) => {
                        const setData = progress.sets?.[index] || {};

                        return (
                          <div key={index} className="set-card surface-cardp-1 border-round">
                            <div className="flex align-items-center justify-content-between mb-1 p-1">
                              <div className="flex align-items-center gap-2">
                                <span className="font-medium text-900">Set {index + 1}</span>
                              </div>
                              <div className="flex align-items-center gap-2">
                                <div className="flex align-items-center gap-1">
                                  <RadioButton
                                    inputId={`completed-yes-${exercise.id}-${index + 1}`}
                                    name={`completed-${exercise.id}-${index + 1}`}
                                    value={true}
                                    onChange={(e) => handleSetCompletedChange(exercise.id, index, e.value)}
                                    checked={setData.completed === true}
                                  />
                                  <label
                                    htmlFor={`completed-yes-${exercise.id}-${index + 1}`}
                                    className="text-sm text-green-600 font-medium"
                                  >
                                    &#10003;
                                  </label>
                                </div>
                                <div className="flex align-items-center gap-1">
                                  <RadioButton
                                    inputId={`completed-no-${exercise.id}-${index + 1}`}
                                    name={`completed-${exercise.id}-${index + 1}`}
                                    value={false}
                                    onChange={(e) => handleSetCompletedChange(exercise.id, index, e.value)}
                                    checked={setData.completed === false}
                                  />
                                  <label
                                    htmlFor={`completed-no-${exercise.id}-${index + 1}`}
                                    className="text-sm text-red-600 font-medium"
                                  >
                                    &#10007;
                                  </label>
                                </div>
                              </div>
                            </div>

                            <div className="grid">
                              {exercise.repetitions && (
                                <div className="col-6 sm:col-6 md:col-4">
                                  <label className="block text-xs font-medium text-700 mb-1">
                                    {intl.formatMessage({ id: 'training.exercise.reps' })}
                                  </label>
                                  <div className="p-inputgroup">
                                    <InputText
                                      value={setData.repetitions || ''}
                                      onChange={(e) =>
                                        handleExerciseChange(exercise.id, index, 'repetitions', e.target.value)
                                      }
                                      className="p-inputtext-sm text-center"
                                      placeholder="0"
                                    />
                                    <span className="p-inputgroup-addon text-xs">
                                      {propertyUnits.repetitions || ''}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {exercise.weight && (
                                <div className="col-6 sm:col-6 md:col-4">
                                  <label className="block text-xs font-medium text-700 mb-1">
                                    {intl.formatMessage({ id: 'training.exercise.weight' })}
                                  </label>
                                  <div className="p-inputgroup">
                                    <InputText
                                      value={setData.weight || ''}
                                      onChange={(e) =>
                                        handleExerciseChange(exercise.id, index, 'weight', e.target.value)
                                      }
                                      className="p-inputtext-sm text-center"
                                      placeholder="0"
                                    />
                                    <span className="p-inputgroup-addon text-xs">{propertyUnits?.weight || 'kg'}</span>
                                  </div>
                                </div>
                              )}

                              {exercise.time && (
                                <div className="col-6 sm:col-6 md:col-4">
                                  <label className="block text-xs font-medium text-700 mb-1">
                                    {intl.formatMessage({ id: 'training.exercise.time' })}
                                  </label>
                                  <div className="p-inputgroup">
                                    <InputText
                                      value={setData.time || ''}
                                      onChange={(e) => handleExerciseChange(exercise.id, index, 'time', e.target.value)}
                                      className="p-inputtext-sm text-center"
                                      placeholder="0"
                                    />
                                    <span className="p-inputgroup-addon text-xs">{propertyUnits?.time || 's'}</span>
                                  </div>
                                </div>
                              )}

                              {exercise.distance && (
                                <div className="col-6 sm:col-6 md:col-4">
                                  <label className="block text-xs font-medium text-700 mb-1">
                                    {intl.formatMessage({ id: 'training.exercise.distance' })}
                                  </label>
                                  <div className="p-inputgroup">
                                    <InputText
                                      value={setData.distance || ''}
                                      onChange={(e) =>
                                        handleExerciseChange(exercise.id, index, 'distance', e.target.value)
                                      }
                                      className="p-inputtext-sm text-center"
                                      placeholder="0"
                                    />
                                    <span className="p-inputgroup-addon text-xs">
                                      {propertyUnits?.distance || 'km'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {exercise.duration && (
                                <div className="col-6 sm:col-6 md:col-4">
                                  <label className="block text-xs font-medium text-700 mb-1">
                                    {intl.formatMessage({ id: 'training.exercise.duration' })}
                                  </label>
                                  <div className="p-inputgroup">
                                    <InputText
                                      value={setData.duration || ''}
                                      onChange={(e) =>
                                        handleExerciseChange(exercise.id, index, 'duration', e.target.value)
                                      }
                                      className="p-inputtext-sm text-center"
                                      placeholder="0"
                                    />
                                    <span className="p-inputgroup-addon text-xs">{propertyUnits?.duration || 's'}</span>
                                  </div>
                                </div>
                              )}

                              {exercise.difficulty && (
                                <div className="col-6 sm:col-6 md:col-4">
                                  <label className="block text-xs font-medium text-700 mb-1">
                                    {intl.formatMessage({ id: 'training.exercise.difficulty' })}
                                  </label>
                                  <div className="p-inputgroup">
                                    <InputText
                                      value={setData.difficulty || ''}
                                      onChange={(e) =>
                                        handleExerciseChange(exercise.id, index, 'difficulty', e.target.value)
                                      }
                                      className="p-inputtext-sm text-center"
                                      placeholder="0"
                                    />
                                    <span className="p-inputgroup-addon text-xs">
                                      {propertyUnits?.difficulty || ''}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {exercise.tempo && (
                                <div className="col-6 sm:col-6 md:col-4">
                                  <label className="block text-xs font-medium text-700 mb-1">
                                    {intl.formatMessage({ id: 'training.exercise.tempo' })}
                                  </label>
                                  <div className="p-inputgroup">
                                    <InputText
                                      value={setData.tempo || ''}
                                      onChange={(e) =>
                                        handleExerciseChange(exercise.id, index, 'tempo', e.target.value)
                                      }
                                      className="p-inputtext-sm text-center"
                                      placeholder="0"
                                    />
                                    <span className="p-inputgroup-addon text-xs">{propertyUnits?.tempo || 's'}</span>
                                  </div>
                                </div>
                              )}

                              {(client || clientId) && currentCycle && (
                                <div className="col-12 sm:col-6 md:col-4">
                                  <RpeDropdownComponent
                                    selectedRpe={setData.rating ?? 0}
                                    onChange={(e) => handleExerciseChange(exercise.id, index, 'rating', e.value)}
                                    cycleId={
                                      currentCycle !== -1
                                        ? (currentCycle as { id: number }).id
                                        : (currentCycle as number)
                                    }
                                    clientId={client ? client.id : clientId}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid">
                    <div className="col-12 sm:col-6">
                      <label htmlFor={`notes-${exercise.id}`} className="block text-sm font-medium text-900 mb-2">
                        <FormattedMessage id="training.notes" defaultMessage="Notes" />
                      </label>
                      <InputTextarea
                        id={`notes-${exercise.id}`}
                        rows={2}
                        value={exercise.notes || ''}
                        disabled
                        className="w-full text-sm"
                        style={{ resize: 'none' }}
                      />
                    </div>
                    <div className="col-12 sm:col-6">
                      <label htmlFor={`comments-${exercise.id}`} className="block text-sm font-medium text-900 mb-2">
                        <FormattedMessage id="training.comments" defaultMessage="Comments" />
                      </label>
                      <InputTextarea
                        id={`comments-${exercise.id}`}
                        rows={2}
                        value={progress.comments || ''}
                        onChange={(e) => handleExerciseChange(exercise.id, null, 'comments', e.target.value)}
                        className="w-full text-sm"
                        placeholder={intl.formatMessage({
                          id: 'training.comments.placeholder',
                          defaultMessage: 'Add your comments here...'
                        })}
                        style={{ resize: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function TrainingPlanDetails({ setPlanDetailsVisible, setRefreshKey }: ITrainingPlanDetailsProps) {
  const hook = useTrainingPlanDetails({ setPlanDetailsVisible, setRefreshKey });

  const {
    plan,
    exerciseProgress,
    videoDialogVisible,
    currentVideoUrl,
    finishDialogVisible,
    currentCycle,
    currentGroupIndex,
    sessionTimer,
    isTimerPaused,
    propertyUnits,
    loading,
    clientId,
    client,
    setVideoDialogVisible,
    setFinishDialogVisible,
    handleSaveProgress,
    handleClearProgress,
    handleSubmitFeedback,
    handleToggleTimer,
    handleToggleAll,
    handleVideoClick,
    handleSetCompletedChange,
    handleExerciseChange,
    navigateToNextGroup,
    navigateToPreviousGroup,
    navigateToGroup,
    canNavigateToNextGroup,
    getStatusIcon,
    isExerciseCompleted,
    isGroupCompleted,
    formatSessionTime,
    intl
  } = hook;

  if (loading || !plan) {
    return (
      <div className="loading-container flex flex-column align-items-center justify-content-center min-h-screen p-4">
        <ProgressSpinner className="loading-spinner mb-3" />
        <span className="text-center text-lg sm:text-xl text-700">
          <FormattedMessage id="training.loading" />
        </span>
      </div>
    );
  }

  return (
    <div className="training-plan-details px-2 sm:px-4 py-2 sm:py-4">
      <div className="training-plan-header mb-3 sm:mb-4">
        <div className="training-plan-header-content text-center sm:text-left">
          <h1 className="training-plan-title text-2xl sm:text-3xl font-bold mb-2">
            <FormattedMessage id="training.title" />
          </h1>
          <h2 className="training-plan-name text-lg sm:text-xl mb-2 text-700">
            {plan.instanceName ? plan.instanceName : plan.workout.planName}
          </h2>
          {!plan.isTemplate && (
            <div className="training-plan-status flex align-items-center justify-content-center sm:justify-content-start gap-2">
              <i className={getStatusIcon(plan.status)} />
              <span className="text-sm sm:text-base">
                <FormattedMessage id="training.status" />: {plan.status}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="exercise-groups-container">
        <div className="exercise-groups-navigation flex align-items-center gap-2 sm:gap-4">
          <Button
            icon="pi pi-chevron-left"
            className={`p-button-rounded p-button-text navigation-button flex-shrink-0 ${currentGroupIndex === 0 ? 'p-disabled' : ''}`}
            onClick={navigateToPreviousGroup}
            disabled={currentGroupIndex === 0}
            aria-label="Previous group"
            size="small"
          />

          <div className="exercise-groups-content flex-grow-1">
            <RenderExerciseGroup
              group={plan.groups[currentGroupIndex]!}
              exerciseProgress={exerciseProgress}
              isGroupCompleted={isGroupCompleted}
              isExerciseCompleted={isExerciseCompleted}
              handleToggleAll={handleToggleAll}
              handleVideoClick={handleVideoClick}
              handleSetCompletedChange={handleSetCompletedChange}
              handleExerciseChange={handleExerciseChange}
              propertyUnits={propertyUnits}
              client={client}
              clientId={clientId}
              currentCycle={currentCycle}
              intl={intl}
            />
          </div>

          <Button
            icon="pi pi-chevron-right"
            className={`p-button-rounded p-button-text navigation-button flex-shrink-0 ${!canNavigateToNextGroup() ? 'p-disabled' : ''}`}
            onClick={navigateToNextGroup}
            disabled={!canNavigateToNextGroup()}
            aria-label="Next group"
            size="small"
          />
        </div>

        <div className="exercise-groups-indicator flex justify-content-center gap-2 mt-3 sm:mt-4">
          {plan.groups.map((_: IExerciseGroup, index: number) => (
            <div
              key={index}
              className={`group-indicator w-3rem h-1rem sm:w-4rem sm:h-1rem border-round cursor-pointer ${index === currentGroupIndex ? 'active bg-primary' : 'bg-300'} ${isGroupCompleted(plan.groups[index]!) ? 'completed bg-green-500' : ''}`}
              onClick={() => navigateToGroup(index)}
            />
          ))}
        </div>
      </div>

      <div className="training-action-buttons flex justify-content-center gap-2 mt-2 px-2 sm:px-0">
        <div className="flex justify-content-center align-items-center">
          <div className="session-timer bg-primary text-white px-3 py-2 border-round-lg shadow-3">
            <div className="flex align-items-center gap-2">
              <i className="pi pi-clock text-lg"></i>
              <span className="font-bold text-lg">{formatSessionTime(sessionTimer)}</span>
              <Button
                icon={isTimerPaused ? 'pi pi-play' : 'pi pi-pause'}
                className="p-button-text p-button-sm text-white"
                onClick={handleToggleTimer}
                tooltip={isTimerPaused ? 'Reanudar cronometro' : 'Pausar cronometro'}
                tooltipOptions={{ position: 'top' }}
                style={{
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  width: '2rem',
                  height: '2rem'
                }}
              />
            </div>
          </div>
        </div>
        <Button
          icon="pi pi-save"
          className="p-button-primary p-button-rounded"
          onClick={handleSaveProgress}
          tooltip={intl.formatMessage({ id: 'training.buttons.saveProgress' })}
          tooltipOptions={{ position: 'top' }}
          style={{ width: '2.5rem', height: '2.5rem' }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-danger p-button-outlined p-button-rounded"
          onClick={handleClearProgress}
          tooltip="Limpiar Progreso"
          tooltipOptions={{ position: 'top' }}
          style={{ width: '2.5rem', height: '2.5rem' }}
        />
        <Button
          icon="pi pi-check"
          className="p-button-success p-button-rounded"
          onClick={() => setFinishDialogVisible(true)}
          tooltip={intl.formatMessage({ id: 'training.buttons.finishTraining' })}
          tooltipOptions={{ position: 'top' }}
          style={{ width: '2.5rem', height: '2.5rem' }}
        />
      </div>

      <FinishTrainingDialog
        visible={finishDialogVisible}
        onHide={() => setFinishDialogVisible(false)}
        submitFeedback={handleSubmitFeedback}
        sessionTimer={sessionTimer}
      />

      <VideoDialog
        visible={videoDialogVisible}
        onHide={() => setVideoDialogVisible(false)}
        videoUrl={currentVideoUrl}
      />
    </div>
  );
}

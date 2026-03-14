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
    <div key={group.id} style={{ opacity: isCompleted ? 0.7 : 1, transition: 'opacity 0.3s ease' }}>
      {/* Group Header */}
      <div className="flex align-items-center justify-content-between mb-3">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', margin: 0 }}>
          <FormattedMessage id="training.group" values={{ number: group.groupNumber }} />
        </h3>
        <span
          style={{
            background: '#6366f1',
            color: '#fff',
            padding: '0.2rem 0.6rem',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 600
          }}
        >
          {group.exercises.filter((ex: IExerciseInstance) => exerciseProgress[ex.id]?.completed).length}/
          {group.exercises.length}
        </span>
      </div>

      {/* Exercise List */}
      <div className="flex flex-column gap-3">
        {group.exercises.map((exercise: IExerciseInstance) => {
          const progress: IExerciseProgressEntry = exerciseProgress[exercise.id] || {
            sets: [],
            completed: null,
            comments: ''
          };
          const exerciseCompleted = isExerciseCompleted(exercise);

          return (
            <Card
              key={exercise.id}
              className={exerciseCompleted ? 'completed' : ''}
              style={{
                borderRadius: '16px',
                border: exerciseCompleted ? '1px solid rgba(34,197,94,0.2)' : '1px solid var(--ios-card-border)',
                boxShadow: 'var(--ios-card-shadow)'
              }}
            >
              {/* Exercise Header */}
              <div className="mb-2 w-full">
                <div className="flex flex-column sm:flex-row align-items-start sm:align-items-center justify-content-between gap-2">
                  <div className="flex-grow-1 w-full sm:w-auto">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
                      {exercise.exercise.name}
                    </h3>
                  </div>
                  <div className="flex align-items-center justify-content-between sm:justify-content-end gap-2 w-full sm:w-auto">
                    <div
                      className="cursor-pointer overflow-hidden"
                      style={{
                        borderRadius: '10px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        width: '4rem',
                        height: '3rem'
                      }}
                      onClick={() => handleVideoClick(exercise.exercise.multimedia)}
                    >
                      <img
                        className="w-full h-full"
                        style={{ objectFit: 'cover' }}
                        src={getYouTubeThumbnail(exercise.exercise.multimedia)}
                        alt="Video"
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        icon="pi pi-check"
                        size="small"
                        className="p-button-rounded p-button-outlined"
                        onClick={() => handleToggleAll(true, exercise.id)}
                        tooltip={intl.formatMessage(
                          { id: 'training.markAllCompleted' },
                          { default: 'Mark All Completed' }
                        )}
                        tooltipOptions={{ position: 'top' }}
                        style={{
                          width: '1.75rem',
                          height: '1.75rem',
                          padding: '0.25rem',
                          borderColor: '#22c55e',
                          color: '#22c55e'
                        }}
                      />
                      <Button
                        icon="pi pi-times"
                        size="small"
                        className="p-button-rounded p-button-outlined"
                        onClick={() => handleToggleAll(false, exercise.id)}
                        tooltip={intl.formatMessage({ id: 'training.markAllSkipped' }, { default: 'Mark All Skipped' })}
                        tooltipOptions={{ position: 'top' }}
                        style={{
                          width: '1.75rem',
                          height: '1.75rem',
                          padding: '0.25rem',
                          borderColor: '#ef4444',
                          color: '#ef4444'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sets */}
              <div className="flex flex-column gap-2">
                {Array.from({ length: parseInt(exercise.sets as string) || group.set || 1 }).map((_, index) => {
                  const setData = progress.sets?.[index] || {};
                  return (
                    <div
                      key={index}
                      style={{
                        padding: '0.6rem 0.75rem',
                        background: 'var(--ios-surface-subtle)',
                        borderRadius: '12px'
                      }}
                    >
                      <div className="flex align-items-center justify-content-between mb-1">
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Set {index + 1}</span>
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
                              style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 600 }}
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
                              style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}
                            >
                              &#10007;
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="grid">
                        {exercise.repetitions && (
                          <div className="col-6 sm:col-6 md:col-4">
                            <label className="block text-xs font-medium mb-1" style={{ color: '#737373' }}>
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
                              <span className="p-inputgroup-addon text-xs">{propertyUnits.repetitions || ''}</span>
                            </div>
                          </div>
                        )}
                        {exercise.weight && (
                          <div className="col-6 sm:col-6 md:col-4">
                            <label className="block text-xs font-medium mb-1" style={{ color: '#737373' }}>
                              {intl.formatMessage({ id: 'training.exercise.weight' })}
                            </label>
                            <div className="p-inputgroup">
                              <InputText
                                value={setData.weight || ''}
                                onChange={(e) => handleExerciseChange(exercise.id, index, 'weight', e.target.value)}
                                className="p-inputtext-sm text-center"
                                placeholder="0"
                              />
                              <span className="p-inputgroup-addon text-xs">{propertyUnits?.weight || 'kg'}</span>
                            </div>
                          </div>
                        )}
                        {exercise.time && (
                          <div className="col-6 sm:col-6 md:col-4">
                            <label className="block text-xs font-medium mb-1" style={{ color: '#737373' }}>
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
                            <label className="block text-xs font-medium mb-1" style={{ color: '#737373' }}>
                              {intl.formatMessage({ id: 'training.exercise.distance' })}
                            </label>
                            <div className="p-inputgroup">
                              <InputText
                                value={setData.distance || ''}
                                onChange={(e) => handleExerciseChange(exercise.id, index, 'distance', e.target.value)}
                                className="p-inputtext-sm text-center"
                                placeholder="0"
                              />
                              <span className="p-inputgroup-addon text-xs">{propertyUnits?.distance || 'km'}</span>
                            </div>
                          </div>
                        )}
                        {exercise.duration && (
                          <div className="col-6 sm:col-6 md:col-4">
                            <label className="block text-xs font-medium mb-1" style={{ color: '#737373' }}>
                              {intl.formatMessage({ id: 'training.exercise.duration' })}
                            </label>
                            <div className="p-inputgroup">
                              <InputText
                                value={setData.duration || ''}
                                onChange={(e) => handleExerciseChange(exercise.id, index, 'duration', e.target.value)}
                                className="p-inputtext-sm text-center"
                                placeholder="0"
                              />
                              <span className="p-inputgroup-addon text-xs">{propertyUnits?.duration || 's'}</span>
                            </div>
                          </div>
                        )}
                        {exercise.difficulty && (
                          <div className="col-6 sm:col-6 md:col-4">
                            <label className="block text-xs font-medium mb-1" style={{ color: '#737373' }}>
                              {intl.formatMessage({ id: 'training.exercise.difficulty' })}
                            </label>
                            <div className="p-inputgroup">
                              <InputText
                                value={setData.difficulty || ''}
                                onChange={(e) => handleExerciseChange(exercise.id, index, 'difficulty', e.target.value)}
                                className="p-inputtext-sm text-center"
                                placeholder="0"
                              />
                              <span className="p-inputgroup-addon text-xs">{propertyUnits?.difficulty || ''}</span>
                            </div>
                          </div>
                        )}
                        {exercise.tempo && (
                          <div className="col-6 sm:col-6 md:col-4">
                            <label className="block text-xs font-medium mb-1" style={{ color: '#737373' }}>
                              {intl.formatMessage({ id: 'training.exercise.tempo' })}
                            </label>
                            <div className="p-inputgroup">
                              <InputText
                                value={setData.tempo || ''}
                                onChange={(e) => handleExerciseChange(exercise.id, index, 'tempo', e.target.value)}
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
                                currentCycle !== -1 ? (currentCycle as { id: number }).id : (currentCycle as number)
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

              {/* Notes & Comments */}
              <div className="grid mt-2">
                <div className="col-12 sm:col-6">
                  <label
                    htmlFor={`notes-${exercise.id}`}
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--ios-text)' }}
                  >
                    <FormattedMessage id="training.notes" defaultMessage="Notes" />
                  </label>
                  <InputTextarea
                    id={`notes-${exercise.id}`}
                    rows={2}
                    value={exercise.notes || ''}
                    disabled
                    className="w-full text-sm"
                    style={{ resize: 'none', borderRadius: '10px' }}
                  />
                </div>
                <div className="col-12 sm:col-6">
                  <label
                    htmlFor={`comments-${exercise.id}`}
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--ios-text)' }}
                  >
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
                    style={{ resize: 'none', borderRadius: '10px' }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
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
      <div className="flex flex-column align-items-center justify-content-center min-h-screen p-4">
        <ProgressSpinner className="mb-3" />
        <span style={{ color: 'var(--ios-text-secondary)', fontSize: '1rem' }}>
          <FormattedMessage id="training.loading" />
        </span>
      </div>
    );
  }

  return (
    <div style={{ padding: '0.5rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 'clamp(1.3rem, 3vw, 1.75rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 0.25rem'
          }}
        >
          <FormattedMessage id="training.title" />
        </h1>
        <h2 style={{ fontSize: '1rem', color: 'var(--ios-text-secondary)', fontWeight: 500, margin: '0 0 0.5rem' }}>
          {plan.instanceName ? plan.instanceName : plan.workout.planName}
        </h2>
        {!plan.isTemplate && (
          <div className="flex align-items-center justify-content-center gap-2">
            <i className={getStatusIcon(plan.status)} style={{ fontSize: '0.85rem' }} />
            <span style={{ fontSize: '0.85rem', color: '#737373' }}>
              <FormattedMessage id="training.status" />: {plan.status}
            </span>
          </div>
        )}
      </div>

      {/* Exercise Groups */}
      <div>
        <div className="flex align-items-center gap-2 sm:gap-3">
          <Button
            icon="pi pi-chevron-left"
            className="p-button-rounded p-button-text flex-shrink-0"
            onClick={navigateToPreviousGroup}
            disabled={currentGroupIndex === 0}
            style={{ width: '2.5rem', height: '2.5rem', color: currentGroupIndex === 0 ? '#d4d4d4' : '#6366f1' }}
          />

          <div className="flex-grow-1">
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
            className="p-button-rounded p-button-text flex-shrink-0"
            onClick={navigateToNextGroup}
            disabled={!canNavigateToNextGroup()}
            style={{ width: '2.5rem', height: '2.5rem', color: !canNavigateToNextGroup() ? '#d4d4d4' : '#6366f1' }}
          />
        </div>

        {/* Group Indicators */}
        <div className="flex justify-content-center gap-2 mt-3">
          {plan.groups.map((_: IExerciseGroup, index: number) => (
            <div
              key={index}
              onClick={() => navigateToGroup(index)}
              style={{
                width: '2.5rem',
                height: '0.35rem',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: isGroupCompleted(plan.groups[index]!)
                  ? '#22c55e'
                  : index === currentGroupIndex
                    ? '#6366f1'
                    : 'var(--ios-surface-muted)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="flex justify-content-center align-items-center gap-1 sm:gap-2 mt-3"
        style={{
          position: 'sticky',
          bottom: '0.5rem',
          zIndex: 10,
          padding: '0.5rem 0.75rem',
          background: 'var(--ios-glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          boxShadow: 'var(--ios-shadow-lg)',
          border: '1px solid var(--ios-glass-border)'
        }}
      >
        {/* Timer */}
        <div
          className="flex align-items-center gap-2"
          style={{
            background: '#6366f1',
            color: '#fff',
            padding: '0.4rem 0.65rem',
            borderRadius: '10px'
          }}
        >
          <i className="pi pi-clock" style={{ fontSize: '0.8rem' }} />
          <span style={{ fontWeight: 700, fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
            {formatSessionTime(sessionTimer)}
          </span>
          <Button
            icon={isTimerPaused ? 'pi pi-play' : 'pi pi-pause'}
            className="p-button-text p-button-sm"
            onClick={handleToggleTimer}
            style={{
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              width: '1.6rem',
              height: '1.6rem',
              borderRadius: '8px'
            }}
          />
        </div>

        <Button
          icon="pi pi-save"
          className="p-button-rounded"
          onClick={handleSaveProgress}
          tooltip={intl.formatMessage({ id: 'training.buttons.saveProgress' })}
          tooltipOptions={{ position: 'top' }}
          style={{ width: '2.5rem', height: '2.5rem', background: '#6366f1', border: 'none' }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-outlined"
          onClick={handleClearProgress}
          tooltip="Limpiar Progreso"
          tooltipOptions={{ position: 'top' }}
          style={{ width: '2.5rem', height: '2.5rem', borderColor: '#ef4444', color: '#ef4444' }}
        />
        <Button
          icon="pi pi-check"
          className="p-button-rounded"
          onClick={() => setFinishDialogVisible(true)}
          tooltip={intl.formatMessage({ id: 'training.buttons.finishTraining' })}
          tooltipOptions={{ position: 'top' }}
          style={{ width: '2.5rem', height: '2.5rem', background: '#22c55e', border: 'none' }}
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

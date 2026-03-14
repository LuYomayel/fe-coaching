import { Button } from 'primereact/button';
import { RadioButton } from 'primereact/radiobutton';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from 'primereact/dialog';
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
import { IExerciseSetConfiguration } from 'types/workout/exercise-set-configuration';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MeasurableField = 'repetitions' | 'weight' | 'time' | 'distance' | 'duration' | 'difficulty' | 'tempo';

/** Returns true if the field should be shown for this exercise + set index */
function hasField(exercise: IExerciseInstance, setIndex: number, field: MeasurableField): boolean {
  if (exercise[field]) return true;
  const config = (exercise.setConfiguration || []).find((c: IExerciseSetConfiguration) => c.setNumber === setIndex + 1);
  return !!(config && config[field]);
}

/** Gets the template value for this set (from setConfiguration or exercise-level) */
function getSetTemplateValue(exercise: IExerciseInstance, setIndex: number, field: MeasurableField): string {
  const config = (exercise.setConfiguration || []).find((c: IExerciseSetConfiguration) => c.setNumber === setIndex + 1);
  return config?.[field] || exercise[field] || '';
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  page: {
    padding: '0.75rem',
    maxWidth: '720px',
    margin: '0 auto',
    paddingBottom: '5rem'
  } as React.CSSProperties,
  headerCard: {
    background: 'var(--ios-card-bg)',
    borderRadius: 'var(--ios-radius-xl)',
    border: '1px solid var(--ios-card-border)',
    boxShadow: 'var(--ios-card-shadow)',
    padding: '1.25rem',
    marginBottom: '1rem',
    textAlign: 'center' as const
  } as React.CSSProperties,
  planTitle: {
    fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    margin: '0 0 0.15rem',
    color: 'var(--ios-text)'
  } as React.CSSProperties,
  planSubtitle: {
    fontSize: 'clamp(0.82rem, 2vw, 0.95rem)',
    color: 'var(--ios-text-secondary)',
    fontWeight: 500,
    margin: 0
  } as React.CSSProperties,
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.78rem',
    color: 'var(--ios-text-tertiary)',
    marginTop: '0.5rem'
  } as React.CSSProperties,
  exerciseCard: (completed: boolean) =>
    ({
      background: 'var(--ios-card-bg)',
      borderRadius: 'var(--ios-radius-lg)',
      border: completed ? '1px solid rgba(34,197,94,0.25)' : '1px solid var(--ios-card-border)',
      boxShadow: completed ? '0 0 0 1px rgba(34,197,94,0.08), var(--ios-shadow-sm)' : 'var(--ios-card-shadow)',
      padding: '0.85rem',
      transition: 'all 0.25s ease'
    }) as React.CSSProperties,
  exerciseName: {
    fontSize: 'clamp(0.88rem, 2.5vw, 1rem)',
    fontWeight: 600,
    margin: 0,
    letterSpacing: '-0.01em',
    color: 'var(--ios-text)'
  } as React.CSSProperties,
  videoThumb: {
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    width: '3.5rem',
    height: '2.5rem',
    cursor: 'pointer',
    flexShrink: 0
  } as React.CSSProperties,
  setRow: (completed: boolean | null | undefined) =>
    ({
      padding: '0.5rem 0.65rem',
      background:
        completed === true
          ? 'rgba(34, 197, 94, 0.04)'
          : completed === false
            ? 'rgba(239, 68, 68, 0.03)'
            : 'var(--ios-surface-subtle)',
      borderRadius: 'var(--ios-radius-md)',
      border:
        completed === true
          ? '1px solid rgba(34,197,94,0.12)'
          : completed === false
            ? '1px solid rgba(239,68,68,0.08)'
            : '1px solid transparent',
      transition: 'all 0.2s ease'
    }) as React.CSSProperties,
  inputLabel: {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 600,
    marginBottom: '0.2rem',
    color: 'var(--ios-text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em'
  } as React.CSSProperties,
  stickyBar: {
    position: 'fixed' as const,
    bottom: '0.75rem',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    background: 'var(--ios-glass-bg)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: 'var(--ios-radius-xl)',
    boxShadow: 'var(--ios-shadow-xl)',
    border: '1px solid var(--ios-glass-border)',
    maxWidth: '95vw',
    width: 'auto'
  } as React.CSSProperties,
  timerPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    background: '#6366f1',
    color: '#fff',
    padding: '0.35rem 0.6rem',
    borderRadius: 'var(--ios-radius-md)'
  } as React.CSSProperties,
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.75rem'
  } as React.CSSProperties,
  groupTitle: {
    fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
    fontWeight: 700,
    color: '#6366f1',
    margin: 0
  } as React.CSSProperties,
  groupBadge: {
    background: 'rgba(99,102,241,0.1)',
    color: '#6366f1',
    padding: '0.15rem 0.5rem',
    borderRadius: 'var(--ios-radius-pill)',
    fontSize: '0.75rem',
    fontWeight: 600
  } as React.CSSProperties,
  navButton: (disabled: boolean) =>
    ({
      width: '2.2rem',
      height: '2.2rem',
      color: disabled ? 'var(--ios-text-tertiary)' : '#6366f1',
      flexShrink: 0
    }) as React.CSSProperties,
  groupDot: (active: boolean, completed: boolean) =>
    ({
      width: active ? '2rem' : '1.5rem',
      height: '0.3rem',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      background: completed ? '#22c55e' : active ? '#6366f1' : 'var(--ios-surface-muted)'
    }) as React.CSSProperties,
  actionBtn: (bg: string, border?: string) =>
    ({
      width: '2.2rem',
      height: '2.2rem',
      background: border ? 'transparent' : bg,
      border: border ? `1.5px solid ${border}` : 'none',
      color: border || '#fff'
    }) as React.CSSProperties
};

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
  getExerciseRpeMethod,
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
  getExerciseRpeMethod: ReturnType<typeof useTrainingPlanDetails>['getExerciseRpeMethod'];
  intl: ReturnType<typeof useTrainingPlanDetails>['intl'];
}): JSX.Element {
  const completed = isGroupCompleted(group);
  const completedCount = group.exercises.filter((ex: IExerciseInstance) => exerciseProgress[ex.id]?.completed).length;

  return (
    <div style={{ opacity: completed ? 0.7 : 1, transition: 'opacity 0.3s ease' }}>
      {/* Group Header */}
      <div style={styles.groupHeader}>
        <h3 style={styles.groupTitle}>
          <FormattedMessage id="training.group" values={{ number: group.groupNumber }} />
        </h3>
        <span style={styles.groupBadge}>
          {completedCount}/{group.exercises.length}
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
            <div key={exercise.id} style={styles.exerciseCard(exerciseCompleted)}>
              {/* Exercise Header */}
              <div className="flex align-items-center justify-content-between gap-2 mb-2">
                <div className="flex align-items-center gap-2 flex-grow-1 min-w-0">
                  <div style={styles.videoThumb} onClick={() => handleVideoClick(exercise.exercise.multimedia)}>
                    <img
                      className="w-full h-full"
                      style={{ objectFit: 'cover' }}
                      src={getYouTubeThumbnail(exercise.exercise.multimedia)}
                      alt="Video"
                    />
                  </div>
                  <h3 style={styles.exerciseName}>{exercise.exercise.name}</h3>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    icon="pi pi-check"
                    size="small"
                    className="p-button-rounded p-button-text"
                    onClick={() => handleToggleAll(true, exercise.id)}
                    tooltip={intl.formatMessage({
                      id: 'training.markAllCompleted',
                      defaultMessage: 'Mark All Completed'
                    })}
                    tooltipOptions={{ position: 'top' }}
                    style={{ width: '1.65rem', height: '1.65rem', color: '#22c55e' }}
                  />
                  <Button
                    icon="pi pi-times"
                    size="small"
                    className="p-button-rounded p-button-text"
                    onClick={() => handleToggleAll(false, exercise.id)}
                    tooltip={intl.formatMessage({ id: 'training.markAllSkipped', defaultMessage: 'Mark All Skipped' })}
                    tooltipOptions={{ position: 'top' }}
                    style={{ width: '1.65rem', height: '1.65rem', color: '#ef4444' }}
                  />
                </div>
              </div>

              {/* Sets */}
              <div className="flex flex-column gap-2">
                {Array.from({ length: parseInt(exercise.sets as string) || group.set || 1 }).map((_, index) => {
                  const setData = progress.sets?.[index] || {};
                  return (
                    <div key={index} style={styles.setRow(setData.completed)}>
                      {/* Set header with radio buttons */}
                      <div className="flex align-items-center justify-content-between mb-2">
                        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--ios-text)' }}>
                          Set {index + 1}
                        </span>
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
                              style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 700, cursor: 'pointer' }}
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
                              style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}
                            >
                              &#10007;
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Set template info (when setConfiguration has per-set values) */}
                      {exercise.setConfiguration && exercise.setConfiguration.length > 0 && (
                        <div
                          className="flex flex-wrap gap-2 mb-2"
                          style={{ fontSize: '0.72rem', color: 'var(--ios-text-tertiary)' }}
                        >
                          {(() => {
                            const tmpl = getSetTemplateValue;
                            const fields: { key: MeasurableField; unit: string }[] = [
                              { key: 'repetitions', unit: propertyUnits.repetitions || 'reps' },
                              { key: 'weight', unit: propertyUnits?.weight || 'kg' },
                              { key: 'time', unit: propertyUnits?.time || 's' },
                              { key: 'distance', unit: propertyUnits?.distance || 'km' },
                              { key: 'duration', unit: propertyUnits?.duration || 's' },
                              { key: 'difficulty', unit: propertyUnits?.difficulty || '' },
                              { key: 'tempo', unit: propertyUnits?.tempo || '' }
                            ];
                            return fields
                              .filter((f) => tmpl(exercise, index, f.key))
                              .map((f) => (
                                <span
                                  key={f.key}
                                  style={{
                                    background: 'rgba(99,102,241,0.08)',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: 'var(--ios-radius-sm)',
                                    fontWeight: 600
                                  }}
                                >
                                  {tmpl(exercise, index, f.key)}
                                  {f.unit ? ` ${f.unit}` : ''}
                                </span>
                              ));
                          })()}
                        </div>
                      )}

                      {/* Input fields grid */}
                      <div className="grid">
                        {hasField(exercise, index, 'repetitions') && (
                          <div className="col-4 sm:col-4 md:col-3">
                            <label style={styles.inputLabel}>
                              {intl.formatMessage({ id: 'training.exercise.reps' })}
                            </label>
                            <div className="p-inputgroup p-inputgroup-sm">
                              <InputText
                                value={setData.repetitions || ''}
                                onChange={(e) =>
                                  handleExerciseChange(exercise.id, index, 'repetitions', e.target.value)
                                }
                                className="p-inputtext-sm text-center"
                                placeholder={getSetTemplateValue(exercise, index, 'repetitions') || '0'}
                                style={{ borderRadius: '8px 0 0 8px' }}
                              />
                              <span className="p-inputgroup-addon" style={{ fontSize: '0.7rem' }}>
                                {propertyUnits.repetitions || ''}
                              </span>
                            </div>
                          </div>
                        )}
                        {hasField(exercise, index, 'weight') && (
                          <div className="col-4 sm:col-4 md:col-3">
                            <label style={styles.inputLabel}>
                              {intl.formatMessage(
                                { id: 'training.exercise.weight' },
                                { unit: propertyUnits?.weight || 'kg' }
                              )}
                            </label>
                            <div className="p-inputgroup p-inputgroup-sm">
                              <InputText
                                value={setData.weight || ''}
                                onChange={(e) => handleExerciseChange(exercise.id, index, 'weight', e.target.value)}
                                className="p-inputtext-sm text-center"
                                placeholder={getSetTemplateValue(exercise, index, 'weight') || '0'}
                                style={{ borderRadius: '8px 0 0 8px' }}
                              />
                              <span className="p-inputgroup-addon" style={{ fontSize: '0.7rem' }}>
                                {propertyUnits?.weight || 'kg'}
                              </span>
                            </div>
                          </div>
                        )}
                        {hasField(exercise, index, 'time') && (
                          <div className="col-4 sm:col-4 md:col-3">
                            <label style={styles.inputLabel}>
                              {intl.formatMessage(
                                { id: 'training.exercise.time' },
                                { unit: propertyUnits?.time || 's' }
                              )}
                            </label>
                            <div className="p-inputgroup p-inputgroup-sm">
                              <InputText
                                value={setData.time || ''}
                                onChange={(e) => handleExerciseChange(exercise.id, index, 'time', e.target.value)}
                                className="p-inputtext-sm text-center"
                                placeholder={getSetTemplateValue(exercise, index, 'time') || '0'}
                                style={{ borderRadius: '8px 0 0 8px' }}
                              />
                              <span className="p-inputgroup-addon" style={{ fontSize: '0.7rem' }}>
                                {propertyUnits?.time || 's'}
                              </span>
                            </div>
                          </div>
                        )}
                        {hasField(exercise, index, 'distance') && (
                          <div className="col-4 sm:col-4 md:col-3">
                            <label style={styles.inputLabel}>
                              {intl.formatMessage(
                                { id: 'training.exercise.distance' },
                                { unit: propertyUnits?.distance || 'km' }
                              )}
                            </label>
                            <div className="p-inputgroup p-inputgroup-sm">
                              <InputText
                                value={setData.distance || ''}
                                onChange={(e) => handleExerciseChange(exercise.id, index, 'distance', e.target.value)}
                                className="p-inputtext-sm text-center"
                                placeholder={getSetTemplateValue(exercise, index, 'distance') || '0'}
                                style={{ borderRadius: '8px 0 0 8px' }}
                              />
                              <span className="p-inputgroup-addon" style={{ fontSize: '0.7rem' }}>
                                {propertyUnits?.distance || 'km'}
                              </span>
                            </div>
                          </div>
                        )}
                        {hasField(exercise, index, 'duration') && (
                          <div className="col-4 sm:col-4 md:col-3">
                            <label style={styles.inputLabel}>
                              {intl.formatMessage(
                                { id: 'training.exercise.duration' },
                                { unit: propertyUnits?.duration || 's' }
                              )}
                            </label>
                            <div className="p-inputgroup p-inputgroup-sm">
                              <InputText
                                value={setData.duration || ''}
                                onChange={(e) => handleExerciseChange(exercise.id, index, 'duration', e.target.value)}
                                className="p-inputtext-sm text-center"
                                placeholder={getSetTemplateValue(exercise, index, 'duration') || '0'}
                                style={{ borderRadius: '8px 0 0 8px' }}
                              />
                              <span className="p-inputgroup-addon" style={{ fontSize: '0.7rem' }}>
                                {propertyUnits?.duration || 's'}
                              </span>
                            </div>
                          </div>
                        )}
                        {hasField(exercise, index, 'difficulty') && (
                          <div className="col-4 sm:col-4 md:col-3">
                            <label style={styles.inputLabel}>
                              {intl.formatMessage(
                                { id: 'training.exercise.difficulty' },
                                { unit: propertyUnits?.difficulty || '' }
                              )}
                            </label>
                            <div className="p-inputgroup p-inputgroup-sm">
                              <InputText
                                value={setData.difficulty || ''}
                                onChange={(e) => handleExerciseChange(exercise.id, index, 'difficulty', e.target.value)}
                                className="p-inputtext-sm text-center"
                                placeholder={getSetTemplateValue(exercise, index, 'difficulty') || '0'}
                                style={{ borderRadius: '8px 0 0 8px' }}
                              />
                              <span className="p-inputgroup-addon" style={{ fontSize: '0.7rem' }}>
                                {propertyUnits?.difficulty || ''}
                              </span>
                            </div>
                          </div>
                        )}
                        {hasField(exercise, index, 'tempo') && (
                          <div className="col-4 sm:col-4 md:col-3">
                            <label style={styles.inputLabel}>
                              {intl.formatMessage(
                                { id: 'training.exercise.tempo' },
                                { unit: propertyUnits?.tempo || '' }
                              )}
                            </label>
                            <div className="p-inputgroup p-inputgroup-sm">
                              <InputText
                                value={setData.tempo || ''}
                                onChange={(e) => handleExerciseChange(exercise.id, index, 'tempo', e.target.value)}
                                className="p-inputtext-sm text-center"
                                placeholder={getSetTemplateValue(exercise, index, 'tempo') || '0'}
                                style={{ borderRadius: '8px 0 0 8px' }}
                              />
                              <span className="p-inputgroup-addon" style={{ fontSize: '0.7rem' }}>
                                {propertyUnits?.tempo || 's'}
                              </span>
                            </div>
                          </div>
                        )}
                        {(() => {
                          const resolvedRpe = getExerciseRpeMethod(exercise);
                          return resolvedRpe ? (
                            <div className="col-12 sm:col-6 md:col-4">
                              <RpeDropdownComponent
                                selectedRpe={setData.rating ?? 0}
                                onChange={(e) => handleExerciseChange(exercise.id, index, 'rating', e.value)}
                                rpeMethod={resolvedRpe}
                              />
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notes & Comments */}
              <div className="grid mt-2">
                {exercise.notes && (
                  <div className="col-12 sm:col-6">
                    <label
                      htmlFor={`notes-${exercise.id}`}
                      style={{ ...styles.inputLabel, textTransform: 'none', fontSize: '0.78rem' }}
                    >
                      <FormattedMessage id="training.notes" defaultMessage="Notes" />
                    </label>
                    <InputTextarea
                      id={`notes-${exercise.id}`}
                      rows={2}
                      value={exercise.notes || ''}
                      disabled
                      className="w-full text-sm"
                      style={{
                        resize: 'none',
                        borderRadius: 'var(--ios-radius-md)',
                        background: 'var(--ios-surface-subtle)',
                        border: '1px solid var(--ios-divider)',
                        opacity: 0.8
                      }}
                    />
                  </div>
                )}
                <div className={exercise.notes ? 'col-12 sm:col-6' : 'col-12'}>
                  <label
                    htmlFor={`comments-${exercise.id}`}
                    style={{ ...styles.inputLabel, textTransform: 'none', fontSize: '0.78rem' }}
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
                    style={{
                      resize: 'none',
                      borderRadius: 'var(--ios-radius-md)',
                      border: '1px solid var(--ios-divider)'
                    }}
                  />
                </div>
              </div>
            </div>
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
    confirmFinishVisible,
    currentGroupIndex,
    sessionTimer,
    isTimerPaused,
    propertyUnits,
    loading,
    hasSubjectiveMeasurement,
    setVideoDialogVisible,
    setFinishDialogVisible,
    setConfirmFinishVisible,
    handleSaveProgress,
    handleClearProgress,
    handleSubmitFeedback,
    handleToggleTimer,
    handleToggleAll,
    handleVideoClick,
    handleSetCompletedChange,
    handleExerciseChange,
    handleFinishClick,
    markAllAsCompleted,
    navigateToNextGroup,
    navigateToPreviousGroup,
    navigateToGroup,
    canNavigateToNextGroup,
    getStatusIcon,
    isExerciseCompleted,
    isGroupCompleted,
    getExerciseRpeMethod,
    formatSessionTime,
    intl
  } = hook;

  if (loading || !plan) {
    return (
      <div className="flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <ProgressSpinner style={{ width: '2.5rem', height: '2.5rem' }} />
        <span style={{ color: 'var(--ios-text-secondary)', fontSize: '0.9rem', marginTop: '0.75rem' }}>
          <FormattedMessage id="training.loading" />
        </span>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header Card */}
      <div style={styles.headerCard}>
        <h1 style={styles.planTitle}>
          <FormattedMessage id="training.title" />
        </h1>
        <p style={styles.planSubtitle}>{plan.instanceName || plan.workout.planName}</p>
        {!plan.isTemplate && (
          <div style={styles.statusBadge}>
            <i className={getStatusIcon(plan.status)} style={{ fontSize: '0.8rem' }} />
            <span>
              <FormattedMessage id="training.status" />: {plan.status}
            </span>
          </div>
        )}
      </div>

      {/* Group Navigation + Content */}
      <div className="flex align-items-start gap-1">
        <Button
          icon="pi pi-chevron-left"
          className="p-button-rounded p-button-text flex-shrink-0 mt-5"
          onClick={navigateToPreviousGroup}
          disabled={currentGroupIndex === 0}
          style={styles.navButton(currentGroupIndex === 0)}
        />

        <div className="flex-grow-1 min-w-0">
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
            getExerciseRpeMethod={getExerciseRpeMethod}
            intl={intl}
          />
        </div>

        <Button
          icon="pi pi-chevron-right"
          className="p-button-rounded p-button-text flex-shrink-0 mt-5"
          onClick={navigateToNextGroup}
          disabled={!canNavigateToNextGroup()}
          style={styles.navButton(!canNavigateToNextGroup())}
        />
      </div>

      {/* Group Indicators */}
      <div className="flex justify-content-center align-items-center gap-2 mt-3 mb-3">
        {plan.groups.map((_: IExerciseGroup, index: number) => (
          <div
            key={index}
            onClick={() => navigateToGroup(index)}
            style={styles.groupDot(index === currentGroupIndex, isGroupCompleted(plan.groups[index]!))}
          />
        ))}
      </div>

      {/* Sticky Action Bar */}
      <div style={styles.stickyBar}>
        {/* Timer Pill */}
        <div style={styles.timerPill}>
          <i className="pi pi-stopwatch" style={{ fontSize: '0.75rem' }} />
          <span style={{ fontWeight: 700, fontSize: '0.82rem', fontVariantNumeric: 'tabular-nums' }}>
            {formatSessionTime(sessionTimer)}
          </span>
          <Button
            icon={isTimerPaused ? 'pi pi-play' : 'pi pi-pause'}
            className="p-button-text p-button-sm"
            onClick={handleToggleTimer}
            style={{
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              width: '1.4rem',
              height: '1.4rem',
              borderRadius: '6px',
              padding: 0
            }}
          />
        </div>

        <Button
          icon="pi pi-save"
          className="p-button-rounded"
          onClick={handleSaveProgress}
          tooltip={intl.formatMessage({ id: 'training.buttons.saveProgress' })}
          tooltipOptions={{ position: 'top' }}
          style={styles.actionBtn('#6366f1')}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-outlined"
          onClick={handleClearProgress}
          tooltip={intl.formatMessage({ id: 'training.buttons.clearProgress', defaultMessage: 'Clear Progress' })}
          tooltipOptions={{ position: 'top' }}
          style={styles.actionBtn('transparent', '#ef4444')}
        />
        <Button
          icon="pi pi-flag-fill"
          className="p-button-rounded"
          onClick={handleFinishClick}
          tooltip={intl.formatMessage({ id: 'training.buttons.finishTraining' })}
          tooltipOptions={{ position: 'top' }}
          style={styles.actionBtn('#22c55e')}
        />
      </div>

      {/* Confirmation Dialog: "Did you finish everything?" */}
      <Dialog
        visible={confirmFinishVisible}
        onHide={() => setConfirmFinishVisible(false)}
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-question-circle" style={{ color: '#f59e0b', fontSize: '1.1rem' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>
              <FormattedMessage id="training.confirm.title" defaultMessage="Did you finish everything?" />
            </span>
          </div>
        }
        style={{ width: 'min(92vw, 420px)', borderRadius: 'var(--ios-radius-xl)' }}
        draggable={false}
        resizable={false}
        dismissableMask
        footer={
          <div className="flex flex-column gap-2" style={{ padding: '0.25rem 0' }}>
            <Button
              label={intl.formatMessage({
                id: 'training.confirm.markAllDone',
                defaultMessage: 'Mark all as finished'
              })}
              icon="pi pi-check-circle"
              onClick={() => {
                markAllAsCompleted();
                setConfirmFinishVisible(false);
                if (hasSubjectiveMeasurement) {
                  // After marking all, measurements may still be needed
                  // Let the user fill them, then click finish again
                } else {
                  setFinishDialogVisible(true);
                }
              }}
              style={{
                background: '#22c55e',
                border: 'none',
                borderRadius: 'var(--ios-radius-md)',
                fontWeight: 600,
                fontSize: '0.85rem',
                width: '100%'
              }}
            />
            <Button
              label={intl.formatMessage({
                id: 'training.confirm.goBack',
                defaultMessage: 'Go back and mark what you missed'
              })}
              icon="pi pi-arrow-left"
              className="p-button-text"
              onClick={() => setConfirmFinishVisible(false)}
              style={{
                fontSize: '0.85rem',
                color: 'var(--ios-text-secondary)',
                width: '100%'
              }}
            />
          </div>
        }
      >
        <p style={{ fontSize: '0.9rem', color: 'var(--ios-text)', lineHeight: 1.5, margin: '0.5rem 0' }}>
          <FormattedMessage
            id="training.confirm.message"
            defaultMessage="You haven't marked all exercises. Did you finish everything?"
          />
        </p>
      </Dialog>

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

import React, { useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FaGripVertical } from 'react-icons/fa';
import { Button } from 'primereact/button';

import { useUser } from '../../contexts/UserContext';
import { useNewCreatePlan } from '../../hooks/coach/useNewCreatePlan';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useSetConfigDialog } from '../../hooks/dialogs/useSetConfigDialog';
import { DragableRow } from '../../components/shared/DragableRow';
import { ExerciseDropdown } from '../../components/shared/ExerciseDropdown';
import { SetConfigDialog } from '../../dialogs/SetConfigDialog';
import { IPlanGroup, IPlanExercise } from '../../types/workout/plan-state';

interface LocationState {
  planId?: number;
  isTemplate?: boolean;
}

export const NewCreatePlan: React.FC = () => {
  const { coach } = useUser();
  const { planId: planIdParam } = useParams<{ planId?: string }>();
  const location = useLocation();
  const state = location.state as LocationState | undefined;
  const pathname = useLocation().pathname;
  const isEdit = pathname.includes('/edit/');
  const parsedParamId = planIdParam ? Number(planIdParam) : undefined;
  const paramPlanId = Number.isNaN(parsedParamId) ? undefined : parsedParamId;
  const statePlanId = state?.planId ? Number(state.planId) : undefined;
  const planId = !Number.isNaN(paramPlanId) && paramPlanId !== undefined ? paramPlanId : statePlanId;
  const isTemplate = state?.isTemplate ?? true;

  const {
    plan,
    groups,
    exercises,
    isSaving,
    updatePlanName,
    updateInstanceName,
    updateExerciseSelection,
    updateExerciseProperty,
    getExerciseKey,
    selectedGroup,
    selectedExercise,
    setSelectedGroup,
    setSelectedExercise,
    updateSetConfiguration,
    toggleSetConfiguration,

    addGroup,
    addExerciseToGroup,
    removeExerciseFromGroup,
    addExerciseAtPosition,
    hoverRowIndex,
    showInsertButton,
    isInsertButtonHovered,
    insertPosition,
    setHoverRowIndex,
    setShowInsertButton,
    setIsInsertButtonHovered,
    setInsertPosition,
    setGroups,
    handleSavePlan,

    editingGroupName,
    setEditingGroupName,
    updateGroupName
  } = useNewCreatePlan({
    coachId: coach?.id ?? 0,
    planId,
    isTemplate,
    isEdit
  });

  const [isEditing, setIsEditing] = useState(false);

  const { visible, openDialog, closeDialog } = useSetConfigDialog();

  const dragAndDrop = useDragAndDrop(groups, setGroups) as {
    sensors: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    handleDragStart: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    handleDragEnd: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    handleDragOver: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    activeId: string | null;
    activeGroup: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    customCollisionDetection: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  const { sensors, handleDragStart, handleDragEnd, handleDragOver, activeId, activeGroup, customCollisionDetection } =
    dragAndDrop;

  const [overId, setOverId] = useState<string | null>(null);

  const activeExercise = useMemo(() => {
    if (!activeId || !activeId.startsWith('exercise-')) return null;
    const activeKey = activeId.replace('exercise-', '');
    for (const group of groups) {
      const exercise = group.exercises.find((ex) => getExerciseKey(group.id, ex) === activeKey);
      if (exercise) return exercise;
    }
    return null;
  }, [activeId, groups, getExerciseKey]);

  const handleOpenSetConfigDialog = (group: IPlanGroup, exercise: IPlanExercise) => {
    setSelectedGroup(group);
    setSelectedExercise(exercise);
    openDialog();
  };

  return (
    <>
      {/* Header */}
      <div
        style={{
          padding: '0.75rem',
          maxWidth: '900px',
          margin: '0 auto'
        }}
      >
        <div
          style={{
            background: 'var(--ios-card-bg)',
            borderRadius: 'var(--ios-radius-xl)',
            border: '1px solid var(--ios-card-border)',
            boxShadow: 'var(--ios-card-shadow)',
            padding: '1rem',
            marginBottom: '0.75rem'
          }}
        >
          <div className="flex flex-column sm:flex-row align-items-start sm:align-items-center gap-2">
            <div className="flex-grow-1 w-full sm:w-auto">
              <label
                htmlFor="plan-name"
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  marginBottom: '0.3rem',
                  color: 'var(--ios-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em'
                }}
              >
                Nombre del Plan
              </label>
              <InputText
                id="plan-name"
                value={isTemplate ? plan.planName || '' : plan.instanceName || ''}
                onChange={(e) => (isTemplate ? updatePlanName(e.target.value) : updateInstanceName(e.target.value))}
                className="w-full"
                placeholder="Ingresa el nombre del plan"
                style={{
                  borderRadius: 'var(--ios-radius-md)',
                  border: '1px solid var(--ios-divider)'
                }}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                icon="pi pi-plus"
                label="Grupo"
                onClick={addGroup}
                className="flex-1 sm:flex-initial"
                style={{
                  background: 'rgba(99,102,241,0.1)',
                  color: '#6366f1',
                  border: 'none',
                  borderRadius: 'var(--ios-radius-md)',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              />
              <Button
                label="Guardar"
                icon="pi pi-save"
                onClick={handleSavePlan}
                loading={isSaving}
                disabled={isSaving}
                className="flex-1 sm:flex-initial"
                style={{
                  background: '#22c55e',
                  border: 'none',
                  borderRadius: 'var(--ios-radius-md)',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Groups */}
      <div
        style={{
          padding: '0 0.75rem 2rem',
          maxWidth: '900px',
          margin: '0 auto'
        }}
      >
        {groups.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragEnd={(event) => {
              setOverId(null);
              handleDragEnd(event);
            }}
            onDragStart={handleDragStart}
            onDragOver={(event) => {
              setOverId(event.over?.id?.toString() || null);
              handleDragOver(event);
            }}
          >
            <SortableContext items={groups.map((group) => `group-${group.id}`)} strategy={verticalListSortingStrategy}>
              {groups.map((group, groupIndex) => (
                <DragableRow key={group.id} id={`group-${group.id}`} data={group} type="group" disabled={isEditing}>
                  <div
                    style={{
                      marginBottom: '0.75rem',
                      background: 'var(--ios-card-bg)',
                      borderRadius: 'var(--ios-radius-lg)',
                      border: '1px solid var(--ios-card-border)',
                      boxShadow: 'var(--ios-card-shadow)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Group Header */}
                    <div
                      className="flex align-items-center"
                      style={{
                        padding: '0.6rem 0.75rem',
                        background: '#6366f1',
                        color: '#fff',
                        gap: '0.5rem'
                      }}
                    >
                      <FaGripVertical style={{ cursor: 'grab', flexShrink: 0 }} />
                      {editingGroupName !== group.groupNumber ? (
                        <div
                          className="font-bold flex-grow-1"
                          style={{
                            cursor: 'pointer',
                            fontSize: '0.88rem'
                          }}
                          onClick={() => setEditingGroupName(group.groupNumber)}
                        >
                          {group.name ? group.name : `Grupo ${group.groupNumber}`}
                        </div>
                      ) : (
                        <InputText
                          className="p-inputtext-sm flex-grow-1"
                          value={group.name || ''}
                          onChange={(e) => updateGroupName(group.groupNumber, e.target.value)}
                          onFocus={() => setEditingGroupName(group.groupNumber)}
                          onBlur={() => setEditingGroupName(null)}
                          onKeyDown={(e) => e.stopPropagation()}
                          placeholder="Nombre del grupo"
                          style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: '#fff',
                            borderRadius: 'var(--ios-radius-sm)'
                          }}
                        />
                      )}
                      <Button
                        icon="pi pi-plus"
                        className="p-button-sm p-button-rounded p-button-text"
                        onClick={() => addExerciseToGroup(group.id)}
                        tooltip="Agregar ejercicio"
                        style={{
                          color: 'white',
                          width: '1.75rem',
                          height: '1.75rem',
                          flexShrink: 0
                        }}
                      />
                    </div>

                    {/* Exercise Table - horizontal scroll on mobile */}
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <div style={{ minWidth: '720px' }}>
                        {/* Table Header */}
                        <div
                          className="flex align-items-center"
                          style={{
                            background: 'var(--ios-surface-subtle)',
                            borderBottom: '1px solid var(--ios-divider)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: 'var(--ios-text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em'
                          }}
                        >
                          <div style={{ width: '40px' }}></div>
                          <div style={{ width: '300px' }} className="p-2 border-right-1 surface-border">
                            Ejercicio
                          </div>
                          <div style={{ width: '80px' }} className="p-2 border-right-1 surface-border text-center">
                            Series
                          </div>
                          <div style={{ width: '80px' }} className="p-2 border-right-1 surface-border text-center">
                            Reps
                          </div>
                          <div style={{ width: '80px' }} className="p-2 border-right-1 surface-border text-center">
                            Peso
                          </div>
                          <div style={{ width: '80px' }} className="p-2 border-right-1 surface-border text-center">
                            Duración
                          </div>
                          <div style={{ width: '60px' }} className="p-2 text-center">
                            Opc
                          </div>
                        </div>

                        {/* Exercise Rows */}
                        <SortableContext
                          items={group.exercises.map((exercise) => `exercise-${getExerciseKey(group.id, exercise)}`)}
                          strategy={verticalListSortingStrategy}
                        >
                          {group.exercises.map((exercise, exerciseIndex) => {
                            const exerciseKey = getExerciseKey(group.id, exercise);
                            const exerciseId = `exercise-${exerciseKey}`;
                            const globalIndex = groupIndex + exerciseIndex + 1;
                            const isDragOverExercise =
                              activeId &&
                              activeId.startsWith('exercise-') &&
                              overId === exerciseId &&
                              group.exercises.length === 0;

                            return (
                              <DragableRow
                                key={exerciseKey}
                                id={exerciseId}
                                data={exercise}
                                type="exercise"
                                disabled={isEditing}
                              >
                                {isDragOverExercise && (
                                  <div
                                    style={{
                                      height: '2px',
                                      background: '#6366f1',
                                      margin: '2px 0',
                                      borderRadius: '2px'
                                    }}
                                  />
                                )}
                                <div
                                  className="flex align-items-center"
                                  style={{
                                    borderBottom: '1px solid var(--ios-divider)',
                                    transition: 'background 0.15s ease'
                                  }}
                                >
                                  {/* Drag handle + insert */}
                                  <div
                                    style={{
                                      width: '40px',
                                      height: '44px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      position: 'relative',
                                      cursor: 'grab'
                                    }}
                                    onMouseMove={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const y = e.clientY - rect.top;
                                      if (y < rect.height / 2 && exerciseIndex > 0) {
                                        setInsertPosition('above');
                                      } else {
                                        setInsertPosition('below');
                                      }
                                      setHoverRowIndex(globalIndex);
                                      setShowInsertButton(true);
                                    }}
                                    onMouseLeave={() => {
                                      setTimeout(() => {
                                        if (!isInsertButtonHovered) {
                                          setHoverRowIndex(null);
                                          setShowInsertButton(false);
                                        }
                                      }, 50);
                                    }}
                                  >
                                    <FaGripVertical
                                      style={{
                                        color: 'var(--ios-text-tertiary)',
                                        fontSize: '0.75rem'
                                      }}
                                    />
                                    {showInsertButton && hoverRowIndex === globalIndex && (
                                      <Button
                                        icon="pi pi-plus"
                                        className="p-button-rounded p-button-sm"
                                        onMouseEnter={() => setIsInsertButtonHovered(true)}
                                        onMouseLeave={() => {
                                          setIsInsertButtonHovered(false);
                                          setHoverRowIndex(null);
                                          setShowInsertButton(false);
                                        }}
                                        onClick={() =>
                                          addExerciseAtPosition(groupIndex, exerciseIndex, insertPosition === 'above')
                                        }
                                        style={{
                                          position: 'absolute',
                                          left: '-10px',
                                          [insertPosition === 'above' ? 'top' : 'bottom']: '-12px',
                                          width: '22px',
                                          height: '22px',
                                          padding: 0,
                                          minWidth: '22px',
                                          background: '#6366f1',
                                          border: 'none'
                                        }}
                                        tooltip="Insertar ejercicio"
                                      />
                                    )}
                                  </div>

                                  {/* Exercise Dropdown */}
                                  <div style={{ width: '300px' }} className="p-2 border-right-1 surface-border">
                                    <ExerciseDropdown
                                      exercises={exercises}
                                      value={exercise.exercise?.id ?? null}
                                      onChange={(val) => updateExerciseSelection(group.id, exercise.id, val)}
                                      onFocus={() => setIsEditing(true)}
                                      onBlur={() => setIsEditing(false)}
                                    />
                                  </div>

                                  {/* Sets */}
                                  <div style={{ width: '80px' }} className="p-1 border-right-1 surface-border">
                                    <InputText
                                      className="w-full p-inputtext-sm text-center font-bold"
                                      value={exercise.sets || ''}
                                      onChange={(e) =>
                                        updateExerciseProperty(group.id, exercise.id, 'sets', e.target.value)
                                      }
                                      placeholder="3"
                                      onFocus={() => setIsEditing(true)}
                                      onBlur={() => setIsEditing(false)}
                                      onKeyDown={(e) => e.stopPropagation()}
                                      style={{
                                        borderRadius: 'var(--ios-radius-sm)'
                                      }}
                                    />
                                  </div>

                                  {/* Reps */}
                                  <div style={{ width: '80px' }} className="p-1 border-right-1 surface-border">
                                    <InputText
                                      className="w-full p-inputtext-sm text-center font-bold"
                                      value={exercise.repetitions || ''}
                                      onChange={(e) =>
                                        updateExerciseProperty(group.id, exercise.id, 'repetitions', e.target.value)
                                      }
                                      placeholder="10"
                                      onFocus={() => setIsEditing(true)}
                                      onBlur={() => setIsEditing(false)}
                                      onKeyDown={(e) => e.stopPropagation()}
                                      style={{
                                        borderRadius: 'var(--ios-radius-sm)'
                                      }}
                                    />
                                  </div>

                                  {/* Weight */}
                                  <div style={{ width: '80px' }} className="p-1 border-right-1 surface-border">
                                    <InputText
                                      className="w-full p-inputtext-sm text-center font-bold"
                                      value={exercise.weight || ''}
                                      onChange={(e) =>
                                        updateExerciseProperty(group.id, exercise.id, 'weight', e.target.value)
                                      }
                                      placeholder="10"
                                      onFocus={() => setIsEditing(true)}
                                      onBlur={() => setIsEditing(false)}
                                      onKeyDown={(e) => e.stopPropagation()}
                                      style={{
                                        borderRadius: 'var(--ios-radius-sm)'
                                      }}
                                    />
                                  </div>

                                  {/* Duration */}
                                  <div style={{ width: '80px' }} className="p-1 border-right-1 surface-border">
                                    <InputText
                                      className="w-full p-inputtext-sm text-center font-bold"
                                      value={exercise.duration || ''}
                                      onChange={(e) =>
                                        updateExerciseProperty(group.id, exercise.id, 'duration', e.target.value)
                                      }
                                      placeholder="10"
                                      onFocus={() => setIsEditing(true)}
                                      onBlur={() => setIsEditing(false)}
                                      onKeyDown={(e) => e.stopPropagation()}
                                      style={{
                                        borderRadius: 'var(--ios-radius-sm)'
                                      }}
                                    />
                                  </div>

                                  {/* Options */}
                                  <div style={{ width: '60px' }} className="p-1 flex gap-1 justify-content-center">
                                    <Button
                                      icon="pi pi-cog"
                                      className="p-button-sm p-button-text p-button-rounded"
                                      onClick={() => handleOpenSetConfigDialog(group, exercise)}
                                      tooltip="Configurar sets"
                                      style={{
                                        width: '1.5rem',
                                        height: '1.5rem',
                                        color: '#6366f1'
                                      }}
                                    />
                                    <Button
                                      icon="pi pi-trash"
                                      className="p-button-sm p-button-text p-button-rounded"
                                      onClick={() => removeExerciseFromGroup(group.id, exercise.id)}
                                      tooltip="Eliminar"
                                      style={{
                                        width: '1.5rem',
                                        height: '1.5rem',
                                        color: '#ef4444'
                                      }}
                                    />
                                  </div>
                                </div>
                              </DragableRow>
                            );
                          })}
                        </SortableContext>

                        {/* Drop indicator at end of group */}
                        {activeId && activeId.startsWith('exercise-') && overId === `group-${group.id}` && (
                          <div
                            style={{
                              height: '2px',
                              background: '#6366f1',
                              margin: '2px 0',
                              borderRadius: '2px'
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </DragableRow>
              ))}
            </SortableContext>

            {/* DragOverlay */}
            <DragOverlay>
              {activeId && activeGroup ? (
                <div
                  style={{
                    background: 'var(--ios-card-bg)',
                    borderRadius: 'var(--ios-radius-lg)',
                    boxShadow: 'var(--ios-shadow-xl)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    className="flex align-items-center font-bold p-3"
                    style={{
                      background: '#6366f1',
                      color: '#fff'
                    }}
                  >
                    <FaGripVertical className="mr-2" />
                    <span>
                      {activeGroup.data?.name ? activeGroup.data?.name : `Grupo ${activeGroup.data?.groupNumber}`}
                    </span>
                  </div>
                  {activeGroup.children?.map(
                    (
                      exercise: any // eslint-disable-line @typescript-eslint/no-explicit-any
                    ) => (
                      <div
                        key={exercise.key}
                        className="flex align-items-center gap-2 p-2"
                        style={{
                          borderBottom: '1px solid var(--ios-divider)',
                          fontSize: '0.85rem'
                        }}
                      >
                        <FaGripVertical
                          style={{
                            color: 'var(--ios-text-tertiary)',
                            fontSize: '0.7rem'
                          }}
                        />
                        <span className="flex-grow-1">{exercise.data?.name || 'Ejercicio'}</span>
                        <span style={{ color: 'var(--ios-text-secondary)' }}>
                          {exercise.sets || '-'} x {exercise.repetitions || '-'}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : activeId && activeExercise ? (
                <div
                  className="flex align-items-center gap-2 p-3"
                  style={{
                    background: 'var(--ios-card-bg)',
                    borderRadius: 'var(--ios-radius-md)',
                    boxShadow: 'var(--ios-shadow-xl)',
                    fontSize: '0.85rem'
                  }}
                >
                  <FaGripVertical
                    style={{
                      color: 'var(--ios-text-tertiary)',
                      fontSize: '0.7rem'
                    }}
                  />
                  <span className="flex-grow-1">{activeExercise.exercise?.name || 'Ejercicio'}</span>
                  <span style={{ color: 'var(--ios-text-secondary)' }}>
                    {activeExercise.sets || '-'} x {activeExercise.repetitions || '-'}
                  </span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <SetConfigDialog
        visible={visible}
        onHide={closeDialog}
        selectedExercise={selectedExercise}
        selectedGroup={selectedGroup}
        toggleSetConfiguration={toggleSetConfiguration}
        updateSetConfiguration={updateSetConfiguration}
      />
    </>
  );
};

import React, { useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FaGripVertical } from 'react-icons/fa';
import { Button } from 'primereact/button';

import { useUser } from '../../contexts/UserContext';
import { useNewCreatePlan } from '../../hooks/coach/useNewCreatePlan';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useSetConfigDialog } from '../../hooks/dialogs/useSetConfigDialog';
import { DragableRow } from '../../components/shared/DragableRow';
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
  const parsedParamId = planIdParam ? Number(planIdParam) : undefined;
  const paramPlanId = Number.isNaN(parsedParamId) ? undefined : parsedParamId;
  const statePlanId = state?.planId ? Number(state.planId) : undefined;
  const planId = !Number.isNaN(paramPlanId) && paramPlanId !== undefined ? paramPlanId : statePlanId;
  const isTemplate = state?.isTemplate ?? true;

  const {
    plan,
    groups,
    exercises,
    isLoading,
    isSaving,
    updatePlanName,
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
    isTemplate
  });

  const [isEditing, setIsEditing] = useState(false);

  const { visible, openDialog, closeDialog } = useSetConfigDialog();

  const dragAndDrop = useDragAndDrop(groups, setGroups) as {
    sensors: any;
    handleDragStart: (event: any) => void;
    handleDragEnd: (event: any) => void;
    handleDragOver: (event: any) => void;
    activeId: string | null;
    activeGroup: any;
    customCollisionDetection: any;
  };

  const { sensors, handleDragStart, handleDragEnd, handleDragOver, activeId, activeGroup, customCollisionDetection } =
    dragAndDrop;

  // Estado para rastrear sobre qué elemento estamos arrastrando
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

  if (isLoading) {
    return (
      <div className="p-4">
        <span>Cargando plan...</span>
      </div>
    );
  }

  return (
    <>
      <div className="p-4">
        <div className="flex justify-content-between align-items-center mb-4">
          <div className="flex-1">
            <label htmlFor="plan-name" className="block text-lg font-medium mb-2">
              Nombre del Plan
            </label>
            <InputText
              id="plan-name"
              value={plan.planName || ''}
              onChange={(e) => updatePlanName(e.target.value)}
              className="w-full"
              placeholder="Ingresa el nombre del plan"
            />
          </div>
          <div className="flex gap-2 ml-3">
            <Button icon="pi pi-plus" label="Agregar Grupo" onClick={addGroup} />
            <Button
              label="Guardar Plan"
              icon="pi pi-save"
              onClick={handleSavePlan}
              severity="success"
              loading={isSaving}
              disabled={isSaving}
            />
          </div>
        </div>
      </div>

      <div className="p-4 pt-0">
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
                  <div className="mb-1">
                    {/* Header del Grupo - Vista Excel */}
                    <div className="flex align-items-center p-1 bg-primary text-white border-round-top">
                      <FaGripVertical className="mr-2" style={{ cursor: 'grab' }} />
                      {editingGroupName !== group.groupNumber ? (
                        <div className="mr-2 font-bold" onClick={() => setEditingGroupName(group.groupNumber)}>
                          {group.name ? group.name : `Grupo ${group.groupNumber}`}
                        </div>
                      ) : (
                        <InputText
                          className="p-inputtext-sm "
                          value={group.name || ''}
                          onChange={(e) => updateGroupName(group.groupNumber, e.target.value)}
                          onFocus={() => setEditingGroupName(group.groupNumber)}
                          onBlur={() => setEditingGroupName(null)}
                          onKeyDown={(e) => e.stopPropagation()}
                          placeholder="Nombre del grupo"
                        />
                      )}
                      <Button
                        icon="pi pi-plus"
                        label="Ejercicio"
                        className="ml-2 p-button-sm p-button-rounded p-button-text"
                        onClick={() => addExerciseToGroup(group.id)}
                        tooltip="Agregar ejercicio"
                        style={{ color: 'white' }}
                      />
                    </div>

                    {/* Tabla de Ejercicios - Vista Excel */}
                    <div className="border-1 surface-border border-top-none">
                      {/* Header de la tabla */}
                      <div className="flex align-items-center bg-gray-500 font-bold text-sm border-bottom-1 surface-border">
                        <div style={{ width: '40px' }}></div>
                        <div style={{ width: '300px' }} className="p-2 border-right-1 surface-border">
                          Ejercicio
                        </div>
                        <div style={{ width: '100px' }} className="p-2 border-right-1 surface-border text-center">
                          Series
                        </div>
                        <div style={{ width: '100px' }} className="p-2 border-right-1 surface-border text-center">
                          Repeticiones
                        </div>
                        <div style={{ width: '100px' }} className="p-2 border-right-1 surface-border text-center">
                          Peso
                        </div>
                        <div style={{ width: '100px' }} className="p-2 border-right-1 surface-border text-center">
                          Duración
                        </div>
                        <div style={{ width: '80px' }} className="p-2 text-center">
                          Opciones
                        </div>
                      </div>

                      {/* Filas de ejercicios */}
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
                              {/* Indicador de inserción arriba cuando arrastras sobre este ejercicio */}
                              {isDragOverExercise && (
                                <div
                                  style={{
                                    height: '2px',
                                    background: '#3b82f6',
                                    margin: '2px 0',
                                    borderRadius: '2px'
                                  }}
                                />
                              )}
                              <div className="flex align-items-center border-bottom-1 surface-border hover:surface-100 transition-colors transition-duration-150">
                                {/* Área de hover para inserción */}
                                <div
                                  style={{
                                    width: '40px',
                                    height: '50px',
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
                                  <FaGripVertical className="text-500" />
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
                                        width: '24px',
                                        height: '24px',
                                        padding: 0,
                                        minWidth: '24px'
                                      }}
                                      tooltip="Insertar ejercicio"
                                    />
                                  )}
                                </div>

                                {/* Dropdown de ejercicio */}
                                <div style={{ width: '300px' }} className="p-2 border-right-1 surface-border">
                                  <Dropdown
                                    className="w-full p-inputtext-sm"
                                    options={exercises}
                                    optionLabel="name"
                                    optionValue="id"
                                    placeholder="Seleccionar ejercicio"
                                    value={exercise.exercise?.id ?? null}
                                    onChange={(e) => updateExerciseSelection(group.id, exercise.id, e.value)}
                                    filter
                                    showClear
                                    onFocus={() => setIsEditing(true)}
                                    onBlur={() => setIsEditing(false)}
                                  />
                                </div>

                                {/* Series */}
                                <div style={{ width: '100px' }} className="p-2 border-right-1 surface-border">
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
                                  />
                                </div>

                                {/* Repeticiones */}
                                <div style={{ width: '100px' }} className="p-2 border-right-1 surface-border">
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
                                  />
                                </div>

                                {/* Peso */}
                                <div style={{ width: '100px' }} className="p-2 border-right-1 surface-border">
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
                                  />
                                </div>

                                {/* Duración */}
                                <div style={{ width: '100px' }} className="p-2 border-right-1 surface-border">
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
                                  />
                                </div>

                                {/* Opciones */}
                                <div style={{ width: '80px' }} className="p-2 flex gap-1 justify-content-center">
                                  <Button
                                    icon="pi pi-cog"
                                    className="p-button-sm p-button-text p-button-rounded"
                                    onClick={() => handleOpenSetConfigDialog(group, exercise)}
                                    tooltip="Configurar sets"
                                  />
                                  <Button
                                    icon="pi pi-trash"
                                    className="p-button-sm p-button-text p-button-rounded p-button-danger"
                                    onClick={() => removeExerciseFromGroup(group.id, exercise.id)}
                                    tooltip="Eliminar"
                                  />
                                </div>
                              </div>
                            </DragableRow>
                          );
                        })}
                      </SortableContext>
                      {/* Indicador cuando arrastras sobre un grupo (al final de la lista de ejercicios o grupo vacío) */}
                      {activeId && activeId.startsWith('exercise-') && overId === `group-${group.id}` && (
                        <div
                          style={{
                            height: '2px',
                            background: '#3b82f6',
                            margin: '2px 0',
                            borderRadius: '2px'
                          }}
                        />
                      )}
                    </div>
                  </div>
                </DragableRow>
              ))}
            </SortableContext>

            {/* DragOverlay */}
            <DragOverlay>
              {activeId && activeGroup ? (
                <div>
                  <div className="flex align-items-center font-bold p-3 bg-primary text-white border-round">
                    <FaGripVertical className="mr-2" />
                    <span>
                      {activeGroup.data?.name ? activeGroup.data?.name : `Grupo ${activeGroup.data?.groupNumber}`}
                    </span>
                  </div>
                  {activeGroup.children?.map((exercise: any) => (
                    <div key={exercise.key} className="surface-card shadow-3 border-round p-3 flex flex-row gap-2">
                      <div className="flex align-items-center " style={{ width: '300px' }}>
                        <FaGripVertical className="mr-2" />
                        <span>{exercise.data?.name || 'Ejercicio'}</span>
                      </div>

                      <div className="flex align-items-center border-left-1 surface-border">
                        <div className="text-center border-right-1 surface-border" style={{ width: '100px' }}>
                          {exercise.sets || 'N/A'}
                        </div>
                        <div className="text-center border-right-1 surface-border" style={{ width: '100px' }}>
                          {exercise.repetitions || 'N/A'}
                        </div>
                        <div className="text-center border-right-1 surface-border" style={{ width: '100px' }}>
                          {exercise.weight || 'N/A'}
                        </div>
                        <div className="text-center border-right-1 surface-border" style={{ width: '100px' }}>
                          {exercise.duration || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeId && activeExercise ? (
                <div className="surface-card shadow-3 border-round p-3 flex flex-row gap-2">
                  <div className="flex align-items-center" style={{ width: '300px' }}>
                    <FaGripVertical className="mr-2" />
                    <span>{activeExercise.exercise?.name || 'Ejercicio'}</span>
                  </div>

                  <div className="flex align-items-center border-left-1 surface-border">
                    <div className="text-center border-right-1 surface-border" style={{ width: '100px' }}>
                      {activeExercise.sets || 'N/A'}
                    </div>
                    <div className="text-center border-right-1 surface-border" style={{ width: '100px' }}>
                      {activeExercise.repetitions || 'N/A'}
                    </div>
                    <div className="text-center border-right-1 surface-border" style={{ width: '100px' }}>
                      {activeExercise.weight || 'N/A'}
                    </div>
                    <div className="text-center border-right-1 surface-border" style={{ width: '100px' }}>
                      {activeExercise.duration || 'N/A'}
                    </div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Dialog de configuración de sets */}
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

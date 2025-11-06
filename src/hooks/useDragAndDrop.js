import { useState } from 'react';
import { PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';

export const useDragAndDrop = (groups, setGroups) => {
  const [activeId, setActiveId] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const getExerciseKey = (groupId, exercise) => exercise.dragId ?? `${groupId}::${exercise.id}`;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const customCollisionDetection = closestCenter;

  const handleDragStart = (event) => {
    const id = event.active.id;
    setActiveId(id);
    if (id.startsWith('group-')) {
      const groupId = id.replace('group-', '');
      const group = groups.find((g) => g.id == groupId);
      setActiveGroup(
        group
          ? {
              key: `group-${group.id}`,
              data: { groupNumber: group.groupNumber, name: group.name },
              children: group.exercises.map((exercise) => ({
                key: `exercise-${getExerciseKey(group.id, exercise)}`,
                data: {
                  name: exercise.exercise?.name ?? exercise.name ?? '',
                  id: exercise.id
                }
              }))
            }
          : null
      );
    } else {
      setActiveGroup(null);
    }
  };

  // Manejar drag over (cuando arrastras sobre otro elemento)
  const handleDragOver = (event) => {
    // Esta función puede ser usada para mostrar indicadores visuales durante el drag
    // Por ahora no necesitamos hacer nada aquí, pero la exponemos por si acaso
  };

  // Manejar fin de drag
  const handleDragEnd = (result) => {
    setActiveId(null);
    setActiveGroup(null);
    const { active, over } = result;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Si es el mismo elemento, no hacer nada
    if (activeId === overId) return;

    // Identificar si es grupo o ejercicio
    if (activeId.startsWith('group-') && overId.startsWith('group-')) {
      // Mover grupos
      moveGroup(activeId, overId);
    } else if (activeId.startsWith('exercise-') && overId.startsWith('exercise-')) {
      // Mover ejercicios entre grupos
      moveExercise(activeId, overId);
    } else if (activeId.startsWith('exercise-') && overId.startsWith('group-')) {
      moveExercise(activeId, overId);
    }
  };

  // Función para mover grupos
  const moveGroup = (activeId, overId) => {
    const newGroups = groups.map((group) => ({
      ...group,
      exercises: [...group.exercises]
    }));
    const activeIndex = newGroups.findIndex((g) => g.id === activeId.replace('group-', ''));
    const overIndex = newGroups.findIndex((g) => g.id === overId.replace('group-', ''));

    if (activeIndex !== -1 && overIndex !== -1) {
      const [movedGroup] = newGroups.splice(activeIndex, 1);
      newGroups.splice(overIndex, 0, movedGroup);

      setGroups(
        newGroups.map((group, index) => ({
          ...group,
          groupNumber: index + 1
        }))
      );
    }
  };

  // Función para mover ejercicios
  const moveExercise = (activeId, overId) => {
    const newGroups = groups.map((group) => ({
      ...group,
      exercises: [...group.exercises]
    }));
    const activeExerciseKey = activeId.replace('exercise-', '');
    const overIsGroup = overId.startsWith('group-');
    const overExerciseKey = overIsGroup ? null : overId.replace('exercise-', '');

    // Encontrar el ejercicio activo y su grupo
    let activeExercise = null;
    let activeGroupIndex = -1;
    let activeExerciseIndex = -1;

    newGroups.forEach((group, groupIndex) => {
      group.exercises.forEach((exercise, exerciseIndex) => {
        const key = getExerciseKey(group.id, exercise);
        if (key === activeExerciseKey) {
          activeExercise = exercise;
          activeGroupIndex = groupIndex;
          activeExerciseIndex = exerciseIndex;
        }
      });
    });

    // Encontrar el ejercicio objetivo y su grupo
    let overGroupIndex = -1;
    let overExerciseIndex = -1;

    if (overIsGroup) {
      overGroupIndex = newGroups.findIndex((group) => group.id == overId.replace('group-', ''));
      overExerciseIndex = overGroupIndex !== -1 ? newGroups[overGroupIndex].exercises.length : -1;
    } else {
      newGroups.forEach((group, groupIndex) => {
        group.exercises.forEach((exercise, exerciseIndex) => {
          const key = getExerciseKey(group.id, exercise);

          if (key === overExerciseKey) {
            overGroupIndex = groupIndex;
            overExerciseIndex = exerciseIndex;
          }
        });
      });
    }

    const canInsert = overIsGroup || overExerciseIndex !== -1;

    if (activeExercise && activeGroupIndex !== -1 && overGroupIndex !== -1 && canInsert) {
      // Agregar ejercicio al grupo destino
      const destinationExercises = newGroups[overGroupIndex].exercises;

      // Determinar si se está moviendo hacia arriba o abajo ANTES de ajustar insertIndex
      // Usamos overExerciseIndex original para determinar la dirección real
      let isMovingUp = false;
      let isMovingDown = false;

      if (activeGroupIndex === overGroupIndex) {
        // Mismo grupo: comparar índices originales
        if (!overIsGroup) {
          // Si arrastras sobre otro ejercicio, comparar con overExerciseIndex
          if (activeExerciseIndex < overExerciseIndex) {
            isMovingDown = true;
          } else if (activeExerciseIndex > overExerciseIndex) {
            isMovingUp = true;
          }
        } else {
          // Si arrastras sobre el grupo (al final), siempre es hacia abajo
          isMovingDown = true;
        }
      } else {
        // Diferente grupo: considerar posición global
        let activeGlobalIndex = activeExerciseIndex;
        for (let i = 0; i < activeGroupIndex; i++) {
          activeGlobalIndex += newGroups[i].exercises.length;
        }

        let targetGlobalIndex = overIsGroup ? newGroups[overGroupIndex].exercises.length : overExerciseIndex;
        for (let i = 0; i < overGroupIndex; i++) {
          targetGlobalIndex += newGroups[i].exercises.length;
        }

        if (activeGlobalIndex < targetGlobalIndex) {
          isMovingDown = true;
        } else if (activeGlobalIndex > targetGlobalIndex) {
          isMovingUp = true;
        }
      }

      // Remover ejercicio del grupo origen PRIMERO
      newGroups[activeGroupIndex].exercises.splice(activeExerciseIndex, 1);

      // Ahora calcular el insertIndex correcto DESPUÉS de remover
      // Esto es importante porque destinationExercises se actualiza cuando removemos del mismo grupo
      let insertIndex;

      if (overIsGroup) {
        // Si arrastras sobre un grupo, insertar al final
        insertIndex = destinationExercises.length;
      } else if (activeGroupIndex === overGroupIndex) {
        // Mismo grupo: necesitamos ajustar el índice después de remover
        if (activeExerciseIndex < overExerciseIndex) {
          // Moviendo hacia abajo: después de remover activeExerciseIndex,
          // el ejercicio que estaba en overExerciseIndex ahora está en overExerciseIndex - 1
          // Queremos insertar DESPUÉS de ese ejercicio (en overExerciseIndex)
          insertIndex = overExerciseIndex;
        } else {
          // Moviendo hacia arriba: los índices de los ejercicios anteriores no cambian
          insertIndex = overExerciseIndex;
        }
      } else {
        // Diferente grupo: el índice no cambia porque removimos de otro grupo
        insertIndex = overExerciseIndex;
      }

      // Asegurar que el índice esté dentro del rango válido
      if (insertIndex < 0 || insertIndex > destinationExercises.length) {
        insertIndex = destinationExercises.length;
      }

      destinationExercises.splice(insertIndex, 0, activeExercise);

      newGroups[overGroupIndex].exercises = newGroups[overGroupIndex].exercises.map((exercise, index) => ({
        ...exercise,
        rowIndex: index
      }));

      if (activeGroupIndex !== overGroupIndex && activeGroupIndex !== -1) {
        newGroups[activeGroupIndex].exercises = newGroups[activeGroupIndex].exercises.map((exercise, index) => ({
          ...exercise,
          rowIndex: index
        }));
      }

      setGroups(newGroups);
    }
  };

  return {
    // Sensores
    sensors,

    // Funciones de drag
    handleDragStart,
    handleDragEnd,
    handleDragOver,

    // Estado activo
    activeId,
    activeGroup,

    // Detección de colisión
    customCollisionDetection
  };
};

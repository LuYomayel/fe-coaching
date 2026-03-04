/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { PointerSensor, useSensor, useSensors, closestCenter, DragStartEvent, DragEndEvent } from '@dnd-kit/core';

interface IDragGroupChild {
  key: string;
  data: { name: string; id: number | string };
}

interface IActiveGroup {
  key: string;
  data: { groupNumber: number; name?: string };
  children: IDragGroupChild[];
}

export const useDragAndDrop = (groups: any[], setGroups: (groups: any[]) => void) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<IActiveGroup | null>(null);
  const getExerciseKey = (groupId: string | number, exercise: any): string =>
    exercise.dragId ?? `${groupId}::${exercise.id}`;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const customCollisionDetection = closestCenter;

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveId(id);
    if (id.startsWith('group-')) {
      const groupId = id.replace('group-', '');
      // eslint-disable-next-line eqeqeq
      const group = groups.find((g: any) => g.id == groupId);
      setActiveGroup(
        group
          ? {
              key: `group-${group.id}`,
              data: { groupNumber: group.groupNumber, name: group.name },
              children: group.exercises.map((exercise: any) => ({
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

  const handleDragOver = () => {
    // Visual indicator during drag - no action needed
  };

  const handleDragEnd = (result: DragEndEvent) => {
    setActiveId(null);
    setActiveGroup(null);
    const { active, over } = result;

    if (!over) return;

    const activeIdStr = String(active.id);
    const overId = String(over.id);

    if (activeIdStr === overId) return;

    if (activeIdStr.startsWith('group-') && overId.startsWith('group-')) {
      moveGroup(activeIdStr, overId);
    } else if (activeIdStr.startsWith('exercise-') && overId.startsWith('exercise-')) {
      moveExercise(activeIdStr, overId);
    } else if (activeIdStr.startsWith('exercise-') && overId.startsWith('group-')) {
      moveExercise(activeIdStr, overId);
    }
  };

  const moveGroup = (activeIdStr: string, overId: string) => {
    const newGroups = groups.map((group: any) => ({
      ...group,
      exercises: [...group.exercises]
    }));
    // eslint-disable-next-line eqeqeq
    const activeIndex = newGroups.findIndex((g: any) => g.id == activeIdStr.replace('group-', ''));
    // eslint-disable-next-line eqeqeq
    const overIndex = newGroups.findIndex((g: any) => g.id == overId.replace('group-', ''));

    if (activeIndex !== -1 && overIndex !== -1) {
      const [movedGroup] = newGroups.splice(activeIndex, 1);
      newGroups.splice(overIndex, 0, movedGroup);

      setGroups(
        newGroups.map((group: any, index: number) => ({
          ...group,
          groupNumber: index + 1
        }))
      );
    }
  };

  const moveExercise = (activeIdStr: string, overId: string) => {
    const newGroups = groups.map((group: any) => ({
      ...group,
      exercises: [...group.exercises]
    }));
    const activeExerciseKey = activeIdStr.replace('exercise-', '');
    const overIsGroup = overId.startsWith('group-');
    const overExerciseKey = overIsGroup ? null : overId.replace('exercise-', '');

    let activeExercise: any = null;
    let activeGroupIndex = -1;
    let activeExerciseIndex = -1;

    newGroups.forEach((group: any, groupIndex: number) => {
      group.exercises.forEach((exercise: any, exerciseIndex: number) => {
        const key = getExerciseKey(group.id, exercise);
        if (key === activeExerciseKey) {
          activeExercise = exercise;
          activeGroupIndex = groupIndex;
          activeExerciseIndex = exerciseIndex;
        }
      });
    });

    let overGroupIndex = -1;
    let overExerciseIndex = -1;

    if (overIsGroup) {
      // eslint-disable-next-line eqeqeq
      overGroupIndex = newGroups.findIndex((group: any) => group.id == overId.replace('group-', ''));
      overExerciseIndex = overGroupIndex !== -1 ? newGroups[overGroupIndex].exercises.length : -1;
    } else {
      newGroups.forEach((group: any, groupIndex: number) => {
        group.exercises.forEach((exercise: any, exerciseIndex: number) => {
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
      const destinationExercises = newGroups[overGroupIndex].exercises;

      newGroups[activeGroupIndex].exercises.splice(activeExerciseIndex, 1);

      let insertIndex: number;

      if (overIsGroup) {
        insertIndex = destinationExercises.length;
      } else if (activeGroupIndex === overGroupIndex) {
        insertIndex = overExerciseIndex;
      } else {
        insertIndex = overExerciseIndex;
      }

      if (insertIndex < 0 || insertIndex > destinationExercises.length) {
        insertIndex = destinationExercises.length;
      }

      destinationExercises.splice(insertIndex, 0, activeExercise);

      newGroups[overGroupIndex].exercises = newGroups[overGroupIndex].exercises.map((exercise: any, index: number) => ({
        ...exercise,
        rowIndex: index
      }));

      if (activeGroupIndex !== overGroupIndex && activeGroupIndex !== -1) {
        newGroups[activeGroupIndex].exercises = newGroups[activeGroupIndex].exercises.map(
          (exercise: any, index: number) => ({
            ...exercise,
            rowIndex: index
          })
        );
      }

      setGroups(newGroups);
    }
  };

  return {
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    activeId,
    activeGroup,
    customCollisionDetection
  };
};

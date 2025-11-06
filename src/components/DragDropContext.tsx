import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode } from 'react';
import { IExerciseGroup } from 'types/workout/exercise-group';
import { IExerciseInstance } from 'types/workout/exercise-instance';

export interface DragDropContextProps {
  children: ReactNode;
  onDragEnd: (event: DragEndEvent) => void;
}
export const DragDropContext = ({ children, onDragEnd }: DragDropContextProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      // Convertir el evento de @dnd-kit al formato de react-beautiful-dnd
      const dragEndEvent = {
        source: {
          droppableId: active.data.current?.sortable?.containerId || 'groups',
          index: active.data.current?.sortable?.index || 0
        },
        destination: {
          droppableId: over?.data.current?.sortable?.containerId || 'groups',
          index: over?.data.current?.sortable?.index || 0
        },
        draggableId: active.id,
        type: active.data.current?.type || 'group'
      };

      onDragEnd(dragEndEvent as unknown as DragEndEvent);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {children}
    </DndContext>
  );
};

/**
 * Componente Droppable usando @dnd-kit
 */
export interface DroppableProps {
  children: ReactNode;
  direction?: 'horizontal' | 'vertical';
}
export const Droppable = ({ children, direction = 'vertical' }: DroppableProps) => {
  const strategy = direction === 'horizontal' ? horizontalListSortingStrategy : verticalListSortingStrategy;

  return (
    <SortableContext
      items={[]} // Necesario para @dnd-kit
      strategy={strategy}
    >
      {children}
    </SortableContext>
  );
};

/**
 * Componente Draggable usando @dnd-kit
 */
export interface DraggableProps {
  children: ReactNode;
  draggableId: string;
  index: number;
  isDragDisabled?: boolean;
  type?: string;
}
export const Draggable = ({ children, draggableId, index, isDragDisabled = false, type = 'group' }: DraggableProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: draggableId,
    disabled: isDragDisabled,
    data: {
      type,
      sortable: {
        containerId: 'groups',
        index
      }
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

/**
 * Hook para manejar drag and drop de grupos
 */
export interface UseDragDropProps {
  groups: IExerciseGroup[];
  setGroups: (groups: IExerciseGroup[]) => void;
}
export const useDragDrop = (groups: IExerciseGroup[], setGroups: (groups: IExerciseGroup[]) => void) => {
  const handleDragEnd = (result: {
    source: { droppableId: string; index: number };
    destination: { droppableId: string; index: number };
    type: string;
  }) => {
    if (!result.destination) {
      return;
    }

    const { source, destination, type } = result;

    if (type === 'group') {
      // Reordenar grupos
      const newGroups = Array.from(groups);
      const [reorderedGroup] = newGroups.splice(source.index, 1);
      newGroups.splice(destination.index, 0, reorderedGroup as IExerciseGroup);
      setGroups(newGroups);
    } else if (type === 'exercise') {
      // Mover ejercicio entre grupos o dentro del mismo grupo
      const sourceGroupIndex = parseInt(source.droppableId.replace('group-', ''));
      const destGroupIndex = parseInt(destination.droppableId.replace('group-', ''));

      const newGroups = [...groups];
      const sourceGroup = newGroups[sourceGroupIndex];
      const sourceExercises = [...(sourceGroup?.exercises ?? [])];

      if (sourceGroupIndex === destGroupIndex) {
        // Mover dentro del mismo grupo
        const [movedExercise] = sourceExercises.splice(source.index, 1);
        sourceExercises.splice(destination.index, 0, movedExercise as IExerciseInstance);
        newGroups[sourceGroupIndex] = {
          ...(sourceGroup as IExerciseGroup),
          exercises: sourceExercises
        };
      } else {
        // Mover entre grupos
        const destGroup = newGroups[destGroupIndex];
        const destExercises = [...(destGroup?.exercises ?? [])];
        const [movedExercise] = sourceExercises.splice(source.index, 1);
        destExercises.splice(destination.index, 0, movedExercise as IExerciseInstance);

        if (sourceGroup && destGroup) {
          newGroups[sourceGroupIndex] = {
            ...sourceGroup,
            exercises: sourceExercises
          };
          newGroups[destGroupIndex] = {
            ...destGroup,
            exercises: destExercises
          };
        }
      }

      setGroups(newGroups);
    }
  };

  return { handleDragEnd };
};

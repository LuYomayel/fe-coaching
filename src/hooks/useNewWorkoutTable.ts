/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api-client';
import { getYouTubeThumbnail, extractYouTubeVideoId } from '../utils/UtilFunctions';

// ==================== CONSTANTS ====================

export const properties: string[] = [
  'sets',
  'repetitions',
  'weight',
  'time',
  'restInterval',
  'tempo',
  'notes',
  'difficulty',
  'duration',
  'distance',
  'rpe'
];

// ==================== INTERFACES ====================

export interface INewWorkoutTableProps {
  cycleOptions: Array<{ label: string; value: number }>;
  clientData: Record<string, any>;
  isExcelOnlyMode?: boolean;
  clientName?: string;
  onToggleExcelMode?: () => void;
}

export interface ITableRowBase {
  rowType: 'group' | 'exercise';
  groupNumber: number;
  rowIndex: number;
  isNew?: boolean;
  weeksData: Record<number, Record<string, any>>;
  isBeingDragged?: boolean;
  isDragDisabled?: boolean;
}

export interface ITableGroupRow extends ITableRowBase {
  rowType: 'group';
  label?: string;
  isRestPeriod?: boolean;
}

export interface ITableExerciseRow extends ITableRowBase {
  rowType: 'exercise';
  name: string;
  exerciseId?: number | null;
  exerciseInstanceId?: number | null;
}

export type ITableRow = ITableGroupRow | ITableExerciseRow;

export interface IChanges {
  newExercises: Record<string, any>[];
  movedExercises: Record<string, any>[];
  movedGroups: Record<string, any>[];
  updatedProperties: Record<string, any>[];
  deletedExercises: number[];
}

export interface IDayOption {
  label: string;
  value: number;
}

export interface IPropertyLabels {
  [key: string]: string;
}

export interface IHeaderGroupResult {
  usedProps: string[][];
  headerGroup: any;
}

// ==================== HOOK ====================

export function useNewWorkoutTable({ clientData }: INewWorkoutTableProps) {
  const { user, coach } = useUser();
  const { showToast } = useToast();
  const intl = useIntl();
  const { isDarkMode } = useTheme();

  // Fixed display order and extra columns state
  const defaultPropsOrder = ['sets', 'repetitions', 'weight'];
  const [extraProps, setExtraProps] = useState<string[]>([]);
  const [propDialogVisible, setPropDialogVisible] = useState(false);
  const [newProp, setNewProp] = useState<string | null>(null);
  const availableProps = properties.filter(
    (p) => !defaultPropsOrder.includes(p) && p !== 'rpe' && !extraProps.includes(p)
  );

  const [isEditing, setIsEditing] = useState(false);
  const [cycleId, setCycleId] = useState<number | null>(null);
  const [dayNumber, setDayNumber] = useState<number | null>(null);
  const [excelData, setExcelData] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [numWeeks, setNumWeeks] = useState(0);

  // Single array for both group rows and exercise rows
  const [tableData, setTableData] = useState<ITableRow[]>([]);

  const [refreshTable, setRefreshTable] = useState(0);
  const [propertiesUsedByWeek, setPropertiesUsedByWeek] = useState<string[][]>([]);

  const [coachExercises, setCoachExercises] = useState<any[]>([]);
  const [rpeMethod, setrpeMethod] = useState<any>(null);
  const [workoutInstanceId, setWorkoutInstanceId] = useState<number | null>(null);
  const [isDraggingGroup, setIsDraggingGroup] = useState(false);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<number | null>(null);

  const [newCycleDialogVisible, setNewCycleDialogVisible] = useState(false);

  // Sensors for drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const [originalData, setOriginalData] = useState<ITableRow[] | null>(null);
  const [deletedExercises, setDeletedExercises] = useState<number[]>([]);
  const [daysUsed, setDaysUsed] = useState<number[]>([]);

  // States for dynamic insert button
  const [hoverRowIndex, setHoverRowIndex] = useState<number | null>(null);
  const [showInsertButton, setShowInsertButton] = useState(false);
  const [isInsertButtonHovered, setIsInsertButtonHovered] = useState(false);
  const [insertPosition, setInsertPosition] = useState<'above' | 'below'>('below');

  const dayOptions: IDayOption[] = [
    { label: intl.formatMessage({ id: 'workoutTable.monday' }), value: 1 },
    { label: intl.formatMessage({ id: 'workoutTable.tuesday' }), value: 2 },
    { label: intl.formatMessage({ id: 'workoutTable.wednesday' }), value: 3 },
    { label: intl.formatMessage({ id: 'workoutTable.thursday' }), value: 4 },
    { label: intl.formatMessage({ id: 'workoutTable.friday' }), value: 5 },
    { label: intl.formatMessage({ id: 'workoutTable.saturday' }), value: 6 },
    { label: intl.formatMessage({ id: 'workoutTable.sunday' }), value: 7 }
  ];

  const propertyLabels: IPropertyLabels = {
    sets: intl.formatMessage({ id: 'exercise.properties.sets' }),
    repetitions: intl.formatMessage({ id: 'exercise.properties.reps' }),
    weight: intl.formatMessage({ id: 'exercise.properties.weight' }),
    time: intl.formatMessage({ id: 'exercise.properties.time' }),
    tempo: intl.formatMessage({ id: 'exercise.properties.tempo' }),
    restInterval: intl.formatMessage({ id: 'exercise.properties.restInterval' }),
    notes: intl.formatMessage({ id: 'exercise.properties.notes' }),
    difficulty: intl.formatMessage({ id: 'exercise.properties.difficulty' }),
    duration: intl.formatMessage({ id: 'exercise.properties.duration' }),
    distance: intl.formatMessage({ id: 'exercise.properties.distance' })
  };

  const tableStyles: Record<string, any> = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    minWidth: '800px'
  };

  const rowClassName = (rowData: ITableRow): string => {
    const baseClass = 'workout-table-row';

    if (rowData.rowType === 'group') {
      return `${baseClass} group-row`;
    }

    if (isDarkMode) {
      return rowData.groupNumber % 2 === 0
        ? `${baseClass} group-even-dark improved-row`
        : `${baseClass} group-odd-dark improved-row`;
    } else {
      return rowData.groupNumber % 2 === 0
        ? `${baseClass} group-even improved-row`
        : `${baseClass} group-odd improved-row`;
    }
  };

  // ==================== EFFECTS ====================

  // Fetch coach exercises
  useEffect(() => {
    if (!user?.userId) return;
    const fetchData = async () => {
      try {
        const response = await api.exercise.fetchCoachExercises({});
        setCoachExercises(response.data?.items || []);
      } catch (err) {
        console.error('Error fetching coach exercises:', err);
      }
    };
    fetchData();
  }, [user]); // eslint-disable-line

  // Fetch RPE method
  useEffect(() => {
    if (!clientData.id || !cycleId || !workoutInstanceId) return;

    const fetchData = async () => {
      try {
        const { data } = await api.rpe.getRpeMethodAssigned(clientData.id, workoutInstanceId, cycleId);
        setrpeMethod(data);
      } catch (err) {
        console.error('Error fetching rpe methods:', err);
      }
    };
    fetchData();
  }, [clientData, cycleId, workoutInstanceId]); // eslint-disable-line

  // Fetch ExcelView
  useEffect(() => {
    if (!cycleId || !dayNumber) return;
    const doFetch = async () => {
      try {
        setIsLoading(true);
        const response = await api.workout.fetchExcelViewByCycleAndDay(cycleId, dayNumber);
        // Find any workoutInstance with an instanceId
        let foundWorkoutInstanceId: number | null = null;
        for (const week of response.data.weeks) {
          for (const session of week.sessions) {
            for (const instance of session.workoutInstances) {
              if (instance.instanceId) {
                foundWorkoutInstanceId = instance.instanceId;
                break;
              }
            }
            if (foundWorkoutInstanceId) break;
          }
          if (foundWorkoutInstanceId) break;
        }
        setWorkoutInstanceId(foundWorkoutInstanceId);
        setNumWeeks(response.data.weeks.length);
        setExcelData(response.data);
      } catch (error: any) {
        showToast('error', 'Error', error.message || 'Error fetching excel view');
      } finally {
        setIsLoading(false);
      }
    };
    if (cycleId !== -1) doFetch();
  }, [cycleId, dayNumber, showToast, refreshTable]); // eslint-disable-line

  // Detect days with workouts
  useEffect(() => {
    if (!cycleId) return;
    else if (cycleId === -1) {
      if (clientData.user.subscription.status === 'Active') setNewCycleDialogVisible(true);
      else
        showToast(
          'error',
          'Error',
          intl.formatMessage({
            id: 'student.error.noSubscription'
          })
        );
      return;
    }
    const fetchDaysWithWorkouts = async () => {
      try {
        const usedDays: number[] = [];
        for (let day = 1; day <= 7; day++) {
          try {
            const response = await api.workout.fetchExcelViewByCycleAndDay(cycleId, day);
            if (
              response.data?.weeks?.length > 0 &&
              response.data.weeks.some((week: any) =>
                week.sessions.some((session: any) =>
                  session.workoutInstances.some((instance: any) => instance.groups.length > 0)
                )
              )
            ) {
              usedDays.push(day);
            }
          } catch {
            // If there's an error, assume no data for that day
          }
        }
        setDaysUsed(usedDays);
      } catch (error) {
        console.error('Error fetching days with workouts:', error);
      }
    };

    fetchDaysWithWorkouts();
  }, [cycleId]); // eslint-disable-line

  // Build table data
  useEffect(() => {
    if (excelData?.weeks) {
      const built = buildRowsWithGroups(excelData);
      setTableData(built);
      setOriginalData(JSON.parse(JSON.stringify(built)));
    }
  }, [excelData]); // eslint-disable-line

  // Compute properties used by week
  useEffect(() => {
    if (!tableData || !tableData.length || !numWeeks) return;
    const usedProps: Record<number, string[]> = {};
    for (let i = 1; i <= numWeeks; i++) usedProps[i] = [];

    tableData.forEach((row) => {
      if (row.rowType === 'exercise') {
        for (let w = 1; w <= numWeeks; w++) {
          const weekData = row.weeksData[w];
          if (weekData) {
            Object.keys(weekData).forEach((prop) => {
              const weekProps = usedProps[w]!;
              if (properties.includes(prop) && !weekProps.includes(prop)) {
                weekProps.push(prop);
              }
            });
          }
        }
      }
    });
    setPropertiesUsedByWeek(Object.values(usedProps));
  }, [tableData, numWeeks]); // eslint-disable-line

  // Refs
  const firstColumnRef = useRef<HTMLTableCellElement>(null);
  // eslint-disable-line
  const [isHoveringFirstColumn, setIsHoveringFirstColumn] = useState(false);

  useEffect(() => {
    if (isEditing && isHoveringFirstColumn) {
      setShowInsertButton(true);
    }

    return () => undefined;
  }, [isHoveringFirstColumn, isEditing]); // eslint-disable-line

  // ==================== UTILITY FUNCTIONS ====================

  function buildRowsWithGroups(data: Record<string, any>): ITableRow[] {
    const groupMap = new Map<string | number, ITableRow>();

    data.weeks.forEach((week: any) => {
      week.sessions.forEach((session: any) => {
        session.workoutInstances.forEach((instance: any) => {
          instance.groups.forEach((group: any) => {
            const groupNumber = group.groupNumber;

            if (!groupMap.has(groupNumber)) {
              groupMap.set(groupNumber, {
                rowType: 'group',
                groupNumber: groupNumber,
                rowIndex: groupNumber * 100,
                isNew: false,
                isRestPeriod: group.isRestPeriod,
                label: group.isRestPeriod
                  ? `${group.name} - ${group.restDuration}`
                  : group.name
                    ? group.name
                    : `${intl.formatMessage({ id: 'common.group' })} ${groupNumber}`,
                weeksData: {}
              } as ITableGroupRow);
            }

            group.exercises.forEach((ex: any) => {
              const exKey = `${groupNumber}--${ex.exerciseName}`;

              if (!groupMap.has(exKey)) {
                groupMap.set(exKey, {
                  rowType: 'exercise',
                  isNew: false,
                  name: ex.exerciseName,
                  groupNumber: groupNumber,
                  exerciseInstanceId: ex.exerciseInstanceId,
                  rowIndex: ex.rowIndex,
                  weeksData: {}
                } as ITableExerciseRow);
              }

              const exRow = groupMap.get(exKey) as ITableExerciseRow;
              if (!exRow.weeksData[week.weekNumber]) {
                exRow.weeksData[week.weekNumber] = {
                  exerciseInstanceId: ex.exerciseInstanceId || null
                };
              }
              properties.forEach((prop) => {
                if (ex[prop] !== null) {
                  const wd = exRow.weeksData[week.weekNumber];
                  if (wd) {
                    wd[prop] = ex[prop];
                  }
                }
              });
            });
          });
        });
      });
    });

    const finalArray: ITableRow[] = [];
    const groupNumbers: number[] = [];
    groupMap.forEach((value, key) => {
      if (value.rowType === 'group') {
        groupNumbers.push(key as number);
      }
    });

    groupNumbers.sort((a, b) => a - b);

    groupNumbers.forEach((gNum) => {
      const groupRow = groupMap.get(gNum);
      if (groupRow) finalArray.push(groupRow);

      const exKeys: string[] = [];
      groupMap.forEach((exRow, exKey) => {
        if (exRow.rowType === 'exercise' && exRow.groupNumber === gNum) {
          exKeys.push(exKey as string);
        }
      });

      exKeys.sort((aKey, bKey) => {
        const aRow = groupMap.get(aKey)!;
        const bRow = groupMap.get(bKey)!;
        return aRow.rowIndex - bRow.rowIndex;
      });

      exKeys.forEach((ek) => {
        const row = groupMap.get(ek);
        if (row) finalArray.push(row);
      });
    });

    return finalArray;
  }

  const normalizeGroupNumbers = (data: ITableRow[]): ITableRow[] => {
    const normalizedData = [...data];
    let currentGroupNumber = 1;

    for (let i = 0; i < normalizedData.length; i++) {
      const row = normalizedData[i]!;
      if (row.rowType === 'group') {
        const oldGroupNumber = row.groupNumber;
        row.groupNumber = currentGroupNumber;

        for (let j = i + 1; j < normalizedData.length; j++) {
          const nextRow = normalizedData[j]!;
          if (nextRow.rowType === 'group') break;
          if (nextRow.rowType === 'exercise' && nextRow.groupNumber === oldGroupNumber) {
            nextRow.groupNumber = currentGroupNumber;
          }
        }
        currentGroupNumber++;
      }
    }
    return normalizedData;
  };

  const updateTableDataWithNormalization = (newData: ITableRow[]): void => {
    const normalizedData = normalizeGroupNumbers(newData);
    setTableData(normalizedData);
  };

  const updateRowIndices = (dataArray: ITableRow[]): void => {
    const groupNumbers = [
      ...new Set(dataArray.filter((item) => item.rowType === 'group').map((item) => item.groupNumber))
    ].sort((a, b) => a - b);

    groupNumbers.forEach((groupNum) => {
      const exercisesInGroup: Array<{ row: ITableRow; originalIndex: number }> = [];
      dataArray.forEach((row, index) => {
        if (row.rowType === 'exercise' && row.groupNumber === groupNum) {
          exercisesInGroup.push({ row, originalIndex: index });
        }
      });

      exercisesInGroup.forEach((item, newRowIndex) => {
        item.row.rowIndex = newRowIndex;
      });
    });
  };

  // ==================== HEADER BUILDER ====================

  const buildHeaderGroup = (): IHeaderGroupResult | null => {
    if (!numWeeks) return null;

    const usedProps = Array.from({ length: numWeeks }, () => [...defaultPropsOrder, ...extraProps, 'rpe']);

    return {
      usedProps,
      headerGroup: null // The actual JSX header is built in the component
    };
  };

  const headerResult = buildHeaderGroup();
  const usedProps = headerResult?.usedProps;

  const selectHeaderName = (prop: string): string => {
    if (prop === 'rpe') {
      return rpeMethod ? rpeMethod.name : 'N/A';
    }
    return propertyLabels[prop] || prop;
  };

  // ==================== DRAG & DROP HANDLERS ====================

  const handleDragStart = (event: DragStartEvent): void => {
    const { active } = event;
    setActiveId(active.id as string);

    if (typeof active.id === 'string' && active.id.startsWith('group-')) {
      const groupNumberStr = active.id.split('-')[1] ?? '0';
      const groupNumber = parseInt(groupNumberStr, 10);

      const groupExists = tableData.some((row) => row.rowType === 'group' && row.groupNumber === groupNumber);

      if (groupExists) {
        setIsDraggingGroup(true);
        setActiveGroup(groupNumber);

        const updatedData = tableData.map((row) => {
          if (row.groupNumber === groupNumber) {
            return { ...row, isBeingDragged: true };
          }
          if (row.rowType === 'exercise') {
            return { ...row, isDragDisabled: true };
          }
          return row;
        });

        setTableData(updatedData);
      }
    } else {
      if (!isDraggingGroup) {
        setIsDraggingGroup(false);
        setActiveGroup(null);
      }
    }
  };

  const handleGroupDrag = (activeGroupNumber: number, overGroupNumber: number, resetDragState: ITableRow[]): void => {
    console.log(`Moving group ${activeGroupNumber} to group ${overGroupNumber} position`);

    const groupsData = new Map<number, { group: ITableRow | null; exercises: ITableRow[] }>();

    resetDragState.forEach((row) => {
      if (row.rowType === 'group') {
        if (!groupsData.has(row.groupNumber)) {
          groupsData.set(row.groupNumber, { group: row, exercises: [] });
        }
        groupsData.get(row.groupNumber)!.group = row;
      } else if (row.rowType === 'exercise') {
        if (!groupsData.has(row.groupNumber)) {
          groupsData.set(row.groupNumber, { group: null, exercises: [] });
        }
        groupsData.get(row.groupNumber)!.exercises.push(row);
      }
    });

    const currentGroupOrder = Array.from(groupsData.keys()).sort((a, b) => {
      const aIndex = resetDragState.findIndex((row) => row.rowType === 'group' && row.groupNumber === a);
      const bIndex = resetDragState.findIndex((row) => row.rowType === 'group' && row.groupNumber === b);
      return aIndex - bIndex;
    });

    const activeIndex = currentGroupOrder.indexOf(activeGroupNumber);
    const overIndex = currentGroupOrder.indexOf(overGroupNumber);

    if (activeIndex === -1 || overIndex === -1) {
      console.error(`Groups ${activeGroupNumber} or ${overGroupNumber} not found`);
      setTableData(resetDragState);
      return;
    }

    const newGroupOrder = [...currentGroupOrder];
    newGroupOrder.splice(activeIndex, 1);

    const newInsertIndex = overIndex;
    newGroupOrder.splice(newInsertIndex, 0, activeGroupNumber);

    const newData: ITableRow[] = [];
    newGroupOrder.forEach((groupNum) => {
      const groupData = groupsData.get(groupNum);
      if (groupData && groupData.group) {
        newData.push(groupData.group);
        const sortedExercises = groupData.exercises.sort((a, b) => a.rowIndex - b.rowIndex);
        newData.push(...sortedExercises);
      }
    });

    updateRowIndices(newData);

    const normalizedData = normalizeGroupNumbers(newData);
    setTableData(normalizedData);
  };

  const handleExerciseDrag = (activeItem: ITableRow, overItem: ITableRow, resetDragState: ITableRow[]): void => {
    // Rule 1: Check group won't become empty
    if (activeItem.groupNumber !== overItem.groupNumber) {
      const exercisesInActiveGroup = resetDragState.filter(
        (item) => item.rowType === 'exercise' && item.groupNumber === activeItem.groupNumber
      );

      if (exercisesInActiveGroup.length === 1) {
        showToast(
          'error',
          intl.formatMessage({ id: 'common.error' }),
          intl.formatMessage({ id: 'workoutTable.cannotMoveLastExercise' }) ||
            'Cannot move the last exercise from a group'
        );
        setTableData(resetDragState);
        return;
      }
    }

    // Rule 2: Don't allow moving above the first group
    if (overItem.rowType === 'group' && overItem.groupNumber === 1) {
      // Drop on group 1 header - allow only at end of group
    } else if (overItem.rowType === 'exercise' && overItem.groupNumber === 1) {
      if (activeItem.groupNumber !== 1 && overItem.rowIndex === 0) {
        showToast('error', intl.formatMessage({ id: 'common.error' }), 'Cannot move an exercise above the first group');
        setTableData(resetDragState);
        return;
      }
    }

    const newData = [...resetDragState];

    const activeIndex = newData.findIndex(
      (item) =>
        item.rowType === 'exercise' &&
        item.groupNumber === activeItem.groupNumber &&
        item.rowIndex === activeItem.rowIndex
    );

    if (activeIndex === -1) {
      console.error('Active exercise not found');
      setTableData(resetDragState);
      return;
    }

    const movingExercise: ITableRow = { ...newData[activeIndex]! };
    newData.splice(activeIndex, 1);

    let newGroupNumber = overItem.groupNumber;
    let insertIndex: number;

    if (overItem.rowType === 'group') {
      if (activeItem.groupNumber >= newGroupNumber && activeItem.groupNumber !== 1) {
        newGroupNumber = newGroupNumber - 1;
      } else if (activeItem.groupNumber < newGroupNumber && activeItem.groupNumber !== 1) {
        newGroupNumber = newGroupNumber + 1;
      }

      const groupIndex = newData.findIndex((item) => item.rowType === 'group' && item.groupNumber === newGroupNumber);
      insertIndex = groupIndex + 1;
      while (
        insertIndex < newData.length &&
        newData[insertIndex]!.rowType === 'exercise' &&
        newData[insertIndex]!.groupNumber === newGroupNumber
      ) {
        insertIndex++;
      }
    } else {
      newGroupNumber = overItem.groupNumber;

      const overExerciseIndex = newData.findIndex(
        (item) =>
          item.rowType === 'exercise' &&
          item.groupNumber === overItem.groupNumber &&
          item.rowIndex === overItem.rowIndex
      );

      if (overExerciseIndex === -1) {
        console.error('Target exercise not found');
        setTableData(resetDragState);
        return;
      }

      if (activeItem.groupNumber === overItem.groupNumber) {
        if (activeItem.rowIndex < overItem.rowIndex) {
          insertIndex = overExerciseIndex + 1;
        } else {
          insertIndex = overExerciseIndex;
        }
      } else {
        insertIndex = overExerciseIndex;
      }
    }

    movingExercise.groupNumber = newGroupNumber;
    newData.splice(insertIndex, 0, movingExercise);

    updateRowIndices(newData);
    updateTableDataWithNormalization(newData);
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;

    setActiveId(null);
    const wasGroupDrag = isDraggingGroup;
    setIsDraggingGroup(false);
    setActiveGroup(null);

    const resetDragState = tableData.map((row) => ({
      ...row,
      isBeingDragged: false,
      isDragDisabled: false
    }));

    if (!over) {
      setTableData(resetDragState);
      return;
    }

    if (typeof active.id === 'string' && active.id.startsWith('group-')) {
      const activeGroupNumberStr = active.id.split('-')[1] ?? '0';
      const activeGroupNumber = parseInt(activeGroupNumberStr, 10);

      if (typeof over.id === 'string' && over.id.startsWith('group-')) {
        const overGroupNumberStr = over.id.split('-')[1] ?? '0';
        const overGroupNumber = parseInt(overGroupNumberStr, 10);

        if (activeGroupNumber !== overGroupNumber) {
          handleGroupDrag(activeGroupNumber, overGroupNumber, resetDragState);
          return;
        }
      } else {
        const overItem = tableData.find((item) => {
          if (item.rowType === 'exercise') {
            return `ex-${item.groupNumber}-${item.rowIndex}` === over.id;
          }
          return false;
        });

        if (overItem && overItem.groupNumber !== activeGroupNumber) {
          handleGroupDrag(activeGroupNumber, overItem.groupNumber, resetDragState);
          return;
        }
      }

      setTableData(resetDragState);
      return;
    }

    if (!wasGroupDrag) {
      const activeItem = tableData.find((item) => {
        if (item.rowType === 'exercise') {
          return `ex-${item.groupNumber}-${item.rowIndex}` === active.id;
        }
        return false;
      });

      const overItem = tableData.find((item) => {
        if (item.rowType === 'group') {
          return `group-${item.groupNumber}` === over.id;
        } else if (item.rowType === 'exercise') {
          return `ex-${item.groupNumber}-${item.rowIndex}` === over.id;
        }
        return false;
      });

      if (!activeItem || !overItem) {
        setTableData(resetDragState);
        return;
      }

      if (activeItem.rowType === 'exercise') {
        handleExerciseDrag(activeItem, overItem, resetDragState);
      } else {
        setTableData(resetDragState);
      }
    } else {
      setTableData(resetDragState);
    }
  };

  // ==================== EDIT HANDLERS ====================

  const handleCancelEdit = (): void => {
    setIsEditing(false);
    setTableData(originalData || []);
    setDeletedExercises([]);
    setHoverRowIndex(null);
    setShowInsertButton(false);
  };

  const handleAddExerciseAtPosition = (index: number): void => {
    if (!isEditing) return;

    const currentRow = tableData[index]!;
    const targetGroupNumber = currentRow.groupNumber;

    const newExercise: ITableExerciseRow = {
      rowType: 'exercise',
      name: '',
      exerciseId: null,
      groupNumber: targetGroupNumber,
      rowIndex: 0,
      weeksData: {},
      isNew: true
    };

    const newTableData = [...tableData];

    let insertIdx = index + 1;
    if (insertPosition === 'above') {
      insertIdx = index;
    }

    if (currentRow.rowType === 'group') {
      insertIdx = insertPosition === 'above' ? index : index + 1;
    } else {
      insertIdx = insertPosition === 'above' ? index : index + 1;
      newExercise.rowIndex = insertPosition === 'above' ? currentRow.rowIndex : currentRow.rowIndex + 1;
    }

    newTableData.splice(insertIdx, 0, newExercise);

    for (let i = insertIdx + 1; i < newTableData.length; i++) {
      const row = newTableData[i]!;
      if (row.rowType === 'exercise' && row.groupNumber === targetGroupNumber) {
        if (row.rowIndex >= newExercise.rowIndex) {
          row.rowIndex++;
        }
      } else if (row.rowType === 'group') {
        break;
      }
    }

    updateTableDataWithNormalization(newTableData);
    setHoverRowIndex(null);
    setShowInsertButton(false);
  };

  const handleAddGroup = (index: number): void => {
    if (!isEditing) return;

    const maxGroupNumber = tableData.reduce((max, row) => {
      if (row.rowType === 'group' && row.groupNumber > max) {
        return row.groupNumber;
      }
      return max;
    }, 0);

    const newGroupNumber = maxGroupNumber + 1;
    const newGroup: ITableGroupRow = {
      rowType: 'group',
      groupNumber: newGroupNumber,
      rowIndex: newGroupNumber * 100,
      isNew: true,
      label: `${intl.formatMessage({ id: 'common.group' })} ${newGroupNumber}`,
      weeksData: {}
    };

    const newExercise: ITableExerciseRow = {
      rowType: 'exercise',
      name: '',
      exerciseId: null,
      groupNumber: newGroupNumber,
      rowIndex: 0,
      weeksData: {},
      isNew: true
    };

    const currentRow = tableData[index] ?? tableData[tableData.length - 1]!;
    let insertAfterIndex: number;

    if (currentRow.rowType === 'group') {
      let i = index + 1;
      while (
        i < tableData.length &&
        tableData[i]!.rowType === 'exercise' &&
        tableData[i]!.groupNumber === currentRow.groupNumber
      ) {
        i++;
      }
      insertAfterIndex = i - 1;
    } else {
      const groupNumber = currentRow.groupNumber;
      let i = index;
      while (
        i < tableData.length &&
        (tableData[i]!.rowType !== 'group' ||
          i === index ||
          (tableData[i]!.rowType === 'exercise' && tableData[i]!.groupNumber === groupNumber))
      ) {
        i++;
      }
      insertAfterIndex = i - 1;
    }

    const newTableData = [...tableData];
    newTableData.splice(insertAfterIndex + 1, 0, newGroup, newExercise);

    updateTableDataWithNormalization(newTableData);

    setHoverRowIndex(null);
    setShowInsertButton(false);

    showToast(
      'success',
      intl.formatMessage({ id: 'common.success' }),
      intl.formatMessage({ id: 'workoutTable.groupInserted' })
    );
  };

  const handleAddExercise = (): void => {
    if (!isEditing) return;

    const lastGroup = tableData
      .filter((row) => row.rowType === 'group')
      .sort((a, b) => b.groupNumber - a.groupNumber)[0];

    if (!lastGroup) {
      showToast('error', 'Error', intl.formatMessage({ id: 'workoutTable.noGroupsAvailable' }));
      return;
    }

    const exercisesInGroup = tableData.filter(
      (row) => row.rowType === 'exercise' && row.groupNumber === lastGroup.groupNumber
    ).length;

    const newExercise: ITableExerciseRow = {
      rowType: 'exercise',
      name: '',
      exerciseId: null,
      groupNumber: lastGroup.groupNumber,
      rowIndex: exercisesInGroup,
      weeksData: {},
      isNew: true
    };

    const newTableData = [...tableData];

    let insertIdx = tableData.findIndex((row) => row.rowType === 'group' && row.groupNumber === lastGroup.groupNumber);

    while (
      insertIdx + 1 < newTableData.length &&
      newTableData[insertIdx + 1]!.rowType === 'exercise' &&
      newTableData[insertIdx + 1]!.groupNumber === lastGroup.groupNumber
    ) {
      insertIdx++;
    }

    newTableData.splice(insertIdx + 1, 0, newExercise);
    updateTableDataWithNormalization(newTableData);
  };

  // ==================== SAVE LOGIC ====================

  const detectChanges = (): IChanges => {
    if (!originalData || !tableData) {
      return {
        newExercises: [],
        movedExercises: [],
        movedGroups: [],
        updatedProperties: [],
        deletedExercises: []
      };
    }

    const normalizedTableData = normalizeGroupNumbers(tableData);
    const normalizedOriginalData = normalizeGroupNumbers(originalData);

    const newChanges: IChanges = {
      newExercises: [],
      movedExercises: [],
      movedGroups: [],
      updatedProperties: [],
      deletedExercises: deletedExercises
    };

    // 1. Detect new exercises
    normalizedTableData.forEach((row) => {
      if (row.rowType === 'exercise' && (row.isNew || !(row as ITableExerciseRow).exerciseInstanceId)) {
        const exRow = row as ITableExerciseRow;
        if (!exRow.exerciseId && exRow.name) {
          const selectedExercise = coachExercises.find((ex: any) => ex.name === exRow.name);
          if (selectedExercise) {
            exRow.exerciseId = selectedExercise.id;
          }
        }

        if (exRow.name) {
          newChanges.newExercises.push({
            name: exRow.name,
            exerciseId: exRow.exerciseId,
            groupNumber: exRow.groupNumber,
            rowIndex: exRow.rowIndex,
            weeksData: exRow.weeksData
          });
        }
      }
    });

    // 2. Detect moved groups
    const originalGroups = normalizedOriginalData.filter((row) => row.rowType === 'group');
    const currentGroups = normalizedTableData.filter((row) => row.rowType === 'group');

    const originalGroupsMap = new Map<number, { originalIndex: number; groupNumber: number }>();
    originalGroups.forEach((group, index) => {
      originalGroupsMap.set(group.groupNumber, { ...group, originalIndex: index });
    });

    currentGroups.forEach((currentGroup, currentIndex) => {
      const originalGroupInfo = originalGroupsMap.get(currentGroup.groupNumber);
      if (originalGroupInfo) {
        if (originalGroupInfo.originalIndex !== currentIndex) {
          newChanges.movedGroups.push({
            groupNumber: currentGroup.groupNumber,
            newOrder: currentIndex + 1,
            oldIndex: originalGroupInfo.originalIndex
          });
        }
      }
    });

    // 3. Detect moved exercises
    const originalExercises = normalizedOriginalData.filter((row) => row.rowType === 'exercise') as ITableExerciseRow[];
    const currentExercises = normalizedTableData.filter(
      (row) => row.rowType === 'exercise' && (row as ITableExerciseRow).exerciseInstanceId
    ) as ITableExerciseRow[];

    const originalExercisesMap = new Map<number, ITableExerciseRow>();
    originalExercises.forEach((ex) => {
      if (ex.exerciseInstanceId) {
        originalExercisesMap.set(ex.exerciseInstanceId, ex);
      }
    });

    currentExercises.forEach((currentExercise) => {
      const originalExercise = originalExercisesMap.get(currentExercise.exerciseInstanceId!);
      if (originalExercise) {
        const exerciseMoved =
          currentExercise.groupNumber !== originalExercise.groupNumber ||
          currentExercise.rowIndex !== originalExercise.rowIndex;

        if (exerciseMoved) {
          const originalGroupMoved = newChanges.movedGroups.some(
            (movedGroup: any) => movedGroup.groupNumber === originalExercise.groupNumber
          );

          const changedGroup = currentExercise.groupNumber !== originalExercise.groupNumber;
          const shouldExclude = !changedGroup && originalGroupMoved;

          if (!shouldExclude) {
            newChanges.movedExercises.push({
              exerciseInstanceId: currentExercise.exerciseInstanceId,
              name: currentExercise.name,
              oldGroupNumber: originalExercise.groupNumber,
              newGroupNumber: currentExercise.groupNumber,
              oldRowIndex: originalExercise.rowIndex,
              newRowIndex: currentExercise.rowIndex
            });
          }
        }
      }
    });

    // 4. Detect property changes
    currentExercises.forEach((currentExercise) => {
      const originalExercise = originalExercisesMap.get(currentExercise.exerciseInstanceId!);
      if (originalExercise) {
        // Detect name/exercise change
        if (currentExercise.name !== originalExercise.name) {
          let exerciseId = currentExercise.exerciseId;
          if (!exerciseId && currentExercise.name) {
            const selectedExercise = coachExercises.find((ex: any) => ex.name === currentExercise.name);
            if (selectedExercise) {
              exerciseId = selectedExercise.id;
            }
          }

          if (exerciseId) {
            newChanges.updatedProperties.push({
              exerciseInstanceId: currentExercise.exerciseInstanceId,
              name: currentExercise.name,
              weekNumber: 1,
              property: 'exerciseId',
              value: exerciseId
            });
          } else {
            console.warn(`Could not find exerciseId for "${currentExercise.name}". This change will not be applied.`);
          }
        }

        // Check week property changes
        Object.keys(currentExercise.weeksData).forEach((weekNumber) => {
          const currentWeekData = currentExercise.weeksData[parseInt(weekNumber)];
          const originalWeekData = originalExercise.weeksData[parseInt(weekNumber)] || {};

          if (currentWeekData) {
            properties.forEach((prop) => {
              const currentValue = currentWeekData[prop];
              const originalValue = originalWeekData[prop];

              const isCurrentValueNull = currentValue === null || currentValue === undefined;
              const isOriginalValueNull = originalValue === null || originalValue === undefined;

              const hasChanged =
                isCurrentValueNull !== isOriginalValueNull ||
                (!isCurrentValueNull && !isOriginalValueNull && currentValue !== originalValue);

              if (hasChanged) {
                newChanges.updatedProperties.push({
                  exerciseInstanceId: currentExercise.exerciseInstanceId,
                  name: currentExercise.name,
                  weekNumber: parseInt(weekNumber),
                  property: prop,
                  value: currentValue
                });
              }
            });
          }
        });
      }
    });

    return newChanges;
  };

  const buildSavePayload = (changesObj: IChanges): Record<string, any> | null => {
    if (!changesObj) {
      return null;
    }

    const payload = {
      cycleId,
      dayNumber,
      changes: {
        newExercises: changesObj.newExercises.map((ex: any) => ({
          name: ex.name,
          exerciseId: ex.exerciseId,
          groupNumber: ex.groupNumber,
          rowIndex: ex.rowIndex,
          weeksData: Object.keys(ex.weeksData).reduce((acc: Record<string, any>, weekNum: string) => {
            acc[weekNum] = {};
            const weekData = ex.weeksData[weekNum];
            properties.forEach((prop) => {
              if (weekData && weekData[prop] !== undefined && weekData[prop] !== null) {
                acc[weekNum][prop] = weekData[prop];
              }
            });
            return acc;
          }, {})
        })),

        movedExercises: changesObj.movedExercises.map((ex: any) => ({
          name: ex.name,
          exerciseInstanceId: ex.exerciseInstanceId,
          oldGroupNumber: ex.oldGroupNumber,
          newGroupNumber: ex.newGroupNumber,
          oldRowIndex: ex.oldRowIndex,
          newRowIndex: ex.newRowIndex
        })),

        movedGroups: changesObj.movedGroups.map((group: any) => ({
          groupNumber: group.groupNumber,
          newOrder: group.newOrder
        })),

        updatedProperties: changesObj.updatedProperties.map((update: any) => ({
          exerciseInstanceId: update.exerciseInstanceId,
          name: update.name,
          weekNumber: update.weekNumber,
          property: update.property,
          value: update.value
        })),

        deletedExercises: changesObj.deletedExercises
      }
    };

    return payload;
  };

  const handleSaveChanges = async (): Promise<void> => {
    try {
      setIsLoading(true);

      const updatedTableData = [...tableData];
      let exerciseIdsUpdated = false;

      updatedTableData.forEach((row) => {
        if (row.rowType === 'exercise') {
          const exRow = row as ITableExerciseRow;
          if (exRow.name && !exRow.exerciseId) {
            const selectedExercise = coachExercises.find((ex: any) => ex.name === exRow.name);
            if (selectedExercise) {
              exRow.exerciseId = selectedExercise.id;
              exerciseIdsUpdated = true;
            } else {
              console.error(`Could not find exerciseId for "${exRow.name}"`);
            }
          }
        }
      });

      updatedTableData.forEach((row) => {
        if (row.rowType === 'exercise') {
          const exRow = row as ITableExerciseRow;
          if (!exRow.exerciseInstanceId && !exRow.isNew) {
            exRow.isNew = true;
            exerciseIdsUpdated = true;
          }
        }
      });

      if (exerciseIdsUpdated) {
        setTableData(updatedTableData);
      }

      const changesObj = detectChanges();

      if (
        !changesObj ||
        (changesObj.newExercises.length === 0 &&
          changesObj.movedExercises.length === 0 &&
          changesObj.movedGroups.length === 0 &&
          changesObj.updatedProperties.length === 0 &&
          changesObj.deletedExercises.length === 0)
      ) {
        showToast(
          'info',
          intl.formatMessage({ id: 'common.noChanges' }),
          intl.formatMessage({ id: 'common.noChangesToSave' })
        );
        setIsLoading(false);
        return;
      }

      const payload = buildSavePayload(changesObj);
      if (!payload) {
        throw new Error('Could not build payload for saving changes');
      }

      const response = await api.workout.saveWorkoutChanges(payload);

      if (response.data.message === 'Changes saved successfully') {
        showToast(
          'success',
          intl.formatMessage({ id: 'common.success' }),
          intl.formatMessage({ id: 'workoutTable.changesSaved' })
        );
      } else {
        if (
          response.data.failedUpdatedProperties.length > 0 ||
          response.data.failedNewExercises.length > 0 ||
          response.data.failedMovedExercises.length > 0 ||
          response.data.failedDeletedExercises.length > 0
        ) {
          showToast(
            'info',
            intl.formatMessage({ id: 'common.partialSuccess' }),
            intl.formatMessage({ id: 'workoutTable.someChangesFailed' })
          );
        } else {
          showToast(
            'error',
            intl.formatMessage({ id: 'common.error' }),
            response.data.message || intl.formatMessage({ id: 'common.errorSaving' })
          );
        }
      }

      setOriginalData(JSON.parse(JSON.stringify(tableData)));
      setDeletedExercises([]);

      showToast(
        'success',
        intl.formatMessage({ id: 'common.success' }),
        intl.formatMessage({ id: 'workoutTable.changesSaved' })
      );

      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving changes:', error);
      showToast(
        'error',
        intl.formatMessage({ id: 'common.error' }),
        error.message || intl.formatMessage({ id: 'common.errorSaving' })
      );
    } finally {
      setIsLoading(false);
      setRefreshTable((prev) => prev + 1);
    }
  };

  // ==================== PROPERTY HANDLERS ====================

  const [oldValue, setOldValue] = useState<any>(null);

  const handlePropertyChange = useCallback((rowData: ITableRow, prop: string, weekNum: number, newValue: string) => {
    if (!rowData.weeksData[weekNum]) {
      rowData.weeksData[weekNum] = { exerciseInstanceId: null };
    }
    setOldValue(rowData.weeksData[weekNum][prop]);
    rowData.weeksData[weekNum][prop] = newValue === '' ? null : newValue;
  }, []);

  const handlePropertyBlur = useCallback(
    (rowData: ITableRow, prop: string, weekNum: number) => {
      if (oldValue !== rowData.weeksData[weekNum]?.[prop]) {
        setTableData((prev) => [...prev]);
      }
      setOldValue(null);
    },
    [oldValue]
  );

  const handleExerciseNameChange = (rowData: ITableExerciseRow, newName: string): void => {
    rowData.name = newName;

    const selectedExercise = coachExercises.find((ex: any) => ex.name === newName);
    if (selectedExercise) {
      rowData.exerciseId = selectedExercise.id;

      if (!rowData.exerciseInstanceId && !rowData.isNew) {
        rowData.isNew = true;
      }
    } else {
      console.warn(`Exercise "${newName}" not found in coach exercises list.`);
      rowData.exerciseId = null;
    }

    setTableData([...tableData]);
  };

  const handleGroupLabelChange = (rowData: ITableGroupRow, newLabel: string): void => {
    rowData.label = newLabel;
    setTableData([...tableData]);
  };

  const handleDeleteExercise = (rowData: ITableExerciseRow): void => {
    if (!isEditing) return;

    if (rowData.exerciseInstanceId) {
      setDeletedExercises((prev) => [...prev, rowData.exerciseInstanceId!]);
    }

    const newTableData = tableData.filter((row) => {
      if (row.rowType === 'exercise') {
        return row.groupNumber !== rowData.groupNumber || row.rowIndex !== rowData.rowIndex;
      }
      return true;
    });

    let currentIndex = 0;
    newTableData.forEach((row) => {
      if (row.rowType === 'exercise' && row.groupNumber === rowData.groupNumber) {
        row.rowIndex = currentIndex++;
      }
    });

    updateTableDataWithNormalization(newTableData);
    showToast('success', 'Success', 'Exercise deleted successfully');
  };

  // ==================== VIDEO HANDLERS ====================

  const [videoDialogVisible, setVideoDialogVisible] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  const handleVideoClick = (url: string): void => {
    try {
      const videoId = extractYouTubeVideoId(url);
      if (!videoId) return;
      setSelectedVideoUrl(`https://www.youtube.com/embed/${videoId}`);
      setVideoDialogVisible(true);
    } catch (error: any) {
      showToast('error', 'Error', error.message);
    }
  };

  // ==================== DAY TEMPLATE ====================

  const dayItemTemplate = (option: IDayOption) => {
    const isUsed = daysUsed.includes(option.value);
    return { isUsed, label: option.label };
  };

  // ==================== RETURN ====================

  return {
    // Context values
    intl,
    isDarkMode,
    user,
    coach,

    // State
    isEditing,
    setIsEditing,
    cycleId,
    setCycleId,
    dayNumber,
    setDayNumber,
    excelData,
    isLoading,
    numWeeks,
    tableData,
    setTableData,
    propertiesUsedByWeek,
    coachExercises,
    rpeMethod,
    workoutInstanceId,
    isDraggingGroup,
    activeId,
    activeGroup,
    newCycleDialogVisible,
    setNewCycleDialogVisible,
    refreshTable,

    // Extra props
    extraProps,
    setExtraProps,
    propDialogVisible,
    setPropDialogVisible,
    newProp,
    setNewProp,
    availableProps,
    defaultPropsOrder,

    // Hover/insert state
    hoverRowIndex,
    setHoverRowIndex,
    showInsertButton,
    setShowInsertButton,
    isInsertButtonHovered,
    setIsInsertButtonHovered,
    insertPosition,
    setInsertPosition,
    isHoveringFirstColumn,
    setIsHoveringFirstColumn,

    // Options & labels
    dayOptions,
    propertyLabels,
    tableStyles,

    // Computed
    usedProps,
    sensors,

    // Refs
    firstColumnRef,

    // Functions
    rowClassName,
    buildHeaderGroup,
    selectHeaderName,
    handleDragStart,
    handleDragEnd,
    handleCancelEdit,
    handleAddExerciseAtPosition,
    handleAddGroup,
    handleAddExercise,
    handleSaveChanges,
    handlePropertyChange,
    handlePropertyBlur,
    handleExerciseNameChange,
    handleGroupLabelChange,
    handleDeleteExercise,
    dayItemTemplate,
    getYouTubeThumbnail,

    // Video
    videoDialogVisible,
    setVideoDialogVisible,
    selectedVideoUrl,
    handleVideoClick,

    // Deleted exercises
    deletedExercises
  };
}

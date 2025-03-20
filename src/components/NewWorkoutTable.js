import React, { useState, useEffect, useContext, useRef } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';

import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';

import { fetchExcelViewByCycleAndDay } from '../services/workoutService';
import { fetchCoachExercises } from '../services/exercisesService';

import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { useTheme } from '../utils/ThemeContext';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { FaGripVertical } from 'react-icons/fa';
import { FaSave } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';
import { saveWorkoutChanges } from '../services/workoutService';
import '../styles/WorkoutTable.css';
import CreateTrainingCycleDialog from '../dialogs/CreateTrainingCycle';
// Our known exercise properties
const properties = [
  'sets',
  'repetitions',
  'weight',
  'time',
  'restInterval',
  'tempo',
  'notes',
  'difficulty',
  'duration',
  'distance'
];

export default function NewWorkoutTable({ cycleOptions, clientData }) {
  const { user, coach } = useContext(UserContext);
  const showToast = useToast();
  const intl = useIntl();
  const { isDarkMode } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [cycleId, setCycleId] = useState(null);
  const [dayNumber, setDayNumber] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [numWeeks, setNumWeeks] = useState(0);

  // Single array for both group rows and exercise rows
  const [tableData, setTableData] = useState([]);
  const [editedData, setEditedData] = useState({});
  const [refreshTable, setRefreshTable] = useState(0);
  // We'll store the used properties per week if needed
  const [propertiesUsedByWeek, setPropertiesUsedByWeek] = useState([]);

  const [coachExercises, setCoachExercises] = useState([]);

  const [isDraggingGroup, setIsDraggingGroup] = useState(false);

  // Añadir estado para el elemento actualmente arrastrado
  const [activeId, setActiveId] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  const [newCycleDialogVisible, setNewCycleDialogVisible] = useState(false);

  // Configurar sensores para el arrastre
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

  // Añadir estos estados para seguimiento de cambios
  const [originalData, setOriginalData] = useState(null);
  const [changes, setChanges] = useState({
    newExercises: [],
    movedExercises: [],
    movedGroups: [],
    updatedProperties: []
  });

  const [daysUsed, setDaysUsed] = useState([]);

  // Estados para manejar el botón de inserción dinámica
  const [hoverRowIndex, setHoverRowIndex] = useState(null);
  const [showInsertButton, setShowInsertButton] = useState(false);

  const dayOptions = [
    { label: intl.formatMessage({ id: 'workoutTable.monday' }), value: 1 },
    { label: intl.formatMessage({ id: 'workoutTable.tuesday' }), value: 2 },
    { label: intl.formatMessage({ id: 'workoutTable.wednesday' }), value: 3 },
    { label: intl.formatMessage({ id: 'workoutTable.thursday' }), value: 4 },
    { label: intl.formatMessage({ id: 'workoutTable.friday' }), value: 5 },
    { label: intl.formatMessage({ id: 'workoutTable.saturday' }), value: 6 },
    { label: intl.formatMessage({ id: 'workoutTable.sunday' }), value: 7 }
  ];

  const propertyLabels = {
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

  const tableStyles = {
    //width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed', // Esto es importante para mantener los anchos de columna
    marginBottom: '2rem'
  };

  const rowClassName = (rowData) => {
    if (rowData.rowType === 'group') {
      // Maybe style group rows differently
      return 'row-group-label';
    }
    if (isDarkMode) {
      return rowData.groupNumber % 2 === 0 ? 'group-even-dark improved-row' : 'group-odd-dark improved-row';
    } else {
      return rowData.groupNumber % 2 === 0 ? 'group-even improved-row' : 'group-odd improved-row';
    }
  };

  /****************************************
   * 1) Fetch coach's exercises
   ****************************************/
  useEffect(() => {
    if (!user?.userId) return;
    const fetchData = async () => {
      try {
        const response = await fetchCoachExercises(coach.id);
        setCoachExercises(response.data || []);
      } catch (err) {
        console.error('Error fetching coach exercises:', err);
      }
    };
    fetchData();
  }, [user]);

  /****************************************
   * 2) Fetch ExcelView
   ****************************************/
  useEffect(() => {
    if (!cycleId || !dayNumber) return;
    const doFetch = async () => {
      try {
        setIsLoading(true);
        const response = await fetchExcelViewByCycleAndDay(cycleId, dayNumber);
        setNumWeeks(response.data.weeks.length);
        setExcelData(response.data);
      } catch (error) {
        showToast('error', 'Error', error.message || 'Error fetching excel view');
      } finally {
        setIsLoading(false);
      }
    };
    if (cycleId !== -1) doFetch();
  }, [cycleId, dayNumber, showToast, refreshTable]);

  /****************************************
   * 2.1) Detectar días con entrenamientos
   ****************************************/
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
        // Podemos usar la misma función pero verificar todos los días
        const usedDays = [];
        for (let day = 1; day <= 7; day++) {
          try {
            const response = await fetchExcelViewByCycleAndDay(cycleId, day);
            // Si hay datos en las semanas y hay grupos/ejercicios, consideramos que el día está en uso
            if (
              response.data?.weeks?.length > 0 &&
              response.data.weeks.some((week) =>
                week.sessions.some((session) => session.workoutInstances.some((instance) => instance.groups.length > 0))
              )
            ) {
              usedDays.push(day);
            }
          } catch (error) {
            // Si hay error, asumimos que no hay datos para ese día
          }
        }
        setDaysUsed(usedDays);
      } catch (error) {
        console.error('Error fetching days with workouts:', error);
      }
    };

    fetchDaysWithWorkouts();
  }, [cycleId]);

  /****************************************
   * 3) Build table data (group rows + exercise rows)
   ****************************************/
  useEffect(() => {
    if (excelData?.weeks) {
      const built = buildRowsWithGroups(excelData);
      setTableData(built);
      setOriginalData(JSON.parse(JSON.stringify(built))); // Copia profunda
    }
  }, [excelData]);

  useEffect(() => {
    // If needed, you can re-check which properties are used in each week
    if (!tableData || !tableData.length || !numWeeks) return;
    const usedProps = {};
    for (let i = 1; i <= numWeeks; i++) usedProps[i] = [];

    tableData.forEach((row) => {
      if (row.rowType === 'exercise') {
        for (let w = 1; w <= numWeeks; w++) {
          if (row.weeksData[w]) {
            Object.keys(row.weeksData[w]).forEach((prop) => {
              if (properties.includes(prop) && !usedProps[w].includes(prop)) {
                usedProps[w].push(prop);
              }
            });
          }
        }
      }
    });
    setPropertiesUsedByWeek(Object.values(usedProps));
  }, [tableData, numWeeks]);
  /**
   * We now produce an array of row objects. Each group is a row with rowType="group", then all exercises for that group with rowType="exercise".
   * This is how we can do group-level reorder or single-exercise reorder in a single table.
   */
  function buildRowsWithGroups(data) {
    // A Map to store both "group rows" and "exercise rows".
    // Keys for groups = (groupNumber) (an integer or string)
    // Keys for exercises = `${groupNumber}--${exerciseName}`
    const groupMap = new Map();

    data.weeks.forEach((week) => {
      week.sessions.forEach((session) => {
        session.workoutInstances.forEach((instance) => {
          instance.groups.forEach((group) => {
            const groupNumber = group.groupNumber;

            // 1) Ensure we have a group row stored
            if (!groupMap.has(groupNumber)) {
              groupMap.set(groupNumber, {
                rowType: 'group',
                groupNumber: groupNumber,
                rowIndex: groupNumber * 100, // or other ordering
                isNew: false,
                isRestPeriod: group.isRestPeriod,
                label: group.isRestPeriod
                  ? `${group.name} - ${group.restDuration}`
                  : group.name
                    ? group.name
                    : `${intl.formatMessage({ id: 'common.group' })} ${groupNumber}`,
                weeksData: {} // (not really used for group row)
              });
            }
            // 2) For each exercise in this group
            group.exercises.forEach((ex) => {
              // Build a key that combines groupNumber and exerciseName
              const exKey = `${groupNumber}--${ex.exerciseName}`;

              // If we haven't yet created an "exercise row" for this (group, exerciseName):
              if (!groupMap.has(exKey)) {
                groupMap.set(exKey, {
                  rowType: 'exercise',
                  isNew: false,
                  name: ex.exerciseName,
                  groupNumber: groupNumber,
                  exerciseInstanceId: ex.exerciseInstanceId,
                  // If you have ex.rowIndex, use it, else default to 0
                  rowIndex: ex.rowIndex,
                  weeksData: {}
                });
              }

              // 3) Fill in the weeksData for that exercise row
              const exRow = groupMap.get(exKey);
              if (!exRow.weeksData[week.weekNumber]) {
                exRow.weeksData[week.weekNumber] = {
                  exerciseInstanceId: ex.exerciseInstanceId || null
                };
              }
              // For each property, if ex[prop] is defined, store it
              properties.forEach((prop) => {
                if (ex[prop] !== null) {
                  exRow.weeksData[week.weekNumber][prop] = ex[prop];
                }
              });
            });
          });
        });
      });
    });

    // 4) Now build a single array: group row, then its exercise rows
    const finalArray = [];

    // Gather groupNumbers
    // We'll treat any integer key in groupMap as group row, while "groupNumber--exerciseName" are exercise rows
    const groupNumbers = [];
    groupMap.forEach((value, key) => {
      if (value.rowType === 'group') {
        groupNumbers.push(key); // 'key' is the groupNumber
      }
    });

    groupNumbers.sort((a, b) => a - b);

    // For each groupNumber, push the group row, then all exercise rows
    groupNumbers.forEach((gNum) => {
      const groupRow = groupMap.get(gNum);
      finalArray.push(groupRow);

      // find all exercise rows for this group
      const exKeys = [];
      groupMap.forEach((exRow, exKey) => {
        // exRow.rowType === 'exercise' and exRow.groupNumber === gNum
        if (exRow.rowType === 'exercise' && exRow.groupNumber === gNum) {
          exKeys.push(exKey);
        }
      });

      // Sort them by rowIndex
      exKeys.sort((aKey, bKey) => {
        const aRow = groupMap.get(aKey);
        const bRow = groupMap.get(bKey);
        return aRow.rowIndex - bRow.rowIndex;
      });

      exKeys.forEach((ek) => {
        finalArray.push(groupMap.get(ek));
      });
    });

    return finalArray;
  }

  /****************************************
   * 4) Compute usedPropertiesByWeek if needed
   ****************************************/

  // "Exercise" or "Group" name column
  function renderNameColumn(rowData) {
    if (rowData.rowType === 'group') {
      return isEditing ? (
        <InputText
          value={rowData.label || `Group ${rowData.groupNumber}`}
          onChange={(e) => handleGroupLabelChange(rowData, e.target.value)}
          style={{ width: '100%' }}
        />
      ) : (
        rowData.label || `Group ${rowData.groupNumber}`
      );
    }

    // Para ejercicios
    if (isEditing) {
      return (
        <Dropdown
          value={rowData.name}
          options={coachExercises.map((ex) => ({ label: ex.name, value: ex.name }))}
          onChange={(e) => handleExerciseNameChange(rowData, e.value)}
          filter
          showClear={false}
          className="w-full"
          style={{ width: '100%' }}
          placeholder={intl.formatMessage({ id: 'exercise.selectExercise' })}
        />
      );
    }

    return rowData.name || '-';
  }

  /****************************************
   * 6) Table layout
   ****************************************/
  function buildHeaderGroup() {
    if (!numWeeks || !tableData.length) return null;

    // We'll generate usedProps for each week from the actual tableData
    const usedProps = [];
    for (let i = 1; i <= numWeeks; i++) {
      usedProps.push([]);
    }
    tableData.forEach((row) => {
      if (row.rowType === 'exercise') {
        for (let w = 1; w <= numWeeks; w++) {
          if (row.weeksData[w]) {
            Object.keys(row.weeksData[w]).forEach((prop) => {
              if (properties.includes(prop) && !usedProps[w - 1].includes(prop)) {
                usedProps[w - 1].push(prop);
              }
            });
          }
        }
      }
    });

    const subHeaderColumns = [];
    usedProps.forEach((list, idx) => {
      list.forEach((prop) => {
        const headerLabel = propertyLabels[prop] || prop;
        subHeaderColumns.push(<Column header={headerLabel} key={`${prop}-header-${idx}`} />);
      });
    });

    const topRowWeekColumns = usedProps.map((list, i) => (
      <Column
        header={`${intl.formatMessage({ id: 'workoutTable.week' }, { week: i + 1 })}`}
        colSpan={list.length}
        key={`week-colspan-${i}`}
      />
    ));

    return {
      usedProps,
      headerGroup: (
        <ColumnGroup>
          <Row>
            <Column
              header={intl.formatMessage({ id: 'workoutTable.exercise' })}
              rowSpan={2}
              style={{ width: '18rem' }}
            />
            {topRowWeekColumns}
          </Row>
          <Row>{subHeaderColumns}</Row>
        </ColumnGroup>
      )
    };
  }

  /****************************************
   * DRAG & DROP: Single Table
   ****************************************/
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);

    // Verificar si es un grupo por el formato del ID
    if (typeof active.id === 'string' && active.id.startsWith('group-')) {
      const groupNumberStr = active.id.split('-')[1];
      const groupNumber = parseInt(groupNumberStr, 10);

      // Verificar que realmente existe este grupo en los datos
      const groupExists = tableData.some((row) => row.rowType === 'group' && row.groupNumber === groupNumber);

      if (groupExists) {
        setIsDraggingGroup(true);
        setActiveGroup(groupNumber);

        // Marcar todos los elementos del grupo y deshabilitar el drag de ejercicios
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
      // Es un ejercicio individual
      setIsDraggingGroup(false);
      setActiveGroup(null);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    // Restablecer estados
    setActiveId(null);
    setIsDraggingGroup(false);
    setActiveGroup(null);

    // Limpiar marcas de arrastre y restablecer drag de ejercicios
    const resetDragState = tableData.map((row) => ({
      ...row,
      isBeingDragged: false,
      isDragDisabled: false
    }));

    // Si no hay destino, solo restablecemos el estado
    if (!over) {
      setTableData(resetDragState);
      return;
    }

    // Verificar si estamos arrastrando un grupo
    if (typeof active.id === 'string' && active.id.startsWith('group-')) {
      // Extraer el número de grupo del ID
      const activeGroupNumberStr = active.id.split('-')[1];
      const activeGroupNumber = parseInt(activeGroupNumberStr, 10);

      // Verificar si el destino también es un grupo
      if (typeof over.id === 'string' && over.id.startsWith('group-')) {
        const overGroupNumberStr = over.id.split('-')[1];
        const overGroupNumber = parseInt(overGroupNumberStr, 10);

        if (activeGroupNumber !== overGroupNumber) {
          handleGroupDrag(activeGroupNumber, overGroupNumber, resetDragState);
          return;
        }
      }

      // Si llegamos aquí, no fue un arrastre de grupo a grupo válido
      setTableData(resetDragState);
      return;
    }

    // Obtener información sobre las filas activa y destino
    const activeItem = tableData.find((item) => {
      if (item.rowType === 'group') {
        return `group-${item.groupNumber}` === active.id;
      } else if (item.rowType === 'exercise') {
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

    // Si no encontramos alguno de los elementos, salimos
    if (!activeItem || !overItem) {
      setTableData(resetDragState);
      return;
    }

    // Manejar drag de ejercicios
    if (activeItem.rowType === 'exercise') {
      handleExerciseDrag(activeItem, overItem, resetDragState);
    } else {
      // Otro caso no soportado
      setTableData(resetDragState);
    }
  };

  // Función para manejar el arrastre de grupos
  const handleGroupDrag = (activeGroupNumber, overGroupNumber, resetDragState) => {
    console.log(`Moviendo grupo ${activeGroupNumber} a la posición del grupo ${overGroupNumber}`);

    // Encontrar todos los elementos del grupo activo
    const activeGroupIndex = resetDragState.findIndex(
      (row) => row.rowType === 'group' && row.groupNumber === activeGroupNumber
    );

    if (activeGroupIndex === -1) {
      console.error(`No se encontró el grupo ${activeGroupNumber}`);
      setTableData(resetDragState);
      return;
    }

    // Obtener el grupo activo y sus ejercicios
    const activeGroup = resetDragState[activeGroupIndex];

    // Encontrar todos los ejercicios del grupo activo
    let currentIndex = activeGroupIndex + 1;
    const activeGroupExercises = [];

    while (
      currentIndex < resetDragState.length &&
      resetDragState[currentIndex].rowType === 'exercise' &&
      resetDragState[currentIndex].groupNumber === activeGroupNumber
    ) {
      activeGroupExercises.push(resetDragState[currentIndex]);
      currentIndex++;
    }

    // Eliminar el grupo activo y sus ejercicios del array
    const newData = resetDragState.filter(
      (row) =>
        !(row.rowType === 'group' && row.groupNumber === activeGroupNumber) &&
        !(row.rowType === 'exercise' && row.groupNumber === activeGroupNumber)
    );

    // Encontrar el índice del grupo destino
    const overGroupIndex = newData.findIndex((row) => row.rowType === 'group' && row.groupNumber === overGroupNumber);

    if (overGroupIndex === -1) {
      console.error(`No se encontró el grupo destino ${overGroupNumber}`);
      setTableData(resetDragState);
      return;
    }

    // Calcular el índice de inserción basado en si el grupo activo estaba
    // originalmente antes o después del grupo destino
    let insertIndex = overGroupIndex;

    // Si el grupo activo estaba originalmente antes que el destino,
    // necesitamos encontrar el final del grupo destino para insertar después
    if (activeGroupIndex < overGroupIndex) {
      // Contar cuántos ejercicios hay en el grupo destino
      let i = overGroupIndex + 1;
      while (i < newData.length && newData[i].rowType === 'exercise' && newData[i].groupNumber === overGroupNumber) {
        i++;
      }
      insertIndex = i;
    }

    // Insertar el grupo activo y sus ejercicios en la nueva posición
    newData.splice(insertIndex, 0, activeGroup, ...activeGroupExercises);

    // Actualizar índices para mantener la consistencia
    updateRowIndices(newData);

    // Actualizar el estado
    setTableData(newData);
  };

  // Función para manejar el arrastre de ejercicios
  const handleExerciseDrag = (activeItem, overItem, resetDragState) => {
    // Verificar si el ejercicio que se está moviendo es el único en su grupo
    if (activeItem.groupNumber !== overItem.groupNumber || overItem.rowType === 'group') {
      // Contar cuántos ejercicios hay en el grupo del ejercicio activo
      const exercisesInActiveGroup = resetDragState.filter(
        (item) => item.rowType === 'exercise' && item.groupNumber === activeItem.groupNumber
      );

      // Si es el único ejercicio en el grupo, mostrar mensaje y cancelar
      if (exercisesInActiveGroup.length === 1) {
        showToast(
          'error',
          intl.formatMessage({ id: 'common.error' }),
          intl.formatMessage({ id: 'workoutTable.cannotMoveLastExercise' }) ||
            'No se puede mover el último ejercicio de un grupo'
        );
        setTableData(resetDragState);
        return;
      }
    }

    // Obtener índices
    const activeIndex = tableData.findIndex(
      (item) =>
        item.rowType === 'exercise' &&
        item.groupNumber === activeItem.groupNumber &&
        item.rowIndex === activeItem.rowIndex
    );

    const overIndex = tableData.findIndex(
      (item) =>
        (item.rowType === 'exercise' &&
          item.groupNumber === overItem.groupNumber &&
          item.rowIndex === overItem.rowIndex) ||
        (item.rowType === 'group' && item.groupNumber === overItem.groupNumber)
    );

    if (activeIndex === overIndex) {
      setTableData(resetDragState);
      return;
    }

    // Crear una copia de los datos para trabajar
    let newData = [...resetDragState];

    // Obtener el ejercicio que estamos moviendo
    const movingExercise = { ...newData[activeIndex] };

    // Si estamos moviendo a un grupo diferente, actualizar el groupNumber
    if (overItem.rowType === 'group') {
      movingExercise.groupNumber = overItem.groupNumber;
      // Ponerlo como primer ejercicio del grupo
      movingExercise.rowIndex = 0;
    } else if (overItem.groupNumber !== movingExercise.groupNumber) {
      // Mover a otro grupo
      movingExercise.groupNumber = overItem.groupNumber;
      movingExercise.rowIndex = overItem.rowIndex + 1; // Ponerlo después del ejercicio destino
    }

    // Eliminar el ejercicio original
    newData.splice(activeIndex, 1);

    // Determinar la posición de inserción
    let insertIndex;

    if (overItem.rowType === 'group') {
      // Insertar justo después del grupo
      insertIndex =
        newData.findIndex((item) => item.rowType === 'group' && item.groupNumber === overItem.groupNumber) + 1;
    } else {
      // Insertar después del ejercicio de destino
      insertIndex =
        newData.findIndex(
          (item) =>
            item.rowType === 'exercise' &&
            item.groupNumber === overItem.groupNumber &&
            item.rowIndex === overItem.rowIndex
        ) + 1;
    }

    // Insertar el ejercicio en la nueva posición
    newData.splice(insertIndex, 0, movingExercise);

    // Actualizar los índices de fila dentro de cada grupo
    updateRowIndices(newData);

    setTableData(newData);
  };

  // Función para actualizar los índices de fila de los ejercicios
  const updateRowIndices = (dataArray) => {
    const groupNumbers = [
      ...new Set(dataArray.filter((item) => item.rowType === 'group').map((item) => item.groupNumber))
    ];

    groupNumbers.forEach((groupNum) => {
      let rowIdx = 0;
      dataArray.forEach((row) => {
        if (row.rowType === 'exercise' && row.groupNumber === groupNum) {
          row.rowIndex = rowIdx++;
        }
      });
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTableData(originalData);
  };

  /****************************************
   * Adding exercises and groups at specific positions
   ****************************************/
  const handleAddExerciseAtPosition = (index) => {
    if (!isEditing) return;

    // Determinar en qué grupo insertar el nuevo ejercicio
    const currentRow = tableData[index];
    let targetGroupNumber;

    if (currentRow.rowType === 'group') {
      // Si se está insertando en una fila de grupo, usar ese número de grupo
      targetGroupNumber = currentRow.groupNumber;
    } else {
      // Si se está insertando en una fila de ejercicio, usar su número de grupo
      targetGroupNumber = currentRow.groupNumber;
    }

    // Contar cuántos ejercicios hay en el grupo destino para el índice
    const exercisesInGroup = tableData.filter(
      (row) => row.rowType === 'exercise' && row.groupNumber === targetGroupNumber
    ).length;

    // Crear un nuevo ejercicio vacío
    const newExercise = {
      rowType: 'exercise',
      name: '',
      exerciseId: null,
      groupNumber: targetGroupNumber,
      rowIndex: 0, // Inicialmente en 0, luego actualizaremos los índices
      weeksData: {},
      isNew: true
    };

    // Crear una copia de los datos de la tabla
    const newTableData = [...tableData];

    // Determinar dónde insertar el nuevo ejercicio
    let insertIndex;

    if (currentRow.rowType === 'group') {
      // Si es una fila de grupo, insertar justo después del grupo
      insertIndex = index + 1;
    } else {
      // Si es un ejercicio, insertar después de este ejercicio
      insertIndex = index + 1;

      // Asignar el rowIndex correcto relativo al ejercicio actual
      newExercise.rowIndex = currentRow.rowIndex + 1;
    }

    // Insertar el nuevo ejercicio
    newTableData.splice(insertIndex, 0, newExercise);

    // Ajustar los índices de los ejercicios en el mismo grupo que vienen después
    for (let i = insertIndex + 1; i < newTableData.length; i++) {
      const row = newTableData[i];
      if (row.rowType === 'exercise' && row.groupNumber === targetGroupNumber) {
        if (row.rowIndex >= newExercise.rowIndex) {
          row.rowIndex++;
        }
      } else if (row.rowType === 'group') {
        // Cuando encontramos el siguiente grupo, terminamos
        break;
      }
    }

    // Actualizar el estado
    setTableData(newTableData);

    // Resetear los estados de inserción
    setHoverRowIndex(null);
    setShowInsertButton(false);

    // Mostrar toast de confirmación
    showToast(
      'success',
      intl.formatMessage({ id: 'common.success' }),
      intl.formatMessage({ id: 'workoutTable.exerciseInserted' }),
      { life: 3000 }
    );
  };

  const handleAddGroup = (index) => {
    if (!isEditing) return;

    // Encontrar el máximo número de grupo existente
    const maxGroupNumber = tableData.reduce((max, row) => {
      if (row.rowType === 'group' && row.groupNumber > max) {
        return row.groupNumber;
      }
      return max;
    }, 0);

    // Crear un nuevo grupo con número siguiente
    const newGroupNumber = maxGroupNumber + 1;
    const newGroup = {
      rowType: 'group',
      groupNumber: newGroupNumber,
      rowIndex: newGroupNumber * 100, // Para mantener el ordenamiento
      isNew: true,
      label: `${intl.formatMessage({ id: 'common.group' })} ${newGroupNumber}`
    };

    // Crear un ejercicio vacío para este grupo
    const newExercise = {
      rowType: 'exercise',
      name: '',
      exerciseId: null,
      groupNumber: newGroupNumber,
      rowIndex: 0,
      weeksData: {},
      isNew: true
    };

    // Determinar dónde insertar el nuevo grupo
    // Vamos a insertarlo después del grupo actual o del grupo al que pertenece el ejercicio actual
    const currentRow = tableData[index];
    let insertAfterIndex;

    if (currentRow.rowType === 'group') {
      // Si es un grupo, necesitamos encontrar el último ejercicio de este grupo
      let i = index + 1;
      while (
        i < tableData.length &&
        tableData[i].rowType === 'exercise' &&
        tableData[i].groupNumber === currentRow.groupNumber
      ) {
        i++;
      }
      insertAfterIndex = i - 1;
    } else {
      // Si es un ejercicio, necesitamos encontrar el último ejercicio de su grupo
      const groupNumber = currentRow.groupNumber;
      let i = index;
      while (
        i < tableData.length &&
        (tableData[i].rowType !== 'group' ||
          i === index ||
          (tableData[i].rowType === 'exercise' && tableData[i].groupNumber === groupNumber))
      ) {
        i++;
      }
      insertAfterIndex = i - 1;
    }

    // Crear una copia de los datos e insertar el nuevo grupo y ejercicio
    const newTableData = [...tableData];
    newTableData.splice(insertAfterIndex + 1, 0, newGroup, newExercise);

    // Actualizar el estado
    setTableData(newTableData);

    // Resetear los estados de inserción
    setHoverRowIndex(null);
    setShowInsertButton(false);

    // Mostrar toast de confirmación
    showToast(
      'success',
      intl.formatMessage({ id: 'common.success' }),
      intl.formatMessage({ id: 'workoutTable.groupInserted' }),
      { life: 3000 }
    );
  };

  /****************************************
   * Adding a new row
   ****************************************/
  const handleAddExercise = () => {
    if (!isEditing) return;

    // Encontrar el último grupo
    const lastGroup = tableData
      .filter((row) => row.rowType === 'group')
      .sort((a, b) => b.groupNumber - a.groupNumber)[0];

    if (!lastGroup) {
      showToast('error', 'Error', intl.formatMessage({ id: 'workoutTable.noGroupsAvailable' }));
      return;
    }

    // Contar cuántos ejercicios hay en el último grupo
    const exercisesInGroup = tableData.filter(
      (row) => row.rowType === 'exercise' && row.groupNumber === lastGroup.groupNumber
    ).length;

    // Crear un nuevo ejercicio vacío
    const newExercise = {
      rowType: 'exercise',
      name: '',
      exerciseId: null, // Añadimos esta propiedad para nuevos ejercicios
      groupNumber: lastGroup.groupNumber,
      rowIndex: exercisesInGroup,
      weeksData: {},
      isNew: true
    };

    // Añadir el ejercicio al final del último grupo
    const newTableData = [...tableData];

    // Encontrar la posición donde insertar el nuevo ejercicio
    let insertIndex = tableData.findIndex(
      (row) => row.rowType === 'group' && row.groupNumber === lastGroup.groupNumber
    );

    // Avanzar hasta el final de los ejercicios de este grupo
    while (
      insertIndex + 1 < newTableData.length &&
      newTableData[insertIndex + 1].rowType === 'exercise' &&
      newTableData[insertIndex + 1].groupNumber === lastGroup.groupNumber
    ) {
      insertIndex++;
    }

    // Insertar el nuevo ejercicio
    newTableData.splice(insertIndex + 1, 0, newExercise);
    setTableData(newTableData);
  };

  /****************************************
   * Save changes
   ****************************************/
  const detectChanges = () => {
    if (!originalData || !tableData) {
      console.log('No hay datos originales o de tabla');
      return {
        newExercises: [],
        movedExercises: [],
        movedGroups: [],
        updatedProperties: []
      };
    }

    const newChanges = {
      newExercises: [],
      movedExercises: [],
      movedGroups: [],
      updatedProperties: []
    };

    // 1. Detectar ejercicios nuevos y asignar exerciseId si es necesario
    tableData.forEach((row) => {
      if (row.rowType === 'exercise' && (row.isNew || !row.exerciseInstanceId)) {
        // Asegurarse de que el ejercicio tenga un exerciseId válido
        if (!row.exerciseId && row.name) {
          const selectedExercise = coachExercises.find((ex) => ex.name === row.name);
          if (selectedExercise) {
            row.exerciseId = selectedExercise.id;
          }
        }

        // Solo añadir a newExercises si tiene un nombre
        if (row.name) {
          console.log('Detectado ejercicio nuevo:', {
            nombre: row.name,
            exerciseId: row.exerciseId,
            groupNumber: row.groupNumber
          });

          newChanges.newExercises.push({
            name: row.name,
            exerciseId: row.exerciseId,
            groupNumber: row.groupNumber,
            rowIndex: row.rowIndex,
            weeksData: row.weeksData
          });
        }
      }
    });

    // 2. Detectar grupos movidos
    const originalGroups = originalData.filter((row) => row.rowType === 'group');
    const currentGroups = tableData.filter((row) => row.rowType === 'group');

    console.log(
      'Grupos originales:',
      originalGroups.map((g) => ({ groupNumber: g.groupNumber, index: originalGroups.indexOf(g) }))
    );
    console.log(
      'Grupos actuales:',
      currentGroups.map((g) => ({ groupNumber: g.groupNumber, index: currentGroups.indexOf(g) }))
    );

    // Crear un mapa de groupNumber para búsqueda más eficiente
    const originalGroupsMap = new Map();
    originalGroups.forEach((group, index) => {
      originalGroupsMap.set(group.groupNumber, { ...group, originalIndex: index });
    });

    // Comparar posiciones de grupos
    currentGroups.forEach((currentGroup, currentIndex) => {
      const originalGroupInfo = originalGroupsMap.get(currentGroup.groupNumber);
      if (originalGroupInfo) {
        // Verificar si el grupo ha cambiado de posición
        if (originalGroupInfo.originalIndex !== currentIndex) {
          // El grupo se ha movido
          console.log(
            `Grupo ${currentGroup.groupNumber} movido: ${originalGroupInfo.originalIndex} -> ${currentIndex}`
          );

          newChanges.movedGroups.push({
            groupNumber: currentGroup.groupNumber,
            newOrder: currentIndex + 1, // Convertir a 1-indexed para el backend
            oldIndex: originalGroupInfo.originalIndex
          });
        }
      } else {
        console.log(`Grupo ${currentGroup.groupNumber} no encontrado en datos originales`);
      }
    });

    if (newChanges.movedGroups.length > 0) {
      console.log('Grupos movidos detectados:', newChanges.movedGroups);
    }

    // 3. Detectar ejercicios movidos (solo si no son parte de un grupo movido)
    const originalExercises = originalData.filter((row) => row.rowType === 'exercise');
    const currentExercises = tableData.filter((row) => row.rowType === 'exercise' && row.exerciseInstanceId);

    // Crear un mapa de exerciseInstanceId para búsqueda más eficiente
    const originalExercisesMap = new Map();
    originalExercises.forEach((ex) => {
      originalExercisesMap.set(ex.exerciseInstanceId, ex);
    });

    // Comparar posiciones de ejercicios
    currentExercises.forEach((currentExercise) => {
      const originalExercise = originalExercisesMap.get(currentExercise.exerciseInstanceId);
      if (originalExercise) {
        // Verificar si el ejercicio es parte de un grupo movido
        const isPartOfMovedGroup = newChanges.movedGroups.some(
          (movedGroup) => movedGroup.groupNumber === currentExercise.groupNumber
        );

        if (!isPartOfMovedGroup) {
          // Si el ejercicio no es parte de un grupo movido, verificar si se movió individualmente
          if (
            currentExercise.groupNumber !== originalExercise.groupNumber ||
            currentExercise.rowIndex !== originalExercise.rowIndex
          ) {
            newChanges.movedExercises.push({
              exerciseInstanceId: currentExercise.exerciseInstanceId,
              name: currentExercise.name, // Añadido el nombre del ejercicio
              oldGroupNumber: originalExercise.groupNumber,
              newGroupNumber: currentExercise.groupNumber,
              oldRowIndex: originalExercise.rowIndex,
              newRowIndex: currentExercise.rowIndex
            });
          }
        }
      }
    });

    // 4. Detectar cambios en propiedades
    currentExercises.forEach((currentExercise) => {
      const originalExercise = originalExercisesMap.get(currentExercise.exerciseInstanceId);
      if (originalExercise) {
        // Detectar cambios en el nombre/ejercicio mismo
        if (currentExercise.name !== originalExercise.name) {
          // Obtener el ID del ejercicio seleccionado
          let exerciseId = currentExercise.exerciseId;
          if (!exerciseId && currentExercise.name) {
            const selectedExercise = coachExercises.find((ex) => ex.name === currentExercise.name);
            if (selectedExercise) {
              exerciseId = selectedExercise.id;
            }
          }

          console.log('Cambio detectado en nombre de ejercicio:', {
            de: originalExercise.name,
            a: currentExercise.name,
            exerciseId: exerciseId,
            exerciseInstanceId: currentExercise.exerciseInstanceId
          });

          if (exerciseId) {
            newChanges.updatedProperties.push({
              exerciseInstanceId: currentExercise.exerciseInstanceId,
              name: currentExercise.name,
              weekNumber: 1, // No importa el número de semana para el cambio de ejercicio
              property: 'exerciseId',
              value: exerciseId
            });
          } else {
            console.warn(`No se pudo encontrar exerciseId para "${currentExercise.name}". Este cambio no se aplicará.`);
          }
        }

        // Verificar cambios en las propiedades por semana
        Object.keys(currentExercise.weeksData).forEach((weekNumber) => {
          const currentWeekData = currentExercise.weeksData[weekNumber];
          const originalWeekData = originalExercise.weeksData[weekNumber] || {};

          if (currentWeekData) {
            properties.forEach((prop) => {
              // Comparación estricta para evitar falsos positivos (undefined vs null, 0 vs null, etc.)
              const currentValue = currentWeekData[prop];
              const originalValue = originalWeekData[prop];

              // Usar comparación estricta con === null porque 0 es un valor válido para algunas propiedades
              const isCurrentValueNull = currentValue === null || currentValue === undefined;
              const isOriginalValueNull = originalValue === null || originalValue === undefined;

              // Solo registrar cambios cuando los valores son realmente diferentes
              const hasChanged =
                // Caso 1: Uno es null/undefined y el otro no
                isCurrentValueNull !== isOriginalValueNull ||
                // Caso 2: Ninguno es null/undefined y son diferentes
                (!isCurrentValueNull && !isOriginalValueNull && currentValue !== originalValue);

              if (hasChanged) {
                console.log(`Cambio detectado en propiedad ${prop} para ${currentExercise.name}:`, {
                  ejercicio: currentExercise.name,
                  semana: weekNumber,
                  propiedad: prop,
                  valorAnterior: originalValue,
                  valorNuevo: currentValue
                });

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

    console.log('Cambios detectados:', newChanges);
    return newChanges;
  };

  const buildSavePayload = (changesObj) => {
    if (!changesObj) {
      console.error('No se recibieron cambios para construir el payload');
      return null;
    }

    // Mostrar un resumen del payload antes de enviarlo
    if (changesObj.movedGroups && changesObj.movedGroups.length > 0) {
      console.log(
        'Payload de grupos movidos:',
        changesObj.movedGroups.map((g) => ({
          groupNumber: g.groupNumber,
          newOrder: g.newOrder
        }))
      );
    }

    const payload = {
      cycleId,
      dayNumber,
      changes: {
        newExercises: changesObj.newExercises.map((ex) => ({
          name: ex.name,
          exerciseId: ex.exerciseId,
          groupNumber: ex.groupNumber,
          rowIndex: ex.rowIndex,
          weeksData: Object.keys(ex.weeksData).reduce((acc, weekNum) => {
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

        movedExercises: changesObj.movedExercises.map((ex) => ({
          name: ex.name,
          exerciseInstanceId: ex.exerciseInstanceId,
          oldGroupNumber: ex.oldGroupNumber,
          newGroupNumber: ex.newGroupNumber,
          oldRowIndex: ex.oldRowIndex,
          newRowIndex: ex.newRowIndex
        })),

        movedGroups: changesObj.movedGroups.map((group) => ({
          groupNumber: group.groupNumber,
          newOrder: group.newOrder
        })),

        updatedProperties: changesObj.updatedProperties.map((update) => ({
          exerciseInstanceId: update.exerciseInstanceId,
          name: update.name,
          weekNumber: update.weekNumber,
          property: update.property,
          value: update.value
        }))
      }
    };

    console.log('Payload completo:', JSON.stringify(payload, null, 2));
    return payload;
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);

      // Asegurarse de que todos los ejercicios tengan exerciseId antes de detectar cambios
      const updatedTableData = [...tableData];
      let exerciseIdsUpdated = false;

      // 1. Verificar que los ejercicios tengan exerciseId
      updatedTableData.forEach((row) => {
        if (row.rowType === 'exercise' && row.name && !row.exerciseId) {
          const selectedExercise = coachExercises.find((ex) => ex.name === row.name);
          if (selectedExercise) {
            row.exerciseId = selectedExercise.id;
            exerciseIdsUpdated = true;
            console.log(`Asignado exerciseId ${selectedExercise.id} a ejercicio ${row.name}`);
          } else {
            console.warn(`No se pudo encontrar exerciseId para "${row.name}"`);
          }
        }
      });

      // 2. Verificar que los ejercicios nuevos estén marcados como isNew
      updatedTableData.forEach((row) => {
        if (row.rowType === 'exercise' && !row.exerciseInstanceId && !row.isNew) {
          row.isNew = true;
          exerciseIdsUpdated = true;
          console.log(`Marcando ejercicio ${row.name} como nuevo porque no tiene exerciseInstanceId`);
        }
      });

      // Si se actualizaron IDs o flags, actualizar el estado antes de continuar
      if (exerciseIdsUpdated) {
        setTableData(updatedTableData);
      }

      // Detectar cambios
      const changesObj = detectChanges();
      console.log('Objeto de cambios:', changesObj);

      // Verificar que ningún grupo quede sin ejercicios después de los cambios
      if (changesObj.movedExercises && changesObj.movedExercises.length > 0) {
        // Crear una copia de los datos para simular los cambios
        const simulatedData = [...tableData];

        // Crear un mapa para contar cuántos ejercicios hay en cada grupo
        const exercisesPerGroup = {};
        simulatedData.forEach((row) => {
          if (row.rowType === 'exercise') {
            exercisesPerGroup[row.groupNumber] = (exercisesPerGroup[row.groupNumber] || 0) + 1;
          }
        });

        // Simular el movimiento de cada ejercicio
        /*
        for (const movedEx of changesObj.movedExercises) {
          // Restar 1 del grupo original
          exercisesPerGroup[movedEx.oldGroupNumber] = (exercisesPerGroup[movedEx.oldGroupNumber] || 1) - 1;

          // Si un grupo queda sin ejercicios, mostrar error y cancelar
          if (exercisesPerGroup[movedEx.oldGroupNumber] === 0) {
            showToast(
              'error',
              intl.formatMessage({ id: 'common.error' }),
              intl.formatMessage({ id: 'workoutTable.groupCannotBeEmpty' }) ||
                `El grupo ${movedEx.oldGroupNumber} quedaría sin ejercicios después de los cambios`
            );
            setIsLoading(false);
            return;
          }

          // Sumar 1 al nuevo grupo
          exercisesPerGroup[movedEx.newGroupNumber] = (exercisesPerGroup[movedEx.newGroupNumber] || 0) + 1;
        }
        */
      }

      // Validar y ajustar grupos movidos si es necesario
      if (changesObj.movedGroups && changesObj.movedGroups.length > 0) {
        // Verificar que todos los grupos tengan valores válidos
        changesObj.movedGroups.forEach((group) => {
          console.log(`Validando grupo movido: groupNumber=${group.groupNumber}, newOrder=${group.newOrder}`);

          // Asegurarse de que newOrder sea un número
          if (typeof group.newOrder !== 'number') {
            console.warn(
              `Grupo ${group.groupNumber} tiene newOrder inválido: ${group.newOrder}, convirtiendo a número`
            );
            group.newOrder = parseInt(group.newOrder) || 1;
          }

          // Garantizar que groupNumber es un número
          if (typeof group.groupNumber !== 'number') {
            console.warn(
              `Grupo con newOrder=${group.newOrder} tiene groupNumber inválido: ${group.groupNumber}, convirtiendo a número`
            );
            group.groupNumber = parseInt(group.groupNumber) || 1;
          }
        });
      }

      // Resumen de los cambios encontrados
      console.log(`Resumen de cambios:
        - Ejercicios nuevos: ${changesObj.newExercises.length}
        - Ejercicios movidos: ${changesObj.movedExercises.length}
        - Grupos movidos: ${changesObj.movedGroups.length}
        - Propiedades actualizadas: ${changesObj.updatedProperties.length}
      `);

      // Validar que todos los ejercicios nuevos con nombre tengan exerciseId
      const missingExerciseIds = changesObj.newExercises.filter((ex) => ex.name && !ex.exerciseId);
      if (missingExerciseIds.length > 0) {
        const missingNames = missingExerciseIds.map((ex) => ex.name).join(', ');
        showToast(
          'error',
          intl.formatMessage({ id: 'common.error' }),
          `${intl.formatMessage({ id: 'workoutTable.missingExerciseIds' })}: ${missingNames}`
        );
        setIsLoading(false);
        return;
      }

      // Filtrar ejercicios sin nombre antes de guardar
      changesObj.newExercises = changesObj.newExercises.filter((ex) => ex.name);

      // Si no hay cambios, mostrar mensaje y salir
      if (
        !changesObj ||
        (changesObj.newExercises.length === 0 &&
          changesObj.movedExercises.length === 0 &&
          changesObj.movedGroups.length === 0 &&
          changesObj.updatedProperties.length === 0)
      ) {
        showToast(
          'info',
          intl.formatMessage({ id: 'common.noChanges' }),
          intl.formatMessage({ id: 'common.noChangesToSave' })
        );
        setIsLoading(false);
        return;
      }

      // Construir payload
      const payload = buildSavePayload(changesObj);
      if (!payload) {
        throw new Error('No se pudo construir el payload para guardar los cambios');
      }

      console.log('Enviando payload a la API:', JSON.stringify(payload, null, 2));

      // Llamar a la API
      await saveWorkoutChanges(payload);

      // Actualizar originalData con los nuevos datos
      setOriginalData(JSON.parse(JSON.stringify(tableData)));

      // Resetear cambios
      setChanges({
        newExercises: [],
        movedExercises: [],
        movedGroups: [],
        updatedProperties: []
      });

      // Mostrar mensaje de éxito
      showToast(
        'success',
        intl.formatMessage({ id: 'common.success' }),
        intl.formatMessage({ id: 'workoutTable.changesSaved' })
      );

      // Salir del modo edición
      setIsEditing(false);
    } catch (error) {
      console.error('Error guardando cambios:', error);
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

  function renderTableHeader() {
    const { headerGroup, usedProps } = buildHeaderGroup() || {};
    // If there's no data, bail out
    if (!headerGroup || !usedProps) return null;

    // First row: "Exercise" + one column group per week
    // second row: the actual properties in each week
    return (
      <thead>
        <tr>
          <th rowSpan={2} style={{ width: '50rem', padding: '0.5rem' }}>
            {intl.formatMessage({ id: 'workoutTable.exercise' })}
          </th>
          {usedProps.map((propsList, i) => (
            <th
              key={`week${i}`}
              colSpan={propsList.length}
              style={{
                borderRight: '1px solid #ccc',
                borderLeft: '1px solid #ccc'
              }}
              overflow={'hidden'}
            >
              {intl.formatMessage({ id: 'workoutTable.week' }, { week: i + 1 })}
            </th>
          ))}
        </tr>
        <tr>
          {usedProps.map((propsList, i) =>
            propsList.map((prop, index) => (
              <th
                style={{
                  padding: '0.5rem',
                  borderRight: index === propsList.length - 1 ? '1px solid #ccc' : 'none',
                  borderLeft: index === 0 ? '1px solid #ccc' : 'none',

                  overflow: 'hidden'
                }}
                key={`${prop}-header-${i}`}
              >
                {propertyLabels[prop] || prop}
              </th>
            ))
          )}
        </tr>
      </thead>
    );
  }

  function renderDataCells(rowData) {
    // Si es un grupo, devolvemos celdas vacías
    if (rowData.rowType === 'group') {
      const totalColumns = propertiesUsedByWeek.reduce((acc, list) => acc + list.length, 0);
      return Array.from({ length: totalColumns }).map((_, idx) => (
        <td key={`group-${rowData.groupNumber}-${idx}`} style={{ padding: '.5rem' }} />
      ));
    }

    // Para filas de ejercicios
    return propertiesUsedByWeek.map((propsList, weekIndex) => {
      const realWeek = weekIndex + 1;
      return propsList.map((prop, index) => {
        const cellKey = `ex-${rowData.name}-w${realWeek}-${prop}`;
        const cellValue =
          rowData.weeksData[realWeek] && rowData.weeksData[realWeek][prop] !== undefined
            ? rowData.weeksData[realWeek][prop]
            : '';

        return (
          <td
            style={{
              padding: '.5rem',
              borderRight: index === propsList.length - 1 ? '1px solid #ccc' : 'none',
              borderLeft: index === 0 ? '1px solid #ccc' : 'none',
              overflow: 'hidden',
              width: '100px'
            }}
            key={cellKey}
          >
            {isEditing ? renderEditableCell(rowData, prop, realWeek, cellValue) : cellValue}
          </td>
        );
      });
    });
  }

  function renderEditableCell(rowData, prop, weekNum, currentValue) {
    // Si no existe la estructura de datos para esta semana, crearla
    if (!rowData.weeksData[weekNum]) {
      rowData.weeksData[weekNum] = { exerciseInstanceId: null };
    }

    // Determinar el tipo de editor según la propiedad
    switch (prop) {
      case 'sets':
      case 'repetitions':
      case 'weight':
      case 'time':
      case 'restInterval':
      case 'duration':
      case 'distance':
      case 'tempo':
      case 'difficulty':
        return (
          <InputNumber
            value={currentValue}
            onValueChange={(e) => handlePropertyChange(rowData, prop, weekNum, e.value)}
            size="small"
            style={{ width: '100%' }}
            min={0}
            showButtons={false}
          />
        );
      case 'notes':
        return (
          <InputText
            value={currentValue || ''}
            onChange={(e) => handlePropertyChange(rowData, prop, weekNum, e.target.value)}
            style={{ width: '100%' }}
            size="small"
          />
        );
      default:
        return currentValue;
    }
  }

  function handlePropertyChange(rowData, prop, weekNum, newValue) {
    // Actualizar el valor en el objeto de datos
    if (!rowData.weeksData[weekNum]) {
      rowData.weeksData[weekNum] = { exerciseInstanceId: null };
    }
    rowData.weeksData[weekNum][prop] = newValue;

    // Actualizar el estado de la tabla
    setTableData([...tableData]);
  }

  function handleExerciseNameChange(rowData, newName) {
    // Actualizar el nombre en el objeto de datos
    const oldName = rowData.name;
    rowData.name = newName;

    // Actualizar el exerciseId siempre que cambie el nombre del ejercicio
    // independientemente de si es nuevo o existente
    const selectedExercise = coachExercises.find((ex) => ex.name === newName);
    if (selectedExercise) {
      const oldExerciseId = rowData.exerciseId;
      rowData.exerciseId = selectedExercise.id; // Asumiendo que cada ejercicio en coachExercises tiene un id

      console.log('Ejercicio cambiado:', {
        de: oldName,
        a: newName,
        deId: oldExerciseId,
        aId: selectedExercise.id,
        exerciseInstanceId: rowData.exerciseInstanceId
      });

      // Si es un ejercicio que no existía previamente (sin exerciseInstanceId),
      // asegurarnos de marcarlo como nuevo para que se cree correctamente
      if (!rowData.exerciseInstanceId && !rowData.isNew) {
        rowData.isNew = true;
        console.log('Marcando ejercicio como nuevo:', rowData.name);
      }
    } else {
      // Si no se encuentra el ejercicio, establecer exerciseId a null para evitar referencias incorrectas
      console.warn(`No se encontró el ejercicio "${newName}" en la lista de ejercicios del entrenador.`);
      rowData.exerciseId = null;
    }

    // Actualizar el estado de la tabla
    setTableData([...tableData]);
  }

  function handleGroupLabelChange(rowData, newLabel) {
    // Actualizar la etiqueta en el objeto de datos
    rowData.label = newLabel;

    // Actualizar el estado de la tabla
    setTableData([...tableData]);
  }

  // Referencia para la primera columna
  const firstColumnRef = useRef(null);
  // Estado para controlar si el mouse está sobre la primera columna
  const [isHoveringFirstColumn, setIsHoveringFirstColumn] = useState(false);

  // Efecto para manejar el botón de inserción cuando el mouse está sobre la primera columna
  useEffect(() => {
    console.log('isHoveringFirstColumn', isHoveringFirstColumn);
    if (isEditing && isHoveringFirstColumn) {
      setShowInsertButton(true);
    }

    return () => {
      // No eliminamos el estado al desmontar para evitar parpadeos
    };
  }, [isHoveringFirstColumn, isEditing]);

  useEffect(() => {
    //console.log('hoverRowIndex', hoverRowIndex);
    //console.log('isHoveringFirstColumn', isHoveringFirstColumn);
    //console.log('showInsertButton', showInsertButton);
  }, [hoverRowIndex, isHoveringFirstColumn, showInsertButton]);

  function SortableRow({ rowData, index }) {
    const rowKey =
      rowData.rowType === 'group' ? `group-${rowData.groupNumber}` : `ex-${rowData.groupNumber}-${rowData.rowIndex}`;

    const isDraggable =
      isEditing &&
      (rowData.rowType === 'group' || (rowData.rowType === 'exercise' && !isDraggingGroup && !rowData.isDragDisabled));

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: rowKey,
      disabled: !isDraggable
    });

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      transition,
      ...(isDragging || (isDraggingGroup && rowData.isBeingDragged)
        ? {
            background: isDarkMode ? '#2c3e50' : '#f8f9fa',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
            width: '100%',
            tableLayout: 'fixed',
            border: isDarkMode ? '1px solid #4a6785' : '1px solid #c8c8c8',
            margin: '2px 0',
            opacity: '0.9',
            cursor: 'grabbing',
            zIndex: 1000
          }
        : {})
    };

    return (
      <>
        {isEditing && showInsertButton && isHoveringFirstColumn && index === hoverRowIndex && (
          <tr className="insert-row">
            {/*<td colSpan={1 + propertiesUsedByWeek.reduce((acc, list) => acc + list.length, 0)}> */}
            <td colSpan={1}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '2px 10px' }}>
                <div
                  className="insert-button"
                  onClick={() => handleAddExerciseAtPosition(index)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: isDarkMode ? '#4a5568' : '#e2e8f0',
                    color: isDarkMode ? 'white' : 'black',
                    alignItems: 'center',
                    flex: 1
                  }}
                >
                  <FaPlus style={{ marginRight: '5px' }} />
                  {intl.formatMessage({ id: 'workoutTable.insertExercise' })}
                </div>
                <div
                  className="insert-button"
                  onClick={() => handleAddGroup(index)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: isDarkMode ? '#4a5568' : '#e2e8f0',
                    color: isDarkMode ? 'white' : 'black',
                    alignItems: 'center',
                    flex: 1
                  }}
                >
                  <FaPlus style={{ marginRight: '5px' }} />
                  {intl.formatMessage({ id: 'plan.group.addGroup' })}
                </div>
              </div>
            </td>
          </tr>
        )}
        <tr ref={setNodeRef} style={style} className={rowClassName(rowData)}>
          <td
            ref={firstColumnRef}
            className={`${isEditing ? 'hover-column' : ''} ${isDarkMode ? 'dark-mode' : ''}`}
            style={{
              minWidth: '150px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem',
              overflow: 'hidden',
              position: 'relative',
              cursor: isEditing ? 'pointer' : 'default',
              backgroundColor: isHoveringFirstColumn && isEditing ? (isDarkMode ? '#3a4252' : '#f0f4f8') : 'transparent'
            }}
            onMouseEnter={() => {
              if (isEditing) {
                setHoverRowIndex(index + 1);
                setIsHoveringFirstColumn(true);
              }
            }}
            {...(isEditing && isDraggable ? { ...attributes, ...listeners } : {})}
          >
            {isEditing && isDraggable && (
              <FaGripVertical
                style={{
                  marginRight: '0.3rem',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  flexShrink: 0,
                  opacity: isDragging ? 0.5 : 1
                }}
              />
            )}
            <span style={{ overflow: 'hidden', width: '100%' }}>{renderNameColumn(rowData)}</span>
          </td>
          {renderDataCells(rowData)}
        </tr>
      </>
    );
  }

  // Modificar el itemTemplate para el dropdown de días
  const dayItemTemplate = (option) => {
    const isUsed = daysUsed.includes(option.value);
    return <div className={`day-option ${isUsed ? 'highlighted-option' : ''}`}>{option.label}</div>;
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      {/* 1) Cycle & Day selection */}
      <div className="grid" style={{ marginBottom: '0.5rem' }}>
        <div className="col-12 md:col-3">
          <label htmlFor="cycle" style={{ marginBottom: '0.3rem', display: 'block' }}>
            {intl.formatMessage({ id: 'common.cycle' })}
          </label>
          <Dropdown
            inputId="cycle"
            value={cycleId}
            options={cycleOptions}
            onChange={(e) => setCycleId(e.value)}
            placeholder={intl.formatMessage({ id: 'common.selectCycle' })}
            optionLabel="label"
            optionValue="value"
            className="w-full"
            itemTemplate={(option) => (
              <div className={option.value === -1 ? 'highlighted-option' : ''}>{option.label}</div>
            )}
          />
        </div>
        <div className="col-12 md:col-3">
          <label htmlFor="day" style={{ marginBottom: '0.3rem', display: 'block' }}>
            {intl.formatMessage({ id: 'common.day' })}
          </label>
          <Dropdown
            inputId="day"
            value={dayNumber}
            options={dayOptions}
            onChange={(e) => setDayNumber(e.value)}
            placeholder={intl.formatMessage({ id: 'common.selectDay' })}
            optionLabel="label"
            optionValue="value"
            className="w-full"
            itemTemplate={dayItemTemplate}
            disabled={!cycleId}
          />
        </div>
      </div>

      {/* 2) Editing Buttons */}
      <div style={{ marginBottom: '1rem' }}>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)}>{intl.formatMessage({ id: 'common.edit' })}</button>
        ) : (
          <button onClick={handleCancelEdit}>{intl.formatMessage({ id: 'common.cancel' })}</button>
        )}

        {isEditing && (
          <>
            <button style={{ marginLeft: '1rem' }} onClick={handleAddExercise}>
              {intl.formatMessage({ id: 'plan.group.addExercise' })}
            </button>
            <button style={{ marginLeft: '1rem' }} onClick={() => handleAddGroup()}>
              {intl.formatMessage({ id: 'plan.group.addGroup' })}
            </button>
            <button style={{ marginLeft: '1rem' }} onClick={handleSaveChanges}>
              {intl.formatMessage({ id: 'common.save' })}
            </button>
          </>
        )}
      </div>

      {/* Guía visual para el modo de edición */}
      {isEditing && (
        <div
          style={{
            padding: '10px 15px',
            marginBottom: '1rem',
            borderRadius: '5px',
            backgroundColor: isDarkMode ? 'rgba(66, 153, 225, 0.15)' : 'rgba(66, 153, 225, 0.1)',
            border: '1px solid rgba(66, 153, 225, 0.3)',
            fontSize: '0.9rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <FaGripVertical style={{ marginRight: '8px', opacity: 0.7 }} />
            <span>
              <FormattedMessage id="tooltip.dragGroup" defaultMessage="Arrastra para reordenar grupos y ejercicios" />
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FaPlus style={{ marginRight: '8px', opacity: 0.7 }} />
            <span>
              <FormattedMessage
                id="tooltip.hoverForOptions"
                defaultMessage="Pasa el cursor sobre una fila para ver opciones de inserción"
              />
            </span>
          </div>
        </div>
      )}

      {isLoading ? (
        <p style={{ margin: '0.5rem' }}>{intl.formatMessage({ id: 'exercise.properties.loading' })}</p>
      ) : tableData.length === 0 ? (
        <div style={{ margin: '0.5rem' }}>
          <FormattedMessage id="common.noData" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <table className="p-datatable p-datatable-sm" style={tableStyles}>
            {renderTableHeader()}
            <tbody>
              <SortableContext
                items={tableData.map((row) =>
                  row.rowType === 'group' ? `group-${row.groupNumber}` : `ex-${row.groupNumber}-${row.rowIndex}`
                )}
                strategy={verticalListSortingStrategy}
              >
                {tableData.map((rowData, index) => (
                  <SortableRow
                    key={
                      rowData.rowType === 'group'
                        ? `group-${rowData.groupNumber}`
                        : `ex-${rowData.groupNumber}-${rowData.rowIndex}-${rowData.name || 'unnamed'}-${rowData.exerciseInstanceId || Math.random().toString(36).substr(2, 9)}`
                    }
                    rowData={rowData}
                    index={index}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>

          {/* Añadir el DragOverlay para mostrar el elemento arrastrado */}
          <DragOverlay>
            {activeId ? (
              <table className="p-datatable p-datatable-sm" style={tableStyles}>
                <tbody>
                  {tableData
                    .filter((row) => {
                      if (isDraggingGroup) {
                        return row.isBeingDragged;
                      } else {
                        if (row.rowType === 'group') {
                          return `group-${row.groupNumber}` === activeId;
                        } else {
                          return `ex-${row.groupNumber}-${row.rowIndex}` === activeId;
                        }
                      }
                    })
                    .map((rowData, index) => (
                      <tr
                        key={`overlay-${index}`}
                        className={rowClassName(rowData)}
                        style={{
                          background: isDarkMode ? '#2c3e50' : '#f8f9fa',
                          boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                          width: '100%',
                          tableLayout: 'fixed',
                          border: isDarkMode ? '1px solid #4a6785' : '1px solid #c8c8c8',
                          margin: '2px 0',
                          opacity: '0.9'
                        }}
                      >
                        <td
                          style={{
                            minWidth: '150px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.5rem',
                            overflow: 'hidden'
                          }}
                        >
                          <FaGripVertical style={{ marginRight: '0.3rem', cursor: 'grab', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', width: '100%' }}>{renderNameColumn(rowData)}</span>
                        </td>
                        {renderDataCells(rowData)}
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
      <CreateTrainingCycleDialog
        clientId={clientData?.id}
        draggable={false}
        resizable={false}
        dismissableMask
        className="responsive-dialog"
        header={intl.formatMessage({ id: 'workoutTable.newCycle' })}
        visible={newCycleDialogVisible}
        onHide={() => setNewCycleDialogVisible(false)}
        setRefreshKey={refreshTable}
      />
    </div>
  );
}

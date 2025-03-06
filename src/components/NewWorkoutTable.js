import React, { useState, useEffect, useContext } from 'react';
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
  // Corregir la función handleDragStart para que funcione con los nuevos IDs
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

        // Marcar todos los elementos del grupo
        const updatedData = tableData.map((row) => {
          if (row.groupNumber === groupNumber) {
            return { ...row, isBeingDragged: true };
          }
          return row;
        });

        setTableData(updatedData);
      }
    }
  };

  // Reemplazar handleDragEnd
  const handleDragEnd = (event) => {
    const { active, over } = event;

    // Restablecer estados
    setActiveId(null);
    setIsDraggingGroup(false);
    setActiveGroup(null);

    // Limpiar marcas de arrastre
    const resetDragState = tableData.map((row) => ({
      ...row,
      isBeingDragged: false
    }));

    // Si no hay destino, solo restablecemos el estado
    if (!over) {
      setTableData(resetDragState);
      return;
    }

    // Obtener información sobre las filas activa y destino
    const activeItem = tableData.find((item) => {
      if (item.rowType === 'group') {
        return `group-${item.groupNumber}` === active.id;
      } else {
        return `ex-${item.groupNumber}-${item.rowIndex}` === active.id;
      }
    });

    const overItem = tableData.find((item) => {
      if (item.rowType === 'group') {
        return `group-${item.groupNumber}` === over.id;
      } else {
        return `ex-${item.groupNumber}-${item.rowIndex}` === over.id;
      }
    });

    // Si no encontramos alguno de los elementos, salimos
    if (!activeItem || !overItem) {
      setTableData(resetDragState);
      return;
    }

    // Obtener índices
    const activeIndex = tableData.findIndex((item) => {
      if (item.rowType === 'group') {
        return `group-${item.groupNumber}` === active.id;
      } else {
        return `ex-${item.groupNumber}-${item.rowIndex}` === active.id;
      }
    });

    const overIndex = tableData.findIndex((item) => {
      if (item.rowType === 'group') {
        return `group-${item.groupNumber}` === over.id;
      } else {
        return `ex-${item.groupNumber}-${item.rowIndex}` === over.id;
      }
    });

    if (activeIndex === overIndex) {
      setTableData(resetDragState);
      return;
    }

    // Verificar si el ejercicio movido dejaría su grupo vacío
    if (activeItem.rowType === 'exercise') {
      const exercisesInSameGroup = tableData.filter(
        (item) => item.rowType === 'exercise' && item.groupNumber === activeItem.groupNumber && item !== activeItem
      );

      if (exercisesInSameGroup.length === 0) {
        setTableData(resetDragState);
        return;
      }
    }

    // Crear una copia de los datos para trabajar
    let newData = [...resetDragState];

    // Si es un grupo, mover todo el grupo
    if (activeItem.rowType === 'group') {
      // Encontrar todos los ejercicios del grupo
      const groupExercises = [];
      const groupNumber = activeItem.groupNumber;

      // Crear una copia del grupo
      const groupRow = { ...activeItem };

      // Encontrar todos los ejercicios que pertenecen a este grupo
      const exercisesOfGroup = newData.filter(
        (item) => item.rowType === 'exercise' && item.groupNumber === groupNumber
      );

      // Eliminar el grupo y sus ejercicios del array original
      newData = newData.filter(
        (item) =>
          !(item.rowType === 'group' && item.groupNumber === groupNumber) &&
          !(item.rowType === 'exercise' && item.groupNumber === groupNumber)
      );

      // Determinar la posición de inserción
      let insertIndex;

      if (overItem.rowType === 'group') {
        // Si el destino es otro grupo
        insertIndex = newData.findIndex(
          (item) => item.rowType === 'group' && item.groupNumber === overItem.groupNumber
        );

        // Si estamos moviendo hacia abajo, insertar después del grupo destino y sus ejercicios
        if (activeIndex < overIndex) {
          // Contar cuántos ejercicios tiene el grupo destino
          const exercisesInTargetGroup = newData.filter(
            (item) => item.rowType === 'exercise' && item.groupNumber === overItem.groupNumber
          ).length;

          // Ajustar la posición de inserción
          insertIndex += exercisesInTargetGroup + 1;
        }
      } else {
        // Si el destino es un ejercicio
        const targetGroupNumber = overItem.groupNumber;

        // Encontrar el grupo al que pertenece el ejercicio destino
        insertIndex = newData.findIndex((item) => item.rowType === 'group' && item.groupNumber === targetGroupNumber);

        // Si estamos moviendo hacia abajo, insertar después del grupo destino y sus ejercicios
        if (activeIndex < overIndex) {
          // Contar cuántos ejercicios tiene el grupo destino
          const exercisesInTargetGroup = newData.filter(
            (item) => item.rowType === 'exercise' && item.groupNumber === targetGroupNumber
          ).length;

          // Ajustar la posición de inserción
          insertIndex += exercisesInTargetGroup + 1;
        }
      }

      // Insertar el grupo y sus ejercicios en la nueva posición
      if (insertIndex !== -1) {
        newData.splice(insertIndex, 0, groupRow, ...exercisesOfGroup);
      }
    } else {
      // CASO: Mover ejercicio individual

      // 1. Crear una copia del ejercicio que estamos moviendo
      const movedExercise = { ...activeItem };

      // 2. Determinar el grupo destino y la posición
      const targetGroupNumber = overItem.rowType === 'group' ? overItem.groupNumber : overItem.groupNumber;
      const targetRowIndex = overItem.rowType === 'group' ? 0 : overItem.rowIndex;

      // 3. Eliminar el ejercicio de su posición original
      newData = newData.filter(
        (item) =>
          !(
            item.rowType === 'exercise' &&
            item.groupNumber === activeItem.groupNumber &&
            item.rowIndex === activeItem.rowIndex
          )
      );

      // 4. Preparar el ejercicio para su nueva posición
      movedExercise.groupNumber = targetGroupNumber;

      // 5. Insertar el ejercicio en la nueva posición
      if (overItem.rowType === 'group') {
        // Si el destino es un grupo, insertar al principio del grupo
        const groupIndex = newData.findIndex(
          (item) => item.rowType === 'group' && item.groupNumber === targetGroupNumber
        );

        if (groupIndex !== -1) {
          newData.splice(groupIndex + 1, 0, movedExercise);
        }
      } else {
        // Si el destino es otro ejercicio

        // Encontrar todos los ejercicios del grupo destino
        const groupExercises = newData.filter(
          (item) => item.rowType === 'exercise' && item.groupNumber === targetGroupNumber
        );

        // Ordenar los ejercicios por rowIndex
        groupExercises.sort((a, b) => a.rowIndex - b.rowIndex);

        // Crear un nuevo array con los ejercicios reordenados
        const newGroupExercises = [];

        // Determinar si estamos moviendo hacia arriba o hacia abajo
        const isMovingDown = activeIndex < overIndex;

        if (isMovingDown) {
          // Si movemos hacia abajo, insertar después del ejercicio destino
          for (let i = 0; i < groupExercises.length; i++) {
            newGroupExercises.push(groupExercises[i]);
            if (groupExercises[i].rowIndex === targetRowIndex) {
              newGroupExercises.push(movedExercise);
            }
          }
        } else {
          // Si movemos hacia arriba, insertar antes del ejercicio destino
          for (let i = 0; i < groupExercises.length; i++) {
            if (groupExercises[i].rowIndex === targetRowIndex) {
              newGroupExercises.push(movedExercise);
            }
            newGroupExercises.push(groupExercises[i]);
          }
        }

        // Eliminar los ejercicios antiguos del grupo
        newData = newData.filter((item) => !(item.rowType === 'exercise' && item.groupNumber === targetGroupNumber));

        // Encontrar el grupo en newData
        const groupIndex = newData.findIndex(
          (item) => item.rowType === 'group' && item.groupNumber === targetGroupNumber
        );

        // Insertar los ejercicios reordenados después del grupo
        if (groupIndex !== -1) {
          newData.splice(groupIndex + 1, 0, ...newGroupExercises);
        }
      }
    }

    // Actualizar los índices de fila dentro de cada grupo
    const groupNumbers = [
      ...new Set(newData.filter((item) => item.rowType === 'group').map((item) => item.groupNumber))
    ];

    groupNumbers.forEach((groupNum) => {
      let rowIdx = 0;
      newData.forEach((row) => {
        if (row.rowType === 'exercise' && row.groupNumber === groupNum) {
          row.rowIndex = rowIdx++;
        }
      });
    });

    // Verificar que no haya duplicados
    const uniqueIds = new Set();
    const cleanedData = newData.filter((row) => {
      const rowId =
        row.rowType === 'group'
          ? `group-${row.groupNumber}`
          : `ex-${row.groupNumber}-${row.rowIndex}-${row.name || 'unnamed'}`;

      if (uniqueIds.has(rowId)) {
        return false;
      }

      uniqueIds.add(rowId);
      return true;
    });

    setTableData(cleanedData);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTableData(originalData);
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
    if (!originalData || !tableData) return;

    const newChanges = {
      newExercises: [],
      movedExercises: [],
      movedGroups: [],
      updatedProperties: []
    };

    // 1. Detectar ejercicios nuevos y asignar exerciseId si es necesario
    tableData.forEach((row) => {
      if (row.rowType === 'exercise' && row.isNew) {
        // Asegurarse de que el ejercicio tenga un exerciseId válido
        if (!row.exerciseId && row.name) {
          const selectedExercise = coachExercises.find((ex) => ex.name === row.name);
          if (selectedExercise) {
            row.exerciseId = selectedExercise.id;
          }
        }

        // Solo añadir a newExercises si tiene un nombre
        if (row.name) {
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

    // 2. Detectar ejercicios movidos
    const originalExercises = originalData.filter((row) => row.rowType === 'exercise');
    const currentExercises = tableData.filter((row) => row.rowType === 'exercise' && !row.isNew);

    // Crear un mapa de exerciseInstanceId para búsqueda más eficiente
    const originalExercisesMap = new Map();
    originalExercises.forEach((ex) => {
      originalExercisesMap.set(ex.exerciseInstanceId, ex);
    });

    currentExercises.forEach((currentEx) => {
      // Buscar por exerciseInstanceId usando el mapa
      const originalEx = originalExercisesMap.get(currentEx.exerciseInstanceId);
      if (originalEx) {
        // Verificar si cambió de posición o grupo
        if (originalEx.rowIndex !== currentEx.rowIndex || originalEx.groupNumber !== currentEx.groupNumber) {
          newChanges.movedExercises.push({
            name: currentEx.name,
            exerciseInstanceId: currentEx.exerciseInstanceId,
            oldGroupNumber: originalEx.groupNumber,
            newGroupNumber: currentEx.groupNumber,
            oldRowIndex: originalEx.rowIndex,
            newRowIndex: currentEx.rowIndex
          });
        }

        // Verificar cambio de ejercicio (nombre o id) - SOLO si realmente cambió
        // Solo registrar cambios si realmente hubo un cambio en el nombre o en el exerciseId
        if (originalEx.name !== currentEx.name) {
          // Buscar el exerciseId correcto basado en el nombre
          let newExerciseId = currentEx.exerciseId;
          if (!newExerciseId && currentEx.name) {
            const matchingExercise = coachExercises.find((ex) => ex.name === currentEx.name);
            if (matchingExercise) {
              newExerciseId = matchingExercise.id;
            }
          }

          // Solo añadir a updatedProperties si el exerciseId realmente cambió
          if (originalEx.exerciseId !== newExerciseId) {
            newChanges.updatedProperties.push({
              name: currentEx.name,
              exerciseInstanceId: currentEx.exerciseInstanceId,
              weekNumber: 0, // Cambio global
              property: 'exerciseId',
              oldValue: originalEx.exerciseId,
              newValue: newExerciseId
            });
          }
        }
      }
    });

    // 3. Detectar grupos movidos
    const originalGroups = originalData.filter((row) => row.rowType === 'group');
    const currentGroups = tableData.filter((row) => row.rowType === 'group');

    const originalGroupPositions = {};
    originalGroups.forEach((group, index) => {
      originalGroupPositions[group.groupNumber] = index;
    });

    let groupOrderChanged = false;
    currentGroups.forEach((group, currentIndex) => {
      const originalIndex = originalGroupPositions[group.groupNumber];
      if (originalIndex !== undefined && originalIndex !== currentIndex) {
        groupOrderChanged = true;
      }
    });

    if (originalGroups.length !== currentGroups.length) {
      groupOrderChanged = true;
    }

    if (groupOrderChanged) {
      newChanges.movedGroups = currentGroups.map((group, index) => ({
        groupNumber: group.groupNumber,
        newOrder: index + 1
      }));
    }

    // 4. Detectar propiedades actualizadas
    // Creamos un mapa para rastrear qué propiedades ya hemos procesado
    const processedChanges = new Set();

    // Crear un mapa de exerciseInstanceId por semana para búsqueda más eficiente
    const weekExerciseMap = new Map();

    // Primero, construir el mapa de exerciseInstanceId por semana
    originalExercises.forEach((ex) => {
      Object.keys(ex.weeksData).forEach((weekNum) => {
        const weekData = ex.weeksData[weekNum];
        if (weekData && weekData.exerciseInstanceId) {
          const key = `${weekData.exerciseInstanceId}-${weekNum}`;
          weekExerciseMap.set(key, {
            exercise: ex,
            weekData: weekData
          });
        }
      });

      currentExercises.forEach((currentEx) => {
        // Para cada semana en el ejercicio actual
        Object.keys(currentEx.weeksData).forEach((weekNum) => {
          const weekNumber = parseInt(weekNum);
          const currentWeekData = currentEx.weeksData[weekNum];

          if (!currentWeekData) return;

          // Buscar datos originales para esta combinación de exerciseInstanceId y semana
          const key = `${currentWeekData.exerciseInstanceId}-${weekNum}`;
          const originalData = weekExerciseMap.get(key);
          const originalWeekData = originalData ? originalData.weekData : null;

          // Si no hay datos originales para esta semana, podría ser un nuevo dato para esa semana
          if (!originalWeekData) return;

          // Solo procesamos las propiedades que nos interesan
          propertiesUsedByWeek.forEach((propList) => {
            propList.forEach((prop) => {
              // Crear una clave única para esta combinación de ejercicio/semana/propiedad
              const changeKey = `${currentEx.exerciseInstanceId}-${weekNumber}-${prop}`;

              // Si ya procesamos este cambio, saltamos
              if (processedChanges.has(changeKey)) return;

              // Marcar como procesado
              processedChanges.add(changeKey);

              // Obtener valores actuales y originales
              const currentValue = currentWeekData?.[prop];
              const originalValue = originalWeekData?.[prop];

              // Si ambos son undefined/null, no hay cambio
              if (currentValue === undefined && originalValue === undefined) return;
              if (currentValue === null && originalValue === null) return;

              // Comparar valores (convertir a string para comparación consistente)
              const currentStr = currentValue !== undefined && currentValue !== null ? String(currentValue) : '';
              const originalStr = originalValue !== undefined && originalValue !== null ? String(originalValue) : '';

              // Solo registrar si hay un cambio real
              if (currentStr !== originalStr) {
                newChanges.updatedProperties.push({
                  name: currentEx.name,
                  exerciseInstanceId: currentWeekData?.exerciseInstanceId || originalWeekData?.exerciseInstanceId,
                  weekNumber: weekNumber,
                  property: prop,
                  oldValue: originalValue,
                  newValue: currentValue
                });
              }
            });
          });
        });
      });

      setChanges(newChanges);
    });
    return newChanges;
  };

  const buildSavePayload = (changesObj) => {
    return {
      cycleId,
      dayNumber,
      changes: {
        newExercises: changesObj.newExercises.map((ex) => ({
          name: ex.name,
          exerciseId: ex.exerciseId, // Asegurarse de incluir exerciseId
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

        movedGroups: changesObj.movedGroups,

        updatedProperties: changesObj.updatedProperties.map((update) => ({
          name: update.name,
          exerciseInstanceId: update.exerciseInstanceId,
          weekNumber: update.weekNumber,
          property: update.property,
          value: update.newValue
        }))
      }
    };
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);

      // Asegurarse de que todos los ejercicios tengan exerciseId antes de detectar cambios
      const updatedTableData = [...tableData];
      let exerciseIdsUpdated = false;

      updatedTableData.forEach((row) => {
        if (row.rowType === 'exercise' && row.name && !row.exerciseId) {
          const selectedExercise = coachExercises.find((ex) => ex.name === row.name);
          if (selectedExercise) {
            row.exerciseId = selectedExercise.id;
            exerciseIdsUpdated = true;
          }
        }
      });

      // Si se actualizaron IDs, actualizar el estado antes de continuar
      if (exerciseIdsUpdated) {
        setTableData(updatedTableData);
      }

      // Detectar cambios
      const changesObj = detectChanges();
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
      console.log('Payload para API:', payload);

      // Llamar a la API
      await saveWorkoutChanges(payload);
      //console.log('Respuesta de la API:', response);

      // Actualizar originalData con los nuevos datos
      //setOriginalData(JSON.parse(JSON.stringify(tableData)));

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
    rowData.name = newName;

    // Actualizar el exerciseId siempre que cambie el nombre del ejercicio
    // independientemente de si es nuevo o existente
    const selectedExercise = coachExercises.find((ex) => ex.name === newName);
    if (selectedExercise) {
      rowData.exerciseId = selectedExercise.id; // Asumiendo que cada ejercicio en coachExercises tiene un id
    } else {
      // Si no se encuentra el ejercicio, establecer exerciseId a null para evitar referencias incorrectas
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

  function SortableRow({ rowData, index }) {
    const rowKey =
      rowData.rowType === 'group' ? `group-${rowData.groupNumber}` : `ex-${rowData.groupNumber}-${rowData.rowIndex}`;

    const isDraggable =
      isEditing && (rowData.rowType === 'group' || (rowData.rowType === 'exercise' && !isDraggingGroup));

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
            opacity: '0.9'
          }
        : {})
    };

    return (
      <tr ref={setNodeRef} style={style} className={rowClassName(rowData)}>
        <td
          style={{
            minWidth: '150px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '0.5rem',
            overflow: 'hidden'
          }}
          {...(isEditing && isDraggable ? { ...attributes, ...listeners } : {})}
        >
          {isEditing && <FaGripVertical style={{ marginRight: '0.3rem', cursor: 'grab', flexShrink: 0 }} />}
          <span style={{ overflow: 'hidden', width: '100%' }}>{renderNameColumn(rowData)}</span>
        </td>
        {renderDataCells(rowData)}
      </tr>
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
            <button style={{ marginLeft: '1rem' }} onClick={handleSaveChanges}>
              {intl.formatMessage({ id: 'common.save' })}
            </button>
          </>
        )}
      </div>

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

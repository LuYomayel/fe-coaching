import React, { useState, useEffect, useContext } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';

import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { InputText } from 'primereact/inputtext';

import { fetchExcelViewByCycleAndDay } from '../services/workoutService';
import { fetchCoachExercises } from '../services/exercisesService';

import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { useTheme } from '../utils/ThemeContext';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FaGripVertical } from 'react-icons/fa';

import '../styles/WorkoutTable.css';
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

export default function NewWorkoutTable({ cycleOptions, clientId }) {
  const { user } = useContext(UserContext);
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

  // We'll store the used properties per week if needed
  const [propertiesUsedByWeek, setPropertiesUsedByWeek] = useState([]);

  const [coachExercises, setCoachExercises] = useState([]);

  const [isDraggingGroup, setIsDraggingGroup] = useState(false);

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
        const response = await fetchCoachExercises(user.userId);
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
    doFetch();
  }, [cycleId, dayNumber, showToast]);

  /****************************************
   * 3) Build table data (group rows + exercise rows)
   ****************************************/
  useEffect(() => {
    if (excelData?.weeks) {
      const built = buildRowsWithGroups(excelData);
      setTableData(built);
    }
  }, [excelData]);

  useEffect(() => {
    // Calculate propertiesUsedByWeek when tableData changes
    if (tableData.length === 0 || numWeeks === 0) return;

    // Calcular las propiedades usadas por semana
    const usedPropertiesByWeek = {};

    // Inicializar el objeto para cada semana
    for (let i = 1; i <= numWeeks; i++) {
      usedPropertiesByWeek[i] = [];
    }

    // Recorrer todos los ejercicios y semanas para determinar qué propiedades se usan
    tableData.forEach((exercise) => {
      for (let weekNum = 1; weekNum <= numWeeks; weekNum++) {
        const weekData = exercise.weeksData[weekNum];
        if (weekData) {
          properties.forEach((prop) => {
            if (weekData[prop] !== null) {
              usedPropertiesByWeek[weekNum].push(prop);
            }
          });
        }
      }
    });

    setPropertiesUsedByWeek(usedPropertiesByWeek);
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
                label: `Group ${groupNumber}`,
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
                  // If you have ex.rowIndex, use it, else default to 0
                  rowIndex: typeof ex.rowIndex === 'number' ? ex.rowIndex : 0,
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

  /****************************************
   * 5) Cell editing logic
   ****************************************/
  const onCellEditComplete = (options, prop, weekNum) => {
    if (!isEditing) return;
    const { rowData, newValue } = options;
    if (!rowData.weeksData[weekNum]) rowData.weeksData[weekNum] = {};
    rowData.weeksData[weekNum][prop] = newValue;

    // Mark changes in editedData
    if (rowData.rowType === 'exercise') {
      setEditedData((prev) => {
        const updated = { ...prev };
        if (!updated[rowData.name]) {
          updated[rowData.name] = { isNew: rowData.isNew, weeksData: {} };
        }
        if (!updated[rowData.name].weeksData[weekNum]) {
          updated[rowData.name].weeksData[weekNum] = {
            exerciseInstanceId: rowData.weeksData[weekNum].exerciseInstanceId || null
          };
        }
        updated[rowData.name].weeksData[weekNum][prop] = newValue;
        return updated;
      });
    } // if group row => do nothing or track differently if you want

    // Re-render
    setTableData((prev) => prev.map((r) => (r === rowData ? { ...rowData } : r)));
  };

  const cellEditor = (options, prop, weekNum) => {
    const { rowData } = options;
    if (rowData.rowType === 'group') {
      // Groups might not be editable here
      return <div>{rowData.label}</div>;
    }
    const currentValue = rowData.weeksData[weekNum]?.[prop] || '';
    if (!isEditing) return <div>{currentValue}</div>;

    return (
      <InputText
        value={currentValue}
        onChange={(e) => options.editorCallback(e.target.value)}
        style={{ width: '100%' }}
      />
    );
  };

  function renderProperty(rowData, prop, weekIndex) {
    if (rowData.rowType === 'group') {
      // groups have no property data
      return '';
    }
    const data = rowData.weeksData[weekIndex];
    if (!data) return '-';
    return data[prop] || '-';
  }

  // "Exercise" or "Group" name column
  function renderNameColumn(rowData) {
    if (rowData.rowType === 'group') {
      return rowData.label;
    }
    return rowData.name || '-';
  }

  const nameColumnEditor = (options) => {
    const { rowData } = options;
    if (rowData.rowType === 'group') {
      // If you want to rename groups, do it here
      return <div>{rowData.label}</div>;
    }

    // If it's an exercise row, pick from coachExercises
    if (!isEditing) return <div>{rowData.name}</div>;

    return (
      <Dropdown
        value={rowData.name}
        options={coachExercises.map((ex) => ({ label: ex.name, value: ex.name }))}
        filter
        resetFilterOnHide
        onChange={(e) => {
          if (tableData.find((ex) => ex.name === e.value && ex.groupNumber === rowData.groupNumber)) {
            showToast('error', 'Error', intl.formatMessage({ id: 'workoutTable.exerciseAlreadyExists' }));
          } else {
            if (e.value) {
              rowData.name = e.value;
              options.editorCallback(e.value);
            }
          }
        }}
        placeholder="Select Exercise"
        style={{ width: '100%' }}
      />
    );
  };

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

  function buildDataColumns(usedProps) {
    const cols = [];
    if (!usedProps || usedProps.length === 0) return cols;
    for (let i = 1; i <= numWeeks; i++) {
      usedProps[i - 1].forEach((prop) => {
        const colKey = `${prop}-col-${i}`;
        cols.push(
          <Column
            key={colKey}
            header={propertyLabels[prop] || prop}
            body={(rowData) => renderProperty(rowData, prop, i)}
            editor={(options) => cellEditor(options, prop, i)}
            onCellEditComplete={(options) => onCellEditComplete(options, prop, i)}
            editorOptions={{ disabled: !isEditing }}
            style={{ minWidth: '100px' }}
          />
        );
      });
    }
    return cols;
  }

  function renderDataTable() {
    const { headerGroup, usedProps } = buildHeaderGroup() || {};
    if (!headerGroup) {
      return (
        <div style={{ margin: '0.5rem' }}>
          <FormattedMessage id="common.noData" />
        </div>
      );
    }
    const dynamicCols = buildDataColumns(usedProps);

    return (
      <DataTable
        value={tableData}
        editMode="cell"
        headerColumnGroup={headerGroup}
        className="p-datatable-sm"
        rowClassName={rowClassName}
        responsiveLayout="stack"
        style={{ marginBottom: '2rem' }}
      >
        <Column
          header={intl.formatMessage({ id: 'workoutTable.exercise' })}
          body={(rowData) => {
            // Show a grip handle if we're editing
            return (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {isEditing && (
                  <FaGripVertical
                    style={{ cursor: 'grab', marginRight: '0.3rem' }}
                    // The actual drag handle props come from the Draggable below
                  />
                )}
                {rowData.rowType === 'group' ? rowData.label : rowData.name}
              </div>
            );
          }}
          editor={nameColumnEditor}
          onCellEditComplete={(options) => {
            if (!isEditing) return;
            const { rowData, newValue } = options;
            // If group => rowData.label = newValue, else rowData.name = newValue
            if (rowData.rowType === 'group') {
              rowData.label = newValue;
            } else {
              rowData.name = newValue;
            }
            setTableData((prev) => prev.map((ex) => (ex === rowData ? { ...rowData } : ex)));
          }}
          style={{ minWidth: '150px' }}
        />
        {dynamicCols}
      </DataTable>
    );
  }

  /****************************************
   * DRAG & DROP: Single Table
   ****************************************/
  // Modificar la función onDragStart
  const onDragStart = (start) => {
    const draggedRowIndex = start.source.index;
    const draggedRow = tableData[draggedRowIndex];

    // Primero, establecemos el estado de arrastre de grupo
    if (draggedRow.rowType === 'group') {
      setIsDraggingGroup(true);

      // Creamos una copia nueva del array con los elementos marcados
      const updatedData = tableData.map((row) => {
        if (row.groupNumber === draggedRow.groupNumber) {
          return { ...row, isBeingDragged: true };
        }
        return row;
      });

      // Actualizamos el estado con todos los cambios a la vez
      setTableData(updatedData);
    }
  };

  const onDragEnd = (result) => {
    // Primero, restablecemos el estado de arrastre
    setIsDraggingGroup(false);

    // Limpiamos la marca isBeingDragged de todos los elementos
    const resetDragState = tableData.map((row) => ({
      ...row,
      isBeingDragged: false
    }));

    setTableData(resetDragState);

    // Si no hay destino, terminamos aquí
    if (!result.destination) return;

    // Continuamos con la lógica de reordenamiento...
    const fromIndex = result.source.index;
    const toIndex = result.destination.index;
    if (fromIndex === toIndex) return;
    if (toIndex === 0 && tableData[fromIndex].rowType === 'exercise') return;

    // Creamos una copia del array de datos
    const newData = Array.from(tableData);
    const [movedRow] = newData.splice(fromIndex, 1);

    // Si es un grupo, necesitamos mover también todos sus ejercicios
    if (movedRow.rowType === 'group') {
      // Encontramos todos los ejercicios que pertenecen a este grupo
      const groupExercises = [];
      let i = fromIndex;

      // Buscamos ejercicios que pertenecen al grupo en las filas siguientes
      while (
        i < newData.length &&
        newData[i].rowType === 'exercise' &&
        newData[i].groupNumber === movedRow.groupNumber
      ) {
        groupExercises.push(newData[i]);
        newData.splice(i, 1); // Eliminamos el ejercicio de su posición actual
      }

      // Calculamos la posición correcta para insertar el grupo
      // Debemos encontrar el grupo anterior o siguiente más cercano
      let insertIndex = toIndex;

      // Si estamos intentando insertar entre ejercicios, ajustamos la posición
      if (insertIndex < newData.length && newData[insertIndex].rowType === 'exercise') {
        // Buscamos hacia atrás para encontrar el grupo al que pertenecen estos ejercicios
        let groupIndex = insertIndex;
        while (groupIndex > 0 && newData[groupIndex - 1].rowType === 'exercise') {
          groupIndex--;
        }

        // Si encontramos un grupo, insertamos después de todos sus ejercicios
        if (groupIndex > 0 && newData[groupIndex - 1].rowType === 'group') {
          const prevGroupNumber = newData[groupIndex - 1].groupNumber;
          // Avanzamos hasta el final de los ejercicios de este grupo
          while (
            insertIndex < newData.length &&
            newData[insertIndex].rowType === 'exercise' &&
            newData[insertIndex].groupNumber === prevGroupNumber
          ) {
            insertIndex++;
          }
        }
      }

      // Insertamos el grupo y todos sus ejercicios en la nueva posición
      newData.splice(insertIndex, 0, movedRow, ...groupExercises);

      setTableData(newData);
    } else if (movedRow.rowType === 'exercise') {
      // Para ejercicios individuales, simplemente los movemos
      newData.splice(toIndex, 0, movedRow);

      // Actualizamos el groupNumber si es necesario
      let currentGroupNumber = null;
      newData.forEach((row) => {
        if (row.rowType === 'group') {
          currentGroupNumber = row.groupNumber;
        } else if (row.rowType === 'exercise') {
          row.groupNumber = currentGroupNumber;
        }
      });

      // Reasignamos rowIndex para mantener el orden correcto
      let currentGroup = null;
      let rowIdx = 0;
      newData.forEach((r) => {
        if (r.rowType === 'group') {
          currentGroup = r.groupNumber;
          rowIdx = 0;
        } else if (r.rowType === 'exercise' && r.groupNumber === currentGroup) {
          r.rowIndex = rowIdx++;
        }
      });

      setTableData(newData);
    }
  };

  /****************************************
   * Adding a new row
   ****************************************/
  const handleAddExercise = () => {
    if (!isEditing) return;

    // find last group. If none, create group 1
    let lastGroup = tableData.filter((r) => r.rowType === 'group').pop();
    let groupNumber;
    if (!lastGroup) {
      // create a group row
      groupNumber = 1;
      const newGroup = {
        rowType: 'group',
        groupNumber,
        rowIndex: groupNumber * 100,
        label: `Group ${groupNumber}`,
        isNew: false,
        weeksData: {}
      };
      setTableData((prev) => [...prev, newGroup]);
      lastGroup = newGroup;
    } else {
      groupNumber = lastGroup.groupNumber;
    }

    // create exercise row
    const existingExercisesInGroup = tableData.filter((r) => r.rowType === 'exercise' && r.groupNumber === groupNumber);
    const maxRowIndex = existingExercisesInGroup.length
      ? Math.max(...existingExercisesInGroup.map((ex) => ex.rowIndex))
      : 0;

    const newExercise = {
      rowType: 'exercise',
      isNew: true,
      name: '',
      groupNumber,
      rowIndex: maxRowIndex + 1,
      weeksData: {}
    };
    // For each week, add placeholders
    for (let w = 1; w <= numWeeks; w++) {
      newExercise.weeksData[w] = { exerciseInstanceId: null };
    }

    setTableData((prev) => [...prev, newExercise]);
  };

  /****************************************
   * Save changes
   ****************************************/
  const handleSaveChanges = async () => {
    const payload = buildUpdatePayload(editedData);
    console.log('Saving changes with payload:', payload);
    // call your service
    showToast('success', 'Saved', 'Your changes have been saved!');
    setEditedData({});
  };

  function buildUpdatePayload(edited) {
    const result = [];
    Object.keys(edited).forEach((exerciseName) => {
      const exObj = edited[exerciseName];
      const isNew = exObj.isNew;
      Object.keys(exObj.weeksData).forEach((weekNumStr) => {
        const weekNum = parseInt(weekNumStr, 10);
        const data = exObj.weeksData[weekNum];
        const exerciseInstanceId = data.exerciseInstanceId || null;

        const updates = {};
        Object.keys(data).forEach((prop) => {
          if (prop !== 'exerciseInstanceId') {
            updates[prop] = data[prop];
          }
        });

        result.push({
          exerciseName,
          isNew,
          exerciseInstanceId,
          weekNumber: weekNum,
          updates
        });
      });
    });
    return result;
  }

  function renderTableHeader() {
    const { headerGroup, usedProps } = buildHeaderGroup() || {};
    // If there's no data, bail out
    if (!headerGroup || !usedProps) return null;

    // First row: "Exercise" + one column group per week
    // second row: the actual properties in each week
    return (
      <thead>
        <tr>
          <th rowSpan={2} style={{ width: '10rem', padding: '0.5rem' }}>
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
              textOverflow={'ellipsis'}
              whiteSpace={'nowrap'}
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
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
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
        <td
          key={`group-${rowData.groupNumber}-${idx}`}
          style={{ padding: '.5rem' }} // Ancho fijo para mantener consistencia
        />
      ));
    }

    // Para filas de ejercicios
    return propertiesUsedByWeek.map((propsList, weekIndex) => {
      const realWeek = weekIndex + 1;
      return propsList.map((prop, index) => {
        const cellKey = `ex-${rowData.name}-w${realWeek}-${prop}`;
        const cellValue =
          rowData.weeksData[realWeek] && rowData.weeksData[realWeek][prop] ? rowData.weeksData[realWeek][prop] : '';

        return (
          <td
            style={{
              padding: '.5rem',
              //width: '100px', // Ancho fijo para cada celda
              //minWidth: '100px', // Ancho mínimo para evitar que se comprima
              borderRight: index === propsList.length - 1 ? '1px solid #ccc' : 'none',
              borderLeft: index === 0 ? '1px solid #ccc' : 'none',
              // Evitar que el contenido se desborde
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '200px'
            }}
            key={cellKey}
          >
            {cellValue}
          </td>
        );
      });
    });
  }

  const tableStyles = {
    //width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed', // Esto es importante para mantener los anchos de columna
    marginBottom: '2rem'
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
            placeholder="-- Select day --"
            optionLabel="label"
            optionValue="value"
            className="w-full"
          />
        </div>
      </div>

      {/* 2) Editing Buttons */}
      <div style={{ marginBottom: '1rem' }}>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)}>{intl.formatMessage({ id: 'common.edit' })}</button>
        ) : (
          <button onClick={() => setIsEditing(false)}>{intl.formatMessage({ id: 'common.cancel' })}</button>
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
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <Droppable droppableId="full-table" type="ROW">
            {(provided) => (
              <table className="p-datatable p-datatable-sm" style={tableStyles}>
                {/* Build the multi-row header using your existing logic */}
                {renderTableHeader()}
                <tbody ref={provided.innerRef} {...provided.droppableProps}>
                  {tableData.map((rowData, index) => {
                    const rowKey =
                      rowData.rowType === 'group'
                        ? `group-${rowData.groupNumber}`
                        : `ex-${rowData.groupNumber}-${rowData.rowIndex}`;

                    // Solo hacemos draggable los grupos y los ejercicios que no están siendo arrastrados como parte de un grupo
                    const isDraggable =
                      isEditing &&
                      (rowData.rowType === 'group' || (rowData.rowType === 'exercise' && !isDraggingGroup));

                    return (
                      <Draggable key={rowKey} draggableId={rowKey} index={index} isDragDisabled={!isDraggable}>
                        {(draggableProvided, snapshot) => {
                          const isBeingDragged = snapshot.isDragging;

                          return (
                            <tr
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              style={{
                                ...draggableProvided.draggableProps.style,
                                // Determinar si está siendo arrastrado usando tanto el snapshot como el estado
                                ...(isBeingDragged
                                  ? {
                                      background: isDarkMode ? '#2c3e50' : '#f8f9fa',
                                      boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                                      // Mantener el ancho de la fila
                                      width: '100%',
                                      // Asegurar que todas las celdas mantengan su ancho
                                      tableLayout: 'fixed',
                                      // Añadir un borde para destacar mejor
                                      border: isDarkMode ? '1px solid #4a6785' : '1px solid #c8c8c8',
                                      // Añadir un poco de espacio para que se vea mejor
                                      margin: '2px 0',
                                      // Aumentar la opacidad para mejor visibilidad
                                      opacity: '0.9',
                                      display: 'flex',
                                      flexDirection: 'row',
                                      alignItems: 'center'
                                    }
                                  : {})
                              }}
                              className={rowClassName(rowData)}
                            >
                              <td
                                {...(isEditing ? draggableProvided.dragHandleProps : {})}
                                style={{
                                  minWidth: '150px',
                                  width: '150px', // Ancho fijo para la primera columna
                                  display: 'flex',

                                  alignItems: 'center',
                                  padding: '0.5rem',
                                  // Evitar que el contenido se desborde
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {isEditing && (
                                  <FaGripVertical style={{ marginRight: '0.3rem', cursor: 'grab', flexShrink: 0 }} />
                                )}
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {renderNameColumn(rowData)}
                                </span>
                              </td>
                              {renderDataCells(rowData)}
                            </tr>
                          );
                        }}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </tbody>
              </table>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}

/****************************************
 * Explanation of Key Drag/Drop Steps
 ****************************************
1) We store group rows + exercise rows in a single array (tableData).
   Each row has rowType = 'group' or 'exercise'. The 'group' row has a label property, 
   and 'exercise' row has name, sets, etc.

2) In onDragEnd, we check if the moved row is rowType = 'group' or rowType = 'exercise' 
   and reorder the data accordingly.

3) For group rows, we move the entire block of the group (the group row + all exercise rows that follow) 
   to the new position. 
   For exercise rows, we just move that single row, updating groupNumber if needed, 
   or leaving it the same if you want to keep it in the same group.

4) We add a <FaGripVertical> icon next to each row in the first column. 
   If rowType = 'group', that icon is used to reorder the entire block. 
   If rowType = 'exercise', it reorders that single row.

Because we're using one DataTable, we rely on a custom approach to wrap each row in a <Draggable>, 
which can be done by overriding the rowRenderer or body. 
Alternatively, you can generate the table yourself in a .map with the Draggable wrappers. 
However, PrimeReact DataTable doesn't natively support DnD row by row, so we do an advanced approach.

This snippet is primarily to show how to keep it a single table, 
with group-level + exercise-level drag and minimal logic changes in your existing code. 
You may refine or adapt it to your specific requirements.
****************************************/

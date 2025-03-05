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

// Our known properties
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

  // Table data
  const [tableData, setTableData] = useState([]);
  const [editedData, setEditedData] = useState({});
  const [propertiesUsedByWeek, setPropertiesUsedByWeek] = useState([]);
  // List of existing exercises from the coach
  const [coachExercises, setCoachExercises] = useState([]);

  // Day options
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
    if (isDarkMode) {
      return rowData.groupNumber % 2 === 0 ? 'group-even-dark improved-row' : 'group-odd-dark improved-row';
    } else {
      return rowData.groupNumber % 2 === 0 ? 'group-even improved-row' : 'group-odd improved-row';
    }
  };

  /****************************************
   * Fetch the coach exercises
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
   * Fetch the ExcelView from backend
   ****************************************/
  useEffect(() => {
    if (!cycleId || !dayNumber) return;
    const doFetch = async () => {
      try {
        setIsLoading(true);
        const response = await fetchExcelViewByCycleAndDay(cycleId, dayNumber);
        // setPropertiesUsedByWeek([]);
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
   * Build table data after we have excelData
   ****************************************/
  useEffect(() => {
    if (excelData?.weeks) {
      const arr = buildExercisesArray(excelData);
      setTableData(arr);
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
            if (weekData[prop] !== undefined && !usedPropertiesByWeek[weekNum].includes(prop)) {
              usedPropertiesByWeek[weekNum].push(prop);
            }
          });
        }
      }
    });

    setPropertiesUsedByWeek(usedPropertiesByWeek);
  }, [tableData, numWeeks]);

  function buildExercisesArray(data) {
    const allExercises = new Map();
    data.weeks.forEach((week) => {
      week.sessions.forEach((session) => {
        session.workoutInstances.forEach((instance) => {
          instance.groups.forEach((group) => {
            group.exercises.forEach((ex) => {
              const exKey = `${ex.exerciseName}-${group.groupNumber}`; // If you have ID, prefer that as unique key
              if (!allExercises.has(exKey)) {
                allExercises.set(exKey, {
                  // We store isNew: false by default for existing
                  isNew: false,
                  name: ex.exerciseName,
                  groupNumber: group.groupNumber,
                  rowIndex: ex.rowIndex,
                  weeksData: {}
                });
              }
              const exerciseObj = allExercises.get(exKey);
              if (!exerciseObj.weeksData[week.weekNumber]) {
                exerciseObj.weeksData[week.weekNumber] = {
                  exerciseInstanceId: ex.exerciseInstanceId
                };
              }
              properties.forEach((prop) => {
                if (ex[prop]) {
                  exerciseObj.weeksData[week.weekNumber][prop] = ex[prop];
                }
              });
            });
          });
        });
      });
    });
    return Array.from(allExercises.values());
  }

  /****************************************
   * Editing Logic
   ****************************************/
  const onCellEditComplete = (options, prop, weekNum) => {
    if (!isEditing) return;
    const { rowData, newValue } = options;
    console.log('Options: ', options);
    // Ensure weeksData[weekNum] exists
    if (!rowData.weeksData[weekNum]) {
      rowData.weeksData[weekNum] = {};
    }
    if (rowData.rowIndex === options.rowIndex) rowData.weeksData[weekNum][prop] = newValue;
    // Mark changes in editedData
    setEditedData((prev) => {
      const updated = { ...prev };
      if (!updated[rowData.name]) {
        updated[rowData.name] = {
          isNew: rowData.isNew,
          weeksData: {}
        };
      }
      if (!updated[rowData.name].weeksData[weekNum]) {
        updated[rowData.name].weeksData[weekNum] = {
          exerciseInstanceId: rowData.weeksData[weekNum].exerciseInstanceId || null
        };
      }
      updated[rowData.name].weeksData[weekNum][prop] = newValue;
      return updated;
    });

    // Force re-render
    setTableData((prev) => prev.map((ex) => (ex.name === rowData.name ? { ...rowData } : ex)));
  };

  const cellEditor = (options, prop, weekNum) => {
    const { rowData } = options;
    const currentValue = rowData.weeksData[weekNum]?.[prop] || '';
    if (!isEditing) {
      return <div>{currentValue}</div>;
    }
    console.log('RowData', rowData, options.rowIndex);
    return (
      <InputText
        value={currentValue}
        onChange={(e) => {
          if (rowData.rowIndex === options.rowIndex) rowData.weeksData[weekNum][prop] = e.target.value;
          options.editorCallback(e.target.value);
        }}
        style={{ width: '100%' }}
      />
    );
  };

  function renderProperty(rowData, prop, weekIndex) {
    const data = rowData.weeksData[weekIndex];
    if (!data) return '-';
    return data[prop] || '-';
  }

  // "Exercise" column
  const renderExerciseColumn = (rowData) => rowData.name || '-';

  // Editor for the exercise column – picking from coachExercises
  const exerciseColumnEditor = (options) => {
    if (!isEditing) return <div>{options.rowData.name}</div>;
    return (
      <Dropdown
        value={options.rowData.name}
        options={coachExercises.map((ex) => ({ label: ex.name, value: ex.name }))}
        filter
        filterInputAutoFocus
        resetFilterOnHide
        onChange={(e) => {
          if (!tableData.find((ex) => ex.name === e.value && ex.groupNumber === options.rowData.groupNumber)) {
            options.rowData.name = e.value;
            options.editorCallback(e.value);
          } else {
            showToast('error', 'Error', intl.formatMessage({ id: 'workoutTable.exerciseAlreadyExists' }));
          }
        }}
        placeholder="Select Exercise"
        style={{ width: '100%' }}
      />
    );
  };

  /****************************************
   * Table layout
   ****************************************/
  function buildHeaderGroup() {
    if (!numWeeks || !tableData.length) return null;

    const usedPropertiesByWeek = [];
    const exercisesArray = tableData; // We can use tableData now

    for (let i = 1; i <= numWeeks; i++) {
      const usedProps = new Set();
      exercisesArray.forEach((exercise) => {
        const data = exercise.weeksData[i];
        if (data) {
          Object.keys(data).forEach((prop) => {
            if (properties.includes(prop)) {
              usedProps.add(prop);
            }
          });
        }
      });
      usedPropertiesByWeek.push(Array.from(usedProps));
    }
    //setPropertiesUsedByWeek(usedPropertiesByWeek);
    // subheader
    const subHeaderColumns = [];
    for (let i = 0; i < numWeeks; i++) {
      usedPropertiesByWeek[i].forEach((prop) => {
        const headerLabel = propertyLabels[prop] || prop;
        subHeaderColumns.push(<Column header={headerLabel} key={`${prop}-header-${i}`} />);
      });
    }

    const topRowWeekColumns = Array.from({ length: numWeeks }, (_, i) => (
      <Column
        header={`${intl.formatMessage({ id: 'workoutTable.week' }, { week: i + 1 })}`}
        colSpan={usedPropertiesByWeek[i].length}
        key={`week-colspan-${i}`}
      />
    ));

    return {
      usedPropertiesByWeek,
      headerGroup: (
        <ColumnGroup>
          <Row>
            <Column
              header={intl.formatMessage({ id: 'workoutTable.exercise' })}
              rowSpan={2}
              style={{ width: '20rem' }}
            />
            {topRowWeekColumns}
          </Row>
          <Row>{subHeaderColumns}</Row>
        </ColumnGroup>
      )
    };
  }

  function buildDataColumns(usedPropertiesByWeek) {
    const cols = [];
    for (let i = 1; i <= numWeeks; i++) {
      usedPropertiesByWeek[i - 1].forEach((prop) => {
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

  function renderTable() {
    if (!tableData.length) {
      return (
        <div style={{ margin: '0.5rem' }}>
          <FormattedMessage id="common.noData" />
        </div>
      );
    }
    const { headerGroup, usedPropertiesByWeek } = buildHeaderGroup();
    if (!headerGroup) return null;
    const dynamicCols = buildDataColumns(usedPropertiesByWeek);

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
          body={renderExerciseColumn}
          editor={exerciseColumnEditor}
          onCellEditComplete={(options) => {
            if (!isEditing) return;
            const { rowData, newValue } = options;

            rowData.name = newValue;
            // If it's new, rowData.isNew remains true
            setTableData((prev) => prev.map((ex) => (ex === rowData ? { ...rowData } : ex)));
          }}
          style={{ minWidth: '150px' }}
        />
        {dynamicCols}
      </DataTable>
    );
  }

  /****************************************
   * Adding an Exercise
   ****************************************/
  const handleAddExercise = () => {
    if (!isEditing) return;

    let newGroupNumber = 999; // fallback
    let newRowIndex; // fallback
    // If there's at least one exercise, reuse the last exercise's groupNumber
    if (tableData.length > 0) {
      const lastExercise = tableData[tableData.length - 1];
      newGroupNumber = lastExercise.groupNumber;
      newRowIndex = lastExercise.rowIndex + 1;
    } else {
      newRowIndex = 0;
    }
    const newRow = {
      isNew: true, // Mark it as new
      name: '', // blank name
      groupNumber: newGroupNumber,
      rowIndex: newRowIndex,
      weeksData: {}
    };

    // Inicializar weeksData para cada semana con solo las propiedades usadas en esa semana
    for (let weekNum = 1; weekNum <= numWeeks; weekNum++) {
      newRow.weeksData[weekNum] = {
        exerciseInstanceId: null
      };

      // Solo agregar las propiedades que se usan en esta semana específica
      if (propertiesUsedByWeek[weekNum - 1]) {
        propertiesUsedByWeek[weekNum - 1].forEach((prop) => {
          newRow.weeksData[weekNum][prop] = null;
        });
      }
    }

    setTableData((prev) => [...prev, newRow]);
  };

  /****************************************
   * Saving Changes
   ****************************************/
  const handleSaveChanges = async () => {
    const payload = buildUpdatePayload(editedData);
    console.log('Saving changes with payload:', payload);
    // e.g. call update service
    // ...
    showToast('success', 'Saved', 'Your changes have been saved!');
    setEditedData({});
  };

  function buildUpdatePayload(edited) {
    const result = [];
    Object.keys(edited).forEach((exerciseName) => {
      const exObj = edited[exerciseName];
      const isNew = exObj.isNew;
      // exObj.weeksData => { 1: { exerciseInstanceId, sets, ... }, 2: {...} }
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
          exerciseName, // so backend can identify
          isNew, // if true, backend knows to create
          exerciseInstanceId, // might be null if new
          weekNumber: weekNum, // or maybe you pass cycleId/dayNumber
          updates
        });
      });
    });
    return result;
  }

  return (
    <div style={{ padding: '0.5rem' }}>
      {/* Cycle & Day selection */}
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

      {/* Editing Buttons */}
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
      ) : (
        renderTable()
      )}
    </div>
  );
}

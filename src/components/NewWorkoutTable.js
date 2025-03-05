import React, { useState, useEffect, useContext } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';

import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { InputText } from 'primereact/inputtext'; // For editing
import { fetchExcelViewByCycleAndDay } from '../services/workoutService';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { useTheme } from '../utils/ThemeContext';
import { InputNumber } from 'primereact/inputnumber';

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
  'distance',
  'restDuration'
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
  // Local table data that we can edit
  const [tableData, setTableData] = useState([]);
  const [editedData, setEditedData] = useState({});

  // For day selection
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
    distance: intl.formatMessage({ id: 'exercise.properties.distance' }),
    restDuration: intl.formatMessage({ id: 'exercise.properties.restDuration' })
  };

  const rowClassName = (rowData) => {
    if (isDarkMode) {
      return rowData.groupNumber % 2 === 0 ? 'group-even-dark improved-row' : 'group-odd-dark improved-row';
    } else {
      return rowData.groupNumber % 2 === 0 ? 'group-even improved-row' : 'group-odd improved-row';
    }
  };

  function renderProperty(rowData, prop, weekIndex) {
    // e.g. fetch from rowData or do something else
    const data = rowData.weeksData[weekIndex];
    if (!data) return '-';
    // convert the object to a string or some JSX
    return `${data[prop] || '-'}`;
  }

  useEffect(() => {
    console.log(editedData);
  }, [editedData]);
  // On mount or when excelData changes, rebuild the tableData
  useEffect(() => {
    if (!excelData?.weeks) return;
    const arr = buildExercisesArray(excelData);
    setTableData(arr);
  }, [excelData]);

  // Fetch from backend
  useEffect(() => {
    if (!cycleId || !dayNumber) return;
    const fetchExcelView = async () => {
      try {
        setIsLoading(true);
        const response = await fetchExcelViewByCycleAndDay(cycleId, dayNumber);
        setNumWeeks(response.data.weeks.length);
        setExcelData(response.data);
      } catch (error) {
        showToast('error', 'Error', error.message || 'Error al obtener datos');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExcelView();
  }, [cycleId, dayNumber, showToast]);

  // Build an array of exercises from the response
  function buildExercisesArray(data) {
    const allExercises = new Map();
    data.weeks.forEach((week) => {
      week.sessions.forEach((session) => {
        session.workoutInstances.forEach((instance) => {
          instance.groups.forEach((group) => {
            group.exercises.forEach((ex) => {
              const exKey = ex.exerciseName;
              if (!allExercises.has(exKey)) {
                allExercises.set(exKey, {
                  name: exKey,
                  groupNumber: group.groupNumber,
                  weeksData: {}
                });
              }
              const exerciseObj = allExercises.get(exKey);
              if (!exerciseObj.weeksData[week.weekNumber]) {
                exerciseObj.weeksData[week.weekNumber] = {
                  exerciseInstanceId: ex.exerciseInstanceId
                };
              }
              // For each property, set the value if it exists
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

  // onCellEditComplete – update tableData with the new value
  const onCellEditComplete = (options, prop, weekNum) => {
    const { rowData, newValue } = options;

    // Update the property in rowData
    if (!rowData.weeksData[weekNum]) {
      rowData.weeksData[weekNum] = {};
    }
    rowData.weeksData[weekNum][prop] = newValue;
    setEditedData((prev) => ({ ...prev, [rowData.name]: { ...rowData } }));
    // Force a new state so DataTable re-renders
    setTableData((prev) => {
      return prev.map((ex) => (ex.name === rowData.name ? { ...rowData } : ex));
    });
  };

  // A cell editor returning an <InputText>
  const cellEditor = (options, prop, weekNum) => {
    const { rowData } = options;

    // Current value
    const value = rowData.weeksData[weekNum]?.[prop] || '';
    // Return an <InputText> that updates the newValue on input
    return (
      <InputText
        type="text"
        value={value}
        onChange={(e) => {
          rowData.weeksData[weekNum][prop] = e.target.value;
          return options.editorCallback(e.target.value);
        }}
        style={{ width: '100%' }}
      />
    );
  };

  // Build the multi-row header (similar to your logic above)
  const buildHeaderGroup = () => {
    // Return null if we don't have the needed data
    if (!numWeeks || !properties) return null;

    // Get used properties per week from exercises array
    const usedPropertiesByWeek = [];
    const exercises = buildExercisesArray(excelData);
    for (let weekNum = 1; weekNum <= numWeeks; weekNum++) {
      const usedProps = new Set();
      exercises.forEach((exercise) => {
        const weekData = exercise.weeksData[weekNum];
        if (weekData) {
          Object.keys(weekData).forEach((prop) => {
            if (properties.includes(prop)) {
              usedProps.add(prop);
            }
          });
        }
      });
      usedPropertiesByWeek.push(Array.from(usedProps));
    }
    // 1) Subheader columns (second row) - only for used properties
    const subHeaderColumns = [];
    for (let i = 0; i < numWeeks; i++) {
      usedPropertiesByWeek[i].forEach((prop) => {
        const headerLabel = propertyLabels[prop] || prop;
        subHeaderColumns.push(<Column header={headerLabel} key={`${prop}-header-${i}`} />);
      });
    }
    // 2) The first row with correct colSpan based on used properties
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
            {isEditing && <Column header="" rowSpan={2} style={{ width: '1rem' }} />}
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
  };

  // Build dynamic columns – each cell has a field like "sets-1"
  const buildDataColumns = (usedPropertiesByWeek) => {
    const cols = [];
    for (let i = 1; i <= numWeeks; i++) {
      usedPropertiesByWeek[i - 1].forEach((prop) => {
        const colKey = `${prop}-col-${i}`;
        const headerLabel = propertyLabels[prop] || prop;
        cols.push(
          <Column
            key={colKey}
            header={headerLabel}
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
  };

  // Render the single table (or multiple if you prefer) with cell editing
  function renderTable() {
    if (!tableData.length) {
      return (
        <div style={{ margin: '0.5rem' }}>
          <FormattedMessage id="common.noData" />
        </div>
      );
    }

    const { headerGroup, usedPropertiesByWeek } = buildHeaderGroup();
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
        <Column header="Exercise" field="name" style={{ minWidth: '150px' }} />
        {/* Insert dynamic columns */}
        {dynamicCols}
      </DataTable>
    );
  }

  return (
    <div style={{ padding: '0.5rem' }}>
      {/* Dropdown filters */}
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

      {isLoading ? (
        <p style={{ margin: '0.5rem' }}>{intl.formatMessage({ id: 'exercise.properties.loading' })}</p>
      ) : (
        renderTable()
      )}
    </div>
  );
}

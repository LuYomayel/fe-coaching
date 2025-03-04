import React, { useState, useEffect, useContext } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';

import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';

import { fetchExcelViewByCycleAndDay } from '../services/workoutService';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

/**
 * Stub definitions – replace or remove as needed:
 */
const numWeeks = 4; // e.g. if your cycle has 4 weeks
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
]; // which props to show
const propertyLabels = {
  sets: 'Sets',
  repetitions: 'Reps',
  weight: 'Weight',
  time: 'Time',
  tempo: 'Tempo'
};
const isEditing = false; // or from your parent state
const exercises = []; // from your old snippet if you're combining data
const daysOfWeek = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' }
];
function rowClassName() {
  // e.g. your logic for row styling
  return '';
}
function renderProperty(rowData, prop, weekIndex) {
  // e.g. fetch from rowData or do something else
  const data = rowData.weeksData[weekIndex];
  if (!data) return '-';

  // convert the object to a string or some JSX
  return `${data[prop]}`;
}
function cellEditor(options, prop, weekIndex) {
  // e.g. return some input or editor
  return <span>Edit</span>;
}
function exerciseEditor(options) {
  return <span>Edit Exercise</span>;
}

export default function NewWorkoutTable({ cycleOptions, clientId }) {
  const { user, coach } = useContext(UserContext);
  const showToast = useToast();
  const intl = useIntl();

  const [cycleId, setCycleId] = useState(null);
  const [dayNumber, setDayNumber] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Day selection
  const dayOptions = [
    { label: intl.formatMessage({ id: 'workoutTable.monday' }), value: 1 },
    { label: intl.formatMessage({ id: 'workoutTable.tuesday' }), value: 2 },
    { label: intl.formatMessage({ id: 'workoutTable.wednesday' }), value: 3 },
    { label: intl.formatMessage({ id: 'workoutTable.thursday' }), value: 4 },
    { label: intl.formatMessage({ id: 'workoutTable.friday' }), value: 5 },
    { label: intl.formatMessage({ id: 'workoutTable.saturday' }), value: 6 },
    { label: intl.formatMessage({ id: 'workoutTable.sunday' }), value: 7 }
  ];

  // Fetch the excelView from backend
  useEffect(() => {
    if (!cycleId || !dayNumber) return;

    const fetchExcelView = async () => {
      try {
        setIsLoading(true);
        const response = await fetchExcelViewByCycleAndDay(cycleId, dayNumber);
        setExcelData(response.data);
      } catch (error) {
        showToast('error', 'Error', error.message || 'Error al obtener datos');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExcelView();
  }, [cycleId, dayNumber, showToast]);

  // Build an array of exercises from excelData (similar to your old approach)
  function buildExercisesArray() {
    if (!excelData?.weeks) return [];
    const allExercises = new Map();

    excelData.weeks.forEach((week) => {
      week.sessions.forEach((session) => {
        session.workoutInstances.forEach((instance) => {
          instance.groups.forEach((group) => {
            group.exercises.forEach((ex) => {
              const exKey = ex.exerciseName;
              if (!allExercises.has(exKey)) {
                allExercises.set(exKey, {
                  name: exKey,
                  weeksData: {}
                });
              }
              const exerciseObj = allExercises.get(exKey);

              const weekData = {};
              if (ex.sets) weekData.sets = ex.sets;
              if (ex.weight) weekData.weight = ex.weight;
              if (ex.time) weekData.time = ex.time;
              if (ex.tempo) weekData.tempo = ex.tempo;
              if (ex.repetitions) weekData.repetitions = ex.repetitions;
              if (ex.restInterval) weekData.restInterval = ex.restInterval;
              if (ex.notes) weekData.notes = ex.notes;
              if (ex.difficulty) weekData.difficulty = ex.difficulty;
              if (ex.duration) weekData.duration = ex.duration;
              if (ex.distance) weekData.distance = ex.distance;
              if (ex.restDuration) weekData.restDuration = ex.restDuration;

              if (Object.keys(weekData).length > 0) {
                exerciseObj.weeksData[week.weekNumber] = weekData;
              }
            });
          });
        });
      });
    });

    return Array.from(allExercises.values());
  }

  /**
   * Build the multi-row header with a first row for "Exercise" plus "Week 1..n"
   * Then a second row with each property repeated per week.
   */
  const buildHeaderGroup = () => {
    // Return null if we don't have the needed data
    if (!numWeeks || !properties) return null;

    // 1) Subheader columns (second row)
    const subHeaderColumns = [];
    for (let i = 0; i < numWeeks; i++) {
      properties.forEach((prop) => {
        const headerLabel = propertyLabels[prop] || prop;
        subHeaderColumns.push(<Column header={headerLabel} key={`${prop}-header-${i}`} />);
      });
    }

    // 2) The first row has “(Delete?), Exercise” plus N columns for “Week 1..n”
    const topRowWeekColumns = Array.from({ length: numWeeks }, (_, i) => (
      <Column
        header={`${intl.formatMessage({ id: 'workoutTable.week' }, { week: i + 1 })}`}
        colSpan={properties.length}
        key={`week-colspan-${i}`}
      />
    ));

    return (
      <ColumnGroup>
        <Row>
          {isEditing && <Column header="" rowSpan={2} style={{ width: '1rem' }} />}
          <Column header={intl.formatMessage({ id: 'workoutTable.exercise' })} rowSpan={2} style={{ width: '20rem' }} />
          {topRowWeekColumns}
        </Row>
        <Row>{subHeaderColumns}</Row>
      </ColumnGroup>
    );
  };

  /**
   * Build the property columns for each week, e.g. sets/weight/time/etc.
   */
  const buildDataColumns = () => {
    const cols = [];
    for (let i = 0; i < numWeeks; i++) {
      properties.forEach((prop) => {
        const colKey = `${prop}-col-${i}`;
        const headerLabel = propertyLabels[prop] || prop;
        cols.push(
          <Column
            key={colKey}
            header={headerLabel}
            body={(rowData) => renderProperty(rowData, prop, i)}
            editor={(options) => cellEditor(options, prop, i)}
            editorOptions={{ disabled: !isEditing }}
            style={{ minWidth: '100px' }}
          />
        );
      });
    }
    return cols;
  };

  /**
   * Render the entire set of tables by dayNumber (like your old approach).
   * If you only have one table, you can simplify. This snippet
   * is for multiple dayNumbers (like Monday / Tuesday).
   */
  const renderTablesByDayNumber = () => {
    // Suppose "exercises" is the array we want to show,
    // or we can use buildExercisesArray() if you're just using the new approach
    // For now, let's combine them if you want:
    const newApproachExercises = buildExercisesArray();
    // If you prefer your custom "exercises" array, just use that. Or merge them.

    if (!newApproachExercises || newApproachExercises.length === 0) {
      return (
        <div>
          <FormattedMessage id="common.noData" />
        </div>
      );
    }

    // We'll build the global header once
    const headerGroup = buildHeaderGroup();
    const dataColumns = buildDataColumns();

    // If you only need one table for the dayNumber, skip grouping by dayNumber
    // For demonstration, let's assume dayNumber is enough to just show one table:
    return (
      <DataTable
        value={newApproachExercises}
        headerColumnGroup={headerGroup}
        editMode="cell"
        loading={isLoading}
        rowClassName={rowClassName}
        className="p-datatable-sm"
        style={{ marginBottom: '2rem' }}
      >
        {/* If editing is allowed, maybe a "delete" column here */}
        {isEditing && (
          <Column
            header={intl.formatMessage({ id: 'workoutTable.deleteExercise' })}
            body={(rowData, options) => {
              // your logic for delete button
            }}
            style={{ padding: '0.15rem' }}
          />
        )}

        {/* "Exercise" column */}
        <Column
          header={intl.formatMessage({ id: 'workoutTable.exercise' })}
          style={{ padding: '0.15rem', minWidth: '15rem' }}
          body={(rowData, options) => {
            // your logic for Draggable or add new exercise
            return rowData.name;
          }}
          editor={(options) => exerciseEditor(options)}
          editorOptions={{ disabled: !isEditing }}
        />

        {/* Spread the dynamic columns */}
        {dataColumns}
      </DataTable>
    );
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      {/* Filtros de Selección */}
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
        // If you just want ONE table for the selected dayNumber:
        renderTablesByDayNumber()
      )}
    </div>
  );
}

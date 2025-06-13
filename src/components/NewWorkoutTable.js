import React, { useState, useEffect, useContext, useRef, useCallback, memo } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';

import { fetchExcelViewByCycleAndDay, getRpeMethodAssigned } from '../services/workoutService';
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
import { FaTrash } from 'react-icons/fa';
import { saveWorkoutChanges } from '../services/workoutService';
import '../styles/WorkoutTable.css';
import CreateTrainingCycleDialog from '../dialogs/CreateTrainingCycle';
import { Button } from 'primereact/button';
import { getYouTubeThumbnail, extractYouTubeVideoId } from '../utils/UtilFunctions';
import VideoDialog from '../dialogs/VideoDialog';
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
  'distance',
  'rpe'
];

// 1) Extract the row renderer
function SortableRowComponent({
  rowData,
  index,
  renderNameColumn,
  renderDataCells,
  handleDeleteExercise,
  isEditing,
  isDraggingGroup,
  activeGroup,
  isHoveringFirstColumn,
  propertiesUsedByWeek,
  hoverRowIndex,
  showInsertButton,
  firstColumnRef,
  handleAddExerciseAtPosition,
  handleAddGroup,
  rowClassName,
  isDarkMode,
  intl,
  setHoverRowIndex,
  setShowInsertButton,
  isInsertButtonHovered,
  setIsInsertButtonHovered,
  insertPosition,
  setInsertPosition
}) {
  const rowKey =
    rowData.rowType === 'group' ? `group-${rowData.groupNumber}` : `ex-${rowData.groupNumber}-${rowData.rowIndex}`;

  const isDraggable =
    isEditing &&
    (rowData.rowType === 'group' || (rowData.rowType === 'exercise' && !isDraggingGroup && !rowData.isDragDisabled));

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowKey,
    disabled: !isDraggable
  });

  // Estilos mejorados para el arrastre de grupos
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    ...(isDragging || (isDraggingGroup && rowData.isBeingDragged)
      ? {
          background: isDarkMode ? 'rgba(52, 73, 94, 0.95)' : 'rgba(248, 249, 250, 0.95)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
          borderRadius: '8px',
          border: isDarkMode ? '2px solid #3498db' : '2px solid #4299e1',
          zIndex: 1000
        }
      : {}),
    // Estilo especial cuando se arrastra un grupo completo
    ...(isDraggingGroup && rowData.groupNumber === activeGroup && !rowData.isBeingDragged
      ? {
          opacity: 0.6,
          background: isDarkMode ? 'rgba(52, 73, 94, 0.3)' : 'rgba(248, 249, 250, 0.3)',
          border: isDarkMode ? '1px dashed #3498db' : '1px dashed #4299e1'
        }
      : {})
  };

  // Calcular el colSpan correcto: 1 (columna de nombre) + todas las columnas de propiedades
  const totalColumns = 1 + propertiesUsedByWeek.reduce((acc, list) => acc + list.length, 0);

  return (
    <>
      <tr
        ref={setNodeRef}
        style={style}
        className={`${rowClassName(rowData)} ${isDragging ? 'dragging' : ''} ${
          // Solo aplicar una clase principal por estado
          isDraggingGroup && rowData.isBeingDragged
            ? 'group-being-dragged'
            : isDraggingGroup && rowData.groupNumber === activeGroup && !rowData.isBeingDragged
              ? 'group-placeholder'
              : isDraggingGroup && rowData.rowType === 'group' && rowData.groupNumber !== activeGroup
                ? 'group-drop-zone'
                : isDraggingGroup
                  ? 'group-drag-active'
                  : ''
        }`}
        {...(isEditing && isDraggable ? { ...attributes, ...listeners } : {})}
      >
        {/* Área de hover y botón a la izquierda */}
        <td
          style={{
            width: '32px',
            minWidth: '32px',
            maxWidth: '32px',
            padding: 0,
            position: 'relative',
            background: 'transparent',
            border: 'none',
            zIndex: 2
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            if (y < rect.height / 2) {
              setInsertPosition('above');
            } else {
              setInsertPosition('below');
            }
            if (isEditing) {
              setHoverRowIndex(index);
              setShowInsertButton(true);
            }
          }}
          onMouseLeave={() => {
            setTimeout(() => {
              if (!isInsertButtonHovered) {
                setHoverRowIndex(null);
                setShowInsertButton(false);
              }
            }, 50);
          }}
        >
          {isEditing && showInsertButton && hoverRowIndex === index && (
            <Button
              onMouseEnter={() => setIsInsertButtonHovered(true)}
              onMouseLeave={() => {
                setIsInsertButtonHovered(false);
                setHoverRowIndex(null);
                setShowInsertButton(false);
              }}
              onClick={() => handleAddExerciseAtPosition(index)}
              style={{
                position: 'absolute',
                left: '-10px',
                [insertPosition === 'above' ? 'top' : 'bottom']: '-12px',
                transform: 'translateY(0%)',
                zIndex: 10,
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--primary-color)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'background 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                outline: 'none',
                padding: 0
              }}
              title={intl.formatMessage({
                id: 'workoutTable.insertExercise',
                defaultMessage: 'Insertar ejercicio aquí'
              })}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%'
                }}
              >
                <FaPlus style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }} />
              </span>
            </Button>
          )}
        </td>
        <td ref={firstColumnRef} className={`name-column ${isEditing ? 'editable-column' : ''}`}>
          <div className="name-column-content">
            {isEditing && isDraggable && <FaGripVertical className="drag-handle" />}
            {isEditing && rowData.rowType === 'exercise' && (
              <FaTrash
                className="delete-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteExercise(rowData);
                }}
              />
            )}
            {rowData.rowType === 'group' && (
              <div
                className="group-indicator"
                style={{
                  backgroundColor: `hsl(${(rowData.groupNumber * 35) % 360}, 70%, ${isDarkMode ? '45%' : '60%'})`
                }}
              />
            )}
            <div className="name-value">{renderNameColumn(rowData)}</div>
          </div>
        </td>
        {renderDataCells(rowData)}
      </tr>
    </>
  );
}

// 2) Wrap in React.memo (no custom comparator)
const SortableRow = memo(SortableRowComponent);

export default function NewWorkoutTable({
  cycleOptions,
  clientData,
  isExcelOnlyMode = false,
  clientName = '',
  onToggleExcelMode
}) {
  const { user, coach } = useContext(UserContext);
  const showToast = useToast();
  const intl = useIntl();
  const { isDarkMode } = useTheme();

  // Fixed display order and extra columns state
  const defaultPropsOrder = ['sets', 'repetitions', 'weight'];
  const [extraProps, setExtraProps] = useState([]);
  const [propDialogVisible, setPropDialogVisible] = useState(false);
  const [newProp, setNewProp] = useState(null);
  const availableProps = properties.filter(
    (p) => !defaultPropsOrder.includes(p) && p !== 'rpe' && !extraProps.includes(p)
  );

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
  const [rpeMethod, setrpeMethod] = useState([]);
  const [workoutInstanceId, setWorkoutInstanceId] = useState(null);
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

  const [deletedExercises, setDeletedExercises] = useState([]);

  const [daysUsed, setDaysUsed] = useState([]);

  // Estados para manejar el botón de inserción dinámica
  const [hoverRowIndex, setHoverRowIndex] = useState(null);
  const [showInsertButton, setShowInsertButton] = useState(false);
  const [isInsertButtonHovered, setIsInsertButtonHovered] = useState(false);
  const [insertPosition, setInsertPosition] = useState('below'); // 'above' o 'below'

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
    width: '100%',
    borderCollapse: 'collapse',
    //
    marginBottom: '2rem',
    borderRadius: '8px',

    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    minWidth: '800px' // Ancho mínimo para asegurar que la tabla no se comprima demasiado
  };

  const rowClassName = (rowData) => {
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

  useEffect(() => {
    if (!clientData.id || !cycleId || !workoutInstanceId) return;

    const fetchData = async () => {
      try {
        const { data } = await getRpeMethodAssigned(clientData.id, workoutInstanceId, cycleId);
        setrpeMethod(data);
      } catch (err) {
        console.error('Error fetching rpe methods:', err);
      }
    };
    fetchData();
  }, [clientData, cycleId, workoutInstanceId]);

  /****************************************
   * 2) Fetch ExcelView
   ****************************************/
  useEffect(() => {
    if (!cycleId || !dayNumber) return;
    const doFetch = async () => {
      try {
        setIsLoading(true);
        const response = await fetchExcelViewByCycleAndDay(cycleId, dayNumber);
        // Buscar cualquier workoutInstance que exista y obtener su instanceId
        let workoutInstanceId = null;
        for (const week of response.data.weeks) {
          for (const session of week.sessions) {
            for (const instance of session.workoutInstances) {
              if (instance.instanceId) {
                workoutInstanceId = instance.instanceId;
                break;
              }
            }
            if (workoutInstanceId) break;
          }
          if (workoutInstanceId) break;
        }
        setWorkoutInstanceId(workoutInstanceId);
        console.log('workoutInstanceId', workoutInstanceId);
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
    const exerciseObj = coachExercises.find((ex) => ex.name === rowData.name);
    const videoUrl = exerciseObj?.multimedia;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {videoUrl && (
          <img
            src={getYouTubeThumbnail(videoUrl)}
            alt="Video thumbnail"
            style={{
              width: 48,
              height: 27,
              objectFit: 'cover',
              borderRadius: 4,
              cursor: 'pointer',
              marginRight: 8,
              border: '1px solid #ccc'
            }}
            onClick={() => handleVideoClick(videoUrl)}
            title={intl.formatMessage({ id: 'exercise.video.view' })}
          />
        )}
        {isEditing ? (
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
        ) : (
          rowData.name || '-'
        )}
      </div>
    );
  }

  /****************************************
   * 6) Table layout
   ****************************************/
  function buildHeaderGroup() {
    if (!numWeeks) return null;

    // Each week uses the same ordered props: default, extras, then rpe
    const usedProps = Array.from({ length: numWeeks }, () => [...defaultPropsOrder, ...extraProps, 'rpe']);

    // Top row: week labels spanning proper colSpan
    const topRowWeekColumns = usedProps.map((list, i) => (
      <Column
        key={`week-colspan-${i}`}
        header={`${intl.formatMessage({ id: 'workoutTable.week' }, { week: i + 1 })}`}
        colSpan={list.length}
      />
    ));

    // Second row: property headers in order, with a "+" column before RPE
    const subHeaderColumns = usedProps.flatMap((list, i) =>
      list.map((prop) => {
        // weight column gets the "+" button
        if (prop === 'weight') {
          return (
            <Column
              key={`weight-with-add-${i}`}
              header={
                <div className="flex align-items-center justify-between">
                  {propertyLabels[prop]}
                  <Button
                    icon="pi pi-plus"
                    className="p-button-text p-button-sm"
                    onClick={() => setPropDialogVisible(true)}
                  />
                </div>
              }
            />
          );
        }
        // all other props render normally
        return <Column key={`${prop}-header-${i}`} header={propertyLabels[prop] || prop} />;
      })
    );

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
  // Compute header and column order
  const { usedProps } = buildHeaderGroup() || {};

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

        // Marcar todos los elementos del grupo que se está arrastrando
        // y deshabilitar el drag de TODOS los ejercicios individuales
        const updatedData = tableData.map((row) => {
          if (row.groupNumber === groupNumber) {
            return { ...row, isBeingDragged: true };
          }
          // Deshabilitar drag de TODOS los ejercicios cuando se arrastra un grupo
          if (row.rowType === 'exercise') {
            return { ...row, isDragDisabled: true };
          }
          return row;
        });

        setTableData(updatedData);
      }
    } else {
      // Es un ejercicio individual - verificar que no estemos en modo de arrastre de grupo
      if (!isDraggingGroup) {
        setIsDraggingGroup(false);
        setActiveGroup(null);
      }
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    // Restablecer estados
    setActiveId(null);
    const wasGroupDrag = isDraggingGroup;
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

      // Para arrastre de grupos, solo permitir drop sobre otros grupos
      // No permitir drop sobre ejercicios individuales
      if (typeof over.id === 'string' && over.id.startsWith('group-')) {
        const overGroupNumberStr = over.id.split('-')[1];
        const overGroupNumber = parseInt(overGroupNumberStr, 10);

        if (activeGroupNumber !== overGroupNumber) {
          handleGroupDrag(activeGroupNumber, overGroupNumber, resetDragState);
          return;
        }
      } else {
        // Si se intenta hacer drop sobre un ejercicio durante arrastre de grupo,
        // encontrar a qué grupo pertenece ese ejercicio y hacer drop ahí
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

      // Si llegamos aquí, no fue un arrastre de grupo válido
      setTableData(resetDragState);
      return;
    }

    // Solo permitir arrastre de ejercicios si NO estamos en modo de arrastre de grupo
    if (!wasGroupDrag) {
      // Obtener información sobre las filas activa y destino
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

      // Si no encontramos alguno de los elementos, salimos
      if (!activeItem || !overItem) {
        setTableData(resetDragState);
        return;
      }

      // Manejar drag de ejercicios
      if (activeItem.rowType === 'exercise') {
        handleExerciseDrag(activeItem, overItem, resetDragState);
      } else {
        setTableData(resetDragState);
      }
    } else {
      // Si estábamos en modo de arrastre de grupo pero llegamos aquí, resetear
      setTableData(resetDragState);
    }
  };

  // Función para manejar el arrastre de grupos
  const handleGroupDrag = (activeGroupNumber, overGroupNumber, resetDragState) => {
    console.log(`Moviendo grupo ${activeGroupNumber} a la posición del grupo ${overGroupNumber}`);

    // Crear una estructura de grupos para facilitar el reordenamiento
    const groupsData = new Map();

    // Organizar datos por grupos
    resetDragState.forEach((row) => {
      if (row.rowType === 'group') {
        if (!groupsData.has(row.groupNumber)) {
          groupsData.set(row.groupNumber, {
            group: row,
            exercises: []
          });
        }
        groupsData.get(row.groupNumber).group = row;
      } else if (row.rowType === 'exercise') {
        if (!groupsData.has(row.groupNumber)) {
          groupsData.set(row.groupNumber, {
            group: null,
            exercises: []
          });
        }
        groupsData.get(row.groupNumber).exercises.push(row);
      }
    });

    // Obtener el orden actual de grupos
    const currentGroupOrder = Array.from(groupsData.keys()).sort((a, b) => {
      const aIndex = resetDragState.findIndex((row) => row.rowType === 'group' && row.groupNumber === a);
      const bIndex = resetDragState.findIndex((row) => row.rowType === 'group' && row.groupNumber === b);
      return aIndex - bIndex;
    });

    // Encontrar las posiciones del grupo activo y destino
    const activeIndex = currentGroupOrder.indexOf(activeGroupNumber);
    const overIndex = currentGroupOrder.indexOf(overGroupNumber);

    if (activeIndex === -1 || overIndex === -1) {
      console.error(`No se encontraron los grupos ${activeGroupNumber} o ${overGroupNumber}`);
      setTableData(resetDragState);
      return;
    }

    // Reordenar los grupos
    const newGroupOrder = [...currentGroupOrder];

    // Remover el grupo activo de su posición actual
    newGroupOrder.splice(activeIndex, 1);

    // Determinar la nueva posición de inserción
    let newInsertIndex = overIndex;

    // Si el grupo se movía hacia abajo, ajustar el índice
    if (activeIndex < overIndex) {
      newInsertIndex = overIndex; // Insertar después del grupo destino
    } else {
      newInsertIndex = overIndex; // Insertar antes del grupo destino
    }

    // Insertar el grupo en la nueva posición
    newGroupOrder.splice(newInsertIndex, 0, activeGroupNumber);

    // Reconstruir el array de datos con el nuevo orden
    const newData = [];

    newGroupOrder.forEach((groupNum) => {
      const groupData = groupsData.get(groupNum);
      if (groupData && groupData.group) {
        // Añadir el grupo
        newData.push(groupData.group);

        // Añadir sus ejercicios ordenados por rowIndex
        const sortedExercises = groupData.exercises.sort((a, b) => a.rowIndex - b.rowIndex);
        newData.push(...sortedExercises);
      }
    });

    // Actualizar índices para mantener la consistencia
    updateRowIndices(newData);

    console.log('Nuevo orden de grupos:', newGroupOrder);
    console.log(
      'Datos reorganizados:',
      newData.map((row) => `${row.rowType}-${row.groupNumber}${row.rowType === 'exercise' ? `-${row.name}` : ''}`)
    );

    // Actualizar el estado
    setTableData(newData);
  };

  // Función para actualizar los índices de fila de los ejercicios
  const updateRowIndices = (dataArray) => {
    // Obtener todos los grupos únicos
    const groupNumbers = [
      ...new Set(dataArray.filter((item) => item.rowType === 'group').map((item) => item.groupNumber))
    ].sort((a, b) => a - b);

    groupNumbers.forEach((groupNum) => {
      // Obtener todos los ejercicios de este grupo en el orden que aparecen en el array
      const exercisesInGroup = [];
      dataArray.forEach((row, index) => {
        if (row.rowType === 'exercise' && row.groupNumber === groupNum) {
          exercisesInGroup.push({ row, originalIndex: index });
        }
      });

      // Asignar nuevos rowIndex secuenciales basados en el orden actual
      exercisesInGroup.forEach((item, newRowIndex) => {
        item.row.rowIndex = newRowIndex;
      });
    });
  };

  // Función para manejar el arrastre de ejercicios
  const handleExerciseDrag = (activeItem, overItem, resetDragState) => {
    // REGLA 1: Verificar que el grupo no se quede vacío
    if (activeItem.groupNumber !== overItem.groupNumber) {
      const exercisesInActiveGroup = resetDragState.filter(
        (item) => item.rowType === 'exercise' && item.groupNumber === activeItem.groupNumber
      );

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

    // REGLA 2: No permitir mover por encima del primer grupo
    if (overItem.rowType === 'group' && overItem.groupNumber === 1) {
      // Si se intenta hacer drop sobre el header del grupo 1, permitir solo al final del grupo
      const targetPosition = 'end';
    } else if (overItem.rowType === 'exercise' && overItem.groupNumber === 1) {
      // Permitir mover dentro del grupo 1, pero no antes del primer ejercicio si viene de otro grupo
      if (activeItem.groupNumber !== 1 && overItem.rowIndex === 0) {
        showToast(
          'error',
          intl.formatMessage({ id: 'common.error' }),
          'No se puede mover un ejercicio por encima del primer grupo'
        );
        setTableData(resetDragState);
        return;
      }
    }

    // Crear una copia de los datos para trabajar
    let newData = [...resetDragState];

    // Encontrar el ejercicio que se está moviendo
    const activeIndex = newData.findIndex(
      (item) =>
        item.rowType === 'exercise' &&
        item.groupNumber === activeItem.groupNumber &&
        item.rowIndex === activeItem.rowIndex
    );

    if (activeIndex === -1) {
      console.error('No se encontró el ejercicio activo');
      setTableData(resetDragState);
      return;
    }

    // Obtener el ejercicio que estamos moviendo
    const movingExercise = { ...newData[activeIndex] };

    // Eliminar el ejercicio de su posición original
    newData.splice(activeIndex, 1);

    // Determinar la nueva posición y grupo
    let newGroupNumber = overItem.groupNumber;
    let insertIndex;

    if (overItem.rowType === 'group') {
      // Drop sobre header de grupo - insertar al final del grupo
      const groupIndex = newData.findIndex((item) => item.rowType === 'group' && item.groupNumber === newGroupNumber);

      insertIndex = groupIndex + 1;
      // Avanzar hasta el final de los ejercicios de este grupo
      while (
        insertIndex < newData.length &&
        newData[insertIndex].rowType === 'exercise' &&
        newData[insertIndex].groupNumber === newGroupNumber
      ) {
        insertIndex++;
      }
    } else {
      // Drop sobre un ejercicio específico
      newGroupNumber = overItem.groupNumber;

      // Encontrar la posición del ejercicio destino en el nuevo array
      const overExerciseIndex = newData.findIndex(
        (item) =>
          item.rowType === 'exercise' &&
          item.groupNumber === overItem.groupNumber &&
          item.rowIndex === overItem.rowIndex
      );

      if (overExerciseIndex === -1) {
        console.error('No se encontró el ejercicio destino');
        setTableData(resetDragState);
        return;
      }

      // Determinar si el movimiento es hacia arriba o hacia abajo
      // Comparar las posiciones originales en el mismo grupo
      if (activeItem.groupNumber === overItem.groupNumber) {
        // Movimiento dentro del mismo grupo
        if (activeItem.rowIndex < overItem.rowIndex) {
          // Movimiento hacia abajo: insertar DESPUÉS del ejercicio destino
          insertIndex = overExerciseIndex + 1;
        } else {
          // Movimiento hacia arriba: insertar ANTES del ejercicio destino
          insertIndex = overExerciseIndex;
        }
      } else {
        // Movimiento entre grupos diferentes: insertar ANTES del ejercicio destino
        insertIndex = overExerciseIndex;
      }
    }

    // Actualizar las propiedades del ejercicio movido
    movingExercise.groupNumber = newGroupNumber;

    // Insertar el ejercicio en la nueva posición
    newData.splice(insertIndex, 0, movingExercise);

    // Actualizar los índices de fila dentro de cada grupo afectado
    updateRowIndices(newData);

    setTableData(newData);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTableData(originalData);
    setDeletedExercises([]);
    setHoverRowIndex(null);
    setShowInsertButton(false);
    setChanges({
      newExercises: [],
      movedExercises: [],
      movedGroups: [],
      updatedProperties: [],
      deletedExercises: []
    });
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
      targetGroupNumber = currentRow.groupNumber;
    } else {
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
      rowIndex: 0,
      weeksData: {},
      isNew: true
    };

    // Crear una copia de los datos de la tabla
    const newTableData = [...tableData];

    // Determinar dónde insertar el nuevo ejercicio
    let insertIndex = index + 1;
    if (insertPosition === 'above') {
      insertIndex = index;
    }

    if (currentRow.rowType === 'group') {
      // Si es una fila de grupo, insertar justo después del grupo (o antes si es above)
      insertIndex = insertPosition === 'above' ? index : index + 1;
    } else {
      // Si es un ejercicio, insertar después o antes según insertPosition
      insertIndex = insertPosition === 'above' ? index : index + 1;
      newExercise.rowIndex = insertPosition === 'above' ? currentRow.rowIndex : currentRow.rowIndex + 1;
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
        break;
      }
    }

    setTableData(newTableData);
    setHoverRowIndex(null);
    setShowInsertButton(false);
  };

  const handleAddGroup = (index, isNew = false) => {
    if (!isEditing) return;

    // Encontrar el máximo número de grupo existente
    const maxGroupNumber = tableData.reduce((max, row) => {
      console.log('row', row);
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
    console.log('index', index);
    const currentRow = tableData[index] || tableData[tableData.length - 1];
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
      intl.formatMessage({ id: 'workoutTable.groupInserted' })
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
        updatedProperties: [],
        deletedExercises: []
      };
    }

    const newChanges = {
      newExercises: [],
      movedExercises: [],
      movedGroups: [],
      updatedProperties: [],
      deletedExercises: deletedExercises
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
        })),

        deletedExercises: changesObj.deletedExercises
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

      // Si no hay cambios y no hay ejercicios eliminados, mostrar mensaje y salir
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

      // Construir payload
      const payload = buildSavePayload(changesObj);
      if (!payload) {
        throw new Error('No se pudo construir el payload para guardar los cambios');
      }

      console.log('Enviando payload a la API:', JSON.stringify(payload, null, 2));

      // Llamar a la API
      const response = await saveWorkoutChanges(payload);

      console.log('Respuesta de la API:', response);

      if (response.data.message === 'Changes saved successfully') {
        showToast(
          'success',
          intl.formatMessage({ id: 'common.success' }),
          intl.formatMessage({ id: 'workoutTable.changesSaved' })
        );
      } else {
        // Verificar si hay cambios fallidos
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
      // Actualizar originalData con los nuevos datos
      setOriginalData(JSON.parse(JSON.stringify(tableData)));

      // Resetear todos los estados de cambios
      setChanges({
        newExercises: [],
        movedExercises: [],
        movedGroups: [],
        updatedProperties: []
      });
      setDeletedExercises([]); // Limpiar el estado de ejercicios eliminados

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

  const [oldValue, setOldValue] = useState(null);
  // Función que solo actualiza el valor en el objeto de datos
  const handlePropertyChange = useCallback((rowData, prop, weekNum, newValue) => {
    if (!rowData.weeksData[weekNum]) {
      rowData.weeksData[weekNum] = { exerciseInstanceId: null };
    }
    setOldValue(rowData.weeksData[weekNum][prop]);
    rowData.weeksData[weekNum][prop] = newValue === '' ? null : newValue;
  }, []);

  const handlePropertyBlur = useCallback(
    (rowData, prop, weekNum, newValue) => {
      if (oldValue !== rowData.weeksData[weekNum][prop]) {
        // trigger a full re-render of tableData so detectChanges sees the update
        setTableData((prev) => [...prev]);
      }
      setOldValue(null);
    },
    [oldValue]
  );

  const renderTableHeader = useCallback(() => {
    const { headerGroup, usedProps } = buildHeaderGroup() || {};
    // If there's no data, bail out
    if (!headerGroup || !usedProps) return null;

    return (
      <thead>
        <tr className="table-header-row">
          <th
            style={{
              width: '32px',
              minWidth: '32px',
              maxWidth: '32px',
              padding: 0,
              background: 'transparent',
              border: 'none'
            }}
            rowSpan={2}
          ></th>
          <th rowSpan={2} className="exercise-column">
            {intl.formatMessage({ id: 'workoutTable.exercise' })}
          </th>
          {usedProps.map((propsList, i) => (
            <th key={`week${i}`} colSpan={propsList.length} className="week-header">
              {intl.formatMessage({ id: 'workoutTable.week' }, { week: i + 1 })}
            </th>
          ))}
        </tr>
        <tr className="property-header-row">
          {usedProps.map((propsList, i) =>
            propsList.map((prop) => (
              <th className="property-header" key={`${prop}-header-${i}`}>
                {selectHeaderName(prop)}
              </th>
            ))
          )}
        </tr>
      </thead>
    );
  }, [buildHeaderGroup, intl, rpeMethod, propertyLabels]);

  const selectHeaderName = (prop) => {
    if (prop === 'weight') {
      return (
        <div className="flex align-items-center justify-between">
          {propertyLabels[prop]}
          <Button icon="pi pi-plus" className="p-button-text p-button-sm" onClick={() => setPropDialogVisible(true)} />
        </div>
      );
    } else if (prop === 'rpe') {
      return rpeMethod ? rpeMethod.name : 'N/A';
    } else {
      return propertyLabels[prop] || prop;
    }
  };
  const renderEditableCell = useCallback(
    (rowData, prop, weekNum, currentValue) => {
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
            <InputText
              value={currentValue === undefined || currentValue === null ? '' : currentValue}
              onBlur={(e) => handlePropertyBlur(rowData, prop, weekNum, e.target.value)}
              onChange={(e) => handlePropertyChange(rowData, prop, weekNum, e.target.value)}
              size="small"
              className="p-inputtext-sm w-full"
            />
          );
        case 'notes':
          return (
            <InputText
              value={currentValue || ''}
              onBlur={(e) => handlePropertyBlur(rowData, prop, weekNum, e.target.value)}
              onChange={(e) => handlePropertyChange(rowData, prop, weekNum, e.target.value)}
              className="p-inputtext-sm w-full"
            />
          );
        default:
          return currentValue;
      }
    },
    [handlePropertyBlur, handlePropertyChange]
  );

  const renderDataCells = useCallback(
    (rowData) => {
      if (!usedProps) return null;

      // Empty cells for group rows
      if (rowData.rowType === 'group') {
        const totalColumns = usedProps.reduce((acc, list) => acc + list.length, 0);
        return Array.from({ length: totalColumns }).map((_, idx) => (
          <td key={`group-${rowData.groupNumber}-${idx}`} className="group-empty-cell" />
        ));
      }

      // For exercise rows, render only the columns in usedProps
      return usedProps.map((propsList, weekIndex) => {
        const realWeek = weekIndex + 1;
        return propsList.map((prop) => {
          const cellKey = `ex-${rowData.name}-w${realWeek}-${prop}`;
          const cellValue =
            rowData.weeksData[realWeek] && rowData.weeksData[realWeek][prop] != null
              ? rowData.weeksData[realWeek][prop]
              : '';

          return (
            <td key={cellKey} className={`data-cell ${prop === 'weight' ? 'text-left' : ''}`}>
              {isEditing ? renderEditableCell(rowData, prop, realWeek, cellValue) : cellValue}
            </td>
          );
        });
      });
    },
    [usedProps, isEditing, renderEditableCell]
  );

  const handleExerciseNameChange = (rowData, newName) => {
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
  };

  const handleGroupLabelChange = (rowData, newLabel) => {
    // Actualizar la etiqueta en el objeto de datos
    rowData.label = newLabel;

    // Actualizar el estado de la tabla
    setTableData([...tableData]);
  };

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

  /*
  const SortableRow = ({ rowData, index }) => {
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
            background: isDarkMode ? 'rgba(52, 73, 94, 0.95)' : 'rgba(248, 249, 250, 0.95)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            border: isDarkMode ? '2px solid #3498db' : '2px solid #4299e1',
            zIndex: 1000
          }
        : {})
    };

    return (
      <>
        {isEditing && showInsertButton && isHoveringFirstColumn && index === hoverRowIndex && (
          <tr className="insert-row">
            <td colSpan={1 + propertiesUsedByWeek.reduce((acc, list) => acc + list.length, 0)}>
              <div className="insert-buttons-container">
                <button className="insert-button" onClick={() => handleAddExerciseAtPosition(index)}>
                  <FaPlus className="insert-icon" />
                  {intl.formatMessage({ id: 'workoutTable.insertExercise' })}
                </button>
                <button className="insert-button" onClick={() => handleAddGroup(index)}>
                  <FaPlus className="insert-icon" />
                  {intl.formatMessage({ id: 'plan.group.addGroup' })}
                </button>
              </div>
            </td>
          </tr>
        )}
        <tr
          ref={setNodeRef}
          style={style}
          className={`${rowClassName(rowData)} ${isDragging ? 'dragging' : ''}`}
          onDoubleClick={() => isEditing && handleAddExerciseAtPosition(index)}
          {...(isEditing && isDraggable ? { ...attributes, ...listeners } : {})}
        >
          <td className={`name-column ${isEditing ? 'editable-column' : ''}`} ref={firstColumnRef}>
            <div className="name-column-content">
              {isEditing && isDraggable && <FaGripVertical className="drag-handle" />}
              {isEditing && rowData.rowType === 'exercise' && (
                <FaTrash
                  className="delete-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteExercise(rowData);
                  }}
                />
              )}
              <div className="name-value">
                {rowData.rowType === 'group' && (
                  <div
                    className="group-indicator"
                    style={{
                      backgroundColor: `hsl(${(rowData.groupNumber * 35) % 360}, 70%, ${isDarkMode ? '45%' : '60%'})`
                    }}
                  ></div>
                )}
                {renderNameColumn(rowData)}
              </div>
            </div>
          </td>
          {renderDataCells(rowData)}
        </tr>
      </>
    );
  };
  */

  // Modificar el itemTemplate para el dropdown de días
  const dayItemTemplate = (option) => {
    const isUsed = daysUsed.includes(option.value);
    return <div className={`day-option ${isUsed ? 'highlighted-option' : ''}`}>{option.label}</div>;
  };

  const handleDeleteExercise = (rowData) => {
    if (!isEditing) return;

    // Si el ejercicio tiene exerciseInstanceId, agregarlo a la lista de eliminados
    if (rowData.exerciseInstanceId) {
      setDeletedExercises((prev) => [...prev, rowData.exerciseInstanceId]);
    }

    const newTableData = tableData.filter((row) => {
      if (row.rowType === 'exercise') {
        return row.groupNumber !== rowData.groupNumber || row.rowIndex !== rowData.rowIndex;
      }
      return true;
    });

    // Ajustar los índices de los ejercicios restantes en el mismo grupo
    let currentIndex = 0;
    newTableData.forEach((row) => {
      if (row.rowType === 'exercise' && row.groupNumber === rowData.groupNumber) {
        row.rowIndex = currentIndex++;
      }
    });

    setTableData(newTableData);
    showToast('success', 'Éxito', 'Ejercicio eliminado correctamente');
  };

  // Estado para el video
  const [videoDialogVisible, setVideoDialogVisible] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState(null);

  // Función para abrir el video
  const handleVideoClick = (url) => {
    try {
      const videoId = extractYouTubeVideoId(url);
      if (!videoId) return;
      setSelectedVideoUrl(`https://www.youtube.com/embed/${videoId}`);
      setVideoDialogVisible(true);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  };

  return (
    <div
      className={`workout-table-container ${isDarkMode ? 'dark-mode' : ''} ${isExcelOnlyMode ? 'fullscreen-mode' : ''}`}
    >
      {/* 1) Cycle & Day selection */}
      <div className="cycle-day-selector">
        {isExcelOnlyMode && (
          <div className="excel-internal-header">
            <h3 className="m-0">
              <i className="pi pi-table mr-2"></i>
              {intl.formatMessage({ id: 'clientDashboard.tabs.excelView' })} - {clientName}
            </h3>
          </div>
        )}
        <div className="field">
          <label className="selector-label">{intl.formatMessage({ id: 'common.cycle' })}</label>
          <Dropdown
            inputId="cycle"
            value={cycleId}
            options={cycleOptions}
            onChange={(e) => setCycleId(e.value)}
            placeholder={intl.formatMessage({ id: 'common.selectCycle' })}
            optionLabel="label"
            optionValue="value"
            className="p-inputtext-sm w-full"
            itemTemplate={(option) => (
              <div className={option.value === -1 ? 'highlighted-option' : ''}>{option.label}</div>
            )}
            appendTo={isExcelOnlyMode ? 'self' : null}
            panelStyle={isExcelOnlyMode ? { zIndex: 10001 } : {}}
          />
        </div>
        <div className="field">
          <label className="selector-label">{intl.formatMessage({ id: 'common.day' })}</label>
          <Dropdown
            inputId="day"
            value={dayNumber}
            options={dayOptions}
            onChange={(e) => setDayNumber(e.value)}
            placeholder={intl.formatMessage({ id: 'common.selectDay' })}
            optionLabel="label"
            optionValue="value"
            className="p-inputtext-sm w-full"
            itemTemplate={dayItemTemplate}
            disabled={!cycleId}
            appendTo={isExcelOnlyMode ? 'self' : null}
            panelStyle={isExcelOnlyMode ? { zIndex: 10001 } : {}}
          />
        </div>
      </div>

      {/* 2) Editing Buttons */}
      <div className="table-action-buttons">
        {!isEditing ? (
          <button className="p-button p-component p-button-outlined" onClick={() => setIsEditing(true)}>
            <i className="pi pi-pencil mr-2"></i>
            {intl.formatMessage({ id: 'common.edit' })}
          </button>
        ) : (
          <div className="flex justify-content-between">
            <div className="flex align-items-center justify-content-between gap-1">
              <button className="p-button p-component p-button-success" onClick={handleSaveChanges}>
                <FaSave className="mr-2" />
                {intl.formatMessage({ id: 'common.save' })}
              </button>

              <button
                className="p-button p-component p-button-secondary"
                onClick={() => handleAddExercise(tableData.length)}
              >
                <FaPlus className="mr-2" />
                {intl.formatMessage({ id: 'plan.group.addExercise' })}
              </button>

              <button
                className="p-button p-component p-button-secondary"
                onClick={() => handleAddGroup(tableData.length)}
              >
                <FaPlus className="mr-2" />
                {intl.formatMessage({ id: 'plan.group.addGroup' })}
              </button>

              <button className="p-button p-component p-button-outlined p-button-danger" onClick={handleCancelEdit}>
                <i className="pi pi-times mr-2"></i>
                {intl.formatMessage({ id: 'common.cancel' })}
              </button>
            </div>
            <div className="changes-indicator ml-2 flex align-items-center">
              <i className="pi pi-info-circle"></i>
              <span>
                <FormattedMessage
                  id="workoutTable.editModeActive"
                  defaultMessage="Modo de edición activo. Arrastra para reorganizar y haz clic en Guardar cuando termines."
                />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4) Loading/Empty state */}
      {isLoading ? (
        <div className="workout-loading">
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
          <p>{intl.formatMessage({ id: 'exercise.properties.loading' })}</p>
        </div>
      ) : tableData.length === 0 ? (
        <div className="workout-no-data">
          <i className="pi pi-info-circle" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
          <p>
            <FormattedMessage id="common.noData" />
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <div className="workout-table-wrapper">
            <table className="workout-table" style={tableStyles}>
              {renderTableHeader()}
              <tbody>
                <SortableContext
                  items={
                    isDraggingGroup
                      ? // Cuando arrastramos un grupo, solo los grupos son válidos como destinos
                        tableData.filter((row) => row.rowType === 'group').map((row) => `group-${row.groupNumber}`)
                      : // Cuando arrastramos ejercicios, todos los elementos son válidos
                        tableData.map((row) =>
                          row.rowType === 'group' ? `group-${row.groupNumber}` : `ex-${row.groupNumber}-${row.rowIndex}`
                        )
                  }
                  strategy={verticalListSortingStrategy}
                >
                  {tableData.map((rowData, index) => (
                    <SortableRow
                      key={
                        rowData.rowType === 'group'
                          ? `group-${rowData.groupNumber}`
                          : `ex-${rowData.groupNumber}-${rowData.rowIndex}-${rowData.exerciseInstanceId}`
                      }
                      rowData={rowData}
                      index={index}
                      renderNameColumn={renderNameColumn}
                      renderDataCells={renderDataCells}
                      handleDeleteExercise={handleDeleteExercise}
                      isEditing={isEditing}
                      isDraggingGroup={isDraggingGroup}
                      activeGroup={activeGroup}
                      isHoveringFirstColumn={isHoveringFirstColumn}
                      propertiesUsedByWeek={propertiesUsedByWeek}
                      hoverRowIndex={hoverRowIndex}
                      showInsertButton={showInsertButton}
                      firstColumnRef={firstColumnRef}
                      handleAddExerciseAtPosition={handleAddExerciseAtPosition}
                      handleAddGroup={handleAddGroup}
                      rowClassName={rowClassName}
                      isDarkMode={isDarkMode}
                      intl={intl}
                      setHoverRowIndex={setHoverRowIndex}
                      setShowInsertButton={setShowInsertButton}
                      isInsertButtonHovered={isInsertButtonHovered}
                      setIsInsertButtonHovered={setIsInsertButtonHovered}
                      insertPosition={insertPosition}
                      setInsertPosition={setInsertPosition}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </div>

          <DragOverlay>
            {activeId ? (
              <table className={`workout-table drag-overlay-table ${isDraggingGroup ? 'group-drag' : ''}`}>
                <tbody>
                  {tableData
                    .filter((row) => {
                      if (isDraggingGroup) {
                        return row.isBeingDragged;
                      } else {
                        return row.rowType === 'group'
                          ? `group-${row.groupNumber}` === activeId
                          : `ex-${row.groupNumber}-${row.rowIndex}` === activeId;
                      }
                    })
                    .map((rowData, index) => (
                      <tr
                        key={`overlay-${index}`}
                        className={`${rowClassName(rowData)} dragging-overlay ${isDraggingGroup ? 'group-dragging-animation' : ''}`}
                      >
                        <td className="name-column dragging">
                          <div className="name-column-content">
                            <FaGripVertical className="drag-handle" />
                            {isDraggingGroup && <div className="group-drag-indicator" />}
                            <div className="name-value">
                              {rowData.rowType === 'group' && (
                                <div
                                  className="group-indicator"
                                  style={{
                                    backgroundColor: `hsl(${(rowData.groupNumber * 35) % 360}, 70%, ${isDarkMode ? '45%' : '60%'})`
                                  }}
                                ></div>
                              )}
                              {renderNameColumn(rowData)}
                            </div>
                          </div>
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

      {/* Floating save/cancel in edit mode */}
      {isEditing && (
        <div className="floating-actions">
          <button
            className="p-button p-component p-button-success p-button-rounded"
            onClick={handleSaveChanges}
            title={intl.formatMessage({ id: 'common.save' })}
          >
            <FaSave />
          </button>
          <button
            className="p-button p-component p-button-danger p-button-rounded"
            onClick={handleCancelEdit}
            title={intl.formatMessage({ id: 'common.cancel' })}
          >
            <i className="pi pi-times"></i>
          </button>
        </div>
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
      <Dialog
        header="Add another column"
        visible={propDialogVisible}
        onHide={() => setPropDialogVisible(false)}
        footer={
          <Button
            label="Add"
            onClick={() => {
              if (newProp) {
                setExtraProps((prev) => [...prev, newProp]);
                setNewProp(null);
              }
              setPropDialogVisible(false);
            }}
          />
        }
      >
        <Dropdown
          value={newProp}
          options={availableProps.map((p) => ({ label: propertyLabels[p] || p, value: p }))}
          onChange={(e) => setNewProp(e.value)}
          placeholder="Select property…"
          className="w-full"
        />
      </Dialog>
      <VideoDialog
        visible={videoDialogVisible}
        onHide={() => setVideoDialogVisible(false)}
        videoUrl={selectedVideoUrl}
      />

      {/* Botón flotante para alternar modo Excel */}
      {onToggleExcelMode && (
        <Button
          icon={isExcelOnlyMode ? 'pi pi-eye' : 'pi pi-table'}
          className="p-button-rounded p-button-info excel-toggle-button-internal"
          onClick={onToggleExcelMode}
          tooltip={
            isExcelOnlyMode
              ? intl.formatMessage(
                  { id: 'clientDashboard.showFullDashboard' },
                  { defaultMessage: 'Mostrar dashboard completo' }
                )
              : intl.formatMessage(
                  { id: 'clientDashboard.showExcelOnly' },
                  { defaultMessage: 'Mostrar solo vista Excel' }
                )
          }
          tooltipOptions={{ position: 'left' }}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        />
      )}
    </div>
  );
}

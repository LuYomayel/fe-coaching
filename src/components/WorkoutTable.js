import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import {
  createNewTrainingFromExcelView,
  deleteExercises,
  updateExercisesInstace,
  updatePlanName,
  verifyExerciseChanges
} from '../services/workoutService';
import { useToast } from '../utils/ToastContext';
import { useIntl, FormattedMessage } from 'react-intl';
import { useContext } from 'react';
import { UserContext } from '../utils/UserContext';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import '../styles/WorkoutTable.css';
import { FaGripVertical } from 'react-icons/fa';
import CreateTrainingCycleDialog from '../dialogs/CreateTrainingCycle';
import { fetchCoachExercises } from '../services/exercisesService';
import { useTheme } from '../utils/ThemeContext';
export default function WorkoutTable({
  trainingCycles,
  cycleOptions,
  setRefreshKey,
  clientId,
  clientData
}) {
  const intl = useIntl();
  const { isDarkMode } = useTheme();
  const daysOfWeek = [
    { label: intl.formatMessage({ id: 'workoutTable.monday' }), value: 1 },
    { label: intl.formatMessage({ id: 'workoutTable.tuesday' }), value: 2 },
    { label: intl.formatMessage({ id: 'workoutTable.wednesday' }), value: 3 },
    { label: intl.formatMessage({ id: 'workoutTable.thursday' }), value: 4 },
    { label: intl.formatMessage({ id: 'workoutTable.friday' }), value: 5 },
    { label: intl.formatMessage({ id: 'workoutTable.saturday' }), value: 6 },
    { label: intl.formatMessage({ id: 'workoutTable.sunday' }), value: 7 }
  ];
  const { user, coach } = useContext(UserContext);
  const [exercisesDB, setExercisesDB] = useState([]);
  const [cycle, setCycle] = useState(null);
  const [dayOfWeek, setDayOfWeek] = useState(null);
  const [exercises, setExercises] = useState([]);
  // eslint-disable-next-line
  const [originalExercises, setOriginalExercises] = useState([]);
  const [numWeeks, setNumWeeks] = useState(0);
  const [properties, setProperties] = useState([]);
  const [planName, setPlanName] = useState('');
  const [planId, setPlanId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const showToast = useToast();
  const possibleProperties = [
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
  const [isLoading, setIsLoading] = useState(false);
  const [editedExercises, setEditedExercises] = useState([]);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState([]);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [newTraining, setNewTraining] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(1);
  const [showTrainingNameDialog, setShowTrainingNameDialog] = useState(false);
  const [newTrainingSessions, setNewTrainingSessions] = useState([]);
  const [deletedExercises, setDeletedExercises] = useState([]);
  const [originalExercisesSnapshot, setOriginalExercisesSnapshot] = useState(
    []
  );
  const [selectedProperties, setSelectedProperties] = useState([
    'sets',
    'repetitions',
    'weight'
  ]);
  const [dialogContext, setDialogContext] = useState(null); // 'edit', 'newTraining', o 'addProperties'
  const [originalProperties, setOriginalProperties] = useState([]); // Para almacenar las propiedades originales
  const [daysUsed, setDaysUsed] = useState([]);
  const defaultProperties = ['sets', 'repetitions', 'weight']; // Propiedades por defecto para nuevo entrenamiento
  const prevDepsRef = useRef({
    cycle: null,
    dayOfWeek: null,
    trainingCycles: null
  });
  const [newCycleDialogVisible, setNewCycleDialogVisible] = useState(false);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const { data } = await fetchCoachExercises(coach.id);
        const exercisesDB = data.map((exercise) => ({
          label: exercise.name,
          value: exercise.id,
          exerciseType: exercise.exerciseType,
          name: exercise.name
        }));
        setExercisesDB(exercisesDB);
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    };
    fetchExercises();
    // eslint-disable-next-line
  }, [user.userId]);

  const renderExerciseName = (rowData, provided) => {
    return (
      <div className="flex align-items-center">
        {isEditing && (
          <span {...provided.dragHandleProps}>
            <FaGripVertical className="mr-2 cursor-pointer" />
          </span>
        )}
        {rowData.name}
      </div>
    );
  };

  const renderTablesByDayNumber = () => {
    if (!exercises || exercises.length === 0) {
      return (
        <div>
          <FormattedMessage id="common.noData" />
        </div>
      );
    }
    // Ordenar los ejercicios por rowIndex
    const sortedExercises = [...exercises].sort(
      (a, b) => a.rowIndex - b.rowIndex
    );

    const exercisesByDayNumber = sortedExercises.reduce((acc, exercise) => {
      if (!acc[exercise.dayNumber]) {
        acc[exercise.dayNumber] = [];
      }
      if (
        !acc[exercise.dayNumber].some(
          (e) =>
            e.name === exercise.name && e.groupNumber === exercise.groupNumber
        )
      ) {
        acc[exercise.dayNumber].push({
          ...exercise,
          uniqueId: `${exercise.id || 'new'}-${exercise.dayNumber}-${acc[exercise.dayNumber].length}`
        });
      }
      return acc;
    }, {});

    const handleDragEnd = (result) => {
      if (!result.destination) return;

      const { source, destination } = result;
      let updatedExercises = [...exercises];

      const exerciseSource = updatedExercises[source.index];
      const exerciseDestination = updatedExercises[destination.index];
      if (!exerciseSource) return;

      if (newTraining) {
        updatedExercises.splice(source.index, 1);

        updatedExercises.splice(destination.index, 0, {
          ...exerciseSource,
          groupNumber:
            exerciseDestination?.groupNumber || exerciseSource.groupNumber
        });

        setExercises(updatedExercises);
      } else {
        const destinationGroupNumber =
          exerciseDestination?.groupNumber ||
          exercises[destination.index - 1]?.groupNumber + 1;
        const destinationGroupId =
          exerciseDestination?.groupId ||
          exercises[destination.index - 1]?.groupId;

        // No es necesario ajustar los índices manualmente
        const updatedExercise = {
          ...exerciseSource,
          groupNumber: destinationGroupNumber,
          groupId: destinationGroupId,
          rowIndex: destination.index
        };
        updatedExercises.splice(source.index, 1);
        updatedExercises.splice(destination.index, 0, updatedExercise);

        setExercises(updatedExercises);
        // Actualizar editedExercises con todos los cambios
        setEditedExercises((prev) => [
          ...prev,
          ...exerciseSource.id.map((id, index) => ({
            id: id,
            groupNumber: destinationGroupNumber,
            newGroupId: destinationGroupId[index],
            groupId: exerciseSource.groupId[index]
          }))
        ]);
      }
    };

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        {Object.entries(exercisesByDayNumber).map(
          ([dayNumber, exercisesForDay]) => {
            // eslint-disable-next-line
            const formattedDayLabel =
              daysOfWeek.find((day) => day.value === parseInt(dayNumber))
                ?.label || `Day ${dayNumber}`;
            return (
              <div key={`day-${dayNumber}`}>
                {/* <h3>{intl.formatMessage({ id: 'workoutTable.trainingDay' }, { day: formattedDayLabel })}</h3> */}
                <Droppable droppableId={dayNumber.toString()}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      <DataTable
                        value={
                          isEditing
                            ? [
                                ...exercisesForDay,
                                {
                                  name: intl.formatMessage({
                                    id: 'workoutTable.addNewExercise'
                                  }),
                                  isNew: true,
                                  uniqueId: `new-button-${dayNumber}`
                                }
                              ]
                            : exercisesForDay
                        }
                        headerColumnGroup={headerGroup}
                        scrollable
                        // scrollHeight="700px"
                        editMode="cell"
                        loading={isLoading}
                        rowClassName={rowClassName}
                      >
                        {isEditing && (
                          <Column
                            header={intl.formatMessage({
                              id: 'workoutTable.deleteExercise'
                            })}
                            body={(rowData, options) => {
                              if (
                                rowData.name !==
                                  intl.formatMessage({
                                    id: 'workoutTable.addNewExercise'
                                  }) &&
                                exercises.length > 1
                              ) {
                                return (
                                  <div className="flex justify-content-center align-items-center">
                                    <Button
                                      icon="pi pi-trash"
                                      className="p-button-danger p-button-sm"
                                      style={{
                                        width: '1.5rem',
                                        height: '1.5rem',
                                        padding: '0.15rem',
                                        fontSize: '0.8rem'
                                      }}
                                      onClick={() =>
                                        handleDeleteExercise(options.rowIndex)
                                      }
                                    />
                                  </div>
                                );
                              }
                              return null;
                            }}
                            style={{ padding: '0.15rem' }}
                          />
                        )}
                        <Column
                          header={intl.formatMessage({
                            id: 'workoutTable.exercise'
                          })}
                          style={{ padding: '0.15rem', minWidth: '15rem' }}
                          body={(rowData, options) => {
                            if (
                              rowData.name ===
                                intl.formatMessage({
                                  id: 'workoutTable.addNewExercise'
                                }) &&
                              isEditing
                            ) {
                              return (
                                <div className="flex">
                                  <Button
                                    label={intl.formatMessage({
                                      id: 'workoutTable.addNewExercise'
                                    })}
                                    icon="pi pi-plus"
                                    onClick={() =>
                                      handleAddNewExercise(
                                        rowData,
                                        options.rowIndex
                                      )
                                    }
                                  />
                                  <Button
                                    label={intl.formatMessage({
                                      id: 'workoutTable.addNewGroup'
                                    })}
                                    icon="pi pi-plus"
                                    onClick={() =>
                                      handleAddNewGroup(
                                        rowData,
                                        options.rowIndex
                                      )
                                    }
                                    className="ml-2"
                                  />
                                </div>
                              );
                            }
                            return (
                              <Draggable
                                key={rowData.uniqueId}
                                draggableId={rowData.uniqueId}
                                index={exercisesForDay.indexOf(rowData)}
                                isDragDisabled={!(isEditing || newTraining)}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    {renderExerciseName(rowData, provided)}
                                  </div>
                                )}
                              </Draggable>
                            );
                          }}
                          editor={(options) => exerciseEditor(options)}
                          editorOptions={{ disabled: !isEditing }}
                        />
                        {dataColumns}
                      </DataTable>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          }
        )}
      </DragDropContext>
    );
  };

  useEffect(() => {
    // Creamos una función para detectar qué variables cambiaron
    const detectChanges = (prevDeps) => {
      const changes = [];
      if (prevDeps.cycle !== cycle) changes.push('cycle');
      if (prevDeps.dayOfWeek !== dayOfWeek) changes.push('dayOfWeek');
      if (prevDeps.trainingCycles !== trainingCycles)
        changes.push('trainingCycles');
      return changes;
    };

    const currentDeps = { cycle, dayOfWeek, trainingCycles };
    const changes = detectChanges(prevDepsRef.current);
    prevDepsRef.current = currentDeps;
    if (changes.includes('cycle')) {
      setDaysUsed([]);
    }
    setIsLoading(true);
    if (cycle && trainingCycles && trainingCycles.length > 0) {
      const selectedCycle = trainingCycles.find((c) => c.id === cycle);
      if (!selectedCycle) return;

      const exercisesMap = new Map();
      const propertiesSet = new Set();
      const numWeeks = selectedCycle.trainingWeeks?.length || 0;
      selectedCycle.trainingWeeks.forEach((week, weekIndex) => {
        if (!week.trainingSessions) return;
        week.trainingSessions.forEach((session) => {
          if (!session.workoutInstances) return;
          if (session.dayNumber === dayOfWeek)
            setNewTrainingSessions((prev) => [...prev, session]);
          session.workoutInstances.forEach((instance) => {
            const nombre = instance.workout.planName;
            setPlanName(nombre);
            setPlanId(instance.workout.id);

            instance.groups.forEach((group) => {
              // Manejar períodos de descanso
              if (group.isRestPeriod) {
                const restName = group.name;
                const dayNumber = session.dayNumber;
                const key = `${restName}-${group.groupNumber}-${dayNumber}`;
                if (exercisesMap.has(key)) {
                  const existingRest = exercisesMap.get(key);
                  existingRest.sessionDates.push(session.sessionDate);
                  existingRest.id[weekIndex] = group.id;
                  existingRest.groupId[week.weekNumber - 1] = group.id;
                  existingRest.workoutInstanceId[week.weekNumber - 1] =
                    instance.id;
                  if (group.restDuration) {
                    existingRest.restDuration[week.weekNumber - 1] =
                      group.restDuration;
                    propertiesSet.add('restDuration');
                  }
                } else {
                  if (dayOfWeek && session.dayNumber !== dayOfWeek) {
                    return;
                  }
                  const restObj = {
                    name: restName,
                    groupNumber: group.groupNumber,
                    groupId: Array(numWeeks).fill(null),
                    sessionDates: [session.sessionDate],
                    id: Array(numWeeks).fill(null),
                    uniqueId: `rest-${group.groupNumber}-${Date.now()}`,
                    workoutInstanceId: Array(numWeeks).fill(null),
                    dayNumber: session.dayNumber,
                    rowIndex: group.rowIndex
                  };
                  restObj.id[week.weekNumber - 1] = group.id;
                  restObj.groupId[week.weekNumber - 1] = group.id;
                  restObj.workoutInstanceId[week.weekNumber - 1] = instance.id;
                  possibleProperties.forEach((prop) => {
                    restObj[prop] = Array(numWeeks).fill('');
                  });
                  if (group.restDuration) {
                    restObj.restDuration[week.weekNumber - 1] =
                      group.restDuration;
                    propertiesSet.add('restDuration');
                  }
                  exercisesMap.set(key, restObj);
                }
                return;
              }

              // Manejar ejercicios normales
              group.exercises.forEach((exerciseData) => {
                const exerciseName =
                  exerciseData.exercise?.name || 'Unnamed Exercise';
                const dayNumber = session.dayNumber;
                const key = `${exerciseName}-${group.groupNumber}-${dayNumber}`;
                if (exercisesMap.has(key)) {
                  const existingExercise = exercisesMap.get(key);
                  existingExercise.sessionDates[week.weekNumber - 1] =
                    session.sessionDate;
                  existingExercise.id[week.weekNumber - 1] = exerciseData.id;
                  existingExercise.groupId[week.weekNumber - 1] = group.id;
                  existingExercise.workoutInstanceId[week.weekNumber - 1] =
                    instance.id;
                  possibleProperties.forEach((prop) => {
                    const value = exerciseData[prop] || group[prop] || '-';
                    if (value !== '-') {
                      existingExercise[prop][week.weekNumber - 1] = value;
                      propertiesSet.add(prop);
                    }
                  });
                } else {
                  if (dayOfWeek && session.dayNumber !== dayOfWeek) {
                    return;
                  }
                  const exerciseObj = {
                    name: exerciseName,
                    groupNumber: group.groupNumber,
                    groupId: Array(numWeeks).fill(null),
                    sessionDates: [session.sessionDate],
                    id: Array(numWeeks).fill(null),
                    uniqueId: `exercise-${exerciseName}-${group.groupNumber}-${Date.now()}`,
                    workoutInstanceId: Array(numWeeks).fill(null),
                    dayNumber: session.dayNumber,
                    rowIndex: exerciseData.rowIndex
                  };
                  exerciseObj.id[week.weekNumber - 1] = exerciseData.id;
                  exerciseObj.groupId[week.weekNumber - 1] = group.id;
                  exerciseObj.workoutInstanceId[week.weekNumber - 1] =
                    instance.id;
                  possibleProperties.forEach((prop) => {
                    exerciseObj[prop] = Array(numWeeks).fill('');
                  });
                  possibleProperties.forEach((prop) => {
                    const value = exerciseData[prop] || group[prop] || '-';
                    if (value !== '-') {
                      exerciseObj[prop][week.weekNumber - 1] = value;
                      propertiesSet.add(prop);
                    }
                  });
                  exercisesMap.set(key, exerciseObj);
                }
              });
            });
          });
        });
      });
      // const sortedExercises = Array.from(exercisesMap.values()).sort((a, b) => a.groupNumber - b.groupNumber);
      const justExercises = Array.from(exercisesMap.values());
      const exerciseData = justExercises.flatMap((exercise, index) => {
        return exercise.id.map((id, weekIndex) => {
          return {
            id: id,
            rowIndex: index,
            groupNumber: exercise.groupNumber,
            groupId: exercise.groupId[weekIndex],
            newGroupId: editedExercises.find((ex) => ex.id === id)?.newGroupId
          };
        });
      });
      if (changes.includes('cycle')) {
        const daysUsed = Array.from(
          new Set(justExercises.map((day) => day.dayNumber))
        );
        setDaysUsed(daysUsed);
      }
      setOriginalExercisesSnapshot(exerciseData);
      setExercises(justExercises);
      setOriginalExercises(justExercises);
      setNumWeeks(numWeeks);
      setProperties(Array.from(propertiesSet));
    }
    setIsLoading(false);
    // eslint-disable-next-line
  }, [cycle, dayOfWeek, trainingCycles]);

  useEffect(() => {
    if (cycle && dayOfWeek && trainingCycles) {
      const selectedCycle = trainingCycles.find((c) => c.id === cycle);
      if (!selectedCycle) return;
      const planName =
        selectedCycle.trainingWeeks[0].trainingSessions.find(
          (s) => s.dayNumber === dayOfWeek
        ).workoutInstances[0]?.workout.planName || '';
      setPlanName(planName);
    } else {
      setExercises([]);
      setPlanName('');
    }
  }, [cycle, dayOfWeek, trainingCycles]);

  const propertyLabels = {
    sets: intl.formatMessage({ id: 'workoutTable.sets' }),
    repetitions: intl.formatMessage({ id: 'workoutTable.repetitions' }),
    weight: intl.formatMessage({ id: 'workoutTable.weight' }),
    time: intl.formatMessage({ id: 'workoutTable.time' }),
    restInterval: intl.formatMessage({ id: 'workoutTable.restInterval' }),
    tempo: intl.formatMessage({ id: 'workoutTable.tempo' }),
    notes: intl.formatMessage({ id: 'workoutTable.notes' }),
    difficulty: intl.formatMessage({ id: 'workoutTable.difficulty' }),
    duration: intl.formatMessage({ id: 'workoutTable.duration' }),
    distance: intl.formatMessage({ id: 'workoutTable.distance' }),
    restDuration: intl.formatMessage({ id: 'workoutTable.restDuration' })
  };

  const renderProperty = (rowData, property, weekIndex) => {
    // Verifica si rowData[property] es un array y si weekIndex es un índice válido
    if (
      Array.isArray(rowData[property]) &&
      weekIndex < rowData[property].length
    ) {
      return rowData[property][weekIndex] || '-';
    }
    // Si no es un array o el índice no es válido, devuelve un guion
    return '-';
  };

  const cellEditor = (options, property, weekIndex) => {
    if (!isEditing) {
      return options.value;
    }
    if (
      options.rowData.restDuration &&
      options.rowData.name === 'Descanso' &&
      property !== 'restDuration'
    ) {
      return options.value;
    }
    if (
      options.rowData.restDuration &&
      options.rowData.name !== 'Descanso' &&
      property === 'restDuration'
    ) {
      return options.value;
    }
    return (
      <InputText
        type="text"
        value={options.rowData[property][weekIndex]}
        onChange={(e) =>
          onEditorValueChange(options, e.target.value, property, weekIndex)
        }
      />
    );
  };

  const handleExerciseNameEdit = (e, options) => {
    const exercise = exercisesDB.find((exercise) => exercise.value === e.value);

    setSelectedExercise(exercise.value);
    const fullExercise = {
      ...options,
      ...exercise,
      uniqueId: `${exercise.value}_${options.rowIndex}` // Agregar un ID único
    };

    setCurrentExercise(fullExercise);
    updateExerciseNameForWeeks(fullExercise);
  };

  const updateExerciseNameForWeeks = (exercise) => {
    let updatedExercises = [...exercises];
    updatedExercises[exercise.rowIndex].name = exercise.label;
    if (newTraining || !exercise.id || isEditing) {
      updatedExercises[exercise.rowIndex].newExerciseId = exercise.value;
    }

    const updatedEditedExercises = [...editedExercises];

    // Recorrer todas las semanas del ejercicio
    for (let weekIndex = 0; weekIndex < numWeeks; weekIndex++) {
      const exerciseId = updatedExercises[exercise.rowIndex].id[weekIndex];
      const groupId = updatedExercises[exercise.rowIndex].groupId?.[weekIndex];

      if (exerciseId) {
        // Si existe ID, actualizar ejercicio existente
        const existingIndex = updatedEditedExercises.findIndex(
          (ex) => ex.id === exerciseId && ex.rowIndex === exercise.rowIndex
        );

        if (existingIndex !== -1) {
          updatedEditedExercises[existingIndex] = {
            ...updatedEditedExercises[existingIndex],
            newExerciseId: exercise.value,
            rowIndex: exercise.rowIndex
          };
        } else {
          updatedEditedExercises.push({
            id: exerciseId,
            newExerciseId: exercise.value,
            rowIndex: exercise.rowIndex,
            workoutInstanceId:
              updatedExercises[exercise.rowIndex].workoutInstanceId[weekIndex]
          });
        }
      } else if (groupId) {
        // Si no hay ID pero sí hay groupId (edición de grupo existente)
        updatedEditedExercises.push({
          groupId: groupId,
          newExerciseId: exercise.value,
          weekIndex: weekIndex,
          rowIndex: exercise.rowIndex,
          workoutInstanceId:
            updatedExercises[exercise.rowIndex].workoutInstanceId[weekIndex]
        });
      } else {
        // Si no hay ni ID ni groupId (ejercicio completamente nuevo)
        updatedEditedExercises.push({
          newExerciseId: exercise.value,
          weekIndex: weekIndex,
          rowIndex: exercise.rowIndex,
          isNew: true,
          groupNumber: updatedExercises[exercise.rowIndex].groupNumber || 1,
          workoutInstanceId: newTraining
            ? null
            : updatedExercises[exercise.rowIndex].workoutInstanceId[weekIndex]
        });
      }
    }
    setEditedExercises(updatedEditedExercises);
    setExercises(updatedExercises);
    setIsDialogVisible(false);
  };

  const toggleSelectAllWeeks = () => {
    if (selectedWeeks.length === numWeeks) {
      setSelectedWeeks([]); // Deseleccionar todas las semanas
    } else {
      setSelectedWeeks(Array.from({ length: numWeeks }, (_, i) => i)); // Seleccionar todas las semanas
    }
  };

  const exerciseEditor = (options) => {
    if (!isEditing) {
      return options.rowData.name;
    }
    return (
      <Dropdown
        value={selectedExercise}
        options={exercisesDB}
        onChange={(e) => handleExerciseNameEdit(e, options)}
        optionLabel="name"
        filter
        filterBy="name,exerciseType"
        placeholder={intl.formatMessage({ id: 'workoutTable.selectExercise' })}
        className="w-full"
        itemTemplate={(option) => (
          <div className="flex flex-column">
            <span>{option.name}</span>
            <small className="text-xs">{option.exerciseType}</small>
          </div>
        )}
        //style={{ height: '40px' }}
      />
    );
    /*
        return (
            <Dropdown
                value={selectedExercise}
                options={exercisesDB}
                onChange={(e) => {
                    handleExerciseNameEdit(e, options);
                }}
                placeholder={intl.formatMessage({ id: 'workoutTable.selectExercise' })}
                filter
            />
        );
        */
  };

  const onEditorValueChange = (options, value, property, weekIndex) => {
    let updatedExercises = [...exercises];
    if (!Array.isArray(updatedExercises[options.rowIndex][property])) {
      updatedExercises[options.rowIndex][property] = [];
    }
    updatedExercises[options.rowIndex][property][weekIndex] = value;
    // const exerciseSelected = exercisesDB.find(exercise => exercise.value === value);
    //updatedExercises[options.rowIndex][property][weekIndex] = exerciseSelected.label;

    // Actualizar el array de ejercicios editados
    const updatedEditedExercises = [...editedExercises];
    const exerciseIndex = updatedEditedExercises.findIndex(
      (ex) => ex.id === updatedExercises[options.rowIndex].id[weekIndex]
    );
    const exerciseIndexByGroupId = updatedEditedExercises.findIndex(
      (ex) =>
        ex.groupId === updatedExercises[options.rowIndex].groupId[weekIndex]
    );
    const exerciseIndexByNewExerciseId = updatedEditedExercises.findIndex(
      (ex) =>
        ex.newExerciseId === updatedExercises[options.rowIndex].newExerciseId &&
        ex.weekIndex === weekIndex
    );

    if (
      exerciseIndex !== -1 ||
      exerciseIndexByGroupId !== -1 ||
      exerciseIndexByNewExerciseId !== -1
    ) {
      if (exerciseIndex !== -1) {
        updatedEditedExercises[exerciseIndex] = {
          ...updatedEditedExercises[exerciseIndex],
          [property]: value
        };
      } else if (exerciseIndexByGroupId !== -1) {
        updatedEditedExercises[exerciseIndexByGroupId] = {
          ...updatedEditedExercises[exerciseIndexByGroupId],
          [property]: value
        };
      } else {
        updatedEditedExercises[exerciseIndexByNewExerciseId] = {
          ...updatedEditedExercises[exerciseIndexByNewExerciseId],
          [property]: value
        };
      }
    } else if (newTraining) {
      updatedEditedExercises.push({
        newExerciseId:
          updatedExercises[options.rowIndex].newExerciseId[weekIndex],
        [property]: value
      });
    } else {
      if (updatedExercises[options.rowIndex].restDuration) {
        updatedEditedExercises.push({
          id: updatedExercises[options.rowIndex].id[weekIndex],
          [property]: value
        });
      } else {
        updatedEditedExercises.push({
          id: updatedExercises[options.rowIndex].id[weekIndex],
          [property]: value
        });
      }
    }
    setEditedExercises(updatedEditedExercises);
    setExercises(updatedExercises);
  };

  const handleEditSave = async () => {
    let keepEditing = false;
    if (isEditing) {
      try {
        setIsLoading(true);

        if (newTraining) {
          if (planName === '') {
            keepEditing = true;
            return showToast(
              'error',
              intl.formatMessage({ id: 'common.error' }),
              intl.formatMessage({ id: 'common.errorNameRequired' })
            );
          }
          const cleanPlan = {
            workout: {
              planName: planName,
              coachId: coach.id,
              isTemplate: true
            },
            exercises: exercises.map((ex, index) => ({
              ...ex,
              rowIndex: index
            }))
          };
          // Lógica para guardar nuevo entrenamiento
          // Aquí deberías tener una función diferente para crear nuevo entrenamiento

          await createNewTrainingFromExcelView(cleanPlan);
        } else {
          // Preparar los datos para enviar al nuevo endpoint

          try {
            if (planId) {
              await updatePlanName(planId, planName);
            }
            if (deletedExercises.length > 0 && !newTraining) {
              const cleanExercises = {
                exerciseIds: deletedExercises.filter((ex) => ex !== null)
              };
              const response = await deleteExercises(cleanExercises);
              if (response.message) {
                showToast(
                  'success',
                  intl.formatMessage({ id: 'common.success' }),
                  `${intl.formatMessage({ id: 'workoutTable.exercisesDeleted' })} ${response.deletedExercises}`
                );
              }
            }

            // Filtrar los ejercicios eliminados del originalExercisesSnapshot
            const filteredOriginalSnapshot = originalExercisesSnapshot.filter(
              (exercise) => !deletedExercises.includes(exercise.id)
            );
            // Preparar los datos de ejercicios actuales
            const exerciseData = exercises.flatMap((exercise, index) => {
              return exercise.id.map((id, weekIndex) => {
                return {
                  id: id,
                  rowIndex: index,
                  groupNumber: exercise.groupNumber,
                  groupId: exercise.groupId[weekIndex],
                  newGroupId: editedExercises.find((ex) => ex.id === id)
                    ?.newGroupId
                };
              });
            });

            // Comparar los snapshots filtrados con los datos actuales
            const hasChanges =
              JSON.stringify(exerciseData) !==
              JSON.stringify(filteredOriginalSnapshot);

            if (hasChanges && !newTraining) {
              const response = await verifyExerciseChanges(exerciseData);
              if (response.message) {
                showToast(
                  'success',
                  intl.formatMessage({ id: 'common.success' }),
                  `${intl.formatMessage({ id: 'workoutTable.exercisesUpdated' })} ${response.contador}`
                );
              }
            }
          } catch (error) {
            console.error('Error al enviar datos al endpoint:', error);
            showToast(
              'error',
              intl.formatMessage({ id: 'common.error' }),
              intl.formatMessage({ id: 'common.errorVerifyingChanges' })
            );
          }
          await updateExercisesInstace(editedExercises);
        }
      } catch (error) {
        console.error(error);
        showToast(
          'error',
          intl.formatMessage({ id: 'common.error' }),
          intl.formatMessage({ id: 'common.errorSavingChanges' })
        );
      } finally {
        setIsLoading(false);
        if (!keepEditing) setRefreshKey((prevKey) => prevKey + 1);
        if (newTraining && !keepEditing) {
          setNewTraining(false);
        }
      }
    } else {
      // Mostrar el diálogo para seleccionar propiedades al iniciar la edición
      setDialogContext('edit');
      setOriginalProperties(properties); // Guardar las propiedades originales
      setSelectedProperties(properties); // Seleccionar propiedades actuales
      // setShowTrainingNameDialog(true);
    }

    setIsEditing(!isEditing);
    // limpiar todos los arrays de ejercicios
    setEditedExercises([]);
    setDeletedExercises([]);
  };

  const subHeaderColumns = [];

  for (let i = 0; i < numWeeks; i++) {
    properties.forEach((property) => {
      const headerLabel = propertyLabels[property] || property;
      subHeaderColumns.push(
        <Column header={headerLabel} key={`${property}-header-${i}`} />
      );
    });
  }

  const headerGroup = (
    <ColumnGroup>
      <Row>
        {isEditing && (
          <Column header="" rowSpan={2} style={{ width: '1rem' }} />
        )}
        <Column
          header={intl.formatMessage({ id: 'workoutTable.exercise' })}
          rowSpan={2}
          style={{ width: '40rem' }}
        />
        {Array.from({ length: numWeeks }, (_, i) => (
          <Column
            header={`${intl.formatMessage({ id: 'workoutTable.week' }, { week: i + 1 })}`}
            colSpan={properties.length}
            key={`week-${i}`}
          />
        ))}
      </Row>
      <Row>{subHeaderColumns}</Row>
    </ColumnGroup>
  );

  const dataColumns = [];

  for (let i = 0; i < numWeeks; i++) {
    properties.forEach((property) => {
      dataColumns.push(
        <Column
          key={`${property}-col-${i}`}
          field={`${property}.${i}`}
          header={propertyLabels[property] || property}
          body={(rowData) => renderProperty(rowData, property, i)}
          editor={(options) => cellEditor(options, property, i)}
          editorOptions={{ disabled: !isEditing }}
        />
      );
    });
  }

  const rowClassName = (rowData) => {
    if (isDarkMode) {
      return rowData.groupNumber % 2 === 0
        ? 'group-even-dark improved-row'
        : 'group-odd-dark improved-row';
    } else {
      return rowData.groupNumber % 2 === 0
        ? 'group-even improved-row'
        : 'group-odd improved-row';
    }
  };

  const renderCardTitle = () => {
    if (cycle) {
      return (
        <div className="flex justify-content-between align-items-center">
          <div>
            {isEditing && newTraining ? (
              <div className="flex align-items-center">
                <InputText
                  value={planName}
                  disabled={!isEditing}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="mr-2"
                  placeholder={intl.formatMessage({
                    id: 'workoutTable.enterTrainingName'
                  })}
                />
              </div>
            ) : (
              <span>
                {intl.formatMessage(
                  { id: 'workoutTable.day' },
                  {
                    day: daysOfWeek.find((day) => day.value === dayOfWeek)
                      ?.label,
                    plan: planName
                  }
                )}
              </span>
            )}
          </div>
          <div>
            {hasData && dayOfWeek ? (
              <>
                {isEditing && (
                  <Button
                    label={intl.formatMessage({ id: 'common.cancel' })}
                    icon="pi pi-times"
                    onClick={handleCancel}
                    className="p-button-secondary"
                  />
                )}
                <Button
                  label={intl.formatMessage({
                    id: isEditing ? 'common.save' : 'common.edit'
                  })}
                  icon={isEditing ? 'pi pi-save' : 'pi pi-pencil'}
                  onClick={handleEditSave}
                  loading={isLoading}
                  className="floating-button"
                />
              </>
            ) : dayOfWeek ? (
              <Button
                label={intl.formatMessage({ id: 'workoutTable.addTraining' })}
                icon="pi pi-plus"
                onClick={createNewTraining}
              />
            ) : (
              <> </>
            )}
          </div>
        </div>
      );
    }

    return intl.formatMessage({ id: 'workoutTable.selectCycleDay' });
  };

  const hasData = exercises && exercises.length > 0;

  const createNewTraining = () => {
    setDialogContext('newTraining');
    setOriginalProperties([]); // No hay propiedades originales en nuevo entrenamiento
    // setSelectedProperties(defaultProperties); // Seleccionar propiedades por defecto
    handleAddTraining();
    // setShowTrainingNameDialog(true);
  };

  const handleAddTraining = () => {
    // Definir las propiedades básicas que siempre queremos mostrar
    setProperties([...defaultProperties]);

    const emptyExercise = {
      name: intl.formatMessage({ id: 'workoutTable.newExercise' }),
      groupNumber: 1,
      sessionDates: newTrainingSessions.map((session) => session.sessionDate),
      trainingSessionId: newTrainingSessions.map((session) => session.id),
      id: Array(numWeeks).fill(null),
      groupId: Array(numWeeks).fill(null),
      isNew: true,
      dayNumber: dayOfWeek
    };
    // Inicializar todas las propiedades posibles
    possibleProperties.forEach((prop) => {
      emptyExercise[prop] = Array(numWeeks).fill('');
    });

    // Si no hay semanas definidas, establecer por defecto 4 semanas
    if (numWeeks === 0) {
      setNumWeeks(4);
    }

    setExercises([emptyExercise]);
    setIsEditing(true);
    setNewTraining(true);
  };

  const handleAddNewExercise = (rowData, index) => {
    const trainingSessionDates =
      exercises.length > 0
        ? exercises[index - 1].sessionDates
        : Array(numWeeks).fill(null);

    const trainingGroupId =
      exercises.length > 0
        ? exercises[index - 1].groupId
        : Array(numWeeks).fill(null);

    const workoutInstanceId =
      exercises.length > 0
        ? exercises[index - 1].workoutInstanceId
        : Array(numWeeks).fill(null);

    const dayNumber =
      exercises.length > 0
        ? exercises[index - 1].dayNumber
        : Array(numWeeks).fill(null);

    const emptyExercise = {
      name: intl.formatMessage({ id: 'workoutTable.newExercise' }),
      groupNumber: selectedGroup,
      sessionDates: newTraining
        ? Array(numWeeks).fill(null)
        : trainingSessionDates,
      id: Array(numWeeks).fill(null),
      groupId: newTraining ? Array(numWeeks).fill(null) : trainingGroupId,
      trainingSessionId: newTraining
        ? newTrainingSessions.map((session) => session.id)
        : Array(numWeeks).fill(null),
      isNew: true,
      uniqueId: `new-exercise-${Date.now()}`,
      newExerciseId: Array(numWeeks).fill(null),
      workoutInstanceId: workoutInstanceId,
      dayNumber: dayNumber
    };

    possibleProperties.forEach((prop) => {
      emptyExercise[prop] = Array(numWeeks).fill('');
    });

    const updatedExercises = [...exercises];
    // Encontrar la posición correcta para insertar el nuevo ejercicio
    const insertIndex = updatedExercises.findIndex(
      (ex) => ex.groupNumber > selectedGroup
    );

    if (insertIndex === -1) {
      updatedExercises.push(emptyExercise);
    } else {
      updatedExercises.splice(insertIndex, 0, emptyExercise);
    }

    setExercises(updatedExercises);
  };

  const handleAddNewGroup = (rowData, index) => {
    const nextGroupNumber =
      exercises.length > 0
        ? exercises[exercises.length - 1].groupNumber + 1
        : 1;
    setSelectedGroup(nextGroupNumber);

    const trainingSessionDates =
      exercises.length > 0
        ? exercises[index - 1].sessionDates
        : Array(numWeeks).fill(null);

    const workoutInstanceId =
      exercises.length > 0
        ? exercises[index - 1].workoutInstanceId
        : Array(numWeeks).fill(null);

    const dayNumber =
      exercises.length > 0
        ? exercises[index - 1].dayNumber
        : Array(numWeeks).fill(null);

    const emptyExercise = {
      name: intl.formatMessage({ id: 'workoutTable.newExercise' }),
      groupNumber: nextGroupNumber,
      sessionDates: newTraining
        ? Array(numWeeks).fill(null)
        : trainingSessionDates,
      id: Array(numWeeks).fill(null),
      isNew: true,
      uniqueId: `new-group-${Date.now()}`,
      groupId: newTraining
        ? Array(numWeeks).fill(null)
        : Array(numWeeks).fill(null),
      newExerciseId: Array(numWeeks).fill(null),
      workoutInstanceId: workoutInstanceId,
      dayNumber: dayNumber,
      trainingSessionId: newTraining
        ? newTrainingSessions.map((session) => session.id)
        : Array(numWeeks).fill(null)
    };

    possibleProperties.forEach((prop) => {
      emptyExercise[prop] = Array(numWeeks).fill('');
    });

    setExercises([...exercises, emptyExercise]);
  };

  const handleDeleteExercise = (exerciseIndex) => {
    if (!newTraining) {
      // También puedes actualizar editedExercises si es necesario
      const updatedDeletedExercises = exercises
        .find((ex) => ex.rowIndex === exerciseIndex)
        .id.map((id) => id);
      setDeletedExercises(updatedDeletedExercises);
    }

    const updatedExercises = exercises.filter(
      (_, index) => index !== exerciseIndex
    );
    setExercises(updatedExercises);
  };

  const updateProperties = () => {
    const newProperties = selectedProperties.filter(
      (prop) => !properties.includes(prop)
    );
    setProperties([...properties, ...newProperties]);
  };

  const openPropertyDialog = () => {
    setDialogContext('addProperties');
    setSelectedProperties(properties); // Mantener las propiedades actuales seleccionadas
    setShowTrainingNameDialog(true);
  };

  const handleCancel = () => {
    if (dialogContext === 'edit' || dialogContext === 'addProperties') {
      setDialogContext(null);
      setProperties(originalProperties); // Restaurar las propiedades originales
      // limpiar todos los arrays de ejercicios
      setEditedExercises([]);
      setDeletedExercises([]);
      setExercises(originalExercises);
    } else if (dialogContext === 'newTraining') {
      setProperties([]); // Limpiar todo para nuevo entrenamiento
      setPlanName(''); // Limpiar el nombre del plan
      setExercises([]);
      setNewTraining(false);
    }
    setIsEditing(!isEditing);
    setSelectedProperties(defaultProperties);
  };

  return (
    <div>
      <Card
        title={renderCardTitle}
        className="mb-4 workout-table-card font-medium"
        cardTitleClassName="font-medium"
      >
        <div className="grid">
          <div className="col-6">
            <div className="p-field">
              <label>
                <FormattedMessage id="workoutTable.cycle" />
              </label>
              <Dropdown
                value={cycle}
                options={cycleOptions}
                onChange={(e) => {
                  if (e.value === -1) {
                    if (clientData.user.subscription.status === 'Active')
                      setNewCycleDialogVisible(true);
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
                  setCycle(e.value);
                }}
                filter
                placeholder={intl.formatMessage({
                  id: 'workoutTable.selectCycle'
                })}
                showClear
                disabled={newTraining || isEditing}
                itemTemplate={(option) => (
                  <div
                    className={option.value === -1 ? 'highlighted-option' : ''}
                  >
                    {option.label}
                  </div>
                )}
              />
            </div>
          </div>
          <div className="col-6">
            <div className="p-field">
              <label>
                <FormattedMessage id="workoutTable.dayOfWeek" />
              </label>
              <Dropdown
                value={dayOfWeek}
                options={daysOfWeek}
                onChange={(e) => setDayOfWeek(e.value)}
                placeholder={intl.formatMessage({
                  id: 'workoutTable.selectDay'
                })}
                showClear
                disabled={newTraining || isEditing}
                itemTemplate={(option) => (
                  <div
                    className={
                      daysUsed.includes(option.value)
                        ? 'highlighted-option'
                        : ''
                    }
                  >
                    {option.label}
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        {renderTablesByDayNumber()}

        {isEditing && (
          <Button
            label={intl.formatMessage({ id: 'workoutTable.addProperties' })}
            icon="pi pi-plus"
            onClick={openPropertyDialog}
            className="p-button-secondary"
          />
        )}
      </Card>

      <Dialog
        draggable={false}
        resizable={false}
        dismissableMask={true}
        header={intl.formatMessage({ id: 'workoutTable.selectWeeks' })}
        visible={isDialogVisible}
        onHide={() => setIsDialogVisible(false)}
        className="responsive-dialog"
      >
        <div>
          <div className="flex align-items-center justify-content-between">
            <label>
              {intl.formatMessage({ id: 'workoutTable.modifyAll' })}
            </label>
            <Checkbox
              checked={selectedWeeks.length === numWeeks}
              onChange={toggleSelectAllWeeks}
            />
          </div>
          {Array.from({ length: numWeeks }, (_, i) => (
            <div
              key={i}
              className="flex align-items-center justify-content-between"
            >
              <label>
                {intl.formatMessage(
                  { id: 'workoutTable.week' },
                  { week: i + 1 }
                )}
              </label>
              <Checkbox
                checked={selectedWeeks.includes(i)}
                onChange={(e) => {
                  const newSelectedWeeks = e.target.checked
                    ? [...selectedWeeks, i]
                    : selectedWeeks.filter((week) => week !== i);
                  setSelectedWeeks(newSelectedWeeks);
                }}
              />
            </div>
          ))}
        </div>
        <Button
          label={intl.formatMessage({ id: 'common.update' })}
          onClick={() => updateExerciseNameForWeeks(currentExercise)}
        />
      </Dialog>
      <Dialog
        draggable={false}
        resizable={false}
        className="responsive-dialog"
        header={
          dialogContext === 'addProperties'
            ? intl.formatMessage({ id: 'workoutTable.addProperties' })
            : intl.formatMessage({ id: 'workoutTable.enterTrainingName' })
        }
        visible={showTrainingNameDialog}
        onHide={() => setShowTrainingNameDialog(false)}
        footer={
          <div>
            <Button
              label={intl.formatMessage({ id: 'common.save' })}
              icon="pi pi-check"
              onClick={() => {
                if (dialogContext === 'newTraining') {
                  handleAddTraining();
                } else if (
                  dialogContext === 'edit' ||
                  dialogContext === 'addProperties'
                ) {
                  updateProperties();
                }
                setShowTrainingNameDialog(false);
              }}
            />
          </div>
        }
      >
        {dialogContext !== 'addProperties' && (
          <div className="p-field">
            <label htmlFor="trainingName">
              {intl.formatMessage({ id: 'workoutTable.trainingName' })}
            </label>
            <InputText
              id="trainingName"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder={intl.formatMessage({ id: 'workoutTable.enterName' })}
              autoFocus
            />
          </div>
        )}
        <div className="p-field">
          <label>
            {intl.formatMessage({ id: 'workoutTable.selectProperties' })}
          </label>
          {possibleProperties.map((property) => (
            <div key={property} className="flex align-items-center">
              <Checkbox
                checked={selectedProperties.includes(property)}
                onChange={(e) => {
                  const newSelectedProperties = e.checked
                    ? [...selectedProperties, property]
                    : selectedProperties.filter((prop) => prop !== property);
                  setSelectedProperties(newSelectedProperties);
                }}
              />
              <label>{propertyLabels[property]}</label>
            </div>
          ))}
        </div>
      </Dialog>
      <CreateTrainingCycleDialog
        clientId={clientId}
        draggable={false}
        resizable={false}
        className="responsive-dialog"
        header={intl.formatMessage({ id: 'workoutTable.newCycle' })}
        visible={newCycleDialogVisible}
        onHide={() => setNewCycleDialogVisible(false)}
        setRefreshKey={setRefreshKey}
      />
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { updateExercisesInstace } from '../services/workoutService';
import { useToast } from '../utils/ToastContext';
import { useIntl, FormattedMessage } from 'react-intl';
import { getExercises } from '../services/workoutService';
import { useContext } from 'react';
import { UserContext } from '../utils/UserContext';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';

export default function WorkoutTable({ trainingCycles, cycleOptions, setRefreshKey }) {
    const intl = useIntl();
    const daysOfWeek = [
        { label: intl.formatMessage({ id: 'workoutTable.monday' }), value: 1 },
        { label: intl.formatMessage({ id: 'workoutTable.tuesday' }), value: 2 },
        { label: intl.formatMessage({ id: 'workoutTable.wednesday' }), value: 3 },
        { label: intl.formatMessage({ id: 'workoutTable.thursday' }), value: 4 },
        { label: intl.formatMessage({ id: 'workoutTable.friday' }), value: 5 },
        { label: intl.formatMessage({ id: 'workoutTable.saturday' }), value: 6 },
        { label: intl.formatMessage({ id: 'workoutTable.sunday' }), value: 7 },
    ];
    const { user } = useContext(UserContext);
    const [exercisesDB, setExercisesDB] = useState([]);
    const [cycle, setCycle] = useState(null);
    const [dayOfWeek, setDayOfWeek] = useState(null);
    const [exercises, setExercises] = useState([]);
    // eslint-disable-next-line
    const [originalExercises, setOriginalExercises] = useState([]);
    const [numWeeks, setNumWeeks] = useState(0);
    const [properties, setProperties] = useState([]);
    const [planName, setPlanName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const showToast = useToast();
    const possibleProperties = ["sets", "repetitions", "weight", "time", "restInterval", "tempo", "notes", "difficulty", "duration", "distance"];
    const [isLoading, setIsLoading] = useState(false);
    const [editedExercises, setEditedExercises] = useState([]);
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [selectedWeeks, setSelectedWeeks] = useState([]);
    const [currentExercise, setCurrentExercise] = useState(null);
    const [selectedExercise, setSelectedExercise] = useState(null);
    useEffect(() => {
        const fetchExercises = async () => {
            const exercises = await getExercises(user.userId);
            const exercisesDB = exercises.map(exercise => ({ label: exercise.name, value: exercise.id }));
            setExercisesDB(exercisesDB);
        };
        fetchExercises();
    }, [user.userId]);

    const renderExerciseName = (rowData) => {
        return rowData.name;
    };

    const renderTablesByDayNumber = () => {
        if (!exercises || exercises.length === 0) {
            return <div><FormattedMessage id="common.noData"/></div>;
        }
        console.log(exercises);
        const exercisesByDayNumber = exercises.reduce((acc, exercise) => {
            exercise.sessionDates.forEach((sessionDate, index) => {
                const dayNumber = new Date(sessionDate).getDay() - 1;
                if (!acc[dayNumber]) {
                    acc[dayNumber] = [];
                }
                if (!acc[dayNumber].some(e => e.name === exercise.name && e.groupNumber === exercise.groupNumber)) {
                    acc[dayNumber].push(exercise);
                }
            });
            return acc;
        }, {});

        return (
            <>
                {Object.entries(exercisesByDayNumber).map(([dayNumber, exercisesForDay]) => {
                    const formattedDayLabel = daysOfWeek.find(day => day.value === parseInt(dayNumber))?.label || `Day ${dayNumber}`;
                    return (
                        <div key={`day-${dayNumber}`}>
                            <h3>{intl.formatMessage({ id: 'workoutTable.trainingDay' }, { day: formattedDayLabel })}</h3>
                            <DataTable
                                value={isEditing ? 
                                    [...exercisesForDay.map(ex => ({...ex, isNew: false})), 
                                     { name: intl.formatMessage({ id: 'workoutTable.addNewExercise' }), isNew: true }] 
                                    : [...exercisesForDay]}
                                headerColumnGroup={headerGroup}
                                responsiveLayout="scroll"
                                scrollable
                                scrollHeight="700px"
                                editMode="cell"
                                loading={isLoading}
                                rowClassName={rowClassName}
                            >
                                <Column
                                    header={intl.formatMessage({ id: 'workoutTable.exercise' })}
                                    body={(rowData) => {
                                        if (rowData.name === intl.formatMessage({ id: 'workoutTable.addNewExercise' }) && isEditing) {
                                            return (
                                                <Button
                                                    label={intl.formatMessage({ id: 'workoutTable.addNewExercise' })}
                                                    icon="pi pi-plus"
                                                    onClick={handleAddNewExercise}
                                                />
                                            );
                                        }
                                        return renderExerciseName(rowData);
                                    }}
                                    editor={(options) => exerciseEditor(options)}
                                    editorOptions={{ disabled: !isEditing }}
                                />
                                {dataColumns}
                            </DataTable>
                        </div>
                    );
                })}
            </>
        );
    };

    useEffect(() => {
        if (cycle && trainingCycles && trainingCycles.length > 0) {
            const selectedCycle = trainingCycles.find(c => c.id === cycle);
            if (!selectedCycle) return;
    
            const exercisesMap = new Map();
            const propertiesSet = new Set();
            const numWeeks = selectedCycle.trainingWeeks?.length || 0;
            selectedCycle.trainingWeeks.forEach((week, weekIndex) => {
                if (!week.trainingSessions) return;
    
                week.trainingSessions.forEach(session => {
                    if (!session.workoutInstances) return;
    
                    session.workoutInstances.forEach(instance => {
                        const nombre = instance.workout.planName;
                        setPlanName(nombre);
                        instance.groups.forEach(group => {
                            group.exercises.forEach(exerciseData => {
                                const exerciseName = exerciseData.exercise?.name || 'Unnamed Exercise';
                                const key = `${exerciseName}-${group.groupNumber}`;
                                console.log(key);
                                if (exercisesMap.has(key)) {
                                    const existingExercise = exercisesMap.get(key);
                                    existingExercise.sessionDates.push(session.sessionDate);
                                    existingExercise.id[weekIndex] = exerciseData.id;
                                    existingExercise.groupId[weekIndex] = group.id;
                                    possibleProperties.forEach(prop => {
                                        const value = exerciseData[prop] || group[prop] || '-';
                                        if (value !== '-') {
                                            existingExercise[prop][weekIndex] = value;
                                            propertiesSet.add(prop);
                                        }
                                    });
                                } else {
                                    if (exerciseName === 'Hip Thrust') console.log('else', exerciseName, dayOfWeek, session.dayNumber);
                                    if (dayOfWeek && session.dayNumber !== dayOfWeek) {
                                        return;
                                    }
                                    
                                    const exerciseObj = {
                                        name: exerciseName,
                                        groupNumber: group.groupNumber,
                                        groupId: Array(numWeeks).fill(null),
                                        sessionDates: [session.sessionDate],
                                        id: Array(numWeeks).fill(null),
                                    };
                                    exerciseObj.id[weekIndex] = exerciseData.id;
                                    exerciseObj.groupId[weekIndex] = group.id;
                                    possibleProperties.forEach(prop => {
                                        exerciseObj[prop] = Array(numWeeks).fill('-');
                                    });
                                    possibleProperties.forEach(prop => {
                                        const value = exerciseData[prop] || group[prop] || '-';
                                        if (value !== '-') {
                                            exerciseObj[prop][weekIndex] = value;
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
            const sortedExercises = Array.from(exercisesMap.values()).sort((a, b) => a.groupNumber - b.groupNumber);
            const justExercises = Array.from(exercisesMap.values());
            setExercises(justExercises);
            setOriginalExercises(JSON.parse(JSON.stringify(sortedExercises)));
            setNumWeeks(numWeeks);
            setProperties(Array.from(propertiesSet));
        }
        // eslint-disable-next-line
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
    };

    const renderProperty = (rowData, property, weekIndex) => {
        // Verifica si rowData[property] es un array y si weekIndex es un índice válido
        if (Array.isArray(rowData[property]) && weekIndex < rowData[property].length) {
            return rowData[property][weekIndex] || '-';
        }
        // Si no es un array o el índice no es válido, devuelve un guion
        return '-';
    };

    const cellEditor = (options, property, weekIndex) => {
        if (!isEditing) {
            return options.value;
        }

        
            return (
                <InputText
                    type="text"
                    value={options.rowData[property][weekIndex]}
                    onChange={(e) => onEditorValueChange(options, e.target.value, property, weekIndex)}
                />
            );
        
    };

    const handleExerciseNameEdit = (e, options) => {
        const exercise = exercisesDB.find(exercise => exercise.value === e.value);
        console.log(exercise);
        setSelectedExercise(exercise.value);
        const fullExercise = {  
            ...options,
            ...exercise,
            uniqueId: `${exercise.value}_${options.rowIndex}` // Agregar un ID único
        }
        console.log(fullExercise);
        setCurrentExercise(fullExercise);
        updateExerciseNameForWeeks(fullExercise);
    };

    const updateExerciseNameForWeeks = (exercise) => {
        let updatedExercises = [...exercises];
        updatedExercises[exercise.rowIndex].name = exercise.label;

        // console.log(updatedExercises[exercise.rowIndex]);
        const updatedEditedExercises = [...editedExercises];
        
        // Recorrer todas las semanas del ejercicio
        for (let weekIndex = 0; weekIndex < numWeeks; weekIndex++) {
            const exerciseId = updatedExercises[exercise.rowIndex].id[weekIndex];
            
            if (exerciseId) {
                // Si existe ID, actualizar ejercicio existente
                const existingIndex = updatedEditedExercises.findIndex(ex => 
                    ex.id === exerciseId && 
                    ex.rowIndex === exercise.rowIndex // Agregar verificación de índice
                );
                
                if (existingIndex !== -1) {
                    updatedEditedExercises[existingIndex] = {
                        ...updatedEditedExercises[existingIndex],
                        newExerciseId: exercise.value,
                        rowIndex: exercise.rowIndex // Mantener el índice original
                    };
                } else {
                    updatedEditedExercises.push({
                        id: exerciseId,
                        newExerciseId: exercise.value,
                        rowIndex: exercise.rowIndex
                    });
                }
            } else {
                // Si no existe ID, es un ejercicio nuevo
                updatedEditedExercises.push({
                    groupId: updatedExercises[exercise.rowIndex].groupId[weekIndex],
                    newExerciseId: exercise.value,
                    weekIndex: weekIndex,
                    rowIndex: exercise.rowIndex
                });
            }
        }
        
        //console.log(updatedEditedExercises);
        // console.log(updatedExercises);
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
        console.log(selectedExercise);
        return (
            <Dropdown
                value={selectedExercise}
                options={exercisesDB}
                onChange={(e) => {
                    handleExerciseNameEdit(e, options);
                }}
                placeholder={intl.formatMessage({ id: 'workoutTable.selectExercise' })}
            />
        );
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
        const exerciseIndex = updatedEditedExercises.findIndex(ex => ex.id === updatedExercises[options.rowIndex].id[weekIndex]);
        const exerciseIndexByNewExerciseId = updatedEditedExercises.findIndex(ex => ex.groupId === updatedExercises[options.rowIndex].groupId[weekIndex])  ;
        
        if (exerciseIndex !== -1 || exerciseIndexByNewExerciseId !== -1) {
            if (exerciseIndex !== -1) {     
                updatedEditedExercises[exerciseIndex] = {
                    ...updatedEditedExercises[exerciseIndex],
                    [property]: value
                };
            } else {
                updatedEditedExercises[exerciseIndexByNewExerciseId] = {
                    ...updatedEditedExercises[exerciseIndexByNewExerciseId],
                    [property]: value
                };
            }
            
        } else {
            
            updatedEditedExercises.push({
                id: updatedExercises[options.rowIndex].id[weekIndex],
                [property]: value
            });
        }
        
        setEditedExercises(updatedEditedExercises);
        setExercises(updatedExercises);
    };

    const handleEditSave = async () => {
        if (isEditing) {
            // Enviar `editedExercises` al backend
            try {
                await saveExercisesToBackend(editedExercises);
                setOriginalExercises(JSON.parse(JSON.stringify(exercises))); // Actualizar el original
                setEditedExercises([]); // Limpiar el array de ejercicios editados
            } catch (error) {
                console.error(error);
            }
        }
        setIsEditing(!isEditing);
    };

    const saveExercisesToBackend = async (changes) => {
        // Implementa la lógica para enviar los datos al backend.
        // Por ejemplo:
        try {
            setIsLoading(true);
            await updateExercisesInstace(changes);
            // const response = await updateExercisesInstace(changes);
            // Manejar la respuesta si es necesario
        } catch (error) {
            console.error(error);
            showToast('error', intl.formatMessage({ id: 'common.error' }), intl.formatMessage({ id: 'common.errorSavingChanges' }));
            
        } finally {
            setIsLoading(false);
            setRefreshKey((prevKey) => prevKey + 1);
        }
    };

    const subHeaderColumns = [];

    for (let i = 0; i < numWeeks; i++) {
        properties.forEach(property => {
            const headerLabel = propertyLabels[property] || property;
            subHeaderColumns.push(<Column header={headerLabel} key={`${property}-header-${i}`} />);
        });
    }

    const headerGroup = (
        <ColumnGroup>
            <Row>
                <Column header={intl.formatMessage({ id: 'workoutTable.exercise' })} rowSpan={2} />
                {Array.from({ length: numWeeks }, (_, i) => (
                    <Column header={`${intl.formatMessage({ id: 'workoutTable.week' }, { week: i + 1 })}`} colSpan={properties.length} key={`week-${i}`} />
                ))}
            </Row>
            <Row>
                {subHeaderColumns}
            </Row>
        </ColumnGroup>
    );

    const dataColumns = [];

    for (let i = 0; i < numWeeks; i++) {
        properties.forEach(property => {
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
        return rowData.groupNumber % 2 === 0 ? 'group-even' : 'group-odd';
    };

    const renderCardTitle = () => {
        if (cycle) {
            return (
                <div className='flex justify-content-between align-items-center'>
                    <div>
                        {intl.formatMessage({ id: 'workoutTable.day' }, { day: dayOfWeek, plan: planName })}
                    </div>
                    <div>
                        {hasData ? (
                            <Button
                                label={intl.formatMessage({ id: isEditing ? 'common.save' : 'common.edit' })}
                                icon={isEditing ? "pi pi-save" : "pi pi-pencil"}
                                onClick={handleEditSave}
                                loading={isLoading}
                            />
                        ) : (
                            <Button
                                label={intl.formatMessage({ id: 'workoutTable.addTraining' })}
                                icon="pi pi-plus"
                                onClick={handleAddTraining}
                            />
                        )}
                    </div>
                </div>
            );
        }

        return intl.formatMessage({ id: 'workoutTable.selectCycleDay' });
    };

    const hasData = exercises && exercises.length > 0;
    const handleAddTraining = () => {
        const emptyExercise = {
            name: 'New Exercise',
            groupNumber: exercises.length + 1,
            sessionDates: Array(numWeeks).fill(null),
            id: Array(numWeeks).fill(null),
        };

        possibleProperties.forEach(prop => {
            emptyExercise[prop] = Array(numWeeks).fill('-');
        });

        setExercises([...exercises, emptyExercise]);
        setIsEditing(true); // Permitir edición inmediata
    };

    const handleAddNewExercise = () => {
        const trainingSessionDates = exercises[exercises.length - 1].sessionDates;
        const trainingGroupId = exercises[exercises.length - 1].groupId;
        const groupNumber = exercises[exercises.length - 1].groupNumber;
        const emptyExercise = {
            name: intl.formatMessage({ id: 'workoutTable.newExercise' }),
            groupNumber: groupNumber + 1,
            sessionDates: trainingSessionDates,
            id: Array(numWeeks).fill(null),
            groupId: trainingGroupId,
            isNew: false
        };

        possibleProperties.forEach(prop => {
            emptyExercise[prop] = Array(numWeeks).fill('-');
        });

        setExercises([...exercises, emptyExercise]);
    };
    return (
        <div>
        <Card title={renderCardTitle}>
            <div className='grid'>
                <div className="col-6">
                    <div className="p-field">
                        <label><FormattedMessage id="workoutTable.cycle" /></label>
                        <Dropdown
                            value={cycle}
                            options={cycleOptions}
                            onChange={(e) => setCycle(e.value)}
                            placeholder={intl.formatMessage({ id: 'workoutTable.selectCycle' })}
                        />
                    </div>
                </div>
                <div className="col-6">
                    <div className="p-field">
                        <label><FormattedMessage id="workoutTable.dayOfWeek" /></label>
                        <Dropdown
                            value={dayOfWeek}
                            options={daysOfWeek}
                            onChange={(e) => setDayOfWeek(e.value)}
                            placeholder={intl.formatMessage({ id: 'workoutTable.selectDay' })}
                            showClear
                        />
                    </div>
                </div>
            </div>
            {renderTablesByDayNumber()}
        </Card>

        <Dialog
        draggable={false}
        resizable={false}
        header={intl.formatMessage({ id: 'workoutTable.selectWeeks' })}
        visible={isDialogVisible}
        onHide={() => setIsDialogVisible(false)}
        className='responsive-dialog'
        >
            <div>
                <div className='flex align-items-center justify-content-between'>
                    <label>{intl.formatMessage({ id: 'workoutTable.modifyAll' })}</label>
                    <Checkbox
                        checked={selectedWeeks.length === numWeeks}
                        onChange={toggleSelectAllWeeks}
                    />
                    
                </div>
                {Array.from({ length: numWeeks }, (_, i) => (
                    <div key={i} className='flex align-items-center justify-content-between'>
                        <label>{intl.formatMessage({ id: 'workoutTable.week' }, { week: i + 1 })}</label>
                        <Checkbox
                            checked={selectedWeeks.includes(i)}
                            onChange={(e) => {
                                const newSelectedWeeks = e.target.checked
                                    ? [...selectedWeeks, i]
                                    : selectedWeeks.filter(week => week !== i);
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
    </div>
    );
}
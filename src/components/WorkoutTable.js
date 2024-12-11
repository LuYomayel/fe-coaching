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

    useEffect(() => {
        const fetchExercises = async () => {
            const exercises = await getExercises(user.userId);
            const exercisesDB = exercises.map(exercise => ({ label: exercise.name, value: exercise.id }));
            setExercisesDB(exercisesDB);
        };
        fetchExercises();
    }, [user.userId]);

    const renderExerciseName = (rowData) => {
        const allNamesEqual = rowData.name.every(name => name === rowData.name[0]);
        return allNamesEqual ? rowData.name[0] : rowData.name.join(', ');
    };

    const renderTablesByDayNumber = () => {
        if (!exercises || exercises.length === 0) {
            return <div><FormattedMessage id="common.noData"/></div>;
        }

        const exercisesByDayNumber = exercises.reduce((acc, exercise) => {
            exercise.sessionDates.forEach((sessionDate, index) => {
                const dayNumber = new Date(sessionDate).getDay() - 1;
                if (!acc[dayNumber]) {
                    acc[dayNumber] = [];
                }
                if (!acc[dayNumber].some(e => e.name === exercise.name)) {
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
                                value={[...exercisesForDay, { name: 'Agregar nuevo ejercicio', isNew: true }]}
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
                                    body={(rowData) => rowData.isNew ? (
                                        <Button
                                            label={intl.formatMessage({ id: 'workoutTable.addTraining' })}
                                            icon="pi pi-plus"
                                            onClick={handleAddTraining}
                                        />
                                    ) : renderExerciseName(rowData)}
                                    editor={exerciseEditor}
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
    
                                if (exercisesMap.has(key)) {
                                    const existingExercise = exercisesMap.get(key);
                                    existingExercise.sessionDates.push(session.sessionDate);
                                    existingExercise.id[weekIndex] = exerciseData.id;
                                    possibleProperties.forEach(prop => {
                                        const value = exerciseData[prop] || group[prop] || '-';
                                        if (value !== '-') {
                                            existingExercise[prop][weekIndex] = value;
                                            propertiesSet.add(prop);
                                        }
                                    });
                                } else {
                                    if (dayOfWeek && session.dayNumber !== dayOfWeek) {
                                        return;
                                    }
    
                                    const exerciseObj = {
                                        name: Array(numWeeks).fill(exerciseName),
                                        groupNumber: group.groupNumber,
                                        sessionDates: [session.sessionDate],
                                        id: Array(numWeeks).fill(null),
                                    };
                                    exerciseObj.id[weekIndex] = exerciseData.id;
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
            setExercises(sortedExercises);
            setOriginalExercises(JSON.parse(JSON.stringify(sortedExercises)));
            setNumWeeks(numWeeks);
            setProperties(Array.from(propertiesSet));
        }
        // eslint-disable-next-line
    }, [cycle, dayOfWeek, trainingCycles]);

    const propertyLabels = {
        sets: "Set",
        repetitions: "Repetitions",
        weight: "Weight",
        time: "Time",
        restInterval: "Rest Interval",
        tempo: "Tempo",
        notes: "Notes",
        difficulty: "Difficulty",
        duration: "Duration",
        distance: "Distance",
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
        const fullExercise = {  
            ...options,
            ...exercise
        }
        setCurrentExercise(fullExercise);
        setIsDialogVisible(true);
    };

    const updateExerciseNameForWeeks = (exercise) => {
        let updatedExercises = [...exercises];
        console.log(exercise)
        selectedWeeks.forEach(weekIndex => {
            updatedExercises[currentExercise.rowIndex].name[weekIndex] = exercise.label;
        });
        setExercises(updatedExercises);
        setIsDialogVisible(false);
    };

    const exerciseEditor = (options) => {
        return (
            <>
                <Dropdown
                    options={exercisesDB}
                    onChange={(e) => handleExerciseNameEdit(e, options)}
                    placeholder={intl.formatMessage({ id: 'workoutTable.selectExercise' })}
                />
                <Dialog header={intl.formatMessage({ id: 'workoutTable.selectWeeks' })} visible={isDialogVisible} onHide={() => setIsDialogVisible(false)}>
                    <div>
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
            </>
        );
    };

    const onEditorValueChange = (options, value, property, weekIndex) => {
        let updatedExercises = [...exercises];
        console.log(updatedExercises);
        if (!Array.isArray(updatedExercises[options.rowIndex][property])) {
            updatedExercises[options.rowIndex][property] = [];
        }
        const exerciseSelected = exercisesDB.find(exercise => exercise.value === value);
        updatedExercises[options.rowIndex][property][weekIndex] = exerciseSelected.label;
        setExercises(updatedExercises);

        // Actualizar el array de ejercicios editados
        const updatedEditedExercises = [...editedExercises];
        const exerciseIndex = updatedEditedExercises.findIndex(ex => ex.id === updatedExercises[options.rowIndex].id[weekIndex]);
        
        if (exerciseIndex !== -1) {
            updatedEditedExercises[exerciseIndex] = {
                ...updatedEditedExercises[exerciseIndex],
                [property]: exerciseSelected.label
            };
        } else {
            updatedEditedExercises.push({
                id: updatedExercises[options.rowIndex].id[weekIndex],
                [property]: exerciseSelected.label
            });
        }

        setEditedExercises(updatedEditedExercises);
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
            console.log('saveExercisesToBackend', changes);
            return
            await updateExercisesInstace(changes);
            // const response = await updateExercisesInstace(changes);
            // Manejar la respuesta si es necesario
        } catch (error) {
            console.error(error);
            showToast('error', 'Error', 'Error al guardar los cambios');
            
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
                <Column header="Exercise" rowSpan={2} />
                {Array.from({ length: numWeeks }, (_, i) => (
                    <Column header={`Week ${i + 1}`} colSpan={properties.length} key={`week-${i}`} />
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
    console.log(hasData);
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

    return (
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
    );
}
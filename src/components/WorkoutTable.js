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
    
    const [cycle, setCycle] = useState(null);
    const [dayOfWeek, setDayOfWeek] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [originalExercises, setOriginalExercises] = useState([]);
    const [numWeeks, setNumWeeks] = useState(0);
    const [properties, setProperties] = useState([]);
    const [planName, setPlanName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const showToast = useToast();
    const possibleProperties = ["sets", "repetitions", "weight", "time", "restInterval", "tempo", "notes", "difficulty", "duration", "distance"];
    const [isLoading, setIsLoading] = useState(false);

    const renderTablesByDayNumber = () => {
        if (!exercises || exercises.length === 0) {
            return <div><FormattedMessage id="common.noData" defaultMessage="No training data available" /></div>;
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

        return Object.entries(exercisesByDayNumber).map(([dayNumber, exercisesForDay]) => {
            const formattedDayLabel = daysOfWeek.find(day => day.value === parseInt(dayNumber))?.label || `Day ${dayNumber}`;

            return (
                <div key={`day-${dayNumber}`}>
                    <h3>{intl.formatMessage({ id: 'workoutTable.trainingDay' }, { day: formattedDayLabel })}</h3>
                    <DataTable
                        value={exercisesForDay}
                        headerColumnGroup={headerGroup}
                        responsiveLayout="scroll"
                        scrollable
                        scrollHeight="700px"
                        editMode="cell"
                        loading={isLoading}
                        rowClassName={rowClassName}
                    >
                        <Column header={intl.formatMessage({ id: 'workoutTable.exercise' })} body={rowData => `${rowData.groupNumber}. ${rowData.name}`} />
                        {dataColumns}
                    </DataTable>
                </div>
            );
        });
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
    
                                // Verificar si el ejercicio ya existe en el `Map`
                                if (exercisesMap.has(key)) {
                                    const existingExercise = exercisesMap.get(key);
                                    // Solo actualizar las semanas correspondientes sin agregar un nuevo ejercicio
                                    existingExercise.sessionDates.push(session.sessionDate);
                                    existingExercise.id[weekIndex] = exerciseData.id; // Actualizar ID de la instancia
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
    
                                    // Crear un nuevo objeto de ejercicio
                                    const exerciseObj = {
                                        name: exerciseName,
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
                                    // console.log(exercisesMap)
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
        return rowData[property][weekIndex] || '-';
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

    const onEditorValueChange = (options, value, property, weekIndex) => {
        let updatedExercises = [...exercises];
        updatedExercises[options.rowIndex][property][weekIndex] = value;
        setExercises(updatedExercises);
    };

    const handleEditSave = async () => {
        if (isEditing) {
            const changes = [];

            exercises.forEach((exercise, exerciseIndex) => {
                for (let weekIndex = 0; weekIndex < numWeeks; weekIndex++) {
                    const exerciseInstanceId = exercise.id[weekIndex];
                    if (exerciseInstanceId) {
                        const updatedProperties = {};
                        let hasChanges = false;

                        properties.forEach((property) => {
                            const originalValue = originalExercises[exerciseIndex][property][weekIndex];
                            const currentValue = exercise[property][weekIndex];

                            if (originalValue !== currentValue) {
                                updatedProperties[property] = currentValue;
                                hasChanges = true;
                            }
                        });

                        if (hasChanges) {
                            changes.push({
                                id: exerciseInstanceId,
                                ...updatedProperties,
                            });
                        }
                    }
                }
            });

            // Enviar `changes` al backend
            try {
                await saveExercisesToBackend(changes);
                setOriginalExercises(JSON.parse(JSON.stringify(exercises))); // Actualizar el original
                // Mostrar mensaje de éxito si lo deseas
            } catch (error) {
                // Manejar errores
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
                <div className='flex flex-colum justify-content-between'>
                    <div>
                        {intl.formatMessage({ id: 'workoutTable.day' }, { day: dayOfWeek, plan: planName })}
                    </div>
                    <div>
                        <Button
                            label={intl.formatMessage({ id: isEditing ? 'common.save' : 'common.edit' })}
                            icon={isEditing ? "pi pi-save" : "pi pi-pencil"}
                            onClick={handleEditSave}
                            loading={isLoading}
                        />
                    </div>
                </div>
            );
        }

        return intl.formatMessage({ id: 'workoutTable.selectCycleDay' });
    }

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
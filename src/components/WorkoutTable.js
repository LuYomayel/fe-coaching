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

const daysOfWeek = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 7 },
];

export default function WorkoutTable({ trainingWeeks, cycleOptions, setRefreshKey }) {
    const [cycle, setCycle] = useState(null);
    const [dayOfWeek, setDayOfWeek] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [originalExercises, setOriginalExercises] = useState([]); // Nuevo estado para el original
    const [numWeeks, setNumWeeks] = useState(0);
    const [properties, setProperties] = useState([]);
    const [planName, setPlanName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const showToast = useToast();
    const possibleProperties = ["sets", "reps", "weight", "time", "restInterval", "tempo", "notes", "difficulty", "duration", "distance"];
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (cycle && dayOfWeek) {
            const numWeeks = trainingWeeks.length;
            const exercises = [];
            const propertiesSet = new Set();
            const selectedCycle = trainingWeeks.find(c => c.id === cycle).trainingWeeks;
            selectedCycle.forEach((week, weekIndex) => {
                week.trainingSessions.forEach(session => {
                    session.workoutInstances.forEach(instance => {
                        const nombre = instance.workout.planName;
                        setPlanName(nombre);
                        instance.groups.forEach(group => {
                            group.exercises.forEach(exerciseData => {
                                const exerciseName = exerciseData.exercise?.name || 'Unnamed Exercise';
                                const exerciseId = exerciseData.id;
                                const existingExercise = exercises.find(e => e.name === exerciseName);

                                if (existingExercise) {
                                    existingExercise.id[weekIndex] = exerciseId;
                                    possibleProperties.forEach(prop => {
                                        const value = exerciseData[prop] || group[prop] || '-';
                                        if (value !== '-') {
                                            existingExercise[prop][weekIndex] = value;
                                            propertiesSet.add(prop);
                                        }
                                    });
                                } else {
                                    if (session.dayNumber !== dayOfWeek) {
                                        return;
                                    }
                                    const exerciseObj = {
                                        name: exerciseName,
                                        id: Array(numWeeks).fill(null),
                                    };
                                    exerciseObj.id[weekIndex] = exerciseId;
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
                                    exercises.push(exerciseObj);
                                }
                            });
                        });
                    });
                });
            });

            setExercises(exercises);
            setOriginalExercises(JSON.parse(JSON.stringify(exercises))); // Copia profunda
            setNumWeeks(numWeeks);
            setProperties(Array.from(propertiesSet));
        }
    }, [cycle, dayOfWeek]);

    const propertyLabels = {
        sets: "Set",
        reps: "Reps",
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
        console.log(changes);
        try {
            setIsLoading(true);
            const response = await updateExercisesInstace(changes);
            console.log(response);
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

    const renderCardTitle = () => {
        if (cycle && dayOfWeek) {
            return (
                <div className='flex flex-colum justify-content-between'>
                    <div>
                        {`Day ${dayOfWeek} - ${planName}`}
                    </div>
                    <div>
                        <Button
                            label={isEditing ? "Guardar" : "Editar"}
                            icon={isEditing ? "pi pi-save" : "pi pi-pencil"}
                            onClick={handleEditSave}
                            loading={isLoading}
                        />
                    </div>
                </div>
            );
        }

        return 'Select a cycle and day of the week';
    }
    return (
        <Card title={renderCardTitle}>
            <div className='grid'>
                <div className="col-6">
                    <div className="p-field">
                        <label>Cycle:</label>
                        <Dropdown
                            value={cycle}
                            options={cycleOptions}
                            onChange={(e) => setCycle(e.value)}
                            placeholder="Select Cycle"
                        />
                    </div>
                </div>
                <div className="col-6">
                    <div className="p-field">
                        <label>Day of the week:</label>
                        <Dropdown
                            value={dayOfWeek}
                            options={daysOfWeek}
                            onChange={(e) => setDayOfWeek(e.value)}
                            placeholder="Select Day"
                        />
                    </div>
                </div>
            </div>
            <DataTable
                value={exercises}
                headerColumnGroup={headerGroup}
                responsiveLayout="scroll"
                scrollable
                scrollHeight="700px"
                editMode="cell"
                loading={isLoading}
            >
                <Column field="name" header="Ejercicio" />
                {dataColumns}
            </DataTable>
        </Card>
    );
}
import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Dropdown } from 'primereact/dropdown';

const daysOfWeek = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 7 },
];

export default function WorkoutTable({ trainingWeeks, cycleOptions }) {
    const [cycle, setCycle] = useState(null);
    const [dayOfWeek, setDayOfWeek] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [numWeeks, setNumWeeks] = useState(0);
    const [properties, setProperties] = useState([]);
    const [planName, setPlanName] = useState('');
    const possibleProperties = ["sets", "reps", "weight", "time", "restInterval", "tempo", "notes", "difficulty", "duration", "distance"];

    useEffect(() => {
        if (cycle && dayOfWeek) {
            const numWeeks = trainingWeeks.length;
            const exercises = [];
            const propertiesSet = new Set();

            trainingWeeks.forEach((week, weekIndex) => {
                week.trainingSessions.forEach(session => {
                    session.workoutInstances.forEach(instance => {
                        const nombre = instance.workout.planName;
                        setPlanName(nombre);
                        instance.groups.forEach(group => {
                            group.exercises.forEach(exerciseData => {
                                const exerciseName = exerciseData.exercise?.name || 'Unnamed Exercise';
                                const existingExercise = exercises.find(e => e.name === exerciseName);

                                if (existingExercise) {
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
                                    };
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
        if (rowData[property] && rowData[property][weekIndex]) {
            return rowData[property][weekIndex];
        } else {
            return '-';
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
                <Column body={(rowData) => renderProperty(rowData, property, i)} key={`${property}-col-${i}`} />
            );
        });
    }

    return (
        <Card title={`Day ${dayOfWeek} - ${planName}`}>
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
            <DataTable value={exercises} headerColumnGroup={headerGroup} responsiveLayout="scroll" scrollable 
    scrollHeight="700px" // Define el tamaño del área de visualización
     >
                <Column field="name" header="Ejercicio" />
                {dataColumns}
            </DataTable>
        </Card>
    );
}
import React, { useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Dropdown } from 'primereact/dropdown';
import { Chart } from 'primereact/chart';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

// Mock data
const mockWorkouts = [
  { id: 1, title: 'Full Body Workout', start: '2023-05-15T10:00:00', end: '2023-05-15T11:30:00' },
  { id: 2, title: 'Cardio Session', start: '2023-05-17T09:00:00', end: '2023-05-17T10:00:00' },
  { id: 3, title: 'Upper Body Focus', start: '2023-05-19T11:00:00', end: '2023-05-19T12:30:00' },
];

const mockWorkoutDetails = [
  { id: 1, name: 'Full Body Workout', date: '2023-05-15', exercises: [
    { name: 'Squats', expected: { sets: 3, reps: 10, weight: 100 }, completed: { sets: 3, reps: 10, weight: 100 } },
    { name: 'Bench Press', expected: { sets: 3, reps: 8, weight: 150 }, completed: { sets: 3, reps: 8, weight: 150 } },
  ]},
  { id: 2, name: 'Cardio Session', date: '2023-05-17', exercises: [
    { name: 'Treadmill', expected: { duration: 30, speed: 6 }, completed: { duration: 30, speed: 6 } },
    { name: 'Rowing Machine', expected: { duration: 20, distance: 3000 }, completed: { duration: 20, distance: 3100 } },
  ]},
];

const mockExercises = [
  { name: 'Squats', value: 'squats' },
  { name: 'Bench Press', value: 'benchPress' },
  { name: 'Deadlift', value: 'deadlift' },
];

const mockExerciseProgress = {
  squats: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Expected Reps',
        data: [30, 30, 36, 36],
        fill: false,
        borderColor: '#42A5F5',
      },
      {
        label: 'Completed Reps',
        data: [30, 32, 34, 36],
        fill: false,
        borderColor: '#66BB6A',
      },
    ],
  },
};

export default function ClientDashboard() {
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workoutDetailsVisible, setWorkoutDetailsVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const toast = useRef(null);

  const handleEventClick = (info) => {
    setSelectedWorkout(info.event);
    setWorkoutDetailsVisible(true);
  };

  const handleAssignWorkout = () => {
    toast.current.show({ severity: 'success', summary: 'Success', detail: 'Workout assigned successfully', life: 3000 });
  };

  const handleUnassignWorkout = () => {
    toast.current.show({ severity: 'info', summary: 'Info', detail: 'Workout unassigned', life: 3000 });
  };

  const renderWorkoutDetails = (rowData) => {
    return (
      <Accordion className="w-full">
        {rowData.exercises.map((exercise, index) => (
          <AccordionTab key={index} header={exercise.name}>
            <div className="grid">
              <div className="col-12 md:col-6">
                <h4>Expected</h4>
                <p>Sets: {exercise.expected.sets}</p>
                <p>Reps: {exercise.expected.reps}</p>
                <p>Weight: {exercise.expected.weight} lbs</p>
              </div>
              <div className="col-12 md:col-6">
                <h4>Completed</h4>
                <p>Sets: {exercise.completed.sets}</p>
                <p>Reps: {exercise.completed.reps}</p>
                <p>Weight: {exercise.completed.weight} lbs</p>
              </div>
            </div>
          </AccordionTab>
        ))}
      </Accordion>
    );
  };

  return (
    <div className="client-dashboard p-4">
      <Toast ref={toast} />

      <Card className="mb-4" style={{ backgroundImage: 'linear-gradient(to right, #6366F1, #A5B4FC)', color: 'white' }}>
        <h1 className="text-4xl font-bold text-center">Client Dashboard</h1>
      </Card>

      <TabView>
        <TabPanel header="Workout Calendar">
          <div className="mb-3">
            <Button label="Assign Workout" icon="pi pi-plus" className="p-button-success mr-2" onClick={handleAssignWorkout} />
            <Button label="Unassign Workout" icon="pi pi-minus" className="p-button-danger" onClick={handleUnassignWorkout} />
          </div>
          <Card>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek'
              }}
              events={mockWorkouts}
              eventClick={handleEventClick}
              height="auto"
            />
          </Card>
        </TabPanel>

        <TabPanel header="Workout Details">
          <DataTable value={mockWorkoutDetails} responsiveLayout="scroll">
            <Column field="name" header="Workout Name" />
            <Column field="date" header="Date" />
            <Column body={renderWorkoutDetails} header="Exercises" />
          </DataTable>
        </TabPanel>

        <TabPanel header="Exercise Progress">
          <div className="card">
            <Dropdown
              value={selectedExercise}
              options={mockExercises}
              onChange={(e) => setSelectedExercise(e.value)}
              placeholder="Select an Exercise"
              className="w-full mb-3"
            />
            {selectedExercise && (
              <Chart type="line" data={mockExerciseProgress[selectedExercise]} options={{
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.5,
              }} />
            )}
          </div>
        </TabPanel>
      </TabView>

      <Dialog
        header="Workout Details"
        visible={workoutDetailsVisible}
        style={{ width: '50vw' }}
        onHide={() => setWorkoutDetailsVisible(false)}
      >
        {selectedWorkout && (
          <div>
            <h2>{selectedWorkout.title}</h2>
            <p>Start: {new Date(selectedWorkout.start).toLocaleString()}</p>
            <p>End: {new Date(selectedWorkout.end).toLocaleString()}</p>
            <Button label="View Full Details" icon="pi pi-external-link" className="p-button-secondary mt-3" />
          </div>
        )}
      </Dialog>
    </div>
  );
}
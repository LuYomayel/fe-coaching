import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { fetchWorkoutInstance, deleteWorkoutPlan } from '../services/workoutService';
import { useNavigate } from 'react-router-dom';
import { getYouTubeThumbnail } from '../utils/UtilFunctions';
// Mock data (replace with actual API calls in a real application)
const mockWorkoutPlan = {
  id: 1,
  name: 'Full Body Workout',
  description: 'A comprehensive full body workout routine',
  completed: false,
  exerciseGroups: [
    {
      id: 1,
      name: 'Warm-up',
      sets: 1,
      restBetweenExercises: 30,
      exercises: [
        {
          id: 1,
          name: 'Jumping Jacks',
          videoUrl: 'https://www.youtube.com/watch?v=UpH7rm0cYbM',
          reps: 20,
          time: 60,
          completed: false,
          feedback: { rpe: null, comments: '' }
        },
        {
          id: 2,
          name: 'Arm Circles',
          videoUrl: 'https://www.youtube.com/watch?v=bP52FXTlzjA',
          reps: 10,
          time: 30,
          completed: false,
          feedback: { rpe: null, comments: '' }
        }
      ]
    },
    {
      id: 2,
      name: 'Main Workout',
      sets: 3,
      restBetweenSets: 90,
      exercises: [
        {
          id: 3,
          name: 'Squats',
          videoUrl: 'https://www.youtube.com/watch?v=YaXPRqUwItQ',
          reps: 12,
          weight: 100,
          completed: false,
          feedback: { rpe: null, comments: '' }
        },
        {
          id: 4,
          name: 'Push-ups',
          videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
          reps: 15,
          completed: false,
          feedback: { rpe: null, comments: '' }
        }
      ]
    }
  ]
};

export default function NewPlanDetail({ isCoach = false, planId, setPlanDetailsIsVisible, setRefreshKey, setLoading }) {
    // const [workoutPlan, setWorkoutPlan] = useState(null);
    const [videoDialogVisible, setVideoDialogVisible] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState('');
    const toast = useRef(null);
    const navigate = useNavigate();

    const [workoutPlan, setWorkoutPlan] = useState({
        groups: [{
          set: '',
          rest: '',
          groupNumber: 1,
          exercises: [{
            exercise: { name: '', id: '', multimedia: '' },
            repetitions: '',
            sets: '',
            time: '',
            weight: '',
            restInterval: '',
            tempo: '',
            notes: '',
            difficulty: '',
            duration: '',
            distance: ''
          }]
        }],
        workout: {
          id: '',
          planName: ''
        },
        startTime: null,
        endTime: null,
        notes: '',
      });

      useEffect(() => {
        const fetchPlanDetails = async () => {
            try {
                setLoading(true); // Set loading state
                const planDetails = await fetchWorkoutInstance(planId);
                console.log(planDetails);
                setWorkoutPlan(planDetails); // Set the fetched plan data
            } catch (error) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: error.message });
            } finally {
                setLoading(false); // Stop loading after data is fetched
            }
        };
        
        if (planId) fetchPlanDetails();
    }, [planId]); // Plan ID is used as a dependency

    const handleEdit = () => {
        // Implement edit functionality
        navigate(`/plans/edit/${planId}`)
    };

    const handleDelete = () => {
        confirmDialog({
            message: 'Are you sure you want to delete this workout plan?',
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    await deleteWorkoutPlan(planId, workoutPlan.isTemplate);
                    toast.current.show({ severity: 'success', summary: 'Deleted', detail: 'Workout plan deleted' });
                    setPlanDetailsIsVisible(false); // Close the plan details dialog
                    setRefreshKey(old => old + 1); // Trigger UI refresh
                } catch (error) {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: error.message });
                }
            }
        });
    };

    const handleStartWorkout = () => {
        navigate(`/plans/start-session/${planId}`, { 
            state: { isTraining: true, planId: workoutPlan.workout.id } 
        });
    };

    const handleVideoClick = (videoUrl) => {
        setSelectedVideo(videoUrl);
        setVideoDialogVisible(true);
    };

    const handleExerciseCompletion = (groupId, exerciseId, completed) => {
        const updatedWorkoutPlan = { ...workoutPlan };
        const group = updatedWorkoutPlan.exerciseGroups.find(g => g.id === groupId);
        const exercise = group.exercises.find(e => e.id === exerciseId);
        exercise.completed = completed;
        setWorkoutPlan(updatedWorkoutPlan);
    };

    const handleFeedback = (groupId, exerciseId, field, value) => {
        const updatedWorkoutPlan = { ...workoutPlan };
        const group = updatedWorkoutPlan.exerciseGroups.find(g => g.id === groupId);
        const exercise = group.exercises.find(e => e.id === exerciseId);
        exercise.feedback[field] = value;
        setWorkoutPlan(updatedWorkoutPlan);
    };

    const renderExerciseDetails = (exercise, groupId) => (
        <div className="flex flex-column md:flex-row align-items-center mb-3" key={exercise.id}>
          <div className="w-full md:w-4 mb-2 md:mb-0">
            <div className="mr-2 flex-shrink-0">
                <a href="#/" onClick={(e) => {
                e.preventDefault();
                handleVideoClick(exercise.exercise.multimedia);
                }}>
                <img 
                    src={getYouTubeThumbnail(exercise.exercise.multimedia)} 
                    alt={`${exercise.exercise.name} video thumbnail`} 
                    className="border-round" 
                    style={{ width: '120px', height: '68px', objectFit: 'cover', cursor: 'pointer' }}
                />
                </a>
            </div>
            <strong>{exercise.exercise.name}</strong>
          </div>
          <div className="w-full md:w-8">
            <div className="grid">
              {exercise.repetitions && <div className="col-6 md:col-3">Reps: {exercise.repetitions}</div>}
              {exercise.weight && <div className="col-6 md:col-3">Weight: {exercise.weight} </div>}
              {exercise.time && <div className="col-6 md:col-3">Time: {exercise.time} </div>}
              {exercise.tempo && <div className="col-6 md:col-3">Tempo: {exercise.tempo} </div>}
              {exercise.restInterval && <div className="col-6 md:col-3">Rest Interval: {exercise.restInterval} </div>}
              {exercise.difficulty && <div className="col-6 md:col-3">Difficulty: {exercise.difficulty} </div>}
              {exercise.notes && <div className="col-6 md:col-3">Notes: {exercise.notes} </div>}
              {exercise.distance && <div className="col-6 md:col-3">Distance: {exercise.distance} </div>}
              {exercise.duration && <div className="col-6 md:col-3">Duration: {exercise.duration} </div>}
              {exercise.sets && <div className="col-6 md:col-3">Sets: {exercise.sets} </div>}
            </div>
            {workoutPlan.completed && (
              <div className="grid align-items-center mt-2">
                <div className="col-12 md:col-4 mb-2 md:mb-0">
                  <Checkbox 
                    checked={exercise.completed} 
                    onChange={(e) => handleExerciseCompletion(groupId, exercise.id, e.checked)} 
                    label="Completed"
                  />
                </div>
                <div className="col-12 md:col-4 mb-2 md:mb-0">
                  <InputNumber 
                    value={exercise.feedback.rpe} 
                    onValueChange={(e) => handleFeedback(groupId, exercise.id, 'rpe', e.value)} 
                    placeholder="RPE" 
                    min={0} 
                    max={10}
                  />
                </div>
                <div className="col-12 md:col-4">
                  <InputTextarea 
                    value={exercise.feedback.comments} 
                    onChange={(e) => handleFeedback(groupId, exercise.id, 'comments', e.target.value)} 
                    placeholder="Comments"
                    rows={1}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      );

    return (
        <div className="workout-plan-detail p-4">
        <Toast ref={toast} />
        <ConfirmDialog />

        <Card title={workoutPlan.planName}  className="mb-4">
        <div className="flex justify-content-between">
            {isCoach ? (
                <>
                <Button label="Edit" icon="pi pi-pencil" className="p-button-secondary" onClick={handleEdit} />
                <Button label="Delete" icon="pi pi-trash" className="p-button-danger" onClick={handleDelete} />
                </>
            ) : (
                !workoutPlan.completed && (
                <Button label="Start Workout" icon="pi pi-play" className="p-button-success" onClick={handleStartWorkout} />
                )
            )}
            </div>
        </Card>

        <Accordion multiple>
            {workoutPlan.groups.map((group) => (
            <AccordionTab key={group.id} header={`Group: ${group.groupNumber}`}>
                <p>Sets: {group.set}</p>
                <p>Rest between sets: {group.rest} sec</p>
                <DataTable value={group.exercises} className="p-datatable-sm">
                    <Column body={(rowData) => renderExerciseDetails(rowData, group.id)} />
                </DataTable>
            </AccordionTab>
            ))}
        </Accordion>

        <Dialog 
            header="Exercise Video" 
            visible={videoDialogVisible} 
            style={{ width: '70vw' }} 
            onHide={() => setVideoDialogVisible(false)}
        >
            <iframe
            width="100%"
            height="400"
            src={selectedVideo.replace('watch?v=', 'embed/')}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            ></iframe>
        </Dialog>
        </div>
    );
    }
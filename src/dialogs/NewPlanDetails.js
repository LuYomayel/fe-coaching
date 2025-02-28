import React, { useState, useEffect, useRef, useContext } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Badge } from 'primereact/badge';
import { Toast } from 'primereact/toast';
import { fetchWorkoutInstance, deleteWorkoutPlan, fetchWorkoutInstanceTemplate } from '../services/workoutService';
import { useNavigate } from 'react-router-dom';
import { getYouTubeThumbnail, extractYouTubeVideoId, formatDate } from '../utils/UtilFunctions';
import { useToast } from '../utils/ToastContext';
import { UserContext } from '../utils/UserContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { useIntl } from 'react-intl';

export default function NewPlanDetail({ planId, setPlanDetailsVisible, setRefreshKey, setLoading, isTemplate }) {
    const intl = useIntl();
    const [videoDialogVisible, setVideoDialogVisible] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState('');
    const toast = useRef(null);
    const navigate = useNavigate();
    const { user, coach } = useContext(UserContext);
    const { showConfirmationDialog } = useConfirmationDialog();
    const showToast = useToast();
    const propertyUnits = JSON.parse(localStorage.getItem('propertyUnits'));
    const [workoutPlan, setWorkoutPlan] = useState({
        groups: [],
        workout: {
            id: '',
            planName: '',
        },
        workoutTemplate: {
            id: '',
            planName: '',
        },
        status: '',
    });

    useEffect(() => {
        const fetchPlanDetails = async () => {
            try {
                setLoading(true);
                if (isTemplate) {
                    const {data} = await fetchWorkoutInstanceTemplate(planId);
                    setWorkoutPlan(data);
                } else {
                    const {data} = await fetchWorkoutInstance(planId);
                    data.groups.sort((groupA, groupB) => groupA.groupNumber - groupB.groupNumber)
                    setWorkoutPlan(data);
                }
            } catch (error) {
                showToast('error', 'Error fetching plan details', error.message);
            } finally {
                setLoading(false);
            }
        };

        if (planId) fetchPlanDetails();
    }, [planId, setLoading, showToast, isTemplate]);

    const handleEdit = () => {
        navigate(`/plans/edit/${planId}`);
    };

    const handleDelete = () => {
        console.log('workoutPlan', workoutPlan, planId);
        showConfirmationDialog({
            message: intl.formatMessage({ id: 'deletePlan.confirmation.message' }),
            header: intl.formatMessage({ id: 'common.confirmation' }),
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    const response = await deleteWorkoutPlan(planId, workoutPlan.isTemplate);
                    if (response.message === 'success') {
                        showToast('success', intl.formatMessage({ id: 'coach.plan.success.deleted' }), intl.formatMessage({ id: 'coach.plan.success.deleted.message' }, { name: workoutPlan.workout.planName }));
                        setPlanDetailsVisible(false);
                        setRefreshKey((old) => old + 1);
                    } else {
                        showToast('error', 'Error', response.error);
                    }
                } catch (error) {
                    showToast('error', 'Error', error.message);
                }
            },
        });
    };

    const handleStartWorkout = () => {
        navigate(`/plans/start-session/${planId}`, {
            state: { isTraining: true, planId: workoutPlan.id },
        });
    };

    const handleVideoClick = (url) => {
        try {
            const videoId = extractYouTubeVideoId(url);
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            setSelectedVideo(embedUrl);
            setVideoDialogVisible(true);
        } catch (error) {
            showToast('error', 'Error', error.message);
        }
    };

    const renderExerciseDetails = (exercise, group) => (
        <div className="flex flex-column md:flex-row align-items-center mb-3" key={exercise.id}>
            <div className="w-full md:w-4 mb-2 md:mb-0">
                <div className="mr-2 flex-shrink-0">
                    <a
                        href="#/"
                        onClick={(e) => {
                            e.preventDefault();
                            handleVideoClick(exercise.exercise.multimedia);
                        }}
                    >
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
                    {exercise.sets && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.sets' })}: {exercise.sets}{propertyUnits?.sets ? `${propertyUnits?.sets}` : ''}</div>
                    )}
                    {exercise.repetitions && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.reps' })}: {exercise.repetitions}</div>
                    )}
                    {exercise.weight && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.weight' })}: {exercise.weight}{propertyUnits?.weight ? `${propertyUnits?.weight}` : ''}</div>
                    )}
                    {exercise.time && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.time' })}: {exercise.time}{propertyUnits?.time ? `${propertyUnits?.time}` : ''}</div>
                    )}
                    {exercise.tempo && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.tempo' })}: {exercise.tempo}{propertyUnits?.tempo ? `${propertyUnits?.tempo}` : ''}</div>
                    )}
                    {exercise.restInterval && (
                        <div className="col-6 md:col-3">
                            {intl.formatMessage({ id: 'exercise.properties.restInterval' })}: {exercise.restInterval}{propertyUnits?.restInterval ? `${propertyUnits?.restInterval}` : ''}
                        </div>
                    )}
                    {exercise.difficulty && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.difficulty' })}: {exercise.difficulty}{propertyUnits?.difficulty ? `${propertyUnits?.difficulty}` : ''}</div>
                    )}
                    {exercise.distance && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.distance' })}: {exercise.distance}{propertyUnits?.distance ? `${propertyUnits?.distance}` : ''}</div>
                    )}
                    {exercise.duration && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.duration' })}: {exercise.duration}{propertyUnits?.duration ? `${propertyUnits?.duration}` : ''}</div>
                    )}
                    
                    {exercise.notes && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.notes' })}: {exercise.notes}</div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderExerciseDetailsWithFeedback = (exercise) => (
        <div className="flex flex-column md:flex-row align-items-center mb-3" key={exercise.id}>
            {/* Detalles del ejercicio */}
            <div className="w-full md:w-4 mb-2 md:mb-0">
                <div className="mr-2 flex-shrink-0">
                    <a
                        href="#/"
                        onClick={(e) => {
                            e.preventDefault();
                            handleVideoClick(exercise.exercise.multimedia);
                        }}
                    >
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
                    {exercise.repetitions && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.reps' })}: {exercise.repetitions}</div>
                    )}
                    {exercise.weight && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.weight' })}: {exercise.weight}</div>
                    )}
                    {exercise.time && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.time' })}: {exercise.time}</div>
                    )}
                    {exercise.tempo && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.tempo' })}: {exercise.tempo}</div>
                    )}
                    {exercise.restInterval && (
                        <div className="col-6 md:col-3">
                            {intl.formatMessage({ id: 'exercise.properties.restInterval' })}: {exercise.restInterval}
                        </div>
                    )}
                    {exercise.difficulty && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.difficulty' })}: {exercise.difficulty}</div>
                    )}
                    {exercise.notes && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.notes' })}: {exercise.notes}</div>
                    )}
                    {exercise.distance && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.distance' })}: {exercise.distance}</div>
                    )}
                    {exercise.duration && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.duration' })}: {exercise.duration}</div>
                    )}
                    {exercise.sets && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.sets' })}: {exercise.sets}</div>
                    )}
                </div>
            </div>
            {/* Datos de feedback */}
            <div className="w-full md:w-12">
                <div className="grid">
                    {exercise.completed !== undefined && (
                        <div className="col-6 md:col-3">
                            {intl.formatMessage({ id: 'exercise.properties.completed' })}: {exercise.completed ? 'Sí' : 'No'}
                        </div>
                    )}
                    {exercise.completedNotAsPlanned && (
                        <div className="col-6 md:col-3">
                            {intl.formatMessage({ id: 'exercise.properties.completedNotAsPlanned' })}: {exercise.completedNotAsPlanned}
                        </div>
                    )}
                    {exercise.rpe && (
                        <div className="col-6 md:col-3">{workoutPlan.assignedRpe}: {exercise.rpe}</div>
                    )}
                    {exercise.comments && (
                        <div className="col-6 md:col-3">{intl.formatMessage({ id: 'exercise.properties.comments' })}: {exercise.comments}</div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="workout-plan-detail p-4">
            <Toast ref={toast} />
            <Card title={isTemplate ? workoutPlan.workoutTemplate.planName : workoutPlan.instanceName ? workoutPlan.instanceName : workoutPlan.workout.planName} className="mb-4">
                <div className="flex justify-content-between">
                    {user.userType === 'coach' && (
                        <div className="flex gap-2">
                           {workoutPlan.status === 'pending' && (
                                <Button
                                    label={intl.formatMessage({ id: 'common.edit' })}
                                    icon="pi pi-pencil"
                                    className="p-button-primary"
                                    onClick={handleEdit}
                                />
                            )}
                            {workoutPlan.status === 'pending' && (
                                <Button
                                    label={intl.formatMessage({ id: 'common.delete' })}
                                    icon="pi pi-trash"
                                    className="p-button-danger"
                                    onClick={handleDelete}
                                />
                            )}
                            <Button
                                label={intl.formatMessage({ id: 'common.template' })}
                                tooltip={intl.formatMessage({ id: 'common.useAsTemplate' })}
                                icon="pi pi-copy" 
                                className="p-button-secondary"
                                onClick={() => navigate(`/plans/edit/${workoutPlan.id}`, {
                                    state: { isEdit: true, changeToTemplate: true }
                                })}
                            />
                        </div>
                    )}
                    {user.userType === 'client' && workoutPlan.status === 'pending' && (
                        <Button
                            label="Start Workout"
                            icon="pi pi-play"
                            className="p-button-success"
                            onClick={handleStartWorkout}
                        />
                    )}
                </div>
                {!isTemplate && (
                    <p>
                        <strong>{intl.formatMessage({ id: 'common.status' })}:</strong> {workoutPlan.status}
                        {workoutPlan.status === 'completed' && (
                            <>
                                <p className="">{intl.formatMessage({ id: 'common.completedOn' })}: {formatDate(workoutPlan.realEndDate)}</p>
                                <p className="">{intl.formatMessage({ id: 'common.sessionTime' })}: {workoutPlan.sessionTime}</p>
                                <p className="">{intl.formatMessage({ id: 'common.feedback' })}: {workoutPlan.generalFeedback}</p>
                                <p className="">{intl.formatMessage({ id: 'common.mood' })}: {workoutPlan.mood ? `${workoutPlan.mood}/10` : '-'}</p>
                                <p className="">{intl.formatMessage({ id: 'common.energyLevel' })}: {workoutPlan.energyLevel ? `${workoutPlan.energyLevel}/10` : '-'}</p>
                                <p className="">{intl.formatMessage({ id: 'common.perceivedDifficulty' })}: {workoutPlan.perceivedDifficulty ? `${workoutPlan.perceivedDifficulty}/10` : '-'}</p>
                                <p className="">{intl.formatMessage({ id: 'common.extraNotes' })}: {workoutPlan.feedback}</p>
                            </>
                        )}

                    </p>
                )}
            </Card>

            <Accordion>
                {workoutPlan.groups.map((group) => {
                    const allExercisesCompleted = group.exercises.every(exercise => exercise.completed);
                    return(
                    <AccordionTab key={group.groupNumber}header={
                    <>
                          {group.name ? group.name : `${intl.formatMessage({ id: 'common.group' })} ${group.groupNumber}`}
                          {!workoutPlan.isTemplate && workoutPlan.status === 'completed' &&
                            <Badge
                                value={allExercisesCompleted ? '✔' : '✘'}
                                className="ml-2"
                                severity={allExercisesCompleted ? 'success' : 'danger'}
                            />
                          }
                        </>
                      }>
                        {/* <p>Sets: {group.set}</p> */}
                        {/* <p>Rest between sets: {group.rest} sec</p> */}
                        {/* {group.name && <p>Group name: {group.name}</p>} */}
                        {group.isRestPeriod && (
                            <p>{intl.formatMessage({ id: 'plan.group.restPeriod' })}: {group.restDuration} {propertyUnits?.restInterval ? `${propertyUnits?.restInterval}` : ''}</p>
                        )}
                        {group.exercises.map((exercise) =>
                            workoutPlan.status === 'completed'
                                ? renderExerciseDetailsWithFeedback(exercise, group)
                                : renderExerciseDetails(exercise, group)
                        )}
                    </AccordionTab>
                )})}
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
                    src={selectedVideo}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Exercise Video"
                ></iframe>
            </Dialog>
        </div>
    );
}
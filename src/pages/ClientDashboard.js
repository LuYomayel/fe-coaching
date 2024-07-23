import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { Chart } from 'primereact/chart';
import '../styles/ClientDashboard.css';
import { Dropdown } from 'primereact/dropdown';
import { formatDate, updateStatus } from '../utils/UtilFunctions';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { Accordion, AccordionTab } from 'primereact/accordion';
const apiUrl = process.env.REACT_APP_API_URL;

const ClientDashboard = () => {
    const { clientId } = useParams();
    const showToast = useToast();
    const { setLoading } = useSpinner();
    const [workouts, setWorkouts] = useState([]);
    const [adherenceData, setAdherenceData] = useState(null);
    const [keyExercisesData, setKeyExercisesData] = useState(null);
    const [intensityDistributionData, setIntensityDistributionData] = useState(null);
    const [rpeFeedbackData, setRpeFeedbackData] = useState(null);
    // const [bodyProgressData, setBodyProgressData] = useState(null); // Uncomment and process when data is available
    // const [sessionConsistencyData, setSessionConsistencyData] = useState(null); // Uncomment and process when data is available
    const [trainingCyclesData, setTrainingCyclesData] = useState(null);
    const [goalsData, setGoalsData] = useState(null);

    const [selectedExercise, setSelectedExercise] = useState(null);
    const [exerciseOptions, setExerciseOptions] = useState([]);
    const [chartData, setChartData] = useState(null);
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [workoutOptions, setWorkoutOptions] = useState([]);
    const [filteredWorkouts, setFilteredWorkouts] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiUrl}/workout/clientId/${clientId}`)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          console.log(errorData);
          throw new Error(errorData.message || 'Something went wrong');
        }
        const data = await response.json();
        console.log(data)
        setWorkouts(data);
        setAdherenceData(processDataForAdherenceChart(data));
        // setKeyExercisesData(processDataForKeyExercisesChart(data, 'Push-up')); // Example for 'Push-up'
        // setIntensityDistributionData(processDataForIntensityDistributionChart(data));
        // setRpeFeedbackData(processDataForRpeFeedbackChart(data));
        // setTrainingCyclesData(processDataForTrainingCyclesChart(data));
        // setGoalsData(processDataForGoalsChart(data.goals)); // Assuming goals are part of the response
        const exercises = [...new Map(data.flatMap(workout => 
            workout.groups.flatMap(group => 
              group.exercises.map(ex => [ex.exercise.id, { id: ex.exercise.id, name: ex.exercise.name }])
            )
            ).map(entry => [entry[0], entry[1]]))].map(entry => entry[1]);
  
            const formattedExercises = exercises.map(ex => ({ label: ex.name, value: ex.id }));
        setExerciseOptions(formattedExercises);
        const uniqueWorkouts = [...new Map(data.map(workout => [workout.workout.id, workout.workout])).values()];
        
        setWorkoutOptions(uniqueWorkouts.map(workout => ({ label: workout.planName, value: workout.id })));
        console.log(uniqueWorkouts)
        console.log(uniqueWorkouts.map(workout => ({ label: workout.planName, value: workout.id })))
        // setExerciseOptions(exercises);
      })
      .catch(error => showToast('error', 'Error fetching feedback', `${error.message}`))
      .finally(() => setLoading(false));
  }, [clientId, showToast, setLoading]);

  useEffect(() => {
    if (selectedExercise) {
        const extractNumber = (str) => {
            if (!str) return 0;
            const num = str.match(/\d+(\.\d+)?/); // Extrae el número, incluyendo decimales si los hay
            return num ? parseFloat(num[0]) : 0;
        };
            
        const filteredWorkouts = workouts.flatMap(workout =>
            workout.groups.flatMap(group =>
                group.exercises.filter(ex => ex.exercise.id === selectedExercise).map(ex => ({
                date: workout.realEndDate,
                expectedReps: extractNumber(ex.repetitions) || 0,
                rpe: extractNumber(ex.rpe) || 0,
                sets: ex.setLogs.map(set => ({
                    completedReps: extractNumber(set.repetitions) || 0,
                    weight: extractNumber(set.weight) || 0,
                    rpe: extractNumber(set.rpe) || 0,
                    time: extractNumber(set.time) || 0,
                    distance: extractNumber(set.distance) || 0,
                    tempo: set.tempo || '',
                    notes: set.notes || '',
                    difficulty: set.difficulty || '',
                    duration: extractNumber(set.duration) || 0,
                    restInterval: extractNumber(set.restInterval) || 0
                }))
                }))
            )
            ).filter(workout => workout.date);// Filtramos solo los workouts con fecha
    
            const processedData = filteredWorkouts.map(fw => {
            const totalReps = fw.sets.reduce((sum, set) => sum + set.completedReps, 0);
            const totalWeight = fw.sets.reduce((sum, set) => sum + set.weight, 0);
            const averageReps = fw.sets.length ? (totalReps / fw.sets.length) : 0;
            const averageWeight = fw.sets.length ? (totalWeight / fw.sets.length) : 0;
                
          
            return {
                date: new Date(fw.date).toLocaleDateString(),
                expectedReps: fw.expectedReps,
                averageReps,
                averageWeight,
                rpe: fw.rpe
            };
        });
  
        const dates = processedData.map(pd => pd.date);
        const expectedRepsData = processedData.map(pd => pd.expectedReps);
        const completedRepsData = processedData.map(pd => pd.averageReps);
        const weightData = processedData.map(pd => pd.averageWeight);
        const rpeData = processedData.map(pd => pd.rpe);
  
        setChartData({
            labels: dates,
            datasets: [
            {
                label: 'Expected Repetitions',
                data: expectedRepsData,
                borderColor: 'blue',
                fill: false,
                yAxisID: 'y-axis-1',
            },
            {
                label: 'Completed Repetitions',
                data: completedRepsData,
                borderColor: 'green',
                fill: false,
                yAxisID: 'y-axis-1',
            },
            {
                label: 'Average Weight (kg)',
                data: weightData,
                borderColor: 'red',
                fill: false,
                yAxisID: 'y-axis-1',
            },
            {
                label: 'Average RPE',
                data: rpeData,
                borderColor: 'purple',
                fill: false,
                yAxisID: 'y-axis-2',
            },
            ],
        });
    }
  }, [selectedExercise, workouts]);

  useEffect(() => {
    if (selectedWorkout) {
      const filteredWorkouts = workouts.filter(workout => workout.workout.id === selectedWorkout && workout.status === 'completed');
      setFilteredWorkouts(filteredWorkouts);
    }
  }, [selectedWorkout, workouts]);

  const renderSets = (rowData) => {
    return (
      <Accordion multiple>
        {rowData.groups.flatMap(group =>
          group.exercises.map(exercise => (
            <AccordionTab key={exercise.id} header={exercise.exercise.name}>
              {exercise.setLogs.length > 0 ? (
                exercise.setLogs.map((setLog, index) => (
                  <div key={setLog.id} className="set-details">
                    <div className="grid">
                      <div className="col">
                        <p><strong>Expected Set {index + 1}</strong></p>
                        {exercise.repetitions && <p>Repetitions: {exercise.repetitions}</p>}
                        {exercise.weight && <p>Weight: {exercise.weight}</p>}
                        {exercise.time && <p>Time: {exercise.time}</p>}
                        {exercise.distance && <p>Distance: {exercise.distance}</p>}
                        {exercise.tempo && <p>Tempo: {exercise.tempo}</p>}
                        {exercise.notes && <p>Notes: {exercise.notes}</p>}
                        {exercise.difficulty && <p>Difficulty: {exercise.difficulty}</p>}
                        {exercise.duration && <p>Duration: {exercise.duration}</p>}
                        {exercise.restInterval && <p>Rest Interval: {exercise.restInterval}</p>}
                      </div>
                      <div className="col">
                        <p><strong>Completed Set {setLog.setNumber}</strong></p>
                        {setLog.repetitions && <p>Repetitions: {setLog.repetitions}</p>}
                        {setLog.weight && <p>Weight: {setLog.weight}</p>}
                        {setLog.time && <p>Time: {setLog.time}</p>}
                        {setLog.distance && <p>Distance: {setLog.distance}</p>}
                        {setLog.tempo && <p>Tempo: {setLog.tempo}</p>}
                        {setLog.notes && <p>Notes: {setLog.notes}</p>}
                        {setLog.difficulty && <p>Difficulty: {setLog.difficulty}</p>}
                        {setLog.duration && <p>Duration: {setLog.duration}</p>}
                        {setLog.restInterval && <p>Rest Interval: {setLog.restInterval}</p>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="set-details">
                  <div className="grid">
                    <div className="col">
                      <p><strong>Expected Set</strong></p>
                      {exercise.repetitions && <p>Repetitions: {exercise.repetitions}</p>}
                      {exercise.weight && <p>Weight: {exercise.weight}</p>}
                      {exercise.time && <p>Time: {exercise.time}</p>}
                      {exercise.distance && <p>Distance: {exercise.distance}</p>}
                      {exercise.tempo && <p>Tempo: {exercise.tempo}</p>}
                      {exercise.notes && <p>Notes: {exercise.notes}</p>}
                      {exercise.difficulty && <p>Difficulty: {exercise.difficulty}</p>}
                      {exercise.duration && <p>Duration: {exercise.duration}</p>}
                      {exercise.restInterval && <p>Rest Interval: {exercise.restInterval}</p>}
                    </div>
                    <div className="col">
                      <p><strong>Completed Set</strong></p>
                      <p>No logs available</p>
                    </div>
                  </div>
                </div>
              )}
            </AccordionTab>
          ))
        )}
      </Accordion>
    );
  };

  // Aquí puedes procesar los datos y crear gráficos usando Chart.js o PrimeReact Chart

  const processDataForAdherenceChart = (workouts) => {
    const plannedWorkouts = workouts.length;
    const workoutsUpdated = updateStatus(workouts);
    const completedWorkouts = workoutsUpdated.filter(workout => workout.status === 'completed').length;
    const expiredWorkouts = workoutsUpdated.filter(workout => workout.status === 'expired').length;
  
    return {
      labels: ['Planned', 'Completed', 'Expired'],
      datasets: [
        {
          label: 'Workouts',
          backgroundColor: ['#42A5F5', '#66BB6A', 'red'],
          data: [plannedWorkouts, completedWorkouts, expiredWorkouts]
        }
      ]
    };
  };
  
  const options = {
    scales: {
      'y-axis-1': {
        type: 'linear',
        position: 'left',
      },
      'y-axis-2': {
        type: 'linear',
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          min: 0,
          max: 5, // Ajustar según el rango esperado de RPE
        },
      },
    },
  };

  const AdherenceChart = ({ data }) => (
    <div className="chart-container">
      <h3>Adherence to Plan</h3>
      <Chart type="bar" data={data} />
    </div>
  );

  const processDataForKeyExercisesChart = (workouts, exerciseName) => {
    const exerciseData = workouts.reduce((acc, workout) => {
      workout.groups.forEach(group => {
        group.exercises.forEach(ex => {
          if (ex.exercise.name === exerciseName) {
            acc.push({
              date: new Date(workout.realEndDate).toLocaleDateString(),
              rpe: ex.rpe ? parseInt(ex.rpe) : null
            });
          }
        });
      });
      return acc;
    }, []);
  
    const dates = exerciseData.map(data => data.date);
    const rpeValues = exerciseData.map(data => data.rpe);
    console.log(dates, rpeValues)
    return {
      labels: dates,
      datasets: [
        {
          label: `${exerciseName} RPE`,
          data: rpeValues,
          fill: false,
          borderColor: '#42A5F5',
          tension: 0.4
        }
      ]
    };
  };
  
  const KeyExercisesChart = ({ data }) => (
    <div className="chart-container">
      <h3>Key Exercises Progress</h3>
      <Chart type="line" data={data} />
    </div>
  );

  const processDataForIntensityDistributionChart = (workouts) => {
    const intensityData = workouts.reduce((acc, workout) => {
      workout.groups.forEach(group => {
        group.exercises.forEach(ex => {
          if (ex.rpe) {
            acc[ex.rpe] = (acc[ex.rpe] || 0) + 1;
          }
        });
      });
      return acc;
    }, {});
  
    const rpeLevels = Object.keys(intensityData);
    const rpeCounts = Object.values(intensityData);
  
    return {
      labels: rpeLevels,
      datasets: [
        {
          label: 'Intensity Distribution',
          backgroundColor: '#FF6384',
          data: rpeCounts
        }
      ]
    };
  };
  
  const IntensityDistributionChart = ({ data }) => (
    <div className="chart-container">
      <h3>Intensity Distribution</h3>
      <Chart type="bar" data={data} />
    </div>
  );

  const processDataForRpeFeedbackChart = (workouts) => {
    const feedbackData = workouts.map(workout => ({
      date: new Date(workout.realEndDate).toLocaleDateString(),
      rpe: workout.perceivedDifficulty,
      feedback: workout.generalFeedback
    }));
  
    const dates = feedbackData.map(data => data.date);
    const rpeValues = feedbackData.map(data => data.rpe);
    const feedbackValues = feedbackData.map(data => data.feedback.length);
  
    return {
      labels: dates,
      datasets: [
        {
          label: 'RPE',
          data: rpeValues,
          fill: false,
          borderColor: '#42A5F5',
          tension: 0.4
        },
        {
          label: 'Feedback Length',
          data: feedbackValues,
          fill: false,
          borderColor: '#66BB6A',
          tension: 0.4
        }
      ]
    };
  };
  
  const RpeFeedbackChart = ({ data }) => (
    <div className="chart-container">
      <h3>RPE and Client Feedback</h3>
      <Chart type="line" data={data} />
    </div>
  );

  const processDataForTrainingCyclesChart = (workouts) => {
    // Assuming each workout has a 'cycle' property indicating the training cycle
    const cycles = [...new Set(workouts.map(workout => workout.cycle))];
    const cycleData = cycles.map(cycle => {
      const cycleWorkouts = workouts.filter(workout => workout.cycle === cycle);
      const avgRpe = cycleWorkouts.reduce((sum, workout) => sum + workout.perceivedDifficulty, 0) / cycleWorkouts.length;
  
      return {
        cycle,
        avgRpe
      };
    });
  
    const labels = cycleData.map(data => `Cycle ${data.cycle}`);
    const rpeValues = cycleData.map(data => data.avgRpe);
  
    return {
      labels,
      datasets: [
        {
          label: 'Average RPE',
          backgroundColor: '#42A5F5',
          data: rpeValues
        }
      ]
    };
  };
  
  const TrainingCyclesChart = ({ data }) => (
    <div className="chart-container">
      <h3>Training Cycle Progress</h3>
      <Chart type="bar" data={data} />
    </div>
  );

  return (
    <div className="grid grid-nogutter">
      <div className="col-12 mx-auto">
        <h1 className="panel-header">Client Dashboard</h1>
        <TabView className='mx-auto'>
            <TabPanel header="Workout Details" >
                <div className="grid">
                    <div className="col-12">
                        <Dropdown value={selectedWorkout} options={workoutOptions} onChange={(e) => setSelectedWorkout(e.value)} placeholder="Select a Workout" />
                        <DataTable value={filteredWorkouts}>
                            <Column body={(row) => formatDate(row.realEndDate)} header="Trained Date" style={{ width: '10%' }} />
                            <Column field="workout.planName" header="Workout Name" style={{ width: '20%' }}/>
                            <Column header="Details" body={renderSets} />
                        </DataTable>
                    </div>
                </div>  
          </TabPanel>
          <TabPanel header="Exercise Progress">
            <div className="grid">
              <div className="col-12 md:col-6 lg:col-6">
                <Dropdown value={selectedExercise} options={exerciseOptions} filter filterBy='label' onChange={(e) => setSelectedExercise(e.value)} placeholder="Select an Exercise" />
                {chartData && <Chart type="line" data={chartData} options={options} />}
              </div>
              <div className="col-12 md:col-6 lg:col-6">
                {adherenceData && <Chart type="bar" data={adherenceData} />}
              </div>
            </div>
          </TabPanel>
          
        </TabView>
      </div>
    </div>
  );
};

export default ClientDashboard;
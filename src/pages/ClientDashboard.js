import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { Chart } from 'primereact/chart';
import '../styles/ClientDashboard.css';
import { Dropdown } from 'primereact/dropdown';
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
        // setAdherenceData(processDataForAdherenceChart(data));
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
        console.log(formattedExercises)
        // setExerciseOptions(exercises);
      })
      .catch(error => showToast('error', 'Error fetching feedback', `${error.message}`))
      .finally(() => setLoading(false));
  }, [clientId, showToast, setLoading]);

  useEffect(() => {
    if (selectedExercise) {
        const filteredWorkouts = workouts.flatMap(workout =>
            workout.groups.flatMap(group =>
              group.exercises.filter(ex => ex.exercise.id === selectedExercise).map(ex => ({
                date: workout.realEndDate,
                expectedReps: ex.repetitions,
                sets: ex.setLogs.map(set => ({
                  completedReps: set.repetitions,
                  weight: set.weight,
                }))
              }))
            )
          );
    
          const dates = filteredWorkouts.map(fw => fw.date);
          const expectedRepsData = filteredWorkouts.map(fw => parseInt(fw.expectedReps));
          const completedRepsData = filteredWorkouts.flatMap(fw => fw.sets.map(set => parseInt(set.completedReps)));
          const weightData = filteredWorkouts.flatMap(fw => fw.sets.map(set => parseFloat(set.weight)));
      console.log(filteredWorkouts, dates)
      setChartData({
        labels: dates,
        datasets: [
          {
            label: 'Expected Repetitions',
            data: expectedRepsData,
            borderColor: 'blue',
            fill: false,
          },
          {
            label: 'Completed Repetitions',
            data: completedRepsData,
            borderColor: 'green',
            fill: false,
          },
          {
            label: 'Weight',
            data: weightData,
            borderColor: 'red',
            fill: false,
          },
        ],
      });
    }
  }, [selectedExercise, workouts]);

  // Aquí puedes procesar los datos y crear gráficos usando Chart.js o PrimeReact Chart

  const processDataForAdherenceChart = (workouts) => {
    const plannedWorkouts = workouts.length;
    const completedWorkouts = workouts.filter(workout => workout.status === 'completed').length;
  
    return {
      labels: ['Planned', 'Completed'],
      datasets: [
        {
          label: 'Workouts',
          backgroundColor: ['#42A5F5', '#66BB6A'],
          data: [plannedWorkouts, completedWorkouts]
        }
      ]
    };
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
    <div>
      <h1>Client Dashboard</h1>
      <Dropdown value={selectedExercise} options={exerciseOptions} onChange={(e) => setSelectedExercise(e.value)} placeholder="Select an Exercise" />
      <div className="charts-grid">
        {chartData && <Chart type="line" data={chartData} />}
        {/* {adherenceData && <AdherenceChart data={adherenceData} />}
        {keyExercisesData && <KeyExercisesChart data={keyExercisesData} />}
        {intensityDistributionData && <IntensityDistributionChart data={intensityDistributionData} />}
        {rpeFeedbackData && <RpeFeedbackChart data={rpeFeedbackData} />} */}
        {/* Uncomment these lines and process the data when available */}
        {/* {bodyProgressData && <BodyProgressChart data={bodyProgressData} />} */}
        {/* {sessionConsistencyData && <SessionConsistencyChart data={sessionConsistencyData} />} */}
        {/* {trainingCyclesData && <TrainingCyclesChart data={trainingCyclesData} />} */}
        {/* {goalsData && <GoalsChart data={goalsData} />} */}
      </div>
    </div>
  );
};

export default ClientDashboard;
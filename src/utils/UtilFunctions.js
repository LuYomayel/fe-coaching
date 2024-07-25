const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses son indexados desde 0
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const isValidYouTubeUrl = (url) => {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be|youtube\.com\/shorts)\/.+$/;
  return regex.test(url);
};

const extractYouTubeVideoId = (url) => {
  let videoId = '';
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1].split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('.be/')[1].split('&')[0];
  } else if (url.includes('youtube.com/shorts/')) {
    videoId = url.split('/shorts/')[1].split('?')[0];
  }
  return videoId;
};

const getYouTubeThumbnail = (url) => {
  const videoId = extractYouTubeVideoId(url);
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

const sortBySessionDate = (workouts) => {
  return workouts.sort((a, b) => {
    const dateA = new Date(a.trainingSession.sessionDate);
    const dateB = new Date(b.trainingSession.sessionDate);
    return dateA - dateB;
  });
}

function updateStatus(workouts) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  workouts.forEach(workout => {
    const sessionDate = new Date(workout.trainingSession.sessionDate);
    const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

    if (workout.status === 'pending') {
      if (sessionDay < today) {
        workout.status = 'expired';
      } else if (sessionDay.getTime() === today.getTime()) {
        workout.status = 'current';
      }
    }
  });

  return workouts;
}

const getSeverity = (status) => {
  switch (status) {
      case 'expired':
          return 'danger';

      case 'completed':
          return 'success';

      case 'current':
          return 'info';

      case 'pending':
          return 'warning';

      case 'renewal':
          return null;
  }
};

const validateDates = (startDate, endDate) => {
  if (!startDate) {
    return { isValid: false, message: 'Please select a Start date' };
  }
  if (!endDate) {
    return { isValid: false, message: 'Please select an End date' };
  }
  if (new Date(startDate) > new Date(endDate)) {
    return { isValid: false, message: 'Start date cannot be later than End date' };
  }
  return { isValid: true, message: '' };
};

// utils.js
const validateStudentDetails = ({ name, email, fitnessGoal, activityLevel, birthdate, gender, height, weight }) => {
  if (!name) return { isValid: false, message: 'Name is required' };
  if (!email) return { isValid: false, message: 'Email is required' };
  if (!fitnessGoal || fitnessGoal.length === 0) return { isValid: false, message: 'Fitness Goal is required' };
  if (!activityLevel) return { isValid: false, message: 'Activity Level is required' };
  if (!birthdate) return { isValid: false, message: 'Birthdate is required' };
  
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 10);

  if (new Date(birthdate) > today) return { isValid: false, message: 'Birthdate cannot be in the future' };
  if (new Date(birthdate) > minDate) return { isValid: false, message: 'Age must be at least 10 years' };

  if (!gender) return { isValid: false, message: 'Gender is required' };
  if (height < 100 || height > 250) return { isValid: false, message: 'Height must be between 100 cm and 250 cm' };
  if (weight < 30 || weight > 300) return { isValid: false, message: 'Weight must be between 30 kg and 300 kg' };
  
  return { isValid: true, message: '' };
};

export { formatDate, isValidYouTubeUrl, extractYouTubeVideoId, sortBySessionDate, updateStatus, getSeverity, validateDates, validateStudentDetails, getYouTubeThumbnail }
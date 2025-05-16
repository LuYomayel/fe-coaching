const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses son indexados desde 0
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateToApi = (date) => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};
const isValidYouTubeUrl = (url) => {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/(watch\?v=|embed\/|shorts\/|v\/|.+)?$/;
  return regex.test(url);
};

const extractYouTubeVideoId = (url) => {
  let videoId = '';
  if (!url) return null;
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('.be/')[1]?.split('?')[0];
  } else if (url.includes('youtube.com/shorts/')) {
    videoId = url.split('/shorts/')[1]?.split('?')[0];
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('/embed/')[1]?.split('?')[0];
  } else {
    // Otros casos posibles
    const match = url.match(/v=([^&]+)/);
    if (match) {
      videoId = match[1];
    }
  }

  return videoId || null; // Retorna null si no se encuentra un videoId
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
};

function updateStatus(workouts) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  workouts.forEach((workout) => {
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
    default:
      return null;
  }
};

const validateDates = (startDate, endDate, intl) => {
  if (!startDate) {
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.selectStartDate' })
    };
  }
  if (!endDate) {
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.selectEndDate' })
    };
  }
  if (new Date(startDate) > new Date(endDate)) {
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.startDateAfterEndDate' })
    };
  }
  return { isValid: true, message: '' };
};

// utils.js
const validateStudentDetails = (
  { name, email, fitnessGoal, activityLevel, birthdate, gender, height, weight },
  intl
) => {
  if (!name)
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.nameRequired' })
    };
  if (!email)
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.emailRequired' })
    };
  if (!fitnessGoal || fitnessGoal.length === 0)
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.fitnessGoalRequired' })
    };
  if (!activityLevel)
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.activityLevelRequired' })
    };
  if (!birthdate)
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.birthdateRequired' })
    };

  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 10);

  if (new Date(birthdate) > today)
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.birthdateInFuture' })
    };
  if (new Date(birthdate) > minDate)
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.ageRequirement' })
    };

  if (!gender)
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.genderRequired' })
    };
  if (height < 100 || height > 250)
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.heightRange' })
    };
  if (weight < 30 || weight > 300)
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.weightRange' })
    };

  return { isValid: true, message: '' };
};

const getDayMonthYear = (session) => {
  const sessionDate = new Date(session.sessionDate);
  const year = sessionDate.getFullYear();
  const month = sessionDate.getMonth(); // 0-based
  const day = sessionDate.getDate();
  return new Date(year, month, day);
};

const formatRelativeDate = (date, intl) => {
  if (!date) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const inputDate = new Date(date);
  inputDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - inputDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return intl.formatMessage({ id: 'coach.home.today' });
  } else if (diffDays === 1) {
    return intl.formatMessage({ id: 'coach.home.yesterday' });
  } else {
    return intl.formatMessage({ id: 'coach.home.daysAgo' }, { days: diffDays });
  }
};

const getToken = () => {
  const token = localStorage.getItem('token');
  return token;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};

export {
  formatDate,
  formatDateToApi,
  isValidYouTubeUrl,
  extractYouTubeVideoId,
  getYouTubeThumbnail,
  sortBySessionDate,
  updateStatus,
  getSeverity,
  validateDates,
  validateStudentDetails,
  getDayMonthYear,
  formatRelativeDate,
  getToken,
  getAuthHeaders
};

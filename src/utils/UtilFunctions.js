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

export { formatDate, isValidYouTubeUrl, extractYouTubeVideoId, sortBySessionDate, updateStatus, getSeverity }
import { IntlShape } from 'react-intl';
import { EWorkoutStatus, WorkoutStatus } from 'types/enums/workout-status';

// ==================== FORMATEO DE FECHAS ====================

export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses son indexados desde 0
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateToApi = (date: Date): string => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

export const formatRelativeDate = (date: string | Date | null | undefined, intl: IntlShape): string => {
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

export const getDayMonthYear = (session: { sessionDate: string | Date }): Date => {
  const sessionDate = new Date(session.sessionDate);
  const year = sessionDate.getFullYear();
  const month = sessionDate.getMonth(); // 0-based
  const day = sessionDate.getDate();
  return new Date(year, month, day);
};

// ==================== YOUTUBE ====================

export const isValidYouTubeUrl = (url: string): boolean => {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/(watch\?v=|embed\/|shorts\/|v\/|.+)?$/;
  return regex.test(url);
};

export const extractYouTubeVideoId = (url: string | null | undefined): string | null => {
  if (!url) return null;

  let videoId = '';

  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0] || '';
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('.be/')[1]?.split('?')[0] || '';
  } else if (url.includes('youtube.com/shorts/')) {
    videoId = url.split('/shorts/')[1]?.split('?')[0] || '';
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('/embed/')[1]?.split('?')[0] || '';
  } else {
    // Otros casos posibles
    const match = url.match(/v=([^&]+)/);
    if (match?.[1]) {
      videoId = match[1];
    }
  }

  return videoId || null; // Retorna null si no se encuentra un videoId
};

export const getYouTubeThumbnail = (url: string): string => {
  const videoId = extractYouTubeVideoId(url);
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

// ==================== WORKOUTS ====================

interface WorkoutWithSession {
  status: WorkoutStatus;
  trainingSession: {
    sessionDate: string | Date;
  };
}

export const sortBySessionDate = <T extends WorkoutWithSession>(workouts: T[]): T[] => {
  return workouts.sort((a, b) => {
    const dateA = new Date(a.trainingSession.sessionDate);
    const dateB = new Date(b.trainingSession.sessionDate);
    return dateA.getTime() - dateB.getTime();
  });
};

export function updateStatus<T extends WorkoutWithSession>(workouts: T[]): T[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  workouts.forEach((workout) => {
    const sessionDate = new Date(workout.trainingSession.sessionDate);
    const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

    if (workout.status === EWorkoutStatus.PENDING) {
      if (sessionDay < today) {
        workout.status = EWorkoutStatus.EXPIRED;
      } else if (sessionDay.getTime() === today.getTime()) {
        workout.status = EWorkoutStatus.PENDING;
      }
    }
  });

  return workouts;
}

export const getSeverity = (status: WorkoutStatus | 'renewal'): 'danger' | 'success' | 'info' | 'warning' | null => {
  switch (status) {
    case EWorkoutStatus.EXPIRED:
      return 'danger';
    case EWorkoutStatus.COMPLETED:
      return 'success';
    case EWorkoutStatus.PENDING:
      return 'info';
    case EWorkoutStatus.CANCELLED:
      return 'warning';
    default:
      return null;
  }
};

// ==================== VALIDACIONES ====================

interface ValidationResult {
  isValid: boolean;
  message: string;
}

export const validateDates = (
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined,
  intl: IntlShape
): ValidationResult => {
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

interface StudentDetails {
  name: string;
  email: string;
  fitnessGoal: string[];
  activityLevel: string;
  birthdate: Date | string;
  gender: string;
  height: number;
  weight: number;
}

export const validateStudentDetails = (
  { name, email, fitnessGoal, activityLevel, birthdate, gender, height, weight }: StudentDetails,
  intl: IntlShape
): ValidationResult => {
  if (!name) {
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.nameRequired' })
    };
  }
  if (!email) {
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.emailRequired' })
    };
  }
  if (!fitnessGoal || fitnessGoal.length === 0) {
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.fitnessGoalRequired' })
    };
  }
  if (!activityLevel) {
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.activityLevelRequired' })
    };
  }
  if (!birthdate) {
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.birthdateRequired' })
    };
  }

  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 10);

  if (new Date(birthdate) > today) {
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.birthdateInFuture' })
    };
  }
  if (new Date(birthdate) > minDate) {
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.ageRequirement' })
    };
  }

  if (!gender) {
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.genderRequired' })
    };
  }
  if (height < 100 || height > 250) {
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.heightRange' })
    };
  }
  if (weight < 30 || weight > 300) {
    return {
      isValid: false,
      message: intl.formatMessage({ id: 'error.weightRange' })
    };
  }

  return { isValid: true, message: '' };
};

// ==================== AUTH ====================

export const getToken = (): string | null => {
  const token = localStorage.getItem('token');
  return token;
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};

import { z } from 'zod';

/**
 * Schema para validación de Set Configuration
 * Permite configurar sets individuales con propiedades específicas
 */
export const exerciseSetConfigurationSchema = z.object({
  setNumber: z.number().min(1, 'El número de set debe ser mayor a 0'),
  repetitions: z.string().optional(),
  sets: z.string().optional(),
  weight: z.string().optional(),
  time: z.string().optional(),
  restInterval: z.string().optional(),
  tempo: z.string().optional(),
  notes: z.string().optional(),
  difficulty: z.string().optional(),
  duration: z.string().optional(),
  distance: z.string().optional()
});

/**
 * Schema para validación de Exercise Instance Template
 * Ejercicio individual dentro de un grupo
 */
export const exerciseInstanceTemplateSchema = z.object({
  id: z.union([z.number(), z.string()]),
  exercise: z.object({
    id: z.union([z.string(), z.number()]).refine((val) => val !== '' && val !== null, {
      message: 'El ejercicio debe estar seleccionado'
    }),
    name: z.string().min(1, 'El nombre del ejercicio es requerido')
  }),
  rowIndex: z.number().optional(),
  repetitions: z.string().optional().nullable(),
  sets: z.string().optional().nullable(),
  time: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  restInterval: z.string().optional().nullable(),
  tempo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  difficulty: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  distance: z.string().optional().nullable(),
  setConfiguration: z.array(exerciseSetConfigurationSchema).optional(),
  // Campos opcionales para ejercicios completados
  completed: z.boolean().optional(),
  completedNotAsPlanned: z.boolean().optional(),
  comments: z.string().optional(),
  rpe: z.string().optional(),
  setLogs: z.array(z.any()).optional()
});

/**
 * Schema para validación de Exercise Group Template
 * Grupo de ejercicios o período de descanso
 */
export const exerciseGroupTemplateSchema = z
  .object({
    id: z.union([z.number(), z.string()]).optional(),
    groupNumber: z.number().min(1, 'El número de grupo debe ser mayor a 0'),
    name: z.string().optional(),
    set: z.number().optional().nullable(),
    rest: z.number().optional().nullable(),
    isRestPeriod: z.boolean().optional().default(false),
    restDuration: z.number().optional().nullable(),
    exercises: z.array(exerciseInstanceTemplateSchema).optional().default([])
  })
  .refine(
    (data) => {
      // Si es un período de descanso, debe tener restDuration > 0
      if (data.isRestPeriod) {
        return data.restDuration && data.restDuration > 0;
      }
      return true;
    },
    {
      message: 'El período de descanso debe tener una duración mayor a 0',
      path: ['restDuration']
    }
  )
  .refine(
    (data) => {
      // Si NO es un período de descanso, debe tener al menos un ejercicio
      if (!data.isRestPeriod) {
        return data.exercises && data.exercises.length > 0;
      }
      return true;
    },
    {
      message: 'El grupo debe tener al menos un ejercicio',
      path: ['exercises']
    }
  );

/**
 * Schema para validación de Workout Instance Template
 * Instancia completa del workout
 */
export const workoutInstanceTemplateSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  instanceName: z.string().optional(),
  personalizedNotes: z.string().optional(),
  groups: z.array(exerciseGroupTemplateSchema).min(1, 'El plan debe tener al menos un grupo'),
  // Campos para workout instance (no template)
  isTemplate: z.boolean().optional(),
  dateAssigned: z.string().optional(),
  dateCompleted: z.string().optional(),
  expectedEndDate: z.string().optional(),
  expectedStartDate: z.string().optional(),
  feedback: z.string().optional(),
  isRepeated: z.boolean().optional(),
  realEndDate: z.string().optional(),
  realStartedDate: z.string().optional(),
  repeatDays: z.array(z.any()).optional(),
  status: z.string().optional(),
  workout: z
    .object({
      id: z.union([z.string(), z.number()]).optional(),
      planName: z.string().optional(),
      coach: z
        .object({
          id: z.union([z.string(), z.number()]).optional(),
          user: z
            .object({
              id: z.union([z.string(), z.number()]).optional()
            })
            .optional()
        })
        .optional()
    })
    .optional(),
  workoutTemplate: z
    .object({
      id: z.union([z.string(), z.number()]).optional(),
      planName: z.string().min(1, 'El nombre del plan es requerido')
    })
    .optional()
});

/**
 * Schema principal para validación del Plan completo
 */
export const createPlanSchema = z
  .object({
    workout: z
      .object({
        id: z.union([z.string(), z.number()]).optional(),
        planName: z.string().optional(),
        coach: z.object({
          id: z.union([z.string(), z.number()]).optional(),
          user: z.object({
            id: z.union([z.string(), z.number()])
          })
        })
      })
      .optional(),
    workoutTemplate: z
      .object({
        id: z.union([z.string(), z.number()]).optional(),
        planName: z.string()
      })
      .optional(),
    isTemplate: z.boolean().default(true),
    instanceName: z.string().optional(),
    personalizedNotes: z.string().optional(),
    groups: z.array(exerciseGroupTemplateSchema).min(1, 'El plan debe tener al menos un grupo'),
    // Campos opcionales para workout instances
    dateAssigned: z.string().optional(),
    dateCompleted: z.string().optional(),
    expectedEndDate: z.string().optional(),
    expectedStartDate: z.string().optional(),
    feedback: z.string().optional(),
    isRepeated: z.boolean().optional(),
    realEndDate: z.string().optional(),
    realStartedDate: z.string().optional(),
    repeatDays: z.array(z.any()).optional(),
    status: z.string().optional()
  })
  .refine(
    (data) => {
      // Validar que tenga un nombre (ya sea en workout o workoutTemplate)
      if (data.isTemplate && data.workoutTemplate) {
        return data.workoutTemplate.planName && data.workoutTemplate.planName.trim().length > 0;
      }
      if (!data.isTemplate && data.workout) {
        return data.workout.planName && data.workout.planName.trim().length > 0;
      }
      return data.instanceName && data.instanceName.trim().length > 0;
    },
    {
      message: 'El plan debe tener un nombre',
      path: ['planName']
    }
  );

/**
 * Función helper para limpiar el plan antes de enviarlo al backend
 * Elimina propiedades temporales y prepara el objeto para la API
 */
export const cleanPlanForSubmit = (plan: any, userId: number) => {
  let contador = 0;

  return {
    ...plan,
    workout: {
      ...plan.workout,
      planName: plan.workoutTemplate ? plan.workoutTemplate.planName : plan.workout.planName,
      coach: {
        id: '',
        user: {
          id: userId
        }
      }
    },
    groups: plan.groups.map((group: any) => ({
      ...group,
      exercises: group.exercises.map((exercise: any) => ({
        ...exercise,
        rowIndex: contador++,
        exercise: {
          id: exercise.exercise.id,
          name: exercise.exercise.name
        }
      }))
    }))
  };
};

/**
 * Función helper para validar que todos los ejercicios tengan un ID válido
 */
export const validateExercisesHaveIds = (groups: any) => {
  for (const group of groups) {
    if (!group.isRestPeriod) {
      for (const exercise of group.exercises) {
        if (!exercise.exercise.id) {
          return {
            valid: false,
            exerciseName: exercise.exercise.name
          };
        }
      }
    }
  }
  return { valid: true };
};

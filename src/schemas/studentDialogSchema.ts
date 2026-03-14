import { z } from 'zod';

// Schema para validación del formulario de estudiante
export const studentDialogSchema = z
  .object({
    name: z.string().min(1, 'El nombre es requerido'),
    email: z.string().min(1, 'El email es requerido').email('Email inválido'),
    fitnessGoal: z.array(z.string()).optional().default([]),
    activityLevel: z.string().optional(),
    gender: z.string().optional(),
    weight: z.number().min(0, 'El peso debe ser mayor a 0').optional().nullable(),
    height: z.number().min(0, 'La altura debe ser mayor a 0').optional().nullable(),
    birthdate: z.date().optional().nullable(),
    customFitnessGoal: z.string().optional(),
    location: z.string().optional(),
    contactMethod: z.string().optional(),
    sessionMode: z.enum(['presencial', 'virtual_sincronico', 'virtual_asincronico', 'hibrido']).optional().nullable()
  })
  .refine(
    (data) => {
      // Validación condicional para tipo de entrenamiento presencial/híbrido
      if (data.sessionMode === 'presencial' || data.sessionMode === 'hibrido') {
        return data.location && data.location.trim().length > 0;
      }
      return true;
    },
    {
      message: 'La ubicación es requerida para entrenamiento presencial o híbrido',
      path: ['location']
    }
  )
  .refine(
    (data) => {
      // Validación condicional para tipo de entrenamiento virtual/híbrido
      if (data.sessionMode === 'virtual_sincronico' || data.sessionMode === 'hibrido') {
        return data.contactMethod && data.contactMethod.trim().length > 0;
      }
      return true;
    },
    {
      message: 'El método de contacto es requerido para entrenamiento virtual o híbrido',
      path: ['contactMethod']
    }
  )
  .refine(
    (data) => {
      // Validación de fecha de nacimiento
      if (data.birthdate) {
        const now = new Date();
        return data.birthdate <= now;
      }
      return true;
    },
    {
      message: 'La fecha de nacimiento no puede ser futura',
      path: ['birthdate']
    }
  );

// Función helper para procesar los objetivos de fitness
export const processFitnessGoals = (fitnessGoal: string, customFitnessGoal: string) => {
  if (!fitnessGoal) return [];

  let finalFitnessGoals = fitnessGoal.split(',');

  if (fitnessGoal.includes('other') && customFitnessGoal) {
    finalFitnessGoals = finalFitnessGoals.filter((goal) => goal !== 'other');
    finalFitnessGoals.push(customFitnessGoal);
  }

  return finalFitnessGoals;
};

// Función helper para validar edad del cliente
export const validateClientAge = (birthdate: Date) => {
  if (!birthdate) return null;

  const age = new Date().getFullYear() - birthdate.getFullYear();
  if (age >= 0 && age <= 10) {
    return {
      type: 'warning',
      message: 'Cliente muy joven detectado'
    };
  }
  return null;
};

// Inferir el tipo TypeScript del schema (solo para TypeScript)
// export type StudentDialogFormData = z.infer<typeof studentDialogSchema>;

import { z } from 'zod';

const planIdSchema = z.union([z.number(), z.string()]).transform((value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
});

export const buildCoachProfileFormSchema = (intl) => {
  const required = (id) => intl.formatMessage({ id });

  const personalInfoSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: required('coachProfileForm.validation.name') }),
    bio: z
      .string()
      .trim()
      .min(1, { message: required('coachProfileForm.validation.bio') }),
    experience: z
      .string()
      .trim()
      .min(1, { message: required('coachProfileForm.validation.experience') })
  });

  const trainingDetailsSchema = z
    .object({
      trainingTypes: z.array(z.string()).min(1, { message: required('coachProfileForm.validation.trainingType') }),
      hasGym: z.boolean(),
      gymLocation: z.string().optional().nullable()
    })
    .superRefine((data, ctx) => {
      if (data.hasGym && !data.gymLocation?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: required('coachProfileForm.validation.gymLocation'),
          path: ['gymLocation']
        });
      }
    });

  const subscriptionSchema = z
    .object({
      subscriptionType: z.enum(['freeTrial', 'paid'], {
        errorMap: () => ({ message: required('coachProfileForm.validation.subscriptionType') })
      }),
      planId: planIdSchema.nullable()
    })
    .superRefine((data, ctx) => {
      if (!data.planId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: required('coachProfileForm.validation.plan'),
          path: ['planId']
        });
      }
    });

  const fullSchema = personalInfoSchema.merge(trainingDetailsSchema).merge(subscriptionSchema);

  return {
    personalInfoSchema,
    trainingDetailsSchema,
    subscriptionSchema,
    fullSchema
  };
};

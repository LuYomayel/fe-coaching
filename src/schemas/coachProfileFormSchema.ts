import { z } from 'zod';
import { IntlShape } from 'react-intl';
const planIdSchema = z.union([z.number(), z.string()]).transform((value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
});

export const buildCoachProfileFormSchema = (intl: IntlShape) => {
  const required = (id: string) => intl.formatMessage({ id });

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
      trainingSpecialties: z
        .array(z.string())
        .min(1, { message: required('coachProfileForm.validation.trainingSpecialties') }),
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
      subscriptionType: z.enum(['freeTrial', 'paid'] as const),
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

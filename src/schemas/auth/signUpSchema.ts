import { z } from 'zod';
import { IntlShape } from 'react-intl';
export const buildSignUpSchema = (intl: IntlShape) =>
  z
    .object({
      email: z
        .string()
        .min(1, { message: intl.formatMessage({ id: 'home.signup.validation.emailRequired' }) })
        .email({ message: intl.formatMessage({ id: 'home.signup.validation.emailInvalid' }) }),
      password: z.string().min(1, { message: intl.formatMessage({ id: 'home.signup.validation.passwordRequired' }) }),
      confirmPassword: z
        .string()
        .min(1, { message: intl.formatMessage({ id: 'home.signup.validation.confirmPasswordRequired' }) }),
      userType: z.literal('coach'),
      fullName: z.string().optional()
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: intl.formatMessage({ id: 'home.signup.validation.passwordMismatch' })
    });

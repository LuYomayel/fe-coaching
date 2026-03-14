import { z } from 'zod';
import { IntlShape } from 'react-intl';
export const buildSignUpSchema = (intl: IntlShape) =>
  z
    .object({
      email: z
        .string()
        .min(1, { message: intl.formatMessage({ id: 'home.signup.validation.emailRequired' }) })
        .email({ message: intl.formatMessage({ id: 'home.signup.validation.emailInvalid' }) }),
      password: z
        .string()
        .min(1, { message: intl.formatMessage({ id: 'home.signup.validation.passwordRequired' }) })
        .min(6, { message: intl.formatMessage({ id: 'home.signup.validation.passwordTooShort' }) }),
      confirmPassword: z
        .string()
        .min(1, { message: intl.formatMessage({ id: 'home.signup.validation.confirmPasswordRequired' }) })
        .min(6, { message: intl.formatMessage({ id: 'home.signup.validation.passwordTooShort' }) }),
      userType: z.literal('coach')
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: intl.formatMessage({ id: 'home.signup.validation.passwordMismatch' })
    });

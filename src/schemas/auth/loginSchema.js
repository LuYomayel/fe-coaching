import { z } from 'zod';

export const buildLoginSchema = (intl) =>
  z.object({
    email: z
      .string()
      .min(1, { message: intl.formatMessage({ id: 'home.login.validation.emailRequired' }) })
      .email({ message: intl.formatMessage({ id: 'home.login.validation.emailInvalid' }) }),
    password: z.string().min(1, { message: intl.formatMessage({ id: 'home.login.validation.passwordRequired' }) })
  });

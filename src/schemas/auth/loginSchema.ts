import { z } from 'zod';
import { IntlShape } from 'react-intl';
export const buildLoginSchema = (intl: IntlShape) =>
  z.object({
    email: z
      .string()
      .min(1, { message: intl.formatMessage({ id: 'home.login.validation.emailRequired' }) })
      .email({ message: intl.formatMessage({ id: 'home.login.validation.emailInvalid' }) }),
    password: z.string().min(1, { message: intl.formatMessage({ id: 'home.login.validation.passwordRequired' }) })
  });

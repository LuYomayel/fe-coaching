import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';

import { useToast } from '../../contexts/ToastContext';
import { useSpinner } from '../../utils/GlobalSpinner';
import { api } from '../../services/api-client';
import { mapZodErrors } from '../../utils/mapZodErrors';
import { buildSignUpSchema } from '../../schemas/auth/signUpSchema';

const initialValues = {
  email: '',
  password: '',
  confirmPassword: '',
  userType: 'coach'
};

export const useSignUpDialog = ({
  onRequireVerification
}: {
  onRequireVerification: (email: string, password: string) => void;
}) => {
  const intl = useIntl();
  const { showToast } = useToast();
  const { loading, setLoading } = useSpinner();

  const [visible, setVisible] = useState(false);
  const [formValues, setFormValues] = useState(initialValues);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const signUpSchema = useMemo(() => buildSignUpSchema(intl), [intl]);

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  const resetForm = () => {
    setFormValues(initialValues);
    setFormErrors({ email: '', password: '', confirmPassword: '' });
  };

  const handleFieldChange =
    (field: 'email' | 'password' | 'confirmPassword') => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({
        ...prev,
        [field]: event.target.value
      }));
    };

  const setEmail = (email: string) => {
    setFormValues((prev) => ({
      ...prev,
      email: email
    }));
  };

  const validate = () => {
    const result = signUpSchema.safeParse(formValues);
    if (result.success) {
      setFormErrors({ email: '', password: '', confirmPassword: '' });
      return true;
    }
    setFormErrors(mapZodErrors(result.error, ['email', 'password', 'confirmPassword']));
    return false;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      console.log('formValues', formValues);
      const response = await api.user.registerCoach(formValues);

      const { message, error } = response || {};

      if (message !== 'success') {
        let errorMessage: string;
        if (Array.isArray(error)) {
          errorMessage = error.join('. ');
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          errorMessage = intl.formatMessage({ id: 'home.signup.error.generic' });
        }
        throw new Error(errorMessage);
      }

      if (onRequireVerification) {
        onRequireVerification(formValues.email, formValues.password);
      }
      close();
      showToast(
        'success',
        intl.formatMessage({ id: 'common.success' }),
        intl.formatMessage({ id: 'home.signup.success' })
      );
    } catch (error) {
      console.error('Signup error', error);
      showToast(
        'error',
        intl.formatMessage({ id: 'home.toast.error' }),
        (error as Error).message || intl.formatMessage({ id: 'home.signup.error.generic' })
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    visible,
    open,
    close,
    loading,
    formValues,
    formErrors,
    handleFieldChange,
    handleSubmit,
    resetForm,
    setEmail
  };
};

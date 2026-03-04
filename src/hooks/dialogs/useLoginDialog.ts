import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import { useSpinner } from '../../utils/GlobalSpinner';
import { api } from '../../services/api-client';
import { mapZodErrors } from '../../utils/mapZodErrors';
import { buildLoginSchema } from '../../schemas/auth/loginSchema';
import { JwtPayload } from '../../types/auth/auth';
import { ICoach } from '../../types/models';
const initialValues = {
  email: '',
  password: ''
};

export const useLoginDialog = ({
  onRequireVerification
}: {
  onRequireVerification: (email: string, password: string) => void;
}) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setUser, setClient, setCoach } = useUser();
  const { loading, setLoading } = useSpinner();

  const [visible, setVisible] = useState(false);
  const [formValues, setFormValues] = useState(initialValues);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({ email: '', password: '' });

  const loginSchema = useMemo(() => buildLoginSchema(intl), [intl]);

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  const setEmail = (email: string) => {
    setFormValues((prev) => ({
      ...prev,
      email: email
    }));
  };

  const performLogin = useCallback(
    async (credentials: { email: string; password: string }) => {
      setLoading(true);
      try {
        const { data: loginData, error } = await api.auth.login(credentials);

        if (error) {
          throw new Error(error);
        }

        if (!loginData?.access_token) {
          throw new Error(intl.formatMessage({ id: 'home.login.error.generic' }));
        }

        localStorage.setItem('token', loginData.access_token);
        const decodedToken = jwtDecode<JwtPayload>(loginData.access_token);
        setUser({
          id: decodedToken.userId,
          userId: decodedToken.userId,
          email: decodedToken.email,
          name: '',
          userType: decodedToken.userType,
          verified: decodedToken.isVerified
        });

        if (!decodedToken.isVerified) {
          if (onRequireVerification) {
            onRequireVerification(credentials.email, credentials.password);
          }
          close();
          showToast(
            'error',
            intl.formatMessage({ id: 'common.error' }),
            intl.formatMessage({ id: 'home.error.verifyEmail' })
          );
          return { requiresVerification: true };
        }

        if (decodedToken.userType === 'coach') {
          const { data } = await api.user.fetchCoach(decodedToken.userId);

          if (!data) {
            setCoach(null as unknown as ICoach);
            navigate('/complete-coach-profile');
          } else {
            setCoach(data);
            navigate('/coach');
          }
        } else if (decodedToken.userType === 'client') {
          const { data } = await api.user.fetchClient(decodedToken.userId);
          setClient(data);
          navigate('/student');
        }

        return { success: true };
      } catch (error) {
        console.error('Login error', error);
        showToast(
          'error',
          intl.formatMessage({ id: 'home.toast.error' }),
          (error as Error).message || intl.formatMessage({ id: 'home.login.error.generic' })
        );
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [close, intl, navigate, onRequireVerification, setClient, setCoach, setUser, setLoading, showToast]
  );

  const resetForm = () => {
    setFormValues(initialValues);
    setFormErrors({ email: '', password: '' });
  };

  const handleFieldChange = (field: 'email' | 'password') => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const validate = () => {
    const result = loginSchema.safeParse(formValues);
    if (result.success) {
      setFormErrors({ email: '', password: '' });
      return true;
    }
    setFormErrors(mapZodErrors(result.error, ['email', 'password']));
    return false;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    await performLogin(formValues);
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
    loginWithCredentials: performLogin,
    setEmail
  };
};

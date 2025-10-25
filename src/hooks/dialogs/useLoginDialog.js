import { useCallback, useContext, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

import { UserContext } from '../../utils/UserContext';
import { useToast } from '../../utils/ToastContext';
import { useSpinner } from '../../utils/GlobalSpinner';
import { fetchClient, fetchCoach, login } from '../../services/usersService';
import { mapZodErrors } from '../../utils/mapZodErrors';
import { buildLoginSchema } from '../../schemas/auth/loginSchema';

const initialValues = {
  email: '',
  password: ''
};

export const useLoginDialog = ({ onRequireVerification } = {}) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const showToast = useToast();
  const { setUser, setClient, setCoach } = useContext(UserContext);
  const { loading, setLoading } = useSpinner();

  const [visible, setVisible] = useState(false);
  const [formValues, setFormValues] = useState(initialValues);
  const [formErrors, setFormErrors] = useState(mapZodErrors(null, ['email', 'password']));

  const loginSchema = useMemo(() => buildLoginSchema(intl), [intl]);

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  const performLogin = useCallback(
    async (credentials) => {
      setLoading(true);
      try {
        const { data: loginData, error } = await login(credentials);

        if (error) {
          throw new Error(error);
        }

        if (!loginData?.access_token) {
          throw new Error(intl.formatMessage({ id: 'home.login.error.generic' }));
        }

        localStorage.setItem('token', loginData.access_token);
        const decodedToken = jwtDecode(loginData.access_token);
        setUser(decodedToken);

        if (!decodedToken.isVerified) {
          if (onRequireVerification) {
            onRequireVerification(credentials.email);
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
          const { data } = await fetchCoach(decodedToken.userId);

          if (!data) {
            setCoach(null);
            navigate('/complete-coach-profile');
          } else {
            setCoach(data);
            navigate('/coach');
          }
        } else if (decodedToken.userType === 'client') {
          const { data } = await fetchClient(decodedToken.userId);
          setClient(data);
          navigate('/student');
        }

        return { success: true };
      } catch (error) {
        console.error('Login error', error);
        showToast(
          'error',
          intl.formatMessage({ id: 'home.toast.error' }),
          error?.message || intl.formatMessage({ id: 'home.login.error.generic' })
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [close, intl, navigate, onRequireVerification, setClient, setCoach, setUser, setLoading, showToast]
  );

  const resetForm = () => {
    setFormValues(initialValues);
    setFormErrors(mapZodErrors(null, ['email', 'password']));
  };

  const handleFieldChange = (field) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const validate = () => {
    const result = loginSchema.safeParse(formValues);
    if (result.success) {
      setFormErrors(mapZodErrors(null, ['email', 'password']));
      return true;
    }
    setFormErrors(mapZodErrors(result.error, ['email', 'password']));
    return false;
  };

  const handleSubmit = async (event) => {
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
    loginWithCredentials: performLogin
  };
};

import { useContext, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';

export const useHomePage = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const showToast = useToast();
  const { setUser } = useContext(UserContext);

  const [isScrolled, setIsScrolled] = useState(false);
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      if (!decodedToken.isVerified) {
        showToast(
          'error',
          intl.formatMessage({ id: 'common.error' }),
          intl.formatMessage({ id: 'home.error.verifyEmail' })
        );
        return;
      }

      setUser(decodedToken);
      if (decodedToken.userType === 'client') {
        navigate('/student');
      } else {
        navigate('/coach');
      }
    } catch (error) {
      localStorage.removeItem('token');
      console.error('Invalid token detected', error);
    }
  }, [intl, navigate, setUser, showToast]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionRef) => {
    if (sectionRef?.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return {
    isScrolled,
    featuresRef,
    pricingRef,
    contactRef,
    scrollToSection
  };
};

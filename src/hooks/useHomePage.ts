import { RefObject, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

import { useToast } from '../contexts/ToastContext';
import { useUser } from 'contexts/UserContext';
import { JwtPayload } from 'types/auth/auth';

export const useHomePage = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setUser } = useUser();

  const [isScrolled, setIsScrolled] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      const decodedToken: JwtPayload = jwtDecode(token);
      if (!decodedToken.isVerified) {
        showToast(
          'error',
          intl.formatMessage({ id: 'common.error' }),
          intl.formatMessage({ id: 'home.error.verifyEmail' })
        );
        return;
      }

      setUser({
        id: decodedToken.userId,
        userId: decodedToken.userId,
        email: decodedToken.email,
        name: '',
        userType: decodedToken.userType,
        verified: decodedToken.isVerified
      });
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

  const scrollToSection = (sectionRef: RefObject<HTMLDivElement | null>) => {
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

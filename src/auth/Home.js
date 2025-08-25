import React, { useRef, useContext, useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { classNames } from 'primereact/utils';

import { useNavigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { jwtDecode } from 'jwt-decode';
import { fetchClient, fetchCoach, registerCoach, login } from '../services/usersService';
import { useIntl, FormattedMessage } from 'react-intl';
import VerificationCodeDialog from '../dialogs/VerificationCodeDialog';

import Header from '../components/home/header';
import Footer from '../components/home/footer';
import Hero from '../components/home/hero';
import Features from '../components/home/features';
import Subscriptions from '../components/home/subscriptions';
import './Home.css';

export default function HomePage() {
  const intl = useIntl();
  const [loginVisible, setLoginVisible] = useState(false);
  const [signUpVisible, setSignUpVisible] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'coach'
  });
  const [loginErrors, setLoginErrors] = useState({ email: '', password: '' });
  const [signUpErrors, setSignUpErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const { setLoading, loading } = useSpinner();
  const { setUser, setClient, setCoach } = useContext(UserContext);
  const showToast = useToast();
  const navigate = useNavigate();

  const featuresRef = useRef(null);
  const pricingRef = useRef(null);
  const contactRef = useRef(null);

  const [verificationDialogVisible, setVerificationDialogVisible] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);

      if (!decodedToken.isVerified) {
        showToast(
          'error',
          intl.formatMessage({ id: 'common.error' }),
          intl.formatMessage({ id: 'home.error.verifyEmail' })
        );
      } else {
        setUser(decodedToken);
        if (decodedToken.userType === 'client') {
          navigate('/student');
        } else {
          navigate('/coach');
        }
      }
    }
  }, [navigate, setUser, showToast]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const validateLoginForm = () => {
    let isValid = true;
    const errors = { email: '', password: '' };

    if (!loginForm.email) {
      errors.email = 'Email is required';
      isValid = false;
    }
    if (!loginForm.password) {
      errors.password = 'Password is required';
      isValid = false;
    }

    setLoginErrors(errors);
    return isValid;
  };

  const validateSignUpForm = () => {
    let isValid = true;
    const errors = { email: '', password: '', confirmPassword: '' };

    // if (!signUpForm.fullName) {
    //     errors.fullName = 'Full name is required';
    //     isValid = false;
    // }
    if (!signUpForm.email) {
      errors.email = 'Email is required';
      isValid = false;
    }
    if (!signUpForm.password) {
      errors.password = 'Password is required';
      isValid = false;
    }
    if (signUpForm.password !== signUpForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setSignUpErrors(errors);
    return isValid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (validateLoginForm()) {
      setLoading(true);
      try {
        const { data: loginData } = await login(loginForm);
        console.log(loginData);
        setLoading(false);
        if (loginData.access_token) {
          console.log('loginData.access_token', loginData.access_token);
          localStorage.setItem('token', loginData.access_token);
          const decodedToken = jwtDecode(loginData.access_token);
          setUser(decodedToken);
          console.log(decodedToken);
          if (!decodedToken.isVerified) {
            setRegisteredEmail(loginForm.email);
            setVerificationDialogVisible(true);
            setLoginVisible(false);
            showToast(
              'error',
              intl.formatMessage({ id: 'common.error' }),
              intl.formatMessage({ id: 'home.error.verifyEmail' })
            );
          } else {
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
          }
        }
      } catch (error) {
        console.log(error);
        showToast('error', 'Error', error.message);
        setLoading(false);
      }
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (validateSignUpForm()) {
      setLoading(true);
      try {
        const { data, message, error } = await registerCoach(signUpForm);

        if (message !== 'success') {
          throw new Error(error || 'Something went wrong');
        } else {
          console.log(data);
          setLoading(false);
          setRegisteredEmail(signUpForm.email);
          setVerificationDialogVisible(true);
          setSignUpVisible(false);
          showToast('success', 'Success', intl.formatMessage({ id: 'signup.success' }));
        }
      } catch (error) {
        console.log(error);
        showToast('error', 'Error', error.message);
        setLoading(false);
      }
    }
  };

  const handleVerificationSuccess = () => {
    setSignUpForm({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      userType: 'coach'
    });
  };

  const scrollToSection = (sectionRef) => {
    if (sectionRef && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderLoginDialog = () => {
    return (
      <Dialog
        header={intl.formatMessage({ id: 'home.login.title' })}
        visible={loginVisible}
        draggable={false}
        dismissableMask
        resizable={false}
        className="border-round-2xl w-4/5 sm:w-11/12"
        style={{ width: 500 }}
        modal
        onHide={() => setLoginVisible(false)}
      >
        <form onSubmit={handleLogin} className="p-fluid p-4">
          <div className="field">
            <label htmlFor="email" className="block text-900 font-medium mb-2">
              <FormattedMessage id="home.login.email" />
            </label>
            <InputText
              id="email"
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              className={classNames('w-full p-inputtext-lg', { 'p-invalid': loginErrors.email })}
              placeholder={intl.formatMessage({ id: 'home.login.emailPlaceholder' })}
            />
            {loginErrors.email && <small className="p-error">{loginErrors.email}</small>}
          </div>
          <div className="field mt-4">
            <label htmlFor="password" className="block text-900 font-medium mb-2">
              <FormattedMessage id="home.login.password" />
            </label>
            <Password
              id="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              toggleMask
              className={classNames('w-full p-inputtext-lg', { 'p-invalid': loginErrors.password })}
              feedback={false}
              placeholder={intl.formatMessage({ id: 'home.login.passwordPlaceholder' })}
            />
            {loginErrors.password && <small className="p-error">{loginErrors.password}</small>}
          </div>
          <Button
            type="submit"
            label={intl.formatMessage({ id: 'home.header.login' })}
            className="p-button-lg w-full mt-4"
            loading={loading}
          />
          <div className="text-center mt-4">
            <a href="/forgot-password" className="font-medium no-underline text-primary cursor-pointer hover:underline">
              <FormattedMessage id="home.login.forgotPassword" />
            </a>
          </div>
          <div className="text-center mt-3">
            <span className="text-600">
              <FormattedMessage id="home.login.noAccount" />
            </span>
            <Button
              label={intl.formatMessage({ id: 'home.login.signUp' })}
              className="p-button-text p-button-sm text-primary font-medium ml-1"
              onClick={() => {
                setLoginVisible(false);
                setSignUpVisible(true);
              }}
            />
          </div>
        </form>
      </Dialog>
    );
  };

  const renderSignUpDialog = () => {
    return (
      <Dialog
        header={intl.formatMessage({ id: 'home.signup.title' })}
        visible={signUpVisible}
        draggable={false}
        dismissableMask
        resizable={false}
        className="border-round-2xl w-4/5 sm:w-11/12"
        style={{ width: 500 }}
        modal
        onHide={() => setSignUpVisible(false)}
      >
        <form onSubmit={handleSignUp} className="p-fluid p-4">
          <div className="field">
            <label htmlFor="signUpEmail" className="block text-900 font-medium mb-2">
              <FormattedMessage id="home.signup.email" />
            </label>
            <InputText
              id="signUpEmail"
              type="email"
              value={signUpForm.email}
              onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
              className={classNames('w-full p-inputtext-lg', { 'p-invalid': signUpErrors.email })}
              placeholder={intl.formatMessage({ id: 'home.signup.emailPlaceholder' })}
            />
            {signUpErrors.email && <small className="p-error">{signUpErrors.email}</small>}
          </div>
          <div className="field mt-4">
            <label htmlFor="signUpPassword" className="block text-900 font-medium mb-2">
              <FormattedMessage id="home.signup.password" />
            </label>
            <Password
              id="signUpPassword"
              value={signUpForm.password}
              onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
              toggleMask
              className={classNames('w-full p-inputtext-lg', { 'p-invalid': signUpErrors.password })}
              placeholder={intl.formatMessage({ id: 'home.signup.passwordPlaceholder' })}
            />
            {signUpErrors.password && <small className="p-error">{signUpErrors.password}</small>}
          </div>
          <div className="field mt-4">
            <label htmlFor="confirmPassword" className="block text-900 font-medium mb-2">
              <FormattedMessage id="home.signup.confirmPassword" />
            </label>
            <Password
              id="confirmPassword"
              value={signUpForm.confirmPassword}
              onChange={(e) =>
                setSignUpForm({
                  ...signUpForm,
                  confirmPassword: e.target.value
                })
              }
              toggleMask
              className={classNames('w-full p-inputtext-lg', {
                'p-invalid': signUpErrors.confirmPassword
              })}
              feedback={false}
              placeholder={intl.formatMessage({ id: 'home.signup.confirmPasswordPlaceholder' })}
            />
            {signUpErrors.confirmPassword && <small className="p-error">{signUpErrors.confirmPassword}</small>}
          </div>
          <Button
            type="submit"
            label={intl.formatMessage({ id: 'home.signup.title' })}
            className="p-button-lg w-full mt-4"
            loading={loading}
          />
          <div className="text-center mt-3">
            <span className="text-600">
              <FormattedMessage id="home.signup.haveAccount" />
            </span>
            <Button
              label={intl.formatMessage({ id: 'home.signup.login' })}
              className="p-button-text p-button-sm text-primary font-medium ml-1"
              onClick={() => {
                setSignUpVisible(false);
                setLoginVisible(true);
              }}
            />
          </div>
        </form>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        isScrolled={isScrolled}
        onLoginClick={() => setLoginVisible(true)}
        onSignUpClick={() => setSignUpVisible(true)}
        onScrollToFeatures={() => scrollToSection(featuresRef)}
        onScrollToPricing={() => scrollToSection(pricingRef)}
        onScrollToContact={() => scrollToSection(contactRef)}
      />
      <main className="flex-grow-1">
        <Hero onSignUpClick={() => setSignUpVisible(true)} onScrollToFeatures={() => scrollToSection(featuresRef)} />
        <Features featuresRef={featuresRef} />
        <Subscriptions pricingRef={pricingRef} onSignUpClick={() => setSignUpVisible(true)} />
      </main>
      <Footer contactRef={contactRef} />
      {renderLoginDialog()}
      {renderSignUpDialog()}
      <VerificationCodeDialog
        visible={verificationDialogVisible}
        onHide={() => setVerificationDialogVisible(false)}
        email={registeredEmail}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </div>
  );
}

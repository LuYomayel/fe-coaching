import React, { useRef } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { classNames } from 'primereact/utils';
import { Dumbbell, Users, LineChart, MessageCircle, Video } from 'lucide-react';

import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { jwtDecode } from 'jwt-decode';
import { fetchClient, fetchCoach, registerCoach, login } from '../services/usersService';
import { fetchCoachSubscriptionPlans } from '../services/subscriptionService';
import { useIntl, FormattedMessage } from 'react-intl';
import VerificationCodeDialog from '../dialogs/VerificationCodeDialog';
import PWAInstallButton from '../components/PWAInstallButton';

const apiUrl = process.env.REACT_APP_API_URL;
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
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const { setLoading, loading } = useSpinner();
  const { setUser, setClient, setCoach } = useContext(UserContext);
  const showToast = useToast();
  const navigate = useNavigate();

  const featuresRef = useRef(null);
  const pricingRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  const [verificationDialogVisible, setVerificationDialogVisible] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

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
    const fetchSubscriptionPlans = async () => {
      try {
        const { data } = await fetchCoachSubscriptionPlans();
        setSubscriptionPlans(data);
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    };
    fetchSubscriptionPlans();
  }, [showToast]);

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

  const renderHeader = () => {
    return (
      <div className="flex align-items-center justify-content-between surface-card p-3 shadow-2 border-round">
        <div className="flex align-items-center">
          <Dumbbell className="mr-2 text-primary" size={24} />
          <span className="font-bold text-xl">EaseTrain</span>
        </div>
        <div className="flex flex-wrap">
          <Button
            label={intl.formatMessage({ id: 'home.header.features' })}
            className="p-button-text p-button-rounded mr-2"
            onClick={() => scrollToSection(featuresRef)}
          />
          <Button
            label={intl.formatMessage({ id: 'home.header.pricing' })}
            className="p-button-text p-button-rounded mr-2"
            onClick={() => scrollToSection(pricingRef)}
          />
          <Button
            label={intl.formatMessage({ id: 'home.header.about' })}
            className="p-button-text p-button-rounded mr-2"
            onClick={() => scrollToSection(aboutRef)}
          />
          <Button
            label={intl.formatMessage({ id: 'home.header.contact' })}
            className="p-button-text p-button-rounded mr-2"
            onClick={() => scrollToSection(contactRef)}
          />
          <Button
            label={intl.formatMessage({ id: 'home.header.login' })}
            className="p-button-rounded ml-2"
            onClick={() => setLoginVisible(true)}
          />
        </div>
      </div>
    );
  };

  const renderHero = () => {
    return (
      <div className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0">
          <svg
            className="absolute"
            style={{
              bottom: 0,
              left: 0,
              marginBottom: '2rem',
              transform: 'scale(1.5)',
              opacity: 0.1
            }}
            viewBox="0 0 375 283"
            fill="none"
          >
            <rect x="159.52" y="175" width="152" height="152" rx="8" transform="rotate(-45 159.52 175)" fill="white" />
            <rect y="107.48" width="152" height="152" rx="8" transform="rotate(-45 0 107.48)" fill="white" />
          </svg>
          <div
            className="absolute inset-0 bg-primary-600"
            style={{
              opacity: 0.4
            }}
          />
        </div>
        <div className="relative mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32" style={{ maxWidth: '1200px' }}>
          <div className="grid align-items-center">
            <div className="col-12 md:col-6 text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-0 font-extrabold mb-4 text-white text-6xl">
                <FormattedMessage id="home.hero.title" />
              </h1>
              <p className="text-0 mb-5 text-white opacity-80 text-xl line-height-3">
                <FormattedMessage id="home.hero.subtitle" />
              </p>
              <div className="flex flex-wrap justify-content-center md:justify-content-start gap-3 mb-4">
                <Button
                  onClick={() => setSignUpVisible(true)}
                  label={intl.formatMessage({ id: 'home.hero.getStarted' })}
                  className="p-button-lg p-button-rounded shadow-5"
                />
                <Button
                  label={intl.formatMessage({ id: 'home.hero.learnMore' })}
                  className="p-button-lg p-button-rounded p-button-outlined text-white border-white"
                  onClick={() => scrollToSection(featuresRef)}
                />
              </div>

              {/* PWA Install Button */}
              <div className="mt-4">
                <PWAInstallButton />
              </div>
            </div>
            <div className="col-12 md:col-6">
              <div className="relative">
                <div className="surface-card p-5 shadow-8 border-round-xl">
                  <div className="flex align-items-center justify-content-center bg-primary border-circle w-4rem h-4rem mb-4">
                    <Dumbbell className="text-white" size={32} />
                  </div>
                  <h3 className="text-900 text-2xl font-medium mb-3">
                    <FormattedMessage id="home.features.customPlans" />
                  </h3>
                  <p className="text-700 line-height-3">
                    <FormattedMessage id="home.features.customPlansDesc" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFeatures = () => {
    const features = [
      {
        icon: <Users size={32} className="text-primary" />,
        title: intl.formatMessage({ id: 'home.features.manageClients' }),
        description: intl.formatMessage({
          id: 'home.features.manageClientsDesc'
        })
      },
      {
        icon: <Dumbbell size={32} className="text-primary" />,
        title: intl.formatMessage({ id: 'home.features.customPlans' }),
        description: intl.formatMessage({ id: 'home.features.customPlansDesc' })
      },
      {
        icon: <LineChart size={32} className="text-primary" />,
        title: intl.formatMessage({ id: 'home.features.trackProgress' }),
        description: intl.formatMessage({
          id: 'home.features.trackProgressDesc'
        })
      },
      {
        icon: <MessageCircle size={32} className="text-primary" />,
        title: intl.formatMessage({ id: 'home.features.messaging' }),
        description: intl.formatMessage({ id: 'home.features.messagingDesc' })
      },
      {
        icon: <Video size={32} className="text-primary" />,
        title: intl.formatMessage({ id: 'home.features.videoTutorials' }),
        description: intl.formatMessage({
          id: 'home.features.videoTutorialsDesc'
        })
      }
    ];

    return (
      <div className="surface-ground py-8" ref={featuresRef}>
        <div className="max-w-screen-lg mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-900 mb-8">
            <FormattedMessage id="home.features.title" />
          </h2>
          <div className="grid">
            {features.map((feature, index) => (
              <div key={index} className="col-12 md:col-6 lg:col-4">
                <Card className="m-2 p-3 h-full shadow-3 border-round-2xl">
                  <div className="flex flex-column align-items-center">
                    <div className="mb-3">{feature.icon}</div>
                    <h3 className="text-xl font-bold mt-3 mb-2 text-900">{feature.title}</h3>
                    <p className="text-center text-700 line-height-3">{feature.description}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPricing = () => {
    return (
      <div className="surface-section py-8" ref={pricingRef}>
        <h2 className="text-4xl font-bold text-center text-900 mb-8">
          <FormattedMessage id="home.pricing.title" />
        </h2>
        <div className="grid max-w-screen-lg mx-auto px-4">
          {subscriptionPlans.map((plan) => (
            <div key={plan.id} className="col-12 md:col-3 lg:col-3 p-3">
              <Card
                title={<span className="text-900">{plan.name}</span>}
                subTitle={<span className="text-primary font-bold">${plan.price} / month</span>}
                className="h-20rem shadow-5 border-round-2xl"
                header={<div className="bg-primary h-1rem"></div>}
              >
                <ul className="list-none p-0 m-0">
                  <li className="flex align-items-center mb-2">
                    <i className="pi pi-check-circle mr-2 text-green-500"></i>
                    <span className="text-700">
                      <FormattedMessage id="home.pricing.maxClients" values={{ max: plan.max_clients }} />
                    </span>
                  </li>
                </ul>
                <div className="mt-5">
                  <Button
                    label={intl.formatMessage({ id: 'home.pricing.subscribe' })}
                    className="p-button-rounded p-button-outlined w-full"
                  />
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTestimonials = () => {
    const testimonials = [
      {
        text: intl.formatMessage({ id: 'home.testimonials.sarah' }),
        author: 'Sarah J., Personal Trainer'
      },
      {
        text: intl.formatMessage({ id: 'home.testimonials.mike' }),
        author: 'Mike T., Client'
      },
      {
        text: intl.formatMessage({ id: 'home.testimonials.emily' }),
        author: 'Emily R., Fitness Coach'
      }
    ];

    return (
      <div ref={aboutRef} className="surface-card py-8">
        <div className="max-w-screen-lg mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-900 mb-8">
            <FormattedMessage id="home.testimonials.title" />
          </h2>
          <div className="grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="col-12 md:col-4 p-3">
                <Card className="shadow-3 border-round-2xl p-4 h-full">
                  <div className="flex flex-column h-full">
                    <i className="pi pi-quote-left text-primary text-4xl mb-3"></i>
                    <p className="text-700 line-height-3 flex-grow-1">{testimonial.text}</p>
                    <p className="text-900 font-medium mt-3">{testimonial.author}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFooter = () => {
    return (
      <div ref={contactRef} className="surface-ground py-6">
        <div className="max-w-screen-lg mx-auto px-4 flex justify-content-between align-items-center flex-wrap">
          <div className="mb-3 md:mb-0">
            <div className="flex align-items-center">
              <Dumbbell className="mr-2 text-primary" size={20} />
              <span className="font-medium text-lg text-900">EaseTrain</span>
            </div>
            <p className="text-sm text-600 mt-2">© 2023 EaseTrain. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              label={intl.formatMessage({ id: 'home.footer.terms' })}
              className="p-button-text p-button-rounded"
            />
            <Button
              label={intl.formatMessage({ id: 'home.footer.privacy' })}
              className="p-button-text p-button-rounded"
            />
            <Button
              label={intl.formatMessage({ id: 'home.footer.contact' })}
              className="p-button-text p-button-rounded"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderLoginDialog = () => {
    return (
      <Dialog
        header={intl.formatMessage({ id: 'home.login.title' })}
        visible={loginVisible}
        draggable={false}
        dismissableMask
        resizable={false}
        style={{ width: '90%', maxWidth: '400px' }}
        className="border-round-2xl"
        modal
        onHide={() => setLoginVisible(false)}
      >
        <form onSubmit={handleLogin} className="p-fluid">
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
        style={{ width: '90%', maxWidth: '400px' }}
        className="border-round-2xl"
        modal
        onHide={() => setSignUpVisible(false)}
      >
        <form onSubmit={handleSignUp} className="p-fluid">
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
        </form>
      </Dialog>
    );
  };

  return (
    <div className="flex flex-column min-h-screen h-full">
      <header className="p-4">{renderHeader()}</header>
      <main className="flex-grow-1">
        {renderHero()}
        {renderFeatures()}
        {renderPricing()}
        {renderTestimonials()}
      </main>
      <footer>{renderFooter()}</footer>
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

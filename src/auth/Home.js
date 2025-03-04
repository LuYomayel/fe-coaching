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
import { fetchClient, fetchCoach } from '../services/usersService';
import { fetchCoachSubscriptionPlans } from '../services/subscriptionService';
import { useIntl, FormattedMessage } from 'react-intl';

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
    confirmPassword: ''
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);

      if (!decodedToken.isVerified) {
        // showToast('error', 'Verify your email prior to logging in!', 'Check your email to verify it, please');
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
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: loginForm.email,
            password: loginForm.password
          })
        });
        const loginData = await response.json();
        if (loginData.message !== 'success') {
          throw new Error(loginData.message || 'Something went wrong');
        }
        setLoading(false);
        if (loginData.data.access_token) {
          localStorage.setItem('token', loginData.data.access_token);
          const decodedToken = jwtDecode(loginData.data.access_token);
          setUser(decodedToken);
          if (!decodedToken.isVerified) {
            showToast(
              'error',
              `${intl.formatMessage({ id: 'home.error.verifyEmail' })}`,
              `${intl.formatMessage({ id: 'home.error.checkEmail' })}`
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
        const response = await fetch(`${apiUrl}/auth/signUp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: signUpForm.email,
            password: signUpForm.password
          })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Something went wrong');
        } else {
          setLoading(false);
          showToast(
            'success',
            intl.formatMessage({ id: 'common.success' }),
            intl.formatMessage({ id: 'home.success.checkEmail' })
          );
        }
      } catch (error) {
        showToast('error', 'Error', error.message);
        setLoading(false);
      }
    }
  };

  const scrollToSection = (sectionRef) => {
    if (sectionRef && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex align-items-center justify-content-between">
        <div className="flex align-items-center">
          <Dumbbell className="mr-2" size={24} />
          <span className="font-bold text-xl">EaseTrain</span>
        </div>
        <div>
          <Button
            label={intl.formatMessage({ id: 'home.header.features' })}
            className="p-button-text mr-2"
            onClick={() => scrollToSection(featuresRef)}
          />
          <Button
            label={intl.formatMessage({ id: 'home.header.pricing' })}
            className="p-button-text mr-2"
            onClick={() => scrollToSection(pricingRef)}
          />
          <Button
            label={intl.formatMessage({ id: 'home.header.about' })}
            className="p-button-text mr-2"
            onClick={() => scrollToSection(aboutRef)}
          />
          <Button
            label={intl.formatMessage({ id: 'home.header.contact' })}
            className="p-button-text"
            onClick={() => scrollToSection(contactRef)}
          />
          <Button
            label={intl.formatMessage({ id: 'home.header.login' })}
            className="p-button-text mr-2"
            onClick={() => setLoginVisible(true)}
          />
        </div>
      </div>
    );
  };

  const renderHero = () => {
    return (
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(to right, #7e5bef, #5a9bd4)' }}
      >
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
            <rect
              x="159.52"
              y="175"
              width="152"
              height="152"
              rx="8"
              transform="rotate(-45 159.52 175)"
              fill="white"
            />
            <rect
              y="107.48"
              width="152"
              height="152"
              rx="8"
              transform="rotate(-45 0 107.48)"
              fill="white"
            />
          </svg>
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, #7e5bef, #3ea1db)',
              opacity: 0.9
            }}
          />
        </div>
        <div
          className="relative mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32"
          style={{ maxWidth: '1200px' }}
        >
          <div className="grid align-items-center justify-content-between">
            <div className="col-12 md:col-6 text-center md:text-left mb-6 md:mb-0">
              <h1
                style={{
                  fontSize: '3.5rem',
                  fontWeight: '800',
                  lineHeight: '1.2',
                  marginBottom: '1.5rem',
                  color: 'white'
                }}
              >
                <FormattedMessage id="home.hero.title" />
              </h1>
              <p
                className="text-white"
                style={{
                  fontSize: '1.5rem',
                  marginBottom: '2rem',
                  color: '#E0BBE4'
                }}
              >
                <FormattedMessage id="home.hero.subtitle" />
              </p>
              <div className="grid justify-content-center md:justify-content-start mb-4">
                <div className="col-fixed mb-2 mr-2">
                  <Button
                    onClick={() => setSignUpVisible(true)}
                    label={intl.formatMessage({ id: 'home.hero.getStarted' })}
                    className="p-button-lg p-button-raised p-button-rounded"
                    style={{
                      color: '#7e5bef',
                      backgroundColor: '#fff',
                      borderColor: '#fff',
                      padding: '1rem 2rem'
                    }}
                  />
                </div>
                <div className="col-fixed">
                  <Button
                    label={intl.formatMessage({ id: 'home.hero.learnMore' })}
                    className="p-button-lg p-button-rounded p-button-outlined"
                    style={{
                      color: '#fff',
                      borderColor: '#fff',
                      padding: '1rem 2rem'
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="col-12 md:col-6">
              <div className="relative">
                <div
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '1rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    padding: '2rem'
                  }}
                >
                  <div className="flex align-items-center justify-content-center w-4rem h-4rem bg-purple-600 border-circle mb-4">
                    <Dumbbell
                      style={{ width: '32px', height: '32px', color: '#fff' }}
                    />
                  </div>
                  <h3
                    style={{
                      fontSize: '2rem',
                      color: '#333',
                      marginBottom: '1rem'
                    }}
                  >
                    <FormattedMessage id="home.features.customPlans" />
                  </h3>
                  <p style={{ color: '#666' }}>
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
        icon: <Users size={32} />,
        title: intl.formatMessage({ id: 'home.features.manageClients' }),
        description: intl.formatMessage({
          id: 'home.features.manageClientsDesc'
        })
      },
      {
        icon: <Dumbbell size={32} />,
        title: intl.formatMessage({ id: 'home.features.customPlans' }),
        description: intl.formatMessage({ id: 'home.features.customPlansDesc' })
      },
      {
        icon: <LineChart size={32} />,
        title: intl.formatMessage({ id: 'home.features.trackProgress' }),
        description: intl.formatMessage({
          id: 'home.features.trackProgressDesc'
        })
      },
      {
        icon: <MessageCircle size={32} />,
        title: intl.formatMessage({ id: 'home.features.messaging' }),
        description: intl.formatMessage({ id: 'home.features.messagingDesc' })
      },
      {
        icon: <Video size={32} />,
        title: intl.formatMessage({ id: 'home.features.videoTutorials' }),
        description: intl.formatMessage({
          id: 'home.features.videoTutorialsDesc'
        })
      }
    ];

    return (
      <div className="bg-gray-100 py-8" ref={featuresRef}>
        <div className="max-w-screen-lg mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-8">
            <FormattedMessage id="home.features.title" />
          </h2>
          <div className="grid">
            {features.map((feature, index) => (
              <div key={index} className="col-12 md:col-6 lg:col-4">
                <Card className="m-2">
                  <div className="flex flex-column align-items-center">
                    {feature.icon}
                    <h3 className="text-xl font-bold mt-3 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-center">{feature.description}</p>
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
      <div ref={pricingRef}>
        <h2 className="text-4xl font-bold text-center mb-8">
          <FormattedMessage id="home.pricing.title" />
        </h2>
        <div className="grid">
          {subscriptionPlans.map((plan) => (
            <div key={plan.id} className="col-12 md:col-3 lg:col-3">
              <Card
                title={plan.name}
                subTitle={`$${plan.price} / month`}
                className={classNames('h-full h-20rem relative')}
                style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
              >
                <ul className="list-none p-0 m-0">
                  <li className="flex align-items-center mb-2">
                    <i className="pi pi-check-circle mr-2 text-green-500"></i>
                    <span>
                      <FormattedMessage
                        id="home.pricing.maxClients"
                        values={{ max: plan.max_clients }}
                      />
                    </span>
                  </li>
                </ul>
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
      <div ref={aboutRef} className="py-8">
        <div className="max-w-screen-lg mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-8">
            <FormattedMessage id="home.testimonials.title" />
          </h2>
          <div className="grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="col-12 md:col-4">
                <Card className="m-2">
                  <p className="text-center mb-3">{testimonial.text}</p>
                  <p className="text-center font-bold">{testimonial.author}</p>
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
      <div ref={contactRef} className="bg-gray-200 py-4">
        <div className="max-w-screen-lg mx-auto px-4 flex justify-content-between align-items-center">
          <p className="text-sm">© 2023 EaseTrain. All rights reserved.</p>
          <div>
            <Button
              label={intl.formatMessage({ id: 'home.footer.terms' })}
              className="p-button-text p-button-sm mr-2"
            />
            <Button
              label={intl.formatMessage({ id: 'home.footer.privacy' })}
              className="p-button-text p-button-sm mr-2"
            />
            <Button
              label={intl.formatMessage({ id: 'home.footer.contact' })}
              className="p-button-text p-button-sm"
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
        modal
        onHide={() => setLoginVisible(false)}
      >
        <form onSubmit={handleLogin} className="p-fluid">
          <div className="field">
            <label htmlFor="email" className="font-bold">
              <FormattedMessage id="home.login.email" />
            </label>
            <InputText
              id="email"
              type="email"
              value={loginForm.email}
              onChange={(e) =>
                setLoginForm({ ...loginForm, email: e.target.value })
              }
              className={classNames({ 'p-invalid': loginErrors.email })}
            />
            {loginErrors.email && (
              <small className="p-error">{loginErrors.email}</small>
            )}
          </div>
          <div className="field">
            <label htmlFor="password" className="font-bold">
              <FormattedMessage id="home.login.password" />
            </label>
            <Password
              id="password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
              toggleMask
              className={classNames({ 'p-invalid': loginErrors.password })}
              feedback={false}
            />
            {loginErrors.password && (
              <small className="p-error">{loginErrors.password}</small>
            )}
          </div>
          <Button
            type="submit"
            label={intl.formatMessage({ id: 'home.header.login' })}
            className="mt-2"
            loading={loading}
          />
          <div className="text-center mt-2">
            <a
              href="/forgot-password"
              className="font-medium no-underline ml-2 text-blue-500 cursor-pointer"
            >
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
        modal
        onHide={() => setSignUpVisible(false)}
      >
        <form onSubmit={handleSignUp} className="p-fluid">
          <div className="field">
            <label htmlFor="signUpEmail" className="font-bold">
              <FormattedMessage id="home.signup.email" />
            </label>
            <InputText
              id="signUpEmail"
              type="email"
              value={signUpForm.email}
              onChange={(e) =>
                setSignUpForm({ ...signUpForm, email: e.target.value })
              }
              className={classNames({ 'p-invalid': signUpErrors.email })}
            />
            {signUpErrors.email && (
              <small className="p-error">{signUpErrors.email}</small>
            )}
          </div>
          <div className="field">
            <label htmlFor="signUpPassword" className="font-bold">
              <FormattedMessage id="home.signup.password" />
            </label>
            <Password
              id="signUpPassword"
              value={signUpForm.password}
              onChange={(e) =>
                setSignUpForm({ ...signUpForm, password: e.target.value })
              }
              toggleMask
              className={classNames({ 'p-invalid': signUpErrors.password })}
            />
            {signUpErrors.password && (
              <small className="p-error">{signUpErrors.password}</small>
            )}
          </div>
          <div className="field">
            <label htmlFor="confirmPassword" className="font-bold">
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
              className={classNames({
                'p-invalid': signUpErrors.confirmPassword
              })}
              feedback={false}
            />
            {signUpErrors.confirmPassword && (
              <small className="p-error">{signUpErrors.confirmPassword}</small>
            )}
          </div>
          <Button
            type="submit"
            label={intl.formatMessage({ id: 'home.signup.title' })}
            className="mt-2"
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
    </div>
  );
}

import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { classNames } from 'primereact/utils';
import { Dumbbell, Users, LineChart, MessageCircle, Video } from 'lucide-react';

import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import {jwtDecode} from 'jwt-decode';
import { fetchClient, fetchCoach } from '../services/usersService';

// Ensure you have these imports in your main application file:
// import 'primereact/resources/themes/lara-light-indigo/theme.css';
// import 'primereact/resources/primereact.min.css';
// import 'primeicons/primeicons.css';
// import 'primeflex/primeflex.css';

const apiUrl = process.env.REACT_APP_API_URL;
export default function HomePage() {
    const [loginVisible, setLoginVisible] = useState(false);
    const [signUpVisible, setSignUpVisible] = useState(false);
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [signUpForm, setSignUpForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
    const [loginErrors, setLoginErrors] = useState({ email: '', password: '' });
    const [signUpErrors, setSignUpErrors] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });

    const { setLoading, loading } = useSpinner();
    const { setUser, setClient, setCoach } = useContext(UserContext);
    const showToast = useToast();
    const navigate = useNavigate();


    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = jwtDecode(token);
            if (!decodedToken.isVerified) {
                showToast('error', 'Verify your email prior to logging in!', 'Check your email to verify it, please');
            } else {
                setUser(decodedToken);
                if (decodedToken.userType === 'client') {
                    navigate('/student');
                } else {
                    navigate('/coach');
                }
            }
        }
    }, [navigate, setUser]);

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
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Something went wrong');
                }
                const data = await response.json();
                setLoading(false);
                if (data.access_token) {
                    localStorage.setItem('token', data.access_token);
                    const decodedToken = jwtDecode(data.access_token);
                    setUser(decodedToken);
                    if (!decodedToken.isVerified) {
                        showToast('error', 'Verify your email prior to logging in!', 'Check your email to verify it, please');
                    } else {
                        if (decodedToken.userType === 'coach') {
                            const coachData = await fetchCoach(decodedToken.userId);
                            if (!coachData) {
                                setCoach(null);
                                navigate('/complete-coach-profile');
                            } else {
                                setCoach(coachData);
                                navigate('/coach');
                            }
                        } else if (decodedToken.userType === 'client') {
                            const clientData = await fetchClient(decodedToken.userId);
                            setClient(clientData);
                            navigate('/student');
                        }
                    }
                }
            } catch (error) {
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
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: signUpForm.email, password: signUpForm.password }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Something went wrong');
                } else {
                    setLoading(false);
                    showToast('success', 'Check your email to continue!');
                }
            } catch (error) {
                showToast('error', 'Error', error.message);
                setLoading(false);
            }
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
                    <Button label="Features" className="p-button-text mr-2" />
                    <Button label="Pricing" className="p-button-text mr-2" />
                    <Button label="About" className="p-button-text mr-2" />
                    <Button label="Contact" className="p-button-text" />
                </div>
            </div>
        );
    };

    const renderHero = () => {
        return (
            <div className="flex align-items-center justify-content-center min-h-screen text-center" style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--surface-ground) 100%)' }}>
                <div className="p-4">
                    <h1 className="text-5xl font-bold mb-4">Welcome to EaseTrain</h1>
                    <p className="text-xl mb-6 max-w-30rem mx-auto">
                        EaseTrain helps personal trainers manage clients, customize training plans, track progress, and communicate effectively.
                    </p>
                    <div>
                        <Button label="Sign Up" className="p-button-raised p-button-rounded mr-2" onClick={() => setSignUpVisible(true)} />
                        <Button label="Log In" className="p-button-outlined p-button-rounded" onClick={() => setLoginVisible(true)} />
                    </div>
                </div>
            </div>
        );
    };

    const renderFeatures = () => {
        const features = [
            { icon: <Users size={32} />, title: 'Manage Clients', description: 'Easily manage your clients details and progress in one place.' },
            { icon: <Dumbbell size={32} />, title: 'Custom Training Plans', description: `Create personalized workout routines tailored to each client's needs.` },
            { icon: <LineChart size={32} />, title: 'Track Progress', description: 'Visualize client progress with data-driven charts and reports.' },
            { icon: <MessageCircle size={32} />, title: 'In-App Messaging', description: 'Stay connected with clients through direct messaging.' },
            { icon: <Video size={32} />, title: 'Video Tutorials', description: 'Share video tutorials to guide clients through exercises.' },
        ];

        return (
            <div className="bg-gray-100 py-8">
                <div className="max-w-screen-lg mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-8">Key Features</h2>
                    <div className="grid">
                        {features.map((feature, index) => (
                            <div key={index} className="col-12 md:col-6 lg:col-4">
                                <Card className="m-2">
                                    <div className="flex flex-column align-items-center">
                                        {feature.icon}
                                        <h3 className="text-xl font-bold mt-3 mb-2">{feature.title}</h3>
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

    const renderTestimonials = () => {
        const testimonials = [
            { text: "EaseTrain has revolutionized how I manage my clients. It's a game-changer for personal trainers!", author: "Sarah J., Personal Trainer" },
            { text: "The progress tracking feature keeps me motivated. I love seeing my improvements over time.", author: "Mike T., Client" },
            { text: "The custom training plans and video tutorials have helped me provide better service to my clients.", author: "Emily R., Fitness Coach" },
        ];

        return (
            <div className="py-8">
                <div className="max-w-screen-lg mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-8">What Our Users Say</h2>
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
            <div className="bg-gray-200 py-4">
                <div className="max-w-screen-lg mx-auto px-4 flex justify-content-between align-items-center">
                    <p className="text-sm">© 2023 EaseTrain. All rights reserved.</p>
                    <div>
                        <Button label="Terms of Service" className="p-button-text p-button-sm mr-2" />
                        <Button label="Privacy" className="p-button-text p-button-sm mr-2" />
                        <Button label="Contact" className="p-button-text p-button-sm" />
                    </div>
                </div>
            </div>
        );
    };

    const renderLoginDialog = () => {
        return (
            <Dialog header="Log In" visible={loginVisible} style={{ width: '90%', maxWidth: '400px' }} modal onHide={() => setLoginVisible(false)}>
                <form onSubmit={handleLogin} className="p-fluid">
                    <div className="field">
                        <label htmlFor="email" className="font-bold">Email</label>
                        <InputText id="email" type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} className={classNames({ 'p-invalid': loginErrors.email })} />
                        {loginErrors.email && <small className="p-error">{loginErrors.email}</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="password" className="font-bold">Password</label>
                        <Password id="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} toggleMask className={classNames({ 'p-invalid': loginErrors.password })} feedback={false} />
                        {loginErrors.password && <small className="p-error">{loginErrors.password}</small>}
                    </div>
                    <Button type="submit" label="Log In" className="mt-2" loading={loading} />
                    <div className="text-center mt-2">
                        <a href="/forgot-password" className="font-medium no-underline ml-2 text-blue-500 cursor-pointer">Forgot password?</a>
                    </div>
                </form>
            </Dialog>
        );
    };

    const renderSignUpDialog = () => {
        return (
            <Dialog header="Sign Up" visible={signUpVisible} style={{ width: '90%', maxWidth: '400px' }} modal onHide={() => setSignUpVisible(false)}>
                <form onSubmit={handleSignUp} className="p-fluid">
                    <div className="field">
                        <label htmlFor="signUpEmail" className="font-bold">Email</label>
                        <InputText id="signUpEmail" type="email" value={signUpForm.email} onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })} className={classNames({ 'p-invalid': signUpErrors.email })} />
                        {signUpErrors.email && <small className="p-error">{signUpErrors.email}</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="signUpPassword" className="font-bold">Password</label>
                        <Password id="signUpPassword" value={signUpForm.password} onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })} toggleMask className={classNames({ 'p-invalid': signUpErrors.password })} />
                        {signUpErrors.password && <small className="p-error">{signUpErrors.password}</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="confirmPassword" className="font-bold">Confirm Password</label>
                        <Password id="confirmPassword" value={signUpForm.confirmPassword} onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })} toggleMask className={classNames({ 'p-invalid': signUpErrors.confirmPassword })} feedback={false} />
                        {signUpErrors.confirmPassword && <small className="p-error">{signUpErrors.confirmPassword}</small>}
                    </div>
                    <Button type="submit" label="Sign Up" className="mt-2" loading={loading} />
                </form>
            </Dialog>
        );
    };

    return (
        <div className="flex flex-column min-h-screen">
            <header className="p-4">
                {renderHeader()}
            </header>
            <main className="flex-grow-1">
                {renderHero()}
                {renderFeatures()}
                {renderTestimonials()}
            </main>
            <footer>
                {renderFooter()}
            </footer>
            {renderLoginDialog()}
            {renderSignUpDialog()}
        </div>
    );
}
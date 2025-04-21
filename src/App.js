import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext.js';
import { ThemeProvider } from './utils/ThemeContext';
import { ToastProvider } from './utils/ToastContext';
import { UserProvider } from './utils/UserContext.js';
import { ConfirmationDialogProvider } from './utils/ConfirmationDialogContext.js';
import { SpinnerProvider, useSpinner } from './utils/GlobalSpinner.js';
import Sidebar from './components/Sidebar.js';
import Unauthorized from './components/Unauthorized.js';
import PrivateRoute from './auth/PrivateRoute.js';
import VerifyEmail from './auth/VerifyEmail.js';
import CoachProfileForm from './pages/CoachProfileForm.js';
import ForgotPassword from './auth/ForgotPassword.js';
import ResetPassword from './auth/ResetPassword.js';
import NotSubscribed from './components/NotSubscribed.js';
import Home from './auth/Home.js';
import CoachHome from './pages/CoachHome.js';
import PlansPage from './pages/PlansPage.js';
import CoachProfile from './pages/CoachProfile.js';
import ManageStudentsPage from './pages/ManageStudents.js';
import ClientDashboard from './pages/ClientDashboard.js';
import CreatePlan from './pages/CreatePlan.js';
import { ChatSidebarProvider } from './utils/ChatSideBarContext.js';
import StudentDetails from './pages/StudentDetails.js';
import StudentHome from './pages/StudentHome.js';
import ClientProfile from './pages/ClientProfile.js';
import TrainingPlanDetails from './pages/TrainingPlanDetails.js';
import PlanDetail from './dialogs/PlanDetails.js';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { NotificationProvider } from './utils/NotificationsContext.js';
import Settings from './pages/Settings.js';
import StudentCalendar from './pages/StudentCalendar';

const stripePromise = await loadStripe(
  'pk_live_51Q3CfT05I9O02RUndo8xGIDJT1MmuvSmA3wekj223dWpi4VTsqzGtvnVYTjbDv2yqjoOkBXu9w8npwTM1eK1aZmM00mLXrhiSq'
);

const App = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detectar cambios en el tamaño de la pantalla
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SpinnerProvider>
      <LanguageProvider>
        <ThemeProvider>
          <UserProvider>
            <ToastProvider>
              <NotificationProvider>
                <ChatSidebarProvider>
                  <ConfirmationDialogProvider>
                    <Elements stripe={stripePromise}>
                      <Router>
                        <div className="flex">
                          <Sidebar onExpandChange={setSidebarExpanded} />
                          <div
                            className="flex-grow-1"
                            style={{
                              marginLeft: isMobile ? '0' : sidebarExpanded ? '250px' : '70px',
                              transition: 'margin-left 0.3s ease',
                              height: '100vh',
                              overflow: 'auto'
                            }}
                          >
                            <Routes>
                              <Route path="/" element={<Home />} />
                              <Route path="/login" element={<Home />} />
                              <Route path="/unauthorized" element={<Unauthorized />} />

                              <Route
                                path="/coach"
                                element={<PrivateRoute element={CoachHome} requiredType="coach" />}
                              />
                              <Route
                                path="/coach/profile"
                                element={<PrivateRoute element={CoachProfile} requiredType="coach" />}
                              />
                              <Route
                                path="/coach/plans"
                                element={<PrivateRoute element={PlansPage} requiredType="coach" />}
                              />
                              <Route
                                path="/plans/create"
                                element={<PrivateRoute element={CreatePlan} requiredType="coach" isEdit={false} />}
                              />
                              <Route
                                path="/plans/create-and-assign"
                                element={<PrivateRoute element={CreatePlan} requiredType="coach" isEdit={true} />}
                              />
                              <Route
                                path="/plans/edit-template/:planId"
                                element={<PrivateRoute element={CreatePlan} requiredType="coach" isEdit={true} />}
                              />
                              <Route
                                path="/plans/edit/:planId"
                                element={<PrivateRoute element={CreatePlan} requiredType="coach" isEdit={true} />}
                              />
                              <Route
                                path="/plans/:planId/:studentId"
                                element={<PrivateRoute element={PlanDetail} requiredType="coach" />}
                              />
                              <Route
                                path="/students/:studentId/details"
                                element={<PrivateRoute element={StudentDetails} requiredType="coach" />}
                              />
                              <Route
                                path="/manage-students"
                                element={<PrivateRoute element={ManageStudentsPage} requiredType="coach" />}
                              />
                              <Route
                                path="/client-dashboard/:clientId"
                                element={<PrivateRoute element={ClientDashboard} requiredType="coach" />}
                              />

                              <Route
                                path="/student"
                                element={<PrivateRoute element={StudentHome} requiredType="client" />}
                              />
                              <Route
                                path="/student/profile"
                                element={<PrivateRoute element={ClientProfile} requiredType="client" />}
                              />
                              <Route
                                path="/plans/start-session/:planId"
                                element={<PrivateRoute element={TrainingPlanDetails} />}
                              />
                              <Route path="/student/calendar" element={<StudentCalendar />} />

                              <Route path="/verify-email" element={<VerifyEmail />} />
                              <Route
                                path="/complete-coach-profile"
                                element={<PrivateRoute element={CoachProfileForm} />}
                              />
                              <Route path="/forgot-password" element={<ForgotPassword />} />
                              <Route path="/reset-password" element={<ResetPassword />} />
                              <Route path="/not-subscribed" element={<NotSubscribed />} />

                              <Route path="/settings" element={<Settings />} />

                              <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                          </div>
                        </div>
                      </Router>
                    </Elements>
                  </ConfirmationDialogProvider>
                </ChatSidebarProvider>
              </NotificationProvider>
            </ToastProvider>
          </UserProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SpinnerProvider>
  );
};

export default App;

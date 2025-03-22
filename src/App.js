import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext.js';
import { ThemeProvider } from './utils/ThemeContext';
import { ToastProvider } from './utils/ToastContext';
import { UserProvider } from './utils/UserContext.js';
import { ConfirmationDialogProvider } from './utils/ConfirmationDialogContext.js';
import { SpinnerProvider } from './utils/GlobalSpinner.js';
import Header from './components/Header.js';
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
import BodyContainer from './utils/BodyContainer.js';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { NotificationProvider } from './utils/NotificationsContext.js';
import Settings from './pages/Settings.js';
const stripePromise = await loadStripe(
  'pk_live_51Q3CfT05I9O02RUndo8xGIDJT1MmuvSmA3wekj223dWpi4VTsqzGtvnVYTjbDv2yqjoOkBXu9w8npwTM1eK1aZmM00mLXrhiSq'
);
const App = () => {
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
                        <Header />
                        <BodyContainer>
                          <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Home />} />
                            <Route path="/unauthorized" element={<Unauthorized />} />

                            <Route path="/coach" element={<PrivateRoute element={CoachHome} requiredType="coach" />} />
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
                              element={<PrivateRoute element={TrainingPlanDetails} requiredType="client" />}
                            />

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
                        </BodyContainer>
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

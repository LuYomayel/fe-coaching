import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from 'react-router-dom';
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
import NewCoachHome from './pages/NewCoachHome.js';
import PlansPage from './pages/PlansPage.js';
import NewCoachProfile from './pages/NewCoachProfile.js';
import NewManageStudentsPage from './pages/NewManageStudents.js';
import NewClientDashboard from './pages/NewClientDashboard.js';
import NewCreatePlan from './pages/NewCreatePlan.js';
import { ChatSidebarProvider } from './utils/ChatSideBarContext.js';
import NewStudentDetails from './pages/NewStudentsDetails.js';
import NewStudentHome from './pages/NewStudentHome.js';
import NewClientProfile from './pages/NewClientProfile.js';
import NewTrainingPlanDetails from './pages/NewTrainingDetails.js';
import NewPlanDetail from './dialogs/NewPlanDetails.js';
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
                            <Route
                              path="/unauthorized"
                              element={<Unauthorized />}
                            />

                            <Route
                              path="/coach"
                              element={
                                <PrivateRoute
                                  element={NewCoachHome}
                                  requiredType="coach"
                                />
                              }
                            />
                            <Route
                              path="/coach/profile"
                              element={
                                <PrivateRoute
                                  element={NewCoachProfile}
                                  requiredType="coach"
                                />
                              }
                            />
                            <Route
                              path="/coach/plans"
                              element={
                                <PrivateRoute
                                  element={PlansPage}
                                  requiredType="coach"
                                />
                              }
                            />
                            <Route
                              path="/plans/create"
                              element={
                                <PrivateRoute
                                  element={NewCreatePlan}
                                  requiredType="coach"
                                  isEdit={false}
                                />
                              }
                            />
                            <Route
                              path="/plans/edit-template/:planId"
                              element={
                                <PrivateRoute
                                  element={NewCreatePlan}
                                  requiredType="coach"
                                  isEdit={true}
                                />
                              }
                            />
                            <Route
                              path="/plans/edit/:planId"
                              element={
                                <PrivateRoute
                                  element={NewCreatePlan}
                                  requiredType="coach"
                                  isEdit={true}
                                />
                              }
                            />
                            <Route
                              path="/plans/:planId/:studentId"
                              element={
                                <PrivateRoute
                                  element={NewPlanDetail}
                                  requiredType="coach"
                                />
                              }
                            />
                            <Route
                              path="/students/:studentId/details"
                              element={
                                <PrivateRoute
                                  element={NewStudentDetails}
                                  requiredType="coach"
                                />
                              }
                            />
                            <Route
                              path="/manage-students"
                              element={
                                <PrivateRoute
                                  element={NewManageStudentsPage}
                                  requiredType="coach"
                                />
                              }
                            />
                            <Route
                              path="/client-dashboard/:clientId"
                              element={
                                <PrivateRoute
                                  element={NewClientDashboard}
                                  requiredType="coach"
                                />
                              }
                            />

                            <Route
                              path="/student"
                              element={
                                <PrivateRoute
                                  element={NewStudentHome}
                                  requiredType="client"
                                />
                              }
                            />
                            <Route
                              path="/student/profile"
                              element={
                                <PrivateRoute
                                  element={NewClientProfile}
                                  requiredType="client"
                                />
                              }
                            />
                            <Route
                              path="/plans/start-session/:planId"
                              element={
                                <PrivateRoute
                                  element={NewTrainingPlanDetails}
                                  requiredType="client"
                                />
                              }
                            />

                            <Route
                              path="/verify-email"
                              element={<VerifyEmail />}
                            />
                            <Route
                              path="/complete-coach-profile"
                              element={
                                <PrivateRoute element={CoachProfileForm} />
                              }
                            />
                            <Route
                              path="/forgot-password"
                              element={<ForgotPassword />}
                            />
                            <Route
                              path="/reset-password"
                              element={<ResetPassword />}
                            />
                            <Route
                              path="/not-subscribed"
                              element={<NotSubscribed />}
                            />

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

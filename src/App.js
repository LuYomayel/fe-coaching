import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import { PrimeReactProvider } from 'primereact/api';
import CoachHome from './pages/CoachHome.js';
import CreatePlan from './pages/CreatePlan';
import StudentDetails from './pages/StudentDetails';
import PlanDetails from './dialogs/PlanDetails.js';
import StudentHome from './pages/StudentHome.js';
import CoachProfile from './pages/CoachProfile.js';

import { ToastProvider } from './utils/ToastContext';
import { UserProvider } from './utils/UserContext.js';
import { ConfirmationDialogProvider } from './utils/ConfirmationDialogContext.js';
import { SpinnerProvider } from './utils/GlobalSpinner.js';
import Login from './auth/Login';

import Header from './components/Header.js';
import Unauthorized from './components/Unauthorized.js';
import PrivateRoute from './auth/PrivateRoute.js';
import TrainingPlanDetails from './pages/TrainingDetails.js';
import VerifyEmail from './auth/VerifyEmail.js';
import CoachProfileForm from './pages/CoachProfileForm.js';
import ForgotPassword from './auth/ForgotPassword.js';
import ResetPassword from './auth/ResetPassword.js';
import ManageStudents from './pages/ManageStudents.js';
import ClientProfile from './pages/StudentProfile.js';
const App = () => {
  return (
    <SpinnerProvider>
      <UserProvider>
        <ToastProvider>
          <ConfirmationDialogProvider>
            <Router>
              <Header/>
              <Routes>
                <Route path="/" element={< Login />} />
                <Route path="/login" element={< Login />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                <Route path="/coach" element={<PrivateRoute element={CoachHome} requiredType="coach"  />} />
                <Route path="/coach/profile" element={<PrivateRoute element={CoachProfile} requiredType="coach" />} />
                <Route path="/plans/create" element={<PrivateRoute element={CreatePlan} requiredType="coach" isEdit={false} />} />
                <Route path="/plans/edit/:planId" element={<PrivateRoute element={CreatePlan} requiredType="coach" isEdit={true} />} />
                <Route path="/plans/:planId/:studentId" element={<PrivateRoute element={PlanDetails} requiredType="coach" />} />
                <Route path="/students/:studentId/details" element={<PrivateRoute element={StudentDetails} requiredType="coach" />} />
                <Route path="/manage-students" element={<PrivateRoute element={ManageStudents} requiredType="coach" />} />

                <Route path="/student" element={<PrivateRoute element={StudentHome} requiredType="client" />} />
                <Route path="/student/profile" element={<PrivateRoute element={ClientProfile} requiredType="client" />} />
                <Route path="/plans/start-session/:planId" element={<PrivateRoute element={TrainingPlanDetails} requiredType="client" />} />

                <Route path="/verify-email"element={< VerifyEmail />} />
                <Route path="/complete-coach-profile" element={<CoachProfileForm />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Routes>
            </Router>
          </ConfirmationDialogProvider>
        </ToastProvider>
      </UserProvider>
    </SpinnerProvider>
  );
};

export default App;
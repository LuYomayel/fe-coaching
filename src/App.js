import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import { PrimeReactProvider } from 'primereact/api';
import CoachHome from './pages/CoachHome.js';
import CreatePlan from './pages/CreatePlan';
import StudentDetails from './pages/StudentDetails';
import PlanDetails from './dialogs/PlanDetails.js';
import StudentHome from './pages/StudentHome.js';

import { ToastProvider } from './utils/ToastContext';
import { UserProvider } from './utils/UserContext.js';

import Login from './auth/Login';

import Header from './components/Header.js';
import Unauthorized from './components/Unauthorized.js';
import PrivateRoute from './auth/PrivateRoute.js';
const App = () => {
  return (
    <UserProvider>
      <ToastProvider>
        <Router>
          <Header/>
          <Routes>
            <Route path="/" element={< Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route path="/coach" element={<PrivateRoute element={CoachHome} requiredType="coach" />} />
            <Route path="/plans/create" element={<PrivateRoute element={CreatePlan} requiredType="coach" isEdit={false} />} />
            <Route path="/plans/edit/:planId" element={<PrivateRoute element={CreatePlan} requiredType="coach" isEdit={true} />} />
            <Route path="/plans/:planId/:studentId" element={<PrivateRoute element={PlanDetails} requiredType="coach" />} />
            <Route path="/students/:studentId/details" element={<PrivateRoute element={StudentDetails} requiredType="coach" />} />

            <Route path="/student" element={<PrivateRoute element={StudentHome} requiredType="client" />} />
          </Routes>
        </Router>
      </ToastProvider>
    </UserProvider>
  );
};

export default App;
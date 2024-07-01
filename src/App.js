import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import { PrimeReactProvider } from 'primereact/api';
import Home from './pages/Home';
import CreatePlan from './pages/CreatePlan';
import StudentDetails from './pages/StudentDetails';
import PlanDetails from './pages/PlanDetails';
import { ToastProvider } from './utils/ToastContext';
import Login from './auth/Login.js';
const App = () => {
  return (
    <ToastProvider>
      <Router>
        <Routes>

          <Route path="/" element={< Login />} />
          <Route path="/coach" element={<Home />} />
          <Route path="/plans/create" element={<CreatePlan isEdit={false} />} />
          <Route path="/plans/edit/:planId" element={<CreatePlan isEdit={true} />} />
          <Route path="/plans/:planId/:studentId" element={<PlanDetails />} />
          <Route path="/students/:studentId/details" element={<StudentDetails />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
};

export default App;
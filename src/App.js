import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { PrimeReactProvider, PrimeReactContext } from 'primereact/api';
import Home from './pages/Home';
import CreatePlan from './pages/CreatePlan';
import StudentPlans from './pages/StudentPlans';
import PlanDetails from './pages/PlanDetails'
const App = () => {
  return (
    <PrimeReactProvider>
    <Router>
      <Routes>
        
        <Route path="/" element={<Home />} />
        
        <Route path="/plans/create-plan" element={<CreatePlan />} />
        <Route path="/plans/:planId/:studentId" element={<PlanDetails />} />

        <Route path="/students/:studentId/plans" element={<StudentPlans />} />

      </Routes>
    </Router>
    </PrimeReactProvider>
  );
};

export default App;
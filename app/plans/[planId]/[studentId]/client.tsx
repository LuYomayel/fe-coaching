'use client';
import React from 'react';
import PrivateRoute from '../../../../src/auth/PrivateRoute';
import TrainingPlanDetails from '../../../../src/pages/TrainingPlanDetails';

export default function TrainingPlanClient() {
  return <PrivateRoute element={TrainingPlanDetails} requiredType="student" />;
}

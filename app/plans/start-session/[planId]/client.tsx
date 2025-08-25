'use client';
import React from 'react';
import PrivateRoute from '../../../../src/auth/PrivateRoute';
import TrainingPlanDetails from '../../../../src/pages/TrainingPlanDetails';

export default function StartSessionClient() {
  return <PrivateRoute element={TrainingPlanDetails} requiredType="student" />;
}

'use client';
import React from 'react';
import PrivateRoute from '../../../src/auth/PrivateRoute';
import CreatePlan from '../../../src/pages/CreatePlan';

export default function CreateAndAssignPlanPage() {
  return <PrivateRoute element={CreatePlan} requiredType="coach" isEdit={true} />;
}

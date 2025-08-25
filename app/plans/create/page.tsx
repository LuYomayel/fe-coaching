'use client';
import React from 'react';
import PrivateRoute from '../../../src/auth/PrivateRoute';
import CreatePlan from '../../../src/pages/CreatePlan';

export default function CreatePlanPage() {
  return <PrivateRoute element={CreatePlan} requiredType="coach" isEdit={false} />;
}

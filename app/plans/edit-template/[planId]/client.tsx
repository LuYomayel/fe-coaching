'use client';
import React from 'react';
import PrivateRoute from '../../../../src/auth/PrivateRoute';
import CreatePlan from '../../../../src/pages/CreatePlan';

export default function EditTemplateClient() {
  return <PrivateRoute element={CreatePlan} requiredType="coach" />;
}

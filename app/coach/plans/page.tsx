'use client';
import React from 'react';
import PrivateRoute from '../../../src/auth/PrivateRoute';
import PlansPage from '../../../src/pages/PlansPage';

export default function CoachPlansPage() {
  return <PrivateRoute element={PlansPage} requiredType="coach" />;
}

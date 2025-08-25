'use client';
import React from 'react';
import PrivateRoute from '../../../src/auth/PrivateRoute';
import ClientDashboard from '../../../src/pages/ClientDashboard';

export default function ClientDashboardClient() {
  return <PrivateRoute element={ClientDashboard} requiredType="coach" />;
}

'use client';
import React from 'react';
import PrivateRoute from '../../../src/auth/PrivateRoute';
import ClientProfile from '../../../src/pages/ClientProfile';

export default function StudentProfilePage() {
  return <PrivateRoute element={ClientProfile} requiredType="client" />;
}

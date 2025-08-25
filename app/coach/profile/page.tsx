'use client';
import React from 'react';
import PrivateRoute from '../../../src/auth/PrivateRoute';
import CoachProfile from '../../../src/pages/CoachProfile';

export default function CoachProfilePage() {
  return <PrivateRoute element={CoachProfile} requiredType="coach" />;
}

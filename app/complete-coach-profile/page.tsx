'use client';
import React from 'react';
import PrivateRoute from '../../src/auth/PrivateRoute';
import CoachProfileForm from '../../src/pages/CoachProfileForm';

export default function CompleteCoachProfilePage() {
  return <PrivateRoute element={CoachProfileForm} requiredType="coach" />;
}

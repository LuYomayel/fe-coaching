'use client';
import React from 'react';
import PrivateRoute from '../../../../src/auth/PrivateRoute';
import StudentDetails from '../../../../src/pages/StudentDetails';

export default function StudentDetailsClient() {
  return <PrivateRoute element={StudentDetails} requiredType="coach" />;
}

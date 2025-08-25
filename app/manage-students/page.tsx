'use client';
import React from 'react';
import PrivateRoute from '../../src/auth/PrivateRoute';
import ManageStudentsPage from '../../src/pages/ManageStudents';

export default function ManageStudentsPageComponent() {
  return <PrivateRoute element={ManageStudentsPage} requiredType="coach" />;
}

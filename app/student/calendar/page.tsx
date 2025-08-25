'use client';
import React from 'react';
import PrivateRoute from '../../../src/auth/PrivateRoute';
import StudentCalendar from '../../../src/pages/StudentCalendar';

export default function StudentCalendarPage() {
  return <PrivateRoute element={StudentCalendar} requiredType="client" />;
}

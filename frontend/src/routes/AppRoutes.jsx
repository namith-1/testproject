import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import StudentDashboard from '../pages/StudentDashboard';
import InstructorDashboard from '../pages/InstructorDashboard';
import CourseEditor from '../pages/InstructorCourse/CourseEditor';
// import CourseViewer from '../pages/StudentCourse/CourseViewer'; // REMOVED: Now nested
import ProtectedRoute from '../components/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* STUDENT ROUTES - Note the '/*' for nested routing */}
      {/* This renders StudentDashboard, which handles all its sub-routes, including the Viewer. */}
      <Route 
        path="/student-dashboard/*" 
        element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* REMOVED DEDICATED ROUTE: /student-dashboard/courses/:courseId */}

      {/* INSTRUCTOR ROUTES */}
      <Route 
        path="/instructor-dashboard" 
        element={
          <ProtectedRoute allowedRole="teacher">
            <InstructorDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* CREATE COURSE (Instructor Only) */}
      <Route 
        path="/create-course" 
        element={
          <ProtectedRoute allowedRole="teacher">
            <CourseEditor />
          </ProtectedRoute>
        } 
      />
      
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
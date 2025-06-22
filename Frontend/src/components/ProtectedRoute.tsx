import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { authService } from '../services/auth';
import type { UserRole } from '../types/users';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true 
}) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const userRole = authService.getUserRole();

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && (!userRole || !allowedRoles.includes(userRole))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Public routes (accessible to everyone)
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedRoute requireAuth={false}>{children}</ProtectedRoute>;
};

// Auth routes (signin/signup - redirect if already authenticated)
export const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  const userRole = authService.getUserRole();

  if (isAuthenticated && userRole) {
    return <Navigate to={`/${userRole}`} replace />;
  }

  return <>{children}</>;
};

// Role-specific route components
export const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedRoute allowedRoles={['user']}>{children}</ProtectedRoute>;
};

export const VolunteerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedRoute allowedRoles={['volunteer']}>{children}</ProtectedRoute>;
};

export const FirstResponderRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedRoute allowedRoles={['first_responder']}>{children}</ProtectedRoute>;
};

export const GovernmentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedRoute allowedRoles={['government']}>{children}</ProtectedRoute>;
};

export const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedRoute allowedRoles={['first_responder', 'volunteer', 'user', 'government']}>{children}</ProtectedRoute>;
};
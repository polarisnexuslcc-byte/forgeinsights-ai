import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function RequireGuest({ children }) {
  const { isAuthenticated, booting } = useAuth();

  if (booting) {
    return <div className="screen-state">Cargando sesión...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/app/overview" replace />;
  }

  return children;
}

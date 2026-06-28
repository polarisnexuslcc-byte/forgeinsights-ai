import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from './auth/RequireAuth';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AppShell } from './pages/AppShell';
import { OverviewPage } from './pages/OverviewPage';
import { DashboardsPage } from './pages/DashboardsPage';
import { AlertsPage } from './pages/AlertsPage';
import { SourcesPage } from './pages/SourcesPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/signup',
    element: <SignupPage />
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/app/overview" replace /> },
      { path: 'overview', element: <OverviewPage /> },
      { path: 'dashboards', element: <DashboardsPage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'sources', element: <SourcesPage /> },
      { path: 'integrations', element: <IntegrationsPage /> }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]);

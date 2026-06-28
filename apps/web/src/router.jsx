import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from './auth/RequireAuth';
import { RequireGuest } from './auth/RequireGuest';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AppShell } from './pages/AppShell';
import { OverviewPage } from './pages/OverviewPage';
import { DashboardsPage } from './pages/DashboardsPage';
import { AlertsPage } from './pages/AlertsPage';
import { SourcesPage } from './pages/SourcesPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { QueryPage } from './pages/QueryPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />
  },
  {
    path: '/login',
    element: (
      <RequireGuest>
        <LoginPage />
      </RequireGuest>
    )
  },
  {
    path: '/signup',
    element: (
      <RequireGuest>
        <SignupPage />
      </RequireGuest>
    )
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
      { path: 'integrations', element: <IntegrationsPage /> },
      { path: 'query', element: <QueryPage /> }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]);

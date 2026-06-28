import { createBrowserRouter } from 'react-router-dom';
import { RequireAuth } from './auth/RequireAuth.jsx';
import { RequireGuest } from './auth/RequireGuest.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import AppShell from './pages/AppShell.jsx';
import OverviewPage from './pages/OverviewPage.jsx';
import SourcesPage from './pages/SourcesPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import IntegrationsPage from './pages/IntegrationsPage.jsx';
import DashboardsPage from './pages/DashboardsPage.jsx';
import QueryPage from './pages/QueryPage.jsx';
import InternalPage from './pages/InternalPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
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
      { index: true, element: <OverviewPage /> },
      { path: 'overview', element: <OverviewPage /> },
      { path: 'sources', element: <SourcesPage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'integrations', element: <IntegrationsPage /> },
      { path: 'dashboards', element: <DashboardsPage /> },
      { path: 'query', element: <QueryPage /> },
      { path: 'internal', element: <InternalPage /> }
    ]
  },
  { path: '*', element: <NotFoundPage /> }
]);

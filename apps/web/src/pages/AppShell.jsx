import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const navItems = [
  { to: '/app/overview', label: 'Overview' },
  { to: '/app/dashboards', label: 'Dashboards' },
  { to: '/app/alerts', label: 'Alerts' },
  { to: '/app/sources', label: 'Sources' },
  { to: '/app/integrations', label: 'Integrations' },
  { to: '/app/query', label: 'Query' }
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">ForgeInsights AI</div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' is-active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-box">
            <strong>{user?.name}</strong>
            <span>{user?.workspace || user?.email}</span>
          </div>

          <button className="btn btn-ghost btn-block" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

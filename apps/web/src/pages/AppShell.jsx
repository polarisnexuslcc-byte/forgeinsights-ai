import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const navItems = [
  { to: '/app/overview', label: 'Overview' },
  { to: '/app/dashboards', label: 'Dashboards' },
  { to: '/app/alerts', label: 'Alerts' },
  { to: '/app/sources', label: 'Sources' },
  { to: '/app/integrations', label: 'Integrations' }
];

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">StartTheNode</div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-box">
            <strong>{user?.name}</strong>
            <span>{user?.workspace}</span>
          </div>

          <button className="btn btn-ghost btn-block" onClick={logout}>
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

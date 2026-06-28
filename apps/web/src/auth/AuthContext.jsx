import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    async function bootstrapSession() {
      const token = window.localStorage.getItem('auth_token');

      if (!token) {
        setBooting(false);
        return;
      }

      try {
        const data = await apiFetch('/auth/me', { method: 'GET' });
        setUser(data.item.user);
      } catch (error) {
        window.localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setBooting(false);
      }
    }

    bootstrapSession();
  }, []);

  async function login({ email, password }) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    const token = data?.item?.token;
    const nextUser = data?.item?.user;

    if (!token || !nextUser) {
      throw new Error('Respuesta de login inválida');
    }

    window.localStorage.setItem('auth_token', token);
    setUser(nextUser);
  }

  async function signup({ name, email, password, workspace }) {
    const data = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, workspace })
    });

    const token = data?.item?.token;
    const nextUser = data?.item?.user;

    if (!token || !nextUser) {
      throw new Error('Respuesta de signup inválida');
    }

    window.localStorage.setItem('auth_token', token);
    setUser(nextUser);
  }

  async function logout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (_) {
    } finally {
      window.localStorage.removeItem('auth_token');
      setUser(null);
    }
  }

  const value = useMemo(() => ({
    user,
    booting,
    isAuthenticated: Boolean(user),
    login,
    signup,
    logout
  }), [user, booting]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}

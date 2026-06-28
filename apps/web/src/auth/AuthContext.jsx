import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  async function login({ email, password }) {
    if (!email || !password) {
      throw new Error('Email y contraseña son obligatorios');
    }

    setUser({
      id: 'demo-user',
      name: 'Demo User',
      email,
      workspace: 'Forge Lab'
    });
  }

  async function signup({ name, email, password, workspace }) {
    if (!name || !email || !password || !workspace) {
      throw new Error('Completa todos los campos');
    }

    setUser({
      id: 'demo-new-user',
      name,
      email,
      workspace
    });
  }

  function logout() {
    setUser(null);
  }

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    login,
    signup,
    logout
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}

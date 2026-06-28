import React from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">404</p>
        <h1>Página no encontrada</h1>
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    </main>
  );
}

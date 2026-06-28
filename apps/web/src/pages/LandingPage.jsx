import React from 'react';
import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <main className="landing">
      <header className="landing-header">
        <div className="brand">StartTheNode</div>

        <nav className="landing-nav">
          <Link to="/login" className="btn btn-ghost">Iniciar sesión</Link>
          <Link to="/signup" className="btn btn-primary">Crear cuenta</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Intelligence workspace</p>
          <h1>Convierte datos dispersos en decisiones accionables.</h1>
          <p className="hero-text">
            Unifica fuentes, detecta alertas y lleva tus equipos desde datos aislados
            hasta decisiones trazables en una sola plataforma.
          </p>

          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary">Crear workspace</Link>
            <Link to="/login" className="btn btn-secondary">Entrar</Link>
          </div>
        </div>

        <div className="hero-panel">
          <div className="mini-card">
            <span>Insights hoy</span>
            <strong>148</strong>
          </div>
          <div className="mini-card">
            <span>Fuentes conectadas</span>
            <strong>12</strong>
          </div>
          <div className="mini-card">
            <span>Cobertura trazable</span>
            <strong>97.4%</strong>
          </div>
        </div>
      </section>
    </main>
  );
}

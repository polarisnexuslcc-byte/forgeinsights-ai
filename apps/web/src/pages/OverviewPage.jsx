import React from 'react';

export function OverviewPage() {
  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Overview</p>
        <h1>Estado general del workspace</h1>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span>Insights hoy</span>
          <strong>148</strong>
          <small>+18% vs ayer</small>
        </article>

        <article className="stat-card">
          <span>Fuentes conectadas</span>
          <strong>12</strong>
          <small>CRM, ERP, Slack, web</small>
        </article>

        <article className="stat-card">
          <span>Cobertura trazable</span>
          <strong>97.4%</strong>
          <small>Con fuente verificable</small>
        </article>

        <article className="stat-card">
          <span>Alertas activas</span>
          <strong>23</strong>
          <small>5 requieren revisión</small>
        </article>
      </div>
    </section>
  );
}

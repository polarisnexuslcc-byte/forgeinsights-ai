import React from 'react';
import { useAsyncData } from '../lib/query';
import { getDashboardSummary } from '../services/dashboards';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlocks';

export function DashboardsPage() {
  const { data, loading, error, refetch } = useAsyncData(
    async () => {
      const response = await getDashboardSummary();
      return response.item;
    },
    []
  );

  if (loading) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">Dashboards</p>
          <h1>Métricas y actividad</h1>
        </div>
        <LoadingBlock title="Cargando dashboard" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">Dashboards</p>
          <h1>Métricas y actividad</h1>
        </div>
        <ErrorBlock message={error} onRetry={refetch} />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">Dashboards</p>
          <h1>Métricas y actividad</h1>
        </div>
        <EmptyBlock
          title="Sin datos de dashboard"
          description="Cuando el sistema tenga actividad aparecerán aquí tus métricas clave."
        />
      </section>
    );
  }

  const kpis = [
    ['Documentos totales', data.kpis?.totalDocuments ?? 0],
    ['Documentos procesados', data.kpis?.processedDocuments ?? 0],
    ['Fuentes activas', data.kpis?.activeSources ?? 0],
    ['Alertas activas', data.kpis?.activeAlerts ?? 0],
    ['Cobertura', (data.kpis?.coverage ?? 0) + '%']
  ];

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Dashboards</p>
        <h1>Métricas y actividad</h1>
      </div>

      <div className="stats-grid">
        {kpis.map(([label, value]) => (
          <article key={label} className="stat-card">
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="two-column-grid">
        <div className="panel-card">
          <h2 className="section-title">Actividad reciente</h2>
          {data.activity?.length ? (
            <div className="list-block">
              {data.activity.map((row) => (
                <div key={row.label} className="list-row">
                  <strong>{row.label}</strong>
                  <div className="list-meta-inline">
                    <span>{row.documents} docs</span>
                    <span>{row.alerts} alerts</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-copy">Sin actividad reciente.</p>
          )}
        </div>

        <div className="panel-card">
          <h2 className="section-title">Top sources</h2>
          {data.topSources?.length ? (
            <div className="list-block">
              {data.topSources.map((source) => (
                <div key={source.id} className="list-row">
                  <div>
                    <strong>{source.name}</strong>
                    <p>{source.documents} documentos</p>
                  </div>
                  <span className={'pill pill-' + (source.status || 'info')}>
                    {source.status || 'unknown'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-copy">Sin fuentes destacadas.</p>
          )}
        </div>
      </div>

      <div className="panel-card">
        <h2 className="section-title">Documentos recientes</h2>
        {data.recentDocuments?.length ? (
          <div className="list-block">
            {data.recentDocuments.map((doc) => (
              <div key={doc.id} className="list-row">
                <div>
                  <strong>{doc.title}</strong>
                </div>
                <span className={'pill pill-' + (doc.status || 'info')}>
                  {doc.status || 'unknown'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted-copy">Sin documentos recientes.</p>
        )}
      </div>
    </section>
  );
}

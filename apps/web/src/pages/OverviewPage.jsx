import React from 'react';
import { useAsyncData } from '../lib/query';
import { getOverview } from '../services/overview';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlocks';

export function OverviewPage() {
  const { data, loading, error, refetch } = useAsyncData(
    async () => {
      const response = await getOverview();
      return response.item;
    },
    []
  );

  if (loading) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">Overview</p>
          <h1>Estado general del workspace</h1>
        </div>
        <LoadingBlock title="Cargando overview" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">Overview</p>
          <h1>Estado general del workspace</h1>
        </div>
        <ErrorBlock message={error} onRetry={refetch} />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">Overview</p>
          <h1>Estado general del workspace</h1>
        </div>
        <EmptyBlock
          title="Sin datos todavía"
          description="Conecta fuentes o sube documentos para empezar a generar métricas."
        />
      </section>
    );
  }

  const stats = [
    {
      label: 'Insights hoy',
      value: data.insightsToday ?? 0,
      help: data.insightsTrend ?? 'Sin tendencia'
    },
    {
      label: 'Fuentes conectadas',
      value: data.connectedSources ?? 0,
      help: data.sourcesSummary ?? 'Sin fuentes conectadas'
    },
    {
      label: 'Cobertura trazable',
      value: data.traceabilityCoverage ?? '0%',
      help: 'Con fuente verificable'
    },
    {
      label: 'Alertas activas',
      value: data.activeAlerts ?? 0,
      help: data.alertsSummary ?? 'Sin alertas'
    }
  ];

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Overview</p>
        <h1>Estado general del workspace</h1>
      </div>

      <div className="stats-grid">
        {stats.map((item) => (
          <article key={item.label} className="stat-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.help}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

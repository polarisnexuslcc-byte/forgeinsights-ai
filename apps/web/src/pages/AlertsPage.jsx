import React from 'react';
import { useAsyncData } from '../lib/query';
import { listAlerts } from '../services/alerts';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlocks';

export function AlertsPage() {
  const { data, loading, error, refetch } = useAsyncData(
    async () => {
      const response = await listAlerts();
      return response.items || [];
    },
    []
  );

  if (loading) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">Alerts</p>
          <h1>Alertas y seguimiento</h1>
        </div>
        <LoadingBlock title="Cargando alertas" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">Alerts</p>
          <h1>Alertas y seguimiento</h1>
        </div>
        <ErrorBlock message={error} onRetry={refetch} />
      </section>
    );
  }

  if (!data?.length) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">Alerts</p>
          <h1>Alertas y seguimiento</h1>
        </div>
        <EmptyBlock
          title="Sin alertas activas"
          description="Cuando el sistema detecte incidencias o cambios relevantes aparecerán aquí."
        />
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Alerts</p>
        <h1>Alertas y seguimiento</h1>
      </div>

      <div className="panel-card">
        <div className="list-block">
          {data.map((alert) => (
            <div key={alert.id} className="list-row list-row-stack">
              <div>
                <strong>{alert.title}</strong>
                <p>{alert.message || 'Sin detalle adicional'}</p>
              </div>
              <div className="list-meta">
                <span className={'pill pill-' + (alert.severity || 'info')}>
                  {alert.severity || 'info'}
                </span>
                <span className="muted-copy">{alert.createdAt || ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

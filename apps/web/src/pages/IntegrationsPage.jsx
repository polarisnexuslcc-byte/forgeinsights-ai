import React from 'react';
import { useAsyncData } from '../lib/query';
import { listIntegrations } from '../services/integrations';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlocks';

export function IntegrationsPage() {
  const { data, loading, error, refetch } = useAsyncData(
    async () => {
      const response = await listIntegrations();
      return response.items || [];
    },
    []
  );

  if (loading) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">Integrations</p>
          <h1>Conectores y sincronización</h1>
        </div>
        <LoadingBlock title="Cargando integraciones" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">Integrations</p>
          <h1>Conectores y sincronización</h1>
        </div>
        <ErrorBlock message={error} onRetry={refetch} />
      </section>
    );
  }

  if (!data.length) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">Integrations</p>
          <h1>Conectores y sincronización</h1>
        </div>
        <EmptyBlock
          title="No hay integraciones todavía"
          description="Cuando conectes herramientas externas aparecerán aquí con su estado."
        />
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Integrations</p>
        <h1>Conectores y sincronización</h1>
      </div>

      <div className="integration-grid">
        {data.map((integration) => (
          <article key={integration.id} className="panel-card integration-card">
            <div className="integration-top">
              <div>
                <strong>{integration.name}</strong>
                <p className="muted-copy">{integration.type || 'Connector'}</p>
              </div>
              <span className={'pill pill-' + (integration.status || 'info')}>
                {integration.status || 'unknown'}
              </span>
            </div>

            <div className="integration-meta">
              <div>
                <span className="meta-label">Última sync</span>
                <strong>{integration.lastSyncedAt || 'Nunca'}</strong>
              </div>
              <div>
                <span className="meta-label">Registros</span>
                <strong>{integration.recordsCount ?? 0}</strong>
              </div>
            </div>

            <p className="muted-copy">
              {integration.description || 'Sin descripción disponible.'}
            </p>

            <div className="integration-actions">
              <button className="btn btn-secondary" type="button">
                Ver detalle
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

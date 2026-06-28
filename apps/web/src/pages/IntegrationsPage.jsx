import React, { useState } from 'react';
import { useAsyncData } from '../lib/query';
import { listIntegrations } from '../services/integrations';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlocks';

export function IntegrationsPage() {
  const [selectedId, setSelectedId] = useState(null);

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

  const selected =
    data.find((integration) => integration.id === selectedId) || data[0];

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Integrations</p>
        <h1>Conectores y sincronización</h1>
      </div>

      <div className="integration-layout">
        <div className="panel-card">
          <h2 className="section-title">Conectores</h2>
          <div className="list-block">
            {data.map((integration) => (
              <button
                key={integration.id}
                type="button"
                className={'integration-row-button' + (selected?.id === integration.id ? ' integration-row-button-active' : '')}
                onClick={() => setSelectedId(integration.id)}
              >
                <div>
                  <strong>{integration.name}</strong>
                  <p>{integration.type || 'Connector'}</p>
                </div>
                <span className={'pill pill-' + (integration.status || 'info')}>
                  {integration.status || 'unknown'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel-card">
          <h2 className="section-title">Detalle</h2>
          <div className="integration-detail">
            <div>
              <span className="meta-label">Nombre</span>
              <strong>{selected.name}</strong>
            </div>
            <div>
              <span className="meta-label">Tipo</span>
              <strong>{selected.type || 'Connector'}</strong>
            </div>
            <div>
              <span className="meta-label">Estado</span>
              <strong>{selected.status || 'unknown'}</strong>
            </div>
            <div>
              <span className="meta-label">Última sync</span>
              <strong>{selected.lastSyncedAt || 'Nunca'}</strong>
            </div>
            <div>
              <span className="meta-label">Registros</span>
              <strong>{selected.recordsCount ?? 0}</strong>
            </div>
            <div>
              <span className="meta-label">Errores recientes</span>
              <strong>{selected.recentErrors ?? 0}</strong>
            </div>
          </div>

          <p className="muted-copy">
            {selected.description || 'Sin descripción disponible.'}
          </p>
        </div>
      </div>
    </section>
  );
}

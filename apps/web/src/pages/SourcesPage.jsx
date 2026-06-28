import React from 'react';
import { useAsyncData } from '../lib/query';
import { listSources, listDocuments } from '../services/sources';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlocks';

export function SourcesPage() {
  const { data, loading, error, refetch } = useAsyncData(
    async () => {
      const [sourcesRes, docsRes] = await Promise.all([
        listSources(),
        listDocuments()
      ]);

      return {
        sources: sourcesRes.items || [],
        documents: docsRes.items || []
      };
    },
    []
  );

  if (loading) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">Sources</p>
          <h1>Fuentes conectadas</h1>
        </div>
        <LoadingBlock title="Cargando fuentes" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">Sources</p>
          <h1>Fuentes conectadas</h1>
        </div>
        <ErrorBlock message={error} onRetry={refetch} />
      </section>
    );
  }

  const sources = data?.sources || [];
  const documents = data?.documents || [];

  if (!sources.length && !documents.length) {
    return (
      <section className="page">
        <div className="page-header">
          <p className="eyebrow">Sources</p>
          <h1>Fuentes conectadas</h1>
        </div>
        <EmptyBlock
          title="Todavía no hay fuentes"
          description="Conecta un origen o sube tu primer documento para empezar."
        />
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Sources</p>
        <h1>Fuentes conectadas</h1>
      </div>

      <div className="two-column-grid">
        <div className="panel-card">
          <h2 className="section-title">Fuentes</h2>
          {sources.length ? (
            <div className="list-block">
              {sources.map((source) => (
                <div key={source.id} className="list-row">
                  <div>
                    <strong>{source.name}</strong>
                    <p>{source.type || 'Sin tipo'}</p>
                  </div>
                  <span className="pill">{source.status || 'unknown'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-copy">No hay fuentes configuradas.</p>
          )}
        </div>

        <div className="panel-card">
          <h2 className="section-title">Documentos</h2>
          {documents.length ? (
            <div className="list-block">
              {documents.map((doc) => (
                <div key={doc.id} className="list-row">
                  <div>
                    <strong>{doc.title}</strong>
                    <p>{doc.mimeType || 'Documento'}</p>
                  </div>
                  <span className="pill">{doc.status || 'pending'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-copy">No hay documentos cargados.</p>
          )}
        </div>
      </div>
    </section>
  );
}

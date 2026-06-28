import React from 'react';

export function CitationList({ citations, activeCitationId }) {
  if (!citations?.length) {
    return null;
  }

  return (
    <div className="citation-list">
      <h3 className="section-title">Fuentes usadas</h3>
      <div className="list-block">
        {citations.map((citation) => (
          <article
            key={citation.id}
            className={'citation-card' + (String(activeCitationId) === String(citation.id) ? ' citation-card-active' : '')}
          >
            <div className="citation-card-top">
              <strong>
                [{citation.id}] {citation.label}
              </strong>
              <span className="pill">{citation.section || 'Referencia'}</span>
            </div>
            <p className="muted-copy">{citation.excerpt || 'Sin extracto disponible.'}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

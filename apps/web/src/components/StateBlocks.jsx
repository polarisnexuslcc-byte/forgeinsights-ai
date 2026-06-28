import React from 'react';

export function LoadingBlock({ title = 'Cargando...' }) {
  return (
    <div className="state-block">
      <strong>{title}</strong>
      <p>Espera un momento mientras traemos los datos.</p>
    </div>
  );
}

export function ErrorBlock({ message, onRetry }) {
  return (
    <div className="state-block state-block-error">
      <strong>No se pudo cargar</strong>
      <p>{message}</p>
      {onRetry ? (
        <button className="btn btn-secondary" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

export function EmptyBlock({ title, description, action }) {
  return (
    <div className="state-block">
      <strong>{title}</strong>
      <p>{description}</p>
      {action || null}
    </div>
  );
}

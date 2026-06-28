import React from 'react';

export function CitationText({ text, onCitationClick }) {
  if (!text) return null;

  const parts = text.split(/(\[\d+\])/g);

  return (
    <p className="answer-text">
      {parts.map((part, index) => {
        const match = part.match(/^\[(\d+)\]$/);

        if (!match) {
          return <React.Fragment key={index}>{part}</React.Fragment>;
        }

        const citationId = match[1];

        return (
          <button
            key={index}
            type="button"
            className="citation-badge"
            onClick={() => onCitationClick?.(citationId)}
          >
            [{citationId}]
          </button>
        );
      })}
    </p>
  );
}

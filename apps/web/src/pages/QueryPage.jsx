import React, { useMemo, useState } from 'react';
import { sendChatQuery } from '../services/chat';
import { CitationText } from '../components/CitationText';
import { CitationList } from '../components/CitationList';
import { EmptyBlock } from '../components/StateBlocks';

export function QueryPage() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeCitationId, setActiveCitationId] = useState(null);

  const latestAssistantMessage = useMemo(() => {
    return [...messages].reverse().find((message) => message.role === 'assistant') || null;
  }, [messages]);

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanQuestion = question.trim();
    if (!cleanQuestion || submitting) {
      return;
    }

    setError('');

    const nextUserMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: cleanQuestion
    };

    setMessages((current) => [...current, nextUserMessage]);
    setQuestion('');
    setSubmitting(true);

    try {
      const response = await sendChatQuery({
        question: cleanQuestion,
        history: messages.map((message) => ({
          role: message.role,
          content: message.content
        }))
      });

      const item = response?.item || {};
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: item.answer || 'No se recibió respuesta.',
        citations: item.citations || []
      };

      setMessages((current) => [...current, assistantMessage]);
      setActiveCitationId(null);
    } catch (err) {
      setError(err.message || 'No se pudo procesar la consulta');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Query</p>
        <h1>Pregunta a tu base de conocimiento</h1>
      </div>

      <div className="query-layout">
        <div className="panel-card">
          {!messages.length ? (
            <EmptyBlock
              title="Todavía no hay conversación"
              description="Haz una pregunta concreta sobre documentos, políticas, fuentes o actividad del workspace."
            />
          ) : (
            <div className="chat-thread">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={'chat-message chat-message-' + message.role}
                >
                  <div className="chat-role">
                    {message.role === 'user' ? 'Tú' : 'Assistant'}
                  </div>

                  {message.role === 'assistant' ? (
                    <CitationText
                      text={message.content}
                      onCitationClick={setActiveCitationId}
                    />
                  ) : (
                    <p className="answer-text">{message.content}</p>
                  )}
                </article>
              ))}
            </div>
          )}

          <form className="chat-form" onSubmit={handleSubmit}>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ej. ¿Qué documentos mencionan revisión trimestral de riesgos?"
              rows={4}
              disabled={submitting}
            />
            <div className="chat-actions">
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Consultando...' : 'Enviar pregunta'}
              </button>
            </div>
          </form>

          {error ? <div className="upload-feedback upload-feedback-error">{error}</div> : null}
        </div>

        <div className="panel-card">
          <CitationList
            citations={latestAssistantMessage?.citations || []}
            activeCitationId={activeCitationId}
          />
        </div>
      </div>
    </section>
  );
}

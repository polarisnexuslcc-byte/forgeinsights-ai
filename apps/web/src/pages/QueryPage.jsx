import { useState, useRef, useCallback } from 'react';
import { CitationList } from '../components/CitationList.jsx';
import { CitationText } from '../components/CitationText.jsx';
import { streamQuery } from '../services/stream.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let msgCounter = 0;
function nextId() { return 'msg-' + (++msgCounter); }

const STAGE_LABELS = {
  retrieval: 'Buscando en documentos...',
  generation: 'Generando respuesta...'
};

const REASON_OPTIONS = [
  'No respondió la pregunta',
  'Las fuentes no eran correctas',
  'Faltaba contexto',
  'Otro'
];

async function sendAnswerFeedback({ queryLogId, question, answerPreview, vote, reason }) {
  const token = localStorage.getItem('auth_token') || '';
  try {
    await fetch(API_BASE_URL + '/feedback/answers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ queryLogId, question, answerPreview, vote, reason: reason || null })
    });
  } catch (_) {}
}

function FeedbackWidget({ msgId, question, answerPreview, queryLogId }) {
  const [vote, setVote] = useState(null);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);

  const handleVote = async (v) => {
    if (sent) return;
    setVote(v);
    if (v === 'up') {
      await sendAnswerFeedback({ queryLogId, question, answerPreview, vote: 'up', reason: null });
      setSent(true);
    } else {
      setShowReason(true);
    }
  };

  const handleSendDown = async () => {
    await sendAnswerFeedback({ queryLogId, question, answerPreview, vote: 'down', reason: reason || null });
    setSent(true);
    setShowReason(false);
  };

  if (sent) {
    return <div className="feedback-sent">Gracias por tu feedback</div>;
  }

  return (
    <div className="feedback-widget">
      {!showReason && (
        <div className="feedback-buttons">
          <button
            className={'feedback-btn' + (vote === 'up' ? ' feedback-btn-active' : '')}
            onClick={() => handleVote('up')}
            title="Respuesta util"
          >
            Util
          </button>
          <button
            className={'feedback-btn feedback-btn-down' + (vote === 'down' ? ' feedback-btn-active' : '')}
            onClick={() => handleVote('down')}
            title="Respuesta no util"
          >
            No util
          </button>
        </div>
      )}
      {showReason && (
        <div className="feedback-reason-box">
          <p className="feedback-reason-label">Que fallo?</p>
          <div className="feedback-reason-options">
            {REASON_OPTIONS.map(opt => (
              <button
                key={opt}
                className={'feedback-reason-opt' + (reason === opt ? ' feedback-reason-opt-active' : '')}
                onClick={() => setReason(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="feedback-reason-actions">
            <button className="feedback-send" onClick={handleSendDown}>Enviar</button>
            <button className="feedback-skip" onClick={() => { setSent(true); setShowReason(false); }}>Omitir</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QueryPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [stage, setStage] = useState(null);
  const [error, setError] = useState(null);
  const [activeCitationId, setActiveCitationId] = useState(null);

  const cancelRef = useRef(null);
  const threadRef = useRef(null);

  const latestAssistantMsg = messages.filter(m => m.role === 'assistant').slice(-1)[0] || null;

  const handleSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    const question = input.trim();
    if (!question || streaming) return;

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const userMsg = { id: nextId(), role: 'user', content: question, citations: [] };
    const assistantId = nextId();
    const assistantMsg = {
      id: assistantId,
      role: 'assistant',
      content: '',
      citations: [],
      streaming: true,
      question,
      queryLogId: null
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setError(null);
    setStreaming(true);
    setStage(null);
    setActiveCitationId(null);

    const cancel = streamQuery(
      { question, history },
      {
        onEvent: ({ event, data }) => {
          if (event === 'status') {
            setStage(data.stage || null);
          } else if (event === 'token') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId
                ? Object.assign({}, m, { content: m.content + (data.text || '') })
                : m
            ));
          } else if (event === 'citations') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId
                ? Object.assign({}, m, { citations: data.items || [] })
                : m
            ));
          } else if (event === 'meta') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId
                ? Object.assign({}, m, { queryLogId: data.queryLogId || null })
                : m
            ));
          } else if (event === 'done' || event === 'error') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId
                ? Object.assign({}, m, { streaming: false })
                : m
            ));
            setStreaming(false);
            setStage(null);
            if (event === 'error') setError(data.message || 'Error en la respuesta');
          }
        },
        onError: (msg) => {
          setError(msg || 'Error de red');
          setMessages(prev => prev.map(m =>
            m.id === assistantId
              ? Object.assign({}, m, { streaming: false, content: m.content || '[Error al generar respuesta]' })
              : m
          ));
          setStreaming(false);
          setStage(null);
        }
      }
    );

    cancelRef.current = cancel;
  }, [input, streaming, messages]);

  const handleStop = () => {
    if (cancelRef.current) { cancelRef.current(); cancelRef.current = null; }
    setStreaming(false);
    setStage(null);
    setMessages(prev => prev.map(m => m.streaming ? Object.assign({}, m, { streaming: false }) : m));
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div className="query-layout">
      <div className="query-left">
        <div className="chat-thread" ref={threadRef}>
          {messages.length === 0 && (
            <div className="chat-empty"><p>Haz una pregunta sobre tus documentos.</p></div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={'chat-message chat-message-' + msg.role}>
              <div className="chat-role">{msg.role === 'user' ? 'Tu' : 'ForgeInsights AI'}</div>
              <div className="answer-text">
                {msg.role === 'assistant' ? (
                  <CitationText
                    text={msg.content || (msg.streaming ? '' : '[Sin respuesta]')}
                    onCitationClick={setActiveCitationId}
                  />
                ) : (
                  msg.content
                )}
                {msg.streaming && <span className="stream-cursor">|</span>}
              </div>
              {msg.role === 'assistant' && !msg.streaming && msg.content && (
                <FeedbackWidget
                  msgId={msg.id}
                  question={msg.question || ''}
                  answerPreview={(msg.content || '').slice(0, 300)}
                  queryLogId={msg.queryLogId}
                />
              )}
            </div>
          ))}
          {stage && (
            <div className="chat-status-bar">
              <span className="chat-spinner" /> {STAGE_LABELS[stage] || stage}
            </div>
          )}
        </div>

        {error && <div className="chat-error-bar">{error}</div>}

        <form className="chat-form" onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Escribe tu pregunta... (Enter para enviar, Shift+Enter nueva linea)"
            disabled={streaming}
            rows={3}
          />
          <div className="chat-actions">
            {streaming ? (
              <button type="button" className="btn-stop" onClick={handleStop}>Detener</button>
            ) : (
              <button type="submit" disabled={!input.trim()}>Enviar</button>
            )}
          </div>
        </form>
      </div>

      <div className="query-right">
        {latestAssistantMsg && latestAssistantMsg.citations && latestAssistantMsg.citations.length > 0 ? (
          <CitationList
            citations={latestAssistantMsg.citations}
            activeCitationId={activeCitationId}
            onCitationClick={setActiveCitationId}
          />
        ) : (
          <div className="citations-empty">
            <p>Las fuentes apareceran aqui cuando se genere una respuesta.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import {
  createDocument,
  uploadDocumentFile,
  ingestDocument,
  getDocument
} from '../services/documents';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown'
];

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollDocumentStatus(documentId, maxAttempts) {
  const attempts = maxAttempts || 12;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await getDocument(documentId);
    const item = response?.item;

    if (item?.status === 'processed') {
      return item;
    }

    if (item?.status === 'failed') {
      throw new Error('El procesamiento del documento falló');
    }

    await sleep(1500);
  }

  return null;
}

export function DocumentUploadCard({ onUploaded }) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState('idle');
  const [message, setMessage] = useState('');
  const [processingHint, setProcessingHint] = useState('');

  const fileInfo = useMemo(() => {
    if (!file) return '';
    return file.name + ' · ' + formatBytes(file.size);
  }, [file]);

  function resetFeedback() {
    setMessage('');
    setProcessingHint('');
    setStage('idle');
  }

  function handleFileChange(event) {
    const nextFile = event.target.files?.[0] || null;
    resetFeedback();

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      setFile(null);
      setStage('error');
      setMessage('Tipo de archivo no soportado. Usa PDF, DOCX, TXT o MD.');
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      setStage('error');
      setMessage('El archivo supera el límite de 15 MB.');
      return;
    }

    setFile(nextFile);

    if (!title.trim()) {
      const cleanName = nextFile.name.replace(/\.[^/.]+$/, '');
      setTitle(cleanName);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setStage('error');
      setMessage('Añade un título para el documento.');
      return;
    }

    if (!file) {
      setStage('error');
      setMessage('Selecciona un archivo antes de subirlo.');
      return;
    }

    setSubmitting(true);
    setStage('creating');
    setMessage('Creando documento...');

    try {
      const created = await createDocument({
        title: title.trim(),
        type: 'file'
      });

      const documentId = created?.item?.id;
      if (!documentId) {
        throw new Error('No se pudo crear el documento');
      }

      setStage('uploading');
      setMessage('Subiendo archivo...');
      await uploadDocumentFile(documentId, file);

      setStage('processing');
      setMessage('Procesando documento...');
      setProcessingHint('Analizando contenido y preparando extracción.');
      await ingestDocument(documentId);

      const finalDocument = await pollDocumentStatus(documentId);

      if (finalDocument?.status === 'processed') {
        setStage('success');
        setMessage('Documento subido y procesado correctamente.');
        setProcessingHint('');
      } else {
        setStage('success');
        setMessage('Documento enviado. El procesamiento sigue en segundo plano.');
        setProcessingHint('Puedes revisar el estado en la lista de documentos.');
      }

      setTitle('');
      setFile(null);

      if (typeof onUploaded === 'function') {
        await onUploaded();
      }
    } catch (error) {
      setStage('error');
      setMessage(error.message || 'No se pudo completar la subida');
      setProcessingHint('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="panel-card">
      <div className="panel-card-header">
        <div>
          <p className="eyebrow">Upload</p>
          <h2 className="section-title">Subir documento</h2>
        </div>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Título</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Política de riesgos Q3"
            disabled={submitting}
          />
        </label>

        <label className="field">
          <span>Archivo</span>
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={handleFileChange}
            disabled={submitting}
          />
        </label>

        {fileInfo ? <p className="muted-copy">{fileInfo}</p> : null}

        <div className="upload-actions">
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Procesando...' : 'Subir documento'}
          </button>
        </div>

        {message ? (
          <div className={'upload-feedback upload-feedback-' + stage}>
            <div>
              <div>{message}</div>
              {processingHint ? <small>{processingHint}</small> : null}
            </div>
          </div>
        ) : null}
      </form>
    </article>
  );
}

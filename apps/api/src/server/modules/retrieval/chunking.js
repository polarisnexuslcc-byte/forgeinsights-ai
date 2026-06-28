import crypto from 'crypto';

function normalizeText(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function estimateTokens(text) {
  return Math.ceil(String(text || '').split(/\s+/).filter(Boolean).length * 1.3);
}

export function chunkText({
  organizationId,
  documentId,
  documentVersionId,
  text,
  targetWords = 220,
  overlapWords = 40
}) {
  const clean = normalizeText(text);
  if (!clean) return [];

  const paragraphs = clean.split(/\n\s*\n/).filter(Boolean);
  const chunks = [];

  let buffer = [];
  let bufferWords = [];

  function flushChunk() {
    if (!buffer.length) return;

    const content = buffer.join('\n\n').trim();
    const chunkIndex = chunks.length;
    const id = crypto.randomUUID();

    chunks.push({
      id,
      organizationId,
      documentId,
      documentVersionId,
      chunkIndex,
      content,
      tokenCount: estimateTokens(content),
      sectionLabel: null,
      pageLabel: null,
      lexicalText: content
    });

    const mergedWords = content.split(/\s+/).filter(Boolean);
    bufferWords = mergedWords.slice(Math.max(0, mergedWords.length - overlapWords));
    buffer = bufferWords.length ? [bufferWords.join(' ')] : [];
  }

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);

    if ((buffer.join(' ').split(/\s+/).filter(Boolean).length + words.length) > targetWords && buffer.length) {
      flushChunk();
    }

    buffer.push(paragraph);
  }

  flushChunk();

  return chunks;
}

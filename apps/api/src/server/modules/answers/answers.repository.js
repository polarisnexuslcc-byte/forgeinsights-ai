import { db } from '../../db/index.js';

export function getChunkByIds(chunkIds) {
  if (!chunkIds.length) return [];

  const placeholders = chunkIds.map(() => '?').join(',');

  return db.prepare(`
    SELECT
      document_chunks.id,
      document_chunks.organization_id as organizationId,
      document_chunks.document_id as documentId,
      document_chunks.document_version_id as documentVersionId,
      document_chunks.chunk_index as chunkIndex,
      document_chunks.content,
      document_chunks.token_count as tokenCount,
      document_chunks.char_count as charCount,
      documents.title as documentTitle
    FROM document_chunks
    INNER JOIN documents ON documents.id = document_chunks.document_id
    WHERE document_chunks.id IN (${placeholders})
  `).all(...chunkIds);
}

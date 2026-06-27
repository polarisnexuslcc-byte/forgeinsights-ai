import crypto from 'crypto';
import { db } from '../../db/index.js';

export function deleteChunksByVersion(documentVersionId) {
  db.prepare(`
    DELETE FROM document_chunks
    WHERE document_version_id = ?
  `).run(documentVersionId);

  db.prepare(`
    DELETE FROM document_chunks_fts
    WHERE document_version_id = ?
  `).run(documentVersionId);
}

export function insertChunks({ organizationId, documentId, documentVersionId, chunks }) {
  const now = new Date().toISOString();

  const insertChunkStmt = db.prepare(`
    INSERT INTO document_chunks (
      id,
      organization_id,
      document_id,
      document_version_id,
      chunk_index,
      content,
      token_count,
      char_count,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFtsStmt = db.prepare(`
    INSERT INTO document_chunks_fts (
      chunk_id,
      organization_id,
      document_id,
      document_version_id,
      content
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (const chunk of chunks) {
      const id = crypto.randomUUID();

      insertChunkStmt.run(
        id,
        organizationId,
        documentId,
        documentVersionId,
        chunk.chunkIndex,
        chunk.content,
        chunk.tokenCount,
        chunk.charCount,
        now
      );

      insertFtsStmt.run(
        id,
        organizationId,
        documentId,
        documentVersionId,
        chunk.content
      );
    }
  });

  transaction();
}

export function searchChunks({ organizationId, query, limit = 5 }) {
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
      documents.title as documentTitle,
      bm25(document_chunks_fts) as score,
      snippet(document_chunks_fts, 4, '<mark>', '</mark>', ' … ', 24) as snippet
    FROM document_chunks_fts
    INNER JOIN document_chunks
      ON document_chunks.id = document_chunks_fts.chunk_id
    INNER JOIN documents
      ON documents.id = document_chunks.document_id
    WHERE document_chunks_fts.organization_id = ?
      AND document_chunks_fts MATCH ?
    ORDER BY bm25(document_chunks_fts)
    LIMIT ?
  `).all(organizationId, query, limit);
}

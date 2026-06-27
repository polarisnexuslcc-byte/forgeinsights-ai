import { chunkText } from './chunker.js';
import { deleteChunksByVersion, insertChunks } from './retrieval.repository.js';

export function indexDocumentText({
  organizationId,
  documentId,
  documentVersionId,
  extractedText
}) {
  const chunks = chunkText(extractedText, {
    chunkSize: 1200,
    overlap: 200
  });

  deleteChunksByVersion(documentVersionId);

  if (chunks.length > 0) {
    insertChunks({
      organizationId,
      documentId,
      documentVersionId,
      chunks
    });
  }

  return {
    chunkCount: chunks.length,
    totalChars: chunks.reduce((sum, chunk) => sum + chunk.charCount, 0),
    totalTokens: chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0)
  };
}

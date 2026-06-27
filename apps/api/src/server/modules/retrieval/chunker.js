export function chunkText(text, options = {}) {
  const normalized = String(text || '').trim();

  if (!normalized) {
    return [];
  }

  const chunkSize = Number(options.chunkSize || 1200);
  const overlap = Number(options.overlap || 200);

  if (overlap >= chunkSize) {
    throw new Error('overlap must be smaller than chunkSize');
  }

  const chunks = [];
  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);

    if (end < normalized.length) {
      const boundary = normalized.lastIndexOf('\n', end);
      const spaceBoundary = normalized.lastIndexOf(' ', end);
      const bestBoundary = Math.max(boundary, spaceBoundary);

      if (bestBoundary > start + 200) {
        end = bestBoundary;
      }
    }

    const content = normalized.slice(start, end).trim();

    if (content) {
      chunks.push({
        chunkIndex: index,
        content,
        charCount: content.length,
        tokenCount: content.split(/\s+/).filter(Boolean).length
      });

      index += 1;
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

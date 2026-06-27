import fs from 'fs';
import path from 'path';

export function scanFilesystemConnector(config) {
  const basePath = String(config?.basePath || '').trim();

  if (!basePath) {
    throw new Error('basePath is required');
  }

  const allowedExtensions = new Set(
    (config?.extensions || ['.pdf', '.docx', '.txt', '.md'])
      .map((item) => String(item).toLowerCase())
  );

  const files = [];

  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();

      if (!allowedExtensions.has(ext)) {
        continue;
      }

      const stats = fs.statSync(fullPath);

      files.push({
        externalId: fullPath,
        title: entry.name,
        path: fullPath,
        sizeBytes: stats.size,
        updatedAt: stats.mtime.toISOString()
      });
    }
  }

  walk(basePath);

  return files;
}

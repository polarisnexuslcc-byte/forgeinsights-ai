import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import { createDocumentWithVersion } from '../../../../modules/documents/documents.service.js';
import { scanFilesystemConnector } from './connectors.filesystem.js';
import {
  createConnectorSyncRun,
  finishConnectorSyncRun,
  updateConnectorLastSyncedAt
} from './connectors.repository.js';

function checksumFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function getMimeTypeFromPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (ext === '.md') return 'text/markdown';
  return 'text/plain';
}

export async function runConnectorSync({
  connector,
  organizationId,
  userId
}) {
  const syncRunId = createConnectorSyncRun({
    connectorId: connector.id,
    organizationId
  });

  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  try {
    const config = JSON.parse(connector.configJson || '{}');

    if (connector.type !== 'filesystem') {
      throw new Error(`Unsupported connector type: ${connector.type}`);
    }

    const files = scanFilesystemConnector(config);

    for (const file of files) {
      try {
        const checksum = checksumFile(file.path);

        await createDocumentWithVersion({
          organizationId,
          userId,
          sourceId: connector.id,
          title: file.title,
          originalName: file.title,
          mimeType: getMimeTypeFromPath(file.path),
          sizeBytes: file.sizeBytes,
          checksum,
          storagePath: file.path,
          externalId: file.externalId,
          publishedAt: file.updatedAt
        });

        importedCount += 1;
      } catch (error) {
        errorCount += 1;
      }
    }

    finishConnectorSyncRun({
      id: syncRunId,
      status: 'success',
      importedCount,
      skippedCount,
      errorCount,
      details: {
        connectorType: connector.type,
        scannedCount: files.length
      }
    });

    updateConnectorLastSyncedAt(connector.id, organizationId);

    return {
      syncRunId,
      importedCount,
      skippedCount,
      errorCount,
      scannedCount: files.length
    };
  } catch (error) {
    finishConnectorSyncRun({
      id: syncRunId,
      status: 'error',
      importedCount,
      skippedCount,
      errorCount: errorCount + 1,
      details: {
        message: error.message
      }
    });

    throw error;
  }
}

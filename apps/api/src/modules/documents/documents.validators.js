export function validateCreateDocumentInput(body) {
  const organizationId = String(body?.organizationId || '').trim();
  const sourceId = body?.sourceId ? String(body.sourceId).trim() : null;
  const title = String(body?.title || '').trim();
  const documentType = String(body?.documentType || '').trim();
  const visibility = body?.visibility ? String(body.visibility).trim() : 'internal';
  const metadata = body?.metadata ?? null;
  const createdByUserId = body?.createdByUserId ? String(body.createdByUserId).trim() : null;

  if (!organizationId) {
    return { error: 'organizationId is required' };
  }

  if (!title) {
    return { error: 'title is required' };
  }

  if (!documentType) {
    return { error: 'documentType is required' };
  }

  return {
    value: {
      organizationId,
      sourceId,
      title,
      documentType,
      visibility,
      metadata,
      createdByUserId
    }
  };
}

export function validateCreateDocumentVersionInput(body) {
  const storagePath = String(body?.storagePath || '').trim();
  const mimeType = body?.mimeType ? String(body.mimeType).trim() : null;
  const sizeBytes = body?.sizeBytes != null ? Number(body.sizeBytes) : null;
  const checksum = body?.checksum ? String(body.checksum).trim() : null;
  const extractedText = body?.extractedText ? String(body.extractedText) : null;

  if (!storagePath) {
    return { error: 'storagePath is required' };
  }

  return {
    value: {
      storagePath,
      mimeType,
      sizeBytes,
      checksum,
      extractedText
    }
  };
}

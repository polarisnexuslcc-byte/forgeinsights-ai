import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

function normalizeExtractedText(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

async function extractPdfText(filePath) {
  const buffer = fs.readFileSync(filePath);
  const result = await pdfParse(buffer);
  return normalizeExtractedText(result.text);
}

async function extractDocxText(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return normalizeExtractedText(result.value);
}

async function extractPlainText(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return normalizeExtractedText(content);
}

export async function extractTextFromFile({ filePath, mimeType, originalName }) {
  const ext = path.extname(originalName || filePath).toLowerCase();

  if (mimeType === 'application/pdf' || ext === '.pdf') {
    return extractPdfText(filePath);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === '.docx'
  ) {
    return extractDocxText(filePath);
  }

  if (
    mimeType === 'text/plain' ||
    mimeType === 'text/markdown' ||
    ext === '.txt' ||
    ext === '.md'
  ) {
    return extractPlainText(filePath);
  }

  return null;
}

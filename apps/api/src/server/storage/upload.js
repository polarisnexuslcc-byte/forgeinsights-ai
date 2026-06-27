import crypto from 'crypto';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadRoot = path.resolve(__dirname, env.UPLOAD_DIR);

fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const organizationId = req.auth?.organizationId || 'unknown-org';
    const targetDir = path.join(uploadRoot, organizationId);

    fs.mkdirSync(targetDir, { recursive: true });
    cb(null, targetDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || '');
    const safeBase = path
      .basename(file.originalname || 'upload', ext)
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '');

    cb(null, `${Date.now()}-${crypto.randomUUID()}-${safeBase || 'file'}${ext}`);
  }
});

export const uploadSingleDocument = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024
  }
}).single('file');

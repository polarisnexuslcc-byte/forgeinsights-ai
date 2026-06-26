import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { db } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initializeDatabase() {
  const schemaPath = path.resolve(
    __dirname,
    '../../../../../packages/database/schema/schema.sql'
  );

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

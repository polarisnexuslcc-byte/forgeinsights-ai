import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { db } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initializeDatabase() {
  // 1. Load base schema
  const schemaPath = path.resolve(
    __dirname,
    '../../../../../packages/database/schema/schema.sql'
  );
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // 2. Load incremental migrations in order
  const migrationsDir = path.resolve(__dirname, './migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const migrationSql = fs.readFileSync(
        path.join(migrationsDir, file),
        'utf8'
      );
      db.exec(migrationSql);
    }
  }
}

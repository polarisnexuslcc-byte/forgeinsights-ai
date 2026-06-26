import { db } from './database.js';

export function getDatabaseHealth() {
  const row = db.prepare('SELECT 1 as ok').get();

  return {
    status: row?.ok === 1 ? 'ok' : 'error',
    engine: 'sqlite'
  };
}

// Run this script once to create the demo user for test environments
// Usage: node src/server/scripts/seed-demo-user.js

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/client.js';

async function seedDemoUser() {
  const email = 'demo@starthenode.xyz';
  const plainPassword = 'StarTheNode_demo_2024';
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const existing = db.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).get(email);

  if (existing) {
    console.log('Demo user already exists with id:', existing.id);
    return;
  }

  const now = new Date().toISOString();
  const organizationId = 'org_demo';
  const userId = crypto.randomUUID();

  // Ensure the demo org exists first
  const existingOrg = db.prepare(
    'SELECT id FROM organizations WHERE id = ?'
  ).get(organizationId);

  if (!existingOrg) {
    db.prepare(
      'INSERT INTO organizations (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)'
    ).run(organizationId, 'Demo Organization', now, now);
    console.log('Demo organization created:', organizationId);
  }

  db.prepare(
    'INSERT INTO users (' +
    '  id, organization_id, email, name, password_hash, role, created_at, updated_at' +
    ') VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    userId,
    organizationId,
    email,
    'Demo User',
    passwordHash,
    'admin',
    now,
    now
  );

  console.log('Demo user created successfully.');
  console.log('  email   :', email);
  console.log('  password:', plainPassword);
  console.log('  org     :', organizationId);
  console.log('  role    : admin');
}

seedDemoUser().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});

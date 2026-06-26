INSERT INTO organizations (
  id, name, slug, industry, size_band, created_at, updated_at
) VALUES (
  'org_demo',
  'Demo Organization',
  'demo-organization',
  'software',
  'smb',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO users (
  id, email, password_hash, full_name, status, created_at, updated_at
) VALUES (
  'user_demo_admin',
  'admin@example.com',
  'replace-me',
  'Demo Admin',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO memberships (
  id, organization_id, user_id, role, created_at
) VALUES (
  'membership_demo_admin',
  'org_demo',
  'user_demo_admin',
  'owner',
  CURRENT_TIMESTAMP
);

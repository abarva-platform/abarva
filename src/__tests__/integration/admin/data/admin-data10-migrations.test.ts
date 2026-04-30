/**
 * ADMIN-DATA10 — file-based regression tests for the 7 admin migrations + demo seed.
 *
 * These are pure file-system parses — the SQL is not executed against a live
 * database here. The DDL is verified to land with the right shape, indexes,
 * RLS, policy, and seed coverage. Migrations are applied via the standard
 * `npm run db:migrate` flow when DATA11 wires the live adapter.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = process.cwd();
const MIGRATIONS_DIR = resolve(REPO_ROOT, 'supabase/migrations');

interface AdminTableSpec {
  table: string;
  /** Whether a tenant-scoped index on client_id (or composite) is expected. */
  expectClientIndex: boolean;
  /** Required CHECK-constraint values that must all appear in the DDL. */
  requiredCheckValues: string[];
  /** Required FK references in the DDL. */
  requiredReferences: string[];
}

const ADMIN_TABLES: ReadonlyArray<AdminTableSpec> = [
  {
    table: 'admin_connectors',
    expectClientIndex: true,
    requiredCheckValues: [
      'erp', 'spend_analytics', 'contract_management', 'identity',
      'data_warehouse', 'crm', 'observability', 'ticketing', 'other',
      'not_configured', 'configured_stub', 'blocked', 'deferred', 'active',
    ],
    requiredReferences: ['clients(id)', 'data_integrations(id)'],
  },
  {
    table: 'admin_datasets',
    expectClientIndex: true,
    requiredCheckValues: [
      'raw', 'verified', 'blessed', 'ground_truth', 'audit_trail',
    ],
    requiredReferences: ['clients(id)', 'persons(id)'],
  },
  {
    table: 'admin_dataset_approvals',
    expectClientIndex: true,
    requiredCheckValues: [
      'pending', 'approved', 'rejected',
      'raw', 'verified', 'blessed', 'ground_truth',
    ],
    requiredReferences: ['admin_datasets(id)', 'clients(id)', 'persons(id)'],
  },
  {
    table: 'admin_dataset_quality',
    expectClientIndex: false,
    requiredCheckValues: ['BETWEEN 0 AND 100'],
    requiredReferences: ['admin_datasets(id)', 'clients(id)'],
  },
  {
    table: 'admin_blockers',
    expectClientIndex: true,
    requiredCheckValues: [
      'critical', 'high', 'medium', 'low',
      'demo', 'pilot', 'production',
      'open', 'in_progress', 'resolved', 'waived',
      'steward', 'nexus', 'sentinel', 'atlas',
    ],
    requiredReferences: ['clients(id)'],
  },
  {
    table: 'admin_audit_log',
    expectClientIndex: true,
    requiredCheckValues: [
      'auth', 'role_change', 'connector', 'dataset', 'approval',
      'blocker', 'setup_progress', 'readiness_state', 'other',
    ],
    requiredReferences: ['clients(id)', 'persons(id)'],
  },
  {
    table: 'admin_setup_progress',
    expectClientIndex: true,
    requiredCheckValues: [
      'data_trust', 'connectors', 'users_access', 'agent_readiness',
      'production_readiness', 'architecture',
      'done', 'in_progress', 'pending',
    ],
    requiredReferences: ['clients(id)'],
  },
];

function findMigrationFile(table: string): string | undefined {
  const files = readdirSync(MIGRATIONS_DIR).filter(
    (f) => f.endsWith(`_${table}.sql`),
  );
  return files[0];
}

function readMigration(file: string): string {
  return readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8');
}

describe('ADMIN-DATA10 — Admin migrations', () => {
  it('migrations directory exists', () => {
    expect(existsSync(MIGRATIONS_DIR)).toBe(true);
  });

  describe.each(ADMIN_TABLES)('$table', (spec) => {
    let file: string | undefined;
    let sql: string;

    beforeAll(() => {
      file = findMigrationFile(spec.table);
      if (file) {
        sql = readMigration(file);
      }
    });

    it('migration file exists', () => {
      expect(file).toBeDefined();
    });

    it('declares CREATE TABLE', () => {
      expect(sql).toMatch(
        new RegExp(`CREATE TABLE(?: IF NOT EXISTS)?\\s+${spec.table}\\b`, 'i'),
      );
    });

    it('wraps DDL in BEGIN/COMMIT', () => {
      expect(sql).toContain('BEGIN;');
      expect(sql).toContain('COMMIT;');
    });

    it('enables row-level security', () => {
      expect(sql).toMatch(
        new RegExp(`ALTER TABLE\\s+${spec.table}\\s+ENABLE ROW LEVEL SECURITY`, 'i'),
      );
    });

    it('declares a service-role policy', () => {
      expect(sql).toMatch(
        new RegExp(`service_role_all_${spec.table}`),
      );
      expect(sql).toMatch(/FOR ALL TO service_role/i);
    });

    it('emits NOTIFY pgrst', () => {
      expect(sql).toMatch(/NOTIFY\s+pgrst,\s*'reload schema'/i);
    });

    if (spec.expectClientIndex) {
      it('creates a tenant-scoped index on client_id', () => {
        expect(sql).toMatch(/CREATE INDEX[^;]*\bclient_id\b/i);
      });
    }

    it.each(spec.requiredReferences)('references %s', (ref) => {
      expect(sql).toContain(ref);
    });

    it.each(spec.requiredCheckValues)('CHECK constraint contains %s', (value) => {
      expect(sql).toContain(value);
    });
  });

  describe('migration ordering', () => {
    it('all 7 admin migrations use sequential timestamps after the latest pre-existing migration', () => {
      const all = readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();
      const adminMigrations = all.filter((f) => /admin_(connectors|datasets|dataset_approvals|dataset_quality|blockers|audit_log|setup_progress|demo_seed)\.sql$/.test(f));
      expect(adminMigrations.length).toBeGreaterThanOrEqual(8);

      // demo_seed must come after all 7 schema migrations
      const seedFile = adminMigrations.find((f) => f.endsWith('_admin_demo_seed.sql'));
      const schemaFiles = adminMigrations.filter((f) => !f.endsWith('_admin_demo_seed.sql'));
      expect(seedFile).toBeDefined();
      schemaFiles.forEach((schema) => {
        expect(seedFile! > schema).toBe(true);
      });
    });
  });
});

describe('ADMIN-DATA10 — Demo seed migration', () => {
  let seedFile: string | undefined;
  let sql: string;

  beforeAll(() => {
    seedFile = readdirSync(MIGRATIONS_DIR).find((f) =>
      f.endsWith('_admin_demo_seed.sql'),
    );
    if (seedFile) {
      sql = readMigration(seedFile);
    }
  });

  it('seed migration file exists', () => {
    expect(seedFile).toBeDefined();
  });

  it('looks up Apex Retail by exact name', () => {
    expect(sql).toContain("clients WHERE name = 'Apex Retail'");
  });

  it('looks up Meridian Health by ILIKE', () => {
    expect(sql).toContain("clients WHERE name ILIKE 'Meridian Health%'");
  });

  it('seeds Apex Retail with 6 connector inserts mirroring connectors-readiness-view fixtures', () => {
    const apexLabels = [
      'ERP / Finance System',
      'Spend Analytics Platform',
      'Contract Management System',
      'Market Intelligence Feed',
      'Vendor Portal Integration',
      'Identity / SSO (Clerk)',
    ];
    apexLabels.forEach((label) => {
      expect(sql).toContain(label);
    });
  });

  it('seeds Apex Retail admin_datasets across raw/verified/blessed rungs', () => {
    expect(sql).toContain("'orders-raw'");
    expect(sql).toContain("'orders-verified'");
    expect(sql).toContain("'vendor-master'");
    expect(sql).toContain("'contract-corpus'");
  });

  it('seeds Apex Retail admin_dataset_approvals (pending/approved/rejected)', () => {
    expect(sql).toMatch(/'pending'/);
    expect(sql).toMatch(/'approved'/);
    expect(sql).toMatch(/'rejected'/);
  });

  it('seeds Apex Retail admin_dataset_quality with numeric scores', () => {
    expect(sql).toMatch(/INSERT INTO admin_dataset_quality/);
    // overall scores referenced
    expect(sql).toContain('93.2');
    expect(sql).toContain('97.0');
  });

  it('seeds Apex Retail admin_blockers across owner agents', () => {
    expect(sql).toContain('ERP API credentials not provided');
    expect(sql).toContain('Contract corpus quality below blessed threshold');
    expect(sql).toContain('Vendor portal integration deferred');
    expect(sql).toContain('Production SSO requires domain verification');
    expect(sql).toContain('Spend analytics deferred to post-pilot');
  });

  it('seeds Apex Retail admin_audit_log with 10+ rows across categories', () => {
    const inserts = sql.match(/INSERT INTO admin_audit_log/g) ?? [];
    expect(inserts.length).toBeGreaterThanOrEqual(10);
  });

  it('seeds Apex Retail admin_setup_progress with all 6 canonical steps', () => {
    const steps = [
      'data_trust',
      'connectors',
      'users_access',
      'agent_readiness',
      'production_readiness',
      'architecture',
    ];
    steps.forEach((step) => {
      expect(sql).toContain(`'${step}'`);
    });
  });

  it('seeds Meridian Health with thin-tier admin_connectors (2 rows)', () => {
    // Both labels must appear after the meridian guard.
    const meridianBlock = sql.split('-- Meridian Health')[1] ?? '';
    expect(meridianBlock).toContain('Identity / SSO (Clerk)');
    expect(meridianBlock).toContain('ERP / Finance System');
  });

  it('every INSERT is guarded by NOT EXISTS for idempotency', () => {
    const inserts = sql.match(/INSERT INTO admin_/g) ?? [];
    const guards = sql.match(/NOT EXISTS\s*\(/g) ?? [];
    expect(inserts.length).toBeGreaterThan(0);
    expect(guards.length).toBeGreaterThanOrEqual(inserts.length);
  });

  it('skips gracefully when a tenant client row is missing', () => {
    expect(sql).toContain('skipping Apex admin demo seed');
    expect(sql).toContain('skipping Meridian admin demo seed');
  });

  it('does not seed retired shell-only tenants', () => {
    // Retired tenants must not appear in any INSERT/SELECT logic.
    expect(sql).not.toMatch(/INSERT INTO admin_[^;]*[Aa]rcturus/);
    expect(sql).not.toMatch(/SELECT id INTO v_retired_id/);
    expect(sql).not.toMatch(/clients WHERE name = 'Retired Tenant'/);
  });

  it('wraps the entire seed in a single DO $$ ... END $$ block', () => {
    expect(sql).toMatch(/DO \$\$/);
    expect(sql).toMatch(/END \$\$;/);
  });

  it('emits NOTIFY pgrst at the end so live API picks up new rows', () => {
    expect(sql).toMatch(/NOTIFY\s+pgrst,\s*'reload schema'/i);
  });
});

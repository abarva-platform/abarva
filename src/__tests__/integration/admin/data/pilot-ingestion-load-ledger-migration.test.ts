import { readFileSync } from 'node:fs';
import path from 'node:path';

import { getPilotIngestionLedgerTables } from '@/lib/admin/pilot-ingestion-ledger';

const sql = readFileSync(
  path.resolve(
    process.cwd(),
    'supabase/migrations/20260601090000_pilot_ingestion_load_ledger.sql',
  ),
  'utf-8',
);

describe('migration · pilot ingestion load ledger', () => {
  it('runs in a transaction and includes down-migration rollback guidance', () => {
    expect(sql).toMatch(/^BEGIN;/m);
    expect(sql).toMatch(/^COMMIT;/m);
    expect(sql).toMatch(/Down migration/i);
    expect(sql).toMatch(/DROP TABLE IF EXISTS pilot_ingestion_load_commits/);
    expect(sql).toMatch(/NOTIFY pgrst, 'reload schema'/);
  });

  it('declares every ledger table from the TypeScript contract', () => {
    for (const { table } of getPilotIngestionLedgerTables()) {
      expect(sql).toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
      expect(sql).toMatch(new RegExp(`'${table}'`));
    }
  });

  it('scopes every table by client_id and tenant_key', () => {
    const blocks = getPilotIngestionLedgerTables().map(({ table }) => {
      const block = sql.match(new RegExp(`CREATE TABLE IF NOT EXISTS ${table} \\([\\s\\S]*?\\n\\);`));
      expect(block).not.toBeNull();
      return block![0];
    });

    for (const block of blocks) {
      expect(block).toMatch(/client_id UUID NOT NULL REFERENCES clients\(id\) ON DELETE CASCADE/);
      expect(block).toMatch(/tenant_key TEXT NOT NULL/);
    }
  });

  it('pins template version, mapping profile, and validation rule version', () => {
    expect(sql).toMatch(/template_version TEXT NOT NULL/);
    expect(sql).toMatch(/validation_rule_version TEXT NOT NULL/);
    expect(sql).toMatch(/manifest_sha256 TEXT NOT NULL/);
    expect(sql).toMatch(/mapping_sha256 TEXT NOT NULL/);
    expect(sql).toMatch(/UNIQUE \(tenant_key, template_key, template_version\)/);
    expect(sql).toMatch(/UNIQUE \(tenant_key, template_version_id, profile_key, profile_version\)/);
  });

  it('adds idempotency and parse-cache dedupe anchors', () => {
    expect(sql).toMatch(/idempotency_key TEXT NOT NULL/);
    expect(sql).toMatch(/UNIQUE \(tenant_key, idempotency_key\)/);
    expect(sql).toMatch(/parse_cache_key TEXT/);
    expect(sql).toMatch(/idx_pilot_file_manifests_parse_cache_unique/);
    expect(sql).toMatch(/WHERE parse_cache_key IS NOT NULL/);
    expect(sql).toMatch(/duplicate_of_run_id UUID REFERENCES pilot_ingestion_upload_runs/);
  });

  it('requires preview approval before load commits and stores reversible commit items', () => {
    expect(sql).toMatch(/approval_decision_id UUID NOT NULL REFERENCES pilot_ingestion_approval_decisions\(id\) ON DELETE RESTRICT/);
    expect(sql).toMatch(/preview_sha256 TEXT NOT NULL/);
    expect(sql).toMatch(/policy_version TEXT NOT NULL/);
    expect(sql).toMatch(/prior_snapshot JSONB/);
    expect(sql).toMatch(/written_snapshot JSONB NOT NULL DEFAULT '\{\}'::jsonb/);
    expect(sql).toMatch(/unload_status TEXT NOT NULL DEFAULT 'active'/);
  });

  it('defines quarantine, clarification, approval, rollback, and audit export ledgers', () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS pilot_ingestion_quarantine_cases/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS pilot_ingestion_clarification_requests/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS pilot_ingestion_approval_decisions/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS pilot_ingestion_rollback_requests/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS pilot_ingestion_audit_exports/);
  });

  it('enforces tenant RLS and blocks authenticated deletes', () => {
    expect(sql).toMatch(/ALTER TABLE %I ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/can_read_tenant_by_key\(tenant_key\)/);
    expect(sql).toMatch(/can_write_tenant_by_key\(tenant_key\)/);
    expect(sql).toMatch(/REVOKE DELETE ON %I FROM anon, authenticated/);
    expect(sql).toMatch(/GRANT SELECT, INSERT, UPDATE ON %I TO authenticated/);
  });
});

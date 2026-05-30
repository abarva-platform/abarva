// Tower · Claude Code ingest — upsert classification (idempotency) tests.
//
// Exercises classifyUpsert without a DB. The CLI uses the same logic to
// produce its summary counters, so 'unchanged' here is the canonical proof
// of idempotency.

import { classifyUpsert, buildPayload, type ExistingDbRow } from '../plan';
import type { ClaudeCodeUsageRow } from '../types';

function desired(overrides: Partial<ClaudeCodeUsageRow> = {}): ClaudeCodeUsageRow {
  return {
    team: 'platform',
    developer_id: 'dev_a',
    period_start: '2025-06-01',
    period_end: '2025-06-30',
    sessions: 100,
    prompt_tokens: 500_000,
    output_tokens: 200_000,
    monthly_cost_usd: 5.5,
    primary_use_case: 'feature_development',
    ...overrides,
  };
}

function existing(overrides: Partial<ExistingDbRow> = {}): ExistingDbRow {
  return {
    team: 'platform',
    period_end: '2025-06-30',
    sessions: 100,
    prompt_tokens: 500_000,
    output_tokens: 200_000,
    monthly_cost_usd: 5.5,
    primary_use_case: 'feature_development',
    ...overrides,
  };
}

describe('classifyUpsert', () => {
  it("returns 'insert' when no existing row", () => {
    expect(classifyUpsert(desired(), null)).toBe('insert');
  });

  it("returns 'unchanged' when payload matches DB row exactly", () => {
    expect(classifyUpsert(desired(), existing())).toBe('unchanged');
  });

  it("returns 'unchanged' when DB row's numerics are strings (pg returns numeric as string)", () => {
    expect(
      classifyUpsert(
        desired(),
        existing({
          prompt_tokens: '500000',
          output_tokens: '200000',
          monthly_cost_usd: '5.50',
        }),
      ),
    ).toBe('unchanged');
  });

  it("returns 'update' when team changes", () => {
    expect(classifyUpsert(desired({ team: 'core' }), existing())).toBe('update');
  });

  it("returns 'update' when output_tokens differ", () => {
    expect(classifyUpsert(desired({ output_tokens: 999 }), existing())).toBe('update');
  });

  it("returns 'update' when primary_use_case is added", () => {
    expect(
      classifyUpsert(
        desired({ primary_use_case: 'tests' }),
        existing({ primary_use_case: null }),
      ),
    ).toBe('update');
  });
});

describe('buildPayload', () => {
  it('tags rows with the tenant and source file', () => {
    const payload = buildPayload(desired(), 'northwindretail', '/tmp/file.xlsx');
    expect(payload.tenant_client_key).toBe('northwindretail');
    expect(payload.source_file).toBe('/tmp/file.xlsx');
    expect(payload.developer_id).toBe('dev_a');
    expect(payload.period_start).toBe('2025-06-01');
  });
});

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { SynthesisViolationEvent } from '../violationsRecorder';

// Item T-497. Until 2026-09-27 this suite mocked the Supabase server seam. Its
// subject has imported `getAzureWriteFluentClient` from
// `@/lib/data-plane/postgresCompat` since `5d795a3976`, which is also this suite's
// only commit -- so the mocked seam was never on the subject's call path, the real
// client ran, and it asked for a database URL that unit CI does not set. The suite
// has therefore never passed and no workflow ran it to say so.
//
// The product is right, not the expectation: AGENTS.md requires the Azure/Postgres
// data-plane adapters and forbids new runtime dependencies on Supabase clients. So
// the mock moves to the seam the module actually calls. The module's own filename
// keeps its legacy spelling -- that is compatibility-era residue with live
// importers, and renaming it is not this item's change.
const getAzureWriteFluentClient = jest.fn();

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient,
}));

describe('agent-quality violation backend on the Azure/Postgres data plane', () => {
  beforeEach(() => {
    jest.resetModules();
    getAzureWriteFluentClient.mockReset();
    delete process.env.ABARVA_AZURE_DATABASE_URL;
    delete process.env.DATABASE_URL;
  });

  it('maps recorder events to the durable telemetry table', async () => {
    const insert = jest.fn(async (row: unknown) => {
      void row;
      return { error: null };
    });
    const from = jest.fn().mockReturnValue({ insert });
    getAzureWriteFluentClient.mockReturnValue({ from });
    const { supabaseViolationsBackend } = await import('../violationsSupabaseBackend');

    const event: SynthesisViolationEvent = {
      id: 'vlt_test_1',
      timestamp: '2026-05-15T12:00:00.000Z',
      route: '/api/chat/agent',
      surface: '/intelligence',
      tenantId: 'apex-retail',
      userId: 'user_1',
      violationCount: 1,
      violationTypes: ['sentinel-internal-consistency'],
      violations: [{ type: 'sentinel-internal-consistency', detail: 'bad ordering' }],
      responseLength: 432,
    };

    await supabaseViolationsBackend.write(event);

    expect(from).toHaveBeenCalledWith('agent_quality_violation_events');
    expect(insert).toHaveBeenCalledWith({
      id: 'vlt_test_1',
      event_timestamp: '2026-05-15T12:00:00.000Z',
      route: '/api/chat/agent',
      surface: '/intelligence',
      tenant_client_key: 'apex-retail',
      user_id: 'user_1',
      violation_count: 1,
      violation_types: ['sentinel-internal-consistency'],
      violations: [{ type: 'sentinel-internal-consistency', detail: 'bad ordering' }],
      response_length: 432,
    });
  });

  it('throws when the data plane rejects the insert', async () => {
    const insert = jest.fn(async (row: unknown) => {
      void row;
      return { error: { message: 'permission denied' } };
    });
    getAzureWriteFluentClient.mockReturnValue({ from: jest.fn().mockReturnValue({ insert }) });
    const { supabaseViolationsBackend } = await import('../violationsSupabaseBackend');

    await expect(
      supabaseViolationsBackend.write({
        id: 'vlt_test_2',
        timestamp: '2026-05-15T12:00:00.000Z',
        route: '/api/chat/agent',
        surface: null,
        tenantId: 'apex-retail',
        userId: null,
        violationCount: 0,
        violationTypes: [],
        violations: [],
        responseLength: 100,
      }),
    ).rejects.toThrow('agent_quality_violation_insert_failed: permission denied');
  });

  it('lists recent events for one tenant and maps rows back to recorder shape', async () => {
    const limit = jest.fn(async (rowLimit: number) => {
      void rowLimit;
      return {
        data: [
          {
            id: 'vlt_test_3',
            event_timestamp: '2026-05-15T12:01:00.000Z',
            route: '/api/chat/agent',
            surface: '/tower',
            tenant_client_key: 'meridian-health',
            user_id: null,
            violation_count: 1,
            violation_types: ['sentinel-voice-drift'],
            violations: [{ type: 'sentinel-voice-drift', detail: 'too soft' }],
            response_length: 210,
          },
        ],
        error: null,
      };
    });
    const order = jest.fn().mockReturnValue({ limit });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    getAzureWriteFluentClient.mockReturnValue({ from: jest.fn().mockReturnValue({ select }) });
    const { listRecentAgentQualityViolationEvents } = await import('../violationsSupabaseBackend');

    const events = await listRecentAgentQualityViolationEvents('meridian-health', 25);

    expect(eq).toHaveBeenCalledWith('tenant_client_key', 'meridian-health');
    expect(limit).toHaveBeenCalledWith(25);
    expect(events).toEqual([
      {
        id: 'vlt_test_3',
        timestamp: '2026-05-15T12:01:00.000Z',
        route: '/api/chat/agent',
        surface: '/tower',
        tenantId: 'meridian-health',
        userId: null,
        violationCount: 1,
        violationTypes: ['sentinel-voice-drift'],
        violations: [{ type: 'sentinel-voice-drift', detail: 'too soft' }],
        responseLength: 210,
      },
    ]);
  });

  it('detects whether Postgres persistence can be enabled', async () => {
    const { canUseSupabaseViolationBackend } = await import('../violationsSupabaseBackend');
    expect(canUseSupabaseViolationBackend()).toBe(false);
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/abarva';
    expect(canUseSupabaseViolationBackend()).toBe(true);
  });
});

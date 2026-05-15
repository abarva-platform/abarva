import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { SynthesisViolationEvent } from '../violationsRecorder';

const getServerSupabase = jest.fn();

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase,
}));

describe('agent-quality Supabase violation backend', () => {
  beforeEach(() => {
    jest.resetModules();
    getServerSupabase.mockReset();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('maps recorder events to the durable telemetry table', async () => {
    const insert = jest.fn(async (row: unknown) => {
      void row;
      return { error: null };
    });
    const from = jest.fn().mockReturnValue({ insert });
    getServerSupabase.mockReturnValue({ from });
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

  it('throws when Supabase rejects the insert', async () => {
    const insert = jest.fn(async (row: unknown) => {
      void row;
      return { error: { message: 'permission denied' } };
    });
    getServerSupabase.mockReturnValue({ from: jest.fn().mockReturnValue({ insert }) });
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
    getServerSupabase.mockReturnValue({ from: jest.fn().mockReturnValue({ select }) });
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

  it('detects whether Supabase persistence can be enabled', async () => {
    const { canUseSupabaseViolationBackend } = await import('../violationsSupabaseBackend');
    expect(canUseSupabaseViolationBackend()).toBe(false);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
    expect(canUseSupabaseViolationBackend()).toBe(true);
  });
});

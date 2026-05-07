import { createSourcingEvent, scaffoldNewEventSubstrate } from '../queries';
import {
  SOURCE_ARTIFACT_SPECS,
  SOURCE_GATE_CRITERIA,
  SOURCE_EVIDENCE_REQUIREMENTS,
} from '../canonical-specs';

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: jest.fn(),
}));

const { getServerSupabase } = jest.requireMock('@/lib/supabase-server') as {
  getServerSupabase: jest.Mock;
};

function setupMockSupabase(insertedEvent: { id: string; client_key: string; event_code: string }) {
  // Records calls to .from(table).{insert|upsert} so the test can assert on
  // what was scaffolded.
  const calls: Array<{ table: string; method: 'insert' | 'upsert'; rows: unknown }> = [];

  const fromImpl = (table: string) => {
    if (table === 'source_events') {
      const single = jest.fn().mockResolvedValue({
        data: {
          id: insertedEvent.id,
          client_key: insertedEvent.client_key,
          event_code: insertedEvent.event_code,
          event_name: 'Test Event',
          event_type: 'managed_service',
          current_stage_key: 'strategy',
          lifecycle_state: 'waiting_on_client',
          linked_program_id: null,
          estimated_value_usd: null,
          trigger_description: null,
          scope_description: null,
          decision_owner: null,
          created_by_user_id: null,
          created_at: '2026-05-07T20:00:00Z',
          updated_at: '2026-05-07T20:00:00Z',
        },
        error: null,
      });
      const select = jest.fn(() => ({ single }));
      const insert = jest.fn((row: unknown) => {
        calls.push({ table, method: 'insert', rows: row });
        return { select };
      });
      return { insert };
    }
    // canvas-substrate tables — upsert
    const upsert = jest.fn(async (rows: unknown[]) => {
      calls.push({ table, method: 'upsert', rows });
      return { data: null, error: null };
    });
    return { upsert };
  };

  getServerSupabase.mockReturnValue({ from: jest.fn(fromImpl) });
  return calls;
}

describe('createSourcingEvent scaffolding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts source_events row + scaffolds 3 substrate tables on success', async () => {
    const calls = setupMockSupabase({
      id: 'evt-new-1',
      client_key: 'apexretail',
      event_code: 'APEX-NEW-2026',
    });

    const row = await createSourcingEvent({
      clientKey: 'apexretail',
      eventName: 'Test Event',
      eventType: 'managed_service',
      triggerDescription: 'Need AMS sourcing',
    });

    expect(row.id).toBe('evt-new-1');

    // 1 source_events insert + 3 substrate upserts (one per substrate table)
    expect(calls).toHaveLength(4);

    const tables = calls.map((c) => c.table);
    expect(tables).toContain('source_events');
    expect(tables).toContain('source_event_artifact_states');
    expect(tables).toContain('source_event_gate_criterion_states');
    expect(tables).toContain('source_event_evidence_states');

    const artifactCall = calls.find((c) => c.table === 'source_event_artifact_states')!;
    expect((artifactCall.rows as unknown[]).length).toBe(SOURCE_ARTIFACT_SPECS.length);

    const criterionCall = calls.find((c) => c.table === 'source_event_gate_criterion_states')!;
    expect((criterionCall.rows as unknown[]).length).toBe(SOURCE_GATE_CRITERIA.length);

    const evidenceCall = calls.find((c) => c.table === 'source_event_evidence_states')!;
    expect((evidenceCall.rows as unknown[]).length).toBe(SOURCE_EVIDENCE_REQUIREMENTS.length);
  });

  it('passes current_stage_entered_at to the source_events insert', async () => {
    const calls = setupMockSupabase({
      id: 'evt-new-2',
      client_key: 'meridian',
      event_code: 'MER-2026',
    });

    await createSourcingEvent({
      clientKey: 'meridian',
      eventName: 'Cloud Renewal',
      eventType: 'cloud_infrastructure',
      triggerDescription: 'Renewal',
    });

    const eventInsert = calls.find((c) => c.table === 'source_events')!;
    const insertedRow = eventInsert.rows as Record<string, unknown>;
    expect(insertedRow.current_stage_entered_at).toBeTruthy();
    expect(typeof insertedRow.current_stage_entered_at).toBe('string');
    expect(insertedRow.current_stage_key).toBe('strategy');
  });

  it('does not abort event creation if scaffolding fails', async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        id: 'evt-new-3',
        client_key: 'apexretail',
        event_code: 'APEX-3',
        event_name: 'X',
        event_type: 'managed_service',
        current_stage_key: 'strategy',
        lifecycle_state: 'waiting_on_client',
        linked_program_id: null,
        estimated_value_usd: null,
        trigger_description: null,
        scope_description: null,
        decision_owner: null,
        created_by_user_id: null,
        created_at: '2026-05-07T20:00:00Z',
        updated_at: '2026-05-07T20:00:00Z',
      },
      error: null,
    });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    // Substrate tables fail with an RLS error.
    const upsert = jest.fn(async () => ({ data: null, error: { message: 'RLS blocked' } }));

    getServerSupabase.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === 'source_events') return { insert };
        return { upsert };
      }),
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const row = await createSourcingEvent({
      clientKey: 'apexretail',
      eventName: 'X',
      eventType: 'managed_service',
      triggerDescription: 'X',
    });
    expect(row.id).toBe('evt-new-3'); // event still created
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('scaffold failed'),
      'evt-new-3',
      expect.any(String),
    );
    consoleSpy.mockRestore();
  });
});

describe('scaffoldNewEventSubstrate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('upserts with ignoreDuplicates so reruns are idempotent', async () => {
    const upsertCalls: Array<{ table: string; opts: unknown }> = [];
    const upsert = jest.fn((_rows: unknown, opts: unknown) => {
      // captured per call
      return Promise.resolve({ data: null, error: null }).then((r) => {
        upsertCalls.push({ table: '', opts });
        return r;
      });
    });

    getServerSupabase.mockReturnValue({
      from: jest.fn((table: string) => ({
        upsert: (rows: unknown, opts: { onConflict: string; ignoreDuplicates: boolean }) => {
          upsertCalls.push({ table, opts });
          return Promise.resolve({ data: null, error: null });
        },
      })),
    });

    void upsert;

    await scaffoldNewEventSubstrate('evt-id-7', 'apexretail');

    expect(upsertCalls).toHaveLength(3);
    for (const call of upsertCalls) {
      const opts = call.opts as { onConflict: string; ignoreDuplicates: boolean };
      expect(opts.ignoreDuplicates).toBe(true);
      expect(opts.onConflict).toContain('source_event_id');
    }
  });

  it('throws when any of the three upserts errors', async () => {
    let callIdx = 0;
    getServerSupabase.mockReturnValue({
      from: jest.fn(() => ({
        upsert: () => {
          callIdx += 1;
          if (callIdx === 2) {
            return Promise.resolve({ data: null, error: { message: 'unique violation' } });
          }
          return Promise.resolve({ data: null, error: null });
        },
      })),
    });

    await expect(scaffoldNewEventSubstrate('evt-x', 'meridian')).rejects.toThrow(
      'unique violation',
    );
  });
});

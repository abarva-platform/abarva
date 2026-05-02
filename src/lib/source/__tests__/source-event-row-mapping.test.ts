import { SOURCE_STAGE_ORDER } from '../constants';
import { sourceEventRowToDetail, sourceEventRowToSummary, type SourceEventRow } from '../queries';

const baseRow: SourceEventRow = {
  id: 'evt-e2e-source-001',
  client_key: 'apexretail',
  event_code: 'APEX-E2E-2026',
  event_name: 'E2E AMS Source Crawl',
  event_type: 'managed_service',
  current_stage_key: 'scope',
  lifecycle_state: 'active',
  linked_program_id: null,
  estimated_value_usd: 25_000_000,
  trigger_description: 'Second attempt at AMS consolidation after prior sourcing failure.',
  scope_description: 'Data analytics applications and AMS transition scope.',
  decision_owner: 'Chief Digital Officer',
  created_by_user_id: 'person-apex-admin',
  created_at: '2026-05-01T20:00:00.000Z',
  updated_at: '2026-05-01T20:05:00.000Z',
};

describe('Source persisted event row mapping', () => {
  it('maps a persisted source_events row into the portfolio summary contract', () => {
    const summary = sourceEventRowToSummary(baseRow, 'Apex Retail Group');

    expect(summary.id).toBe(baseRow.id);
    expect(summary.accountName).toBe('Apex Retail Group');
    expect(summary.currentStageKey).toBe('scope');
    expect(summary.currentStageLabel).toBe('Scope');
    expect(summary.status).toBe('active');
    expect(summary.valueAtStakeUsd).toBe(25_000_000);
  });

  it('maps a persisted source_events row into a full event canvas detail', () => {
    const detail = sourceEventRowToDetail(baseRow, 'Apex Retail Group');

    expect(detail.id).toBe(baseRow.id);
    expect(detail.name).toBe(baseRow.event_name);
    expect(detail.stages.map((stage) => stage.key)).toEqual(SOURCE_STAGE_ORDER);
    expect(detail.stages).toHaveLength(11);
    expect(detail.stages.find((stage) => stage.key === 'scope')?.status).toBe('active');
    expect(detail.problemStatement).toContain('Second attempt');
    expect(detail.artifacts.some((artifact) => artifact.id.includes(baseRow.id))).toBe(true);
    expect(detail.dataReadiness[0]?.id).toContain(baseRow.id);
  });

  it('marks the current stage as needing approval when the event is waiting on client approval', () => {
    const detail = sourceEventRowToDetail(
      {
        ...baseRow,
        current_stage_key: 'intake',
        lifecycle_state: 'waiting_on_client',
      },
      'Apex Retail Group',
    );

    expect(detail.status).toBe('waiting_on_client');
    expect(detail.stages[0]?.status).toBe('needs_approval');
    expect(detail.stages[0]?.gate.status).toBe('in_review');
    expect(detail.alerts.some((alert) => alert.id.endsWith(':approval-needed'))).toBe(true);
  });
});

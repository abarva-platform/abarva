import {
  artifactStateRowToView,
  evidenceStateRowToView,
  gateCriterionStateRowToView,
  type SourceEventArtifactStateRow,
  type SourceEventEvidenceStateRow,
  type SourceEventGateCriterion,
  type SourceEventGateCriterionStateRow,
} from '../types';
import { countGateProgress } from '../queries';

describe('artifactStateRowToView', () => {
  it('maps snake-case row to camelCase view-model', () => {
    const row: SourceEventArtifactStateRow = {
      id: 'a1',
      source_event_id: 'evt-1',
      tenant_key: 'apexretail',
      artifact_code: 'd05_scope_memo',
      stage_key: 'scope',
      artifact_family: 'scope_document',
      tier: 'stub',
      status: 'not_started',
      requirement_level: 'required',
      gate_defining: true,
      linked_artifact_id: null,
      notes: null,
      created_at: '2026-05-07T20:00:00Z',
      updated_at: '2026-05-07T20:00:00Z',
    };
    const view = artifactStateRowToView(row);
    expect(view.sourceEventId).toBe('evt-1');
    expect(view.artifactCode).toBe('d05_scope_memo');
    expect(view.stage).toBe('scope');
    expect(view.gateDefining).toBe(true);
  });
});

describe('gateCriterionStateRowToView', () => {
  it('maps row to view + preserves evidence array', () => {
    const row: SourceEventGateCriterionStateRow = {
      id: 'c1',
      source_event_id: 'evt-1',
      tenant_key: 'apexretail',
      criterion_id: 'GATE-SCOPE-01',
      from_stage: 'scope',
      to_stage: 'rfp',
      state: 'pending',
      reviewer_user_id: null,
      reviewed_at: null,
      notes: null,
      evidence_artifact_ids: ['art-1', 'art-2'],
      waiver_approval_id: null,
      created_at: '2026-05-07T20:00:00Z',
      updated_at: '2026-05-07T20:00:00Z',
    };
    const view = gateCriterionStateRowToView(row);
    expect(view.criterionId).toBe('GATE-SCOPE-01');
    expect(view.evidenceArtifactIds).toEqual(['art-1', 'art-2']);
    expect(view.fromStage).toBe('scope');
    expect(view.toStage).toBe('rfp');
  });
});

describe('evidenceStateRowToView', () => {
  it('maps row to view', () => {
    const row: SourceEventEvidenceStateRow = {
      id: 'e1',
      source_event_id: 'evt-1',
      tenant_key: 'apexretail',
      requirement_id: 'EVID-SRC-SCOPE-TICKET-HISTORY',
      stage_key: 'scope',
      current_state: 'Loaded',
      source_artifact_id: null,
      notes: 'ServiceNow sync 14d stale',
      last_synced_at: '2026-04-23T00:00:00Z',
      created_at: '2026-05-07T20:00:00Z',
      updated_at: '2026-05-07T20:00:00Z',
    };
    const view = evidenceStateRowToView(row);
    expect(view.requirementId).toBe('EVID-SRC-SCOPE-TICKET-HISTORY');
    expect(view.currentState).toBe('Loaded');
    expect(view.notes).toContain('ServiceNow');
  });
});

describe('countGateProgress', () => {
  function criterion(
    overrides: Partial<{
      criterionId: string;
      fromStage: SourceEventGateCriterion['fromStage'];
      state: SourceEventGateCriterion['state'];
    }> = {},
  ): SourceEventGateCriterion {
    return {
      id: 'c-' + Math.random(),
      sourceEventId: 'evt',
      tenantKey: 'apexretail',
      criterionId: overrides.criterionId ?? 'GATE-X-01',
      fromStage: overrides.fromStage ?? 'scope',
      toStage: 'rfp',
      state: overrides.state ?? 'pending',
      reviewerUserId: null,
      reviewedAt: null,
      notes: null,
      evidenceArtifactIds: [],
      waiverApprovalId: null,
      createdAt: '2026-05-07T20:00:00Z',
      updatedAt: '2026-05-07T20:00:00Z',
    };
  }

  it('counts met + waived as met', () => {
    const result = countGateProgress(
      [
        criterion({ state: 'met' }),
        criterion({ state: 'waived' }),
        criterion({ state: 'pending' }),
      ],
      'scope',
    );
    expect(result).toEqual({ met: 2, total: 3, allMet: false });
  });

  it('reports allMet when every criterion is met or waived', () => {
    const result = countGateProgress(
      [criterion({ state: 'met' }), criterion({ state: 'waived' })],
      'scope',
    );
    expect(result.allMet).toBe(true);
  });

  it('filters by from-stage', () => {
    const result = countGateProgress(
      [
        criterion({ fromStage: 'scope', state: 'met' }),
        criterion({ fromStage: 'rfp', state: 'met' }),
      ],
      'scope',
    );
    expect(result.total).toBe(1);
  });

  it('reports allMet false when nothing matches the stage', () => {
    const result = countGateProgress(
      [criterion({ fromStage: 'rfp', state: 'met' })],
      'scope',
    );
    expect(result).toEqual({ met: 0, total: 0, allMet: false });
  });
});

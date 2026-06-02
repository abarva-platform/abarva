import { buildOutputsDeliverablesExplorerModel } from '../outputs-deliverables-explorer';
import type { StrategicMovePortfolio } from '@/lib/programs/types.ui';

const movePortfolio: StrategicMovePortfolio = {
  moves: [
    {
      id: 'move-1',
      displayCode: 'MV-1',
      name: 'Contact Center AI Routing',
      tenant: { id: 'client-1', name: 'Apex Retail Group', industryCode: 'retail' },
      charter: null,
      functionPackKey: 'customer_servicing_contact_center',
      archetype: 'workflow_automation',
      currentPhase: 3,
      phaseLabel: 'P3 Design Future State',
      status: { key: 'on_track', text: 'On track', description: 'Moving' },
      statusColor: 'green',
      sponsor: { id: 'person-1', name: 'Carlos Rivera', role: 'Sponsor' },
      participants: [],
      valueAtStake: { projected: null, verified: null, assumptions: null },
      deliverables: [
        {
          id: 'deliv-1',
          typeKey: 'sourcing_strategy',
          title: 'Sourcing Strategy',
          status: 'in_review',
          updatedAt: '2026-06-02T16:00:00.000Z',
          preview: 'Recommended sourcing approach for the routing platform.',
          url: '/api/v1/programs/move-1/module/sourcing_strategy',
        },
      ],
      gateCriteria: [],
      recentActivity: [],
      linkedEvidence: [],
      mapLabel: 'Contact Center AI Routing',
      createdAt: '2026-06-01T16:00:00.000Z',
      updatedAt: '2026-06-02T16:00:00.000Z',
    },
  ],
  counts: { total: 1, needAttention: 0, onTrack: 1, gated: 0, idle: 0 },
  totalValueAtStake: { amount: 0, currency: 'USD' },
  needAttentionMoves: [],
};

describe('outputs deliverables explorer model', () => {
  it('combines Move deliverables and Source event artifacts in newest-first order', () => {
    const model = buildOutputsDeliverablesExplorerModel({
      tenantName: 'Apex Retail Group',
      generatedAt: '2026-06-02T17:00:00.000Z',
      movePortfolio,
      sourceEvents: [
        {
          id: 'source-event-1',
          event_code: 'APEX-AMS-2026',
          event_name: 'AMS sourcing event',
          current_stage_key: 'rfp',
          lifecycle_state: 'waiting_on_client',
          decision_owner: 'Procurement',
          updated_at: '2026-06-02T15:00:00.000Z',
        },
      ],
      sourceArtifacts: [
        {
          id: 'artifact-state-1',
          source_event_id: 'source-event-1',
          artifact_code: 'scope_memo',
          stage_key: 'scope',
          artifact_family: 'scope_document',
          status: 'drafting',
          requirement_level: 'required',
          gate_defining: true,
          notes: 'Scope memo needs operations sign-off.',
          body: null,
          body_updated_at: '2026-06-02T16:30:00.000Z',
          updated_at: '2026-06-02T16:20:00.000Z',
        },
      ],
    });

    expect(model.totals).toMatchObject({
      totalOutputs: 2,
      moveOutputs: 1,
      sourceOutputs: 1,
      parentMoves: 1,
      parentSourceEvents: 1,
      needsReview: 2,
    });
    expect(model.items.map((item) => item.origin)).toEqual(['source_event', 'move']);
    expect(model.items[0]).toMatchObject({
      title: 'scope memo',
      parentLabel: 'AMS sourcing event',
      outputHref: '/source/events/source-event-1/artifacts/scope_memo',
      stageLabel: 'Scope',
    });
  });

  it('does not show orphan Source artifact states outside returned Source events', () => {
    const model = buildOutputsDeliverablesExplorerModel({
      tenantName: 'Apex Retail Group',
      movePortfolio: null,
      sourceEvents: [],
      sourceArtifacts: [
        {
          id: 'artifact-state-1',
          source_event_id: 'other-tenant-event',
          artifact_code: 'scope_memo',
          stage_key: 'scope',
          artifact_family: 'scope_document',
          status: 'drafting',
          requirement_level: 'required',
          gate_defining: true,
          notes: null,
          body: null,
          body_updated_at: null,
          updated_at: '2026-06-02T16:20:00.000Z',
        },
      ],
    });

    expect(model.items).toHaveLength(0);
    expect(model.totals.sourceOutputs).toBe(0);
  });
});

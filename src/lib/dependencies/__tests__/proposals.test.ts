import { buildStaticSiblingProposal, filterMoveDAG, IT_PRODUCTIVITY_TEMPLATE_SLUG } from '@/lib/dependencies';
import type { MoveDAG } from '@/lib/dependencies';

describe('dependency DAG proposals', () => {
  it('proposes five sibling Moves, one Source workflow, and at least eight edges for IT Productivity', () => {
    const proposal = buildStaticSiblingProposal(IT_PRODUCTIVITY_TEMPLATE_SLUG);

    expect(proposal.parentTemplateSlug).toBe(IT_PRODUCTIVITY_TEMPLATE_SLUG);
    expect(proposal.siblingMoves).toHaveLength(5);
    expect(proposal.sourceWorkflows).toHaveLength(1);
    expect(proposal.edges.length).toBeGreaterThanOrEqual(8);
    expect(proposal.sourceWorkflows[0].templateSlug).toBe('source-ams-portfolio-optimization');
    expect(proposal.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromTemplateSlug: 'source-ams-portfolio-optimization',
          toTemplateSlug: IT_PRODUCTIVITY_TEMPLATE_SLUG,
          relationType: 'informs',
        }),
      ]),
    );
  });

  it('filters DAG nodes by status, sponsor, and dollar impact while preserving visible edges', () => {
    const dag: MoveDAG = {
      clientId: 'client-1',
      filters: { statuses: [], sponsors: [], minDollarImpactUsd: null },
      nodes: [
        {
          id: 'move-1',
          kind: 'move_instance',
          templateId: 'template-1',
          templateSlug: IT_PRODUCTIVITY_TEMPLATE_SLUG,
          templateName: 'AI-Enabled IT Productivity Program',
          templateKind: 'Move',
          clientId: 'client-1',
          engagementId: null,
          status: 'active',
          currentGate: '0.5',
          sponsor: 'CTO + CDO',
          dollarImpactUsd: 3_000_000,
          createdAt: '2026-05-23T00:00:00.000Z',
          updatedAt: '2026-05-23T00:00:00.000Z',
        },
        {
          id: 'move-2',
          kind: 'move_instance',
          templateId: 'template-2',
          templateSlug: 'data-foundation-for-ai',
          templateName: 'Data Foundation for AI',
          templateKind: 'Move',
          clientId: 'client-1',
          engagementId: null,
          status: 'paused',
          currentGate: '0',
          sponsor: 'CTO + CDO',
          dollarImpactUsd: 2_500_000,
          createdAt: '2026-05-23T00:00:00.000Z',
          updatedAt: '2026-05-23T00:00:00.000Z',
        },
      ],
      edges: [
        {
          id: 'edge-1',
          clientId: 'client-1',
          fromNodeId: 'move-2',
          toNodeId: 'move-1',
          fromNodeKind: 'move_instance',
          toNodeKind: 'move_instance',
          relationType: 'blocks',
          note: null,
          estimatedImpactUsd: 2_500_000,
          metadata: {},
          acceptedBy: null,
          acceptedAt: null,
          declinedBy: null,
          declinedAt: null,
          createdAt: '2026-05-23T00:00:00.000Z',
          updatedAt: '2026-05-23T00:00:00.000Z',
        },
      ],
    };

    const filtered = filterMoveDAG(dag, {
      statuses: ['active'],
      sponsors: ['CTO + CDO'],
      minDollarImpactUsd: 2_750_000,
    });

    expect(filtered.nodes.map((node) => node.id)).toEqual(['move-1']);
    expect(filtered.edges).toHaveLength(0);
    expect(filtered.filters.minDollarImpactUsd).toBe(2_750_000);
  });
});

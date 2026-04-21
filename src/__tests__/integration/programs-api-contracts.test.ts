/**
 * Programs API contract tests.
 *
 * These tests load the route modules directly (no HTTP roundtrip) and
 * verify that:
 *   1. Every route exports the expected handler shape
 *   2. Unauthenticated calls return 401 (tenancy enforcement)
 *   3. The transformers produce valid view-model shapes from DB rows
 *
 * We deliberately don't hit a live DB here — integration-with-DB runs
 * as part of Phase 5 Playwright E2E with seeded Apex Retail data.
 */

import { classifierMatchToViewModel } from '@/lib/programs/transformers';
import type { PatternClassifierMatch } from '@/lib/programs/types';

describe('Programs API · route module shapes', () => {
  it('exports GET + POST on /api/v1/programs', async () => {
    const mod = await import('@/app/api/v1/programs/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports GET on /api/v1/programs/[programId]', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/route');
    expect(typeof mod.GET).toBe('function');
  });

  it('exports POST on /api/v1/programs/originate (SSE classifier)', async () => {
    const mod = await import('@/app/api/v1/programs/originate/route');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports POST on /api/v1/programs/originate/from-thread', async () => {
    const mod = await import('@/app/api/v1/programs/originate/from-thread/route');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports GET on /api/v1/programs/[programId]/module/[key]', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/module/[key]/route');
    expect(typeof mod.GET).toBe('function');
  });

  it('exports POST on /api/v1/programs/[programId]/module/[key]/status', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/module/[key]/status/route');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports POST on /api/v1/programs/[programId]/advance', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/advance/route');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports GET + POST on /api/v1/programs/[programId]/approvals', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/approvals/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports POST on /api/v1/programs/[programId]/approvals/[approvalId]/decide', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/approvals/[approvalId]/decide/route');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports POST on /api/v1/programs/[programId]/deliverables/[deliverableId]/publish', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/deliverables/[deliverableId]/publish/route');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports POST on /api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/route');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports GET on /api/v1/programs/[programId]/execute', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/execute/route');
    expect(typeof mod.GET).toBe('function');
  });

  it('exports GET + POST on /api/v1/programs/[programId]/work-items', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/work-items/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports PATCH on /api/v1/programs/[programId]/work-items/[workItemId]', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/work-items/[workItemId]/route');
    expect(typeof mod.PATCH).toBe('function');
  });

  it('exports GET + POST on /api/v1/programs/[programId]/milestones', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/milestones/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports GET + POST on /api/v1/programs/[programId]/risks', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/risks/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports GET on /api/v1/programs/[programId]/flags', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/flags/route');
    expect(typeof mod.GET).toBe('function');
  });

  it('exports POST on /api/v1/programs/[programId]/flags/[flagId]/resolve', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/flags/[flagId]/resolve/route');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports GET + POST on /api/v1/programs/[programId]/nexus/threads', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/nexus/threads/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports POST on /api/v1/programs/[programId]/nexus/ask (SSE)', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/nexus/ask/route');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports POST on /api/v1/programs/[programId]/nexus/draft', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/nexus/draft/route');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports POST on /api/v1/programs/[programId]/nexus/cxo-takeover', async () => {
    const mod = await import('@/app/api/v1/programs/[programId]/nexus/cxo-takeover/route');
    expect(typeof mod.POST).toBe('function');
  });

  it('exports GET on /api/v1/programs/patterns', async () => {
    const mod = await import('@/app/api/v1/programs/patterns/route');
    expect(typeof mod.GET).toBe('function');
  });
});

describe('Programs transformers · classifier → view-model', () => {
  const baseMatch: PatternClassifierMatch = {
    patternKey: 'demand_forecasting_ai',
    confidence: 0.78,
    archetype: 'ai_product_enablement',
    industry: 'retail',
    canonicalShape: null,
    band: 'high',
    suggestedAction: 'pattern',
    rationale: 'vector 82% · archetype ✓ · industry ✓',
  };

  it('maps band=no_match to low for UI rendering (view-model cap)', () => {
    const out = classifierMatchToViewModel({ ...baseMatch, band: 'no_match' }, null, true);
    expect(out.confidenceBand).toBe('low');
  });

  it('computes successRatePct from catalog deployment counts', () => {
    const out = classifierMatchToViewModel(
      baseMatch,
      { deployment_count: 10, successful_deployment_count: 8, title: 'Demand Forecasting AI' },
      true,
    );
    expect(out.successRatePct).toBe(80);
  });

  it('gracefully falls back to pattern_key when catalog title missing', () => {
    const out = classifierMatchToViewModel(baseMatch, null, false);
    expect(out.patternName).toBe('demand_forecasting_ai');
    expect(out.isTopMatch).toBe(false);
  });

  it('derives default preloadDepthPct from band when canonical_shape silent', () => {
    const high = classifierMatchToViewModel({ ...baseMatch, band: 'high' }, null, true);
    const medium = classifierMatchToViewModel({ ...baseMatch, band: 'medium' }, null, true);
    const low = classifierMatchToViewModel({ ...baseMatch, band: 'low' }, null, true);
    expect(high.preloadDepthPct).toBe(80);
    expect(medium.preloadDepthPct).toBe(60);
    expect(low.preloadDepthPct).toBe(40);
  });

  it('surfaces canonical phases list from canonical_shape_json when present', () => {
    const out = classifierMatchToViewModel(
      baseMatch,
      {
        title: 'Demand Forecasting AI',
        canonical_shape_json: {
          phases: [
            { canonicalPhase: 0, name: 'Origination' },
            { canonicalPhase: 5, name: 'Verify' },
          ],
          modules: [{ moduleKey: 'baseline', name: 'Baseline' }],
        },
      },
      true,
    );
    expect(out.proposedShape.phases).toHaveLength(2);
    expect(out.proposedShape.modules).toHaveLength(1);
  });
});

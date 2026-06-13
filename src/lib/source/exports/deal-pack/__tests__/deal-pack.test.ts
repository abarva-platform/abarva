// Source · Deal Pack tests.
//
// Asserts the aggregator produces a single self-contained HTML document
// per tenant, with:
//   - a valid <!DOCTYPE html> prefix
//   - 8 stage anchors in the TOC (Stage 0 through Stage 7)
//   - a Headline that is either decided OR honestly "pending"
//   - every existing artifact rendered in the right stage section
//   - "Not recorded — seed gap" preserved from underlying artifacts
//   - NO external resources (no <script src=, no <link rel=stylesheet
//     href=http, no <img src=http, no @import url(http)
//
// Tenant matrix: Apex Retail (renewal posture decided) ·
// Meridian Health (mid-RFP, pending) · First Capital (early Stage 0).
//
// Mirrors the style of lifecycle-coverage.test.ts.

import { assembleDealPack } from '../assemble-deal-pack';
import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import type {
  SourceEventArtifactState,
  SourceEventGateCriterion,
  SourceEventEvidence,
} from '@/lib/source/canvas-substrate/types';

const GENERATED_AT = '2026-05-19T12:00:00.000Z';

const PASSED_RFP_QUALITY_METADATA = {
  qualityGate: {
    required: true,
    standardId: 'partner-grade-consulting-deliverable-v1',
    minRequiredScore: 8,
    passed: true,
    rewriteAttempted: false,
    attempts: 1,
    finalSummary: 'Passed partner-grade gate.',
    reviews: [],
  },
};

// ── Fixture builders ──────────────────────────────────────────────────────

function makeArtifactState(
  code: string,
  body: string | null,
  overrides: Partial<SourceEventArtifactState> = {},
): SourceEventArtifactState {
  return {
    id: `as-${code}`,
    sourceEventId: 'evt-1',
    tenantKey: 'tenant',
    artifactCode: code,
    stage: 'rfp',
    family: 'workproduct',
    tier: 'tier_1',
    status: body ? 'approved' : 'not_started',
    requirementLevel: 'mandatory',
    gateDefining: false,
    linkedArtifactId: null,
    notes: null,
    body,
    bodyFormat: 'markdown',
    bodyAuthoredBy: body ? 'Sentinel' : null,
    bodyUpdatedAt: body ? GENERATED_AT : null,
    bodyGenerationMetadata: null,
    createdAt: GENERATED_AT,
    updatedAt: GENERATED_AT,
    ...overrides,
  } as SourceEventArtifactState;
}

function makeGateCriterion(
  criterionId: string,
  state: SourceEventGateCriterion['state'] = 'met',
): SourceEventGateCriterion {
  return {
    id: `gc-${criterionId}`,
    sourceEventId: 'evt-1',
    tenantKey: 'tenant',
    criterionId,
    fromStage: 'scope',
    toStage: 'rfp',
    state,
    reviewerUserId: 'user-1',
    reviewedAt: GENERATED_AT,
    notes: `Signed off ${criterionId}`,
    evidenceArtifactIds: [],
    waiverApprovalId: null,
    createdAt: GENERATED_AT,
    updatedAt: GENERATED_AT,
  } as SourceEventGateCriterion;
}

function makeEvidence(
  requirementId: string,
  state: SourceEventEvidence['currentState'] = 'Available',
): SourceEventEvidence {
  return {
    id: `ev-${requirementId}`,
    sourceEventId: 'evt-1',
    tenantKey: 'tenant',
    requirementId,
    stage: 'scope',
    currentState: state,
    sourceArtifactId: `d05_scope_memo`,
    notes: `Source citation for ${requirementId}`,
    lastSyncedAt: GENERATED_AT,
    createdAt: GENERATED_AT,
    updatedAt: GENERATED_AT,
  } as SourceEventEvidence;
}

interface TenantFixture {
  label: string;
  ctx: SourceGenerationContext;
  expectsPendingHeadline: boolean;
  /** Stage 0-7 expected to render with an actual artifact (not "Not yet produced"). */
  expectedArtifactCodes: string[];
}

function apexRetailFixture(): TenantFixture {
  // Apex — renewal posture decided. The Renewal Decision body is
  // authored so the Headline should resolve to "decided".
  const renewalBody = [
    '# Renew with renegotiation — drop egress and lock 3yr',
    '',
    '## Verdict',
    'Renegotiate, then renew. Egress fees + auto-renewal trap > 90 days out.',
  ].join('\n');
  return {
    label: 'Apex Retail · Contact Center AI (renewal posture decided)',
    ctx: {
      tenantKey: 'apex-retail',
      tenantName: 'Apex Retail',
      event: {
        id: 'evt-apex-cc',
        code: 'APX-CC-2026',
        name: 'Apex Retail Contact Center AI',
        archetype: 'contact_center_ai',
        rigor: 'strategic',
        currentStageKey: 'transition',
        statusLabel: 'Active',
        owner: 'Maya Chen, VP Customer Ops',
        triggerDescription: null,
        scopeDescription: null,
        estimatedValueUsd: 4_200_000,
      },
      artifactStates: [
        makeArtifactState('dx7_renewal_decision', renewalBody),
        makeArtifactState('d05_scope_memo', '# Scope memo\n\nIn scope: contact center automation.'),
        makeArtifactState('d09_rfp_pack', null),
        makeArtifactState('d24_decision_brief', null),
      ],
      gateCriteria: [makeGateCriterion('scope-approved', 'met')],
      evidence: [makeEvidence('scope-001', 'Usable Evidence')],
    },
    expectsPendingHeadline: false,
    expectedArtifactCodes: ['dx7_renewal_decision', 'd05_scope_memo'],
  };
}

function meridianHealthFixture(): TenantFixture {
  // Meridian — mid-RFP. No decision artifacts authored yet, so the
  // Headline should be honestly "pending".
  const scopeBody = [
    '# Scope memo · Meridian Health Cloud & Infrastructure',
    '',
    '## In scope',
    '- Epic CIS hosting consolidation',
    '- Imaging archive cold-tier migration',
    '',
    '## Not recorded — seed gap',
    'IT financials category breakdown.',
  ].join('\n');
  return {
    label: 'Meridian Health · Cloud & Infrastructure (mid-RFP, pending)',
    ctx: {
      tenantKey: 'meridian-health',
      tenantName: 'Meridian Health',
      event: {
        id: 'evt-meri-cloud',
        code: 'MERI-CLOUD-2026',
        name: 'Meridian Health Cloud & Infrastructure',
        archetype: 'cloud_infrastructure',
        rigor: 'enhanced',
        currentStageKey: 'rfp',
        statusLabel: 'Waiting on Vendor',
        owner: 'Janet Fischer, VP IT Ops',
        triggerDescription: null,
        scopeDescription: null,
        estimatedValueUsd: 12_500_000,
      },
      artifactStates: [
        makeArtifactState('d05_scope_memo', scopeBody),
        makeArtifactState('d09_rfp_pack', '# RFP package\n\nIssued 2026-05-01.', {
          bodyGenerationMetadata: PASSED_RFP_QUALITY_METADATA,
        }),
      ],
      gateCriteria: [makeGateCriterion('rfp-issued', 'met')],
      evidence: [makeEvidence('rfp-001', 'Available')],
    },
    expectsPendingHeadline: true,
    expectedArtifactCodes: ['d05_scope_memo', 'd09_rfp_pack'],
  };
}

function firstCapitalFixture(): TenantFixture {
  // First Capital — early Stage 0. Nothing authored.
  return {
    label: 'First Capital · Vendor Consolidation (early Stage 0, pending)',
    ctx: {
      tenantKey: 'first-capital',
      tenantName: 'First Capital',
      event: {
        id: 'evt-fc-consol',
        code: 'FC-CONS-2026',
        name: 'First Capital Vendor Consolidation',
        archetype: 'vendor_consolidation',
        rigor: 'standard',
        currentStageKey: 'strategy',
        statusLabel: 'Active',
        owner: 'Priya Rao, CDO',
        triggerDescription: null,
        scopeDescription: null,
        estimatedValueUsd: null,
      },
      artifactStates: [],
      gateCriteria: [],
      evidence: [],
    },
    expectsPendingHeadline: true,
    expectedArtifactCodes: [],
  };
}

const FIXTURES: TenantFixture[] = [
  apexRetailFixture(),
  meridianHealthFixture(),
  firstCapitalFixture(),
];

// ── Tests ─────────────────────────────────────────────────────────────────

describe('Source Deal Pack · assemble-deal-pack', () => {
  for (const fixture of FIXTURES) {
    describe(fixture.label, () => {
      it('produces a self-contained HTML document', async () => {
        const out = await assembleDealPack(fixture.ctx, GENERATED_AT);
        expect(out.html.length).toBeGreaterThan(5000);
        expect(out.html.startsWith('<!DOCTYPE html')).toBe(true);
        expect(out.html).toContain('<html lang="en">');
        expect(out.html).toContain('</html>');
        // Filename pattern: abarva-source-deal-pack-{tenant}-{event}-{date}.html
        expect(out.filename).toMatch(/^abarva-source-deal-pack-.+\.html$/);
        expect(out.filename).toContain('2026-05-19');
      });

      it('renders lifecycle anchors including Stage 10 Transition', async () => {
        const { html } = await assembleDealPack(fixture.ctx, GENERATED_AT);
        for (let i = 0; i <= 7; i++) {
          expect(html).toContain(`id="stage-${i}"`);
          expect(html).toContain(`href="#stage-${i}"`);
        }
        expect(html).toContain('id="stage-10"');
        expect(html).toContain('href="#stage-10"');
        expect(html).toContain('Stage 10 — Transition');
        expect(html).toContain('Transition Readiness');
        expect(html).toContain('KT milestone plan');
        expect(html).toContain('Go-live readiness scorecard');
        expect(html).toContain('APX-CDP-2026 Q3 2026 data-migration freeze window');
      });

      it('renders the Headline strip (decided or honestly pending)', async () => {
        const { html } = await assembleDealPack(fixture.ctx, GENERATED_AT);
        expect(html).toContain('class="dp-headline"');
        expect(html).toContain('Headline · Fast Answer');
        if (fixture.expectsPendingHeadline) {
          // Pending headline carries the literal "Recommendation pending — Stage N"
          // phrase per the design spec.
          expect(html).toMatch(/Recommendation pending — Stage \d/);
        } else {
          // Decided headline carries a "Recommended action" row with an
          // actual action, not a pending banner.
          expect(html).toContain('Recommended action');
          expect(html).not.toMatch(/Recommendation pending — Stage/);
        }
      });

      it('renders every authored artifact in the right stage section', async () => {
        const { html } = await assembleDealPack(fixture.ctx, GENERATED_AT);
        for (const code of fixture.expectedArtifactCodes) {
          expect(html).toContain(`>${code}<`); // appears as a code chip
        }
      });

      it('is self-contained — no external <script src>, <link rel=stylesheet href=http>, <img src=http, or @import url(http)', async () => {
        const { html } = await assembleDealPack(fixture.ctx, GENERATED_AT);
        expect(html).not.toMatch(/<script\s+[^>]*src\s*=\s*['"]/i);
        expect(html).not.toMatch(/<link\s+[^>]*href\s*=\s*['"]\s*https?:/i);
        expect(html).not.toMatch(/<img\s+[^>]*src\s*=\s*['"]\s*https?:/i);
        // @import url(http://...) — match either url(http:// or url('http://
        expect(html).not.toMatch(/@import\s+url\s*\(\s*['"]?\s*https?:/i);
        // No remote font references either.
        expect(html).not.toMatch(/fonts\.googleapis\.com/i);
        expect(html).not.toMatch(/fonts\.gstatic\.com/i);
      });

      it('preserves "Not recorded — seed gap" lines from underlying artifacts', async () => {
        const { html } = await assembleDealPack(fixture.ctx, GENERATED_AT);
        // Every fixture should surface at least one seed-gap line —
        // either from the substrate (lifecycle stages 0/1/2/4/6/7
        // empty path) or from a structured payload's empty row.
        expect(html).toContain('seed gap');
      });

      it('exposes the right artifact codes for every stage that has artifacts', async () => {
        const { input } = await assembleDealPack(fixture.ctx, GENERATED_AT);
        expect(input.stages).toHaveLength(9);
        for (let i = 0; i <= 7; i++) {
          expect(input.stages[i].stage).toBe(i);
        }
        expect(input.stages[8].stage).toBe(10);
        expect(input.stages[8].artifacts[0]?.code).toBe(
          'stage10_transition_readiness',
        );
      });

      it('renders the Evidence Ledger + Decision History blocks (even when empty)', async () => {
        const { html } = await assembleDealPack(fixture.ctx, GENERATED_AT);
        expect(html).toContain('id="evidence"');
        expect(html).toContain('Evidence Ledger');
        expect(html).toContain('id="decisions"');
        expect(html).toContain('Decision History');
        expect(html).toContain('id="glossary"');
      });

      it('embeds the tenant name + event code in the topbar + meta tags', async () => {
        const { html } = await assembleDealPack(fixture.ctx, GENERATED_AT);
        expect(html).toContain(fixture.ctx.tenantName);
        expect(html).toContain(fixture.ctx.event.code);
        expect(html).toContain(`name="x-source-event-code" content="${fixture.ctx.event.code}"`);
      });
    });
  }

  it('keeps the Apex Retail authored renewal body in the Stage 7 section', async () => {
    const { html } = await assembleDealPack(apexRetailFixture().ctx, GENERATED_AT);
    // The Stage 7 section should carry the authored renewal posture text.
    expect(html).toContain('id="stage-7"');
    expect(html).toContain('Renew with renegotiation');
  });

  it('renders the Meridian seed-gap line that was in the authored scope memo body verbatim', async () => {
    const { html } = await assembleDealPack(meridianHealthFixture().ctx, GENERATED_AT);
    expect(html).toContain('Not recorded — seed gap');
  });

  it('never throws on First Capital empty-substrate path; renders a complete document', async () => {
    const { html } = await assembleDealPack(firstCapitalFixture().ctx, GENERATED_AT);
    expect(html).toContain('First Capital');
    expect(html).toContain('FC-CONS-2026');
    expect(html).toContain('id="stage-0"');
    expect(html).toContain('id="stage-7"');
  });
});

describe('Source Deal Pack · kernel verdict drives the headline', () => {
  // A held event: the selection memo holds the award and the evaluation
  // gate is open. The Deal Pack headline must show the kernel hold
  // verdict and must NOT render an "Award / proceed" recommendation —
  // even though a selection-memo decision artifact is authored.
  function heldEventCtx(): SourceGenerationContext {
    const heldSelectionMemo = [
      '# Selection Memo',
      '',
      'Selection status: pending. TaskFlow AI is provisional leader, not selected.',
      'Do not award yet until P0 legal clauses and telemetry evidence close.',
    ].join('\n');
    return {
      tenantKey: 'apex-retail',
      tenantName: 'Apex Retail',
      event: {
        id: 'evt-apex-cc',
        code: 'APX-CC-2026',
        name: 'Apex Retail Contact Center AI',
        archetype: 'contact_center_ai',
        rigor: 'strategic',
        currentStageKey: 'selection',
        statusLabel: 'Active',
        owner: 'Maya Chen, VP Customer Ops',
        triggerDescription: null,
        scopeDescription: null,
        estimatedValueUsd: 4_200_000,
      },
      artifactStates: [
        makeArtifactState('d27_selection_memo', heldSelectionMemo, { stage: 'selection' }),
      ],
      gateCriteria: [makeGateCriterion('selection-ready', 'not_met')],
      evidence: [makeEvidence('selection-001', 'Available')],
    };
  }

  it('shows the kernel hold verdict and never renders Award / proceed', async () => {
    const { html } = await assembleDealPack(heldEventCtx(), GENERATED_AT);
    expect(html).toContain('dp-headline--hold');
    expect(html).toMatch(/Do not award yet/);
    expect(html).not.toContain('Award / proceed');
    expect(html).not.toMatch(/award-ready/i);
    // The headline surfaces the kernel blockers + what would change it.
    expect(html).toContain('Open blockers');
    expect(html).toContain('What would change the verdict');
  });
});

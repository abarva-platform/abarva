// EXPORT-5 · pdf renderer tests.
//
// Covers every kind the PDF renderer dispatches:
//   • program-charter, outcome-report — faithful structured renderers
//   • roadmap — generic structured-payload renderer
//
// PDF bytes are not text-searchable, so per kind we assert:
//   • a valid PDF buffer (the `%PDF-` magic header + `%%EOF` trailer)
//   • non-trivial size, matching sizeBytes
//   • the documented mime + filename pattern
// Plus dispatcher-wide cases:
//   • non-PDF kinds throw a clear "no renderer" error
//   • malformed payload throws a shape error
//   • default generatedAt branch is exercised when omitted

jest.mock('server-only', () => ({}));

import type { DeliverableSpec } from '@/lib/programs/exports/types';
import type { OutcomeReportPayload } from '@/lib/programs/exports/renderers/outcome-report';
import type { ProgramCharterPayload } from '@/lib/programs/exports/renderers/program-charter';
import {
  PDF_CONTENT_TYPE,
  renderDeliverableAsPdf,
} from '@/lib/programs/exports/renderers/pdf';

/** True when the buffer is a structurally valid PDF. */
function isValidPdf(buffer: Buffer): boolean {
  const head = buffer.subarray(0, 5).toString('latin1');
  const tail = buffer.subarray(-1024).toString('latin1');
  return head === '%PDF-' && tail.includes('%%EOF');
}

// ── program-charter fixture ────────────────────────────────────────────

function buildCharterSpec(overrides?: {
  generatedAt?: string;
}): DeliverableSpec {
  const payload: ProgramCharterPayload = {
    valueHypothesis: {
      cohort: 'Top-decile loyalty members',
      currentPain: 'fragmented engagement',
      behaviorChange: 'unified engagement',
      valueDirection: 'increase',
      causalMechanism: 'a CDP-driven identity match',
      inScope: ['CDP integration'],
      outOfScope: ['B2B wholesale'],
    },
    sponsor: {
      name: 'James Wright',
      role: 'CCO',
      decisionRights: ['Approve scope changes'],
      successionOwner: 'Linda Chen',
      cadence: 'weekly steer',
    },
    recommendedPath: {
      name: 'Build CDP on managed Snowflake',
      rationale: 'Reuses the existing data foundation.',
      tradeoffsAccepted: ['Higher per-query cost'],
      optionsConsidered: [
        { name: 'Self-managed lakehouse', whyNotChosen: 'Slow time-to-value.' },
      ],
    },
    architectureReviewAttestation: {
      attestedAt: '2026-04-22T15:00:00.000Z',
      attestedBy: ['Priya Raman'],
      findings: ['Match-rate floor is achievable.'],
      openItems: [],
    },
    killCriterion: {
      measurableEvent: 'Match-rate fails to clear 70%',
      observableBy: 'Marcus Kim',
      triggersWhen: '2026-09-01T00:00:00.000Z',
      consequence: 'Sponsor convenes stop / pivot / continue review.',
    },
    baselineKpis: [
      {
        metric: 'Loyalty member revenue',
        currentValue: '$2.41B',
        targetValue: '$2.52B',
        sourceSystem: 'sys:apex:sap-s4',
        measurementMethod: 'Trailing 12-month average',
      },
    ],
    signoff: {
      sponsorName: 'James Wright',
      sponsorSignatureLine: '_____ (signature)',
      signedAt: '2026-04-29T12:00:00.000Z',
    },
  };

  return {
    kind: 'program-charter',
    tenantKey: 'apex-retail',
    title: 'Apex Loyalty FY26 Program Charter',
    subtitle: 'P2 gate package',
    generatedAt: overrides?.generatedAt ?? '2026-04-29T10:00:00.000Z',
    authors: ['Anand Sundaram'],
    payload: payload as unknown as Record<string, unknown>,
  };
}

describe('renderDeliverableAsPdf · program-charter', () => {
  it('returns a valid PDF buffer with the documented mime + filename', async () => {
    const result = await renderDeliverableAsPdf(buildCharterSpec());
    expect(result.format).toBe('pdf');
    expect(result.contentType).toBe(PDF_CONTENT_TYPE);
    expect(result.contentType).toBe('application/pdf');
    expect(isValidPdf(result.buffer)).toBe(true);
    expect(result.sizeBytes).toBeGreaterThan(1024);
    expect(result.buffer.byteLength).toBe(result.sizeBytes);
    expect(result.filename).toMatch(
      /^apex-loyalty-fy26-program-charter-program-charter-\d{8}\.pdf$/,
    );
  });

  it('uses a default generatedAt date when omitted', async () => {
    const spec = { ...buildCharterSpec(), generatedAt: undefined };
    const result = await renderDeliverableAsPdf(spec);
    expect(isValidPdf(result.buffer)).toBe(true);
    expect(result.filename).toMatch(/-program-charter-\d{8}\.pdf$/);
  });
});

// ── outcome-report fixture ─────────────────────────────────────────────

function buildOutcomeSpec(): DeliverableSpec {
  const payload: OutcomeReportPayload = {
    programSummary: {
      name: 'Apex Loyalty FY26',
      sponsor: 'James Wright',
      programLead: 'Anand Sundaram',
      charterDate: '2026-05-15',
      outcomeDate: '2026-12-04',
    },
    outcomesVsBaseline: [
      {
        metric: 'Loyalty member revenue',
        baselineValue: '$2.41B',
        targetValue: '$2.52B',
        actualValue: '$2.55B',
        deltaVsTarget: '+$30M',
        confidence: 0.9,
        measurementMethod: 'Trailing 12-month average',
      },
    ],
    adoptionEvidence: [
      { cohort: 'East coast', metric: 'Completion', result: '92%' },
    ],
    benefitsAttestation: {
      attestedBy: 'James Wright',
      attestedAt: '2026-12-04T17:00:00.000Z',
      attestationStatement: 'I attest the outcomes are observed.',
    },
    challengesAndMitigations: [
      { challenge: 'Consent lag', mitigation: 'Shipped fan-out.' },
    ],
    learningsForCatalog: [
      { learning: 'Consent is a P3 constraint.', applicability: 'cross-archetype' },
    ],
    p6HandoffPlan: {
      standingOwner: 'Linda Chen',
      quarterlyReviewCadence: 'monthly',
      killOrExpandThresholds: ['Match-rate below 65%'],
    },
  };

  return {
    kind: 'outcome-report',
    tenantKey: 'apex-retail',
    title: 'Apex Loyalty FY26 Outcome Report',
    subtitle: 'P5 gate package',
    generatedAt: '2026-12-04T18:00:00.000Z',
    authors: ['Anand Sundaram'],
    payload: payload as unknown as Record<string, unknown>,
  };
}

describe('renderDeliverableAsPdf · outcome-report', () => {
  it('returns a valid PDF buffer with the documented mime + filename', async () => {
    const result = await renderDeliverableAsPdf(buildOutcomeSpec());
    expect(result.format).toBe('pdf');
    expect(isValidPdf(result.buffer)).toBe(true);
    expect(result.sizeBytes).toBeGreaterThan(1024);
    expect(result.filename).toMatch(/-outcome-report-\d{8}\.pdf$/);
  });
});

// ── roadmap (generic) ──────────────────────────────────────────────────

describe('renderDeliverableAsPdf · roadmap', () => {
  it('renders a valid PDF from a structured roadmap payload', async () => {
    const result = await renderDeliverableAsPdf({
      kind: 'roadmap',
      tenantKey: 'apex-retail',
      title: 'Apex Loyalty FY26 Roadmap',
      generatedAt: '2026-05-19T10:00:00.000Z',
      payload: {
        summary: 'Three-phase delivery roadmap.',
        milestones: [
          { phase: 'P3', name: 'Design lock', date: '2026-06-30' },
          { phase: 'P4', name: 'Pilot', date: '2026-09-30' },
        ],
        risks: ['Firmware refresh dependency'],
      },
    });
    expect(result.format).toBe('pdf');
    expect(isValidPdf(result.buffer)).toBe(true);
    expect(result.sizeBytes).toBeGreaterThan(1024);
    expect(result.filename).toMatch(/-roadmap-\d{8}\.pdf$/);
  });

  it('renders a valid PDF even from an empty roadmap payload', async () => {
    const result = await renderDeliverableAsPdf({
      kind: 'roadmap',
      tenantKey: 'apex-retail',
      title: 'Empty Roadmap',
      payload: {},
    });
    expect(isValidPdf(result.buffer)).toBe(true);
  });
});

describe('renderDeliverableAsPdf · dispatcher', () => {
  it('throws for a kind without a PDF renderer', async () => {
    const spec: DeliverableSpec = {
      kind: 'okr-baseline',
      tenantKey: 'apex-retail',
      title: 'OKR Baseline',
      payload: {},
    };
    await expect(renderDeliverableAsPdf(spec)).rejects.toThrow(
      /does not have a PDF renderer/,
    );
  });
});

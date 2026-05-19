// EXPORT-4-EXTEND · html renderer tests.
//
// Covers every kind the HTML renderer dispatches:
//   • program-charter, outcome-report — faithful structured renderers
//   • stakeholder-map, synthesis-options-table, architecture-sketch,
//     roadmap — generic structured-payload renderer
//
// Per kind: renderer returns a non-empty UTF-8 HTML buffer (size + mime +
// filename); the document is a valid standalone HTML doc; the spec title
// and major sections appear; unsafe payload content (`<script>`) is
// HTML-escaped to literal text, never an executable tag; absent sections
// render an explicit empty state.
//
// Plus dispatcher-wide cases:
//   • Non-HTML kinds throw a clear "no renderer" error.
//   • Default generatedAt branch is exercised when omitted.

jest.mock('server-only', () => ({}));

import type { DeliverableSpec } from '@/lib/programs/exports/types';
import type { OutcomeReportPayload } from '@/lib/programs/exports/renderers/outcome-report';
import type { ProgramCharterPayload } from '@/lib/programs/exports/renderers/program-charter';
import {
  HTML_CONTENT_TYPE,
  renderDeliverableAsHtml,
} from '@/lib/programs/exports/renderers/html';

/** Decode the render buffer back to a UTF-8 HTML string. */
function html(buffer: Buffer): string {
  return buffer.toString('utf-8');
}

// ── program-charter fixture ────────────────────────────────────────────

function buildCharterSpec(overrides?: {
  namedDissenter?: ProgramCharterPayload['namedDissenter'];
  injectScript?: boolean;
  generatedAt?: string;
}): DeliverableSpec {
  const payload: ProgramCharterPayload = {
    valueHypothesis: {
      cohort: 'Top-decile loyalty members',
      currentPain: 'fragmented engagement across touchpoints',
      behaviorChange: 'unified personalized engagement',
      valueDirection: 'increase',
      causalMechanism: 'a CDP-driven identity match',
      inScope: ['CDP integration with SAP S/4'],
      outOfScope: ['B2B wholesale customers'],
    },
    sponsor: {
      name: 'James Wright',
      role: 'Chief Customer Officer',
      decisionRights: ['Approve scope changes', 'Sign phase gates'],
      successionOwner: 'Linda Chen',
      cadence: 'weekly 30-min steer',
    },
    recommendedPath: {
      name: 'Build CDP on managed Snowflake',
      rationale: 'Reuses the existing data foundation.',
      tradeoffsAccepted: overrides?.injectScript
        ? ['<script>alert(1)</script>', 'Higher per-query cost']
        : ['Higher per-query cost'],
      optionsConsidered: [
        {
          name: 'Self-managed lakehouse',
          whyNotChosen: 'Two-quarter time-to-value.',
        },
      ],
    },
    architectureReviewAttestation: {
      attestedAt: '2026-04-22T15:00:00.000Z',
      attestedBy: ['Priya Raman'],
      findings: ['Identity match-rate floor is achievable.'],
      openItems: ['Resolve consent propagation.'],
    },
    killCriterion: {
      measurableEvent: 'Identity match-rate fails to clear 70%',
      observableBy: 'Marcus Kim',
      triggersWhen: '2026-09-01T00:00:00.000Z',
      consequence: 'Sponsor convenes stop / pivot / continue review.',
    },
    namedDissenter: overrides?.namedDissenter,
    baselineKpis: [
      {
        metric: 'Loyalty member revenue',
        currentValue: '$2.41B',
        targetValue: '$2.52B',
        sourceSystem: 'sys:apex:sap-s4',
        measurementMethod: 'Trailing 12-month average',
      },
      {
        metric: 'Net promoter score',
        currentValue: '38',
        targetValue: '46',
        sourceSystem: 'sys:apex:qualtrics',
        measurementMethod: 'Quarterly survey',
      },
    ],
    signoff: {
      sponsorName: 'James Wright',
      sponsorSignatureLine: '_______________________ (signature)',
      signedAt: '2026-04-29T12:00:00.000Z',
      notes: 'Sign-off contingent on consent open item.',
    },
  };

  return {
    kind: 'program-charter',
    tenantKey: 'apex-retail',
    programId: 'prog_apex_loyalty_fy26',
    title: 'Apex Loyalty FY26 Program Charter',
    subtitle: 'P2 gate package',
    generatedAt: overrides?.generatedAt ?? '2026-04-29T10:00:00.000Z',
    authors: ['Anand Sundaram'],
    payload: payload as unknown as Record<string, unknown>,
  };
}

describe('renderDeliverableAsHtml · program-charter', () => {
  it('returns a non-empty UTF-8 HTML buffer with mime + filename', async () => {
    const result = await renderDeliverableAsHtml(buildCharterSpec());
    expect(result.format).toBe('html');
    expect(result.contentType).toBe(HTML_CONTENT_TYPE);
    expect(result.contentType).toBe('text/html; charset=utf-8');
    expect(result.sizeBytes).toBeGreaterThan(500);
    expect(result.buffer.byteLength).toBe(result.sizeBytes);
    expect(result.filename).toMatch(
      /^apex-loyalty-fy26-program-charter-program-charter-\d{8}\.html$/,
    );
    expect(result.filename).toContain('-20260429.html');
  });

  it('renders a valid standalone HTML document with the title', async () => {
    const result = await renderDeliverableAsHtml(buildCharterSpec());
    const doc = html(result.buffer);
    expect(doc.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(doc).toContain('</html>');
    expect(doc).toContain('Apex Loyalty FY26 Program Charter');
    expect(doc).toContain('SIGNED PROGRAM CHARTER');
  });

  it('renders every major section heading', async () => {
    const result = await renderDeliverableAsHtml(buildCharterSpec());
    const doc = html(result.buffer);
    for (const heading of [
      'Value hypothesis',
      'Sponsor commitment',
      'Recommended path',
      'Architecture review attestation',
      'Kill criterion',
      'Baseline KPIs',
      'Sponsor sign-off',
    ]) {
      expect(doc).toContain(heading);
    }
  });

  it('renders the baseline KPI table with N data rows', async () => {
    const result = await renderDeliverableAsHtml(buildCharterSpec());
    const doc = html(result.buffer);
    const tableMatch = doc.match(/<table>[\s\S]*?<\/table>/);
    expect(tableMatch).not.toBeNull();
    const rowCount = (tableMatch?.[0].match(/<tr>/g) ?? []).length;
    // 2 KPIs + 1 header row.
    expect(rowCount).toBe(3);
    expect(doc).toContain('Loyalty member revenue');
  });

  it('escapes <script> in payload content to literal text', async () => {
    const result = await renderDeliverableAsHtml(
      buildCharterSpec({ injectScript: true }),
    );
    const doc = html(result.buffer);
    expect(doc).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(doc).not.toContain('<script>alert(1)</script>');
  });

  it('omits the Named dissenter section when not provided', async () => {
    const result = await renderDeliverableAsHtml(buildCharterSpec());
    expect(html(result.buffer)).not.toContain('Named dissenter');
  });

  it('renders the Named dissenter section verbatim when set', async () => {
    const result = await renderDeliverableAsHtml(
      buildCharterSpec({
        namedDissenter: {
          name: 'Sara Patel',
          role: 'VP, Field Operations',
          objection: 'Centralized CDP erodes store autonomy.',
          mitigationOrAcceptance: 'Quarterly field-ops council committed.',
        },
      }),
    );
    const doc = html(result.buffer);
    expect(doc).toContain('Named dissenter');
    expect(doc).toContain('Sara Patel');
    expect(doc).toContain('Centralized CDP erodes store autonomy.');
  });

  it('uses a default generatedAt date when omitted', async () => {
    const spec = { ...buildCharterSpec(), generatedAt: undefined };
    const result = await renderDeliverableAsHtml(spec);
    expect(result.filename).toMatch(/-program-charter-\d{8}\.html$/);
  });
});

// ── outcome-report fixture ─────────────────────────────────────────────

function buildOutcomeSpec(): DeliverableSpec {
  const payload: OutcomeReportPayload = {
    programSummary: {
      name: 'Apex Loyalty FY26',
      sponsor: 'James Wright, CCO',
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
        deltaVsTarget: '+$30M vs target',
        confidence: 0.9,
        measurementMethod: 'Trailing 12-month average',
      },
    ],
    adoptionEvidence: [
      {
        cohort: 'East coast stores',
        metric: 'Workflow completion',
        result: '92% within 30 days',
      },
    ],
    benefitsAttestation: {
      attestedBy: 'James Wright, CCO',
      attestedAt: '2026-12-04T17:00:00.000Z',
      attestationStatement: 'I attest the outcomes are observed.',
    },
    challengesAndMitigations: [
      {
        challenge: 'Consent propagation lag exceeded 30 minutes',
        mitigation: 'Engineering shipped event-driven fan-out.',
      },
    ],
    learningsForCatalog: [
      {
        learning: 'Consent propagation is a P3 design constraint.',
        applicability: 'cross-archetype',
      },
    ],
    p6HandoffPlan: {
      standingOwner: 'Linda Chen',
      quarterlyReviewCadence: 'monthly then quarterly',
      killOrExpandThresholds: ['Match-rate below 65% for 30 days'],
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

describe('renderDeliverableAsHtml · outcome-report', () => {
  it('renders a non-empty HTML buffer with the documented mime + filename', async () => {
    const result = await renderDeliverableAsHtml(buildOutcomeSpec());
    expect(result.format).toBe('html');
    expect(result.sizeBytes).toBeGreaterThan(500);
    expect(result.filename).toMatch(/-outcome-report-\d{8}\.html$/);
  });

  it('renders every section heading and the P5 banner', async () => {
    const result = await renderDeliverableAsHtml(buildOutcomeSpec());
    const doc = html(result.buffer);
    expect(doc).toContain('OUTCOME REPORT');
    for (const heading of [
      'Program summary',
      'Outcomes vs. baseline',
      'Adoption evidence',
      'Benefits attestation',
      'Challenges and mitigations',
      'Learnings for pattern catalog',
      'P6 handoff plan',
    ]) {
      expect(doc).toContain(heading);
    }
  });

  it('renders confidence as a percent in the outcomes table', async () => {
    const result = await renderDeliverableAsHtml(buildOutcomeSpec());
    expect(html(result.buffer)).toContain('90%');
  });
});

// ── generic structured-payload kinds ───────────────────────────────────

describe('renderDeliverableAsHtml · generic structured kinds', () => {
  const genericKinds = [
    'stakeholder-map',
    'synthesis-options-table',
    'architecture-sketch',
    'roadmap',
  ] as const;

  it('renders a faithful HTML doc for each generic kind from its payload', async () => {
    for (const kind of genericKinds) {
      const spec: DeliverableSpec = {
        kind,
        tenantKey: 'apex-retail',
        title: `Apex ${kind} Deliverable`,
        generatedAt: '2026-05-19T10:00:00.000Z',
        payload: {
          summary: 'A faithful one-line summary.',
          rows: [
            { name: 'Row A', owner: 'Marcus Kim', status: 'on-track' },
            { name: 'Row B', owner: 'Linda Chen', status: 'at-risk' },
          ],
          notes: ['First note', 'Second note'],
        },
      };
      const result = await renderDeliverableAsHtml(spec);
      const doc = html(result.buffer);
      expect(result.format).toBe('html');
      expect(result.sizeBytes).toBeGreaterThan(500);
      expect(doc.startsWith('<!DOCTYPE html>')).toBe(true);
      expect(doc).toContain(`Apex ${kind} Deliverable`);
      // Payload data renders faithfully — no invention.
      expect(doc).toContain('A faithful one-line summary.');
      expect(doc).toContain('Row A');
      expect(doc).toContain('Marcus Kim');
      expect(doc).toContain('First note');
      // Object-array renders as a table.
      expect(doc).toContain('<table>');
    }
  });

  it('renders an explicit empty state for an empty payload', async () => {
    const result = await renderDeliverableAsHtml({
      kind: 'roadmap',
      tenantKey: 'apex-retail',
      title: 'Empty Roadmap',
      payload: {},
    });
    expect(html(result.buffer)).toContain('No roadmap content was recorded');
  });

  it('escapes <script> in generic payload values', async () => {
    const result = await renderDeliverableAsHtml({
      kind: 'architecture-sketch',
      tenantKey: 'apex-retail',
      title: 'Sketch',
      payload: { detail: '<script>alert(1)</script>' },
    });
    const doc = html(result.buffer);
    expect(doc).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(doc).not.toContain('<script>alert(1)</script>');
  });
});

describe('renderDeliverableAsHtml · dispatcher', () => {
  it('throws for a kind without an HTML renderer', async () => {
    const spec: DeliverableSpec = {
      kind: 'okr-baseline',
      tenantKey: 'apex-retail',
      title: 'OKR Baseline',
      payload: {},
    };
    await expect(renderDeliverableAsHtml(spec)).rejects.toThrow(
      /does not have an HTML renderer/,
    );
  });
});

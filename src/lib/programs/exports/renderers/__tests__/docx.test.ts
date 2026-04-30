// EXPORT-3 · docx.ts + program-charter.ts unit tests.
//
// Covers:
//   • Pure renderer returns a valid docx buffer (size + mime + filename).
//   • Title page contains the title.
//   • Each major section heading appears.
//   • Kill criterion measurable event appears verbatim.
//   • Baseline KPIs table has N+1 rows (header + N data rows).
//   • namedDissenter section is absent when undefined, present when set.
//   • Unsafe content (`<script>...</script>`) is rendered as literal text:
//     the underlying `word/document.xml` escapes the angle brackets.
//   • Unsupported DOCX kinds throw the documented EXPORT-3-EXTEND error.
//   • Non-DOCX-default kinds throw a clear "no renderer" error.
//   • Malformed payload throws a clear shape error.
//   • Default generatedAt branch is exercised when omitted.

jest.mock('server-only', () => ({}));

import JSZip from 'jszip';

import type { DeliverableSpec } from '@/lib/programs/exports/types';
import type { DecisionLogPayload } from '@/lib/programs/exports/renderers/decision-log';
import type { DiscoveryReportPayload } from '@/lib/programs/exports/renderers/discovery-report';
import {
  DOCX_CONTENT_TYPE,
  renderDeliverableAsDocx,
} from '@/lib/programs/exports/renderers/docx';
import type { MeetingNotesPayload } from '@/lib/programs/exports/renderers/meeting-notes';
import type { OutcomeReportPayload } from '@/lib/programs/exports/renderers/outcome-report';
import type { ProgramCharterPayload } from '@/lib/programs/exports/renderers/program-charter';

/** Open the docx buffer as a zip and return the raw `word/document.xml`. */
async function readDocumentXml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const entry = zip.file('word/document.xml');
  if (entry === null) {
    throw new Error('word/document.xml not found in docx zip.');
  }
  return entry.async('string');
}

/** Strip `<w:...>` element tags so we can assert on rendered text only. */
function strippedText(xml: string): string {
  return xml.replace(/<[^>]+>/g, '');
}

/** Build a fully-populated charter spec. */
function buildSpec(overrides?: {
  namedDissenter?: ProgramCharterPayload['namedDissenter'];
  tradeoffsAccepted?: ReadonlyArray<string>;
  baselineKpis?: ProgramCharterPayload['baselineKpis'];
  generatedAt?: string;
  authors?: ReadonlyArray<string>;
}): DeliverableSpec {
  const payload: ProgramCharterPayload = {
    valueHypothesis: {
      cohort: 'Top-decile loyalty members',
      currentPain:
        'fragmented engagement across web, app, and store touchpoints',
      behaviorChange:
        'unified personalized engagement across all touchpoints within a single quarter',
      valueDirection: 'increase',
      causalMechanism:
        'a CDP-driven identity match enabling next-best-action prompts at point of contact',
      inScope: [
        'Customer Data Platform integration with SAP S/4 and POS',
        'Identity match-rate uplift to 70% for top-decile cohort',
      ],
      outOfScope: [
        'B2B wholesale customers',
        'Operational analytics for stocking and replenishment',
      ],
    },
    sponsor: {
      name: 'James Wright',
      role: 'Chief Customer Officer',
      decisionRights: [
        'Approve scope changes that exceed 10% of original budget',
        'Resolve cross-functional escalations within 5 business days',
        'Sign off on phase gates P2 through P6',
      ],
      successionOwner: 'Linda Chen, VP Customer Engagement',
      cadence: 'weekly 30-min steer + monthly 90-min review',
    },
    recommendedPath: {
      name: 'Build CDP on managed Snowflake foundation',
      rationale:
        'Managed Snowflake reuses the existing data foundation, shortens time-to-value to one quarter, and avoids duplicating identity infrastructure that adjacent programs already rely on.',
      tradeoffsAccepted: [
        'Higher per-query cost vs. self-managed warehouse',
        'Vendor lock-in risk to Snowflake compute',
        '<script>alert(1)</script>',
      ],
      optionsConsidered: [
        {
          name: 'Self-managed lakehouse on Iceberg + Trino',
          whyNotChosen:
            'Two-quarter time-to-value and identity match work duplicates the existing Snowflake investment.',
        },
        {
          name: 'Vendor-packaged CDP (Salesforce CDP)',
          whyNotChosen:
            'Vendor demo over-promises against Apex identity-graph density; integration cost wipes the time advantage.',
        },
      ],
    },
    architectureReviewAttestation: {
      attestedAt: '2026-04-22T15:00:00.000Z',
      attestedBy: ['Priya Raman, Chief Architect', 'Marcus Kim, Data Architect'],
      findings: [
        'Identity match-rate floor of 70% is achievable given Q1 data quality.',
        'Latency budget for next-best-action prompts is tight but feasible.',
      ],
      openItems: [
        'Resolve consent propagation between web and app before pilot launch.',
      ],
    },
    killCriterion: {
      measurableEvent:
        'Identity match-rate fails to clear 70% within 90 days of build start',
      observableBy: 'Marcus Kim, Data Architect',
      triggersWhen: '2026-09-01T00:00:00.000Z',
      consequence:
        'Sponsor convenes stop / pivot / continue review within 5 business days; default action is stop unless mitigation plan is signed.',
    },
    namedDissenter:
      overrides?.namedDissenter !== undefined
        ? overrides.namedDissenter
        : undefined,
    baselineKpis: overrides?.baselineKpis ?? [
      {
        metric: 'Loyalty member revenue',
        currentValue: '$2.41B FY2025',
        targetValue: '$2.52B FY2026',
        sourceSystem: 'sys:apex:sap-s4',
        measurementMethod: 'Trailing 12-month average',
      },
      {
        metric: 'Net promoter score',
        currentValue: '38 (Q4 FY2025)',
        targetValue: '46',
        sourceSystem: 'sys:apex:qualtrics',
        measurementMethod: 'Quarterly survey, n>=2000',
      },
      {
        metric: 'Identity match-rate (top decile)',
        currentValue: '54%',
        targetValue: '70%',
        sourceSystem: 'sys:apex:cdp-internal',
        measurementMethod: 'Daily match-rate snapshot',
      },
    ],
    signoff: {
      sponsorName: 'James Wright',
      sponsorSignatureLine: '_______________________ (signature)',
      signedAt: '2026-04-29T12:00:00.000Z',
      notes: 'Sign-off contingent on consent propagation open item closing by build start.',
    },
  };

  if (overrides?.tradeoffsAccepted !== undefined) {
    payload.recommendedPath = {
      ...payload.recommendedPath,
      tradeoffsAccepted: overrides.tradeoffsAccepted,
    };
  }

  return {
    kind: 'program-charter',
    tenantKey: 'apex-retail',
    programId: 'prog_apex_loyalty_fy26',
    title: 'Apex Loyalty FY26 Program Charter',
    subtitle: 'Top-decile loyalty engagement program · P2 gate package',
    generatedAt: overrides?.generatedAt ?? '2026-04-29T10:00:00.000Z',
    authors:
      overrides?.authors !== undefined
        ? [...overrides.authors]
        : ['Anand Sundaram', 'James Wright'],
    payload: payload satisfies ProgramCharterPayload as unknown as Record<
      string,
      unknown
    >,
  };
}

describe('renderDeliverableAsDocx · program-charter', () => {
  it('returns a valid docx buffer with the documented mime + filename', async () => {
    const spec = buildSpec();
    const result = await renderDeliverableAsDocx(spec);

    expect(result.format).toBe('docx');
    expect(result.contentType).toBe(DOCX_CONTENT_TYPE);
    expect(result.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(result.sizeBytes).toBeGreaterThanOrEqual(5 * 1024);
    expect(result.sizeBytes).toBeLessThan(5 * 1024 * 1024);
    expect(result.buffer.byteLength).toBe(result.sizeBytes);
    expect(result.filename).toMatch(
      /^apex-loyalty-fy26-program-charter-program-charter-\d{8}\.docx$/,
    );
    // generatedAt: 2026-04-29 -> 20260429 in UTC.
    expect(result.filename).toContain('-20260429.docx');
  });

  it('the buffer is a valid OOXML zip with word/document.xml inside', async () => {
    const spec = buildSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);
    expect(xml.startsWith('<?xml')).toBe(true);
    expect(xml).toContain('<w:body');
  });

  it('renders the spec title on the title page', async () => {
    const spec = buildSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);
    const text = strippedText(xml);
    expect(text).toContain('Apex Loyalty FY26 Program Charter');
    expect(text).toContain('SIGNED PROGRAM CHARTER');
  });

  it('renders each major section heading', async () => {
    const spec = buildSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);
    const text = strippedText(xml);
    for (const heading of [
      'Value hypothesis',
      'Sponsor commitment',
      'Recommended path',
      'Architecture review attestation',
      'Kill criterion',
      'Baseline KPIs',
      'Sponsor sign-off',
    ]) {
      expect(text).toContain(heading);
    }
  });

  it('renders the kill criterion measurable event verbatim', async () => {
    const spec = buildSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);
    const text = strippedText(xml);
    expect(text).toContain(
      'Identity match-rate fails to clear 70% within 90 days of build start',
    );
  });

  it('baseline KPIs table has N+1 rows (header + N data rows)', async () => {
    const spec = buildSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);

    // <w:tbl> is the table element. Count its <w:tr> children. We only
    // produce one table in the charter (Baseline KPIs), but be defensive
    // and find it explicitly.
    const tableMatch = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/);
    expect(tableMatch).not.toBeNull();
    const tableXml = tableMatch?.[0] ?? '';
    const rowCount = (tableXml.match(/<w:tr[\s>]/g) ?? []).length;
    // 3 baseline KPIs + 1 header row.
    expect(rowCount).toBe(4);
  });

  it('omits the Named dissenter section when namedDissenter is undefined', async () => {
    const spec = buildSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);
    const text = strippedText(xml);
    expect(text).not.toContain('Named dissenter');
    expect(text).not.toContain('Verbatim objection');
  });

  it('renders the Named dissenter section verbatim when set', async () => {
    const spec = buildSpec({
      namedDissenter: {
        name: 'Sara Patel',
        role: 'VP, Field Operations',
        objection:
          'Centralized CDP will erode store-level autonomy and store-manager hiring authority.',
        mitigationOrAcceptance:
          'Sponsor commits to a quarterly field-ops council with binding scope-change voice for 4 quarters post-launch.',
      },
    });
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);
    const text = strippedText(xml);
    expect(text).toContain('Named dissenter');
    expect(text).toContain('Sara Patel');
    expect(text).toContain('VP, Field Operations');
    expect(text).toContain(
      'Centralized CDP will erode store-level autonomy and store-manager hiring authority.',
    );
    expect(text).toContain('quarterly field-ops council');
  });

  it('escapes HTML / unsafe tradeoff content in the underlying XML (no executable tags)', async () => {
    const spec = buildSpec({
      tradeoffsAccepted: ['<script>alert(1)</script>', 'Plain trade-off line'],
    });
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);

    // The literal text must be present after escaping; the unescaped tag
    // form must NEVER appear in the document.xml body. The escaped form
    // is what Word will render to the user as literal characters.
    expect(xml).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(xml).not.toContain('<script>alert(1)</script>');
    // The plain trade-off line still surfaces verbatim after stripping
    // the surrounding `<w:...>` element tags.
    const text = strippedText(xml);
    expect(text).toContain('Plain trade-off line');
    // Stripping `<w:...>` tags leaves the entity-escaped form intact —
    // proving the unsafe content was XML-escaped end-to-end, never
    // re-decoded into an executable tag.
    expect(text).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(text).not.toContain('<script>alert(1)</script>');
  });

  it('throws the EXPORT-3-EXTEND error for still-deferred DOCX-supporting kinds', async () => {
    // pilot-result-report and workshop-facilitator-guide remain deferred
    // after EXPORT-3-EXTEND ships the four new builders below.
    for (const kind of ['pilot-result-report', 'workshop-facilitator-guide'] as const) {
      const spec: DeliverableSpec = {
        kind,
        tenantKey: 'apex-retail',
        title: 'Deferred kind',
        payload: {},
      };
      await expect(renderDeliverableAsDocx(spec)).rejects.toThrow(
        /EXPORT-3-EXTEND/,
      );
    }
  });

  it('throws when called with a non-DOCX-default kind (e.g. okr-baseline)', async () => {
    const spec: DeliverableSpec = {
      kind: 'okr-baseline',
      tenantKey: 'apex-retail',
      title: 'OKR Baseline',
      payload: {},
    };
    await expect(renderDeliverableAsDocx(spec)).rejects.toThrow(
      /does not have a DOCX renderer/,
    );
  });

  it('throws when program-charter payload is malformed', async () => {
    const spec: DeliverableSpec = {
      kind: 'program-charter',
      tenantKey: 'apex-retail',
      title: 'Bad Charter',
      payload: { valueHypothesis: 'not-an-object' } as unknown as Record<
        string,
        unknown
      >,
    };
    await expect(renderDeliverableAsDocx(spec)).rejects.toThrow(
      /program-charter payload is malformed/,
    );
  });

  it('uses a default generatedAt date when omitted', async () => {
    const spec = buildSpec();
    const stripped: DeliverableSpec = { ...spec, generatedAt: undefined };
    const result = await renderDeliverableAsDocx(stripped);
    expect(result.filename).toMatch(/-program-charter-\d{8}\.docx$/);
  });
});

// ── EXPORT-3-EXTEND · discovery-report ─────────────────────────────────

function buildDiscoveryReportSpec(overrides?: {
  contradictions?: DiscoveryReportPayload['contradictions'];
  baseline?: DiscoveryReportPayload['baseline'];
}): DeliverableSpec {
  const payload: DiscoveryReportPayload = {
    problemStatement: {
      observedSeverity:
        '54% identity match-rate vs. 70% needed for top-decile next-best-action',
      affectedCohort: 'Top-decile loyalty members (FY2025: 412,000 members)',
      scopeBoundary:
        'B2B wholesale customers, store-stocking analytics, marketing-ops attribution',
    },
    baseline: overrides?.baseline ?? [
      {
        metric: 'Identity match-rate (top decile)',
        current: '54%',
        target: '70%',
        sourceSystem: 'sys:apex:cdp-internal',
        method: 'Daily match-rate snapshot, joined to loyalty roster',
        owner: 'Marcus Kim, Data Architect',
        confidence: 0.85,
      },
      {
        metric: 'Net promoter score (top decile)',
        current: '38',
        target: '46',
        sourceSystem: 'sys:apex:qualtrics',
        method: 'Quarterly survey, n>=2000',
        owner: 'Linda Chen, VP Customer Engagement',
        confidence: 0.9,
      },
    ],
    stakeholderMap: [
      {
        role: 'Sponsor',
        name: 'James Wright',
        orgUnit: 'CCO Office',
        decisionRights: ['Approve scope changes', 'Sign phase gates'],
      },
      {
        role: 'Business owner',
        name: 'Linda Chen',
        orgUnit: 'Customer Engagement',
        decisionRights: ['Use-case priority', 'Adoption ownership'],
      },
      {
        role: 'Data owner',
        name: 'Marcus Kim',
        orgUnit: 'Enterprise Data',
        decisionRights: ['Source system access', 'Identity match policy'],
      },
      {
        role: 'Field-ops dissenter',
        name: 'Sara Patel',
        orgUnit: 'Stores',
        decisionRights: ['Store-level workflow change'],
        isDissenter: true,
      },
    ],
    rootCauses: [
      {
        cause: 'Loyalty IDs are recreated per channel',
        evidence:
          'Source extract shows 31% of top-decile members hold ≥3 distinct loyalty IDs across web, app, and POS over FY2025.',
      },
      {
        cause: 'Consent state is not propagated cross-channel',
        evidence:
          'Privacy audit Q4 FY2025 logged 14% drop-off when web consent was revoked but app continued targeting.',
      },
    ],
    patternEvidence: {
      archetype: 'cdp-fragmentation',
      evidenceCollected: [
        'Identity overlap baseline across SAP S/4, POS, and app',
        'Source-system completeness/freshness profile (FY2025 monthly)',
        'Field interview series with 11 store leaders across 4 regions',
      ],
    },
    contradictions:
      overrides?.contradictions !== undefined
        ? overrides.contradictions
        : undefined,
    p2Recommendation: 'proceed',
    p2RecommendationRationale:
      'Problem is real, baseline is decision-grade, stakeholder map names a dissenter and a business owner. ' +
      'Synthesis can begin against two viable target-state options surfaced during Discovery.',
  };

  return {
    kind: 'discovery-report',
    tenantKey: 'apex-retail',
    programId: 'prog_apex_loyalty_fy26',
    title: 'Apex Loyalty FY26 Discovery Report',
    subtitle: 'Top-decile loyalty engagement · P1 gate package',
    generatedAt: '2026-04-29T10:00:00.000Z',
    authors: ['Anand Sundaram'],
    payload: payload satisfies DiscoveryReportPayload as unknown as Record<
      string,
      unknown
    >,
  };
}

describe('renderDeliverableAsDocx · discovery-report', () => {
  it('renders a non-trivial buffer with the documented mime + filename', async () => {
    const spec = buildDiscoveryReportSpec();
    const result = await renderDeliverableAsDocx(spec);

    expect(result.format).toBe('docx');
    expect(result.contentType).toBe(DOCX_CONTENT_TYPE);
    expect(result.sizeBytes).toBeGreaterThanOrEqual(5 * 1024);
    expect(result.filename).toMatch(/-discovery-report-\d{8}\.docx$/);
  });

  it('renders each section heading and the gate banner', async () => {
    const spec = buildDiscoveryReportSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);
    const text = strippedText(xml);
    expect(text).toContain('DISCOVERY REPORT');
    expect(text).toContain('P1 GATE PACKAGE');
    for (const heading of [
      'Problem statement',
      'OKR baseline',
      'Stakeholder map',
      'Root causes',
      'Pattern-specific evidence',
      'P2 readiness recommendation',
    ]) {
      expect(text).toContain(heading);
    }
  });

  it('baseline table has N+1 rows (header + N entries) and renders confidence', async () => {
    const spec = buildDiscoveryReportSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);

    // First table is the baseline. Find it explicitly.
    const tables = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) ?? [];
    expect(tables.length).toBeGreaterThanOrEqual(2);
    const baselineRowCount = (tables[0]?.match(/<w:tr[\s>]/g) ?? []).length;
    // 2 baseline entries + 1 header row.
    expect(baselineRowCount).toBe(3);

    const text = strippedText(xml);
    expect(text).toContain('85%');
    expect(text).toContain('90%');
  });

  it('omits the Contradictions section by default and includes it when set', async () => {
    const without = await renderDeliverableAsDocx(buildDiscoveryReportSpec());
    const xmlWithout = await readDocumentXml(without.buffer);
    expect(strippedText(xmlWithout)).not.toContain('Contradictions');

    const withSpec = buildDiscoveryReportSpec({
      contradictions: [
        {
          description:
            'P0 assumed sponsor authority across stores; field interviews surfaced shared authority with regional GMs.',
        },
      ],
    });
    const withResult = await renderDeliverableAsDocx(withSpec);
    const xmlWith = await readDocumentXml(withResult.buffer);
    const textWith = strippedText(xmlWith);
    expect(textWith).toContain('Contradictions');
    expect(textWith).toContain('shared authority with regional GMs');
  });

  it('renders the proceed/pivot/kill decision verbatim in bold', async () => {
    const spec = buildDiscoveryReportSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);
    const text = strippedText(xml);
    expect(text).toContain('PROCEED to P2 Synthesis');
  });

  it('throws when discovery-report payload is malformed', async () => {
    const spec: DeliverableSpec = {
      kind: 'discovery-report',
      tenantKey: 'apex-retail',
      title: 'Bad Discovery',
      payload: { problemStatement: 'not-an-object' } as unknown as Record<
        string,
        unknown
      >,
    };
    await expect(renderDeliverableAsDocx(spec)).rejects.toThrow(
      /discovery-report payload is malformed/,
    );
  });
});

// ── EXPORT-3-EXTEND · outcome-report ───────────────────────────────────

function buildOutcomeReportSpec(): DeliverableSpec {
  const payload: OutcomeReportPayload = {
    programSummary: {
      name: 'Apex Loyalty FY26',
      sponsor: 'James Wright, Chief Customer Officer',
      programLead: 'Anand Sundaram, Program Lead',
      charterDate: '2026-05-15',
      outcomeDate: '2026-12-04',
    },
    outcomesVsBaseline: [
      {
        metric: 'Loyalty member revenue',
        baselineValue: '$2.41B FY2025',
        targetValue: '$2.52B FY2026',
        actualValue: '$2.55B FY2026',
        deltaVsTarget: '+$30M vs target',
        confidence: 0.9,
        measurementMethod: 'Trailing 12-month average via SAP S/4',
      },
      {
        metric: 'Identity match-rate (top decile)',
        baselineValue: '54%',
        targetValue: '70%',
        actualValue: '73%',
        deltaVsTarget: '+3 pts vs target',
        confidence: 0.95,
        measurementMethod: 'Daily match-rate snapshot via CDP',
      },
    ],
    adoptionEvidence: [
      {
        cohort: 'East coast stores (wave 1)',
        metric: 'Workflow completion',
        result: '92% within 30 days of activation',
      },
      {
        cohort: 'West coast stores (wave 2)',
        metric: 'Exception volume',
        result: '4.1% workarounds vs 8% pilot',
      },
    ],
    benefitsAttestation: {
      attestedBy: 'James Wright, CCO',
      attestedAt: '2026-12-04T17:00:00.000Z',
      attestationStatement:
        'I attest that the outcomes above are observed against the P2 baseline and represent ' +
        'realized benefit fit for portfolio reporting.',
    },
    challengesAndMitigations: [
      {
        challenge: 'Consent propagation lag between web and app exceeded 30 minutes during wave 1',
        mitigation:
          'Engineering shipped event-driven consent fan-out before wave 2 launch; lag dropped to <90 seconds.',
      },
    ],
    learningsForCatalog: [
      {
        learning:
          'CDP fragmentation programs need consent propagation as a P3 design constraint, not a P5 fix.',
        applicability: 'cross-archetype',
      },
      {
        learning:
          'Apex retail rollout waves should sequence by geography first, then transaction volume.',
        applicability: 'archetype-specific',
      },
    ],
    p6HandoffPlan: {
      standingOwner: 'Linda Chen, VP Customer Engagement',
      quarterlyReviewCadence: 'monthly during Q1 FY27, then quarterly',
      killOrExpandThresholds: [
        'Identity match-rate falls below 65% for 30 consecutive days → trigger root-cause review',
        'Loyalty revenue growth flat vs. target for 2 consecutive quarters → expand or pivot review',
      ],
    },
  };

  return {
    kind: 'outcome-report',
    tenantKey: 'apex-retail',
    programId: 'prog_apex_loyalty_fy26',
    title: 'Apex Loyalty FY26 Outcome Report',
    subtitle: 'Top-decile loyalty engagement · P5 gate package',
    generatedAt: '2026-12-04T18:00:00.000Z',
    authors: ['Anand Sundaram', 'James Wright'],
    payload: payload satisfies OutcomeReportPayload as unknown as Record<
      string,
      unknown
    >,
  };
}

describe('renderDeliverableAsDocx · outcome-report', () => {
  it('renders a non-trivial buffer with the documented mime + filename', async () => {
    const spec = buildOutcomeReportSpec();
    const result = await renderDeliverableAsDocx(spec);
    expect(result.sizeBytes).toBeGreaterThanOrEqual(5 * 1024);
    expect(result.filename).toMatch(/-outcome-report-\d{8}\.docx$/);
  });

  it('renders each section heading and the P5 banner', async () => {
    const spec = buildOutcomeReportSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);
    const text = strippedText(xml);
    expect(text).toContain('OUTCOME REPORT');
    expect(text).toContain('P5 GATE PACKAGE');
    for (const heading of [
      'Program summary',
      'Outcomes vs. baseline',
      'Adoption evidence',
      'Benefits attestation',
      'Challenges and mitigations',
      'Learnings for pattern catalog',
      'P6 handoff plan',
    ]) {
      expect(text).toContain(heading);
    }
  });

  it('outcomes table has N+1 rows and renders confidence as a percent', async () => {
    const spec = buildOutcomeReportSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);
    const tables = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) ?? [];
    // outcomes is the first table.
    expect(tables.length).toBeGreaterThanOrEqual(2);
    const outcomesRowCount = (tables[0]?.match(/<w:tr[\s>]/g) ?? []).length;
    // 2 outcomes + 1 header row.
    expect(outcomesRowCount).toBe(3);
    const text = strippedText(xml);
    expect(text).toContain('90%');
    expect(text).toContain('95%');
  });

  it('renders the benefits attestation statement and signature line', async () => {
    const spec = buildOutcomeReportSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);
    const text = strippedText(xml);
    expect(text).toContain('James Wright, CCO');
    expect(text).toContain('(signature)');
    expect(text).toContain('represent realized benefit');
  });

  it('throws when outcome-report payload is malformed', async () => {
    const spec: DeliverableSpec = {
      kind: 'outcome-report',
      tenantKey: 'apex-retail',
      title: 'Bad Outcome',
      payload: { programSummary: 'not-an-object' } as unknown as Record<
        string,
        unknown
      >,
    };
    await expect(renderDeliverableAsDocx(spec)).rejects.toThrow(
      /outcome-report payload is malformed/,
    );
  });
});

// ── EXPORT-3-EXTEND · meeting-notes ────────────────────────────────────

function buildMeetingNotesSpec(overrides?: {
  agenda?: ReadonlyArray<string>;
  openQuestions?: ReadonlyArray<string>;
}): DeliverableSpec {
  const payload: MeetingNotesPayload = {
    meeting: {
      title: 'Apex Loyalty FY26 · P3 design review',
      type: 'workshop',
      date: '2026-07-08',
      durationMinutes: 90,
    },
    attendees: [
      { name: 'James Wright', role: 'CCO (sponsor)' },
      { name: 'Linda Chen', role: 'VP Customer Engagement' },
      { name: 'Marcus Kim', role: 'Data Architect' },
      { name: 'Anand Sundaram', role: 'Program Lead' },
    ],
    agenda:
      overrides?.agenda !== undefined
        ? overrides.agenda
        : undefined,
    keyDiscussions: [
      {
        topic: 'Consent propagation latency',
        summary:
          'Engineering walked through the proposed event-driven fan-out across web and app. Sponsor accepted the latency target of <90 seconds.',
      },
      {
        topic: 'Wave-1 cohort',
        summary:
          'East coast stores selected as wave-1 cohort given low transaction volatility and a willing operator team.',
      },
    ],
    decisions: [
      {
        decision: 'Adopt event-driven consent fan-out',
        decidedBy: 'James Wright, CCO',
        rationale:
          'Latency target is achievable and aligns with the consent propagation design constraint.',
      },
    ],
    actionItems: [
      {
        owner: 'Marcus Kim',
        action: 'Ship event-driven consent fan-out before wave-2 launch',
        dueBy: '2026-09-15',
      },
      {
        owner: 'Linda Chen',
        action: 'Confirm wave-1 east coast operator readiness',
        dueBy: '2026-08-01',
      },
    ],
    openQuestions:
      overrides?.openQuestions !== undefined
        ? overrides.openQuestions
        : undefined,
    notesAuthor: 'Anand Sundaram',
  };

  return {
    kind: 'meeting-notes',
    tenantKey: 'apex-retail',
    title: 'Apex Loyalty FY26 P3 Design Review Notes',
    subtitle: 'Workshop · 2026-07-08',
    generatedAt: '2026-07-08T18:00:00.000Z',
    authors: ['Anand Sundaram'],
    payload: payload satisfies MeetingNotesPayload as unknown as Record<
      string,
      unknown
    >,
  };
}

describe('renderDeliverableAsDocx · meeting-notes', () => {
  it('renders a non-trivial buffer with the documented mime + filename', async () => {
    const spec = buildMeetingNotesSpec();
    const result = await renderDeliverableAsDocx(spec);
    expect(result.sizeBytes).toBeGreaterThanOrEqual(5 * 1024);
    expect(result.filename).toMatch(/-meeting-notes-\d{8}\.docx$/);
  });

  it('renders the meeting type/date banner and required sections', async () => {
    const spec = buildMeetingNotesSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);
    const text = strippedText(xml);
    expect(text).toContain('MEETING NOTES');
    expect(text).toContain('WORKSHOP');
    expect(text).toContain('2026-07-08');
    for (const heading of [
      'Attendees',
      'Key discussions',
      'Decisions',
      'Action items',
      'Notes captured by',
    ]) {
      expect(text).toContain(heading);
    }
  });

  it('action items table has N+1 rows and includes the checkbox glyph', async () => {
    const spec = buildMeetingNotesSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);
    const tables = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) ?? [];
    // Tables, in order: attendees, decisions, action items.
    expect(tables.length).toBeGreaterThanOrEqual(3);
    const actionItemsTable = tables[2];
    const rowCount = (actionItemsTable?.match(/<w:tr[\s>]/g) ?? []).length;
    // 2 action items + 1 header row.
    expect(rowCount).toBe(3);
    expect(strippedText(xml)).toContain('☐');
  });

  it('omits agenda + open questions when not provided; renders when set', async () => {
    const without = await renderDeliverableAsDocx(buildMeetingNotesSpec());
    const xmlWithout = await readDocumentXml(without.buffer);
    const textWithout = strippedText(xmlWithout);
    expect(textWithout).not.toContain('Agenda');
    expect(textWithout).not.toContain('Open questions');

    const withSpec = buildMeetingNotesSpec({
      agenda: ['Consent propagation latency', 'Wave-1 cohort selection'],
      openQuestions: ['Do we need a separate consent UX for app users?'],
    });
    const withResult = await renderDeliverableAsDocx(withSpec);
    const xmlWith = await readDocumentXml(withResult.buffer);
    const textWith = strippedText(xmlWith);
    expect(textWith).toContain('Agenda');
    expect(textWith).toContain('Open questions');
    expect(textWith).toContain('Wave-1 cohort selection');
    expect(textWith).toContain('separate consent UX');
  });

  it('throws when meeting-notes payload is malformed', async () => {
    const spec: DeliverableSpec = {
      kind: 'meeting-notes',
      tenantKey: 'apex-retail',
      title: 'Bad Notes',
      payload: { meeting: 'not-an-object' } as unknown as Record<
        string,
        unknown
      >,
    };
    await expect(renderDeliverableAsDocx(spec)).rejects.toThrow(
      /meeting-notes payload is malformed/,
    );
  });
});

// ── EXPORT-3-EXTEND · decision-log ─────────────────────────────────────

function buildDecisionLogSpec(): DeliverableSpec {
  const payload: DecisionLogPayload = {
    programSummary: {
      name: 'Apex Loyalty FY26',
      phase: 'P5 Activate',
    },
    entries: [
      {
        id: 'D-001',
        decisionDate: '2026-05-20',
        decision: 'Adopt managed Snowflake foundation for CDP',
        decidedBy: 'James Wright, CCO',
        rationale:
          'Reuses existing data foundation; one-quarter time-to-value.',
        impactedAreas: ['Architecture', 'Cost model'],
        reversible: false,
        evidenceRefs: ['art:apex-fy26:p2:program-charter'],
      },
      {
        id: 'D-007',
        decisionDate: '2026-09-15',
        decision: 'Sequence wave-1 by geography (east coast first)',
        decidedBy: 'Linda Chen, VP Customer Engagement',
        rationale: 'Lower transaction volatility; willing operator team.',
        impactedAreas: ['Rollout sequencing', 'Support staffing'],
        reversible: true,
      },
      {
        id: 'D-003',
        decisionDate: '2026-07-08',
        decision: 'Adopt event-driven consent fan-out',
        decidedBy: 'James Wright, CCO',
        rationale: 'Achieves <90s consent propagation latency.',
        impactedAreas: ['Architecture', 'Privacy'],
        reversible: true,
        evidenceRefs: ['art:apex-fy26:p3:design-review-notes'],
      },
    ],
  };

  return {
    kind: 'decision-log',
    tenantKey: 'apex-retail',
    title: 'Apex Loyalty FY26 Decision Log',
    subtitle: 'Program audit trail · as of 2026-12-04',
    generatedAt: '2026-12-04T18:00:00.000Z',
    authors: ['Anand Sundaram'],
    payload: payload satisfies DecisionLogPayload as unknown as Record<
      string,
      unknown
    >,
  };
}

describe('renderDeliverableAsDocx · decision-log', () => {
  it('renders a non-trivial buffer with the documented mime + filename', async () => {
    const spec = buildDecisionLogSpec();
    const result = await renderDeliverableAsDocx(spec);
    expect(result.sizeBytes).toBeGreaterThanOrEqual(5 * 1024);
    expect(result.filename).toMatch(/-decision-log-\d{8}\.docx$/);
  });

  it('renders the audit-trail banner and required sections', async () => {
    const spec = buildDecisionLogSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);
    const text = strippedText(xml);
    expect(text).toContain('DECISION LOG');
    expect(text).toContain('PROGRAM AUDIT TRAIL');
    for (const heading of ['Program summary', 'Decision log', 'Log status']) {
      expect(text).toContain(heading);
    }
    expect(text).toContain('Entries: 3');
  });

  it('decisions table has N+1 rows and sorts entries newest-first', async () => {
    const spec = buildDecisionLogSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);
    const tableMatch = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/);
    expect(tableMatch).not.toBeNull();
    const tableXml = tableMatch?.[0] ?? '';
    const rowCount = (tableXml.match(/<w:tr[\s>]/g) ?? []).length;
    // 3 entries + 1 header row.
    expect(rowCount).toBe(4);

    // Newest-first: D-007 (2026-09-15) appears before D-003 (2026-07-08)
    // which appears before D-001 (2026-05-20).
    const idxD007 = tableXml.indexOf('D-007');
    const idxD003 = tableXml.indexOf('D-003');
    const idxD001 = tableXml.indexOf('D-001');
    expect(idxD007).toBeGreaterThan(-1);
    expect(idxD003).toBeGreaterThan(idxD007);
    expect(idxD001).toBeGreaterThan(idxD003);
  });

  it('renders impacted areas inline with the decision text', async () => {
    const spec = buildDecisionLogSpec();
    const result = await renderDeliverableAsDocx(spec);
    const xml = await readDocumentXml(result.buffer);
    const text = strippedText(xml);
    expect(text).toContain('Impacts: Architecture, Cost model');
  });

  it('throws when decision-log payload is malformed', async () => {
    const spec: DeliverableSpec = {
      kind: 'decision-log',
      tenantKey: 'apex-retail',
      title: 'Bad Log',
      payload: { programSummary: 'not-an-object' } as unknown as Record<
        string,
        unknown
      >,
    };
    await expect(renderDeliverableAsDocx(spec)).rejects.toThrow(
      /decision-log payload is malformed/,
    );
  });
});

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
import {
  DOCX_CONTENT_TYPE,
  renderDeliverableAsDocx,
} from '@/lib/programs/exports/renderers/docx';
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

  it('throws the EXPORT-3-EXTEND error for other DOCX-supporting kinds', async () => {
    const spec: DeliverableSpec = {
      kind: 'discovery-report',
      tenantKey: 'apex-retail',
      title: 'Discovery Report',
      payload: {},
    };
    await expect(renderDeliverableAsDocx(spec)).rejects.toThrow(
      /EXPORT-3-EXTEND.*program-charter only/,
    );
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

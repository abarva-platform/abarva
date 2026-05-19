// Intelligence · CXO brief export · renderer tests (Gap G9).
//
// Asserts the brief renderer produces a non-empty, valid DOCX / PDF for
// all 3 tenants, that Apex's brief carries real corpus content, and that
// Meridian / First Capital briefs carry the honest "corpus not seeded"
// section and NO fabricated bets or figures.

import zlib from 'node:zlib';
import { Packer } from 'docx';
import { renderToBuffer } from '@react-pdf/renderer';

import {
  buildIntelligenceBriefPayload,
  CORPUS_NOT_SEEDED_MARKER,
  type IntelligenceBriefPayload,
} from '@/lib/intelligence/exports/brief-payload';
import { buildIntelligenceBriefDocx } from '@/lib/intelligence/exports/renderers/brief-docx';
import { buildIntelligenceBriefPdf } from '@/lib/intelligence/exports/renderers/brief-pdf';
import type { BriefData } from '@/lib/knowledge-corpus/types';
import type { IntelligenceV3PageData } from '@/components/intelligence-v3/types';

const GENERATED_AT = '2026-05-19T12:00:00.000Z';

// ── Fixtures (test-only — NOT shipped as tenant data) ────────────────

function makePageData(
  overrides: Partial<IntelligenceV3PageData> = {},
): IntelligenceV3PageData {
  return {
    tenantName: 'Sample Tenant',
    industry: 'Banking',
    refreshedLabel: 'just now',
    stats: { patterns: 6, contradictions: 2, syntheses: 1 },
    substrate: {
      tenantLoaded: 7,
      tenantTotal: 23,
      corpus: { failureModes: 10, patternRecords: 17, researchAnchors: 30 },
    },
    aiTrajectory: {
      headline: 'AI trajectory · regional banking',
      body: 'Front-office heavy; middle-office decisioning underweight.',
    },
    pressureCards: [
      {
        severity: 'HIGH',
        title: 'FC-04 · Fraud model drift',
        body: 'Stalled · model accuracy decaying since Q1.',
      },
    ],
    conversationContext: { activeThread: 'Portfolio review', layerFocus: 'Decision Layer' },
    artOfThePossible: [
      {
        key: 'decision',
        name: 'Decision Layer',
        parenthetical: 'Middle Office',
        gating: 'Decisions get faster, evidence-grounded',
        moves: [{ id: 'm1', name: 'Credit decisioning AI', rationale: 'Healthy · scaled' }],
        focused: true,
      },
    ],
    whatWeCantSee: ['Peer NIM benchmarks', 'Quarterly KPI variance depth'],
    sentinelOpener: 'Opener',
    conversation: [],
    ...overrides,
  };
}

function makeApexBriefData(): BriefData {
  return {
    tenantName: 'Apex Retail Group',
    tenantBrandColor: '#0E8C7E',
    industry: 'retail',
    composedAt: GENERATED_AT,
    synthesis:
      'Sentinel sees three Apex Retail priorities above the line: fix customer identity, prove demand-sensing readiness, keep the roadmap honest.',
    bets: [
      {
        rank: 1,
        useCase: {
          id: 'UC-RET-001',
          name: 'Customer Identity Resolution',
          displayNameShort: 'Customer Identity Resolution',
          industry: 'retail',
          office: 'front',
          domainTags: ['retail_ai'],
          problemStatement:
            'Loyalty AI cannot scale until customer identity is unified across channels.',
          artOfPossibleFraming: 'Unified identity graph.',
          businessValueRanges: {
            perCompanySize: { veryLarge: '$3M-$20M annual value' },
            timeToValueMonths: '6-12',
            paybackMonths: '9-15',
            confidenceBand: 'MED',
          },
          lifecycleStage: 'emerging',
          lifecycleBasis: 'Apex Retail use-case portfolio',
          successPatterns: [],
          vendorLandscape: { incumbent: [], challenger: [], emerging: [] },
          siLandscape: { crediblePractice: ['AbarVa'], emergingPractice: [] },
          regulatoryContext: { applicable: ['CCPA'] },
          benchmarkMetrics: { primary: [] },
          provenance: {
            primarySources: [
              { source: 'Apex corpus', currencyDate: '2026-05', reliability: 'HIGH' },
            ],
            curationPass: 'apex-retail-live-v1',
          },
          lastRefreshed: '2026-05-09',
          refreshCadence: 'monthly',
        },
        score: 88,
        scoreFactors: [{ name: 'Apex use case seeded', delta: 18 }],
        engagementState: 'at_risk',
        initiativeDisplayId: 'AR-001',
        decision: {
          kind: 'originate',
          label: 'Originate now',
          reason: 'Highest CXO tension · clear pattern binding',
        },
        bindingPatterns: [
          {
            pattern: {
              id: 'F200',
              name: 'Identity Fragmentation',
              scope: 'industry_specific',
              applicableIndustries: ['retail'],
              patternType: 'failure',
              description: 'Fragmented identity blocks loyalty AI.',
              evidenceBasis: {
                observedInUseCases: [],
                observationCount: 'Composite retail seed',
                confidence: 'MED',
              },
              quantifiedSignal: {
                withPattern: { metric: 'readiness confidence', valueRange: '70-90%' },
                withoutPattern: { metric: 'failure rate', valueRange: '62%' },
                source: 'Retail pattern library',
                confidence: 'MED',
              },
              recommendedResponse: 'Bind ownership and readiness before scale.',
              provenance: {
                primarySources: [
                  { source: 'Apex corpus', currencyDate: '2026-05', reliability: 'HIGH' },
                ],
                curationPass: 'apex-retail-live-v1',
              },
              lastRefreshed: '2026-05-09',
              refreshCadence: 'monthly',
            },
            quantifiedRow: {
              withLabel: 'Governed',
              withoutLabel: '62% fail',
              description: 'Fragmented identity blocks loyalty AI.',
              source: 'Retail pattern library',
            },
          },
        ],
        antiPatterns: [],
        vendors: [],
        regulatory: [],
      },
    ],
    belowTheLine: [
      {
        rank: 4,
        useCaseId: 'UC-RET-004',
        useCaseName: 'Shelf Vision Analytics',
        score: 68,
        state: 'candidate',
        valueLabel: '$3M-$12M',
        ttvLabel: '6-12 mo',
        hint: 'Retail AI candidate',
      },
    ],
    patternsTriggered: [
      {
        pattern: {
          id: 'F215',
          name: 'Demand-Sensing Data Gap',
          scope: 'industry_specific',
          applicableIndustries: ['retail'],
          patternType: 'failure',
          description: 'Forecast lift fails without item-location history.',
          evidenceBasis: {
            observedInUseCases: [],
            observationCount: 'Composite retail seed',
            confidence: 'MED',
          },
          quantifiedSignal: {
            withPattern: { metric: 'readiness confidence', valueRange: '70-90%' },
            withoutPattern: { metric: 'failure rate', valueRange: '55%' },
            source: 'Retail pattern library',
            confidence: 'MED',
          },
          recommendedResponse: 'Bind data readiness before forecast commitments.',
          provenance: {
            primarySources: [
              { source: 'Apex corpus', currencyDate: '2026-05', reliability: 'HIGH' },
            ],
            curationPass: 'apex-retail-live-v1',
          },
          lastRefreshed: '2026-05-09',
          refreshCadence: 'monthly',
        },
        issue: 'Forecast lift fails without item-location history.',
        recommendedAction: 'Bind this pattern to the Apex demand-sensing use case.',
        cta: { primary: { label: 'Review pattern', href: '/intelligence#patterns' } },
      },
    ],
    proofPoints: [],
    totals: {
      totalUseCases: 14,
      totalPatterns: 17,
      totalVendors: 5,
      totalRegulatory: 3,
      refreshCadence: 'monthly intelligence refresh',
      lastRefreshQuarter: '2026-Q2',
    },
  };
}

// ── DOCX / PDF helpers ───────────────────────────────────────────────

async function docxBuffer(payload: IntelligenceBriefPayload): Promise<Buffer> {
  const doc = buildIntelligenceBriefDocx(payload);
  const buf = await Packer.toBuffer(doc);
  return Buffer.from(buf as unknown as ArrayBuffer);
}

/**
 * Extract and inflate every entry of a docx (ZIP) buffer via the ZIP
 * central directory, returning the concatenated decompressed text.
 * docx entries are DEFLATE-compressed and the `docx` library writes
 * them with a data descriptor (local-header sizes are 0), so the
 * central directory is the authoritative source for sizes / offsets.
 */
function inflateDocxText(zip: Buffer): string {
  const out: string[] = [];
  const cdSig = Buffer.from('PK\x01\x02', 'latin1');
  let idx = zip.indexOf(cdSig);
  while (idx >= 0) {
    const method = zip.readUInt16LE(idx + 10);
    const compSize = zip.readUInt32LE(idx + 20);
    const nameLen = zip.readUInt16LE(idx + 28);
    const extraLen = zip.readUInt16LE(idx + 30);
    const commentLen = zip.readUInt16LE(idx + 32);
    const localOffset = zip.readUInt32LE(idx + 42);
    // Resolve the data start by re-reading the local header's variable
    // field lengths (they can differ from the central directory's).
    const localNameLen = zip.readUInt16LE(localOffset + 26);
    const localExtraLen = zip.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    if (compSize > 0 && dataStart + compSize <= zip.length) {
      const data = zip.subarray(dataStart, dataStart + compSize);
      try {
        const text =
          method === 0
            ? data.toString('utf8')
            : zlib.inflateRawSync(data).toString('utf8');
        out.push(text);
      } catch {
        // skip entries we cannot inflate
      }
    }
    idx = zip.indexOf(cdSig, idx + 46 + nameLen + extraLen + commentLen);
  }
  return out.join('\n');
}

async function pdfBuffer(payload: IntelligenceBriefPayload): Promise<Buffer> {
  return renderToBuffer(buildIntelligenceBriefPdf(payload));
}

// ── Tests ────────────────────────────────────────────────────────────

describe('Intelligence brief export (G9)', () => {
  const apexPayload = buildIntelligenceBriefPayload({
    tenantName: 'Apex Retail Group',
    briefData: makeApexBriefData(),
    pageData: makePageData({ tenantName: 'Apex Retail Group', industry: 'Retail' }),
    generatedAt: GENERATED_AT,
  });
  const meridianPayload = buildIntelligenceBriefPayload({
    tenantName: 'Meridian Health',
    briefData: null,
    pageData: makePageData({ tenantName: 'Meridian Health', industry: 'Healthcare' }),
    generatedAt: GENERATED_AT,
  });
  const firstCapitalPayload = buildIntelligenceBriefPayload({
    tenantName: 'First Capital Financial',
    briefData: null,
    pageData: makePageData({ tenantName: 'First Capital Financial', industry: 'Banking' }),
    generatedAt: GENERATED_AT,
  });

  describe('payload — Apex Retail (real corpus)', () => {
    it('marks the brief as corpus-bound', () => {
      expect(apexPayload.hasCorpus).toBe(true);
    });

    it('includes real corpus content — ranked bets, patterns, value totals', () => {
      const body = apexPayload.body;
      expect(body).toContain('Ranked AI bets');
      expect(body).toContain('Customer Identity Resolution');
      expect(body).toContain('Originate now');
      expect(body).toContain('Patterns triggered');
      expect(body).toContain('Demand-Sensing Data Gap');
      expect(body).toContain('Corpus coverage');
      expect(body).toContain('Below the line');
    });

    it('does NOT include the corpus-not-seeded marker', () => {
      expect(apexPayload.body).not.toContain(CORPUS_NOT_SEEDED_MARKER);
    });

    it('one-pager reports real corpus figures', () => {
      const labels = apexPayload.onePager.map((l) => l.label);
      expect(labels).toContain('Corpus use cases');
      expect(labels).toContain('Ranked AI bets');
    });
  });

  describe.each([
    ['Meridian Health', () => meridianPayload],
    ['First Capital Financial', () => firstCapitalPayload],
  ])('payload — %s (no seeded corpus)', (tenant, getPayload) => {
    it('marks the brief as NOT corpus-bound', () => {
      expect(getPayload().hasCorpus).toBe(false);
    });

    it('renders the honest corpus-not-seeded section', () => {
      expect(getPayload().body).toContain(CORPUS_NOT_SEEDED_MARKER);
    });

    it('contains NO fabricated corpus bets or pattern records', () => {
      const body = getPayload().body;
      expect(body).not.toContain('Ranked AI bets');
      expect(body).not.toContain('Patterns triggered');
      expect(body).not.toContain('Value at stake');
      expect(body).not.toContain('Below the line');
      // No fabricated retail-corpus fixture content leaks in.
      expect(body).not.toContain('Customer Identity Resolution');
      expect(body).not.toContain('Demand-Sensing Data Gap');
    });

    it('still exports the real ai_initiatives portfolio', () => {
      const body = getPayload().body;
      expect(body).toContain('AI initiative portfolio');
      expect(body).toContain('AI trajectory');
      expect(body).toContain(tenant);
    });

    it('one-pager flags the corpus as not yet seeded', () => {
      const corpusLine = getPayload().onePager.find(
        (l) => l.label === 'Intelligence corpus',
      );
      expect(corpusLine?.value).toBe('Not yet seeded');
    });
  });

  describe('DOCX renderer — all 3 tenants', () => {
    it.each([
      ['Apex Retail Group', () => apexPayload],
      ['Meridian Health', () => meridianPayload],
      ['First Capital Financial', () => firstCapitalPayload],
    ])('produces a non-empty valid docx for %s', async (tenant, getPayload) => {
      const buf = await docxBuffer(getPayload());
      expect(buf.byteLength).toBeGreaterThan(4000);
      // ZIP magic bytes — a valid OOXML/docx container.
      expect(buf[0]).toBe(0x50);
      expect(buf[1]).toBe(0x4b);
      const text = inflateDocxText(buf);
      expect(text).toContain('word/document.xml'.split('/').pop());
      expect(text).toContain(`Intelligence Brief — ${tenant}`);
    });

    it('Apex docx carries real corpus content (ranked bets, patterns)', async () => {
      const text = inflateDocxText(await docxBuffer(apexPayload));
      expect(text).toContain('Ranked AI bets');
      expect(text).toContain('Customer Identity Resolution');
      expect(text).toContain('Patterns triggered');
      expect(text).not.toContain(CORPUS_NOT_SEEDED_MARKER);
    });

    it.each([
      ['Meridian Health', () => meridianPayload],
      ['First Capital Financial', () => firstCapitalPayload],
    ])('%s docx carries the honest corpus-not-seeded section, no fabrication', async (_t, getPayload) => {
      const text = inflateDocxText(await docxBuffer(getPayload()));
      expect(text).toContain(CORPUS_NOT_SEEDED_MARKER);
      expect(text).toContain('AI initiative portfolio');
      expect(text).not.toContain('Ranked AI bets');
      expect(text).not.toContain('Customer Identity Resolution');
      expect(text).not.toContain('Demand-Sensing Data Gap');
    });
  });

  describe('PDF renderer — all 3 tenants', () => {
    it.each([
      ['Apex Retail Group', () => apexPayload],
      ['Meridian Health', () => meridianPayload],
      ['First Capital Financial', () => firstCapitalPayload],
    ])('produces a non-empty valid pdf for %s', async (tenant, getPayload) => {
      const buf = await pdfBuffer(getPayload());
      expect(buf.byteLength).toBeGreaterThan(200);
      // PDF magic bytes "%PDF" + EOF marker — structurally valid.
      expect(buf.subarray(0, 4).toString('latin1')).toBe('%PDF');
      expect(buf.toString('latin1')).toContain('%%EOF');
      expect(buf.toString('latin1')).toContain(tenant);
    });

    it('Apex pdf carries real corpus content', async () => {
      const text = (await pdfBuffer(apexPayload)).toString('latin1');
      expect(text).toContain('Customer Identity Resolution');
      expect(text).not.toContain(CORPUS_NOT_SEEDED_MARKER);
    });

    it.each([
      ['Meridian Health', () => meridianPayload],
      ['First Capital Financial', () => firstCapitalPayload],
    ])('%s pdf carries the honest corpus-not-seeded notice', async (_t, getPayload) => {
      const text = (await pdfBuffer(getPayload())).toString('latin1');
      expect(text).toContain(CORPUS_NOT_SEEDED_MARKER);
      expect(text).not.toContain('Customer Identity Resolution');
      expect(text).not.toContain('Demand-Sensing Data Gap');
    });

    it('degraded PDF still renders a valid cover-only document', async () => {
      const buf = await renderToBuffer(
        buildIntelligenceBriefPdf(meridianPayload, { degraded: true }),
      );
      expect(buf.subarray(0, 4).toString('latin1')).toBe('%PDF');
      expect(buf.byteLength).toBeGreaterThan(200);
    });
  });
});

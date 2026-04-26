// SOL14 · Vendor / Startup Intelligence Contract tests.

import {
  VENDOR_INTELLIGENCE_CATEGORIES,
  VENDOR_ASSESSMENT_READINESS_VALUES,
  VENDOR_EVIDENCE_BASIS_VALUES,
  buildVendorAssessmentSeed,
  getNotRecommendedVendors,
  listVendorCategories,
  summarizeVendorAssessments,
  type VendorAssessment,
  type VendorAssessmentReadiness,
  type VendorIntelligenceCategory,
} from '@/lib/solutions/vendor-startup-intelligence';

const DOLLAR_PATTERN = /\$\s?\d/;

// Known real vendor names that must NOT appear anywhere in the seed,
// the categories, or the source text. Each entry is matched
// case-insensitively as a whole word so generic English terms like
// "metadata", "segment", or "categorize" are not falsely flagged.
const REAL_VENDOR_DENYLIST = [
  'Adobe',
  'Salesforce',
  'Twilio',
  'Snowflake',
  'Databricks',
  'OpenAI',
  'Anthropic',
  'Cohere',
  'Mistral',
  'Pinecone',
  'Weaviate',
  'LangChain',
  'LangSmith',
  'HuggingFace',
  'Hugging Face',
  'Mulesoft',
  'Snowplow',
  'Tealium',
  'mParticle',
  'Treasure Data',
  'ActionIQ',
  'Amperity',
  'Datadog',
  'New Relic',
  'Splunk',
  'WhyLabs',
  'Fiddler',
  'Vertex AI',
  'Bedrock',
  'Azure OpenAI',
  'GitHub Copilot',
  'Microsoft Copilot',
  'IBM Watson',
  'NVIDIA',
  // Multi-word brand phrases (whole-phrase match, case-insensitive).
  'Google Cloud',
  'Google Vertex',
  'Microsoft Azure',
  'Amazon Web Services',
  'AWS Bedrock',
  'AWS SageMaker',
  'Meta Llama',
  'Adobe Experience',
  'Salesforce Data Cloud',
  'Salesforce Einstein',
] as const;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesDenylistEntry(haystack: string, name: string): boolean {
  // Whole-word, case-insensitive match. Word boundary on each side keeps
  // generic English (metadata, segment, categorize, summarize, etc.)
  // from triggering a false positive.
  const re = new RegExp(`(?<![A-Za-z0-9])${escapeRegex(name)}(?![A-Za-z0-9])`, 'i');
  return re.test(haystack);
}

// ---------------------------------------------------------------------
// All 9 categories present
// ---------------------------------------------------------------------

describe('listVendorCategories', () => {
  it('returns exactly 9 categories in canonical order', () => {
    const categories = listVendorCategories();
    expect(categories.length).toBe(9);
    const expected: VendorIntelligenceCategory[] = [
      'cdp',
      'cx_ai',
      'ams',
      'data_fabric',
      'agent_platform',
      'observability',
      'security',
      'evaluation',
      'other',
    ];
    expect(categories.map((c) => c.key)).toEqual(expected);
    expect(VENDOR_INTELLIGENCE_CATEGORIES).toEqual(expected);
  });

  it('every category carries the required field set', () => {
    for (const c of listVendorCategories()) {
      expect(typeof c.key).toBe('string');
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.description.length).toBeGreaterThan(0);
      expect(c.exampleCapabilities.length).toBeGreaterThan(0);
    }
  });

  it('returns deterministic, byte-equal output across repeated calls', () => {
    const a = listVendorCategories();
    const b = listVendorCategories();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------
// All 5 readiness states represented in the seed
// ---------------------------------------------------------------------

describe('buildVendorAssessmentSeed · readiness coverage', () => {
  it('exposes all 5 readiness states', () => {
    const expected: VendorAssessmentReadiness[] = [
      'unknown',
      'preliminary',
      'pilot_ready',
      'production_ready',
      'not_recommended',
    ];
    expect(VENDOR_ASSESSMENT_READINESS_VALUES).toEqual(expected);
  });

  it('seed assessments cover every readiness state at least once', () => {
    const seed = buildVendorAssessmentSeed();
    const seen = new Set<VendorAssessmentReadiness>();
    for (const a of seed.assessments) {
      seen.add(a.readiness);
    }
    for (const r of VENDOR_ASSESSMENT_READINESS_VALUES) {
      expect(seen.has(r)).toBe(true);
    }
  });

  it('every assessment carries a category from the canonical 9', () => {
    const allowed = new Set<VendorIntelligenceCategory>(
      VENDOR_INTELLIGENCE_CATEGORIES,
    );
    const seed = buildVendorAssessmentSeed();
    for (const a of seed.assessments) {
      expect(allowed.has(a.category)).toBe(true);
    }
  });

  it('every assessment carries an evidence basis from the canonical list', () => {
    const allowed = new Set<string>(VENDOR_EVIDENCE_BASIS_VALUES);
    const seed = buildVendorAssessmentSeed();
    for (const a of seed.assessments) {
      expect(allowed.has(a.evidenceBasis)).toBe(true);
    }
  });

  it('not_recommended assessments carry a non-null reason; others do not', () => {
    const seed = buildVendorAssessmentSeed();
    for (const a of seed.assessments) {
      if (a.readiness === 'not_recommended') {
        expect(typeof a.notRecommendedReason).toBe('string');
        expect((a.notRecommendedReason ?? '').length).toBeGreaterThan(0);
      } else {
        expect(a.notRecommendedReason).toBeNull();
      }
    }
  });

  it('seed is tagged createdFrom: deterministic_vendor_startup_intelligence_seed', () => {
    const seed = buildVendorAssessmentSeed();
    expect(seed.createdFrom).toBe(
      'deterministic_vendor_startup_intelligence_seed',
    );
  });
});

// ---------------------------------------------------------------------
// No real vendor names anywhere in seed or categories
// ---------------------------------------------------------------------

describe('no real vendor endorsements', () => {
  function flatten(seed: ReturnType<typeof buildVendorAssessmentSeed>): string {
    return JSON.stringify(seed);
  }

  it('seed JSON does not include any known real vendor names', () => {
    const seed = buildVendorAssessmentSeed();
    const haystack = flatten(seed);
    for (const name of REAL_VENDOR_DENYLIST) {
      expect(matchesDenylistEntry(haystack, name)).toBe(false);
    }
  });

  it('category metadata does not include any known real vendor names', () => {
    const haystack = JSON.stringify(listVendorCategories());
    for (const name of REAL_VENDOR_DENYLIST) {
      expect(matchesDenylistEntry(haystack, name)).toBe(false);
    }
  });

  it('vendor placeholder ids follow the category-shaped placeholder pattern', () => {
    const seed = buildVendorAssessmentSeed();
    for (const a of seed.assessments) {
      expect(a.vendorPlaceholderId).toMatch(/^vendor_[a-z_]+_\d{3}$/);
    }
  });

  it('vendor placeholder ids are unique across the seed', () => {
    const seed = buildVendorAssessmentSeed();
    const seen = new Set<string>();
    for (const a of seed.assessments) {
      expect(seen.has(a.vendorPlaceholderId)).toBe(false);
      seen.add(a.vendorPlaceholderId);
    }
  });
});

// ---------------------------------------------------------------------
// Deterministic output
// ---------------------------------------------------------------------

describe('deterministic output', () => {
  it('buildVendorAssessmentSeed is byte-equal across repeated calls', () => {
    const a = buildVendorAssessmentSeed();
    const b = buildVendorAssessmentSeed();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('summarizeVendorAssessments is byte-equal for the same input', () => {
    const seed = buildVendorAssessmentSeed();
    const a = summarizeVendorAssessments(seed.assessments);
    const b = summarizeVendorAssessments(seed.assessments);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('summary totals reconcile against the seed', () => {
    const seed = buildVendorAssessmentSeed();
    const summary = summarizeVendorAssessments(seed.assessments);
    expect(summary.totalAssessments).toBe(seed.assessments.length);

    const categoryTotal = (
      Object.values(summary.byCategory) as number[]
    ).reduce((acc: number, n: number) => acc + n, 0);
    expect(categoryTotal).toBe(seed.assessments.length);

    const readinessTotal = (
      Object.values(summary.byReadiness) as number[]
    ).reduce((acc: number, n: number) => acc + n, 0);
    expect(readinessTotal).toBe(seed.assessments.length);
  });

  it('not-recommended count matches getNotRecommendedVendors length', () => {
    const seed = buildVendorAssessmentSeed();
    const summary = summarizeVendorAssessments(seed.assessments);
    const notRec = getNotRecommendedVendors(seed.assessments);
    expect(summary.notRecommendedCount).toBe(notRec.length);
    for (const a of notRec) {
      expect(a.readiness).toBe('not_recommended');
    }
  });

  it('hasUnknownReadiness flag matches presence of an unknown row', () => {
    const seed = buildVendorAssessmentSeed();
    const summary = summarizeVendorAssessments(seed.assessments);
    const hasUnknown = seed.assessments.some(
      (a) => a.readiness === 'unknown',
    );
    expect(summary.hasUnknownReadiness).toBe(hasUnknown);
  });

  it('pilotOrProductionReadyCount sums pilot_ready + production_ready rows', () => {
    const seed = buildVendorAssessmentSeed();
    const summary = summarizeVendorAssessments(seed.assessments);
    const computed = seed.assessments.filter(
      (a: VendorAssessment) =>
        a.readiness === 'pilot_ready' || a.readiness === 'production_ready',
    ).length;
    expect(summary.pilotOrProductionReadyCount).toBe(computed);
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  it('no category string field invents a dollar amount', () => {
    for (const c of listVendorCategories()) {
      expect(c.name).not.toMatch(DOLLAR_PATTERN);
      expect(c.description).not.toMatch(DOLLAR_PATTERN);
      for (const e of c.exampleCapabilities) {
        expect(e).not.toMatch(DOLLAR_PATTERN);
      }
    }
  });

  it('no assessment string field invents a dollar amount', () => {
    const seed = buildVendorAssessmentSeed();
    for (const a of seed.assessments) {
      expect(a.capabilityFitNote).not.toMatch(DOLLAR_PATTERN);
      for (const r of a.redFlagSignals) {
        expect(r).not.toMatch(DOLLAR_PATTERN);
      }
      for (const g of a.greenFlagSignals) {
        expect(g).not.toMatch(DOLLAR_PATTERN);
      }
      for (const cg of a.governanceConsiderations) {
        expect(cg).not.toMatch(DOLLAR_PATTERN);
      }
      if (a.notRecommendedReason !== null) {
        expect(a.notRecommendedReason).not.toMatch(DOLLAR_PATTERN);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · vendor-startup-intelligence.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/solutions/vendor-startup-intelligence.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not import Sentinel / Atlas / Nexus / Agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import Source UI, legacy /programs, mock.ts, auth, or supabase', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not import HTTP-style runtimes (axios, http, https, node-fetch)', () => {
    expect(codeOnly).not.toMatch(/from ['"]axios['"]/);
    expect(codeOnly).not.toMatch(/from ['"]node-fetch['"]/);
    expect(codeOnly).not.toMatch(/from ['"]http['"]/);
    expect(codeOnly).not.toMatch(/from ['"]https['"]/);
    expect(codeOnly).not.toMatch(/require\(['"]axios['"]\)/);
    expect(codeOnly).not.toMatch(/require\(['"]node-fetch['"]\)/);
    expect(codeOnly).not.toMatch(/require\(['"]http['"]\)/);
    expect(codeOnly).not.toMatch(/require\(['"]https['"]\)/);
  });

  it('does not invoke Claude / OpenAI / Pinecone runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/pinecone/i);
  });

  it('does not use React state / effect hooks', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });

  it('does not contain placeholder phrases', () => {
    expect(source).not.toMatch(/coming soon/i);
    expect(source).not.toMatch(/\bTBD\b/);
    expect(source).not.toMatch(/lorem ipsum/i);
  });

  it('source file does not include any known real vendor names', () => {
    for (const name of REAL_VENDOR_DENYLIST) {
      expect(matchesDenylistEntry(source, name)).toBe(false);
    }
  });
});

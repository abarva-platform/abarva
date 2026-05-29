import { config } from 'dotenv';

config({ path: process.env.ENV_FILE ?? '.env.local' });

process.env.ANTHROPIC_API_KEY = '';
process.env.OPENAI_API_KEY = '';
process.env.PINECONE_API_KEY = '';

type TenantCase = {
  tenantKey: string;
  activeClient: string;
  industry: string;
  query: string;
  allowed: Set<string>;
};

const cases: TenantCase[] = [
  {
    tenantKey: 'apex-retail',
    activeClient: 'Apex Retail',
    industry: 'retail',
    query: 'modern omnichannel OMS vendor landscape retail inventory assortment',
    allowed: new Set(['retail', 'cross_industry']),
  },
  {
    tenantKey: 'meridian-health',
    activeClient: 'Meridian Health',
    industry: 'healthcare_provider',
    query: 'prior authorization clinical access patient operations healthcare provider',
    allowed: new Set(['healthcare_provider', 'cross_industry']),
  },
  {
    tenantKey: 'northstar-clinical',
    activeClient: 'Northstar Clinical Technologies',
    industry: 'healthcare_medtech',
    query: 'medical device QMS ISO 13485 medtech product quality',
    allowed: new Set(['healthcare_medtech', 'cross_industry']),
  },
  {
    tenantKey: 'first-capital',
    activeClient: 'First Capital',
    industry: 'financial_services_banking',
    query: 'model risk validation controls banking SR 11-7',
    allowed: new Set(['financial_services_banking', 'cross_industry']),
  },
  {
    tenantKey: 'skyharbor-air',
    activeClient: 'SkyHarbor Air',
    industry: 'airline',
    query: 'airline mainframe modernization operations resilience',
    allowed: new Set(['airline', 'cross_industry']),
  },
];

async function main() {
  const { searchIndustryScopedCorpusPatternIndex } = await import(
    '../../src/lib/intelligence/canonical/scoped-corpus-pattern-index'
  );

  const results = [];
  for (const tenant of cases) {
    const result = await searchIndustryScopedCorpusPatternIndex({
      tenant_key: tenant.tenantKey,
      industry: tenant.industry as never,
      query: tenant.query,
      limit: 8,
    }, {
      scope: {
        tenantKey: tenant.tenantKey,
        activeClient: tenant.activeClient,
        facts: [tenant.industry],
      },
      useCache: false,
    });

    const leaked = result.patterns
      .flatMap((pattern) => pattern.industry.map((industry) => ({
        patternId: pattern.canonical_id,
        title: pattern.title,
        industry,
      })))
      .filter((entry) => !tenant.allowed.has(entry.industry));

    results.push({
      tenantKey: tenant.tenantKey,
      industry: tenant.industry,
      status: result.status,
      error: result.error ?? null,
      retrievedCount: result.patterns.length,
      patternIds: result.patterns.map((pattern) => pattern.canonical_id),
      leaked,
    });
  }

  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));

  const leaked = results.flatMap((result) =>
    result.leaked.map((entry) => ({ tenantKey: result.tenantKey, ...entry })));
  const errors = results.filter((result) => result.status === 'error');
  if (errors.length > 0) {
    console.error(`I9 industry-isolation smoke failed: ${errors.length} tenant checks returned retrieval errors.`);
    process.exitCode = 1;
  }
  if (leaked.length > 0) {
    console.error(`I9 industry-isolation smoke failed: ${leaked.length} leaked pattern industries.`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  try {
    const { getCorpusPool } = await import('../../src/lib/corpus/db');
    await getCorpusPool().end();
  } catch {
    // Ignore shutdown failures; the smoke result above is authoritative.
  }
  process.exit(process.exitCode ?? 0);
});

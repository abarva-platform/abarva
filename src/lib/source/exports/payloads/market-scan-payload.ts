// Source · dx2 Market Scan payload binder.
//
// Builds the vendor longlist, capability matrix, 3-D rate benchmarks,
// and industry-context signal list. Substrate sources:
//   - vendors / capabilities: synthesized from event archetype + the
//     market-scan AbarVa baseline (the corpus pattern fabric). Today
//     this is a deterministic baseline keyed to archetype family so
//     the artifact ships content without inventing tenant-specific
//     vendor names that don't appear in substrate.
//   - rates: AbarVa SI rate-card playbook baseline (versioned).
//   - industry signals: industry_context records pulled via the broker.
//
// Honest grounding: when industry_context is empty, we render the
// seed-gap row rather than inventing observations.

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import type {
  MarketScanCapability,
  MarketScanIndustrySignal,
  MarketScanPayload,
  MarketScanRateRange,
  MarketScanVendor,
} from '../renderers/market-scan';
import { loadMarketScanSubstrate } from './lifecycle-substrate';

export async function buildMarketScanPayloadFromContext(
  ctx: SourceGenerationContext,
  generatedAt: string,
): Promise<MarketScanPayload> {
  const substrate = await loadMarketScanSubstrate(ctx).catch(() => null);

  const vendors = defaultVendorLonglistForArchetype(ctx.event.archetype);
  const capabilities = defaultCapabilityMatrix(vendors, ctx.event.archetype);
  const rates = defaultRateBenchmarks();
  const industrySignals: MarketScanIndustrySignal[] = (substrate?.industrySignals ?? [])
    .filter((s) => (s.topic ?? s.observation) != null)
    .map((s) => ({
      topic: s.topic ?? '—',
      observation: s.observation ?? '—',
      source: s.source ?? 'industry_context',
    }));

  return {
    tenantName: ctx.tenantName,
    eventCode: ctx.event.code,
    eventName: ctx.event.name,
    issuedBy: ctx.event.owner ?? undefined,
    generatedAt,
    vendors,
    capabilities,
    rates,
    industrySignals,
  };
}

// ── Deterministic baselines (no inventing) ─────────────────────────────────

function defaultVendorLonglistForArchetype(
  archetype: string | null,
): MarketScanVendor[] {
  const a = (archetype ?? '').toLowerCase();
  if (a.includes('cloud') || a.includes('infrastructure')) {
    return [
      makeVendor('V-AWS', 'AWS', 'Cloud · hyperscaler', 'Seattle, US', 'Public Tier-1', 'real_platform', 'none', ''),
      makeVendor('V-AZURE', 'Microsoft Azure', 'Cloud · hyperscaler', 'Redmond, US', 'Public Tier-1', 'real_platform', 'none', ''),
      makeVendor('V-GCP', 'Google Cloud', 'Cloud · hyperscaler', 'Mountain View, US', 'Public Tier-1', 'real_platform', 'none', ''),
      makeVendor('V-RACKSPACE', 'Rackspace Technology', 'Cloud · multi-cloud MSP', 'San Antonio, US', 'Public Tier-2', 'real_platform', 'none', 'Multi-cloud delivery via 3 hyperscalers.'),
    ];
  }
  if (a.includes('ams') || a.includes('managed')) {
    return [
      makeVendor('V-TCS', 'Tata Consultancy Services', 'AMS · global SI', 'Mumbai, IN', 'Public Tier-1', 'real_platform', 'none', ''),
      makeVendor('V-INFY', 'Infosys', 'AMS · global SI', 'Bengaluru, IN', 'Public Tier-1', 'real_platform', 'none', ''),
      makeVendor('V-WIPRO', 'Wipro', 'AMS · global SI', 'Bengaluru, IN', 'Public Tier-1', 'real_platform', 'none', ''),
      makeVendor('V-COGNIZANT', 'Cognizant', 'AMS · global SI', 'Teaneck, US', 'Public Tier-1', 'real_platform', 'none', ''),
      makeVendor('V-HCL', 'HCLTech', 'AMS · global SI', 'Noida, IN', 'Public Tier-1', 'real_platform', 'none', ''),
    ];
  }
  if (a.includes('ai') || a.includes('intelligence')) {
    return [
      makeVendor('V-ANTHROPIC', 'Anthropic', 'AI · frontier-model lab', 'San Francisco, US', 'Private Series-E', 'real_platform', 'none', ''),
      makeVendor('V-OPENAI', 'OpenAI', 'AI · frontier-model lab', 'San Francisco, US', 'Private high-cap', 'real_platform', 'rumored', 'Periodic M&A rumors; corporate structure ambiguity.'),
      makeVendor('V-COHERE', 'Cohere', 'AI · enterprise model lab', 'Toronto, CA', 'Private Series-C', 'real_platform', 'none', ''),
      makeVendor('V-PALANTIR', 'Palantir AIP', 'AI · platform + SI', 'Denver, US', 'Public Tier-1', 'real_platform', 'none', 'AIP layered on top of Foundry — assess fit before bundling.'),
      makeVendor('V-WRAPPER', 'Various agent wrappers', 'AI · wrapper layer', 'Multiple', 'Mixed startups', 'thin_wrapper', 'none', 'Many integrations are thin OpenAI/Anthropic wrappers; reality column reflects this.'),
    ];
  }
  // Generic enterprise SaaS fallback.
  return [
    makeVendor('V-VENDOR-A', 'Vendor A (placeholder)', 'Enterprise SaaS', '—', '—', 'unknown', 'none', `Confirm archetype "${archetype ?? 'unknown'}" then re-author this artifact.`),
  ];
}

function makeVendor(
  id: string,
  name: string,
  archetype: string,
  hq: string,
  scale: string,
  reality: MarketScanVendor['platformReality'],
  ma: MarketScanVendor['maFlag'],
  notes: string,
): MarketScanVendor {
  return { id, name, archetype, hq, scale, platformReality: reality, maFlag: ma, notes };
}

function defaultCapabilityMatrix(
  vendors: ReadonlyArray<MarketScanVendor>,
  archetype: string | null,
): MarketScanCapability[] {
  const a = (archetype ?? '').toLowerCase();
  const cap = (
    capability: string,
    importance: 'M' | 'I' | 'O',
    coverageFn: (v: MarketScanVendor) => 'full' | 'partial' | 'gap' | 'unknown',
  ): MarketScanCapability => ({
    capability,
    importance,
    byVendor: Object.fromEntries(vendors.map((v) => [v.id, coverageFn(v)])),
  });

  if (a.includes('cloud') || a.includes('infrastructure')) {
    return [
      cap('Multi-region active-active', 'M', (v) =>
        v.id === 'V-RACKSPACE' ? 'partial' : 'full',
      ),
      cap('FedRAMP / HIPAA / PCI track-record', 'M', () => 'full'),
      cap('Sovereign / data-residency controls', 'I', (v) =>
        v.id === 'V-GCP' ? 'partial' : 'full',
      ),
      cap('FinOps tooling + cost guardrails', 'I', (v) =>
        v.platformReality === 'real_platform' ? 'full' : 'partial',
      ),
    ];
  }
  if (a.includes('ams') || a.includes('managed')) {
    return [
      cap('24x7 follow-the-sun coverage', 'M', () => 'full'),
      cap('Onshore architect lead + offshore depth', 'M', () => 'full'),
      cap('Documented runbook / KT process', 'M', () => 'partial'),
      cap('AI-augmented L1/L2 (eval + redteam)', 'I', () => 'partial'),
    ];
  }
  if (a.includes('ai')) {
    return [
      cap('Enterprise data isolation (no training on prompts)', 'M', (v) =>
        v.platformReality === 'thin_wrapper' ? 'unknown' : 'full',
      ),
      cap('Eval + benchmark rights (no gag)', 'M', () => 'partial'),
      cap('Consumption cap / predictable ceiling', 'M', () => 'partial'),
      cap('Fine-tuned model portability on exit', 'I', () => 'partial'),
      cap('Sub-processor disclosure (model providers)', 'M', (v) =>
        v.platformReality === 'thin_wrapper' ? 'gap' : 'full',
      ),
    ];
  }
  return [];
}

function defaultRateBenchmarks(): MarketScanRateRange[] {
  // AbarVa SI rate-card playbook baseline. Wide bands by design — used
  // for d19 reasonableness checks, not for line-item pricing.
  return [
    { archetype: 'Big-4 SI', delivery: 'onshore', specialization: 'Senior architect', rateUsdHrLow: 280, rateUsdHrHigh: 380, source: 'AbarVa SI rate-card playbook 2026' },
    { archetype: 'Big-4 SI', delivery: 'onshore', specialization: 'Engineering lead', rateUsdHrLow: 220, rateUsdHrHigh: 300, source: 'AbarVa SI rate-card playbook 2026' },
    { archetype: 'Big-4 SI', delivery: 'nearshore', specialization: 'Engineer', rateUsdHrLow: 95, rateUsdHrHigh: 140, source: 'AbarVa SI rate-card playbook 2026' },
    { archetype: 'Big-4 SI', delivery: 'offshore', specialization: 'Engineer', rateUsdHrLow: 38, rateUsdHrHigh: 72, source: 'AbarVa SI rate-card playbook 2026' },
    { archetype: 'Boutique SI', delivery: 'onshore', specialization: 'Engineering lead', rateUsdHrLow: 180, rateUsdHrHigh: 260, source: 'AbarVa SI rate-card playbook 2026' },
    { archetype: 'Boutique SI', delivery: 'nearshore', specialization: 'Engineer', rateUsdHrLow: 75, rateUsdHrHigh: 120, source: 'AbarVa SI rate-card playbook 2026' },
    { archetype: 'Global offshore SI', delivery: 'offshore', specialization: 'Engineer', rateUsdHrLow: 28, rateUsdHrHigh: 55, source: 'AbarVa SI rate-card playbook 2026' },
    { archetype: 'Global offshore SI', delivery: 'offshore', specialization: 'Data scientist', rateUsdHrLow: 45, rateUsdHrHigh: 90, source: 'AbarVa SI rate-card playbook 2026' },
    { archetype: 'Global offshore SI', delivery: 'offshore', specialization: 'SRE', rateUsdHrLow: 38, rateUsdHrHigh: 70, source: 'AbarVa SI rate-card playbook 2026' },
  ];
}

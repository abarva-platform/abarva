// Source · lifecycle-coverage substrate accessors.
//
// One module per artifact would duplicate the broker.assemble() plumbing
// seven times. Instead, all seven new artifacts pull from a small set
// of substrate views (vendor portfolio, IT landscape, IT financials,
// industry context, compliance, operating telemetry) — collected here
// once and shaped per-artifact.
//
// Body builders (which compose markdown from these views) live in
// lifecycle-bodies.ts as a pure module so unit tests can exercise the
// scaffold output without transitively pulling in the broker (whose
// @azure/* peer deps fail to resolve in some jest workspaces).
//
// Grounding contract:
//   - Every substrate fetch is best-effort (broker may be unavailable,
//     tenant may not be seeded). When a query fails or returns empty,
//     the corresponding scaffold line reads "Not recorded — seed gap"
//     instead of being silently dropped. No figures are invented.
//
// Boundary: this module is app-tier. It imports from
// `@/lib/knowledge/context-broker` (the AgentContextBroker contract),
// never from `@/lib/knowledge/tenant-data/*` (eslint TD-1 rule blocks
// direct tenant-data access from outside the knowledge package).

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import { getContextBroker } from '@/lib/knowledge/context-broker';
import type { TenantRecord } from '@/lib/knowledge/context-broker';
import type {
  ContractCoverage,
  DemandSubstrate,
  FinancialLine,
  LandscapeApp,
  RiskSubstrate,
  ComplianceObligation,
} from './lifecycle-bodies';

// Re-export the pure body builders + shapes from the broker-free module.
export {
  buildDemandChallengeBody,
  buildSourcingApproachBody,
  buildVendorRiskBody,
  fmtMissing,
  fmtUsd,
  SEED_GAP_LINE,
} from './lifecycle-bodies';

export type {
  ComplianceObligation,
  ContractCoverage,
  DemandSubstrate,
  FinancialLine,
  LandscapeApp,
  RiskSubstrate,
} from './lifecycle-bodies';

// ── Substrate view shapes (not in lifecycle-bodies) ────────────────────────

export interface IndustrySignal {
  topic: string | null;
  observation: string | null;
  source: string | null;
}

export interface TelemetrySignal {
  metric: string | null;
  value: string | null;
  surface: string | null;
}

export interface MarketSubstrate {
  industrySignals: ReadonlyArray<IndustrySignal>;
}

export interface RenewalSubstrate {
  contracts: ReadonlyArray<ContractCoverage>;
  telemetry: ReadonlyArray<TelemetrySignal>;
}

// ── Substrate loaders ──────────────────────────────────────────────────────

interface BrokerSubset {
  facts: ReadonlyArray<TenantRecord>;
}

async function assembleFor(
  ctx: SourceGenerationContext,
  query: string,
): Promise<BrokerSubset> {
  try {
    const broker = getContextBroker();
    const bundle = await broker.assemble({
      tenantKey: ctx.tenantKey,
      query,
      mode: 'tenant',
      maxFacts: 24,
      // maxChunks must be >= 1 per broker clamps; we do not consume
      // chunks (only facts) so we keep it at the minimum allowed.
      maxChunks: 1,
    });
    return { facts: bundle.facts ?? [] };
  } catch {
    return { facts: [] };
  }
}

function pickRecordsBySegment(
  facts: ReadonlyArray<TenantRecord>,
  segmentId: string,
): ReadonlyArray<TenantRecord> {
  return facts.filter((r) => r.segmentId === segmentId);
}

function readPayload(record: TenantRecord): Record<string, unknown> {
  if (record.payload && typeof record.payload === 'object') {
    return record.payload as Record<string, unknown>;
  }
  return {};
}

function readString(
  payload: Record<string, unknown>,
  keys: ReadonlyArray<string>,
): string | null {
  for (const key of keys) {
    const v = payload[key];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return null;
}

function readNumber(
  payload: Record<string, unknown>,
  keys: ReadonlyArray<string>,
): number | null {
  for (const key of keys) {
    const v = payload[key];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const n = Number(v.replace(/[,$\s]/g, ''));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function toContractCoverage(record: TenantRecord): ContractCoverage {
  const p = readPayload(record);
  return {
    vendor:
      readString(p, ['vendor', 'vendor_name', 'supplier', 'counterparty', 'name']) ??
      record.recordId,
    scope: readString(p, ['scope', 'description', 'summary', 'category_description']),
    annualSpendUsd: readNumber(p, [
      'annual_spend_usd',
      'annual_spend',
      'spend_annual',
      'total_value_usd',
      'tcv_usd',
    ]),
    renewalDate: readString(p, [
      'renewal_date',
      'expires_on',
      'end_date',
      'next_renewal',
    ]),
    category: readString(p, ['category', 'spend_category', 'taxonomy']),
    status: readString(p, ['status', 'lifecycle_status', 'state']),
  };
}

function toLandscapeApp(record: TenantRecord): LandscapeApp {
  const p = readPayload(record);
  return {
    name:
      readString(p, ['name', 'app_name', 'system_name', 'application']) ??
      record.recordId,
    function: readString(p, ['function', 'capability', 'business_function']),
    hosting: readString(p, ['hosting', 'environment', 'deployment_mode']),
    tier: readString(p, ['tier', 'criticality', 'business_criticality']),
    status: readString(p, ['status', 'lifecycle', 'state']),
  };
}

function toFinancialLine(record: TenantRecord): FinancialLine {
  const p = readPayload(record);
  return {
    category: readString(p, ['category', 'line_item', 'name', 'spend_category']),
    amountUsd: readNumber(p, ['amount_usd', 'amount', 'total', 'spend_usd', 'budget_usd']),
    notes: readString(p, ['notes', 'description', 'commentary']),
  };
}

function toIndustrySignal(record: TenantRecord): IndustrySignal {
  const p = readPayload(record);
  return {
    topic: readString(p, ['topic', 'theme', 'name', 'subject']),
    observation: readString(p, ['observation', 'insight', 'description', 'summary']),
    source: readString(p, ['source', 'citation', 'origin']),
  };
}

function toComplianceObligation(record: TenantRecord): ComplianceObligation {
  const p = readPayload(record);
  return {
    framework: readString(p, ['framework', 'regulation', 'control_set', 'name']),
    requirement: readString(p, ['requirement', 'description', 'control']),
    status: readString(p, ['status', 'attestation_status', 'state']),
  };
}

function toTelemetrySignal(record: TenantRecord): TelemetrySignal {
  const p = readPayload(record);
  return {
    metric: readString(p, ['metric', 'kpi', 'name', 'indicator']),
    value: readString(p, ['value', 'latest_value', 'measurement']),
    surface: readString(p, ['surface', 'system', 'vendor', 'source']),
  };
}

/** Load Stage-0 demand substrate (vendor coverage, IT landscape, financials). */
export async function loadDemandChallengeSubstrate(
  ctx: SourceGenerationContext,
): Promise<DemandSubstrate> {
  const queryParts = [
    'demand challenge',
    ctx.event.name,
    ctx.event.archetype ?? '',
    'vendor coverage shelfware',
  ]
    .filter(Boolean)
    .join(' ');
  const { facts } = await assembleFor(ctx, queryParts);
  return {
    contracts: pickRecordsBySegment(facts, 'vendor_contracts').map(toContractCoverage),
    landscape: pickRecordsBySegment(facts, 'it_landscape').map(toLandscapeApp),
    financials: pickRecordsBySegment(facts, 'it_financials').map(toFinancialLine),
  };
}

/** Load Stage-2 market intelligence substrate. */
export async function loadMarketScanSubstrate(
  ctx: SourceGenerationContext,
): Promise<MarketSubstrate> {
  const { facts } = await assembleFor(
    ctx,
    `market intelligence vendor landscape ${ctx.event.name} ${ctx.event.archetype ?? ''}`,
  );
  return {
    industrySignals: pickRecordsBySegment(facts, 'industry_context').map(toIndustrySignal),
  };
}

/** Load Stage-6 vendor-risk substrate (compliance + concentration). */
export async function loadVendorRiskSubstrate(
  ctx: SourceGenerationContext,
): Promise<RiskSubstrate> {
  const { facts } = await assembleFor(
    ctx,
    `vendor risk compliance concentration ${ctx.event.name}`,
  );
  return {
    contracts: pickRecordsBySegment(facts, 'vendor_contracts').map(toContractCoverage),
    compliance: pickRecordsBySegment(facts, 'compliance').map(toComplianceObligation),
  };
}

/** Load Stage-7 renewal/SRM substrate. */
export async function loadRenewalSubstrate(
  ctx: SourceGenerationContext,
): Promise<RenewalSubstrate> {
  const { facts } = await assembleFor(
    ctx,
    `vendor renewal SRM contract ${ctx.event.name}`,
  );
  return {
    contracts: pickRecordsBySegment(facts, 'vendor_contracts').map(toContractCoverage),
    telemetry: pickRecordsBySegment(facts, 'operating_telemetry').map(toTelemetrySignal),
  };
}

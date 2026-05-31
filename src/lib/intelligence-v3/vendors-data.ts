import 'server-only';

// Intelligence v3 · Vendors stage data builder.
//
// Reads ai_initiative_vendors joined to ai_initiatives for the active
// tenant. Rolls up by vendor_name (a vendor may appear under multiple
// initiatives within a tenant) so the UI shows one row per vendor with
// aggregated risk / contract / adoption / value dimensions.
//
// Slice 4 (data-plane seam): the joined row read is delegated to
// `intelligenceVendorsReadAdapter`, so this server-component helper can
// parallel-run against Azure Postgres via `ABARVA_DATA_PLANE`. The roll-up,
// sort and totals logic below is pure and stays here. The helper signature
// and `VendorsData` return shape are unchanged.

import { selectIntelligenceVendorsReadAdapter } from '@/lib/data-plane/read-adapters/intelligenceVendorsReadAdapter';
import type { Stage, StatusFlag } from '@/lib/admin/ai-initiatives/labels';
import { getInferenceEconomicsForClientVendor } from '@/lib/source/vendor-inference-economics';
import type {
  VendorFinancialHealth,
  VendorInitiativeLink,
  VendorRollup,
  VendorsData,
} from './vendors-display';

// Re-export so server-side callers can keep importing types from
// vendors-data without separately importing vendors-display.
export type {
  VendorFinancialHealth,
  VendorInitiativeLink,
  VendorRollup,
  VendorsData,
} from './vendors-display';

const CONCERNING_STATUSES: ReadonlyArray<StatusFlag> = [
  'stalled',
  'cost_overrun',
  'duplication_risk',
  'value_lag',
];

const HEALTH_RANK: Record<VendorFinancialHealth, number> = {
  strong: 0,
  moderate: 1,
  watch: 2,
  at_risk: 3,
};

function worstHealth(values: ReadonlyArray<VendorFinancialHealth | null>): VendorFinancialHealth | null {
  let worst: VendorFinancialHealth | null = null;
  let worstRank = -1;
  for (const v of values) {
    if (v === null) continue;
    const r = HEALTH_RANK[v];
    if (r > worstRank) {
      worst = v;
      worstRank = r;
    }
  }
  return worst;
}

function earliest(dates: ReadonlyArray<string | null>): string | null {
  let best: string | null = null;
  for (const d of dates) {
    if (d === null) continue;
    if (best === null || d < best) best = d;
  }
  return best;
}

function isUpcoming(date: string | null, withinDays = 365): boolean {
  if (!date) return false;
  const renewal = new Date(date);
  if (Number.isNaN(renewal.getTime())) return false;
  const ms = renewal.getTime() - Date.now();
  const days = ms / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= withinDays;
}

function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'string' ? Number.parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

export async function getVendorsForClient(clientId: string): Promise<VendorsData> {
  const rows = await selectIntelligenceVendorsReadAdapter().getVendorRowsForClient(
    clientId,
  );

  // Bucket by vendor_name (case-insensitive trim) so "Microsoft 365 Copilot"
  // and "Microsoft 365 copilot" roll up together. Keep the first-seen
  // display-case rendering of the name.
  const byVendor = new Map<string, { displayName: string; links: VendorInitiativeLink[] }>();
  for (const r of rows) {
    if (!r.initiative) continue;
    const key = r.vendor_name.trim().toLowerCase();
    const bucket = byVendor.get(key) ?? { displayName: r.vendor_name.trim(), links: [] };
    bucket.links.push({
      initiativeId: r.initiative.initiative_id,
      initiativeDisplayId: r.initiative.display_id,
      initiativeName: r.initiative.name,
      initiativeStatusFlag: r.initiative.status_flag as StatusFlag,
      initiativeStage: r.initiative.stage as Stage,
      contractValueUsd: toNumber(r.contract_value_usd),
      renewalDate: r.renewal_date,
      financialHealth: r.financial_health as VendorFinancialHealth | null,
      notes: r.notes,
      inferenceEconomics:
        getInferenceEconomicsForClientVendor(clientId, r.vendor_id)
        ?? getInferenceEconomicsForClientVendor(clientId, r.vendor_name),
    });
    byVendor.set(key, bucket);
  }

  const vendors: VendorRollup[] = [];
  for (const { displayName, links } of byVendor.values()) {
    const total = links.reduce(
      (sum, l) => sum + (l.contractValueUsd ?? 0),
      0,
    );
    const totalNonNull = links.some((l) => l.contractValueUsd !== null) ? total : null;

    vendors.push({
      vendorName: displayName,
      initiatives: links,
      totalContractValueUsd: totalNonNull,
      earliestRenewal: earliest(links.map((l) => l.renewalDate)),
      worstFinancialHealth: worstHealth(links.map((l) => l.financialHealth)),
      initiativesAtRisk: links.filter((l) =>
        CONCERNING_STATUSES.includes(l.initiativeStatusFlag),
      ).length,
      totalInitiatives: links.length,
      inferenceEconomics:
        links.find((l) => l.inferenceEconomics !== null)?.inferenceEconomics ?? null,
    });
  }

  // Sort: at-risk vendors first, then by total contract value descending.
  vendors.sort((a, b) => {
    if (a.initiativesAtRisk !== b.initiativesAtRisk) {
      return b.initiativesAtRisk - a.initiativesAtRisk;
    }
    return (b.totalContractValueUsd ?? 0) - (a.totalContractValueUsd ?? 0);
  });

  const totalContract = vendors.reduce(
    (sum, v) => sum + (v.totalContractValueUsd ?? 0),
    0,
  );
  const upcomingRenewals = vendors.filter((v) => isUpcoming(v.earliestRenewal)).length;
  const atRiskVendors = vendors.filter(
    (v) => v.worstFinancialHealth === 'at_risk' || v.worstFinancialHealth === 'watch',
  ).length;

  return {
    vendors,
    totals: {
      vendorCount: vendors.length,
      contractValueUsd: totalContract,
      upcomingRenewals,
      atRiskVendors,
    },
  };
}

// Display helpers (vendorHealthLabel, daysUntil) live in
// ./vendors-display.ts. Re-exported below for back-compat with any
// server-side callers that imported them from here.
export { vendorHealthLabel, daysUntil } from './vendors-display';

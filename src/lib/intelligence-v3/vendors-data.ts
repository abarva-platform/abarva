import 'server-only';

// Intelligence v3 · Vendors stage data builder.
//
// Reads ai_initiative_vendors joined to ai_initiatives for the active
// tenant. Rolls up by vendor_name (a vendor may appear under multiple
// initiatives within a tenant) so the UI shows one row per vendor with
// aggregated risk / contract / adoption / value dimensions.

import { getServerSupabase } from '@/lib/supabase-server';
import type { Stage, StatusFlag } from '@/lib/admin/ai-initiatives/labels';
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

interface JoinedRow {
  vendor_id: string;
  initiative_id: string;
  vendor_name: string;
  contract_value_usd: number | string | null;
  renewal_date: string | null;
  financial_health: VendorFinancialHealth | null;
  notes: string | null;
  ai_initiatives: {
    initiative_id: string;
    display_id: string;
    name: string;
    status_flag: StatusFlag;
    stage: Stage;
    client_id: string;
  } | null;
}

function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'string' ? Number.parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

export async function getVendorsForClient(clientId: string): Promise<VendorsData> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('ai_initiative_vendors')
    .select(
      'vendor_id, initiative_id, vendor_name, contract_value_usd, renewal_date, financial_health, notes, ' +
        'ai_initiatives!inner(initiative_id, display_id, name, status_flag, stage, client_id)',
    )
    .eq('ai_initiatives.client_id', clientId);
  if (error) throw new Error(`getVendorsForClient: ${error.message}`);

  const rows = (data ?? []) as unknown as ReadonlyArray<JoinedRow>;

  // Bucket by vendor_name (case-insensitive trim) so "Microsoft 365 Copilot"
  // and "Microsoft 365 copilot" roll up together. Keep the first-seen
  // display-case rendering of the name.
  const byVendor = new Map<string, { displayName: string; links: VendorInitiativeLink[] }>();
  for (const r of rows) {
    if (!r.ai_initiatives) continue;
    const key = r.vendor_name.trim().toLowerCase();
    const bucket = byVendor.get(key) ?? { displayName: r.vendor_name.trim(), links: [] };
    bucket.links.push({
      initiativeId: r.ai_initiatives.initiative_id,
      initiativeDisplayId: r.ai_initiatives.display_id,
      initiativeName: r.ai_initiatives.name,
      initiativeStatusFlag: r.ai_initiatives.status_flag,
      initiativeStage: r.ai_initiatives.stage,
      contractValueUsd: toNumber(r.contract_value_usd),
      renewalDate: r.renewal_date,
      financialHealth: r.financial_health,
      notes: r.notes,
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

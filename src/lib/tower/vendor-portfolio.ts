// Vendor portfolio adapter · File 04 Z1-B
//
// Each seeded tenant has its own vendor seed schema (apex, meridian,
// firstcapital, keystone). This adapter normalizes them into a common
// view model the VendorPortfolioSurface renders. One VM, three seeds,
// zero re-authoring.

import type { ClientKey } from '@/lib/client-config';

export type VendorRiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Unknown';

export interface VendorRow {
  name: string;
  product: string;
  category: string;
  annualSpendMillions: number;
  contractStatus: string;
  riskLevel: VendorRiskLevel;
  keyRisk: string;
  notes?: string;
}

export interface VendorPortfolioVM {
  tenantKey: ClientKey;
  tenantDisplay: string;
  totalITBudgetMillions: number;
  mappedSpendMillions: number | null;
  shadowITMillions: number | null;
  vendors: VendorRow[];
  sourceNote: string;
}

function normalizeRisk(raw: unknown): VendorRiskLevel {
  if (typeof raw !== 'string') return 'Unknown';
  const r = raw.toLowerCase();
  if (r.includes('critical')) return 'Critical';
  if (r.includes('high')) return 'High';
  if (r.includes('medium')) return 'Medium';
  if (r.includes('low')) return 'Low';
  return 'Unknown';
}

interface GenericVendor {
  name: string;
  product?: string;
  category?: string;
  annualSpendMillions?: number;
  contractStatus?: string;
  riskLevel?: string;
  keyRisk?: string;
  notes?: string;
}

interface GenericTenantVendorSeed {
  totalITBudget?: number;
  mappedSpend?: number;
  shadowIT?: number | { annualSpendMillions?: number };
  vendors?: GenericVendor[];
}

function adapt(tenantKey: ClientKey, tenantDisplay: string, seed: GenericTenantVendorSeed, sourceNote: string): VendorPortfolioVM {
  const shadowITMillions =
    typeof seed.shadowIT === 'number'
      ? seed.shadowIT
      : seed.shadowIT && typeof seed.shadowIT === 'object' && typeof seed.shadowIT.annualSpendMillions === 'number'
        ? seed.shadowIT.annualSpendMillions
        : null;

  const vendors: VendorRow[] = (seed.vendors ?? []).map((v) => ({
    name: v.name,
    product: v.product ?? v.name,
    category: v.category ?? 'Uncategorized',
    annualSpendMillions: v.annualSpendMillions ?? 0,
    contractStatus: v.contractStatus ?? 'Unknown',
    riskLevel: normalizeRisk(v.riskLevel),
    keyRisk: v.keyRisk ?? 'No risk note on file.',
    notes: v.notes,
  }));

  return {
    tenantKey,
    tenantDisplay,
    totalITBudgetMillions: seed.totalITBudget ?? 0,
    mappedSpendMillions: seed.mappedSpend ?? null,
    shadowITMillions,
    vendors,
    sourceNote,
  };
}

/**
 * Load vendor portfolio for a tenant. Returns null when the tenant has
 * no seeded vendor data (the surface then renders a "no data" state
 * rather than fabricating content).
 */
export async function loadVendorPortfolio(tenantKey: ClientKey, tenantDisplay: string): Promise<VendorPortfolioVM | null> {
  try {
    if (tenantKey === 'apexretail') {
      const mod = await import('@/data/apexretail/vendors');
      return adapt(tenantKey, tenantDisplay, mod.apexVendors as GenericTenantVendorSeed, 'Seeded composite vendor inventory for Apex Retail Group.');
    }
    if (tenantKey === 'meridian') {
      const mod = await import('@/data/meridian/vendors');
      return adapt(tenantKey, tenantDisplay, mod.meridianVendors as unknown as GenericTenantVendorSeed, 'Seeded composite vendor inventory for Meridian Health System.');
    }
    if (tenantKey === 'arcturus') {
      const mod = await import('@/data/firstcapital/vendors');
      // First Capital seed is a differently-shaped exported record; keep
      // the adapter tolerant and let the surface render whatever arrives.
      const data = (mod.firstCapitalVendors ?? {}) as unknown as GenericTenantVendorSeed;
      return adapt(tenantKey, tenantDisplay, data, 'Seeded composite vendor inventory for Arcturus Financial / First Capital.');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Summarize a portfolio into pressure-card-style headlines. Consumer
 * surface uses these at the top of the page so the reader sees
 * concentration and shadow IT at a glance.
 */
export interface VendorPortfolioSummary {
  criticalCount: number;
  highCount: number;
  topSpendPct: number;
  totalVendorSpend: number;
  largestVendor: VendorRow | null;
}

export function summarizePortfolio(vm: VendorPortfolioVM): VendorPortfolioSummary {
  const criticalCount = vm.vendors.filter((v) => v.riskLevel === 'Critical').length;
  const highCount = vm.vendors.filter((v) => v.riskLevel === 'High').length;
  const totalVendorSpend = vm.vendors.reduce((sum, v) => sum + (v.annualSpendMillions ?? 0), 0);
  const sortedBySpend = [...vm.vendors].sort((a, b) => b.annualSpendMillions - a.annualSpendMillions);
  const largestVendor = sortedBySpend[0] ?? null;
  const top3Spend = sortedBySpend.slice(0, 3).reduce((s, v) => s + v.annualSpendMillions, 0);
  const topSpendPct = totalVendorSpend > 0 ? Math.round((top3Spend / totalVendorSpend) * 100) : 0;
  return { criticalCount, highCount, topSpendPct, totalVendorSpend, largestVendor };
}

// Pure display helpers + types for the Vendors stage.
//
// No `import 'server-only'` — client components import from here.
// vendors-data.ts (server-only) re-exports the same types so server
// callers see one shape.

import type { Stage, StatusFlag } from '@/lib/admin/ai-initiatives/labels';

export type VendorFinancialHealth = 'strong' | 'moderate' | 'watch' | 'at_risk';

export interface VendorInitiativeLink {
  initiativeId: string;
  initiativeDisplayId: string;
  initiativeName: string;
  initiativeStatusFlag: StatusFlag;
  initiativeStage: Stage;
  contractValueUsd: number | null;
  renewalDate: string | null;
  financialHealth: VendorFinancialHealth | null;
  notes: string | null;
}

export interface VendorRollup {
  vendorName: string;
  initiatives: ReadonlyArray<VendorInitiativeLink>;
  totalContractValueUsd: number | null;
  earliestRenewal: string | null;
  worstFinancialHealth: VendorFinancialHealth | null;
  initiativesAtRisk: number;
  totalInitiatives: number;
}

export interface VendorsData {
  vendors: ReadonlyArray<VendorRollup>;
  totals: {
    vendorCount: number;
    contractValueUsd: number;
    upcomingRenewals: number;
    atRiskVendors: number;
  };
}

export function vendorHealthLabel(h: VendorFinancialHealth | null): string {
  if (h === null) return 'Unrated';
  switch (h) {
    case 'strong':
      return 'Strong';
    case 'moderate':
      return 'Moderate';
    case 'watch':
      return 'Watch';
    case 'at_risk':
      return 'At risk';
  }
}

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return null;
  return Math.round((t - Date.now()) / (1000 * 60 * 60 * 24));
}

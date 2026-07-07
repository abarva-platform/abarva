// =============================================================================
// Discovery Intake — industry profiles (industry-agnostic core, adaptive edge)
// -----------------------------------------------------------------------------
// The discovery engine is industry-AGNOSTIC: the contract, transformers,
// maturity dimensions, UI, and templates are all generic. But discovery should
// not be industry-BLIND — the data domains worth assessing differ by industry
// (healthcare's EHR/claims ≠ retail's POS/CDP ≠ banking's core/treasury).
//
// This is the pluggable industry layer: a profile keyed by the tenant's
// `industry_code` (src/lib/client-config.ts), supplying the data domains the
// agent proposes at origination. Any unknown industry falls back to a generic
// cross-industry profile — so the module replicates for ANY client/industry,
// with sensible defaults and industry-aware suggestions where we have them.
//
// Pure data + lookup. No I/O. Mirrors the Function-Pack (industryKey) pattern.
// =============================================================================

export interface IndustryProfile {
  industryCode: string;
  label: string;
  /** Data domains the agent proposes for this industry's discovery. */
  suggestedDomains: string[];
}

/** Cross-industry fallback — used for any industry without a specific profile. */
export const GENERIC_INDUSTRY_PROFILE: IndustryProfile = {
  industryCode: 'GENERIC',
  label: 'Cross-industry',
  suggestedDomains: ['Customer', 'Operations', 'Finance / ERP', 'Supply Chain', 'Workforce', 'Product'],
};

/** Profiles keyed by the repo's `industry_code` values (client-config.ts). */
const INDUSTRY_PROFILES: Record<string, IndustryProfile> = {
  HEALTHCARE_IDN: {
    industryCode: 'HEALTHCARE_IDN',
    label: 'Healthcare (IDN)',
    suggestedDomains: ['EHR / Clinical', 'Claims', 'Eligibility', 'Pharmacy', 'Population Health', 'Workforce', 'Finance / ERP'],
  },
  MEDTECH: {
    industryCode: 'MEDTECH',
    label: 'MedTech',
    suggestedDomains: ['Device Telemetry', 'Clinical / Trials', 'Quality / Regulatory', 'Supply Chain', 'Sales / CRM', 'Finance / ERP'],
  },
  FINSERV: {
    industryCode: 'FINSERV',
    label: 'Financial Services',
    suggestedDomains: ['Core Banking', 'Payments', 'Risk', 'Treasury', 'Compliance / AML', 'Customer / CRM'],
  },
  RETAIL: {
    industryCode: 'RETAIL',
    label: 'Retail',
    suggestedDomains: ['POS / Transactions', 'E-commerce', 'CDP / Customer', 'Supply Chain', 'Inventory', 'Marketing'],
  },
  AIRLINE: {
    industryCode: 'AIRLINE',
    label: 'Airline',
    suggestedDomains: ['Reservations / PSS', 'Operations / Flight', 'Loyalty', 'Crew / Workforce', 'Maintenance (MRO)', 'Finance / ERP'],
  },
  DIVERSIFIED: {
    industryCode: 'DIVERSIFIED',
    label: 'Diversified',
    suggestedDomains: GENERIC_INDUSTRY_PROFILE.suggestedDomains,
  },
};

/**
 * Resolve the industry profile for a tenant `industry_code`. Falls back to the
 * generic cross-industry profile for any unknown / missing code — so the module
 * works for every client, industry-aware where we have a profile.
 */
export function industryProfileFor(industryCode: string | null | undefined): IndustryProfile {
  const key = (industryCode ?? '').trim().toUpperCase();
  return INDUSTRY_PROFILES[key] ?? GENERIC_INDUSTRY_PROFILE;
}

/** All industry codes with a specific (non-generic) profile. */
export function profiledIndustryCodes(): string[] {
  return Object.keys(INDUSTRY_PROFILES);
}

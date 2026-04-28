// Tower Wave T5 · AI Vendor Detail Fixture
// Deterministic seed-only. No model calls, no Date.now, no Math.random.


export interface VendorProgram {
  readonly programId: string;
  readonly programName: string;
  readonly annualSpend: number;
  readonly roi: number;
  readonly lifecyclePhase: 'pilot' | 'rollout' | 'steady-state' | 'at-risk';
  readonly activePressures: number;
}

export interface VendorAlternative {
  readonly name: string;
  readonly type: string;
  readonly estimatedSwitchCost: string;
  readonly note: string;
}

export interface AiVendorView {
  readonly vendorId: string;
  readonly vendorName: string;
  readonly category: string;
  readonly totalAnnualSpend: number;
  readonly pctOfAiBudget: number;
  readonly programs: readonly VendorProgram[];
  readonly renewalInDays: number | null;
  readonly contractNotes: string;
  readonly switchingCostLabel: string;
  readonly alternatives: readonly VendorAlternative[];
  readonly nexusQuote: string;
  readonly nexusContext: string;
  readonly nexusActions: ReadonlyArray<{ letter: 'A' | 'B' | 'C'; text: string; detail?: string }>;
}

const TOTAL_PORTFOLIO_SPEND = 11_700_000;

const VENDOR_SEED: Record<string, AiVendorView> = {
  microsoft: {
    vendorId: 'microsoft',
    vendorName: 'Microsoft',
    category: 'Enterprise software + AI productivity',
    totalAnnualSpend: 5_000_000,
    pctOfAiBudget: 5_000_000 / TOTAL_PORTFOLIO_SPEND,
    programs: [
      { programId: 'twr-prog-m365-copilot', programName: 'M365 Copilot', annualSpend: 5_000_000, roi: (3_600_000 - 5_000_000) / 5_000_000, lifecyclePhase: 'rollout', activePressures: 2 },
    ],
    renewalInDays: 47,
    contractNotes: 'M365 E5 bundle with Copilot. Copilot is not independently negotiable — scope changes require full E5 rebundling. Renewal is an enterprise agreement reanchoring.',
    switchingCostLabel: 'Very high — Microsoft 365 is core productivity infrastructure; full migration estimated $4–12M depending on scope.',
    alternatives: [
      { name: 'Google Workspace + Duet AI', type: 'Full workspace replacement', estimatedSwitchCost: '$8–12M', note: 'Complete email/calendar/docs migration. 18-month minimum timeline.' },
      { name: 'Notion AI (partial)', type: 'Point replacement (docs/notes)', estimatedSwitchCost: '$200K', note: 'Partial alternative for collaborative docs use cases only.' },
    ],
    nexusQuote: 'Microsoft is 43% of the AI portfolio — the highest concentration risk. M365 Copilot renewal in 47 days is the leverage window. Current ROI is negative at 24% adoption. Negotiation levers: Now Assist duplication evidence ($800K overlap), adoption shortfall documentation, right-sizing request from 12,400 to 8,000 seats.',
    nexusContext: 'Nexus · Microsoft · 43% of AI budget · 47-day renewal',
    nexusActions: [
      { letter: 'A', text: 'Prepare renewal brief now', detail: '47 days · right-size seats · use duplication evidence as leverage' },
      { letter: 'B', text: 'Document adoption shortfall', detail: '24% vs 75% target · vendor missed their ROI projection' },
      { letter: 'C', text: 'Model seat reduction scenario', detail: '12,400 → 8,000 licensed · ~$1.7M annual savings' },
    ],
  },
  anthropic: {
    vendorId: 'anthropic',
    vendorName: 'Anthropic',
    category: 'AI coding agent',
    totalAnnualSpend: 400_000,
    pctOfAiBudget: 400_000 / TOTAL_PORTFOLIO_SPEND,
    programs: [
      { programId: 'twr-prog-claude-code', programName: 'Claude Code', annualSpend: 400_000, roi: (4_030_000 - 400_000) / 400_000, lifecyclePhase: 'steady-state', activePressures: 1 },
    ],
    renewalInDays: 214,
    contractNotes: 'Enterprise agreement covers 280 seats. Per-seat pricing; expansion to 350 requires amendment. Pricing is competitive at current scale.',
    switchingCostLabel: 'Low — no deep infrastructure integration. Primary switching cost is re-adoption ramp (~2–4 weeks) and workflow disruption.',
    alternatives: [
      { name: 'GitHub Copilot (Microsoft)', type: 'Direct alternative', estimatedSwitchCost: '$20K migration + 4-week ramp', note: 'Bundled with GitHub Enterprise. Lower standalone ROI in prior cohort comparison.' },
      { name: 'Cursor', type: 'IDE-integrated alternative', estimatedSwitchCost: '$5K + 2-week ramp', note: 'Favored by some engineers; lower enterprise governance.' },
    ],
    nexusQuote: 'Anthropic is the best-performing vendor in the portfolio at 9.1x ROI. The only action needed is expansion: 280 → 350 seats, $57K incremental spend for ~$570K projected value. Renewal is 214 days out — no urgency on terms, but lock in the expansion amendment before headcount outgrows the commitment.',
    nexusContext: 'Nexus · Anthropic · 3.4% of AI budget · 9.1x ROI',
    nexusActions: [
      { letter: 'A', text: 'Amend contract: 280 → 350 seats', detail: '$57K incremental · ~$570K projected lift · 30 days' },
      { letter: 'B', text: 'Activate 24 non-users', detail: 'Approved list · low effort · $77K/yr additional value' },
      { letter: 'C', text: 'Set annual attribution refresh', detail: 'Upgrade from medium to high confidence via A/B test' },
    ],
  },
  servicenow: {
    vendorId: 'servicenow',
    vendorName: 'ServiceNow',
    category: 'Service desk AI + ITSM',
    totalAnnualSpend: 2_800_000,
    pctOfAiBudget: 2_800_000 / TOTAL_PORTFOLIO_SPEND,
    programs: [
      { programId: 'twr-prog-now-assist', programName: 'ServiceNow Now Assist', annualSpend: 2_800_000, roi: (1_116_000 - 2_800_000) / 2_800_000, lifecyclePhase: 'at-risk', activePressures: 2 },
    ],
    renewalInDays: 112,
    contractNotes: 'Includes KB integration SLA (milestone missed by 18 months). Potential SLA breach compensation. Bundled with broader ServiceNow ITSM contract — decoupling Now Assist scope requires contract amendment.',
    switchingCostLabel: 'High — deeply integrated with ServiceNow incident and change management flows. Migration estimate: $600K–$900K + 6-month transition.',
    alternatives: [
      { name: 'Freshservice AI', type: 'ITSM + AI replacement', estimatedSwitchCost: '$700K + 6 months', note: 'Full ITSM platform migration; lower per-ticket deflection cost at scale.' },
      { name: 'Zendesk AI', type: 'Partial alternative (customer-facing)', estimatedSwitchCost: '$300K + 3 months', note: 'Best for customer-facing tickets; limited for internal IT workflows.' },
    ],
    nexusQuote: 'ServiceNow is at-risk: $1.7M annual value shortfall with high-confidence attribution. Renewal in 112 days is the inflection point. The negotiation position is strong — SLA miss documented, deflection at 28% vs 40% promised. Path: KB completion commitment with penalty clause, or 20% rate reduction.',
    nexusContext: 'Nexus · ServiceNow · At risk · 112-day renewal',
    nexusActions: [
      { letter: 'A', text: 'Engage ServiceNow: SLA breach documentation', detail: 'Formal notice · opens penalty clause discussion' },
      { letter: 'B', text: 'Model KB completion vs descope', detail: '90-day KB sprint vs. scope reduction at renewal' },
      { letter: 'C', text: 'Request 20% fee reduction or penalty credit', detail: '112 days · $560K/yr recovery if granted' },
    ],
  },
  sap: {
    vendorId: 'sap',
    vendorName: 'SAP',
    category: 'ERP + AI agent',
    totalAnnualSpend: 1_500_000,
    pctOfAiBudget: 1_500_000 / TOTAL_PORTFOLIO_SPEND,
    programs: [
      { programId: 'twr-prog-sap-joule', programName: 'SAP Joule', annualSpend: 1_500_000, roi: (1_350_000 - 1_500_000) / 1_500_000, lifecyclePhase: 'rollout', activePressures: 1 },
    ],
    renewalInDays: 548,
    contractNotes: 'Bundled with S/4HANA core license. Joule cannot be removed without S/4HANA renegotiation. Multi-year ERP commitment.',
    switchingCostLabel: 'Extreme — tied to S/4HANA core. Switching to a different ERP AI would require ERP platform migration ($4–8M). Not a near-term decision.',
    alternatives: [
      { name: 'Workday AI Copilot', type: 'ERP agent alternative (if migrating to Workday)', estimatedSwitchCost: '$5–10M', note: 'Only relevant if full ERP platform migration occurs.' },
      { name: 'Custom AI on S/4HANA APIs', type: 'Custom build alternative', estimatedSwitchCost: '$800K–$1.5M build', note: 'Not recommended — Joule has tight S/4HANA integration that custom would replicate poorly.' },
    ],
    nexusQuote: 'SAP vendor risk is a strategic watch, not an urgent decision. Renewal is 548 days out. The watch items: (1) switching cost is already high and grows every quarter; (2) SAP + Microsoft together represent 55% of the AI budget — vendor concentration is above the 40% single-vendor threshold. No action required in the next 90 days.',
    nexusContext: 'Nexus · SAP · Strategic watch · 548-day renewal',
    nexusActions: [
      { letter: 'A', text: 'Document $4–8M switching cost estimate', detail: 'Formalize methodology · planning anchor for future decisions' },
      { letter: 'B', text: 'Set AI vendor diversity review for Q4', detail: 'SAP + Microsoft = 55% of AI budget · review concentration policy' },
      { letter: 'C', text: '12-month Joule value checkpoint (Oct 2026)', detail: 'Finance close cycle time is the definitive KPI' },
    ],
  },
};

export function buildAiVendorView(vendorId: string): AiVendorView | null {
  return VENDOR_SEED[vendorId] ?? null;
}

export function getAllVendorIds(): readonly string[] {
  return Object.keys(VENDOR_SEED);
}

// Tower Wave T3 · AI Program Detail Fixture
//
// Extended per-program data for TWR-DTL-PROGRAM.
// Supplements ai-program-portfolio-fixture.ts (which has spend, ROI, pressures).
// Deterministic seed-only. No live integrations, no model calls.

import {
  getAiProgramById,
  buildAiProgramPortfolioDecisions,
  type AiProgram,
  type PortfolioDecision,
} from '@/lib/tower/ai-program-portfolio-fixture';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PromisedOutcome {
  readonly metric: string;
  readonly target: string;
  readonly basis: string;
}

export interface RealizedOutcome {
  readonly metric: string;
  readonly actual: string;
  readonly variance: string;
  readonly onTrack: boolean;
}

export interface DeptAdoption {
  readonly dept: string;
  readonly eligible: number;
  readonly active: number;
}

export interface AiProgramDetailView {
  readonly program: AiProgram;

  // Value model
  readonly valueModelType: string;
  readonly valueFormula: string;
  readonly attributionNote: string;
  readonly promisedOutcomes: readonly PromisedOutcome[];
  readonly realizedOutcomes: readonly RealizedOutcome[];

  // Adoption detail
  readonly adoptionByDept: readonly DeptAdoption[];
  readonly behaviorChangeNote: string;

  // Vendor
  readonly switchingCostLabel: string;
  readonly vendorPerformanceScore: number;    // 0–100
  readonly vendorNote: string;
  readonly renewalLabel: string;

  // Decisions linked to this program
  readonly linkedDecisions: readonly PortfolioDecision[];

  // Nexus voice
  readonly nexusQuote: string;
  readonly nexusContext: string;
  readonly nexusActions: ReadonlyArray<{ letter: 'A' | 'B' | 'C'; text: string; detail?: string }>;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const DETAIL_SEED: Record<string, Omit<AiProgramDetailView, 'program' | 'linkedDecisions'>> = {
  'twr-prog-m365-copilot': {
    valueModelType: 'T-PROD · Productivity agent',
    valueFormula: 'Δ time recovered/user/wk × hourly cost × 52 × active users × utilization weight',
    attributionNote: 'Self-report survey + usage logs. Utilization factor applied: 0.24 active × 0.4 confidence haircut = effective 0.096 attribution multiplier.',
    promisedOutcomes: [
      { metric: 'Time saved per user', target: '5 hr/wk', basis: 'Vendor pitch, pre-deployment survey' },
      { metric: 'Adoption rate', target: '75% of seats in 6 months', basis: 'CIO deployment plan' },
      { metric: 'Estimated annual value', target: '$12.5M', basis: 'Vendor ROI calculator (unadjusted)' },
    ],
    realizedOutcomes: [
      { metric: 'Time saved per active user', actual: '2.1 hr/wk', variance: '−58% vs target', onTrack: false },
      { metric: 'Adoption rate', actual: '24% (2,976 of 12,400)', variance: '−68% vs 75% target', onTrack: false },
      { metric: 'Attributed annual value', actual: '$3.6M', variance: '−71% vs promised', onTrack: false },
    ],
    adoptionByDept: [
      { dept: 'Engineering', eligible: 1800, active: 612 },
      { dept: 'Finance', eligible: 1400, active: 196 },
      { dept: 'Legal', eligible: 600, active: 72 },
      { dept: 'Operations', eligible: 4200, active: 1134 },
      { dept: 'Marketing', eligible: 1200, active: 360 },
      { dept: 'Other', eligible: 3200, active: 602 },
    ],
    behaviorChangeNote: 'Engineering is highest-adoption (34%) but primarily using Meeting Recap, overlapping with GitHub Copilot. Finance at 14% is the largest untapped opportunity — $1.1M incremental value projected from a 90-day sprint.',
    switchingCostLabel: 'Very high — bundled with M365 enterprise agreement; full suite migration ~$2.4M est.',
    vendorPerformanceScore: 54,
    vendorNote: 'Microsoft Enterprise Agreement renewal in 47 days. Copilot is bundled with M365 E5 — cannot negotiate independently without repackaging. Leverage: GitHub Copilot competitive pricing + Now Assist duplication evidence.',
    renewalLabel: '47 days',
    nexusQuote: 'M365 Copilot at $5.0M with 24% adoption — negative ROI at current trajectory. The 60% adoption threshold for breakeven isn\'t being hit anywhere except Engineering. Finance and Legal are the largest untapped depts. 90-day Finance sprint projects $1.1M incremental value. Microsoft renewal in 47 days is the forcing function.',
    nexusContext: 'Nexus · M365 Copilot · $5.0M · −0.28x ROI',
    nexusActions: [
      { letter: 'A', text: 'Launch Finance adoption sprint', detail: '14% → 50% target · $1.1M incremental value projected' },
      { letter: 'B', text: 'Prepare Microsoft renewal brief', detail: '47 days · leverage Copilot + Now Assist duplication overlap' },
      { letter: 'C', text: 'Eliminate Now Assist overlap', detail: '$800K/yr duplication · 60% use-case overlap confirmed' },
    ],
  },

  'twr-prog-claude-code': {
    valueModelType: 'T-CODE · Coding agent',
    valueFormula: 'Δ PR throughput/dev/mo × dev hourly cost × 160 hr/mo × dev count × 12 + quality lift',
    attributionNote: 'Cohort-matched DORA baseline (90-day pre/post). Medium confidence — not A/B tested, but cohort match is strong.',
    promisedOutcomes: [
      { metric: 'PR throughput lift', target: '+25–30% vs baseline', basis: 'Pilot cohort benchmark' },
      { metric: 'Adoption among eligible devs', target: '80% within 3 months', basis: 'VP Engineering deployment plan' },
      { metric: 'Annualized value', target: '$3.5–4.5M', basis: 'DORA model projection at $120/hr fully-loaded' },
    ],
    realizedOutcomes: [
      { metric: 'PR throughput lift', actual: '+38% vs baseline', variance: '+27% vs midpoint target', onTrack: true },
      { metric: 'Adoption rate', actual: '88% (176 of 200)', variance: '+10% vs 80% target', onTrack: true },
      { metric: 'Attributed annual value', actual: '$4.03M', variance: '+5% vs midpoint target', onTrack: true },
    ],
    adoptionByDept: [
      { dept: 'Engineering (backend)', eligible: 90, active: 82 },
      { dept: 'Engineering (frontend)', eligible: 60, active: 54 },
      { dept: 'Platform / DevOps', eligible: 30, active: 26 },
      { dept: 'Data Engineering', eligible: 20, active: 14 },
    ],
    behaviorChangeNote: 'Strongest behavioral signal: PR cycle time reduced 31%. Secondary: 8% fewer revert PRs. Open gap: 24 engineers on the approved list have not activated — primarily senior engineers with context-switching overhead.',
    switchingCostLabel: 'Low — no deep system integration; primary risk is re-adoption curve (~2–4 weeks productivity dip).',
    vendorPerformanceScore: 91,
    vendorNote: 'Current commitment: 280 seats at enterprise rate. 176 active with 200 eligible — expansion to 350 requires renegotiation. Anthropic enterprise pricing is per-seat; expansion projected to cost $57K additional for ~$570K incremental value.',
    renewalLabel: '214 days',
    nexusQuote: 'Claude Code is the portfolio\'s best performer at 9.1x ROI — $4.03M value on $400K spend. 88% adoption exceeds target. The only open pressure is seat expansion: 280 committed, 350 needed as hiring continues. $57K incremental spend for ~$570K projected lift. Renew and expand before the Microsoft window closes.',
    nexusContext: 'Nexus · Claude Code · $400K · 9.1x ROI',
    nexusActions: [
      { letter: 'A', text: 'Expand seats 280 → 350', detail: '$57K incremental · ~$570K projected lift · renegotiate with Anthropic' },
      { letter: 'B', text: 'Activate 24 non-users', detail: 'Senior engineers on approved list — assign sponsor pairs' },
      { letter: 'C', text: 'Extend DORA baseline to 12-month', detail: '90-day cohort match is solid; annual baseline unlocks HIGH confidence' },
    ],
  },

  'twr-prog-now-assist': {
    valueModelType: 'T-SVC · Service desk AI',
    valueFormula: 'deflection rate × ticket volume × cost/ticket avoided + Δ agent handle time × agent hourly cost',
    attributionNote: 'Ticket log deflection rate — objective measurement. HIGH confidence attribution. Underperformance is definitively caused by KB integration at 60% completeness.',
    promisedOutcomes: [
      { metric: 'Ticket deflection rate', target: '40% of 80K tickets/yr', basis: 'ServiceNow pre-sales benchmark' },
      { metric: 'Agent handle time reduction', target: '25% reduction', basis: 'ServiceNow pilot case study' },
      { metric: 'Annualized value', target: '$2.8M (breakeven)', basis: 'ServiceNow ROI model' },
    ],
    realizedOutcomes: [
      { metric: 'Ticket deflection rate', actual: '28% (vs 40% promised)', variance: '−30% vs target', onTrack: false },
      { metric: 'Agent handle time reduction', actual: '11%', variance: '−56% vs target', onTrack: false },
      { metric: 'Attributed annual value', actual: '$1.12M', variance: '−60% vs promised', onTrack: false },
    ],
    adoptionByDept: [
      { dept: 'IT Operations', eligible: 0, active: 0 },
      { dept: 'HR Self-Service', eligible: 0, active: 0 },
    ],
    behaviorChangeNote: 'No active user adoption data — Now Assist operates as an AI tier before tickets reach agents. Deflection rate is the primary metric. Root cause of underperformance: Knowledge Base at 60% coverage means 40% of queries fall through to human-handled tickets.',
    switchingCostLabel: 'High — deeply integrated with ServiceNow incident and change flows; migration estimated ~$600K + 6 months.',
    vendorPerformanceScore: 29,
    vendorNote: 'ServiceNow renewal in 112 days. Contract includes KB integration SLA — milestone missed by 18 months. Leverage: SLA breach + competitive alternatives (Freshservice AI, Zendesk AI). Recommended negotiation: KB completion commitment with penalty clause or 20% fee reduction.',
    renewalLabel: '112 days',
    nexusQuote: 'Now Assist is underperforming on every metric — 28% deflection vs 40% promised, $1.7M annual value shortfall, and high attribution confidence means this isn\'t measurement error. The root cause is identified: KB at 60%. Path A: complete KB in 90 days and re-evaluate at renewal. Path B: descope and renegotiate rate card now. Decision needed before 112-day renewal.',
    nexusContext: 'Nexus · Now Assist · $2.8M · −0.60x ROI · CRITICAL',
    nexusActions: [
      { letter: 'A', text: 'Complete KB integration to 90%', detail: '60% → 90% completion · projected to lift deflection to 36%' },
      { letter: 'B', text: 'Initiate renewal negotiation now', detail: '112 days · SLA breach documented · 20% reduction target' },
      { letter: 'C', text: 'Eliminate M365 duplication', detail: '$600K/yr FAQ overlap · define clean boundary before renewal' },
    ],
  },

  'twr-prog-sap-joule': {
    valueModelType: 'T-ERP · ERP agent',
    valueFormula: 'process cycle time reduction × volume × hourly cost + forecast accuracy lift × downstream impact',
    attributionNote: 'Cohort-match (integration depth = strong). Medium confidence — ERP processes have longer feedback loops; 6-month window is early for stable attribution.',
    promisedOutcomes: [
      { metric: 'Finance close cycle time', target: '−3 days/quarter', basis: 'SAP Joule reference customer data' },
      { metric: 'Procurement query resolution', target: '−40% time', basis: 'SAP pre-sales benchmark' },
      { metric: 'Annualized value', target: '$2.1M by Year 2', basis: 'SAP ROI projection (Year 1 ramp)' },
    ],
    realizedOutcomes: [
      { metric: 'Finance close cycle time', actual: '−1.2 days/quarter', variance: '−60% vs target (early stage)', onTrack: true },
      { metric: 'Procurement query resolution', actual: '−18% time', variance: '−55% vs target (early stage)', onTrack: true },
      { metric: 'Attributed annual value', actual: '$1.35M', variance: 'On Year 1 ramp trajectory', onTrack: true },
    ],
    adoptionByDept: [
      { dept: 'Finance', eligible: 0, active: 0 },
      { dept: 'Procurement', eligible: 0, active: 0 },
      { dept: 'Supply Chain', eligible: 0, active: 0 },
    ],
    behaviorChangeNote: 'SAP Joule operates as an embedded AI assistant within S/4HANA workflows — no discrete active-user count. Usage is measured via query volume and process KPIs. Adoption is considered full since users encounter Joule within their existing ERP workflows.',
    switchingCostLabel: 'Extreme — tied to SAP S/4HANA core. Switching cost estimated $4–8M including re-integration, re-training, and ERP migration risk. Not a near-term decision.',
    vendorPerformanceScore: 62,
    vendorNote: 'SAP renewal in 548 days — no near-term decision needed. Risk is lock-in depth: every month Joule is used, switching cost increases. Strategic question: ensure AI investment diversification so SAP does not become the single AI vendor for Finance.',
    renewalLabel: '548 days',
    nexusQuote: 'SAP Joule is on the Year 1 ramp trajectory — early metrics are directionally positive but attribution confidence is medium at 6 months. No urgent action needed. Monitor Finance close cycle time at the 12-month mark as the definitive value signal. Renewal is 548 days out.',
    nexusContext: 'Nexus · SAP Joule · $1.5M · −0.10x ROI · Rollout',
    nexusActions: [
      { letter: 'A', text: 'Set 12-month attribution checkpoint', detail: 'Finance close cycle time is the KPI · schedule review for Oct 2026' },
      { letter: 'B', text: 'Document S/4HANA switching cost', detail: 'Formalize estimate for strategic AI vendor diversity planning' },
      { letter: 'C', text: 'Extend Procurement query coverage', detail: '−18% vs −40% target · identify workflow gaps in Procurement module' },
    ],
  },

  'twr-prog-fow': {
    valueModelType: 'T-FOW · Future-of-work program',
    valueFormula: 'composite leading indicators: skills coverage × training completion × AI-task ratio × retention signal',
    attributionNote: 'Composite leading indicators — LOW confidence. Lagging indicators (retention lift, productivity shift) not readable for 6–9 months. Value number is an early estimate.',
    promisedOutcomes: [
      { metric: 'AI skills coverage', target: '60% of workforce trained', basis: 'CPO transformation roadmap' },
      { metric: 'AI-task ratio', target: '30% of daily tasks AI-assisted', basis: 'Future-of-work consulting baseline' },
      { metric: 'Annualized value (Year 2)', target: '$4–6M (retention + productivity)', basis: 'Consulting model projection' },
    ],
    realizedOutcomes: [
      { metric: 'AI skills coverage', actual: '38% (3,040 of 8,000)', variance: '−37% vs 60% target', onTrack: false },
      { metric: 'AI-task ratio', actual: 'Not yet measurable', variance: 'Instrumentation not deployed', onTrack: false },
      { metric: 'Leading indicator composite', actual: '$600K (estimated)', variance: 'Lagging indicators unavailable', onTrack: false },
    ],
    adoptionByDept: [
      { dept: 'Engineering', eligible: 1760, active: 669 },
      { dept: 'Operations', eligible: 2240, active: 851 },
      { dept: 'Finance', eligible: 1440, active: 547 },
      { dept: 'HR', eligible: 1280, active: 486 },
      { dept: 'Other', eligible: 1280, active: 487 },
    ],
    behaviorChangeNote: 'Training completion is the primary measurable signal. The gap between 38% and 60% target is concentrated in Operations and Engineering — both have high workload and competing change initiatives. Retention signal won\'t be visible until 2027 attrition data is available.',
    switchingCostLabel: 'Low — internal program; primary cost is change management effort and institutional knowledge embedded in training content.',
    vendorPerformanceScore: 48,
    vendorNote: 'Internal program managed by People function. Primary vendor relationship is the training platform (contract internal). No external renewal window — budget cycle governs.',
    renewalLabel: 'Internal / budget cycle',
    nexusQuote: 'AI Fluency Program is a 3-year strategic bet — early signals are mixed. 38% skills coverage against a 60% target, with lagging indicators (retention, productivity) not readable for 6–9 months. The risk is opportunity cost: $2M/year in change management while M365 Copilot generates negative ROI. Prioritize Operations and Engineering cohort completion to unlock the lagging indicators sooner.',
    nexusContext: 'Nexus · AI Fluency Program · $2.0M · Pilot · Leading indicators only',
    nexusActions: [
      { letter: 'A', text: 'Accelerate Operations cohort', detail: '38% → 60% target requires 1,760 additional completions · sprint plan needed' },
      { letter: 'B', text: 'Deploy AI-task ratio instrumentation', detail: 'Without it, Year 2 value case cannot be built · 6-week deployment' },
      { letter: 'C', text: 'Commission 12-month retention study', detail: 'Pre-register methodology now for 2027 attrition cohort analysis' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildAiProgramDetailView(programId: string): AiProgramDetailView | null {
  const program = getAiProgramById(programId);
  if (!program) return null;

  const seed = DETAIL_SEED[programId];
  if (!seed) return null;

  const allDecisions = buildAiProgramPortfolioDecisions();
  const linkedDecisions = allDecisions.filter((d) => d.programId === programId);

  return {
    program,
    ...seed,
    linkedDecisions,
  };
}

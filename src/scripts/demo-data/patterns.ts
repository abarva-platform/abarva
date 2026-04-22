// Industry × maturity profile matrix for the Tower demo-data generator.
// Each profile returns a use-case-set scaled to orgSize + AI maturity.

export type Industry = 'HEALTHCARE_IDN' | 'FINSERV' | 'RETAIL';
export type OrgSize = 'small' | 'mid' | 'enterprise';
export type AiMaturity = 'early' | 'scaling' | 'mature';

export interface UseCasePreset {
  name: string;
  description: string;
  business_unit: string;
  domain: string;
  stage: 'idea' | 'qualify' | 'design' | 'evidence' | 'review' | 'execute' | 'realize' | 'stalled';
  systems: string[];
  ai_type: 'GenAI' | 'ML' | 'Agent' | 'CV' | 'Predictive';
  scope: 'enterprise' | 'department' | 'single_workflow';
  vendor: string;
  usageTemplate?: { dau_per_eligible: number; penetration_pct: number; drop_off_pct: number };
  valueTemplate?: { metric: string; baseline: number; target: number; achieved_pct: number; unit: string; confidence: 'high' | 'medium' | 'proxy'; driver: string };
  riskLevel: 'high' | 'medium' | 'low';
  dataClasses: string[];
  costTemplate: { llm_fraction: number; compute_fraction: number; license_fraction: number; storage_fraction: number };
}

// ── Healthcare IDN · scaling (Meridian-style) ────────────────────────
const HEALTHCARE_SCALING: UseCasePreset[] = [
  { name: 'Ambient clinical documentation', description: 'Provider documentation capture.', business_unit: 'Clinical', domain: 'Clinical', stage: 'realize', systems: ['Abridge', 'Epic'], ai_type: 'GenAI', scope: 'enterprise', vendor: 'Abridge', usageTemplate: { dau_per_eligible: 0.74, penetration_pct: 74, drop_off_pct: 14 }, valueTemplate: { metric: 'doc time per encounter (min)', baseline: 14, target: 9, achieved_pct: 78, unit: 'minutes', confidence: 'high', driver: 'experience_improvement' }, riskLevel: 'high', dataClasses: ['PHI', 'clinical_notes'], costTemplate: { llm_fraction: 0.5, compute_fraction: 0.2, license_fraction: 0.2, storage_fraction: 0.05 } },
  { name: 'Prior authorization AI', description: 'Automate PA on high-volume specialties.', business_unit: 'Revenue Cycle', domain: 'Revenue Cycle', stage: 'realize', systems: ['Cohere Health', 'Epic'], ai_type: 'ML', scope: 'department', vendor: 'Cohere Health', usageTemplate: { dau_per_eligible: 0.88, penetration_pct: 88, drop_off_pct: 5 }, valueTemplate: { metric: 'PA turnaround (days)', baseline: 14, target: 2, achieved_pct: 85, unit: 'days', confidence: 'high', driver: 'revenue_lift' }, riskLevel: 'high', dataClasses: ['PHI'], costTemplate: { llm_fraction: 0.25, compute_fraction: 0.25, license_fraction: 0.4, storage_fraction: 0.05 } },
  { name: 'Radiology triage', description: 'Critical-finding prioritization.', business_unit: 'Clinical', domain: 'Imaging', stage: 'realize', systems: ['Aidoc'], ai_type: 'CV', scope: 'department', vendor: 'Aidoc', valueTemplate: { metric: 'time-to-critical-finding (hrs)', baseline: 6, target: 3, achieved_pct: 80, unit: 'hours', confidence: 'high', driver: 'experience_improvement' }, riskLevel: 'high', dataClasses: ['PHI'], costTemplate: { llm_fraction: 0, compute_fraction: 0.4, license_fraction: 0.4, storage_fraction: 0.15 } },
  { name: 'IT service desk copilot', description: 'Moveworks across the enterprise.', business_unit: 'IT', domain: 'IT Operations', stage: 'realize', systems: ['Moveworks'], ai_type: 'Agent', scope: 'enterprise', vendor: 'Moveworks', usageTemplate: { dau_per_eligible: 0.5, penetration_pct: 50, drop_off_pct: 18 }, valueTemplate: { metric: 'annual cost avoidance (USD)', baseline: 0, target: 3000000, achieved_pct: 75, unit: 'usd', confidence: 'medium', driver: 'cost_takeout' }, riskLevel: 'low', dataClasses: ['internal'], costTemplate: { llm_fraction: 0.2, compute_fraction: 0.15, license_fraction: 0.55, storage_fraction: 0.05 } },
  { name: 'Claims denial prediction', description: 'Internal Claude-based model predicts deniables pre-submit.', business_unit: 'Revenue Cycle', domain: 'Revenue Cycle', stage: 'execute', systems: ['Claude Enterprise', 'Epic'], ai_type: 'ML', scope: 'department', vendor: 'Claude Enterprise', valueTemplate: { metric: 'denials recovered (USD annual)', baseline: 0, target: 4000000, achieved_pct: 70, unit: 'usd', confidence: 'medium', driver: 'revenue_lift' }, riskLevel: 'medium', dataClasses: ['PHI', 'financial'], costTemplate: { llm_fraction: 0.4, compute_fraction: 0.3, license_fraction: 0.05, storage_fraction: 0.1 } },
  { name: 'Patient messaging triage', description: 'Hyro + Epic MyChart pilot.', business_unit: 'Clinical', domain: 'Patient Experience', stage: 'evidence', systems: ['Hyro', 'Epic'], ai_type: 'GenAI', scope: 'enterprise', vendor: 'Hyro', riskLevel: 'high', dataClasses: ['PHI', 'PII'], costTemplate: { llm_fraction: 0.35, compute_fraction: 0.25, license_fraction: 0.3, storage_fraction: 0.05 } },
  { name: 'Chart summarization', description: 'Liability review blocked full production.', business_unit: 'Clinical', domain: 'Clinical', stage: 'stalled', systems: ['Claude Enterprise'], ai_type: 'GenAI', scope: 'department', vendor: 'Claude Enterprise', riskLevel: 'high', dataClasses: ['PHI'], costTemplate: { llm_fraction: 0.6, compute_fraction: 0.2, license_fraction: 0, storage_fraction: 0.15 } },
  { name: 'Shadow · clinicians using consumer ChatGPT', description: 'PHI exposure risk.', business_unit: 'Clinical', domain: 'Shadow AI', stage: 'stalled', systems: ['OpenAI'], ai_type: 'GenAI', scope: 'single_workflow', vendor: 'OpenAI', riskLevel: 'high', dataClasses: ['PHI'], costTemplate: { llm_fraction: 1, compute_fraction: 0, license_fraction: 0, storage_fraction: 0 } },
];

// ── FinServ · early maturity ─────────────────────────────────────────
const FINSERV_EARLY: UseCasePreset[] = [
  { name: 'Advisor copilot pilot', description: 'Claude Enterprise for wealth advisors.', business_unit: 'Wealth Management', domain: 'Advisor Productivity', stage: 'evidence', systems: ['Claude Enterprise', 'Salesforce'], ai_type: 'GenAI', scope: 'department', vendor: 'Claude Enterprise', riskLevel: 'high', dataClasses: ['MNPI', 'PII'], costTemplate: { llm_fraction: 0.55, compute_fraction: 0.2, license_fraction: 0.15, storage_fraction: 0.05 } },
  { name: 'Alt-asset classifier', description: 'ML for alternative investment classification.', business_unit: 'Wealth Management', domain: 'Research', stage: 'evidence', systems: ['AlphaSense'], ai_type: 'ML', scope: 'department', vendor: 'AlphaSense', riskLevel: 'medium', dataClasses: ['financial'], costTemplate: { llm_fraction: 0.15, compute_fraction: 0.4, license_fraction: 0.4, storage_fraction: 0.05 } },
  { name: 'Fraud signal assistant', description: 'Feedzai pilot.', business_unit: 'Risk', domain: 'Fraud', stage: 'review', systems: ['Feedzai'], ai_type: 'ML', scope: 'enterprise', vendor: 'Feedzai', riskLevel: 'high', dataClasses: ['financial', 'PII'], costTemplate: { llm_fraction: 0, compute_fraction: 0.55, license_fraction: 0.4, storage_fraction: 0.05 } },
  { name: 'Customer service copilot', description: 'Cresta pilot on agents.', business_unit: 'Contact Center', domain: 'Customer Service', stage: 'evidence', systems: ['Cresta', 'Genesys'], ai_type: 'GenAI', scope: 'department', vendor: 'Cresta', usageTemplate: { dau_per_eligible: 0.6, penetration_pct: 60, drop_off_pct: 15 }, riskLevel: 'medium', dataClasses: ['PII', 'financial'], costTemplate: { llm_fraction: 0.4, compute_fraction: 0.25, license_fraction: 0.3, storage_fraction: 0.05 } },
  { name: 'Shadow · quant analysts on consumer Claude', description: 'MNPI exposure risk.', business_unit: 'Wealth Management', domain: 'Shadow AI', stage: 'stalled', systems: ['Anthropic'], ai_type: 'GenAI', scope: 'single_workflow', vendor: 'Anthropic', riskLevel: 'high', dataClasses: ['MNPI', 'financial'], costTemplate: { llm_fraction: 1, compute_fraction: 0, license_fraction: 0, storage_fraction: 0 } },
];

// ── Retail · mature ──────────────────────────────────────────────────
const RETAIL_MATURE: UseCasePreset[] = [
  { name: 'Site personalization', description: 'Bloomreach sitewide.', business_unit: 'Digital', domain: 'E-commerce', stage: 'realize', systems: ['Bloomreach'], ai_type: 'Predictive', scope: 'enterprise', vendor: 'Bloomreach', valueTemplate: { metric: 'conversion lift (pct)', baseline: 0, target: 12, achieved_pct: 90, unit: 'percent', confidence: 'high', driver: 'revenue_lift' }, riskLevel: 'medium', dataClasses: ['PII'], costTemplate: { llm_fraction: 0.15, compute_fraction: 0.25, license_fraction: 0.55, storage_fraction: 0.05 } },
  { name: 'Demand forecasting', description: 'o9 Solutions across merchandising.', business_unit: 'Supply Chain', domain: 'Planning', stage: 'realize', systems: ['o9 Solutions'], ai_type: 'Predictive', scope: 'enterprise', vendor: 'o9 Solutions', valueTemplate: { metric: 'forecast accuracy (pct)', baseline: 68, target: 75, achieved_pct: 75, unit: 'percent', confidence: 'high', driver: 'cost_takeout' }, riskLevel: 'low', dataClasses: ['internal'], costTemplate: { llm_fraction: 0, compute_fraction: 0.35, license_fraction: 0.6, storage_fraction: 0.05 } },
  { name: 'Fraud detection', description: 'Signifyd real-time on all transactions.', business_unit: 'Risk', domain: 'Fraud', stage: 'realize', systems: ['Signifyd'], ai_type: 'ML', scope: 'enterprise', vendor: 'Signifyd', valueTemplate: { metric: 'fraud loss reduction (pct)', baseline: 0, target: 30, achieved_pct: 95, unit: 'percent', confidence: 'high', driver: 'risk_reduction' }, riskLevel: 'high', dataClasses: ['PII', 'financial'], costTemplate: { llm_fraction: 0, compute_fraction: 0.4, license_fraction: 0.5, storage_fraction: 0.1 } },
  { name: 'Returns intelligence', description: 'Optoro across 80 stores.', business_unit: 'Operations', domain: 'Returns', stage: 'execute', systems: ['Optoro'], ai_type: 'Predictive', scope: 'department', vendor: 'Optoro', riskLevel: 'low', dataClasses: ['PII'], costTemplate: { llm_fraction: 0, compute_fraction: 0.25, license_fraction: 0.65, storage_fraction: 0.1 } },
  { name: 'Frontline Copilot', description: 'Microsoft Copilot Frontline for store associates.', business_unit: 'Retail Operations', domain: 'Frontline', stage: 'realize', systems: ['Microsoft Copilot'], ai_type: 'GenAI', scope: 'enterprise', vendor: 'Microsoft Copilot', usageTemplate: { dau_per_eligible: 0.32, penetration_pct: 32, drop_off_pct: 68 }, riskLevel: 'low', dataClasses: ['internal'], costTemplate: { llm_fraction: 0.35, compute_fraction: 0.2, license_fraction: 0.4, storage_fraction: 0.05 } },
];

export interface SizeProfile {
  seatMultiplier: number;
  costBaseUsd: number;
  useCaseCount: number;
}

const SIZE_PROFILES: Record<OrgSize, SizeProfile> = {
  small: { seatMultiplier: 800, costBaseUsd: 40000, useCaseCount: 5 },
  mid: { seatMultiplier: 5000, costBaseUsd: 120000, useCaseCount: 8 },
  enterprise: { seatMultiplier: 25000, costBaseUsd: 380000, useCaseCount: 12 },
};

export function sizeProfile(size: OrgSize): SizeProfile {
  return SIZE_PROFILES[size];
}

export function useCaseLibrary(industry: Industry, maturity: AiMaturity): UseCasePreset[] {
  if (industry === 'HEALTHCARE_IDN') return HEALTHCARE_SCALING;
  if (industry === 'FINSERV') return maturity === 'mature' ? FINSERV_EARLY : FINSERV_EARLY;
  if (industry === 'RETAIL') return RETAIL_MATURE;
  return HEALTHCARE_SCALING;
}

import { config as loadEnv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

interface UC {
  name: string;
  description: string;
  business_unit: string;
  domain: string;
  stage: 'idea' | 'qualify' | 'design' | 'evidence' | 'review' | 'execute' | 'realize' | 'stalled';
  systems: string[];
  ai_type: 'GenAI' | 'ML' | 'Agent' | 'CV' | 'Predictive';
  scope: 'enterprise' | 'department' | 'single_workflow';
  vendor: string;
  usage?: { dau?: number; wau?: number; penetration_pct?: number; drop_off_rate_pct?: number };
  value?: { metric: string; baseline: number; target: number; observed: number; unit: string; confidence: 'high' | 'medium' | 'proxy' | 'estimate'; driver: string };
  risk?: { data: string[]; risk_level: 'high' | 'medium' | 'low'; governance: 'approved' | 'conditional' | 'pending'; hitl: boolean; vendor_posture: string };
  cost?: { llm: number; compute: number; storage: number; license: number; integration: number; projected_6mo: number };
}

const HELIX_USE_CASES: UC[] = [
  // ── Research & Discovery (8) ──
  { name: 'AI-powered target identification (Recursion Phenom)', description: 'Partnership + platform access for discovery biology.', business_unit: 'Research', domain: 'Discovery', stage: 'realize', systems: ['Recursion'], ai_type: 'ML', scope: 'department', vendor: 'Recursion', usage: { dau: 180, wau: 240, penetration_pct: 100 }, risk: { data: ['internal'], risk_level: 'medium', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 0, compute: 280000, storage: 40000, license: 100000, integration: 0, projected_6mo: 2520000 } },
  { name: 'Small molecule design (Insitro)', description: 'Generative small molecule design with wet-lab integration.', business_unit: 'Research', domain: 'Discovery', stage: 'realize', systems: ['Insitro'], ai_type: 'ML', scope: 'department', vendor: 'Insitro', usage: { dau: 62, wau: 85, penetration_pct: 94 }, risk: { data: ['internal', 'IP'], risk_level: 'high', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 20000, compute: 160000, storage: 20000, license: 80000, integration: 0, projected_6mo: 1680000 } },
  { name: 'Protein structure prediction (AlphaFold)', description: 'DeepMind AlphaFold + OpenFold for computational structural biology.', business_unit: 'Research', domain: 'Discovery', stage: 'realize', systems: ['AlphaFold'], ai_type: 'ML', scope: 'department', vendor: 'AlphaFold', usage: { dau: 80, wau: 120, penetration_pct: 88 }, risk: { data: ['internal'], risk_level: 'low', governance: 'approved', hitl: false, vendor_posture: 'enterprise_tier' }, cost: { llm: 0, compute: 40000, storage: 8000, license: 14000, integration: 0, projected_6mo: 372000 } },
  { name: 'Compound screening (Atomwise)', description: 'Large-scale computational screening.', business_unit: 'Research', domain: 'Discovery', stage: 'realize', systems: ['Atomwise'], ai_type: 'ML', scope: 'department', vendor: 'Atomwise', risk: { data: ['internal'], risk_level: 'medium', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 0, compute: 80000, storage: 20000, license: 80000, integration: 0, projected_6mo: 1080000 } },
  { name: 'Literature surveillance (Nference + Claude Enterprise)', description: 'Real-time PubMed + conference monitoring across 1,400 research users.', business_unit: 'Research', domain: 'Research Intelligence', stage: 'realize', systems: ['Nference', 'Claude Enterprise'], ai_type: 'GenAI', scope: 'enterprise', vendor: 'Nference', usage: { dau: 320, wau: 1180, penetration_pct: 84 }, value: { metric: 'analyst hours saved per week', baseline: 0, target: 800, observed: 640, unit: 'hours', confidence: 'high', driver: 'capacity_creation' }, risk: { data: ['public'], risk_level: 'low', governance: 'approved', hitl: false, vendor_posture: 'enterprise_tier' }, cost: { llm: 60000, compute: 20000, storage: 8000, license: 60000, integration: 0, projected_6mo: 888000 } },
  { name: 'Antibody engineering (Absci)', description: 'Generative antibody design pilot expanding from 2 to 8 programs.', business_unit: 'Research', domain: 'Biologics', stage: 'execute', systems: ['Absci'], ai_type: 'ML', scope: 'department', vendor: 'Absci', risk: { data: ['IP'], risk_level: 'high', governance: 'conditional', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 0, compute: 120000, storage: 20000, license: 80000, integration: 0, projected_6mo: 1320000 } },
  { name: 'Genomics / single-cell analysis (Tempus Next)', description: 'Translational science — shared platform with Meridian research centers.', business_unit: 'Research', domain: 'Translational', stage: 'realize', systems: ['Tempus Next', 'Komodo Health'], ai_type: 'ML', scope: 'department', vendor: 'Tempus Next', risk: { data: ['PHI', 'genomic'], risk_level: 'high', governance: 'approved', hitl: true, vendor_posture: 'hipaa_baa' }, cost: { llm: 0, compute: 80000, storage: 40000, license: 60000, integration: 0, projected_6mo: 1080000 } },
  { name: 'Competitive intelligence (Ontosight)', description: 'Strategic intel on competitor pipelines.', business_unit: 'Strategy', domain: 'Competitive Intelligence', stage: 'realize', systems: ['Ontosight'], ai_type: 'GenAI', scope: 'department', vendor: 'Ontosight', risk: { data: ['public'], risk_level: 'low', governance: 'approved', hitl: false, vendor_posture: 'enterprise_tier' }, cost: { llm: 12000, compute: 4000, storage: 2000, license: 20000, integration: 0, projected_6mo: 228000 } },

  // ── Clinical Operations (6) ──
  { name: 'Clinical trial patient recruitment (Deep 6 AI)', description: '180 of 340 trials covered, scaling to 280.', business_unit: 'Clinical Operations', domain: 'Trial Recruitment', stage: 'realize', systems: ['Deep 6 AI'], ai_type: 'ML', scope: 'enterprise', vendor: 'Deep 6 AI', value: { metric: 'time-to-first-patient (days)', baseline: 180, target: 90, observed: 110, unit: 'days', confidence: 'high', driver: 'capacity_creation' }, risk: { data: ['PHI'], risk_level: 'high', governance: 'approved', hitl: true, vendor_posture: 'hipaa_baa' }, cost: { llm: 0, compute: 120000, storage: 40000, license: 180000, integration: 0, projected_6mo: 2040000 } },
  { name: 'Site selection & feasibility (Saama)', description: 'All new trial startups.', business_unit: 'Clinical Operations', domain: 'Trial Ops', stage: 'realize', systems: ['Saama'], ai_type: 'ML', scope: 'enterprise', vendor: 'Saama', risk: { data: ['internal'], risk_level: 'medium', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 0, compute: 60000, storage: 20000, license: 100000, integration: 0, projected_6mo: 1080000 } },
  { name: 'EDC / trial data capture (Medidata Rave + Medable)', description: 'All 340 trials.', business_unit: 'Clinical Operations', domain: 'Trial Ops', stage: 'realize', systems: ['Medidata Rave', 'Medable'], ai_type: 'Predictive', scope: 'enterprise', vendor: 'Medidata Rave', risk: { data: ['PHI'], risk_level: 'high', governance: 'approved', hitl: true, vendor_posture: 'hipaa_baa' }, cost: { llm: 0, compute: 140000, storage: 80000, license: 500000, integration: 0, projected_6mo: 4320000 } },
  { name: 'Protocol design assistant (Trialscope + Claude Enterprise)', description: 'Pilot on Phase 1/2 designs.', business_unit: 'Clinical Operations', domain: 'Protocol Design', stage: 'evidence', systems: ['Trialscope', 'Claude Enterprise'], ai_type: 'GenAI', scope: 'department', vendor: 'Trialscope', risk: { data: ['internal'], risk_level: 'medium', governance: 'conditional', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 16000, compute: 6000, storage: 2000, license: 38000, integration: 0, projected_6mo: 372000 } },
  { name: 'eSource / remote monitoring (Signant + Veeva CDMS)', description: '260 active trials.', business_unit: 'Clinical Operations', domain: 'Trial Monitoring', stage: 'realize', systems: ['Signant Health', 'Veeva Vault'], ai_type: 'Predictive', scope: 'enterprise', vendor: 'Signant Health', risk: { data: ['PHI'], risk_level: 'high', governance: 'approved', hitl: true, vendor_posture: 'hipaa_baa' }, cost: { llm: 0, compute: 80000, storage: 40000, license: 300000, integration: 0, projected_6mo: 2520000 } },
  { name: 'Real-world evidence generation (Aetion + Komodo + Flatiron)', description: '8 of 14 approved drugs monitored — three vendors, consolidation in flight.', business_unit: 'Research', domain: 'RWE', stage: 'realize', systems: ['Aetion', 'Komodo Health', 'Flatiron'], ai_type: 'Predictive', scope: 'enterprise', vendor: 'Aetion', risk: { data: ['PHI', 'claims'], risk_level: 'high', governance: 'approved', hitl: true, vendor_posture: 'hipaa_baa' }, cost: { llm: 0, compute: 160000, storage: 100000, license: 420000, integration: 0, projected_6mo: 4080000 } },

  // ── Regulatory & Safety (4) ──
  { name: 'Pharmacovigilance automation (Pharmora + Quinten)', description: 'Case processing + signal detection.', business_unit: 'Safety', domain: 'Pharmacovigilance', stage: 'realize', systems: ['Pharmora', 'Quinten Health'], ai_type: 'ML', scope: 'enterprise', vendor: 'Pharmora', risk: { data: ['PHI', 'adverse_event'], risk_level: 'high', governance: 'approved', hitl: true, vendor_posture: 'validated_gcp' }, cost: { llm: 0, compute: 80000, storage: 40000, license: 120000, integration: 0, projected_6mo: 1440000 } },
  { name: 'Adverse event case processing (internal Claude Enterprise)', description: 'Internal build on Claude Enterprise.', business_unit: 'Safety', domain: 'Adverse Events', stage: 'realize', systems: ['Claude Enterprise'], ai_type: 'GenAI', scope: 'department', vendor: 'Claude Enterprise', value: { metric: 'AE case throughput per day', baseline: 80, target: 180, observed: 145, unit: 'cases', confidence: 'high', driver: 'capacity_creation' }, risk: { data: ['PHI', 'adverse_event'], risk_level: 'high', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 60000, compute: 20000, storage: 8000, license: 20000, integration: 72000, projected_6mo: 1080000 } },
  { name: 'Regulatory submission assembly (Veeva Vault RIM + Claude)', description: 'Scaling pilot for submission authoring.', business_unit: 'Regulatory', domain: 'Submissions', stage: 'execute', systems: ['Veeva Vault', 'Claude Enterprise'], ai_type: 'GenAI', scope: 'department', vendor: 'Veeva Vault', risk: { data: ['internal'], risk_level: 'medium', governance: 'conditional', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 30000, compute: 10000, storage: 4000, license: 60000, integration: 16000, projected_6mo: 720000 } },
  { name: 'Medical writing copilot (Yseop + Claude)', description: 'Pilot for medical writing.', business_unit: 'Medical Affairs', domain: 'Medical Writing', stage: 'evidence', systems: ['Yseop', 'Claude Enterprise'], ai_type: 'GenAI', scope: 'department', vendor: 'Yseop', risk: { data: ['internal'], risk_level: 'medium', governance: 'conditional', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 12000, compute: 4000, storage: 2000, license: 20000, integration: 10000, projected_6mo: 288000 } },

  // ── Commercial & Field (6) ──
  { name: 'Field sales next-best-action (Veeva + Aktana)', description: '1,400 reps on Aktana NBA.', business_unit: 'Commercial', domain: 'Sales Execution', stage: 'realize', systems: ['Salesforce', 'Aktana'], ai_type: 'ML', scope: 'enterprise', vendor: 'Aktana', usage: { dau: 820, wau: 1220, penetration_pct: 87, drop_off_rate_pct: 13 }, value: { metric: 'rep productivity (calls/day)', baseline: 6.8, target: 9, observed: 7.9, unit: 'calls', confidence: 'medium', driver: 'capacity_creation' }, risk: { data: ['PII'], risk_level: 'medium', governance: 'approved', hitl: false, vendor_posture: 'enterprise_tier' }, cost: { llm: 20000, compute: 60000, storage: 20000, license: 180000, integration: 0, projected_6mo: 1680000 } },
  { name: 'HCP segmentation & targeting (Trinity Life Sciences)', description: 'Commercial ops.', business_unit: 'Commercial', domain: 'HCP Strategy', stage: 'realize', systems: ['Trinity Life Sciences'], ai_type: 'Predictive', scope: 'department', vendor: 'Trinity Life Sciences', risk: { data: ['PII'], risk_level: 'medium', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 0, compute: 40000, storage: 20000, license: 80000, integration: 0, projected_6mo: 840000 } },
  { name: 'Content personalization (Veeva PromoMats)', description: 'Brand teams.', business_unit: 'Marketing', domain: 'Content', stage: 'realize', systems: ['Veeva Vault'], ai_type: 'GenAI', scope: 'department', vendor: 'Veeva Vault', risk: { data: ['internal'], risk_level: 'medium', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 30000, compute: 20000, storage: 10000, license: 120000, integration: 0, projected_6mo: 1080000 } },
  { name: 'Market access analytics (IQVIA)', description: 'Access team.', business_unit: 'Market Access', domain: 'Analytics', stage: 'realize', systems: ['IQVIA'], ai_type: 'Predictive', scope: 'department', vendor: 'IQVIA', risk: { data: ['claims'], risk_level: 'medium', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 0, compute: 60000, storage: 30000, license: 230000, integration: 0, projected_6mo: 1920000 } },
  { name: 'Patient support program AI (TrialCard + Claude)', description: '12 of 14 approved drugs.', business_unit: 'Commercial', domain: 'Patient Services', stage: 'execute', systems: ['TrialCard', 'Claude Enterprise'], ai_type: 'GenAI', scope: 'enterprise', vendor: 'TrialCard', risk: { data: ['PHI', 'PII'], risk_level: 'high', governance: 'approved', hitl: true, vendor_posture: 'hipaa_baa' }, cost: { llm: 30000, compute: 10000, storage: 6000, license: 80000, integration: 14000, projected_6mo: 840000 } },
  { name: 'Speaker program optimization (Doximity)', description: 'Medical affairs pilot.', business_unit: 'Medical Affairs', domain: 'Speaker Programs', stage: 'evidence', systems: ['Doximity'], ai_type: 'Predictive', scope: 'department', vendor: 'Doximity', risk: { data: ['PII'], risk_level: 'low', governance: 'conditional', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 0, compute: 8000, storage: 4000, license: 26000, integration: 0, projected_6mo: 228000 } },

  // ── Medical Affairs (4) ──
  { name: 'MSL insights management (Within3 + Claude)', description: '340 MSLs.', business_unit: 'Medical Affairs', domain: 'MSL', stage: 'realize', systems: ['Within3', 'Claude Enterprise'], ai_type: 'GenAI', scope: 'department', vendor: 'Within3', risk: { data: ['internal'], risk_level: 'medium', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 16000, compute: 6000, storage: 4000, license: 94000, integration: 0, projected_6mo: 720000 } },
  { name: 'KOL identification (Within3 + Doximity)', description: 'Medical affairs KOL mapping.', business_unit: 'Medical Affairs', domain: 'KOL', stage: 'realize', systems: ['Within3', 'Doximity'], ai_type: 'Predictive', scope: 'department', vendor: 'Within3', risk: { data: ['public'], risk_level: 'low', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 0, compute: 12000, storage: 4000, license: 48000, integration: 0, projected_6mo: 384000 } },
  { name: 'Medical information response (Pharmora + Claude)', description: 'Call center 60 staff.', business_unit: 'Medical Affairs', domain: 'Medical Info', stage: 'realize', systems: ['Pharmora', 'Claude Enterprise'], ai_type: 'GenAI', scope: 'department', vendor: 'Pharmora', risk: { data: ['PHI'], risk_level: 'medium', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 12000, compute: 4000, storage: 2000, license: 30000, integration: 0, projected_6mo: 288000 } },
  { name: 'Publication planning (internal Claude Enterprise)', description: 'Med comms pilot.', business_unit: 'Medical Affairs', domain: 'Publications', stage: 'evidence', systems: ['Claude Enterprise'], ai_type: 'GenAI', scope: 'department', vendor: 'Claude Enterprise', risk: { data: ['internal'], risk_level: 'low', governance: 'conditional', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 8000, compute: 4000, storage: 2000, license: 0, integration: 8000, projected_6mo: 132000 } },

  // ── Manufacturing & Supply (4) ──
  { name: 'Process optimization (Rockwell FactoryTalk)', description: '6 manufacturing sites.', business_unit: 'Manufacturing', domain: 'Process Ops', stage: 'realize', systems: ['Rockwell FactoryTalk'], ai_type: 'Predictive', scope: 'enterprise', vendor: 'Rockwell FactoryTalk', risk: { data: ['internal'], risk_level: 'medium', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 0, compute: 100000, storage: 40000, license: 40000, integration: 0, projected_6mo: 1080000 } },
  { name: 'Quality analytics (Veeva QualityOne + Dassault)', description: '6 sites.', business_unit: 'Manufacturing', domain: 'Quality', stage: 'realize', systems: ['Veeva Vault', 'Dassault'], ai_type: 'Predictive', scope: 'enterprise', vendor: 'Veeva Vault', risk: { data: ['internal'], risk_level: 'medium', governance: 'approved', hitl: true, vendor_posture: 'validated_gxp' }, cost: { llm: 0, compute: 60000, storage: 40000, license: 40000, integration: 0, projected_6mo: 840000 } },
  { name: 'Supply chain demand (o9 Solutions)', description: 'Global.', business_unit: 'Supply Chain', domain: 'Planning', stage: 'realize', systems: ['o9 Solutions'], ai_type: 'Predictive', scope: 'enterprise', vendor: 'o9 Solutions', risk: { data: ['internal'], risk_level: 'low', governance: 'approved', hitl: false, vendor_posture: 'enterprise_tier' }, cost: { llm: 0, compute: 80000, storage: 40000, license: 100000, integration: 0, projected_6mo: 1320000 } },
  { name: 'Serialization & anti-counterfeit (TraceLink AI)', description: 'Global anti-counterfeit.', business_unit: 'Supply Chain', domain: 'Serialization', stage: 'realize', systems: ['TraceLink AI'], ai_type: 'ML', scope: 'enterprise', vendor: 'TraceLink AI', risk: { data: ['internal'], risk_level: 'low', governance: 'approved', hitl: false, vendor_posture: 'enterprise_tier' }, cost: { llm: 0, compute: 40000, storage: 40000, license: 100000, integration: 0, projected_6mo: 1080000 } },

  // ── Corporate (6) ──
  { name: 'M365 Copilot', description: '14,200 seats.', business_unit: 'Enterprise IT', domain: 'Productivity', stage: 'realize', systems: ['Microsoft Copilot'], ai_type: 'GenAI', scope: 'enterprise', vendor: 'Microsoft Copilot', usage: { dau: 7100, wau: 10200, penetration_pct: 72 }, risk: { data: ['internal'], risk_level: 'medium', governance: 'approved', hitl: false, vendor_posture: 'enterprise_tier' }, cost: { llm: 140000, compute: 60000, storage: 20000, license: 206000, integration: 0, projected_6mo: 2556000 } },
  { name: 'Engineering copilot (GitHub Copilot)', description: '680 engineers.', business_unit: 'Engineering', domain: 'Developer Productivity', stage: 'realize', systems: ['GitHub Copilot'], ai_type: 'GenAI', scope: 'department', vendor: 'GitHub Copilot', usage: { dau: 440, wau: 530, penetration_pct: 78 }, risk: { data: ['internal'], risk_level: 'low', governance: 'approved', hitl: false, vendor_posture: 'enterprise_tier' }, cost: { llm: 0, compute: 0, storage: 0, license: 22000, integration: 0, projected_6mo: 132000 } },
  { name: 'IT service desk (Moveworks)', description: '18K employees.', business_unit: 'IT', domain: 'IT Operations', stage: 'realize', systems: ['Moveworks'], ai_type: 'Agent', scope: 'enterprise', vendor: 'Moveworks', value: { metric: 'annual cost avoidance (USD)', baseline: 0, target: 4000000, observed: 3200000, unit: 'usd', confidence: 'medium', driver: 'cost_takeout' }, risk: { data: ['internal'], risk_level: 'low', governance: 'approved', hitl: false, vendor_posture: 'enterprise_tier' }, cost: { llm: 20000, compute: 10000, storage: 2000, license: 52000, integration: 0, projected_6mo: 504000 } },
  { name: 'Legal copilot (Harvey AI)', description: '140 legal staff.', business_unit: 'Legal', domain: 'Legal', stage: 'realize', systems: ['Harvey'], ai_type: 'GenAI', scope: 'department', vendor: 'Harvey', risk: { data: ['internal'], risk_level: 'medium', governance: 'approved', hitl: true, vendor_posture: 'enterprise_tier' }, cost: { llm: 24000, compute: 10000, storage: 4000, license: 60000, integration: 0, projected_6mo: 588000 } },
  { name: 'Enterprise search (Glean)', description: '12K seats.', business_unit: 'Enterprise IT', domain: 'Knowledge', stage: 'realize', systems: ['Glean'], ai_type: 'GenAI', scope: 'enterprise', vendor: 'Glean', risk: { data: ['internal'], risk_level: 'low', governance: 'approved', hitl: false, vendor_posture: 'enterprise_tier' }, cost: { llm: 14000, compute: 8000, storage: 14000, license: 36000, integration: 0, projected_6mo: 432000 } },
  { name: 'Internal knowledge platform (Notion AI + Claude)', description: 'Research 4.2K seats.', business_unit: 'Research', domain: 'Knowledge', stage: 'realize', systems: ['Notion AI', 'Claude Enterprise'], ai_type: 'GenAI', scope: 'department', vendor: 'Notion AI', risk: { data: ['internal', 'IP'], risk_level: 'medium', governance: 'conditional', hitl: false, vendor_posture: 'enterprise_tier' }, cost: { llm: 20000, compute: 8000, storage: 8000, license: 56000, integration: 0, projected_6mo: 552000 } },

  // ── Shadow AI (5) — stalled, shadow flag via stage + risk ──
  { name: 'Shadow · MSLs using consumer ChatGPT', description: 'MSL output quality concerns.', business_unit: 'Medical Affairs', domain: 'Shadow AI', stage: 'stalled', systems: ['OpenAI'], ai_type: 'GenAI', scope: 'single_workflow', vendor: 'OpenAI', risk: { data: ['internal'], risk_level: 'medium', governance: 'pending', hitl: false, vendor_posture: 'consumer' } },
  { name: 'Shadow · Computational chemists running local Llama 3', description: 'Local molecule generation on personal GPUs — IP contamination flag.', business_unit: 'Research', domain: 'Shadow AI', stage: 'stalled', systems: ['Meta'], ai_type: 'GenAI', scope: 'single_workflow', vendor: 'Meta', risk: { data: ['IP'], risk_level: 'medium', governance: 'pending', hitl: false, vendor_posture: 'unsanctioned' } },
  { name: 'Shadow · Commercial Jasper for email copy', description: 'Brand compliance concerns.', business_unit: 'Marketing', domain: 'Shadow AI', stage: 'stalled', systems: ['Jasper'], ai_type: 'GenAI', scope: 'single_workflow', vendor: 'Jasper', risk: { data: ['public'], risk_level: 'low', governance: 'pending', hitl: false, vendor_posture: 'consumer' } },
  { name: 'Shadow · Clinical ops on consumer Claude.ai', description: 'HIGH — interim trial data exposure, GCP/ICH risk.', business_unit: 'Clinical Operations', domain: 'Shadow AI', stage: 'stalled', systems: ['Anthropic'], ai_type: 'GenAI', scope: 'single_workflow', vendor: 'Anthropic', risk: { data: ['PHI', 'trial'], risk_level: 'high', governance: 'pending', hitl: false, vendor_posture: 'consumer' } },
  { name: 'Shadow · Regulatory on unsanctioned Harvey trial', description: 'Eventually sanctioned — remediation in flight.', business_unit: 'Regulatory', domain: 'Shadow AI', stage: 'stalled', systems: ['Harvey'], ai_type: 'GenAI', scope: 'single_workflow', vendor: 'Harvey', risk: { data: ['internal'], risk_level: 'medium', governance: 'pending', hitl: true, vendor_posture: 'unsanctioned' } },
];

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: helix } = await sb.from('clients').select('id').eq('name', 'Helix Therapeutics').maybeSingle();
  if (!helix) throw new Error('Helix client not found — run insert-helix-client.ts first');
  const clientId = (helix as { id: string }).id;
  console.log(`▸ Helix ${clientId} · ${HELIX_USE_CASES.length} use cases`);

  // Wipe prior seed rows
  const { data: ucs } = await sb.from('use_cases').select('id').eq('client_id', clientId).eq('source', 'seed');
  const ids = ((ucs as Array<{ id: string }> | null) ?? []).map((r) => r.id);
  if (ids.length > 0) {
    await sb.from('use_case_risk').delete().in('use_case_id', ids);
    await sb.from('use_case_usage_metrics').delete().in('use_case_id', ids);
    await sb.from('use_case_value_metrics').delete().in('use_case_id', ids);
    await sb.from('use_case_cost_metrics').delete().in('use_case_id', ids);
    await sb.from('use_cases').delete().in('id', ids);
  }

  const today = new Date();
  const periodEnd = today.toISOString().slice(0, 10);
  const pStart = new Date(today);
  pStart.setMonth(pStart.getMonth() - 1);
  const periodStart = pStart.toISOString().slice(0, 10);

  let inserted = 0;
  for (const uc of HELIX_USE_CASES) {
    const { data: row, error } = await sb
      .from('use_cases')
      .insert({
        client_id: clientId,
        name: uc.name,
        description: uc.description,
        business_unit: uc.business_unit,
        domain: uc.domain,
        stage: uc.stage,
        systems: uc.systems,
        ai_type: uc.ai_type,
        scope: uc.scope,
        vendor: uc.vendor,
        source: 'seed',
      })
      .select('id')
      .single();
    if (error || !row) { console.error(`  ✗ ${uc.name}: ${error?.message}`); continue; }
    const ucId = (row as { id: string }).id;

    if (uc.usage) {
      await sb.from('use_case_usage_metrics').insert({
        use_case_id: ucId, period_start: periodStart, period_end: periodEnd,
        dau: uc.usage.dau ?? null, wau: uc.usage.wau ?? null,
        penetration_pct: uc.usage.penetration_pct ?? null,
        drop_off_rate_pct: uc.usage.drop_off_rate_pct ?? null,
        source: 'seed',
      });
    }
    if (uc.value) {
      await sb.from('use_case_value_metrics').insert({
        use_case_id: ucId, period_start: periodStart, period_end: periodEnd,
        value_driver: uc.value.driver, metric_name: uc.value.metric,
        baseline: uc.value.baseline, target: uc.value.target, observed: uc.value.observed,
        unit: uc.value.unit, confidence: uc.value.confidence, source: 'seed',
      });
    }
    if (uc.risk) {
      await sb.from('use_case_risk').insert({
        use_case_id: ucId, data_classification: uc.risk.data,
        model_risk_level: uc.risk.risk_level, governance_approval_status: uc.risk.governance,
        human_in_the_loop: uc.risk.hitl, vendor_data_posture: uc.risk.vendor_posture,
        bias_incidents_count: 0, source: 'seed',
      });
    }
    if (uc.cost) {
      await sb.from('use_case_cost_metrics').insert({
        use_case_id: ucId, period_start: periodStart, period_end: periodEnd,
        llm_spend_usd: uc.cost.llm, compute_spend_usd: uc.cost.compute,
        storage_spend_usd: uc.cost.storage, vendor_license_spend_usd: uc.cost.license,
        integration_spend_usd: uc.cost.integration, projected_6mo_spend_usd: uc.cost.projected_6mo,
        projected_12mo_spend_usd: uc.cost.projected_6mo * 2,
        trajectory_confidence: 'medium', source: 'seed',
      });
    }
    inserted += 1;
  }
  console.log(`  ✓ ${inserted}/${HELIX_USE_CASES.length} use cases inserted`);
}

main().catch((e) => { console.error(e); process.exit(1); });

export type Industry = 'HEALTHCARE_IDN' | 'FINSERV' | 'RETAIL';

export interface TechStackItemSeed {
  category:
    | 'hardware'
    | 'infrastructure'
    | 'platform'
    | 'business_app'
    | 'data_platform'
    | 'security'
    | 'collaboration'
    | 'dev_tools'
    | 'ai_platform'
    | 'ai_model'
    | 'service'
    | 'staff_aug';
  vendor_name: string;
  product_name?: string;
  deployment_model: 'on_prem' | 'saas' | 'hybrid' | 'cloud_managed' | 'service_contract';
  annual_spend_usd: number;
  seat_count?: number;
  owning_function?: string;
  touches_ai?: boolean;
}

// OV2-1d-archetype · optional patternId on the seed so the broker can
// surface the canonical archetype for programs whose intent maps to a
// pattern in program-lifecycle-patterns.ts (e.g. M365 Copilot rollout).
export interface ProjectSeed {
  name: string;
  description: string;
  program_domain: string;
  status: 'ideation' | 'approved' | 'in_flight' | 'stabilizing' | 'completed' | 'paused' | 'cancelled';
  total_budget_usd: number;
  spent_to_date_usd: number;
  exec_sponsor: string;
  touches_ai?: boolean;
  pattern_id?: string;
}

export interface StaffAugSeed {
  vendor_name: string;
  engagement_type: 'staff_aug' | 'managed_service' | 'fixed_bid' | 'retainer';
  function_area: string;
  headcount_fte: number;
  annual_spend_usd: number;
  touches_ai?: boolean;
}

export interface VolumetricsProfile {
  apiCallsDailyMillions: number;
  tokensDailyBillions: number;
  storageTb: number;
  queriesDailyMillions: number;
  activeModels: number;
  dataPipelines: number;
}

// ── MERIDIAN · healthcare IDN (36 tech items, 18 projects, 10 staff aug) ────
const MERIDIAN_TECH_STACK: TechStackItemSeed[] = [
  { category: 'hardware', vendor_name: 'Lenovo', product_name: 'ThinkSystem SR650', deployment_model: 'on_prem', annual_spend_usd: 3_200_000, owning_function: 'Infrastructure' },
  { category: 'hardware', vendor_name: 'Cisco', product_name: 'Catalyst + UCS', deployment_model: 'on_prem', annual_spend_usd: 4_600_000, owning_function: 'Network' },
  { category: 'hardware', vendor_name: 'Pure Storage', product_name: 'FlashArray', deployment_model: 'on_prem', annual_spend_usd: 2_800_000, owning_function: 'Storage' },
  { category: 'hardware', vendor_name: 'NetApp', product_name: 'AFF A-Series', deployment_model: 'on_prem', annual_spend_usd: 1_900_000, owning_function: 'Storage' },
  { category: 'infrastructure', vendor_name: 'AWS', product_name: 'primary cloud', deployment_model: 'cloud_managed', annual_spend_usd: 22_800_000, owning_function: 'Platform', touches_ai: true },
  { category: 'infrastructure', vendor_name: 'Azure', product_name: 'secondary + Azure OpenAI', deployment_model: 'cloud_managed', annual_spend_usd: 8_400_000, owning_function: 'Platform', touches_ai: true },
  { category: 'infrastructure', vendor_name: 'VMware', product_name: 'vSphere', deployment_model: 'on_prem', annual_spend_usd: 3_400_000, owning_function: 'Platform' },
  { category: 'platform', vendor_name: 'Snowflake', product_name: 'data warehouse', deployment_model: 'saas', annual_spend_usd: 7_800_000, owning_function: 'Data', touches_ai: true },
  { category: 'platform', vendor_name: 'Databricks', product_name: 'lakehouse + MLflow', deployment_model: 'saas', annual_spend_usd: 4_200_000, owning_function: 'Data', touches_ai: true },
  { category: 'platform', vendor_name: 'Informatica', product_name: 'IDMC', deployment_model: 'saas', annual_spend_usd: 2_100_000, owning_function: 'Data' },
  { category: 'business_app', vendor_name: 'Epic', product_name: 'EHR enterprise', deployment_model: 'hybrid', annual_spend_usd: 68_000_000, seat_count: 28_400, owning_function: 'Clinical', touches_ai: true },
  { category: 'business_app', vendor_name: 'Oracle', product_name: 'ERP Cloud', deployment_model: 'saas', annual_spend_usd: 14_200_000, owning_function: 'Finance' },
  { category: 'business_app', vendor_name: 'Workday', product_name: 'HCM', deployment_model: 'saas', annual_spend_usd: 8_400_000, seat_count: 28_400, owning_function: 'HR' },
  { category: 'business_app', vendor_name: 'Kronos', product_name: 'workforce management', deployment_model: 'saas', annual_spend_usd: 3_200_000, seat_count: 22_000, owning_function: 'HR' },
  { category: 'security', vendor_name: 'CrowdStrike', product_name: 'Falcon XDR', deployment_model: 'saas', annual_spend_usd: 4_100_000, owning_function: 'Security' },
  { category: 'security', vendor_name: 'Palo Alto Networks', product_name: 'Prisma + NGFW', deployment_model: 'hybrid', annual_spend_usd: 5_800_000, owning_function: 'Security' },
  { category: 'security', vendor_name: 'Okta', product_name: 'Workforce Identity', deployment_model: 'saas', annual_spend_usd: 2_800_000, seat_count: 28_400, owning_function: 'Security' },
  { category: 'security', vendor_name: 'Zscaler', product_name: 'ZIA + ZPA', deployment_model: 'saas', annual_spend_usd: 3_400_000, owning_function: 'Security' },
  { category: 'collaboration', vendor_name: 'Microsoft', product_name: 'M365 E5', deployment_model: 'saas', annual_spend_usd: 16_800_000, seat_count: 28_400, owning_function: 'Enterprise IT', touches_ai: true },
  { category: 'collaboration', vendor_name: 'ServiceNow', product_name: 'ITSM + HRSD', deployment_model: 'saas', annual_spend_usd: 4_800_000, owning_function: 'Enterprise IT' },
  { category: 'collaboration', vendor_name: 'Zoom', product_name: 'enterprise', deployment_model: 'saas', annual_spend_usd: 1_800_000, seat_count: 28_400, owning_function: 'Enterprise IT' },
  { category: 'dev_tools', vendor_name: 'GitHub', product_name: 'Enterprise + Advanced Security', deployment_model: 'saas', annual_spend_usd: 1_200_000, seat_count: 340, owning_function: 'Engineering' },
  { category: 'dev_tools', vendor_name: 'GitHub Copilot', product_name: 'Enterprise', deployment_model: 'saas', annual_spend_usd: 144_000, seat_count: 340, owning_function: 'Engineering', touches_ai: true },
  { category: 'dev_tools', vendor_name: 'Atlassian', product_name: 'Jira + Confluence', deployment_model: 'saas', annual_spend_usd: 1_400_000, owning_function: 'Engineering' },
  { category: 'ai_platform', vendor_name: 'Abridge', product_name: 'clinical documentation (East + Central)', deployment_model: 'saas', annual_spend_usd: 4_080_000, seat_count: 1_240, owning_function: 'Clinical', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Nuance DAX', product_name: 'clinical documentation (West)', deployment_model: 'saas', annual_spend_usd: 1_656_000, seat_count: 420, owning_function: 'Clinical', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Cohere Health', product_name: 'prior auth', deployment_model: 'saas', annual_spend_usd: 504_000, owning_function: 'Revenue Cycle', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Aidoc', product_name: 'radiology prioritization', deployment_model: 'saas', annual_spend_usd: 1_056_000, owning_function: 'Imaging', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Paige.AI', product_name: 'pathology', deployment_model: 'saas', annual_spend_usd: 648_000, owning_function: 'Imaging', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Moveworks', product_name: 'IT service desk', deployment_model: 'saas', annual_spend_usd: 768_000, seat_count: 28_400, owning_function: 'IT', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Glean', product_name: 'enterprise search', deployment_model: 'saas', annual_spend_usd: 456_000, seat_count: 6_800, owning_function: 'Enterprise IT', touches_ai: true },
  { category: 'ai_model', vendor_name: 'Anthropic', product_name: 'Claude Enterprise', deployment_model: 'saas', annual_spend_usd: 840_000, owning_function: 'Platform', touches_ai: true },
  { category: 'ai_model', vendor_name: 'Microsoft', product_name: 'Azure OpenAI', deployment_model: 'cloud_managed', annual_spend_usd: 2_400_000, owning_function: 'Platform', touches_ai: true },
  { category: 'service', vendor_name: 'National cloud SI (composite)', product_name: 'managed AWS', deployment_model: 'service_contract', annual_spend_usd: 5_400_000, owning_function: 'Platform' },
  { category: 'service', vendor_name: 'Healthcare-focused data consultancy (composite)', product_name: 'data modernization', deployment_model: 'service_contract', annual_spend_usd: 4_200_000, owning_function: 'Data' },
  { category: 'staff_aug', vendor_name: 'Offshore data engineering partner (composite)', product_name: '45 FTE', deployment_model: 'service_contract', annual_spend_usd: 9_200_000, owning_function: 'Data' },
];

const MERIDIAN_PROJECTS: ProjectSeed[] = [
  { name: 'EHR modernization (Epic 2026 uplift)', description: '24-month EHR uplift across 9 hospitals.', program_domain: 'ehr_modernization', status: 'in_flight', total_budget_usd: 62_000_000, spent_to_date_usd: 31_000_000, exec_sponsor: 'CIO', touches_ai: true },
  { name: 'Enterprise data platform (Snowflake + dbt)', description: '18-month data platform build with AI-readiness tracks.', program_domain: 'data_platform', status: 'in_flight', total_budget_usd: 38_000_000, spent_to_date_usd: 25_840_000, exec_sponsor: 'CDO', touches_ai: true },
  { name: 'AI governance program', description: 'Governance committee + tooling (Credo AI) + policy library.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 4_200_000, spent_to_date_usd: 1_680_000, exec_sponsor: 'Chief AI Officer', touches_ai: true },
  { name: 'Cloud migration Wave 3', description: 'Move remaining on-prem workloads to AWS.', program_domain: 'cloud_migration', status: 'in_flight', total_budget_usd: 22_000_000, spent_to_date_usd: 12_100_000, exec_sponsor: 'CIO' },
  { name: 'Ambient clinical documentation scale-up', description: 'Abridge scale to full provider base.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 18_000_000, spent_to_date_usd: 11_160_000, exec_sponsor: 'CMIO', touches_ai: true },
  { name: 'Revenue cycle AI (Cohere Health + Claude)', description: 'Prior auth + denial prediction + coding audit consolidation.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 12_000_000, spent_to_date_usd: 3_600_000, exec_sponsor: 'CFO', touches_ai: true },
  { name: 'Cybersecurity modernization', description: 'Zero trust + SASE rollout.', program_domain: 'security_uplift', status: 'in_flight', total_budget_usd: 28_000_000, spent_to_date_usd: 16_800_000, exec_sponsor: 'CISO' },
  { name: 'Patient engagement platform', description: 'Hyro + Epic MyChart expansion.', program_domain: 'patient_experience', status: 'in_flight', total_budget_usd: 14_000_000, spent_to_date_usd: 6_300_000, exec_sponsor: 'CMO', touches_ai: true },
  { name: 'Research data platform', description: 'Multi-omics + RWE infrastructure.', program_domain: 'research', status: 'approved', total_budget_usd: 22_000_000, spent_to_date_usd: 2_200_000, exec_sponsor: 'Chief Research Officer', touches_ai: true },
  { name: 'Staff augmentation consolidation', description: 'Rationalize 14 staff aug vendors to 6.', program_domain: 'vendor_rationalization', status: 'in_flight', total_budget_usd: 1_200_000, spent_to_date_usd: 360_000, exec_sponsor: 'CIO' },
  { name: 'Shadow AI discovery + remediation', description: 'Zscaler-based discovery + governance onboarding for 9 shadow tools.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 2_400_000, spent_to_date_usd: 1_200_000, exec_sponsor: 'CISO', touches_ai: true },
  { name: 'M365 Copilot full rollout', description: 'Deploy Copilot across 8,400 eligible seats.', program_domain: 'ai_initiative', status: 'stabilizing', total_budget_usd: 8_400_000, spent_to_date_usd: 7_392_000, exec_sponsor: 'CIO', touches_ai: true, pattern_id: 'PAT-PRG-COPILOT-001' },
  { name: 'Claims triage copilot', description: 'Claude-based claims denial prediction at scale.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 3_800_000, spent_to_date_usd: 2_736_000, exec_sponsor: 'Revenue Cycle VP', touches_ai: true },
  { name: 'Sepsis model FDA-style validation', description: 'Clinical validation ahead of full deployment.', program_domain: 'clinical_ai', status: 'in_flight', total_budget_usd: 2_200_000, spent_to_date_usd: 1_210_000, exec_sponsor: 'CMIO', touches_ai: true },
  { name: 'Radiology AI consolidation', description: 'Evaluation to consolidate Aidoc + HeartFlow + others.', program_domain: 'ai_initiative', status: 'ideation', total_budget_usd: 4_800_000, spent_to_date_usd: 1_200_000, exec_sponsor: 'Chief Radiologist', touches_ai: true },
  { name: 'Patient portal AI', description: 'Hyro + Epic MyChart conversational AI.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 5_400_000, spent_to_date_usd: 2_430_000, exec_sponsor: 'CMO', touches_ai: true },
  { name: 'Clinical data quality program', description: 'Informatica + internal CDEs.', program_domain: 'data_platform', status: 'approved', total_budget_usd: 6_800_000, spent_to_date_usd: 1_496_000, exec_sponsor: 'CDO' },
  { name: 'Interpreter assist expansion', description: 'Jeenie + Claude pilot to 5 hospitals.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 1_800_000, spent_to_date_usd: 630_000, exec_sponsor: 'CMO', touches_ai: true },
];

const MERIDIAN_STAFF_AUG: StaffAugSeed[] = [
  { vendor_name: 'Offshore data engineering partner (composite)', engagement_type: 'managed_service', function_area: 'data_engineering', headcount_fte: 45, annual_spend_usd: 9_200_000, touches_ai: true },
  { vendor_name: 'National ML engineering bench (composite)', engagement_type: 'staff_aug', function_area: 'ml_engineering', headcount_fte: 22, annual_spend_usd: 8_800_000, touches_ai: true },
  { vendor_name: 'Regional security MSSP (composite)', engagement_type: 'managed_service', function_area: 'security_ops', headcount_fte: 18, annual_spend_usd: 5_400_000 },
  { vendor_name: 'AI portfolio PM firm (composite)', engagement_type: 'staff_aug', function_area: 'pm', headcount_fte: 8, annual_spend_usd: 2_400_000, touches_ai: true },
  { vendor_name: 'Healthcare data consultancy (composite)', engagement_type: 'fixed_bid', function_area: 'data_modernization', headcount_fte: 12, annual_spend_usd: 4_200_000, touches_ai: true },
  { vendor_name: 'Clinical informatics partner (composite)', engagement_type: 'retainer', function_area: 'clinical_informatics', headcount_fte: 6, annual_spend_usd: 1_800_000 },
  { vendor_name: 'Integration + middleware shop (composite)', engagement_type: 'staff_aug', function_area: 'integrations', headcount_fte: 14, annual_spend_usd: 3_360_000 },
  { vendor_name: 'Epic implementation partner (composite)', engagement_type: 'fixed_bid', function_area: 'ehr_implementation', headcount_fte: 18, annual_spend_usd: 6_480_000 },
  { vendor_name: 'UX/design consultancy (composite)', engagement_type: 'retainer', function_area: 'ux_design', headcount_fte: 4, annual_spend_usd: 800_000 },
  { vendor_name: 'Offshore QA partner (composite)', engagement_type: 'managed_service', function_area: 'qa_automation', headcount_fte: 20, annual_spend_usd: 1_600_000 },
];

// ── ARCTURUS FINANCIAL · FinServ ─────────────────────────────────────────
const ARCTURUS_TECH_STACK: TechStackItemSeed[] = [
  { category: 'hardware', vendor_name: 'Cisco', deployment_model: 'on_prem', annual_spend_usd: 6_200_000, owning_function: 'Network' },
  { category: 'hardware', vendor_name: 'Lenovo', deployment_model: 'on_prem', annual_spend_usd: 4_800_000, owning_function: 'Infrastructure' },
  { category: 'hardware', vendor_name: 'Pure Storage', deployment_model: 'on_prem', annual_spend_usd: 3_400_000, owning_function: 'Storage' },
  { category: 'infrastructure', vendor_name: 'AWS', product_name: 'primary + Bedrock', deployment_model: 'cloud_managed', annual_spend_usd: 58_000_000, owning_function: 'Platform', touches_ai: true },
  { category: 'infrastructure', vendor_name: 'Azure', product_name: 'secondary + Azure OpenAI', deployment_model: 'cloud_managed', annual_spend_usd: 22_000_000, owning_function: 'Platform', touches_ai: true },
  { category: 'infrastructure', vendor_name: 'GCP', product_name: 'Vertex AI', deployment_model: 'cloud_managed', annual_spend_usd: 6_800_000, owning_function: 'Platform', touches_ai: true },
  { category: 'platform', vendor_name: 'Snowflake', product_name: 'data warehouse + Cortex', deployment_model: 'saas', annual_spend_usd: 14_400_000, owning_function: 'Data', touches_ai: true },
  { category: 'platform', vendor_name: 'Databricks', product_name: 'lakehouse', deployment_model: 'saas', annual_spend_usd: 9_200_000, owning_function: 'Data', touches_ai: true },
  { category: 'business_app', vendor_name: 'Salesforce', product_name: 'Financial Services Cloud', deployment_model: 'saas', annual_spend_usd: 38_000_000, seat_count: 8_400, owning_function: 'Wealth', touches_ai: true },
  { category: 'business_app', vendor_name: 'SAP', product_name: 'S/4HANA Finance', deployment_model: 'hybrid', annual_spend_usd: 24_000_000, owning_function: 'Finance' },
  { category: 'business_app', vendor_name: 'Workday', product_name: 'HCM + Financials', deployment_model: 'saas', annual_spend_usd: 12_400_000, seat_count: 34_000, owning_function: 'HR' },
  { category: 'business_app', vendor_name: 'Genesys', product_name: 'Cloud CX', deployment_model: 'saas', annual_spend_usd: 18_200_000, seat_count: 3_800, owning_function: 'Contact Center' },
  { category: 'business_app', vendor_name: 'Bloomberg', product_name: 'Terminal', deployment_model: 'service_contract', annual_spend_usd: 11_800_000, seat_count: 280, owning_function: 'Wealth' },
  { category: 'security', vendor_name: 'CrowdStrike', product_name: 'Falcon', deployment_model: 'saas', annual_spend_usd: 6_800_000, owning_function: 'Security' },
  { category: 'security', vendor_name: 'Palo Alto Networks', deployment_model: 'hybrid', annual_spend_usd: 8_400_000, owning_function: 'Security' },
  { category: 'security', vendor_name: 'Okta', deployment_model: 'saas', annual_spend_usd: 4_200_000, seat_count: 34_000, owning_function: 'Security' },
  { category: 'security', vendor_name: 'Netskope', product_name: 'SASE', deployment_model: 'saas', annual_spend_usd: 3_800_000, owning_function: 'Security' },
  { category: 'collaboration', vendor_name: 'Microsoft', product_name: 'M365 E5', deployment_model: 'saas', annual_spend_usd: 38_400_000, seat_count: 34_000, owning_function: 'Enterprise IT', touches_ai: true },
  { category: 'collaboration', vendor_name: 'ServiceNow', product_name: 'ITSM + HRSD + FSM', deployment_model: 'saas', annual_spend_usd: 8_400_000, owning_function: 'Enterprise IT' },
  { category: 'dev_tools', vendor_name: 'GitHub', product_name: 'Enterprise', deployment_model: 'saas', annual_spend_usd: 4_200_000, seat_count: 1_820, owning_function: 'Engineering' },
  { category: 'dev_tools', vendor_name: 'GitHub Copilot', product_name: 'Enterprise', deployment_model: 'saas', annual_spend_usd: 744_000, seat_count: 1_820, owning_function: 'Engineering', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Hebbia', product_name: 'research', deployment_model: 'saas', annual_spend_usd: 1_152_000, seat_count: 240, owning_function: 'Wealth', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Harvey', product_name: 'legal', deployment_model: 'saas', annual_spend_usd: 864_000, seat_count: 80, owning_function: 'Legal', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Feedzai', product_name: 'fraud scoring', deployment_model: 'saas', annual_spend_usd: 4_080_000, owning_function: 'Risk', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'NICE Actimize', product_name: 'AML', deployment_model: 'saas', annual_spend_usd: 2_640_000, owning_function: 'Risk', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Cresta', product_name: 'agent assist', deployment_model: 'saas', annual_spend_usd: 2_880_000, seat_count: 3_800, owning_function: 'Contact Center', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Personetics', product_name: 'financial wellness', deployment_model: 'saas', annual_spend_usd: 3_360_000, owning_function: 'Retail Banking', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Kensho', product_name: 'market data', deployment_model: 'saas', annual_spend_usd: 2_160_000, seat_count: 140, owning_function: 'Wealth', touches_ai: true },
  { category: 'ai_model', vendor_name: 'Anthropic', product_name: 'Claude Enterprise', deployment_model: 'saas', annual_spend_usd: 2_400_000, owning_function: 'Platform', touches_ai: true },
  { category: 'ai_model', vendor_name: 'OpenAI', product_name: 'Enterprise', deployment_model: 'saas', annual_spend_usd: 1_800_000, owning_function: 'Platform', touches_ai: true },
  { category: 'service', vendor_name: 'Fortune-500 cloud SI (composite)', deployment_model: 'service_contract', annual_spend_usd: 14_400_000, owning_function: 'Platform' },
  { category: 'service', vendor_name: 'FinServ compliance consultancy (composite)', deployment_model: 'service_contract', annual_spend_usd: 8_400_000, owning_function: 'Compliance' },
  { category: 'staff_aug', vendor_name: 'Offshore dev shop (composite)', deployment_model: 'service_contract', annual_spend_usd: 18_000_000, owning_function: 'Engineering' },
];

const ARCTURUS_PROJECTS: ProjectSeed[] = [
  { name: 'Advisor copilot expansion', description: 'Claude Enterprise + Salesforce FSC for 2,200 advisors.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 14_000_000, spent_to_date_usd: 7_700_000, exec_sponsor: 'Head of Wealth', touches_ai: true },
  { name: 'M365 Copilot full deployment', description: '22,400 seats enterprise-wide.', program_domain: 'ai_initiative', status: 'stabilizing', total_budget_usd: 24_000_000, spent_to_date_usd: 22_080_000, exec_sponsor: 'CIO', touches_ai: true },
  { name: 'Fraud platform consolidation', description: 'Feedzai vs internal ML vs SAS decision + migration.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 8_800_000, spent_to_date_usd: 3_520_000, exec_sponsor: 'Chief Risk Officer', touches_ai: true },
  { name: 'AML investigator workbench', description: 'NICE Actimize + internal LLM.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 12_000_000, spent_to_date_usd: 4_200_000, exec_sponsor: 'Chief Compliance Officer', touches_ai: true },
  { name: 'Mortgage AI expansion', description: 'Ocrolus + Blend from 20% to 60% of applications.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 9_000_000, spent_to_date_usd: 5_400_000, exec_sponsor: 'Head of Mortgage', touches_ai: true },
  { name: 'Contact center transformation', description: 'Cresta + Genesys Cloud CX.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 16_000_000, spent_to_date_usd: 11_200_000, exec_sponsor: 'Chief Customer Officer', touches_ai: true },
  { name: 'Harvey legal rollout', description: 'Harvey to 80 legal staff.', program_domain: 'ai_initiative', status: 'stabilizing', total_budget_usd: 2_200_000, spent_to_date_usd: 1_760_000, exec_sponsor: 'General Counsel', touches_ai: true },
  { name: 'KYC automation', description: 'Hummingbird + Socure.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 6_400_000, spent_to_date_usd: 2_880_000, exec_sponsor: 'Head of Retail Banking', touches_ai: true },
  { name: 'Alternative data platform', description: 'AlphaSense + Cohere + internal.', program_domain: 'research', status: 'in_flight', total_budget_usd: 8_000_000, spent_to_date_usd: 2_400_000, exec_sponsor: 'CIO Wealth', touches_ai: true },
  { name: 'AI governance program', description: 'Internal + Credo AI.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 4_800_000, spent_to_date_usd: 2_400_000, exec_sponsor: 'Chief AI Officer', touches_ai: true },
  { name: 'Data platform AI-readiness (Snowflake Cortex)', description: 'Cortex adoption + governance.', program_domain: 'data_platform', status: 'in_flight', total_budget_usd: 11_000_000, spent_to_date_usd: 6_380_000, exec_sponsor: 'CDO', touches_ai: true },
  { name: 'Engineering productivity (Copilot + Devin pilot)', description: 'GitHub + Cognition evaluation.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 3_200_000, spent_to_date_usd: 1_984_000, exec_sponsor: 'CTO', touches_ai: true },
  { name: 'Shadow AI discovery', description: 'Netskope-based discovery.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 1_800_000, spent_to_date_usd: 1_296_000, exec_sponsor: 'CISO', touches_ai: true },
  { name: 'Core banking modernization', description: 'Migrate off legacy to Finxact primary.', program_domain: 'business_app_modernization', status: 'in_flight', total_budget_usd: 112_000_000, spent_to_date_usd: 44_800_000, exec_sponsor: 'CIO' },
  { name: 'Zero trust rollout', description: 'Enterprise SASE + microsegmentation.', program_domain: 'security_uplift', status: 'in_flight', total_budget_usd: 38_000_000, spent_to_date_usd: 19_000_000, exec_sponsor: 'CISO' },
];

const ARCTURUS_STAFF_AUG: StaffAugSeed[] = [
  { vendor_name: 'Offshore dev shop (composite)', engagement_type: 'managed_service', function_area: 'engineering', headcount_fte: 180, annual_spend_usd: 18_000_000 },
  { vendor_name: 'ML engineering bench (composite)', engagement_type: 'staff_aug', function_area: 'ml_engineering', headcount_fte: 42, annual_spend_usd: 14_700_000, touches_ai: true },
  { vendor_name: 'Compliance analyst firm (composite)', engagement_type: 'managed_service', function_area: 'compliance', headcount_fte: 24, annual_spend_usd: 6_200_000 },
  { vendor_name: 'FinServ compliance consultancy (composite)', engagement_type: 'fixed_bid', function_area: 'regulatory', headcount_fte: 18, annual_spend_usd: 8_400_000 },
  { vendor_name: 'Fortune-500 cloud SI (composite)', engagement_type: 'fixed_bid', function_area: 'cloud_modernization', headcount_fte: 36, annual_spend_usd: 14_400_000 },
  { vendor_name: 'Security ops MSSP (composite)', engagement_type: 'managed_service', function_area: 'security_ops', headcount_fte: 28, annual_spend_usd: 6_800_000 },
  { vendor_name: 'Program management partner (composite)', engagement_type: 'retainer', function_area: 'pm', headcount_fte: 12, annual_spend_usd: 4_200_000 },
];

// ── APEX RETAIL · retail ─────────────────────────────────────────────────
const APEX_TECH_STACK: TechStackItemSeed[] = [
  { category: 'hardware', vendor_name: 'Cisco', product_name: 'store networking', deployment_model: 'on_prem', annual_spend_usd: 4_200_000, owning_function: 'Network' },
  { category: 'hardware', vendor_name: 'Lenovo', product_name: 'POS + corporate', deployment_model: 'on_prem', annual_spend_usd: 3_800_000, owning_function: 'Infrastructure' },
  { category: 'infrastructure', vendor_name: 'AWS', product_name: 'primary cloud', deployment_model: 'cloud_managed', annual_spend_usd: 18_400_000, owning_function: 'Platform', touches_ai: true },
  { category: 'infrastructure', vendor_name: 'Azure', product_name: 'secondary', deployment_model: 'cloud_managed', annual_spend_usd: 5_200_000, owning_function: 'Platform' },
  { category: 'platform', vendor_name: 'Snowflake', deployment_model: 'saas', annual_spend_usd: 6_800_000, owning_function: 'Data', touches_ai: true },
  { category: 'platform', vendor_name: 'Databricks', deployment_model: 'saas', annual_spend_usd: 2_400_000, owning_function: 'Data', touches_ai: true },
  { category: 'business_app', vendor_name: 'SAP', product_name: 'S/4HANA', deployment_model: 'hybrid', annual_spend_usd: 22_000_000, owning_function: 'Finance' },
  { category: 'business_app', vendor_name: 'Salesforce', product_name: 'Commerce Cloud', deployment_model: 'saas', annual_spend_usd: 14_800_000, owning_function: 'Digital' },
  { category: 'business_app', vendor_name: 'Workday', product_name: 'HCM', deployment_model: 'saas', annual_spend_usd: 18_400_000, seat_count: 72_000, owning_function: 'HR' },
  { category: 'business_app', vendor_name: 'ServiceNow', product_name: 'ITSM', deployment_model: 'saas', annual_spend_usd: 3_600_000, owning_function: 'Enterprise IT' },
  { category: 'security', vendor_name: 'CrowdStrike', deployment_model: 'saas', annual_spend_usd: 3_200_000, owning_function: 'Security' },
  { category: 'security', vendor_name: 'Okta', deployment_model: 'saas', annual_spend_usd: 5_400_000, seat_count: 72_000, owning_function: 'Security' },
  { category: 'collaboration', vendor_name: 'Microsoft', product_name: 'M365', deployment_model: 'saas', annual_spend_usd: 12_600_000, seat_count: 32_200, owning_function: 'Enterprise IT', touches_ai: true },
  { category: 'dev_tools', vendor_name: 'GitHub', product_name: 'Enterprise + Copilot', deployment_model: 'saas', annual_spend_usd: 780_000, seat_count: 450, owning_function: 'Engineering', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Bloomreach', product_name: 'Engagement + Discovery', deployment_model: 'saas', annual_spend_usd: 3_360_000, owning_function: 'Digital', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Algolia', product_name: 'site search', deployment_model: 'saas', annual_spend_usd: 1_056_000, owning_function: 'Digital', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Dynamic Yield', product_name: 'A/B testing', deployment_model: 'saas', annual_spend_usd: 864_000, owning_function: 'Digital', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Signifyd', product_name: 'fraud', deployment_model: 'saas', annual_spend_usd: 2_880_000, owning_function: 'Risk', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Cresta', product_name: 'agent assist', deployment_model: 'saas', annual_spend_usd: 1_056_000, seat_count: 1_400, owning_function: 'Contact Center', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'o9 Solutions', product_name: 'demand forecasting', deployment_model: 'saas', annual_spend_usd: 3_840_000, owning_function: 'Supply Chain', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Blue Yonder', product_name: 'pricing', deployment_model: 'saas', annual_spend_usd: 2_160_000, owning_function: 'Merchandising', touches_ai: true },
  { category: 'ai_platform', vendor_name: 'Microsoft Copilot', product_name: 'Frontline', deployment_model: 'saas', annual_spend_usd: 2_184_000, seat_count: 28_000, owning_function: 'Retail Operations', touches_ai: true },
  { category: 'ai_model', vendor_name: 'Anthropic', product_name: 'Claude Enterprise', deployment_model: 'saas', annual_spend_usd: 480_000, owning_function: 'Platform', touches_ai: true },
  { category: 'service', vendor_name: 'National retail SI (composite)', deployment_model: 'service_contract', annual_spend_usd: 4_800_000, owning_function: 'Platform' },
  { category: 'staff_aug', vendor_name: 'Offshore dev partner (composite)', deployment_model: 'service_contract', annual_spend_usd: 6_600_000, owning_function: 'Engineering' },
];

const APEX_PROJECTS: ProjectSeed[] = [
  { name: 'Personalization platform consolidation', description: 'Bloomreach + Dynamic Yield + Nosto rationalization.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 7_000_000, spent_to_date_usd: 3_150_000, exec_sponsor: 'CDO', touches_ai: true },
  { name: 'Pricing AI expansion', description: 'Blue Yonder + o9 from 12 to 48 categories.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 9_200_000, spent_to_date_usd: 5_336_000, exec_sponsor: 'Chief Merchant', touches_ai: true },
  { name: 'Store operations AI', description: 'Claude Enterprise rollout to frontline.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 5_400_000, spent_to_date_usd: 1_620_000, exec_sponsor: 'COO', touches_ai: true },
  { name: 'Moveworks deployment', description: 'Service desk AI for 18K seats.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 3_800_000, spent_to_date_usd: 2_280_000, exec_sponsor: 'CIO', touches_ai: true },
  { name: 'Supply chain digital twin', description: 'o9 + internal.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 14_000_000, spent_to_date_usd: 4_900_000, exec_sponsor: 'Chief Supply Chain Officer', touches_ai: true },
  { name: 'Returns intelligence rollout', description: 'Optoro expansion to 80 stores.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 2_600_000, spent_to_date_usd: 1_430_000, exec_sponsor: 'COO', touches_ai: true },
  { name: 'Loss prevention expansion', description: 'Everseen computer-vision at 60 stores.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 4_400_000, spent_to_date_usd: 1_760_000, exec_sponsor: 'Head of Asset Protection', touches_ai: true },
  { name: 'Marketing AI stack', description: 'Jasper + Anthropic + Persado.', program_domain: 'ai_initiative', status: 'approved', total_budget_usd: 3_200_000, spent_to_date_usd: 800_000, exec_sponsor: 'CMO', touches_ai: true },
  { name: 'Demand forecasting accuracy program', description: 'o9 + internal ML tuning.', program_domain: 'ai_initiative', status: 'stabilizing', total_budget_usd: 6_000_000, spent_to_date_usd: 4_320_000, exec_sponsor: 'VP Planning', touches_ai: true },
  { name: 'Agentic customer service (Sierra eval)', description: 'Evaluation only.', program_domain: 'ai_initiative', status: 'ideation', total_budget_usd: 1_200_000, spent_to_date_usd: 240_000, exec_sponsor: 'Chief Customer Officer', touches_ai: true },
  { name: 'Frontline Copilot scale', description: 'Deploy Microsoft Copilot Frontline to all 28K store associates.', program_domain: 'ai_initiative', status: 'in_flight', total_budget_usd: 8_400_000, spent_to_date_usd: 5_460_000, exec_sponsor: 'COO', touches_ai: true },
];

const APEX_STAFF_AUG: StaffAugSeed[] = [
  { vendor_name: 'Offshore dev partner (composite)', engagement_type: 'managed_service', function_area: 'engineering', headcount_fte: 55, annual_spend_usd: 6_600_000 },
  { vendor_name: 'Data engineering partner (composite)', engagement_type: 'staff_aug', function_area: 'data_engineering', headcount_fte: 18, annual_spend_usd: 3_780_000, touches_ai: true },
  { vendor_name: 'Retail SI (composite)', engagement_type: 'fixed_bid', function_area: 'platform_modernization', headcount_fte: 22, annual_spend_usd: 4_800_000 },
  { vendor_name: 'ML engineering bench (composite)', engagement_type: 'staff_aug', function_area: 'ml_engineering', headcount_fte: 8, annual_spend_usd: 2_400_000, touches_ai: true },
  { vendor_name: 'Security MSSP (composite)', engagement_type: 'managed_service', function_area: 'security_ops', headcount_fte: 10, annual_spend_usd: 1_800_000 },
  { vendor_name: 'UX design firm (composite)', engagement_type: 'retainer', function_area: 'ux_design', headcount_fte: 4, annual_spend_usd: 720_000 },
];

export const VOLUMETRICS_PROFILES: Record<Industry, VolumetricsProfile> = {
  HEALTHCARE_IDN: {
    apiCallsDailyMillions: 42,
    tokensDailyBillions: 8.2,
    storageTb: 4800,
    queriesDailyMillions: 19,
    activeModels: 47,
    dataPipelines: 312,
  },
  FINSERV: {
    apiCallsDailyMillions: 180,
    tokensDailyBillions: 14.6,
    storageTb: 9200,
    queriesDailyMillions: 68,
    activeModels: 84,
    dataPipelines: 640,
  },
  RETAIL: {
    apiCallsDailyMillions: 62,
    tokensDailyBillions: 2.8,
    storageTb: 1800,
    queriesDailyMillions: 22,
    activeModels: 28,
    dataPipelines: 186,
  },
};

export const CLIENT_DATA: Record<string, { techStack: TechStackItemSeed[]; projects: ProjectSeed[]; staffAug: StaffAugSeed[] }> = {
  'Meridian Health': { techStack: MERIDIAN_TECH_STACK, projects: MERIDIAN_PROJECTS, staffAug: MERIDIAN_STAFF_AUG },
  'First Capital': { techStack: ARCTURUS_TECH_STACK, projects: ARCTURUS_PROJECTS, staffAug: ARCTURUS_STAFF_AUG },
  'Apex Retail': { techStack: APEX_TECH_STACK, projects: APEX_PROJECTS, staffAug: APEX_STAFF_AUG },
};

export type TowerDimension = 'inventory' | 'adoption' | 'value' | 'risk' | 'cost';

export const TOWER_DIMENSIONS: Array<{
  key: TowerDimension;
  num: string;
  name: string;
  tagline: string;
  setupMinutes: number;
  whatWeNeed: string[];
}> = [
  {
    key: 'inventory',
    num: '01',
    name: 'Inventory',
    tagline: 'Every AI use case across the business — what, who, where.',
    setupMinutes: 15,
    whatWeNeed: [
      'Use case list: name, status (pilot/production/stalled/sunset), owner',
      'Vendor + product per use case',
      'Data classes in scope (PHI, PII, financial, clinical_notes)',
      'Launch date and last review date',
    ],
  },
  {
    key: 'adoption',
    num: '02',
    name: 'Adoption',
    tagline: 'Who\'s actually using it — DAU/WAU, penetration, drop-off.',
    setupMinutes: 20,
    whatWeNeed: [
      'Daily/weekly active users per use case',
      'Eligible population (headcount that could use it)',
      'Penetration % (active / eligible)',
      'Drop-off rate (users who stopped after trying)',
    ],
  },
  {
    key: 'value',
    num: '03',
    name: 'Value',
    tagline: 'Baseline vs observed on the metrics that matter.',
    setupMinutes: 25,
    whatWeNeed: [
      'Metric name + unit per use case (e.g., "docs/hour", "minutes per encounter")',
      'Baseline measurement before AI rolled out',
      'Observed measurement with AI deployed',
      'Confidence level (high/medium/low)',
    ],
  },
  {
    key: 'risk',
    num: '04',
    name: 'Risk',
    tagline: 'Approvals, data classes, vendor posture, incidents.',
    setupMinutes: 15,
    whatWeNeed: [
      'Governance approval status (approved/conditional/pending)',
      'Model risk level (low/medium/high)',
      'Data classification per use case',
      'Vendor posture (HIPAA BAA, SOC 2, data residency)',
      'Incident / bias-event counts',
    ],
  },
  {
    key: 'cost',
    num: '05',
    name: 'Cost',
    tagline: 'Monthly AI spend by vendor, category, use case.',
    setupMinutes: 15,
    whatWeNeed: [
      'Monthly spend by vendor (LLM API, SaaS licenses)',
      'Compute costs (cloud billing exports)',
      'License counts and per-seat prices',
      'Usage-based costs (tokens, API calls)',
    ],
  },
];

export interface CatalogSystem {
  key: string;
  name: string;
  tagline: string;
  dimensions: TowerDimension[];
  whatToExport: string;
  steps: string[];
  fields: Array<{ source: string; target: string }>;
  tip?: string;
  templateKey?: string;
}

export const ONBOARDING_CATALOG: CatalogSystem[] = [
  {
    key: 'servicenow',
    name: 'ServiceNow',
    tagline: 'AI tool asset list (Inventory) + incident tickets (Risk).',
    dimensions: ['inventory', 'risk'],
    whatToExport:
      'Configuration Management Database (CMDB) query for AI-related CIs plus a change/incident slice filtered to AI use cases.',
    steps: [
      'Open ServiceNow Studio → Reports → new Table Report',
      'Table: cmdb_ci — filter Category = "AI / ML Application"',
      'Columns: name, business_owner, it_owner, vendor, install_date, last_review',
      'Export → CSV',
      'Repeat for incident table filtered to Category: AI',
    ],
    fields: [
      { source: 'name', target: 'use_case_name' },
      { source: 'business_owner', target: 'business_owner' },
      { source: 'it_owner', target: 'technical_owner' },
      { source: 'vendor', target: 'vendor' },
      { source: 'install_date', target: 'launch_date' },
    ],
    tip: 'If you already use the AI Intent module in ServiceNow, export from there directly — schema is closer to our format.',
    templateKey: 'inventory',
  },
  {
    key: 'workday',
    name: 'Workday',
    tagline: 'Employee counts (Adoption denominator) + cost centers (Value).',
    dimensions: ['adoption', 'value'],
    whatToExport: 'Headcount report by function, department, and cost center for the scope eligible to use each AI tool.',
    steps: [
      'Workday → Reports → Headcount by Organization',
      'Scope: organizations where the AI tool is deployed',
      'Columns: employee_id, job_profile, department, cost_center, fte',
      'Output: CSV',
      'If multi-region: one export per region',
    ],
    fields: [
      { source: 'department', target: 'adoption.population_segment' },
      { source: 'fte', target: 'adoption.eligible_population' },
      { source: 'cost_center', target: 'value.cost_allocation' },
    ],
    templateKey: 'adoption',
  },
  {
    key: 'microsoft_365',
    name: 'Microsoft 365 / Copilot admin',
    tagline: 'Copilot seats + usage (Adoption) + M365 license cost (Cost).',
    dimensions: ['adoption', 'cost', 'inventory'],
    whatToExport:
      'Copilot usage report and license assignment report from M365 admin center. License billing from billing portal.',
    steps: [
      'M365 admin center → Reports → Usage → Microsoft Copilot',
      'Export "Active users" and "Copilot usage" for the last 90 days',
      'Reports → Billing → Licenses assigned — Copilot SKU row, export CSV',
      'Azure billing portal → Copilot meters → monthly spend export',
    ],
    fields: [
      { source: 'active_users_last_28d', target: 'adoption.wau' },
      { source: 'active_users_last_7d', target: 'adoption.dau_avg_last_7d' },
      { source: 'assigned_licenses', target: 'adoption.eligible_population' },
      { source: 'monthly_spend_usd', target: 'cost.monthly_spend_usd' },
    ],
    tip: 'Global admin or Reports reader role required. Usage reports are pseudonymized unless you toggle show-names on.',
    templateKey: 'adoption',
  },
  {
    key: 'aws_cost_explorer',
    name: 'AWS Cost Explorer',
    tagline: 'Compute + LLM API spend (Cost) + services provisioned (Inventory).',
    dimensions: ['cost', 'inventory'],
    whatToExport: 'Monthly AI-service spend filtered to Bedrock, SageMaker, and ML-tagged EC2/S3.',
    steps: [
      'AWS Console → Billing → Cost Explorer',
      'Filter · Service: Bedrock OR SageMaker OR "EC2 (ML instances)"',
      'Group by: Service, Usage type',
      'Granularity: Monthly',
      'Time range: Last 3 months',
      'Export → CSV',
    ],
    fields: [
      { source: 'Service', target: 'cost.vendor' },
      { source: 'UsageType', target: 'cost.category' },
      { source: 'UnblendedCost', target: 'cost.monthly_spend_usd' },
      { source: 'TimePeriod.Start', target: 'cost.billing_month' },
    ],
    tip: 'Use the consolidated billing account if you have multiple AWS orgs — it gives you full-fleet visibility.',
    templateKey: 'cost',
  },
  {
    key: 'azure_cost_management',
    name: 'Azure Cost Management',
    tagline: 'Azure OpenAI + ML spend (Cost) + AI resources (Inventory).',
    dimensions: ['cost', 'inventory'],
    whatToExport: 'Azure OpenAI + Cognitive Services + Machine Learning resource spend.',
    steps: [
      'Azure Portal → Cost Management + Billing',
      'Cost Analysis · filter · Service name: Azure OpenAI, Cognitive Services, Machine Learning',
      'Group by: Service name, Meter subcategory',
      'Granularity: Monthly',
      'Export → CSV',
    ],
    fields: [
      { source: 'ServiceName', target: 'cost.vendor' },
      { source: 'MeterSubcategory', target: 'cost.category' },
      { source: 'CostUSD', target: 'cost.monthly_spend_usd' },
    ],
    templateKey: 'cost',
  },
  {
    key: 'google_cloud_billing',
    name: 'Google Cloud Billing',
    tagline: 'Vertex AI + Gemini spend (Cost) + GCP AI services (Inventory).',
    dimensions: ['cost', 'inventory'],
    whatToExport: 'Vertex AI + Generative AI Studio + BigQuery ML spend by SKU.',
    steps: [
      'GCP Console → Billing → Reports',
      'Filter · Service: Vertex AI OR Generative Language API OR BigQuery',
      'Group by: Service, SKU',
      'Time range: 3 months, monthly',
      'Export → CSV (or schedule to BigQuery billing export)',
    ],
    fields: [
      { source: 'service.description', target: 'cost.vendor' },
      { source: 'sku.description', target: 'cost.category' },
      { source: 'cost', target: 'cost.monthly_spend_usd' },
    ],
    tip: 'For ongoing sync, enable the BigQuery billing export — pulls every SKU automatically.',
    templateKey: 'cost',
  },
  {
    key: 'okta_entra_id',
    name: 'Okta / Entra ID',
    tagline: 'License assignments (Adoption) + access patterns (Risk).',
    dimensions: ['adoption', 'risk'],
    whatToExport: 'Group memberships for AI-tool SAML apps and access logs for sensitive AI endpoints.',
    steps: [
      'Okta admin → Applications → filter by AI-tool apps',
      'Per app: Assignments → Export group + individual assignments to CSV',
      'Reports → System Log → filter to AI apps → export last 30 days',
      'Entra equivalent: Enterprise applications → per-app → Users & groups, Sign-in logs',
    ],
    fields: [
      { source: 'group_or_user', target: 'adoption.eligible_population_unit' },
      { source: 'app_name', target: 'use_case_name' },
      { source: 'sign_in_count', target: 'adoption.wau' },
    ],
    tip: 'Cross-reference with Workday headcount to get realistic penetration %.',
    templateKey: 'adoption',
  },
  {
    key: 'snowflake',
    name: 'Snowflake',
    tagline: 'Model-output-to-revenue attribution (Value) when business metrics live there.',
    dimensions: ['value'],
    whatToExport: 'Business metric tables that already carry AI-influenced outcomes (e.g., predicted demand, scored leads, auto-classified claims).',
    steps: [
      'Identify the metric tables (e.g., fact_leads, fact_claims, fact_demand_forecast)',
      'For each: add a column or tag marking rows "AI-influenced"',
      'Snowsight → Worksheets → write a simple comparison query: AI vs non-AI cohort mean',
      'Save result as CSV or pipe to a scheduled task',
    ],
    fields: [
      { source: 'metric_name', target: 'value.metric_name' },
      { source: 'baseline_mean', target: 'value.baseline' },
      { source: 'ai_cohort_mean', target: 'value.observed' },
      { source: 'unit', target: 'value.unit' },
    ],
    tip: 'Needs a few weeks of AI-on / AI-off data to compute a baseline. If you don\'t have it yet, start with a manual metric upload.',
    templateKey: 'value',
  },
];

export function catalogByDimension(dimension: TowerDimension): CatalogSystem[] {
  return ONBOARDING_CATALOG.filter((s) => s.dimensions.includes(dimension));
}

export function dimensionByKey(key: string): (typeof TOWER_DIMENSIONS)[number] | undefined {
  return TOWER_DIMENSIONS.find((d) => d.key === key);
}

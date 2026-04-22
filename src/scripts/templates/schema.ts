import type { TowerDimension } from '@/lib/tower/onboarding-catalog';

export const TEMPLATE_VERSION = '1.0';

export interface ColumnSpec {
  key: string;
  label: string;
  required?: boolean;
  type: 'string' | 'number' | 'date' | 'enum' | 'list';
  enumValues?: string[];
  listSeparator?: '|';
  description: string;
  example: string;
}

export interface DimensionTemplate {
  dimension: TowerDimension;
  displayName: string;
  filenameBase: string;
  description: string;
  columns: ColumnSpec[];
  exampleRow: Record<string, string>;
}

export const INVENTORY_TEMPLATE: DimensionTemplate = {
  dimension: 'inventory',
  displayName: 'Inventory',
  filenameBase: 'tower-inventory',
  description: 'One row per AI use case. What, who, and where each AI capability lives.',
  columns: [
    { key: 'use_case_id', label: 'use_case_id', required: true, type: 'string', description: 'Stable ID across uploads. Alphanumeric + underscore.', example: 'uc_001' },
    { key: 'name', label: 'name', required: true, type: 'string', description: 'Human-readable use case name.', example: 'Copilot Clinical Documentation' },
    { key: 'description', label: 'description', type: 'string', description: 'One-sentence description.', example: 'Ambient clinical documentation for providers.' },
    { key: 'status', label: 'status', required: true, type: 'enum', enumValues: ['pilot', 'production', 'stalled', 'sunset'], description: 'Current lifecycle stage.', example: 'production' },
    { key: 'business_owner', label: 'business_owner', type: 'string', description: 'Accountable business sponsor.', example: 'Dr. Sarah Chen' },
    { key: 'technical_owner', label: 'technical_owner', type: 'string', description: 'Accountable technical lead.', example: 'IT Platform Team' },
    { key: 'vendor', label: 'vendor', type: 'string', description: 'Primary vendor.', example: 'Microsoft' },
    { key: 'product', label: 'product', type: 'string', description: 'Product name from vendor.', example: 'Copilot Clinical' },
    { key: 'data_classes', label: 'data_classes', type: 'list', listSeparator: '|', description: 'Pipe-separated data classes in scope: PHI | PII | financial | clinical_notes | public.', example: 'PHI|clinical_notes' },
    { key: 'launch_date', label: 'launch_date', type: 'date', description: 'YYYY-MM-DD. Date first put in production.', example: '2024-11-15' },
    { key: 'last_reviewed', label: 'last_reviewed', type: 'date', description: 'YYYY-MM-DD. Date of most recent governance review.', example: '2025-09-22' },
  ],
  exampleRow: {
    use_case_id: 'uc_001',
    name: 'Copilot Clinical Documentation',
    description: 'Ambient clinical documentation for providers.',
    status: 'production',
    business_owner: 'Dr. Sarah Chen',
    technical_owner: 'IT Platform Team',
    vendor: 'Microsoft',
    product: 'Copilot Clinical',
    data_classes: 'PHI|clinical_notes',
    launch_date: '2024-11-15',
    last_reviewed: '2025-09-22',
  },
};

export const ADOPTION_TEMPLATE: DimensionTemplate = {
  dimension: 'adoption',
  displayName: 'Adoption',
  filenameBase: 'tower-adoption',
  description: 'Usage signals per use case. Who\'s actually using it.',
  columns: [
    { key: 'use_case_id', label: 'use_case_id', required: true, type: 'string', description: 'Must match an inventory row.', example: 'uc_001' },
    { key: 'period_start', label: 'period_start', required: true, type: 'date', description: 'YYYY-MM-DD. Start of measurement period.', example: '2025-10-01' },
    { key: 'period_end', label: 'period_end', required: true, type: 'date', description: 'YYYY-MM-DD. End of measurement period.', example: '2025-10-31' },
    { key: 'dau', label: 'dau', type: 'number', description: 'Daily active users (average across period).', example: '1240' },
    { key: 'wau', label: 'wau', type: 'number', description: 'Weekly active users.', example: '3850' },
    { key: 'mau', label: 'mau', type: 'number', description: 'Monthly active users.', example: '6200' },
    { key: 'eligible_population', label: 'eligible_population', type: 'number', description: 'Users who could use it (denominator for penetration).', example: '8200' },
    { key: 'penetration_pct', label: 'penetration_pct', type: 'number', description: 'Percentage. Computed active/eligible if blank.', example: '47.2' },
    { key: 'drop_off_rate_pct', label: 'drop_off_rate_pct', type: 'number', description: 'Percentage who tried then stopped.', example: '18.4' },
  ],
  exampleRow: {
    use_case_id: 'uc_001',
    period_start: '2025-10-01',
    period_end: '2025-10-31',
    dau: '1240',
    wau: '3850',
    mau: '6200',
    eligible_population: '8200',
    penetration_pct: '47.2',
    drop_off_rate_pct: '18.4',
  },
};

export const VALUE_TEMPLATE: DimensionTemplate = {
  dimension: 'value',
  displayName: 'Value',
  filenameBase: 'tower-value',
  description: 'Baseline vs observed on the metrics that matter.',
  columns: [
    { key: 'use_case_id', label: 'use_case_id', required: true, type: 'string', description: 'Must match an inventory row.', example: 'uc_001' },
    { key: 'value_driver', label: 'value_driver', required: true, type: 'string', description: 'Short label for the lever (e.g., documentation_time, denial_rate).', example: 'documentation_time' },
    { key: 'metric_name', label: 'metric_name', required: true, type: 'string', description: 'Human-readable metric.', example: 'Minutes per encounter' },
    { key: 'unit', label: 'unit', type: 'string', description: 'Unit of measure.', example: 'minutes' },
    { key: 'baseline', label: 'baseline', required: true, type: 'number', description: 'Pre-AI measurement (USD or natural unit).', example: '12.5' },
    { key: 'observed', label: 'observed', required: true, type: 'number', description: 'Post-AI measurement (same unit as baseline).', example: '8.2' },
    { key: 'confidence', label: 'confidence', type: 'enum', enumValues: ['high', 'medium', 'low'], description: 'How well this comparison is controlled.', example: 'high' },
    { key: 'as_of_date', label: 'as_of_date', type: 'date', description: 'YYYY-MM-DD. When the observed value was measured.', example: '2025-10-31' },
  ],
  exampleRow: {
    use_case_id: 'uc_001',
    value_driver: 'documentation_time',
    metric_name: 'Minutes per encounter',
    unit: 'minutes',
    baseline: '12.5',
    observed: '8.2',
    confidence: 'high',
    as_of_date: '2025-10-31',
  },
};

export const RISK_TEMPLATE: DimensionTemplate = {
  dimension: 'risk',
  displayName: 'Risk',
  filenameBase: 'tower-risk',
  description: 'Approvals, data classes, vendor posture, incidents.',
  columns: [
    { key: 'use_case_id', label: 'use_case_id', required: true, type: 'string', description: 'Must match an inventory row.', example: 'uc_001' },
    { key: 'governance_approval_status', label: 'governance_approval_status', required: true, type: 'enum', enumValues: ['approved', 'conditional', 'pending'], description: 'Current approval state.', example: 'approved' },
    { key: 'model_risk_level', label: 'model_risk_level', type: 'enum', enumValues: ['low', 'medium', 'high'], description: 'Inherent model risk tier.', example: 'medium' },
    { key: 'data_classification', label: 'data_classification', type: 'list', listSeparator: '|', description: 'Pipe-separated: PHI | PII | financial | clinical_notes | public.', example: 'PHI|clinical_notes' },
    { key: 'vendor_hipaa_baa', label: 'vendor_hipaa_baa', type: 'enum', enumValues: ['true', 'false'], description: 'Does vendor have a HIPAA BAA in place?', example: 'true' },
    { key: 'vendor_soc2', label: 'vendor_soc2', type: 'enum', enumValues: ['true', 'false'], description: 'Does vendor have SOC 2 Type II?', example: 'true' },
    { key: 'data_residency', label: 'data_residency', type: 'string', description: 'Region where data processed (US, EU, UK).', example: 'US' },
    { key: 'bias_incidents_count', label: 'bias_incidents_count', type: 'number', description: 'Incidents reported this period.', example: '0' },
    { key: 'as_of_date', label: 'as_of_date', type: 'date', description: 'YYYY-MM-DD. As-of date of this snapshot.', example: '2025-10-31' },
  ],
  exampleRow: {
    use_case_id: 'uc_001',
    governance_approval_status: 'approved',
    model_risk_level: 'medium',
    data_classification: 'PHI|clinical_notes',
    vendor_hipaa_baa: 'true',
    vendor_soc2: 'true',
    data_residency: 'US',
    bias_incidents_count: '0',
    as_of_date: '2025-10-31',
  },
};

export const COST_TEMPLATE: DimensionTemplate = {
  dimension: 'cost',
  displayName: 'Cost',
  filenameBase: 'tower-cost',
  description: 'Monthly AI spend by vendor × category × use case.',
  columns: [
    { key: 'use_case_id', label: 'use_case_id', required: true, type: 'string', description: 'Must match an inventory row.', example: 'uc_001' },
    { key: 'period_start', label: 'period_start', required: true, type: 'date', description: 'YYYY-MM-DD. First day of billing month.', example: '2025-10-01' },
    { key: 'period_end', label: 'period_end', required: true, type: 'date', description: 'YYYY-MM-DD. Last day of billing month.', example: '2025-10-31' },
    { key: 'vendor', label: 'vendor', type: 'string', description: 'Primary vendor billed.', example: 'Microsoft' },
    { key: 'total_spend_usd', label: 'total_spend_usd', required: true, type: 'number', description: 'Total USD spent in period.', example: '45000' },
    { key: 'llm_spend_usd', label: 'llm_spend_usd', type: 'number', description: 'LLM API spend portion.', example: '12000' },
    { key: 'compute_spend_usd', label: 'compute_spend_usd', type: 'number', description: 'Compute / infra portion.', example: '8000' },
    { key: 'storage_spend_usd', label: 'storage_spend_usd', type: 'number', description: 'Storage portion.', example: '2000' },
    { key: 'vendor_license_spend_usd', label: 'vendor_license_spend_usd', type: 'number', description: 'Per-seat license portion.', example: '20000' },
    { key: 'integration_spend_usd', label: 'integration_spend_usd', type: 'number', description: 'Integration / middleware portion.', example: '3000' },
    { key: 'projected_6mo_spend_usd', label: 'projected_6mo_spend_usd', type: 'number', description: '6-month forward projection.', example: '310000' },
  ],
  exampleRow: {
    use_case_id: 'uc_001',
    period_start: '2025-10-01',
    period_end: '2025-10-31',
    vendor: 'Microsoft',
    total_spend_usd: '45000',
    llm_spend_usd: '12000',
    compute_spend_usd: '8000',
    storage_spend_usd: '2000',
    vendor_license_spend_usd: '20000',
    integration_spend_usd: '3000',
    projected_6mo_spend_usd: '310000',
  },
};

export const ALL_TEMPLATES: DimensionTemplate[] = [
  INVENTORY_TEMPLATE,
  ADOPTION_TEMPLATE,
  VALUE_TEMPLATE,
  RISK_TEMPLATE,
  COST_TEMPLATE,
];

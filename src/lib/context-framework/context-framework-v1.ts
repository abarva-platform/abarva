// CONTEXT_FRAMEWORK_v1 — the canonical "what good looks like" per context
// dimension (Workstream A, light). One versioned source of truth that every
// client/pilot template and every synthetic reference tenant must satisfy.
//
// Deliberately light: this LOCKS the dimensions + their governance contract.
// It does not re-implement the upload UI/registry (csv-upload-connector +
// template-registry already do that) — it is the spec those templates conform
// to, and the basis for derived answerability + promotion eligibility.

export const CONTEXT_FRAMEWORK_VERSION = 'context_framework_v1';

export type FrameworkSourceType =
  | 'tenant_context'
  | 'structured_fact'
  | 'context_record'
  | 'artifact'
  | 'kpi_baseline'
  | 'source_event'
  | 'corpus_pattern'
  | 'industry_benchmark';

export type FrameworkClassification =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted';

/** The agents a dimension's facts are intended to serve. */
export type FrameworkAgent = 'nexus' | 'sentinel' | 'atlas' | 'tower' | 'steward';

export interface DimensionFieldSpec {
  name: string;
  required: boolean;
}

export interface ContextDimensionSpec {
  /** Stable dimension key (aligns with ContextDimension where one exists). */
  key: string;
  label: string;
  /** Entities a complete load of this dimension must contain. */
  requiredEntities: string[];
  /** Minimum fields per entity. */
  fields: DimensionFieldSpec[];
  allowedSourceTypes: FrameworkSourceType[];
  citationRequired: boolean;
  sourceBasisRequired: boolean;
  confidenceRequired: boolean;
  defaultClassification: FrameworkClassification;
  /**
   * The natural/business key that identifies a logical fact in this dimension,
   * so updates supersede instead of duplicating (WS-B fact identity).
   */
  idempotencyKey: string[];
  /** The agents that consume this dimension. */
  applicableAgents: FrameworkAgent[];
  /**
   * Promotion eligibility: a committed fact in this dimension may become a
   * promotion_candidate only when these governed conditions hold (the runtime
   * gate is promotion-evaluator.ts; this is the per-dimension contract).
   */
  promotionEligibility: {
    requiresSourceBasis: boolean;
    requiresConfidence: boolean;
    requiresProvenance: boolean;
    requiresIndexedOrRetrievable: boolean;
    requiresCiteRender: boolean;
  };
}

const FULL_PROMOTION = {
  requiresSourceBasis: true,
  requiresConfidence: true,
  requiresProvenance: true,
  requiresIndexedOrRetrievable: true,
  requiresCiteRender: true,
} as const;

function dim(spec: Omit<ContextDimensionSpec, 'promotionEligibility'> & {
  promotionEligibility?: ContextDimensionSpec['promotionEligibility'];
}): ContextDimensionSpec {
  return { promotionEligibility: { ...FULL_PROMOTION }, ...spec };
}

/** The 12 canonical context dimensions (client-fillable templates). */
export const CONTEXT_FRAMEWORK_V1: { version: string; dimensions: ContextDimensionSpec[] } = {
  version: CONTEXT_FRAMEWORK_VERSION,
  dimensions: [
    dim({
      key: 'organization_leadership',
      label: 'Organization & Leadership',
      requiredEntities: ['executive', 'reporting_line', 'business_unit'],
      fields: [
        { name: 'name', required: true },
        { name: 'role', required: true },
        { name: 'remit', required: true },
        { name: 'reports_to', required: false },
      ],
      allowedSourceTypes: ['tenant_context', 'structured_fact'],
      citationRequired: true,
      sourceBasisRequired: true,
      confidenceRequired: true,
      defaultClassification: 'internal',
      idempotencyKey: ['tenant_key', 'role', 'name'],
      applicableAgents: ['nexus', 'sentinel', 'atlas'],
    }),
    dim({
      key: 'financials_kpis',
      label: 'Financials & KPIs',
      requiredEntities: ['kpi', 'period', 'baseline'],
      fields: [
        { name: 'metric', required: true },
        { name: 'period', required: true },
        { name: 'value', required: true },
        { name: 'target', required: false },
        { name: 'owner', required: false },
      ],
      allowedSourceTypes: ['kpi_baseline', 'structured_fact'],
      citationRequired: true,
      sourceBasisRequired: true,
      confidenceRequired: true,
      defaultClassification: 'confidential',
      idempotencyKey: ['tenant_key', 'metric', 'period'],
      applicableAgents: ['nexus', 'sentinel', 'tower'],
    }),
    dim({
      key: 'systems_applications',
      label: 'Systems & Applications',
      requiredEntities: ['application', 'platform'],
      fields: [
        { name: 'app_id', required: true },
        { name: 'name', required: true },
        { name: 'category', required: false },
        { name: 'criticality', required: false },
      ],
      allowedSourceTypes: ['tenant_context', 'context_record'],
      citationRequired: true,
      sourceBasisRequired: true,
      confidenceRequired: true,
      defaultClassification: 'internal',
      idempotencyKey: ['tenant_key', 'app_id'],
      applicableAgents: ['nexus', 'sentinel', 'atlas'],
    }),
    dim({
      key: 'cloud_infrastructure',
      label: 'Cloud & Infrastructure',
      requiredEntities: ['environment', 'workload'],
      fields: [
        { name: 'asset_id', required: true },
        { name: 'type', required: true },
        { name: 'hosting', required: false },
      ],
      allowedSourceTypes: ['tenant_context', 'context_record'],
      citationRequired: true,
      sourceBasisRequired: true,
      confidenceRequired: true,
      defaultClassification: 'internal',
      idempotencyKey: ['tenant_key', 'asset_id'],
      applicableAgents: ['nexus', 'sentinel'],
    }),
    dim({
      key: 'vendors_contracts',
      label: 'Vendors & Contracts',
      requiredEntities: ['vendor', 'contract'],
      fields: [
        { name: 'vendor_id', required: true },
        { name: 'vendor_name', required: true },
        { name: 'annual_spend', required: false },
        { name: 'renewal_date', required: false },
        { name: 'exit_terms', required: false },
      ],
      allowedSourceTypes: ['context_record', 'source_event'],
      citationRequired: true,
      sourceBasisRequired: true,
      confidenceRequired: true,
      defaultClassification: 'confidential',
      idempotencyKey: ['tenant_key', 'vendor_id'],
      applicableAgents: ['nexus', 'sentinel', 'tower'],
    }),
    dim({
      key: 'initiatives_moves',
      label: 'Initiatives & Moves',
      requiredEntities: ['initiative'],
      fields: [
        { name: 'initiative_id', required: true },
        { name: 'sponsor', required: true },
        { name: 'status', required: true },
        { name: 'projected_value', required: false },
      ],
      allowedSourceTypes: ['tenant_context', 'artifact'],
      citationRequired: true,
      sourceBasisRequired: true,
      confidenceRequired: true,
      defaultClassification: 'internal',
      idempotencyKey: ['tenant_key', 'initiative_id'],
      applicableAgents: ['nexus', 'tower'],
    }),
    dim({
      key: 'operating_model',
      label: 'Operating Model',
      requiredEntities: ['capability', 'decision_right'],
      fields: [
        { name: 'capability', required: true },
        { name: 'owner', required: false },
      ],
      allowedSourceTypes: ['tenant_context', 'context_record'],
      citationRequired: true,
      sourceBasisRequired: true,
      confidenceRequired: true,
      defaultClassification: 'internal',
      idempotencyKey: ['tenant_key', 'capability'],
      applicableAgents: ['nexus', 'sentinel', 'atlas'],
    }),
    dim({
      key: 'process_workflow',
      label: 'Process & Workflow',
      requiredEntities: ['process', 'step'],
      fields: [
        { name: 'process', required: true },
        { name: 'step', required: false },
      ],
      allowedSourceTypes: ['tenant_context', 'context_record'],
      citationRequired: true,
      sourceBasisRequired: true,
      confidenceRequired: true,
      defaultClassification: 'internal',
      idempotencyKey: ['tenant_key', 'process', 'step'],
      applicableAgents: ['nexus', 'atlas'],
    }),
    dim({
      key: 'risks_controls',
      label: 'Risks & Controls',
      requiredEntities: ['risk', 'control'],
      fields: [
        { name: 'risk_id', required: true },
        { name: 'description', required: true },
        { name: 'control', required: false },
      ],
      allowedSourceTypes: ['corpus_pattern', 'tenant_context'],
      citationRequired: true,
      sourceBasisRequired: true,
      confidenceRequired: true,
      defaultClassification: 'confidential',
      idempotencyKey: ['tenant_key', 'risk_id'],
      applicableAgents: ['sentinel', 'atlas', 'steward'],
    }),
    dim({
      key: 'artifacts_evidence',
      label: 'Artifacts & Evidence',
      requiredEntities: ['artifact'],
      fields: [
        { name: 'artifact_id', required: true },
        { name: 'title', required: true },
        { name: 'source_path', required: true },
      ],
      allowedSourceTypes: ['artifact'],
      citationRequired: true,
      sourceBasisRequired: true,
      confidenceRequired: true,
      defaultClassification: 'confidential',
      idempotencyKey: ['tenant_key', 'artifact_id'],
      applicableAgents: ['nexus', 'sentinel', 'tower'],
    }),
    dim({
      key: 'data_platforms_domains',
      label: 'Data Platforms & Data Domains',
      requiredEntities: ['data_product', 'platform'],
      fields: [
        { name: 'data_product', required: true },
        { name: 'platform', required: false },
        { name: 'owner', required: false },
      ],
      allowedSourceTypes: ['tenant_context', 'context_record'],
      citationRequired: true,
      sourceBasisRequired: true,
      confidenceRequired: true,
      defaultClassification: 'internal',
      idempotencyKey: ['tenant_key', 'data_product'],
      applicableAgents: ['nexus', 'sentinel'],
    }),
    dim({
      key: 'value_ledger_baselines',
      label: 'Value Ledger & Baselines',
      requiredEntities: ['value_line', 'baseline'],
      fields: [
        { name: 'value_line_id', required: true },
        { name: 'projected', required: false },
        { name: 'realized', required: false },
      ],
      allowedSourceTypes: ['kpi_baseline', 'artifact'],
      citationRequired: true,
      sourceBasisRequired: true,
      confidenceRequired: true,
      defaultClassification: 'confidential',
      idempotencyKey: ['tenant_key', 'value_line_id'],
      applicableAgents: ['tower', 'nexus'],
    }),
  ],
};

export function getDimensionSpec(key: string): ContextDimensionSpec | null {
  return CONTEXT_FRAMEWORK_V1.dimensions.find((d) => d.key === key) ?? null;
}

export function listCanonicalDimensions(): string[] {
  return CONTEXT_FRAMEWORK_V1.dimensions.map((d) => d.key);
}

/**
 * ServiceNow CMDB ingest — column + sheet schema.
 *
 * Two sheets:
 *   1. "Configuration Items" — the CI inventory (rows = CIs).
 *   2. "Dependencies"        — the CI relationship graph
 *                              (rows = directed edges between CIs).
 *
 * Two more sheets ship in the template but are documentation, not data:
 *   3. "How to fill"          — a runbook excerpt.
 *   4. "Schema"               — column reference for review tools.
 *
 * Source-of-truth column order matches the ServiceNow export so a customer
 * can paste their Table API dump straight into the template without
 * reshuffling columns.
 */

export const CMDB_SHEET_CIS = 'Configuration Items' as const;
export const CMDB_SHEET_DEPS = 'Dependencies' as const;
export const CMDB_SHEET_HOWTO = 'How to fill' as const;
export const CMDB_SHEET_SCHEMA = 'Schema' as const;

export const CMDB_LIFECYCLE_STATES = [
  'production',
  'pre_production',
  'dev',
  'test',
  'retired',
  'planned',
] as const;
export type CmdbLifecycleState = (typeof CMDB_LIFECYCLE_STATES)[number];

export const CMDB_CRITICALITY_LEVELS = [
  'tier_1',
  'tier_2',
  'tier_3',
  'tier_4',
] as const;
export type CmdbCriticality = (typeof CMDB_CRITICALITY_LEVELS)[number];

export const CMDB_DEPENDENCY_TYPES = [
  'depends_on',
  'runs_on',
  'connects_to',
] as const;
export type CmdbDependencyType = (typeof CMDB_DEPENDENCY_TYPES)[number];

export interface CmdbCiColumn {
  key: keyof CmdbCiRow;
  header: string;
  required: boolean;
  description: string;
  example: string;
}

export interface CmdbDependencyColumn {
  key: keyof CmdbDependencyRow;
  header: string;
  required: boolean;
  description: string;
  example: string;
}

export const CMDB_CI_COLUMNS: ReadonlyArray<CmdbCiColumn> = [
  {
    key: 'ciSysId',
    header: 'ci_sys_id',
    required: true,
    description:
      'ServiceNow sys_id of the CI. Unique. Stable across exports. 32-char hex in production; the template accepts any non-empty string for synthetic data.',
    example: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
  },
  {
    key: 'ciName',
    header: 'ci_name',
    required: true,
    description: 'Human-readable CI name as it appears in the CMDB UI.',
    example: 'pos-checkout-api-prod',
  },
  {
    key: 'ciType',
    header: 'ci_type',
    required: true,
    description:
      'CMDB CI type. Free-form but usually one of: application, database, queue, load_balancer, server, container_cluster.',
    example: 'application',
  },
  {
    key: 'ciClass',
    header: 'ci_class',
    required: true,
    description:
      'ServiceNow cmdb_ci subclass (e.g. cmdb_ci_appl, cmdb_ci_db_instance, cmdb_ci_lb).',
    example: 'cmdb_ci_appl',
  },
  {
    key: 'lifecycleState',
    header: 'lifecycle_state',
    required: true,
    description: `One of ${CMDB_LIFECYCLE_STATES.join(', ')}.`,
    example: 'production',
  },
  {
    key: 'ownerTeam',
    header: 'owner_team',
    required: true,
    description:
      'Owning team. Should match a value present in Tower org / role data for stewardship to flow.',
    example: 'Store Systems',
  },
  {
    key: 'businessService',
    header: 'business_service',
    required: true,
    description:
      'The business service this CI supports. Maps to ServiceNow business_service field.',
    example: 'Point of Sale',
  },
  {
    key: 'criticality',
    header: 'criticality',
    required: true,
    description: `One of ${CMDB_CRITICALITY_LEVELS.join(', ')}. tier_1 = revenue-impacting outage in <15 min.`,
    example: 'tier_1',
  },
  {
    key: 'environment',
    header: 'environment',
    required: true,
    description:
      'Deployment environment. Free-form (prod, stage, dev, dr, etc.) — kept distinct from lifecycle_state, which is the CI lifecycle, not the runtime env.',
    example: 'prod',
  },
];

export const CMDB_DEPENDENCY_COLUMNS: ReadonlyArray<CmdbDependencyColumn> = [
  {
    key: 'sourceCiSysId',
    header: 'source_ci_sys_id',
    required: true,
    description:
      'sys_id of the CI on the FROM side of the relationship. Must reference a row in Configuration Items.',
    example: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
  },
  {
    key: 'targetCiSysId',
    header: 'target_ci_sys_id',
    required: true,
    description:
      'sys_id of the CI on the TO side of the relationship. Must reference a row in Configuration Items.',
    example: 'b2c3d4e5f60718293a4b5c6d7e8f901a',
  },
  {
    key: 'dependencyType',
    header: 'dependency_type',
    required: true,
    description: `One of ${CMDB_DEPENDENCY_TYPES.join(', ')}.`,
    example: 'depends_on',
  },
];

export interface CmdbCiRow {
  ciSysId: string;
  ciName: string;
  ciType: string;
  ciClass: string;
  lifecycleState: CmdbLifecycleState;
  ownerTeam: string;
  businessService: string;
  criticality: CmdbCriticality;
  environment: string;
}

export interface CmdbDependencyRow {
  sourceCiSysId: string;
  targetCiSysId: string;
  dependencyType: CmdbDependencyType;
}

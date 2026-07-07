export type PilotPrivateDataPlaneRowId = 'T353' | 'T354' | 'T355' | 'T356';

export type PilotProvisioningLayer =
  | 'subscription'
  | 'network'
  | 'storage'
  | 'database'
  | 'queue'
  | 'identity'
  | 'secrets'
  | 'observability'
  | 'retrieval'
  | 'runtime';

export type PilotRoleKey = 'tenant_admin' | 'data_uploader' | 'data_reviewer' | 'load_approver' | 'auditor';

export type PilotProcessingServiceDecision =
  | 'approved_for_pilot'
  | 'approved_when_customer_requires'
  | 'deferred_until_day_two'
  | 'not_in_scope';

export interface PilotProvisioningResource {
  layer: PilotProvisioningLayer;
  resource: string;
  purpose: string;
  existingAuthorityPath: string;
  validation: string;
}

export interface PilotSsoRoleMapping {
  role: PilotRoleKey;
  clerkOrgRole: string;
  entraGroupClaim: string;
  allowedActions: readonly string[];
  deniedActions: readonly string[];
  validation: string;
}

export interface PilotRunbookStage {
  sequence: number;
  stage: string;
  owner: string;
  entryCriteria: string;
  exitEvidence: string;
}

export interface PilotProcessingService {
  service: string;
  decision: PilotProcessingServiceDecision;
  reason: string;
  existingAuthorityPath: string;
}

export interface PilotPrivateDataPlaneRunbook {
  releaseRows: readonly PilotPrivateDataPlaneRowId[];
  provisioning: readonly PilotProvisioningResource[];
  ssoRoleMappings: readonly PilotSsoRoleMapping[];
  rehearsalStages: readonly PilotRunbookStage[];
  processingServices: readonly PilotProcessingService[];
}

export const PILOT_PRIVATE_DATA_PLANE_RUNBOOK: PilotPrivateDataPlaneRunbook = {
  releaseRows: ['T353', 'T354', 'T355', 'T356'],
  provisioning: [
    {
      layer: 'subscription',
      resource: 'Pilot private data-plane subscription or dedicated resource group',
      purpose: 'Holds customer-scoped resources away from shared demo/control-plane fixtures.',
      existingAuthorityPath: 'docs/architecture/azure/PILOT-PRIVATE-DATA-LANE-RUNBOOK-2026-05-22.md',
      validation: 'Azure resource parity check includes the lane resource group and required tags.',
    },
    {
      layer: 'network',
      resource: 'Private VNet, app/data/private-endpoint subnets, and private DNS zones',
      purpose: 'Keeps Postgres, Blob, Key Vault, Service Bus, and Search traffic off public data paths.',
      existingAuthorityPath: 'infra/azure/foundation.bicep',
      validation: 'Connectivity smoke runs from a VNet-connected Container Apps job.',
    },
    {
      layer: 'storage',
      resource: 'Tenant-scoped Blob containers for landing, quarantine, processed, and evidence artifacts',
      purpose: 'Separates raw uploads from quarantined, parsed, and approved evidence outputs.',
      existingAuthorityPath: 'infra/azure/storage-event-ingestion.bicep',
      validation: 'Storage account denies public access and Event Grid emits only metadata events.',
    },
    {
      layer: 'database',
      resource: 'Private Azure Postgres tenant data lane',
      purpose: 'Stores ingestion manifests, upload runs, approvals, commits, and tenant substrate tables.',
      existingAuthorityPath: 'infra/azure/postgres-foundation.bicep',
      validation: 'Schema verifier and tenant parity checks pass from inside the VNet.',
    },
    {
      layer: 'queue',
      resource: 'Service Bus namespace and q-context-ingestion-events queue',
      purpose: 'Provides durable ingestion handoff from Blob/Event Grid to worker processing.',
      existingAuthorityPath: 'infra/azure/event-ingestion-foundation.bicep',
      validation: 'DLQ drill and mixed-batch evidence tests show retry/dead-letter behavior.',
    },
    {
      layer: 'identity',
      resource: 'Managed identities with scoped RBAC',
      purpose: 'Gives workers least-privilege access to specific containers, queues, secrets, and indexes.',
      existingAuthorityPath: 'infra/azure/storage-rbac.bicep',
      validation: 'RBAC audit proves no broad Owner/Contributor grants are required for runtime.',
    },
    {
      layer: 'secrets',
      resource: 'Key Vault with RBAC, purge protection, private endpoint, and rotation schedule',
      purpose: 'Stores Postgres URLs, queue endpoints, health tokens, signing/verification keys, and provider settings.',
      existingAuthorityPath: 'infra/azure/keyvault-postgres-secrets.bicep',
      validation: 'Secret projection smoke confirms the app/job reads secrets without printing them.',
    },
    {
      layer: 'observability',
      resource: 'Log Analytics, Application Insights, action group, and cost tags',
      purpose: 'Captures queue failures, parse failures, retry storms, long jobs, and spend guardrails.',
      existingAuthorityPath: 'infra/azure/observability.bicep',
      validation: 'Observability audit passes with alert destinations and tenant/lane tags present.',
    },
    {
      layer: 'retrieval',
      resource: 'Azure AI Search service or tenant-partitioned indexes',
      purpose: 'Hosts approved evidence/search indexes after template validation and commit.',
      existingAuthorityPath: 'infra/azure/search-foundation.bicep',
      validation: 'Index contract tests prove tenant key, source locator, sensitivity, and freshness fields.',
    },
    {
      layer: 'runtime',
      resource: 'Container Apps jobs for migrations, copy, smokes, and ingestion worker',
      purpose: 'Executes privileged data-plane jobs from inside the private network boundary.',
      existingAuthorityPath: 'infra/azure/ingestion-worker-foundation.bicep',
      validation: 'Job run evidence records command, image digest, status, and log location.',
    },
  ],
  ssoRoleMappings: [
    {
      role: 'tenant_admin',
      clerkOrgRole: 'org:admin',
      entraGroupClaim: 'abarva-pilot-admins',
      allowedActions: ['manage users', 'configure SSO', 'approve load policy', 'export audit history'],
      deniedActions: ['bypass quarantine', 'edit another tenant'],
      validation: 'Admin can access /admin/setup and Users & Access; cross-tenant clientId mutation returns 403.',
    },
    {
      role: 'data_uploader',
      clerkOrgRole: 'org:data_uploader',
      entraGroupClaim: 'abarva-pilot-uploaders',
      allowedActions: ['upload files', 'view own upload runs', 'respond to clarification requests'],
      deniedActions: ['approve commits', 'change role policy', 'export full audit history'],
      validation: 'Uploader can create upload run but cannot commit a load batch.',
    },
    {
      role: 'data_reviewer',
      clerkOrgRole: 'org:data_reviewer',
      entraGroupClaim: 'abarva-pilot-reviewers',
      allowedActions: ['review parsed preview', 'resolve schema anomalies', 'mark rows usable or blocked'],
      deniedActions: ['upload new files without uploader role', 'final-approve commits'],
      validation: 'Reviewer can resolve clarifications but cannot write load_commit rows.',
    },
    {
      role: 'load_approver',
      clerkOrgRole: 'org:load_approver',
      entraGroupClaim: 'abarva-pilot-load-approvers',
      allowedActions: ['approve preview-before-commit', 'reject load batch', 'trigger rollback request'],
      deniedActions: ['edit raw file bytes', 'bypass malware or PHI/PII scanning'],
      validation: 'Approver signs the commit decision and every commit carries approver identity.',
    },
    {
      role: 'auditor',
      clerkOrgRole: 'org:auditor',
      entraGroupClaim: 'abarva-pilot-auditors',
      allowedActions: ['read audit ledger', 'export audit pack', 'view policy decisions'],
      deniedActions: ['upload files', 'approve commits', 'alter mappings'],
      validation: 'Auditor sees immutable history but no mutation controls.',
    },
  ],
  rehearsalStages: [
    {
      sequence: 1,
      stage: 'SSO sign-in and tenant resolution',
      owner: 'Setup admin',
      entryCriteria: 'Clerk organization, Entra group claim, and tenant row are configured.',
      exitEvidence: 'Authenticated session resolves exactly one clientId and client key.',
    },
    {
      sequence: 2,
      stage: 'Upload consent and data-use attestation',
      owner: 'Tenant admin',
      entryCriteria: 'Uploader has allowed role and accepts prohibited-data policy.',
      exitEvidence: 'Upload run records attestation version, user id, tenant id, and timestamp.',
    },
    {
      sequence: 3,
      stage: 'Private landing-zone upload',
      owner: 'Data uploader',
      entryCriteria: 'Blob container, queue, and managed identity RBAC are deployed.',
      exitEvidence: 'Blob-created event normalizes to abarva.ingestion.v1 queue message.',
    },
    {
      sequence: 4,
      stage: 'Malware and sensitive-data quarantine',
      owner: 'Ingestion worker',
      entryCriteria: 'File bytes are available inside private lane and scan policy is active.',
      exitEvidence: 'Run is allowed, quarantined, or rejected before parsing/indexing.',
    },
    {
      sequence: 5,
      stage: 'Template mapping and schema anomaly review',
      owner: 'Data reviewer',
      entryCriteria: 'Template version and mapping profile are selected.',
      exitEvidence: 'Unmapped columns, missing fields, and low-confidence rows are resolved or explicitly waived.',
    },
    {
      sequence: 6,
      stage: 'Preview-before-commit approval',
      owner: 'Load approver',
      entryCriteria: 'Parsed preview, validation findings, and quality score are available.',
      exitEvidence: 'Approver accepts, rejects, or sends the batch back for clarification.',
    },
    {
      sequence: 7,
      stage: 'Commit, notify, and audit export',
      owner: 'Setup admin',
      entryCriteria: 'Approval exists and idempotency key has not already committed.',
      exitEvidence: 'Load commit is written, subscribers are notified, and audit export includes the run.',
    },
    {
      sequence: 8,
      stage: 'Source/Moves/Tower output smoke',
      owner: 'AbarVa QA',
      entryCriteria: 'Committed rows are available to approved retrieval and reasoning surfaces.',
      exitEvidence: 'Outputs cite tenant evidence, disclose gaps, and never show another client name or data.',
    },
  ],
  processingServices: [
    {
      service: 'Azure Blob Storage + Event Grid',
      decision: 'approved_for_pilot',
      reason: 'Blob-created events provide the cleanest handoff from private landing zone to durable ingestion queue.',
      existingAuthorityPath: 'infra/azure/storage-event-ingestion.bicep',
    },
    {
      service: 'Azure Service Bus',
      decision: 'approved_for_pilot',
      reason: 'Queue retry, DLQ, and mixed-batch drills already match the ingestion consumer contract.',
      existingAuthorityPath: 'infra/azure/event-ingestion-foundation.bicep',
    },
    {
      service: 'Azure Container Apps jobs',
      decision: 'approved_for_pilot',
      reason: 'Jobs run inside the VNet and already support migration, copy, smoke, and worker execution patterns.',
      existingAuthorityPath: 'infra/azure/ingestion-worker-foundation.bicep',
    },
    {
      service: 'Azure Functions',
      decision: 'approved_when_customer_requires',
      reason: 'Functions can host queue-trigger processing, but Container Apps jobs are the default for this repo lane.',
      existingAuthorityPath: 'src/lib/ingestion/azure-landing-zone-consumer.ts',
    },
    {
      service: 'Azure Document Intelligence',
      decision: 'deferred_until_day_two',
      reason: 'Useful for unstructured PDFs/forms after consent, malware scanning, and raw-file retention policy are complete.',
      existingAuthorityPath: 'docs/security/B5b-PURVIEW-INTEGRATION-DESIGN.md',
    },
    {
      service: 'Azure AI Search',
      decision: 'approved_for_pilot',
      reason: 'Approved committed evidence can be indexed with tenant, sensitivity, provenance, and freshness fields.',
      existingAuthorityPath: 'infra/azure/search-foundation.bicep',
    },
    {
      service: 'Microsoft Purview',
      decision: 'approved_when_customer_requires',
      reason: 'Purview labels and lifecycle persistence are available for regulated customers, but not mandatory for first pilot rehearsal.',
      existingAuthorityPath: 'docs/architecture/azure/AZLAB41-l10-purview-label-lifecycle-persistence.md',
    },
  ],
} as const;

export function getPilotPrivateDataPlaneRunbook(): PilotPrivateDataPlaneRunbook {
  return PILOT_PRIVATE_DATA_PLANE_RUNBOOK;
}

export function getPilotPrivateDataPlaneRows(): readonly PilotPrivateDataPlaneRowId[] {
  return PILOT_PRIVATE_DATA_PLANE_RUNBOOK.releaseRows;
}

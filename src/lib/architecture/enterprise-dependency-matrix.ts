// CLOUD6 - Enterprise Dependency Matrix.
//
// Deterministic, file-pure read model that maps the canonical AbarVa
// dependency capabilities (frontend hosting, compute, postgres, blob,
// secrets, IdP, observability, vector search, graph, model gateway,
// CI/CD) across the five canonical deployment targets (Vercel SaaS,
// Azure VNet, GCP VPC, AWS Private, On-Prem Air-Gapped).
//
// CLOUD6 is a *read model*. It does not provision, deploy, call any
// cloud SDK, authenticate, run migrations, or invoke a model provider.
// It exists so the founder, reviewers, and forward provisioning code
// can agree on the same shape of "what is available where today".
//
// Hard rules (also asserted by the test):
//   - No `Date.now`, `Math.random`, `new Date(`, `fetch(`.
//   - No imports from `@/lib/auth/**`, `@/lib/source/**`,
//     `@/lib/sentinel/**`, `@/lib/atlas/**`, `@/lib/nexus/**`,
//     `@/lib/agent/**`, or any supabase client.
//   - No vendor model name (`anthropic`, `openai`, etc.) appears.
//   - No false claim that any combination is production-ready.

// ---------------------------------------------------------------------
// Canonical deployment targets.
// ---------------------------------------------------------------------

export const DEPLOYMENT_TARGETS = [
  'vercel_saas',
  'azure_vnet',
  'gcp_vpc',
  'aws_private',
  'on_prem_air_gapped',
] as const;

export type DeploymentTarget = (typeof DEPLOYMENT_TARGETS)[number];

// ---------------------------------------------------------------------
// Canonical dependency capabilities.
// ---------------------------------------------------------------------

export const DEPENDENCY_CAPABILITIES = [
  'frontend_hosting',
  'compute',
  'postgres',
  'blob',
  'secrets',
  'idp',
  'observability',
  'vector_search',
  'graph',
  'model_gateway',
  'ci_cd',
] as const;

export type DependencyCapability = (typeof DEPENDENCY_CAPABILITIES)[number];

// ---------------------------------------------------------------------
// Canonical readiness states.
// ---------------------------------------------------------------------

export const DEPENDENCY_READINESS_STATES = [
  'available',
  'preview',
  'deferred',
  'not_supported',
] as const;

export type DependencyReadiness = (typeof DEPENDENCY_READINESS_STATES)[number];

// ---------------------------------------------------------------------
// Typed shapes.
// ---------------------------------------------------------------------

export interface DependencyMatrixEntry {
  /** Canonical capability axis. */
  capability: DependencyCapability;
  /** Canonical deployment target axis. */
  target: DeploymentTarget;
  /** Stable id (capability + target bound). */
  id: string;
  /** Human-facing label. */
  label: string;
  /** Generic option name today (no vendor SDK keys, no GUIDs). */
  defaultOption: string;
  /** Fallback option if the default is not commercially viable. */
  fallbackOption: string;
  /** Readiness today. */
  readiness: DependencyReadiness;
  /** What the entry promises in plain language. */
  notes: string;
  /** Dependency or follow-up work required to graduate readiness. */
  followUp: string;
  /** Stable provenance tag. */
  createdFrom: 'deterministic_enterprise_dependency_matrix_seed';
}

export interface EnterpriseDependencyMatrix {
  entries: readonly DependencyMatrixEntry[];
  createdFrom: 'deterministic_enterprise_dependency_matrix_seed';
}

export interface DependencyMatrixSummary {
  totalEntries: number;
  entriesByTarget: Record<DeploymentTarget, number>;
  entriesByCapability: Record<DependencyCapability, number>;
  entriesByReadiness: Record<DependencyReadiness, number>;
  capabilitiesCovered: readonly DependencyCapability[];
  targetsCovered: readonly DeploymentTarget[];
  notSupportedCount: number;
}

// ---------------------------------------------------------------------
// Helpers used by the seed.
// ---------------------------------------------------------------------

function entryId(
  capability: DependencyCapability,
  target: DeploymentTarget,
): string {
  return `matrix-${capability}-${target}`;
}

interface CapabilityRow {
  capability: DependencyCapability;
  label: string;
  perTarget: Record<
    DeploymentTarget,
    {
      defaultOption: string;
      fallbackOption: string;
      readiness: DependencyReadiness;
      notes: string;
      followUp: string;
    }
  >;
}

// ---------------------------------------------------------------------
// Seed rows (one per capability, with per-target cell content).
// ---------------------------------------------------------------------

const ROW_FRONTEND_HOSTING: CapabilityRow = {
  capability: 'frontend_hosting',
  label: 'Frontend hosting',
  perTarget: {
    vercel_saas: {
      defaultOption: 'AbarVa-owned Vercel project (Edge / Node functions)',
      fallbackOption: 'Vercel preview environments per branch',
      readiness: 'available',
      notes:
        'Tier 1 SaaS surface; Edge runtime renders Programs, Tower, Intelligence, Admin, and Source surfaces today.',
      followUp:
        'Production deploy gate remains under PROD1 / PROD4 founder approval before any readiness promotion to production_deployment.',
    },
    azure_vnet: {
      defaultOption: 'Azure Container Apps managed environment in a private VNet',
      fallbackOption: 'Azure App Service with VNet integration',
      readiness: 'preview',
      notes:
        'CLOUD2 documents the lab path; CLOUD5 ships the Bicep starter for a private-VNet Container Apps environment.',
      followUp:
        'IaC starter must complete a customer-side dry-run; az deployment group what-if before any pilot promotion.',
    },
    gcp_vpc: {
      defaultOption: 'GCP Cloud Run inside a VPC with Serverless VPC Access',
      fallbackOption: 'GKE Autopilot in a private VPC',
      readiness: 'deferred',
      notes:
        'CLOUD3 forward slice will land the GCP VPC lab blueprint; no IaC starter is committed yet.',
      followUp:
        'Author CLOUD3 lab blueprint and a parallel GCP IaC starter before any pilot promotion.',
    },
    aws_private: {
      defaultOption: 'AWS App Runner / Fargate behind a private ALB in a VPC',
      fallbackOption: 'EKS managed node group inside a private VPC',
      readiness: 'deferred',
      notes:
        'Forward slice; no AWS lab blueprint or IaC starter exists today.',
      followUp:
        'Author the AWS private deployment blueprint slice and a parallel AWS IaC starter.',
    },
    on_prem_air_gapped: {
      defaultOption: 'Customer-operated Kubernetes cluster running the AbarVa container image',
      fallbackOption: 'Customer-operated docker-compose lab on a hardened VM',
      readiness: 'deferred',
      notes:
        'CLOUD3 (docker runtime packaging) and CLOUD4 (local private deployment lab) cover the container artifact; air-gapped runbook remains forward.',
      followUp:
        'Author the air-gapped operator runbook and a packaging manifest for offline image transfer.',
    },
  },
};

const ROW_COMPUTE: CapabilityRow = {
  capability: 'compute',
  label: 'Application compute',
  perTarget: {
    vercel_saas: {
      defaultOption: 'Vercel Functions (Node / Edge runtimes) on AbarVa-owned project',
      fallbackOption: 'Vercel cron functions for scheduled work',
      readiness: 'available',
      notes:
        'Today\'s SaaS runtime; agent loops and surfaces execute through Vercel Functions.',
      followUp:
        'Long-running agent jobs and workflow durability remain under separate roadmap (no live durable execution claim).',
    },
    azure_vnet: {
      defaultOption: 'Azure Container Apps with managed identity inside a private VNet',
      fallbackOption: 'Azure Kubernetes Service node pool inside the VNet',
      readiness: 'preview',
      notes:
        'CLOUD5 Bicep starter declares the Container Apps environment shape; no live deployment is performed.',
      followUp:
        'Customer-side dry-run + image hardening must complete before any pilot promotion.',
    },
    gcp_vpc: {
      defaultOption: 'GCP Cloud Run service in a private VPC',
      fallbackOption: 'GKE Autopilot workload running the AbarVa container',
      readiness: 'deferred',
      notes:
        'GCP lab path is forward-only under CLOUD3; no IaC starter is committed.',
      followUp:
        'Author the GCP IaC starter and a tear-down runbook before any pilot promotion.',
    },
    aws_private: {
      defaultOption: 'AWS Fargate task in a private VPC fronted by an internal ALB',
      fallbackOption: 'EKS managed node group running the AbarVa container',
      readiness: 'deferred',
      notes:
        'AWS lab path is forward-only; no blueprint or IaC starter exists.',
      followUp:
        'Author the AWS deployment blueprint and IaC starter.',
    },
    on_prem_air_gapped: {
      defaultOption: 'Customer-operated Kubernetes node pool running the AbarVa container image',
      fallbackOption: 'Customer-operated container host with the AbarVa runtime image',
      readiness: 'deferred',
      notes:
        'Compute path mirrors the container image shipped under CLOUD3; air-gapped operator runbook is forward.',
      followUp:
        'Document the air-gapped operator runbook and an offline image transfer path.',
    },
  },
};

const ROW_POSTGRES: CapabilityRow = {
  capability: 'postgres',
  label: 'Operational Postgres',
  perTarget: {
    vercel_saas: {
      defaultOption: 'AbarVa-owned managed Postgres pool with row-level security',
      fallbackOption: 'AbarVa-owned managed Postgres with schema-per-tenant',
      readiness: 'available',
      notes:
        'Tier 1 SaaS data plane; tenant isolation is enforced via tenant-scoped read models per TEN1 / TEN2.',
      followUp:
        'TEN3 dedicated-tenant blueprint covers per-tenant Postgres for Tier 2 onboarding.',
    },
    azure_vnet: {
      defaultOption: 'Azure Database for PostgreSQL Flexible Server inside the VNet via private endpoint',
      fallbackOption: 'Self-hosted Postgres on a private VM as a stop-gap',
      readiness: 'preview',
      notes:
        'CLOUD5 Bicep starter declares the Postgres Flexible Server shape; password is sourced from Key Vault at deploy time.',
      followUp:
        'Customer-side dry-run plus restore test must complete before any pilot promotion.',
    },
    gcp_vpc: {
      defaultOption: 'GCP Cloud SQL for PostgreSQL with private IP only',
      fallbackOption: 'AlloyDB for PostgreSQL on a private VPC',
      readiness: 'deferred',
      notes:
        'GCP lab path is forward; no IaC starter for Cloud SQL exists yet.',
      followUp:
        'Author a Cloud SQL private-IP IaC starter that mirrors the CLOUD5 shape.',
    },
    aws_private: {
      defaultOption: 'AWS RDS for PostgreSQL inside a private VPC',
      fallbackOption: 'Aurora PostgreSQL with a private subnet group',
      readiness: 'deferred',
      notes:
        'AWS lab path is forward; no blueprint or IaC starter exists.',
      followUp:
        'Author an RDS private-VPC IaC starter that mirrors the CLOUD5 shape.',
    },
    on_prem_air_gapped: {
      defaultOption: 'Customer-operated Postgres cluster on hardened VMs',
      fallbackOption: 'Customer-operated Postgres in a managed Kubernetes operator',
      readiness: 'deferred',
      notes:
        'Air-gapped customers operate Postgres themselves; AbarVa documents the schema and migration runbook only.',
      followUp:
        'Author the air-gapped Postgres operator runbook and a backup / restore checklist.',
    },
  },
};

const ROW_BLOB: CapabilityRow = {
  capability: 'blob',
  label: 'Object storage',
  perTarget: {
    vercel_saas: {
      defaultOption: 'AbarVa-owned managed blob bucket bound to the SaaS project',
      fallbackOption: 'AbarVa-owned managed blob with per-tenant prefix',
      readiness: 'available',
      notes:
        'Tier 1 SaaS storage plane; signed URLs are tenant-scoped at the application layer.',
      followUp:
        'Tier 2 onboarding moves to per-tenant buckets per TEN3 dedicated-tenant blueprint.',
    },
    azure_vnet: {
      defaultOption: 'Azure Storage Account with private endpoint and public network access disabled',
      fallbackOption: 'Azure Storage Account with managed identity and firewall rules',
      readiness: 'preview',
      notes:
        'CLOUD5 Bicep starter declares the Storage Account shape; no live data is written.',
      followUp:
        'Customer-side dry-run plus signed-URL scope test must complete before any pilot promotion.',
    },
    gcp_vpc: {
      defaultOption: 'GCS bucket with VPC Service Controls and uniform bucket-level access',
      fallbackOption: 'GCS bucket with private Service Connect access',
      readiness: 'deferred',
      notes:
        'GCP lab path is forward; no IaC starter for GCS exists yet.',
      followUp:
        'Author a GCS private-access IaC starter mirroring CLOUD5 shape.',
    },
    aws_private: {
      defaultOption: 'AWS S3 bucket accessed only through a VPC endpoint with bucket policy enforcement',
      fallbackOption: 'AWS S3 bucket with KMS-managed keys and a private ALB-fronted gateway',
      readiness: 'deferred',
      notes:
        'AWS lab path is forward; no IaC starter for S3 exists yet.',
      followUp:
        'Author an S3 VPC-endpoint IaC starter mirroring CLOUD5 shape.',
    },
    on_prem_air_gapped: {
      defaultOption: 'Customer-operated S3-compatible object store (e.g., MinIO) on hardened VMs',
      fallbackOption: 'Customer-operated CIFS / NFS share for artifact retention',
      readiness: 'deferred',
      notes:
        'Air-gapped customers operate object storage themselves; AbarVa documents the artifact contract only.',
      followUp:
        'Author the air-gapped object-storage operator runbook.',
    },
  },
};

const ROW_SECRETS: CapabilityRow = {
  capability: 'secrets',
  label: 'Secret management',
  perTarget: {
    vercel_saas: {
      defaultOption: 'Vercel Project Environment Variables encrypted at rest',
      fallbackOption: 'Vercel Encrypted Environment Variables per environment',
      readiness: 'available',
      notes:
        'Tier 1 SaaS secret plane; gateway routing keys, IdP secrets, and storage credentials live here.',
      followUp:
        'Per-tenant secret rotation cadence is documented under TEN3; live rotation tooling is forward.',
    },
    azure_vnet: {
      defaultOption: 'Azure Key Vault with private endpoint and managed-identity access',
      fallbackOption: 'Azure Key Vault with firewall rules and a tenant-bound app role',
      readiness: 'preview',
      notes:
        'CLOUD5 Bicep starter declares the Key Vault shape; Postgres password is referenced from Key Vault at deploy time.',
      followUp:
        'Customer-side dry-run plus rotation runbook must complete before any pilot promotion.',
    },
    gcp_vpc: {
      defaultOption: 'GCP Secret Manager with VPC Service Controls and per-secret IAM',
      fallbackOption: 'GCP Secret Manager bound to a workload-identity service account',
      readiness: 'deferred',
      notes:
        'GCP lab path is forward; no IaC starter exists yet.',
      followUp:
        'Author a Secret Manager IaC starter mirroring CLOUD5 shape.',
    },
    aws_private: {
      defaultOption: 'AWS Secrets Manager with VPC endpoint and KMS-managed keys',
      fallbackOption: 'AWS Systems Manager Parameter Store with KMS encryption',
      readiness: 'deferred',
      notes:
        'AWS lab path is forward; no IaC starter exists yet.',
      followUp:
        'Author a Secrets Manager IaC starter mirroring CLOUD5 shape.',
    },
    on_prem_air_gapped: {
      defaultOption: 'Customer-operated HashiCorp Vault on hardened VMs',
      fallbackOption: 'Customer-operated sealed-secrets controller in Kubernetes',
      readiness: 'deferred',
      notes:
        'Air-gapped customers operate the secret store themselves; AbarVa documents the secret contract only.',
      followUp:
        'Author the air-gapped secret-rotation operator runbook.',
    },
  },
};

const ROW_IDP: CapabilityRow = {
  capability: 'idp',
  label: 'Identity provider / SSO',
  perTarget: {
    vercel_saas: {
      defaultOption: 'AbarVa-owned Clerk tenant with org-aware sign-in',
      fallbackOption: 'AbarVa-owned Clerk tenant with email + OTP fallback',
      readiness: 'available',
      notes:
        'Tier 1 SaaS identity plane; Clerk org id maps onto the AbarVa tenant key.',
      followUp:
        'Tier 2 onboarding wires the customer IdP per TEN3 onboarding sequence; live federation tooling is forward.',
    },
    azure_vnet: {
      defaultOption: 'Microsoft Entra ID (SAML / OIDC) federated to the customer Clerk tenant',
      fallbackOption: 'Microsoft Entra ID with B2B guest invitations during pilot',
      readiness: 'preview',
      notes:
        'TEN3 documents the SSO wire-up step; no live federation runner is committed.',
      followUp:
        'Author the Entra ID federation runbook and a deterministic SSO smoke test.',
    },
    gcp_vpc: {
      defaultOption: 'Google Workspace SAML federated to the customer Clerk tenant',
      fallbackOption: 'Google Cloud Identity OIDC federation',
      readiness: 'deferred',
      notes:
        'GCP federation runbook is forward; no automation exists.',
      followUp:
        'Author the Workspace federation runbook.',
    },
    aws_private: {
      defaultOption: 'AWS IAM Identity Center (SSO) federated to the customer Clerk tenant',
      fallbackOption: 'Customer Okta tenant federated via SAML',
      readiness: 'deferred',
      notes:
        'AWS federation runbook is forward; no automation exists.',
      followUp:
        'Author the IAM Identity Center federation runbook.',
    },
    on_prem_air_gapped: {
      defaultOption: 'Customer-operated Keycloak (OIDC / SAML) federated to AbarVa runtime',
      fallbackOption: 'Customer-operated LDAP bridge to AbarVa identity claims',
      readiness: 'deferred',
      notes:
        'Air-gapped IdP federation is customer-operated; AbarVa documents the claim contract only.',
      followUp:
        'Author the air-gapped IdP federation operator runbook.',
    },
  },
};

const ROW_OBSERVABILITY: CapabilityRow = {
  capability: 'observability',
  label: 'Observability (logs / metrics / traces)',
  perTarget: {
    vercel_saas: {
      defaultOption: 'Vercel runtime logs plus AbarVa-owned PostHog project for product analytics',
      fallbackOption: 'Vercel build / function logs streamed to a managed log lane',
      readiness: 'preview',
      notes:
        'Live log streaming and trace ingestion are scaffolded; no production observability gate is wired.',
      followUp:
        'PROD4 must add secure ingestion behind server-side tokens before any readiness promotion to production_deployment.',
    },
    azure_vnet: {
      defaultOption: 'Azure Log Analytics workspace bound to the Container Apps environment',
      fallbackOption: 'Azure Monitor with Application Insights bound to the Container App',
      readiness: 'preview',
      notes:
        'CLOUD5 Bicep starter declares the Log Analytics workspace; no live ingestion is performed.',
      followUp:
        'Customer-side dry-run plus a deterministic log shape contract must land before any pilot promotion.',
    },
    gcp_vpc: {
      defaultOption: 'GCP Cloud Logging plus Cloud Monitoring scoped to the project',
      fallbackOption: 'GCP Cloud Trace bound to the Cloud Run service',
      readiness: 'deferred',
      notes:
        'GCP lab path is forward; no IaC starter exists.',
      followUp:
        'Author a Cloud Logging IaC starter mirroring CLOUD5 shape.',
    },
    aws_private: {
      defaultOption: 'AWS CloudWatch Logs plus CloudWatch Metrics scoped to the VPC',
      fallbackOption: 'AWS X-Ray traces bound to the Fargate task',
      readiness: 'deferred',
      notes:
        'AWS lab path is forward; no IaC starter exists.',
      followUp:
        'Author a CloudWatch IaC starter mirroring CLOUD5 shape.',
    },
    on_prem_air_gapped: {
      defaultOption: 'Customer-operated Loki + Prometheus + Grafana stack',
      fallbackOption: 'Customer-operated OpenSearch + filebeat ingestion path',
      readiness: 'deferred',
      notes:
        'Air-gapped observability is customer-operated; AbarVa documents the log shape contract only.',
      followUp:
        'Author the air-gapped observability operator runbook.',
    },
  },
};

const ROW_VECTOR: CapabilityRow = {
  capability: 'vector_search',
  label: 'Vector search index',
  perTarget: {
    vercel_saas: {
      defaultOption: 'AbarVa-owned managed pgvector index inside the SaaS Postgres pool',
      fallbackOption: 'AbarVa-owned managed pgvector index with per-tenant namespace filter',
      readiness: 'preview',
      notes:
        'Vector retrieval helpers are scaffolded; live retrieval is not yet wired into agent loops.',
      followUp:
        'Wire the retrieval contract into the unified context builder behind a deterministic shim.',
    },
    azure_vnet: {
      defaultOption: 'pgvector extension in the per-tenant Azure Postgres Flexible Server',
      fallbackOption: 'Azure AI Search index inside the VNet via private endpoint',
      readiness: 'deferred',
      notes:
        'No vector IaC starter is committed for Azure today.',
      followUp:
        'Document the per-tenant pgvector enablement runbook for the CLOUD5 starter.',
    },
    gcp_vpc: {
      defaultOption: 'pgvector extension in the per-tenant Cloud SQL Postgres',
      fallbackOption: 'GCP Vertex AI Vector Search inside a VPC',
      readiness: 'deferred',
      notes:
        'GCP vector path is forward; no IaC starter exists.',
      followUp:
        'Author a Cloud SQL pgvector IaC starter when CLOUD3 lands.',
    },
    aws_private: {
      defaultOption: 'pgvector extension in the per-tenant RDS Postgres',
      fallbackOption: 'AWS OpenSearch Serverless with k-NN inside the VPC',
      readiness: 'deferred',
      notes:
        'AWS vector path is forward; no IaC starter exists.',
      followUp:
        'Author an RDS pgvector IaC starter when the AWS blueprint lands.',
    },
    on_prem_air_gapped: {
      defaultOption: 'pgvector extension in the customer-operated Postgres cluster',
      fallbackOption: 'Customer-operated Qdrant / Milvus instance on hardened VMs',
      readiness: 'deferred',
      notes:
        'Air-gapped vector path is customer-operated; AbarVa documents the retrieval contract only.',
      followUp:
        'Author the air-gapped vector operator runbook.',
    },
  },
};

const ROW_GRAPH: CapabilityRow = {
  capability: 'graph',
  label: 'Knowledge graph index',
  perTarget: {
    vercel_saas: {
      defaultOption: 'Postgres-backed graph tables with tenant-scoped traversal helpers',
      fallbackOption: 'Postgres recursive CTE traversal with a tenant predicate',
      readiness: 'preview',
      notes:
        'Knowledge fabric graph helpers are scaffolded; no live traversal is wired into agent loops.',
      followUp:
        'Wire the traversal contract into the unified context builder behind a deterministic shim.',
    },
    azure_vnet: {
      defaultOption: 'Postgres-backed graph tables in the per-tenant Azure Postgres',
      fallbackOption: 'Azure Cosmos DB for Apache Gremlin inside the VNet',
      readiness: 'deferred',
      notes:
        'No graph IaC starter is committed for Azure today.',
      followUp:
        'Document the per-tenant graph-table enablement runbook for the CLOUD5 starter.',
    },
    gcp_vpc: {
      defaultOption: 'Postgres-backed graph tables in the per-tenant Cloud SQL',
      fallbackOption: 'GCP Spanner graph queries inside a VPC',
      readiness: 'deferred',
      notes:
        'GCP graph path is forward; no IaC starter exists.',
      followUp:
        'Author a Cloud SQL graph IaC starter when CLOUD3 lands.',
    },
    aws_private: {
      defaultOption: 'Postgres-backed graph tables in the per-tenant RDS Postgres',
      fallbackOption: 'AWS Neptune cluster inside the VPC',
      readiness: 'deferred',
      notes:
        'AWS graph path is forward; no IaC starter exists.',
      followUp:
        'Author an RDS graph IaC starter when the AWS blueprint lands.',
    },
    on_prem_air_gapped: {
      defaultOption: 'Postgres-backed graph tables in the customer-operated Postgres cluster',
      fallbackOption: 'Customer-operated Neo4j / JanusGraph instance on hardened VMs',
      readiness: 'deferred',
      notes:
        'Air-gapped graph path is customer-operated; AbarVa documents the traversal contract only.',
      followUp:
        'Author the air-gapped graph operator runbook.',
    },
  },
};

const ROW_MODEL_GATEWAY: CapabilityRow = {
  capability: 'model_gateway',
  label: 'Model gateway',
  perTarget: {
    vercel_saas: {
      defaultOption: 'AbarVa-owned model gateway with per-tenant routing keys and audit destination',
      fallbackOption: 'AbarVa-owned gateway with row-scoped audit ledger and tenant-scoped allowlist',
      readiness: 'preview',
      notes:
        'MG2 / MG3 contract is in place; live gateway invocations are scaffolded behind a deterministic shim.',
      followUp:
        'Production rollout requires PROD4 secure ingestion and a per-tenant policy registry; no readiness promotion to production_deployment yet.',
    },
    azure_vnet: {
      defaultOption: 'Customer-hosted gateway image inside the Container Apps environment with per-tenant policy',
      fallbackOption: 'Azure API Management as a gateway proxy with managed-identity outbound',
      readiness: 'deferred',
      notes:
        'No customer-hosted gateway IaC is committed today.',
      followUp:
        'Document the customer-hosted gateway runbook for the CLOUD5 starter.',
    },
    gcp_vpc: {
      defaultOption: 'Customer-hosted gateway image inside Cloud Run with per-tenant policy',
      fallbackOption: 'GCP API Gateway as a proxy with VPC egress control',
      readiness: 'deferred',
      notes:
        'GCP gateway path is forward; no IaC starter exists.',
      followUp:
        'Author the customer-hosted gateway runbook for GCP.',
    },
    aws_private: {
      defaultOption: 'Customer-hosted gateway image inside Fargate with per-tenant policy',
      fallbackOption: 'AWS API Gateway with PrivateLink as a proxy',
      readiness: 'deferred',
      notes:
        'AWS gateway path is forward; no IaC starter exists.',
      followUp:
        'Author the customer-hosted gateway runbook for AWS.',
    },
    on_prem_air_gapped: {
      defaultOption: 'Customer-operated gateway image bound to a customer-approved local model lane',
      fallbackOption: 'Customer-operated gateway with a deterministic offline simulator lane',
      readiness: 'not_supported',
      notes:
        'No public model provider is reachable from an air-gapped network; the gateway can only resolve a customer-approved local model lane today, and AbarVa makes no live runtime claim for any vendor model in this configuration.',
      followUp:
        'Author the air-gapped local-model lane operator runbook before any air-gapped pilot.',
    },
  },
};

const ROW_CI_CD: CapabilityRow = {
  capability: 'ci_cd',
  label: 'CI / CD pipeline',
  perTarget: {
    vercel_saas: {
      defaultOption: 'GitHub Actions building the Next.js app and Vercel preview / production deploys',
      fallbackOption: 'Vercel Git integration with per-PR preview deployments',
      readiness: 'available',
      notes:
        'Tier 1 CI / CD plane; deterministic test gates, typecheck, and lint run on every PR.',
      followUp:
        'PROD4 must add secure GitHub / Vercel deployment ingestion before any readiness promotion to production_deployment.',
    },
    azure_vnet: {
      defaultOption: 'GitHub Actions running az bicep build + az deployment group what-if against the customer subscription',
      fallbackOption: 'Azure DevOps Pipelines targeting the customer subscription with managed identity',
      readiness: 'preview',
      notes:
        'CLOUD5 starter is dry-run only; no az deployment group create is executed in CI today.',
      followUp:
        'Customer-side dry-run plus an approval-gated deploy job must land before any pilot promotion.',
    },
    gcp_vpc: {
      defaultOption: 'GitHub Actions invoking gcloud with workload-identity federation against the customer project',
      fallbackOption: 'Google Cloud Build pipeline targeting the customer project',
      readiness: 'deferred',
      notes:
        'GCP CI / CD path is forward; no pipeline is committed.',
      followUp:
        'Author a workload-identity GitHub Actions pipeline for CLOUD3.',
    },
    aws_private: {
      defaultOption: 'GitHub Actions invoking aws CLI with OIDC federation against the customer account',
      fallbackOption: 'AWS CodePipeline targeting the customer account with IAM role assumption',
      readiness: 'deferred',
      notes:
        'AWS CI / CD path is forward; no pipeline is committed.',
      followUp:
        'Author an OIDC-federated GitHub Actions pipeline for the AWS blueprint.',
    },
    on_prem_air_gapped: {
      defaultOption: 'Customer-operated CI runner inside the air-gapped network with offline image transfer',
      fallbackOption: 'Customer-operated GitLab runner with image promotion via signed bundle',
      readiness: 'deferred',
      notes:
        'Air-gapped CI / CD is customer-operated; AbarVa documents the image bundle contract only.',
      followUp:
        'Author the air-gapped CI / CD operator runbook with a signed-bundle handoff.',
    },
  },
};

const SEED_ROWS: readonly CapabilityRow[] = [
  ROW_FRONTEND_HOSTING,
  ROW_COMPUTE,
  ROW_POSTGRES,
  ROW_BLOB,
  ROW_SECRETS,
  ROW_IDP,
  ROW_OBSERVABILITY,
  ROW_VECTOR,
  ROW_GRAPH,
  ROW_MODEL_GATEWAY,
  ROW_CI_CD,
];

function buildSeedEntries(): readonly DependencyMatrixEntry[] {
  const entries: DependencyMatrixEntry[] = [];
  for (const row of SEED_ROWS) {
    for (const target of DEPLOYMENT_TARGETS) {
      const cell = row.perTarget[target];
      entries.push({
        capability: row.capability,
        target,
        id: entryId(row.capability, target),
        label: `${row.label} · ${target}`,
        defaultOption: cell.defaultOption,
        fallbackOption: cell.fallbackOption,
        readiness: cell.readiness,
        notes: cell.notes,
        followUp: cell.followUp,
        createdFrom: 'deterministic_enterprise_dependency_matrix_seed',
      });
    }
  }
  return entries;
}

const SEED_ENTRIES: readonly DependencyMatrixEntry[] = buildSeedEntries();

const SEED_MATRIX: EnterpriseDependencyMatrix = {
  entries: SEED_ENTRIES,
  createdFrom: 'deterministic_enterprise_dependency_matrix_seed',
};

// ---------------------------------------------------------------------
// Helpers - all return readonly views.
// ---------------------------------------------------------------------

export function listDeploymentTargets(): readonly DeploymentTarget[] {
  return DEPLOYMENT_TARGETS;
}

export function listDependencyCapabilities(): readonly DependencyCapability[] {
  return DEPENDENCY_CAPABILITIES;
}

export function listDependencyReadinessStates(): readonly DependencyReadiness[] {
  return DEPENDENCY_READINESS_STATES;
}

export function buildEnterpriseDependencyMatrix(): EnterpriseDependencyMatrix {
  return SEED_MATRIX;
}

function emptyByTarget(): Record<DeploymentTarget, number> {
  const out = {} as Record<DeploymentTarget, number>;
  for (const target of DEPLOYMENT_TARGETS) {
    out[target] = 0;
  }
  return out;
}

function emptyByCapability(): Record<DependencyCapability, number> {
  const out = {} as Record<DependencyCapability, number>;
  for (const capability of DEPENDENCY_CAPABILITIES) {
    out[capability] = 0;
  }
  return out;
}

function emptyByReadiness(): Record<DependencyReadiness, number> {
  const out = {} as Record<DependencyReadiness, number>;
  for (const state of DEPENDENCY_READINESS_STATES) {
    out[state] = 0;
  }
  return out;
}

export function summarizeEnterpriseDependencyMatrix(
  matrix: EnterpriseDependencyMatrix = SEED_MATRIX,
): DependencyMatrixSummary {
  const entriesByTarget = emptyByTarget();
  const entriesByCapability = emptyByCapability();
  const entriesByReadiness = emptyByReadiness();
  let notSupportedCount = 0;

  for (const entry of matrix.entries) {
    entriesByTarget[entry.target] += 1;
    entriesByCapability[entry.capability] += 1;
    entriesByReadiness[entry.readiness] += 1;
    if (entry.readiness === 'not_supported') {
      notSupportedCount += 1;
    }
  }

  const capabilitiesCovered = matrix.entries
    .map((entry) => entry.capability)
    .filter((capability, index, arr) => arr.indexOf(capability) === index);

  const targetsCovered = matrix.entries
    .map((entry) => entry.target)
    .filter((target, index, arr) => arr.indexOf(target) === index);

  return {
    totalEntries: matrix.entries.length,
    entriesByTarget,
    entriesByCapability,
    entriesByReadiness,
    capabilitiesCovered,
    targetsCovered,
    notSupportedCount,
  };
}

export function getNotSupportedCombinations(
  matrix: EnterpriseDependencyMatrix = SEED_MATRIX,
): readonly DependencyMatrixEntry[] {
  return matrix.entries.filter((entry) => entry.readiness === 'not_supported');
}

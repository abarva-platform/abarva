import type {
  TenantUsageCapConfig,
  TenantUsageTotals,
} from "./tenant-usage-cap-policy";

export type AiDataClass = "public" | "internal" | "confidential" | "restricted";

export type AiProvider =
  | "anthropic"
  | "gamma"
  | "openai"
  | "azure-foundry"
  | "bedrock"
  | "gcp-vertex"
  | "kernel-only";

export type AiRoute =
  | "anthropic-direct"
  | "openai-direct"
  | "gamma-api"
  | "azure-foundry-private"
  | "bedrock-claude"
  | "gcp-vertex-claude"
  | "kernel-only";

export type AiPolicyDecision = "allow" | "deny" | "redact_required" | "error";

export interface TenantAiPolicy {
  allowExternalAI: boolean;
  kernelOnlyMode?: boolean;
  allowClaude: boolean;
  allowGamma: boolean;
  maxDataClass: AiDataClass;
  requireRedaction: boolean;
  requireHumanApprovalForExports: boolean;
  promptResponseRetentionDays: number;
}

export interface AiEgressRequest {
  tenantId: string;
  userId?: string;
  workflow: string;
  artifactId?: string;
  artifactType?: string;
  provider: AiProvider;
  route: AiRoute;
  model?: string;
  prompt: string;
  dataClass?: AiDataClass;
  metadata?: Record<string, unknown>;
  policy: TenantAiPolicy;
  usageCap?: {
    config: TenantUsageCapConfig;
    current: TenantUsageTotals;
    pending?: Partial<TenantUsageTotals> | null;
  } | null;
}

export interface AiPolicyEvaluation {
  decision: AiPolicyDecision;
  reason: string;
  dataClass: AiDataClass;
}

export interface AiEgressAuditRecord {
  id: string;
  tenantId: string;
  userId?: string;
  workflow: string;
  artifactId?: string;
  artifactType?: string;
  provider: AiProvider;
  model?: string;
  route: AiRoute;
  dataClass: AiDataClass;
  policyDecision: AiPolicyDecision;
  decisionReason: string;
  promptHash?: string;
  responseHash?: string;
  promptSnapshotRef?: string;
  responseSnapshotRef?: string;
  requestMetadata: Record<string, unknown>;
  errorMessage?: string;
  createdAt: string;
}

export interface AiEgressAuditSink {
  write(
    record: Omit<AiEgressAuditRecord, "id" | "createdAt">,
  ): Promise<AiEgressAuditRecord>;
}

export interface AiModelAdapterRequest {
  prompt: string;
  model?: string;
  metadata?: Record<string, unknown>;
}

export interface AiModelAdapterResponse {
  response: string;
  model?: string;
  metadata?: Record<string, unknown>;
}

export type AiModelAdapter = (
  request: AiModelAdapterRequest,
) => Promise<AiModelAdapterResponse>;

export type AiCallResult =
  | {
      ok: true;
      response: string;
      auditId: string;
      model?: string;
      dataClass: AiDataClass;
    }
  | {
      ok: false;
      reason: string;
      auditId: string;
      dataClass: AiDataClass;
      policyDecision: AiPolicyDecision;
    };

export type AiPreflightResult<TClient> =
  | {
      ok: true;
      client: TClient;
      auditId: string;
      dataClass: AiDataClass;
    }
  | {
      ok: false;
      reason: string;
      auditId: string;
      dataClass: AiDataClass;
      policyDecision: AiPolicyDecision;
    };

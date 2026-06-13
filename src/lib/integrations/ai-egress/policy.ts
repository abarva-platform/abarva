import type {
  AiDataClass,
  AiEgressRequest,
  AiPolicyEvaluation,
  TenantAiPolicy,
} from './types';

// Tenant AI egress standard: sanctioned reasoning providers are gated by data
// class and audit preflight, while genuinely external/non-core providers (Gamma,
// etc.) stay off by default. `kernelOnlyMode` is off; `maxDataClass` permits
// the confidential tenant context Sentinel/Nexus require.
export const CONSERVATIVE_TENANT_AI_POLICY: TenantAiPolicy = {
  allowExternalAI: false,
  kernelOnlyMode: false,
  allowClaude: true,
  allowGamma: false,
  maxDataClass: 'confidential',
  requireRedaction: true,
  requireHumanApprovalForExports: true,
  promptResponseRetentionDays: 0,
};

const DATA_CLASS_RANK: Record<AiDataClass, number> = {
  public: 0,
  internal: 1,
  confidential: 2,
  restricted: 3,
};

export function classifyAiPayload(dataClass?: AiDataClass): AiDataClass {
  return dataClass ?? 'confidential';
}

export function evaluateAiEgressPolicy(request: AiEgressRequest): AiPolicyEvaluation {
  const dataClass = classifyAiPayload(request.dataClass);

  if (request.provider === 'kernel-only' || request.route === 'kernel-only') {
    return { decision: 'allow', reason: 'kernel-only execution has no external AI egress', dataClass };
  }

  // OpenAI is the currently sanctioned reasoning provider for deliverable
  // generation. It is gated by the tenant data-class ceiling and audited before
  // a client is returned.
  if (request.provider === 'openai') {
    if (DATA_CLASS_RANK[dataClass] > DATA_CLASS_RANK[request.policy.maxDataClass]) {
      return {
        decision: 'deny',
        reason: `data class ${dataClass} exceeds tenant max ${request.policy.maxDataClass}`,
        dataClass,
      };
    }
    return { decision: 'allow', reason: 'OpenAI is the sanctioned audited reasoning provider', dataClass };
  }

  // Anthropic/Claude remains supported for legacy configured tenants. It is
  // gated by the tenant's allowClaude flag and the data-class ceiling.
  if (request.provider === 'anthropic') {
    if (!request.policy.allowClaude) {
      return { decision: 'deny', reason: 'Claude is disabled by tenant policy', dataClass };
    }
    if (DATA_CLASS_RANK[dataClass] > DATA_CLASS_RANK[request.policy.maxDataClass]) {
      return {
        decision: 'deny',
        reason: `data class ${dataClass} exceeds tenant max ${request.policy.maxDataClass}`,
        dataClass,
      };
    }
    return { decision: 'allow', reason: 'Anthropic is enabled by tenant policy', dataClass };
  }

  if (!request.policy.allowExternalAI || request.policy.kernelOnlyMode) {
    return { decision: 'deny', reason: 'external AI egress disabled by tenant policy', dataClass };
  }

  if (DATA_CLASS_RANK[dataClass] > DATA_CLASS_RANK[request.policy.maxDataClass]) {
    return {
      decision: 'deny',
      reason: `data class ${dataClass} exceeds tenant max ${request.policy.maxDataClass}`,
      dataClass,
    };
  }

  if (request.provider === 'gamma') {
    if (!request.policy.allowGamma) {
      return { decision: 'deny', reason: 'Gamma is disabled by tenant policy', dataClass };
    }
    if (dataClass === 'confidential' || dataClass === 'restricted') {
      return {
        decision: 'redact_required',
        reason: 'Gamma is blocked for confidential or restricted data until Layer 2 redaction is available',
        dataClass,
      };
    }
  }

  if (request.policy.requireRedaction && (dataClass === 'confidential' || dataClass === 'restricted')) {
    return {
      decision: 'redact_required',
      reason: 'tenant policy requires redaction before confidential or restricted external AI egress',
      dataClass,
    };
  }

  return { decision: 'allow', reason: 'tenant policy allows this AI egress route', dataClass };
}

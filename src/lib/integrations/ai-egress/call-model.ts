import { createHash } from 'node:crypto';

import { evaluateAiEgressPolicy } from './policy';
import type {
  AiCallResult,
  AiEgressAuditSink,
  AiEgressRequest,
  AiModelAdapter,
  AiPolicyDecision,
} from './types';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function auditDecisionToResultDecision(decision: AiPolicyDecision): AiPolicyDecision {
  return decision;
}

export async function callModel(
  request: AiEgressRequest & {
    adapter: AiModelAdapter;
    auditSink: AiEgressAuditSink;
  },
): Promise<AiCallResult> {
  const evaluation = evaluateAiEgressPolicy(request);
  const promptHash = sha256(request.prompt);

  if (evaluation.decision !== 'allow') {
    const audit = await request.auditSink.write({
      tenantId: request.tenantId,
      userId: request.userId,
      workflow: request.workflow,
      artifactId: request.artifactId,
      artifactType: request.artifactType,
      provider: request.provider,
      model: request.model,
      route: request.route,
      dataClass: evaluation.dataClass,
      policyDecision: evaluation.decision,
      decisionReason: evaluation.reason,
      promptHash,
      requestMetadata: request.metadata ?? {},
    });

    return {
      ok: false,
      reason: `AI egress denied by tenant policy: ${evaluation.reason} (audit id: ${audit.id})`,
      auditId: audit.id,
      dataClass: evaluation.dataClass,
      policyDecision: auditDecisionToResultDecision(evaluation.decision),
    };
  }

  const preCallAudit = await request.auditSink.write({
    tenantId: request.tenantId,
    userId: request.userId,
    workflow: request.workflow,
    artifactId: request.artifactId,
    artifactType: request.artifactType,
    provider: request.provider,
    model: request.model,
    route: request.route,
    dataClass: evaluation.dataClass,
    policyDecision: 'allow',
    decisionReason: evaluation.reason,
    promptHash,
    requestMetadata: request.metadata ?? {},
  });

  try {
    const response = await request.adapter({
      prompt: request.prompt,
      model: request.model,
      metadata: request.metadata,
    });
    const responseHash = sha256(response.response);
    await request.auditSink.write({
      tenantId: request.tenantId,
      userId: request.userId,
      workflow: request.workflow,
      artifactId: request.artifactId,
      artifactType: request.artifactType,
      provider: request.provider,
      model: response.model ?? request.model,
      route: request.route,
      dataClass: evaluation.dataClass,
      policyDecision: 'allow',
      decisionReason: 'provider call completed after synchronous pre-call audit',
      promptHash,
      responseHash,
      requestMetadata: {
        ...(request.metadata ?? {}),
        preCallAuditId: preCallAudit.id,
      },
    });

    return {
      ok: true,
      response: response.response,
      auditId: preCallAudit.id,
      model: response.model ?? request.model,
      dataClass: evaluation.dataClass,
    };
  } catch (error) {
    await request.auditSink.write({
      tenantId: request.tenantId,
      userId: request.userId,
      workflow: request.workflow,
      artifactId: request.artifactId,
      artifactType: request.artifactType,
      provider: request.provider,
      model: request.model,
      route: request.route,
      dataClass: evaluation.dataClass,
      policyDecision: 'error',
      decisionReason: 'provider call failed after synchronous pre-call audit',
      promptHash,
      requestMetadata: {
        ...(request.metadata ?? {}),
        preCallAuditId: preCallAudit.id,
      },
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

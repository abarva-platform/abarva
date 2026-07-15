import { performance } from "node:perf_hooks";

import type { ContextSourceCatalogEntry } from "../assembler";
import {
  buildEnterpriseKnowledgeContextCaches,
  type EnterpriseKnowledgeCacheBuildResult,
} from "../cache";
import type {
  IntelligenceContextPack,
  ModuleContextRequest,
} from "../contracts";
import {
  buildIntelligenceDeepContextPack,
  buildIntelligenceFastContextPack,
  buildIntelligenceProgressiveClaudePayload,
  buildIntelligenceStreamingTrace,
  INTELLIGENCE_DOMAINS,
  type DeepContextPack,
  type FastContextPack,
  type ProgressiveClaudePayload,
  type StreamingContextAssemblyTrace,
} from "./intelligence-context-pack-dry-run";

export const INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG =
  "ENABLE_KNOWLEDGE_LAYER_INTELLIGENCE_RUNTIME";

export type IntelligenceRuntimeAudience =
  | "CIO"
  | "CFO"
  | "CDAO"
  | "COO"
  | "CISO"
  | "CEO"
  | "EVP";

export interface IntelligenceKnowledgeRuntimeInput {
  tenantKey: string;
  question: string;
  audience?: IntelligenceRuntimeAudience;
  catalog: ContextSourceCatalogEntry[];
  generatedAt: string;
  sourceVersion: string;
  contextVersion: string;
  env?: Record<string, string | undefined>;
}

export interface IntelligenceKnowledgeRuntimeGuardrails {
  featureFlagRequired: true;
  defaultEnabled: false;
  defaultIntelligenceBehaviorChanged: false;
  defaultClaudePromptChanged: false;
  runtimePathChangedOnlyWhenFlagEnabled: true;
  claudeCalled: false;
  tenantDataWritten: false;
  activeTenantAccessUpdated: false;
  candidatePromoted: false;
  productionTenantDataWritten: false;
  moduleReadsCandidateByDefault: false;
  sourceAdapterRowsActive: false;
  realizedValueClaimsBlocked: true;
}

export interface IntelligenceRuntimeTiming {
  intentClassificationMs: number;
  fastContextPackMs: number;
  initialPayloadMs: number;
  deepContextPackMs: number;
  totalAssemblyMs: number;
  targets: {
    intentClassificationMs: 500;
    fastContextPackMs: 2000;
    initialPayloadMs: 3000;
    deepContextPackMs: 15000;
  };
  missedTargets: string[];
}

export interface DisabledIntelligenceKnowledgeRuntimeResult {
  resultVersion: "intelligence-knowledge-runtime/v1";
  status: "disabled";
  requiredFlag: typeof INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG;
  generatedAt: string;
  reason: string;
  existingIntelligenceBehaviorUnchanged: true;
  guardrails: IntelligenceKnowledgeRuntimeGuardrails;
}

export interface EnabledIntelligenceKnowledgeRuntimeResult {
  resultVersion: "intelligence-knowledge-runtime/v1";
  status: "enabled";
  requiredFlag: typeof INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG;
  generatedAt: string;
  request: ModuleContextRequest;
  cacheBuild: EnterpriseKnowledgeCacheBuildResult;
  intelligenceContextPack: IntelligenceContextPack;
  fastContextPack: FastContextPack;
  deepContextPack: DeepContextPack;
  streamingAssemblyTrace: StreamingContextAssemblyTrace;
  progressiveClaudePayload: ProgressiveClaudePayload;
  timing: IntelligenceRuntimeTiming;
  claudeCallPlanWhenEnabled: {
    claudeMayBeCalledByFlaggedPath: true;
    claudeCalledByAudit: false;
    defaultPromptChanged: false;
  };
  guardrails: IntelligenceKnowledgeRuntimeGuardrails;
}

export type IntelligenceKnowledgeRuntimeResult =
  | DisabledIntelligenceKnowledgeRuntimeResult
  | EnabledIntelligenceKnowledgeRuntimeResult;

export function isIntelligenceKnowledgeRuntimeEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env[INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG] === "true";
}

export function assembleIntelligenceRuntimeContext(
  input: IntelligenceKnowledgeRuntimeInput,
): IntelligenceKnowledgeRuntimeResult {
  if (!isIntelligenceKnowledgeRuntimeEnabled(input.env)) {
    return {
      resultVersion: "intelligence-knowledge-runtime/v1",
      status: "disabled",
      requiredFlag: INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG,
      generatedAt: input.generatedAt,
      reason: `${INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG} is not explicitly true.`,
      existingIntelligenceBehaviorUnchanged: true,
      guardrails: intelligenceRuntimeGuardrails(),
    };
  }

  const totalStart = performance.now();
  const request = buildIntelligenceRuntimeRequest(input);

  const cacheBuild = buildEnterpriseKnowledgeContextCaches({
    request,
    catalog: input.catalog,
    generatedAt: input.generatedAt,
    sourceVersion: input.sourceVersion,
    contextVersion: input.contextVersion,
    cacheScope: `intelligence-runtime:${input.tenantKey}:${runtimeScopeSlug(input.question)}`,
    cacheTtlPolicy: "fixture_static",
  });

  const intelligenceContextPack = cacheBuild.response.contextPack as IntelligenceContextPack;

  const fastStart = performance.now();
  const fastContextPack = buildIntelligenceFastContextPack(
    intelligenceContextPack,
    cacheBuild.intent,
  );
  const fastContextPackMs = elapsed(fastStart);

  const initialPayloadStart = performance.now();
  const deepContextPack = buildIntelligenceDeepContextPack(intelligenceContextPack);
  const progressiveClaudePayload = buildIntelligenceProgressiveClaudePayload({
    input: {
      tenantKey: input.tenantKey,
      question: input.question,
      audience: input.audience,
      mode: "active",
      requiredDepth: "progressive",
    },
    pack: intelligenceContextPack,
    fastContextPack,
    deepContextPack,
  });
  const initialPayloadMs = elapsed(initialPayloadStart);

  const deepStart = performance.now();
  const streamingAssemblyTrace = buildIntelligenceStreamingTrace(
    fastContextPack,
    deepContextPack,
  );
  const deepContextPackMs = cacheBuild.timings.deepContextPackCacheMs + elapsed(deepStart);

  return {
    resultVersion: "intelligence-knowledge-runtime/v1",
    status: "enabled",
    requiredFlag: INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG,
    generatedAt: input.generatedAt,
    request: cacheBuild.request,
    cacheBuild,
    intelligenceContextPack,
    fastContextPack,
    deepContextPack,
    streamingAssemblyTrace,
    progressiveClaudePayload,
    timing: buildTiming({
      intentClassificationMs: cacheBuild.timings.intentClassificationMs,
      fastContextPackMs,
      initialPayloadMs,
      deepContextPackMs,
      totalAssemblyMs: elapsed(totalStart),
    }),
    claudeCallPlanWhenEnabled: {
      claudeMayBeCalledByFlaggedPath: true,
      claudeCalledByAudit: false,
      defaultPromptChanged: false,
    },
    guardrails: intelligenceRuntimeGuardrails(),
  };
}

function buildIntelligenceRuntimeRequest(
  input: IntelligenceKnowledgeRuntimeInput,
): ModuleContextRequest {
  return {
    tenantKey: input.tenantKey,
    moduleKey: "intelligence",
    purpose: "strategy_context",
    mode: "active",
    requestedDomains: [...INTELLIGENCE_DOMAINS],
    scope: {
      question: input.question,
      useCase: input.question,
      portfolioScope: input.audience,
    },
    evidencePolicy: "lineage_required",
    relationshipPolicy: "validated_and_candidate",
    actorKey: "intelligence-knowledge-runtime",
  };
}

function buildTiming(params: Omit<IntelligenceRuntimeTiming, "targets" | "missedTargets">): IntelligenceRuntimeTiming {
  const targets = {
    intentClassificationMs: 500,
    fastContextPackMs: 2000,
    initialPayloadMs: 3000,
    deepContextPackMs: 15000,
  } as const;
  const missedTargets = Object.entries(targets)
    .filter(([key, target]) => params[key as keyof typeof params] > target)
    .map(([key]) => key);
  return {
    ...params,
    targets,
    missedTargets,
  };
}

function intelligenceRuntimeGuardrails(): IntelligenceKnowledgeRuntimeGuardrails {
  return {
    featureFlagRequired: true,
    defaultEnabled: false,
    defaultIntelligenceBehaviorChanged: false,
    defaultClaudePromptChanged: false,
    runtimePathChangedOnlyWhenFlagEnabled: true,
    claudeCalled: false,
    tenantDataWritten: false,
    activeTenantAccessUpdated: false,
    candidatePromoted: false,
    productionTenantDataWritten: false,
    moduleReadsCandidateByDefault: false,
    sourceAdapterRowsActive: false,
    realizedValueClaimsBlocked: true,
  };
}

function runtimeScopeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function elapsed(start: number): number {
  return Math.round((performance.now() - start) * 100) / 100;
}

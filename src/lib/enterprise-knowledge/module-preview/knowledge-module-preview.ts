import type { ContextSourceCatalogEntry } from "../assembler";
import {
  buildEnterpriseKnowledgeContextCaches,
  type EnterpriseKnowledgeCacheBuildResult,
} from "../cache";
import type { ModuleContextRequest } from "../contracts";
import {
  isKnowledgeModulePreviewEnabled,
  KNOWLEDGE_MODULE_PREVIEW_FLAGS,
  type KnowledgeModulePreviewKey,
} from "./knowledge-module-preview-flags";

export type KnowledgeModulePreviewStatus = "disabled" | "enabled";

export interface KnowledgeModulePreviewGuardrails {
  previewModeRequiresExplicitFlag: true;
  moduleRuntimeBehaviorChanged: false;
  claudeCalled: false;
  tenantDataWritten: false;
  activeTenantAccessUpdated: false;
  candidatePromoted: false;
  defaultModuleReadsCandidateData: false;
}

export interface DisabledKnowledgeModulePreview {
  resultVersion: "knowledge-module-preview/v1";
  status: "disabled";
  moduleKey: KnowledgeModulePreviewKey;
  requiredFlag: string;
  reason: string;
  generatedAt: string;
  guardrails: KnowledgeModulePreviewGuardrails;
}

export interface EnabledKnowledgeModulePreview {
  resultVersion: "knowledge-module-preview/v1";
  status: "enabled";
  moduleKey: KnowledgeModulePreviewKey;
  requiredFlag: string;
  generatedAt: string;
  request: ModuleContextRequest;
  cacheBuild: EnterpriseKnowledgeCacheBuildResult;
  previewPacket: {
    fastContextPackCacheId: string;
    deepContextPackCacheId: string;
    entityProfileCacheRows: number;
    relationshipCandidateCount: number;
    evidenceRefCount: number;
    confidenceOverall: string;
    claudeReadyPayloadPreparedButNotSent: true;
  };
  guardrails: KnowledgeModulePreviewGuardrails;
}

export type KnowledgeModulePreviewResult =
  | DisabledKnowledgeModulePreview
  | EnabledKnowledgeModulePreview;

export function buildKnowledgeModulePreview(params: {
  moduleKey: KnowledgeModulePreviewKey;
  request: ModuleContextRequest;
  catalog: ContextSourceCatalogEntry[];
  generatedAt: string;
  sourceVersion: string;
  contextVersion: string;
  env?: Record<string, string | undefined>;
}): KnowledgeModulePreviewResult {
  if (params.request.moduleKey !== params.moduleKey) {
    throw new Error(
      `Preview module ${params.moduleKey} cannot build request for ${params.request.moduleKey}`,
    );
  }
  const requiredFlag = KNOWLEDGE_MODULE_PREVIEW_FLAGS[params.moduleKey];
  if (!isKnowledgeModulePreviewEnabled(params.moduleKey, params.env)) {
    return {
      resultVersion: "knowledge-module-preview/v1",
      status: "disabled",
      moduleKey: params.moduleKey,
      requiredFlag,
      reason: `${requiredFlag} is not explicitly true.`,
      generatedAt: params.generatedAt,
      guardrails: previewGuardrails(),
    };
  }

  const cacheBuild = buildEnterpriseKnowledgeContextCaches({
    request: {
      ...params.request,
      mode: params.request.mode ?? "active",
    },
    catalog: params.catalog,
    generatedAt: params.generatedAt,
    sourceVersion: params.sourceVersion,
    contextVersion: params.contextVersion,
    cacheScope: `module-preview:${params.moduleKey}:${params.request.purpose}`,
    cacheTtlPolicy: "fixture_static",
  });

  return {
    resultVersion: "knowledge-module-preview/v1",
    status: "enabled",
    moduleKey: params.moduleKey,
    requiredFlag,
    generatedAt: params.generatedAt,
    request: cacheBuild.request,
    cacheBuild,
    previewPacket: {
      fastContextPackCacheId: cacheBuild.fastContextPackCache.metadata.cacheId,
      deepContextPackCacheId: cacheBuild.deepContextPackCache.metadata.cacheId,
      entityProfileCacheRows: cacheBuild.entityProfileCache.length,
      relationshipCandidateCount:
        cacheBuild.relationshipSliceCache.relationshipCandidates.length,
      evidenceRefCount: cacheBuild.response.contextPack.evidence.length,
      confidenceOverall: cacheBuild.response.contextPack.confidenceSummary.overall,
      claudeReadyPayloadPreparedButNotSent: true,
    },
    guardrails: previewGuardrails(),
  };
}

function previewGuardrails(): KnowledgeModulePreviewGuardrails {
  return {
    previewModeRequiresExplicitFlag: true,
    moduleRuntimeBehaviorChanged: false,
    claudeCalled: false,
    tenantDataWritten: false,
    activeTenantAccessUpdated: false,
    candidatePromoted: false,
    defaultModuleReadsCandidateData: false,
  };
}

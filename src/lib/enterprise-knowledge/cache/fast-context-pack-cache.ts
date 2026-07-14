import type {
  CanonicalFact,
  ClaudeReadyContextPayload,
  ContextGap,
  ContextPack,
  EntityProfile,
  EvidenceRef,
  RelationshipEdge,
} from "../contracts";
import type { ContextCacheMetadata } from "./context-cache-metadata";

export interface FastContextPackCache {
  metadata: ContextCacheMetadata;
  contextPackId: string;
  tenantKey: string;
  moduleKey: ContextPack["moduleKey"];
  purpose: ContextPack["purpose"];
  mode: ContextPack["mode"];
  executiveSummary: string;
  topEntityProfiles: Pick<EntityProfile, "profileId" | "entityType" | "entityName" | "businessMeaning" | "moduleReadiness" | "confidence">[];
  topRelationshipSummaries: Pick<RelationshipEdge, "relationshipId" | "relationshipType" | "businessMeaning" | "readiness" | "confidence">[];
  topMetrics: Pick<CanonicalFact, "factId" | "predicate" | "value" | "confidence">[];
  topRisksControls: Pick<EntityProfile, "profileId" | "entityName" | "businessMeaning" | "moduleReadiness">[];
  topGaps: Pick<ContextGap, "gapId" | "title" | "severity" | "category" | "blocksActivePromotion">[];
  evidenceSummary: {
    evidenceRefCount: number;
    citableEvidenceRefCount: number;
    sourceLabels: string[];
  };
  confidenceSummary: ContextPack["confidenceSummary"];
  truthBoundary: ContextPack["truthBoundary"];
  unsupportedClaimAuditCount: number;
  claudeReadyContextPayload: ClaudeReadyContextPayload;
}

export function buildFastContextPackCache(params: {
  metadata: ContextCacheMetadata;
  pack: ContextPack;
}): FastContextPackCache {
  const pack = params.pack;
  return {
    metadata: params.metadata,
    contextPackId: pack.contextPackId,
    tenantKey: pack.tenantKey,
    moduleKey: pack.moduleKey,
    purpose: pack.purpose,
    mode: pack.mode,
    executiveSummary: pack.executiveSummary,
    topEntityProfiles: pack.relevantEntityProfiles.slice(0, 8).map((profile) => ({
      profileId: profile.profileId,
      entityType: profile.entityType,
      entityName: profile.entityName,
      businessMeaning: profile.businessMeaning,
      moduleReadiness: profile.moduleReadiness,
      confidence: profile.confidence,
    })),
    topRelationshipSummaries: pack.relationshipCandidates.slice(0, 8).map((edge) => ({
      relationshipId: edge.relationshipId,
      relationshipType: edge.relationshipType,
      businessMeaning: edge.businessMeaning,
      readiness: edge.readiness,
      confidence: edge.confidence,
    })),
    topMetrics: pack.metrics.slice(0, 8).map((fact) => ({
      factId: fact.factId,
      predicate: fact.predicate,
      value: fact.value,
      confidence: fact.confidence,
    })),
    topRisksControls: pack.risks.slice(0, 8).map((profile) => ({
      profileId: profile.profileId,
      entityName: profile.entityName,
      businessMeaning: profile.businessMeaning,
      moduleReadiness: profile.moduleReadiness,
    })),
    topGaps: pack.gaps.slice(0, 8).map((gap) => ({
      gapId: gap.gapId,
      title: gap.title,
      severity: gap.severity,
      category: gap.category,
      blocksActivePromotion: gap.blocksActivePromotion,
    })),
    evidenceSummary: summarizeEvidence(pack.evidence),
    confidenceSummary: pack.confidenceSummary,
    truthBoundary: pack.truthBoundary,
    unsupportedClaimAuditCount: pack.unsupportedClaims.length,
    claudeReadyContextPayload: pack.claudeReadyContextPayload,
  };
}

function summarizeEvidence(evidenceRefs: EvidenceRef[]): FastContextPackCache["evidenceSummary"] {
  return {
    evidenceRefCount: evidenceRefs.length,
    citableEvidenceRefCount: evidenceRefs.filter((ref) => ref.citationStatus === "citable").length,
    sourceLabels: Array.from(new Set(evidenceRefs.map((ref) => ref.sourceLabel))).slice(0, 10),
  };
}

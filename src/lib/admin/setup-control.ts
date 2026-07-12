import type { ClientKey } from "@/lib/client-config";
import type { SetupInventorySnapshot } from "@/lib/admin/setup-acts-registry";

export type AdminControlStatus =
  | "ready"
  | "preview-ready"
  | "partially-ready"
  | "blocked"
  | "not-created"
  | "unknown";

export interface AdminSetupControlSourceFile {
  source_doc: string;
  chunk_count: number;
  first_loaded_at: string;
  sample_chunk_id: string;
}

export interface AdminModuleReadiness {
  status: AdminControlStatus;
  candidatePreviewAvailable: boolean;
  runtimeActiveAvailable: boolean;
  missingEvidence: string[];
  lastProof: string | null;
}

export interface AdminSetupControlResponse {
  tenant: {
    tenantKey: ClientKey;
    displayName: string;
    coverName: string;
    mode: "setup";
    realOrSyntheticStatus: "demo_safe_synthetic" | "client_provided_unknown";
  };
  activeTenantAccess: {
    activeVersionId: string | null;
    lastPromotedAt: string | null;
    source: string;
    status: AdminControlStatus;
  };
  candidateTenantDataVersion: {
    candidateVersionId: string | null;
    status: AdminControlStatus;
    createdAt: string | null;
    promotionEnabled: boolean;
    promotionGateStatus: AdminControlStatus;
    operatorApprovalRequired: boolean;
    activeTenantAccessLayerUpdated: boolean;
  };
  uploadState: {
    uploadedFiles: number;
    stagedFiles: number;
    parsedFiles: number;
    mappedFiles: number;
    validatedFiles: number;
    quarantinedRecords: number;
    unmappedFields: number;
  };
  evidenceRegistry: {
    evidenceSources: number;
    evidenceItems: number;
    evidenceGaps: number;
  };
  canonicalFacts: {
    canonicalObjects: number;
    canonicalAttributes: number;
    factVersions: number;
  };
  relationshipGraph: {
    graphObjects: number;
    graphRelationships: number;
    unresolvedRelationships: number;
  };
  derivedIntelligence: {
    derivedInsights: number;
    answerabilityScores: number;
    readinessScores: number;
  };
  moduleReadiness: {
    home: AdminModuleReadiness;
    intelligence: AdminModuleReadiness;
    moves: AdminModuleReadiness;
    source: AdminModuleReadiness;
    tower: AdminModuleReadiness;
  };
  promotionControl: {
    promotionEnabled: boolean;
    operatorApprovalRequired: boolean;
    rollbackPlanRequired: boolean;
    blockers: string[];
    lastGateRun: string | null;
  };
  guardrails: {
    productionTenantDataWritten: boolean;
    activeTenantAccessLayerUpdated: boolean;
    candidatePromoted: boolean;
    moduleRuntimeConsumptionChanged: boolean;
    candidateReadByDefault: boolean;
    directActivePromotionBlocked: boolean;
  };
  legacyImportPaths: Array<{
    path: string;
    legacyControlledImport: boolean;
    directActiveMutationPossible: boolean;
    candidateRunwayBypassed: boolean;
    warning: string;
  }>;
  sourceOfTruth: {
    activeSource: string;
    candidateSource: string;
    readinessSource: string;
    missingSources: string[];
    caveats: string[];
  };
}

export const LEGACY_CONTROLLED_IMPORT_WARNING =
  "Legacy controlled import - not candidate-version promoted.";

const MODULE_NAMES = ["home", "intelligence", "moves", "source", "tower"] as const;

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function fileCount(sourceFiles: AdminSetupControlSourceFile[]): number {
  return new Set(sourceFiles.map((file) => file.source_doc)).size;
}

function totalChunkCount(sourceFiles: AdminSetupControlSourceFile[]): number {
  return sum(sourceFiles.map((file) => file.chunk_count));
}

function snapshotMissingCount(snapshot: SetupInventorySnapshot | null): number {
  return sum((snapshot?.segments ?? []).map((segment) => segment.missingCount));
}

function buildModuleReadiness(
  hasUploadedFiles: boolean,
): AdminSetupControlResponse["moduleReadiness"] {
  const missingEvidence = hasUploadedFiles
    ? [
        "Candidate version proof bundle is not available yet.",
        "Active promotion and cite-render proof are not established by setup-control.",
      ]
    : ["No setup-control candidate version has been built."];

  return Object.fromEntries(
    MODULE_NAMES.map((moduleName) => [
      moduleName,
      {
        status: hasUploadedFiles ? "partially-ready" : "blocked",
        candidatePreviewAvailable: false,
        runtimeActiveAvailable: false,
        missingEvidence,
        lastProof: null,
      } satisfies AdminModuleReadiness,
    ]),
  ) as AdminSetupControlResponse["moduleReadiness"];
}

export function buildAdminSetupControlReadModel(args: {
  tenantKey: ClientKey;
  displayName: string;
  coverName?: string | null;
  snapshot?: SetupInventorySnapshot | null;
  sourceFiles?: AdminSetupControlSourceFile[];
  nowIso?: string;
}): AdminSetupControlResponse {
  const sourceFiles = args.sourceFiles ?? [];
  const snapshot = args.snapshot ?? null;
  const uploadedFiles = fileCount(sourceFiles);
  const evidenceItems = totalChunkCount(sourceFiles);
  const hasUploadedFiles = uploadedFiles > 0;
  const canonicalObjects = snapshot?.totalRecords ?? 0;
  const canonicalAttributes = snapshot
    ? sum(snapshot.segments.map((segment) => segment.recordCount))
    : 0;
  const unresolvedRelationships = snapshotMissingCount(snapshot);

  const blockers = [
    "Candidate tenant data version model is not active for Admin yet.",
    "Promotion gate has not run.",
    "Operator promotion has not been executed.",
    "Module cite-render proof is not attached to setup-control yet.",
  ];

  return {
    tenant: {
      tenantKey: args.tenantKey,
      displayName: args.displayName,
      coverName: args.coverName?.trim() || args.displayName,
      mode: "setup",
      realOrSyntheticStatus: "demo_safe_synthetic",
    },
    activeTenantAccess: {
      activeVersionId: null,
      lastPromotedAt: null,
      source: "active tenant access layer version pointer is not wired in PR22",
      status: "unknown",
    },
    candidateTenantDataVersion: {
      candidateVersionId: null,
      status: "not-created",
      createdAt: null,
      promotionEnabled: false,
      promotionGateStatus: "blocked",
      operatorApprovalRequired: true,
      activeTenantAccessLayerUpdated: false,
    },
    uploadState: {
      uploadedFiles,
      stagedFiles: 0,
      parsedFiles: 0,
      mappedFiles: 0,
      validatedFiles: 0,
      quarantinedRecords: 0,
      unmappedFields: snapshotMissingCount(snapshot),
    },
    evidenceRegistry: {
      evidenceSources: uploadedFiles,
      evidenceItems,
      evidenceGaps: snapshotMissingCount(snapshot),
    },
    canonicalFacts: {
      canonicalObjects,
      canonicalAttributes,
      factVersions: 0,
    },
    relationshipGraph: {
      graphObjects: snapshot?.totalNodes ?? 0,
      graphRelationships: snapshot?.totalEdges ?? 0,
      unresolvedRelationships,
    },
    derivedIntelligence: {
      derivedInsights: 0,
      answerabilityScores: 0,
      readinessScores: snapshot?.segments.length ?? 0,
    },
    moduleReadiness: buildModuleReadiness(hasUploadedFiles),
    promotionControl: {
      promotionEnabled: false,
      operatorApprovalRequired: true,
      rollbackPlanRequired: true,
      blockers,
      lastGateRun: null,
    },
    guardrails: {
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      candidatePromoted: false,
      moduleRuntimeConsumptionChanged: false,
      candidateReadByDefault: false,
      directActivePromotionBlocked: true,
    },
    legacyImportPaths: [
      {
        path: "/api/admin/context-layer/csv-upload",
        legacyControlledImport: true,
        directActiveMutationPossible: true,
        candidateRunwayBypassed: true,
        warning: LEGACY_CONTROLLED_IMPORT_WARNING,
      },
      {
        path: "/api/admin/context-layer/bulk-upload?mode=stage_and_process",
        legacyControlledImport: true,
        directActiveMutationPossible: true,
        candidateRunwayBypassed: true,
        warning: LEGACY_CONTROLLED_IMPORT_WARNING,
      },
      {
        path: "/api/admin/context-layer/loader/commit?mode=stage_and_process",
        legacyControlledImport: true,
        directActiveMutationPossible: true,
        candidateRunwayBypassed: true,
        warning: LEGACY_CONTROLLED_IMPORT_WARNING,
      },
      {
        path: "/api/admin/context-layer/triage/[id]",
        legacyControlledImport: true,
        directActiveMutationPossible: true,
        candidateRunwayBypassed: true,
        warning: LEGACY_CONTROLLED_IMPORT_WARNING,
      },
    ],
    sourceOfTruth: {
      activeSource: "not yet wired to active tenant access layer",
      candidateSource: "not yet wired to candidate tenant data versions",
      readinessSource:
        snapshot === null
          ? "setup inventory snapshot unavailable"
          : "setup inventory snapshot plus source-document inventory",
      missingSources: [
        "candidate tenant data versions",
        "target writer dry-run output",
        "proof bundle registry",
        "module cite-render proof",
        "active tenant access layer version pointer",
      ],
      caveats: [
        "Uploaded/source files are not treated as active facts by setup-control.",
        "Module readiness is never green solely because files exist.",
        "PR22 is read-only and does not promote candidates.",
      ],
    },
  };
}

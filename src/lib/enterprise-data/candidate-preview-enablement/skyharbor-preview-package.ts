export type CandidatePreviewModule =
  | "home"
  | "intelligence"
  | "moves"
  | "source"
  | "tower";

export interface CandidatePreviewModulePacketSummary {
  module: CandidatePreviewModule;
  previewMode: true;
  runtimeEligible: false;
  previewPacketAvailable: true;
  defaultRuntimeSource: "active_tenant_access_layer";
  previewSource: "candidate_context_packet";
  facts: number;
  relationships: number;
  derivedInsights: number;
  graphPlanAvailable: boolean;
  evidenceKeys: number;
  sampleFacts: Array<{
    objectType: string;
    label: string;
    domain: string;
  }>;
  warnings: string[];
  blockedRuntimeActions: string[];
}

export interface SkyHarborCandidatePreviewPackage {
  packageVersion: "skyharbor-candidate-preview-package/v1";
  tenantKey: "skyharbor-air";
  candidateVersionId: string;
  readinessState: "candidate_preview_ready_not_active_ready";
  generatedFrom: string[];
  syntheticPlanningGrade: true;
  defaultCandidateReads: false;
  activeTenantAccessLayerUpdated: false;
  candidatePromoted: false;
  productionTenantDataWritten: false;
  moduleRuntimeConsumptionChanged: false;
  promotionEnabled: false;
  realizedValueClaimed: false;
  modulePackets: CandidatePreviewModulePacketSummary[];
}

const SHARED_SAMPLE_FACTS = [
  {
    objectType: "enterprise_profile",
    label: "SkyHarbor Air",
    domain: "enterprise_structure",
  },
  {
    objectType: "enterprise_profile",
    label: "OCC disruption management console",
    domain: "enterprise_structure",
  },
  {
    objectType: "enterprise_profile",
    label: "Flight operations dispatch platform",
    domain: "enterprise_structure",
  },
];

const BLOCKED_RUNTIME_ACTIONS = [
  "Read candidate data by default.",
  "Promote candidate data.",
  "Update the Active Tenant Access Layer.",
  "Write production tenant data.",
  "Write runtime Module Memory.",
  "Write runtime Outcome Ledger.",
  "Claim realized value or ROI.",
];

export const SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE: SkyHarborCandidatePreviewPackage =
  {
    packageVersion: "skyharbor-candidate-preview-package/v1",
    tenantKey: "skyharbor-air",
    candidateVersionId:
      "skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run",
    readinessState: "candidate_preview_ready_not_active_ready",
    generatedFrom: [
      "reports/candidate-module-previews/skyharbor/preview-summary.json",
      "reports/candidate-module-workbench-previews/skyharbor/preview-summary.json",
      "reports/candidate-module-readiness-previews/skyharbor/readiness-summary.json",
      "reports/candidate-module-derived-plans/skyharbor/summary.json",
      "reports/candidate-module-graph-plans/skyharbor/summary.json",
      "reports/candidate-readiness-control/skyharbor/candidate-readiness-control.json",
    ],
    syntheticPlanningGrade: true,
    defaultCandidateReads: false,
    activeTenantAccessLayerUpdated: false,
    candidatePromoted: false,
    productionTenantDataWritten: false,
    moduleRuntimeConsumptionChanged: false,
    promotionEnabled: false,
    realizedValueClaimed: false,
    modulePackets: [
      {
        module: "home",
        previewMode: true,
        runtimeEligible: false,
        previewPacketAvailable: true,
        defaultRuntimeSource: "active_tenant_access_layer",
        previewSource: "candidate_context_packet",
        facts: 21,
        relationships: 0,
        derivedInsights: 1,
        graphPlanAvailable: false,
        evidenceKeys: 47,
        sampleFacts: SHARED_SAMPLE_FACTS,
        warnings: [
          "Candidate preview is read-only and not active tenant truth.",
          "Home runtime routes are unchanged; this packet is not consumed by default.",
        ],
        blockedRuntimeActions: BLOCKED_RUNTIME_ACTIONS,
      },
      {
        module: "intelligence",
        previewMode: true,
        runtimeEligible: false,
        previewPacketAvailable: true,
        defaultRuntimeSource: "active_tenant_access_layer",
        previewSource: "candidate_context_packet",
        facts: 21,
        relationships: 0,
        derivedInsights: 2,
        graphPlanAvailable: false,
        evidenceKeys: 47,
        sampleFacts: SHARED_SAMPLE_FACTS,
        warnings: [
          "Candidate preview can be inspected by operators but is not used for default Intelligence answers.",
          "Unsupported realized-value, production-write, or active-promotion claims remain blocked.",
        ],
        blockedRuntimeActions: BLOCKED_RUNTIME_ACTIONS,
      },
      {
        module: "moves",
        previewMode: true,
        runtimeEligible: false,
        previewPacketAvailable: true,
        defaultRuntimeSource: "active_tenant_access_layer",
        previewSource: "candidate_context_packet",
        facts: 24,
        relationships: 48,
        derivedInsights: 1,
        graphPlanAvailable: true,
        evidenceKeys: 47,
        sampleFacts: SHARED_SAMPLE_FACTS,
        warnings: [
          "Candidate uses synthetic/planning-grade SkyHarbor evidence, not production client data.",
          "Candidate has not been promoted to the Active Tenant Access Layer.",
        ],
        blockedRuntimeActions: BLOCKED_RUNTIME_ACTIONS,
      },
      {
        module: "source",
        previewMode: true,
        runtimeEligible: false,
        previewPacketAvailable: true,
        defaultRuntimeSource: "active_tenant_access_layer",
        previewSource: "candidate_context_packet",
        facts: 24,
        relationships: 48,
        derivedInsights: 1,
        graphPlanAvailable: true,
        evidenceKeys: 47,
        sampleFacts: SHARED_SAMPLE_FACTS,
        warnings: [
          "Candidate uses synthetic/planning-grade SkyHarbor evidence, not production client data.",
          "Candidate has not been promoted to the Active Tenant Access Layer.",
        ],
        blockedRuntimeActions: BLOCKED_RUNTIME_ACTIONS,
      },
      {
        module: "tower",
        previewMode: true,
        runtimeEligible: false,
        previewPacketAvailable: true,
        defaultRuntimeSource: "active_tenant_access_layer",
        previewSource: "candidate_context_packet",
        facts: 24,
        relationships: 48,
        derivedInsights: 1,
        graphPlanAvailable: true,
        evidenceKeys: 47,
        sampleFacts: SHARED_SAMPLE_FACTS,
        warnings: [
          "Candidate uses synthetic/planning-grade SkyHarbor evidence, not production client data.",
          "Candidate has not been promoted to the Active Tenant Access Layer.",
        ],
        blockedRuntimeActions: BLOCKED_RUNTIME_ACTIONS,
      },
    ],
  };

export function findSkyHarborPreviewModule(
  module: CandidatePreviewModule,
): CandidatePreviewModulePacketSummary {
  const packet = SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.modulePackets.find(
    (candidate) => candidate.module === module,
  );
  if (!packet) {
    throw new Error(
      `Unsupported SkyHarbor candidate preview module: ${module}`,
    );
  }
  return packet;
}

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type {
  TowerContextPack,
  TowerV3SourceDimensionKey,
} from "@/lib/enterprise-knowledge/contracts";
import {
  buildTowerV3ContextPackFromTenantInputs,
  type TowerV3MeridianProof,
} from "@/lib/enterprise-knowledge/tower/tower-v3-context-pack-from-tenant-inputs";

export const TOWER_GOVERNED_CANDIDATE_LOAD_VERSION =
  "tower-governed-candidate-load/v1";

export type TowerCandidateLoadGateStatus = "pass" | "fail";

export interface TowerCandidateLoadGuardrails {
  candidateLoadOnly: true;
  dryRunOnly: true;
  productionTenantDataWritten: false;
  activeTenantAccessLayerUpdated: false;
  candidatePromoted: false;
  moduleRuntimeConsumptionChanged: false;
  moduleReadsCandidateByDefault: false;
  towerRuntimeReadsCandidateByDefault: false;
  writesPhysicalTables: false;
  requiresAcaJobForMutation: true;
  requiresHumanPromotionApproval: true;
}

export interface TowerCandidateAcaJobContract {
  jobName: string;
  runId: string;
  tenantScope: string;
  buildVersion: typeof TOWER_GOVERNED_CANDIDATE_LOAD_VERSION;
  inputSourceVersion: string;
  idempotencyKey: string;
  status: "planned_not_submitted";
  retryCount: 0;
  timeoutSeconds: 7200;
  operatorWrapper: "scripts/ops/submit-aca-operator-job.mjs";
  npmScript: "audit:tower-governed-candidate-load";
  requiredProofBundlePath: string;
  requiredValidationOutputPath: string;
  requiredQualityGateOutputPath: string;
  notes: string[];
}

export interface TowerCandidatePreviewPacket {
  tenantKey: string;
  candidateVersionId: string;
  moduleKey: "tower";
  mode: "candidate_preview";
  previewBanner: "Candidate Preview Mode - inactive candidate Tower context. Not active tenant truth.";
  runtimeEligible: false;
  sourceContextPackId: string;
  towerMetricRecordCount: number;
  towerValueRecordCount: number;
  towerValueClaimCount: number;
  realizedValueLanguageAllowed: false;
  executiveBlockerThemes: string[];
  visibleSummary: string;
  mustNotClaim: string[];
}

export interface TowerCandidateQualityGateCheck {
  id: string;
  label: string;
  status: TowerCandidateLoadGateStatus;
  detail: string;
}

export interface TowerGovernedCandidateLoadReport {
  reportVersion: typeof TOWER_GOVERNED_CANDIDATE_LOAD_VERSION;
  generatedAt: string;
  tenantKey: string;
  tenantName: string;
  datasetManifestId: string;
  inputRoot: string;
  inputFingerprint: string;
  candidateVersionId: string;
  guardrails: TowerCandidateLoadGuardrails;
  acaJobContract: TowerCandidateAcaJobContract;
  sourceDimensions: TowerV3MeridianProof["summary"]["sourceDimensions"];
  towerContextPack: Pick<
    TowerContextPack,
    | "contextPackId"
    | "mode"
    | "truthStatus"
    | "sourceOfTruthPath"
    | "projectionPath"
    | "projectionStatus"
    | "towerTruthCaveats"
  >;
  candidatePreview: TowerCandidatePreviewPacket;
  qualityGateStatus: TowerCandidateLoadGateStatus;
  qualityGateChecks: TowerCandidateQualityGateCheck[];
  lineage: {
    sourceFiles: Array<{
      dimensionKey: TowerV3SourceDimensionKey;
      path: string;
      rowCount: number;
      evidenceCount: number;
      projectionStatus: string;
    }>;
    towerMetricRecordCount: number;
    towerValueRecordCount: number;
    towerValueClaimCount: number;
  };
  truthSplit: {
    activeContextUpdated: false;
    candidatePreviewCreated: true;
    defaultTowerRuntimeChanged: false;
    cioTowerSourceOfTruth: "bridge_only_diagnostic";
    retrievalState: "not_loaded_not_indexed_not_retrieval_proven_not_cited";
  };
}

export interface TowerGovernedCandidateLoadOptions {
  repoRoot: string;
  tenantKey?: string;
  tenantName?: string;
  inputRoot?: string;
  datasetManifestId?: string;
  generatedAt?: string;
}

const DEFAULT_TENANT_KEY = "meridian-health";
const DEFAULT_TENANT_NAME = "Healthcare Demo";
const DEFAULT_INPUT_ROOT =
  "datasets/tenant-inputs/active/meridian-health/current";
const DEFAULT_MANIFEST_ID =
  "meridian-health-tower-v3-candidate-preview-20260717";

const EXECUTIVE_BLOCKER_THEMES = [
  "Baseline metrics need validation before value can be treated as measured.",
  "Value claims remain planning-grade until finance-attested actuals are loaded.",
  "Data and AI foundation evidence must be tied to production-certified source ownership.",
  "Operational process evidence needs accountable owner confirmation.",
  "Managed services, contract, and SLA evidence remain incomplete for Tower renewal/value claims.",
  "Source-system lineage must be reconciled before Tower can promote candidate context.",
];

function hash(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function failIf(condition: boolean, check: Omit<TowerCandidateQualityGateCheck, "status">): TowerCandidateQualityGateCheck {
  return {
    ...check,
    status: condition ? "fail" : "pass",
  };
}

function buildGuardrails(): TowerCandidateLoadGuardrails {
  return {
    candidateLoadOnly: true,
    dryRunOnly: true,
    productionTenantDataWritten: false,
    activeTenantAccessLayerUpdated: false,
    candidatePromoted: false,
    moduleRuntimeConsumptionChanged: false,
    moduleReadsCandidateByDefault: false,
    towerRuntimeReadsCandidateByDefault: false,
    writesPhysicalTables: false,
    requiresAcaJobForMutation: true,
    requiresHumanPromotionApproval: true,
  };
}

function sourceFingerprint(args: {
  repoRoot: string;
  inputRoot: string;
  proof: TowerV3MeridianProof;
}): string {
  const files = args.proof.summary.sourceDimensions.map((dimension) => {
    const filePath = path.join(args.repoRoot, args.inputRoot, dimension.fileName);
    return {
      fileName: dimension.fileName,
      digest: crypto
        .createHash("sha256")
        .update(fs.readFileSync(filePath))
        .digest("hex"),
      rowCount: dimension.rowCount,
    };
  });
  return hash(files);
}

function candidateVersionId(tenantKey: string, fingerprint: string): string {
  return `candidate:${tenantKey}:tower-v3:${fingerprint.slice(0, 16)}`;
}

function buildAcaJobContract(args: {
  tenantKey: string;
  candidateVersionId: string;
  inputFingerprint: string;
}): TowerCandidateAcaJobContract {
  const runId = `tower-candidate-load-${args.tenantKey}-${args.inputFingerprint.slice(0, 12)}`;
  return {
    jobName: "job-tower-governed-candidate-load",
    runId,
    tenantScope: args.tenantKey,
    buildVersion: TOWER_GOVERNED_CANDIDATE_LOAD_VERSION,
    inputSourceVersion: args.inputFingerprint,
    idempotencyKey: `${args.candidateVersionId}:${args.inputFingerprint}`,
    status: "planned_not_submitted",
    retryCount: 0,
    timeoutSeconds: 7200,
    operatorWrapper: "scripts/ops/submit-aca-operator-job.mjs",
    npmScript: "audit:tower-governed-candidate-load",
    requiredProofBundlePath: `reports/tower-governed-candidate-load/${args.tenantKey}/proof-bundle.zip`,
    requiredValidationOutputPath: `reports/tower-governed-candidate-load/${args.tenantKey}/validation.json`,
    requiredQualityGateOutputPath: `reports/tower-governed-candidate-load/${args.tenantKey}/quality-gate.json`,
    notes: [
      "This plan is not a submitted ACA Job execution.",
      "Any mutating data-plane load must run through scripts/ops/submit-aca-operator-job.mjs with a digest-pinned image.",
      "Candidate preview remains inactive until a human promotion gate approves it.",
    ],
  };
}

function buildCandidatePreview(args: {
  tenantKey: string;
  candidateVersionId: string;
  proof: TowerV3MeridianProof;
}): TowerCandidatePreviewPacket {
  return {
    tenantKey: args.tenantKey,
    candidateVersionId: args.candidateVersionId,
    moduleKey: "tower",
    mode: "candidate_preview",
    previewBanner:
      "Candidate Preview Mode - inactive candidate Tower context. Not active tenant truth.",
    runtimeEligible: false,
    sourceContextPackId: args.proof.contextPack.contextPackId,
    towerMetricRecordCount: args.proof.summary.towerMetricRecordCount,
    towerValueRecordCount: args.proof.summary.towerValueRecordCount,
    towerValueClaimCount: args.proof.summary.towerValueClaimCount,
    realizedValueLanguageAllowed: false,
    executiveBlockerThemes: EXECUTIVE_BLOCKER_THEMES,
    visibleSummary:
      "Tower candidate preview can show measurement readiness, source-backed budget/value posture, and blocker themes. It must not claim realized value, ROI, savings, achieved outcomes, or active runtime truth.",
    mustNotClaim: [
      "candidate data is active tenant truth",
      "Tower runtime reads this candidate by default",
      "realized value is proven",
      "ROI or savings are achieved",
      "cio_tower is the source of truth",
    ],
  };
}

function buildQualityGateChecks(args: {
  manifestExists: boolean;
  proof: TowerV3MeridianProof;
  guardrails: TowerCandidateLoadGuardrails;
  candidatePreview: TowerCandidatePreviewPacket;
}): TowerCandidateQualityGateCheck[] {
  const acceptance = args.proof.summary.acceptance;
  return [
    failIf(!args.manifestExists, {
      id: "manifest_declared",
      label: "Dataset manifest exists before load",
      detail:
        "Meridian Tower candidate preview must have a dataset manifest before any data-plane load.",
    }),
    failIf(!acceptance.allSixDimensionsPresent, {
      id: "tower_dimensions_present",
      label: "Tower dimensions 08/09/11/14/17/18 present",
      detail: "Candidate load requires all six Tower-relevant v3 dimensions.",
    }),
    failIf(!acceptance.everyTowerRecordHasEvidence, {
      id: "tower_records_have_evidence",
      label: "Every Tower metric/value record has evidence",
      detail:
        "Tower candidate records must remain source-backed before preview or promotion.",
    }),
    failIf(!acceptance.everyValueClaimHasGate, {
      id: "value_claims_gated",
      label: "Every Tower value claim has a gate result",
      detail: "Value language must go through TowerValueClaim gating.",
    }),
    failIf(!acceptance.realizedValueLanguageBlocked, {
      id: "realized_value_blocked",
      label: "Realized-value language is blocked",
      detail:
        "Candidate preview cannot say realized, proven, achieved, savings, or ROI unless measured evidence allows it.",
    }),
    failIf(!acceptance.cioTowerRemainsBridgeOnly, {
      id: "cio_tower_bridge_only",
      label: "cio_tower remains bridge-only",
      detail: "The legacy read model must not become Tower source truth.",
    }),
    failIf(
      args.guardrails.productionTenantDataWritten ||
        args.guardrails.activeTenantAccessLayerUpdated ||
        args.guardrails.candidatePromoted ||
        args.guardrails.moduleRuntimeConsumptionChanged ||
        args.guardrails.towerRuntimeReadsCandidateByDefault ||
        args.guardrails.writesPhysicalTables,
      {
        id: "no_runtime_mutation",
        label: "No active/runtime mutation",
        detail:
          "This proof may build a candidate load plan only; it cannot write production tenant data or change runtime reads.",
      },
    ),
    failIf(args.candidatePreview.runtimeEligible, {
      id: "candidate_preview_inactive",
      label: "Candidate preview is inactive",
      detail: "Candidate preview requires explicit promotion before runtime eligibility.",
    }),
  ];
}

export function buildTowerGovernedCandidateLoadReport(
  options: TowerGovernedCandidateLoadOptions,
): TowerGovernedCandidateLoadReport {
  const tenantKey = options.tenantKey ?? DEFAULT_TENANT_KEY;
  const tenantName = options.tenantName ?? DEFAULT_TENANT_NAME;
  const inputRoot = options.inputRoot ?? DEFAULT_INPUT_ROOT;
  const datasetManifestId = options.datasetManifestId ?? DEFAULT_MANIFEST_ID;
  const manifestPath = path.join(
    options.repoRoot,
    "docs/governance/dataset-manifests",
    `${datasetManifestId}.json`,
  );
  const proof = buildTowerV3ContextPackFromTenantInputs({
    tenantKey,
    tenantName,
    activeInputRoot: inputRoot,
  });
  const inputFingerprint = sourceFingerprint({
    repoRoot: options.repoRoot,
    inputRoot,
    proof,
  });
  const candidateId = candidateVersionId(tenantKey, inputFingerprint);
  const guardrails = buildGuardrails();
  const candidatePreview = buildCandidatePreview({
    tenantKey,
    candidateVersionId: candidateId,
    proof,
  });
  const qualityGateChecks = buildQualityGateChecks({
    manifestExists: fs.existsSync(manifestPath),
    proof,
    guardrails,
    candidatePreview,
  });
  const qualityGateStatus: TowerCandidateLoadGateStatus = qualityGateChecks.every(
    (check) => check.status === "pass",
  )
    ? "pass"
    : "fail";

  return {
    reportVersion: TOWER_GOVERNED_CANDIDATE_LOAD_VERSION,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    tenantKey,
    tenantName,
    datasetManifestId,
    inputRoot,
    inputFingerprint,
    candidateVersionId: candidateId,
    guardrails,
    acaJobContract: buildAcaJobContract({
      tenantKey,
      candidateVersionId: candidateId,
      inputFingerprint,
    }),
    sourceDimensions: proof.summary.sourceDimensions,
    towerContextPack: {
      contextPackId: proof.contextPack.contextPackId,
      mode: proof.contextPack.mode,
      truthStatus: proof.contextPack.truthStatus,
      sourceOfTruthPath: proof.contextPack.sourceOfTruthPath,
      projectionPath: proof.contextPack.projectionPath,
      projectionStatus: proof.contextPack.projectionStatus,
      towerTruthCaveats: proof.contextPack.towerTruthCaveats,
    },
    candidatePreview,
    qualityGateStatus,
    qualityGateChecks,
    lineage: {
      sourceFiles: proof.summary.sourceDimensions.map((dimension) => ({
        dimensionKey: dimension.dimensionKey,
        path: path.join(inputRoot, dimension.fileName),
        rowCount: dimension.rowCount,
        evidenceCount: dimension.evidenceCount,
        projectionStatus: dimension.projectionStatus,
      })),
      towerMetricRecordCount: proof.summary.towerMetricRecordCount,
      towerValueRecordCount: proof.summary.towerValueRecordCount,
      towerValueClaimCount: proof.summary.towerValueClaimCount,
    },
    truthSplit: {
      activeContextUpdated: false,
      candidatePreviewCreated: true,
      defaultTowerRuntimeChanged: false,
      cioTowerSourceOfTruth: "bridge_only_diagnostic",
      retrievalState: "not_loaded_not_indexed_not_retrieval_proven_not_cited",
    },
  };
}

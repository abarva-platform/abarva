import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type {
  CandidateProofBundleLink,
  CandidateTenantDataVersionRecord,
} from "../candidate-version-store/candidate-tenant-data-version-store";

export type CandidatePromotionGateDecision =
  | "blocked"
  | "eligible"
  | "ready-for-operator-approval";
export type CandidatePromotionGateCheckStatus = "pass" | "fail" | "blocked";

export interface CandidatePromotionGateCheck {
  checkId: string;
  label: string;
  status: CandidatePromotionGateCheckStatus;
  detail: string;
  evidencePath?: string;
}

export interface CandidatePromotionProofIntegrityCheck {
  stage: CandidateProofBundleLink["stage"];
  path: string;
  expectedFingerprint: string;
  observedFingerprint: string | null;
  status: "pass" | "fail";
}

export interface CandidatePromotionDecisionRecord {
  decisionRecordVersion: "candidate-promotion-decision/v1";
  decisionId: string;
  candidateVersionKey: string;
  tenantKey: string;
  packetId: string;
  priorActiveVersionId: string | null;
  evaluatedAt: string;
  decision: CandidatePromotionGateDecision;
  promotionEnabled: false;
  promotionDisabledReason: string;
  operatorApprovalRequired: true;
  operatorApprovalStatus: "not_requested";
  rollbackPlanRequired: true;
  activePromotionAttempted: false;
  activeTenantAccessLayerUpdated: false;
  writesPhysicalTables: false;
  moduleRuntimeConsumptionChanged: false;
  noModuleReadsCandidateByDefault: true;
  requiredProofChecks: CandidatePromotionGateCheck[];
  passedChecks: string[];
  failedChecks: string[];
  blockers: string[];
  proofBundleIntegrity: {
    allFingerprintsMatched: boolean;
    checks: CandidatePromotionProofIntegrityCheck[];
  };
  rollbackPlan: {
    rollbackPlanRequired: true;
    priorActiveVersionId: string | null;
    rollbackWindowDays: number | null;
    plan: string;
    status: "planned_not_executed";
  };
  promotionPrerequisites: {
    requiredBeforeActivePromotion: string[];
    outstandingBeforeActivePromotion: string[];
  };
  truthBoundary: {
    candidateMetadataEvaluated: true;
    productionTenantDataWritten: false;
    activeTenantAccessLayerUpdated: false;
    moduleRuntimeConsumptionChanged: false;
    candidatePromoted: false;
  };
}

export interface CandidatePromotionGateResult {
  resultVersion: "candidate-promotion-gate/v1";
  generatedAt: string;
  candidateRecordPath: string;
  decisionRecord: CandidatePromotionDecisionRecord;
}

export interface CandidatePromotionGateOptions {
  repoRoot: string;
  candidateRecordPath: string;
  outputDir: string;
  priorActiveVersionId?: string | null;
}

export async function evaluateCandidatePromotionGate(
  options: CandidatePromotionGateOptions,
): Promise<CandidatePromotionGateResult> {
  const candidateRecordAbsolutePath = path.resolve(
    options.repoRoot,
    options.candidateRecordPath,
  );
  const candidate = await readJson<CandidateTenantDataVersionRecord>(
    candidateRecordAbsolutePath,
  );
  const proofIntegrity = await checkProofBundleIntegrity(
    options.repoRoot,
    candidate.proofBundles,
  );
  const requiredProofChecks = buildRequiredChecks(candidate, proofIntegrity);
  const failedChecks = requiredProofChecks
    .filter((check) => check.status === "fail")
    .map((check) => check.checkId);
  const passedChecks = requiredProofChecks
    .filter((check) => check.status === "pass")
    .map((check) => check.checkId);
  const decision = decidePromotionGate(requiredProofChecks);
  const blockers = buildPromotionBlockers(candidate, requiredProofChecks);
  const generatedAt = candidate.createdAt;
  const priorActiveVersionId = options.priorActiveVersionId ?? null;
  const decisionRecord: CandidatePromotionDecisionRecord = {
    decisionRecordVersion: "candidate-promotion-decision/v1",
    decisionId: stableDecisionId(candidate.candidateVersionKey, generatedAt),
    candidateVersionKey: candidate.candidateVersionKey,
    tenantKey: candidate.lineage.tenantKey,
    packetId: candidate.lineage.packetId,
    priorActiveVersionId,
    evaluatedAt: generatedAt,
    decision,
    promotionEnabled: false,
    promotionDisabledReason:
      "PR9 evaluates promotion readiness only. Active promotion remains disabled until a future operator-approved promotion path explicitly enables it.",
    operatorApprovalRequired: true,
    operatorApprovalStatus: "not_requested",
    rollbackPlanRequired: true,
    activePromotionAttempted: false,
    activeTenantAccessLayerUpdated: false,
    writesPhysicalTables: false,
    moduleRuntimeConsumptionChanged: false,
    noModuleReadsCandidateByDefault: true,
    requiredProofChecks,
    passedChecks,
    failedChecks,
    blockers,
    proofBundleIntegrity: proofIntegrity,
    rollbackPlan: {
      rollbackPlanRequired: true,
      priorActiveVersionId,
      rollbackWindowDays: rollbackWindowDays(candidate),
      plan: rollbackPlan(candidate, priorActiveVersionId),
      status: "planned_not_executed",
    },
    promotionPrerequisites: {
      requiredBeforeActivePromotion:
        candidate.promotionControl.requiredProofBeforePromotion,
      outstandingBeforeActivePromotion: [
        "Operator approval has not been requested or granted.",
        "Promotion execution path is disabled by default.",
        "Active Tenant Access Layer pointer update command is not implemented in PR9.",
        "Signed-in candidate preview proof must pass before any active promotion PR.",
      ],
    },
    truthBoundary: {
      candidateMetadataEvaluated: true,
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      moduleRuntimeConsumptionChanged: false,
      candidatePromoted: false,
    },
  };
  const result: CandidatePromotionGateResult = {
    resultVersion: "candidate-promotion-gate/v1",
    generatedAt,
    candidateRecordPath: options.candidateRecordPath,
    decisionRecord,
  };

  await writePromotionGateResult(
    path.resolve(options.repoRoot, options.outputDir),
    result,
  );
  return result;
}

async function checkProofBundleIntegrity(
  repoRoot: string,
  proofBundles: CandidateProofBundleLink[],
): Promise<CandidatePromotionDecisionRecord["proofBundleIntegrity"]> {
  const checks: CandidatePromotionProofIntegrityCheck[] = [];
  for (const proofBundle of proofBundles) {
    const observedFingerprint = await safeFileFingerprint(
      path.resolve(repoRoot, proofBundle.path),
    );
    checks.push({
      stage: proofBundle.stage,
      path: proofBundle.path,
      expectedFingerprint: proofBundle.fingerprint,
      observedFingerprint,
      status: observedFingerprint === proofBundle.fingerprint ? "pass" : "fail",
    });
  }

  return {
    allFingerprintsMatched: checks.every((check) => check.status === "pass"),
    checks,
  };
}

function buildRequiredChecks(
  candidate: CandidateTenantDataVersionRecord,
  proofIntegrity: CandidatePromotionDecisionRecord["proofBundleIntegrity"],
): CandidatePromotionGateCheck[] {
  return [
    check(
      "candidate_status_validated",
      "Candidate status is validated or promotion-ready",
      candidate.currentStatus === "validated" ||
        candidate.currentStatus === "promotion-ready",
      `Candidate status is ${candidate.currentStatus}.`,
    ),
    check(
      "source_dry_run_quality",
      "Source adapter dry-run quality gate passed",
      candidate.qualityGate.sourceDryRun === "pass",
      `Source dry-run quality gate is ${candidate.qualityGate.sourceDryRun}.`,
    ),
    check(
      "target_writer_dry_run_quality",
      "Target writer dry-run quality gate passed",
      candidate.qualityGate.targetWriterDryRun === "pass",
      `Target writer dry-run quality gate is ${candidate.qualityGate.targetWriterDryRun}.`,
    ),
    check(
      "module_readiness_quality",
      "Module readiness proof quality gate passed",
      candidate.qualityGate.moduleReadinessProof === "pass",
      `Module readiness proof quality gate is ${candidate.qualityGate.moduleReadinessProof}.`,
    ),
    check(
      "candidate_persistence_quality",
      "Candidate metadata persistence quality gate passed",
      candidate.qualityGate.candidatePersistence === "pass",
      `Candidate persistence quality gate is ${candidate.qualityGate.candidatePersistence}.`,
    ),
    check(
      "proof_bundle_fingerprints_match",
      "Proof bundle fingerprints match the candidate record",
      proofIntegrity.allFingerprintsMatched,
      proofIntegrity.allFingerprintsMatched
        ? "All proof bundle fingerprints match."
        : "One or more proof bundle fingerprints do not match the candidate record.",
    ),
    check(
      "no_physical_table_writes",
      "Promotion gate does not plan or perform physical table writes",
      candidate.writesPhysicalTables === false &&
        candidate.plannedWriteFootprint.families.every(
          (family) => family.writesPhysicalTables === false,
        ),
      "Candidate and planned write families must remain dry-run only.",
    ),
    check(
      "active_access_layer_unchanged",
      "Active Tenant Access Layer remains unchanged",
      candidate.activeTenantAccessLayerUpdated === false &&
        candidate.promotionControl.activeTenantAccessLayerUpdated === false,
      "Candidate record must not indicate any active access pointer update.",
    ),
    check(
      "module_runtime_unchanged",
      "Module runtime consumption remains unchanged",
      candidate.moduleRuntimeConsumptionChanged === false &&
        candidate.promotionControl.moduleRuntimeConsumptionChanged === false &&
        candidate.moduleReadiness.every(
          (entry) => entry.readyForRuntimeConsumption === false,
        ),
      "Modules must not consume candidate data by default.",
    ),
    check(
      "promotion_disabled_by_default",
      "Promotion execution is disabled by default",
      candidate.promotionControl.promotionEnabled === false,
      "PR9 may evaluate readiness but must not enable promotion.",
    ),
    check(
      "operator_approval_required",
      "Operator approval is required before active promotion",
      candidate.promotionControl.manualPromotionRequired === true,
      "Manual operator approval must remain required.",
    ),
    check(
      "rollback_plan_present",
      "Rollback plan is present before promotion",
      candidate.promotionControl.rollbackPlan.trim().length > 0,
      candidate.promotionControl.rollbackPlan,
    ),
  ];
}

function buildPromotionBlockers(
  candidate: CandidateTenantDataVersionRecord,
  checks: CandidatePromotionGateCheck[],
): string[] {
  const failedChecks = checks.filter((check) => check.status === "fail");
  const blockers = failedChecks.map(
    (check) => `Failed check: ${check.label}. ${check.detail}`,
  );
  blockers.push("Promotion execution is disabled by default in PR9.");
  blockers.push("Operator approval has not been requested or granted.");
  blockers.push(
    "Active Tenant Access Layer pointer update remains unavailable in this release.",
  );
  blockers.push(
    "Module runtime consumption remains unchanged and disabled for candidate data.",
  );
  if (candidate.promotionControl.noModuleReadsCandidateByDefault) {
    blockers.push("No module reads candidate data by default.");
  }

  return unique(blockers);
}

function decidePromotionGate(
  checks: CandidatePromotionGateCheck[],
): CandidatePromotionGateDecision {
  if (checks.some((check) => check.status === "fail")) return "blocked";
  return "ready-for-operator-approval";
}

function check(
  checkId: string,
  label: string,
  passed: boolean,
  detail: string,
  evidencePath?: string,
): CandidatePromotionGateCheck {
  return {
    checkId,
    label,
    status: passed ? "pass" : "fail",
    detail,
    evidencePath,
  };
}

async function writePromotionGateResult(
  outputDir: string,
  result: CandidatePromotionGateResult,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "promotion-gate-result.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "promotion-gate-summary.md"),
    promotionGateSummary(result),
  );
}

function promotionGateSummary(result: CandidatePromotionGateResult): string {
  const decision = result.decisionRecord;
  const checkRows = decision.requiredProofChecks
    .map(
      (check) =>
        `| ${check.checkId} | ${check.status} | ${check.detail.replaceAll("\n", " ")} |`,
    )
    .join("\n");
  const blockers = decision.blockers
    .map((blocker) => `- ${blocker}`)
    .join("\n");
  const integrityRows = decision.proofBundleIntegrity.checks
    .map(
      (check) =>
        `| ${check.stage} | ${check.status} | \`${check.path}\` | ${check.observedFingerprint ?? "missing"} |`,
    )
    .join("\n");

  return `# Candidate Promotion Gate Result

Candidate: \`${decision.candidateVersionKey}\`
Tenant: \`${decision.tenantKey}\`
Packet: \`${decision.packetId}\`
Decision: \`${decision.decision}\`

This result evaluates whether a candidate tenant data version is ready for a future
operator-controlled promotion. It does not promote the candidate, write production tenant
data, update the Active Tenant Access Layer, or change module runtime behavior.

## Guardrails

- Promotion enabled: ${decision.promotionEnabled}
- Operator approval required: ${decision.operatorApprovalRequired}
- Rollback plan required: ${decision.rollbackPlanRequired}
- Physical table writes: ${decision.writesPhysicalTables}
- Active Tenant Access Layer updated: ${decision.activeTenantAccessLayerUpdated}
- Module runtime consumption changed: ${decision.moduleRuntimeConsumptionChanged}

## Required Checks

<!-- prettier-ignore -->
| Check | Status | Detail |
| --- | --- | --- |
${checkRows}

## Proof Bundle Integrity

<!-- prettier-ignore -->
| Stage | Status | Path | Observed fingerprint |
| --- | --- | --- | --- |
${integrityRows}

## Blockers Before Active Promotion

${blockers}

## Rollback Plan

${decision.rollbackPlan.plan}
`;
}

function rollbackPlan(
  candidate: CandidateTenantDataVersionRecord,
  priorActiveVersionId: string | null,
): string {
  const prior =
    priorActiveVersionId ??
    "the current active tenant data version pointer captured by the future promotion command";
  return [
    `Preserve ${prior} before any active pointer change.`,
    candidate.promotionControl.rollbackPlan,
    "If promotion is later rejected or rolled back, restore the prior active pointer and keep this candidate inactive for audit review.",
  ].join(" ");
}

function rollbackWindowDays(
  candidate: CandidateTenantDataVersionRecord,
): number | null {
  const match = candidate.promotionControl.rollbackPlan.match(
    /for (\d+) days/,
  );
  const days = match?.[1] ? Number.parseInt(match[1], 10) : Number.NaN;
  return Number.isFinite(days) ? days : null;
}

function stableDecisionId(
  candidateVersionKey: string,
  generatedAt: string,
): string {
  const digest = crypto
    .createHash("sha256")
    .update(`${candidateVersionKey}:${generatedAt}`)
    .digest("hex")
    .slice(0, 16);
  return `promotion-decision:${digest}`;
}

async function safeFileFingerprint(filePath: string): Promise<string | null> {
  try {
    const bytes = await fs.readFile(filePath);
    return `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`;
  } catch {
    return null;
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

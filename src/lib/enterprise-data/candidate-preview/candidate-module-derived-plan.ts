import fs from "node:fs/promises";
import path from "node:path";

import type { CandidateTenantDataVersionRecord } from "../candidate-version-store/candidate-tenant-data-version-store";
import type {
  CanonicalDomain,
  CanonicalIngestionRecord,
  CanonicalValue,
} from "../contracts/canonical-ingestion";
import type { TenantPacketModule } from "../contracts/tenant-packet";
import type { ModuleReadinessProof } from "../proof-harness/module-readiness-proof";

type DerivedPlanQualityGateStatus = "pass" | "fail";
type WorkbenchModule = "moves" | "source" | "tower";

interface ModuleDerivedPlanGuardrails {
  dryRunOnly: true;
  readOnlyPreview: true;
  productionTenantDataWritten: false;
  writesPhysicalTables: false;
  activeTenantAccessLayerUpdated: false;
  moduleRuntimeConsumptionChanged: false;
  candidatePromoted: false;
  moduleRuntimeRoutesChanged: false;
  noModuleReadsCandidateByDefault: boolean;
}

interface ModuleDerivedPlanEntry {
  derivedObjectKey: string;
  sourceObjectIds: string[];
  domains: CanonicalDomain[];
  targetModules: TenantPacketModule[];
  status: "planned_not_materialized";
  planningPurpose: string;
  evidenceKeys: string[];
  requiredRuntimeProof: string[];
  representativeSignals: Array<{
    sourceObjectId: string;
    label: string;
    domain: CanonicalDomain;
    evidenceKeys: string[];
  }>;
}

interface ModuleDerivedPlanStage {
  stage: "module_targeted_derived_plan";
  status: "pass" | "blocked";
  derivedObjectsPlanned: number;
  derivedEntries: ModuleDerivedPlanEntry[];
}

interface ModuleDerivedPlanSummary {
  resultVersion: "candidate-module-derived-plan/v1";
  tenantKey: string;
  candidateVersionKey: string;
  generatedAt: string;
  qualityGateStatus: DerivedPlanQualityGateStatus;
  requestedModules: WorkbenchModule[];
  guardrails: ModuleDerivedPlanGuardrails;
  counts: {
    sourceRecordsRead: number;
    modulePlansGenerated: number;
    derivedObjectsPlanned: number;
    sourceFactsCovered: number;
    towerFactsCovered: number;
    movesFactsCovered: number;
    runtimeReadyModules: 0;
  };
  outputPaths: {
    stagePath: string;
    proofPath: string;
    summaryPath: string;
    summaryMdPath: string;
  };
}

export interface CandidateModuleDerivedPlanProof {
  summary: ModuleDerivedPlanSummary;
  candidateRecord: Pick<
    CandidateTenantDataVersionRecord,
    | "candidateVersionKey"
    | "currentStatus"
    | "dryRunOnly"
    | "writesPhysicalTables"
    | "activeTenantAccessLayerUpdated"
    | "moduleRuntimeConsumptionChanged"
    | "lineage"
    | "promotionControl"
  >;
  moduleDerivedPlanStage: ModuleDerivedPlanStage;
}

export interface CandidateModuleDerivedPlanOptions {
  repoRoot: string;
  candidateRecordPath?: string;
  moduleReadinessProofPath?: string;
  outputDir?: string;
  generatedAt?: string;
}

const DEFAULT_CANDIDATE_RECORD_PATH =
  "reports/candidate-tenant-data-versions/skyharbor/candidate-version-record.json";
const DEFAULT_MODULE_READINESS_PROOF_PATH =
  "reports/module-readiness-proof/skyharbor/module-readiness-proof.json";
const DEFAULT_OUTPUT_DIR = "reports/candidate-module-derived-plans/skyharbor";
const MODULES: WorkbenchModule[] = ["moves", "source", "tower"];

export async function buildCandidateModuleDerivedPlan(
  options: CandidateModuleDerivedPlanOptions,
): Promise<CandidateModuleDerivedPlanProof> {
  const candidateRecord = await readJson<CandidateTenantDataVersionRecord>(
    resolve(
      options,
      options.candidateRecordPath,
      DEFAULT_CANDIDATE_RECORD_PATH,
    ),
  );
  const moduleProof = await readJson<ModuleReadinessProof>(
    resolve(
      options,
      options.moduleReadinessProofPath,
      DEFAULT_MODULE_READINESS_PROOF_PATH,
    ),
  );

  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const generatedAt = options.generatedAt ?? "2026-07-10T00:00:00.000Z";
  const guardrails = buildGuardrails(candidateRecord);
  const moduleDerivedPlanStage = buildModuleDerivedPlanStage(
    moduleProof.sourceRecords,
  );
  const counts = {
    movesFactsCovered: countForModule(
      "moves",
      moduleDerivedPlanStage.derivedEntries,
    ),
    sourceFactsCovered: countForModule(
      "source",
      moduleDerivedPlanStage.derivedEntries,
    ),
    towerFactsCovered: countForModule(
      "tower",
      moduleDerivedPlanStage.derivedEntries,
    ),
  };
  const qualityGateStatus: DerivedPlanQualityGateStatus =
    guardrails.noModuleReadsCandidateByDefault &&
    candidateRecord.currentStatus === "validated" &&
    moduleDerivedPlanStage.status === "pass" &&
    moduleDerivedPlanStage.derivedEntries.length === MODULES.length
      ? "pass"
      : "fail";

  const summary: ModuleDerivedPlanSummary = {
    resultVersion: "candidate-module-derived-plan/v1",
    tenantKey: candidateRecord.lineage.tenantKey,
    candidateVersionKey: candidateRecord.candidateVersionKey,
    generatedAt,
    qualityGateStatus,
    requestedModules: MODULES,
    guardrails,
    counts: {
      sourceRecordsRead: moduleProof.sourceRecords.length,
      modulePlansGenerated: moduleDerivedPlanStage.derivedEntries.length,
      derivedObjectsPlanned: moduleDerivedPlanStage.derivedObjectsPlanned,
      runtimeReadyModules: 0,
      ...counts,
    },
    outputPaths: {
      stagePath: path.join(outputDir, "module-derived-plan-stage.json"),
      proofPath: path.join(
        outputDir,
        "candidate-module-derived-plan-proof.json",
      ),
      summaryPath: path.join(outputDir, "summary.json"),
      summaryMdPath: path.join(outputDir, "README.md"),
    },
  };

  const proof: CandidateModuleDerivedPlanProof = {
    summary,
    candidateRecord: {
      candidateVersionKey: candidateRecord.candidateVersionKey,
      currentStatus: candidateRecord.currentStatus,
      dryRunOnly: candidateRecord.dryRunOnly,
      writesPhysicalTables: candidateRecord.writesPhysicalTables,
      activeTenantAccessLayerUpdated:
        candidateRecord.activeTenantAccessLayerUpdated,
      moduleRuntimeConsumptionChanged:
        candidateRecord.moduleRuntimeConsumptionChanged,
      lineage: candidateRecord.lineage,
      promotionControl: candidateRecord.promotionControl,
    },
    moduleDerivedPlanStage,
  };

  await writeArtifacts(path.resolve(options.repoRoot, outputDir), proof);
  if (qualityGateStatus !== "pass") {
    throw new Error("Candidate module derived-plan quality gate failed.");
  }
  return proof;
}

function buildModuleDerivedPlanStage(
  records: CanonicalIngestionRecord[],
): ModuleDerivedPlanStage {
  const derivedEntries = MODULES.map((module) => {
    const selectedRecords = selectRecordsForModule(module, records);
    return {
      derivedObjectKey: `candidate-workbench-derived:${module}`,
      sourceObjectIds: selectedRecords.map((record) => record.sourceObjectId),
      domains: [...new Set(selectedRecords.map((record) => record.domain))],
      targetModules: [module],
      status: "planned_not_materialized" as const,
      planningPurpose: planningPurposeForModule(module),
      evidenceKeys: [
        ...new Set(
          selectedRecords.flatMap((record) =>
            record.evidenceReferences.map((reference) => reference.evidenceKey),
          ),
        ),
      ],
      requiredRuntimeProof: requiredRuntimeProofForModule(module),
      representativeSignals: selectedRecords.slice(0, 8).map((record) => ({
        sourceObjectId: record.sourceObjectId,
        label: labelOf(record),
        domain: record.domain,
        evidenceKeys: record.evidenceReferences.map(
          (reference) => reference.evidenceKey,
        ),
      })),
    };
  }).filter((entry) => entry.sourceObjectIds.length > 0);

  return {
    stage: "module_targeted_derived_plan",
    status: derivedEntries.length === MODULES.length ? "pass" : "blocked",
    derivedObjectsPlanned: derivedEntries.length,
    derivedEntries,
  };
}

function selectRecordsForModule(
  module: WorkbenchModule,
  records: CanonicalIngestionRecord[],
): CanonicalIngestionRecord[] {
  return records
    .filter((record) => {
      const text = searchable(record);
      if (module === "moves") {
        return (
          record.sourceObjectId.includes("move") ||
          text.includes("irops") ||
          text.includes("crew recovery") ||
          text.includes("reaccommodation") ||
          text.includes("disruption") ||
          text.includes("recovery command")
        );
      }
      if (module === "source") {
        return (
          record.sourceObjectId.includes("source") ||
          record.sourceObjectId.includes("ven") ||
          text.includes("contract") ||
          text.includes("vendor") ||
          text.includes("invoice") ||
          text.includes("sourcing") ||
          text.includes("service-performance")
        );
      }
      return (
        record.sourceObjectId.includes("spend") ||
        text.includes("tower value") ||
        text.includes("value signal") ||
        text.includes("cost") ||
        text.includes("invoice") ||
        text.includes("resource count") ||
        text.includes("outcome")
      );
    })
    .slice(0, 36);
}

function planningPurposeForModule(module: WorkbenchModule): string {
  if (module === "moves") {
    return "Plan phase-workspace candidate context for governed P0-P5 execution without advancing a live Move.";
  }
  if (module === "source") {
    return "Plan candidate sourcing context across vendors, contracts, artifacts, and commercial evidence without starting a live sourcing event.";
  }
  return "Plan candidate outcome-ledger context across value signals, cost evidence, and leakage controls without claiming realized value.";
}

function requiredRuntimeProofForModule(module: WorkbenchModule): string[] {
  if (module === "moves") {
    return [
      "Promote an approved candidate version through an explicit operator gate.",
      "Run a signed-in phase workspace proof against the promoted active slice.",
      "Prove phase evidence, gate criteria, and deliverable generation stay evidence-scoped.",
    ];
  }
  if (module === "source") {
    return [
      "Promote an approved candidate version through an explicit operator gate.",
      "Run a signed-in Source workflow proof against promoted vendor, contract, and artifact context.",
      "Prove generated RFP/contract artifacts preserve source lineage and human approval.",
    ];
  }
  return [
    "Promote an approved candidate version through an explicit operator gate.",
    "Run a signed-in Tower proof against promoted outcome-ledger preview records.",
    "Prove projected value, measured value, leakage, and ROI claims are evidence-bound before executive display.",
  ];
}

function buildGuardrails(
  candidateRecord: CandidateTenantDataVersionRecord,
): ModuleDerivedPlanGuardrails {
  return {
    dryRunOnly: true,
    readOnlyPreview: true,
    productionTenantDataWritten: false,
    writesPhysicalTables: false,
    activeTenantAccessLayerUpdated: false,
    moduleRuntimeConsumptionChanged: false,
    candidatePromoted: false,
    moduleRuntimeRoutesChanged: false,
    noModuleReadsCandidateByDefault:
      candidateRecord.promotionControl.noModuleReadsCandidateByDefault,
  };
}

function countForModule(
  module: WorkbenchModule,
  entries: ModuleDerivedPlanEntry[],
): number {
  return (
    entries.find((entry) => entry.targetModules.includes(module))
      ?.sourceObjectIds.length ?? 0
  );
}

function searchable(record: CanonicalIngestionRecord): string {
  return [
    record.sourceObjectId,
    record.objectType,
    record.domain,
    ...Object.values(record.attributes).map((value) => stringify(value.value)),
  ]
    .join(" ")
    .toLowerCase();
}

function labelOf(record: CanonicalIngestionRecord): string {
  const candidate =
    record.attributes.name?.value ??
    record.attributes.title?.value ??
    record.attributes.label?.value ??
    record.attributes.metric?.value ??
    record.sourceObjectId;
  return stringify(candidate);
}

function stringify(value: CanonicalValue["value"] | undefined): string {
  if (value === undefined || value === null) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return JSON.stringify(value);
}

async function writeArtifacts(
  outputDir: string,
  proof: CandidateModuleDerivedPlanProof,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "module-derived-plan-stage.json"),
    `${JSON.stringify(proof.moduleDerivedPlanStage, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "candidate-module-derived-plan-proof.json"),
    `${JSON.stringify(proof, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "summary.json"),
    `${JSON.stringify(proof.summary, null, 2)}\n`,
  );
  await fs.writeFile(path.join(outputDir, "README.md"), summaryMd(proof));
}

function summaryMd(proof: CandidateModuleDerivedPlanProof): string {
  const rows = proof.moduleDerivedPlanStage.derivedEntries
    .map(
      (entry) =>
        `| ${entry.targetModules.join(", ")} | ${entry.sourceObjectIds.length} | ${entry.evidenceKeys.length} | ${entry.status} | ${entry.planningPurpose} |`,
    )
    .join("\n");
  return `# Candidate Module Derived Plan

Tenant: \`${proof.summary.tenantKey}\`
Candidate: \`${proof.summary.candidateVersionKey}\`
Generated: \`${proof.summary.generatedAt}\`

This report creates module-targeted derived-plan objects for inactive candidate
workbench previews. It does not write production tenant data, update active
tenant access, promote the candidate, change module runtime behavior, or let
modules read candidate data by default.

## Summary

- Quality gate: ${proof.summary.qualityGateStatus}
- Source records read: ${proof.summary.counts.sourceRecordsRead}
- Derived objects planned: ${proof.summary.counts.derivedObjectsPlanned}
- Moves facts covered: ${proof.summary.counts.movesFactsCovered}
- Source facts covered: ${proof.summary.counts.sourceFactsCovered}
- Tower facts covered: ${proof.summary.counts.towerFactsCovered}
- Runtime-ready modules: ${proof.summary.counts.runtimeReadyModules}

## Module Plans

| Module | Source facts | Evidence keys | Status | Purpose |
| --- | ---: | ---: | --- | --- |
${rows}

## Guardrails

- Production tenant data written: ${proof.summary.guardrails.productionTenantDataWritten}
- Active Tenant Access Layer updated: ${proof.summary.guardrails.activeTenantAccessLayerUpdated}
- Candidate promoted: ${proof.summary.guardrails.candidatePromoted}
- Module runtime routes changed: ${proof.summary.guardrails.moduleRuntimeRoutesChanged}
- No module reads candidate by default: ${proof.summary.guardrails.noModuleReadsCandidateByDefault}
`;
}

function resolve(
  options: CandidateModuleDerivedPlanOptions,
  filePath: string | undefined,
  fallback: string,
): string {
  return path.resolve(options.repoRoot, filePath ?? fallback);
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

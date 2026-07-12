import fs from "node:fs/promises";
import path from "node:path";

import type { CandidateTenantDataVersionRecord } from "../candidate-version-store/candidate-tenant-data-version-store";
import type {
  CanonicalDomain,
  CanonicalIngestionRecord,
  CanonicalValue,
} from "../contracts/canonical-ingestion";
import type {
  EvidenceBoundary,
  ModuleContextPacket,
} from "../contracts/module-context-apis";
import type { TargetWriteOperation } from "../contracts/target-writer";

type PreviewModule = "home" | "intelligence";
type PreviewQualityGateStatus = "pass" | "fail";

interface PromotionGateDecisionRecord {
  decision?: string;
  promotionEnabled?: boolean;
  activePromotionAttempted?: boolean;
  activeTenantAccessLayerUpdated?: boolean;
  writesPhysicalTables?: boolean;
  moduleRuntimeConsumptionChanged?: boolean;
  noModuleReadsCandidateByDefault?: boolean;
  passedChecks?: string[];
  failedChecks?: string[];
  blockers?: string[];
}

interface PromotionGateResult {
  decisionRecord?: PromotionGateDecisionRecord;
}

interface PreviewGuardrails {
  dryRunOnly: true;
  readOnlyPreview: true;
  productionTenantDataWritten: false;
  writesPhysicalTables: false;
  activeTenantAccessLayerUpdated: false;
  moduleRuntimeConsumptionChanged: false;
  candidatePromoted: false;
  noModuleReadsCandidateByDefault: boolean;
  moduleRuntimeRoutesChanged: false;
}

interface PreviewFact {
  objectType: string;
  sourceObjectId: string;
  canonicalObjectKey?: string;
  domain: CanonicalDomain;
  label: string;
  previewValues: Record<string, string | number | boolean | null>;
  evidenceKeys: string[];
  qualityStatus: string;
  dataStatus: string;
  confidence?: number;
}

interface DerivedPreviewInsight {
  insightKey: string;
  domain: CanonicalDomain;
  recordCount: number;
  evidenceCount: number;
  modules: PreviewModule[];
  signal: string;
}

interface HomePreviewPacket extends ModuleContextPacket {
  module: "home";
  previewMode: true;
  runtimeEligible: false;
  enterpriseProfile: {
    tenantKey: string;
    candidateVersionKey: string;
    topEntities: PreviewFact[];
    coverageSummary: Record<string, number>;
  };
  chartInputs: {
    domainMix: Array<{ domain: string; records: number }>;
    objectTypeMix: Array<{ objectType: string; records: number }>;
    evidenceCoverage: Array<{ objectType: string; evidenceReferences: number }>;
    qualityMix: Array<{ qualityStatus: string; records: number }>;
  };
  previewWarnings: string[];
}

interface IntelligencePreviewPacket extends ModuleContextPacket {
  module: "intelligence";
  previewMode: true;
  runtimeEligible: false;
  answerabilityScore: {
    score: number;
    status: "preview_only" | "blocked";
    rationale: string;
  };
  recommendedQuestions: string[];
  blockedClaims: string[];
  citationCandidates: Array<{
    evidenceKey: string;
    sourceObjectId?: string;
    excerpt?: string;
    confidence?: number;
  }>;
  previewWarnings: string[];
}

export interface CandidateModulePreviewSummary {
  resultVersion: "candidate-module-preview/v1";
  tenantKey: string;
  candidateVersionKey: string;
  generatedAt: string;
  requestedModules: PreviewModule[];
  previewQualityGateStatus: PreviewQualityGateStatus;
  blockers: string[];
  guardrails: PreviewGuardrails;
  counts: {
    canonicalRecordsRead: number;
    targetOperationsRead: number;
    evidenceKeys: number;
    homeFacts: number;
    intelligenceFacts: number;
    derivedPreviewInsights: number;
  };
  promotionGate: {
    decision: string;
    promotionEnabled: false;
    failedChecks: number;
    blockers: number;
  };
  outputPaths: {
    homePreviewPath: string;
    intelligencePreviewPath: string;
    proofPath: string;
    summaryPath: string;
  };
}

export interface CandidateModulePreviewProof {
  summary: CandidateModulePreviewSummary;
  candidateRecord: Pick<
    CandidateTenantDataVersionRecord,
    | "candidateVersionKey"
    | "currentStatus"
    | "dryRunOnly"
    | "writesPhysicalTables"
    | "activeTenantAccessLayerUpdated"
    | "moduleRuntimeConsumptionChanged"
    | "lineage"
    | "qualityGate"
    | "promotionControl"
  >;
  homePreview: HomePreviewPacket;
  intelligencePreview: IntelligencePreviewPacket;
}

export interface CandidateModulePreviewOptions {
  repoRoot: string;
  candidateRecordPath?: string;
  promotionGatePath?: string;
  outputDir?: string;
  generatedAt?: string;
}

const DEFAULT_CANDIDATE_RECORD_PATH =
  "reports/candidate-tenant-data-versions/skyharbor/candidate-version-record.json";
const DEFAULT_PROMOTION_GATE_PATH =
  "reports/candidate-promotion-gates/skyharbor/promotion-gate-result.json";
const DEFAULT_OUTPUT_DIR = "reports/candidate-module-previews/skyharbor";

export async function buildCandidateModulePreview(
  options: CandidateModulePreviewOptions,
): Promise<CandidateModulePreviewProof> {
  const candidateRecordPath =
    options.candidateRecordPath ?? DEFAULT_CANDIDATE_RECORD_PATH;
  const promotionGatePath =
    options.promotionGatePath ?? DEFAULT_PROMOTION_GATE_PATH;
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const generatedAt = options.generatedAt ?? "2026-07-10T00:00:00.000Z";

  const candidateRecord = await readJson<CandidateTenantDataVersionRecord>(
    path.resolve(options.repoRoot, candidateRecordPath),
  );
  const promotionGate = await readJson<PromotionGateResult>(
    path.resolve(options.repoRoot, promotionGatePath),
  );
  const sourceRecords = await readJson<CanonicalIngestionRecord[]>(
    path.resolve(
      options.repoRoot,
      proofPath(candidateRecord, "file_to_canonical_object"),
    ),
  );
  const targetOperations = await readJson<TargetWriteOperation[]>(
    path.resolve(
      options.repoRoot,
      proofPath(candidateRecord, "canonical_object_to_fact_plan"),
    ),
  );

  const previewFacts = sourceRecords.map(toPreviewFact);
  const evidenceBoundary = buildEvidenceBoundary(sourceRecords);
  const derivedInsights = buildDerivedPreviewInsights(sourceRecords);
  const guardrails = buildGuardrails(candidateRecord, promotionGate);
  const blockers = buildPreviewBlockers(
    candidateRecord,
    promotionGate,
    sourceRecords,
  );
  const previewQualityGateStatus: PreviewQualityGateStatus =
    blockers.length === 0 ? "pass" : "fail";

  const homePreview = buildHomePreview({
    candidateRecord,
    generatedAt,
    evidenceBoundary,
    previewFacts,
    derivedInsights,
    guardrails,
    blockers,
  });
  const intelligencePreview = buildIntelligencePreview({
    candidateRecord,
    generatedAt,
    evidenceBoundary,
    previewFacts,
    derivedInsights,
    guardrails,
    blockers,
  });

  const outputPaths = {
    homePreviewPath: path.join(outputDir, "home-context-preview.json"),
    intelligencePreviewPath: path.join(
      outputDir,
      "intelligence-context-preview.json",
    ),
    proofPath: path.join(outputDir, "candidate-module-preview-proof.json"),
    summaryPath: path.join(outputDir, "preview-summary.json"),
  };
  const summary: CandidateModulePreviewSummary = {
    resultVersion: "candidate-module-preview/v1",
    tenantKey: candidateRecord.lineage.tenantKey,
    candidateVersionKey: candidateRecord.candidateVersionKey,
    generatedAt,
    requestedModules: ["home", "intelligence"],
    previewQualityGateStatus,
    blockers,
    guardrails,
    counts: {
      canonicalRecordsRead: sourceRecords.length,
      targetOperationsRead: targetOperations.length,
      evidenceKeys: evidenceBoundary.evidenceKeys.length,
      homeFacts: homePreview.facts.length,
      intelligenceFacts: intelligencePreview.facts.length,
      derivedPreviewInsights: derivedInsights.length,
    },
    promotionGate: {
      decision: promotionGate.decisionRecord?.decision ?? "unknown",
      promotionEnabled: false,
      failedChecks: promotionGate.decisionRecord?.failedChecks?.length ?? 0,
      blockers: promotionGate.decisionRecord?.blockers?.length ?? 0,
    },
    outputPaths,
  };

  const proof: CandidateModulePreviewProof = {
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
      qualityGate: candidateRecord.qualityGate,
      promotionControl: candidateRecord.promotionControl,
    },
    homePreview,
    intelligencePreview,
  };

  await writePreviewArtifacts(path.resolve(options.repoRoot, outputDir), proof);
  return proof;
}

function proofPath(
  candidateRecord: CandidateTenantDataVersionRecord,
  stage: CandidateTenantDataVersionRecord["proofBundles"][number]["stage"],
): string {
  const link = candidateRecord.proofBundles.find(
    (proofBundle) => proofBundle.stage === stage,
  );
  if (!link) throw new Error(`Missing candidate proof bundle stage: ${stage}`);
  return link.path;
}

function buildGuardrails(
  candidateRecord: CandidateTenantDataVersionRecord,
  promotionGate: PromotionGateResult,
): PreviewGuardrails {
  return {
    dryRunOnly: true,
    readOnlyPreview: true,
    productionTenantDataWritten: false,
    writesPhysicalTables: false,
    activeTenantAccessLayerUpdated: false,
    moduleRuntimeConsumptionChanged: false,
    candidatePromoted: false,
    noModuleReadsCandidateByDefault:
      candidateRecord.promotionControl.noModuleReadsCandidateByDefault &&
      promotionGate.decisionRecord?.noModuleReadsCandidateByDefault !== false,
    moduleRuntimeRoutesChanged: false,
  };
}

function buildPreviewBlockers(
  candidateRecord: CandidateTenantDataVersionRecord,
  promotionGate: PromotionGateResult,
  sourceRecords: CanonicalIngestionRecord[],
): string[] {
  const blockers: string[] = [];
  if (
    !["validated", "promotion-ready"].includes(candidateRecord.currentStatus)
  ) {
    blockers.push(`Candidate status is ${candidateRecord.currentStatus}.`);
  }
  if (sourceRecords.length === 0) {
    blockers.push("No canonical records are available for preview.");
  }
  if (candidateRecord.writesPhysicalTables) {
    blockers.push("Candidate record indicates physical table writes.");
  }
  if (candidateRecord.activeTenantAccessLayerUpdated) {
    blockers.push(
      "Candidate record indicates Active Tenant Access Layer update.",
    );
  }
  if (candidateRecord.moduleRuntimeConsumptionChanged) {
    blockers.push(
      "Candidate record indicates module runtime consumption changed.",
    );
  }
  if (promotionGate.decisionRecord?.promotionEnabled) {
    blockers.push("Promotion gate unexpectedly enabled promotion.");
  }
  if ((promotionGate.decisionRecord?.failedChecks?.length ?? 0) > 0) {
    blockers.push("Promotion gate has failed checks.");
  }
  if (promotionGate.decisionRecord?.activePromotionAttempted) {
    blockers.push("Promotion gate indicates active promotion was attempted.");
  }
  if (
    !candidateRecord.promotionControl.noModuleReadsCandidateByDefault ||
    promotionGate.decisionRecord?.noModuleReadsCandidateByDefault === false
  ) {
    blockers.push("Candidate data may be read by modules by default.");
  }
  return blockers;
}

function buildHomePreview(input: {
  candidateRecord: CandidateTenantDataVersionRecord;
  generatedAt: string;
  evidenceBoundary: EvidenceBoundary;
  previewFacts: PreviewFact[];
  derivedInsights: DerivedPreviewInsight[];
  guardrails: PreviewGuardrails;
  blockers: string[];
}): HomePreviewPacket {
  const homeFacts = input.previewFacts.filter((fact) =>
    [
      "enterprise_structure",
      "technology_estate",
      "risk_control_governance",
      "transformation_ai_portfolio",
    ].includes(fact.domain),
  );
  const topEntities = [
    ...homeFacts.filter((fact) => fact.objectType === "enterprise_profile"),
    ...homeFacts.filter((fact) => fact.objectType !== "enterprise_profile"),
  ].slice(0, 12);
  const previewWarnings = [
    "Candidate preview is read-only and not active tenant truth.",
    "Home runtime routes are unchanged; this packet is not consumed by default.",
    ...input.blockers,
  ];

  return {
    tenantKey: input.candidateRecord.lineage.tenantKey,
    tenantDataVersion: input.candidateRecord.candidateVersionKey,
    generatedAt: input.generatedAt,
    evidenceBoundary: input.evidenceBoundary,
    facts: homeFacts,
    relationships: [],
    derivedInsights: input.derivedInsights.filter((insight) =>
      insight.modules.includes("home"),
    ),
    moduleMemory: [],
    module: "home",
    previewMode: true,
    runtimeEligible: false,
    enterpriseProfile: {
      tenantKey: input.candidateRecord.lineage.tenantKey,
      candidateVersionKey: input.candidateRecord.candidateVersionKey,
      topEntities,
      coverageSummary: {
        canonicalRecords: input.previewFacts.length,
        homeRelevantRecords: homeFacts.length,
        evidenceKeys: input.evidenceBoundary.evidenceKeys.length,
        graphRelationships: 0,
      },
    },
    chartInputs: {
      domainMix: countDomainMix(input.previewFacts),
      objectTypeMix: countObjectTypeMix(input.previewFacts),
      evidenceCoverage: countEvidenceByObjectType(input.previewFacts),
      qualityMix: countQualityMix(input.previewFacts),
    },
    previewWarnings,
  };
}

function buildIntelligencePreview(input: {
  candidateRecord: CandidateTenantDataVersionRecord;
  generatedAt: string;
  evidenceBoundary: EvidenceBoundary;
  previewFacts: PreviewFact[];
  derivedInsights: DerivedPreviewInsight[];
  guardrails: PreviewGuardrails;
  blockers: string[];
}): IntelligencePreviewPacket {
  const intelligenceFacts = input.previewFacts.filter((fact) =>
    [
      "enterprise_structure",
      "technology_estate",
      "vendor_commercial_estate",
      "financial_value",
      "risk_control_governance",
      "transformation_ai_portfolio",
    ].includes(fact.domain),
  );
  const citationCandidates = input.previewFacts
    .flatMap((fact) =>
      fact.evidenceKeys.map((evidenceKey) => ({
        evidenceKey,
        sourceObjectId: fact.sourceObjectId,
        excerpt: String(fact.previewValues.notes ?? fact.label).slice(0, 240),
        confidence: fact.confidence,
      })),
    )
    .slice(0, 20);
  const score = answerabilityScore(
    input.previewFacts,
    citationCandidates.length,
  );
  const previewWarnings = [
    "Candidate preview can be inspected by operators but is not used for default Intelligence answers.",
    "Unsupported realized-value, production-write, or active-promotion claims must remain blocked.",
    ...input.blockers,
  ];

  return {
    tenantKey: input.candidateRecord.lineage.tenantKey,
    tenantDataVersion: input.candidateRecord.candidateVersionKey,
    generatedAt: input.generatedAt,
    evidenceBoundary: input.evidenceBoundary,
    facts: intelligenceFacts,
    relationships: [],
    derivedInsights: input.derivedInsights.filter((insight) =>
      insight.modules.includes("intelligence"),
    ),
    moduleMemory: [],
    module: "intelligence",
    previewMode: true,
    runtimeEligible: false,
    answerabilityScore: {
      score,
      status: input.blockers.length === 0 ? "preview_only" : "blocked",
      rationale:
        "Score reflects candidate record count, evidence coverage, and promotion-gate health. It is not a runtime answer-quality claim.",
    },
    recommendedQuestions: [
      "What enterprise facts would Home show if this candidate were promoted?",
      "Which SkyHarbor systems, vendors, and evidence records are visible in the candidate?",
      "What remains blocked before Intelligence can use this candidate as active truth?",
      "Which claims should stay prohibited because this is synthetic planning-grade data?",
    ],
    blockedClaims: [
      "This candidate has been promoted to active tenant truth.",
      "Home and Intelligence read this candidate by default.",
      "Production tenant tables were written by this preview.",
      "Projected value is realized or finance-attested.",
      "Synthetic SkyHarbor data is real production client data.",
    ],
    citationCandidates,
    previewWarnings,
  };
}

function buildEvidenceBoundary(
  records: CanonicalIngestionRecord[],
): EvidenceBoundary {
  const evidenceKeys = unique(
    records.flatMap((record) =>
      record.evidenceReferences.map((reference) => reference.evidenceKey),
    ),
  );
  const staleEvidenceKeys = unique(
    records
      .flatMap((record) => record.evidenceReferences)
      .filter((reference) => (reference.confidence ?? 1) < 0.6)
      .map((reference) => reference.evidenceKey),
  );
  const unsupportedClaimRisk = records.some(
    (record) => record.dataStatus === "synthetic",
  )
    ? "medium"
    : "low";

  return {
    evidenceKeys,
    excludedEvidenceKeys: [],
    staleEvidenceKeys,
    unsupportedClaimRisk,
  };
}

function buildDerivedPreviewInsights(
  records: CanonicalIngestionRecord[],
): DerivedPreviewInsight[] {
  const byDomain = new Map<CanonicalDomain, CanonicalIngestionRecord[]>();
  for (const record of records) {
    byDomain.set(record.domain, [
      ...(byDomain.get(record.domain) ?? []),
      record,
    ]);
  }
  return [...byDomain.entries()].map(([domain, domainRecords]) => ({
    insightKey: `candidate-preview:${domain}`,
    domain,
    recordCount: domainRecords.length,
    evidenceCount: unique(
      domainRecords.flatMap((record) =>
        record.evidenceReferences.map((reference) => reference.evidenceKey),
      ),
    ).length,
    modules: previewModulesForDomain(domain),
    signal: `${domainRecords.length} candidate records are visible for ${domain}; preview remains read-only until promotion is approved.`,
  }));
}

function previewModulesForDomain(domain: CanonicalDomain): PreviewModule[] {
  switch (domain) {
    case "enterprise_structure":
    case "technology_estate":
    case "risk_control_governance":
    case "transformation_ai_portfolio":
      return ["home", "intelligence"];
    default:
      return ["intelligence"];
  }
}

function toPreviewFact(record: CanonicalIngestionRecord): PreviewFact {
  return {
    objectType: record.objectType,
    sourceObjectId: record.sourceObjectId,
    canonicalObjectKey: record.canonicalObjectKey,
    domain: record.domain,
    label: labelForRecord(record),
    previewValues: previewValues(record.attributes),
    evidenceKeys: unique(
      record.evidenceReferences.map((reference) => reference.evidenceKey),
    ),
    qualityStatus: record.qualityStatus,
    dataStatus: record.dataStatus,
    confidence: record.confidence,
  };
}

function labelForRecord(record: CanonicalIngestionRecord): string {
  for (const key of ["entity_name", "evidence_title", "name", "title"]) {
    const value = record.attributes[key]?.value;
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return record.canonicalObjectKey ?? record.sourceObjectId;
}

function previewValues(
  attributes: Record<string, CanonicalValue>,
): Record<string, string | number | boolean | null> {
  const entries = Object.entries(attributes)
    .slice(0, 8)
    .map(([key, value]) => [key, scalarPreview(value.value)] as const);
  return Object.fromEntries(entries);
}

function scalarPreview(
  value: CanonicalValue["value"],
): string | number | boolean | null {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  return JSON.stringify(value).slice(0, 180);
}

function countValues<T>(
  values: T[],
  keyFn: (value: T) => string,
): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = keyFn(value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
}

function countDomainMix(
  facts: PreviewFact[],
): Array<{ domain: string; records: number }> {
  return countValues(facts, (fact) => fact.domain).map(([domain, records]) => ({
    domain,
    records,
  }));
}

function countObjectTypeMix(
  facts: PreviewFact[],
): Array<{ objectType: string; records: number }> {
  return countValues(facts, (fact) => fact.objectType).map(
    ([objectType, records]) => ({
      objectType,
      records,
    }),
  );
}

function countQualityMix(
  facts: PreviewFact[],
): Array<{ qualityStatus: string; records: number }> {
  return countValues(facts, (fact) => fact.qualityStatus).map(
    ([qualityStatus, records]) => ({
      qualityStatus,
      records,
    }),
  );
}

function countEvidenceByObjectType(
  facts: PreviewFact[],
): Array<{ objectType: string; evidenceReferences: number }> {
  const counts = new Map<string, number>();
  for (const fact of facts) {
    counts.set(
      fact.objectType,
      (counts.get(fact.objectType) ?? 0) + fact.evidenceKeys.length,
    );
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([objectType, evidenceReferences]) => ({
      objectType,
      evidenceReferences,
    }));
}

function answerabilityScore(
  facts: PreviewFact[],
  citationCount: number,
): number {
  const qualityFactor = facts.length > 0 ? 35 : 0;
  const evidenceFactor = Math.min(35, citationCount * 2);
  const domainFactor = Math.min(
    20,
    new Set(facts.map((fact) => fact.domain)).size * 5,
  );
  const syntheticPenalty = facts.some((fact) => fact.dataStatus === "synthetic")
    ? 8
    : 0;
  return Math.max(
    0,
    Math.min(
      100,
      qualityFactor + evidenceFactor + domainFactor - syntheticPenalty,
    ),
  );
}

async function writePreviewArtifacts(
  outputDir: string,
  proof: CandidateModulePreviewProof,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "home-context-preview.json"),
    `${JSON.stringify(proof.homePreview, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "intelligence-context-preview.json"),
    `${JSON.stringify(proof.intelligencePreview, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "candidate-module-preview-proof.json"),
    `${JSON.stringify(proof, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "preview-summary.json"),
    `${JSON.stringify(proof.summary, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "preview-summary.md"),
    summaryMd(proof),
  );
}

function summaryMd(proof: CandidateModulePreviewProof): string {
  const summary = proof.summary;
  const blockers = summary.blockers.length
    ? summary.blockers.map((blocker) => `- ${blocker}`).join("\n")
    : "- None for read-only preview.";
  return `# Candidate Module Preview

Tenant: \`${summary.tenantKey}\`
Candidate: \`${summary.candidateVersionKey}\`
Generated: \`${summary.generatedAt}\`

This proof bundle previews how Home and Intelligence could inspect an inactive
candidate tenant data version. It does not write production tenant data, update
the Active Tenant Access Layer, promote a candidate, or change module runtime
consumption.

## Quality Gate

- Preview quality gate: ${summary.previewQualityGateStatus}
- Canonical records read: ${summary.counts.canonicalRecordsRead}
- Target operations read: ${summary.counts.targetOperationsRead}
- Evidence keys: ${summary.counts.evidenceKeys}
- Home preview facts: ${summary.counts.homeFacts}
- Intelligence preview facts: ${summary.counts.intelligenceFacts}
- Promotion decision: ${summary.promotionGate.decision}
- Promotion enabled: ${summary.promotionGate.promotionEnabled}

## Guardrails

- Read-only preview: ${summary.guardrails.readOnlyPreview}
- Production tenant data written: ${summary.guardrails.productionTenantDataWritten}
- Active Tenant Access Layer updated: ${summary.guardrails.activeTenantAccessLayerUpdated}
- Candidate promoted: ${summary.guardrails.candidatePromoted}
- Module runtime routes changed: ${summary.guardrails.moduleRuntimeRoutesChanged}
- No module reads candidate by default: ${summary.guardrails.noModuleReadsCandidateByDefault}

## Blockers

${blockers}

## Output

- Home preview: \`${summary.outputPaths.homePreviewPath}\`
- Intelligence preview: \`${summary.outputPaths.intelligencePreviewPath}\`
- Proof: \`${summary.outputPaths.proofPath}\`
`;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

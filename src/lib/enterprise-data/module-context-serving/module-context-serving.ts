import fs from "node:fs/promises";
import path from "node:path";

import type { ActiveTenantAccessRecord } from "../active-tenant-access-promotion/active-tenant-access-promotion";
import {
  loadCandidateVersionBuildForAdmin,
  type CandidateReadModelSample,
  type CandidateVersionBuildLoadSource,
  type CandidateVersionBuildReport,
  type TenantCandidateVersion,
} from "../candidate-version-build/candidate-version-build";
import {
  buildCanonicalTenantDataReport,
  type CanonicalDataBuildReport,
} from "../canonical-build/canonical-tenant-data-build";
import type { CanonicalIngestionRecord } from "../contracts/canonical-ingestion";
import type {
  EvidenceBoundary,
  ModuleContextClassification,
  ModuleContextDomainSummary,
  ModuleContextEvidenceRef,
  ModuleContextGap,
  ModuleContextGuardrails,
  ModuleContextMode,
  ModuleContextReadiness,
  ModuleContextReadRequest,
  ModuleContextRecord,
  ModuleContextRelationship,
  ModuleContextRelationshipPolicy,
  ModuleContextRequestedDomain,
  ServedModuleContextPacket,
} from "../contracts/module-context-apis";

const DEFAULT_DOMAINS: ModuleContextRequestedDomain[] = [
  "enterprise_profile",
  "functions",
  "applications_systems",
  "vendors_contracts",
  "data_assets_integrations",
  "programs_priorities",
  "risks_controls",
  "metrics_outcomes",
  "relationships",
  "evidence_sources",
];

const REQUEST_TO_CANONICAL_DOMAIN: Record<ModuleContextRequestedDomain, string> = {
  enterprise_profile: "enterprise_profile",
  functions: "business_functions",
  applications_systems: "applications_systems",
  vendors_contracts: "vendors_contracts",
  data_assets_integrations: "data_assets_integrations",
  programs_priorities: "programs_initiatives",
  risks_controls: "risks_controls",
  metrics_outcomes: "metrics_outcomes",
  relationships: "relationships",
  evidence_sources: "evidence_sources",
};

const CANONICAL_TO_REQUEST_DOMAIN = Object.fromEntries(
  Object.entries(REQUEST_TO_CANONICAL_DOMAIN).map(([requestDomain, canonicalDomain]) => [
    canonicalDomain,
    requestDomain,
  ]),
) as Record<string, ModuleContextRequestedDomain>;

const ACTIVE_ACCESS_SLUGS: Record<string, string> = {
  "skyharbor-air": "skyharbor",
};

export interface ModuleContextServingOptions {
  repoRoot: string;
  generatedAt?: string;
}

export async function getModuleContext(
  request: ModuleContextReadRequest,
  options: ModuleContextServingOptions,
): Promise<ServedModuleContextPacket> {
  const mode: ModuleContextMode = request.mode ?? "active";
  if (mode === "candidate_preview") {
    return buildCandidatePreviewContext(request, options);
  }
  return buildActiveContext(request, options);
}

async function buildActiveContext(
  request: ModuleContextReadRequest,
  options: ModuleContextServingOptions,
): Promise<ServedModuleContextPacket> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const requestedDomains = normalizeRequestedDomains(request.requestedDomains);
  const activeRecord = await readActiveAccessRecord(
    options.repoRoot,
    request.tenantKey,
  );
  const mismatchedActiveVersion =
    Boolean(request.activeTenantAccessVersionId) &&
    activeRecord?.activeVersionId !== request.activeTenantAccessVersionId;
  const activeVersionId =
    activeRecord && !mismatchedActiveVersion ? activeRecord.activeVersionId : null;
  const gaps: ModuleContextGap[] = [];
  const caveats = [
    "Active mode is the default module context serving mode.",
    "Candidate read-model records are not consumed unless mode is candidate_preview.",
    "This supplier contract does not modify module runtime behavior.",
  ];

  if (!activeRecord) {
    gaps.push({
      gapId: `${request.tenantKey}:active-access-record-missing`,
      severity: "blocker",
      description:
        "No Active Tenant Access record is available for this tenant. The serving contract will not fall back to candidate data.",
      source: "active_tenant_access",
    });
  }

  if (mismatchedActiveVersion) {
    gaps.push({
      gapId: `${request.tenantKey}:active-access-version-mismatch`,
      severity: "blocker",
      description:
        "Requested Active Tenant Access version does not match the active access record.",
      source: "active_tenant_access",
    });
  }

  if (activeRecord?.moduleDefaultReadsCandidateData) {
    gaps.push({
      gapId: `${request.tenantKey}:module-default-candidate-read-blocked`,
      severity: "blocker",
      description:
        "Active access record indicates default module reads candidate data, so the context packet is blocked.",
      source: "active_tenant_access",
    });
  }

  return packet({
    request,
    generatedAt,
    resolvedMode: "active",
    sourceMode: activeVersionId ? "active_tenant_access" : "active_not_available",
    tenantDataVersion: activeVersionId ?? "active:not_available",
    activeTenantAccessVersionId: activeVersionId,
    candidateVersionId: null,
    domains: requestedDomains.map((domain) =>
      emptyDomainSummary(domain, activeVersionId ? "needs_review" : "not_ready"),
    ),
    records: [],
    evidenceRefs: [],
    validatedRelationships: [],
    relationshipCandidates: [],
    gaps,
    caveats,
    lineage: {
      activeAccessRecordPath: activeRecordPath(request.tenantKey),
      sourceSnapshotIds: [],
    },
    readiness: {
      status: activeVersionId && gaps.length === 0 ? "needs_review" : "not_ready",
      evidenceReady: false,
      relationshipReady: false,
      profileReady: false,
      caveats,
      canAnswer: activeVersionId
        ? [
            "Active Tenant Access metadata pointer is available.",
            "Modules can request a context packet without reading candidate data by default.",
          ]
        : [],
      mustNotClaim: [
        "Candidate data is active tenant truth.",
        "Move evidence has been created by the data layer.",
        "Module runtime consumption changed in this PR.",
      ],
    },
    guardrails: guardrails({
      requestedMode: request.mode ?? "active",
      resolvedMode: "active",
      candidateDataConsumed: false,
      candidatePreviewExplicitlyRequested: false,
    }),
  });
}

async function buildCandidatePreviewContext(
  request: ModuleContextReadRequest,
  options: ModuleContextServingOptions,
): Promise<ServedModuleContextPacket> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const requestedDomains = normalizeRequestedDomains(request.requestedDomains);
  const loadResult = await loadCandidateVersionBuildForAdmin({
    repoRoot: options.repoRoot,
  });
  const report = loadResult.report;
  const candidate = selectCandidate(report, request);

  if (!candidate) {
    return missingCandidatePacket({
      request,
      generatedAt,
      requestedDomains,
      loadSource: loadResult.source,
      loadErrors: loadResult.errors,
    });
  }

  const selectedCanonicalDomains = new Set(
    requestedDomains.map((domain) => REQUEST_TO_CANONICAL_DOMAIN[domain]),
  );
  const canonicalRecords = await loadCanonicalPreviewRecords({
    repoRoot: options.repoRoot,
    tenantKey: request.tenantKey,
    requestedDomains,
    generatedAt,
  });
  const sampleRecords = candidate.readModelSamples
    .filter((sample) => selectedCanonicalDomains.has(inferSampleCanonicalDomain(sample)))
    .map((sample) => toContextRecord(sample));
  const records =
    canonicalRecords.length > 0
      ? canonicalRecords.map((record) => toContextRecordFromCanonical(record))
      : sampleRecords;
  const evidenceRefs = buildEvidenceRefs({
    candidate,
    requestedDomains,
    records,
  });
  const relationshipCandidates = buildRelationshipCandidates({
    request,
    candidate,
    requestedDomains,
  });
  const caveats = [
    "Candidate preview mode is inactive candidate data, not active tenant truth.",
    "Modules must request candidate_preview explicitly to inspect this packet.",
    "This supplier contract does not create module artifacts or Move evidence.",
    ...candidate.homeAvaReadiness.caveats,
  ];
  const gaps = buildCandidateGaps(candidate);

  return packet({
    request,
    generatedAt,
    resolvedMode: "candidate_preview",
    sourceMode: "inactive_candidate_read_model",
    tenantDataVersion: candidate.candidateVersionId,
    activeTenantAccessVersionId: null,
    candidateVersionId: candidate.candidateVersionId,
    domains: buildDomainSummaries(candidate, requestedDomains),
    records,
    evidenceRefs,
    validatedRelationships: [],
    relationshipCandidates,
    gaps,
    caveats,
    lineage: {
      sourceBuildId: candidate.sourceBuildId,
      sourceBuildFingerprint: candidate.sourceBuildFingerprint,
      inputFingerprint: candidate.inputFingerprint,
      candidateReportSource: loadResult.source,
      sourceSnapshotIds: candidate.sourceSnapshotIds,
    },
    readiness: {
      status: candidate.homeAvaReadiness.ready ? "needs_review" : "not_ready",
      evidenceReady: candidate.homeAvaReadiness.evidenceReady,
      relationshipReady: candidate.homeAvaReadiness.relationshipReady,
      profileReady: candidate.homeAvaReadiness.profileReady,
      caveats,
      canAnswer: candidate.homeAvaReadiness.canAnswer,
      mustNotClaim: candidate.homeAvaReadiness.mustNotClaim,
    },
    guardrails: guardrails({
      requestedMode: request.mode ?? "active",
      resolvedMode: "candidate_preview",
      candidateDataConsumed: true,
      candidatePreviewExplicitlyRequested: true,
    }),
  });
}

function missingCandidatePacket(input: {
  request: ModuleContextReadRequest;
  generatedAt: string;
  requestedDomains: ModuleContextRequestedDomain[];
  loadSource: CandidateVersionBuildLoadSource;
  loadErrors: string[];
}): ServedModuleContextPacket {
  const caveats = [
    "Candidate preview was explicitly requested, but no matching inactive candidate was found.",
    ...input.loadErrors,
  ];
  return packet({
    request: input.request,
    generatedAt: input.generatedAt,
    resolvedMode: "candidate_preview",
    sourceMode: "active_not_available",
    tenantDataVersion: "candidate:not_available",
    activeTenantAccessVersionId: null,
    candidateVersionId: null,
    domains: input.requestedDomains.map((domain) =>
      emptyDomainSummary(domain, "not_ready"),
    ),
    records: [],
    evidenceRefs: [],
    validatedRelationships: [],
    relationshipCandidates: [],
    gaps: [
      {
        gapId: `${input.request.tenantKey}:candidate-preview-record-missing`,
        severity: "blocker",
        description:
          "No matching inactive candidate read model was available for preview.",
        source: input.loadSource,
      },
    ],
    caveats,
    lineage: {
      candidateReportSource: input.loadSource,
      sourceSnapshotIds: [],
    },
    readiness: {
      status: "not_ready",
      evidenceReady: false,
      relationshipReady: false,
      profileReady: false,
      caveats,
      canAnswer: [],
      mustNotClaim: ["Candidate preview has data for this tenant."],
    },
    guardrails: guardrails({
      requestedMode: input.request.mode ?? "active",
      resolvedMode: "candidate_preview",
      candidateDataConsumed: false,
      candidatePreviewExplicitlyRequested: true,
    }),
  });
}

function packet(input: {
  request: ModuleContextReadRequest;
  generatedAt: string;
  resolvedMode: ModuleContextMode;
  sourceMode: ServedModuleContextPacket["sourceMode"];
  tenantDataVersion: string;
  activeTenantAccessVersionId: string | null;
  candidateVersionId: string | null;
  domains: ModuleContextDomainSummary[];
  records: ModuleContextRecord[];
  evidenceRefs: ModuleContextEvidenceRef[];
  validatedRelationships: ModuleContextRelationship[];
  relationshipCandidates: ModuleContextRelationship[];
  gaps: ModuleContextGap[];
  caveats: string[];
  lineage: ServedModuleContextPacket["lineage"];
  readiness: ModuleContextReadiness;
  guardrails: ModuleContextGuardrails;
}): ServedModuleContextPacket {
  return {
    tenantKey: input.request.tenantKey,
    tenantDataVersion: input.tenantDataVersion,
    generatedAt: input.generatedAt,
    evidenceBoundary: evidenceBoundary(input.evidenceRefs, input.gaps),
    facts: input.records,
    relationships: input.validatedRelationships,
    derivedInsights: [],
    moduleMemory: [],
    moduleKey: input.request.moduleKey,
    purpose: input.request.purpose,
    mode: input.resolvedMode,
    sourceMode: input.sourceMode,
    activeTenantAccessVersionId: input.activeTenantAccessVersionId,
    candidateVersionId: input.candidateVersionId,
    domains: input.domains,
    records: input.records,
    evidenceRefs: input.evidenceRefs,
    validatedRelationships: input.validatedRelationships,
    relationshipCandidates: input.relationshipCandidates,
    gaps: input.gaps,
    caveats: input.caveats,
    lineage: input.lineage,
    readiness: input.readiness,
    guardrails: input.guardrails,
  };
}

function selectCandidate(
  report: CandidateVersionBuildReport | null,
  request: ModuleContextReadRequest,
): TenantCandidateVersion | null {
  if (!report) return null;
  return (
    report.candidateVersions.find((candidate) => {
      if (candidate.tenantKey !== request.tenantKey) return false;
      if (request.candidateVersionId) {
        return candidate.candidateVersionId === request.candidateVersionId;
      }
      return true;
    }) ?? null
  );
}

function buildDomainSummaries(
  candidate: TenantCandidateVersion,
  requestedDomains: ModuleContextRequestedDomain[],
): ModuleContextDomainSummary[] {
  return requestedDomains.map((domain) => {
    const canonicalDomain = REQUEST_TO_CANONICAL_DOMAIN[domain];
    const summary = candidate.domainCounts.find(
      (entry) => entry.domain === canonicalDomain,
    );
    return {
      domain,
      canonicalDomain,
      sourceRows: summary?.sourceRows ?? 0,
      acceptedRecords: summary?.acceptedRecords ?? 0,
      skippedRows: summary?.skippedRows ?? 0,
      duplicateNames: summary?.duplicateNames ?? 0,
      readiness: summary && summary.acceptedRecords > 0 ? "candidate_only" : "missing_evidence",
    };
  });
}

function buildEvidenceRefs(input: {
  candidate: TenantCandidateVersion;
  requestedDomains: ModuleContextRequestedDomain[];
  records: ModuleContextRecord[];
}): ModuleContextEvidenceRef[] {
  const selectedDomains = new Set(input.requestedDomains);
  const sourceRefs = input.candidate.sourceLineage
    .map((source) => ({
      source,
      domain: source.domain ? CANONICAL_TO_REQUEST_DOMAIN[source.domain] : undefined,
    }))
    .filter((entry) => !entry.domain || selectedDomains.has(entry.domain))
    .map((entry): ModuleContextEvidenceRef => ({
      evidenceId: `${entry.source.sourcePath}@${entry.source.fingerprint.slice(0, 12)}`,
      sourcePath: entry.source.sourcePath,
      sourceFingerprint: entry.source.fingerprint,
      rowCount: entry.source.rowCount,
      domain: entry.domain,
      citationStatus: "citable",
    }));
  const recordEvidenceIds = Array.from(
    new Set(input.records.flatMap((record) => record.sourceEvidenceIds)),
  ).map((evidenceId): ModuleContextEvidenceRef => ({
    evidenceId,
    citationStatus: "citable",
  }));
  return [...sourceRefs, ...recordEvidenceIds];
}

function buildRelationshipCandidates(input: {
  request: ModuleContextReadRequest;
  candidate: TenantCandidateVersion;
  requestedDomains: ModuleContextRequestedDomain[];
}): ModuleContextRelationship[] {
  if (!relationshipCandidatesAllowed(input.request.relationshipPolicy)) {
    return [];
  }
  return input.requestedDomains
    .filter((domain) => domain !== "evidence_sources")
    .map((domain) => ({
      relationshipId: `${input.candidate.candidateVersionId}:${domain}:relationship-candidates`,
      relationshipType: "candidate_relationship_summary",
      readiness: "relationship_not_validated" as ModuleContextClassification,
      evidenceIds: input.candidate.sourceSnapshotIds.slice(0, 12),
    }))
    .filter(() => input.candidate.relationshipCandidateCount > 0);
}

function buildCandidateGaps(candidate: TenantCandidateVersion): ModuleContextGap[] {
  return [
    ...candidate.promotionBlockers.map((blocker, index) => ({
      gapId: `${candidate.tenantKey}:promotion-blocker:${index + 1}`,
      severity: "blocker" as const,
      description: blocker,
      source: "candidate_promotion_gate",
    })),
    ...candidate.qualityGates
      .filter((gate) => gate.status !== "pass")
      .map((gate) => ({
        gapId: `${candidate.tenantKey}:quality-gate:${gate.id}`,
        severity: gate.status === "fail" ? ("blocker" as const) : ("warning" as const),
        description: gate.detail,
        source: gate.label,
      })),
  ];
}

function toContextRecord(sample: CandidateReadModelSample): ModuleContextRecord {
  const canonicalDomain = inferSampleCanonicalDomain(sample);
  const domain = CANONICAL_TO_REQUEST_DOMAIN[canonicalDomain] ?? "evidence_sources";
  return {
    recordId: sample.sourceObjectId,
    domain,
    canonicalDomain,
    objectType: sample.objectType,
    title: sample.displayName,
    summary: sampleSummary(sample),
    fields: sample.attributes,
    sourceEvidenceIds: sample.evidenceKeys,
    citationStatus: sample.evidenceKeys.length > 0 ? "citable" : "needs_review",
    agentReadiness:
      sample.evidenceKeys.length > 0 ? "candidate_only" : "missing_evidence",
    relationshipReadiness: "relationship_not_validated",
    restricted: false,
    confidence: sample.evidenceKeys.length > 0 ? 0.82 : 0.4,
  };
}

function toContextRecordFromCanonical(record: CanonicalIngestionRecord): ModuleContextRecord {
  const canonicalDomain = inferRecordCanonicalDomain(record);
  const domain = CANONICAL_TO_REQUEST_DOMAIN[canonicalDomain] ?? "evidence_sources";
  const sourceEvidenceIds = record.evidenceReferences.map(
    (evidence) => evidence.evidenceKey,
  );
  const confidence = averageConfidence(record);
  return {
    recordId: record.canonicalObjectKey ?? record.sourceObjectId,
    domain,
    canonicalDomain,
    objectType: record.objectType,
    title: canonicalTitle(record),
    summary: canonicalSummary(record),
    fields: scalarAttributes(record),
    sourceEvidenceIds,
    citationStatus: sourceEvidenceIds.length > 0 ? "citable" : "needs_review",
    agentReadiness: sourceEvidenceIds.length > 0 ? "candidate_only" : "missing_evidence",
    relationshipReadiness:
      record.relationships.length > 0 ? "relationship_not_validated" : "missing_evidence",
    restricted:
      record.sensitivity === "confidential" || record.sensitivity === "restricted",
    confidence,
  };
}

async function loadCanonicalPreviewRecords(input: {
  repoRoot: string;
  tenantKey: string;
  requestedDomains: ModuleContextRequestedDomain[];
  generatedAt: string;
}): Promise<CanonicalIngestionRecord[]> {
  const selectedCanonicalDomains = new Set(
    input.requestedDomains.map((domain) => REQUEST_TO_CANONICAL_DOMAIN[domain]),
  );
  const report: CanonicalDataBuildReport = await buildCanonicalTenantDataReport({
    repoRoot: input.repoRoot,
    generatedAt: input.generatedAt,
  });
  const byDomain = new Map<string, CanonicalIngestionRecord[]>();
  for (const record of report.canonicalRecords) {
    if (record.tenantKey !== input.tenantKey) continue;
    const canonicalDomain = inferRecordCanonicalDomain(record);
    if (!selectedCanonicalDomains.has(canonicalDomain)) continue;
    const existing = byDomain.get(canonicalDomain) ?? [];
    if (existing.length < 8) {
      existing.push(record);
      byDomain.set(canonicalDomain, existing);
    }
  }
  return Array.from(byDomain.values()).flat();
}

function inferSampleCanonicalDomain(sample: CandidateReadModelSample): string {
  if (sample.domain !== "unknown") return sample.domain;
  const sourceDomain = sample.sourceObjectId.split(":")[0];
  return sourceDomain || "evidence_sources";
}

function inferRecordCanonicalDomain(record: CanonicalIngestionRecord): string {
  return record.sourceObjectId.split(":")[0] || record.objectType;
}

function canonicalTitle(record: CanonicalIngestionRecord): string {
  return String(
    record.attributes.displayName?.value ??
      record.attributes.name?.value ??
      record.attributes.system_name?.value ??
      record.attributes.application_name?.value ??
      record.attributes.data_asset_name?.value ??
      record.attributes.entity_name?.value ??
      record.canonicalObjectKey,
  );
}

function canonicalSummary(record: CanonicalIngestionRecord): string {
  return Object.entries(scalarAttributes(record))
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("; ");
}

function scalarAttributes(
  record: CanonicalIngestionRecord,
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(record.attributes)
      .slice(0, 10)
      .map(([key, attribute]) => [key, scalarValue(attribute.value)]),
  );
}

function averageConfidence(record: CanonicalIngestionRecord): number {
  const values = Object.values(record.attributes)
    .map((attribute) => attribute.confidence)
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return record.confidence ?? 0.5;
  return Number(
    (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2),
  );
}

function sampleSummary(sample: CandidateReadModelSample): string {
  const attributeSummary = Object.entries(sample.attributes)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("; ");
  return attributeSummary || `${sample.objectType} candidate record`;
}

function scalarValue(value: unknown): string | number | boolean {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (value === null || value === undefined) return "";
  return JSON.stringify(value);
}

function normalizeRequestedDomains(
  requestedDomains: ModuleContextRequestedDomain[] | undefined,
): ModuleContextRequestedDomain[] {
  if (!requestedDomains || requestedDomains.length === 0) {
    return DEFAULT_DOMAINS;
  }
  return Array.from(new Set(requestedDomains));
}

function emptyDomainSummary(
  domain: ModuleContextRequestedDomain,
  readiness: ModuleContextClassification,
): ModuleContextDomainSummary {
  return {
    domain,
    canonicalDomain: REQUEST_TO_CANONICAL_DOMAIN[domain],
    sourceRows: 0,
    acceptedRecords: 0,
    skippedRows: 0,
    duplicateNames: 0,
    readiness,
  };
}

function relationshipCandidatesAllowed(
  policy: ModuleContextRelationshipPolicy | undefined,
): boolean {
  return policy === "candidates" || policy === "validated_and_candidates";
}

function evidenceBoundary(
  evidenceRefs: ModuleContextEvidenceRef[],
  gaps: ModuleContextGap[],
): EvidenceBoundary {
  return {
    evidenceKeys: Array.from(new Set(evidenceRefs.map((ref) => ref.evidenceId))),
    excludedEvidenceKeys: [],
    staleEvidenceKeys: [],
    unsupportedClaimRisk: gaps.some((gap) => gap.severity === "blocker")
      ? "high"
      : gaps.length > 0
        ? "medium"
        : "low",
  };
}

function guardrails(input: {
  requestedMode: ModuleContextMode;
  resolvedMode: ModuleContextMode;
  candidateDataConsumed: boolean;
  candidatePreviewExplicitlyRequested: boolean;
}): ModuleContextGuardrails {
  return {
    activeByDefault: true,
    requestedMode: input.requestedMode,
    resolvedMode: input.resolvedMode,
    candidatePreviewRequiresExplicitMode: true,
    candidatePreviewExplicitlyRequested: input.candidatePreviewExplicitlyRequested,
    defaultModuleReadsCandidateData: false,
    candidateDataConsumed: input.candidateDataConsumed,
    activeTenantAccessLayerUpdated: false,
    productionTenantDataWritten: false,
    candidatePromoted: false,
    moduleRuntimeConsumptionChanged: false,
    moveRuntimeModified: false,
    moveEvidenceCreated: false,
    sourceRuntimeModified: false,
    towerRuntimeModified: false,
    intelligenceRuntimeModified: false,
    homeReadsCandidateByDefault: false,
  };
}

function activeRecordPath(tenantKey: string): string {
  return path.join(
    "reports/active-tenant-access",
    outputSlugForTenant(tenantKey),
    "active-tenant-access-record.json",
  );
}

async function readActiveAccessRecord(
  repoRoot: string,
  tenantKey: string,
): Promise<ActiveTenantAccessRecord | null> {
  try {
    const text = await fs.readFile(
      path.resolve(repoRoot, activeRecordPath(tenantKey)),
      "utf8",
    );
    const record = JSON.parse(text) as ActiveTenantAccessRecord;
    return record.tenantKey === tenantKey ? record : null;
  } catch {
    return null;
  }
}

function outputSlugForTenant(tenantKey: string): string {
  return ACTIVE_ACCESS_SLUGS[tenantKey] ?? tenantKey;
}

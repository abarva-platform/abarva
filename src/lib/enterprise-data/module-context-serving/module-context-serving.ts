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
  ModuleContextCompleteness,
  ModuleContextDomainSummary,
  ModuleContextEvidenceRef,
  ModuleContextExplanation,
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
  "meridian-health": "meridian",
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

export async function explainModuleContext(
  request: ModuleContextReadRequest,
  options: ModuleContextServingOptions,
): Promise<ModuleContextExplanation> {
  const context = await getModuleContext(request, options);
  return explainServedModuleContext(context);
}

export function explainServedModuleContext(
  context: ServedModuleContextPacket,
): ModuleContextExplanation {
  const moduleLabel = moduleLabelFor(context.moduleKey);
  const recordCount = context.records.length;
  const evidenceCount = context.evidenceRefs.length;
  const requestedDomainCount = context.domains.length;
  const coveredDomainCount = context.domains.filter(
    (domain) => domain.acceptedRecords > 0,
  ).length;
  const candidateText =
    context.mode === "candidate_preview"
      ? " It is inactive candidate data and not active tenant truth."
      : "";
  const activeText =
    context.mode === "active" && context.activeTenantAccessVersionId
      ? " Active Tenant Access metadata is available, but module runtime consumption is unchanged by this contract."
      : "";
  const missingActiveText =
    context.mode === "active" && !context.activeTenantAccessVersionId
      ? " No Active Tenant Access record is available, and the serving contract did not fall back to candidate data."
      : "";

  return {
    tenantKey: context.tenantKey,
    moduleKey: context.moduleKey,
    purpose: context.purpose,
    mode: context.mode,
    sourceMode: context.sourceMode,
    generatedAt: context.generatedAt,
    summary:
      `${moduleLabel} context has ${recordCount} readable records, ${evidenceCount} evidence references, and ${coveredDomainCount} of ${requestedDomainCount} requested domains with represented data.` +
      candidateText +
      activeText +
      missingActiveText,
    strengths: explanationStrengths(context),
    limitations: explanationLimitations(context),
    supportedQuestions: supportedQuestions(context),
    unsupportedQuestions: unsupportedQuestions(context),
    nextActions: nextActions(context),
    contextCompleteness: context.contextCompleteness,
    guardrails: context.guardrails,
  };
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
  const canonicalSlice =
    activeVersionId
      ? await loadCanonicalContextSlice({
          repoRoot: options.repoRoot,
          tenantKey: request.tenantKey,
          requestedDomains,
          generatedAt,
          classification: "agent_ready",
        })
      : null;
  const activeRecords = canonicalSlice?.records ?? [];
  const evidenceRefs = buildEvidenceRefsFromRecords(activeRecords);
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
    domains:
      canonicalSlice?.domains ??
      requestedDomains.map((domain) =>
        emptyDomainSummary(domain, activeVersionId ? "needs_review" : "not_ready"),
      ),
    records: activeRecords,
    evidenceRefs,
    validatedRelationships: [],
    relationshipCandidates: [],
    gaps,
    caveats,
    lineage: {
      activeAccessRecordPath: activeRecordPath(request.tenantKey),
      sourceSnapshotIds: canonicalSlice?.sourceSnapshotIds ?? [],
    },
    readiness: {
      status:
        activeVersionId && activeRecords.length > 0 && gaps.length === 0
          ? "agent_ready"
          : activeVersionId && gaps.length === 0
            ? "needs_review"
            : "not_ready",
      evidenceReady: activeRecords.some(
        (record) => record.sourceEvidenceIds.length > 0,
      ),
      relationshipReady: false,
      profileReady: Boolean(
        canonicalSlice?.domains.some(
          (domain) =>
            domain.domain === "enterprise_profile" && domain.acceptedRecords > 0,
        ),
      ),
      caveats,
      canAnswer: activeVersionId
        ? [
            "Active Tenant Access metadata pointer is available.",
            "Modules can request active canonical context without reading candidate preview data by default.",
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
  const canonicalSlice = await loadCanonicalContextSlice({
    repoRoot: options.repoRoot,
    tenantKey: request.tenantKey,
    requestedDomains,
    generatedAt,
    classification: "candidate_only",
  });
  const canonicalRecords = canonicalSlice.records;
  const sampleRecords = candidate.readModelSamples
    .filter((sample) => selectedCanonicalDomains.has(inferSampleCanonicalDomain(sample)))
    .map((sample) => toContextRecord(sample));
  const records =
    canonicalRecords.length > 0
      ? canonicalRecords
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
  const contextCompleteness = computeContextCompleteness({
    domains: input.domains,
    records: input.records,
    evidenceRefs: input.evidenceRefs,
    validatedRelationships: input.validatedRelationships,
    relationshipCandidates: input.relationshipCandidates,
    gaps: input.gaps,
    readiness: input.readiness,
  });

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
    contextCompleteness,
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

function computeContextCompleteness(input: {
  domains: ModuleContextDomainSummary[];
  records: ModuleContextRecord[];
  evidenceRefs: ModuleContextEvidenceRef[];
  validatedRelationships: ModuleContextRelationship[];
  relationshipCandidates: ModuleContextRelationship[];
  gaps: ModuleContextGap[];
  readiness: ModuleContextReadiness;
}): ModuleContextCompleteness {
  const domainCount = Math.max(input.domains.length, 1);
  const coveredDomains = input.domains.filter(
    (domain) => domain.acceptedRecords > 0,
  ).length;
  const breadth = percent(coveredDomains, domainCount);
  const domainDepth =
    input.domains.length === 0
      ? 0
      : Math.round(
          input.domains.reduce(
            (sum, domain) => sum + Math.min(domain.acceptedRecords / 50, 1),
            0,
          ) /
            input.domains.length *
            100,
        );
  const recordFieldDepth =
    input.records.length === 0
      ? 0
      : Math.round(
          input.records.reduce(
            (sum, record) =>
              sum + Math.min(Object.keys(record.fields).length / 8, 1),
            0,
          ) /
            input.records.length *
            100,
        );
  const depth = Math.round((domainDepth + recordFieldDepth) / 2);
  const relationshipCoverage =
    input.validatedRelationships.length > 0
      ? 100
      : input.relationshipCandidates.length > 0
        ? Math.min(70, percent(input.relationshipCandidates.length, domainCount))
        : 0;
  const evidenceCoverage =
    input.records.length === 0
      ? input.evidenceRefs.length > 0
        ? 25
        : 0
      : percent(
          input.records.filter((record) => record.sourceEvidenceIds.length > 0)
            .length,
          input.records.length,
        );
  const blockerPenalty = Math.min(
    35,
    input.gaps.filter((gap) => gap.severity === "blocker").length * 8,
  );
  const warningPenalty = Math.min(
    15,
    input.gaps.filter((gap) => gap.severity === "warning").length * 4,
  );
  const readinessBonus =
    (input.readiness.evidenceReady ? 5 : 0) +
    (input.readiness.relationshipReady ? 5 : 0) +
    (input.readiness.profileReady ? 5 : 0);
  const answerability = clampScore(
    Math.round(
      breadth * 0.25 +
        depth * 0.2 +
        relationshipCoverage * 0.2 +
        evidenceCoverage * 0.35 +
        readinessBonus -
        blockerPenalty -
        warningPenalty,
    ),
  );
  return {
    breadth: clampScore(breadth),
    depth: clampScore(depth),
    relationshipCoverage: clampScore(relationshipCoverage),
    evidenceCoverage: clampScore(evidenceCoverage),
    answerability,
    overall: overallFor(answerability),
  };
}

function explanationStrengths(context: ServedModuleContextPacket): string[] {
  const strengths: string[] = [];
  const coveredDomains = context.domains.filter(
    (domain) => domain.acceptedRecords > 0,
  );
  if (coveredDomains.length > 0) {
    strengths.push(
      `${coveredDomains.length} requested domains have represented context.`,
    );
  }
  if (context.records.length > 0) {
    strengths.push(
      `${context.records.length} records are readable through the module context packet.`,
    );
  }
  if (context.evidenceRefs.length > 0) {
    strengths.push(
      `${context.evidenceRefs.length} evidence references are available for lineage and citation checks.`,
    );
  }
  if (context.relationshipCandidates.length > 0) {
    strengths.push(
      `${context.relationshipCandidates.length} relationship candidate groups are available for later validation.`,
    );
  }
  if (context.activeTenantAccessVersionId) {
    strengths.push("Active Tenant Access metadata pointer is resolved.");
  }
  if (strengths.length === 0) {
    strengths.push("The packet preserves a safe empty response instead of falling back to inactive candidate data.");
  }
  return strengths;
}

function explanationLimitations(context: ServedModuleContextPacket): string[] {
  const limitations = [
    ...context.caveats,
    ...context.gaps.map((gap) => gap.description),
  ];
  if (context.mode === "candidate_preview") {
    limitations.unshift("Candidate preview is inactive and cannot be treated as active tenant truth.");
  }
  if (context.validatedRelationships.length === 0) {
    limitations.push("Validated relationships are not present in this packet.");
  }
  if (context.records.length === 0) {
    limitations.push("No readable records are available in this packet.");
  }
  return uniqueStrings(limitations);
}

function supportedQuestions(context: ServedModuleContextPacket): string[] {
  const defaults: Record<string, string[]> = {
    home: [
      "What context is available for this tenant?",
      "Which domains are source-backed or still incomplete?",
    ],
    intelligence: [
      "Which tenant facts can support an answer context?",
      "Where does the evidence suggest limitations or caveats?",
    ],
    moves: [
      "Which tenant facts are available for a future phase evidence extract?",
      "Which domains should a future Moves context extract inspect first?",
    ],
    source: [
      "Which tenant facts are available for future sourcing context?",
      "Which evidence and vendor domains can be inspected?",
    ],
    tower: [
      "Which tenant facts are available for future measurement context?",
      "Which evidence-backed domains can support readiness review?",
    ],
  };
  return uniqueStrings([
    ...(defaults[context.moduleKey] ?? []),
    ...context.readiness.canAnswer,
  ]);
}

function unsupportedQuestions(context: ServedModuleContextPacket): string[] {
  const defaults = [
    "Do not claim candidate preview data is active tenant truth.",
    "Do not claim production tenant data was written or promoted by this serving call.",
    "Do not claim module runtime behavior changed because this packet was generated.",
  ];
  if (context.moduleKey === "moves") {
    defaults.push("Do not claim Move evidence was attached by the data layer.");
  }
  if (context.moduleKey === "tower") {
    defaults.push("Do not calculate realized value, ROI, or Tower outcomes from this context packet.");
  }
  return uniqueStrings([...defaults, ...context.readiness.mustNotClaim]);
}

function nextActions(context: ServedModuleContextPacket): string[] {
  const actions: string[] = [];
  if (context.mode === "candidate_preview") {
    actions.push("Review candidate preview quality before any promotion decision.");
    actions.push("Promote only through the explicit Active Tenant Access promotion gate.");
  }
  if (context.mode === "active" && !context.activeTenantAccessVersionId) {
    actions.push("Promote a reviewed candidate before relying on active module context.");
  }
  if (context.relationshipCandidates.length > 0 && context.validatedRelationships.length === 0) {
    actions.push("Validate relationship candidates before cross-domain reasoning.");
  }
  if (context.gaps.length > 0) {
    actions.push("Resolve blocker and warning gaps before treating the packet as board-ready.");
  }
  actions.push(`Let the ${moduleLabelFor(context.moduleKey)} module decide how to render or use this packet.`);
  return uniqueStrings(actions);
}

function moduleLabelFor(moduleKey: ServedModuleContextPacket["moduleKey"]): string {
  return {
    home: "Home",
    intelligence: "Intelligence",
    moves: "Moves",
    source: "Source",
    tower: "Tower",
  }[moduleKey];
}

function overallFor(answerability: number): ModuleContextCompleteness["overall"] {
  if (answerability >= 90) return "Strong";
  if (answerability >= 70) return "Good";
  if (answerability >= 45) return "Limited";
  return "Blocked";
}

function percent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return clampScore(Math.round((numerator / denominator) * 100));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)),
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

function toContextRecordFromCanonical(
  record: CanonicalIngestionRecord,
  classification: ModuleContextClassification,
): ModuleContextRecord {
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
    agentReadiness: sourceEvidenceIds.length > 0 ? classification : "missing_evidence",
    relationshipReadiness:
      record.relationships.length > 0 ? "relationship_not_validated" : "missing_evidence",
    restricted:
      record.sensitivity === "confidential" || record.sensitivity === "restricted",
    confidence,
  };
}

async function loadCanonicalContextSlice(input: {
  repoRoot: string;
  tenantKey: string;
  requestedDomains: ModuleContextRequestedDomain[];
  generatedAt: string;
  classification: ModuleContextClassification;
}): Promise<{
  records: ModuleContextRecord[];
  domains: ModuleContextDomainSummary[];
  sourceSnapshotIds: string[];
}> {
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
  const recordSummary = report.canonicalRecordSummary.find(
    (summary) => summary.tenantKey === input.tenantKey,
  );
  const tenant = report.tenants.find(
    (entry) => entry.tenantKey === input.tenantKey,
  );
  return {
    records: Array.from(byDomain.values())
      .flat()
      .map((record) => toContextRecordFromCanonical(record, input.classification)),
    domains: input.requestedDomains.map((domain) => {
      const canonicalDomain = REQUEST_TO_CANONICAL_DOMAIN[domain];
      const summary = recordSummary?.byDomain[canonicalDomain];
      return {
        domain,
        canonicalDomain,
        sourceRows: summary?.sourceRows ?? 0,
        acceptedRecords: summary?.acceptedRecords ?? 0,
        skippedRows: summary?.skippedRows ?? 0,
        duplicateNames: summary?.duplicateNames ?? 0,
        readiness: summary && summary.acceptedRecords > 0
          ? input.classification
          : "missing_evidence",
      };
    }),
    sourceSnapshotIds:
      tenant?.sourceFiles.map(
        (file) => `${file.repoRelativePath}@${file.contentFingerprint.slice(0, 12)}`,
      ) ?? [],
  };
}

function buildEvidenceRefsFromRecords(
  records: ModuleContextRecord[],
): ModuleContextEvidenceRef[] {
  return Array.from(
    new Set(records.flatMap((record) => record.sourceEvidenceIds)),
  ).map((evidenceId) => ({
    evidenceId,
    citationStatus: "citable" as const,
  }));
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

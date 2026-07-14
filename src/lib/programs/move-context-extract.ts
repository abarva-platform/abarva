import "server-only";

import { getModuleContext } from "@/lib/enterprise-data/module-context-serving/module-context-serving";
import type {
  ModuleContextGap,
  ModuleContextReadRequest,
  ModuleContextRecord,
  ModuleContextRequestedDomain,
  ServedModuleContextPacket,
} from "@/lib/enterprise-data/contracts/module-context-apis";
import { findSkyHarborPreviewModule } from "@/lib/enterprise-data/candidate-preview-enablement/skyharbor-preview-package";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { getDiscoveryBlueprint } from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";
import {
  mapEvidenceToDiscoveryFamily,
  type DiscoveryEvidenceReadinessItem,
} from "@/lib/programs/discovery/evidence-readiness";
import {
  recordProgramEvidence,
  type ExtractedProgramEvidence,
} from "@/lib/programs/evidence-ingestion";
import { saveMoveArtifact } from "@/lib/programs/deliverables/move-artifacts";

export const MOVE_CONTEXT_EXTRACT_EVIDENCE_TYPE =
  "move_context_extract_attached";

export type MoveContextExtractSourceMode =
  | "active_home_context"
  | "active_tenant_access"
  | "candidate_preview";

export type MoveContextExtractItemStatus =
  | "attached_evidence"
  | "suggested_context"
  | "excluded_context"
  | "gap";

export interface MoveContextExtractCandidatePreviewRequest {
  enabled: boolean;
  candidateVersionId?: string;
  acknowledgedNotActiveRuntimeTruth?: boolean;
}

export interface MoveContextExtractInput {
  ctx: TenancyCtx;
  moveId: string;
  tenantKey: string;
  phase: number;
  targetPhase?: number;
  moveName: string;
  useCaseArchetype: string;
  phaseLabel: string;
  phasePurpose: string;
  candidatePreview?: MoveContextExtractCandidatePreviewRequest;
}

export interface MoveContextExtractItem {
  status: MoveContextExtractItemStatus;
  label: string;
  summary: string;
  reason: string;
  sourceMode: MoveContextExtractSourceMode;
  sourceLayer?: string;
  domain?: ModuleContextRequestedDomain;
  sectionLabel?: string;
  evidenceId?: string;
  moveId?: string;
  tenantId?: string;
  tenantKey?: string;
  evidenceFamily?: string;
  sourceType?: string;
  sourceFileRef?: string;
  citation?: string;
  readinessStatus?: "covered" | "generation_eligible" | "agent_ready";
  usedByPhase?: number;
  targetPhase?: number;
  whyAttached?: string;
  sourceArtifactId?: string;
  canonicalRecordId?: string;
  sourceSegmentId?: string;
  confidence?: number;
  diagnostics?: Record<string, string | number | boolean | null>;
}

export interface MoveContextExtractResult {
  status: "created" | "skipped_existing" | "error";
  extractId: string | null;
  artifactId: string | null;
  evidenceId: string | null;
  moveId: string;
  tenantKey: string;
  sourceMode: MoveContextExtractSourceMode;
  phase: number;
  targetPhase: number;
  activeTenantAccessVersionId: string | null;
  candidateVersionId: string | null;
  sourceBuildId: string | null;
  attachedEvidenceItems: MoveContextExtractItem[];
  suggestedContextItems: MoveContextExtractItem[];
  excludedContextItems: MoveContextExtractItem[];
  gapItems: MoveContextExtractItem[];
  sourceLayersScanned: string[];
  domainsRequested: ModuleContextRequestedDomain[];
  archetypeDetected: string | null;
  uploadRequests: MoveContextExtractItem[];
  contextLayerReuseStatus: string;
  generatedAt: string;
  message?: string;
}

interface MoveContextExtractDeps {
  getModuleContext?: typeof getModuleContext;
  saveArtifact?: typeof saveMoveArtifact;
  recordEvidence?: typeof recordProgramEvidence;
  loadMoveEvidence?: typeof defaultLoadMoveEvidenceRows;
  existingExtract?: (args: {
    tenantKey: string;
    moveId: string;
    artifactType: string;
  }) => Promise<{ artifactId: string } | null>;
}

interface MoveEvidenceRow {
  id: string;
  tenantKey: string;
  programId: string;
  attachmentId: string | null;
  phase: number | null;
  evidenceType: string;
  title: string;
  summary: string;
  extractedText: string | null;
  extractedStructured: Record<string, unknown>;
  confidence: number | string | null;
  createdAt: string | null;
}

interface MovePhaseContextRequirements {
  phase: number;
  label: string;
  question: string;
  output: string;
  requiredDomains: ModuleContextRequestedDomain[];
  uploadRequests: Array<{
    label: string;
    summary: string;
    domain?: ModuleContextRequestedDomain;
  }>;
}

const BASE_PHASE_REQUIREMENTS: Record<number, MovePhaseContextRequirements> = {
  0: {
    phase: 0,
    label: "P0 Intake & Decision Framing",
    question:
      "What is the Move about, why now, and what enterprise context is needed to frame it correctly?",
    output: "P0 Context Scan",
    requiredDomains: [
      "enterprise_profile",
      "functions",
      "programs_priorities",
      "ai_automation_use_cases",
      "applications_systems",
      "data_assets_integrations",
      "org_ownership",
      "risks_controls",
      "metrics_outcomes",
      "evidence_sources",
    ],
    uploadRequests: [
      {
        label: "Problem statement or sponsor note",
        summary:
          "Upload the business problem, sponsor intent, or board/email framing for this Move.",
      },
      {
        label: "Initial success criteria",
        summary:
          "Upload target outcomes, current pain points, and the metrics leadership cares about.",
        domain: "metrics_outcomes",
      },
    ],
  },
  1: {
    phase: 1,
    label: "P1 Charter & Baseline",
    question:
      "What scope, baseline, evidence, and constraints should define this Move?",
    output: "P1 Charter Context Extract",
    requiredDomains: [
      "functions",
      "operational_process_evidence",
      "applications_systems",
      "data_assets_integrations",
      "vendors_contracts",
      "org_ownership",
      "metrics_outcomes",
      "risks_controls",
      "evidence_sources",
    ],
    uploadRequests: [
      {
        label: "Charter scope and boundary",
        summary:
          "Upload the in-scope/out-of-scope boundary, business owner roles, and first-slice definition.",
      },
      {
        label: "Baseline metric evidence",
        summary:
          "Upload the available baseline, target, or success criteria. Exact targets can be refined later.",
        domain: "metrics_outcomes",
      },
    ],
  },
  2: {
    phase: 2,
    label: "P2 Diagnose & Evidence Pressure-Test",
    question:
      "What is the current-state reality, what evidence supports it, and what gaps must be closed before solution design?",
    output: "P2 Discovery / Current-State Context Pack",
    requiredDomains: [
      "operational_process_evidence",
      "applications_systems",
      "data_assets_integrations",
      "org_ownership",
      "vendors_contracts",
      "metrics_outcomes",
      "risks_controls",
      "relationships",
      "evidence_sources",
    ],
    uploadRequests: [
      {
        label: "Current process map",
        summary:
          "Upload the current workflow, exceptions, handoffs, and pain points.",
        domain: "operational_process_evidence",
      },
      {
        label: "System landscape",
        summary:
          "Upload systems used today, integrations, data flows, and known constraints.",
        domain: "applications_systems",
      },
      {
        label: "Data source inventory",
        summary:
          "Upload source systems, data owners, data quality issues, latency, and access controls.",
        domain: "data_assets_integrations",
      },
      {
        label: "KPI baseline",
        summary:
          "Upload baseline metrics or success criteria for the use case.",
        domain: "metrics_outcomes",
      },
      {
        label: "Risk/control evidence",
        summary:
          "Upload PHI, privacy, audit, security, and human-in-the-loop control expectations.",
        domain: "risks_controls",
      },
      {
        label: "Ownership/governance evidence",
        summary:
          "Upload accountable business, platform, data, security, and change owner roles.",
        domain: "org_ownership",
      },
    ],
  },
  3: {
    phase: 3,
    label: "P3 Options & Solution Design",
    question:
      "What future-state process, technology, data, operating model, and controls are viable?",
    output: "P3 Design Evidence Pack",
    requiredDomains: [
      "operational_process_evidence",
      "applications_systems",
      "data_assets_integrations",
      "infrastructure_platforms",
      "ai_automation_use_cases",
      "risks_controls",
      "org_ownership",
      "vendors_contracts",
      "relationships",
      "evidence_sources",
    ],
    uploadRequests: [
      {
        label: "Validated P2 current-state facts",
        summary:
          "Attach approved current-state findings before finalizing solution options.",
      },
      {
        label: "Platform and security architecture evidence",
        summary:
          "Upload platform, network, identity, logging, security, and deployment constraints.",
        domain: "infrastructure_platforms",
      },
    ],
  },
  4: {
    phase: 4,
    label: "P4 Executive Decision & Commit",
    question:
      "What option should leadership choose, what value is expected, what risks exist, and what will be measured?",
    output: "P4 Business Case / Decision Context Pack",
    requiredDomains: [
      "metrics_outcomes",
      "vendors_contracts",
      "programs_priorities",
      "risks_controls",
      "functions",
      "relationships",
      "evidence_sources",
    ],
    uploadRequests: [
      {
        label: "Decision criteria and measurement plan",
        summary:
          "Upload leadership decision criteria, baseline evidence, and measurement ownership.",
        domain: "metrics_outcomes",
      },
    ],
  },
  5: {
    phase: 5,
    label: "P5 Execution Handoff",
    question:
      "What must be handed to delivery, governance, sourcing, and Tower?",
    output: "P5 Execution / Tower Handoff Context Pack",
    requiredDomains: [
      "applications_systems",
      "data_assets_integrations",
      "vendors_contracts",
      "org_ownership",
      "risks_controls",
      "metrics_outcomes",
      "relationships",
      "evidence_sources",
    ],
    uploadRequests: [
      {
        label: "Execution handoff pack",
        summary:
          "Upload committed scope, owners, delivery dependencies, unresolved risks, and Tower measurement needs.",
      },
    ],
  },
};

const AGENT_ASSIST_TERMS = [
  "agent assist",
  "call center",
  "contact center",
  "member service",
  "claims inquiry",
  "prior authorization",
  "eligibility",
  "benefits",
  "crm",
  "knowledge base",
  "call transcripts",
  "llm automation",
  "case handling",
];

const AGENT_ASSIST_DOMAINS: ModuleContextRequestedDomain[] = [
  "ai_automation_use_cases",
  "operational_process_evidence",
  "applications_systems",
  "data_assets_integrations",
  "infrastructure_platforms",
  "org_ownership",
  "workforce_roles",
  "functions",
  "metrics_outcomes",
  "risks_controls",
  "vendors_contracts",
  "relationships",
  "evidence_sources",
];

const DOMAIN_LABELS: Record<ModuleContextRequestedDomain, string> = {
  enterprise_profile: "Enterprise Profile",
  functions: "Business Functions",
  applications_systems: "Applications & Systems",
  vendors_contracts: "Vendors & Contracts",
  data_assets_integrations: "Data Assets & Integrations",
  programs_priorities: "Programs & Priorities",
  ai_automation_use_cases: "AI & Automation Use Cases",
  operational_process_evidence: "Operational Process Evidence",
  org_ownership: "Org Ownership",
  workforce_roles: "Workforce Roles",
  infrastructure_platforms: "Infrastructure & Platforms",
  risks_controls: "Risks & Controls",
  metrics_outcomes: "Metrics & Outcomes",
  relationships: "Relationships",
  evidence_sources: "Evidence Sources",
};

export function detectMoveContextArchetype(
  input: Pick<
    MoveContextExtractInput,
    "moveName" | "useCaseArchetype" | "phasePurpose" | "phaseLabel"
  >,
): string | null {
  const text = [
    input.moveName,
    input.useCaseArchetype,
    input.phaseLabel,
    input.phasePurpose,
  ]
    .join(" ")
    .toLowerCase();
  return AGENT_ASSIST_TERMS.some((term) => text.includes(term))
    ? "agent_assist_contact_center_ai"
    : null;
}

export function getMovePhaseContextRequirements(
  phase: number,
): MovePhaseContextRequirements {
  return BASE_PHASE_REQUIREMENTS[phase] ?? BASE_PHASE_REQUIREMENTS[5];
}

export function buildMoveContextDomains(
  input: Pick<
    MoveContextExtractInput,
    "phase" | "moveName" | "useCaseArchetype" | "phaseLabel" | "phasePurpose"
  >,
): ModuleContextRequestedDomain[] {
  const phaseRequirements = getMovePhaseContextRequirements(input.phase);
  const archetype = detectMoveContextArchetype(input);
  return Array.from(
    new Set([
      ...phaseRequirements.requiredDomains,
      ...(archetype === "agent_assist_contact_center_ai"
        ? AGENT_ASSIST_DOMAINS
        : []),
    ]),
  );
}

function compact(value: string, max = 900): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function extractId(
  input: MoveContextExtractInput,
  generatedAt: string,
): string {
  return [
    "move_context_extract",
    input.tenantKey,
    input.moveId,
    `p${input.phase}`,
    generatedAt.replace(/[^0-9T]/g, "").slice(0, 15),
  ].join(":");
}

function artifactTypeForPhase(phase: number): string {
  return `move_context_extract_p${phase}`;
}

function titleForPhase(phase: number): string {
  if (phase === 2) return "P2 Context Extract";
  if (phase === 3) return "P3 Design Evidence Pack";
  if (phase === 4) return "P4 Business Case Baseline Pack";
  if (phase === 5) return "P5 Execution / Tower Handoff Context Pack";
  return `P${phase} Context Extract`;
}

function queryFor(input: MoveContextExtractInput): string {
  return [
    input.moveName,
    input.useCaseArchetype,
    input.phaseLabel,
    input.phasePurpose,
    "business functions applications systems data assets integrations vendors risks controls metrics owners platform infrastructure evidence",
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

function fieldSummary(
  fields: Record<string, string | number | boolean>,
): string {
  return Object.entries(fields)
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("; ");
}

function suggestedItemFromModuleRecord(
  record: ModuleContextRecord,
): MoveContextExtractItem {
  const sectionLabel = DOMAIN_LABELS[record.domain];
  return {
    status: "suggested_context",
    label: `${sectionLabel}: ${record.title}`,
    summary: compact(
      [record.summary, fieldSummary(record.fields)].filter(Boolean).join(" "),
      900,
    ),
    reason:
      "Relevant active tenant context from the Module Context Serving Contract. Review before attaching; not consumed by generation by default.",
    sourceMode: "active_tenant_access",
    sourceLayer: "Module Context Serving Contract",
    domain: record.domain,
    sectionLabel,
    evidenceFamily: record.domain,
    sourceType: "active_tenant_context",
    citation: record.sourceEvidenceIds[0],
    readinessStatus:
      record.agentReadiness === "agent_ready" ? "agent_ready" : undefined,
    sourceArtifactId: record.sourceEvidenceIds[0],
    canonicalRecordId: record.recordId,
    confidence: record.confidence,
    diagnostics: {
      canonicalDomain: record.canonicalDomain,
      objectType: record.objectType,
      citationStatus: record.citationStatus,
      agentReadiness: record.agentReadiness,
      relationshipReadiness: record.relationshipReadiness,
      restricted: record.restricted,
    },
  };
}

function selectSuggestedModuleRecords(input: {
  records: ModuleContextRecord[];
  domainsRequested: ModuleContextRequestedDomain[];
  perDomainLimit?: number;
  totalLimit?: number;
}): ModuleContextRecord[] {
  const perDomainLimit = input.perDomainLimit ?? 4;
  const totalLimit = input.totalLimit ?? 52;
  const selected: ModuleContextRecord[] = [];
  for (const domain of input.domainsRequested) {
    const recordsForDomain = input.records
      .filter((record) => record.domain === domain && !record.restricted)
      .slice(0, perDomainLimit);
    selected.push(...recordsForDomain);
    if (selected.length >= totalLimit) break;
  }
  return selected.slice(0, totalLimit);
}

function gapItemFromModuleGap(gap: ModuleContextGap): MoveContextExtractItem {
  const sectionLabel = gap.domain ? DOMAIN_LABELS[gap.domain] : "Context Layer";
  return {
    status: "gap",
    label: `${sectionLabel} gap`,
    summary: gap.description,
    reason: `Module Context Serving reported a ${gap.severity} gap.`,
    sourceMode: "active_tenant_access",
    sourceLayer: gap.source ?? "Module Context Serving Contract",
    domain: gap.domain,
    sectionLabel,
    sourceType: "context_gap",
    sourceArtifactId: gap.gapId,
  };
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" &&
    value.trim() &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }
  return null;
}

function extractedStringArray(
  structured: Record<string, unknown>,
  key: string,
): string[] {
  const value = structured[key];
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => stringOrNull(item))
    .filter((item): item is string => Boolean(item));
}

function evidenceRowText(row: MoveEvidenceRow): string {
  const signals = [
    ...extractedStringArray(row.extractedStructured, "decisions"),
    ...extractedStringArray(row.extractedStructured, "baseline_candidates"),
    ...extractedStringArray(row.extractedStructured, "risks"),
    ...extractedStringArray(row.extractedStructured, "action_items"),
  ];
  return compact(
    [
      row.summary,
      signals.length
        ? `Extracted signals: ${signals.slice(0, 8).join("; ")}`
        : "",
      row.extractedText ?? "",
    ].join(" "),
    1200,
  );
}

function evidencePolicyAllowsAttachment(row: MoveEvidenceRow): boolean {
  if (row.evidenceType === MOVE_CONTEXT_EXTRACT_EVIDENCE_TYPE) return false;
  const structured = row.extractedStructured;
  const sourceType = stringOrNull(structured.source_type);
  if (
    sourceType === "candidate_preview" ||
    sourceType === "suggested_context"
  ) {
    return false;
  }
  const classification = stringOrNull(structured.classification);
  if (classification === "restricted") return false;
  const sensitivity = stringOrNull(structured.sensitivity);
  if (sensitivity === "restricted") return false;
  return Boolean(evidenceRowText(row));
}

function discoveryItemFromRow(
  row: MoveEvidenceRow,
): DiscoveryEvidenceReadinessItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    evidenceType: row.evidenceType,
    phase: row.phase,
    confidence: row.confidence,
    createdAt: row.createdAt,
  };
}

function attachedItemFromEvidenceRow(
  input: MoveContextExtractInput,
  row: MoveEvidenceRow,
): MoveContextExtractItem {
  const blueprint = getDiscoveryBlueprint(input.useCaseArchetype);
  const family =
    mapEvidenceToDiscoveryFamily(discoveryItemFromRow(row), blueprint) ??
    stringOrNull(row.extractedStructured.evidence_type) ??
    row.evidenceType;
  const sourceFileRef =
    stringOrNull(row.extractedStructured.citation) ??
    stringOrNull(row.extractedStructured.source_file) ??
    row.attachmentId ??
    row.id;
  return {
    status: "attached_evidence",
    evidenceId: row.id,
    moveId: row.programId,
    tenantId: input.ctx.clientId,
    tenantKey: row.tenantKey,
    evidenceFamily: family,
    label: row.title,
    summary: evidenceRowText(row),
    reason:
      "Move-scoped uploaded evidence is covered by readiness and eligible for phase generation.",
    sourceMode: "active_home_context",
    sourceType:
      stringOrNull(row.extractedStructured.source_type) ??
      (row.attachmentId ? "uploaded_evidence" : "program_evidence"),
    sourceArtifactId: row.attachmentId ?? row.id,
    sourceFileRef,
    citation: sourceFileRef,
    confidence: numberOrNull(row.confidence) ?? undefined,
    readinessStatus: "covered",
    usedByPhase: input.phase,
    targetPhase: input.targetPhase ?? input.phase,
    whyAttached:
      "Same tenant, same Move, source-backed/uploaded evidence, readiness-covered, and generation-eligible.",
  };
}

async function defaultLoadMoveEvidenceRows(args: {
  tenantKey: string;
  moveId: string;
}): Promise<MoveEvidenceRow[]> {
  const sb = getAzureWriteFluentClient();
  const { data, error } = await sb
    .from("program_evidence_items")
    .select(
      "id, tenant_key, program_id, attachment_id, phase, evidence_type, title, summary, extracted_text, extracted_structured, confidence, created_at",
    )
    .eq("tenant_key", args.tenantKey)
    .eq("program_id", args.moveId)
    .order("created_at", { ascending: false })
    .limit(80);
  if (error || !Array.isArray(data)) return [];
  return (data as Array<Record<string, unknown>>)
    .map((row) => ({
      id: stringOrNull(row.id) ?? "",
      tenantKey: stringOrNull(row.tenant_key) ?? args.tenantKey,
      programId: stringOrNull(row.program_id) ?? args.moveId,
      attachmentId: stringOrNull(row.attachment_id),
      phase: numberOrNull(row.phase),
      evidenceType: stringOrNull(row.evidence_type) ?? "uploaded_artifact",
      title: stringOrNull(row.title) ?? "Untitled Move evidence",
      summary: stringOrNull(row.summary) ?? "",
      extractedText: stringOrNull(row.extracted_text),
      extractedStructured: objectValue(row.extracted_structured),
      confidence: row.confidence as number | string | null,
      createdAt: stringOrNull(row.created_at),
    }))
    .filter(
      (row) =>
        row.id &&
        row.programId === args.moveId &&
        row.tenantKey === args.tenantKey,
    );
}

async function defaultExistingExtract(args: {
  tenantKey: string;
  moveId: string;
  artifactType: string;
}): Promise<{ artifactId: string } | null> {
  const sb = getAzureWriteFluentClient();
  const { data, error } = await sb
    .from("move_artifacts")
    .select("artifact_id")
    .eq("tenant_key", args.tenantKey)
    .eq("move_id", args.moveId)
    .eq("artifact_type", args.artifactType)
    .eq("lifecycle_state", "current")
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return { artifactId: (data as { artifact_id: string }).artifact_id };
}

function explicitCandidatePreview(input: MoveContextExtractInput): boolean {
  return Boolean(
    input.candidatePreview?.enabled &&
    input.candidatePreview.acknowledgedNotActiveRuntimeTruth &&
    input.candidatePreview.candidateVersionId,
  );
}

function candidateSuggestedItems(
  input: MoveContextExtractInput,
): MoveContextExtractItem[] {
  if (!explicitCandidatePreview(input)) return [];
  const packet = findSkyHarborPreviewModule("moves");
  return packet.sampleFacts.map((fact) => ({
    status: "suggested_context",
    label: fact.label,
    summary: `${fact.objectType} in ${fact.domain}. Candidate preview only; not active runtime truth.`,
    reason:
      "Candidate preview context is relevant but cannot be attached as approved evidence until promoted and reviewed.",
    sourceMode: "candidate_preview",
    sourceArtifactId: input.candidatePreview?.candidateVersionId,
  }));
}

function candidateExcludedItem(
  input: MoveContextExtractInput,
): MoveContextExtractItem | null {
  if (input.candidatePreview?.enabled) return null;
  return {
    status: "excluded_context",
    label: "Candidate preview data",
    summary:
      "Candidate context was not read because this was a default active-mode Approve & Build request.",
    reason: "Never read candidate data by default.",
    sourceMode: "candidate_preview",
  };
}

function uploadRequestItems(
  input: MoveContextExtractInput,
): MoveContextExtractItem[] {
  const phaseRequirements = getMovePhaseContextRequirements(input.phase);
  return phaseRequirements.uploadRequests.map((request) => ({
    status: "gap",
    label: request.label,
    summary: request.summary,
    reason:
      "Client can upload this for the current Move or submit it to Admin for Context Layer reuse.",
    sourceMode: "active_tenant_access",
    sourceLayer: "Moves evidence upload",
    domain: request.domain,
    sectionLabel: request.domain
      ? DOMAIN_LABELS[request.domain]
      : "Move Evidence",
    sourceType: "upload_request",
    targetPhase: input.targetPhase ?? input.phase,
    diagnostics: {
      moveOnlyUseAvailable: true,
      contextLayerReuseStatus: "admin_intake_candidate_available_after_upload",
    },
  }));
}

function gapItems(input: {
  attached: MoveContextExtractItem[];
  moduleContext: ServedModuleContextPacket | null;
  domainsRequested: ModuleContextRequestedDomain[];
}): MoveContextExtractItem[] {
  const gaps: MoveContextExtractItem[] = [];
  const domainSummaries = new Map(
    (input.moduleContext?.domains ?? []).map((domain) => [
      domain.domain,
      domain,
    ]),
  );
  for (const domain of input.domainsRequested) {
    const summary = domainSummaries.get(domain);
    if (!summary || summary.acceptedRecords <= 0) {
      gaps.push({
        status: "gap",
        label: `${DOMAIN_LABELS[domain]} evidence`,
        summary:
          "Required phase context was not found or is not strong enough in active tenant context.",
        reason:
          "AbarVa needs client evidence or validated context before this phase can be finalized with confidence.",
        sourceMode: "active_tenant_access",
        sourceLayer: "Module Context Serving Contract",
        domain,
        sectionLabel: DOMAIN_LABELS[domain],
        sourceType: "required_context_gap",
      });
    }
  }
  gaps.push(...(input.moduleContext?.gaps ?? []).map(gapItemFromModuleGap));
  if (input.attached.length === 0) {
    gaps.push({
      status: "gap",
      label: "Approved Move evidence",
      summary:
        "No Move-scoped uploaded evidence is attached yet. Suggested data-layer context is review-only and will not feed generation by default.",
      reason: "Generation consumes attached/approved Move evidence only.",
      sourceMode: "active_home_context",
      sourceLayer: "Moves Module Memory",
      sourceType: "move_evidence_gap",
    });
  }
  return gaps;
}

function renderMarkdown(input: {
  result: Omit<MoveContextExtractResult, "artifactId" | "evidenceId">;
  moveName: string;
  phaseLabel: string;
}): string {
  const familyCounts = new Map<string, number>();
  for (const item of input.result.attachedEvidenceItems) {
    const family = item.evidenceFamily ?? "uncategorized";
    familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
  }
  const lines = [
    `# ${titleForPhase(input.result.phase)}`,
    "",
    getMovePhaseContextRequirements(input.result.phase).output,
    "",
    "AbarVa scanned the governed tenant context layers and Move evidence for this phase. Move-scoped approved/uploaded evidence is attached for generation. Data-layer context is suggested for review and is not consumed by generation unless explicitly attached or approved.",
    "",
    `- Move: ${input.moveName}`,
    `- Phase: ${input.phaseLabel}`,
    `- Phase question: ${getMovePhaseContextRequirements(input.result.phase).question}`,
    `- Archetype detected: ${input.result.archetypeDetected ?? "not detected"}`,
    `- Source mode: ${input.result.sourceMode}`,
    `- Generated at: ${input.result.generatedAt}`,
    `- Candidate version: ${input.result.candidateVersionId ?? "not used"}`,
    `- Active Tenant Access version: ${input.result.activeTenantAccessVersionId ?? "not available"}`,
    `- Attached Evidence count: ${input.result.attachedEvidenceItems.length}`,
    `- Suggested Data-Layer Context count: ${input.result.suggestedContextItems.length}`,
    `- Context Layer reuse status: ${input.result.contextLayerReuseStatus}`,
    "",
    "## What AbarVa Scanned",
    ...input.result.sourceLayersScanned.map((layer) => `- ${layer}`),
    "",
    "## Domains Requested",
    ...input.result.domainsRequested.map(
      (domain) => `- ${DOMAIN_LABELS[domain]}`,
    ),
    "",
    "## What This Means For The Phase",
    input.result.gapItems.some(
      (item) => item.sourceType === "required_context_gap",
    )
      ? "Needs client evidence before this phase should be treated as decision-ready."
      : input.result.attachedEvidenceItems.length > 0
        ? "Ready to draft with caveats. Suggested context still requires review before it can become approved evidence."
        : "Ready for discovery framing only. Upload or approve Move evidence before generation relies on it.",
    "",
    "## Evidence Family Coverage",
    familyCounts.size === 0
      ? "None."
      : [...familyCounts.entries()]
          .map(([family, count]) => `- ${family}: ${count} attached`)
          .join("\n"),
    "",
  ];
  const section = (title: string, items: MoveContextExtractItem[]) => {
    lines.push(`## ${title}`);
    if (items.length === 0) {
      lines.push("None.");
    } else {
      for (const item of items) {
        lines.push(
          `- ${item.label}: ${item.summary}`,
          ...(item.evidenceId ? [`  - Evidence ID: ${item.evidenceId}`] : []),
          ...(item.evidenceFamily
            ? [`  - Evidence family: ${item.evidenceFamily}`]
            : []),
          ...(item.sourceType ? [`  - Source type: ${item.sourceType}`] : []),
          ...(item.sourceFileRef ? [`  - Source: ${item.sourceFileRef}`] : []),
          `  - Reason: ${item.reason}`,
          ...(item.whyAttached
            ? [`  - Why attached: ${item.whyAttached}`]
            : []),
        );
      }
    }
    lines.push("");
  };
  section("Attached Evidence", input.result.attachedEvidenceItems);
  section(
    "Suggested Data-Layer Context - Needs Review",
    input.result.suggestedContextItems,
  );
  section("Excluded / Not Used", input.result.excludedContextItems);
  section("Gaps to Complete", input.result.gapItems);
  section("Suggested Uploads", input.result.uploadRequests);
  return lines.join("\n");
}

function evidencePayload(
  input: MoveContextExtractInput,
  result: MoveContextExtractResult,
): ExtractedProgramEvidence {
  const facts = result.attachedEvidenceItems.map((item) =>
    [
      item.evidenceId ? `Evidence ID ${item.evidenceId}` : null,
      item.evidenceFamily ? `Family ${item.evidenceFamily}` : null,
      `${item.label}: ${item.summary}`,
      item.sourceFileRef ? `Source ${item.sourceFileRef}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
  );
  return {
    evidenceType: MOVE_CONTEXT_EXTRACT_EVIDENCE_TYPE,
    title: titleForPhase(input.phase),
    summary: `${facts.length} agent-ready context item${facts.length === 1 ? "" : "s"} attached to ${input.phaseLabel}. Suggested/candidate-only context is excluded from this evidence row.`,
    extractedText: facts.join("\n\n"),
    extractedStructured: {
      decisions: [],
      action_items: [],
      risks: [],
      baseline_candidates: facts,
      attendees: [],
      parse_method: "move-context-extract/v1",
      source_layers_scanned: result.sourceLayersScanned,
      domains_requested: result.domainsRequested,
      archetype_detected: result.archetypeDetected,
      warnings: [
        "Only Attached Evidence is present in this row.",
        "Suggested Context and candidate-preview items are intentionally excluded from downstream generation.",
      ],
    },
    confidence: facts.length > 0 ? 0.82 : 0.5,
  };
}

export async function createMoveContextExtract(
  input: MoveContextExtractInput,
  deps: MoveContextExtractDeps = {},
): Promise<MoveContextExtractResult> {
  const generatedAt = new Date().toISOString();
  const targetPhase = input.targetPhase ?? input.phase;
  const sourceMode: MoveContextExtractSourceMode = explicitCandidatePreview(
    input,
  )
    ? "candidate_preview"
    : "active_tenant_access";
  const artifactType = artifactTypeForPhase(input.phase);
  const domainsRequested = buildMoveContextDomains(input);
  const archetypeDetected = detectMoveContextArchetype(input);
  const sourceLayersScanned =
    sourceMode === "candidate_preview"
      ? ["Candidate Preview", "Evidence Registry", "File Cabinet"]
      : [
          "Active Tenant Access",
          "Module Context Serving Contract",
          "Evidence Registry",
          "Moves Module Memory",
          "File Cabinet",
        ];
  const contextLayerReuseStatus =
    "Move uploads can be used for this Move only, or submitted to Admin as Context Intake Candidates for later validation and promotion.";
  const existing = await (deps.existingExtract ?? defaultExistingExtract)({
    tenantKey: input.tenantKey,
    moveId: input.moveId,
    artifactType,
  });
  if (existing) {
    return {
      status: "skipped_existing",
      extractId: null,
      artifactId: existing.artifactId,
      evidenceId: null,
      moveId: input.moveId,
      tenantKey: input.tenantKey,
      sourceMode,
      phase: input.phase,
      targetPhase,
      activeTenantAccessVersionId: null,
      candidateVersionId: input.candidatePreview?.candidateVersionId ?? null,
      sourceBuildId: null,
      attachedEvidenceItems: [],
      suggestedContextItems: [],
      excludedContextItems: [],
      gapItems: [],
      sourceLayersScanned,
      domainsRequested,
      archetypeDetected,
      uploadRequests: [],
      contextLayerReuseStatus,
      generatedAt,
      message: "Existing current Move Context Extract found; not regenerated.",
    };
  }

  let attachedEvidenceItems: MoveContextExtractItem[] = [];
  let suggestedContextItems = candidateSuggestedItems(input);
  const excludedContextItems = [candidateExcludedItem(input)].filter(
    (item): item is MoveContextExtractItem => item !== null,
  );
  let moduleContext: ServedModuleContextPacket | null = null;
  const uploadRequests = uploadRequestItems(input);

  if (sourceMode === "active_tenant_access") {
    const loadMoveEvidence =
      deps.loadMoveEvidence ?? defaultLoadMoveEvidenceRows;
    const moveEvidenceRows = await loadMoveEvidence({
      tenantKey: input.tenantKey,
      moveId: input.moveId,
    });
    attachedEvidenceItems = moveEvidenceRows
      .filter(evidencePolicyAllowsAttachment)
      .map((row) => attachedItemFromEvidenceRow(input, row));

    const readModuleContext = deps.getModuleContext ?? getModuleContext;
    const moduleRequest: ModuleContextReadRequest = {
      tenantKey: input.tenantKey,
      moduleKey: "moves",
      purpose: "evidence_extract",
      mode: "active",
      requestedDomains: domainsRequested,
      evidencePolicy: "lineage_required",
      relationshipPolicy: "validated_and_candidates",
      scope: {
        moveId: input.moveId,
        phase: String(input.phase),
        targetPhase: String(targetPhase),
        useCase: input.useCaseArchetype,
        charter: input.moveName,
        question: queryFor(input),
      },
    };
    moduleContext = await readModuleContext(moduleRequest, {
      repoRoot: process.cwd(),
      generatedAt,
    });
    suggestedContextItems = [
      ...suggestedContextItems,
      ...selectSuggestedModuleRecords({
        records: moduleContext.records,
        domainsRequested,
      }).map(suggestedItemFromModuleRecord),
    ];
  }

  const resultBase = {
    status: "created" as const,
    extractId: extractId(input, generatedAt),
    moveId: input.moveId,
    tenantKey: input.tenantKey,
    sourceMode,
    phase: input.phase,
    targetPhase,
    activeTenantAccessVersionId:
      moduleContext?.activeTenantAccessVersionId ?? null,
    candidateVersionId:
      sourceMode === "candidate_preview"
        ? (input.candidatePreview?.candidateVersionId ?? null)
        : null,
    sourceBuildId: moduleContext?.lineage.sourceBuildId ?? null,
    attachedEvidenceItems,
    suggestedContextItems,
    excludedContextItems,
    gapItems: gapItems({
      attached: attachedEvidenceItems,
      moduleContext,
      domainsRequested,
    }),
    sourceLayersScanned,
    domainsRequested,
    archetypeDetected,
    uploadRequests,
    contextLayerReuseStatus,
    generatedAt,
  };

  const saveArtifact = deps.saveArtifact ?? saveMoveArtifact;
  const saved = await saveArtifact(input.ctx, {
    moveId: input.moveId,
    phase: input.phase,
    archetype: input.useCaseArchetype,
    artifactType,
    artifactFamily: "session_artifact",
    title: titleForPhase(input.phase),
    description:
      "Move-scoped context extract. Suggested context is visible but not used by generation.",
    fileName: `${artifactType}.md`,
    fileFormat: "md",
    body: renderMarkdown({
      result: resultBase,
      moveName: input.moveName,
      phaseLabel: input.phaseLabel,
    }),
    status: attachedEvidenceItems.length > 0 ? "review_required" : "draft",
    generatedBy: input.ctx.userId,
    sourceBasis: sourceMode,
    confidence: attachedEvidenceItems.length > 0 ? "medium" : "low",
    citationReady: attachedEvidenceItems.length > 0,
    metadata: {
      moveContextExtract: resultBase,
      moduleContextServing: moduleContext
        ? {
            sourceMode: moduleContext.sourceMode,
            activeTenantAccessVersionId:
              moduleContext.activeTenantAccessVersionId,
            tenantDataVersion: moduleContext.tenantDataVersion,
            contextCompleteness: moduleContext.contextCompleteness,
            readiness: moduleContext.readiness,
            lineage: moduleContext.lineage,
          }
        : null,
      guardrails: {
        candidateReadByDefault: false,
        activeAndCandidateMixed: false,
        suggestedContextUsedForGeneration: false,
        candidatePromoted: false,
        activeTenantAccessLayerUpdated: false,
        moduleRuntimeConsumptionChanged: false,
        realizedValueClaimed: false,
      },
    },
  });

  let evidenceId: string | null = null;
  if (attachedEvidenceItems.length > 0) {
    const recordEvidence = deps.recordEvidence ?? recordProgramEvidence;
    evidenceId = await recordEvidence(input.ctx, {
      tenantKey: input.tenantKey,
      programId: input.moveId,
      phase: input.phase,
      stepId: "move_context_extract",
      ...evidencePayload(input, {
        ...resultBase,
        artifactId: saved.artifactId,
        evidenceId: null,
      }),
    });
  }

  return {
    ...resultBase,
    artifactId: saved.artifactId,
    evidenceId,
  };
}

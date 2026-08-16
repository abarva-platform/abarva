import type {
  HealthFinding,
  NormalizedCategory,
  ProposalHealthAssessment,
  ProposalNormalizationRow,
  ScoreReadiness,
  VendorResponseFileRole,
} from "./types";
import type { VendorResponseProfileSet } from "./mve-profile";
import { buildHealthScaffold } from "./health";
import { buildProposalContextTrace } from "./isolation";

export const VENDOR_RESPONSE_PARSER_VERSION = "vendor-response-parser-v1";

export type VendorResponseParseStatus =
  | "parsed"
  | "parsed_with_gaps"
  | "not_parseable"
  | "isolation_blocked";

export type VendorResponseSectionParseStatus = "answered" | "weak" | "missing";

export interface VendorResponseDocumentInput {
  fileName: string;
  role: VendorResponseFileRole;
  text: string;
  artifactId?: string;
  blobPath?: string;
  /** Optional vendor guard. A rival vendor value blocks the parse report. */
  vendorName?: string | null;
}

export interface VendorResponseParseInput {
  sourceEventId: string;
  tenantKey: string;
  vendorName: string;
  responseVersion: number;
  requiredSections: string[];
  documents: VendorResponseDocumentInput[];
  generatedAt?: string;
}

export interface VendorResponseCitation {
  citationId: string;
  sourceEventId: string;
  tenantKey: string;
  vendorName: string;
  responseVersion: number;
  fileName: string;
  role: VendorResponseFileRole;
  section: string;
  locator: string;
  excerpt: string;
}

export interface VendorResponseSectionFinding {
  section: string;
  normalizedCategory: NormalizedCategory;
  status: VendorResponseSectionParseStatus;
  summary: string;
  citationIds: string[];
  missingReason: string | null;
  evaluatorHoldback: string | null;
}

export interface VendorResponseFileRoleReadiness {
  role: VendorResponseFileRole;
  label: string;
  required: boolean;
  uploaded: boolean;
  parsed: boolean;
  citationCount: number;
  nextAction: string;
}

export interface VendorResponseMissingInput {
  missingId: string;
  severity: "blocker" | "holdback" | "optional";
  ownerRole: string;
  request: string;
  scoringImpact: string;
}

export interface VendorResponseParseReport {
  sourceEventId: string;
  tenantKey: string;
  vendorName: string;
  responseVersion: number;
  parserVersion: string;
  generatedAt: string;
  status: VendorResponseParseStatus;
  vendorIsolationStatus: "isolated" | "violation_detected";
  parsedDocumentCount: number;
  citationCount: number;
  fileRoleReadiness: VendorResponseFileRoleReadiness[];
  sectionFindings: VendorResponseSectionFinding[];
  missingInputs: VendorResponseMissingInput[];
  citations: VendorResponseCitation[];
  normalizationRows: ProposalNormalizationRow[];
  health: ProposalHealthAssessment;
  scoreReadiness: ScoreReadiness;
  traceId: string;
  nextAction: string;
}

interface SectionRule {
  section: string;
  category: NormalizedCategory;
  aliases: RegExp[];
  weakSignals: RegExp[];
  holdback: string;
}

interface RequiredRole {
  role: VendorResponseFileRole;
  label: string;
  required: boolean;
}

const DEFAULT_GENERATED_AT = "2026-08-11T00:00:00.000Z";

const REQUIRED_FILE_ROLES: RequiredRole[] = [
  { role: "response_package", label: "Main proposal", required: true },
  { role: "pricing_workbook", label: "Pricing workbook", required: true },
  {
    role: "compliance_matrix",
    label: "Compliance matrix",
    required: false,
  },
  {
    role: "exceptions_redlines",
    label: "Exceptions and redlines",
    required: false,
  },
  { role: "exhibits", label: "Proof exhibits", required: false },
];

const SECTION_RULES: SectionRule[] = [
  {
    section: "Scope confirmation",
    category: "scope_coverage",
    aliases: [/scope/i, /in[- ]scope/i, /out[- ]of[- ]scope/i],
    weakSignals: [/to be confirmed/i, /assum/i, /not included/i],
    holdback:
      "Do not score scope coverage until inclusions, exclusions, and retained work are explicit.",
  },
  {
    section: "Pricing template",
    category: "pricing_structure",
    aliases: [/pricing/i, /commercial/i, /run[- ]?rate/i, /tco/i],
    weakSignals: [/bundled/i, /not broken/i, /pass[- ]?through/i, /uncapped/i],
    holdback:
      "Do not score commercial value until run, transition, tooling, and optional costs are comparable.",
  },
  {
    section: "SLA response",
    category: "sla_commitments",
    aliases: [/sla/i, /service level/i, /service credit/i],
    weakSignals: [/best effort/i, /earn[- ]?back/i, /cap/i],
    holdback:
      "Do not score service accountability until SLA targets, credits, remedies, and chronic-miss rules are clear.",
  },
  {
    section: "Staffing model",
    category: "staffing_model",
    aliases: [/staff/i, /fte/i, /location/i, /coverage model/i],
    weakSignals: [/to be determined/i, /flexible/i, /shared pool/i],
    holdback:
      "Do not score delivery capacity until roles, locations, shifts, and named coverage are comparable.",
  },
  {
    section: "Transition plan",
    category: "transition_approach",
    aliases: [/transition/i, /knowledge transfer/i, /cutover/i],
    weakSignals: [/dependency/i, /client sme/i, /front[- ]loaded/i],
    holdback:
      "Do not score transition confidence until milestones, dependencies, and acceptance holdbacks are explicit.",
  },
  {
    section: "Security and compliance response",
    category: "security_compliance",
    aliases: [/security/i, /soc ?2/i, /compliance/i, /incident/i],
    weakSignals: [/available on request/i, /not provided/i, /exception/i],
    holdback:
      "Do not score risk controls until security evidence and compliance obligations are cited.",
  },
  {
    section: "Solution architecture",
    category: "solution_architecture",
    aliases: [
      /solution architecture/i,
      /integration architecture/i,
      /data architecture/i,
      /ai architecture/i,
      /reference architecture/i,
      /target architecture/i,
    ],
    weakSignals: [
      /to be designed/i,
      /conceptual/i,
      /illustrative/i,
      /not finalized/i,
      /architecture pending/i,
    ],
    holdback:
      "Do not score technical fit until the solution architecture names integrations, data flows, controls, and ownership boundaries.",
  },
  {
    section: "Automation / productivity roadmap",
    category: "automation_productivity",
    aliases: [/automation/i, /productivity/i, /ai/i, /continuous improvement/i],
    weakSignals: [/aspirational/i, /target/i, /opportunity/i, /not committed/i],
    holdback:
      "Treat productivity as leverage to test until the vendor commits a measured price-down or gainshare.",
  },
  {
    section: "Assumptions and exclusions",
    category: "assumptions_dependencies",
    aliases: [/assumption/i, /exclusion/i, /dependency/i],
    weakSignals: [/client provided/i, /out of scope/i, /change order/i],
    holdback:
      "Do not score savings without normalizing assumptions, exclusions, and retained-client work.",
  },
];

const REQUIRED_SECTION_FALLBACKS = SECTION_RULES.map((rule) => rule.section);

export function buildVendorResponseParseReport(
  input: VendorResponseParseInput,
): VendorResponseParseReport {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const requiredSections =
    input.requiredSections.length > 0
      ? input.requiredSections
      : REQUIRED_SECTION_FALLBACKS;
  const isolationViolations = input.documents.filter(
    (document) =>
      document.vendorName &&
      simplify(document.vendorName) !== simplify(input.vendorName),
  );
  const allowedDocuments = input.documents.filter(
    (document) => !isolationViolations.includes(document),
  );
  const citations = buildCitations(input, allowedDocuments);
  const sectionFindings = requiredSections.map((section) =>
    buildSectionFinding(section, citations),
  );
  const fileRoleReadiness = buildFileRoleReadiness(allowedDocuments, citations);
  const normalizationRows = sectionFindings.map((finding) =>
    toNormalizationRow(input, finding, citations),
  );
  const missingInputs = buildMissingInputs(sectionFindings, fileRoleReadiness);
  const narrativeFindings = buildNarrativeFindings(sectionFindings);
  const health = buildHealthScaffold({
    sourceEventId: input.sourceEventId,
    vendorName: input.vendorName,
    responseVersion: input.responseVersion,
    requiredSections,
    answeredSections: sectionFindings
      .filter((finding) => finding.status !== "missing")
      .map((finding) => finding.section),
    files: allowedDocuments.map((document) => ({
      role: document.role,
      fileName: document.fileName,
      artifactId: document.artifactId ?? document.fileName,
      blobPath: document.blobPath ?? document.fileName,
    })),
    rows: normalizationRows,
    narrativeFindings,
  });
  const trace = buildProposalContextTrace({
    sourceEventId: input.sourceEventId,
    vendorName: input.vendorName,
    proposalVersion: input.responseVersion,
    tenantId: input.tenantKey,
    archetype: "SOURCE_VENDOR_RESPONSE",
    evaluationStage: "responses",
    rfpRequirementsRetrieved: requiredSections.length,
    vendorFiles: allowedDocuments.map((document) => document.fileName),
    normalizedCategories: normalizationRows.map(
      (row) => row.normalizedCategory,
    ),
    evidenceUsed: citations.map((citation) => citation.citationId),
    pricingInputsUsed: citations
      .filter((citation) => citation.role === "pricing_workbook")
      .map((citation) => citation.citationId),
    excludedByReason:
      isolationViolations.length > 0
        ? { rival_vendor_document: isolationViolations.length }
        : {},
    scoringCriteriaUsed: requiredSections,
    assumptions: normalizationRows.flatMap((row) => row.assumptions),
    missingInputs: missingInputs.map((missing) => missing.request),
    claims: normalizationRows.map((row) => ({
      text: row.vendorResponseSummary,
      citation: row.evidenceReference ?? undefined,
    })),
    citations: citations.map((citation) => citation.citationId),
    bundleObjects: [
      ...allowedDocuments.map((document) => ({
        ref: document.fileName,
        vendorName: input.vendorName,
      })),
      ...isolationViolations.map((document) => ({
        ref: document.fileName,
        vendorName: document.vendorName ?? "unknown vendor",
      })),
    ],
  });
  const status = resolveParseStatus(
    isolationViolations.length,
    sectionFindings,
    fileRoleReadiness,
  );

  return {
    sourceEventId: input.sourceEventId,
    tenantKey: input.tenantKey,
    vendorName: input.vendorName,
    responseVersion: input.responseVersion,
    parserVersion: VENDOR_RESPONSE_PARSER_VERSION,
    generatedAt,
    status,
    vendorIsolationStatus: trace.vendor_isolation_status,
    parsedDocumentCount: allowedDocuments.length,
    citationCount: citations.length,
    fileRoleReadiness,
    sectionFindings,
    missingInputs,
    citations,
    normalizationRows,
    health,
    scoreReadiness: health.scoreReadiness,
    traceId: trace.trace_id,
    nextAction: nextActionFor(status, missingInputs),
  };
}

export function buildVendorResponseParseReportsFromProfiles(
  profileSet?: VendorResponseProfileSet | null,
): VendorResponseParseReport[] {
  if (!profileSet) return [];
  return profileSet.profiles.map((profile) =>
    buildVendorResponseParseReport({
      sourceEventId: profile.sourceEventId,
      tenantKey: profile.tenantKey,
      vendorName: profile.vendorName,
      responseVersion: profile.responseVersion,
      requiredSections: [
        "Scope confirmation",
        "Pricing template",
        "SLA response",
        "Staffing model",
        "Transition plan",
        "Security and compliance response",
        "Solution architecture",
        "Automation / productivity roadmap",
        "Assumptions and exclusions",
      ],
      documents: [
        {
          fileName: `${profile.vendorId}-main-response.pdf`,
          role: "response_package",
          vendorName: profile.vendorName,
          text: [
            `Scope: ${profile.packageSummary}`,
            `SLA response: ${profile.slaCommitments}`,
            `Staffing model: ${profile.staffingModelSummary}`,
            `Transition plan: ${profile.transitionCommitments}`,
            `Security and compliance response: ${profile.evidenceProvided.join("; ")}`,
            `Solution architecture: ${profile.packageSummary}`,
            `Automation productivity roadmap: ${profile.productivityCommitment}`,
            `Assumptions and exclusions: ${profile.assumptionsExclusions.join("; ")}`,
          ].join("\n\n"),
        },
        {
          fileName: `${profile.vendorId}-pricing.xlsx`,
          role: "pricing_workbook",
          vendorName: profile.vendorName,
          text: `Pricing: ${profile.pricingSummary.pricingBasis} Year one run-rate ${profile.pricingSummary.yearOneRunCostUsd ?? "unknown"}; transition ${profile.pricingSummary.transitionCostUsd ?? "unknown"}; five year TCO ${profile.pricingSummary.fiveYearTcoUsd ?? "unknown"}.`,
        },
        {
          fileName: `${profile.vendorId}-evidence-index.xlsx`,
          role: "exhibits",
          vendorName: profile.vendorName,
          text: profile.exhibits
            .map(
              (exhibit) =>
                `${exhibit.label}: ${exhibit.evidenceReference ?? "not cited"} ${exhibit.issue ?? ""}`,
            )
            .join("\n\n"),
        },
      ],
    }),
  );
}

/**
 * Keep the first-page Responses route payload small without changing the
 * parser's governed output. The route needs readiness, score holdbacks,
 * evidence labels and leverage inputs; it does not need every full citation
 * excerpt or every repeated health sentence in the RSC payload.
 */
export function compactVendorResponseParseReportForRoute(
  report: VendorResponseParseReport,
): VendorResponseParseReport {
  const citationIdsToKeep = new Set<string>();
  for (const finding of report.sectionFindings) {
    for (const id of finding.citationIds.slice(0, 1)) {
      citationIdsToKeep.add(id);
    }
  }

  const citations = report.citations
    .filter(
      (citation, index) => citationIdsToKeep.has(citation.citationId) || index < 3,
    )
    .slice(0, 6)
    .map((citation) => ({
      ...citation,
      excerpt: compactText(citation.excerpt, 120),
    }));

  return {
    ...report,
    fileRoleReadiness: report.fileRoleReadiness.map((role) => ({
      ...role,
      nextAction: compactText(role.nextAction, 120),
    })),
    sectionFindings: report.sectionFindings.map((finding) => ({
      ...finding,
      summary: compactText(finding.summary, 140),
      citationIds: finding.citationIds.slice(0, 1),
      missingReason: compactNullableText(finding.missingReason, 140),
      evaluatorHoldback: compactNullableText(finding.evaluatorHoldback, 160),
    })),
    missingInputs: report.missingInputs.map((missing) => ({
      ...missing,
      request: compactText(missing.request, 150),
      scoringImpact: compactText(missing.scoringImpact, 170),
    })),
    citations,
    normalizationRows: report.normalizationRows.map((row) => ({
      ...row,
      vendorResponseSummary: compactText(row.vendorResponseSummary, 140),
      normalizedAnswer: compactNullableText(row.normalizedAnswer, 140),
      deviations: row.deviations.slice(0, 2).map((value) => compactText(value, 150)),
      assumptions: row.assumptions.slice(0, 2).map((value) => compactText(value, 150)),
      evaluatorNotes: compactNullableText(row.evaluatorNotes, 150),
    })),
    health: {
      ...report.health,
      missingSections: report.health.missingSections.slice(0, 12),
      findings: report.health.findings.slice(0, 12).map((finding) => ({
        ...finding,
        finding: compactText(finding.finding, 170),
        clarificationQuestion: compactNullableText(
          finding.clarificationQuestion,
          170,
        ),
      })),
      strengths: report.health.strengths.slice(0, 6).map((value) =>
        compactText(value, 150),
      ),
      weaknesses: report.health.weaknesses.slice(0, 6).map((value) =>
        compactText(value, 150),
      ),
      clarificationQuestions: report.health.clarificationQuestions
        .slice(0, 12)
        .map((value) => compactText(value, 170)),
      evaluatorFocusAreas: report.health.evaluatorFocusAreas.slice(0, 12),
    },
    nextAction: compactText(report.nextAction, 150),
  };
}

export function compactVendorResponseParseReportsForRoute(
  reports: VendorResponseParseReport[],
): VendorResponseParseReport[] {
  return reports.map(compactVendorResponseParseReportForRoute);
}

function buildCitations(
  input: VendorResponseParseInput,
  documents: VendorResponseDocumentInput[],
): VendorResponseCitation[] {
  const citations: VendorResponseCitation[] = [];
  for (const document of documents) {
    const paragraphs = document.text
      .split(/\n{2,}|\r?\n(?=[A-Z][A-Za-z /-]{3,}:)/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    paragraphs.forEach((paragraph, index) => {
      const section = resolveSection(paragraph);
      if (!section) return;
      const excerpt = collapseWhitespace(paragraph).slice(0, 260);
      citations.push({
        citationId: [
          "vresp",
          simplify(input.sourceEventId).slice(0, 10),
          simplify(input.vendorName).slice(0, 10),
          simplify(document.fileName).slice(0, 12),
          String(index + 1).padStart(2, "0"),
        ].join(":"),
        sourceEventId: input.sourceEventId,
        tenantKey: input.tenantKey,
        vendorName: input.vendorName,
        responseVersion: input.responseVersion,
        fileName: document.fileName,
        role: document.role,
        section: section.section,
        locator: `${document.fileName} paragraph ${index + 1}`,
        excerpt,
      });
    });
  }
  return dedupeCitations(citations);
}

function buildSectionFinding(
  requiredSection: string,
  citations: VendorResponseCitation[],
): VendorResponseSectionFinding {
  const rule = findRule(requiredSection);
  const sectionCitations = citations.filter(
    (citation) => findRule(citation.section).category === rule.category,
  );
  if (sectionCitations.length === 0) {
    return {
      section: requiredSection,
      normalizedCategory: rule.category,
      status: "missing",
      summary: "No substantive response found in the uploaded vendor package.",
      citationIds: [],
      missingReason: `${requiredSection} is required before scoring.`,
      evaluatorHoldback: rule.holdback,
    };
  }
  const joined = sectionCitations.map((citation) => citation.excerpt).join(" ");
  const weak = rule.weakSignals.some((pattern) => pattern.test(joined));
  return {
    section: requiredSection,
    normalizedCategory: rule.category,
    status: weak ? "weak" : "answered",
    summary: sectionCitations[0].excerpt,
    citationIds: sectionCitations.map((citation) => citation.citationId),
    missingReason: null,
    evaluatorHoldback: weak ? rule.holdback : null,
  };
}

function buildFileRoleReadiness(
  documents: VendorResponseDocumentInput[],
  citations: VendorResponseCitation[],
): VendorResponseFileRoleReadiness[] {
  return REQUIRED_FILE_ROLES.map((requiredRole) => {
    const roleDocs = documents.filter(
      (document) => document.role === requiredRole.role,
    );
    const roleCitations = citations.filter(
      (citation) => citation.role === requiredRole.role,
    );
    const uploaded = roleDocs.length > 0;
    const parsed = roleCitations.length > 0;
    return {
      role: requiredRole.role,
      label: requiredRole.label,
      required: requiredRole.required,
      uploaded,
      parsed,
      citationCount: roleCitations.length,
      nextAction:
        requiredRole.required && !uploaded
          ? `Upload ${requiredRole.label.toLowerCase()}.`
          : uploaded && !parsed
            ? `Review parser output for ${requiredRole.label.toLowerCase()}.`
            : requiredRole.required
              ? "Ready for scoring evidence."
              : "Use only if it strengthens leverage or proof.",
    };
  });
}

function buildMissingInputs(
  sectionFindings: VendorResponseSectionFinding[],
  fileRoleReadiness: VendorResponseFileRoleReadiness[],
): VendorResponseMissingInput[] {
  const missing: VendorResponseMissingInput[] = [];
  for (const file of fileRoleReadiness) {
    if (file.required && !file.uploaded) {
      missing.push({
        missingId: `file-${file.role}`,
        severity: "blocker",
        ownerRole:
          file.role === "pricing_workbook"
            ? "Commercial lead"
            : "Vendor response lead",
        request: file.nextAction,
        scoringImpact: `${file.label} is required before evaluation scoring can start.`,
      });
    }
  }
  for (const finding of sectionFindings) {
    if (finding.status === "missing") {
      missing.push({
        missingId: `section-${simplify(finding.section)}`,
        severity: "blocker",
        ownerRole: ownerFor(finding.normalizedCategory),
        request: `Ask vendor to answer ${finding.section}.`,
        scoringImpact: finding.evaluatorHoldback ?? "Missing required section.",
      });
    } else if (finding.status === "weak") {
      missing.push({
        missingId: `holdback-${simplify(finding.section)}`,
        severity: "holdback",
        ownerRole: ownerFor(finding.normalizedCategory),
        request: `Clarify weak evidence for ${finding.section}.`,
        scoringImpact: finding.evaluatorHoldback ?? "Weak evidence holdback.",
      });
    }
  }
  return missing;
}

function buildNarrativeFindings(
  sectionFindings: VendorResponseSectionFinding[],
): HealthFinding[] {
  return sectionFindings
    .filter((finding) => finding.status === "weak")
    .map((finding) => ({
      dimension: dimensionFor(finding.normalizedCategory),
      severity: "amber",
      finding: `${finding.section} has weak or non-comparable evidence.`,
      evidenceReference: finding.citationIds[0] ?? null,
      clarificationQuestion: `Clarify ${finding.section} in the requested comparable format.`,
    }));
}

function toNormalizationRow(
  input: VendorResponseParseInput,
  finding: VendorResponseSectionFinding,
  citations: VendorResponseCitation[],
): ProposalNormalizationRow {
  const citation = citations.find((candidate) =>
    finding.citationIds.includes(candidate.citationId),
  );
  return {
    sourceEventId: input.sourceEventId,
    vendorName: input.vendorName,
    responseVersion: input.responseVersion,
    rfpSection: finding.section,
    normalizedCategory: finding.normalizedCategory,
    vendorResponseSummary: finding.status === "missing" ? "" : finding.summary,
    evidenceReference: citation?.citationId ?? null,
    normalizedAnswer:
      finding.status === "missing" || finding.status === "weak"
        ? null
        : finding.summary,
    confidence: finding.status === "answered" ? "medium" : "low",
    completeness:
      finding.status === "answered"
        ? "complete"
        : finding.status === "weak"
          ? "partial"
          : "missing",
    deviations:
      finding.status === "weak"
        ? [finding.evaluatorHoldback ?? "Weak evidence."]
        : finding.status === "missing"
          ? [finding.missingReason ?? "Missing response."]
          : [],
    assumptions:
      finding.normalizedCategory === "assumptions_dependencies" &&
      finding.status !== "missing"
        ? [finding.summary]
        : [],
    evaluatorNotes: finding.evaluatorHoldback,
  };
}

function resolveParseStatus(
  isolationViolationCount: number,
  sectionFindings: VendorResponseSectionFinding[],
  fileRoleReadiness: VendorResponseFileRoleReadiness[],
): VendorResponseParseStatus {
  if (isolationViolationCount > 0) return "isolation_blocked";
  const requiredMissing = fileRoleReadiness.some(
    (file) => file.required && !file.uploaded,
  );
  const hasCitations = sectionFindings.some(
    (finding) => finding.citationIds.length > 0,
  );
  const hasGaps =
    requiredMissing ||
    sectionFindings.some((finding) => finding.status !== "answered");
  if (!hasCitations) return "not_parseable";
  return hasGaps ? "parsed_with_gaps" : "parsed";
}

function nextActionFor(
  status: VendorResponseParseStatus,
  missingInputs: VendorResponseMissingInput[],
): string {
  if (status === "isolation_blocked") {
    return "Remove rival-vendor documents before any scoring or insight generation.";
  }
  const blocker = missingInputs.find(
    (missing) => missing.severity === "blocker",
  );
  if (blocker) return blocker.request;
  const holdback = missingInputs.find(
    (missing) => missing.severity === "holdback",
  );
  if (holdback) return holdback.request;
  if (status === "not_parseable") {
    return "Upload a parseable main proposal and pricing workbook.";
  }
  return "Use parsed citations for scoring, BAFO, and approval evidence.";
}

function resolveSection(text: string): SectionRule | null {
  return (
    SECTION_RULES.find((rule) =>
      rule.aliases.some((pattern) => pattern.test(text)),
    ) ?? null
  );
}

function findRule(section: string): SectionRule {
  return (
    SECTION_RULES.find(
      (rule) =>
        simplify(rule.section) === simplify(section) ||
        rule.aliases.some((pattern) => pattern.test(section)),
    ) ?? {
      section,
      category: "risk_positions",
      aliases: [new RegExp(escapeRegExp(section), "i")],
      weakSignals: [
        /evidence unavailable/i,
        /not specified/i,
        /confirmation pending/i,
      ],
      holdback: `Do not score ${section} until evidence is cited.`,
    }
  );
}

function dimensionFor(
  category: NormalizedCategory,
): HealthFinding["dimension"] {
  if (category === "pricing_structure" || category === "commercial_model") {
    return "pricing";
  }
  if (category === "sla_commitments") return "sla";
  if (category === "transition_approach") return "transition";
  if (category === "staffing_model") return "staffing";
  if (category === "security_compliance") return "security_compliance";
  if (category === "solution_architecture") return "delivery_model";
  if (category === "automation_productivity") return "automation_claims";
  if (category === "scope_coverage") return "completeness";
  return "answer_quality";
}

function ownerFor(category: NormalizedCategory): string {
  if (category === "pricing_structure" || category === "commercial_model") {
    return "Commercial lead";
  }
  if (category === "sla_commitments") return "Service owner";
  if (category === "transition_approach") return "Transition lead";
  if (category === "staffing_model") return "Delivery lead";
  if (category === "security_compliance") return "Risk/security owner";
  if (category === "solution_architecture") return "Architecture owner";
  return "Vendor response lead";
}

function dedupeCitations(
  citations: VendorResponseCitation[],
): VendorResponseCitation[] {
  const seen = new Set<string>();
  return citations.filter((citation) => {
    const key = [
      citation.fileName,
      citation.role,
      citation.section,
      citation.excerpt,
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function compactNullableText(
  value: string | null,
  maxLength: number,
): string | null {
  return value === null ? null : compactText(value, maxLength);
}

function compactText(value: string, maxLength: number): string {
  const collapsed = collapseWhitespace(value);
  if (collapsed.length <= maxLength) return collapsed;
  return `${collapsed.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function simplify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

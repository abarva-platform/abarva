import {
  SOURCE_ARTIFACT_SPECS,
  type SourceArtifactSpec,
} from "./canonical-specs/artifact-specs";
import { SOURCE_STAGE_LABELS } from "./constants";
import type {
  SourceArtifactFamily,
  SourceArtifactFormat,
} from "./artifact-registry/types";
import type { SourceStageKey } from "./types";

export type SourceArtifactOperationStatus = "wired" | "partial" | "planned";

export interface SourceArtifactOperation {
  artifactCode: string;
  artifactName: string;
  stage: SourceStageKey;
  stageLabel: string;
  requirementLevel: SourceArtifactSpec["requirementLevel"];
  gateDefining: boolean;
  documentType: string;
  sourceOfRecord: string;
  intakePath: string;
  acceptedFormats: SourceArtifactFormat[];
  parseAndStore: string;
  agentUse: string;
  contentStandard: string;
  responsibleAiControl: string;
  currentCapability: string;
  nextGap: string;
  bestInClassOutcome: string;
  goldStandard: SourceArtifactGoldStandard;
  status: SourceArtifactOperationStatus;
}

export interface SourceArtifactGoldStandard {
  purpose: string;
  outcome: string;
  tableOfContents: string[];
  evidenceInputs: string[];
  bestInClassExpectations: string[];
  approvalOwner: string;
  supportedUploads: SourceArtifactFormat[];
  supportedDownloads: SourceArtifactFormat[];
  dataBindingChecks: string[];
}

type FamilyOperationDefaults = Pick<
  SourceArtifactOperation,
  | "documentType"
  | "sourceOfRecord"
  | "intakePath"
  | "acceptedFormats"
  | "parseAndStore"
  | "agentUse"
  | "currentCapability"
  | "nextGap"
  | "bestInClassOutcome"
  | "status"
>;

type ArtifactOperationOverride = Partial<
  FamilyOperationDefaults &
    Pick<SourceArtifactOperation, "contentStandard" | "responsibleAiControl">
>;

type ArtifactGoldStandardOverride = Partial<
  Omit<SourceArtifactGoldStandard, "supportedUploads" | "supportedDownloads"> & {
    supportedDownloads: SourceArtifactFormat[];
  }
>;

const UPLOAD_REGISTRY =
  "Generic Source upload stores the file in private object storage, writes a tenant-scoped registry row, hashes the file, applies sensitive-upload checks, and sets parse/evidence states.";

const DOCUMENT_FORMATS: SourceArtifactFormat[] = [
  "pdf",
  "docx",
  "pptx",
  "markdown",
  "txt",
];
const STRUCTURED_FORMATS: SourceArtifactFormat[] = [
  "xlsx",
  "csv",
  "pdf",
  "docx",
];
const EVIDENCE_FORMATS: SourceArtifactFormat[] = [
  "pdf",
  "docx",
  "xlsx",
  "csv",
  "pptx",
  "txt",
];

const DEFAULT_CONTENT_STANDARD =
  "Generic Source rubric: executive answer, evidence basis, analysis, expert challenge, next actions, decision summary, evidence table, risk/tradeoff view, named client decision owner, and AI-assisted attestation.";

const DEFAULT_RAI_CONTROL =
  "AI drafts are decision support only. Generated bodies carry model/prompt/upstream metadata and cannot be approved or locked until a human edits or reviews the artifact; stage movement still requires Source approval rights.";

const FAMILY_DEFAULTS: Record<SourceArtifactFamily, FamilyOperationDefaults> = {
  sourcing_strategy: {
    documentType: "Executive memo / decision record",
    sourceOfRecord:
      "Source event intake, sponsor notes, current contracts, and Maestro-entered strategy context.",
    intakePath:
      "Maestro starts the event in /source/new, then uploads supporting notes or generates the memo from bound event context.",
    acceptedFormats: DOCUMENT_FORMATS,
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Sentinel uses the strategy memo as upstream context for scope and RFP drafting; missing strategy blocks downstream generation.",
    currentCapability:
      "Partial: event intake, generic upload, body save, and selected Sentinel drafting are wired.",
    nextGap:
      "Add review/approval workflow and richer strategy evidence checklist.",
    bestInClassOutcome:
      "A sponsor-approved sourcing thesis with trigger, owner, scope headline, value range, and explicit proceed/hold posture.",
    status: "partial",
  },
  minimum_data_request: {
    documentType: "Structured inventory / evidence extract",
    sourceOfRecord:
      "Client CMDB, ITSM, application portfolio, ticket history, or Admin/Data Loads substrate.",
    intakePath:
      "Maestro uploads files today; future path should import from Admin/Data Loads or a connector-backed client substrate.",
    acceptedFormats: STRUCTURED_FORMATS,
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Sentinel treats loaded inventories as sizing evidence and cites them when drafting scope, SLA expectations, and pricing assumptions.",
    currentCapability:
      "Partial: uploads can be registered; full structured parsing is artifact-specific and not universal.",
    nextGap:
      "Add dedicated inventory/ticket parsers and field-level completeness checks.",
    bestInClassOutcome:
      "Clean, owner-tagged operational evidence with freshness, confidence, and completeness scores.",
    status: "partial",
  },
  scope_document: {
    documentType: "Scope memo / boundary register",
    sourceOfRecord:
      "Maestro scope workshops, sponsor decisions, application inventory, and exclusion decisions.",
    intakePath:
      "Generate from strategy plus uploaded inventory, or upload an authored client scope document.",
    acceptedFormats: DOCUMENT_FORMATS,
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Sentinel uses locked scope to constrain RFP, response completeness, pricing normalization, and decision narratives.",
    currentCapability:
      "Partial: d05 generation is wired; upload/body/status APIs exist.",
    nextGap: "Add explicit scope signoff and exclusion approval flow.",
    bestInClassOutcome:
      "Every vendor prices against the same in-scope, out-of-scope, assumptions, and exclusions.",
    status: "partial",
  },
  workshop_output: {
    documentType: "Workshop output / risk note",
    sourceOfRecord:
      "Client workshop notes, pre-mortem sessions, and Maestro facilitation notes.",
    intakePath:
      "Manual upload or note capture; later should support meeting transcript ingestion.",
    acceptedFormats: DOCUMENT_FORMATS,
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Sentinel uses risk notes as caution context and surfaces unresolved risks in decision and gate reviews.",
    currentCapability:
      "Partial: generic upload exists; no dedicated workshop capture UI.",
    nextGap:
      "Add structured workshop capture templates and participant signoff.",
    bestInClassOutcome:
      "Top risks are named before the RFP, assigned, and tied to mitigations.",
    status: "partial",
  },
  rfp: {
    documentType: "Vendor-facing RFP package",
    sourceOfRecord:
      "AbarVa Source draft, client procurement system, or final issued RFP.",
    intakePath:
      "Sentinel can generate the RFP from approved upstream strategy/scope; Maestro can also upload the official issued RFP.",
    acceptedFormats: DOCUMENT_FORMATS,
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Sentinel anchors response checking, vendor Q&A, scoring, and pricing comparisons to the issued RFP terms.",
    currentCapability:
      "Partial: d09 generation and rendering are wired; procurement-system issue tracking is not.",
    nextGap:
      "Add issued-to-vendors record, addendum history, and procurement-system reference fields.",
    bestInClassOutcome:
      "A final RFP that is vendor-ready, versioned, comparable, and traceable to scope and scorecard criteria.",
    status: "partial",
  },
  rfi: {
    documentType: "Market scan / shortlist record",
    sourceOfRecord:
      "Market research, procurement shortlist, RFI responses, and vendor qualification notes.",
    intakePath:
      "Manual upload or generated shortlist notes today; future connector/import should ingest procurement shortlist data.",
    acceptedFormats: DOCUMENT_FORMATS,
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Sentinel uses it to explain why vendors were invited or excluded.",
    currentCapability:
      "Partial: generic upload and seeded views exist; dedicated shortlist workflow is light.",
    nextGap:
      "Add vendor qualification checklist, conflicts, and disqualification approvals.",
    bestInClassOutcome:
      "A defensible vendor pool with inclusion/exclusion criteria and sponsor/procurement signoff.",
    status: "partial",
  },
  response_checklist: {
    documentType: "Checklist / completeness report",
    sourceOfRecord:
      "RFP response requirements, uploaded vendor responses, and parser output.",
    intakePath:
      "Checklist can be generated/rendered; vendor response completeness should be built from imported response packets.",
    acceptedFormats: STRUCTURED_FORMATS,
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Sentinel uses checklist gaps to block premature evaluation and produce vendor follow-up actions.",
    currentCapability:
      "Partial: seeded completeness logic exists; full live response parsing is not complete.",
    nextGap:
      "Connect d13 uploads to d15 completeness and make gaps visible in the event log.",
    bestInClassOutcome:
      "Every response is complete, comparable, and exception-flagged before scoring.",
    status: "partial",
  },
  proposal: {
    documentType: "Vendor proposal / response pack",
    sourceOfRecord:
      "Client procurement system, vendor portal export, secure email, or manual Maestro upload.",
    intakePath:
      "Generic upload can store proposal files; a dedicated vendor-by-vendor response intake is still needed.",
    acceptedFormats: EVIDENCE_FORMATS,
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Sentinel should summarize only the current event/vendor response set, extract exceptions, and feed d15/d16.",
    currentCapability:
      "Partial: generic upload exists; dedicated d13 vendor-response pack workflow is not complete.",
    nextGap:
      "Build vendor response intake: vendor picker, bulk upload, parse status, section mapping, and completeness rollup.",
    bestInClassOutcome:
      "All received proposals are versioned, parsed, checked against the RFP, and ready for fair evaluation.",
    status: "partial",
  },
  vendor_qa: {
    documentType: "Q&A log / addendum register",
    sourceOfRecord:
      "Procurement Q&A channel, vendor portal export, email, or meeting notes.",
    intakePath:
      "Manual upload today; future path should support drafted outbound answers and imported portal Q&A.",
    acceptedFormats: ["xlsx", "csv", "docx", "pdf", "txt"],
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Sentinel uses official answers to keep response evaluation and vendor clarifications consistent.",
    currentCapability:
      "Planned: catalog and upload path exist, but no real Q&A operating UI.",
    nextGap:
      "Add Q&A capture, publish status, addendum versioning, and manual-send email drafts.",
    bestInClassOutcome:
      "Every bidder sees the same official answer; addenda are versioned and auditable.",
    status: "planned",
  },
  scorecard: {
    documentType: "Scorecard / evaluator rationale",
    sourceOfRecord:
      "Evaluation team scoring sessions and locked scorecard weights.",
    intakePath:
      "Generated/exported scorecard artifacts and manual uploads; future path should capture evaluator scoring inline.",
    acceptedFormats: ["xlsx", "csv", "docx", "pdf"],
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Steward and Sentinel use scores, weights, and evidence citations to govern evaluation and decision quality.",
    currentCapability:
      "Partial: scorecard surface and exports exist; full evaluator workflow and approval quorum remain incomplete.",
    nextGap:
      "Add evaluator assignment, rationale capture, dispute handling, and lock/approve state.",
    bestInClassOutcome:
      "Weights are locked before scoring; every score has rationale and cited evidence.",
    status: "partial",
  },
  pricing_workbook: {
    documentType: "Pricing workbook / commercial model",
    sourceOfRecord:
      "Vendor filled workbook, internal rate card, contract baseline, and pricing assumptions.",
    intakePath:
      "Dedicated d19 vendor-submission upload parses vendor pricing XLSX; generic upload covers supporting files.",
    acceptedFormats: ["xlsx", "csv", "pdf", "docx"],
    parseAndStore:
      "Dedicated d19 parser persists structured vendor submissions; raw uploads still use private object storage and registry rows.",
    agentUse:
      "Sentinel and Atlas use normalized pricing, assumptions, and trap logs for BAFO, decision brief, and value ledger.",
    currentCapability:
      "Wired for d19 pricing submissions and comparison; supporting trap/assumption workflows are partial.",
    nextGap:
      "Extend parser linkage to d20 trap log and d21 locked assumptions with approval state.",
    bestInClassOutcome:
      "Commercial comparison is apples-to-apples, assumption-locked, and CFO-readable.",
    status: "wired",
  },
  bafo: {
    documentType: "BAFO packet / round log",
    sourceOfRecord:
      "Finalist vendor BAFO responses, procurement negotiation notes, and pricing deltas.",
    intakePath:
      "Manual upload/generation today; future path should issue BAFO draft and import finalist responses by round.",
    acceptedFormats: EVIDENCE_FORMATS,
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Sentinel compares BAFO deltas against prior bids and feeds Atlas decision posture.",
    currentCapability:
      "Partial: artifacts exist; round-based BAFO response intake is not complete.",
    nextGap:
      "Add per-round finalist response upload, delta extraction, and acceptance tracking.",
    bestInClassOutcome:
      "Every final concession is traceable to value uplift, risk closure, or explicit tradeoff.",
    status: "partial",
  },
  decision_brief: {
    documentType: "Executive decision packet",
    sourceOfRecord:
      "Scorecard, pricing, risk attestation, BAFO round log, and approval record.",
    intakePath:
      "Generated or uploaded decision materials; approval/signoff should become a governed Source action.",
    acceptedFormats: DOCUMENT_FORMATS,
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Atlas/Sentinel synthesize recommendation, blockers, dissent, and confidence from cited upstream artifacts.",
    currentCapability:
      "Partial: decision exports exist; d24 generation coverage is not complete in the prompt registry.",
    nextGap:
      "Wire d24/d25/d26 generation and approval record as first-class workflow.",
    bestInClassOutcome:
      "CXO sees one recommendation, options, risks, value, dissent, and the exact approval ask.",
    status: "partial",
  },
  selection_memo: {
    documentType: "Selection memo / contract record",
    sourceOfRecord:
      "Executive approval, procurement award file, signed contract, and legal system.",
    intakePath:
      "Manual upload and export today; future path should ingest contract reference and award notices.",
    acceptedFormats: DOCUMENT_FORMATS,
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Sentinel uses selection and contract terms to seed transition gates and value tracking.",
    currentCapability:
      "Partial: artifacts exist; award/contract integration is not mature.",
    nextGap:
      "Add award notification draft, contract metadata capture, and legal/procurement handoff.",
    bestInClassOutcome:
      "Selected vendor, contract terms, runner-up rationale, and conditions are audit-ready.",
    status: "partial",
  },
  transition_risk_register: {
    documentType: "Transition plan / checkpoint evidence",
    sourceOfRecord:
      "Transition workplan, KT records, checkpoint meetings, vendor onboarding status.",
    intakePath:
      "Manual upload today; future path should import PMO plan/checkpoint evidence.",
    acceptedFormats: EVIDENCE_FORMATS,
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Sentinel watches transition risk and blocks value claims until checkpoint evidence exists.",
    currentCapability:
      "Planned: artifacts and generic upload exist, but transition execution workflow is light.",
    nextGap:
      "Add checkpoint state, KT acceptance, and cutover go/no-go logging.",
    bestInClassOutcome:
      "Mobilization has owners, milestones, evidence, and explicit go/no-go decisions.",
    status: "planned",
  },
  value_ledger: {
    documentType: "Value ledger / governance review",
    sourceOfRecord:
      "Baseline spend, awarded terms, finance attestation, SLA/performance evidence.",
    intakePath:
      "Value page reads Source value states; future path should connect contract and finance evidence automatically.",
    acceptedFormats: ["xlsx", "csv", "pdf", "docx"],
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Atlas uses value lines to distinguish projected, committed, measuring, and realized value.",
    currentCapability:
      "Partial: value page exists and slug resolution is fixed; finance-attested realization workflow is incomplete.",
    nextGap:
      "Add CFO attestation, measurement cadence, and renewal/SRM feedback loop.",
    bestInClassOutcome:
      "Value is not a slide claim; it is measured, evidenced, attested, and monitored.",
    status: "partial",
  },
  meeting_notes: {
    documentType: "Meeting notes",
    sourceOfRecord:
      "Workshops, vendor meetings, evaluation meetings, and procurement notes.",
    intakePath: "Manual upload or note capture.",
    acceptedFormats: ["docx", "pdf", "markdown", "txt", "audio"],
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Sentinel uses notes as low-authority context unless promoted to a governed artifact.",
    currentCapability: "Partial: generic upload exists.",
    nextGap: "Add note-to-decision promotion and attendee confirmation.",
    bestInClassOutcome:
      "Meeting facts are captured without becoming unapproved decisions.",
    status: "partial",
  },
  other: {
    documentType: "Supporting evidence",
    sourceOfRecord: "Client-provided supporting material.",
    intakePath: "Generic upload.",
    acceptedFormats: EVIDENCE_FORMATS,
    parseAndStore: UPLOAD_REGISTRY,
    agentUse:
      "Sentinel can cite only when parsed, approved, and tied to a stage or artifact.",
    currentCapability: "Partial: generic upload exists.",
    nextGap:
      "Classify into a canonical artifact or keep as supporting evidence with lower confidence.",
    bestInClassOutcome:
      "No orphan files; every upload has owner, purpose, status, and evidence use.",
    status: "partial",
  },
};

const ARTIFACT_OVERRIDES: Record<string, ArtifactOperationOverride> = {
  d01_strategy_memo: {
    currentCapability:
      "Wired: Sentinel drafting, body persistence, generic upload, and downstream context binding exist.",
    nextGap:
      "Add formal sponsor approval and value/evidence checklist before stage advancement.",
    status: "wired",
  },
  d05_scope_memo: {
    currentCapability:
      "Wired: Sentinel drafting from d01 plus optional inventory/ticket context is implemented.",
    nextGap: "Add scope-owner approval and exclusion-log reconciliation.",
    status: "wired",
  },
  d09_rfp_pack: {
    contentStandard:
      "RFP table of contents: executive summary, sourcing background, in-scope services, service levels, required vendor capabilities, structured response-control mandate, pricing instructions, evaluation criteria/weights, timeline, and submission instructions.",
    responsibleAiControl:
      "AI can draft the RFP from approved upstream artifacts, but procurement/sponsor approval is required before the client issues it externally.",
    currentCapability:
      "Wired: Sentinel drafting from d01 and d05 is implemented; render/export routes exist.",
    nextGap: "Add issued-to-vendors tracking and addendum history.",
    status: "wired",
  },
  d11_response_checklist: {
    contentStandard:
      "Vendor Response Control Pack: one vendor response workbook with a guide tab, response-compliance mandate, vendor claim register, automation/productivity commitment table, pricing response tab, staffing and location model, SLA commitment table, assumptions/exclusions log, transition plan template, commercial exceptions table, and commercial leverage readiness matrix.",
    responsibleAiControl:
      "AI can draft the structured response-control pack, but procurement and legal approve the final vendor-facing templates before issue.",
  },
  d13_vendor_responses: {
    sourceOfRecord:
      "Existing procurement system or vendor portal remains the external source of record; AbarVa stores imported response snapshots for evaluation.",
    intakePath:
      "Generic upload can receive files today; dedicated vendor-by-vendor response intake is the next required build.",
    contentStandard:
      "Response-pack standard: vendor, version, received date, response sections, pricing attachment, assumptions, exclusions, exceptions, evidence links, and completeness status.",
    responsibleAiControl:
      "AI may summarize and map responses, but cannot treat a vendor submission as final unless the Maestro accepts the upload and resolves parse/completeness gaps.",
    currentCapability:
      "Partial: storage/registry exists, but there is no complete Maestro intake flow for all vendor responses.",
    nextGap:
      "Build vendor picker, bulk upload, response versioning, parse status, and mapping to required RFP sections.",
    status: "partial",
  },
  d14_qa_log: {
    sourceOfRecord:
      "Client procurement system, vendor portal Q&A, or controlled email thread; AbarVa should mirror the official Q&A.",
    contentStandard:
      "Q&A log table: question, vendor, official answer, answer owner, publish status, addendum version, date, and bidder visibility.",
    responsibleAiControl:
      "AI may draft answers, but a human must approve and send or publish through the client channel; AbarVa records the draft and approval, not autonomous transmission.",
    currentCapability:
      "Planned: artifact exists in catalog; no governed Q&A publish/addendum workflow yet.",
    nextGap:
      "Add question intake, answer drafting, official-answer approval, and manual-send/export support.",
    status: "planned",
  },
  d15_response_completeness: {
    contentStandard:
      "Completeness report: vendor, required sections, submitted sections, missing sections, criticality, parser confidence, procurement action, and evaluation readiness.",
    responsibleAiControl:
      "AI can produce the gap report, but the Maestro decides whether each response is evaluation-ready.",
    currentCapability:
      "Partial: seeded completeness model exists; live d13 response parsing does not yet drive this report.",
    nextGap:
      "Connect uploaded response sections to completeness rules and gate blockers.",
    status: "partial",
  },
  d16_scorecard: {
    contentStandard:
      "Scorecard standard: locked weights, criteria definitions, vendor scores, evaluator rationale, evidence citations, disputes, and final ranking.",
    responsibleAiControl:
      "AI can pre-fill comparisons and spot inconsistencies, but evaluators must provide scores/rationale and Steward must lock weights and approvals.",
    currentCapability:
      "Partial: scorecard surfaces and exports exist; evaluator-by-evaluator capture is incomplete.",
    nextGap:
      "Add scorer assignments, rationale capture, and lock/approve semantics.",
    status: "partial",
  },
  d19_pricing_workbook: {
    contentStandard:
      "Pricing standard: common units, term, transition/run costs, retained costs, assumptions, exclusions, low/base/high cases, and variance from baseline.",
    responsibleAiControl:
      "Server-side computation is authoritative; uploaded workbook formulas are not trusted. Finance or commercial owner approves assumptions before decision use.",
    status: "wired",
  },
  d20_trap_log: {
    contentStandard:
      "Trap-log table: trap, source artifact, severity, dollar exposure, affected vendor, resolution owner, status, and BAFO/contract implication.",
    currentCapability:
      "Partial: trap-log renderers exist; automatic trap extraction from pricing/proposals is not complete.",
    nextGap:
      "Populate traps from pricing submissions, assumptions, exclusions, and BAFO deltas.",
    status: "partial",
  },
  d21_assumption_set: {
    contentStandard:
      "Assumption set: horizon, FX, escalators, volumes, scope baseline, pricing units, excluded costs, owner, approved date, and version.",
    responsibleAiControl:
      "AI can suggest assumptions and detect inconsistency; sponsor/CFO lock remains a human action.",
    currentCapability:
      "Partial: assumption language exists in pricing flow; lock/approval state is not first-class.",
    nextGap: "Add sponsor/CFO assumption lock with version history.",
    status: "partial",
  },
  d24_decision_brief: {
    contentStandard:
      "Decision brief: answer first, finalist comparison, value/risk/transition tradeoff, evidence table, dissent, conditions, named approver, and explicit decision ask.",
    currentCapability:
      "Partial: CXO report and decision exports exist; per-artifact d24 generation is not in the generation registry yet.",
    nextGap:
      "Wire d24 prompt template to scorecard, pricing, risk, BAFO, and dissent context.",
    status: "partial",
  },
  d25_risk_attestation: {
    contentStandard:
      "Risk attestation table: risk category, vendor, severity, evidence, mitigation, accepted-by, residual risk, and decision impact.",
  },
  d26_steward_signoff: {
    contentStandard:
      "Signoff record: locked weights, completed required artifacts, evidence gaps, approver, date, conditions, and AI-use attestation.",
  },
  d32_value_ledger: {
    contentStandard:
      "Value ledger: baseline, committed value, measurement method, owner, evidence, cadence, realized value, re-baseline decision, and finance attestation.",
    responsibleAiControl:
      "AI can explain projected/committed value, but realized value requires client finance or value-office attestation.",
    currentCapability:
      "Partial: Source value page and value-state access exist; finance-attested value realization is not complete.",
    nextGap:
      "Tie awarded contract terms and realized performance evidence into value states.",
    status: "partial",
  },
};

export const SOURCE_ARTIFACT_OPERATION_VERSION =
  "source-artifact-operations/v1" as const;

const FAMILY_DOWNLOAD_DEFAULTS: Record<SourceArtifactFamily, SourceArtifactFormat[]> = {
  sourcing_strategy: ["html", "docx", "pdf"],
  minimum_data_request: ["xlsx", "docx"],
  scope_document: ["html", "docx", "pdf"],
  workshop_output: ["html", "docx"],
  rfp: ["html", "docx", "pdf"],
  rfi: ["html", "docx", "pdf"],
  response_checklist: ["xlsx", "docx"],
  proposal: ["html"],
  vendor_qa: ["xlsx", "docx"],
  scorecard: ["xlsx", "docx", "pdf"],
  pricing_workbook: ["xlsx", "docx", "pdf"],
  bafo: ["docx", "pdf"],
  decision_brief: ["html", "docx", "pdf"],
  selection_memo: ["html", "docx", "pdf"],
  transition_risk_register: ["docx", "pdf"],
  value_ledger: ["xlsx", "docx", "pdf"],
  meeting_notes: ["html", "docx"],
  other: ["html"],
};

const FAMILY_EVIDENCE_DEFAULTS: Record<SourceArtifactFamily, string[]> = {
  sourcing_strategy: [
    "Approved event intake",
    "Contract or spend baseline",
    "Named sponsor and decision owner",
  ],
  minimum_data_request: [
    "CMDB or application portfolio export",
    "ITSM ticket extract",
    "Data owner and freshness date",
  ],
  scope_document: [
    "Application inventory",
    "Support scope decisions",
    "Named exclusions and retained-client assumptions",
  ],
  workshop_output: [
    "Workshop attendee list",
    "Facilitator notes",
    "Owner-assigned risks or actions",
  ],
  rfp: [
    "Approved strategy memo",
    "Approved scope memo",
    "Evaluation rubric and procurement timeline",
  ],
  rfi: [
    "Market scan",
    "Vendor qualification evidence",
    "Inclusion and exclusion rationale",
  ],
  response_checklist: [
    "Issued RFP requirements",
    "Vendor response files",
    "Parser completeness output",
  ],
  proposal: [
    "Vendor response packet",
    "Received timestamp and version",
    "Procurement-system reference",
  ],
  vendor_qa: [
    "Vendor question source",
    "Official answer owner",
    "Published addendum or manual-send evidence",
  ],
  scorecard: [
    "Locked rubric weights",
    "Evaluator scores and rationale",
    "Proposal evidence citations",
  ],
  pricing_workbook: [
    "Vendor pricing workbook",
    "Baseline spend",
    "Locked commercial assumptions",
  ],
  bafo: [
    "Shortlisted vendor responses",
    "Pricing trap log",
    "Negotiation objectives and walk-away logic",
  ],
  decision_brief: [
    "Scorecard",
    "Pricing comparison",
    "Risk attestation and dissent record",
  ],
  selection_memo: [
    "Executive approval",
    "Award decision",
    "Contract or procurement award record",
  ],
  transition_risk_register: [
    "Signed contract terms",
    "Transition workplan",
    "Checkpoint and KT evidence",
  ],
  value_ledger: [
    "Baseline spend",
    "Committed savings or value lines",
    "Finance-attested measurement evidence",
  ],
  meeting_notes: [
    "Meeting transcript or notes",
    "Attendees",
    "Follow-up owner list",
  ],
  other: [
    "Uploader-provided source context",
    "Classification and owner",
    "Stage or artifact linkage",
  ],
};

const FAMILY_BEST_IN_CLASS_DEFAULTS: Record<SourceArtifactFamily, string[]> = {
  sourcing_strategy: [
    "Answers why now before describing process.",
    "States value at stake, decision owner, sourcing posture, and stop/go criteria.",
    "Separates client facts from AI suggestions and names the human approver.",
  ],
  minimum_data_request: [
    "Shows completeness, freshness, owner, and confidence for each data source.",
    "Flags missing or stale fields before downstream drafting relies on them.",
    "Makes scope and pricing implications explicit, not buried in raw extracts.",
  ],
  scope_document: [
    "Vendors can price the same boundary without interpretation.",
    "Retained-client work, exclusions, transition assumptions, and dependencies are explicit.",
    "Every scope choice ties back to evidence and owner approval.",
  ],
  workshop_output: [
    "Converts discussion into risks, decisions, owners, and dates.",
    "Keeps unapproved opinions separate from governed decisions.",
    "Highlights what would change the sourcing path.",
  ],
  rfp: [
    "Vendor-ready without hidden assumptions or ambiguous response instructions.",
    "Evaluation criteria and response requirements are visibly aligned.",
    "No external release until procurement and sponsor approval are recorded.",
  ],
  rfi: [
    "Explains why each vendor belongs or does not belong in the pool.",
    "Calls out market wrappers, concentration risk, and capability gaps.",
    "Gives the sponsor a defensible shortlist decision, not vendor boilerplate.",
  ],
  response_checklist: [
    "Prevents scoring incomplete or non-comparable responses.",
    "Maps each missing item to vendor, section, severity, owner, and action.",
    "Keeps parser confidence visible so humans decide ambiguous gaps.",
  ],
  proposal: [
    "Treats the procurement system as external source of record while preserving an evaluation snapshot.",
    "Versions every response and maps sections to the RFP checklist.",
    "Summaries cite uploaded response sections and never invent vendor commitments.",
  ],
  vendor_qa: [
    "Every bidder receives the same official answer.",
    "Draft answers are human-approved before publish or send.",
    "Addenda are versioned and auditable.",
  ],
  scorecard: [
    "Weights are locked before scoring starts.",
    "Every score has rationale, evidence citation, and evaluator attribution.",
    "Dissent and overrides are preserved instead of averaged away.",
  ],
  pricing_workbook: [
    "Normalizes units, assumptions, retained costs, transition cost, and risk reserves.",
    "Server-side calculations are authoritative over vendor workbook formulas.",
    "Finance can explain the answer in one page.",
  ],
  bafo: [
    "Each question targets a named value lever, risk closure, or trap.",
    "Round deltas show what changed versus prior proposal.",
    "Walk-away, give/get, and acceptance logic are explicit.",
  ],
  decision_brief: [
    "Recommendation leads; machinery and supporting analysis follow.",
    "Shows why the losing options lose, not just why the winner wins.",
    "Names conditions, risks, dissent, and approval ask.",
  ],
  selection_memo: [
    "Creates the auditable award record across procurement, legal, finance, and sponsor.",
    "Captures contract metadata and transition conditions.",
    "Makes external communications draft-only until client approval.",
  ],
  transition_risk_register: [
    "Turns selection into mobilization evidence: owners, milestones, checkpoints, and go/no-go decisions.",
    "Knowledge transfer is accepted by named receiving owners.",
    "Risks are tracked through hypercare, not dropped at signature.",
  ],
  value_ledger: [
    "Separates projected, committed, measuring, and realized value.",
    "Every realized claim has finance or value-office attestation.",
    "Re-baselines are explicit governance decisions.",
  ],
  meeting_notes: [
    "Summarizes facts, decisions, open questions, and owners.",
    "Does not promote notes into approved artifacts without human review.",
    "Links each action to a stage or artifact.",
  ],
  other: [
    "Classifies and links supporting material before it can influence AI answers.",
    "Keeps lower-confidence context visibly separate from approved evidence.",
    "Names owner, purpose, and allowed use.",
  ],
};

const ARTIFACT_GOLD_STANDARD_OVERRIDES: Record<string, ArtifactGoldStandardOverride> = {
  d01_strategy_memo: gold({
    tableOfContents: [
      "Executive sourcing answer",
      "Why now and trigger",
      "Scope headline and exclusions",
      "Value target and confidence band",
      "Archetype and rigor level",
      "Risks, assumptions, and next approval",
    ],
    approvalOwner: "Sponsor or CIO delegate",
  }),
  d02_value_target: gold({
    tableOfContents: [
      "Value answer",
      "Baseline and value pool",
      "Savings levers",
      "Confidence band",
      "Measurement owner",
      "Risks and assumptions",
    ],
    approvalOwner: "Finance or value-office owner",
  }),
  d03_archetype_decision: gold({
    tableOfContents: [
      "Archetype recommendation",
      "Deal characteristics",
      "Rigor level rationale",
      "Comparable precedent",
      "Risks of wrong archetype",
      "Approval note",
    ],
    approvalOwner: "Maestro and sponsor",
  }),
  d04_app_inv: gold({
    tableOfContents: [
      "Inventory completeness",
      "Applications and tiers",
      "Business ownership",
      "Lifecycle and dependencies",
      "Data freshness",
      "Open data gaps",
    ],
    approvalOwner: "Application portfolio or CMDB owner",
    supportedDownloads: ["xlsx", "docx", "pdf"],
  }),
  d05_scope_memo: gold({
    tableOfContents: [
      "Scope answer",
      "In-scope services",
      "Out-of-scope exclusions",
      "Retained-client responsibilities",
      "Transition assumptions",
      "Dependencies and approval",
    ],
    approvalOwner: "Scope owner and sponsor",
  }),
  d06_excl_log: gold({
    tableOfContents: [
      "Exclusion summary",
      "Excluded applications or services",
      "Reason for exclusion",
      "Decision owner",
      "Vendor instruction",
      "Revisit trigger",
    ],
    approvalOwner: "Scope owner",
  }),
  d07_ticket_synth: gold({
    tableOfContents: [
      "Ticket-volume answer",
      "Volume by service tier",
      "Seasonality and time-of-day",
      "Incident/problem split",
      "Sizing implications",
      "Data gaps",
    ],
    approvalOwner: "ITSM data owner",
    supportedDownloads: ["xlsx", "docx"],
  }),
  d08_premortem: gold({
    tableOfContents: [
      "Top failure modes",
      "Trigger or early warning",
      "Likely cause",
      "Mitigation owner",
      "Decision impact",
      "Follow-up cadence",
    ],
    approvalOwner: "Maestro",
  }),
  d09_rfp_pack: gold({
    tableOfContents: [
      "Executive summary",
      "Sourcing background",
      "In-scope services",
      "Service levels and operating model",
      "Response instructions",
      "Pricing instructions",
      "Evaluation criteria and timeline",
      "Submission controls",
    ],
    approvalOwner: "Procurement owner and sponsor",
  }),
  d10_rfi_summary: gold({
    tableOfContents: [
      "Market answer",
      "Vendor landscape",
      "RFI response themes",
      "Shortlist rationale",
      "Disqualified vendors",
      "Risks and next RFP path",
    ],
    approvalOwner: "Procurement owner",
  }),
  d11_response_checklist: gold({
    tableOfContents: [
      "Response compliance mandate",
      "Vendor Claim Register",
      "Automation / Productivity Commitment Table",
      "Pricing Response Tab",
      "Staffing and Location Model",
      "SLA Commitment Table",
      "Assumptions and Exclusions Log",
      "Transition Plan Template",
      "Commercial Exceptions Table",
      "Commercial leverage readiness matrix",
    ],
    approvalOwner: "Procurement owner",
    supportedDownloads: ["xlsx", "docx", "pdf"],
  }),
  d12_vendor_shortlist: gold({
    tableOfContents: [
      "Shortlist answer",
      "Invited vendors",
      "Fit rationale",
      "Exclusions",
      "Conflict or risk notes",
      "Sponsor approval",
    ],
    approvalOwner: "Sponsor and procurement owner",
  }),
  d13_vendor_responses: gold({
    tableOfContents: [
      "Response intake summary",
      "Vendor and version register",
      "Submitted artifacts",
      "Mapped response sections",
      "Exceptions and assumptions",
      "Parse/completeness status",
    ],
    approvalOwner: "Maestro or procurement owner",
    supportedDownloads: ["html"],
  }),
  d14_qa_log: gold({
    tableOfContents: [
      "Official Q&A register",
      "Vendor questions",
      "Draft answers",
      "Approved answers",
      "Addendum version",
      "Publish/send evidence",
    ],
    approvalOwner: "Procurement owner",
    supportedDownloads: ["xlsx", "docx"],
  }),
  d15_response_completeness: gold({
    tableOfContents: [
      "Readiness answer",
      "Vendor completeness matrix",
      "Critical missing items",
      "Parser confidence",
      "Action owner",
      "Evaluation go/no-go",
    ],
    approvalOwner: "Maestro",
    supportedDownloads: ["xlsx", "docx"],
  }),
  d16_scorecard: gold({
    tableOfContents: [
      "Evaluation answer",
      "Locked weights",
      "Vendor scores",
      "Evaluator rationale",
      "Evidence citations",
      "Dissent and final rank",
    ],
    approvalOwner: "Evaluation steward",
    supportedDownloads: ["xlsx", "docx", "pdf"],
  }),
  d17_weight_log: gold({
    tableOfContents: [
      "Weight-set answer",
      "Criteria definitions",
      "Version history",
      "Approver signatures",
      "Change rationale",
      "Lock status",
    ],
    approvalOwner: "Evaluation steward",
    supportedDownloads: ["xlsx", "docx"],
  }),
  d18_disqualification_log: gold({
    tableOfContents: [
      "Disqualification answer",
      "Vendor",
      "Threshold or failure reason",
      "Evidence",
      "Reviewer decision",
      "Appeal or revisit rule",
    ],
    approvalOwner: "Procurement owner and legal reviewer",
  }),
  d19_pricing_workbook: gold({
    tableOfContents: [
      "Commercial answer",
      "Baseline and vendor totals",
      "Normalized assumptions",
      "Transition and retained costs",
      "Scenario cases",
      "Finance approval",
    ],
    approvalOwner: "Finance/commercial owner",
    supportedDownloads: ["xlsx", "docx", "pdf"],
  }),
  d20_trap_log: gold({
    tableOfContents: [
      "Trap summary",
      "Trap register",
      "Dollar exposure",
      "Affected vendor",
      "BAFO or contract action",
      "Resolution status",
    ],
    approvalOwner: "Commercial owner",
  }),
  d21_assumption_set: gold({
    tableOfContents: [
      "Assumption answer",
      "Commercial horizon",
      "FX/escalators/volume",
      "Scope baseline",
      "Excluded costs",
      "Lock signature and version",
    ],
    approvalOwner: "Sponsor and finance owner",
  }),
  d22_bafo_question_pack: gold({
    tableOfContents: [
      "BAFO strategy",
      "Per-vendor questions",
      "Target concession",
      "Walk-away condition",
      "Risk closure",
      "Response due date",
    ],
    approvalOwner: "Sourcing lead",
    supportedDownloads: ["xlsx", "docx", "pdf"],
  }),
  d23_bafo_round_log: gold({
    tableOfContents: [
      "Round answer",
      "Vendor response deltas",
      "Commercial movement",
      "Risk movement",
      "Accepted concessions",
      "Next-round ask",
    ],
    approvalOwner: "Sourcing lead",
  }),
  d24_decision_brief: gold({
    tableOfContents: [
      "Recommendation",
      "Finalist comparison",
      "Value/risk/transition tradeoff",
      "Evidence table",
      "Dissent or conditions",
      "Explicit approval ask",
    ],
    approvalOwner: "Executive sponsor",
  }),
  d25_risk_attestation: gold({
    tableOfContents: [
      "Risk answer",
      "Risk register",
      "Mitigation plan",
      "Residual risk",
      "Accepted-by",
      "Decision impact",
    ],
    approvalOwner: "Risk owner and sponsor",
  }),
  d26_steward_signoff: gold({
    tableOfContents: [
      "Signoff answer",
      "Required artifacts complete",
      "Weights locked",
      "Evidence gaps",
      "AI-use attestation",
      "Approval conditions",
    ],
    approvalOwner: "Source steward",
  }),
  d27_selection_memo: gold({
    tableOfContents: [
      "Selection answer",
      "Award rationale",
      "Runner-up rationale",
      "Conditions to contract",
      "Transition next steps",
      "Sponsor signoff",
    ],
    approvalOwner: "Sponsor and procurement owner",
  }),
  d28_contract_record: gold({
    tableOfContents: [
      "Contract answer",
      "Signed contract reference",
      "Commercial terms snapshot",
      "Effective dates",
      "Critical obligations",
      "Owner and repository link",
    ],
    approvalOwner: "Legal/procurement owner",
  }),
  d29_transition_plan: gold({
    tableOfContents: [
      "Transition answer",
      "Milestones",
      "KT plan",
      "Parallel-run gates",
      "Owners",
      "Cutover/hypercare criteria",
    ],
    approvalOwner: "Transition owner",
  }),
  d30_checkpoint_log: gold({
    tableOfContents: [
      "Checkpoint summary",
      "Milestone status",
      "Go/no-go decision",
      "Deferred items",
      "Owner action",
      "Evidence link",
    ],
    approvalOwner: "Transition governance owner",
  }),
  d31_kt_evidence: gold({
    tableOfContents: [
      "KT acceptance answer",
      "Sessions held",
      "Attendees",
      "Materials transferred",
      "Receiving-team signoff",
      "Open KT gaps",
    ],
    approvalOwner: "Receiving team owner",
  }),
  d32_value_ledger: gold({
    tableOfContents: [
      "Value answer",
      "Baseline",
      "Committed value",
      "Measurement method",
      "Realized evidence",
      "Finance attestation",
    ],
    approvalOwner: "Finance/value-office owner",
    supportedDownloads: ["xlsx", "docx", "pdf"],
  }),
  d33_governance_review: gold({
    tableOfContents: [
      "Governance answer",
      "Quarterly value state",
      "Variance explanation",
      "Re-baseline decisions",
      "Owner actions",
      "Next review date",
    ],
    approvalOwner: "Value governance owner",
  }),
};

function operationForSpec(spec: SourceArtifactSpec): SourceArtifactOperation {
  const defaults = FAMILY_DEFAULTS[spec.family];
  const override = ARTIFACT_OVERRIDES[spec.code] ?? {};
  const operationCore = {
    artifactCode: spec.code,
    artifactName: spec.name,
    stage: spec.stage,
    stageLabel: SOURCE_STAGE_LABELS[spec.stage],
    requirementLevel: spec.requirementLevel,
    gateDefining: spec.gateDefining,
    contentStandard: DEFAULT_CONTENT_STANDARD,
    responsibleAiControl: DEFAULT_RAI_CONTROL,
    ...defaults,
    ...override,
  };

  return {
    ...operationCore,
    goldStandard: buildGoldStandard(spec, operationCore),
  };
}

function buildGoldStandard(
  spec: SourceArtifactSpec,
  operation: Omit<SourceArtifactOperation, "goldStandard">,
): SourceArtifactGoldStandard {
  const override = ARTIFACT_GOLD_STANDARD_OVERRIDES[spec.code] ?? {};
  return {
    purpose:
      override.purpose ??
      `${spec.name} turns ${SOURCE_STAGE_LABELS[spec.stage]} work into a governed decision artifact, not a loose document.`,
    outcome: override.outcome ?? operation.bestInClassOutcome,
    tableOfContents:
      override.tableOfContents ?? [
        "Executive answer",
        "Evidence basis",
        "Analysis",
        "Expert challenge",
        "Decision or action owner",
        "Approval and next step",
      ],
    evidenceInputs:
      override.evidenceInputs ?? FAMILY_EVIDENCE_DEFAULTS[spec.family],
    bestInClassExpectations:
      override.bestInClassExpectations ?? FAMILY_BEST_IN_CLASS_DEFAULTS[spec.family],
    approvalOwner: override.approvalOwner ?? "Named client owner",
    supportedUploads: operation.acceptedFormats,
    supportedDownloads:
      override.supportedDownloads ?? FAMILY_DOWNLOAD_DEFAULTS[spec.family],
    dataBindingChecks:
      override.dataBindingChecks ?? [
        "Tenant and event id are present on every upload, render, and export.",
        "Artifact code matches a canonical Source artifact specification.",
        "Parser, approval, and evidence states are visible before downstream use.",
        "Exports render from the bound event context rather than static template text.",
      ],
  };
}

function gold(input: ArtifactGoldStandardOverride): ArtifactGoldStandardOverride {
  return input;
}

export const SOURCE_ARTIFACT_OPERATIONS: readonly SourceArtifactOperation[] =
  SOURCE_ARTIFACT_SPECS.map(operationForSpec);

export function listSourceArtifactOperations(): SourceArtifactOperation[] {
  return [...SOURCE_ARTIFACT_OPERATIONS];
}

export function listSourceArtifactOperationsForStage(
  stage: SourceStageKey,
): SourceArtifactOperation[] {
  return SOURCE_ARTIFACT_OPERATIONS.filter(
    (operation) => operation.stage === stage,
  );
}

export function summarizeSourceArtifactOperations(
  operations: readonly SourceArtifactOperation[] = SOURCE_ARTIFACT_OPERATIONS,
) {
  return {
    version: SOURCE_ARTIFACT_OPERATION_VERSION,
    total: operations.length,
    wired: operations.filter((operation) => operation.status === "wired")
      .length,
    partial: operations.filter((operation) => operation.status === "partial")
      .length,
    planned: operations.filter((operation) => operation.status === "planned")
      .length,
    gateDefining: operations.filter((operation) => operation.gateDefining)
      .length,
  };
}

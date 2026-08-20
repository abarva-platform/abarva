// Document & Solution Design Standard — the cross-cutting presentation and
// design-depth contract that sits ABOVE the per-artifact contracts.
//
// Why this exists: presentation quality (executive opening, navigation, table
// craft, brand) and solution depth (real alternatives, layered architecture,
// end-to-end flows) were previously decided per artifact, so every artifact
// drifted independently and each fix had to be re-litigated one deliverable at
// a time. This module states the rule ONCE, per artifact type, so the prompt,
// the renderer, and the quality gate all read the same contract.
//
// The hierarchy this serves:
//   Executive Story -> Artifact -> Section -> Exhibit -> SVG -> Renderer
//
// Pure module: types, tables and predicates only. No I/O, no rendering.

import type { MovesDeliverableKey } from "@/lib/deliverables/profiles/types";

// ---------------------------------------------------------------------------
// Page estimation
// ---------------------------------------------------------------------------

/**
 * Words per page at board-grade-consulting density (11pt body; tables and
 * diagrams reduce prose density versus a plain memo). The same 450-500 band
 * `quality-bar-registry.ts` derives its word ranges from — stated once here so
 * page-based rules and word-based rules can never silently disagree.
 */
export const WORDS_PER_PAGE = 475;

/** Estimate page count from body word count. Never returns less than 1. */
export function estimatePages(bodyWordCount: number): number {
  if (!Number.isFinite(bodyWordCount) || bodyWordCount <= 0) return 1;
  return Math.max(1, Math.ceil(bodyWordCount / WORDS_PER_PAGE));
}

// ---------------------------------------------------------------------------
// Presentation contract
// ---------------------------------------------------------------------------

/**
 * How the document opens.
 * - `required` — a full executive opening answering the five questions below.
 * - `decision_summary_only` — a short decision box, not a full summary. Correct
 *   for concise commitment instruments where a summary would restate the whole
 *   document (e.g. a 2-3 page charter).
 * - `optional` — permitted but not gated.
 */
export type ExecutiveOpeningRequirement =
  | "required"
  | "decision_summary_only"
  | "optional";

/**
 * - `required` — always present.
 * - `auto` — present when `tableOfContentsRequired()` says so.
 * - `none` — never; the document is too short to navigate.
 */
export type TableOfContentsRule = "required" | "auto" | "none";

/**
 * Table rendering standard. `executive_light_grid` is the house default:
 * visible outer border, light interior horizontal rules, tinted semibold
 * header row, generous cell padding, right-aligned numerics, banding reserved
 * for long tables. Explicitly NOT a heavy Excel-style black grid.
 */
export type DocumentTableStyle = "executive_light_grid" | "plain" | "banded";

export interface PresentationContract {
  executiveOpening: ExecutiveOpeningRequirement;
  tableOfContents: TableOfContentsRule;
  /** Typical depth band in pages, used for the TOC auto-rule and as a drafting signal. */
  typicalPages: { min: number; max: number };
  /**
   * What this artifact is expected to show visually. Prose descriptions, not
   * exhibit ids — the visual contract (`visual-artifact-contract.ts`) owns the
   * enforceable exhibit list; this is the editorial intent behind it.
   */
  coreVisualExpectation: readonly string[];
  tableStyle: DocumentTableStyle;
  /**
   * Section and exhibit headings must state the conclusion, not the category.
   * "A shared Silver foundation lets clinical and plan use cases reuse governed
   * entities" — not "Target-State Architecture".
   */
  messageLedHeadings: boolean;
}

/**
 * The five questions an executive opening must answer. A summary that restates
 * the document's contents instead of answering these is a summary in name only.
 */
export const EXECUTIVE_OPENING_QUESTIONS = [
  "What is the answer?",
  "Why does it matter?",
  "What did we learn?",
  "What decision is required?",
  "What happens next?",
] as const;

/**
 * Auto-TOC rule. A table of contents is navigation, not decoration — it earns
 * its place only when the reader would otherwise have to scroll to find things.
 */
export function tableOfContentsRequired(input: {
  rule: TableOfContentsRule;
  estimatedPages: number;
  substantiveSectionCount: number;
  hasAppendices: boolean;
}): boolean {
  if (input.rule === "required") return true;
  if (input.rule === "none") return false;
  return (
    input.estimatedPages >= 8 ||
    input.substantiveSectionCount >= 7 ||
    input.hasAppendices
  );
}

// ---------------------------------------------------------------------------
// Solution depth contract
// ---------------------------------------------------------------------------

/**
 * - `required` — must be present.
 * - `required_when_dynamic` — required when the solution actually does something
 *   at runtime (scoring, retrieval, agentic action, scheduled processing). A
 *   static reporting deliverable has no runtime flow to draw, and inventing one
 *   is worse than omitting it.
 * - `triggered` — only when its preconditions are met (see
 *   `physicalArchitectureTriggered()`).
 * - `optional` — permitted, never gated.
 */
export type DesignArtifactRequirement =
  | "required"
  | "required_when_dynamic"
  | "triggered"
  | "optional";

export interface SolutionDepthContract {
  /** Real, credible alternatives must be weighed — not one path presented as inevitable. */
  approachesRequired: boolean;
  /** How many genuinely distinct approaches count as "real alternatives". */
  minimumCredibleApproaches: number;
  conceptualArchitecture: DesignArtifactRequirement;
  logicalArchitecture: DesignArtifactRequirement;
  physicalArchitecture: DesignArtifactRequirement;
  endToEndDataFlow: DesignArtifactRequirement;
  runtimeFlow: DesignArtifactRequirement;
  buildExtendReuse: DesignArtifactRequirement;
  decisionsAndOpenQuestions: DesignArtifactRequirement;
}

/**
 * Architecture maturity. Conceptual and logical views belong in the main
 * document; a physical view is an appendix concern and only legitimate once
 * enough real choices have been made to draw one honestly.
 */
export type ArchitectureMaturity = "conceptual" | "logical" | "physical";

/**
 * A physical architecture is only drawable when the decisions it depicts have
 * actually been taken. Drawing one earlier produces a diagram that looks
 * authoritative and is fiction.
 */
export function physicalArchitectureTriggered(input: {
  platformSelected: boolean;
  environmentTopologyDecided: boolean;
  integrationPatternsDecided: boolean;
}): boolean {
  return (
    input.platformSelected &&
    input.environmentTopologyDecided &&
    input.integrationPatternsDecided
  );
}

/**
 * Generic option labels are not alternatives. A comparison whose options differ
 * only by degree ("Basic / Intermediate / Advanced") has not made a choice —
 * it has deferred one.
 */
export const FORBIDDEN_GENERIC_APPROACH_LABELS: readonly RegExp[] = [
  /^\s*(option\s*\d+\s*[-–—:]?\s*)?(basic|standard|intermediate|advanced|minimal|full)\s*$/i,
  /^\s*(option|approach)\s*[ABC1-9]\s*$/i,
  /^\s*(small|medium|large)\s*$/i,
];

/** True when an approach label is a degree-of-effort placeholder rather than a real alternative. */
export function isGenericApproachLabel(label: string): boolean {
  return FORBIDDEN_GENERIC_APPROACH_LABELS.some((re) => re.test(label));
}

/**
 * The dimensions a solution-options comparison is expected to score. Named
 * here so every options table compares the same things and a reader can
 * compare two Moves' option tables to each other.
 */
export const SOLUTION_OPTION_DIMENSIONS = [
  "business fit",
  "data ownership",
  "reuse across portfolio",
  "time to value",
  "workflow integration",
  "security and control",
  "vendor dependency",
  "cost",
  "strategic flexibility",
] as const;

// ---------------------------------------------------------------------------
// Architecture flow semantics
// ---------------------------------------------------------------------------

/** How data moves along an edge. */
export const FLOW_PATTERNS = [
  "batch",
  "cdc",
  "streaming",
  "rest_api",
  "fhir",
  "file",
  "sql",
  "event",
] as const;
export type FlowPattern = (typeof FLOW_PATTERNS)[number];

/** Which way it moves, which is a different question from how. */
export const FLOW_DIRECTIONS = ["read", "write_back", "bidirectional"] as const;
export type FlowDirection = (typeof FLOW_DIRECTIONS)[number];

/**
 * The label used wherever a flow property is not yet established. Every
 * unknown renders as this — an architecture diagram may be incomplete, but it
 * may never be confidently wrong. In particular, a flow is never labelled
 * "streaming" or "real time" because that would read well.
 */
export const UNVALIDATED_FLOW_LABEL = "To validate";

export type FlowEdgeStatus = "validated" | "to_validate" | "assumed";

export interface ArchitectureFlowEdge {
  source: string;
  target: string;
  pattern?: FlowPattern;
  /** e.g. "daily", "hourly", "on commit". Omitted when unknown. */
  cadence?: string;
  /** e.g. "database_extract", "HL7v2", "S3 drop". Omitted when unknown. */
  protocol?: string;
  containsPHI?: boolean;
  direction?: FlowDirection;
  status: FlowEdgeStatus;
}

const FLOW_PATTERN_LABELS: Record<FlowPattern, string> = {
  batch: "Batch",
  cdc: "CDC",
  streaming: "Streaming",
  rest_api: "REST/API",
  fhir: "FHIR",
  file: "File",
  sql: "SQL",
  event: "Event",
};

/**
 * Render an edge's label from what is actually known. Unknown properties are
 * omitted rather than guessed, and an edge with nothing established renders as
 * `UNVALIDATED_FLOW_LABEL` rather than as a plausible-looking default.
 */
export function describeFlowEdge(edge: ArchitectureFlowEdge): string {
  const parts: string[] = [];
  if (edge.pattern) parts.push(FLOW_PATTERN_LABELS[edge.pattern]);
  if (edge.cadence) parts.push(edge.cadence);
  if (edge.protocol) parts.push(edge.protocol);
  if (edge.direction === "write_back") parts.push("write-back");
  if (edge.containsPHI) parts.push("PHI");
  if (parts.length === 0) return UNVALIDATED_FLOW_LABEL;
  const label = parts.join(" · ");
  return edge.status === "validated"
    ? label
    : `${label} (${UNVALIDATED_FLOW_LABEL.toLowerCase()})`;
}

// ---------------------------------------------------------------------------
// Tenant brand profile
// ---------------------------------------------------------------------------

/**
 * Brand-profile provenance, deliberately mirroring the rate-card approval
 * states. A palette taken from materials shared with us is a WORKING profile,
 * not a client's official brand standard, until the client supplies its brand
 * guide and someone authorised signs off. Labelling an unapproved palette as
 * the client's brand is the visual equivalent of quoting an unapproved rate.
 */
export type BrandProfileApproval =
  | "reference_unapproved"
  | "tenant_reviewed"
  | "tenant_approved"
  | "superseded";

export interface DocumentBrandPalette {
  primaryAccent: string;
  primaryText: string;
  secondaryText: string;
  background: string;
  surface: string;
  rule: string;
  /** Target/positive state in diagrams and status chips. */
  positive: string;
  /** Attention, dependency, or "to validate". */
  attention: string;
  /** Additional categorical accent for multi-series exhibits. */
  categorical: string;
}

export interface DocumentBrandProfile {
  tenantId: string;
  approval: BrandProfileApproval;
  /** Where the palette came from — a shared deck, a brand guide, a default. */
  sourceNote: string;
  palette: DocumentBrandPalette;
  logoAssetPath?: string;
  headingFontStack?: string;
  bodyFontStack?: string;
  tableStyle: DocumentTableStyle;
}

/**
 * The neutral house profile. Used whenever a tenant has no profile of its own.
 * Deliberately not any client's colours — a document rendered with this palette
 * is visibly AbarVa's, not a client impersonation.
 */
export const DEFAULT_BRAND_PROFILE: DocumentBrandProfile = {
  tenantId: "__default__",
  approval: "reference_unapproved",
  sourceNote:
    "AbarVa house palette. Not a client brand profile — replace with a " +
    "tenant profile before any client-facing use.",
  palette: {
    primaryAccent: "#1B2B5C",
    primaryText: "#1C1917",
    secondaryText: "#44403C",
    background: "#FFFFFF",
    surface: "#F5F5F4",
    rule: "#E7E5E4",
    positive: "#2E7565",
    attention: "#C97A0A",
    categorical: "#7A3B54",
  },
  tableStyle: "executive_light_grid",
};

/**
 * True when a profile may be used on a client-facing document. A working
 * palette is fine for internal drafts; it must not silently become the client's
 * brand on something that leaves the building.
 */
export function brandProfileIsClientFacing(
  profile: DocumentBrandProfile,
): boolean {
  return profile.approval === "tenant_approved";
}

/**
 * The disclosure line a document must carry when rendered with an unapproved
 * profile. Null when the profile is approved and no disclosure is owed.
 */
export function brandProfileDisclosure(
  profile: DocumentBrandProfile,
): string | null {
  switch (profile.approval) {
    case "tenant_approved":
      return null;
    case "tenant_reviewed":
      return "Presentation style reviewed with the client but not yet approved as their brand standard.";
    case "superseded":
      return "Rendered with a superseded presentation profile — refresh before reuse.";
    case "reference_unapproved":
    default:
      return "Working presentation style, not the client's approved brand standard.";
  }
}

// ---------------------------------------------------------------------------
// Per-artifact standard
// ---------------------------------------------------------------------------

export interface DocumentDesignContract {
  presentation: PresentationContract;
  /** Present only for artifacts that actually design a solution. */
  solutionDepth?: SolutionDepthContract;
}

const NO_ARCHITECTURE: SolutionDepthContract = {
  approachesRequired: false,
  minimumCredibleApproaches: 0,
  conceptualArchitecture: "optional",
  logicalArchitecture: "optional",
  physicalArchitecture: "optional",
  endToEndDataFlow: "optional",
  runtimeFlow: "optional",
  buildExtendReuse: "optional",
  decisionsAndOpenQuestions: "required",
};

/**
 * The cross-cutting standard, per Moves artifact. Artifacts absent from this
 * table fall back to `DEFAULT_DOCUMENT_DESIGN` — deliberately conservative, so
 * a new artifact type is never silently held to a weaker bar than its peers.
 */
export const DOCUMENT_DESIGN_STANDARD: Partial<
  Record<MovesDeliverableKey, DocumentDesignContract>
> = {
  charter: {
    presentation: {
      executiveOpening: "decision_summary_only",
      tableOfContents: "none",
      typicalPages: { min: 2, max: 3 },
      coreVisualExpectation: [
        "decision box",
        "scope boundary",
        "discovery preparation",
      ],
      tableStyle: "executive_light_grid",
      messageLedHeadings: true,
    },
  },

  discovery_report: {
    presentation: {
      executiveOpening: "required",
      tableOfContents: "auto",
      typicalPages: { min: 8, max: 15 },
      coreVisualExpectation: [
        "current-state process flow",
        "data and system landscape",
        "root-cause map",
        "metric baseline views",
      ],
      tableStyle: "executive_light_grid",
      messageLedHeadings: true,
    },
  },

  root_cause_worksheet: {
    presentation: {
      executiveOpening: "required",
      tableOfContents: "none",
      typicalPages: { min: 3, max: 7 },
      coreVisualExpectation: ["root-cause tree", "symptom-versus-cause table"],
      tableStyle: "executive_light_grid",
      messageLedHeadings: true,
    },
  },

  solution_approach_options: {
    presentation: {
      executiveOpening: "required",
      tableOfContents: "required",
      typicalPages: { min: 10, max: 18 },
      coreVisualExpectation: [
        "one architecture sketch per option",
        "tradeoff matrix across the standard dimensions",
        "decision view",
      ],
      tableStyle: "executive_light_grid",
      messageLedHeadings: true,
    },
    solutionDepth: {
      approachesRequired: true,
      minimumCredibleApproaches: 3,
      conceptualArchitecture: "required",
      logicalArchitecture: "optional",
      physicalArchitecture: "optional",
      endToEndDataFlow: "optional",
      runtimeFlow: "optional",
      buildExtendReuse: "required",
      decisionsAndOpenQuestions: "required",
    },
  },

  target_state_architecture: {
    presentation: {
      executiveOpening: "required",
      tableOfContents: "required",
      typicalPages: { min: 12, max: 25 },
      coreVisualExpectation: [
        "conceptual architecture",
        "logical architecture",
        "end-to-end data flow",
        "integration and activation view",
      ],
      tableStyle: "executive_light_grid",
      messageLedHeadings: true,
    },
    solutionDepth: {
      approachesRequired: true,
      minimumCredibleApproaches: 2,
      conceptualArchitecture: "required",
      logicalArchitecture: "required",
      physicalArchitecture: "triggered",
      endToEndDataFlow: "required",
      runtimeFlow: "required_when_dynamic",
      buildExtendReuse: "required",
      decisionsAndOpenQuestions: "required",
    },
  },

  solution_design: {
    presentation: {
      executiveOpening: "required",
      tableOfContents: "required",
      typicalPages: { min: 15, max: 30 },
      coreVisualExpectation: [
        "conceptual architecture",
        "logical solution architecture",
        "end-to-end data flow from sources through activation",
        "runtime/decision flow",
        "build/extend/reuse view",
      ],
      tableStyle: "executive_light_grid",
      messageLedHeadings: true,
    },
    solutionDepth: {
      approachesRequired: true,
      minimumCredibleApproaches: 2,
      conceptualArchitecture: "required",
      logicalArchitecture: "required",
      physicalArchitecture: "triggered",
      endToEndDataFlow: "required",
      runtimeFlow: "required_when_dynamic",
      buildExtendReuse: "required",
      decisionsAndOpenQuestions: "required",
    },
  },

  operating_model_design: {
    presentation: {
      executiveOpening: "required",
      tableOfContents: "auto",
      typicalPages: { min: 10, max: 18 },
      coreVisualExpectation: [
        "roles and decision rights",
        "operating flows",
        "accountability matrix",
      ],
      tableStyle: "executive_light_grid",
      messageLedHeadings: true,
    },
  },

  sourcing_strategy: {
    presentation: {
      executiveOpening: "required",
      tableOfContents: "auto",
      typicalPages: { min: 5, max: 8 },
      coreVisualExpectation: [
        "sourcing options comparison",
        "delivery-model view",
      ],
      tableStyle: "executive_light_grid",
      messageLedHeadings: true,
    },
    solutionDepth: {
      ...NO_ARCHITECTURE,
      approachesRequired: true,
      minimumCredibleApproaches: 3,
    },
  },

  business_case: {
    presentation: {
      executiveOpening: "required",
      tableOfContents: "required",
      typicalPages: { min: 8, max: 15 },
      coreVisualExpectation: [
        "board decision card and economics strip",
        "investment waterfall and cost stack",
        "gross-to-net value bridge",
        "sensitivity tornado and payback range",
        "phased roadmap with gates",
        "risk and control heatmap",
        "assumption ledger",
        "evidence and gap matrix",
      ],
      tableStyle: "executive_light_grid",
      messageLedHeadings: true,
    },
  },

  financial_model: {
    presentation: {
      executiveOpening: "required",
      tableOfContents: "auto",
      typicalPages: { min: 6, max: 14 },
      coreVisualExpectation: [
        "cost stack by category",
        "shared foundation versus incremental use-case split",
        "delivery-model scenario comparison",
        "three-year TCO profile",
        "estimate confidence view",
      ],
      tableStyle: "executive_light_grid",
      messageLedHeadings: true,
    },
  },

  execution_roadmap: {
    presentation: {
      executiveOpening: "required",
      tableOfContents: "auto",
      typicalPages: { min: 6, max: 12 },
      coreVisualExpectation: [
        "executive roadmap swimlane",
        "decision gates",
        "dependencies",
        "value milestones",
      ],
      tableStyle: "executive_light_grid",
      messageLedHeadings: true,
    },
  },

  tower_metrics_plan: {
    presentation: {
      executiveOpening: "required",
      tableOfContents: "auto",
      typicalPages: { min: 5, max: 10 },
      coreVisualExpectation: [
        "metric tree",
        "baseline and target table",
        "measurement cadence",
      ],
      tableStyle: "executive_light_grid",
      messageLedHeadings: true,
    },
  },

  handoff_package: {
    presentation: {
      executiveOpening: "required",
      tableOfContents: "auto",
      typicalPages: { min: 10, max: 22 },
      coreVisualExpectation: [
        "accountability transfer map",
        "open items and owners",
      ],
      tableStyle: "executive_light_grid",
      messageLedHeadings: true,
    },
  },

  value_measurement_contract: {
    presentation: {
      executiveOpening: "required",
      tableOfContents: "none",
      typicalPages: { min: 4, max: 9 },
      coreVisualExpectation: ["metric contract table", "Tower handoff view"],
      tableStyle: "executive_light_grid",
      messageLedHeadings: true,
    },
  },
};

/**
 * Conservative fallback for any artifact not in the table above. Requires an
 * executive opening and message-led headings, because those are cheap and
 * always correct; leaves navigation to the auto-rule.
 */
export const DEFAULT_DOCUMENT_DESIGN: DocumentDesignContract = {
  presentation: {
    executiveOpening: "required",
    tableOfContents: "auto",
    typicalPages: { min: 5, max: 12 },
    coreVisualExpectation: [],
    tableStyle: "executive_light_grid",
    messageLedHeadings: true,
  },
};

/** Resolve the design contract for an artifact, falling back to the default. */
export function documentDesignFor(
  artifact: MovesDeliverableKey,
): DocumentDesignContract {
  return DOCUMENT_DESIGN_STANDARD[artifact] ?? DEFAULT_DOCUMENT_DESIGN;
}

/** True when this artifact is expected to design a solution, not just describe one. */
export function requiresSolutionDepth(artifact: MovesDeliverableKey): boolean {
  return Boolean(documentDesignFor(artifact).solutionDepth);
}

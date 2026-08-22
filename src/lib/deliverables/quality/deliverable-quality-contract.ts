// Deliverable Quality Contract — the blocking gate before persistence (§0b)
//
// Evaluates a client-facing artifact AGAINST ITS PROFILE across the contract
// dimensions and returns a result state. This is NOT a word-count rule: depth is
// allowed when the artifact's purpose requires it (RFP, pricing, evaluation,
// transition, value). It rejects artifacts that are mechanical, generic,
// over-labeled, over-disclaimed, or visibly AI-generated.
//
// A deliverable that is not `client_ready` must NOT be persisted as client-ready;
// the persistence layer saves it as `internal_draft` with the failure reasons.

import type {
  DeliverableProfile,
  QualityDimensionId,
} from "@/lib/deliverables/profiles/types";
import { DEFAULT_QUALITY_RUBRIC } from "@/lib/deliverables/profiles/types";
import type { OutputFormat } from "@/lib/deliverables/orchestrator/types";
import {
  scanMachinery,
  detectFiller,
  checkOpenInputs,
  checkEvidencePlacement,
  checkVisualCompleteness,
  checkBusinessMode,
  type GateFinding,
  type GateInput,
} from "./transformation-gates";

export type DeliverableResultState =
  | "client_ready"
  | "internal_draft"
  | "blocked_missing_inputs"
  | "blocked_missing_exhibits"
  | "blocked_quality"
  | "blocked_governance"
  // Story-Led / Exhibit-Led Standard (v2 redo, §12)
  | "blocked_storyline"
  | "blocked_missing_current_state"
  | "blocked_missing_architecture_level"
  | "blocked_missing_visuals";

export interface ContractInput extends GateInput {
  /** The actual rendered output format (for format-fit). */
  outputFormat?: OutputFormat;
  /** Tenant-specific terms expected in a client-specific artifact. */
  tenantTerms?: ReadonlyArray<string>;
  /** Count of inline citation markers in the body (for evidence discipline). */
  citationCount?: number;
  /** Whether every required exhibit carries a so-what interpretation. */
  exhibitsInterpreted?: boolean;
  /** Whether egress/data governance (stage 3) passed. */
  governanceOk?: boolean;

  // ── Story-Led / Exhibit-Led signals (v2 redo) ──────────────────────────────
  /** A visible story spine is present (>= 3 beats connecting the arc). */
  hasStorySpine?: boolean;
  /** Current state is interpreted AND drawn as a visual (not just listed). */
  currentStateVisualPresent?: boolean;
  /** The current→gaps→target reasoning bridge is present. */
  gapToTargetBridgePresent?: boolean;
  /** Architecture levels actually rendered. */
  conceptualArchPresent?: boolean;
  logicalArchPresent?: boolean;
  physicalArchPresent?: boolean;
  /** Required exhibits rendered as real visuals (SVG/HTML diagrams), not prose. */
  exhibitsRenderedAsVisual?: boolean;
}

export interface QualityFinding extends GateFinding {
  dimension: QualityDimensionId | "governance";
}

export interface DeliverableQualityResult {
  state: DeliverableResultState;
  clientReady: boolean;
  findings: ReadonlyArray<QualityFinding>;
  businessCaseMode?: ReturnType<typeof checkBusinessMode>["mode"];
}

function isBinder(p: DeliverableProfile): boolean {
  return p.evidenceMode === "working_binder" || !p.clientFacing;
}

const DECISION_VERBS =
  /\b(recommend|approve|approval|decision|decide|proceed|hold|stop|fund|invest|select|award|endorse|choose|do not approve)\b/i;

/** format-fit — the rendered format must match the profile's allowed formats. */
function checkFormatFit(input: ContractInput): QualityFinding[] {
  if (!input.outputFormat) return [];
  const allowed = new Set<OutputFormat>([
    input.profile.defaultFormat,
    ...(input.profile.supportingFormats ?? []),
  ]);
  if (allowed.has(input.outputFormat)) return [];
  return [
    {
      gate: "machinery",
      dimension: "format_fit",
      severity: "block",
      message: `Rendered as ${input.outputFormat}, which is not a valid format for "${input.profile.title}".`,
    },
  ];
}

/** decision-clarity — a client artifact must make the decision unmistakable. */
function checkDecisionClarity(input: ContractInput): QualityFinding[] {
  if (isBinder(input.profile)) return [];
  const head = input.narrativeText.slice(0, 800);
  if (DECISION_VERBS.test(head)) return [];
  return [
    {
      gate: "filler",
      dimension: "decision_clarity",
      severity: "block",
      message:
        "No decision is stated up front. The artifact must make the decision requested unmistakable on the first page/screen.",
    },
  ];
}

/** client-specificity — the artifact must use tenant-specific language. */
function checkClientSpecificity(input: ContractInput): QualityFinding[] {
  if (isBinder(input.profile)) return [];
  const terms = input.tenantTerms ?? [];
  if (!terms.length) return []; // can't assess without expected terms
  const text = input.narrativeText.toLowerCase();
  const hit = terms.some((t) => text.includes(t.toLowerCase()));
  if (hit) return [];
  return [
    {
      gate: "filler",
      dimension: "client_specificity",
      severity: "block",
      message:
        "Reads as generic transformation/sourcing prose — none of the tenant's own context, systems, or business language appears.",
      detail: terms.slice(0, 6),
    },
  ];
}

/** so-what — every required exhibit must carry an interpretation. */
function checkSoWhat(input: ContractInput): QualityFinding[] {
  if (!input.profile.requiredExhibits.length) return [];
  if (input.exhibitsInterpreted === false) {
    return [
      {
        gate: "visual_complete",
        dimension: "so_what_quality",
        severity: "block",
        message:
          "An exhibit renders without an interpretation. Every major table/exhibit must say what it means for the client's decision.",
      },
    ];
  }
  return [];
}

/** evidence-discipline — evidence supports, doesn't dominate. */
function checkEvidenceDiscipline(input: ContractInput): QualityFinding[] {
  if (isBinder(input.profile)) return [];
  const words = input.narrativeText.split(/\s+/).length || 1;
  const cites = input.citationCount ?? 0;
  // More than ~1 inline citation per 25 words reads as an evidence binder.
  if (cites / words > 0.04 && cites > 12) {
    return [
      {
        gate: "evidence_place",
        dimension: "evidence_discipline",
        severity: "warn",
        message:
          "Citation density is high — evidence is dominating the narrative. Move detail to the appendix and let judgment lead.",
      },
    ];
  }
  return [];
}

// ── Story-Led / Exhibit-Led checks (v2 redo, §12) ────────────────────────────

/** Story spine — enforced once a profile adopts a storyArc. */
function checkStorySpine(input: ContractInput): QualityFinding[] {
  if (!input.profile.storyArc?.length) return [];
  if (input.hasStorySpine === true) return [];
  return [
    {
      gate: "filler",
      dimension: "story_spine",
      severity: "block",
      message:
        "No visible story spine. The artifact must connect current state → gaps → target → solution → value → decision as a coherent narrative.",
    },
  ];
}

/** Current state must be DRAWN (visual), not just described. */
function checkCurrentStateReasoning(input: ContractInput): QualityFinding[] {
  if (!input.profile.currentStateRequired) return [];
  if (input.currentStateVisualPresent === true) return [];
  return [
    {
      gate: "visual_complete",
      dimension: "current_state_reasoning",
      severity: "block",
      message:
        "Current state is not drawn. Actors, systems, flows, handoffs, bottlenecks, and value-leakage must be shown visually — not only described.",
    },
  ];
}

/** The current→gaps→design-implication→target reasoning bridge. */
function checkGapToTarget(input: ContractInput): QualityFinding[] {
  if (!input.profile.gapAnalysisRequired) return [];
  if (input.gapToTargetBridgePresent === true) return [];
  return [
    {
      gate: "filler",
      dimension: "gap_to_target_reasoning",
      severity: "block",
      message:
        "Missing the current→gaps→design-implication→target chain. The artifact jumps to target state without reasoning from the evidence.",
    },
  ];
}

/** Conceptual + logical + physical architecture levels must all render. */
function checkArchitectureLevels(input: ContractInput): QualityFinding[] {
  const p = input.profile;
  const out: QualityFinding[] = [];
  const miss = (level: string): QualityFinding => ({
    gate: "visual_complete",
    dimension: "architecture_completeness",
    severity: "block",
    message: `Missing ${level} architecture level — not client-ready without it.`,
  });
  if (p.conceptualArchitectureRequired && input.conceptualArchPresent !== true)
    out.push(miss("conceptual"));
  if (p.logicalArchitectureRequired && input.logicalArchPresent !== true)
    out.push(miss("logical"));
  if (p.physicalArchitectureRequired && input.physicalArchPresent !== true)
    out.push(miss("physical"));
  return out;
}

/** Required exhibits must render as real visuals (SVG/HTML), not prose. */
function checkVisualExhibits(input: ContractInput): QualityFinding[] {
  const requiresRenderedVisuals =
    input.profile.visualRendererRequired ||
    (!isBinder(input.profile) &&
      Boolean(input.profile.visualStandard?.requiredVisuals.length));
  if (!requiresRenderedVisuals) return [];
  if (input.exhibitsRenderedAsVisual === true) return [];
  const required = input.profile.visualStandard?.requiredVisuals.slice(0, 8);
  return [
    {
      gate: "visual_complete",
      dimension: "visual_exhibit_quality",
      severity: "block",
      message:
        "Required exhibits did not render as visuals (prose-only). Published executive artifacts must show diagrams, charts, tables, scorecards, heatmaps, or roadmaps in the final output.",
      ...(required?.length ? { detail: required } : {}),
    },
  ];
}

/** Resolve the result state from the findings (most specific reason wins). */
export function resolveResultState(
  findings: ReadonlyArray<QualityFinding>,
  governanceOk: boolean | undefined,
): DeliverableResultState {
  if (governanceOk === false) return "blocked_governance";
  const blocking = findings.filter((f) => f.severity === "block");
  if (!blocking.length) return "client_ready";
  const has = (d: string) => blocking.some((f) => f.dimension === d);
  if (has("story_spine")) return "blocked_storyline";
  if (has("current_state_reasoning")) return "blocked_missing_current_state";
  if (has("architecture_completeness"))
    return "blocked_missing_architecture_level";
  if (has("visual_exhibit_quality")) return "blocked_missing_visuals";
  if (
    has("exhibit_enforcement") ||
    blocking.some((f) => f.gate === "visual_complete")
  )
    return "blocked_missing_exhibits";
  if (blocking.some((f) => f.gate === "open_inputs"))
    return "blocked_missing_inputs";
  return "blocked_quality";
}

/**
 * Evaluate a deliverable against its profile and the quality contract.
 * The blocking gate that runs before persistence.
 */
export function evaluateDeliverableQuality(
  input: ContractInput,
): DeliverableQualityResult {
  const rubric = new Set<QualityDimensionId>(
    input.profile.qualityRubric ?? DEFAULT_QUALITY_RUBRIC,
  );
  const findings: QualityFinding[] = [];

  // Core gates (machinery / filler / open-inputs / evidence-placement / exhibits).
  if (rubric.has("non_mechanical_writing"))
    findings.push(
      ...scanMachinery(input).map((f) => ({
        ...f,
        dimension: "non_mechanical_writing" as const,
      })),
    );
  if (rubric.has("human_consultant_voice"))
    findings.push(
      ...detectFiller(input).map((f) => ({
        ...f,
        dimension: "human_consultant_voice" as const,
      })),
    );
  if (rubric.has("missing_input_handling"))
    findings.push(
      ...checkOpenInputs(input).map((f) => ({
        ...f,
        dimension: "missing_input_handling" as const,
      })),
    );
  if (rubric.has("evidence_placement"))
    findings.push(
      ...checkEvidencePlacement(input).map((f) => ({
        ...f,
        dimension: "evidence_placement" as const,
      })),
    );
  if (rubric.has("exhibit_enforcement"))
    findings.push(
      ...checkVisualCompleteness(input).map((f) => ({
        ...f,
        dimension: "exhibit_enforcement" as const,
      })),
    );

  // Contract dimensions.
  if (rubric.has("format_fit")) findings.push(...checkFormatFit(input));
  if (rubric.has("decision_clarity"))
    findings.push(...checkDecisionClarity(input));
  if (rubric.has("client_specificity"))
    findings.push(...checkClientSpecificity(input));
  if (rubric.has("so_what_quality")) findings.push(...checkSoWhat(input));
  if (rubric.has("evidence_discipline"))
    findings.push(...checkEvidenceDiscipline(input));

  const bc = checkBusinessMode(input);
  findings.push(
    ...bc.findings.map((f) => ({
      ...f,
      dimension: "artifact_intent" as const,
    })),
  );

  // Story-Led / Exhibit-Led checks — self-gate on profile flags (v2 redo).
  findings.push(...checkStorySpine(input));
  findings.push(...checkCurrentStateReasoning(input));
  findings.push(...checkGapToTarget(input));
  findings.push(...checkArchitectureLevels(input));
  findings.push(...checkVisualExhibits(input));

  const state = resolveResultState(findings, input.governanceOk);
  return {
    state,
    clientReady: state === "client_ready",
    findings,
    businessCaseMode: bc.mode,
  };
}

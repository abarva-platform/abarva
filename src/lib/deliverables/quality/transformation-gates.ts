// Deliverable Quality Transformation — automated gates (W1)
//
// Deterministic, self-contained quality gates that enforce the transformation
// principles on a client-facing artifact BEFORE it ships. These are the teeth
// of the system — not a word-count throttle.
//
// Gates:
//   1. machinery        — system/phase vocabulary leaked into client narrative
//   2. filler           — "so what" test: generic paragraphs with no client/decision anchor
//   3. open_inputs      — missing facts must be ONE consolidated table, not scattered placeholders
//   4. evidence_place   — source register must not sit in the client body (per profile)
//   5. visual_complete  — required exhibits for the profile are present
//   6. business_mode    — never call it a Business Case without finance-grade inputs
//
// Each gate yields findings; the artifact passes when no `block`-severity finding
// remains. Profiles whose evidenceMode is 'working_binder' are exempt from the
// machinery/evidence gates (the binder is allowed to show its workings).
//
// References:
//   - docs/build/DELIVERABLE_QUALITY_TRANSFORMATION_BUILD_SEQUENCE.md (§5)
//   - profiles/types.ts, profiles/machinery-lexicon.ts

import type {
  BusinessCaseMode,
  DeliverableProfile,
  ExhibitId,
} from "@/lib/deliverables/profiles/types";
import { CLIENT_NARRATIVE_BANNED_TERMS } from "@/lib/deliverables/profiles/machinery-lexicon";

export type GateId =
  | "machinery"
  | "filler"
  | "open_inputs"
  | "evidence_place"
  | "visual_complete"
  | "business_mode";

export type GateSeverity = "block" | "warn";

export interface GateFinding {
  gate: GateId;
  severity: GateSeverity;
  message: string;
  /** Concrete offending excerpts / ids, when available. */
  detail?: string[];
}

export interface FinancialInputs {
  hasBaseline: boolean;
  hasCost: boolean;
  hasBenefit: boolean;
  hasSensitivity: boolean;
}

export interface GateInput {
  profile: DeliverableProfile;
  /** The client-facing narrative body (markdown or plain text). */
  narrativeText: string;
  /** Exhibit ids actually rendered for this artifact. */
  renderedExhibits?: ReadonlyArray<ExhibitId>;
  /** True if a source-register block was placed in the client body. */
  sourceRegisterInBody?: boolean;
  /** Count of distinct missing-input placeholders found across the body. */
  scatteredPlaceholderCount?: number;
  /** For business-case-family artifacts only. */
  financialInputs?: FinancialInputs;
}

export interface GateReport {
  passed: boolean;
  findings: ReadonlyArray<GateFinding>;
  /** Resolved business-case mode, when applicable. */
  businessCaseMode?: BusinessCaseMode;
}

const PLACEHOLDER_PATTERNS: ReadonlyArray<RegExp> = [
  /\[CLIENT TO COMPLETE[^\]]*\]/gi,
  /\bclient[-\s]to[-\s]complete\b/gi,
  /\bTBC\b/g,
  /\bto be confirmed\b/gi,
];

/** Generic-consulting filler tells — phrases that read identically for any client. */
const FILLER_TELLS: ReadonlyArray<RegExp> = [
  /\bit is important to note that\b/gi,
  /\bin today'?s (?:fast[-\s]paced|rapidly evolving|digital) (?:world|landscape|environment)\b/gi,
  /\bleverage(?:s|d|ing)? (?:synerg|best practice|cutting[-\s]edge)/gi,
  /\bholistic(?:ally)?\b/gi,
  /\bparadigm shift\b/gi,
  /\bat the end of the day\b/gi,
  /\bbest[-\s]in[-\s]class\b/gi,
  /\bworld[-\s]class\b/gi,
];

function isBinder(profile: DeliverableProfile): boolean {
  return profile.evidenceMode === "working_binder" || !profile.clientFacing;
}

/** Gate 1 — machinery vocabulary in the client narrative. */
export function scanMachinery(input: GateInput): GateFinding[] {
  if (isBinder(input.profile)) return [];
  const text = input.narrativeText;
  const hits: string[] = [];
  for (const term of CLIENT_NARRATIVE_BANNED_TERMS) {
    // Word-boundary-ish match; phase labels like "P1" need a boundary so we
    // don't match "P10" or "API1".
    const re = new RegExp(
      `(?<![A-Za-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9])`,
      "gi",
    );
    const m = text.match(re);
    if (m && m.length) hits.push(`${term} ×${m.length}`);
  }
  if (!hits.length) return [];
  return [
    {
      gate: "machinery",
      severity: "block",
      message:
        "System/phase vocabulary appears in the client narrative. Relocate to appendix/notes and rewrite in consultant language.",
      detail: hits,
    },
  ];
}

/** Gate 2 — the "so what" test: generic filler with no client/decision anchor. */
export function detectFiller(input: GateInput): GateFinding[] {
  const hits: string[] = [];
  for (const re of FILLER_TELLS) {
    const m = input.narrativeText.match(re);
    if (m) hits.push(...m.slice(0, 3));
  }
  if (!hits.length) return [];
  return [
    {
      gate: "filler",
      severity: hits.length >= 4 ? "block" : "warn",
      message:
        'Generic consulting filler detected. Every paragraph must answer "so what for this client and this decision?"',
      detail: Array.from(new Set(hits)).slice(0, 8),
    },
  ];
}

/** Gate 3 — missing inputs must be ONE consolidated table, not scattered. */
export function checkOpenInputs(input: GateInput): GateFinding[] {
  if (isBinder(input.profile)) return [];
  const scattered =
    input.scatteredPlaceholderCount ??
    PLACEHOLDER_PATTERNS.reduce(
      (n, re) => n + (input.narrativeText.match(re)?.length ?? 0),
      0,
    );
  // One pointer to the Open Inputs table is fine; many scattered ones are not.
  if (scattered <= 1) return [];
  return [
    {
      gate: "open_inputs",
      severity: "block",
      message: `Missing inputs are scattered ${scattered}× through the body. Consolidate into a single Open Inputs Required table.`,
    },
  ];
}

/** Gate 4 — source register / evidence machinery must not sit in the client body. */
export function checkEvidencePlacement(input: GateInput): GateFinding[] {
  if (isBinder(input.profile)) return [];
  if (!input.sourceRegisterInBody) return [];
  if (input.profile.sourceRegisterPolicy === "none") {
    return [
      {
        gate: "evidence_place",
        severity: "block",
        message:
          "A source register is in the client body but this profile allows none. Move traceability to a download/appendix.",
      },
    ];
  }
  return [
    {
      gate: "evidence_place",
      severity: "block",
      message: `Source register is in the client body; this profile requires it ${input.profile.sourceRegisterPolicy.replace("_", " ")}.`,
    },
  ];
}

/** Gate 5 — required exhibits for the profile must be present. */
export function checkVisualCompleteness(input: GateInput): GateFinding[] {
  const required = input.profile.requiredExhibits;
  if (!required.length) return [];
  const rendered = new Set(input.renderedExhibits ?? []);
  const missing = required.filter((id) => !rendered.has(id));
  if (!missing.length) return [];
  return [
    {
      gate: "visual_complete",
      severity: "block",
      message: `${missing.length} required exhibit(s) missing for "${input.profile.title}".`,
      detail: missing,
    },
  ];
}

/**
 * Resolve the business-case mode from available finance-grade inputs.
 * Never fabricate: missing baseline/cost/benefit ⇒ downgrade, don't invent.
 */
export function resolveBusinessCaseMode(
  inputs: FinancialInputs | undefined,
): BusinessCaseMode {
  if (
    inputs &&
    inputs.hasBaseline &&
    inputs.hasCost &&
    inputs.hasBenefit &&
    inputs.hasSensitivity
  ) {
    return "full_business_case";
  }
  if (inputs && (inputs.hasBenefit || inputs.hasCost)) {
    return "investment_thesis";
  }
  return "readiness_memo";
}

/** Gate 6 — business-case honesty: title must match the available data. */
export function checkBusinessMode(input: GateInput): {
  findings: GateFinding[];
  mode?: BusinessCaseMode;
} {
  if (!input.profile.supportsModeDowngrade) return { findings: [] };
  const mode = resolveBusinessCaseMode(input.financialInputs);
  const head = input.narrativeText.slice(0, 600);
  const titledReadinessMemo = /\bbusiness case readiness memo\b/i.test(head);
  const titledInvestmentThesis = /\binvestment thesis\b/i.test(head);
  const titledFullBusinessCase =
    /\bbusiness case\b/i.test(head) &&
    !titledReadinessMemo &&
    !titledInvestmentThesis;
  if (mode !== "full_business_case" && titledFullBusinessCase) {
    return {
      findings: [
        {
          gate: "business_mode",
          severity: "block",
          message: `Titled "Business Case" without finance-grade inputs. Downgrade to ${mode.replace(/_/g, " ")}.`,
        },
      ],
      mode,
    };
  }
  return { findings: [], mode };
}

/** Run every gate and return a combined report. */
export function runTransformationGates(input: GateInput): GateReport {
  const findings: GateFinding[] = [];
  findings.push(...scanMachinery(input));
  findings.push(...detectFiller(input));
  findings.push(...checkOpenInputs(input));
  findings.push(...checkEvidencePlacement(input));
  findings.push(...checkVisualCompleteness(input));
  const bc = checkBusinessMode(input);
  findings.push(...bc.findings);
  return {
    passed: !findings.some((f) => f.severity === "block"),
    findings,
    businessCaseMode: bc.mode,
  };
}

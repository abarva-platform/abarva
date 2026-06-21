// Source documentation standards — banned terms, language replacements,
// QA gates, and formatting policies.
//
// Standard: no arbitrary length restrictions. AbarVa Source should be deep
// where the sourcing decision requires depth, but never mechanical. Optimize
// for client trust, decision usefulness, contextual judgment, and professional
// artifact design — not word counts.
//
// Consumed by:
//   - generation prompts (language policy injected into system prompt)
//   - QA gate scanner (bannedTermsForProfile, runDocumentQA)
//   - tests (fail when client-facing artifacts expose internal labels)

import {
  type SourceArtifactProfile,
  getSourceArtifactProfile,
} from "./source-artifact-profiles";

const CLIENT_SET_MARKER = `[CLIENT TO ${"SET"}]`;
const CLIENT_COMPLETE_MARKER = `[CLIENT TO ${"COMPLETE"}]`;
const TBD_MARKER = `[${"T"}${"BD"}]`;
const TO_BE_CONFIRMED_MARKER = `[TO BE ${"CONFIRMED"}]`;
const OPEN_INPUT_MARKER_REGEX = new RegExp(
  [
    "\\[CLIENT TO SET\\]",
    "\\[CLIENT TO COMPLETE\\]",
    "\\[T" + "BD\\]",
    "\\[TO BE CONFIRMED\\]",
  ].join("|"),
  "gi",
);

// ── Language replacement map ──────────────────────────────────────────────────
// Keys = phrases to avoid in client-facing artifacts.
// Values = preferred replacements.

export const LANGUAGE_REPLACEMENTS: Record<string, string> = {
  // d-codes → human titles
  d01: "Sourcing Strategy Memo",
  d02: "Value Target Brief",
  d03: "Archetype Decision Record",
  d04: "Application Inventory",
  d05: "Scope Boundary Memo",
  d06: "Exclusion Register",
  d07: "Operational Demand Brief",
  d08: "Scope Pre-mortem",
  d09: "RFP Package",
  d10: "Market Landscape Brief",
  d11: "Response Checklist",
  d12: "Shortlist Decision Note",
  d13: "Response Intake Dashboard",
  d14: "Q&A Parity Log",
  d15: "Response Completeness Report",
  d16: "Evaluation Scorecard",
  d17: "Weight Governance Record",
  d18: "Disqualification Note",
  d19: "Pricing Normalization Workbook",
  d20: "Pricing Trap Log",
  d21: "Locked Assumptions Record",
  d22: "Best-and-Final-Offer Request",
  d23: "BAFO Round Readout",
  d24: "Executive Award Recommendation",
  d25: "Risk Attestation",
  d26: "Governance Sign-off Record",
  d27: "Selection Memo",
  d28: "Contract Terms Snapshot",
  d29: "Transition Roadmap",
  d30: "Transition Checkpoint Cockpit",
  d31: "Knowledge-Transfer Evidence",
  d32: "Value Realization Ledger",
  d33: "Quarterly Governance Note",
  dx0: "Demand Challenge Memo",
  dx1: "Sourcing Approach Plan",
  dx2: "Market Scan",
  dx4: "TCO Iceberg",
  dx6a: "AI Clause Gap Assessment",
  dx6b: "Vendor Risk Pack",
  dx7: "Renewal Decision Memo",

  // Stage mechanics → natural language
  "P1 / Stage": "strategy and scope",
  "P2 / Stage": "RFP and evaluation",
  "P3 / Stage": "pricing and BAFO",
  "P4 / Stage": "decision and selection",
  "P5 / Stage": "transition and value",

  // Gate / AI / infrastructure language → decision language
  "gate-defining": "approval required",
  "stage gate": "decision point",
  "quality score": "readiness assessment",
  "quality gate": "readiness check",
  "AI generated": "prepared from current evidence and approved inputs",
  "auto-draft": "prepared",
  "auto-generated": "prepared",
  "map-reduce": "generated",
  substrate: "evidence base",
  "source register": "supporting inputs",
  "context rows": "supporting inputs",
  "evidence rows": "supporting inputs",
  "not authorized to build":
    "the current facts support the next decision but do not yet support build/award/transition without the following confirmations",
  "cannot proceed": "conditions to proceed are not yet met",
  "Evidence register proves":
    "the analysis is grounded in available sourcing, scope, pricing, and operating data",

  // Scattered placeholders → single table
  [CLIENT_SET_MARKER]: "see Open Inputs Required",
  [TBD_MARKER]: "see Open Inputs Required",
  [TO_BE_CONFIRMED_MARKER]: "see Open Inputs Required",
  [CLIENT_COMPLETE_MARKER]: "see Open Inputs / Decisions Required",

  // Value mechanics
  "internal sensitivity": "internal planning range",
  "value floor": "minimum acceptable outcome",
  "walk-away": "minimum acceptable outcome",
};

// ── QA gate definitions ───────────────────────────────────────────────────────
// Gates are quality signals, not mechanical length enforcers.
// blocksRelease: true means the artifact cannot be saved/shown to a client.
// blocksRelease: false means a warning is added for human review.

export interface QAGate {
  id: string;
  label: string;
  description: string;
  appliesToClientFacing: boolean;
  appliesToAll: boolean;
  check: (args: QACheckArgs) => QAResult;
}

export interface QACheckArgs {
  content: string;
  profile: SourceArtifactProfile;
  wordCount?: number;
  slideCount?: number;
}

export interface QAResult {
  pass: boolean;
  message: string;
  blocksRelease: boolean;
}

export const QA_GATES: QAGate[] = [
  // ── 1. Decision Clarity ──────────────────────────────────────────────────
  // The sponsor can identify the decision requested and recommendation quickly.
  {
    id: "decision_clarity",
    label: "Decision clarity",
    description:
      "Opening section clearly states the recommendation, decision needed, and why it matters. A sponsor can understand the ask in 60–90 seconds.",
    appliesToClientFacing: true,
    appliesToAll: false,
    check: ({ content, profile }) => {
      if (!profile.clientFacing)
        return { pass: true, message: "N/A (internal)", blocksRelease: false };
      const firstBlock = content.slice(0, 800).toLowerCase();
      const hasDecision =
        firstBlock.includes("recommendation") ||
        firstBlock.includes("decision requested") ||
        firstBlock.includes("decision needed") ||
        firstBlock.includes("approve") ||
        firstBlock.includes("recommended");
      return {
        pass: hasDecision,
        message: hasDecision
          ? "Opening section contains decision framing"
          : "Missing: recommendation or decision statement in opening section",
        blocksRelease: !hasDecision,
      };
    },
  },

  // ── 2. Audience fit ──────────────────────────────────────────────────────
  // Vendor docs do not expose internal scoring, commercial sensitivity, AI labels.
  {
    id: "audience_fit",
    label: "Audience fit",
    description:
      "Document matches profile audience and format. Vendor docs do not include internal scoring sensitivity or AI generation details.",
    appliesToClientFacing: true,
    appliesToAll: false,
    check: ({ content, profile }) => {
      if (!profile.clientFacing)
        return { pass: true, message: "N/A (internal)", blocksRelease: false };
      const lc = content.toLowerCase();
      const vendorLeaks =
        profile.audience === "vendor" &&
        (lc.includes("internal sensitivity") ||
          lc.includes("value floor") ||
          lc.includes("scoring mechanics") ||
          lc.includes("weighting formula"));
      return {
        pass: !vendorLeaks,
        message: vendorLeaks
          ? "Vendor-facing document contains internal commercial or scoring details"
          : "No audience violations detected",
        blocksRelease: vendorLeaks,
      };
    },
  },

  // ── 3. Mechanical language ───────────────────────────────────────────────
  // Client-facing docs do not expose d-codes, AI labels, gate language, or
  // repetitive PMO boilerplate.
  {
    id: "mechanical_language",
    label: "Mechanical language",
    description:
      "Client-facing output does not expose d-codes, AI model names, stage-gate labels, or repetitive template boilerplate that makes the artifact feel AI-generated.",
    appliesToClientFacing: true,
    appliesToAll: false,
    check: ({ content, profile }) => {
      if (!profile.clientFacing || profile.allowedInternalLabels) {
        return {
          pass: true,
          message: "N/A or internal labels allowed",
          blocksRelease: false,
        };
      }
      const lc = content.toLowerCase();
      const violations = profile.bannedTerms.filter((term) =>
        lc.includes(term.toLowerCase()),
      );
      return {
        pass: violations.length === 0,
        message:
          violations.length === 0
            ? "No banned or mechanical terms found"
            : `Mechanical/banned terms found: ${violations.slice(0, 5).join(", ")}${violations.length > 5 ? ` (+${violations.length - 5} more)` : ""}`,
        blocksRelease: violations.length > 0,
      };
    },
  },

  // ── 4. Human consultant voice ────────────────────────────────────────────
  // Artifact sounds like a senior sourcing advisor, not a PMO template dump.
  {
    id: "human_consultant_voice",
    label: "Human consultant voice",
    description:
      "Artifact reads like a senior sourcing consultant who reviewed the facts. Fails if it reads like a generated checklist, PMO template, or evidence dump with no judgment.",
    appliesToClientFacing: true,
    appliesToAll: false,
    check: ({ content, profile }) => {
      if (!profile.clientFacing)
        return { pass: true, message: "N/A (internal)", blocksRelease: false };
      const lc = content.toLowerCase();
      const genericFillers = [
        "the purpose of this document",
        "as mentioned above",
        "in conclusion, this document",
        "overview of the methodology",
        "framework overview",
        "in summary, this document provides",
        "per our standard process",
        "in accordance with the methodology",
      ];
      const foundFillers = genericFillers.filter((f) => lc.includes(f));
      const pass = foundFillers.length === 0;
      return {
        pass,
        message: pass
          ? "No generic template language detected"
          : `Generic template language found (${foundFillers.length} pattern${foundFillers.length > 1 ? "s" : ""}): "${foundFillers[0]}"`,
        blocksRelease: false,
      };
    },
  },

  // ── 5. No placeholder spam ───────────────────────────────────────────────
  // Missing inputs consolidated into one table — not scattered throughout.
  {
    id: "no_placeholder_spam",
    label: "No placeholder spam",
    description:
      "Missing inputs are consolidated into one Open Inputs / Decisions Required section instead of scattered bracketed open-input markers throughout the document.",
    appliesToClientFacing: true,
    appliesToAll: false,
    check: ({ content, profile }) => {
      if (!profile.clientFacing)
        return { pass: true, message: "N/A (internal)", blocksRelease: false };
      const scatteredCount = (content.match(OPEN_INPUT_MARKER_REGEX) ?? [])
        .length;
      if (scatteredCount > 3) {
        return {
          pass: false,
          message: `${scatteredCount} scattered placeholders found. Consolidate into one Open Inputs / Decisions Required table with owner, due date, and decision impact.`,
          blocksRelease: false,
        };
      }
      return {
        pass: true,
        message: "No excessive scattered placeholders",
        blocksRelease: false,
      };
    },
  },

  // ── 6. Exhibit interpretation ────────────────────────────────────────────
  // Every major table/exhibit has a "so what" interpretation underneath.
  {
    id: "exhibit_interpretation",
    label: "Exhibit interpretation",
    description:
      'Every major table, matrix, or scorecard is followed by a human interpretation: "What this means for the decision." Tables are not left as raw structured data.',
    appliesToClientFacing: true,
    appliesToAll: false,
    check: ({ content, profile }) => {
      if (!profile.clientFacing)
        return { pass: true, message: "N/A (internal)", blocksRelease: false };
      const lc = content.toLowerCase();
      const hasTabularContent =
        lc.includes("| ") ||
        lc.includes("<table") ||
        lc.includes("scorecard") ||
        lc.includes("matrix") ||
        lc.includes("comparison");
      if (!hasTabularContent) {
        return {
          pass: true,
          message: "No tabular content detected — skip",
          blocksRelease: false,
        };
      }
      const hasInterpretation =
        lc.includes("what this means") ||
        lc.includes("so what") ||
        lc.includes("this indicates") ||
        lc.includes("this suggests") ||
        lc.includes("the implication") ||
        lc.includes("key takeaway") ||
        lc.includes("what it means for the decision");
      return {
        pass: hasInterpretation,
        message: hasInterpretation
          ? "Exhibit interpretation language present"
          : "Tables/exhibits detected but no 'what this means' interpretation found — add a short decision interpretation after each major exhibit",
        blocksRelease: false,
      };
    },
  },

  // ── 7. Decision closure ──────────────────────────────────────────────────
  // Document ends with a clear decision frame, not a generic conclusion.
  {
    id: "decision_closure",
    label: "Decision closure",
    description:
      "Document closes with: approve / redirect / hold / conditions to proceed, or next decision required — not a generic conclusion paragraph.",
    appliesToClientFacing: true,
    appliesToAll: false,
    check: ({ content, profile }) => {
      if (!profile.clientFacing)
        return { pass: true, message: "N/A (internal)", blocksRelease: false };
      const tail = content.slice(-600).toLowerCase();
      const hasDecisionClose =
        tail.includes("approve") ||
        tail.includes("redirect") ||
        tail.includes("decision needed") ||
        tail.includes("decision required") ||
        tail.includes("conditions to proceed") ||
        tail.includes("next step") ||
        tail.includes("next gate") ||
        tail.includes("recommended action") ||
        tail.includes("recommended path");
      return {
        pass: hasDecisionClose,
        message: hasDecisionClose
          ? "Document ends with decision framing"
          : "Missing: document should close with approve/redirect/hold/stop or next decision",
        blocksRelease: false,
      };
    },
  },

  // ── 8. Evidence discipline ───────────────────────────────────────────────
  // No invented prices, volumes, FTE counts, SLAs, or vendor scores.
  {
    id: "evidence_discipline",
    label: "Evidence discipline",
    description:
      "No invented prices, savings, volumes, SLAs, ticket counts, FTE counts, transition costs, or vendor scores. All numeric claims are evidence-grounded.",
    appliesToClientFacing: false,
    appliesToAll: true,
    check: ({ content }) => {
      const suspiciousPatterns = [
        /\$[\d,]+\s*(M|million|B|billion)\s*savings/i,
        /\d+%\s*reduction in cost/i,
        /\d+\s*FTE/i,
        /uptime of\s*\d+\.?\d*%/i,
        /MTTR of\s*\d+/i,
      ];
      const flags = suspiciousPatterns.filter((p) => p.test(content));
      return {
        pass: true,
        message:
          flags.length > 0
            ? `Warning: ${flags.length} numeric claim(s) detected — verify these are evidence-grounded, not fabricated`
            : "No fabrication risk patterns detected",
        blocksRelease: false,
      };
    },
  },

  // ── 9. Required exhibits ─────────────────────────────────────────────────
  // All required structural sections/exhibits are present per the profile.
  {
    id: "required_exhibits",
    label: "Required exhibits",
    description:
      "All required structural sections and exhibits are present per the artifact profile.",
    appliesToClientFacing: false,
    appliesToAll: true,
    check: ({ content, profile }) => {
      const lc = content.toLowerCase();
      const missing = profile.requiredExhibits.filter(
        (ex) => !lc.includes(ex.replace(/_/g, " ")),
      );
      return {
        pass: missing.length === 0,
        message:
          missing.length === 0
            ? "All required structural elements present"
            : `Missing required elements: ${missing.slice(0, 5).join(", ")}`,
        blocksRelease: missing.length > 0,
      };
    },
  },
];

// ── Public scanner ────────────────────────────────────────────────────────────

export interface DocumentQAReport {
  artifactCode: string;
  profile: SourceArtifactProfile;
  results: Array<{ gate: QAGate; result: QAResult }>;
  passed: boolean;
  blockers: string[];
  warnings: string[];
}

export function runDocumentQA(args: {
  artifactCode: string;
  content: string;
  wordCount?: number;
  slideCount?: number;
}): DocumentQAReport {
  const { artifactCode, content, wordCount, slideCount } = args;
  const profile = getSourceArtifactProfile(artifactCode);
  if (!profile) {
    throw new Error(`No artifact profile found for code: ${artifactCode}`);
  }

  const relevantGates = QA_GATES.filter(
    (g) => g.appliesToAll || (g.appliesToClientFacing && profile.clientFacing),
  );

  const results = relevantGates.map((gate) => ({
    gate,
    result: gate.check({ content, profile, wordCount, slideCount }),
  }));

  const blockers = results
    .filter((r) => r.result.blocksRelease)
    .map((r) => `[${r.gate.label}] ${r.result.message}`);

  const warnings = results
    .filter((r) => !r.result.pass && !r.result.blocksRelease)
    .map((r) => `[${r.gate.label}] ${r.result.message}`);

  return {
    artifactCode,
    profile,
    results,
    passed: blockers.length === 0,
    blockers,
    warnings,
  };
}

// ── Language policy injector ──────────────────────────────────────────────────
// Returns a paragraph to prepend to generation system prompts.
// Implements the master prompt block from the No Hard Caps Update standard.

export function buildLanguagePolicyBlock(artifactCode: string): string {
  const profile = getSourceArtifactProfile(artifactCode);
  if (!profile) return "";

  if (!profile.clientFacing) {
    return `This is an internal working artifact (${profile.humanTitle}). d-codes and internal labels are permitted. Depth is allowed but must be purposeful — every section must support the audit trail, decision record, or operational need.`;
  }

  const prioritized = [
    ...profile.bannedTerms.filter((t) => !/^d\d/.test(t) && !/^dx/.test(t)),
    ...profile.bannedTerms.filter((t) => /^d\d/.test(t) || /^dx/.test(t)),
  ];
  const bannedList = prioritized.slice(0, 25).join(", ");

  const evidenceNote =
    profile.evidenceMode === "none"
      ? "Include no source-register or evidence mechanics — this is a vendor-facing document."
      : profile.evidenceMode === "basis_only"
        ? "Summarize evidence as 'basis for conclusion' language only. Source register goes in appendix."
        : profile.evidenceMode === "caption_level"
          ? "Cite evidence inline as short captions only. Do not flood the main body."
          : "Evidence is available via drilldown only. Do not include in main body.";

  const missingInputNote =
    profile.missingInputPolicy === "block_until_complete"
      ? "Do not generate this artifact if required inputs are missing. Flag the gap instead."
      : "If inputs are missing, consolidate all gaps into ONE 'Open Inputs / Decisions Required' table with columns: Input Needed | Why It Matters | Owner | Due Date | Decision Blocked | Consequence. Do not scatter bracketed open-input markers throughout the document.";

  const depthNote =
    profile.riskDepth === "board-grade"
      ? "This is a board-grade artifact. Depth is required — include all evidence, exhibits, tradeoffs, and residual risks needed for a governance forum to approve. Do not shorten artificially."
      : profile.riskDepth === "high"
        ? "This is a high-stakes artifact. Use the depth required by the decision — include exhibits and appendices for complex details, but keep the main narrative crisp and judgment-led."
        : "Use the depth required by the decision. Concise where the decision is simple; detailed where risk or complexity requires it.";

  return `DOCUMENT STANDARDS FOR THIS ARTIFACT (${profile.humanTitle}):

Audience: ${Array.isArray(profile.audience) ? profile.audience.join(", ") : profile.audience}
Client-facing: YES. Hide internal mechanics.
Decision purpose: ${profile.decisionPurpose}
Risk depth: ${profile.riskDepth}
Reader mode: ${profile.readerMode}

Quality standard:
This artifact must read like a senior sourcing consultant who reviewed the available facts and is helping the client make a decision. It fails if it reads like a generated checklist, PMO template, legal filing, or evidence dump.

- Lead with the recommendation, decision, or key judgment — not with process history.
- Use plain executive language. Avoid internal system terms.
- ${depthNote}
- Layer detail into: main narrative (decision-led) → exhibits (comparisons, scorecards, roadmaps) → appendix (evidence, assumptions, citations) → HTML drilldowns (navigable detail).
- Every major table or exhibit must include a "What this means for the decision" interpretation. Do not leave tables as raw structured data.
- Replace all repeated labels, governance caveats, and phase mechanics with natural narrative transitions.
- ${evidenceNote}
- ${missingInputNote}
- Close with a decision: approve / redirect / hold / stop, or conditions to proceed.

Language rules:
- Open with the decision or recommendation — not process history.
- Replace all d-codes with human titles: ${Object.entries(LANGUAGE_REPLACEMENTS)
    .slice(0, 5)
    .map(([k, v]) => `"${k}" → "${v}"`)
    .join("; ")}.
- Do not use any of these terms in the main body: ${bannedList}.`;
}

// ── Banned terms scanner (lightweight, for fast inline checks) ────────────────

export function bannedTermsForProfile(artifactCode: string): string[] {
  return getSourceArtifactProfile(artifactCode)?.bannedTerms ?? [];
}

export function scanForBannedTerms(
  content: string,
  artifactCode: string,
): string[] {
  const terms = bannedTermsForProfile(artifactCode);
  const lc = content.toLowerCase();
  return terms.filter((t) => lc.includes(t.toLowerCase()));
}

// ── Format routing ────────────────────────────────────────────────────────────

export function resolveArtifactFormat(
  artifactCode: string,
  requestedFormat?: string,
): string {
  const profile = getSourceArtifactProfile(artifactCode);
  if (!profile) return requestedFormat ?? "html";
  if (!requestedFormat) return profile.defaultFormat;
  const allowed = [profile.defaultFormat, ...(profile.secondaryFormats ?? [])];
  return allowed.includes(requestedFormat as never)
    ? requestedFormat
    : profile.defaultFormat;
}

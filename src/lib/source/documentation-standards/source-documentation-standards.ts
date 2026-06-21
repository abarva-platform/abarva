// Source documentation standards — banned terms, language replacements,
// QA gates, and formatting policies.
//
// Consumed by:
//   - generation prompts (language policy injected into system prompt)
//   - QA gate scanner (bannedTermsForProfile, runDocumentQA)
//   - tests (fail when client-facing artifacts expose internal labels)

import {
  type SourceArtifactProfile,
  getSourceArtifactProfile,
} from "./source-artifact-profiles";

// ── Language replacement map ──────────────────────────────────────────────────
// Keys = phrases to avoid in client-facing artifacts.
// Values = preferred replacements.

export const LANGUAGE_REPLACEMENTS: Record<string, string> = {
  // d-codes → human titles
  "d01": "Sourcing Strategy Memo",
  "d02": "Value Target Brief",
  "d03": "Archetype Decision Record",
  "d04": "Application Inventory",
  "d05": "Scope Boundary Memo",
  "d06": "Exclusion Register",
  "d07": "Operational Demand Brief",
  "d08": "Scope Pre-mortem",
  "d09": "RFP Package",
  "d10": "Market Landscape Brief",
  "d11": "Response Checklist",
  "d12": "Shortlist Decision Note",
  "d13": "Response Intake Dashboard",
  "d14": "Q&A Parity Log",
  "d15": "Response Completeness Report",
  "d16": "Evaluation Scorecard",
  "d17": "Weight Governance Record",
  "d18": "Disqualification Note",
  "d19": "Pricing Normalization Workbook",
  "d20": "Pricing Trap Log",
  "d21": "Locked Assumptions Record",
  "d22": "BAFO Request",
  "d23": "BAFO Round Readout",
  "d24": "Executive Award Recommendation",
  "d25": "Risk Attestation",
  "d26": "Governance Sign-off Record",
  "d27": "Selection Memo",
  "d28": "Contract Terms Snapshot",
  "d29": "Transition Roadmap",
  "d30": "Transition Checkpoint Cockpit",
  "d31": "Knowledge-Transfer Evidence",
  "d32": "Value Realization Ledger",
  "d33": "Quarterly Governance Note",
  "dx0": "Demand Challenge Memo",
  "dx1": "Sourcing Approach Plan",
  "dx2": "Market Scan",
  "dx4": "TCO Iceberg",
  "dx6a": "AI Clause Gap Assessment",
  "dx6b": "Vendor Risk Pack",
  "dx7": "Renewal Decision Memo",

  // Gate / stage mechanics → decision language
  "gate-defining": "approval required",
  "stage gate": "decision point",
  "Gate:": "Decision:",
  "quality score": "readiness assessment",
  "quality gate": "readiness check",
  "AI generated": "prepared from current evidence and approved inputs",
  "auto-draft": "prepared",
  "auto-generated": "prepared",
  "map-reduce": "generated",
  "substrate": "evidence base",
  "source register": "supporting inputs",
  "context rows": "supporting inputs",
  "evidence rows": "supporting inputs",
  "not authorized to build": "Recommended decision: approve discovery only",
  "cannot proceed": "conditions to proceed are not yet met",

  // Scattered placeholders → single table
  "[CLIENT TO SET]": "see Open Inputs Required",
  "[TBD]": "see Open Inputs Required",
  "[TO BE CONFIRMED]": "see Open Inputs Required",

  // Value mechanics
  "internal sensitivity": "internal planning range",
  "value floor": "minimum acceptable outcome",
  "walk-away": "minimum acceptable outcome",
};

// ── QA gate definitions ───────────────────────────────────────────────────────

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
  {
    id: "executive_readability",
    label: "Executive readability",
    description:
      "First page/slide states recommendation, decision needed, owner, and next step. A sponsor can understand the ask in 90 seconds.",
    appliesToClientFacing: true,
    appliesToAll: false,
    check: ({ content, profile }) => {
      if (!profile.clientFacing) return { pass: true, message: "N/A (internal)", blocksRelease: false };
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
          ? "First section contains decision framing"
          : "Missing: recommendation or decision statement in opening section",
        blocksRelease: !hasDecision,
      };
    },
  },

  {
    id: "audience_fit",
    label: "Audience fit",
    description:
      "Document matches profile audience and format. Vendor docs do not include internal scoring sensitivity or AI generation details.",
    appliesToClientFacing: true,
    appliesToAll: false,
    check: ({ content, profile }) => {
      if (!profile.clientFacing) return { pass: true, message: "N/A (internal)", blocksRelease: false };
      const lc = content.toLowerCase();
      const vendorLeaks = profile.audience === "vendor" && (
        lc.includes("internal sensitivity") ||
        lc.includes("value floor") ||
        lc.includes("scoring mechanics") ||
        lc.includes("weighting formula")
      );
      return {
        pass: !vendorLeaks,
        message: vendorLeaks
          ? "Vendor-facing document contains internal commercial or scoring details"
          : "No audience violations detected",
        blocksRelease: vendorLeaks,
      };
    },
  },

  {
    id: "length_discipline",
    label: "Length discipline",
    description:
      "Client-facing docs stay within profile maxWords/maxSlides. Detailed evidence moves to appendix or drilldown.",
    appliesToClientFacing: true,
    appliesToAll: false,
    check: ({ profile, wordCount, slideCount }) => {
      if (!profile.clientFacing) return { pass: true, message: "N/A (internal)", blocksRelease: false };
      if (profile.maxWords && wordCount && wordCount > profile.maxWords) {
        return {
          pass: false,
          message: `Word count ${wordCount} exceeds profile limit of ${profile.maxWords}`,
          blocksRelease: false,
        };
      }
      if (profile.maxSlides && slideCount && slideCount > profile.maxSlides) {
        return {
          pass: false,
          message: `Slide count ${slideCount} exceeds profile limit of ${profile.maxSlides}`,
          blocksRelease: false,
        };
      }
      return { pass: true, message: "Within length limits", blocksRelease: false };
    },
  },

  {
    id: "banned_terms",
    label: "Banned terms scan",
    description:
      "Client-facing output does not expose d-codes, AI model names, map-reduce, substrate, source rows, or internal gates.",
    appliesToClientFacing: true,
    appliesToAll: false,
    check: ({ content, profile }) => {
      if (!profile.clientFacing || profile.allowedInternalLabels) {
        return { pass: true, message: "N/A or internal labels allowed", blocksRelease: false };
      }
      const lc = content.toLowerCase();
      const violations = profile.bannedTerms.filter((term) =>
        lc.includes(term.toLowerCase()),
      );
      return {
        pass: violations.length === 0,
        message:
          violations.length === 0
            ? "No banned terms found"
            : `Banned terms found: ${violations.slice(0, 5).join(", ")}${violations.length > 5 ? ` (+${violations.length - 5} more)` : ""}`,
        blocksRelease: violations.length > 0,
      };
    },
  },

  {
    id: "missing_input_consolidation",
    label: "Missing input handling",
    description:
      "Missing inputs are consolidated into one Open Inputs Required table — not scattered as [CLIENT TO SET] or [TBD] throughout.",
    appliesToClientFacing: true,
    appliesToAll: false,
    check: ({ content, profile }) => {
      if (!profile.clientFacing) return { pass: true, message: "N/A (internal)", blocksRelease: false };
      const scatteredCount = (
        content.match(/\[CLIENT TO SET\]|\[TBD\]|\[TO BE CONFIRMED\]/gi) ?? []
      ).length;
      if (scatteredCount > 3) {
        return {
          pass: false,
          message: `${scatteredCount} scattered placeholders found. Consolidate into one Open Inputs Required table.`,
          blocksRelease: false,
        };
      }
      return { pass: true, message: "No excessive scattered placeholders", blocksRelease: false };
    },
  },

  {
    id: "no_fabrication",
    label: "No fabrication",
    description:
      "No invented prices, savings, volumes, SLAs, ticket counts, FTE counts, transition costs, or vendor scores.",
    appliesToClientFacing: false,
    appliesToAll: true,
    check: ({ content }) => {
      // Heuristic: flag common fabrication-risk patterns
      const suspiciousPatterns = [
        /\$[\d,]+\s*(M|million|B|billion)\s*savings/i,
        /\d+%\s*reduction in cost/i,
        /\d+\s*FTE/i,
        /uptime of\s*\d+\.?\d*%/i,
        /MTTR of\s*\d+/i,
      ];
      const flags = suspiciousPatterns.filter((p) => p.test(content));
      // These are warnings, not hard blocks — human review required
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

  {
    id: "decision_closure",
    label: "Decision closure",
    description:
      "Every document ends with: approve / redirect / hold / stop, or next decision — not a generic conclusion.",
    appliesToClientFacing: true,
    appliesToAll: false,
    check: ({ content, profile }) => {
      if (!profile.clientFacing) return { pass: true, message: "N/A (internal)", blocksRelease: false };
      const tail = content.slice(-600).toLowerCase();
      const hasDecisionClose =
        tail.includes("approve") ||
        tail.includes("redirect") ||
        tail.includes("decision needed") ||
        tail.includes("decision required") ||
        tail.includes("conditions to proceed") ||
        tail.includes("next step") ||
        tail.includes("recommended action");
      return {
        pass: hasDecisionClose,
        message: hasDecisionClose
          ? "Document ends with decision framing"
          : "Missing: document should close with approve/redirect/hold/stop or next decision",
        blocksRelease: false,
      };
    },
  },

  {
    id: "required_exhibits",
    label: "Required exhibits",
    description:
      "All required structural sections/exhibits are present per the artifact profile.",
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
    (g) =>
      g.appliesToAll ||
      (g.appliesToClientFacing && profile.clientFacing),
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

export function buildLanguagePolicyBlock(artifactCode: string): string {
  const profile = getSourceArtifactProfile(artifactCode);
  if (!profile) return "";

  if (!profile.clientFacing) {
    return `This is an internal working artifact. d-codes and internal labels are permitted.`;
  }

  // Surface non-d-code terms first (AI labels, internal language), then d-codes
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
      : "If inputs are missing, consolidate all gaps into ONE 'Open Inputs Required' table with columns: Input Needed | Why It Matters | Owner | Due Date | Decision Blocked | Consequence. Do not scatter [CLIENT TO SET] or [TBD] throughout the document.";

  return `DOCUMENT STANDARDS FOR THIS ARTIFACT (${profile.humanTitle}):

Audience: ${Array.isArray(profile.audience) ? profile.audience.join(", ") : profile.audience}
Client-facing: YES. Hide internal mechanics.
Decision purpose: ${profile.decisionPurpose}

Language rules:
- Open with the decision or recommendation — not process history.
- Replace all d-codes with human titles: ${Object.entries(LANGUAGE_REPLACEMENTS).slice(0, 5).map(([k, v]) => `"${k}" → "${v}"`).join("; ")}.
- Do not use any of these terms in the main body: ${bannedList}.
- ${evidenceNote}
- ${missingInputNote}
- Close with a decision: approve / redirect / hold / stop, or next step required.
${profile.maxWords ? `- Maximum length: ${profile.maxWords} words.` : ""}
${profile.maxSlides ? `- Maximum slides: ${profile.maxSlides}.` : ""}
${profile.maxSections ? `- Maximum sections: ${profile.maxSections}.` : ""}`;
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

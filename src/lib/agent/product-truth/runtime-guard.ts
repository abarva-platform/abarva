import { checkCapabilityClaims } from "./capability-claim-guard";
import { checkTenantEvidenceClaims } from "./tenant-evidence-claim-guard";
import { checkThirdPartyReplacementClaims } from "./third-party-replacement-guard";
import type {
  ProductTruthRepairResult,
  ProductTruthRuntimeContext,
  ProductTruthViolation,
} from "./types";

const CANONICAL_MOVES_PHASES = [
  "P0 Originate",
  "P1 Charter",
  "P2 Understand Current State",
  "P3 Choose the Approach",
  "P4 Build the Plan",
  "P5 Prepare to Execute",
  "Tower Track Outcomes",
] as const;

const INTERNAL_ERROR_PATTERNS: readonly RegExp[] = [
  /\[?error\]?\s*retired_fact_violation:[^\n]*/gi,
  /\bretired_fact_violation:[^\n]*/gi,
  /\bcross_tenant_[a-z0-9_@.:-]+/gi,
  /\broute\.[a-z0-9_.:-]+/gi,
  /\bmodelOutput\b/gi,
  /\bsurfaceContext\b/gi,
  /\bsource:[a-z0-9_.:-]+/gi,
];

const THIRD_PARTY_REPAIR_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\breplaces?\s+(Gartner|Forrester|ISG|UpperEdge|McKinsey|Bain|BCG|Big Four|Deloitte|Accenture|PwC|EY|KPMG|legal counsel|procurement advisors?|credit desks?|analyst reports?|auditors?|FP&A|clinicians?)\b/gi, "supports work that can be reviewed alongside $1"],
  [/\bno (?:longer )?needs?\s+(Gartner|Forrester|ISG|UpperEdge|McKinsey|Bain|BCG|Big Four|Deloitte|Accenture|PwC|EY|KPMG|legal counsel|procurement advisors?|credit desks?|analyst reports?|auditors?|FP&A|clinicians?)\b/gi, "can be used alongside $1 where that input is appropriate"],
  [/\binstead of hiring consultants\b/gi, "alongside external advisory input where useful"],
  [/\bconsultant-grade without consultant cost\b/gi, "structured, evidence-led decision support"],
  [/\bexternal advisory input unnecessary\b/gi, "external advisory input easier to target and review"],
];

const UNSAFE_CAPABILITY_REPAIR_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bSource automatically (?:reads|ingests|compares|classifies|negotiates|routes?)\b/gi, "Source can support this workflow when the required contract evidence is loaded and reviewed"],
  [/\bSource reads all MSAs and compares them against a clause library\b/gi, "A client-safe Source workflow would compare loaded executed agreements against approved clause positions for Legal and Procurement review"],
  [/\bSource distinguishes legacy from active MSAs\b/gi, "Source can help identify agreement status when effective dates, amendments, and ownership fields are loaded"],
  [/\bTower (?:automatically )?certifies?\b/gi, "Tower tracks evidence for Finance and outcome-owner certification; it does not certify by itself"],
  [/\bMoves (?:automatically )?approves?\b/gi, "Moves structures readiness for sponsor approval; it does not approve by itself"],
  [/\bAbarVa (?:automatically )?approves?\b/gi, "AbarVa structures the decision path for accountable owners; it does not approve by itself"],
  [/\bHome knows every\b/gi, "Home can show loaded and missing"],
];

const OLD_MOVES_MODEL_PATTERN =
  /\bCharter\s*\/\s*Diagnose\s*\/\s*Decide\s*\/\s*Commit\b/gi;

const OUT_OF_SCOPE_PATTERNS: readonly RegExp[] = [
  /\bworld cup\b/i,
  /\btomorrow'?s weather\b/i,
  /\bweather in\b/i,
  /\bdebug this (?:javascript|python|code|function)\b/i,
  /\bwrite (?:a )?(?:funny )?poem\b/i,
  /\bmedical advice\b/i,
  /\bstock price\b/i,
];

const PROFESSIONAL_CONTEXT_PATTERN =
  /\b(legal|contract|clause|sourcing|vendor|procurement|finance|risk|audit|compliance|clinical|medical|regulatory)\b/i;

const PROFESSIONAL_OWNER_PATTERN =
  /\b(Legal|Procurement|Finance|Risk|Compliance|Clinical|clinician|auditor|owner|decision authority|review|approve|approval|sign-?off)\b/i;

const EVIDENCE_CLAIM_PATTERN =
  /\b(loaded estate shows|confirmed in the data|we have loaded|the data shows|evidence confirms)\b/i;
const RAW_INTERNAL_ID_RE =
  /\b(?:[A-Z]{2,12}-[A-Z0-9]{2,12}-\d{2,6}|[A-Z]{2,12}-\d{3,6}|[A-Z]\d{3,4})\b/g;

export function applyProductTruthRuntimeGuard(
  text: string,
  context: ProductTruthRuntimeContext = {},
): ProductTruthRepairResult {
  const originalText = String(text ?? "");
  const violations: ProductTruthViolation[] = [];

  violations.push(...detectInternalErrors(originalText));
  violations.push(...detectOutOfScope(originalText, context));
  violations.push(...checkThirdPartyReplacementClaims(originalText));
  violations.push(...checkCapabilityClaims(originalText, context.tenantKey ?? null));
  if (context.groundingText !== undefined) {
    violations.push(
      ...checkTenantEvidenceClaims(originalText, context.groundingText),
    );
  }
  violations.push(...detectMovesModelViolations(originalText));
  violations.push(...detectEvidenceBoundaryViolations(originalText, context));
  violations.push(...detectProfessionalBoundaryViolations(originalText, context));

  const shouldBlock =
    violations.some((violation) =>
      ["internal_error_leak", "out_of_scope"].includes(violation.category),
    ) && !isAlreadyClientSafeBoundary(originalText);

  if (shouldBlock) {
    return {
      text: buildClientSafeFallback(context),
      violations,
      repaired: true,
      blocked: true,
    };
  }

  let repaired = originalText;
  repaired = repairInternalErrors(repaired, context);
  repaired = repairThirdPartyLanguage(repaired);
  repaired = repairUnsupportedCapabilities(repaired);
  repaired = repairMovesModel(repaired);
  repaired = appendEvidenceBoundaryIfNeeded(repaired, violations);
  repaired = appendProfessionalBoundaryIfNeeded(repaired, violations);
  repaired = normalizeWhitespace(repaired);

  return {
    text: repaired,
    violations,
    repaired: repaired !== originalText,
    blocked: false,
  };
}

export function sanitizeSuggestedQuestions(
  questions: readonly string[],
  context: ProductTruthRuntimeContext = {},
): { questions: string[]; violations: ProductTruthViolation[] } {
  const violations: ProductTruthViolation[] = [];
  const safeQuestions: string[] = [];
  for (const question of questions) {
    const result = applyProductTruthRuntimeGuard(question, context);
    const unsafe =
      result.blocked ||
      result.violations.some((violation) =>
        [
          "third_party_replacement_claim",
          "capability_overreach",
          "wrong_moves_model",
          "internal_error_leak",
          "out_of_scope",
        ].includes(violation.category),
      ) ||
      /\b(approve the phase|certify value automatically|compare all .*MSAs|classif(?:y|ies).*legacy.*active|replace .*(?:advisor|Gartner|Forrester|ISG|UpperEdge|McKinsey|Bain|Big Four))\b/i.test(
        question,
      );
    if (unsafe) {
      violations.push(
        ...result.violations,
        {
          category: "unsafe_suggested_question",
          id: "suggested-question-unsafe",
          matchedText: question,
          detail:
            "Suggested questions must not imply unsupported capabilities, replacement of advisors, workflow approval, or stale/cross-tenant facts.",
        },
      );
      continue;
    }
    safeQuestions.push(result.text);
  }

  if (safeQuestions.length > 0) {
    return { questions: dedupe(safeQuestions).slice(0, 3), violations };
  }

  return {
    questions: defaultSafeSuggestedQuestions(context),
    violations,
  };
}

export function buildClientSafeFallback(
  context: ProductTruthRuntimeContext = {},
): string {
  const tenant = context.tenantName ?? "this tenant";
  const surface = normalizedSurface(context.surface);
  if (context.query && OUT_OF_SCOPE_PATTERNS.some((pattern) => pattern.test(context.query ?? ""))) {
    return `${surfaceBoundaryLead(surface, tenant)} I can help with confirmed facts, evidence gaps, and the right AbarVa workflow for ${tenant}.`;
  }
  return "I can't safely answer that from the currently loaded evidence. I can show confirmed facts, likely gaps, and what would need to be loaded before making a client-ready claim.";
}

export function productTruthGroundingText(parts: readonly unknown[]): string {
  return parts
    .map((part) => {
      if (!part) return "";
      if (typeof part === "string") return part;
      try {
        return JSON.stringify(part);
      } catch {
        return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

function detectInternalErrors(text: string): ProductTruthViolation[] {
  return INTERNAL_ERROR_PATTERNS.flatMap((pattern) => {
    const matches = text.match(pattern) ?? [];
    return matches.map((match) => ({
      category: "internal_error_leak" as const,
      id: "internal-error-leak",
      matchedText: match,
      detail:
        "Internal guard names, routes, source IDs, or stack-style diagnostics must not reach client-visible answers.",
    }));
  });
}

function detectOutOfScope(
  text: string,
  context: ProductTruthRuntimeContext,
): ProductTruthViolation[] {
  const query = context.query ?? "";
  if (!OUT_OF_SCOPE_PATTERNS.some((pattern) => pattern.test(query))) return [];
  if (isAlreadyClientSafeBoundary(text)) return [];
  return [
    {
      category: "out_of_scope",
      id: "surface-scope-out-of-scope",
      matchedText: query,
      detail:
        "Out-of-scope general knowledge, coding, personal, medical, weather, or market-data questions should receive a short surface boundary response.",
    },
  ];
}

function detectMovesModelViolations(text: string): ProductTruthViolation[] {
  const match = text.match(OLD_MOVES_MODEL_PATTERN);
  if (!match) return [];
  return match.map((matchedText) => ({
    category: "wrong_moves_model" as const,
    id: "moves-old-phase-model",
    matchedText,
    detail:
      "Moves must use the canonical P0-P5 plus Tower Track Outcomes model. Old shorthand may only be mapped under the canonical model.",
  }));
}

function detectEvidenceBoundaryViolations(
  text: string,
  context: ProductTruthRuntimeContext,
): ProductTruthViolation[] {
  if (!EVIDENCE_CLAIM_PATTERN.test(text)) return [];
  if (/\b(loaded|evidence|source|cited|confirmed|missing|needs confirmation|not confirmed|inferred|assumption)\b/i.test(text)) {
    return [];
  }
  return [
    {
      category: "unsupported_tenant_claim",
      id: "tenant-evidence-boundary",
      matchedText: context.query ?? text.slice(0, 120),
      detail:
        "Tenant-specific claims that invoke loaded data or evidence must separate loaded facts, inference, missing evidence, and assumptions.",
    },
  ];
}

function detectProfessionalBoundaryViolations(
  text: string,
  context: ProductTruthRuntimeContext,
): ProductTruthViolation[] {
  const subject = `${context.query ?? ""}\n${text}`;
  if (!PROFESSIONAL_CONTEXT_PATTERN.test(subject)) return [];
  if (PROFESSIONAL_OWNER_PATTERN.test(text)) return [];
  return [
    {
      category: "professional_boundary_missing",
      id: "professional-owner-boundary",
      matchedText: context.query ?? text.slice(0, 120),
      detail:
        "Legal, sourcing, finance, risk, audit, compliance, and clinical answers must preserve accountable owner review and approval.",
    },
  ];
}

function repairInternalErrors(
  text: string,
  context: ProductTruthRuntimeContext,
): string {
  let repaired = text;
  for (const pattern of INTERNAL_ERROR_PATTERNS) {
    repaired = repaired.replace(pattern, buildClientSafeFallback(context));
  }
  return repaired;
}

function repairThirdPartyLanguage(text: string): string {
  let repaired = text;
  for (const [pattern, replacement] of THIRD_PARTY_REPAIR_PATTERNS) {
    repaired = repaired.replace(pattern, replacement);
  }
  return repaired;
}

function repairUnsupportedCapabilities(text: string): string {
  let repaired = text;
  for (const [pattern, replacement] of UNSAFE_CAPABILITY_REPAIR_PATTERNS) {
    repaired = repaired.replace(pattern, replacement);
  }
  return repaired;
}

function repairMovesModel(text: string): string {
  if (!OLD_MOVES_MODEL_PATTERN.test(text)) return text;
  return text.replace(
    OLD_MOVES_MODEL_PATTERN,
    `${CANONICAL_MOVES_PHASES.join("; ")}. Treat retired four-step shorthand as only a loose legacy summary under this P0-P5 plus Tower model`,
  );
}

function appendEvidenceBoundaryIfNeeded(
  text: string,
  violations: readonly ProductTruthViolation[],
): string {
  const needsBoundary = violations.some((violation) =>
    ["unsupported_tenant_claim", "capability_overreach"].includes(
      violation.category,
    ),
  );
  if (!needsBoundary) return text;
  if (/I (?:do not|don't) have loaded evidence|needs confirmation|not confirmed|client-ready claim/i.test(text)) {
    return text;
  }
  return `${text.trim()}\n\nEvidence boundary: treat any tenant-specific numbers, dates, owners, contract terms, control status, or product workflow claims as not client-ready unless they are loaded, cited, and reviewed by the accountable owner.`;
}

function appendProfessionalBoundaryIfNeeded(
  text: string,
  violations: readonly ProductTruthViolation[],
): string {
  if (!violations.some((violation) => violation.category === "professional_boundary_missing")) {
    return text;
  }
  if (/Legal|Procurement|Finance|Risk|Compliance|Clinical|auditor|decision owner|approval authority/i.test(text)) {
    return text;
  }
  return `${text.trim()}\n\nDecision boundary: AbarVa can structure evidence and prepare decision artifacts, but accountable Legal, Procurement, Finance, Risk, Compliance, clinical, or executive owners remain the review and approval authority.`;
}

function defaultSafeSuggestedQuestions(
  context: ProductTruthRuntimeContext,
): string[] {
  const surface = normalizedSurface(context.surface);
  if (surface === "moves") {
    return [
      "What evidence is needed for the next P0-P5 gate?",
      "Which owner should validate this before the phase advances?",
      "What should Tower measure if this becomes funded work?",
    ];
  }
  if (surface === "source") {
    return [
      "What vendor or contract evidence is confirmed versus missing?",
      "What should Legal and Procurement review before acting?",
      "How would this connect to Moves and Tower if it becomes a funded initiative?",
    ];
  }
  if (surface === "tower") {
    return [
      "Which value metrics are loaded versus still missing?",
      "What proof is needed before Finance treats this as realized value?",
      "Which owner should review the next funding gate?",
    ];
  }
  if (surface === "home") {
    return [
      "What facts are loaded versus inferred?",
      "Which evidence gaps matter most for a CXO decision?",
      "Which source rows should be reviewed before using this answer?",
    ];
  }
  return [
    "What can AbarVa confirm from loaded evidence?",
    "What evidence is missing before this becomes client-ready?",
    "Which surface should own the next workflow step?",
  ];
}

function surfaceBoundaryLead(surface: string, tenant: string): string {
  if (surface === "home") {
    return `That's outside Home. Home is focused on what is known about ${tenant}, where it came from, and what evidence is missing.`;
  }
  if (surface === "source") {
    return "That's outside Source. Source is focused on vendor, contract, sourcing, renewal, and commercial decisions using loaded evidence.";
  }
  if (surface === "moves") {
    return "That's outside this Move. Moves is focused on the active P0-P5 phase workflow, evidence gates, owners, and next-phase readiness.";
  }
  if (surface === "tower") {
    return "That's outside Tower. Tower is focused on value, metrics, adoption, funding gates, and outcome tracking.";
  }
  return `That's outside what I'm here for. I'm focused on AI strategy, bet-shaping, industry context, and transformation decisions for ${tenant}.`;
}

function isAlreadyClientSafeBoundary(text: string): boolean {
  return /outside what I'm here for|outside Home|outside Source|outside this Move|outside Tower|focused on|can't safely answer|cannot safely answer/i.test(text);
}

function normalizedSurface(surface: string | null | undefined): string {
  const value = String(surface ?? "intelligence").toLowerCase();
  if (value.includes("home")) return "home";
  if (value.includes("source")) return "source";
  if (value.includes("move")) return "moves";
  if (value.includes("tower")) return "tower";
  return "intelligence";
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(RAW_INTERNAL_ID_RE, "")
    .replace(/\s+\)/g, ")")
    .replace(/\(\s+/g, "(")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function dedupe(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

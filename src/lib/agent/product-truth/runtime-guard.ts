import { checkCapabilityClaims } from "./capability-claim-guard";
import { checkTenantEvidenceClaims } from "./tenant-evidence-claim-guard";
import { checkThirdPartyReplacementClaims } from "./third-party-replacement-guard";
import type {
  ProductTruthRepairResult,
  ProductTruthRuntimeContext,
  ProductTruthViolation,
  SuggestedQuestionSafetyClass,
} from "./types";

const CANONICAL_MOVES_PHASES = [
  "P0 Originate",
  "P1 Charter",
  "P2 Discover & Diagnose",
  "P3 Design Future State",
  "P4 Roadmap & Business Case",
  "P5 Approval & Mobilization",
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
  [
    /\breplaces?\s+(Gartner|Forrester|ISG|UpperEdge|McKinsey|Bain|BCG|Big Four|Deloitte|Accenture|PwC|EY|KPMG|legal counsel|procurement advisors?|credit desks?|analyst reports?|auditors?|FP&A|clinicians?)\b/gi,
    "supports work that can be reviewed alongside $1",
  ],
  [
    /\bno (?:longer )?needs?\s+(Gartner|Forrester|ISG|UpperEdge|McKinsey|Bain|BCG|Big Four|Deloitte|Accenture|PwC|EY|KPMG|legal counsel|procurement advisors?|credit desks?|analyst reports?|auditors?|FP&A|clinicians?)\b/gi,
    "can be used alongside $1 where that input is appropriate",
  ],
  [
    /\binstead of hiring consultants\b/gi,
    "alongside external advisory input where useful",
  ],
  [
    /\bconsultant-grade without consultant cost\b/gi,
    "structured, evidence-led decision support",
  ],
  [
    /\bexternal advisory input unnecessary\b/gi,
    "external advisory input easier to target and review",
  ],
];

const UNSAFE_CAPABILITY_REPAIR_PATTERNS: ReadonlyArray<
  readonly [RegExp, string]
> = [
  [
    /\bSource automatically (?:reads|ingests|compares|classifies|negotiates|routes?)\b/gi,
    "Source can support this workflow when the required contract evidence is loaded and reviewed",
  ],
  [
    /\bSource reads all MSAs and compares them against a clause library\b/gi,
    "A client-safe Source workflow would compare loaded executed agreements against approved clause positions for Legal and Procurement review",
  ],
  [
    /\bSource distinguishes legacy from active MSAs\b/gi,
    "Source can help identify agreement status when effective dates, amendments, and ownership fields are loaded",
  ],
  [
    /\bTower (?:automatically )?certifies?\b/gi,
    "Tower tracks evidence for Finance and outcome-owner certification; it does not certify by itself",
  ],
  [
    /\b(?:stand up|use|run|deploy|configure)\s+Tower\s+to\s+certif(?:y|ies)\b/gi,
    "use Tower to track evidence for Finance and outcome-owner certification",
  ],
  [
    /\bMoves (?:automatically )?approves?\b/gi,
    "Moves structures readiness for sponsor approval; it does not approve by itself",
  ],
  [
    /\bAbarVa (?:automatically )?approves?\b/gi,
    "AbarVa structures the decision path for accountable owners; it does not approve by itself",
  ],
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
const PUBLIC_SOURCE_CONTRACT_ID_RE = /\bCTR-\d{3,6}\b/;

export function applyProductTruthRuntimeGuard(
  text: string,
  context: ProductTruthRuntimeContext = {},
): ProductTruthRepairResult {
  const originalText = String(text ?? "");
  const violations: ProductTruthViolation[] = [];

  violations.push(...detectInternalErrors(originalText));
  violations.push(...detectOutOfScope(originalText, context));
  violations.push(...checkThirdPartyReplacementClaims(originalText));
  violations.push(
    ...checkCapabilityClaims(originalText, context.tenantKey ?? null),
  );
  if (context.groundingText !== undefined) {
    violations.push(
      ...checkTenantEvidenceClaims(originalText, context.groundingText),
    );
  }
  violations.push(...detectMovesModelViolations(originalText));
  violations.push(...detectEvidenceBoundaryViolations(originalText, context));
  violations.push(
    ...detectProfessionalBoundaryViolations(originalText, context),
  );

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
    const safetyClass = classifySuggestedQuestion(question);
    const result = applyProductTruthRuntimeGuard(question, context);
    const polishedQuestion = normalizeSuggestedQuestionText(result.text);
    const unsafe =
      safetyClass.startsWith("risky_") ||
      result.blocked ||
      !isPolishedSuggestedQuestion(polishedQuestion) ||
      result.violations.some((violation) =>
        [
          "third_party_replacement_claim",
          "capability_overreach",
          "wrong_moves_model",
          "internal_error_leak",
          "out_of_scope",
        ].includes(violation.category),
      ) ||
      /\b(approve the phase|certif(?:y|ies|ication|ied)\b|compare all .*MSAs|classif(?:y|ies).*legacy.*active|replace .*(?:advisor|Gartner|Forrester|ISG|UpperEdge|McKinsey|Bain|Big Four))\b/i.test(
        question,
      );
    if (unsafe) {
      violations.push(...result.violations, {
        category: "unsafe_suggested_question",
        id: `suggested-question-${safetyClass}`,
        matchedText: question,
        detail:
          "Suggested questions must not imply unsupported capabilities, replacement of advisors, workflow approval, or stale/cross-tenant facts.",
      });
      continue;
    }
    safeQuestions.push(polishedQuestion);
  }

  if (safeQuestions.length > 0) {
    return {
      questions: dedupe([
        ...safeQuestions,
        ...defaultSafeSuggestedQuestions(context),
      ]).slice(0, 3),
      violations,
    };
  }

  return {
    questions: defaultSafeSuggestedQuestions(context),
    violations,
  };
}

export function classifySuggestedQuestion(
  question: string,
): SuggestedQuestionSafetyClass {
  const q = question.toLowerCase();
  if (
    /\b(replace|instead of|no longer need|benchmark against gartner|compare to forrester|big four|mckinsey|bain|bcg|upperedge|isg)\b/.test(
      q,
    )
  ) {
    return "risky_external_claim";
  }
  if (
    /\b(source|tower|moves|abarva|home|intelligence)\b/.test(q) &&
    /\b(automatically|certify|approve|negotiate|read all|compare all|guarantee|prove savings|true[- ]?up|volume commitment)\b/.test(
      q,
    )
  ) {
    return "risky_unsupported_capability";
  }
  if (
    /\b(legal conclusion|legal advice|audit opinion|certify|approve|sign off|binding|negotiate clause|pressure vendor)\b/.test(
      q,
    )
  ) {
    return "risky_legal_or_contract_claim";
  }
  if (
    /\b(which|what|who|when|how many)\b/.test(q) &&
    /\b(exact|specific|confirmed|loaded|source|evidence|contract|vendor|owner|date|amount|budget|spend|savings)\b/.test(
      q,
    ) &&
    !/\b(what evidence|what is missing|loaded versus|confirmed versus|needed before|safe(?:ly)? assess)\b/.test(
      q,
    )
  ) {
    return "risky_unloaded_fact";
  }
  if (/\b(hand off|handoff|connect|moves|tower|source|home)\b/.test(q)) {
    return "safe_surface_transition";
  }
  if (/\b(next|owner|gate|p0|p1|p2|p3|p4|p5|track|measure)\b/.test(q)) {
    return "safe_next_action";
  }
  return "safe_deeper_evidence";
}

export function buildClientSafeFallback(
  context: ProductTruthRuntimeContext = {},
): string {
  const tenant = context.tenantName ?? "this tenant";
  const surface = normalizedSurface(context.surface);
  if (
    context.query &&
    OUT_OF_SCOPE_PATTERNS.some((pattern) => pattern.test(context.query ?? ""))
  ) {
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
  if (
    /\b(loaded|evidence|source|cited|confirmed|missing|needs confirmation|not confirmed|inferred|assumption)\b/i.test(
      text,
    )
  ) {
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
  if (
    /I (?:do not|don't) have loaded evidence|needs confirmation|not confirmed|client-ready claim/i.test(
      text,
    )
  ) {
    return text;
  }
  return `${text.trim()}\n\nEvidence boundary: treat any tenant-specific numbers, dates, owners, contract terms, control status, or product workflow claims as not client-ready unless they are loaded, cited, and reviewed by the accountable owner.`;
}

function appendProfessionalBoundaryIfNeeded(
  text: string,
  violations: readonly ProductTruthViolation[],
): string {
  if (
    !violations.some(
      (violation) => violation.category === "professional_boundary_missing",
    )
  ) {
    return text;
  }
  if (
    /Legal|Procurement|Finance|Risk|Compliance|Clinical|auditor|decision owner|approval authority/i.test(
      text,
    )
  ) {
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
  if (surface === "intelligence") {
    return intelligenceSafeSuggestedQuestions(context);
  }
  return [
    "What can AbarVa confirm from loaded evidence?",
    "What evidence is missing before this becomes client-ready?",
    "Which surface should own the next workflow step?",
  ];
}

function intelligenceSafeSuggestedQuestions(
  context: ProductTruthRuntimeContext,
): string[] {
  const queryText = context.query ?? "";
  const groundingText = context.groundingText ?? "";
  const tenant = displayTenantName(context);
  const queryCandidates = buildIntelligenceFollowupCandidates(
    queryText,
    tenant,
  );
  const groundingCandidates = buildIntelligenceFollowupCandidates(
    groundingText,
    tenant,
  );
  const focusCandidates = buildFocusedIntelligenceFallbacks(queryText, tenant);

  return dedupe([
    ...queryCandidates,
    ...focusCandidates,
    ...groundingCandidates.slice(0, Math.max(0, 3 - queryCandidates.length)),
    ...buildIntelligenceClosingCandidates(queryText, tenant),
  ])
    .map(normalizeSuggestedQuestionText)
    .filter(isPolishedSuggestedQuestion)
    .slice(0, 3);
}

function buildIntelligenceFollowupCandidates(
  text: string,
  tenant: string,
): string[] {
  const candidates: string[] = [];

  if (
    /\b(top ai|ai investment|ai investments|ai themes|ai trend|ai trends|use cases?|portfolio|rank|2x2|matrix|fund|funding|ready to fund|hold for evidence)\b/i.test(
      text,
    )
  ) {
    if (
      /\b(rank|2x2|matrix|value.*complexity|complexity.*value)\b/i.test(text)
    ) {
      candidates.push(
        `What evidence would move each ${tenant} use case on the value-complexity matrix?`,
        `Which use case has the clearest sponsor, data, and value proof?`,
      );
    } else if (
      /\b(ready to fund|fund now|hold for evidence|funding)\b/i.test(text)
    ) {
      candidates.push(
        `Which funded bet has enough owner, value, and readiness evidence today?`,
        `Which held bet needs one proof point before funding?`,
      );
    } else {
      candidates.push(
        `Which market AI pattern actually fits ${tenant}'s loaded constraints?`,
        `What tenant-specific evidence changes the generic AI trend ranking?`,
      );
    }
  }
  if (
    /\b(agent assist|contact.?center|call.?center|member service|customer service|service desk|case management|first.?contact)\b/i.test(
      text,
    )
  ) {
    candidates.push(
      `Which ${tenant} contact-center systems, data feeds, and escalation owners should we validate first?`,
    );
  }
  if (
    /\b(fraud|dispute|aci|backlog|transaction request|service request)\b/i.test(
      text,
    )
  ) {
    candidates.push(
      `What evidence would make the fraud or dispute backlog value case board-safe for ${tenant}?`,
    );
  }
  if (
    /\b(credit spreading|commercial credit|fair lending|sr 11-7|model validation|bedrock|claude)\b/i.test(
      text,
    )
  ) {
    candidates.push(
      `What model-risk and data-readiness gates must clear before ${tenant} scales credit automation?`,
    );
  }
  if (
    /\b(capital markets|research automation|databricks|measured value|\\$929|retired)\b/i.test(
      text,
    )
  ) {
    candidates.push(
      `Should ${tenant} recommit the proven capital-markets asset or retire it permanently?`,
    );
  }
  if (
    /\b(data readiness|data foundation|feature store|lakehouse|semantic layer|lineage|metric basis)\b/i.test(
      text,
    )
  ) {
    candidates.push(
      `Which data-readiness gaps block the next AI funding decision for ${tenant}?`,
      `What lineage, metric-basis, or ownership evidence should ${tenant} validate next?`,
    );
  }
  if (
    /\b(technology stack|tech stack|systems?|platform|mainframe|core|cloud|integration|infrastructure|application|data assets?)\b/i.test(
      text,
    )
  ) {
    candidates.push(
      `Which ${tenant} systems, data feeds, and integration owners constrain this AI bet most?`,
      `What current-state technology evidence should Home validate before funding?`,
    );
  }
  if (
    /\b(vendor|contract|renewal|source|platform expansion|sla|commercial|buy|spend)\b/i.test(
      text,
    )
  ) {
    candidates.push(
      `What vendor or contract evidence should Source test before ${tenant} commits spend?`,
      `Which SLA, pricing, or integration terms should ${tenant} confirm before vendor expansion?`,
    );
  }
  if (
    /\b(board|cfo|fund|funding|value|benefit|roi|measured value|baseline)\b/i.test(
      text,
    )
  ) {
    if (/\b(cfo|roi|baseline|measured value)\b/i.test(text)) {
      candidates.push(
        `Which value baseline should ${tenant}'s CFO accept or reject first?`,
      );
    } else if (/\b(board|board-safe)\b/i.test(text)) {
      candidates.push(
        `Which missing proof would change the board recommendation most?`,
      );
    } else {
      candidates.push(
        `Which value assumption needs proof before ${tenant} funds this?`,
      );
    }
  }
  if (/\b(moves|phase|p0|p1|p2|p3|p4|p5|tower)\b/i.test(text)) {
    candidates.push(
      `How should Moves and Tower turn this ${tenant} decision into owners, gates, and value tracking?`,
    );
  }
  if (
    /\b(risk|compliance|governance|control|audit|explainability|bsa|aml|sar|transaction monitoring)\b/i.test(
      text,
    )
  ) {
    candidates.push(
      `Which ${tenant} risk and compliance controls need evidence before production approval?`,
    );
  }
  if (
    /\b(industry|case stud|benchmark|real-world|real world|market pattern|peer)\b/i.test(
      text,
    )
  ) {
    candidates.push(
      `Which industry pattern should ${tenant} copy, adapt, or avoid based on its evidence?`,
      `What tenant evidence separates market benchmark from ${tenant} readiness?`,
    );
  }
  if (
    /\b(interview|priority|priorities|executive signal|business signal)\b/i.test(
      text,
    )
  ) {
    candidates.push(
      `Which ${tenant} interview signals should shape the AI priority order?`,
      `Which executive owner should confirm the priority before it enters Moves?`,
    );
  }
  if (
    /\b(not claim|cannot claim|what should.*not|evidence missing|missing evidence|unsupported)\b/i.test(
      text,
    )
  ) {
    candidates.push(
      `Which ${tenant} AI claims are safe, inferred, or not supportable yet?`,
      `What evidence would convert the biggest caveat into a client-ready claim?`,
    );
  }
  if (
    /\b(change your recommendation|what would change|wrong|assumption|sensitivity)\b/i.test(
      text,
    )
  ) {
    candidates.push(
      `Which assumption would most change ${tenant}'s AI priority ranking?`,
      `What new evidence should trigger a funding or sequencing change?`,
    );
  }

  return dedupe(candidates);
}

function buildFocusedIntelligenceFallbacks(
  text: string,
  tenant: string,
): string[] {
  const focus = inferIntelligenceFocus(text);
  if (!focus) return [];
  return [
    `What current-state evidence would most change the ${focus} recommendation?`,
    `Who should own the next ${focus} validation step at ${tenant}?`,
    `Which data, system, or process gap could block ${focus} execution?`,
  ];
}

function buildIntelligenceClosingCandidates(
  text: string,
  tenant: string,
): string[] {
  if (/\b(board|cfo|executive|funding|invest)\b/i.test(text)) {
    return [
      `What one-slide decision story should ${tenant} take to the CFO?`,
      "Which caveat must stay visible before this becomes board-ready?",
      "What would change this recommendation after the next evidence review?",
    ];
  }
  if (/\b(moves|tower|execute|execution|phase)\b/i.test(text)) {
    return [
      "Which P0-P5 gate should own the next evidence decision?",
      `What should Tower track if ${tenant} funds this work?`,
      "Which owner should accept the evidence boundary before execution?",
    ];
  }
  return [
    "What would change this recommendation after the next evidence review?",
    "Which owner should validate the highest-risk assumption?",
    `What should ${tenant} confirm before treating this as client-ready?`,
  ];
}

function inferIntelligenceFocus(text: string): string | null {
  const normalized = text.toLowerCase();
  if (
    /\b(agent assist|contact.?center|call.?center|member service|customer service)\b/.test(
      normalized,
    )
  ) {
    return "agent assist";
  }
  if (/\b(fraud|dispute|transaction monitoring|sar|aml)\b/.test(normalized)) {
    return "fraud operations";
  }
  if (
    /\b(credit spreading|commercial credit|fair lending|model validation)\b/.test(
      normalized,
    )
  ) {
    return "credit automation";
  }
  if (
    /\b(data readiness|data foundation|feature store|lakehouse|semantic layer|lineage|metric basis)\b/.test(
      normalized,
    )
  ) {
    return "data foundation";
  }
  if (
    /\b(technology stack|tech stack|systems?|platform|mainframe|cloud|integration|infrastructure)\b/.test(
      normalized,
    )
  ) {
    return "technology stack";
  }
  if (
    /\b(vendor|contract|renewal|source|sla|commercial|buy|spend)\b/.test(
      normalized,
    )
  ) {
    return "vendor decision";
  }
  if (
    /\b(governance|risk|control|audit|compliance|explainability)\b/.test(
      normalized,
    )
  ) {
    return "governance model";
  }
  if (
    /\b(industry|case stud|benchmark|real-world|real world|market pattern|peer)\b/.test(
      normalized,
    )
  ) {
    return "industry benchmark";
  }
  if (
    /\b(interview|priority|priorities|executive signal|business signal)\b/.test(
      normalized,
    )
  ) {
    return "interview priority";
  }
  if (/\b(rank|2x2|matrix|use cases?|portfolio)\b/.test(normalized)) {
    return "portfolio ranking";
  }
  if (
    /\b(top ai|ai investment|ai trend|ai trends|fund|funding)\b/.test(
      normalized,
    )
  ) {
    return "AI investment";
  }
  return null;
}

function normalizeSuggestedQuestionText(question: string): string {
  const withoutPolicyFooter = question.split(
    /\n\n(?:Evidence boundary|Decision boundary):/i,
  )[0];
  const firstQuestionMark = withoutPolicyFooter.indexOf("?");
  const firstQuestion =
    firstQuestionMark >= 0
      ? withoutPolicyFooter.slice(0, firstQuestionMark + 1)
      : withoutPolicyFooter;
  return firstQuestion
    .replace(/\s+/g, " ")
    .replace(/\s+([?.!,;:])/g, "$1")
    .trim();
}

function isPolishedSuggestedQuestion(question: string): boolean {
  if (!question.endsWith("?")) return false;
  if (question.length > 140) return false;
  if (question.length < 18) return false;
  return true;
}

function displayTenantName(context: ProductTruthRuntimeContext): string {
  const value = context.tenantName?.trim() || context.tenantKey?.trim();
  if (!value) return "this client";
  return value.length > 28 ? "this client" : value;
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
  return /outside what I'm here for|outside Home|outside Source|outside this Move|outside Tower|focused on|can't safely answer|cannot safely answer/i.test(
    text,
  );
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
    .replace(RAW_INTERNAL_ID_RE, (match) =>
      PUBLIC_SOURCE_CONTRACT_ID_RE.test(match) ? match : "",
    )
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

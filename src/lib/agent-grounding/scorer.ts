import {
  validateCxoAnswer,
  type CxoTenantKey,
} from "@/lib/agent/quality/cxo-answer-quality";
import type {
  AgentGroundingCapturedAnswer,
  AgentGroundingCase,
  AgentGroundingIssue,
  AgentGroundingScore,
  AgentGroundingTenant,
} from "./types";

const TENANT_DISPLAY_NAMES: Record<AgentGroundingTenant, string> = {
  "apex-retail": "Apex Retail Group",
  "meridian-health": "Meridian Health System",
  "skyharbor-air": "Airline Demo",
  "first-capital": "FS Demo",
};

const TENANT_TRUTH_ANCHORS: Record<AgentGroundingTenant, string[]> = {
  "apex-retail": ["retail", "commerce", "store", "merchandising", "Apex"],
  "meridian-health": [
    "Sacramento",
    "integrated health system",
    "30+ hospitals",
    "hospital",
    "clinical",
    "Meridian",
  ],
  "skyharbor-air": [
    "airline",
    "flight",
    "crew",
    "IROps",
    "mainframe",
    "SkyHarbor",
  ],
  "first-capital": [
    "bank",
    "lending",
    "model risk",
    "NIM",
    "examiner",
    "First Capital",
  ],
};

const FOREIGN_TENANT_TERMS: Record<AgentGroundingTenant, string[]> = {
  "apex-retail": [
    "Meridian",
    "SkyHarbor",
    "clinical care",
    "ambient AI",
    "Innovaccer",
    "flight operations",
    "mainframe extraction",
  ],
  "meridian-health": [
    "Apex Retail",
    "SkyHarbor",
    "store labor",
    "merchandising",
    "flight operations",
    "crew recovery",
  ],
  "skyharbor-air": [
    "Meridian",
    "Apex Retail",
    "clinical care",
    "ambient AI",
    "Innovaccer",
    "store labor",
    "merchandising",
  ],
  "first-capital": [
    "Apex Retail",
    "Meridian",
    "SkyHarbor",
    "clinical care",
    "store labor",
    "crew recovery",
  ],
};

const HONEST_REFUSAL =
  /\b(?:not in your scope|outside your scope|cannot retrieve|can't retrieve|no such initiative|not available in your tenant|tenant-bound|wrong tenant)\b/i;

const DATA_GAP =
  /\b(?:not loaded|missing|not available|no source|data gap|needs to be loaded|cannot verify|not yet in the corpus|not in the context layer)\b/i;

const CORPUS_CONTEXT =
  /\b(?:corpus|industry context|pattern|failure mode|benchmark|peer|archetype|market|vendor)\b/i;

const EVIDENCE_CUE =
  /\b(?:source|evidence|ledger|as of|citation|cited|from your|context layer|Tower|corpus)\b/i;

const ACTION_CUE =
  /\b(?:next step|next move|recommend|approve|pause|open|assign|validate|escalate|decide|load|fix|route)\b/i;

const RAW_INTERNAL_ID_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "signal id", re: /\bsignal:[a-z0-9:_-]{8,}\b/i },
  {
    name: "uuid",
    re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  },
  {
    name: "database field",
    re: /\b(?:client_id|tenant_id|user_id|engagement_id|initiative_id|measured_value_usd|committed_annual_usd|vendor_contracts|it_financials)\b/i,
  },
  { name: "Tower index token", re: /\bTWR-[A-Z0-9-]+\b/ },
  { name: "use-case token", re: /\bUC-[A-Z0-9-]+\b/ },
  { name: "SkyHarbor initiative token", re: /\bSHA-\d{3}\b/ },
];

const IMPLEMENTATION_LEAK_PATTERNS = [
  /\bquery_[a-z0-9_]+\b/i,
  /\btool\s+that\s+does\s+not\s+exist\b/i,
  /\b(routeType|fallbackReason|atlasMode|x-atlas-mode)\s*=?/i,
  /\bstack trace\b/i,
  /\bTypeError|ReferenceError|Unhandled Runtime Error\b/,
];

const FAKE_PRECISION =
  /(?:\b\d+(?:\.\d+)?%|\$[0-9][0-9,]*(?:\.\d+)?(?:M|K|B)?\b|\b\d+(?:\.\d+)?x\b)/i;

export function scoreGroundingCase(
  testCase: AgentGroundingCase,
  captured: AgentGroundingCapturedAnswer | undefined,
): AgentGroundingScore {
  const answer = normalize(captured?.answer ?? "");
  const issues: AgentGroundingIssue[] = [];
  const mode = captured?.mode ?? "unknown";
  const status = captured?.status ?? null;
  const htmlFallback = isHtmlFallback(answer);
  const transportOk =
    !captured?.error &&
    !htmlFallback &&
    (status === null || (status >= 200 && status < 300));

  if (!transportOk) {
    issues.push({
      severity: "P0",
      code: "transport_failure",
      message:
        captured?.error ??
        (htmlFallback
          ? "HTML page returned instead of agent answer."
          : `HTTP ${status}`),
    });
  }
  if (mode === "fallback") {
    issues.push({
      severity: "P0",
      code: "fallback_mode",
      message: "Answer was served in fallback mode.",
    });
  }
  if (!answer) {
    issues.push({
      severity: "P0",
      code: "missing_answer",
      message: "Answer is empty.",
    });
  }

  if (!transportOk || !answer) {
    return buildScore(testCase, captured, answer, issues);
  }

  for (const term of missingTerms(answer, testCase.expected.requiredTerms)) {
    issues.push({
      severity: "P2",
      code: "missing_required_term",
      message: `Missing required term: ${term}`,
      evidence: term,
    });
  }

  for (const term of foundTerms(answer, testCase.expected.forbiddenTerms)) {
    issues.push({
      severity: "P0",
      code: "forbidden_term",
      message: `Forbidden term appeared: ${term}`,
      evidence: term,
    });
  }

  if (
    testCase.expected.requiresTenantFacts &&
    !hasAny(answer, TENANT_TRUTH_ANCHORS[testCase.tenant])
  ) {
    issues.push({
      severity: "P1",
      code: "tenant_truth_failure",
      message: `Answer does not show recognizable ${TENANT_DISPLAY_NAMES[testCase.tenant]} grounding.`,
    });
  }

  if (!testCase.expected.requiresHonestRefusal) {
    for (const term of foundTerms(
      answer,
      FOREIGN_TENANT_TERMS[testCase.tenant],
    )) {
      issues.push({
        severity: "P0",
        code: "tenant_leak",
        message: `Answer appears to reference another tenant while scoped to ${TENANT_DISPLAY_NAMES[testCase.tenant]}.`,
        evidence: term,
      });
    }
  }

  if (testCase.expected.requiresCorpusContext && !CORPUS_CONTEXT.test(answer)) {
    issues.push({
      severity: "P1",
      code: "missing_corpus_context",
      message: "Answer does not show industry/corpus context.",
    });
  }

  if (testCase.expected.requiresEvidence && !EVIDENCE_CUE.test(answer)) {
    issues.push({
      severity: "P1",
      code: "missing_evidence",
      message: "Answer does not cite or name its evidence basis.",
    });
  }

  if (testCase.expected.requiresHonestRefusal && !HONEST_REFUSAL.test(answer)) {
    issues.push({
      severity: "P0",
      code: "missing_honest_refusal",
      message: "Cross-tenant or unsupported prompt was not clearly refused.",
    });
  }

  if (testCase.expected.requiresDataGap && !DATA_GAP.test(answer)) {
    issues.push({
      severity: "P1",
      code: "missing_data_gap",
      message: "Answer should name the missing data or unloaded context gap.",
    });
  }

  for (const pattern of RAW_INTERNAL_ID_PATTERNS) {
    const evidence = firstMatch(answer, pattern.re);
    if (evidence) {
      issues.push({
        severity: "P1",
        code: "raw_internal_id",
        message: `Visible answer exposes raw ${pattern.name}.`,
        evidence,
      });
    }
  }

  for (const pattern of IMPLEMENTATION_LEAK_PATTERNS) {
    const evidence = firstMatch(answer, pattern);
    if (evidence) {
      issues.push({
        severity: "P1",
        code: "implementation_leak",
        message: "Visible answer exposes implementation details.",
        evidence,
      });
    }
  }

  if (FAKE_PRECISION.test(answer) && !EVIDENCE_CUE.test(answer)) {
    issues.push({
      severity: "P1",
      code: "fake_precision",
      message: "Precise number appears without an evidence/source cue.",
      evidence: firstMatch(answer, FAKE_PRECISION) ?? undefined,
    });
  }

  if (countMatches(answer, ACTION_CUE) < testCase.expected.minActionCues) {
    issues.push({
      severity: "P2",
      code: "weak_actionability",
      message: "Answer lacks a concrete next action.",
    });
  }

  const cxoQuality = validateCxoAnswer({
    text: answer,
    tenant: toCxoTenantKey(testCase.tenant)
      ? {
          tenantKey: testCase.tenant as CxoTenantKey,
          tenantDisplayName: TENANT_DISPLAY_NAMES[testCase.tenant],
        }
      : undefined,
    expectedActionable: testCase.expected.minActionCues > 0,
    allowCrossTenantDenial: testCase.expected.requiresHonestRefusal,
    allowQuotedUserPrompt: testCase.prompt,
  });
  for (const issue of cxoQuality.issues) {
    issues.push({
      severity:
        issue.severity === "high"
          ? "P1"
          : issue.severity === "medium"
            ? "P2"
            : "P3",
      code: "cxo_quality",
      message: issue.message,
      evidence: issue.evidence,
    });
  }

  return buildScore(testCase, captured, answer, issues);
}

function buildScore(
  testCase: AgentGroundingCase,
  captured: AgentGroundingCapturedAnswer | undefined,
  answer: string,
  issues: AgentGroundingIssue[],
): AgentGroundingScore {
  const score = Math.max(
    0,
    100 - issues.reduce((sum, issue) => sum + penalty(issue.severity), 0),
  );
  return {
    id: testCase.id,
    agent: testCase.agent,
    tenant: testCase.tenant,
    persona: testCase.persona,
    category: testCase.category,
    surface: testCase.surface,
    prompt: testCase.prompt,
    answer,
    status: captured?.status ?? null,
    mode: captured?.mode ?? "unknown",
    latencyMs: captured?.latencyMs ?? null,
    score,
    passed:
      score >= 85 &&
      !issues.some(
        (issue) => issue.severity === "P0" || issue.severity === "P1",
      ),
    issues,
  };
}

function penalty(severity: AgentGroundingIssue["severity"]): number {
  if (severity === "P0") return 100;
  if (severity === "P1") return 35;
  if (severity === "P2") return 15;
  return 5;
}

function toCxoTenantKey(
  tenant: AgentGroundingTenant,
): CxoTenantKey | undefined {
  if (
    tenant === "apex-retail" ||
    tenant === "meridian-health" ||
    tenant === "skyharbor-air"
  ) {
    return tenant;
  }
  return undefined;
}

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function isHtmlFallback(text: string): boolean {
  const trimmed = text.trimStart().slice(0, 200).toLocaleLowerCase();
  return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
}

function lower(text: string): string {
  return normalize(text).toLocaleLowerCase();
}

function missingTerms(answer: string, terms: string[]): string[] {
  return terms.filter((term) => !hasTerm(answer, term));
}

function foundTerms(answer: string, terms: string[]): string[] {
  return terms.filter((term) => hasTerm(answer, term));
}

function hasAny(answer: string, terms: string[]): boolean {
  return foundTerms(answer, terms).length > 0;
}

function hasTerm(answer: string, term: string): boolean {
  const normalizedAnswer = lower(answer);
  const normalizedTerm = lower(term);
  if (/^[a-z0-9_-]+$/i.test(normalizedTerm)) {
    return new RegExp(
      `(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}($|[^a-z0-9])`,
      "i",
    ).test(normalizedAnswer);
  }
  return normalizedAnswer.includes(normalizedTerm);
}

function firstMatch(text: string, re: RegExp): string | null {
  return text.match(re)?.[0] ?? null;
}

function countMatches(text: string, re: RegExp): number {
  return (
    text.match(
      new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`),
    )?.length ?? 0
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

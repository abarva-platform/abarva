// Heuristic major-claim detection. Splits the answer into sentences and
// classifies each against the claim taxonomy. Intentionally conservative and
// text-based (no model) so it runs in CI/lab; the LLM judge (PR-5) refines.

import type { ClaimType, DetectedClaim } from './types';

const PATTERNS: Array<{ type: ClaimType; re: RegExp }> = [
  // Value / money claims: $ amounts, "save", "ROI", "value of".
  {
    type: 'value_claim',
    re: /(\$\s?\d|\b\d+(\.\d+)?\s?(m|bn|k|million|billion|thousand)\b|\bROI\b|\bsav(e|ing|ings)\b|\bvalue (of|pool)\b|\bpayback\b)/i,
  },
  // KPI / outcome with a number or %: "reduce X by 30%", "improve", "increase".
  {
    type: 'kpi_outcome_claim',
    re: /\b(\d+(\.\d+)?\s?%|reduc\w+|improv\w+|increas\w+|decreas\w+|uplift|cut\b).{0,40}\b(by|to|from)\b/i,
  },
  // System / vendor named claims.
  {
    type: 'system_vendor_claim',
    re: /\b(uses?|runs? on|deployed|implemented|vendor|licensed|contract with|powered by)\b.{0,40}\b([A-Z][a-zA-Z]+|SAP|Oracle|Salesforce|Workday|ServiceNow|Snowflake|Databricks|Epic|Cerner)\b/,
  },
  // Technology stack.
  {
    type: 'technology_stack_claim',
    re: /\b(stack|platform|database|data ?warehouse|lakehouse|kubernetes|cloud|Azure|AWS|GCP|on-?prem|ERP|CRM|middleware|integration layer)\b/i,
  },
  // Architecture.
  {
    type: 'architecture_claim',
    re: /\b(architecture|microservices|monolith|event-driven|api gateway|service mesh|topology|data flow|integration pattern)\b/i,
  },
  // Company scale: revenue, employees, sites, geographies.
  {
    type: 'company_scale_claim',
    re: /\b(\d[\d,\.]*\s?(employees|stores|sites|locations|branches|hospitals|aircraft|flights|countries|markets)|revenue of|annual revenue|headcount)\b/i,
  },
  // Leadership / org.
  {
    type: 'leadership_org_claim',
    re: /\b(CEO|CFO|CIO|CTO|CISO|COO|CDO|CDAO|chief [a-z]+ officer|reports to|led by|head of|org structure|operating model)\b/,
  },
  // Sourcing recommendation.
  {
    type: 'sourcing_recommendation',
    re: /\b(should (use|select|procure|source|buy|adopt)|recommend\w*\b.{0,30}\b(vendor|tool|platform|partner)|go with|shortlist)\b/i,
  },
  // Risk / failure mode.
  {
    type: 'risk_failure_mode_claim',
    re: /\b(risk|failure mode|pitfall|could fail|downside|caveat|guard ?rail|trade-?off|mitigat\w+)\b/i,
  },
  // Next action.
  {
    type: 'next_action_recommendation',
    re: /\b(next step|should (start|pilot|run|launch|begin|kick off)|recommend\w*\b.{0,30}\b(pilot|workshop|assessment)|first,? )\b/i,
  },
];

/** Split into sentence-ish units, keeping it dependency-free. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Detect the major claims in an answer. A sentence yields at most one claim,
 * classified by the first matching (highest-priority) pattern.
 */
export function detectClaims(answerText: string): DetectedClaim[] {
  const claims: DetectedClaim[] = [];
  for (const sentence of splitSentences(answerText)) {
    for (const { type, re } of PATTERNS) {
      if (re.test(sentence)) {
        claims.push({ text: sentence, type });
        break;
      }
    }
  }
  return claims;
}

const ASSUMPTION_MARKERS =
  /\b(assum\w+|roughly|approximately|typically|in (my|our) judgment|judgment, not|illustrative|order of magnitude|ballpark|if .* is loaded|once .* is loaded|do(n'?t| not) have|not (yet )?loaded|cannot confirm|can'?t confirm|no (direct )?(data|evidence))\b/i;

/** Whether a sentence carries an explicit assumption / missing-data caveat. */
export function hasAssumptionMarker(sentence: string): boolean {
  return ASSUMPTION_MARKERS.test(sentence);
}

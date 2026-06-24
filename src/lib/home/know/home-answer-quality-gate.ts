import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";

const FALSE_ABSENCE_RE =
  /\b(cannot be characterized|cannot be identified|cannot characterize|cannot identify)\b/i;
const BAD_LEAD_RE =
  /^\s*((i|home|we)\s+found|there\s+(are|were)|loaded)\b|^\s*\d[\d,]*\s+(rows|records)\b/i;
const MISSING_SUPPORT_LEAD_RE = /^\s*missing source support\b/i;
const RAW_ID_RE =
  /\b[A-Z]{2,16}-[A-Z0-9]{2,24}-\d{2,8}\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const DEBUG_RE =
  /\b(Current-state read|Evidence points|Evidence and exhibits|home_know_|semantic packet|composer trace)\b|^\s*(Read|Evidence):/i;
const CONTRACT_OWNER_RE = /\bnamed contract owner\b/i;
const ORG_QUESTION_RE =
  /\b(it|technology|cio|business|organi[sz]ed|organization|leader|leaders|portfolio|portfolios|owner|ownership)\b/i;

export type HomeAnswerQualityViolation =
  | "false_absence"
  | "row_count_lead"
  | "missing_support_lead"
  | "raw_id"
  | "debug_language"
  | "irrelevant_contract_owner";

export function homeAnswerQualityViolations(
  response: Pick<
    HomeKnowResponse,
    "question" | "prose" | "facts" | "tables" | "intent"
  >,
): HomeAnswerQualityViolation[] {
  const violations: HomeAnswerQualityViolation[] = [];
  const lead = firstParagraph(response.prose);
  const hasLoadedContext =
    response.facts.length > 0 ||
    response.tables.some((table) => table.rows.length > 0);

  if (
    response.intent !== "decision_handoff" &&
    hasLoadedContext &&
    FALSE_ABSENCE_RE.test(response.prose)
  ) {
    violations.push("false_absence");
  }
  if (BAD_LEAD_RE.test(lead) || /\brows?\b/i.test(lead)) {
    violations.push("row_count_lead");
  }
  if (MISSING_SUPPORT_LEAD_RE.test(lead)) {
    violations.push("missing_support_lead");
  }
  if (RAW_ID_RE.test(response.prose)) {
    violations.push("raw_id");
  }
  if (DEBUG_RE.test(response.prose)) {
    violations.push("debug_language");
  }
  if (ORG_QUESTION_RE.test(response.question) && CONTRACT_OWNER_RE.test(response.prose)) {
    violations.push("irrelevant_contract_owner");
  }
  return violations;
}

export function repairHomeAnswerQuality(
  response: HomeKnowResponse,
): HomeKnowResponse {
  const violations = homeAnswerQualityViolations(response);
  if (violations.length === 0) return response;
  const canUseOrgRepair =
    response.intent !== "decision_handoff" &&
    ORG_QUESTION_RE.test(response.question) &&
    response.tables.some((table) =>
      ["home-business-functions", "home-it-org"].includes(table.id),
    );
  if (!canUseOrgRepair) return response;

  return {
    ...response,
    prose:
      "The loaded Home context supports a portfolio-led view of IT and business organization. Technology accountability is visible by role, domain, and portfolio where the tenant supplied those fields, while named individual leaders under the CIO are not loaded. That means aVa can explain the operating model and role-level accountability, but should not invent a people-org chart until leader-name data is added.",
    safety: {
      ...response.safety,
      unsupportedClaimsRemoved:
        response.safety.unsupportedClaimsRemoved + violations.length,
    },
  };
}

function firstParagraph(text: string): string {
  return text.split(/\n\s*\n/)[0] ?? text;
}

import { buildValidatedAgentContextBundle } from "@/lib/governance/agent-context-bundle";
import { fromAskSource } from "@/lib/governance/context-bundle-adapters";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import type { AskSource } from "./types";

/** Existing adapters retain their conservative readiness floor; never promote it. */
export function prepareExecutiveContext(
  sources: AskSource[],
  tenantKey: string | null | undefined,
  tenantId: string | null | undefined,
  conversation?: string,
) {
  const candidates = [...sources];
  if (
    conversation?.trim() &&
    !candidates.some((s) => s.id === "intelligence-conversation-context")
  ) {
    candidates.push({
      id: "intelligence-conversation-context",
      type: "SURFACE",
      name: "Conversation context; prior advisory statements are not independent evidence",
      detail: conversation,
    });
  }
  const key = canonicalTenantKey(tenantKey) ?? "unknown";
  const governed = candidates.map((s) =>
    fromAskSource(s, key, tenantId ?? null),
  );
  const bundle = buildValidatedAgentContextBundle(governed);
  const usable = new Set(bundle.usable);
  return {
    sources: candidates.filter((_s, i) => usable.has(governed[i])),
    bundle,
    decisionGuard:
      bundle.agentReadyCount === 0
        ? `EVIDENCE RULE FOR THIS ANSWER: Every supplied company source is provisional. These rules bind EVERY visible field: prose, titles, matrix labels and rationales, table cells, notes and follow-ups. Use recorded qualitative themes as hypotheses for validation. Source wording such as live, active, deployed, implemented, confirmed, evaluation or exposure is not verification. Qualify company status as recorded; do not repeat it as established fact. Do not output any company inventory totals, counts, percentages, coverage, financial values or relationship confirmation, even when a supplied source contains them: no verified readiness and counting basis are available in this bundle. User-requested option counts and proposed relative plan milestones are allowed; they are not company metrics. Matrix reasons must name a qualitative business hypothesis, never an inventory total or adoption status. A recorded risk is a validation question, not a confirmed breach or active legal exposure. No rollout, expansion, economic approval or confirmed graph is supported. Recommend bounded validation and proposed accountable roles. Without supplied dated industry research, discuss advisory themes and questions to test, never current mandates, regulations or deadlines.
GOOD phrasing: "Recorded interface risks warrant validation before expansion." BAD phrasing: "Active compliance exposure requires remediation."
GOOD phrasing: "The recorded AI portfolio suggests hypotheses, not proven outcomes." BAD phrasing: "Live AI programs justify scaling."
GOOD phrasing: "Test interoperability readiness; the current regulatory position needs dated research." BAD phrasing: "A mandatory deadline requires compliance now."
Draft three short sentences totaling 40-45 prose words. Opening target 20-25 words; context target 5-8; final validation gate target 10-12. Never exceed 60 prose words. Each matrix rationale must also describe a provisional business hypothesis or recorded constraint, not an unsupported deployment, performance or exposure finding.`
        : "",
    prompt: `CONTEXT GOVERNANCE: ${bundle.usable.length} usable sources; ${bundle.blocked.length} blocked sources excluded; ${bundle.agentReadyCount} sources have fully verified agent readiness. Legacy adapters retain not_reviewed / committed_not_indexed status. Treat their evidence as provisional, with its supplied source basis and confidence; do not certify index readiness, approvals, confirmed metrics or confirmed relationships from an unverified source. Missing confidence or provenance requires validation before a consequential recommendation. Conversation context supports continuity only and is not independent company evidence.${bundle.agentReadyCount === 0 ? " NONE of the supplied sources has fully verified readiness. Describe company claims as recorded or provisional, including claims the source itself calls live, active, implemented or confirmed. Do not assert verified deployment, measured performance, investment readiness, current legal exposure or confirmed dependency edges. If the user requires confirmed relationships, explain that verification is missing; do not emit a confirmed graph. Qualitative advisory matrices remain possible when clearly qualified." : ""}`,
  };
}

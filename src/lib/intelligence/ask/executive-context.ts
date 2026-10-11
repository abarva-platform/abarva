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
    prompt: `CONTEXT GOVERNANCE: ${bundle.usable.length} usable sources; ${bundle.blocked.length} blocked sources excluded; ${bundle.agentReadyCount} sources have fully verified agent readiness. Legacy adapters retain not_reviewed / committed_not_indexed status. Treat their evidence as provisional, with its supplied source basis and confidence; do not certify index readiness, approvals, confirmed metrics or confirmed relationships from an unverified source. Missing confidence or provenance requires validation before a consequential recommendation. Conversation context supports continuity only and is not independent company evidence.${bundle.agentReadyCount === 0 ? " NONE of the supplied sources has fully verified readiness. Describe company claims as recorded or provisional, including claims the source itself calls live, active, implemented or confirmed. Do not assert verified deployment, measured performance, investment readiness, current legal exposure or confirmed dependency edges. If the user requires confirmed relationships, explain that verification is missing; do not emit a confirmed graph. Qualitative advisory matrices remain possible when clearly qualified." : ""}`,
  };
}

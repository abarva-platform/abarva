"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { StateBanner } from "../state/StateBanner";

/**
 * Cross-cutting condition banner. The prototype has a manual "condition/demo
 * selector" dropdown (normal / stale-baseline / partial / uncertified /
 * restricted / models-off) for demoing states on cue. Matrix row 62's own
 * render gate rules that out for production: "Each condition's banner
 * computes from real object state per page load, never from a hardcoded
 * selector."
 *
 * So this component intentionally has NO manual selector. It shows exactly
 * one condition today -- models-disabled -- because that is the one
 * cross-cutting condition this build can compute honestly right now
 * (ANTHROPIC_API_KEY presence, a real deterministic config read). The other
 * three notices from the matrix (stale-baseline diff, uncertified-gap-view,
 * evidence-restricted) are per-section concerns already handled by
 * GatedSection/StateBanner at the section that owns them; a fabricated
 * top-of-page "41 new facts published" or "gap view not certified" banner
 * would itself violate the render-gate rule it exists to enforce, since no
 * real baseline-diff or certification-state mechanism exists yet. See
 * KNOWLEDGE_UI_IMPLEMENTATION_PLAN.md Phase 5 for what unblocks those.
 */
export function ConditionBanner() {
  const { provider, providerCtx } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.getAvaProviderStatus(providerCtx),
    [provider, providerCtx],
  );

  if (!envelope?.data || envelope.data.modelProviderConfigured) return null;

  return (
    <div className="px-6 pt-3">
      <StateBanner
        compact
        decision={{
          tone: "neutral",
          title: "Models off",
          body: "All model providers are disabled. Everything on this page except aVa's reasoning still works from governed knowledge and deterministic views.",
        }}
      />
    </div>
  );
}

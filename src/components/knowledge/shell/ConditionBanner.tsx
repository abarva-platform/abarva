"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { StateBanner } from "../state/StateBanner";

/**
 * Cross-cutting condition banner. The prototype has a manual "condition/demo
 * selector" dropdown (normal / stale-baseline / partial / uncertified /
 * restricted / models-off) for demoing states on cue. Per the render-gate
 * discipline: "Each condition's banner computes from real object state per
 * page load, never from a hardcoded selector."
 *
 * So this component intentionally has NO manual selector. It shows exactly
 * one condition today -- models-disabled -- because that is the one
 * cross-cutting condition this build can compute honestly right now, and it
 * reads it straight off the real runtime (`runtime.modelsEnabled`, computed
 * server-side by the consumption-client factory from ANTHROPIC_API_KEY
 * presence / scenario config) rather than through any provider round-trip --
 * per the reconciliation matrix's `getAvaProviderStatus` row, the real
 * runtime already exposes this properly. The other three notices from the
 * original binding matrix (stale-baseline diff, uncertified-gap-view,
 * evidence-restricted) are per-section concerns already handled by
 * GatedSection/StateBanner at the section that owns them.
 */
export function ConditionBanner() {
  const { runtime } = useKnowledgeApp();

  if (runtime.modelsEnabled) return null;

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

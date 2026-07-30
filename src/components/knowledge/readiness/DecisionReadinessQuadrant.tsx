"use client";

import { StateBanner } from "../state/StateBanner";
import { readinessPresentation } from "../state/gate-utils";

/**
 * "Value at stake" has no home in Knowledge's contract by design: per
 * AGENTS.md, Tower read models/metric tables own spend/value/ROI
 * calculations, and Knowledge/graph must never calculate them (see the
 * reconciliation matrix's `listDecisionReadinessQuadrant` row:
 * MISSING_PROVIDER_QUERY). This component stays wired into Evidence & gaps
 * (a prior session correctly restored its mount point after finding it
 * orphaned) but renders its honest PROJECTION_UNAVAILABLE state rather than
 * plotting an estimated value-at-stake position -- building this properly
 * means a governed Tower-to-Knowledge module-handoff reference, which is
 * later-PR scope, not an assembler computation invented here.
 */
export function DecisionReadinessQuadrant() {
  const presentation = readinessPresentation("PROJECTION_UNAVAILABLE");
  return (
    <StateBanner
      decision={{
        tone: presentation.tone,
        title: `Decision-readiness quadrant -- ${presentation.title.toLowerCase()}`,
        body: "Value-at-stake belongs to Tower's governed metric tables, not a Knowledge computation. This view is pending a governed Tower-to-Knowledge module-handoff reference.",
      }}
    />
  );
}

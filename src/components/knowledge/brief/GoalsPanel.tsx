"use client";

import { StateBanner } from "../state/StateBanner";
import { readinessPresentation } from "../state/gate-utils";

/**
 * `Goal` is not yet a ratified canonical object type in the consumption
 * contract (see the reconciliation matrix's `listGoals` row: no goal_v1
 * projection exists anywhere in the registry). The assembler deliberately
 * does not expose a `getGoals` method, and per the migration guide this
 * section renders its honest PROJECTION_UNAVAILABLE state directly rather
 * than silently reusing `getTopOpportunities` as a stand-in for Goals --
 * Opportunities and Goals are not the same object, and presenting one as the
 * other would misrepresent what is actually governed.
 */
export function GoalsPanel() {
  const presentation = readinessPresentation("PROJECTION_UNAVAILABLE");
  return (
    <StateBanner
      decision={{
        tone: presentation.tone,
        title: `Goals -- ${presentation.title.toLowerCase()}`,
        body: "Goal is not yet a ratified canonical object type in the consumption contract. Not synthesized from top opportunities or program titles in the meantime.",
      }}
    />
  );
}

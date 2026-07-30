"use client";

import { StateBanner } from "../state/StateBanner";
import { readinessPresentation } from "../state/gate-utils";

/**
 * The real contract has no ratified Contradiction object (governance.
 * contradiction is not yet ratified -- see the reconciliation matrix's
 * `listContradictions` row). The real contract signals conflict only
 * coarsely (`availabilityState: "conflicting"` + a `conflict_detected`
 * warning), never as a paired statementA/statementB object with named
 * sources -- so a rich contradiction list would have to be invented. The
 * assembler exposes no method for this; this section renders its honest
 * PROJECTION_UNAVAILABLE state directly rather than diffing two tables
 * client-side without a recorded owner.
 */
export function ContradictionsList() {
  const presentation = readinessPresentation("PROJECTION_UNAVAILABLE");
  return (
    <StateBanner
      decision={{
        tone: presentation.tone,
        title: `Contradictions -- ${presentation.title.toLowerCase()}`,
        body: "The Contradiction object is not yet a ratified canonical type. Never inferred client-side by diffing two tables without a recorded owner.",
      }}
    />
  );
}

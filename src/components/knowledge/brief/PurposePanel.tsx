"use client";

import { StateBanner } from "../state/StateBanner";
import { readinessPresentation } from "../state/gate-utils";

/**
 * "Operating priority" / "stated ambition" statement types have no home in
 * the real consumption contract's 14 registered projections --
 * `executive_perspective_v1` is quote-shaped (LeadershipPerspectiveV1), not
 * statement-shaped, and no dedicated purpose-statement projection exists.
 * The assembler exposes no method for this; per the migration guide this
 * renders its honest PROJECTION_UNAVAILABLE state directly rather than
 * inventing a composition that has no real backing.
 */
export function PurposePanel() {
  const presentation = readinessPresentation("PROJECTION_UNAVAILABLE");
  return (
    <StateBanner
      decision={{
        tone: presentation.tone,
        title: `Purpose and priorities -- ${presentation.title.toLowerCase()}`,
        body: "No purpose-statement projection exists in the consumption contract yet. executive_perspective_v1 is quote-shaped, not statement-shaped, and cannot honestly stand in for it.",
      }}
    />
  );
}

import { GovernedStatePanel } from "../state/GovernedStatePanel";

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
  return (
    <GovernedStatePanel
      title="Purpose and priorities not yet published"
      body="No approved purpose-statement projection exists in the consumption contract yet. Leadership quotes remain available only where they are represented as quotes; they are not promoted into an enterprise purpose statement here."
      detail="Required publication: purpose statement or priority statement projection with accepted evidence."
    />
  );
}

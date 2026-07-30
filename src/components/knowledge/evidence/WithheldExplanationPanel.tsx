import { AVAILABILITY_STATES } from "@/lib/knowledge/providers/types";
import { gateEnvelope } from "../state/gate-utils";
import { StateBanner } from "../state/StateBanner";

/**
 * This panel's whole job is to BE the safe empty-state explanation for every
 * other component on the page (matrix row: "Withheld / not-measured /
 * not-loaded / not-assessed explanation panel"). It reads from the same
 * gateEnvelope() logic every other component uses to decide what to show --
 * there is exactly one place in this codebase that defines what each
 * availability state means, and this panel is a direct view of it, not a
 * second copy that could drift.
 */
export function WithheldExplanationPanel() {
  const states = AVAILABILITY_STATES.filter((s) => s !== "available");
  return (
    <div className="space-y-2">
      <p className="text-sm text-[#5f5e5a]">
        Every value on this page is in one of these states. None of them is ever
        silently shown as a zero, a clean result, or an accepted fact.
      </p>
      {states.map((state) => {
        const decision = gateEnvelope({
          availabilityState: state,
          authorityState: null,
          freshnessState: "unknown",
          data: null,
        });
        return <StateBanner key={state} compact decision={decision} />;
      })}
    </div>
  );
}

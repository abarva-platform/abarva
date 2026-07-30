import {
  COMPONENT_READINESS_STATES,
  defaultUnavailableReason,
  readinessIsRenderable,
} from "@/lib/knowledge/view-model";
import { readinessPresentation } from "../state/gate-utils";
import { StateBanner } from "../state/StateBanner";

/**
 * This panel's whole job is to BE the safe empty-state explanation for every
 * other component on the page. It reads from the same
 * readinessPresentation()/defaultUnavailableReason() logic every other
 * component uses to decide what to show -- there is exactly one place in
 * this codebase that defines what each of the real 11 ComponentReadinessState
 * values means, and this panel is a direct view of it, not a second copy
 * that could drift.
 */
export function WithheldExplanationPanel() {
  const states = COMPONENT_READINESS_STATES.filter(
    (s) => !readinessIsRenderable(s),
  );
  return (
    <div className="space-y-2">
      <p className="text-sm text-[#5f5e5a]">
        Every value on this page is in one of these states. None of them is ever
        silently shown as a zero, a clean result, or an accepted fact.
      </p>
      {states.map((state) => {
        const presentation = readinessPresentation(state);
        return (
          <StateBanner
            key={state}
            compact
            decision={{
              tone: presentation.tone,
              title: presentation.title,
              body: defaultUnavailableReason(state) ?? "",
            }}
          />
        );
      })}
    </div>
  );
}

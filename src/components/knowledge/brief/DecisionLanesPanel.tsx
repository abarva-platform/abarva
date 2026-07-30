"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

const LANE_COLOR: Record<string, string> = {
  fund: "#0066CC",
  resolve: "#a32d2d",
  validate: "#ba7517",
  act: "#1d9e75",
};

/** Matrix row gate: "Omit lanes with 0 real items; never show an empty lane
 * as if it means 'nothing outstanding'" -- an empty lane is dropped, not
 * rendered with a reassuring "nothing here" copy that would misread as
 * clean. */
export function DecisionLanesPanel() {
  const { provider, providerCtx, setMode } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.listDecisionLanes(providerCtx),
    [provider, providerCtx],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Decisions waiting"
      emptyTitle="Decision lanes withheld"
    >
      {(lanes) => {
        const populated = lanes.filter((lane) => lane.items.length > 0);
        if (populated.length === 0) {
          return (
            <p className="text-sm italic text-[#888780]">
              No decision lane has a real item recorded yet.
            </p>
          );
        }
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {populated.map((lane) => (
              <div
                key={lane.laneKey}
                className="rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-3"
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: LANE_COLOR[lane.laneKey] }}
                >
                  {lane.label}
                </p>
                <p className="mb-2 text-xs text-[#888780]">{lane.sublabel}</p>
                <ul className="space-y-1.5">
                  {lane.items.map((item) => (
                    <li key={item.decisionId}>
                      <button
                        type="button"
                        onClick={() => setMode("evidence")}
                        className="w-full text-left text-sm text-[#2c2c2a] hover:underline"
                      >
                        {item.title}
                      </button>
                      <p className="text-xs text-[#888780]">{item.meta}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      }}
    </GatedSection>
  );
}

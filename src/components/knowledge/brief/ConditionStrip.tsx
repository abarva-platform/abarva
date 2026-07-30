"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/** Matrix row gate: "Show 'Withheld' state exactly as the prototype's own
 * 'uncertified' demo condition already models" -- ConditionTile.value is a
 * display string precisely so this component never has to coerce a withheld
 * tile into a number. */
export function ConditionStrip() {
  const { provider, providerCtx, setMode } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.getConditionSummary(providerCtx),
    [provider, providerCtx],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Condition"
      emptyTitle="Condition summary withheld"
    >
      {(tiles) => (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {tiles.map((tile) => (
            <button
              key={tile.key}
              type="button"
              onClick={() => setMode("evidence")}
              className="rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-3 text-left"
            >
              <p
                className={`text-xl font-semibold ${tile.attention ? "text-[#a32d2d]" : "text-[#2c2c2a]"}`}
              >
                {tile.value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[#5f5e5a]">
                {tile.label}
              </p>
              <p className="text-xs text-[#888780]">{tile.sublabel}</p>
            </button>
          ))}
        </div>
      )}
    </GatedSection>
  );
}

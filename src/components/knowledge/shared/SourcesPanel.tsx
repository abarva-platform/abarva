"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import { StateBadge } from "../state/StateBanner";

/** Shared between Brief ("what it stands on") and Evidence & gaps ("where it
 * came from") -- same consumption.source_registry_summary_v1 projection, per
 * the binding matrix's own note that these two rows need the same governed
 * projection. One component so the two never drift. */
export function SourcesPanel() {
  const { provider, providerCtx, openDrawer } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.listSources(providerCtx),
    [provider, providerCtx],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Sources"
      emptyTitle="Source list withheld"
      emptyBody="A governed source_registry_summary_v1-style projection must exist before this can render -- source_registry.source is never read directly by a product surface, even as a stopgap."
    >
      {(sources) => (
        <ul className="divide-y divide-[rgba(10,10,11,0.08)] rounded-md border border-[rgba(10,10,11,0.1)] bg-white">
          {sources.map((s) => (
            <li key={s.sourceId}>
              <button
                type="button"
                onClick={() =>
                  openDrawer({
                    kind: "Source",
                    title: s.sourceName,
                    subtitle: `${s.sourceKind.replace(/_/g, " ")} - received ${s.receivedDate ?? "not received"}`,
                    evidence: [],
                    attributes: [
                      { label: "State", value: s.sourceState },
                      { label: "Used for", value: s.usedForText },
                      {
                        label: "Owner",
                        value: s.ownerSteward ?? "Not recorded",
                      },
                    ],
                  })
                }
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-[rgba(0,102,204,0.03)]"
              >
                <div>
                  <p className="text-sm font-medium text-[#2c2c2a]">
                    {s.sourceName}
                  </p>
                  <p className="text-xs text-[#888780]">{s.usedForText}</p>
                </div>
                <StateBadge
                  tone={
                    s.sourceState === "accepted"
                      ? "neutral"
                      : s.sourceState === "partial"
                        ? "candidate"
                        : "gap"
                  }
                  label={s.receivedDate ? s.sourceState : "not received"}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </GatedSection>
  );
}

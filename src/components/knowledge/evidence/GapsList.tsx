"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/** Matrix row gate: "'Gap data withheld pending pipeline re-run' -- never an
 * empty gaps list on a tenant that documented 650 risk-register rows." An
 * empty list here would look identical to "nothing outstanding", which would
 * be a lie for this tenant -- so GatedSection's withheld state is what shows
 * until evidence_gap_v1 is independently re-verified, never a 0-row table. */
export function GapsList() {
  const { provider, providerCtx, openDrawer } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.listEvidenceGaps(providerCtx),
    [provider, providerCtx],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Open gaps"
      emptyTitle="Gap data withheld pending pipeline re-run"
      emptyBody="airline-demo-new's risk-register source has 650 rows; the evidence_gap_v1 projection built from it has not been independently re-verified as non-zero yet."
    >
      {(gaps) => (
        <ul className="space-y-2">
          {gaps.map((g) => (
            <li key={g.gapId}>
              <button
                type="button"
                onClick={() =>
                  openDrawer({
                    kind: "Open proof gap",
                    title: g.summary,
                    subtitle: `${g.gapType} - owner ${g.owner ?? "not assigned"}`,
                    evidence: [],
                    attributes: [
                      { label: "Owner", value: g.owner ?? "Not assigned" },
                      { label: "Due", value: g.dueDate ?? "Unassigned" },
                      {
                        label: "Affects",
                        value: g.affectedDomains.join(", ") || "Not recorded",
                      },
                    ],
                  })
                }
                className="w-full rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-3 text-left"
              >
                <p className="text-sm font-medium text-[#2c2c2a]">
                  {g.summary}
                </p>
                <p className="mt-1 text-xs text-[#5f5e5a]">
                  Owner: {g.owner ?? "Not assigned"} - Due:{" "}
                  {g.dueDate ?? "Unassigned"} - Affects:{" "}
                  {g.affectedDomains.join(", ") || "Not recorded"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </GatedSection>
  );
}

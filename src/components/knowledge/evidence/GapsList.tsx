"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/** Open proof gaps -- EvidenceGapV1 rows off getEvidenceAndGaps. The real
 * gap shape carries `businessImpact`/`requestedSource`/`severity`, not the
 * original prototype's `owner`/`dueDate` fields (no such fields exist on
 * EvidenceGapV1). GatedSection's withheld state (not an empty 0-row list)
 * still shows until evidence_gap_v1 resolves for this baseline. */
export function GapsList() {
  const { assembler, runtime, tenantKey, openDrawer } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => assembler.getEvidenceAndGaps({ runtime, tenantKey }),
    [assembler, runtime, tenantKey],
  );

  return (
    <GatedSection envelope={envelope} label="Open gaps">
      {({ gaps }) => (
        <ul className="space-y-2">
          {gaps.map((g) => (
            <li key={g.gapId}>
              <button
                type="button"
                onClick={() =>
                  openDrawer({
                    kind: "Open proof gap",
                    title: g.title,
                    subtitle: `${g.severity} severity -- ${g.gapState}`,
                    evidence: [],
                    gaps: [g],
                    attributes: [
                      { label: "Business impact", value: g.businessImpact },
                      {
                        label: "Closes with",
                        value: g.requestedSource ?? "Not specified",
                      },
                      { label: "Domain", value: g.domainKey ?? "Not recorded" },
                    ],
                  })
                }
                className="w-full rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-3 text-left"
              >
                <p className="text-sm font-medium text-[#2c2c2a]">{g.title}</p>
                <p className="mt-1 text-xs text-[#5f5e5a]">
                  {g.businessImpact}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </GatedSection>
  );
}

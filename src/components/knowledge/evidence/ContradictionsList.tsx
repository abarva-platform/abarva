"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

export function ContradictionsList() {
  const { provider, providerCtx, openDrawer } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.listContradictions(providerCtx),
    [provider, providerCtx],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Contradictions"
      emptyTitle="Contradictions withheld"
      emptyBody="The Contradiction object is not yet a ratified canonical type (GAP-06) -- never inferred client-side by diffing two tables without a recorded owner."
    >
      {(rows) => (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li key={c.contradictionId}>
              <button
                type="button"
                onClick={() =>
                  openDrawer({
                    kind: "Contradiction",
                    title: c.title,
                    subtitle: `Open ${c.openedDate ?? "unknown"} - owner ${c.owner ?? "not assigned"}`,
                    evidence: [],
                    attributes: [
                      {
                        label: "One source says",
                        value: `${c.statementA} (${c.statementASource})`,
                      },
                      {
                        label: "The other says",
                        value: `${c.statementB} (${c.statementBSource})`,
                      },
                      { label: "Effect", value: c.downstreamEffectText },
                    ],
                  })
                }
                className="w-full rounded-md border border-[rgba(163,45,45,0.22)] bg-[rgba(163,45,45,0.04)] p-3 text-left"
              >
                <p className="text-sm font-medium text-[#a32d2d]">{c.title}</p>
                <p className="mt-1 text-xs text-[#5f5e5a]">
                  {c.downstreamEffectText}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </GatedSection>
  );
}

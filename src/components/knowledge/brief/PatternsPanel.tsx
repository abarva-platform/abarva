"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/** Matrix row gate: "Omit the patterns panel entirely rather than show a
 * pattern with a fabricated or unlinked gap claim" -- a pattern whose
 * applicabilityRating is null (unresolved linked_gap_ids) is dropped, never
 * defaulted to "low". */
export function PatternsPanel() {
  const { provider, providerCtx, lensId } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.listIndustryPatterns({ ...providerCtx, lensId }),
    [provider, providerCtx, lensId],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Industry patterns"
      emptyTitle="Industry patterns withheld"
    >
      {(patterns) => {
        const rated = patterns.filter((p) => p.applicabilityRating !== null);
        if (rated.length === 0) {
          return (
            <p className="text-sm italic text-[#888780]">
              No pattern with a resolved applicability rating yet.
            </p>
          );
        }
        return (
          <div className="space-y-3">
            {rated.map((p) => (
              <article
                key={p.patternId}
                className="rounded-md border border-dashed border-[rgba(136,135,128,0.5)] bg-[rgba(136,135,128,0.05)] p-4"
              >
                <p className="text-sm font-medium text-[#2c2c2a]">{p.title}</p>
                <p className="mt-1 text-sm text-[#5f5e5a]">{p.body}</p>
                <p className="mt-2 text-xs text-[#888780]">
                  Applicability: {p.applicabilityRating}
                  {p.applicabilityRationale
                    ? ` -- ${p.applicabilityRationale}`
                    : ""}
                </p>
                {p.missingHereText ? (
                  <p className="mt-0.5 text-xs text-[#ba7517]">
                    {p.missingHereText}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        );
      }}
    </GatedSection>
  );
}

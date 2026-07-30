"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/** Industry patterns -- BenchmarkV1 rows filtered to contentClass ===
 * "industry_pattern" by the assembler. The real projection is thinner than
 * the original prototype's pattern object (label + peer context + an
 * optional governed value; no applicability rating/rationale field exists in
 * the real contract), so this panel shows what is actually governed rather
 * than inventing a rating. */
export function PatternsPanel() {
  const { assembler, runtime, tenantKey, lensId } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => assembler.getIndustryContext({ runtime, tenantKey, lens: lensId }),
    [assembler, runtime, tenantKey, lensId],
  );

  return (
    <GatedSection envelope={envelope} label="Industry patterns">
      {({ patterns }) => {
        if (patterns.length === 0) {
          return (
            <p className="text-sm italic text-[#888780]">
              No industry pattern published for this tenant yet.
            </p>
          );
        }
        return (
          <div className="space-y-3">
            {patterns.map((p) => (
              <article
                key={p.id}
                className="rounded-md border border-dashed border-[rgba(136,135,128,0.5)] bg-[rgba(136,135,128,0.05)] p-4"
              >
                <p className="text-sm font-medium text-[#2c2c2a]">{p.label}</p>
                {p.value?.value !== null && p.value?.value !== undefined ? (
                  <p className="mt-1 text-sm text-[#5f5e5a]">
                    {p.value.value}
                    {p.value.unit ?? ""}
                  </p>
                ) : null}
                {p.peerContext ? (
                  <p className="mt-2 text-xs text-[#888780]">{p.peerContext}</p>
                ) : null}
                {p.absenceReason ? (
                  <p className="mt-0.5 text-xs text-[#ba7517]">
                    {p.absenceReason}
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

"use client";

import { useEffect, useState } from "react";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import type { ResolvedAirlineLens } from "@/lib/knowledge/view-model";

/** Shows the lens label/scope only; the narrative headline gates
 * independently on `getStrategicContext` -- an unresolved interpretation
 * never blocks the lens label itself from rendering. */
export function StoryHeader() {
  const { assembler, runtime, tenantKey, lensId } = useKnowledgeApp();
  const [lenses, setLenses] = useState<readonly ResolvedAirlineLens[] | null>(
    null,
  );
  useEffect(() => {
    let cancelled = false;
    assembler.listAirlineLenses({ runtime, tenantKey }).then((result) => {
      if (!cancelled) setLenses(result);
    });
    return () => {
      cancelled = true;
    };
  }, [assembler, runtime, tenantKey]);

  const contextEnvelope = useEnvelope(
    () => assembler.getStrategicContext({ runtime, tenantKey, lens: lensId }),
    [assembler, runtime, tenantKey, lensId],
  );

  const lens = lenses?.find((l) => l.lensId === lensId);

  return (
    <div className="mb-6">
      {lens ? (
        <>
          <p className="text-xs font-medium uppercase tracking-wide text-[#888780]">
            {lens.primaryDomainKeys.join(" -- ")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[#0c1a3a]">
            {lens.label}
          </h1>
        </>
      ) : (
        <h1 className="text-2xl font-semibold text-[#0c1a3a]">Knowledge</h1>
      )}
      <div className="mt-3">
        <GatedSection
          envelope={contextEnvelope}
          label="Lens narrative"
          emptyTitle="Interpretation not yet published"
          emptyBody="strategic_interpretation_v1 has not resolved with accepted evidence for this lens."
          compact
        >
          {(context) =>
            context.interpretation ? (
              <div>
                <p className="text-lg font-medium leading-snug text-[#2c2c2a]">
                  {context.interpretation.headline}
                </p>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#5f5e5a]">
                  {context.interpretation.body}
                </p>
              </div>
            ) : (
              <p className="text-sm italic text-[#888780]">
                Interpretation not yet published.
              </p>
            )
          }
        </GatedSection>
      </div>
    </div>
  );
}

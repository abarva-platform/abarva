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
    <div className="mb-7 rounded-md border border-[rgba(12,26,58,0.1)] bg-[radial-gradient(circle_at_16%_0%,rgba(0,102,204,0.12),transparent_32%),linear-gradient(135deg,#ffffff,#f6f9fb)] px-5 py-5 shadow-[0_22px_60px_rgba(12,26,58,0.08)]">
      {lens ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#607286]">
            {lens.primaryDomainKeys.join(" -- ")}
          </p>
          <h1 className="mt-2 max-w-4xl text-3xl font-semibold leading-tight text-[#0c1a3a] sm:text-4xl">
            {lens.label}
          </h1>
        </>
      ) : (
        <h1 className="text-3xl font-semibold text-[#0c1a3a] sm:text-4xl">
          Knowledge
        </h1>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-[rgba(32,93,141,0.18)] bg-white/80 px-3 py-1 text-xs font-semibold text-[#205d8d]">
          Evidence-bound
        </span>
        <span className="rounded-full border border-[rgba(32,93,141,0.18)] bg-white/80 px-3 py-1 text-xs font-semibold text-[#205d8d]">
          Baseline-governed
        </span>
        <span className="rounded-full border border-[rgba(32,93,141,0.18)] bg-white/80 px-3 py-1 text-xs font-semibold text-[#205d8d]">
          Gaps visible
        </span>
      </div>
      <div className="mt-5">
        <GatedSection
          envelope={contextEnvelope}
          label="Lens narrative"
          emptyTitle="Interpretation not yet published"
          emptyBody="No accepted strategic interpretation has been published for this lens yet. The page still renders governed facts and open gaps rather than filling the narrative from unapproved material."
          emptyPresentation="governed"
          compact
        >
          {(context) =>
            context.interpretation ? (
              <div>
                <p className="max-w-4xl text-xl font-semibold leading-snug text-[#10243d]">
                  {context.interpretation.headline}
                </p>
                <p className="mt-2 max-w-4xl text-base leading-relaxed text-[#4f5e6c]">
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

"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/** Matrix row gate: "Show lens label and scope description only; omit
 * headline/lede with 'Interpretation not yet published' otherwise." */
export function StoryHeader() {
  const { provider, providerCtx, lensId } = useKnowledgeApp();
  const lensesEnvelope = useEnvelope(
    () => provider.listLenses(providerCtx),
    [provider, providerCtx],
  );
  const viewEnvelope = useEnvelope(
    () => provider.getStrategicView({ ...providerCtx, lensId }),
    [provider, providerCtx, lensId],
  );

  const lens = lensesEnvelope?.data?.find((l) => l.lensId === lensId);

  return (
    <div className="mb-6">
      {lens ? (
        <>
          <p className="text-xs font-medium uppercase tracking-wide text-[#888780]">
            {lens.scopeText}
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
          envelope={viewEnvelope}
          label="Lens narrative"
          emptyTitle="Interpretation not yet published"
          emptyBody="strategic_interpretation_v1 has not resolved with accepted evidence for this lens."
          compact
        >
          {(view) => (
            <div>
              <p className="text-lg font-medium leading-snug text-[#2c2c2a]">
                {view.headline}
              </p>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#5f5e5a]">
                {view.observed}
              </p>
            </div>
          )}
        </GatedSection>
      </div>
    </div>
  );
}

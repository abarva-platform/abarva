"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/** Matrix row gate: "Omit the view card; do not render a headline with an
 * empty or placeholder proof chain" -- every card requires at least one
 * proof item, checked here rather than trusting the provider always to have
 * enforced it. */
export function AbarvaViewsPanel() {
  const { provider, providerCtx, lensId, openDrawer } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.listAbarvaViews({ ...providerCtx, lensId }),
    [provider, providerCtx, lensId],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="AbarVa views"
      emptyTitle="No AbarVa view published for this lens"
      emptyBody="strategic_interpretation_v1 has not resolved with a real proof chain for this (tenant, lens, baseline)."
    >
      {(views) => {
        const withProof = views.filter((v) => v.proof.length > 0);
        if (withProof.length === 0) {
          return (
            <p className="text-sm italic text-[#888780]">
              No AbarVa view published for this lens yet.
            </p>
          );
        }
        return (
          <div className="grid gap-3 md:grid-cols-2">
            {withProof.map((view) => (
              <article
                key={view.viewId}
                className="rounded-md border border-[rgba(0,102,204,0.28)] bg-[rgba(0,102,204,0.03)] p-4"
              >
                <p className="text-sm font-semibold text-[#0c1a3a]">
                  {view.headline}
                </p>
                <p className="mt-1.5 text-sm text-[#5f5e5a]">{view.observed}</p>
                <p className="mt-1.5 text-sm text-[#5f5e5a]">
                  <span className="font-medium text-[#2c2c2a]">Why: </span>
                  {view.why}
                </p>
                <p className="mt-1.5 text-sm text-[#5f5e5a]">
                  <span className="font-medium text-[#2c2c2a]">
                    Implication:{" "}
                  </span>
                  {view.implication}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    openDrawer({
                      kind: "AbarVa view -- evidence chain",
                      title: view.headline,
                      evidence: view.proof.map((p) => ({
                        sourceName: p.sourceName,
                        sourceDate: null,
                        citation: p.assertion,
                        reviewState: p.reviewState,
                        confidence: "unknown",
                        effectivePeriod: null,
                        lineage: [],
                        conflicts: [],
                        accessRestricted: false,
                      })),
                    })
                  }
                  className="mt-3 text-xs font-medium text-[#0066CC] hover:underline"
                >
                  Evidence chain ({view.proof.length})
                </button>
              </article>
            ))}
          </div>
        );
      }}
    </GatedSection>
  );
}

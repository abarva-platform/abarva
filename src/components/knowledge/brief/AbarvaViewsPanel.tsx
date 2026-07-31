"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/**
 * AbarVa view. The real contract's EnterpriseBriefV1.interpretation is a
 * SINGLE AbarVaInterpretationV1 per (tenant, lens, baseline) call, not an
 * array of view cards (see the reconciliation matrix's `listAbarvaViews`
 * row: MISSING_PROVIDER_QUERY for a true array; widening this to a
 * multi-interpretation query is contract/data-plane work, out of this PR's
 * scope). This panel therefore renders the one interpretation the assembler
 * returns rather than assuming a list, and its proof chain is only its
 * governed evidenceRefs (resolved via runtime.resolveEvidence) -- the
 * original why/implication/metrics/assumption/proof-with-review-state fields
 * have no equivalent in AbarVaInterpretationV1 (headline + body only).
 */
export function AbarvaViewsPanel() {
  const { assembler, runtime, tenantKey, lensId, openDrawer } =
    useKnowledgeApp();
  const envelope = useEnvelope(
    () => assembler.getAbarVaView({ runtime, tenantKey, lens: lensId }),
    [assembler, runtime, tenantKey, lensId],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="AbarVa views"
      emptyTitle="AbarVa view not yet published"
      emptyBody="No accepted AbarVa interpretation has been published for this tenant, lens, and baseline. The view remains empty rather than composing an advisory conclusion without evidence approval."
      emptyPresentation="governed"
    >
      {(context) => {
        const view = context.interpretation;
        if (!view) {
          return (
            <p className="text-sm italic text-[#888780]">
              No AbarVa view published for this lens yet.
            </p>
          );
        }
        return (
          <article className="rounded-md border border-[rgba(0,102,204,0.28)] bg-[rgba(0,102,204,0.03)] p-4">
            <p className="text-sm font-semibold text-[#0c1a3a]">
              {view.headline}
            </p>
            <p className="mt-1.5 text-sm text-[#5f5e5a]">{view.body}</p>
            <button
              type="button"
              onClick={() =>
                openDrawer({
                  kind: "AbarVa view -- evidence",
                  title: view.headline,
                  evidence: runtime.resolveEvidence(view.evidenceRefs),
                })
              }
              className="mt-3 text-xs font-medium text-[#0066CC] hover:underline"
            >
              Evidence ({view.evidenceRefs.length})
            </button>
          </article>
        );
      }}
    </GatedSection>
  );
}

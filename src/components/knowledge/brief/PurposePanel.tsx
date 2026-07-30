"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

export function PurposePanel() {
  const { provider, providerCtx } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.listPurposeStatements(providerCtx),
    [provider, providerCtx],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Purpose and priorities"
      emptyTitle="Leadership priorities not yet published"
      emptyBody="executive_perspective_v1 has not resolved and accepted for this tenant."
    >
      {(statements) => (
        <dl className="space-y-3">
          {statements.map((s) => (
            <div key={s.statementType}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#888780]">
                {s.statementType === "operating_priority"
                  ? "Operating priority"
                  : "Stated ambition"}
              </dt>
              <dd className="mt-0.5 text-sm text-[#2c2c2a]">{s.text}</dd>
              <p className="mt-0.5 text-xs text-[#888780]">{s.sourceLabel}</p>
            </div>
          ))}
        </dl>
      )}
    </GatedSection>
  );
}

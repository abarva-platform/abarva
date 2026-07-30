"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import { StateBadge } from "../state/StateBanner";
import type { EvidenceDescriptor } from "@/lib/knowledge/consumption-contracts";

/** Shared between Brief ("what it stands on") and Evidence & gaps ("where it
 * came from"). No dedicated source_registry_summary_v1-style projection
 * exists in the real consumption contract (see the reconciliation matrix's
 * `listSources` row: SUPPORTED_BY_COMPOSITION) -- this composes the unique
 * set of evidence descriptors the current Brief actually touched
 * (getEnterpriseBrief's envelope-level evidenceRefs, resolved via
 * runtime.resolveEvidence), rather than reading a table that does not exist
 * at any layer today. */
export function SourcesPanel() {
  const { assembler, runtime, tenantKey, lensId, openDrawer } =
    useKnowledgeApp();
  const envelope = useEnvelope(
    () => assembler.getEnterpriseBrief({ runtime, tenantKey, lens: lensId }),
    [assembler, runtime, tenantKey, lensId],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Sources"
      emptyTitle="Source list withheld"
    >
      {(_brief, resolvedEnvelope) => {
        const descriptors = dedupeBySource(
          runtime.resolveEvidence([...resolvedEnvelope.evidenceRefs]),
        );
        if (descriptors.length === 0) {
          return (
            <p className="text-sm italic text-[#888780]">
              No source has been resolved for this Brief yet.
            </p>
          );
        }
        return (
          <ul className="divide-y divide-[rgba(10,10,11,0.08)] rounded-md border border-[rgba(10,10,11,0.1)] bg-white">
            {descriptors.map((s) => (
              <li key={s.evidenceRef}>
                <button
                  type="button"
                  onClick={() =>
                    openDrawer({
                      kind: "Source",
                      title: s.sourceName ?? "Not yet captured",
                      subtitle: `${s.sourceType ?? "unknown source type"} -- received ${s.sourceDate ?? "not received"}`,
                      evidence: [s],
                    })
                  }
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-[rgba(0,102,204,0.03)]"
                >
                  <div>
                    <p className="text-sm font-medium text-[#2c2c2a]">
                      {s.sourceName ?? "Not yet captured"}
                    </p>
                    <p className="text-xs text-[#888780]">
                      {s.sourceType ?? "Source type not yet captured"}
                    </p>
                  </div>
                  <StateBadge
                    tone={
                      s.reviewState === "reviewed"
                        ? "neutral"
                        : s.reviewState === "unreviewed" ||
                            s.reviewState === "in_review"
                          ? "candidate"
                          : "gap"
                    }
                    label={
                      s.sourceDate
                        ? (s.reviewState ?? "unreviewed")
                        : "not received"
                    }
                  />
                </button>
              </li>
            ))}
          </ul>
        );
      }}
    </GatedSection>
  );
}

function dedupeBySource(
  descriptors: readonly EvidenceDescriptor[],
): EvidenceDescriptor[] {
  const seen = new Map<string, EvidenceDescriptor>();
  for (const d of descriptors) {
    const key = d.sourceName ?? d.evidenceRef;
    if (!seen.has(key)) seen.set(key, d);
  }
  return Array.from(seen.values());
}

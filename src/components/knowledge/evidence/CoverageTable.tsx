"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import { StateBadge } from "../state/StateBanner";
import { readinessPresentation } from "../state/gate-utils";
import { deriveReadiness } from "@/lib/knowledge/view-model";

/**
 * Coverage by domain -- DomainReadinessV1 rows off the real Brief. The real
 * shape carries evidenceCoverage/entityCount/openGapCount per domain, but no
 * separate per-domain freshness or conflict-count field (those were the
 * duplicate provider's own invented columns) -- this renders what the real
 * projection actually carries.
 */
export function CoverageTable() {
  const { assembler, runtime, tenantKey, lensId } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => assembler.getEnterpriseBrief({ runtime, tenantKey, lens: lensId }),
    [assembler, runtime, tenantKey, lensId],
  );

  return (
    <GatedSection envelope={envelope} label="Coverage by domain">
      {(brief) => (
        <div className="overflow-x-auto rounded-md border border-[rgba(10,10,11,0.1)]">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[rgba(10,10,11,0.1)] bg-[rgba(10,10,11,0.02)] text-xs uppercase tracking-wide text-[#888780]">
                <th className="px-3 py-2 text-left">Domain</th>
                <th className="px-3 py-2 text-right">Coverage</th>
                <th className="px-3 py-2 text-left">Readiness</th>
                <th className="px-3 py-2 text-right">Open gaps</th>
              </tr>
            </thead>
            <tbody>
              {brief.domains.map((row) => {
                const readiness = deriveReadiness({
                  availabilityState: row.availabilityState,
                  authorityState: "accepted",
                  freshnessState: "fresh",
                  warnings: [],
                  proven: false,
                });
                const presentation = readinessPresentation(readiness);
                return (
                  <tr
                    key={row.domainKey}
                    className="border-b border-[rgba(10,10,11,0.06)]"
                  >
                    <td className="px-3 py-2 text-[#2c2c2a]">{row.label}</td>
                    <td className="px-3 py-2 text-right text-[#2c2c2a]">
                      {row.availabilityState === "not_applicable"
                        ? "Not assessed"
                        : `${Math.round(row.evidenceCoverage * 100)}%`}
                    </td>
                    <td className="px-3 py-2">
                      <StateBadge
                        tone={presentation.tone}
                        label={presentation.title}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-[#2c2c2a]">
                      {row.openGapCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </GatedSection>
  );
}

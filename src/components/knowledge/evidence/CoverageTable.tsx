"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import { StateBadge } from "../state/StateBanner";

/** Matrix row gate: gap_count column renders only once evidence_gap_v1 is
 * independently re-verified non-zero; otherwise it must show "Withheld", not
 * "0" (a 0 here would misread as "no gaps"). */
export function CoverageTable() {
  const { provider, providerCtx } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.listDomainCoverage(providerCtx),
    [provider, providerCtx],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Coverage by domain"
      emptyTitle="Domain coverage withheld"
    >
      {(rows) => (
        <div className="overflow-x-auto rounded-md border border-[rgba(10,10,11,0.1)]">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[rgba(10,10,11,0.1)] bg-[rgba(10,10,11,0.02)] text-xs uppercase tracking-wide text-[#888780]">
                <th className="px-3 py-2 text-left">Domain</th>
                <th className="px-3 py-2 text-right">Coverage</th>
                <th className="px-3 py-2 text-left">Freshness</th>
                <th className="px-3 py-2 text-left">Readiness</th>
                <th className="px-3 py-2 text-right">Gaps</th>
                <th className="px-3 py-2 text-right">Conflicts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.domainId}
                  className="border-b border-[rgba(10,10,11,0.06)]"
                >
                  <td className="px-3 py-2 text-[#2c2c2a]">
                    {row.domainLabel}
                  </td>
                  <td className="px-3 py-2 text-right text-[#2c2c2a]">
                    {row.freshness === "not_assessed"
                      ? "Not assessed"
                      : `${row.coveragePct ?? "-"}%`}
                  </td>
                  <td className="px-3 py-2 capitalize text-[#5f5e5a]">
                    {row.freshness.replace("_", " ")}
                  </td>
                  <td className="px-3 py-2">
                    <StateBadge
                      tone={
                        row.readinessState === "decision_ready"
                          ? "neutral"
                          : row.readinessState.startsWith("blocked")
                            ? "gap"
                            : "candidate"
                      }
                      label={row.readinessState.replace(/_/g, " ")}
                    />
                  </td>
                  <td className="px-3 py-2 text-right text-[#2c2c2a]">
                    {row.gapCountAvailability === "available"
                      ? row.gapCount
                      : "Withheld"}
                  </td>
                  <td className="px-3 py-2 text-right text-[#2c2c2a]">
                    {row.conflictCount ?? "Withheld"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GatedSection>
  );
}

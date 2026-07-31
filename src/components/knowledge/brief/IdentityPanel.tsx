"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import type { GovernedMetricValue } from "@/lib/knowledge/consumption-contracts";

interface StatTile {
  readonly key: string;
  readonly label: string;
  readonly value: string | null;
  readonly available: boolean;
  readonly evidenceRefs: readonly string[];
}

/** Each stat tile gates independently -- a real EnterpriseIdentityV1 has three
 * governed fields (revenue, employees, footprint), fewer than the original
 * prototype's six illustrative tiles (Fleet/Departures/Destinations/Hubs/Crew
 * have no real projection to back them today). A whole-panel gate would hide
 * revenue/employees just because footprint hasn't loaded, which would throw
 * away real, available data behind one missing field. */
export function IdentityPanel() {
  const { assembler, runtime, tenantKey, lensId, openDrawer } =
    useKnowledgeApp();
  const envelope = useEnvelope(
    () => assembler.getEnterpriseProfile({ runtime, tenantKey, lens: lensId }),
    [assembler, runtime, tenantKey, lensId],
  );

  return (
    <GatedSection envelope={envelope} label="Enterprise identity">
      {(identity) => {
        const tiles: StatTile[] = [
          metricTile("revenue", "Revenue", identity.revenue),
          metricTile("employees", "Employees", identity.employees),
          {
            key: "footprint",
            label: "Footprint",
            value: identity.footprint,
            available: identity.footprintState === "available",
            evidenceRefs: [],
          },
        ];
        return (
          <div>
            <p className="mb-4 max-w-3xl text-base leading-relaxed text-[#2c2c2a]">
              {[identity.displayName, identity.industry]
                .filter(Boolean)
                .join(" -- ") || "Enterprise profile not yet published."}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {tiles.map((stat) => (
                <button
                  key={stat.key}
                  type="button"
                  onClick={() =>
                    openDrawer({
                      kind: "Enterprise stat",
                      title: stat.label,
                      evidence: runtime.resolveEvidence([...stat.evidenceRefs]),
                    })
                  }
                  className="rounded-md border border-[rgba(12,26,58,0.1)] bg-white p-4 text-left shadow-[0_14px_32px_rgba(12,26,58,0.05)] transition hover:border-[rgba(0,102,204,0.26)] hover:shadow-[0_18px_42px_rgba(12,26,58,0.08)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#607286]">
                    {stat.label}
                  </p>
                  <p
                    className={`mt-2 text-xl font-semibold ${stat.available ? "text-[#10243d]" : "text-[#6d7782]"}`}
                  >
                    {stat.available && stat.value !== null
                      ? stat.value
                      : "Not yet published"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );
      }}
    </GatedSection>
  );
}

function metricTile(
  key: string,
  label: string,
  metric: GovernedMetricValue | null,
): StatTile {
  if (!metric) {
    return { key, label, value: null, available: false, evidenceRefs: [] };
  }
  const available = metric.availabilityState === "available";
  const value =
    available && metric.value !== null
      ? `${metric.value.toLocaleString("en-US")}${metric.unit ? ` ${metric.unit}` : ""}`
      : null;
  return {
    key,
    label: metric.label ?? label,
    value,
    available,
    evidenceRefs: metric.evidenceRefs,
  };
}

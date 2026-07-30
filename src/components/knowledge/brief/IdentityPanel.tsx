"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/** Each stat tile gates independently -- exactly the prototype's own Crew
 * tile ("Not published") already models. A whole-panel gate would hide
 * Fleet/Departures/Destinations just because Crew hasn't loaded, which would
 * throw away real, available data behind one missing field. */
export function IdentityPanel() {
  const { provider, providerCtx, openDrawer } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.getEnterpriseIdentity(providerCtx),
    [provider, providerCtx],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Enterprise identity"
      emptyTitle="Enterprise identity withheld"
    >
      {(identity) => (
        <div>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-[#2c2c2a]">
            {identity.profileText}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {identity.operatingStats.map((stat) => (
              <button
                key={stat.statKey}
                type="button"
                onClick={() =>
                  openDrawer({
                    kind: "Enterprise stat",
                    title: stat.label,
                    evidence: [],
                    attributes: [
                      {
                        label: "Evidence",
                        value: stat.evidenceRef ?? "Not yet captured",
                      },
                    ],
                  })
                }
                className="rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-3 text-left"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-[#888780]">
                  {stat.label}
                </p>
                <p
                  className={`mt-1 text-lg font-semibold ${stat.availabilityState === "available" ? "text-[#2c2c2a]" : "text-[#888780] italic"}`}
                >
                  {stat.availabilityState === "available" && stat.value !== null
                    ? `${stat.value}${stat.unit ?? ""}`
                    : "Not published"}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </GatedSection>
  );
}

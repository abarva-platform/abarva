"use client";

/**
 * Evidence & Gaps mode — the honesty ledger. Shows coverage and every known gap
 * (missing / withheld / conflicting / not-measured / not-loaded) in business
 * language. Missing is explicit, never converted to zero.
 */

import { useEffect } from "react";
import { useConsumption } from "@/lib/knowledge/consumption-client";
import type { EvidenceGapSeverityLevel } from "@/lib/knowledge/consumption-contracts";
import { useShell } from "../state";
import { AvailabilityPill, Card, ContentClassBadge, SectionHeading } from "../primitives";
import { ErrorBlock, LoadingBlock, ProofFooter, useEnvelope, WarningBanners } from "../mode-helpers";

const SEVERITY_ORDER: EvidenceGapSeverityLevel[] = ["critical", "high", "medium", "low"];

export function EvidenceMode() {
  const runtime = useConsumption();
  const { depth, lens, filters, setAvaContext } = useShell();
  const domainKey = filters.domain?.[0] ?? null;

  const { envelope, loading, error } = useEnvelope(
    () => runtime.provider.getEvidenceAndGaps({ tenantKey: runtime.binding.tenantKey, depth, lens, domainKey }),
    [runtime, depth, lens, domainKey],
  );

  useEffect(() => {
    if (!envelope) return;
    setAvaContext({
      evidenceRefs: envelope.evidenceRefs,
      acceptedFactRefs: [],
      knownGapRefs: envelope.data.gaps.map((g) => g.gapId),
      blockedSourceRefs: envelope.data.gaps.filter((g) => g.gapState === "withheld").map((g) => g.gapId),
    });
  }, [envelope, setAvaContext]);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock error={error} />;
  if (!envelope) return null;

  const result = envelope.data;
  const sorted = [...result.gaps].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );

  return (
    <div>
      <WarningBanners envelope={envelope} />
      <SectionHeading eyebrow="Evidence & Gaps">Coverage &amp; open gaps</SectionHeading>

      <Card>
        <div className="kv-metric">
          <span className="kv-metric-val">{Math.round(result.overallEvidenceCoverage * 100)}%</span>
          <span className="kv-metric-label">Overall evidence coverage · coverage is not truth by itself</span>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          {SEVERITY_ORDER.map((s) => (
            <span key={s} className="kv-pill" data-a={s === "critical" || s === "high" ? "conflicting" : "not_measured"}>
              {result.severityCounts[s]} {s}
            </span>
          ))}
        </div>
      </Card>

      {sorted.length === 0 ? (
        <div className="kv-empty">No gaps recorded for this scope.</div>
      ) : (
        sorted.map((g) => (
          <Card key={g.gapId}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <ContentClassBadge contentClass="evidence_gap" />
                <span className="kv-pill" data-a={g.gapState}>{g.severity}</span>
                <AvailabilityPill state={g.gapState} />
              </div>
              {g.domainKey ? <span style={{ fontSize: 12, color: "var(--kv-muted)" }}>{g.domainKey}</span> : null}
            </div>
            <h3 className="kv-serif" style={{ fontSize: 16, margin: "8px 0 4px" }}>{g.title}</h3>
            <p style={{ fontSize: 13 }}>{g.businessImpact}</p>
            {g.requestedSource ? (
              <p style={{ fontSize: 12, color: "var(--kv-muted)", marginTop: 6 }}>
                Would be closed by: {g.requestedSource}
              </p>
            ) : null}
          </Card>
        ))
      )}

      <ProofFooter envelope={envelope} />
    </div>
  );
}

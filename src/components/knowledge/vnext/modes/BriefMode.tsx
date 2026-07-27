"use client";

/**
 * Brief mode — the executive brief. Identity + headline metrics always; deeper
 * perspectives/benchmarks/targets/domains revealed by the GLOBAL depth control.
 * Leadership perspectives are visually distinct from accepted facts and are
 * tested against supporting/challenging/uncertain evidence.
 */

import { useEffect } from "react";
import { useConsumption } from "@/lib/knowledge/consumption-client";
import type { LeadershipPerspectiveV1 } from "@/lib/knowledge/consumption-contracts";
import { atLeastDepth, useShell } from "../state";
import {
  Card,
  ContentClassBadge,
  MetricValue,
  SectionHeading,
} from "../primitives";
import { ErrorBlock, LoadingBlock, ProofFooter, useEnvelope, WarningBanners } from "../mode-helpers";

export function BriefMode() {
  const runtime = useConsumption();
  const { depth, lens, scope, setAvaContext } = useShell();

  const { envelope, loading, error } = useEnvelope(
    () => runtime.provider.getEnterpriseBrief({ tenantKey: runtime.binding.tenantKey, depth, lens, currentTargetScope: scope }),
    [runtime, depth, lens, scope],
  );

  useEffect(() => {
    if (!envelope) return;
    setAvaContext({
      evidenceRefs: envelope.evidenceRefs,
      acceptedFactRefs: envelope.data.headlineMetrics.map((m) => m.metricKey),
      knownGapRefs: envelope.knownGapRefs,
      blockedSourceRefs: [],
    });
  }, [envelope, setAvaContext]);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock error={error} />;
  if (!envelope) return null;

  const brief = envelope.data;
  const resolve = (refs: string[]) => runtime.resolveEvidence(refs);

  return (
    <div>
      <WarningBanners envelope={envelope} />

      <SectionHeading eyebrow={brief.identity.industry ?? "Enterprise"}>
        {brief.identity.displayName ?? "Enterprise brief"}
      </SectionHeading>

      <Card>
        <div className="kv-metric-grid">
          {brief.identity.revenue ? <MetricValue metric={brief.identity.revenue} resolveEvidence={resolve} /> : null}
          {brief.identity.employees ? <MetricValue metric={brief.identity.employees} resolveEvidence={resolve} /> : null}
          {brief.headlineMetrics.map((m) => (
            <MetricValue key={m.metricKey} metric={m} resolveEvidence={resolve} />
          ))}
        </div>
        {brief.identity.footprint ? (
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--kv-ink-soft)" }}>{brief.identity.footprint}</p>
        ) : null}
      </Card>

      {brief.interpretation ? (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <ContentClassBadge contentClass="abarva_interpretation" />
          </div>
          <h3 className="kv-serif" style={{ fontSize: 18, margin: "8px 0" }}>{brief.interpretation.headline}</h3>
          {atLeastDepth(depth, "analytical") ? <p style={{ fontSize: 14 }}>{brief.interpretation.body}</p> : null}
        </Card>
      ) : null}

      {/* Perspectives — distinct from facts */}
      {brief.perspectives.length > 0 ? (
        <Card>
          <SectionHeading>Leadership perspectives</SectionHeading>
          {brief.perspectives.map((p) => <Perspective key={p.id} p={p} deep={atLeastDepth(depth, "analytical")} />)}
        </Card>
      ) : null}

      {/* Benchmarks + targets appear from analytical depth up */}
      {atLeastDepth(depth, "analytical") && (brief.benchmarks.length > 0 || brief.targets.length > 0) ? (
        <Card>
          <SectionHeading>Benchmarks &amp; targets</SectionHeading>
          <div className="kv-metric-grid">
            {brief.benchmarks.map((b) => (
              <div key={b.id}>
                <ContentClassBadge contentClass={b.contentClass} />
                <div style={{ marginTop: 6 }}>
                  {b.value ? <MetricValue metric={b.value} resolveEvidence={resolve} /> : <em style={{ fontSize: 13 }}>{b.label}</em>}
                </div>
                {b.peerContext ? <p style={{ fontSize: 12, color: "var(--kv-muted)" }}>{b.peerContext}</p> : null}
              </div>
            ))}
            {brief.targets.map((t) => (
              <div key={t.id}>
                <ContentClassBadge contentClass={t.contentClass} />
                <div style={{ marginTop: 6 }}>{t.target ? <MetricValue metric={t.target} resolveEvidence={resolve} /> : null}</div>
                <p style={{ fontSize: 12, color: "var(--kv-muted)" }}>{t.label}{t.horizon ? ` · ${t.horizon}` : ""}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Domain readiness */}
      <Card>
        <SectionHeading>Domain readiness</SectionHeading>
        <table className="kv-table">
          <thead><tr><th>Domain</th><th>Status</th><th>Coverage</th><th>Open gaps</th></tr></thead>
          <tbody>
            {brief.domains.map((d) => (
              <tr key={d.domainKey}>
                <td>{d.label}</td>
                <td><span className="kv-pill" data-a={d.availabilityState}>{d.availabilityState.replace(/_/g, " ")}</span></td>
                <td>{Math.round(d.evidenceCoverage * 100)}%</td>
                <td>{d.openGapCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ProofFooter envelope={envelope} />
    </div>
  );
}

function Perspective({ p, deep }: { p: LeadershipPerspectiveV1; deep: boolean }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <ContentClassBadge contentClass="leadership_perspective" />
      <blockquote className="kv-quote">
        “{p.quote}”
        <div className="kv-quote-role">{p.role ?? p.attribution ?? "Leadership"} · {p.sourceBasis}</div>
      </blockquote>
      {deep ? (
        <div className="kv-stance">
          <span><b style={{ color: "var(--kv-ok)" }}>Supporting</b> {p.evidenceStance.supporting.length}</span>
          <span><b style={{ color: "var(--kv-alert)" }}>Challenging</b> {p.evidenceStance.challenging.length}</span>
          <span><b style={{ color: "var(--kv-warn)" }}>Uncertain</b> {p.evidenceStance.uncertain.length}</span>
        </div>
      ) : null}
    </div>
  );
}

"use client";

/**
 * Operations & Vendor Intelligence — a navigable LENS over the governed Knowledge
 * Baseline, not a separate dashboard and not a new source of truth. It connects
 * operational capabilities → applications → vendors → contracts → incidents/SLA →
 * risks → programs → evidence, reading only the consumption provider.
 *
 * Governance behavior on the surface:
 *  - Every displayed number is "represented in the active baseline"; a missing/
 *    withheld/not-loaded value renders as its state, never as 0.
 *  - No judgment is hard-coded (e.g. "high concentration risk"): vendor
 *    concentration shows raw indicators; risk is voiced only by governed risk
 *    objects reachable in the evidence-backed graph, and by aVa on request.
 *  - There are no approval or mutation controls.
 */

import { useEffect, useMemo, useState } from "react";
import { useConsumption } from "@/lib/knowledge/consumption-client";
import type {
  AvailabilityState,
  EntityFieldValue,
  EntitySummaryV1,
  EvidenceGapV1,
  SuggestedQuestionV1,
} from "@/lib/knowledge/consumption-contracts";
import {
  composeDependencyChain,
  composeVendorIntel,
  type CapabilityView,
  type LensSource,
  type RepresentedCount,
} from "@/lib/knowledge/operations-lens";
import { useShell } from "../state";
import { AvailabilityPill, Card, EvidenceButton, SectionHeading } from "../primitives";
import { WarningBanners } from "../mode-helpers";
import { atLeastDepth } from "../state";
import { useOperationsLens, type LensBaselineMeta } from "./useOperationsLens";
import { buildSupersetDeepLink } from "./analytics-handoff";

export function OperationsVendorLens() {
  const runtime = useConsumption();
  const { depth, lens, setAvaContext, askAva } = useShell();
  const result = useOperationsLens(depth, lens);
  const { source, overview, capabilities, vendors, meta } = result;

  const [capKey, setCapKey] = useState<string | null>(null);
  const [vendorRef, setVendorRef] = useState<string | null>(null);
  const [focalRef, setFocalRef] = useState<string | null>(null);

  // Feed aVa's packet with the evidence/facts/gaps currently in view.
  useEffect(() => {
    if (!source) return;
    const entities = [...source.applications, ...source.vendors, ...source.risks, ...source.programs];
    setAvaContext({
      evidenceRefs: Array.from(new Set(entities.flatMap((e) => e.evidenceRefs))),
      acceptedFactRefs: entities.map((e) => e.entityRef),
      knownGapRefs: source.gaps.map((g) => g.gapId),
      blockedSourceRefs: [],
    });
  }, [source, setAvaContext]);

  if (result.loading) {
    return <div className="kv-empty" role="status">Loading Operations &amp; Vendor Intelligence from the active baseline…</div>;
  }
  if (result.unavailable) {
    return <UnavailableState reason={result.unavailable} />;
  }
  if (!source || !overview || !meta) return null;

  return (
    <div>
      <WarningBanners envelope={null} />
      {result.warnings.length > 0 ? (
        <>
          {result.warnings.map((w, i) => (
            <div key={`${w.code}-${i}`} className="kv-banner" data-tone={w.code === "conflict_detected" || w.code === "not_loaded" ? "alert" : undefined} role="status">
              <span aria-hidden>i</span><span>{w.message}</span>
            </div>
          ))}
        </>
      ) : null}
      {result.unavailableSources.length > 0 ? (
        <div className="kv-banner" data-tone="alert" role="status">
          <span aria-hidden>!</span>
          <span>
            Some projections did not load ({result.unavailableSources.join(", ")}). This view shows what is
            available and marks the rest as unavailable — it does not fill the gaps.
          </span>
        </div>
      ) : null}

      <BaselineHeader meta={meta} coverage={overview.evidenceCoverage} />

      <ExecutiveOverview overview={overview} />

      <CapabilityNavigator
        capabilities={capabilities}
        selected={capKey}
        onSelect={(k) => {
          setCapKey(k);
          const cap = capabilities.find((c) => c.key === k);
          setFocalRef(cap?.applications[0]?.entityRef ?? null);
        }}
      />

      {capKey ? (
        <CapabilityDetail
          cap={capabilities.find((c) => c.key === capKey)!}
          source={source}
          onFocus={setFocalRef}
        />
      ) : null}

      <VendorIntelligence
        vendors={vendors}
        source={source}
        selected={vendorRef}
        onSelect={(v) => { setVendorRef(v); setFocalRef(v); }}
      />

      {focalRef ? <DependencyView source={source} focalRef={focalRef} /> : null}

      <SuggestedQuestions questions={result.suggestedQuestions} onAsk={askAva} modelsEnabled={runtime.modelsEnabled} />

      {atLeastDepth(depth, "proof") ? <ReconciliationStrip meta={meta} /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

function UnavailableState({ reason }: { reason: string }) {
  return (
    <Card>
      <SectionHeading eyebrow="Operations &amp; Vendor Intelligence">Not yet available</SectionHeading>
      <div className="kv-banner" data-tone="alert" role="status" style={{ marginTop: 8 }}>
        <span aria-hidden>!</span><span>{reason}</span>
      </div>
      <p style={{ color: "var(--kv-muted)", fontSize: 13, marginTop: 8 }}>
        This is a lens over the governed Knowledge Baseline. It never falls back to fixture or legacy
        data for a real tenant — until a baseline is active, there is nothing governed to show.
      </p>
    </Card>
  );
}

function BaselineHeader({ meta, coverage }: { meta: LensBaselineMeta; coverage: number | null }) {
  const supersetHref = buildSupersetDeepLink(meta);
  return (
    <div className="kv-ovv-baseline" role="group" aria-label="Active baseline">
      <div>
        <span className="kv-eyebrow">Active baseline</span>
        <div className="kv-mono" style={{ fontSize: 13 }}>{meta.knowledgeBaselineRef}</div>
      </div>
      <BaselineFact label="As of" value={meta.asOf.slice(0, 10)} />
      <BaselineFact label="Freshness" value={meta.freshnessState} />
      <BaselineFact
        label="Evidence coverage"
        value={coverage === null ? "—" : `${Math.round(coverage * 100)}%`}
      />
      <BaselineFact label="Source" value={meta.providerKind === "contract_fixture" ? "fixture (dev)" : "governed baseline"} />
      <div style={{ marginLeft: "auto", alignSelf: "center" }}>
        {supersetHref ? (
          <a className="kv-btn kv-btn-ghost" href={supersetHref} target="_blank" rel="noopener noreferrer">
            Analyze in Superset ↗
          </a>
        ) : (
          <button
            type="button"
            className="kv-btn kv-btn-ghost"
            disabled
            title="Configure NEXT_PUBLIC_SUPERSET_BASE_URL (foundation lane) to enable the governed Superset dashboard for this baseline."
          >
            Analyze in Superset
          </button>
        )}
      </div>
    </div>
  );
}
function BaselineFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="kv-eyebrow">{label}</span>
      <div style={{ fontSize: 13 }}>{value}</div>
    </div>
  );
}

function ExecutiveOverview({ overview }: { overview: NonNullable<ReturnType<typeof useOperationsLens>["overview"]> }) {
  const stats: RepresentedCount[] = [
    overview.criticalCapabilities,
    overview.applications,
    overview.materialVendors,
    overview.contracts,
    overview.renewalsApproaching,
    overview.operationalRisks,
    overview.deferredAssertions,
    overview.conflictingAssertions,
  ];
  return (
    <Card>
      <SectionHeading eyebrow="Executive overview">Operations context</SectionHeading>
      <div className="kv-metric-grid">
        {stats.map((c) => <RepresentedStat key={c.label} c={c} />)}
      </div>
      <p style={{ fontSize: 12, color: "var(--kv-muted)", marginTop: 8 }}>
        Counts reflect objects represented in the active baseline, not a measured universe. Missing,
        withheld and not-loaded values are shown as their state, never as zero.
      </p>
    </Card>
  );
}

function RepresentedStat({ c }: { c: RepresentedCount }) {
  return (
    <div className="kv-metric">
      {c.value === null ? (
        <span className="kv-metric-noval" title={c.absenceReason ?? undefined}>No value</span>
      ) : (
        <span className="kv-metric-val">{c.value.toLocaleString()}</span>
      )}
      <span className="kv-metric-label">{c.label}</span>
      <span style={{ marginTop: 4 }}><AvailabilityPill state={c.availabilityState} /></span>
    </div>
  );
}

function CapabilityNavigator({
  capabilities, selected, onSelect,
}: {
  capabilities: CapabilityView[];
  selected: string | null;
  onSelect: (k: string) => void;
}) {
  return (
    <Card>
      <SectionHeading eyebrow="Capabilities">Select a capability</SectionHeading>
      <div className="kv-caps-grid" role="group" aria-label="Operational capabilities">
        {capabilities.map((c) => (
          <button
            key={c.key}
            type="button"
            className="kv-cap-tile"
            data-selected={selected === c.key}
            data-represented={c.represented}
            aria-pressed={selected === c.key}
            onClick={() => onSelect(c.key)}
          >
            <span className="kv-cap-label">{c.label}</span>
            <span className="kv-cap-meta">
              {c.represented
                ? `${c.applications.length} system${c.applications.length === 1 ? "" : "s"} · ${c.vendorRefs.length} vendor${c.vendorRefs.length === 1 ? "" : "s"}`
                : "Not yet mapped"}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function CapabilityDetail({
  cap, source, onFocus,
}: {
  cap: CapabilityView;
  source: LensSource;
  onFocus: (ref: string) => void;
}) {
  const runtime = useConsumption();
  if (!cap.represented) {
    return (
      <Card>
        <SectionHeading eyebrow="Capability">{cap.label}</SectionHeading>
        <div className="kv-empty">{cap.absenceReason}</div>
      </Card>
    );
  }
  const vendorNames = cap.vendorRefs.map(
    (ref) => source.vendors.find((v) => v.entityRef === ref)?.displayName ?? ref,
  );
  return (
    <Card>
      <SectionHeading eyebrow="Capability">{cap.label}</SectionHeading>
      <p style={{ color: "var(--kv-muted)", fontSize: 13, marginTop: 0 }}>{cap.description}</p>

      <div className="kv-eyebrow" style={{ marginTop: 10 }}>Connected systems</div>
      <table className="kv-table">
        <thead><tr><th>Application</th><th>Owner</th><th>Criticality</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {cap.applications.map((app) => (
            <tr key={app.entityRef}>
              <td><button type="button" className="kv-row-btn" onClick={() => onFocus(app.entityRef)}>{app.displayName}</button></td>
              <td>{fieldText(app, "owner")}</td>
              <td>{fieldText(app, "criticality")}</td>
              <td><AvailabilityPill state={app.availabilityState} /></td>
              <td><EvidenceButton title={app.displayName} descriptors={runtime.resolveEvidence(app.evidenceRefs)} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
        <div>
          <div className="kv-eyebrow">Vendors</div>
          {vendorNames.length ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {cap.vendorRefs.map((ref, i) => (
                <button key={ref} type="button" className="kv-chip" onClick={() => onFocus(ref)}>{vendorNames[i]}</button>
              ))}
            </div>
          ) : <span className="kv-empty" style={{ padding: 0 }}>No vendor mapped in this baseline.</span>}
        </div>
        <div>
          <div className="kv-eyebrow">Operational risks (graph-linked)</div>
          {cap.linkedRisks.length ? (
            <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
              {cap.linkedRisks.map((r) => <li key={r.entityRef} style={{ fontSize: 13 }}>{r.displayName}</li>)}
            </ul>
          ) : <span className="kv-empty" style={{ padding: 0 }}>None linked in the graph.</span>}
        </div>
      </div>
    </Card>
  );
}

function VendorIntelligence({
  vendors, source, selected, onSelect,
}: {
  vendors: Array<{ vendorRef: string; displayName: string; availabilityState: AvailabilityState }>;
  source: LensSource;
  selected: string | null;
  onSelect: (ref: string) => void;
}) {
  const runtime = useConsumption();
  const intel = useMemo(
    () => (selected ? composeVendorIntel(source, selected) : null),
    [source, selected],
  );

  return (
    <Card>
      <SectionHeading eyebrow="Vendor intelligence">Vendors</SectionHeading>
      {vendors.length === 0 ? (
        <div className="kv-empty">No vendors are represented in the active baseline.</div>
      ) : (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {vendors.map((v) => (
            <button key={v.vendorRef} type="button" className="kv-chip" data-selected={selected === v.vendorRef} aria-pressed={selected === v.vendorRef} onClick={() => onSelect(v.vendorRef)}>
              {v.displayName}
            </button>
          ))}
        </div>
      )}

      {intel ? (
        <div className="kv-vendor-panel">
          <div className="kv-metric-grid">
            <MiniStat label="Applications supported" value={intel.concentration.applicationsSupported} />
            <MiniStat label="Tier-1 systems" value={intel.concentration.tierOneApplications} />
            <MiniStat label="Capabilities touched" value={intel.concentration.capabilitiesTouched} />
            <RepresentedStat c={intel.contractCount} />
            <RepresentedStat c={intel.renewalsApproaching} />
            <RepresentedStat c={intel.transformationExposure} />
          </div>

          <div className="kv-eyebrow" style={{ marginTop: 12 }}>Supported applications</div>
          {intel.supportedApplications.length ? (
            <ul style={{ margin: "4px 0", paddingLeft: 16 }}>
              {intel.supportedApplications.map((a) => (
                <li key={a.entityRef} style={{ fontSize: 13 }}>
                  {a.displayName} <span style={{ color: "var(--kv-muted)" }}>· {fieldText(a, "criticality")}</span>
                </li>
              ))}
            </ul>
          ) : <div className="kv-empty" style={{ padding: 0 }}>No supported applications linked in this baseline.</div>}

          <div className="kv-eyebrow" style={{ marginTop: 8 }}>Incident / SLA summary</div>
          {intel.incidentSummary.length ? (
            <table className="kv-table">
              <tbody>
                {intel.incidentSummary.map((f) => (
                  <tr key={f.key}>
                    <td>{f.label}</td>
                    <td>{f.value === null ? <em style={{ color: "var(--kv-alert)" }}>No value</em> : String(f.value)}</td>
                    <td><AvailabilityPill state={f.availabilityState} /></td>
                    <td><EvidenceButton title={f.label} descriptors={runtime.resolveEvidence(f.evidenceRefs)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="kv-empty" style={{ padding: 0 }}>Incident and SLA measures are not present in this baseline.</div>}

          {intel.linkedRisks.length ? (
            <div style={{ marginTop: 8 }}>
              <div className="kv-eyebrow">Governed risks reachable from this vendor</div>
              <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
                {intel.linkedRisks.map((r) => <li key={r.entityRef} style={{ fontSize: 13 }}>{r.displayName}</li>)}
              </ul>
            </div>
          ) : null}

          {intel.evidenceGaps.length ? (
            <div style={{ marginTop: 8 }}>
              <div className="kv-eyebrow">Evidence gaps (vendor domain)</div>
              {intel.evidenceGaps.map((g) => <GapRow key={g.gapId} gap={g} />)}
            </div>
          ) : null}

          <p style={{ fontSize: 12, color: "var(--kv-muted)", marginTop: 10 }}>
            Concentration figures are indicators, not a judgment. Any concentration <em>risk</em> is
            stated only by a governed risk object above, or by asking aVa.
          </p>
        </div>
      ) : (
        <div className="kv-empty" style={{ padding: 0 }}>Select a vendor to see its operational exposure.</div>
      )}
    </Card>
  );
}

function DependencyView({ source, focalRef }: { source: LensSource; focalRef: string }) {
  const runtime = useConsumption();
  const chain = useMemo(() => composeDependencyChain(source, focalRef), [source, focalRef]);
  const links = chain.links.filter((l) => l.fromRef === focalRef || l.toRef === focalRef);

  return (
    <Card>
      <SectionHeading eyebrow="Dependencies">{chain.focalLabel}</SectionHeading>
      {links.length === 0 ? (
        <div className="kv-empty">No governed relationships are loaded for this object.</div>
      ) : (
        <ul className="kv-chain">
          {links.map((l) => {
            const focalIsFrom = l.fromRef === focalRef;
            const otherLabel = focalIsFrom ? l.toLabel : l.fromLabel;
            const otherType = focalIsFrom ? l.toType : l.fromType;
            return (
              <li key={l.edgeId} className="kv-chain-row" data-authority={l.authorityState}>
                <span className="kv-chain-rel">{l.relationshipType.replace(/_/g, " ")}</span>
                <span className="kv-chain-target">{otherLabel}</span>
                <span className="kv-chip" style={{ pointerEvents: "none" }}>{otherType}</span>
                {l.scope === "target" ? <span className="kv-pill" data-a="candidate">target-state</span> : null}
                {l.authorityState === "candidate" ? <span className="kv-pill" data-a="candidate">candidate</span> : null}
                <EvidenceButton title={`${chain.focalLabel} → ${otherLabel}`} context={`Relationship: ${l.relationshipType}`} descriptors={runtime.resolveEvidence(l.evidenceRefs)} />
              </li>
            );
          })}
        </ul>
      )}
      {chain.truncated ? (
        <p style={{ fontSize: 12, color: "var(--kv-muted)", marginTop: 6 }}>
          Graph truncated · {chain.omittedNodeCount} further node(s) not shown. This is a bounded view, not the whole graph.
        </p>
      ) : null}
    </Card>
  );
}

function SuggestedQuestions({
  questions, onAsk, modelsEnabled,
}: {
  questions: SuggestedQuestionV1[];
  onAsk: (q: string) => void;
  modelsEnabled: boolean;
}) {
  if (questions.length === 0) return null;
  return (
    <Card>
      <SectionHeading eyebrow="Decision questions">Ask aVa</SectionHeading>
      <p style={{ fontSize: 13, color: "var(--kv-muted)", marginTop: 0 }}>
        These prompts are UI suggestions. Answers come from baseline-bound aVa — never authored here.
        {modelsEnabled ? "" : " aVa reasoning is off in this environment, so answers are unavailable."}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {questions.map((q) => (
          <button key={q.id} type="button" className="kv-suggested" onClick={() => onAsk(q.question)} disabled={!modelsEnabled && q.requiresModel}>
            {q.question}
          </button>
        ))}
      </div>
    </Card>
  );
}

function ReconciliationStrip({ meta }: { meta: LensBaselineMeta }) {
  // The six-field identity every analytical surface must expose so AbarVa, Cube,
  // Superset and Observable can be reconciled (see clients/shared/22-operations-
  // vendor-analytics/PARITY_CONTRACT.md). metric-definition version and refresh run
  // resolve when the foundation lane wires the semantic layer.
  return (
    <div className="kv-proof" aria-label="Analytical parity identity">
      <div>tenant: {meta.tenantKey} · provider: {meta.providerKind}</div>
      <div>baseline: {meta.knowledgeBaselineRef}</div>
      <div>baseline-content-hash: {meta.contentHash}</div>
      <div>projection-contract: {meta.projectionContractVersion} · as-of: {meta.asOf}</div>
      <div>metric-definition-version: {"resolved at activation (Cube)"}</div>
      <div>refresh-run: {"resolved at activation (materialization run)"}</div>
      <div>publications: {Object.entries(meta.domainPublicationVersions).map(([k, v]) => `${k}=${v}`).join(" · ") || "—"}</div>
    </div>
  );
}

// --- small shared bits ---------------------------------------------------

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="kv-metric">
      <span className="kv-metric-val">{value.toLocaleString()}</span>
      <span className="kv-metric-label">{label}</span>
    </div>
  );
}

function GapRow({ gap }: { gap: EvidenceGapV1 }) {
  return (
    <div style={{ borderTop: "1px solid var(--kv-line)", padding: "6px 0" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span className="kv-classbadge" data-c="evidence_gap">{gap.severity}</span>
        <strong style={{ fontSize: 13 }}>{gap.title}</strong>
        <AvailabilityPill state={gap.gapState} />
      </div>
      <p style={{ fontSize: 12, color: "var(--kv-muted)", margin: "2px 0 0" }}>{gap.businessImpact}</p>
    </div>
  );
}

function fieldText(entity: EntitySummaryV1, key: string): string {
  const f: EntityFieldValue | undefined = entity.fields.find((x) => x.key === key);
  if (!f || f.value === null) return "—";
  return String(f.value);
}

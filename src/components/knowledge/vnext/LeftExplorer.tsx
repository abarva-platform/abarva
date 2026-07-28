"use client";

/**
 * Contextual left explorer. Its contents change by mode — it is NOT one giant
 * global tree. Brief shows suggested questions; Explore/Evidence show a domain
 * filter; Relationships shows a focal-entity picker + legend.
 */

import { useConsumption } from "@/lib/knowledge/consumption-client";
import type { KnowledgeMode } from "@/lib/knowledge/consumption-contracts";
import { useShell } from "./state";
import { useEnvelope } from "./mode-helpers";

export function LeftExplorer() {
  const { mode } = useShell();
  return (
    <nav aria-label={`${mode} navigation`}>
      {mode === "brief" ? <BriefNav /> : null}
      {(mode === "explore" || mode === "evidence") ? <DomainNav mode={mode} /> : null}
      {mode === "relationships" ? <FocalNav /> : null}
    </nav>
  );
}

function BriefNav() {
  const runtime = useConsumption();
  const { setMode } = useShell();
  const { envelope } = useEnvelope(
    () => runtime.provider.getSuggestedQuestions({ tenantKey: runtime.binding.tenantKey, mode: "brief" }),
    [runtime],
  );
  return (
    <div>
      <div className="kv-eyebrow" style={{ marginBottom: 8 }}>Suggested questions</div>
      {(envelope?.data ?? []).map((q) => (
        <button
          key={q.id}
          type="button"
          className="kv-nav-item"
          onClick={() => setMode(q.mode as KnowledgeMode)}
          title={q.requiresModel ? "Best answered with aVa" : "Answered by navigating"}
        >
          <span>{q.question}</span>
          {q.requiresModel ? <span className="kv-nav-count">aVa</span> : null}
        </button>
      ))}
    </div>
  );
}

function DomainNav({ mode }: { mode: "explore" | "evidence" }) {
  const runtime = useConsumption();
  const { filters, setFilters } = useShell();
  const active = filters.domain?.[0] ?? null;
  const { envelope } = useEnvelope(
    () => runtime.provider.exploreEntities({ tenantKey: runtime.binding.tenantKey }),
    [runtime],
  );
  const domains = envelope?.data.domains ?? [];
  const select = (domainKey: string | null) =>
    setFilters(
      domainKey
        ? { ...filters, domain: [domainKey] }
        : Object.fromEntries(Object.entries(filters).filter(([k]) => k !== "domain")),
    );

  return (
    <div>
      <div className="kv-eyebrow" style={{ marginBottom: 8 }}>Domains ({mode})</div>
      <button type="button" className="kv-nav-item" aria-current={active === null} onClick={() => select(null)}>
        <span>All domains</span>
      </button>
      {domains.map((d) => (
        <button key={d.domainKey} type="button" className="kv-nav-item" aria-current={active === d.domainKey} onClick={() => select(d.domainKey)}>
          <span>{d.label}</span>
          <span className="kv-nav-count">{d.availabilityState.replace(/_/g, " ")}</span>
        </button>
      ))}
    </div>
  );
}

function FocalNav() {
  const runtime = useConsumption();
  const { focalEntityRefs, setFocalEntityRefs } = useShell();
  const { envelope } = useEnvelope(
    () => runtime.provider.exploreEntities({ tenantKey: runtime.binding.tenantKey }),
    [runtime],
  );
  const entities = envelope?.data.entities ?? [];
  return (
    <div>
      <div className="kv-eyebrow" style={{ marginBottom: 8 }}>Focal entity</div>
      {entities.map((e) => (
        <button
          key={e.entityRef}
          type="button"
          className="kv-nav-item"
          aria-current={focalEntityRefs.includes(e.entityRef)}
          onClick={() => setFocalEntityRefs([e.entityRef])}
        >
          <span>{e.displayName}</span>
          <span className="kv-nav-count">{e.entityType}</span>
        </button>
      ))}
      <div style={{ marginTop: 14, fontSize: 12, color: "var(--kv-muted)" }}>
        <div className="kv-eyebrow" style={{ marginBottom: 6 }}>Legend</div>
        <div>— solid = accepted edge</div>
        <div>· · dashed = candidate edge</div>
      </div>
    </div>
  );
}

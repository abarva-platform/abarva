"use client";

/**
 * Explore mode — inventory across domains. Paginated table (never mounts a huge
 * inventory at once). Row selection loads entity detail. Missing/withheld fields
 * render as their state, never as zero.
 */

import { useEffect, useState } from "react";
import { useConsumption } from "@/lib/knowledge/consumption-client";
import type { EntityDetailV1, EntitySummaryV1 } from "@/lib/knowledge/consumption-contracts";
import { useShell } from "../state";
import { AvailabilityPill, Card, EvidenceButton, SectionHeading } from "../primitives";
import { ErrorBlock, LoadingBlock, ProofFooter, useEnvelope, WarningBanners } from "../mode-helpers";
import { OperationsVendorLens } from "../operations/OperationsVendorLens";

type ExplorePerspective = "inventory" | "operations";

export function ExploreMode() {
  const [perspective, setPerspective] = useState<ExplorePerspective>("inventory");
  return (
    <div>
      <div className="kv-perspective-switch" role="tablist" aria-label="Explore perspective">
        <button type="button" role="tab" aria-selected={perspective === "inventory"} className="kv-mode-btn" onClick={() => setPerspective("inventory")}>
          Inventory
        </button>
        <button type="button" role="tab" aria-selected={perspective === "operations"} className="kv-mode-btn" onClick={() => setPerspective("operations")}>
          Operations &amp; Vendor Intelligence
        </button>
      </div>
      {perspective === "inventory" ? <InventoryPerspective /> : <OperationsVendorLens />}
    </div>
  );
}

function InventoryPerspective() {
  const runtime = useConsumption();
  const { depth, lens, filters, setAvaContext } = useShell();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const domainKey = filters.domain?.[0] ?? null;

  const { envelope, loading, error } = useEnvelope(
    () => runtime.provider.exploreEntities({ tenantKey: runtime.binding.tenantKey, depth, lens, domainKey, search, page: 1, pageSize: 25 }),
    [runtime, depth, lens, domainKey, search],
  );

  useEffect(() => {
    if (!envelope) return;
    setAvaContext({
      evidenceRefs: envelope.data.entities.flatMap((e) => e.evidenceRefs),
      acceptedFactRefs: envelope.data.entities.map((e) => e.entityRef),
      knownGapRefs: envelope.knownGapRefs,
      blockedSourceRefs: [],
    });
  }, [envelope, setAvaContext]);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock error={error} />;
  if (!envelope) return null;

  const result = envelope.data;

  return (
    <div>
      <WarningBanners envelope={envelope} />
      <SectionHeading eyebrow="Explore">{domainKey ? `Domain: ${domainKey}` : "All domains"}</SectionHeading>

      <Card>
        <label className="kv-visually-hidden" htmlFor="kv-explore-search">Filter inventory</label>
        <input
          id="kv-explore-search"
          className="kv-select"
          style={{ width: "100%", marginBottom: 12 }}
          placeholder="Filter by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {result.entities.length === 0 ? (
          <div className="kv-empty">No entities match. This is an empty result, not zero — the underlying data may be filtered or not loaded.</div>
        ) : (
          <table className="kv-table">
            <thead><tr><th>Name</th><th>Type</th><th>Domain</th><th>Status</th></tr></thead>
            <tbody>
              {result.entities.map((e) => (
                <tr key={e.entityRef}>
                  <td>
                    <button type="button" className="kv-row-btn" onClick={() => setSelected(e.entityRef)}>
                      {e.displayName}
                    </button>
                  </td>
                  <td>{e.entityType}</td>
                  <td>{e.domainKey}</td>
                  <td><AvailabilityPill state={e.availabilityState} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={{ fontSize: 12, color: "var(--kv-muted)", marginTop: 8 }}>
          Showing {result.entities.length} of {result.totalCount} · page {result.page}
        </p>
      </Card>

      {selected ? <EntityDetail entityRef={selected} onClose={() => setSelected(null)} /> : null}

      <ProofFooter envelope={envelope} />
    </div>
  );
}

function EntityDetail({ entityRef, onClose }: { entityRef: string; onClose: () => void }) {
  const runtime = useConsumption();
  const { depth, lens } = useShell();
  const { envelope, loading } = useEnvelope(
    () => runtime.provider.getEntityDetail({ tenantKey: runtime.binding.tenantKey, depth, lens, entityRef }),
    [runtime, depth, lens, entityRef],
  );

  if (loading || !envelope) return <Card><LoadingBlock /></Card>;
  const detail: EntityDetailV1 = envelope.data;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <SectionHeading eyebrow={detail.entity.entityType}>{detail.entity.displayName || entityRef}</SectionHeading>
        <button type="button" className="kv-btn kv-btn-ghost" onClick={onClose}>Close</button>
      </div>
      <FieldTable fields={detail.fields} />
      {detail.perspectives.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          {detail.perspectives.map((p) => (
            <blockquote key={p.id} className="kv-quote">“{p.quote}”<div className="kv-quote-role">{p.role}</div></blockquote>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function FieldTable({ fields }: { fields: EntitySummaryV1["fields"] }) {
  const runtime = useConsumption();
  return (
    <table className="kv-table">
      <thead><tr><th>Field</th><th>Value</th><th>Status</th><th></th></tr></thead>
      <tbody>
        {fields.map((f) => (
          <tr key={f.key}>
            <td>{f.label}</td>
            <td>{f.value === null ? <em style={{ color: "var(--kv-alert)" }}>No value</em> : String(f.value)}</td>
            <td><AvailabilityPill state={f.availabilityState} /></td>
            <td><EvidenceButton title={f.label} descriptors={runtime.resolveEvidence(f.evidenceRefs)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

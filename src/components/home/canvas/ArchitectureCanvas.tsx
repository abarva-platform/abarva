"use client";

import { useMemo, useState } from "react";
import { resolveArchitectureView } from "@/lib/visual-system/resolveArchitectureView";
import { renderArchitectureViewSvg } from "@/lib/visual-system/architecture-svg-renderer";
import type { HomeReviewBundle } from "@/lib/home/preview/types";
import type { CanvasInspection } from "./ChapterCanvas";
import styles from "./HomeCanvas.module.css";

export function ArchitectureCanvas({
  bundle,
  tenantKey,
  tenantName,
  flow,
  inspect,
}: {
  bundle: HomeReviewBundle;
  tenantKey: string;
  tenantName: string;
  flow: boolean;
  inspect: (detail: CanvasInspection) => void;
}) {
  const [zoom, setZoom] = useState(100);
  const [capability, setCapability] = useState("");
  const types = bundle.technologyEstate?.recordTypes ?? [];
  const applications = types.find(
    (family) => family.objectType === "application_system",
  );
  const data = types.find(
    (family) => family.objectType === "data_asset_or_integration",
  );
  const integrations = useMemo(
    () =>
      data
        ? {
            ...data,
            rows: data.rows.filter(
              (row) => row.recordKind !== "data_analytics_workload",
            ),
          }
        : undefined,
    [data],
  );
  const result = useMemo(
    () =>
      resolveArchitectureView({
        format: flow ? "end_to_end_data_flow" : "executive_landscape",
        tenantKey,
        tenantDisplayName: tenantName,
        canonicalBuild: bundle.provenance.canonical_snapshot_hash,
        applications,
        integrations,
        capability: capability || null,
      }),
    [
      flow,
      tenantKey,
      tenantName,
      bundle.provenance.canonical_snapshot_hash,
      applications,
      integrations,
      capability,
    ],
  );
  const rendered = useMemo(
    () =>
      result.status === "ready"
        ? renderArchitectureViewSvg(result.view, { width: 1100 })
        : null,
    [result],
  );
  const capabilities = applications
    ? [
        ...new Set(
          applications.rows
            .map((row) => String(row.businessFunction ?? ""))
            .filter(Boolean),
        ),
      ].sort()
    : [];
  if (result.status === "refused")
    return (
      <section className={styles.section}>
        <div className={styles.empty}>
          <strong>
            {flow
              ? "End-to-end data flow is not established"
              : "Architecture view is not supported"}
          </strong>
          {result.refusal.failedRules.map((rule) => (
            <p key={rule.ruleId}>
              {rule.headline}: {rule.detail}
            </p>
          ))}
        </div>
        <h3 style={{ marginTop: 24 }}>Evidence needed</h3>
        <ul>
          {result.refusal.evidenceNeeded.map((item) => (
            <li key={item.evidenceType} style={{ marginBottom: 12 }}>
              {item.description}
            </li>
          ))}
        </ul>
        <p className={styles.basis}>
          The available data records remain openable in the explorer. A partial
          graph is not presented as an established end-to-end architecture.
        </p>
      </section>
    );
  if (!rendered) return null;
  const view = result.view;
  function openNode(target: EventTarget | null) {
    const element =
      target instanceof Element ? target.closest("[data-node-id]") : null;
    const node = view.nodes.find(
      (candidate) => candidate.id === element?.getAttribute("data-node-id"),
    );
    if (!node) return;
    inspect({
      title: node.label,
      text: node.aggregation
        ? `${node.aggregation.memberCount} records grouped by ${node.aggregation.groupByField}: ${node.aggregation.groupByValue}.`
        : (node.roleBasisNote ?? "One node in the governed architecture view."),
      sourceRefs: node.evidenceIds,
      basis: `${node.evidenceBasis === "CANONICAL" ? "Recorded object" : node.evidenceBasis === "ABARVA_DERIVED" ? "Derived grouping, not a new source object" : "Candidate, not established"}. ${node.aggregation ? "The group carries the member identities of its underlying records." : ""}`,
    });
  }
  return (
    <section className={styles.section}>
      <div className={styles.graphTools}>
        {!flow && capabilities.length > 0 && (
          <label className={styles.basis}>
            Business function{" "}
            <select
              value={capability}
              onChange={(event) => setCapability(event.target.value)}
              style={{
                marginLeft: 9,
                maxWidth: 240,
                padding: 7,
                border: "1px solid #d5dee3",
                borderRadius: 4,
              }}
            >
              <option value="">Whole enterprise</option>
              {capabilities.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        )}
        <label className={styles.basis}>
          Zoom{" "}
          <input
            aria-label="Diagram zoom"
            type="range"
            min={50}
            max={180}
            step={10}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            style={{ width: 100, verticalAlign: "middle", marginLeft: 8 }}
          />
        </label>
        <button className={styles.textButton} onClick={() => setZoom(100)}>
          Reset
        </button>
        <span>
          {view.nodes.length} visible nodes · {view.edges.length} recorded or
          derived connections
        </span>
      </div>
      <div
        className={styles.diagram}
        onClick={(event) => openNode(event.target)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openNode(event.target);
          }
        }}
      >
        <div
          style={{ width: `${zoom}%`, minWidth: 650 }}
          dangerouslySetInnerHTML={{ __html: rendered.svg }}
        />
      </div>
      <p className={styles.basis}>{view.contextLine}</p>
      {view.limitations.length > 0 && (
        <details className={styles.graphDetail}>
          <summary>View limitations ({view.limitations.length})</summary>
          <ul>
            {view.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, List, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { resolveArchitectureView } from "@/lib/visual-system/resolveArchitectureView";
import { renderArchitectureViewSvg } from "@/lib/visual-system/architecture-svg-renderer";
import { wrapLabel } from "@/lib/visual-system/layout/architecture-layout";
import {
  computeEvidenceCoverage,
  type ArchitectureView,
} from "@/lib/visual-system/architecture-view-contract";
import type { HomeReviewBundle } from "@/lib/home/preview/types";
import type { CanvasInspection } from "./ChapterCanvas";
import styles from "./HomeCanvas.module.css";
import { FlowRecordCanvas, mapRecordBasis } from "./FlowRecordCanvas";

const FOCUSED_NODE_LIMIT = 12;
const FOCUSED_EDGE_LIMIT = 18;

function focusedMap(view: ArchitectureView, flow: boolean, focusId: string) {
  const ids = new Set<string>();
  if (flow) {
    ids.add(focusId);
    const connections = view.edges
      .filter((edge) => edge.from === focusId || edge.to === focusId)
      .sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1));
    for (const edge of connections) {
      const other = edge.from === focusId ? edge.to : edge.from;
      if (ids.size < FOCUSED_NODE_LIMIT) ids.add(other);
    }
  } else {
    view.nodes.slice(0, FOCUSED_NODE_LIMIT).forEach((node) => ids.add(node.id));
  }
  const nodes = view.nodes.filter((node) => ids.has(node.id));
  const edges = view.edges
    .filter((edge) => ids.has(edge.from) && ids.has(edge.to))
    .filter((edge) => !flow || edge.from === focusId || edge.to === focusId)
    .slice(0, FOCUSED_EDGE_LIMIT);
  return {
    ...view,
    nodes,
    edges,
    overlays: view.overlays.map((overlay) => ({
      ...overlay,
      nodeIds: overlay.nodeIds.filter((id) => ids.has(id)),
    })),
    evidenceCoverage: computeEvidenceCoverage(
      nodes,
      edges,
      view.evidenceCoverage.canonicalBuild,
    ),
  };
}

export function ArchitectureCanvas({
  bundle,
  tenantKey,
  tenantName,
  flow,
  inspect,
  recordsHref,
}: {
  bundle: HomeReviewBundle;
  tenantKey: string;
  tenantName: string;
  flow: boolean;
  inspect: (detail: CanvasInspection) => void;
  recordsHref: string;
}) {
  const [zoom, setZoom] = useState(100);
  const [capability, setCapability] = useState<string | null>(null);
  const [focusNode, setFocusNode] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const diagram = useRef<HTMLDivElement>(null);
  const types = bundle.technologyEstate?.recordTypes ?? [];
  const applications = types.find(
    (family) => family.objectType === "application_system",
  );
  const data = types.find(
    (family) => family.objectType === "data_asset_or_integration",
  );
  const capabilities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of applications?.rows ?? []) {
      const name = String(row.businessFunction ?? "").trim();
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
  }, [applications]);
  const selectedCapability =
    capability !== null &&
    (!capability || capabilities.some(([name]) => name === capability))
      ? capability
      : (capabilities[0]?.[0] ?? "");
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
        capability: selectedCapability || null,
      }),
    [
      flow,
      tenantKey,
      tenantName,
      bundle.provenance.canonical_snapshot_hash,
      applications,
      integrations,
      selectedCapability,
    ],
  );
  const focusOptions = useMemo(() => {
    if (result.status !== "ready" || !flow) return [];
    const degree = new Map<string, number>();
    for (const edge of result.view.edges) {
      degree.set(edge.from, (degree.get(edge.from) ?? 0) + 1);
      degree.set(edge.to, (degree.get(edge.to) ?? 0) + 1);
    }
    return result.view.nodes
      .filter((node) => degree.has(node.id))
      .sort(
        (a, b) =>
          Number(a.aggregation?.groupByField === "endpoint") -
            Number(b.aggregation?.groupByField === "endpoint") ||
          (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) ||
          a.label.localeCompare(b.label),
      );
  }, [result, flow]);
  const selectedFocus =
    focusOptions.find((node) => node.id === focusNode) ?? focusOptions[0];
  const displayView = useMemo(
    () =>
      result.status === "ready"
        ? expanded
          ? result.view
          : focusedMap(result.view, flow, selectedFocus?.id ?? "")
        : null,
    [result, expanded, flow, selectedFocus?.id],
  );
  const rendered = useMemo(
    () =>
      displayView
        ? renderArchitectureViewSvg(displayView, { width: 1100 })
        : null,
    [displayView],
  );
  useEffect(() => {
    const svg = diagram.current?.querySelector("svg");
    if (svg) {
      svg.style.width = "100%";
      svg.style.minWidth = "0";
      svg.style.height = "auto";
    }
    // Fit complete labels and record units into the existing SVG geometry.
    for (const layoutNode of rendered?.layout.nodes ?? []) {
      const node = layoutNode.node;
      const group = [
        ...(diagram.current?.querySelectorAll<SVGGElement>("[data-node-id]") ??
          []),
      ].find((element) => element.getAttribute("data-node-id") === node.id);
      if (!group) continue;
      const title =
        group.querySelector("title") ??
        document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = node.label;
      group.prepend(title);
      if (layoutNode.labelLines.some((line) => line.endsWith("\u2026"))) {
        const label = group.querySelector("text");
        if (label) {
          const lineLimit = Math.max(1, layoutNode.labelLines.length);
          let fontSize = 13;
          const fullLines = () =>
            wrapLabel(
              node.label,
              Math.max(
                2,
                Math.floor((layoutNode.width - 28) / (fontSize * 0.6)),
              ),
              Infinity,
            );
          let lines = fullLines();
          while (lines.length > lineLimit) {
            fontSize *= 0.9;
            lines = fullLines();
          }
          label.setAttribute("font-size", fontSize.toFixed(1));
          label.replaceChildren(
            ...lines.map((line, index) => {
              const span = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "tspan",
              );
              span.setAttribute("x", String(layoutNode.x + 14));
              span.setAttribute("dy", String(index === 0 ? 0 : fontSize + 3));
              span.textContent = line;
              return span;
            }),
          );
        }
      }
      if (flow && node.aggregation) {
        const meta = group.querySelectorAll("text")[1];
        if (meta)
          meta.textContent = `${node.aggregation.memberCount} ${node.aggregation.groupByField === "systemName" ? "environments" : "endpoints"}`;
      }
    }
  }, [rendered, flow, showRecords]);
  if (flow && showRecords && result.status === "ready")
    return (
      <section>
        <button
          className={styles.textButton}
          onClick={() => setShowRecords(false)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to diagram
        </button>
        <FlowRecordCanvas
          bundle={bundle}
          recordsHref={recordsHref}
          inspect={inspect}
        />
      </section>
    );
  if (result.status === "refused" && flow)
    return (
      <FlowRecordCanvas
        bundle={bundle}
        refusal={result.refusal}
        recordsHref={recordsHref}
        inspect={inspect}
      />
    );
  if (result.status === "refused")
    return (
      <section className={styles.section}>
        <p className={styles.basis}>{mapRecordBasis(bundle)}</p>
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
  if (!rendered || !displayView) return null;
  const view = result.view;
  const costRows = (applications?.rows ?? []).filter(
    (row) =>
      !selectedCapability ||
      String(row.businessFunction ?? "").trim() === selectedCapability,
  );
  const knownCosts = costRows.flatMap((row) => {
    const value = row.annualCostUsd;
    if (typeof value !== "number" && typeof value !== "string") return [];
    if (typeof value === "string" && !value.trim()) return [];
    const amount = Number(value);
    return Number.isFinite(amount) ? [amount] : [];
  });
  const costSubtotal = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(knownCosts.reduce((sum, value) => sum + value, 0));
  const bundleBasis = mapRecordBasis(bundle);
  const packetEvidenceIds = new Set([
    ...bundle.thesis.signalPacket.signals.map((item) => item.id),
    ...bundle.thesis.signalPacket.contextItems.map((item) => item.id),
  ]);
  function inspectNode(node: ArchitectureView["nodes"][number]) {
    inspect({
      title: node.label,
      text: `${
        node.aggregation
          ? `${node.aggregation.memberCount} ${flow ? (node.aggregation.groupByField === "systemName" ? "environments" : "endpoints") : "application records"} grouped by ${node.aggregation.groupByField}: ${node.aggregation.groupByValue}.`
          : (node.roleBasisNote ?? "One recorded object in this projection.")
      }\nProjection node ID: ${node.id}\nProjection caption as supplied: ${view.contextLine ?? "Not supplied"}`,
      evidenceIds: node.evidenceIds.filter((ref) => packetEvidenceIds.has(ref)),
      sourceRefs: node.evidenceIds.filter((ref) => !packetEvidenceIds.has(ref)),
      basis: `${bundleBasis} Canonical build: ${view.evidenceCoverage.canonicalBuild || bundle.provenance.canonical_snapshot_hash || "not established"}. ${node.evidenceBasis === "CANONICAL" ? "Recorded fields" : node.evidenceBasis === "ABARVA_DERIVED" ? "Derived grouping, not a new source object" : "Candidate, not established"}. References are those supplied by the projection, not proof of inspected source rows. Source-row or document links are not resolved here. Derived associations do not establish canonical dependencies. Recorded or modeled cost is not verified spend.`,
    });
  }
  function openNode(target: EventTarget | null) {
    const element =
      target instanceof Element ? target.closest("[data-node-id]") : null;
    const node = view.nodes.find(
      (candidate) => candidate.id === element?.getAttribute("data-node-id"),
    );
    if (!node) return;
    inspectNode(node);
  }
  return (
    <section
      className={styles.section}
      style={{ minWidth: 0, maxWidth: "100%" }}
    >
      <p className={styles.basis}>{bundleBasis}</p>
      <div className={styles.graphTools}>
        {flow && (
          <button
            className={styles.textButton}
            onClick={() => setShowRecords(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <List size={16} aria-hidden="true" />
            Recorded movements
          </button>
        )}
        {!flow && capabilities.length > 0 && (
          <label className={styles.basis}>
            Business function{" "}
            <select
              aria-label="Architecture business function"
              value={selectedCapability}
              onChange={(event) => {
                setCapability(event.target.value);
                setExpanded(false);
              }}
              style={{
                marginLeft: 9,
                maxWidth: 240,
                width: "100%",
                padding: 7,
                border: "1px solid #d5dee3",
                borderRadius: 4,
              }}
            >
              <option value="">Whole enterprise</option>
              {capabilities.map(([name]) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        )}
        {flow && focusOptions.length > 0 && (
          <label className={styles.basis} style={{ minWidth: 0 }}>
            Connection focus{" "}
            <select
              aria-label="Flow connection focus"
              value={selectedFocus?.id ?? ""}
              onChange={(event) => {
                setFocusNode(event.target.value);
                setExpanded(false);
              }}
              style={{ width: "100%", maxWidth: 240, padding: 7 }}
            >
              {focusOptions.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          className={styles.textButton}
          aria-pressed={expanded}
          onClick={() => setExpanded(!expanded)}
          title={expanded ? "Return to focused map" : "Show full admitted map"}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          {expanded ? (
            <Minimize2 size={16} aria-hidden="true" />
          ) : (
            <Maximize2 size={16} aria-hidden="true" />
          )}
          {expanded ? "Focused map" : "Full map"}
        </button>
        <label className={styles.basis}>
          Zoom{" "}
          <input
            aria-label="Diagram zoom"
            type="range"
            min={60}
            max={400}
            step={10}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            style={{ width: 100, verticalAlign: "middle", marginLeft: 8 }}
          />
        </label>
        <button
          className={styles.iconButton}
          onClick={() => setZoom(100)}
          title="Reset diagram zoom"
          aria-label="Reset diagram zoom"
        >
          <RotateCcw size={16} aria-hidden="true" />
        </button>
        <span>
          {zoom}% · {displayView.nodes.length} of {view.nodes.length} nodes ·{" "}
          {displayView.edges.length} of {view.edges.length} connections
        </span>
      </div>
      <p className={styles.basis}>
        {flow
          ? `${expanded ? "Full admitted movement map" : `Connections touching ${selectedFocus?.label ?? "the selected node"}`}. This is a projection of recorded movement fields, not a verified end-to-end dependency chain. Connector weights count flow-row occurrences; they must not be summed as unique flows. Lanes are classifications, not declared architecture tiers.`
          : `${selectedCapability || "Whole enterprise"}: grouped by recorded business function. Support associations come from application fields; they do not establish canonical dependencies.`}{" "}
        {!expanded &&
          `Focused display: at most ${FOCUSED_NODE_LIMIT} nodes and ${FOCUSED_EDGE_LIMIT} connections; omitted objects remain available in the full map. `}
        {flow
          ? "The initial focus uses visible connection count, not business criticality."
          : "The initial function uses application-row count, not business priority."}
      </p>
      <div
        ref={diagram}
        className={styles.diagram}
        role="region"
        aria-label={flow ? "Data movement map" : "Application architecture map"}
        tabIndex={0}
        data-map-frame
        style={{
          maxHeight: "min(65vh, 680px)",
          maxWidth: "100%",
          minWidth: 0,
          overscrollBehavior: "contain",
        }}
        onClick={(event) => openNode(event.target)}
        onKeyDown={(event) => {
          if (
            (event.key === "Enter" || event.key === " ") &&
            event.target instanceof Element &&
            event.target.closest("[data-node-id]")
          ) {
            event.preventDefault();
            openNode(event.target);
          }
        }}
      >
        <div
          style={{ width: `${zoom}%`, minWidth: 0 }}
          dangerouslySetInnerHTML={{ __html: rendered.svg }}
        />
      </div>
      {!flow && (
        <p className={styles.basis}>
          Recorded annual cost (USD/year):{" "}
          {knownCosts.length
            ? `${costSubtotal} known subtotal across ${knownCosts.length} of ${costRows.length} application records`
            : "Unknown; no numeric cost supplied"}
          .
          {costRows.length > knownCosts.length &&
            ` ${costRows.length - knownCosts.length} ${costRows.length - knownCosts.length === 1 ? "record has" : "records have"} unknown cost; missing values are not zero.`}{" "}
          Recorded or modeled cost is not verified spend or Finance approval.
        </p>
      )}
      <details className={styles.graphDetail}>
        <summary>
          Visible labels and evidence basis ({displayView.nodes.length})
        </summary>
        <ul>
          {displayView.nodes.map((node) => (
            <li
              key={node.id}
              style={{ overflowWrap: "anywhere", marginBottom: 8 }}
            >
              <button
                className={styles.textButton}
                onClick={() => inspectNode(node)}
                style={{
                  textAlign: "left",
                  whiteSpace: "normal",
                  overflowWrap: "anywhere",
                }}
              >
                {node.label}
              </button>{" "}
              {node.aggregation
                ? `(${node.aggregation.memberCount} ${flow ? (node.aggregation.groupByField === "systemName" ? "environments" : "endpoints") : "application records"}; derived group)`
                : node.evidenceBasis === "CANDIDATE"
                  ? "(candidate)"
                  : "(recorded fields)"}
            </li>
          ))}
        </ul>
      </details>
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

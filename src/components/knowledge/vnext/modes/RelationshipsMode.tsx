"use client";

/**
 * Relationships mode — focused, versioned graph projection. One hop by default;
 * two hops on explicit request. Accepted edges solid, candidate edges dashed
 * (opt-in). Evidence available per node and per edge. Empty graphs stay empty.
 */

import { useEffect, useMemo, useState } from "react";
import { useConsumption } from "@/lib/knowledge/consumption-client";
import type { RelationshipDirection } from "@/lib/knowledge/consumption-contracts";
import { useShell } from "../state";
import { Card, SectionHeading } from "../primitives";
import { ErrorBlock, LoadingBlock, ProofFooter, useEnvelope, WarningBanners } from "../mode-helpers";
import { GraphCanvas, type GraphSelection } from "../GraphCanvas";

export function RelationshipsMode() {
  const runtime = useConsumption();
  const { scope, setScope, focalEntityRefs, openEvidence, setAvaContext } = useShell();
  const [hopDepth, setHopDepth] = useState<1 | 2>(1);
  const [direction, setDirection] = useState<RelationshipDirection>("both");
  const [includeCandidates, setIncludeCandidates] = useState(false);
  const [selection, setSelection] = useState<GraphSelection | null>(null);

  const graphScope = scope === "both" ? "both" : scope;

  const { envelope, loading, error } = useEnvelope(
    () =>
      runtime.provider.getRelationships({
        tenantKey: runtime.binding.tenantKey,
        knowledgeBaselineRef: runtime.baselineRef,
        focalEntityRefs,
        direction,
        hopDepth,
        currentTargetScope: graphScope,
        authorityMinimum: "accepted",
        maxNodes: 40,
        maxEdges: 60,
        includeCandidates,
      }),
    [runtime, focalEntityRefs, direction, hopDepth, graphScope, includeCandidates],
  );

  useEffect(() => {
    if (!envelope) return;
    setAvaContext({
      evidenceRefs: envelope.data.nodes.flatMap((n) => n.evidenceRefs),
      acceptedFactRefs: envelope.data.nodes.map((n) => n.nodeId),
      knownGapRefs: envelope.knownGapRefs,
      blockedSourceRefs: [],
    });
  }, [envelope, setAvaContext]);

  const onSelect = useMemo(
    () => (sel: GraphSelection) => {
      setSelection(sel);
      if (!envelope) return;
      if (sel.kind === "edge") {
        const descriptors = envelope.data.evidenceByEdge[sel.id] ?? [];
        const edge = envelope.data.edges.find((e) => e.edgeId === sel.id);
        openEvidence({
          title: edge ? `${edge.relationshipType}` : "Edge",
          descriptors,
          context: edge ? `Graph edge · ${edge.authorityState}` : undefined,
        });
      } else {
        const node = envelope.data.nodes.find((n) => n.nodeId === sel.id);
        openEvidence({
          title: node?.label ?? "Node",
          descriptors: runtime.resolveEvidence(node?.evidenceRefs ?? []),
          context: node ? `Graph node · ${node.nodeType}` : undefined,
        });
      }
    },
    [envelope, openEvidence, runtime],
  );

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock error={error} />;
  if (!envelope) return null;

  const proj = envelope.data;

  return (
    <div>
      <WarningBanners envelope={envelope} />
      <SectionHeading eyebrow="Relationships">
        {focalEntityRefs.length > 0 ? `Around ${focalEntityRefs.join(", ")}` : "Pick a focal entity in Explore"}
      </SectionHeading>

      <Card>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          <div className="kv-control-group" style={{ marginLeft: 0 }}>
            <span className="kv-control-label">Hops</span>
            <div className="kv-seg" role="group" aria-label="Hop depth">
              <button type="button" aria-pressed={hopDepth === 1} onClick={() => setHopDepth(1)}>1</button>
              <button type="button" aria-pressed={hopDepth === 2} onClick={() => setHopDepth(2)}>2</button>
            </div>
          </div>
          <div className="kv-control-group" style={{ marginLeft: 0 }}>
            <span className="kv-control-label">Direction</span>
            <select className="kv-select" value={direction} onChange={(e) => setDirection(e.target.value as RelationshipDirection)} aria-label="Direction">
              <option value="both">Both</option>
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </select>
          </div>
          <div className="kv-control-group" style={{ marginLeft: 0 }}>
            <span className="kv-control-label">Scope</span>
            <div className="kv-seg" role="group" aria-label="Current or target scope">
              <button type="button" aria-pressed={scope === "current"} onClick={() => setScope("current")}>Current</button>
              <button type="button" aria-pressed={scope === "target"} onClick={() => setScope("target")}>Target</button>
              <button type="button" aria-pressed={scope === "both"} onClick={() => setScope("both")}>Both</button>
            </div>
          </div>
          <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
            <input type="checkbox" checked={includeCandidates} onChange={(e) => setIncludeCandidates(e.target.checked)} />
            Show candidate (dashed) edges
          </label>
        </div>

        <GraphCanvas projection={proj} selection={selection} onSelect={onSelect} />

        <p style={{ fontSize: 12, color: "var(--kv-muted)", marginTop: 8 }}>
          {proj.acceptedEdgeCount} accepted · {proj.candidateEdgeCount} candidate · {proj.openGapCount} open gap(s).
          Select a node or edge to open its evidence.
        </p>
      </Card>

      <ProofFooter envelope={envelope} />
    </div>
  );
}

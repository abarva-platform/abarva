"use client";

/**
 * KnowledgeShell — the dominant center canvas + contextual left explorer +
 * dockable aVa, beneath the existing product chrome (this component renders no
 * top product nav of its own). Global controls: four modes, Executive/Analytical/
 * Proof depth, business-problem lens, current/target scope.
 */

import { DEPTH_LEVELS, KNOWLEDGE_LENSES, KNOWLEDGE_MODES } from "@/lib/knowledge/consumption-contracts";
import type { DepthLevel, KnowledgeLens, KnowledgeMode } from "@/lib/knowledge/consumption-contracts";
import { useConsumption } from "@/lib/knowledge/consumption-client";
import { useShell } from "./state";
import { LeftExplorer } from "./LeftExplorer";
import { AvaDock } from "./AvaDock";
import { EvidenceDrawer } from "./EvidenceDrawer";
import { HandoffPreviewButton } from "./HandoffPreview";
import { BriefMode } from "./modes/BriefMode";
import { ExploreMode } from "./modes/ExploreMode";
import { RelationshipsMode } from "./modes/RelationshipsMode";
import { EvidenceMode } from "./modes/EvidenceMode";

const MODE_LABEL: Record<KnowledgeMode, string> = {
  brief: "Brief",
  explore: "Explore",
  relationships: "Relationships",
  evidence: "Evidence & Gaps",
};

const DEPTH_LABEL: Record<DepthLevel, string> = {
  executive: "Executive",
  analytical: "Analytical",
  proof: "Proof",
};

const LENS_LABEL: Record<KnowledgeLens, string> = {
  none: "No lens",
  cost_efficiency: "Cost efficiency",
  risk_resilience: "Risk & resilience",
  growth_innovation: "Growth & innovation",
  data_ai_readiness: "Data & AI readiness",
  vendor_consolidation: "Vendor consolidation",
};

export function KnowledgeShell() {
  const { mode, setMode, depth, setDepth, lens, setLens, avaOpen, setAvaOpen, leftOpen, setLeftOpen } = useShell();
  const runtime = useConsumption();

  return (
    <div className="kv-root">
      <div className="kv-topstrip">
        <button type="button" className="kv-btn kv-btn-ghost kv-left-toggle" onClick={() => setLeftOpen(!leftOpen)} aria-expanded={leftOpen}>
          Explorer
        </button>

        <div className="kv-modes" role="tablist" aria-label="Knowledge modes">
          {KNOWLEDGE_MODES.map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-current={mode === m}
              aria-selected={mode === m}
              className="kv-mode-btn"
              onClick={() => setMode(m)}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>

        <div className="kv-control-group">
          <span className="kv-control-label">Depth</span>
          <div className="kv-seg" role="group" aria-label="Depth">
            {DEPTH_LEVELS.map((d) => (
              <button key={d} type="button" aria-pressed={depth === d} onClick={() => setDepth(d)}>
                {DEPTH_LABEL[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="kv-control-group" style={{ marginLeft: 0 }}>
          <span className="kv-control-label">Lens</span>
          <select className="kv-select" value={lens} onChange={(e) => setLens(e.target.value as KnowledgeLens)} aria-label="Business-problem lens">
            {KNOWLEDGE_LENSES.map((l) => (
              <option key={l} value={l}>{LENS_LABEL[l]}</option>
            ))}
          </select>
        </div>

        <HandoffPreviewButton />

        {!avaOpen ? (
          <button type="button" className="kv-btn" onClick={() => setAvaOpen(true)} aria-label="Open aVa companion">
            Ask aVa{runtime.modelsEnabled ? "" : " (off)"}
          </button>
        ) : null}
      </div>

      <div className="kv-panes">
        <div className="kv-left" data-open={leftOpen}>
          <LeftExplorer />
        </div>
        <main className="kv-center" id="kv-main" aria-label={`${MODE_LABEL[mode]} canvas`}>
          {mode === "brief" ? <BriefMode /> : null}
          {mode === "explore" ? <ExploreMode /> : null}
          {mode === "relationships" ? <RelationshipsMode /> : null}
          {mode === "evidence" ? <EvidenceMode /> : null}
        </main>
        <AvaDock />
      </div>

      <EvidenceDrawer />
    </div>
  );
}

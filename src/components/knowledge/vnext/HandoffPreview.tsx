"use client";

/**
 * Module handoff PREVIEW. Shows exactly what would travel to a receiving module
 * (references only) and a readiness verdict. It creates nothing — no Move, no
 * Source event, no Tower action — because no governed backend action exists yet.
 */

import { useState } from "react";
import { useConsumption } from "@/lib/knowledge/consumption-client";
import type { ModuleHandoffPreviewV1, ReceivingModule } from "@/lib/knowledge/consumption-contracts";
import { useShell } from "./state";

const MODULES: ReceivingModule[] = ["source", "moves", "tower", "intelligence"];

export function HandoffPreviewButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="kv-btn kv-btn-ghost" onClick={() => setOpen(true)}>
        Preview handoff
      </button>
      {open ? <HandoffPanel onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function HandoffPanel({ onClose }: { onClose: () => void }) {
  const runtime = useConsumption();
  const { focalEntityRefs, lens, filters } = useShell();
  const [module, setModule] = useState<ReceivingModule>("moves");
  const [preview, setPreview] = useState<ModuleHandoffPreviewV1 | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(m: ReceivingModule) {
    setModule(m);
    setLoading(true);
    const env = await runtime.provider.previewModuleHandoff({
      tenantKey: runtime.binding.tenantKey,
      knowledgeBaselineRef: runtime.baselineRef,
      receivingModule: m,
      selectedEntityRefs: focalEntityRefs,
      filters,
      lens,
    });
    setPreview(env.data);
    setLoading(false);
  }

  return (
    <>
      <div className="kv-drawer-scrim" onClick={onClose} aria-hidden />
      <div className="kv-drawer" role="dialog" aria-modal="true" aria-label="Module handoff preview">
        <div className="kv-drawer-head">
          <div>
            <div className="kv-eyebrow">Handoff preview · nothing is created</div>
            <strong className="kv-serif" style={{ fontSize: 17 }}>What would travel</strong>
          </div>
          <button type="button" className="kv-btn kv-btn-ghost" onClick={onClose}>Close</button>
        </div>
        <div className="kv-drawer-body">
          <div className="kv-seg" role="group" aria-label="Receiving module" style={{ marginBottom: 12 }}>
            {MODULES.map((m) => (
              <button key={m} type="button" aria-pressed={module === m} onClick={() => load(m)}>{m}</button>
            ))}
          </div>
          {loading ? <p>Loading…</p> : preview ? (
            <dl>
              <dt>Receiving module</dt><dd>{preview.receivingModule}</dd>
              <dt>Scope</dt><dd>{preview.scope}</dd>
              <dt>Entities</dt><dd>{preview.selectedEntityRefs.join(", ") || "—"}</dd>
              <dt>Lens</dt><dd>{preview.lens}</dd>
              <dt>Insight</dt><dd>{preview.insightRef ?? "—"}</dd>
              <dt>Baseline</dt><dd>{preview.knowledgeBaselineRef}</dd>
              <dt>Evidence</dt><dd>{preview.evidenceRefs.join(", ") || "—"}</dd>
              <dt>Known gaps</dt><dd>{preview.knownGapRefs.join(", ") || "None"}</dd>
              <dt>Readiness</dt><dd>{preview.readinessState}{preview.readinessDetail ? ` — ${preview.readinessDetail}` : ""}</dd>
            </dl>
          ) : (
            <p style={{ color: "var(--kv-muted)" }}>Pick a receiving module to preview what would travel.</p>
          )}
          <p style={{ marginTop: 14, fontSize: 12, color: "var(--kv-muted)" }}>
            The receiving module retains references to this Knowledge; it does not copy it into
            another truth store. No action is taken from this preview.
          </p>
        </div>
      </div>
    </>
  );
}

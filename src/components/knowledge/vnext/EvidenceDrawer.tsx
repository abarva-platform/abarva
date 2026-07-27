"use client";

/**
 * Accessible evidence drawer. Opens from any material object (number, quote,
 * benchmark, interpretation, graph node/edge, KPI, contract term, recommendation).
 *
 * A dedicated, isolated, accessible drawer (rather than the app's dark
 * SourceDrawerShell) so we control focus-trap, Escape, focus-return and the
 * paper surface without a cross-feature dependency. Renders the full descriptor
 * fields the contract defines; withheld content is shown as restricted, never leaked.
 */

import { useEffect, useRef } from "react";
import type { EvidenceDescriptor } from "@/lib/knowledge/consumption-contracts";
import { useShell } from "./state";
import { AvailabilityPill } from "./primitives";

export function EvidenceDrawer() {
  const { drawer, closeEvidence } = useShell();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!drawer) return;
    // remember the element that had focus, to restore on close
    returnFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeEvidence();
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      returnFocusRef.current?.focus?.();
    };
  }, [drawer, closeEvidence]);

  if (!drawer) return null;

  return (
    <>
      <div className="kv-drawer-scrim" onClick={closeEvidence} aria-hidden />
      <div
        className="kv-drawer"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Evidence for ${drawer.title}`}
      >
        <div className="kv-drawer-head">
          <div>
            <div className="kv-eyebrow">Evidence</div>
            <strong className="kv-serif" style={{ fontSize: 17 }}>{drawer.title}</strong>
            {drawer.context ? <div style={{ fontSize: 12, color: "var(--kv-muted)" }}>{drawer.context}</div> : null}
          </div>
          <button ref={closeRef} type="button" className="kv-btn kv-btn-ghost" onClick={closeEvidence}>
            Close
          </button>
        </div>
        <div className="kv-drawer-body">
          {drawer.descriptors.length === 0 ? (
            <p className="kv-empty">No displayable evidence is available for this item.</p>
          ) : (
            drawer.descriptors.map((d) => <EvidenceRecord key={d.evidenceRef} d={d} />)
          )}
        </div>
      </div>
    </>
  );
}

function EvidenceRecord({ d }: { d: EvidenceDescriptor }) {
  const restricted = d.accessRestriction === "withheld" || d.availabilityState === "withheld";
  return (
    <section style={{ borderBottom: "1px solid var(--kv-line)", padding: "12px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <strong>{d.sourceName ?? "Restricted source"}</strong>
        <AvailabilityPill state={d.availabilityState} />
      </div>
      {restricted ? (
        <p style={{ color: "var(--kv-alert)", fontSize: 13 }}>
          This evidence is restricted. Its content is withheld and cannot be displayed here.
        </p>
      ) : (
        <dl>
          <dt>Source type</dt><dd>{d.sourceType ?? "—"}</dd>
          <dt>Source date</dt><dd>{d.sourceDate ?? "—"}</dd>
          <dt>Citation</dt><dd>{d.citation ?? "—"}</dd>
          <dt>Authority</dt><dd>{d.authorityState}</dd>
          <dt>Review</dt><dd>{d.reviewState ?? "—"}</dd>
          <dt>Confidence</dt><dd>{d.confidence === null ? "—" : `${Math.round(d.confidence * 100)}%`}</dd>
          <dt>Effective</dt><dd>{d.effectivePeriod ?? "—"}</dd>
          <dt>Lineage</dt><dd>{d.lineage.join(" → ")}</dd>
          <dt>Conflicts</dt><dd>{d.relatedConflicts.length ? d.relatedConflicts.join(", ") : "None"}</dd>
          <dt>Access</dt><dd>{d.accessRestriction ?? "none"}</dd>
        </dl>
      )}
    </section>
  );
}

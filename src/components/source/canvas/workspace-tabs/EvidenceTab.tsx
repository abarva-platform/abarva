"use client";

import { useState, type CSSProperties } from "react";
import {
  evidenceById,
  type SourceEvidenceRequirement,
} from "@/lib/source/canonical-specs";
import type {
  SourceEventEvidence,
  SourceEventEvidenceCurrentState,
} from "@/lib/source/canvas-substrate";
import { SOURCE_STAGE_LABELS } from "@/lib/source/constants";
import type { SourceStageKey } from "@/lib/source/types";
import { CANVAS } from "../canvas-tokens";

interface EvidenceTabProps {
  stage: SourceStageKey;
  states: SourceEventEvidence[];
  eventId?: string;
  onRequestSaved?: () => void;
}

/**
 * Evidence tab — readiness ramp for the data this stage needs.
 * Per-requirement state from source_event_evidence_states overlays the
 * canonical SourceEvidenceRequirement catalog (label, source, minimum state).
 */
export function EvidenceTab({
  stage,
  states,
  eventId,
  onRequestSaved,
}: EvidenceTabProps) {
  const totals = countByState(states);
  const [selectedRequirementId, setSelectedRequirementId] = useState<
    string | null
  >(null);
  const selectedState =
    states.find((state) => state.requirementId === selectedRequirementId) ??
    null;

  return (
    <div data-testid="source-canvas-evidence-tab" style={CONTAINER_STYLE}>
      <header style={HEADER_STYLE}>
        <div style={EYEBROW_STYLE}>
          Evidence readiness · {SOURCE_STAGE_LABELS[stage]}
        </div>
        <h2 style={TITLE_STYLE}>
          {totals.usable} of {states.length} required evidence items at usable
        </h2>
        <p style={SUBLINE_STYLE}>
          The seven-state ramp drives gate-criterion auto-promotion. Sources
          must reach their minimum state for downstream artifacts to lock at
          full fidelity.
        </p>
      </header>

      <div style={LEGEND_STYLE} aria-label="Seven-state ramp legend">
        {(
          [
            ['Usable Evidence', CANVAS.ACTIVE, 'Validated, citable in artifacts and gates'],
            ['Available', CANVAS.ACTIVE, 'Parsed and sample-checked'],
            ['Parsed', CANVAS.WAITING, 'Fields extracted, not yet validated'],
            ['Loaded', CANVAS.WAITING, 'File ingested, not yet parsed'],
            ['Not Requested', CANVAS.GRAY, 'Known source, not yet pulled'],
            ['Stale', CANVAS.BLOCKED, 'Older than freshness window'],
            ['Low Confidence', CANVAS.BLOCKED, 'Flagged for review'],
          ] as const
        ).map(([label, color, desc]) => (
          <div key={label} style={LEGEND_ITEM_STYLE}>
            <span
              aria-hidden
              style={{ ...LEGEND_DOT_STYLE, background: color }}
            />
            <span style={LEGEND_LABEL_STYLE}>{label}</span>
            <span style={LEGEND_DESC_STYLE}>{desc}</span>
          </div>
        ))}
      </div>

      <ul style={LIST_STYLE}>
        {states.length === 0 ? (
          <li style={EMPTY_BODY_STYLE}>
            No evidence requirements for this stage.
          </li>
        ) : (
          states.map((s) => {
            const def = evidenceById(s.requirementId);
            return (
              <EvidenceRow
                key={s.requirementId}
                state={s}
                def={def}
                onRequest={() => setSelectedRequirementId(s.requirementId)}
              />
            );
          })
        )}
      </ul>
      {selectedState ? (
        <EvidenceRequestPanel
          eventId={eventId}
          state={selectedState}
          def={evidenceById(selectedState.requirementId)}
          onClose={() => setSelectedRequirementId(null)}
          onSaved={() => {
            setSelectedRequirementId(null);
            onRequestSaved?.();
          }}
        />
      ) : null}
    </div>
  );
}

function countByState(states: SourceEventEvidence[]): {
  usable: number;
  total: number;
} {
  return {
    usable: states.filter(
      (s) =>
        s.currentState === "Usable Evidence" || s.currentState === "Available",
    ).length,
    total: states.length,
  };
}

function EvidenceRow({
  state,
  def,
  onRequest,
}: {
  state: SourceEventEvidence;
  def: SourceEvidenceRequirement | undefined;
  onRequest: () => void;
}) {
  const color = colorForState(state.currentState);
  return (
    <li
      style={ROW_STYLE}
      data-testid={`source-canvas-evidence-${state.requirementId}`}
    >
      <span aria-hidden style={{ ...DOT_STYLE, background: color }} />
      <div style={ROW_BODY_STYLE}>
        <div style={ROW_TITLE_STYLE}>
          {def?.label ?? state.requirementId}
          {def?.level === "required" ? (
            <span style={REQUIRED_TAG_STYLE}>required</span>
          ) : null}
        </div>
        {def?.description ? (
          <div style={ROW_DESC_STYLE}>{def.description}</div>
        ) : null}
        <div style={ROW_META_STYLE}>
          {def?.sourceLabel ? <span>{def.sourceLabel}</span> : null}
          {def?.sourceLabel ? <span style={DOT_INLINE_STYLE}>·</span> : null}
          <span style={STATE_LABEL_STYLE}>{state.currentState}</span>
          {def?.minimumState ? (
            <>
              <span style={DOT_INLINE_STYLE}>·</span>
              <span>min: {def.minimumState}</span>
            </>
          ) : null}
        </div>
        {state.currentState === "Not Requested" ? (
          <button
            type="button"
            onClick={onRequest}
            style={REQUEST_LINK_STYLE}
            data-testid={`source-canvas-evidence-request-${state.requirementId}`}
          >
            Request evidence
          </button>
        ) : null}
      </div>
    </li>
  );
}

function EvidenceRequestPanel({
  eventId,
  state,
  def,
  onClose,
  onSaved,
}: {
  eventId?: string;
  state: SourceEventEvidence;
  def: SourceEvidenceRequirement | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [owner, setOwner] = useState(def?.sourceLabel ?? "");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const label = def?.label ?? state.requirementId;

  async function saveRequest() {
    if (!eventId || status === "saving") return;
    setStatus("saving");
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/source/${encodeURIComponent(eventId)}/evidence-requests`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            requirementId: state.requirementId,
            label,
            sourceLabel: def?.sourceLabel ?? null,
            owner,
            dueDate,
            note,
            stage: state.stage,
            minimumState: def?.minimumState ?? null,
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        detail?: string;
      } | null;
      if (!response.ok) {
        throw new Error(
          payload?.detail ?? `Evidence request failed (${response.status}).`,
        );
      }
      setStatus("saved");
      onSaved();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Request failed.");
    }
  }

  return (
    <section
      aria-label={`Evidence request for ${label}`}
      style={REQUEST_PANEL_STYLE}
      data-testid="source-canvas-evidence-request-panel"
    >
      <div style={REQUEST_PANEL_HEADER_STYLE}>
        <div>
          <div style={EYEBROW_STYLE}>Evidence request</div>
          <h3 style={REQUEST_PANEL_TITLE_STYLE}>{label}</h3>
          <p style={REQUEST_PANEL_COPY_STYLE}>
            Create an internal request task and log it on this Source event. No
            email is sent from AbarVa.
          </p>
        </div>
        <button type="button" onClick={onClose} style={GHOST_BUTTON_STYLE}>
          Close
        </button>
      </div>
      <div style={REQUEST_FORM_GRID_STYLE}>
        <label style={FIELD_STYLE}>
          <span style={FIELD_LABEL_STYLE}>Owner or source</span>
          <input
            value={owner}
            onChange={(event) => setOwner(event.currentTarget.value)}
            placeholder="Procurement owner, vendor contact, system owner"
            style={INPUT_STYLE}
          />
        </label>
        <label style={FIELD_STYLE}>
          <span style={FIELD_LABEL_STYLE}>Due date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.currentTarget.value)}
            style={INPUT_STYLE}
          />
        </label>
        <label style={{ ...FIELD_STYLE, gridColumn: "1 / -1" }}>
          <span style={FIELD_LABEL_STYLE}>Request note</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.currentTarget.value)}
            placeholder={`Ask for ${def?.sourceLabel ?? "the source owner"} to provide ${label}.`}
            rows={3}
            style={TEXTAREA_STYLE}
          />
        </label>
      </div>
      {error ? <div style={ERROR_STYLE}>{error}</div> : null}
      <div style={REQUEST_ACTIONS_STYLE}>
        <button type="button" onClick={onClose} style={SECONDARY_BUTTON_STYLE}>
          Cancel
        </button>
        <button
          type="button"
          onClick={saveRequest}
          disabled={!eventId || status === "saving"}
          style={{
            ...PRIMARY_BUTTON_STYLE,
            opacity: !eventId || status === "saving" ? 0.62 : 1,
          }}
        >
          {status === "saving" ? "Saving..." : "Log request"}
        </button>
      </div>
    </section>
  );
}

function colorForState(s: SourceEventEvidenceCurrentState): string {
  if (s === "Usable Evidence" || s === "Available") return CANVAS.ACTIVE;
  if (s === "Parsed" || s === "Loaded") return CANVAS.WAITING;
  if (s === "Stale" || s === "Low Confidence") return CANVAS.BLOCKED;
  return CANVAS.GRAY;
}

const CONTAINER_STYLE: CSSProperties = {
  display: "grid",
  gap: 24,
  maxWidth: 880,
};

const HEADER_STYLE: CSSProperties = {
  display: "grid",
  gap: 6,
  paddingBottom: 16,
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
};

const TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 24,
  fontWeight: 400,
  letterSpacing: "-0.015em",
  color: CANVAS.INK,
  margin: 0,
};

const SUBLINE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
  lineHeight: 1.5,
  margin: 0,
};

const LEGEND_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 8,
  padding: "12px 14px",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
};

const LEGEND_ITEM_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "baseline",
  gap: 8,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
};

const LEGEND_DOT_STYLE: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  display: "inline-block",
  flexShrink: 0,
  alignSelf: "center",
};

const LEGEND_LABEL_STYLE: CSSProperties = {
  fontWeight: 600,
  color: CANVAS.INK,
};

const LEGEND_DESC_STYLE: CSSProperties = {
  color: CANVAS.INK_SOFT,
};

const LIST_STYLE: CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
};

const ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: 14,
  padding: "14px 0",
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const DOT_STYLE: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  marginTop: 5,
  flexShrink: 0,
};

const ROW_BODY_STYLE: CSSProperties = {
  display: "grid",
  gap: 4,
  minWidth: 0,
};

const ROW_TITLE_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  fontWeight: 600,
  color: CANVAS.INK,
};

const REQUIRED_TAG_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
  fontWeight: 600,
};

const ROW_DESC_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.5,
  color: CANVAS.INK_SOFT,
};

const ROW_META_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.04em",
  color: CANVAS.GRAY_DK,
  flexWrap: "wrap",
};

const STATE_LABEL_STYLE: CSSProperties = {
  fontWeight: 600,
  color: CANVAS.INK,
};

const REQUEST_LINK_STYLE: CSSProperties = {
  width: "fit-content",
  marginTop: 4,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.ACTIVE,
  background: "transparent",
  padding: 0,
  cursor: "pointer",
  borderBottom: `1px solid ${CANVAS.ACTIVE}`,
  borderTop: 0,
  borderLeft: 0,
  borderRight: 0,
};

const REQUEST_PANEL_STYLE: CSSProperties = {
  display: "grid",
  gap: 16,
  padding: 18,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
};

const REQUEST_PANEL_HEADER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
};

const REQUEST_PANEL_TITLE_STYLE: CSSProperties = {
  margin: "4px 0 6px",
  fontFamily: CANVAS.SERIF,
  fontSize: 20,
  fontWeight: 400,
  color: CANVAS.INK,
};

const REQUEST_PANEL_COPY_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.5,
  color: CANVAS.INK_SOFT,
};

const REQUEST_FORM_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const FIELD_STYLE: CSSProperties = {
  display: "grid",
  gap: 6,
};

const FIELD_LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
  fontWeight: 700,
};

const INPUT_STYLE: CSSProperties = {
  minHeight: 38,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 6,
  padding: "0 10px",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK,
  background: "#fff",
};

const TEXTAREA_STYLE: CSSProperties = {
  ...INPUT_STYLE,
  minHeight: 78,
  padding: 10,
  resize: "vertical",
};

const REQUEST_ACTIONS_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const GHOST_BUTTON_STYLE: CSSProperties = {
  border: 0,
  background: "transparent",
  color: CANVAS.INK_SOFT,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const SECONDARY_BUTTON_STYLE: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 999,
  minHeight: 36,
  padding: "0 14px",
  background: "#fff",
  color: CANVAS.INK,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  cursor: "pointer",
};

const PRIMARY_BUTTON_STYLE: CSSProperties = {
  ...SECONDARY_BUTTON_STYLE,
  borderColor: CANVAS.INK,
  background: CANVAS.INK,
  color: "#fff",
};

const ERROR_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.BLOCKED,
};

const DOT_INLINE_STYLE: CSSProperties = {
  color: CANVAS.GRAY,
};

const EMPTY_BODY_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
  padding: "12px 0",
};

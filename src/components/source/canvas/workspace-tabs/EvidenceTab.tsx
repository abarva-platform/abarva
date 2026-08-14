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
          Evidence checklist · {SOURCE_STAGE_LABELS[stage]}
        </div>
        <h2 style={TITLE_STYLE}>
          {totals.readyRequired} of {totals.requiredTotal} required items ready
        </h2>
        <p style={SUBLINE_STYLE}>
          Load the required files first. Optional evidence improves the
          deliverable, but the Continue gate only unlocks when required evidence
          is uploaded, parsed, and usable.
        </p>
      </header>

      <div style={SUMMARY_GRID_STYLE} aria-label="Evidence progress summary">
        <SummaryStat
          label="Required ready"
          value={`${totals.readyRequired}/${totals.requiredTotal}`}
          tone="good"
        />
        <SummaryStat
          label="Uploaded"
          value={`${totals.uploaded}/${states.length}`}
          tone="neutral"
        />
        <SummaryStat
          label="Still needed"
          value={`${totals.missingRequired}`}
          tone={totals.missingRequired > 0 ? "warn" : "good"}
        />
      </div>

      <div
        style={TABLE_STYLE}
        role="table"
        aria-label="Evidence required for this stage"
      >
        <div style={TABLE_HEADER_STYLE} role="row">
          <span>Evidence</span>
          <span>Need</span>
          <span>Expected upload</span>
          <span>Source</span>
          <span>Formats</span>
          <span>Upload</span>
          <span>Readiness</span>
          <span>Done</span>
          <span>Next</span>
        </div>
        {states.length === 0 ? (
          <div style={EMPTY_BODY_STYLE}>
            No evidence requirements for this stage.
          </div>
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
      </div>
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
  readyRequired: number;
  requiredTotal: number;
  uploaded: number;
  missingRequired: number;
} {
  const requiredStates = states.filter((s) => {
    const def = evidenceById(s.requirementId);
    return def?.level !== "recommended";
  });
  return {
    readyRequired: requiredStates.filter(isReadyState).length,
    requiredTotal: requiredStates.length,
    uploaded: states.filter(isUploadedState).length,
    missingRequired: requiredStates.filter(
      (s) => !isReadyState(s) && s.currentState === "Not Requested",
    ).length,
  };
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "neutral" | "warn";
}) {
  const color =
    tone === "good"
      ? CANVAS.ACTIVE
      : tone === "warn"
        ? CANVAS.WAITING
        : CANVAS.INK;
  return (
    <div style={SUMMARY_CARD_STYLE}>
      <span style={SUMMARY_LABEL_STYLE}>{label}</span>
      <strong style={{ ...SUMMARY_VALUE_STYLE, color }}>{value}</strong>
    </div>
  );
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
  const uploaded = isUploadedState(state);
  const ready = isReadyState(state);
  const blocked =
    state.currentState === "Stale" || state.currentState === "Low Confidence";
  return (
    <div
      style={ROW_STYLE}
      role="row"
      data-testid={`source-canvas-evidence-${state.requirementId}`}
    >
      <div style={ROW_BODY_STYLE} role="cell">
        <div style={ROW_TITLE_STYLE}>{def?.label ?? state.requirementId}</div>
        {def?.description ? (
          <div style={ROW_DESC_STYLE}>{def.description}</div>
        ) : null}
      </div>
      <div style={CELL_STYLE} role="cell">
        <span
          style={
            def?.level === "recommended"
              ? OPTIONAL_TAG_STYLE
              : REQUIRED_TAG_STYLE
          }
        >
          {def?.level === "recommended" ? "optional" : "required"}
        </span>
      </div>
      <div style={CELL_STYLE} role="cell">
        {def
          ? expectedUpload(def)
          : "Upload the source file for this requirement."}
      </div>
      <div style={CELL_STYLE} role="cell">
        {def?.sourceSystems.slice(0, 3).join(", ") ??
          def?.sourceLabel ??
          "Source owner"}
      </div>
      <div style={CELL_STYLE} role="cell">
        {def?.acceptedFileTypes.map((type) => type.toUpperCase()).join(", ") ??
          "PDF, XLSX, CSV"}
      </div>
      <div style={STATUS_CELL_STYLE} role="cell">
        <span aria-hidden style={statusMarkStyle(uploaded, blocked)} />
        <span>{uploaded ? "Uploaded" : "Not loaded"}</span>
      </div>
      <div style={STATUS_CELL_STYLE} role="cell">
        <span aria-hidden style={{ ...DOT_STYLE, background: color }} />
        <span>{readinessLabel(state.currentState)}</span>
      </div>
      <div style={STATUS_CELL_STYLE} role="cell">
        <span aria-hidden style={statusMarkStyle(ready, blocked)} />
        <span>{ready ? "Done" : blocked ? "Blocked" : "Open"}</span>
      </div>
      <div style={ACTION_CELL_STYLE} role="cell">
        {state.currentState === "Not Requested" ? (
          <button
            type="button"
            onClick={onRequest}
            style={REQUEST_LINK_STYLE}
            data-testid={`source-canvas-evidence-request-${state.requirementId}`}
          >
            Request
          </button>
        ) : (
          <span style={NEXT_ACTION_TEXT_STYLE}>
            {nextActionLabel(state.currentState)}
          </span>
        )}
      </div>
    </div>
  );
}

function isReadyState(state: SourceEventEvidence): boolean {
  return (
    state.currentState === "Usable Evidence" ||
    state.currentState === "Available"
  );
}

function isUploadedState(state: SourceEventEvidence): boolean {
  return (
    Boolean(state.sourceArtifactId) || state.currentState !== "Not Requested"
  );
}

function expectedUpload(def: SourceEvidenceRequirement): string {
  if (def.stage === "responses" && def.evidenceClass === "supplier_offer") {
    return "One response package per vendor; large PDFs are expected.";
  }
  if (def.stage === "pricing") {
    return "One pricing workbook per vendor, or one consolidated workbook.";
  }
  if (def.stage === "evaluation") {
    return "One score workbook/export covering all vendors and criteria.";
  }
  if (def.stage === "scope" && def.evidenceClass === "usage") {
    return "One to three exports: ticket volumes, SLA misses, and backlog.";
  }
  if (def.stage === "scope") {
    return "One controlled workbook/export for the full scope boundary.";
  }
  if (def.stage === "rfp") {
    return "One approved template, workbook, or policy pack for this RFP.";
  }
  if (def.stage === "bafo") {
    return "One negotiation log for all finalist vendors.";
  }
  if (def.stage === "executive_decision") {
    return "One finalist pack or consolidated executive evidence pack.";
  }
  if (def.stage === "selection") {
    return "One signed contract package with exhibits.";
  }
  if (def.stage === "transition") {
    return "One project export or KT evidence pack.";
  }
  if (def.stage === "value") {
    return "One measurement workbook or evidence pack per value cycle.";
  }
  return "One source file or export; rows should match the listed grain.";
}

function readinessLabel(state: SourceEventEvidenceCurrentState): string {
  if (state === "Usable Evidence") return "Usable";
  if (state === "Not Requested") return "Missing";
  return state;
}

function nextActionLabel(state: SourceEventEvidenceCurrentState): string {
  if (state === "Loaded") return "Parse file";
  if (state === "Parsed") return "Validate";
  if (state === "Available") return "Ready for gate";
  if (state === "Usable Evidence") return "No action";
  if (state === "Stale") return "Refresh upload";
  if (state === "Low Confidence") return "Review quality";
  return "Request";
}

function statusMarkStyle(done: boolean, blocked: boolean): CSSProperties {
  return {
    ...DOT_STYLE,
    background: blocked ? CANVAS.BLOCKED : done ? CANVAS.ACTIVE : "transparent",
    border: blocked || done ? "none" : `1px solid ${CANVAS.HAIRLINE}`,
  };
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
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
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
        {def ? (
          <div style={REQUEST_HINT_STYLE}>
            <strong>Ask for:</strong> {def.recordGrain}.{" "}
            <strong>Likely systems:</strong>{" "}
            {def.sourceSystems.slice(0, 5).join(", ")}.{" "}
            <strong>Critical fields:</strong>{" "}
            {def.criticalFields.slice(0, 8).join(", ")}.
          </div>
        ) : null}
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
            placeholder={requestPlaceholder(def, label)}
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

function requestPlaceholder(
  def: SourceEvidenceRequirement | undefined,
  label: string,
): string {
  if (!def) return `Ask the source owner to provide ${label}.`;
  const systems = def.sourceSystems.slice(0, 3).join(", ");
  const fields = def.criticalFields.slice(0, 6).join(", ");
  return `Please export ${label} from ${systems}. Include ${fields}; keep role refs/titles instead of employee PII.`;
}

function colorForState(s: SourceEventEvidenceCurrentState): string {
  if (s === "Usable Evidence" || s === "Available") return CANVAS.ACTIVE;
  if (s === "Parsed" || s === "Loaded") return CANVAS.WAITING;
  if (s === "Stale" || s === "Low Confidence") return CANVAS.BLOCKED;
  return CANVAS.GRAY;
}

const CONTAINER_STYLE: CSSProperties = {
  display: "grid",
  gap: 18,
  maxWidth: "100%",
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

const SUMMARY_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
};

const SUMMARY_CARD_STYLE: CSSProperties = {
  display: "grid",
  gap: 4,
  padding: "10px 12px",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
};

const SUMMARY_LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
};

const SUMMARY_VALUE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 18,
  lineHeight: 1,
};

const TABLE_STYLE: CSSProperties = {
  display: "grid",
  overflowX: "auto",
  borderTop: `1px solid ${CANVAS.RULE}`,
  borderBottom: `1px solid ${CANVAS.RULE}`,
};

const TABLE_HEADER_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(180px, 1.4fr) 76px minmax(170px, 1.1fr) minmax(140px, 1fr) 92px 88px 98px 72px 80px",
  gap: 10,
  alignItems: "center",
  minWidth: 1120,
  padding: "10px 0",
  borderBottom: `1px solid ${CANVAS.RULE}`,
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
};

const ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(180px, 1.4fr) 76px minmax(170px, 1.1fr) minmax(140px, 1fr) 92px 88px 98px 72px 80px",
  gap: 10,
  alignItems: "start",
  minWidth: 1120,
  padding: "13px 0",
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const DOT_STYLE: CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: 999,
  marginTop: 2,
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

const CELL_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  lineHeight: 1.35,
  color: CANVAS.INK_SOFT,
  minWidth: 0,
};

const STATUS_CELL_STYLE: CSSProperties = {
  ...CELL_STYLE,
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  color: CANVAS.INK,
};

const ACTION_CELL_STYLE: CSSProperties = {
  ...CELL_STYLE,
  minHeight: 24,
};

const REQUIRED_TAG_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
  fontWeight: 600,
};

const OPTIONAL_TAG_STYLE: CSSProperties = {
  ...REQUIRED_TAG_STYLE,
  color: CANVAS.INK_SOFT,
};

const ROW_DESC_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  lineHeight: 1.35,
  color: CANVAS.INK_SOFT,
};

const REQUEST_LINK_STYLE: CSSProperties = {
  width: "fit-content",
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

const NEXT_ACTION_TEXT_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: CANVAS.INK_SOFT,
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

const REQUEST_HINT_STYLE: CSSProperties = {
  gridColumn: "1 / -1",
  padding: "10px 12px",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 6,
  background: "#fbfaf7",
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  lineHeight: 1.5,
  color: CANVAS.INK_SOFT,
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

const EMPTY_BODY_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
  padding: "12px 0",
  minWidth: 1120,
};

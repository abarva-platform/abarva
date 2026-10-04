"use client";

import { useId } from "react";

/**
 * The visible half of the P1 Charter minimum-viable-evidence gate: a per-field
 * "How do you know this?" control.
 *
 * The gate itself (`src/lib/programs/p1-charter-evidence.ts`) and the
 * persistence of a recorded basis (`p1BasisBySection` on the phase-capture
 * route) are already in place. This component is the only surface that lets a
 * workspace user DECLARE the basis, and it is strict about one thing:
 *
 * - an assumption is never presented as evidence. It carries an owner and a
 *   plan for how Discover validates it, renders an amber "Assumption · validate
 *   in Discover" badge beside the question, and is described in words that say
 *   it completes the charter WITHOUT becoming established fact.
 *
 * Purely presentational — the host owns the value, the save, and the flag gate
 * (`moves_charter_basis_v1`). Rendered nowhere when the flag is off.
 */
export type CharterBasisValue =
  | { kind: "approved_evidence"; evidenceId: string }
  | { kind: "workspace_assertion" }
  | { kind: "assumption"; owner: string; p2ValidationPlan: string };

export interface CharterBasisApprovedSource {
  evidenceId: string;
  label: string;
}

export interface CharterBasisFieldProps {
  /** Canonical phase-capture section key this basis belongs to. */
  sectionKey: string;
  /** The recorded basis, or null when the field has none yet. */
  value: CharterBasisValue | null;
  onChange: (next: CharterBasisValue | null) => void;
  /** Approved evidence in this field's family, for the evidence basis. */
  approvedSources?: readonly CharterBasisApprovedSource[];
  /** True when the field itself has no answer yet — a basis means nothing then. */
  emptyValue?: boolean;
  disabled?: boolean;
  saveError?: string | null;
}

const BASIS_OPTIONS = [
  {
    kind: "approved_evidence" as const,
    label: "Backed by evidence",
    note: "Points at an approved source in this workspace.",
  },
  {
    kind: "workspace_assertion" as const,
    label: "I'm asserting this",
    note: "Recorded as your assertion — enough to complete the charter; no upload needed.",
  },
  {
    kind: "assumption" as const,
    label: "It's an assumption",
    note: "Completes the charter, but stays an assumption — it carries into Discover to be validated, and never reads as established fact.",
  },
];

/** True when the recorded basis is an assumption (drives the amber badge). */
export function isCharterAssumption(
  value: CharterBasisValue | null | undefined,
): boolean {
  return value?.kind === "assumption";
}

/**
 * The amber badge shown beside a question whose basis is an assumption. Kept
 * here so the badge wording can never drift from the control that sets it.
 */
export function CharterAssumptionBadge() {
  return (
    <span className="cbf-badge" data-testid="charter-assumption-badge">
      Assumption · validate in Discover
    </span>
  );
}

export function CharterBasisField({
  sectionKey,
  value,
  onChange,
  approvedSources = [],
  emptyValue = false,
  disabled = false,
  saveError = null,
}: CharterBasisFieldProps) {
  const groupId = useId();
  const selected = value?.kind ?? null;
  // Narrowed once, so the assumption inputs below are typed rather than
  // re-asserted at each use site.
  const assumption = value?.kind === "assumption" ? value : null;
  const isAssumption = assumption !== null;
  const noApprovedSource = approvedSources.length === 0;

  const select = (kind: CharterBasisValue["kind"]) => {
    if (disabled) return;
    if (kind === "approved_evidence") {
      const first = approvedSources[0];
      if (!first) return;
      onChange({
        kind: "approved_evidence",
        evidenceId:
          value?.kind === "approved_evidence" ? value.evidenceId : first.evidenceId,
      });
      return;
    }
    if (kind === "workspace_assertion") {
      onChange({ kind: "workspace_assertion" });
      return;
    }
    onChange({
      kind: "assumption",
      owner: value?.kind === "assumption" ? value.owner : "",
      p2ValidationPlan:
        value?.kind === "assumption" ? value.p2ValidationPlan : "",
    });
  };

  return (
    <div
      className={`cbf${isAssumption ? " cbf-is-assumption" : ""}`}
      data-testid={`charter-basis-${sectionKey}`}
      data-basis={selected ?? "none"}
    >
      <style>{CBF_CSS}</style>
      <div className="cbf-eyebrow" id={`${groupId}-label`}>
        How do you know this?
      </div>
      <div
        className="cbf-options"
        role="radiogroup"
        aria-labelledby={`${groupId}-label`}
      >
        {BASIS_OPTIONS.map((option) => {
          const unavailable =
            option.kind === "approved_evidence" && noApprovedSource;
          return (
            <button
              key={option.kind}
              type="button"
              role="radio"
              aria-checked={selected === option.kind}
              className="cbf-option"
              data-selected={selected === option.kind ? "on" : "off"}
              disabled={disabled || unavailable}
              title={
                unavailable
                  ? "No approved evidence for this field yet — assert it, or mark it an assumption."
                  : undefined
              }
              onClick={() => select(option.kind)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {selected === "approved_evidence" && approvedSources.length > 0 ? (
        <div className="cbf-field">
          <label htmlFor={`${groupId}-source`}>Approved source</label>
          <select
            id={`${groupId}-source`}
            value={
              value?.kind === "approved_evidence" ? value.evidenceId : ""
            }
            disabled={disabled}
            onChange={(event) =>
              onChange({
                kind: "approved_evidence",
                evidenceId: event.target.value,
              })
            }
          >
            {approvedSources.map((source) => (
              <option key={source.evidenceId} value={source.evidenceId}>
                {source.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {assumption ? (
        <div className="cbf-assumption">
          <div className="cbf-field">
            <label htmlFor={`${groupId}-owner`}>Owner</label>
            <input
              id={`${groupId}-owner`}
              type="text"
              value={assumption.owner}
              disabled={disabled}
              placeholder="Who owns validating this?"
              onChange={(event) =>
                onChange({ ...assumption, owner: event.target.value })
              }
            />
          </div>
          <div className="cbf-field">
            <label htmlFor={`${groupId}-plan`}>
              How Discover validates it
            </label>
            <input
              id={`${groupId}-plan`}
              type="text"
              value={assumption.p2ValidationPlan}
              disabled={disabled}
              placeholder="What Discover will do to confirm or correct it"
              onChange={(event) =>
                onChange({
                  ...assumption,
                  p2ValidationPlan: event.target.value,
                })
              }
            />
          </div>
        </div>
      ) : null}

      {selected ? (
        <p className={`cbf-note${isAssumption ? " cbf-note-amber" : ""}`}>
          {BASIS_OPTIONS.find((option) => option.kind === selected)?.note}
        </p>
      ) : (
        <p className="cbf-note">
          {emptyValue
            ? "Answer the question, then record how you know it."
            : "Record how you know this to complete the field."}
        </p>
      )}

      {noApprovedSource && !selected ? (
        <p className="cbf-note">
          No approved evidence for this field yet — an assertion or an owned
          assumption is enough to move on.
        </p>
      ) : null}

      {saveError ? (
        <p className="cbf-error" role="alert">
          {saveError}
        </p>
      ) : null}
    </div>
  );
}

const CBF_CSS = `
.cbf{--cbf-bg:#f5f1eb;--cbf-surface:#fff;--cbf-ink:#2c2c2a;--cbf-muted:#5f5e5a;--cbf-faint:#6f6e68;--cbf-line:rgba(10,10,11,.12);--cbf-amber:#ba7517;--cbf-amber-line:rgba(186,117,23,.3);--cbf-amber-bg:#fdf7ee;--cbf-mono:'JetBrains Mono',ui-monospace,monospace;--cbf-sans:Inter,system-ui,sans-serif;margin-top:12px;border:1px solid var(--cbf-line);border-radius:10px;background:var(--cbf-surface);padding:12px 14px;font-family:var(--cbf-sans);color:var(--cbf-ink)}
.cbf-is-assumption{border-color:var(--cbf-amber-line);background:var(--cbf-amber-bg)}
.cbf-eyebrow{font-family:var(--cbf-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--cbf-faint);margin-bottom:8px}
.cbf-options{display:flex;gap:6px;flex-wrap:wrap}
.cbf-option{font-family:inherit;border:1px solid var(--cbf-line);border-radius:8px;padding:8px 12px;min-height:34px;font-size:12.5px;font-weight:500;background:var(--cbf-bg);color:var(--cbf-muted);cursor:pointer}
.cbf-is-assumption .cbf-option{background:var(--cbf-surface)}
.cbf-option:hover:not(:disabled){border-color:rgba(10,10,11,.24)}
.cbf-option:disabled{cursor:not-allowed;opacity:.55}
.cbf-option[data-selected=on]{border-color:var(--cbf-ink);background:var(--cbf-ink);color:#fff;font-weight:600}
.cbf-is-assumption .cbf-option[data-selected=on]{border-color:var(--cbf-amber);background:var(--cbf-amber)}
.cbf-assumption{display:grid;grid-template-columns:1fr 1.4fr;gap:10px;margin-top:12px}
@media (max-width:640px){.cbf-assumption{grid-template-columns:1fr}}
.cbf-field{margin-top:12px}
.cbf-assumption .cbf-field{margin-top:0}
.cbf-field label{display:block;font-size:12px;color:var(--cbf-muted);margin-bottom:4px}
.cbf-field input,.cbf-field select{width:100%;box-sizing:border-box;font-family:inherit;font-size:13.5px;color:var(--cbf-ink);background:var(--cbf-surface);border:1px solid var(--cbf-line);border-radius:8px;padding:9px 11px}
.cbf-note{font-size:12px;color:var(--cbf-faint);margin:9px 0 0}
.cbf-note-amber{color:var(--cbf-amber)}
.cbf-error{font-size:12px;color:#8c2f22;margin:9px 0 0}
.cbf-badge{font-family:var(--cbf-mono,'JetBrains Mono',ui-monospace,monospace);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#ba7517;background:#faeeda;border:1px solid rgba(186,117,23,.3);border-radius:4px;padding:2px 6px;white-space:nowrap}
`;

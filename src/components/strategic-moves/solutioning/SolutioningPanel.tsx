"use client";

// Solutioning panel — the P3 Design Future State workspace entry point for
// the 5-pattern platform-fit gate. Sibling of `phase-workspace/` and
// `risk-assessment/`, same reasoning: stateful, fetch-driven client
// component.

import * as React from "react";
import { Card, Chip } from "../phase-workspace/primitives";
import { PhaseWorkspaceStyles } from "../phase-workspace/styles";
import {
  SOLUTION_PATTERN_OPTIONS,
  type SolutionPattern,
  type SolutionPatternFields,
} from "@/lib/programs/solution-pattern";

export interface SolutioningPanelProps {
  moveId: string;
}

const ROUTING_TONE: Record<string, "green" | "amber" | "red"> = {
  "Proceed, standard review.": "green",
  "Check coverage first.": "amber",
  "Challenge by default.": "red",
};

const SOLUTIONING_CSS = `
.sp-stack{display:flex;flex-direction:column;gap:14px;}
.sp-options{display:flex;flex-direction:column;gap:10px;}
.sp-option{display:flex;flex-direction:column;gap:4px;padding:12px 14px;border-radius:10px;border:1px solid rgba(20,20,19,0.14);background:#fff;cursor:pointer;}
.sp-option.selected{border-color:#0057b8;background:#eef4fb;}
.sp-option-head{display:flex;align-items:center;gap:10px;}
.sp-option-head input{margin:0;}
.sp-option-label{font-size:13.5px;font-weight:600;color:#1a1a18;}
.sp-option-desc{font-size:12.5px;color:#75736c;padding-left:24px;}
.sp-rationale{display:flex;flex-direction:column;gap:6px;}
.sp-rationale label{font-size:12.5px;font-weight:600;color:#1a1a18;}
.sp-rationale textarea{font-size:13px;padding:10px;border-radius:8px;border:1px solid rgba(20,20,19,0.14);font-family:inherit;}
.sp-actions{display:flex;align-items:center;gap:12px;}
.sp-actions button{font-size:13px;font-weight:600;padding:9px 16px;border-radius:8px;background:#1a1a18;color:#fff;border:none;cursor:pointer;}
.sp-actions button:disabled{opacity:0.5;cursor:not-allowed;}
`;

function SolutioningPanelStyles(): React.ReactElement {
  return <style dangerouslySetInnerHTML={{ __html: SOLUTIONING_CSS }} />;
}

function apiUrl(moveId: string) {
  return `/api/v1/programs/${moveId}/solution-pattern`;
}

export function SolutioningPanel({ moveId }: SolutioningPanelProps) {
  const [pattern, setPattern] = React.useState<SolutionPattern | "">("");
  const [rationale, setRationale] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [lastSaved, setLastSaved] =
    React.useState<SolutionPatternFields | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl(moveId));
        if (!res.ok) {
          if (!cancelled)
            setLoadError(
              "Could not load a prior solutioning record for this Move.",
            );
          return;
        }
        const data = (await res.json()) as {
          fields: SolutionPatternFields | null;
        };
        if (cancelled) return;
        if (data.fields) {
          setPattern(data.fields.pattern);
          setRationale(data.fields.rationale);
          setLastSaved(data.fields);
        }
      } catch {
        if (!cancelled)
          setLoadError(
            "Could not load a prior solutioning record for this Move.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [moveId]);

  const canSave = Boolean(pattern) && rationale.trim().length > 0;
  const isDirty =
    !lastSaved ||
    lastSaved.pattern !== pattern ||
    lastSaved.rationale !== rationale;

  async function handleSave() {
    if (!canSave || !pattern) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(apiUrl(moveId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern, rationale }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        fields?: SolutionPatternFields;
        detail?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setSaveError(data.detail ?? data.error ?? "Save failed.");
        return;
      }
      if (data.fields) setLastSaved(data.fields);
    } catch {
      setSaveError("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PhaseWorkspaceStyles />
      <SolutioningPanelStyles />
      <div className="sp-stack" data-testid="solutioning-panel">
        <Card
          kicker="Solutioning"
          title="Which pattern does this Move fit?"
          note="Only one pattern needs the platform — the other four are ways to say no."
        >
          {loading ? (
            <p>Loading…</p>
          ) : (
            <>
              {loadError ? <p role="alert">{loadError}</p> : null}
              <div
                className="sp-options"
                role="radiogroup"
                aria-label="Solution pattern"
              >
                {SOLUTION_PATTERN_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`sp-option ${pattern === opt.value ? "selected" : ""}`}
                  >
                    <span className="sp-option-head">
                      <input
                        type="radio"
                        name="solution-pattern"
                        value={opt.value}
                        checked={pattern === opt.value}
                        onChange={() => setPattern(opt.value)}
                      />
                      <span className="sp-option-label">{opt.value}</span>
                      <Chip tone={ROUTING_TONE[opt.routingNote] ?? "neutral"}>
                        {opt.routingNote}
                      </Chip>
                    </span>
                    <span className="sp-option-desc">{opt.description}</span>
                  </label>
                ))}
              </div>
              <div className="sp-rationale">
                <label htmlFor="solutioning-rationale">
                  Rationale — why this pattern fits
                </label>
                <textarea
                  id="solutioning-rationale"
                  rows={3}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Clinical documentation and claims joined inside the tenant boundary — no data leaves, no new vendor."
                />
              </div>
            </>
          )}
        </Card>

        {!loading && lastSaved ? (
          <div data-testid="solutioning-status">
            <Card
              kicker="Status"
              title={lastSaved.pattern}
              note={isDirty ? "Unsaved changes" : "Last saved"}
            >
              <p data-testid="solutioning-status-rationale">
                {lastSaved.rationale}
              </p>
            </Card>
          </div>
        ) : null}

        {!loading ? (
          <div className="sp-actions">
            <button
              type="button"
              disabled={!canSave || saving}
              onClick={() => void handleSave()}
            >
              {saving ? "Saving…" : "Save solutioning record"}
            </button>
            {!canSave ? (
              <span className="pw-note">
                Select a pattern and give a rationale to save.
              </span>
            ) : null}
            {saveError ? <span role="alert">{saveError}</span> : null}
          </div>
        ) : null}
      </div>
    </>
  );
}

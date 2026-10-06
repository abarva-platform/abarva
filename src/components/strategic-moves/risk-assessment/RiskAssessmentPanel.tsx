"use client";

// Risk Assessment panel — the P2 Discover & Diagnose workspace entry point
// for the risk-tiering model (D1-D5 dimensions + E1-E8 escalators). Lives as
// a SIBLING of `phase-workspace/` (like cost-effort/CostEffortWizard), same
// reasoning: this is a stateful, fetch-driven client component, not a pure
// presentational one.
//
// Scoring is computed CLIENT-SIDE on every change via `computeRiskTier` for
// instant feedback (it's a pure function, safe to run in the browser), then
// persisted server-side on Save, which re-computes and returns the same
// result from the server as the source of truth.

import * as React from "react";
import { Card, Chip, KeyValue } from "../phase-workspace/primitives";
import { PhaseWorkspaceStyles } from "../phase-workspace/styles";
import {
  computeRiskTier,
  type DimensionLevel,
  type EscalatorSeverity,
  type RiskTierInputs,
  type RiskTierResult,
} from "@/lib/programs/risk-tier-scoring";
import {
  RISK_DIMENSION_KEYS,
  RISK_ESCALATOR_KEYS,
  resolveRiskFactorVocabulary,
} from "@/lib/programs/risk-factor-vocabulary";

// Scoped to this component — deliberately not added to the shared
// phase-workspace/styles.tsx stylesheet, which many other components depend
// on. `ra-*` prefix avoids any collision with that file's `pw-*` classes.
const RISK_ASSESSMENT_CSS = `
.ra-stack{display:flex;flex-direction:column;gap:14px;}
.ra-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
@media (max-width:720px){.ra-grid{grid-template-columns:1fr;}}
.ra-field{display:flex;flex-direction:column;gap:4px;}
.ra-field-label{font-size:12.5px;font-weight:600;color:#1a1a18;}
.ra-field-question{font-size:12px;color:#75736c;}
.ra-field select{font-size:13px;padding:8px 10px;border-radius:8px;border:1px solid rgba(20,20,19,0.14);background:#fff;color:#1a1a18;}
.ra-actions{display:flex;align-items:center;gap:12px;}
.ra-actions button{font-size:13px;font-weight:600;padding:9px 16px;border-radius:8px;background:#1a1a18;color:#fff;border:none;cursor:pointer;}
.ra-actions button:disabled{opacity:0.5;cursor:not-allowed;}
`;

function RiskAssessmentPanelStyles(): React.ReactElement {
  return <style dangerouslySetInnerHTML={{ __html: RISK_ASSESSMENT_CSS }} />;
}

export interface RiskAssessmentPanelProps {
  moveId: string;
}

const DIMENSION_OPTIONS: readonly DimensionLevel[] = [
  "Low",
  "Moderate",
  "High",
  "Critical",
];
const ESCALATOR_OPTIONS: readonly EscalatorSeverity[] = [
  "NotTriggered",
  "Moderate",
  "High",
  "Critical",
];

/**
 * Every answerable key, dimensions and escalators together. Taken from the
 * vocabulary module's fixed key order rather than from a resolved prompt list:
 * which thirteen factors are required, and the submit/dirty logic that reads
 * them, must not depend on which archetype's WORDING is in use.
 */
const ALL_FIELD_KEYS: ReadonlyArray<keyof RiskTierInputs> = [
  ...RISK_DIMENSION_KEYS,
  ...RISK_ESCALATOR_KEYS,
];

const BAND_TONE: Record<
  RiskTierResult["band"],
  "neutral" | "green" | "amber" | "red"
> = {
  Unknown: "neutral",
  Low: "green",
  Moderate: "amber",
  High: "amber",
  Critical: "red",
};

function apiUrl(moveId: string) {
  return `/api/v1/programs/${moveId}/risk-assessment`;
}

export function RiskAssessmentPanel({ moveId }: RiskAssessmentPanelProps) {
  const [values, setValues] = React.useState<Partial<RiskTierInputs>>({});
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [savedResult, setSavedResult] = React.useState<RiskTierResult | null>(
    null,
  );
  const [lastSavedInputs, setLastSavedInputs] =
    React.useState<RiskTierInputs | null>(null);
  // The archetype the Move has DECLARED, served by the GET above. Selects the
  // wording of the thirteen factors and nothing else; null until the load
  // resolves, and no field renders before then.
  const [archetypeId, setArchetypeId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl(moveId));
        if (!res.ok) {
          if (!cancelled)
            setLoadError(
              "Could not load a prior risk assessment for this Move.",
            );
          return;
        }
        const data = (await res.json()) as {
          inputs: RiskTierInputs | null;
          result: RiskTierResult | null;
          archetypeId?: string | null;
        };
        if (cancelled) return;
        setArchetypeId(data.archetypeId ?? null);
        if (data.inputs) {
          setValues(data.inputs);
          setLastSavedInputs(data.inputs);
        }
        if (data.result) setSavedResult(data.result);
      } catch {
        if (!cancelled)
          setLoadError("Could not load a prior risk assessment for this Move.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [moveId]);

  const vocabulary = React.useMemo(
    () => resolveRiskFactorVocabulary(archetypeId),
    [archetypeId],
  );

  const allFieldsAnswered = ALL_FIELD_KEYS.every((key) =>
    Boolean(values[key]),
  );

  // "Dirty" means the current form values differ from what's actually saved
  // — NOT just "every field happens to be filled." Right after a fresh load
  // (or right after a successful save), every field IS filled, but nothing
  // is unsaved; the note must say "Last saved," not "Live preview."
  const isDirty =
    allFieldsAnswered &&
    (!lastSavedInputs ||
      ALL_FIELD_KEYS.some((key) => values[key] !== lastSavedInputs[key]));

  const livePreview: RiskTierResult | null =
    allFieldsAnswered && isDirty
      ? computeRiskTier(values as RiskTierInputs)
      : null;

  async function handleSave() {
    if (!allFieldsAnswered) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(apiUrl(moveId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: values }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        result?: RiskTierResult;
        detail?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setSaveError(data.detail ?? data.error ?? "Save failed.");
        return;
      }
      if (data.result) setSavedResult(data.result);
      setLastSavedInputs(values as RiskTierInputs);
    } catch {
      setSaveError("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const displayed = livePreview ?? savedResult;

  return (
    <>
      <PhaseWorkspaceStyles />
      <RiskAssessmentPanelStyles />
      <div className="ra-stack" data-testid="risk-assessment-panel">
        <Card
          kicker="Risk Assessment"
          title="D1-D5 structural risk, E1-E8 escalators"
          note="Scored from the same discovery answers as everything else on this phase."
        >
          {loading ? (
            <p>Loading…</p>
          ) : (
            <>
              {loadError ? <p role="alert">{loadError}</p> : null}
              <div className="ra-grid" data-testid="risk-dimension-fields">
                {vocabulary.dimensions.map((field) => (
                  <label key={field.key} className="ra-field">
                    <span className="ra-field-label">{field.label}</span>
                    <span className="ra-field-question">{field.question}</span>
                    <select
                      aria-label={field.label}
                      value={values[field.key] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value as DimensionLevel,
                        }))
                      }
                    >
                      <option value="">Select…</option>
                      {DIMENSION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <span className="pw-note">{field.hint}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </Card>

        {!loading ? (
          <Card
            kicker="Escalators"
            title="How the model is used"
            note="Each escalator adds 0-4 points; any triggered escalator routes to Governance Council regardless of the band."
          >
            <div className="ra-grid" data-testid="risk-escalator-fields">
              {vocabulary.escalators.map((field) => (
                <label key={field.key} className="ra-field">
                  <span className="ra-field-label">{field.label}</span>
                  <span className="ra-field-question">{field.question}</span>
                  <select
                    aria-label={field.label}
                    value={values[field.key] ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value as EscalatorSeverity,
                      }))
                    }
                  >
                    <option value="">Select…</option>
                    {ESCALATOR_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === "NotTriggered" ? "Not triggered" : opt}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </Card>
        ) : null}

        {displayed ? (
          <div data-testid="risk-result">
            <Card
              kicker="Result"
              title="Risk tier"
              note={livePreview ? "Live preview — not yet saved" : "Last saved"}
            >
              <KeyValue k="Dimension score">
                {displayed.dimensionScore} / 20
              </KeyValue>
              <KeyValue k="Escalator score">
                {displayed.escalatorScore} / 32
              </KeyValue>
              <KeyValue k="Total score">{displayed.totalScore}</KeyValue>
              <KeyValue k="Band">
                <span data-testid="risk-band">
                  <Chip tone={BAND_TONE[displayed.band]}>{displayed.band}</Chip>
                </span>
                {displayed.severeConditionOverrideApplied ? (
                  <Chip tone="red">Severe-condition override applied</Chip>
                ) : null}
              </KeyValue>
              <KeyValue k="Governance Council review">
                {displayed.governanceCouncilReviewRequired ? (
                  <Chip tone="amber">
                    Required — {displayed.escalatorsTriggered} escalator
                    {displayed.escalatorsTriggered === 1 ? "" : "s"} triggered
                  </Chip>
                ) : (
                  <Chip tone="green">
                    Not required — no escalators triggered
                  </Chip>
                )}
              </KeyValue>
            </Card>
          </div>
        ) : null}

        {!loading ? (
          <div className="ra-actions">
            <button
              type="button"
              disabled={!allFieldsAnswered || saving}
              onClick={() => void handleSave()}
            >
              {saving ? "Saving…" : "Save risk assessment"}
            </button>
            {!allFieldsAnswered ? (
              <span className="pw-note">
                Answer all 13 questions to see the score and save.
              </span>
            ) : null}
            {saveError ? <span role="alert">{saveError}</span> : null}
          </div>
        ) : null}
      </div>
    </>
  );
}

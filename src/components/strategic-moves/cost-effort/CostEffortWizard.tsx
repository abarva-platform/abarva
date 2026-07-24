"use client";

// Cost & Effort wizard — the P4 phase workspace entry point for the Nexus
// Pricing Engine (brief §9.2, five steps). Reuses the phase-workspace CHROME
// (`Card`/`Chip`/`KeyValue`/`PhaseWorkspaceStyles`) rather than inventing new
// wizard UI, per PRICING_ENGINE_CURRENT_STATE.md §11e's recommendation —
// but lives as a SIBLING of `phase-workspace/`, not inside it: that
// directory's own contract test
// (`phase-workspace/__tests__/phase-workspace-contract.test.ts`) enforces
// "pure props, no React state/effect/context hooks" for everything under
// it, and this wizard is a genuinely stateful, fetch-driven client
// component (matching where other stateful Move components already live,
// e.g. `PhaseApproveAndBuild.tsx`, `FileCabinetPanel.tsx`, directly under
// `strategic-moves/`).
//
// Simplicity rules honored (brief §9.3):
//   - Scope-driver questions are derived from the REAL archetype config
//     (never hardcoded), split scope (step 2) vs. people/change (step 3) by
//     each driver's real owning activity-pack category.
//   - Source chips are shown on every input; a suggestion is never
//     auto-confirmed — typing/confirming is an explicit user act.
//   - "Run estimate" stays disabled until the validation gate passes.
//   - Bulk role/location mix editing (an "Advanced mode" feature named in
//     the brief) is explicitly OUT of scope for this first UI pass — noted
//     here rather than silently omitted; see the PR5 release record.

import * as React from "react";
import { Card, Chip, KeyValue } from "../phase-workspace/primitives";
import { PhaseWorkspaceStyles } from "../phase-workspace/styles";
import { ResultsView } from "./ResultsView";
import {
  RANGE_TIER_KEYS,
  RANGE_TIER_LABELS,
  SCENARIO_KEY_LABELS,
  type DefaultRateCardJson,
  type EstimateConfigJson,
  type EstimateInputJson,
  type EstimateJson,
  type EstimateRunResultJson,
  type ValidationBlockingReasonJson,
} from "./types";

export interface CostEffortWizardProps {
  moveId: string;
  /** Prepopulate step 1's currency from the Move's own recorded value-at-stake, when the parent has it (brief §9.6 "From Move" chip). */
  defaultCurrency?: string | null;
}

type StepIndex = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS: Record<StepIndex, string> = {
  1: "Estimate setup",
  2: "Scope & quantities",
  3: "People, change & adoption",
  4: "Delivery & economics",
  5: "Review & run",
};

function apiBase(moveId: string) {
  return `/api/v1/programs/${moveId}/pricing`;
}

async function readJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export function CostEffortWizard({ moveId, defaultCurrency }: CostEffortWizardProps): React.ReactElement {
  const [step, setStep] = React.useState<StepIndex>(1);
  const [config, setConfig] = React.useState<EstimateConfigJson | null>(null);
  const [defaultRateCard, setDefaultRateCard] = React.useState<DefaultRateCardJson | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [estimate, setEstimate] = React.useState<EstimateJson | null>(null);
  const [inputsByKey, setInputsByKey] = React.useState<Record<string, EstimateInputJson>>({});
  const [draftValues, setDraftValues] = React.useState<Record<string, string>>({});
  const [advancedOpen, setAdvancedOpen] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [validation, setValidation] = React.useState<{ ready: boolean; blockingReasons: ValidationBlockingReasonJson[] } | null>(null);
  const [running, setRunning] = React.useState(false);
  const [runError, setRunError] = React.useState<string | null>(null);
  const [runResult, setRunResult] = React.useState<EstimateRunResultJson | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${apiBase(moveId)}/config`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`config request failed (HTTP ${res.status})`);
        return readJson<{ config: EstimateConfigJson; defaultRateCard: DefaultRateCardJson | null }>(res);
      })
      .then((data) => {
        if (cancelled) return;
        setConfig(data.config);
        setDefaultRateCard(data.defaultRateCard ?? null);
        setDraftValues((prev) => ({ currency: defaultCurrency ?? "USD", ...prev }));
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load the Cost & Effort configuration.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveId]);

  const archetypeCode = draftValues.archetype_code ?? "";
  const requiredInputs = config && archetypeCode ? (config.requiredInputsByArchetype[archetypeCode] ?? []) : [];
  const scopeInputs = requiredInputs.filter((i) => i.stepHint === "scope");
  const peopleInputs = requiredInputs.filter((i) => i.stepHint === "people");

  function setDraft(key: string, value: string) {
    setDraftValues((prev) => ({ ...prev, [key]: value }));
  }

  async function saveHeader() {
    if (!estimate) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${apiBase(moveId)}/estimates/${estimate.id}/inputs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          header: {
            scenarioName: draftValues.scenario_name,
            archetypeCode: draftValues.archetype_code,
            currency: draftValues.currency,
            targetStartDate: draftValues.target_start_date || null,
            targetDurationWeeks: draftValues.target_duration_weeks ? Number(draftValues.target_duration_weeks) : null,
          },
        }),
      });
      const data = await readJson<{ ok: boolean; estimate: EstimateJson; error?: string; detail?: string }>(res);
      if (!res.ok || !data.ok) throw new Error(data.detail || data.error || "Could not save.");
      setEstimate(data.estimate);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function createDraft() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${apiBase(moveId)}/estimates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioName: draftValues.scenario_name,
          archetypeCode: draftValues.archetype_code,
          currency: draftValues.currency || "USD",
          targetStartDate: draftValues.target_start_date || null,
          targetDurationWeeks: draftValues.target_duration_weeks ? Number(draftValues.target_duration_weeks) : null,
          selectedRateCardId: defaultRateCard?.id ?? null,
        }),
      });
      const data = await readJson<{ ok: boolean; estimate: EstimateJson; error?: string; detail?: string }>(res);
      if (!res.ok || !data.ok) throw new Error(data.detail || data.error || "Could not create the estimate draft.");
      setEstimate(data.estimate);
      setStep(2);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not create the estimate draft.");
    } finally {
      setSaving(false);
    }
  }

  async function saveDriverInputs(keys: string[], confirm: boolean) {
    if (!estimate || keys.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${apiBase(moveId)}/estimates/${estimate.id}/inputs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs: keys.map((key) => {
            const meta = requiredInputs.find((i) => i.inputKey === key);
            return {
              inputKey: key,
              value: Number(draftValues[key]),
              unit: meta?.unit ?? null,
              required: true,
              sourceType: "client_input",
              confirm,
            };
          }),
        }),
      });
      const data = await readJson<{ ok: boolean; updatedInputs: EstimateInputJson[] | null; error?: string; detail?: string }>(res);
      if (!res.ok || !data.ok) throw new Error(data.detail || data.error || "Could not save.");
      if (data.updatedInputs) {
        setInputsByKey((prev) => {
          const next = { ...prev };
          for (const row of data.updatedInputs ?? []) next[row.inputKey] = row;
          return next;
        });
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function saveRangeTierInputs() {
    if (!estimate) return;
    const keys = RANGE_TIER_KEYS.filter((key) => draftValues[key]);
    if (keys.length === 0) return;
    await saveDriverInputsRaw(
      keys.map((key) => ({ inputKey: key, value: draftValues[key], sourceType: "client_input" as const, confirm: true })),
    );
  }

  async function saveDriverInputsRaw(
    inputs: { inputKey: string; value: unknown; sourceType: "client_input"; confirm: boolean }[],
  ) {
    if (!estimate) return;
    await fetch(`${apiBase(moveId)}/estimates/${estimate.id}/inputs`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs }),
    });
  }

  async function runValidate(): Promise<boolean> {
    if (!estimate) return false;
    const res = await fetch(`${apiBase(moveId)}/estimates/${estimate.id}/validate`, { method: "POST" });
    const data = await readJson<{ ok: boolean; ready: boolean; blockingReasons: ValidationBlockingReasonJson[] }>(res);
    setValidation({ ready: data.ready, blockingReasons: data.blockingReasons ?? [] });
    return data.ready;
  }

  async function runEstimateNow() {
    if (!estimate) return;
    setRunning(true);
    setRunError(null);
    try {
      const res = await fetch(`${apiBase(moveId)}/estimates/${estimate.id}/run`, { method: "POST" });
      const data = await readJson<{ ok: boolean; result?: EstimateRunResultJson; error?: string; detail?: string; blockingReasons?: ValidationBlockingReasonJson[] }>(res);
      if (!res.ok || !data.ok || !data.result) {
        if (data.blockingReasons) setValidation({ ready: false, blockingReasons: data.blockingReasons });
        throw new Error(data.detail || data.error || "Could not run the estimate.");
      }
      setRunResult(data.result);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Could not run the estimate.");
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="pw">
        <PhaseWorkspaceStyles />
        <span className="pw-note">Loading Cost &amp; Effort configuration…</span>
      </div>
    );
  }

  if (loadError || !config) {
    return (
      <div className="pw">
        <PhaseWorkspaceStyles />
        <Card kicker="Cost & Effort" title="Could not load configuration" note={loadError ?? undefined}>
          <span className="pw-note">
            The PR4 effort/cost reference pack may not be loaded for this environment yet.
          </span>
        </Card>
      </div>
    );
  }

  if (runResult && estimate) {
    return (
      <div className="pw">
        <PhaseWorkspaceStyles />
        <ResultsView result={runResult} currency={estimate.currency} />
      </div>
    );
  }

  return (
    <div className="pw" data-testid="cost-effort-wizard">
      <PhaseWorkspaceStyles />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <nav aria-label="Cost & Effort wizard steps" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {([1, 2, 3, 4, 5] as StepIndex[]).map((s) => (
            <button
              key={s}
              type="button"
              className="pw-dl-btn"
              aria-current={step === s ? "step" : undefined}
              disabled={s > 1 && !estimate}
              onClick={() => setStep(s)}
            >
              {s}. {STEP_LABELS[s]}
            </button>
          ))}
        </nav>

        {saveError ? <Chip tone="red">{saveError}</Chip> : null}

        {step === 1 ? (
          <Card kicker="Step 1 of 5" title="Estimate setup">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (estimate) void saveHeader().then(() => setStep(2));
                else void createDraft();
              }}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <label>
                <span className="pw-kv-k">Scenario name</span>
                <input
                  aria-label="Scenario name"
                  required
                  value={draftValues.scenario_name ?? ""}
                  onChange={(e) => setDraft("scenario_name", e.target.value)}
                />
              </label>
              <label>
                <span className="pw-kv-k">Archetype</span>
                <select
                  aria-label="Archetype"
                  required
                  value={draftValues.archetype_code ?? ""}
                  onChange={(e) => setDraft("archetype_code", e.target.value)}
                >
                  <option value="" disabled>
                    Select an archetype…
                  </option>
                  {config.archetypes.map((a) => (
                    <option key={a.archetypeCode} value={a.archetypeCode}>
                      {a.archetypeName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="pw-kv-k">Currency</span>
                <input aria-label="Currency" value={draftValues.currency ?? "USD"} onChange={(e) => setDraft("currency", e.target.value)} />
                {defaultCurrency ? <Chip tone="blue">From Move</Chip> : <Chip tone="neutral">AbarVa default</Chip>}
              </label>
              <label>
                <span className="pw-kv-k">Target start date</span>
                <input
                  aria-label="Target start date"
                  type="date"
                  required
                  value={draftValues.target_start_date ?? ""}
                  onChange={(e) => setDraft("target_start_date", e.target.value)}
                />
              </label>
              <label>
                <span className="pw-kv-k">Target duration (weeks)</span>
                <input
                  aria-label="Target duration in weeks"
                  type="number"
                  min={1}
                  required
                  value={draftValues.target_duration_weeks ?? ""}
                  onChange={(e) => setDraft("target_duration_weeks", e.target.value)}
                />
              </label>
              <KeyValue k="Rate card">
                {defaultRateCard ? `${defaultRateCard.cardCode} v${defaultRateCard.version}` : "No committed client rate card yet — global starter defaults will be used, honestly labeled in the results."}
              </KeyValue>
              <button type="submit" className="pw-dl-btn" disabled={saving}>
                {saving ? "Saving…" : "Continue"}
              </button>
            </form>
          </Card>
        ) : null}

        {step === 2 && estimate ? (
          <Card kicker="Step 2 of 5" title="Scope & quantities" note="Derived from the real archetype→activity-pack→driver mapping for this estimate's archetype.">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {scopeInputs.length === 0 ? (
                <span className="pw-note">No scope-driver quantities apply to this archetype.</span>
              ) : (
                scopeInputs.map((input) => (
                  <label key={input.inputKey}>
                    <span className="pw-kv-k">
                      {input.label} {input.unit ? `(${input.unit})` : ""}
                    </span>
                    <input
                      aria-label={input.label}
                      type="number"
                      min={0}
                      value={draftValues[input.inputKey] ?? ""}
                      onChange={(e) => setDraft(input.inputKey, e.target.value)}
                    />
                    <Chip tone={inputsByKey[input.inputKey]?.confirmedAt ? "green" : "amber"}>
                      {inputsByKey[input.inputKey]?.confirmedAt ? "Confirmed" : "Needs your input"}
                    </Chip>
                  </label>
                ))
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="pw-dl-btn"
                  disabled={saving}
                  onClick={async () => {
                    await saveDriverInputs(scopeInputs.map((i) => i.inputKey), true);
                    setStep(3);
                  }}
                >
                  {saving ? "Saving…" : "Continue"}
                </button>
              </div>
            </div>
          </Card>
        ) : null}

        {step === 3 && estimate ? (
          <Card kicker="Step 3 of 5" title="People, change & adoption">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {peopleInputs.length === 0 ? (
                <span className="pw-note">No people/change/adoption drivers apply to this archetype.</span>
              ) : (
                peopleInputs.map((input) => (
                  <label key={input.inputKey}>
                    <span className="pw-kv-k">
                      {input.label} {input.unit ? `(${input.unit})` : ""}
                    </span>
                    <input
                      aria-label={input.label}
                      type="number"
                      min={0}
                      value={draftValues[input.inputKey] ?? ""}
                      onChange={(e) => setDraft(input.inputKey, e.target.value)}
                    />
                  </label>
                ))
              )}
              <button
                type="button"
                className="pw-dl-btn"
                disabled={saving}
                onClick={async () => {
                  await saveDriverInputs(peopleInputs.map((i) => i.inputKey), true);
                  setStep(4);
                }}
              >
                {saving ? "Saving…" : "Continue"}
              </button>
            </div>
          </Card>
        ) : null}

        {step === 4 && estimate ? (
          <Card kicker="Step 4 of 5" title="Delivery & economics">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label>
                <span className="pw-kv-k">Delivery scenario</span>
                <select value={draftValues.scenario_key ?? "traditional"} onChange={(e) => setDraft("scenario_key", e.target.value)}>
                  {Object.entries(SCENARIO_KEY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="pw-dl-btn"
                onClick={() => setAdvancedOpen((v) => !v)}
                aria-expanded={advancedOpen}
              >
                {advancedOpen ? "Hide advanced" : "Advanced"}
              </button>
              {advancedOpen ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span className="pw-note">
                    Range-policy judgment calls (optional) — widen or tighten the low/expected/high spread.
                    Bulk role/location mix editing is deferred to a future pass; not available here yet.
                  </span>
                  {RANGE_TIER_KEYS.map((key) => (
                    <label key={key}>
                      <span className="pw-kv-k">{RANGE_TIER_LABELS[key]}</span>
                      <select value={draftValues[key] ?? "medium"} onChange={(e) => setDraft(key, e.target.value)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </label>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                className="pw-dl-btn"
                disabled={saving}
                onClick={async () => {
                  await saveHeader();
                  await saveRangeTierInputs();
                  await runValidate();
                  setStep(5);
                }}
              >
                {saving ? "Saving…" : "Continue"}
              </button>
            </div>
          </Card>
        ) : null}

        {step === 5 && estimate ? (
          <Card kicker="Step 5 of 5" title="Review all assumptions">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Parameter</th>
                  <th style={{ textAlign: "left" }}>Value</th>
                  <th style={{ textAlign: "left" }}>Source</th>
                  <th style={{ textAlign: "left" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {requiredInputs.map((input) => {
                  const saved = inputsByKey[input.inputKey];
                  return (
                    <tr key={input.inputKey}>
                      <td>{input.label}</td>
                      <td>{String(saved?.value ?? draftValues[input.inputKey] ?? "—")}</td>
                      <td>{saved?.sourceType ?? "client_input"}</td>
                      <td>{saved?.confirmedAt ? "Confirmed" : "Needs confirmation"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {validation && !validation.ready ? (
              <div style={{ marginTop: 12 }}>
                <Chip tone="amber">Run estimate is blocked</Chip>
                <ul>
                  {validation.blockingReasons.map((b) => (
                    <li key={b.inputKey} style={{ fontSize: 13 }}>
                      {b.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {runError ? <Chip tone="red">{runError}</Chip> : null}
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button type="button" className="pw-dl-btn" onClick={() => void runValidate()}>
                Re-check
              </button>
              <button
                type="button"
                className="pw-dl-btn"
                disabled={running || (validation !== null && !validation.ready)}
                onClick={() => void runEstimateNow()}
              >
                {running ? "Running…" : "Run estimate"}
              </button>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

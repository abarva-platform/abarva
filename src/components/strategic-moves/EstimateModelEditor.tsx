"use client";

import {
  emptyEstimateModel,
  evaluateEstimateModel,
  parseEstimateModel,
  type EstimateCurrency,
  type EstimateDeliveryModel,
  type EstimateModel,
  type EstimateModelLine,
} from "@/lib/programs/estimate-model";

const MODELS: readonly EstimateDeliveryModel[] = ["internal", "vendor"];

function blankLine(
  pairId: string,
  deliveryModel: EstimateDeliveryModel,
): EstimateModelLine {
  return {
    pairId,
    workPackage: "",
    role: "",
    deliveryModel,
    lowHours: null,
    baseHours: null,
    highHours: null,
    ratePerHour: null,
    rateSource: "",
    inputBasis: "assumption",
    evidenceReference: "",
    assumption: "",
    confidence: "low",
    aiEligiblePct: 0,
    aiToolAssumption: "",
    humanReviewHours: 0,
  };
}

function updateLine(
  model: EstimateModel,
  pairId: string,
  deliveryModel: EstimateDeliveryModel,
  update: Partial<EstimateModelLine>,
): EstimateModel {
  const exists = model.rows.some(
    (line) => line.pairId === pairId && line.deliveryModel === deliveryModel,
  );
  const rows = exists
    ? model.rows.map((line) =>
        line.pairId === pairId && line.deliveryModel === deliveryModel
          ? { ...line, ...update }
          : line,
      )
    : [...model.rows, { ...blankLine(pairId, deliveryModel), ...update }];
  return {
    ...model,
    reviewConfirmed: false,
    rows,
  };
}

function lineInput(
  label: string,
  value: number | null,
  onChange: (value: number | null) => void,
  step = "0.1",
) {
  return (
    <label className="mxw-estimate-field">
      <span>{label}</span>
      <input
        inputMode="decimal"
        min="0"
        onChange={(event) =>
          onChange(event.target.value === "" ? null : Number(event.target.value))
        }
        step={step}
        type="number"
        value={value ?? ""}
      />
    </label>
  );
}

export function EstimateModelEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const model = parseEstimateModel(value);
  if (!model) {
    return (
      <div className="mxw-estimate-legacy" role="status">
        <p>This field contains earlier estimate notes. They will be preserved as notes in the editable model.</p>
        <pre>{value}</pre>
        <button
          onClick={() =>
            onChange(
              JSON.stringify({ ...emptyEstimateModel(), sourceNotes: value }, null, 2),
            )
          }
          type="button"
        >
          Start editable estimate
        </button>
      </div>
    );
  }

  const evaluation = evaluateEstimateModel(value);
  const grouped = new Map<string, EstimateModelLine[]>();
  for (const line of model.rows) {
    const group = grouped.get(line.pairId) ?? [];
    group.push(line);
    grouped.set(line.pairId, group);
  }
  const currency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: model.currency,
      maximumFractionDigits: 0,
    }).format(amount);
  const commit = (next: EstimateModel) => onChange(JSON.stringify(next));

  const addPair = () => {
    let sequence = model.rows.length + 1;
    let pairId = `role-pair-${sequence}`;
    while (model.rows.some((line) => line.pairId === pairId)) {
      sequence += 1;
      pairId = `role-pair-${sequence}`;
    }
    commit({
      ...model,
      reviewConfirmed: false,
      rows: [
        ...model.rows,
        ...MODELS.map((deliveryModel) => blankLine(pairId, deliveryModel)),
      ],
    });
  };

  return (
    <div className="mxw-estimate-model" aria-label="Editable estimate model">
      <div className="mxw-estimate-toolbar">
        <label className="mxw-estimate-field mxw-estimate-currency">
          <span>Currency</span>
          <select
            onChange={(event) =>
              commit({ ...model, currency: event.target.value as EstimateCurrency, reviewConfirmed: false })
            }
            value={model.currency}
          >
            {(["USD", "CAD", "EUR", "GBP"] as const).map((currencyCode) => (
              <option key={currencyCode} value={currencyCode}>{currencyCode}</option>
            ))}
          </select>
        </label>
        <button className="mxw-estimate-add" onClick={addPair} type="button">
          Add role / work package
        </button>
      </div>

      {grouped.size === 0 ? (
        <p className="mxw-estimate-empty">Add a role/work-package pair to build comparable internal and vendor ranges.</p>
      ) : null}

      {[...grouped.entries()].map(([pairId, lines]) => {
        const internal = lines.find((line) => line.deliveryModel === "internal") ?? blankLine(pairId, "internal");
        const vendor = lines.find((line) => line.deliveryModel === "vendor") ?? blankLine(pairId, "vendor");
        const updateShared = (key: "workPackage" | "role", text: string) => {
          const next = {
            ...model,
            reviewConfirmed: false,
            rows: model.rows.map((line) => line.pairId === pairId ? { ...line, [key]: text } : line),
          };
          commit(next);
        };
        const removePair = () =>
          commit({
            ...model,
            reviewConfirmed: false,
            rows: model.rows.filter((line) => line.pairId !== pairId),
          });

        return (
          <section className="mxw-estimate-pair" key={pairId}>
            <div className="mxw-estimate-pair-head">
              <label className="mxw-estimate-field">
                <span>Work package</span>
                <input
                  onChange={(event) => updateShared("workPackage", event.target.value)}
                  placeholder="e.g. Curated reporting layer"
                  value={internal.workPackage || vendor.workPackage}
                />
              </label>
              <label className="mxw-estimate-field">
                <span>Role</span>
                <input
                  onChange={(event) => updateShared("role", event.target.value)}
                  placeholder="e.g. Data engineer"
                  value={internal.role || vendor.role}
                />
              </label>
              <button
                aria-label="Remove role and work package"
                className="mxw-estimate-remove"
                onClick={removePair}
                title="Remove role and work package"
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="mxw-estimate-scenarios">
              {MODELS.map((deliveryModel) => {
                const line = deliveryModel === "internal" ? internal : vendor;
                const set = (update: Partial<EstimateModelLine>) =>
                  commit(updateLine(model, pairId, deliveryModel, update));
                return (
                  <fieldset className="mxw-estimate-scenario" key={deliveryModel}>
                    <legend>{deliveryModel === "internal" ? "Internal delivery" : "Vendor delivery"}</legend>
                    <div className="mxw-estimate-numbers">
                      {lineInput("Low hours", line.lowHours, (lowHours) => set({ lowHours }))}
                      {lineInput("Base hours", line.baseHours, (baseHours) => set({ baseHours }))}
                      {lineInput("High hours", line.highHours, (highHours) => set({ highHours }))}
                      {lineInput("Rate / hour", line.ratePerHour, (ratePerHour) => set({ ratePerHour }), "1")}
                      {lineInput("AI assist (%)", line.aiEligiblePct, (aiEligiblePct) => set({ aiEligiblePct }), "1")}
                      {lineInput("Human review hrs", line.humanReviewHours, (humanReviewHours) => set({ humanReviewHours }))}
                    </div>
                    <div className="mxw-estimate-inputs">
                      <label className="mxw-estimate-field">
                        <span>Rate source</span>
                        <input onChange={(event) => set({ rateSource: event.target.value })} placeholder="Client rate card or planning benchmark" value={line.rateSource} />
                      </label>
                      <label className="mxw-estimate-field">
                        <span>Input basis</span>
                        <select onChange={(event) => set({ inputBasis: event.target.value as EstimateModelLine["inputBasis"] })} value={line.inputBasis}>
                          <option value="evidence">Evidence</option>
                          <option value="assumption">Assumption</option>
                          <option value="open">Open</option>
                        </select>
                      </label>
                      <label className="mxw-estimate-field">
                        <span>Confidence</span>
                        <select onChange={(event) => set({ confidence: event.target.value as EstimateModelLine["confidence"] })} value={line.confidence}>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </label>
                      {line.inputBasis === "evidence" ? (
                        <label className="mxw-estimate-field">
                          <span>Evidence reference</span>
                          <input onChange={(event) => set({ evidenceReference: event.target.value })} placeholder="Evidence ID and locator" value={line.evidenceReference} />
                        </label>
                      ) : line.inputBasis === "assumption" ? (
                        <label className="mxw-estimate-field">
                          <span>Assumption</span>
                          <input onChange={(event) => set({ assumption: event.target.value })} placeholder="Why this input is reasonable" value={line.assumption} />
                        </label>
                      ) : null}
                      {(line.aiEligiblePct ?? 0) > 0 ? (
                        <label className="mxw-estimate-field mxw-estimate-wide">
                          <span>Claude Code / Codex assumption</span>
                          <input onChange={(event) => set({ aiToolAssumption: event.target.value })} placeholder="Eligible tasks and expected productivity effect" value={line.aiToolAssumption} />
                        </label>
                      ) : null}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          </section>
        );
      })}

      {model.sourceNotes.trim() ? (
        <details className="mxw-estimate-notes">
          <summary>Earlier estimate notes</summary>
          <p>{model.sourceNotes}</p>
        </details>
      ) : null}

      <section className="mxw-estimate-totals" aria-label="Calculated estimate totals">
        <h3>Calculated ranges</h3>
        {MODELS.map((deliveryModel) => {
          const total = evaluation.totals[deliveryModel];
          return (
            <div key={deliveryModel}>
              <strong>{deliveryModel === "internal" ? "Internal" : "Vendor"}</strong>
              <span>{currency(total.lowCost)} / {currency(total.baseCost)} / {currency(total.highCost)}</span>
              <small>Low / base / high · {total.lowHours} / {total.baseHours} / {total.highHours} hours</small>
            </div>
          );
        })}
        <p>Formula: scenario hours × (1 − AI-assist sensitivity) + human-review hours; adjusted hours × planning rate. No savings or ROI is inferred.</p>
      </section>

      <div className="mxw-estimate-review">
        <label className="mxw-estimate-field">
          <span>Human estimate reviewer</span>
          <input
            onChange={(event) => commit({ ...model, reviewer: event.target.value, reviewConfirmed: false })}
            placeholder="Name / accountable role"
            value={model.reviewer}
          />
        </label>
        <label className="mxw-estimate-attestation">
          <input
            checked={model.reviewConfirmed}
            onChange={(event) => commit({ ...model, reviewConfirmed: event.target.checked })}
            type="checkbox"
          />
          <span>I reviewed the ranges, rate sources, assumptions, and human-review effort.</span>
        </label>
      </div>
      {evaluation.errors.length > 0 ? (
        <div className="mxw-estimate-errors" role="status">
          <strong>Estimate inputs open</strong>
          <ul>{evaluation.errors.slice(0, 4).map((error) => <li key={error}>{error}</li>)}</ul>
        </div>
      ) : (
        <div className="mxw-estimate-ready" role="status">Estimate assumptions reviewed; ready for the roadmap build.</div>
      )}
    </div>
  );
}

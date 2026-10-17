"use client";

// P3 Step 4 — the AI-assisted delivery scenario, priced beside the estimate.
//
// Every number is a register assumption: an hours reduction per driver (a
// share, e.g. 0.35) and a monthly cost per tool seat. The ROM preview route
// prices the scenario; this panel only edits the plan and shows the result.
// The estimate the team approves, and what P4 reads, never change here.

import { useState, type ReactNode } from "react";

import type { RomResult } from "@/lib/pricing/moves-workflow/rom-service";
import {
  buildRomAiAssist,
  countedDrivers,
  formatRomHours,
  formatRomMoney,
  formatRomWeeks,
  resolveRomUnitHours,
  romAiScenarioCarry,
  ROM_DRIVER_LABELS,
  setRomAiAssistPlan,
  type RomAiAssistPlan,
  type RomDriver,
  type RomEstimate,
  type RomRegisterRow,
} from "@/lib/programs/rom-estimate";

import styles from "./MovesStepPage.module.css";

const cx = (...names: Array<string | false | null | undefined>) =>
  names
    .filter((name): name is string => Boolean(name))
    .map((name) => styles[name] ?? name)
    .join(" ");

type Edit = ReturnType<typeof setRomAiAssistPlan>;

/** What P4 shows, in one sentence per state. */
const CARRY_SENTENCE: Record<ReturnType<typeof romAiScenarioCarry>, (approved: boolean) => string> = {
  none: () => "",
  carried: () => "Approved with the estimate: P4 shows this scenario as a comparison, never as the funding basis.",
  not_approved: (approved) =>
    approved
      ? "Not in P4 yet: reopen and approve the estimate to carry this scenario to P4 as a comparison."
      : "Approving the estimate carries this scenario to P4 as a comparison.",
  provisional: () => "Provisional scenarios are shown here only; confirm their register rows to carry one to P4.",
  changed_since_approval: () =>
    "Changed since the estimate was approved: P4 still shows the approved scenario until the estimate is approved again.",
};

export interface RomAiScenarioPanelProps {
  record: RomEstimate;
  register: readonly RomRegisterRow[] | null;
  /** The current preview; its `aiAssisted` is the priced scenario. */
  rom: RomResult | null;
  /** Shown in place of every amount when the viewer may not see figures. */
  hiddenMoney: ReactNode | null;
  onEdit: (edit: Edit) => boolean;
}

function signed(text: string, n: number): string {
  return n > 0 ? `+${text}` : n < 0 ? `−${text.replace(/^-/, "")}` : text;
}

export function RomAiScenarioPanel({ record, register, rom, hiddenMoney, onEdit }: RomAiScenarioPanelProps) {
  const plan = record.aiAssist ?? null;
  const [toolForm, setToolForm] = useState<{ label: string; seats: string; registerId: string } | null>(null);
  const [labelDraft, setLabelDraft] = useState<string | null>(null);
  const rows = (register ?? []).filter((r) => r.status !== "superseded" && r.status !== "rejected");
  const save = (next: RomAiAssistPlan | null) => onEdit(setRomAiAssistPlan(record, next));

  if (!plan) {
    return (
      <div data-testid="rom-ai-scenario">
        <p className={cx("lead-line")}>
          Price the same work with sourced AI speed-ups and tool costs, beside this estimate. The estimate you approve,
          and P4, stay as they are.
        </p>
        <button
          type="button"
          className={cx("link-btn")}
          onClick={() => save({ label: "AI-assisted delivery", factors: {}, tools: [] })}
        >
          Add an AI-assisted scenario
        </button>
      </div>
    );
  }

  const build = buildRomAiAssist(record, register);
  const scenario = rom?.aiAssisted ?? null;
  const money = (cents: number) => hiddenMoney ?? formatRomMoney(cents);
  const factorLine = (driver: RomDriver) => {
    const ref = plan.factors[driver];
    const state = ref ? resolveRomUnitHours(ref, register) : null;
    const shown =
      state?.state === "confirmed"
        ? `${Math.round(state.value * 100)}% fewer hours · ${state.sourceLabel}`
        : state?.state === "open"
          ? `Working figure ${state.workingFigure ?? state.workingValue ?? "none"} · A:${state.registerId} open (provisional)`
          : state
            ? "Not usable — see below"
            : "No reduction assumed";
    return (
      <li key={driver}>
        <span>
          <span className={cx("item-name")}>{ROM_DRIVER_LABELS[driver]}</span>
          <span className={cx("item-note")} data-testid={`rom-ai-factor-${driver}`}>
            {shown}
          </span>
        </span>
        <span className={cx("item-actions")}>
          <select
            aria-label={`Hours reduction for ${ROM_DRIVER_LABELS[driver]}`}
            className={cx("cell-input")}
            value={ref?.registerId ?? ""}
            disabled={register === null}
            onChange={(e) => {
              const factors = { ...plan.factors };
              if (e.target.value) factors[driver] = { kind: "register", registerId: e.target.value };
              else delete factors[driver];
              save({ ...plan, factors });
            }}
          >
            <option value="">No reduction</option>
            {rows.map((r) => (
              <option key={r.registerId} value={r.registerId}>
                {r.registerId} · {r.statement}
              </option>
            ))}
          </select>
        </span>
      </li>
    );
  };

  return (
    <div data-testid="rom-ai-scenario" style={{ display: "grid", gap: 10 }}>
      <p className={cx("lead-line")}>
        <span className={cx("lead")}>Scenario only.</span> The estimate you approve, and P4, use the Estimate column.
        Each speed-up and tool cost is a register assumption; nothing is assumed by default.
      </p>
      <div className={cx("item-actions")}>
        <label className={cx("q-label")} htmlFor="rom-ai-label">
          Scenario
        </label>
        <input
          id="rom-ai-label"
          className={cx("cell-input")}
          value={labelDraft ?? plan.label}
          maxLength={90}
          onChange={(e) => setLabelDraft(e.target.value)}
          onBlur={() => {
            if (labelDraft !== null && labelDraft.trim() !== plan.label) save({ ...plan, label: labelDraft });
            setLabelDraft(null);
          }}
        />
      </div>

      <ul className={cx("items")} data-testid="rom-ai-factors">
        {countedDrivers(record).map((d) => factorLine(d))}
      </ul>

      <div>
        <span className={cx("item-name")}>Tools</span>
        <ul className={cx("items")} data-testid="rom-ai-tools">
          {plan.tools.map((tool) => {
            const cost = resolveRomUnitHours(tool.cost, register);
            return (
              <li key={tool.code}>
                <span>
                  <span className={cx("item-name")}>{tool.label}</span>
                  <span className={cx("item-note")}>
                    {tool.seats} {tool.seats === 1 ? "seat" : "seats"} ·{" "}
                    {cost.state === "confirmed"
                      ? `${hiddenMoney ?? `$${cost.value.toLocaleString("en-US")}`} per seat-month · ${cost.sourceLabel}`
                      : cost.state === "open"
                        ? `A:${cost.registerId} open (provisional)`
                        : "cost not usable — see below"}
                  </span>
                </span>
                <span className={cx("item-actions")}>
                  <button
                    type="button"
                    className={cx("link-btn")}
                    onClick={() => save({ ...plan, tools: plan.tools.filter((t) => t.code !== tool.code) })}
                  >
                    Remove
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
        {toolForm ? (
          <div className={cx("warn-inline")} data-testid="rom-ai-tool-form">
            <input
              aria-label="Tool name"
              className={cx("cell-input")}
              placeholder="e.g. AI coding agent seats"
              value={toolForm.label}
              maxLength={60}
              onChange={(e) => setToolForm({ ...toolForm, label: e.target.value })}
            />
            <input
              aria-label="Seats"
              className={cx("cell-input")}
              inputMode="numeric"
              value={toolForm.seats}
              onChange={(e) => setToolForm({ ...toolForm, seats: e.target.value })}
            />
            <select
              aria-label="Monthly cost per seat"
              className={cx("cell-input")}
              value={toolForm.registerId}
              onChange={(e) => setToolForm({ ...toolForm, registerId: e.target.value })}
            >
              <option value="">Cost per seat-month: choose a row…</option>
              {rows.map((r) => (
                <option key={r.registerId} value={r.registerId}>
                  {r.registerId} · {r.statement}
                </option>
              ))}
            </select>
            <span className={cx("item-actions")}>
              <button
                type="button"
                className={cx("btn-ink")}
                disabled={!toolForm.label.trim() || !toolForm.registerId || !/^\d+(\.\d+)?$/.test(toolForm.seats.trim())}
                onClick={() => {
                  const code = `TOOL-${plan.tools.length + 1}-${Date.now().toString(36)}`;
                  const ok = save({
                    ...plan,
                    tools: [...plan.tools, { code, label: toolForm.label, seats: Number(toolForm.seats), cost: { kind: "register", registerId: toolForm.registerId } }],
                  });
                  if (ok) setToolForm(null);
                }}
              >
                Add tool
              </button>
              <button type="button" className={cx("link-btn")} onClick={() => setToolForm(null)}>
                Cancel
              </button>
            </span>
          </div>
        ) : (
          <button type="button" className={cx("link-btn")} disabled={register === null} onClick={() => setToolForm({ label: "", seats: "", registerId: "" })}>
            Add a tool cost
          </button>
        )}
      </div>

      {build.status === "incomplete" || (build.status !== "none" && build.problems.length > 0) ? (
        <ul className={cx("item-note")} data-testid="rom-ai-problems">
          {build.problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : null}
      {build.status === "provisional" ? (
        <p className={cx("lead-line")} data-testid="rom-ai-provisional">
          Provisional until {build.provisionalBecause.join(", ")} {build.provisionalBecause.length > 1 ? "are" : "is"} confirmed.
        </p>
      ) : null}
      <p className={cx("item-note")} data-testid="rom-ai-carry">
        {CARRY_SENTENCE[romAiScenarioCarry(record, register)](Boolean(record.approval))}
      </p>

      {scenario && rom ? (
        // Narrow layouts show these cards; the design system shows the table instead at ≥680px.
        <div className={cx("cards")} data-testid="rom-ai-compare-cards">
          {(
            [
              ["Estimate", formatRomHours(rom.total.hours), formatRomWeeks(rom.total.weeks), money(0), money(rom.total.planCents)],
              [scenario.label, formatRomHours(scenario.total.hours), formatRomWeeks(scenario.total.weeks), money(scenario.toolCostCents), money(scenario.total.planCents)],
              [
                "Difference",
                signed(formatRomHours(Math.abs(scenario.versusEstimate.hours)), scenario.versusEstimate.hours),
                signed(formatRomWeeks(Math.abs(scenario.versusEstimate.weeks)), scenario.versusEstimate.weeks),
                hiddenMoney ?? signed(formatRomMoney(scenario.toolCostCents), scenario.toolCostCents),
                hiddenMoney ?? signed(formatRomMoney(Math.abs(scenario.versusEstimate.planCents)), scenario.versusEstimate.planCents),
              ],
            ] as const
          ).map(([title, hours, weeks, tools, plan]) => (
            <div className={cx("card")} key={String(title)}>
              <span className={cx("card-title")}>{title}</span>
              <dl>
                <div><dt>Hours</dt><dd>{hours}</dd></div>
                <div><dt>Weeks</dt><dd>{weeks}</dd></div>
                <div><dt>Tool cost</dt><dd>{tools}</dd></div>
                <div><dt>Cost at plan</dt><dd>{plan}</dd></div>
              </dl>
            </div>
          ))}
        </div>
      ) : null}
      {scenario && rom ? (
        <table className={cx("tbl")} data-testid="rom-ai-compare">
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col">Estimate</th>
              <th scope="col">{scenario.label}</th>
              <th scope="col">Difference</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Hours</th>
              <td>{formatRomHours(rom.total.hours)}</td>
              <td>{formatRomHours(scenario.total.hours)}</td>
              <td>{signed(formatRomHours(Math.abs(scenario.versusEstimate.hours)), scenario.versusEstimate.hours)}</td>
            </tr>
            <tr>
              <th scope="row">Weeks</th>
              <td>{formatRomWeeks(rom.total.weeks)}</td>
              <td>{formatRomWeeks(scenario.total.weeks)}</td>
              <td>{signed(formatRomWeeks(Math.abs(scenario.versusEstimate.weeks)), scenario.versusEstimate.weeks)}</td>
            </tr>
            <tr>
              <th scope="row">Tool cost</th>
              <td>{money(0)}</td>
              <td>{money(scenario.toolCostCents)}</td>
              <td>{hiddenMoney ?? signed(formatRomMoney(scenario.toolCostCents), scenario.toolCostCents)}</td>
            </tr>
            <tr>
              <th scope="row">Cost at plan</th>
              <td>{money(rom.total.planCents)}</td>
              <td>{money(scenario.total.planCents)}</td>
              <td>{hiddenMoney ?? signed(formatRomMoney(Math.abs(scenario.versusEstimate.planCents)), scenario.versusEstimate.planCents)}</td>
            </tr>
          </tbody>
        </table>
      ) : null}

      <div>
        <button type="button" className={cx("link-btn")} onClick={() => save(null)}>
          Remove the scenario
        </button>
      </div>
    </div>
  );
}

"use client";

import type { SourceContractSpendMonthlyRow } from "@/lib/source/data-model/types";
import { numberFromDb } from "@/lib/source/data-model/vendor-contract-portfolio";
import { money } from "./viewModel";
import { utilizationAgainstCommitment } from "./WorkspaceExecutiveShell";
import type { SourceWorkspaceVM } from "./buildViewModel";

/**
 * Contract 360 — Economics and Performance briefing surfaces.
 *
 * Transcribed from the Claude Design contract "Source Contract 360.dc.html".
 * Every figure is summed from the loaded monthly spend rows, so the chart, the
 * reconciliation and the opening sentence cannot disagree with one another the
 * way two independently-derived figures did before.
 */

type SpendRows = readonly SourceContractSpendMonthlyRow[];

interface SpendTotals {
  readonly committed: number;
  readonly actual: number;
  readonly invoiced: number;
  readonly paid: number;
  readonly months: number;
}

function totalsFrom(rows: SpendRows): SpendTotals {
  let committed = 0;
  let actual = 0;
  let invoiced = 0;
  let paid = 0;
  for (const row of rows) {
    committed += numberFromDb(row.committed_amount) ?? 0;
    actual += numberFromDb(row.actual_spend) ?? 0;
    invoiced += numberFromDb(row.invoice_amount) ?? 0;
    paid += numberFromDb(row.paid_amount) ?? 0;
  }
  return { committed, actual, invoiced, paid, months: rows.length };
}

function byPeriod(rows: SpendRows): SpendRows {
  return [...rows].sort((a, b) =>
    String(a.period_start ?? a.month).localeCompare(
      String(b.period_start ?? b.month),
    ),
  );
}

function monthLabel(row: SourceContractSpendMonthlyRow): string {
  const raw = row.period_start ?? row.month;
  const date = raw ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) return String(raw ?? "");
  return date.toLocaleDateString("en-GB", { month: "short" });
}

/* -------------------------------------------------------------------------- */
/* Economics                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The commitment against what was actually drawn on it.
 *
 * The opening sentence, the chart and the reconciliation panel all read the
 * same rows. Where a commitment is not recorded the surface says so rather than
 * drawing a pace line against an assumed one.
 */
export function ContractEconomicsBriefing({
  spendMonths,
}: {
  spendMonths: SpendRows;
}) {
  if (spendMonths.length === 0) return null;

  const rows = byPeriod(spendMonths);
  const totals = totalsFrom(rows);
  const hasCommitment = totals.committed > 0;
  /*
   * One definition of utilization, shared with every other surface that
   * reports it. Recomputing the same ratio locally is how this tab came to
   * show two different figures for it in the first place.
   */
  const utilization = utilizationAgainstCommitment(
    totals.actual,
    totals.committed,
  );
  const inFlight = totals.invoiced - totals.paid;

  return (
    <div className="sw-c3-stack">
      <section className="sw-c3-card sw-c3-econ-lede">
        <p className="sw-c3-display">
          {hasCommitment && utilization != null
            ? utilization < 50
              ? `The rate is not the problem. ${utilization}% of the commitment is being drawn on.`
              : `${utilization}% of the commitment is being drawn on across ${totals.months} months.`
            : "Spend is loaded, but no commitment is recorded to measure it against."}
        </p>
        <p className="sw-c3-note">
          {`${totals.months} spend month${totals.months === 1 ? "" : "s"}`}
          {hasCommitment ? ` · ${money(totals.committed)} committed` : ""}
          {` · ${money(totals.actual)} consumed`}
        </p>
      </section>

      <div className="sw-c3-split-wide">
        <section className="sw-c3-card sw-c3-econ-chart">
          <div className="sw-c3-rail-head">
            <span className="sw-c3-display sw-c3-display-sm">
              Committed capacity against observed usage
            </span>
            <span className="sw-c3-chart-legend">
              {hasCommitment ? (
                <span className="sw-c3-legend-key">
                  <i style={{ background: "var(--sw-c3-stone)" }} />
                  Commitment pace
                </span>
              ) : null}
              <span className="sw-c3-legend-key">
                <i style={{ background: "var(--sw-c3-ink)" }} />
                Invoiced
              </span>
              <span className="sw-c3-legend-key">
                <i style={{ background: "var(--sw-c3-green)" }} />
                Consumed
              </span>
            </span>
          </div>
          <ConsumptionPaceChart rows={rows} totals={totals} />
          <p className="sw-c3-prose">
            {hasCommitment
              ? "The empty space is the commercial argument: what was committed, and what was drawn against it, month by month, with no period extrapolated."
              : "Consumption is charted on its own. Without a recorded commitment Source will not draw a pace line to compare it against."}
          </p>
        </section>

        <section className="sw-c3-card sw-c3-ap-recon">
          <div className="sw-c3-eyebrow">Invoice reconciliation</div>
          <div className="sw-c3-recon">
            <div className="sw-c3-recon-row">
              <span>Invoiced to date</span>
              <span className="sw-c3-mono">{money(totals.invoiced)}</span>
            </div>
            <div className="sw-c3-recon-row">
              <span>Paid to date</span>
              <span className="sw-c3-mono">{money(totals.paid)}</span>
            </div>
            <div className="sw-c3-recon-row">
              <span>In flight</span>
              <span className="sw-c3-mono">{money(inFlight)}</span>
            </div>
            <div className="sw-c3-recon-row sw-c3-recon-total">
              <span>Consumed against invoiced</span>
              <span className="sw-c3-mono">
                {totals.invoiced > 0
                  ? `${Math.round((totals.actual / totals.invoiced) * 100)}%`
                  : "Not established"}
              </span>
            </div>
          </div>
          <p className="sw-c3-prose">
            {Math.abs(inFlight) < 1
              ? `Invoiced and paid agree across ${totals.months} reconciled month${totals.months === 1 ? "" : "s"}. There is no billing leakage to recover here.`
              : `${money(Math.abs(inFlight))} sits between invoiced and paid across ${totals.months} month${totals.months === 1 ? "" : "s"}. That is a timing difference until an exception is raised against it.`}
          </p>
          <p className="sw-c3-note">
            Invoice exceptions are not a loaded lane on this contract, so none is
            asserted either way.
          </p>
        </section>
      </div>
    </div>
  );
}

/**
 * Cumulative consumption against the commitment pace.
 *
 * Drawn to one scale: every series is plotted against the same maximum, so the
 * gap between the pace line and the consumed line is the real gap rather than a
 * rescaled one.
 */
function ConsumptionPaceChart({
  rows,
  totals,
}: {
  rows: SpendRows;
  totals: SpendTotals;
}) {
  const W = 700;
  const H = 200;
  const TOP = 16;
  const BOTTOM = 180;

  let runningActual = 0;
  let runningInvoiced = 0;
  let runningCommitted = 0;
  const series = rows.map((row) => {
    runningActual += numberFromDb(row.actual_spend) ?? 0;
    runningInvoiced += numberFromDb(row.invoice_amount) ?? 0;
    runningCommitted += numberFromDb(row.committed_amount) ?? 0;
    return {
      label: monthLabel(row),
      actual: runningActual,
      invoiced: runningInvoiced,
      committed: runningCommitted,
    };
  });

  const ceiling = Math.max(
    totals.committed,
    runningActual,
    runningInvoiced,
    1,
  );
  const x = (i: number) =>
    series.length <= 1 ? 0 : (i / (series.length - 1)) * W;
  const y = (v: number) => BOTTOM - (v / ceiling) * (BOTTOM - TOP);
  const line = (pick: (p: (typeof series)[number]) => number) =>
    series.map((p, i) => `${x(i)},${y(pick(p))}`).join(" ");

  return (
    <>
      <div className="sw-c3-chart-frame">
        <svg
          className="sw-c3-chart-svg"
          preserveAspectRatio="none"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Cumulative consumption against commitment pace"
        >
          <line
            x1="0"
            y1={BOTTOM}
            x2={W}
            y2={BOTTOM}
            stroke="rgba(10,10,11,.10)"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1={(TOP + BOTTOM) / 2}
            x2={W}
            y2={(TOP + BOTTOM) / 2}
            stroke="rgba(10,10,11,.06)"
            strokeWidth="1"
          />
          {totals.committed > 0 ? (
            <polyline
              points={line((p) => p.committed)}
              fill="none"
              stroke="var(--sw-c3-stone)"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
          ) : null}
          <polyline
            points={line((p) => p.invoiced)}
            fill="none"
            stroke="var(--sw-c3-ink)"
            strokeWidth="2"
          />
          <polyline
            points={line((p) => p.actual)}
            fill="none"
            stroke="var(--sw-c3-green)"
            strokeWidth="2"
          />
        </svg>
      </div>
      <div className="sw-c3-chart-axis">
        {series.map((point, index) =>
          index === 0 ||
          index === series.length - 1 ||
          index === Math.floor(series.length / 2) ? (
            <span key={`${point.label}-${index}`}>{point.label}</span>
          ) : null,
        )}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Performance                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Where the consumption actually goes.
 *
 * On a contract type with no service-credit regime the useful performance
 * question is not whether the vendor delivered — it is which workloads are
 * drawing on the commitment, and whether that is the shape the commitment was
 * sized for.
 */
export function ContractConsumptionMix({
  spendMonths,
  vm,
}: {
  spendMonths: SpendRows;
  vm: SourceWorkspaceVM;
}) {
  if (spendMonths.length === 0) return null;

  const byWorkload = new Map<string, number>();
  let attributed = 0;
  for (const row of spendMonths) {
    const amount = numberFromDb(row.actual_spend) ?? 0;
    if (amount <= 0) continue;
    const key =
      row.business_unit?.trim() || row.service_id?.trim() || "Unattributed";
    byWorkload.set(key, (byWorkload.get(key) ?? 0) + amount);
    attributed += amount;
  }
  if (attributed <= 0 || byWorkload.size === 0) return null;

  const mix = [...byWorkload.entries()]
    .map(([name, value]) => ({
      name,
      value,
      share: (value / attributed) * 100,
    }))
    .sort((a, b) => b.value - a.value);

  const top = mix.slice(0, 2).reduce((sum, row) => sum + row.share, 0);
  const performanceRequired =
    vm.contractEducation?.facetRequirements.Performance?.state !== "not_required";

  return (
    <div className="sw-c3-stack">
      <section className="sw-c3-card sw-c3-perf-lede">
        <p className="sw-c3-display">
          {mix.length === 1
            ? "One workload draws the whole commitment."
            : `${Math.round(top)}% of consumption sits in ${Math.min(2, mix.length)} of ${mix.length} workloads.`}
        </p>
        <p className="sw-c3-note">
          {`Summed from ${spendMonths.length} loaded spend month${spendMonths.length === 1 ? "" : "s"}`}
          {performanceRequired
            ? ""
            : " · service credits are not a required lane for this contract type"}
        </p>
      </section>

      <section className="sw-c3-card">
        <div className="sw-c3-eyebrow">Where the consumption goes</div>
        <div className="sw-c3-mix">
          {mix.map((row) => (
            <div className="sw-c3-mix-row" key={row.name}>
              <span className="sw-c3-mix-name">{row.name}</span>
              <span className="sw-c3-bar">
                <i
                  className="sw-c3-bar-fill"
                  style={{
                    ["--sw-c3-share" as string]: `${row.share.toFixed(1)}%`,
                    ["--sw-c3-tone" as string]:
                      row.name === "Unattributed"
                        ? "var(--sw-c3-stone)"
                        : "var(--sw-c3-green)",
                  }}
                />
              </span>
              <span className="sw-c3-mix-value">
                {money(row.value)} · {Math.round(row.share)}%
              </span>
            </div>
          ))}
        </div>
        <p className="sw-c3-prose">
          Attribution is read from the workload recorded on each spend row. Rows
          with no workload recorded are shown as unattributed rather than
          distributed across the others.
        </p>
      </section>
    </div>
  );
}

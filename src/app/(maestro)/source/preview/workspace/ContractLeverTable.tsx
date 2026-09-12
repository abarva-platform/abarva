"use client";

import type { SourceWorkspaceVM } from "./buildViewModel";

/**
 * The lever table, built to the deck's treatment.
 *
 * Five columns, not eight: Lever, The ask, Why they can say yes, Candidate,
 * Owner & priority. The earlier table crammed evidence refs and value state
 * into their own columns and read as a data dump; the deck's version puts the
 * argument in three prose columns and the governance in two narrow ones.
 *
 * Two treatments carry the governance rather than a caption:
 *
 *  - A signal-stage lever is rendered on a dashed rule with its amount replaced
 *    by the reason it has none. It cannot be skim-read as a sized ask.
 *  - The footer totals only the sized levers, names the total a candidate, and
 *    says plainly that it is neither a saving nor a forecast.
 *
 * Not reproduced from the deck: the candidate *range* ($150K–$400K). The
 * opportunity model declares an `amountState` of "range" but carries a single
 * `amountUsd`, so a low and high bound do not exist to render. A point value is
 * shown and labelled "Candidate" rather than "Candidate range", so the column
 * heading does not promise a bound the data cannot supply.
 */

type Opportunity = NonNullable<
  SourceWorkspaceVM["opportunityView"]
>["opportunities"][number];

const COLUMNS = [
  "Lever",
  "The ask",
  "Why they can say yes",
  "Candidate",
  "Owner & priority",
] as const;

function isSignalStage(row: Opportunity): boolean {
  return row.stageRaw === "signal";
}

/** A lever with no traced amount states why, never a figure. */
function candidateFor(row: Opportunity): string {
  if (row.amountUsd != null) return row.amount;
  if (row.blockingGap) return `Not sized — ${lowerFirst(row.blockingGap)}`;
  return "Not sized";
}

function lowerFirst(value: string): string {
  const text = value.trim().replace(/\.$/, "");
  if (!text) return text;
  return text[0].toLowerCase() + text.slice(1);
}

export function ContractLeverTable({ vm }: { vm: SourceWorkspaceVM }) {
  const view = vm.opportunityView;
  const rows = view?.opportunities ?? [];
  if (rows.length === 0) return null;

  const sized = rows.filter((row) => row.amountUsd != null);
  const signalCount = rows.length - sized.length;

  return (
    <section className="sw-c3-card sw-c3-card-flush sw-c3-levers">
      <div className="sw-c3-lever-head">
        <span className="sw-c3-display sw-c3-display-sm">
          {rows.length} {rows.length === 1 ? "ask" : "asks"}
          {signalCount > 0
            ? `. ${sized.length} carry a traced amount.`
            : ". Every one carries a traced amount."}
        </span>
        <span className="sw-c3-note">Exports unchanged into the memo</span>
      </div>

      <div className="sw-c3-table-wrap">
        <table className="sw-c3-lever-table">
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const signal = isSignalStage(row);
              return (
                <tr
                  className={signal ? "sw-c3-lever-signal" : undefined}
                  key={row.id}
                >
                  <td className="sw-c3-lever-name">
                    {/*
                      The short label. The deck names each lever in two or three
                      words — "Add carry-forward", "Re-base support" — so the
                      column stays a column; the full label is the ask beside it.
                    */}
                    <b>{row.shortLabel || row.label}</b>
                    <span>
                      {[row.valueType, row.timingDependency]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </td>
                  <td>{row.buyerAsk ?? "Buyer ask not recorded"}</td>
                  <td>
                    {row.vendorConcession ??
                      "No vendor-side rationale recorded for this lever."}
                  </td>
                  <td
                    className={
                      signal || row.amountUsd == null
                        ? "sw-c3-lever-amount sw-c3-lever-amount-none"
                        : "sw-c3-lever-amount"
                    }
                  >
                    {candidateFor(row)}
                  </td>
                  <td className="sw-c3-lever-owner">
                    <span>{row.owner}</span>
                    <span className="sw-c3-lever-priority">
                      {signal ? (
                        <span className="sw-c3-badge">Signal</span>
                      ) : (
                        <span className="sw-c3-badge sw-c3-badge-pending">
                          {[row.priority, row.deadline !== "No deadline" ? row.deadline : null]
                            .filter(Boolean)
                            .join(" · ") || row.stage}
                        </span>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sw-c3-lever-total">
        <span className="sw-c3-lever-total-figure">
          {sized.length > 0 ? view?.potential.total ?? "Not sized" : "Not sized"}
        </span>
        <span className="sw-c3-lever-total-note">
          Total <b>candidate</b> across the {sized.length}{" "}
          {sized.length === 1 ? "sized lever" : "sized levers"}. Not a saving
          and not a forecast — {sized.length === 1 ? "a number" : "numbers"} that
          each resolve to a source row, awaiting a Finance confirmation that has
          not happened.
          {signalCount > 0
            ? ` ${signalCount} further ${signalCount === 1 ? "ask carries" : "asks carry"} no amount and ${signalCount === 1 ? "is" : "are"} not counted.`
            : ""}
        </span>
      </div>
    </section>
  );
}

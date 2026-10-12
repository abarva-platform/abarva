import type { TowerMartSourceValueRow } from "@/lib/tower/current-layer-view-model";

import styles from "../TowerCommandCenter.module.css";
import { cx } from "../primitives";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function recorded(value: string | null): string {
  return value ?? "Not recorded";
}

function SourceRow({ row }: { row: TowerMartSourceValueRow }) {
  const periods = [
    row.baselinePeriod ? `baseline ${row.baselinePeriod}` : null,
    row.observedPeriod ? `observed ${row.observedPeriod}` : null,
    row.kpiPeriodStart || row.kpiPeriodEnd
      ? `KPI window ${recorded(row.kpiPeriodStart)} to ${recorded(row.kpiPeriodEnd)}`
      : null,
  ].filter(Boolean);
  return (
    <details className={cx(styles.contractCard, styles.costStoryDetails)}>
      <summary>{row.title} · {row.observed === null ? "no observed result recorded" : "observed result recorded"}</summary>
      {row.kpiName ? <p><b>Measure:</b> {row.kpiName}</p> : null}
      <p><b>Starting point:</b> {recorded(row.baseline)} · <b>Target:</b> {recorded(row.target)} · <b>Observed:</b> {recorded(row.observed)}</p>
      {row.kpiUnit ? <p><b>Unit stated in source:</b> {row.kpiUnit}</p> : null}
      {periods.length > 0 ? <p><b>Periods stated in source:</b> {periods.join(" · ")}</p> : null}
      {row.moneyAssertions.length > 0 ? (
        <>
          <p><b>Dollar amounts stated by the sources:</b> These are separate assertions. They are not approved funding, verified savings, or a benefit Tower can report.</p>
          {row.moneyAssertions.map((item) => (
            <p key={item.sourceField}><b>{item.label}:</b> {usd.format(item.amountUsd)}</p>
          ))}
        </>
      ) : <p>No source-stated Finance amount is recorded for this row.</p>}
      {row.statusAssertions.length > 0 ? (
        <>
          <p><b>Statuses stated by the sources:</b> These labels have not been independently verified for Tower reporting.</p>
          {row.statusAssertions.map((item) => (
            <p key={item.sourceField}><b>{item.label}:</b> {item.code.replaceAll("_", " ")} <small>(source code: {item.code})</small></p>
          ))}
        </>
      ) : null}
      {row.sourceDataSource ? <p><b>Data source listed:</b> {row.sourceDataSource}</p> : null}
      {row.sourceCalculationBasis ? <p><b>Calculation described by source:</b> {row.sourceCalculationBasis}</p> : null}
      <p><b>Source files:</b> {row.sourceFiles.length ? row.sourceFiles.join(", ") : "Not recorded"} · record {row.id}</p>
    </details>
  );
}

export function SourceValueAssertionsPanel({ rows }: { rows: readonly TowerMartSourceValueRow[] }) {
  if (rows.length === 0) return null;
  const outcomeRows = rows.filter((row) => row.kind === "outcome_measure");
  const feedRows = rows.filter((row) => row.kind === "ai_feed_claim");
  return (
    <section className={styles.costStory} aria-label="Source-stated outcome and AI feed details">
      {outcomeRows.length > 0 ? (
        <details className={cx(styles.contractCard, styles.costStoryDetails)}>
          <summary>See {outcomeRows.length} source outcome {outcomeRows.length === 1 ? "measure" : "measures"}</summary>
          <p>Each row has its own starting point, target and observed result where recorded. A source-stated Finance amount or claim status does not establish an approved dollar benefit.</p>
          {outcomeRows.map((row) => <SourceRow key={row.id} row={row} />)}
        </details>
      ) : null}
      {feedRows.length > 0 ? (
        <details className={cx(styles.contractCard, styles.costStoryDetails)}>
          <summary>See {feedRows.length} AI source {feedRows.length === 1 ? "group" : "groups"}</summary>
          <p>A group can contain benefit, usage and KPI source records. Their amounts and status flags are shown by source because the feeds are not reconciled or linked to intake AI cases here. No amount below is cleared for reporting.</p>
          {feedRows.map((row) => <SourceRow key={row.id} row={row} />)}
        </details>
      ) : null}
    </section>
  );
}

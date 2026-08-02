"use client";

// Tab 2 — Value Proof.
// Transcribed from `viewFunnel()` in the design file (line ~781): the value
// waterfall with "The read" callout, beside the top-5 blockers table sorted by
// blocked dollars descending.

import { formatUsdM } from "@/lib/tower/command-center/format";
import type { TowerCommandCenterView } from "@/lib/tower/command-center/types";

import {
  ValueWaterfallChart,
  buildWaterfallRows,
} from "../charts/ValueWaterfallChart";
import { Card, Pips, Unknown, ViewHead, cx } from "../primitives";
import styles from "../TowerCommandCenter.module.css";

export function ValueProofView({
  view,
  onOpenProgram,
}: {
  view: TowerCommandCenterView;
  onOpenProgram: (id: string) => void;
}) {
  const s = view.summary;
  const allValueUnknown =
    s.valueClaimCount > 0 &&
    s.knownValueClaimCount === 0 &&
    s.unknownValueClaimCount > 0;
  const rows = buildWaterfallRows(s);
  const noUsage = rows[1]?.usd ?? 0;
  const noFinance = rows[3]?.usd ?? 0;
  // Finance-validated can exceed usage-supported — a real governed state, not a
  // bug. Named in the read rather than smoothed over. See derive.ts.
  const financeAheadOfUsage = s.financeValidatedUsd > s.usageSupportedUsd;

  const blockers = [...view.programs]
    .filter((p) => p.blockedUsd > 0)
    .sort((a, b) => b.blockedUsd - a.blockedUsd)
    .slice(0, 5);

  return (
    <div className={styles.view}>
      <ViewHead
        title="Where the value disappears"
        sub="Promised → usage-supported → finance-validated → claimable"
        hint="Click a program for its proof chain & usage evidence"
      />

      <div
        className={styles.ccLower}
        style={{ gridTemplateColumns: "1.12fr 1fr" }}
      >
        <Card
          eyebrow="Value waterfall"
          right="FY26 · $M"
          headId="tcc-waterfall"
          bodyStyle={{ display: "flex", flexDirection: "column" }}
        >
          <div
            className={styles.chartwrap}
            aria-describedby="tcc-waterfall-alt"
          >
            {allValueUnknown ? (
              <div className={styles.emptyPanel}>
                <h2>
                  <Unknown label="Financial value unknown" />
                </h2>
                <p>
                  {s.unknownValueClaimCount} governed claims are loaded, but
                  none carries a governed dollar amount. Tower is withholding
                  the waterfall rather than rendering unknown value as $0.
                </p>
              </div>
            ) : (
              <ValueWaterfallChart summary={s} />
            )}
          </div>
          <p id="tcc-waterfall-alt" className={styles.srOnly}>
            {allValueUnknown
              ? `${s.unknownValueClaimCount} claims have unknown financial value.`
              : `${rows
                  .map(
                    (r) =>
                      `${r.name.replace("|", " ")}: ${formatUsdM(r.usd)}`,
                  )
                  .join(". ")}.`}
          </p>

          {/* "The read" — the mart's own executive summary, prefixed with the
              two leak figures. Claude writes none of this and no figure in it
              is computed here beyond the subtractions the waterfall shows. */}
          <div className={cx(styles.ins, styles.red)} style={{ marginTop: 10 }}>
            <div className={styles.ik}>The read</div>
            <p className={styles.itext}>
              <b>
                {allValueUnknown
                  ? `${s.unknownValueClaimCount} claims have unknown financial value; no executive value total is claimable from this dataset.`
                  : `${formatUsdM(noUsage)} never becomes usage-supported${
                      noFinance > 0
                        ? `; a further ${formatUsdM(noFinance)} has usage but no Finance sign-off.`
                        : "."
                    }`}
              </b>{" "}
              {financeAheadOfUsage ? (
                <>
                  Finance has validated {formatUsdM(s.financeValidatedUsd)} that
                  the usage evidence does not support — validation is running
                  ahead of measured adoption, not behind it.{" "}
                </>
              ) : null}
              {s.executiveSummary}
            </p>
          </div>
        </Card>

        <Card
          title="Top 5 blockers by dollar impact"
          headId="tcc-blockers"
          bodyClassName={styles.scroll}
          bodyStyle={{ paddingTop: 8 }}
        >
          {blockers.length === 0 ? (
            <p className={styles.lhSub}>
              No program currently carries blocked value.
            </p>
          ) : (
            <table className={styles.tbl}>
              <thead>
                <tr>
                  <th scope="col">Program</th>
                  <th scope="col" className={styles.num}>
                    Promised
                  </th>
                  <th scope="col">Missing evidence · proof</th>
                  <th scope="col" className={styles.num}>
                    Blocked
                  </th>
                </tr>
              </thead>
              <tbody>
                {blockers.map((p) => (
                  <tr
                    key={p.id}
                    className={styles.click}
                    onClick={() => onOpenProgram(p.id)}
                  >
                    <td>
                      <button
                        type="button"
                        className={styles.rowOpen}
                        aria-label={`Open ${p.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenProgram(p.id);
                        }}
                      >
                        <span className={styles.pname}>{p.name}</span>
                      </button>
                      <div className={styles.psub}>
                        {p.ownerRole ?? "No owner recorded"}
                      </div>
                    </td>
                    <td className={styles.num}>
                      <div className={styles.bignum}>
                        {formatUsdM(p.promisedUsd)}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 5,
                        }}
                      >
                        <span style={{ fontSize: 12 }}>
                          {p.blocker ??
                            "No decision rationale recorded in the mart."}
                        </span>
                        <Pips level={p.proofLevel} />
                      </div>
                    </td>
                    <td className={styles.num}>
                      <div className={cx(styles.bignum, styles.nRed)}>
                        {formatUsdM(p.blockedUsd)}
                      </div>
                      <div className={styles.subnum}>at risk</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

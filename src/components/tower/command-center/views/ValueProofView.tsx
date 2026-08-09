"use client";

// Tab 2 — Value Proof.
// Transcribed from `viewFunnel()` in the design file (line ~781): the value
// waterfall with "The read" callout, beside the top-5 blockers table sorted by
// blocked dollars descending.

import { formatCount, formatUsdM } from "@/lib/tower/command-center/format";
import type { TowerCommandCenterView } from "@/lib/tower/command-center/types";

import {
  ValueWaterfallChart,
  buildWaterfallRows,
} from "../charts/ValueWaterfallChart";
import { Card, Dot, Pips, ViewHead, cx } from "../primitives";
import styles from "../TowerCommandCenter.module.css";

function EvidenceGapLedger({ view }: { view: TowerCommandCenterView }) {
  return (
    <table className={styles.tbl}>
      <thead>
        <tr>
          <th scope="col">Evidence gap</th>
          <th scope="col" className={styles.num}>
            Claims
          </th>
          <th scope="col">Owner</th>
          <th scope="col">Next action</th>
        </tr>
      </thead>
      <tbody>
        {view.evidenceMaturity.gapLedger.map((gap) => (
          <tr key={gap.key}>
            <td>
              <span className={styles.pname} style={{ fontSize: 14 }}>
                {gap.label}
              </span>
              <div className={styles.psub}>{gap.evidenceBasis}</div>
            </td>
            <td className={styles.num}>
              <span className={cx(styles.bignum, gap.count > 0 && styles.nRed)}>
                {formatCount(gap.count)}
              </span>
            </td>
            <td>{gap.ownerRole}</td>
            <td className={styles.gateCell}>{gap.nextAction}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ValueProofView({
  view,
  onOpenProgram,
}: {
  view: TowerCommandCenterView;
  onOpenProgram: (id: string) => void;
}) {
  const s = view.summary;
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
        title={
          s.promisedBenefitLoaded
            ? "Claim-gated explicit benefit"
            : "Benefit proof coverage"
        }
        sub="Investment is separate from promised benefit, usage, outcome, Finance, and claimable value"
        hint="Click a program for its proof chain & usage evidence"
      />

      <div className={styles.zipContractNote}>
        <Dot tone="red" />
        <span>
          CFO read: the waterfall shows only explicit source-backed benefit.
          Finance-calculated value awaiting proof completion is held separately.
        </span>
      </div>

      <div
        className={styles.ccLower}
        style={{ gridTemplateColumns: "1.12fr 1fr" }}
      >
        <Card
          eyebrow={
            s.promisedBenefitLoaded
              ? "Explicit benefit claim chain"
              : "Benefit not loaded"
          }
          right="waterfall excludes Finance-blocked population"
          headId="tcc-waterfall"
          bodyStyle={{ display: "flex", flexDirection: "column" }}
        >
          {s.promisedBenefitLoaded ? (
            <div
              className={styles.chartwrap}
              aria-describedby="tcc-waterfall-alt"
            >
              <ValueWaterfallChart summary={s} />
            </div>
          ) : (
            <div
              className={styles.emptyPanel}
              aria-describedby="tcc-waterfall-alt"
            >
              <h2>No explicit benefit assertion</h2>
              <p>
                Approved investment is visible, but Tower will not create a
                benefit waterfall until a governed value case carries a
                source-backed benefit assertion, economic classification, and
                proof horizon.
              </p>
            </div>
          )}
          <p id="tcc-waterfall-alt" className={styles.srOnly}>
            {s.promisedBenefitLoaded
              ? `${rows
                  .map(
                    (r) => `${r.name.replace("|", " ")}: ${formatUsdM(r.usd)}`,
                  )
                  .join(". ")}.`
              : `Explicit promised benefit is absent. Approved investment is ${formatUsdM(s.approvedInvestmentUsd)}.`}
          </p>

          <div
            className={styles.valueProofRails}
            aria-label="Value proof amount definitions"
          >
            <div className={styles.valueProofRail}>
              <span>Source-backed benefit chain</span>
              <b>
                {s.promisedBenefitUsd === null
                  ? "Not loaded"
                  : formatUsdM(s.promisedBenefitUsd)}
              </b>
              <small>
                Drives the waterfall only when a governed value-case benefit
                assertion exists.
              </small>
            </div>
            <div className={styles.valueProofRail}>
              <span>Finance-calculated value awaiting proof completion</span>
              <b>{formatUsdM(s.financeValidatedBlockedUsd)}</b>
              <small>
                Kept separate until usage, outcome, attribution, and attestation
                prove the claim path.
              </small>
            </div>
          </div>

          {/* "The read" — the mart's own executive summary, prefixed with the
              two leak figures. Claude writes none of this and no figure in it
              is computed here beyond the subtractions the waterfall shows. */}
          <div className={cx(styles.ins, styles.red)} style={{ marginTop: 10 }}>
            <div className={styles.ik}>The read</div>
            <p className={styles.itext}>
              <b>
                {s.promisedBenefitLoaded
                  ? `${formatUsdM(noUsage)} never becomes usage-supported${
                      noFinance > 0
                        ? `; a further ${formatUsdM(noFinance)} has usage but no Finance sign-off.`
                        : "."
                    }`
                  : `${formatUsdM(s.approvedInvestmentUsd)} is approved investment, not promised benefit.`}
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
          title="Top evidence blockers"
          headId="tcc-blockers"
          bodyClassName={styles.scroll}
          bodyStyle={{ paddingTop: 8 }}
        >
          {view.evidenceMaturity.gapLedger.some((gap) => gap.count > 0) ? (
            <EvidenceGapLedger view={view} />
          ) : blockers.length === 0 ? (
            <p className={styles.lhSub}>
              No program currently carries blocked value.
            </p>
          ) : (
            <table className={styles.tbl}>
              <thead>
                <tr>
                  <th scope="col">Program</th>
                  <th scope="col" className={styles.num}>
                    Benefit
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
                        {p.promisedBenefitLoaded
                          ? formatUsdM(p.promisedUsd)
                          : "Not loaded"}
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
                            "No decision rationale recorded in the value model."}
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

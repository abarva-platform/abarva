"use client";

// Tab 1 — Command Center.
// Transcribed from `viewCommand()` in the design file (line ~730):
// four posture tiles, "this week's read" with the week bar chart and a CTA into
// Value Proof, and the "decisions waiting on you" queue.

import type { ReactNode } from "react";

import {
  formatCount,
  formatPct,
  formatRatioPct,
  formatUsdM,
} from "@/lib/tower/command-center/format";
import type {
  TowerCommandCenterView,
  TowerProgramView,
} from "@/lib/tower/command-center/types";

import { WeekReadChart } from "../charts/WeekReadChart";
import { Card, Dot, Unknown, cx, laneClass, LANE_WORD } from "../primitives";
import styles from "../TowerCommandCenter.module.css";

type Tone = "" | "toneTeal" | "toneAmber" | "toneRed" | "toneBlue";
type RowTone = "" | "vTeal" | "vAmber" | "vRed";

interface TileRow {
  label: string;
  value: React.ReactNode;
  tone: RowTone;
}

interface Tile {
  tone: Tone;
  key: string;
  status: { cls: "steal" | "samber" | "sred" | "sgray"; text: string };
  hero: ReactNode;
  heroNote: string;
  rows: TileRow[];
}

/**
 * The four posture tiles. Every figure is a governed total or a derived one
 * from `derive.ts` — no tile computes anything locally, and a tile with no
 * governed value renders `Unknown` rather than a zero.
 */
function buildTiles(view: TowerCommandCenterView): Tile[] {
  const s = view.summary;
  const allValueUnknown =
    s.valueClaimCount > 0 &&
    s.knownValueClaimCount === 0 &&
    s.unknownValueClaimCount > 0;
  const valueOrUnknown = (value: number, label = "Unknown") =>
    allValueUnknown ? <Unknown label={label} /> : formatUsdM(value);
  const openGaps = view.gaps.length;
  // Program-derived risk signals — see the Risk posture tile below for why
  // these do not come from `mart_required_field_gaps`.
  const ownerGaps =
    view.programs.filter((p) => !p.ownerRole).length +
    view.gaps.filter((g) => !g.owner).length;
  const usageGaps = view.programs.filter(
    (p) => p.usageStatus === "none",
  ).length;
  const claimBlockers = view.programs.filter((p) => p.blockedUsd > 0).length;
  const watchItems =
    view.programs.filter((p) => p.lane === "watch").length + claimBlockers;

  const laneCount = (lane: TowerProgramView["lane"]) =>
    view.programs.filter((p) => p.lane === lane).length;

  return [
    {
      tone: "",
      key: "Spend posture",
      status: { cls: "sgray", text: "In view" },
      hero: formatUsdM(s.budgetUsd),
      heroNote: `FY26 IT budget across ${formatCount(s.programCount)} programs`,
      rows: [
        {
          label: "Run / keep-lights",
          value: formatUsdM(s.runUsd),
          tone: "vAmber",
        },
        {
          label: "Change / transform",
          value: formatUsdM(s.changeUsd),
          tone: "",
        },
        { label: "AI-tagged", value: formatUsdM(s.aiTaggedUsd), tone: "vTeal" },
        {
          label: "Top-3 vendor concentration",
          value:
            s.vendorConcentrationPct === null ? (
              <Unknown label="No vendor data" />
            ) : (
              formatPct(s.vendorConcentrationPct)
            ),
          tone: "vAmber",
        },
      ],
    },
    {
      tone: "toneRed",
      key: "Value posture",
      status: {
        cls: s.claimableUsd > 0 ? "steal" : "sred",
        text: allValueUnknown
          ? "Value unknown"
          : s.claimableUsd > 0
            ? "Partially proven"
            : "Unproven",
      },
      hero: valueOrUnknown(s.claimableUsd),
      heroNote: allValueUnknown
        ? `${formatCount(s.unknownValueClaimCount)} claims need value evidence`
        : "is claimable today",
      rows: [
        { label: "Promised", value: valueOrUnknown(s.promisedUsd), tone: "" },
        {
          label: "Usage-supported",
          value: valueOrUnknown(s.usageSupportedUsd),
          tone: "vAmber",
        },
        {
          label: "Finance-validated",
          value: valueOrUnknown(s.financeValidatedUsd),
          tone: "vAmber",
        },
        { label: "Blocked", value: valueOrUnknown(s.blockedUsd), tone: "vRed" },
      ],
    },
    {
      // Risk posture reads the PROGRAMS, not just `mart_required_field_gaps`.
      //
      // Verified live on 2026-07-23: the Healthcare Composite Demo tenant has
      // ZERO required-field-gap rows, yet 12 programs that cannot claim value.
      // A tile sourced only from the gap table would have read "0 / 0 / 0" for
      // the launch tenant and implied a clean risk posture that is not real.
      // The shipped Tower derives owner / usage / claim gaps from the program
      // lanes for exactly this reason; this matches it.
      tone: "toneAmber",
      key: "Risk posture",
      status: {
        cls: claimBlockers > 0 ? "samber" : "steal",
        text: `${formatCount(watchItems)} watch item${watchItems === 1 ? "" : "s"}`,
      },
      hero: formatCount(claimBlockers),
      heroNote: "programs cannot claim value today",
      rows: [
        {
          label: "Evidence gaps",
          value: formatCount(openGaps),
          tone: "vAmber",
        },
        { label: "Owner gaps", value: formatCount(ownerGaps), tone: "vRed" },
        { label: "Usage gaps", value: formatCount(usageGaps), tone: "vAmber" },
        {
          label: "Claim blockers",
          value: formatCount(claimBlockers),
          tone: "vRed",
        },
      ],
    },
    {
      tone: "",
      key: "Decision posture",
      status: { cls: "sgray", text: "This week" },
      hero: formatCount(view.actions.length),
      heroNote: "decisions waiting on a named owner",
      rows: [
        { label: "Fund", value: formatCount(laneCount("fund")), tone: "vTeal" },
        { label: "Fix", value: formatCount(laneCount("fix")), tone: "vAmber" },
        {
          label: "Freeze",
          value: formatCount(laneCount("freeze")),
          tone: "vRed",
        },
        { label: "Stop", value: formatCount(laneCount("stop")), tone: "vRed" },
      ],
    },
  ];
}

/**
 * The decision queue: programs with blocked value, worst first. The design
 * hand-wrote four rows; here they are the top four blocked programs, so the
 * queue always reflects the tenant's actual worst-blocked value.
 */
function decisionQueue(view: TowerCommandCenterView): TowerProgramView[] {
  return [...view.programs]
    .filter((p) => p.blockedUsd > 0)
    .sort((a, b) => b.blockedUsd - a.blockedUsd)
    .slice(0, 6);
}

export function CommandCenterView({
  view,
  onOpenProgram,
  onGoToFunnel,
}: {
  view: TowerCommandCenterView;
  onOpenProgram: (id: string) => void;
  onGoToFunnel: () => void;
}) {
  const s = view.summary;
  const allValueUnknown =
    s.valueClaimCount > 0 &&
    s.knownValueClaimCount === 0 &&
    s.unknownValueClaimCount > 0;
  const tiles = buildTiles(view);
  const queue = decisionQueue(view);

  return (
    <div className={styles.view}>
      <div className={styles.ptiles}>
        {tiles.map((tile) => (
          <div
            key={tile.key}
            className={cx(styles.ptile, tile.tone && styles[tile.tone])}
          >
            <div className={styles.ptK}>
              <span className={styles.lab}>{tile.key}</span>
              <span className={cx(styles.st, styles[tile.status.cls])}>
                {tile.status.text}
              </span>
            </div>
            <div className={styles.ptHero}>{tile.hero}</div>
            <div className={styles.ptHeron}>{tile.heroNote}</div>
            <div className={styles.ptRows}>
              {tile.rows.map((row) => (
                <div key={row.label} className={styles.ptRow}>
                  <span className={styles.rl}>{row.label}</span>
                  <span className={cx(styles.rv, row.tone && styles[row.tone])}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.ccLower}>
        <section className={styles.weekread} aria-labelledby="tcc-week-read">
          <div className={styles.wkK} id="tcc-week-read">
            This week&rsquo;s read
          </div>
          {/* The run-on sentence is assembled from governed totals only. The
              turn ("the issue is X") is the mart's own decision question — we
              do not write a new one. */}
          <p className={styles.wkLine}>
            <span className={styles.n}>{formatUsdM(s.budgetUsd)}</span> is in
            view. <span className={styles.n}>{formatUsdM(s.aiTaggedUsd)}</span>{" "}
            is AI-tagged.{" "}
            {allValueUnknown ? (
              <>
                <span className={styles.n}>
                  {formatCount(s.unknownValueClaimCount)}
                </span>{" "}
                value claims have unknown financial amount. Claimable value is{" "}
                <Unknown label="not evidenced" />.{" "}
              </>
            ) : (
              <>
                <span className={styles.n}>{formatUsdM(s.promisedUsd)}</span>{" "}
                is promised value.{" "}
                <span className={s.claimableUsd > 0 ? styles.n : styles.z}>
                  {formatUsdM(s.claimableUsd)}
                </span>{" "}
                is claimable.{" "}
              </>
            )}
            {s.decisionQuestion ? (
              <span className={styles.turn}>{s.decisionQuestion}</span>
            ) : null}
          </p>

          <div className={styles.wkViz}>
            {allValueUnknown ? (
              <div className={styles.emptyPanel}>
                <h2>Value proof is not quantified yet</h2>
                <p>
                  Tower has usage and claim-state evidence, but no governed
                  dollar amount for the value claims. The proof chart stays
                  withheld until value evidence exists.
                </p>
              </div>
            ) : (
              <WeekReadChart summary={s} />
            )}
            <span className={styles.srOnly}>
              {allValueUnknown
                ? `${s.unknownValueClaimCount} claims have unknown financial value; no claimable amount is evidenced.`
                : `Promised ${formatUsdM(s.promisedUsd)}; usage-supported ${formatUsdM(s.usageSupportedUsd)}; finance-validated ${formatUsdM(s.financeValidatedUsd)}; claimable ${formatUsdM(s.claimableUsd)}.`}
            </span>
          </div>

          <div className={styles.wkFoot}>
            <span>
              <Dot tone="teal" /> Finance validation rate:{" "}
              <b>{formatRatioPct(s.financeValidationRatio)}</b>
            </span>
            <button
              type="button"
              className={styles.wkCta}
              onClick={onGoToFunnel}
            >
              See the value funnel
            </button>
          </div>
        </section>

        <Card
          title="Decisions waiting on you"
          right="aVa proposes · you approve · nothing acts on its own"
          headId="tcc-decision-queue"
          bodyClassName={styles.scroll}
        >
          {queue.length === 0 ? (
            <p className={styles.lhSub}>
              No program currently carries blocked value for this tenant.
            </p>
          ) : (
            <div className={styles.dq}>
              {queue.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={cx(styles.dqi, laneClass(p.lane))}
                  onClick={() => onOpenProgram(p.id)}
                >
                  <span className={cx(styles.laneTag, laneClass(p.lane))}>
                    {LANE_WORD[p.lane]}
                  </span>
                  <span className={styles.dqMain}>
                    <span className={styles.dqTitle}>
                      {p.blocker ??
                        `${p.name} — no decision rationale recorded.`}
                    </span>
                    <span className={styles.dqMeta}>
                      <span>
                        <b>{formatUsdM(p.promisedUsd)}</b> promised
                      </span>
                      <span>
                        <b>{formatUsdM(p.blockedUsd)}</b> blocked
                      </span>
                      <span>{p.ownerRole ?? "No owner recorded"}</span>
                    </span>
                  </span>
                  <span className={styles.dqGo}>Review</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/** Re-exported so the tab bar can badge the same count the tile shows. */
export function commandCenterAttention(view: TowerCommandCenterView): boolean {
  return view.summary.claimableUsd <= 0 && view.summary.promisedUsd > 0;
}

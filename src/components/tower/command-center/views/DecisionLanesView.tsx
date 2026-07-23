"use client";

// Tab 3 — Decision Lanes. Three sub-views: Program table (default), Kanban
// lanes, Portfolio heatmap. Transcribed from `viewLanes()` (design line ~815).

import { formatUsdM } from "@/lib/tower/command-center/format";
import type {
  TowerCommandCenterView,
  TowerLaneKey,
  TowerProgramView,
} from "@/lib/tower/command-center/types";
import { TOWER_LANE_META } from "@/lib/tower/command-center/view-model";

import {
  PortfolioHeatmapChart,
  heatmapTextAlternative,
} from "../charts/PortfolioHeatmapChart";
import {
  Card,
  Chip,
  LANE_HEX,
  LANE_TONE,
  LANE_WORD,
  Pips,
  SubNav,
  USAGE_TONE,
  ViewHead,
  cx,
  laneClass,
} from "../primitives";
import styles from "../TowerCommandCenter.module.css";

export type LanesSubView = "table" | "overview" | "heatmap";

export const LANES_SUB_VIEWS: ReadonlyArray<readonly [LanesSubView, string]> = [
  ["table", "Program table"],
  ["overview", "Kanban lanes"],
  ["heatmap", "Portfolio heatmap"],
];

const LANE_ORDER: Record<TowerLaneKey, number> = {
  fund: 0,
  fix: 1,
  freeze: 2,
  stop: 3,
  watch: 4,
};

// ── the decision table ─────────────────────────────────────────────────────

function LaneTable({
  programs,
  onOpenProgram,
}: {
  programs: readonly TowerProgramView[];
  onOpenProgram: (id: string) => void;
}) {
  const rows = [...programs].sort(
    (a, b) =>
      LANE_ORDER[a.lane] - LANE_ORDER[b.lane] || b.promisedUsd - a.promisedUsd,
  );

  return (
    <table className={styles.tbl}>
      <thead>
        <tr>
          <th scope="col">Program</th>
          <th scope="col">Lane</th>
          <th scope="col" className={styles.num}>
            Funded
          </th>
          <th scope="col" className={styles.num}>
            Promised
          </th>
          <th scope="col" className={styles.num}>
            Proof
          </th>
          <th scope="col" className={styles.num}>
            Usage
          </th>
          <th scope="col" className={styles.num}>
            Blocked
          </th>
          <th scope="col">Next gate</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
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
                <span className={styles.pname} style={{ fontSize: 14 }}>
                  {p.name}
                </span>
              </button>
              <div className={styles.psub}>
                {p.ownerRole ?? "No owner recorded"}
              </div>
            </td>
            <td>
              <Chip tone={LANE_TONE[p.lane]} mono>
                {LANE_WORD[p.lane]}
              </Chip>
            </td>
            <td className={styles.num}>
              <span className={cx(styles.bignum, styles.bignumSm)}>
                {formatUsdM(p.fundedUsd)}
              </span>
            </td>
            <td className={styles.num}>
              <span className={cx(styles.bignum, styles.bignumSm)}>
                {formatUsdM(p.promisedUsd)}
              </span>
            </td>
            <td className={styles.num}>
              <Pips level={p.proofLevel} />
            </td>
            <td className={styles.num}>
              <Chip tone={USAGE_TONE[p.usageStatus]} mono>
                {p.usageStatus}
              </Chip>
            </td>
            <td className={styles.num}>
              <span className={cx(styles.bignum, styles.bignumSm, styles.nRed)}>
                {formatUsdM(p.blockedUsd)}
              </span>
            </td>
            <td className={styles.gateCell}>
              {p.nextGate ?? "No gate recorded"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── the Kanban lanes ───────────────────────────────────────────────────────

function LaneColumns({
  programs,
  onOpenProgram,
}: {
  programs: readonly TowerProgramView[];
  onOpenProgram: (id: string) => void;
}) {
  return (
    <div className={styles.lanes}>
      {TOWER_LANE_META.map((lane) => {
        const items = programs.filter((p) => p.lane === lane.id);
        const total = items.reduce((sum, p) => sum + p.promisedUsd, 0);
        const valueTone =
          lane.id === "fund"
            ? "vFund"
            : lane.id === "fix"
              ? "vFix"
              : lane.id === "stop"
                ? "vStop"
                : "vFreeze";
        return (
          <section
            key={lane.id}
            className={cx(styles.lane, laneClass(lane.id))}
            aria-label={`${lane.name} lane`}
          >
            <header className={styles.laneHead}>
              <div className={styles.lhT}>
                <span className={styles.lhName}>{lane.name}</span>
                <span className={styles.lhCnt}>{items.length}</span>
              </div>
              <div className={styles.lhSub}>{lane.sub}</div>
              <div className={cx(styles.lhVal, styles[valueTone])}>
                {formatUsdM(total)} promised
              </div>
            </header>
            <div className={styles.laneBody}>
              {items.length === 0 ? (
                <p className={styles.laneEmpty}>No programs in this lane.</p>
              ) : (
                items.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={styles.pcard}
                    onClick={() => onOpenProgram(p.id)}
                  >
                    <span className={styles.pcName}>{p.name}</span>
                    <span className={styles.pcOwner}>
                      {p.ownerRole ?? "No owner recorded"}
                    </span>
                    <span className={styles.pcNums}>
                      <span className={styles.f}>
                        {formatUsdM(p.fundedUsd)}
                      </span>
                      <span className={styles.p}>
                        funded · {formatUsdM(p.promisedUsd)} promised
                      </span>
                    </span>
                    <span className={styles.pcProof}>
                      <span className={styles.pcP}>
                        <span className={styles.pk}>Proof</span>
                        <Pips level={p.proofLevel} />
                      </span>
                      <span className={styles.pcP}>
                        <span className={styles.pk}>Usage</span>
                        <Chip tone={USAGE_TONE[p.usageStatus]} mono>
                          {p.usageStatus}
                        </Chip>
                      </span>
                    </span>
                    <span className={styles.pcGate}>
                      <span className={styles.gk}>Next gate</span>
                      <span>
                        <b>{p.nextGate ?? "No gate recorded"}</b>
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── the heatmap legend list ────────────────────────────────────────────────

function LaneLegendList({
  programs,
  onOpenProgram,
}: {
  programs: readonly TowerProgramView[];
  onOpenProgram: (id: string) => void;
}) {
  const ordered = [...programs].sort(
    (a, b) => LANE_ORDER[a.lane] - LANE_ORDER[b.lane],
  );
  return (
    <>
      {ordered.map((p) => (
        <button
          key={p.id}
          type="button"
          className={cx(styles.poolrow, styles.solid)}
          onClick={() => onOpenProgram(p.id)}
        >
          <span
            className={styles.dot}
            style={{ background: LANE_HEX[p.lane], marginTop: 2 }}
            aria-hidden
          />
          <span className={styles.prNm}>
            {p.name}
            <small>
              {p.ownerRole ?? "No owner recorded"} · {formatUsdM(p.promisedUsd)}{" "}
              promised
            </small>
          </span>
          <span
            className={cx(styles.chip, styles.cMono)}
            style={{
              color: LANE_HEX[p.lane],
              background: "transparent",
              border: "1px solid var(--canon-border)",
            }}
          >
            {LANE_WORD[p.lane]}
          </span>
        </button>
      ))}
    </>
  );
}

function HeatmapPanel({
  programs,
  onOpenProgram,
}: {
  programs: readonly TowerProgramView[];
  onOpenProgram: (id: string) => void;
}) {
  return (
    <>
      <div className={styles.chartwrap} aria-describedby="tcc-heatmap-alt">
        <PortfolioHeatmapChart programs={programs} onSelect={onOpenProgram} />
      </div>
      <p id="tcc-heatmap-alt" className={styles.srOnly}>
        {heatmapTextAlternative(programs)}
      </p>
      <div className={styles.legend}>
        <span>
          <i className={styles.rd} style={{ background: LANE_HEX.fund }} />
          Fund
        </span>
        <span>
          <i className={styles.rd} style={{ background: LANE_HEX.fix }} />
          Fix
        </span>
        <span>
          <i className={styles.rd} style={{ background: LANE_HEX.freeze }} />
          Freeze / Stop
        </span>
      </div>
    </>
  );
}

// ── the view ───────────────────────────────────────────────────────────────

export function DecisionLanesView({
  view,
  subView,
  onSubView,
  onOpenProgram,
}: {
  view: TowerCommandCenterView;
  subView: LanesSubView;
  onSubView: (next: LanesSubView) => void;
  onOpenProgram: (id: string) => void;
}) {
  const programs = view.programs;

  let body: React.ReactNode;
  if (subView === "overview") {
    body = (
      <div
        className={styles.ccLower}
        style={{ gridTemplateColumns: "340px 1fr", flex: 1 }}
      >
        <Card
          eyebrow="Portfolio heatmap"
          headId="tcc-lanes-heat"
          bodyStyle={{ display: "flex", flexDirection: "column" }}
        >
          <HeatmapPanel programs={programs} onOpenProgram={onOpenProgram} />
        </Card>
        <LaneColumns programs={programs} onOpenProgram={onOpenProgram} />
      </div>
    );
  } else if (subView === "heatmap") {
    body = (
      <div
        className={styles.ccLower}
        style={{ gridTemplateColumns: "1fr 320px", flex: 1 }}
      >
        <Card
          eyebrow="Portfolio heatmap"
          right="value at stake × evidence maturity · coloured by decision lane"
          headId="tcc-lanes-heat-full"
          bodyStyle={{ display: "flex", flexDirection: "column" }}
        >
          <HeatmapPanel programs={programs} onOpenProgram={onOpenProgram} />
        </Card>
        <Card
          title="Programs"
          right="by lane"
          headId="tcc-lanes-legend"
          bodyClassName={styles.scroll}
          bodyStyle={{ padding: "10px 12px" }}
        >
          <div className={styles.pool}>
            <LaneLegendList programs={programs} onOpenProgram={onOpenProgram} />
          </div>
        </Card>
      </div>
    );
  } else {
    body = (
      <Card
        title="All programs — the decision table"
        right="funding vs. proof · click a row for the value chain"
        headId="tcc-lanes-table"
        style={{ flex: 1 }}
        bodyClassName={styles.scroll}
        bodyStyle={{ paddingTop: 8 }}
      >
        {programs.length === 0 ? (
          <p className={styles.lhSub}>No programs recorded for this tenant.</p>
        ) : (
          <LaneTable programs={programs} onOpenProgram={onOpenProgram} />
        )}
      </Card>
    );
  }

  return (
    <div className={styles.view}>
      <ViewHead
        title="The operating room"
        hint="Click any program for its proof chain"
      >
        <SubNav
          label="Decision Lanes view"
          value={subView}
          options={LANES_SUB_VIEWS}
          onChange={onSubView}
        />
      </ViewHead>
      {body}
    </div>
  );
}

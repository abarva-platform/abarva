"use client";

// Tab 3 — Decision Lanes. Three sub-views: Program table (default), Kanban
// lanes, Portfolio heatmap. Transcribed from `viewLanes()` (design line ~815).

import { formatCount, formatUsdM } from "@/lib/tower/command-center/format";
import type {
  TowerCommandCenterView,
  TowerInterventionLane,
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
  Unknown,
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

const INTERVENTION_TONE_CLASS: Record<TowerInterventionLane["tone"], string> = {
  teal: "toneTeal",
  amber: "toneAmber",
  red: "toneRed",
  gray: "",
};

const MATERIAL_PROGRAM_LIMIT = 20;
const MATURITY_LOW_VARIANCE_RANGE = 10;

function materialPrograms(
  programs: readonly TowerProgramView[],
): TowerProgramView[] {
  return [...programs]
    .sort(
      (a, b) =>
        b.valueAtStakeUsd - a.valueAtStakeUsd ||
        b.blockedUsd - a.blockedUsd ||
        LANE_ORDER[a.lane] - LANE_ORDER[b.lane] ||
        a.name.localeCompare(b.name),
    )
    .slice(0, MATERIAL_PROGRAM_LIMIT);
}

function proofMaturityRange(programs: readonly TowerProgramView[]): number {
  if (programs.length === 0) return 0;
  const scores = programs.map((p) => p.evidenceMaturity);
  return Math.max(...scores) - Math.min(...scores);
}

function proofMaturityIsCompressed(
  programs: readonly TowerProgramView[],
): boolean {
  return (
    programs.length > 3 &&
    proofMaturityRange(programs) <= MATURITY_LOW_VARIANCE_RANGE
  );
}

function ProofStageDistribution({
  programs,
}: {
  programs: readonly TowerProgramView[];
}) {
  const stages = [
    {
      label: "No usable proof",
      items: programs.filter((p) => p.proofLevel <= 0),
    },
    {
      label: "Usage only",
      items: programs.filter(
        (p) =>
          p.proofLevel === 1 ||
          (p.usageStatus !== "none" &&
            p.financeValidatedUsd <= 0 &&
            p.claimableUsd <= 0),
      ),
    },
    {
      label: "Outcome measured",
      items: programs.filter(
        (p) =>
          p.proofLevel === 2 &&
          p.financeValidatedUsd <= 0 &&
          p.claimableUsd <= 0,
      ),
    },
    {
      label: "Finance validated",
      items: programs.filter(
        (p) => p.financeValidatedUsd > 0 && p.claimableUsd <= 0,
      ),
    },
    {
      label: "Claimable",
      items: programs.filter((p) => p.claimableUsd > 0),
    },
  ];
  const maxCount = Math.max(1, ...stages.map((stage) => stage.items.length));

  return (
    <div className={styles.proofStages}>
      {stages.map((stage) => {
        const valueAtStake = stage.items.reduce(
          (sum, item) => sum + item.valueAtStakeUsd,
          0,
        );
        return (
          <div key={stage.label} className={styles.proofStage}>
            <div className={styles.proofStageTop}>
              <span>{stage.label}</span>
              <b>{formatCount(stage.items.length)}</b>
            </div>
            <div
              className={styles.proofStageBar}
              aria-hidden
              style={{
                ["--stage-width" as string]: `${Math.max(
                  4,
                  (stage.items.length / maxCount) * 100,
                )}%`,
              }}
            />
            <small>{formatUsdM(valueAtStake)} exposure</small>
          </div>
        );
      })}
    </div>
  );
}

function EvidenceLaneBoard({ view }: { view: TowerCommandCenterView }) {
  return (
    <div className={styles.interventionLanes}>
      {view.evidenceMaturity.interventionLanes.map((lane) => (
        <section
          key={lane.key}
          className={cx(
            styles.interventionLane,
            INTERVENTION_TONE_CLASS[lane.tone] &&
              styles[INTERVENTION_TONE_CLASS[lane.tone]],
          )}
          aria-label={`${lane.label} lane`}
        >
          <header>
            <span className={styles.lhName}>{lane.label}</span>
            <span className={styles.lhCnt}>{formatCount(lane.count)}</span>
          </header>
          <p>{lane.description}</p>
          <b>{lane.nextAction}</b>
        </section>
      ))}
    </div>
  );
}

// ── the decision table ─────────────────────────────────────────────────────

function LaneTable({
  programs,
  valueUnknown,
  onOpenProgram,
}: {
  programs: readonly TowerProgramView[];
  valueUnknown: boolean;
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
            Benefit
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
                {valueUnknown || !p.promisedBenefitLoaded ? (
                  <Unknown label="Not loaded" />
                ) : (
                  formatUsdM(p.promisedUsd)
                )}
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
                {valueUnknown ? (
                  <Unknown label="Unknown" />
                ) : (
                  formatUsdM(p.blockedUsd)
                )}
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
  valueUnknown,
  onOpenProgram,
}: {
  programs: readonly TowerProgramView[];
  valueUnknown: boolean;
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
                {valueUnknown ? (
                  <Unknown label="Benefit unknown" />
                ) : (
                  `${formatUsdM(total)} benefit`
                )}
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
                        funded ·{" "}
                        {valueUnknown || !p.promisedBenefitLoaded ? (
                          <Unknown label="benefit not loaded" />
                        ) : (
                          `${formatUsdM(p.promisedUsd)} benefit`
                        )}
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
  valueUnknown,
  onOpenProgram,
}: {
  programs: readonly TowerProgramView[];
  valueUnknown: boolean;
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
              {p.ownerRole ?? "No owner recorded"} ·{" "}
              {valueUnknown || !p.promisedBenefitLoaded ? (
                <Unknown label="benefit not loaded" />
              ) : (
                `${formatUsdM(p.promisedUsd)} benefit`
              )}
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
  totalProgramCount,
  onOpenProgram,
}: {
  programs: readonly TowerProgramView[];
  totalProgramCount: number;
  onOpenProgram: (id: string) => void;
}) {
  const lowProofPrograms = programs.filter((p) => p.evidenceMaturity <= 5);
  const maturityRange = proofMaturityRange(programs);
  const nearZeroProofCollapsed =
    programs.length > 0 && lowProofPrograms.length / programs.length >= 0.75;
  const maturityBandCompressed = proofMaturityIsCompressed(programs);
  const proofCollapsed = nearZeroProofCollapsed || maturityBandCompressed;
  const compressedPrograms = nearZeroProofCollapsed
    ? lowProofPrograms
    : programs;
  const compressedValue = compressedPrograms.reduce(
    (sum, p) => sum + p.valueAtStakeUsd,
    0,
  );

  return (
    <>
      {proofCollapsed ? (
        <div className={styles.heatmapTruthNote}>
          <b>
            {nearZeroProofCollapsed
              ? "Proof maturity is concentrated near zero."
              : "Proof maturity is tightly compressed."}
          </b>
          {nearZeroProofCollapsed ? (
            <span>
              {formatCount(lowProofPrograms.length)} programs carrying{" "}
              {formatUsdM(compressedValue)} are plotted at the left edge because
              usable proof is missing or immature, not because value has been
              realized.
            </span>
          ) : (
            <span>
              {formatCount(programs.length)} material cases carrying{" "}
              {formatUsdM(compressedValue)} sit within a {maturityRange}-point
              maturity band. Use the ranked program list for identity; the chart
              is showing compressed proof, not differentiated readiness.
            </span>
          )}
        </div>
      ) : null}
      {totalProgramCount > programs.length ? (
        <p className={styles.lhSub} style={{ marginBottom: 8 }}>
          Showing the top {formatCount(programs.length)} material board-scope
          value cases of {formatCount(totalProgramCount)}. The full row-level
          inventory remains in Program table.
        </p>
      ) : null}
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
  const focusPrograms = materialPrograms(programs);
  const maturityCompressed = proofMaturityIsCompressed(focusPrograms);
  const valueUnknown =
    view.summary.valueClaimCount > 0 &&
    view.summary.knownValueClaimCount === 0 &&
    view.summary.unknownValueClaimCount > 0;

  let body: React.ReactNode;
  if (valueUnknown && subView !== "heatmap") {
    body = (
      <Card
        title="Evidence maturity lanes"
        right="measurement gates before executive action"
        headId="tcc-evidence-lanes"
        style={{ flex: 1 }}
        bodyStyle={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <p className={styles.lhSub}>
          Tower is holding scale / fund / freeze / stop posture until the proof
          gates mature. These are the operating lanes for the current data.
        </p>
        <EvidenceLaneBoard view={view} />
      </Card>
    );
  } else if (subView === "overview") {
    body = (
      <div
        className={styles.ccLower}
        style={{ gridTemplateColumns: "330px 1fr", flex: 1 }}
      >
        <Card
          title={
            maturityCompressed
              ? "Proof-stage distribution"
              : "Portfolio topology"
          }
          right={
            maturityCompressed
              ? "adaptive default"
              : "program benefit x proof maturity"
          }
          headId="tcc-lanes-distribution"
          bodyStyle={{ display: "flex", flexDirection: "column" }}
        >
          {maturityCompressed ? (
            <>
              <p className={styles.lhSub} style={{ marginBottom: 10 }}>
                Proof maturity has low variance, so the default view switches to
                stage distribution and ranked lanes instead of a scatterplot.
              </p>
              <ProofStageDistribution programs={focusPrograms} />
            </>
          ) : (
            <HeatmapPanel
              programs={focusPrograms}
              totalProgramCount={programs.length}
              onOpenProgram={onOpenProgram}
            />
          )}
        </Card>
        <LaneColumns
          programs={focusPrograms}
          valueUnknown={valueUnknown}
          onOpenProgram={onOpenProgram}
        />
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
          right="program benefit × proof maturity · by decision lane"
          headId="tcc-lanes-heat-full"
          bodyStyle={{ display: "flex", flexDirection: "column" }}
        >
          <HeatmapPanel
            programs={focusPrograms}
            totalProgramCount={programs.length}
            onOpenProgram={onOpenProgram}
          />
        </Card>
        <Card
          title="Programs"
          right="by lane"
          headId="tcc-lanes-legend"
          bodyClassName={styles.scroll}
          bodyStyle={{ padding: "10px 12px" }}
        >
          <div className={styles.pool}>
            <LaneLegendList
              programs={focusPrograms}
              valueUnknown={valueUnknown}
              onOpenProgram={onOpenProgram}
            />
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
          <LaneTable
            programs={programs}
            valueUnknown={valueUnknown}
            onOpenProgram={onOpenProgram}
          />
        )}
      </Card>
    );
  }

  return (
    <div className={styles.view}>
      <ViewHead
        title={
          subView === "heatmap"
            ? "Portfolio decision topology"
            : subView === "overview"
              ? "Exposure-ranked decision lanes"
              : valueUnknown
                ? "The evidence operating room"
                : "The operating room"
        }
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

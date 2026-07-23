"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type {
  TowerMartAiPortfolioItem,
  TowerMartCommandViewModel,
  TowerMartCxoAction,
  TowerMartProgramLane,
  TowerMartRequiredFieldGap,
} from "@/lib/cio-tower/tower-mart-view-model";

type TowerView = "command" | "value" | "lanes" | "ai" | "evidence" | "actions";
type DecisionLane = TowerMartProgramLane["decisionLane"];

const theme = {
  page: "#f5f1eb",
  panel: "#ffffff",
  ink: "#151515",
  text: "#293247",
  muted: "#697386",
  rule: "#ded8ce",
  softRule: "#ece7de",
  navy: "#101b3f",
  blue: "#1169ff",
  teal: "#277f73",
  green: "#2fa678",
  greenBg: "#e7f6ef",
  gold: "#b98716",
  amber: "#c17917",
  amberBg: "#fff1dc",
  red: "#b33434",
  redBg: "#fff0f0",
  cardShadow: "0 22px 60px rgba(15, 23, 42, 0.06)",
  serif: "var(--font-serif, Georgia), Georgia, serif",
  sans: "var(--font-sans, Inter), Inter, system-ui, sans-serif",
  mono: "var(--font-mono, ui-monospace), ui-monospace, SFMono-Regular, Menlo, monospace",
};

const views: Array<{ key: TowerView; label: string; dot?: "red"; count?: (model: TowerMartCommandViewModel) => number }> = [
  { key: "command", label: "Command Center" },
  { key: "value", label: "Value Proof", dot: "red" },
  { key: "lanes", label: "Decision Lanes", count: (model) => model.programLanes.length },
  { key: "ai", label: "AI Portfolio", count: (model) => model.aiPortfolio.length },
  { key: "evidence", label: "Evidence", dot: "red" },
  { key: "actions", label: "Recommended Actions", count: (model) => model.cxoActions.length },
];

const laneMeta: Record<
  DecisionLane,
  { label: string; color: string; bg: string; border: string; verb: string }
> = {
  fund: {
    label: "Fund",
    color: theme.green,
    bg: "#e7f7f0",
    border: "#9bd8c4",
    verb: "Scale with proof",
  },
  fix: {
    label: "Fix",
    color: theme.amber,
    bg: theme.amberBg,
    border: "#e0bf86",
    verb: "Fix evidence",
  },
  freeze: {
    label: "Freeze",
    color: theme.navy,
    bg: "#edf2ff",
    border: "#b9c8ef",
    verb: "Hold spend",
  },
  stop: {
    label: "Stop",
    color: theme.red,
    bg: theme.redBg,
    border: "#ebb0b0",
    verb: "Stop/reset",
  },
};

export function TowerCommandCenterContract({ model }: { model: TowerMartCommandViewModel }) {
  const [activeView, setActiveView] = useState<TowerView>("command");
  const summary = useMemo(() => buildTowerSummary(model), [model]);

  return (
    <div
      data-testid="tower-command-center-contract"
      style={{
        minHeight: "100%",
        width: "100%",
        background: theme.page,
        color: theme.ink,
        fontFamily: theme.sans,
      }}
    >
      <div style={shellStyle}>
        <TowerHeader model={model} summary={summary} />
        <TowerTabs model={model} activeView={activeView} onChange={setActiveView} />

        {activeView === "command" ? <CommandCenterView model={model} summary={summary} /> : null}
        {activeView === "value" ? <ValueProofView model={model} summary={summary} /> : null}
        {activeView === "lanes" ? <DecisionLanesView rows={model.programLanes} /> : null}
        {activeView === "ai" ? <AiPortfolioView model={model} summary={summary} /> : null}
        {activeView === "evidence" ? <EvidenceView model={model} summary={summary} /> : null}
        {activeView === "actions" ? <ActionsView actions={summary.decisions} gaps={model.requiredFieldGaps} /> : null}
      </div>
    </div>
  );
}

function TowerHeader({
  model,
  summary,
}: {
  model: TowerMartCommandViewModel;
  summary: TowerSummary;
}) {
  const command = model.command;
  return (
    <header style={headerStyle}>
      <div>
        <span style={visuallyHiddenStyle}>Active portfolio context</span>
        <div style={contractEyebrowStyle}>
          IT INVESTMENT TOWER - FY26 - {command.tenantName.toUpperCase()}
        </div>
        <h1 style={heroStyle}>Funded ahead of proof. Value is the constraint.</h1>
      </div>
      <div style={metaClusterStyle}>
        <div>
          <span style={metaLabelStyle}>Refreshed</span>
          <b>{summary.refreshedLabel}</b>
        </div>
        <div>
          <span style={metaLabelStyle}>Decision scope</span>
          <b>
            {formatWhole(model.programLanes.length)} programs - {formatWhole(model.aiPortfolio.length)} AI initiatives
          </b>
        </div>
        <span style={criticalPillStyle}>Value proof - {summary.proofLabel}</span>
      </div>
    </header>
  );
}

function TowerTabs({
  model,
  activeView,
  onChange,
}: {
  model: TowerMartCommandViewModel;
  activeView: TowerView;
  onChange: (view: TowerView) => void;
}) {
  return (
    <nav aria-label="Tower command views" style={tabsStyle}>
      {views.map((view) => {
        const active = activeView === view.key;
        const count = view.count?.(model);
        return (
          <button
            key={view.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(view.key)}
            style={{
              ...tabStyle,
              color: active ? theme.ink : theme.text,
              borderBottomColor: active ? theme.ink : "transparent",
            }}
          >
            {view.dot ? <span style={redDotStyle} /> : null}
            <span>{view.label}</span>
            {typeof count === "number" ? <small>{formatWhole(count)}</small> : null}
          </button>
        );
      })}
    </nav>
  );
}

function CommandCenterView({
  model,
  summary,
}: {
  model: TowerMartCommandViewModel;
  summary: TowerSummary;
}) {
  const command = model.command;
  const lanes = summary.laneCounts;
  return (
    <section style={{ display: "grid", gap: 28 }}>
      <div style={kpiGridStyle}>
        <PostureCard title="Spend posture" badge="In view" tone="neutral">
          <KpiValue value={money(command.totalItBudgetFy26)} label="FY26 IT budget across governed programs" />
          <MetricRows
            rows={[
              ["Run / keep-lights", money(command.runBudgetFy26)],
              ["Change / transform", money(command.changeBudgetFy26)],
              ["AI-tagged spend lens", money(command.aiTaggedSpendFy26NonAdditive), "green"],
              ["Approved program budget", money(command.approvedProgramBudgetFy26)],
            ]}
          />
        </PostureCard>

        <PostureCard title="Value posture" badge={summary.proofLabel} tone="red">
          <KpiValue
            value={money(command.realizedValueYtdAllowed)}
            label="is claimable today"
          />
          <MetricRows
            rows={[
              ["Promised", money(command.promisedValueFy26)],
              ["Usage-supported", money(summary.usageSupportedValue)],
              ["Finance-validated", money(command.partialFinanceValidatedValueYtd)],
              ["Blocked", money(summary.blockedValue), "red"],
            ]}
          />
        </PostureCard>

        <PostureCard title="Risk posture" badge={`${summary.blockingGaps.length} open gaps`} tone="amber">
          <KpiValue
            value={`${formatWhole(summary.highRiskItems)} watch items`}
            label="Evidence, owner, usage, or control boundaries remain open."
          />
          <MetricRows
            rows={[
              ["Evidence gaps", formatWhole(summary.blockingGaps.length)],
              ["Owner gaps", formatWhole(summary.ownerGapCount)],
              ["Usage gaps", formatWhole(summary.usageGapCount)],
              ["Claim blockers", formatWhole(summary.claimBlockedCount), "red"],
            ]}
          />
        </PostureCard>

        <PostureCard title="Decision posture" badge="This week" tone="neutral">
          <KpiValue
            value={`${formatWhole(summary.decisions.length)} decisions waiting`}
            label="aVa proposes; a named owner decides."
          />
          <MetricRows
            rows={[
              ["Fund", formatWhole(lanes.fund), "green"],
              ["Fix", formatWhole(lanes.fix), "amber"],
              ["Freeze", formatWhole(lanes.freeze)],
              ["Stop", formatWhole(lanes.stop), "red"],
            ]}
          />
        </PostureCard>
      </div>

      <div style={commandGridStyle}>
        <ThisWeeksRead command={command} summary={summary} />
        <DecisionsWaiting decisions={summary.decisions} />
      </div>
    </section>
  );
}

function ThisWeeksRead({
  command,
  summary,
}: {
  command: TowerMartCommandViewModel["command"];
  summary: TowerSummary;
}) {
  const bars = [
    { label: "Promised", value: command.promisedValueFy26, color: theme.green },
    { label: "Usage-supported", value: summary.usageSupportedValue, color: "#62bfa0" },
    { label: "Finance-validated", value: command.partialFinanceValidatedValueYtd, color: theme.amber },
    { label: "Claimable", value: command.realizedValueYtdAllowed, color: theme.red },
  ];
  const max = Math.max(command.promisedValueFy26, 1);

  return (
    <Panel style={{ minHeight: 430 }}>
      <div style={goldEyebrowStyle}>This week's read</div>
      <p style={weeklyStatementStyle}>
        {money(command.totalItBudgetFy26)} is in view. {money(command.aiTaggedSpendFy26NonAdditive)} is AI-tagged.{" "}
        {money(command.promisedValueFy26)} is promised value. {money(command.realizedValueYtdAllowed)} is claimable.
        The issue is not spend visibility - it is value proof.
      </p>
      <div style={ladderStyle}>
        {bars.map((bar) => (
          <div key={bar.label} style={ladderRowStyle}>
            <span>{bar.label}</span>
            <div style={ladderTrackStyle}>
              <span
                style={{
                  ...ladderFillStyle,
                  width: `${Math.max(bar.value > 0 ? 3 : 0, Math.min((bar.value / max) * 100, 100))}%`,
                  background: bar.color,
                }}
              />
            </div>
            <b>{money(bar.value)}</b>
          </div>
        ))}
      </div>
      <div style={blockerStripStyle}>
        <span>Primary blocker</span>
        <b>{summary.primaryBlocker}</b>
      </div>
    </Panel>
  );
}

function DecisionsWaiting({ decisions }: { decisions: DecisionRow[] }) {
  return (
    <Panel style={{ minHeight: 430 }}>
      <div style={goldEyebrowStyle}>Decisions waiting on you</div>
      <p style={panelLeadStyle}>aVa proposes - you approve - nothing acts on its own.</p>
      <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
        {decisions.slice(0, 4).map((decision, index) => (
          <div key={decision.key} style={decisionRowStyle}>
            <span style={{ ...decisionNumberStyle, background: decision.color }}>{index + 1}</span>
            <div>
              <b>{decision.title}</b>
              <p>{decision.body}</p>
            </div>
            <span style={decisionLaneStyle}>{decision.lane}</span>
          </div>
        ))}
        {decisions.length === 0 ? <EmptyState text="No executive decision is recorded in the Tower mart." /> : null}
      </div>
    </Panel>
  );
}

function ValueProofView({
  model,
  summary,
}: {
  model: TowerMartCommandViewModel;
  summary: TowerSummary;
}) {
  const command = model.command;
  return (
    <section style={{ display: "grid", gap: 24 }}>
      <ViewHeading
        eyebrow="Funding vs. value realization"
        title="Value Proof Funnel"
        copy="The ladder shows what has been funded, what has been promised, what has usage evidence, what finance has validated, and what can actually be claimed."
      />
      <div style={twoColumnStyle}>
        <Panel>
          <FunnelBars
            rows={[
              ["Funded change spend", command.changeBudgetFy26, theme.navy],
              ["Promised value", command.promisedValueFy26, theme.green],
              ["Usage-supported value", summary.usageSupportedValue, "#62bfa0"],
              ["Finance-validated partial value", command.partialFinanceValidatedValueYtd, theme.amber],
              ["Claimable realized value", command.realizedValueYtdAllowed, theme.red],
            ]}
          />
        </Panel>
        <Panel>
          <div style={goldEyebrowStyle}>Value proven vs. promised - by program</div>
          <ProgramProofRows rows={model.programLanes} />
        </Panel>
      </div>
    </section>
  );
}

function DecisionLanesView({ rows }: { rows: TowerMartProgramLane[] }) {
  const grouped = groupByLane(rows);
  return (
    <section style={{ display: "grid", gap: 24 }}>
      <ViewHeading
        eyebrow="Initiative health - fund / fix / freeze / stop"
        title="Portfolio Decision Lanes"
        copy="Every program is placed from budget ties, value evidence, usage signal, claim status, and open gates. Missing evidence becomes a blocker, not a substituted answer."
      />
      <div style={goldEyebrowStyle}>Program table</div>
      <div style={laneBoardStyle}>
        {(Object.keys(laneMeta) as DecisionLane[]).map((lane) => (
          <div key={lane} style={{ ...laneColumnStyle, background: laneMeta[lane].bg, borderColor: laneMeta[lane].border }}>
            <div style={laneHeaderStyle}>
              <h3>{laneMeta[lane].label}</h3>
              <b style={{ color: laneMeta[lane].color }}>{formatWhole(grouped[lane].length)} programs</b>
            </div>
            <p style={laneSubStyle}>{laneMeta[lane].verb}</p>
            <div style={{ display: "grid", gap: 10 }}>
              {grouped[lane].slice(0, 5).map((row) => (
                <ProgramCard key={row.laneKey} row={row} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AiPortfolioView({
  model,
  summary,
}: {
  model: TowerMartCommandViewModel;
  summary: TowerSummary;
}) {
  const plotted = model.aiPortfolio
    .slice()
    .sort((a, b) => b.valueScore + b.readinessScore - (a.valueScore + a.readinessScore))
    .slice(0, 16)
    .map((row, index) => ({ ...row, plotId: index + 1, z: Math.max(row.aiTaggedSpendUsd, row.approvedFundingUsd, 1) }));

  return (
    <section style={{ display: "grid", gap: 24 }}>
      <ViewHeading
        eyebrow="AI portfolio readiness"
        title="AI opportunity portfolio"
        copy="Tower separates approved or embedded AI spend from candidate ideas, then asks what can scale with proof and what stays held until evidence clears."
      />
      <p style={sectionAnchorTextStyle}>Which AI is real, embedded, or just an idea</p>
      <div style={twoColumnWideStyle}>
        <Panel>
          <div style={goldEyebrowStyle}>Value vs. readiness</div>
          <p style={panelLeadStyle}>
            Numbers map to the watchlist. The upper-right is scale with proof; lower-right is fund readiness; lower-left stays in discovery.
          </p>
          <AiMatrix rows={plotted} />
        </Panel>
        <Panel>
          <div style={goldEyebrowStyle}>AI spend lens</div>
          <KpiValue value={money(model.command.aiTaggedSpendFy26NonAdditive)} label="Non-additive; already inside approved platform, program, governance, and enablement spend." />
          <div style={aiPillsStyle}>
            <MiniStat label="Funded lens" value={formatWhole(summary.fundedAiCount)} />
            <MiniStat label="Proof signal" value={formatWhole(summary.usageSignalCount)} />
            <MiniStat label="Candidate pool" value={formatWhole(model.command.candidateAiOpportunities)} />
          </div>
          <div style={watchListStyle}>
            {plotted.slice(0, 8).map((row) => (
              <div key={row.aiPortfolioKey} style={watchRowStyle}>
                <span style={{ ...decisionNumberStyle, background: laneMeta[row.decisionLane].color }}>{row.plotId}</span>
                <div>
                  <b>{row.itemName}</b>
                  <p>{row.vendorName ?? row.systemName ?? "Owner pending"} - {money(row.financeValidatedValueUsd)} validated</p>
                </div>
                <strong style={{ color: laneMeta[row.decisionLane].color }}>{laneMeta[row.decisionLane].verb}</strong>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function EvidenceView({
  model,
  summary,
}: {
  model: TowerMartCommandViewModel;
  summary: TowerSummary;
}) {
  const sources = Array.from(new Set(model.evidenceLineage.map((row) => row.sourceFile).filter(Boolean)));
  return (
    <section style={{ display: "grid", gap: 24 }}>
      <ViewHeading
        eyebrow="Evidence boundary"
        title="Why the dashboard is allowed to say this"
        copy="The page must reconcile every executive claim back to the mart and source template. Missing proof stays visible."
      />
      <div style={evidenceGridStyle}>
        <QuestionCard title="What evidence exists?" body={`${formatWhole(sources.length)} source packages support the displayed Tower posture.`} />
        <QuestionCard title="What is missing?" body={`${formatWhole(model.requiredFieldGaps.length)} required fields or evidence gates remain open.`} />
        <QuestionCard title="Who provides it?" body={`${formatWhole(summary.ownerGroups.length)} owner group${summary.ownerGroups.length === 1 ? "" : "s"} are named or need assignment.`} />
        <QuestionCard title="What stays blocked?" body="Realized value and ROI language remain blocked until source rows explicitly allow claimable value." />
      </div>
      <Panel>
        <div style={goldEyebrowStyle}>Source trace</div>
        <div style={traceListStyle}>
          {model.evidenceLineage.slice(0, 14).map((row) => (
            <div key={row.lineageKey} style={traceRowStyle}>
              <div>
                <b>{row.displayedFact}</b>
                <p>{row.caveat || "Evidence supports the displayed posture."}</p>
              </div>
              <span>{row.sourceFile ?? "source pending"}</span>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function ActionsView({
  actions,
  gaps,
}: {
  actions: DecisionRow[];
  gaps: TowerMartRequiredFieldGap[];
}) {
  return (
    <section style={{ display: "grid", gap: 24 }}>
      <ViewHeading
        eyebrow="Executive action memo"
        title="What must happen next"
        copy="Actions are grouped as a weekly operating agenda. They are proposals until a named human owner approves them."
      />
      <div style={actionGridStyle}>
        {actions.map((action, index) => (
          <Panel key={action.key}>
            <div style={actionCardTopStyle}>
              <span style={{ ...decisionNumberStyle, background: action.color }}>{index + 1}</span>
              <span style={decisionLaneStyle}>{action.lane}</span>
            </div>
            <h3 style={smallPanelTitleStyle}>{action.title}</h3>
            <p style={panelLeadStyle}>{action.body}</p>
          </Panel>
        ))}
        {gaps.slice(0, 3).map((gap) => (
          <Panel key={gap.gapKey}>
            <div style={goldEyebrowStyle}>Evidence request</div>
            <h3 style={smallPanelTitleStyle}>{humanize(gap.requiredField)}</h3>
            <p style={panelLeadStyle}>{gap.remediationAction}</p>
          </Panel>
        ))}
      </div>
    </section>
  );
}

function PostureCard({
  title,
  badge,
  tone,
  children,
}: {
  title: string;
  badge: string;
  tone: "neutral" | "red" | "amber";
  children: ReactNode;
}) {
  const leftColor = tone === "red" ? theme.red : tone === "amber" ? theme.amber : theme.rule;
  return (
    <div style={{ ...postureCardStyle, borderLeftColor: leftColor }}>
      <div style={postureTopStyle}>
        <span>{title}</span>
        <b style={{ color: tone === "red" ? theme.red : tone === "amber" ? theme.amber : theme.text }}>{badge}</b>
      </div>
      {children}
    </div>
  );
}

function KpiValue({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={kpiValueStyle}>{value}</div>
      <p style={kpiLabelStyle}>{label}</p>
    </div>
  );
}

function MetricRows({
  rows,
}: {
  rows: Array<[string, string] | [string, string, "green" | "red" | "amber"]>;
}) {
  return (
    <div style={metricRowsStyle}>
      {rows.map(([label, value, tone]) => (
        <div key={label} style={metricRowStyle}>
          <span>{label}</span>
          <b style={{ color: tone ? toneColor(tone) : theme.ink }}>{value}</b>
        </div>
      ))}
    </div>
  );
}

function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...panelStyle, ...style }}>{children}</div>;
}

function FunnelBars({ rows }: { rows: Array<[string, number, string]> }) {
  const max = Math.max(...rows.map(([, value]) => value), 1);
  return (
    <div style={{ display: "grid", gap: 22 }}>
      {rows.map(([label, value, color]) => (
        <div key={label}>
          <div style={barHeaderStyle}>
            <b>{label}</b>
            <strong>{money(value)}</strong>
          </div>
          <div style={barTrackStyle}>
            <span
              style={{
                ...barFillStyle,
                background: color,
                width: `${Math.max(value > 0 ? 3 : 0, Math.min((value / max) * 100, 100))}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgramProofRows({ rows }: { rows: TowerMartProgramLane[] }) {
  const top = rows
    .filter((row) => row.promisedValueUsd > 0 || row.financeValidatedValueUsd > 0)
    .sort((a, b) => b.promisedValueUsd - a.promisedValueUsd)
    .slice(0, 8);
  if (top.length === 0) return <EmptyState text="No promised-value program is loaded for this view." />;
  return (
    <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
      {top.map((row) => {
        const pct = row.promisedValueUsd > 0 ? (row.financeValidatedValueUsd / row.promisedValueUsd) * 100 : 0;
        return (
          <div key={row.laneKey} style={proofRowStyle}>
            <div>
              <b>{row.programName}</b>
              <p>{row.programCode ?? "program code pending"}</p>
            </div>
            <div style={proofBarWrapStyle}>
              <div style={barTrackStyle}>
                <span style={{ ...barFillStyle, width: `${Math.max(pct > 0 ? 3 : 0, Math.min(pct, 100))}%` }} />
              </div>
            </div>
            <strong>{Math.round(pct)}%</strong>
          </div>
        );
      })}
    </div>
  );
}

function AiMatrix({ rows }: { rows: Array<TowerMartAiPortfolioItem & { plotId: number; z: number }> }) {
  if (rows.length === 0) return <EmptyState text="No AI portfolio item is available in the mart." />;
  const normalized = rows.map((row) => ({
    ...row,
    valuePlot: normalizeScore(row.valueScore),
    readinessPlot: normalizeScore(row.readinessScore),
  }));
  return (
    <>
      <div style={{ height: 420, marginTop: 24 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <ScatterChart margin={{ top: 18, right: 22, bottom: 28, left: 24 }}>
            <CartesianGrid stroke={theme.softRule} />
            <ReferenceLine x={50} stroke={theme.rule} strokeWidth={2} />
            <ReferenceLine y={50} stroke={theme.rule} strokeWidth={2} />
            <XAxis
              type="number"
              dataKey="readinessPlot"
              domain={[0, 100]}
              tick={false}
              axisLine={{ stroke: theme.rule }}
              label={{ value: "Readiness", position: "insideBottom", offset: -10, fill: theme.text }}
            />
            <YAxis
              type="number"
              dataKey="valuePlot"
              domain={[0, 100]}
              tick={false}
              axisLine={{ stroke: theme.rule }}
              label={{ value: "Value", angle: -90, position: "insideLeft", fill: theme.text }}
            />
            <ZAxis dataKey="z" range={[320, 980]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value, name) => {
                if (name === "z") return money(Number(value));
                return String(value);
              }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.itemName ?? "AI item"}
            />
            <Scatter data={normalized}>
              {normalized.map((row) => (
                <Cell key={row.aiPortfolioKey} fill={laneMeta[row.decisionLane].color} />
              ))}
              <LabelList dataKey="plotId" position="center" fill="#fff" fontSize={12} fontWeight={900} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div style={matrixCaptionStyle}>
        <span>Upper-right: scale with proof</span>
        <span>Lower-right: fund readiness</span>
        <span>Lower-left: discovery only</span>
      </div>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={miniStatStyle}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function ProgramCard({ row }: { row: TowerMartProgramLane }) {
  const next = nextGate(row) || row.decisionRationale || row.caveat;
  return (
    <div style={programCardStyle}>
      <div style={programTopStyle}>
        <b>{row.programName}</b>
        <strong style={{ color: laneMeta[row.decisionLane].color }}>{money(row.approvedFundingUsd)}</strong>
      </div>
      <p>{row.ownerRole ?? "Owner pending"} - {money(row.promisedValueUsd)} promised - {money(row.financeValidatedValueUsd)} validated</p>
      <small>{next}</small>
    </div>
  );
}

function QuestionCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={questionCardStyle}>
      <span>{title}</span>
      <p>{body}</p>
    </div>
  );
}

function ViewHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div style={{ maxWidth: 1080 }}>
      <div style={goldEyebrowStyle}>{eyebrow}</div>
      <h2 style={viewTitleStyle}>{title}</h2>
      <p style={viewCopyStyle}>{copy}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p style={emptyStateStyle}>{text}</p>;
}

interface DecisionRow {
  key: string;
  lane: string;
  title: string;
  body: string;
  color: string;
}

interface TowerSummary {
  proofLabel: string;
  refreshedLabel: string;
  usageSupportedValue: number;
  blockedValue: number;
  blockingGaps: TowerMartRequiredFieldGap[];
  ownerGapCount: number;
  usageGapCount: number;
  claimBlockedCount: number;
  highRiskItems: number;
  fundedAiCount: number;
  usageSignalCount: number;
  laneCounts: Record<DecisionLane, number>;
  primaryBlocker: string;
  ownerGroups: string[];
  decisions: DecisionRow[];
}

function buildTowerSummary(model: TowerMartCommandViewModel): TowerSummary {
  const command = model.command;
  const blockingGaps = model.requiredFieldGaps.filter((gap) => gap.blocking);
  const usageSupportedValue = deriveUsageSupportedValue(model);
  const blockedValue = Math.max(command.promisedValueFy26 - command.partialFinanceValidatedValueYtd, 0);
  const ownerGroups = Array.from(new Set(model.requiredFieldGaps.map((gap) => gap.ownerHint ?? "Unassigned")));
  const claimBlockedCount = model.programLanes.filter((row) => !claimAllowed(row.towerClaimAllowed)).length;
  const usageGapCount = model.programLanes.filter((row) => row.usageActual === null && row.adoptionRatePct === null).length;
  const laneCounts = countLanes(model.programLanes);
  const decisions = buildDecisions(model);
  const primaryBlocker = blockingGaps[0]?.remediationAction || "Finance attestation and usage evidence";
  return {
    proofLabel: command.realizedValueYtdAllowed > 0 ? "Clear" : command.partialFinanceValidatedValueYtd > 0 ? "Partial" : "Critical",
    refreshedLabel: "from Tower mart",
    usageSupportedValue,
    blockedValue,
    blockingGaps,
    ownerGapCount: model.requiredFieldGaps.filter((gap) => !gap.ownerHint || gap.ownerHint.toLowerCase() === "unassigned").length,
    usageGapCount,
    claimBlockedCount,
    highRiskItems: blockingGaps.length + usageGapCount,
    fundedAiCount: model.aiPortfolio.filter((row) => row.approvedFundingUsd > 0 || row.aiTaggedSpendUsd > 0).length,
    usageSignalCount: model.aiPortfolio.filter((row) => row.usageActual !== null || row.adoptionRatePct !== null).length,
    laneCounts,
    primaryBlocker,
    ownerGroups,
    decisions,
  };
}

function deriveUsageSupportedValue(model: TowerMartCommandViewModel): number {
  const usageStage = model.valueFunnel.find((stage) => {
    const text = `${stage.stageKey} ${stage.stageLabel}`.toLowerCase();
    return text.includes("usage") || text.includes("adoption");
  });
  if (usageStage) return usageStage.valueNumeric;
  return model.programLanes
    .filter((row) => row.usageActual !== null || row.adoptionRatePct !== null)
    .reduce((sum, row) => sum + row.promisedValueUsd, 0);
}

function buildDecisions(model: TowerMartCommandViewModel): DecisionRow[] {
  const cxoRows = model.cxoActions.slice(0, 4).map((action) => {
    const lane = inferLane(action.actionLane);
    return {
      key: action.actionKey,
      lane: laneMeta[lane].label,
      title: action.title,
      body: action.actionBody,
      color: laneMeta[lane].color,
    };
  });
  if (cxoRows.length >= 4) return cxoRows;
  const programRows = model.programLanes
    .filter((row) => row.decisionLane !== "fund")
    .slice(0, 4 - cxoRows.length)
    .map((row) => ({
      key: row.laneKey,
      lane: laneMeta[row.decisionLane].label,
      title: row.programName,
      body: nextGate(row) || row.decisionRationale || row.caveat,
      color: laneMeta[row.decisionLane].color,
    }));
  return [...cxoRows, ...programRows];
}

function countLanes(rows: TowerMartProgramLane[]): Record<DecisionLane, number> {
  return rows.reduce<Record<DecisionLane, number>>(
    (acc, row) => {
      acc[row.decisionLane] += 1;
      return acc;
    },
    { fund: 0, fix: 0, freeze: 0, stop: 0 },
  );
}

function groupByLane(rows: TowerMartProgramLane[]): Record<DecisionLane, TowerMartProgramLane[]> {
  return rows.reduce<Record<DecisionLane, TowerMartProgramLane[]>>(
    (acc, row) => {
      acc[row.decisionLane].push(row);
      return acc;
    },
    { fund: [], fix: [], freeze: [], stop: [] },
  );
}

function nextGate(row: TowerMartProgramLane): string {
  const gate = row.requiredGates.find((item) => {
    const status = String(item.status ?? item.gate_status ?? "").toLowerCase();
    return status.includes("open") || status.includes("missing") || status.includes("required") || status.length === 0;
  });
  if (!gate) return "";
  const label = String(gate.label ?? gate.gate ?? gate.field ?? gate.required_field ?? "");
  if (!label) return "";
  return `Next: ${humanize(label)}.`;
}

function inferLane(value: string | null | undefined): DecisionLane {
  const text = String(value ?? "").toLowerCase();
  if (text.includes("stop")) return "stop";
  if (text.includes("freeze") || text.includes("hold")) return "freeze";
  if (text.includes("fix")) return "fix";
  return "fund";
}

function claimAllowed(value: string | null | undefined): boolean {
  const text = String(value ?? "").toLowerCase();
  return text === "allowed" || text.includes("claimable");
}

function normalizeScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value <= 10 ? Math.max(0, Math.min(value * 10, 100)) : Math.max(0, Math.min(value, 100));
}

function money(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function formatWhole(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function humanize(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function toneColor(tone: "green" | "red" | "amber"): string {
  if (tone === "green") return theme.green;
  if (tone === "red") return theme.red;
  return theme.amber;
}

const shellStyle: CSSProperties = {
  maxWidth: 1700,
  margin: "0 auto",
  padding: "34px clamp(28px, 4vw, 76px) 48px",
};

const visuallyHiddenStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 32,
  paddingBottom: 28,
  borderBottom: `1px solid ${theme.rule}`,
};

const contractEyebrowStyle: CSSProperties = {
  color: "#06724f",
  fontFamily: theme.mono,
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 3,
  textTransform: "uppercase",
};

const heroStyle: CSSProperties = {
  margin: "8px 0 0",
  fontFamily: theme.serif,
  fontSize: "clamp(26px, 2.3vw, 34px)",
  lineHeight: 1.05,
  letterSpacing: 0,
  maxWidth: 1000,
};

const metaClusterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap",
  justifyContent: "flex-end",
  color: theme.text,
  fontSize: 13,
};

const metaLabelStyle: CSSProperties = {
  display: "block",
  color: theme.muted,
  fontSize: 11,
  fontFamily: theme.mono,
  textTransform: "uppercase",
  letterSpacing: 2,
  marginBottom: 4,
};

const criticalPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 32,
  padding: "0 14px",
  borderRadius: 999,
  background: theme.redBg,
  color: theme.red,
  fontWeight: 900,
  fontSize: 12,
};

const tabsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 24,
  marginBottom: 28,
  borderBottom: `1px solid ${theme.rule}`,
  overflowX: "auto",
};

const tabStyle: CSSProperties = {
  appearance: "none",
  border: 0,
  borderBottom: "3px solid transparent",
  background: "transparent",
  padding: "18px 0 16px",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  whiteSpace: "nowrap",
  cursor: "pointer",
  fontWeight: 850,
  fontSize: 14,
};

const redDotStyle: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: 999,
  background: theme.red,
};

const kpiGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
  gap: 14,
};

const postureCardStyle: CSSProperties = {
  background: theme.panel,
  border: `1px solid ${theme.rule}`,
  borderLeft: "5px solid transparent",
  borderRadius: 12,
  padding: 18,
  minHeight: 198,
  boxShadow: theme.cardShadow,
};

const postureTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  color: theme.muted,
  fontFamily: theme.mono,
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 2,
  textTransform: "uppercase",
};

const kpiValueStyle: CSSProperties = {
  fontFamily: theme.serif,
  fontWeight: 900,
  fontSize: 34,
  lineHeight: 1,
  letterSpacing: 0,
};

const kpiLabelStyle: CSSProperties = {
  margin: "10px 0 0",
  color: theme.text,
  fontSize: 14,
  lineHeight: 1.45,
};

const metricRowsStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 18,
  paddingTop: 14,
  borderTop: `1px solid ${theme.softRule}`,
};

const metricRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  color: theme.text,
  fontSize: 13,
};

const commandGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.55fr) minmax(360px, 0.85fr)",
  gap: 20,
};

const panelStyle: CSSProperties = {
  background: theme.panel,
  border: `1px solid ${theme.rule}`,
  borderRadius: 14,
  padding: 26,
  boxShadow: theme.cardShadow,
};

const goldEyebrowStyle: CSSProperties = {
  color: theme.gold,
  fontFamily: theme.mono,
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 3,
  textTransform: "uppercase",
};

const weeklyStatementStyle: CSSProperties = {
  margin: "18px 0 24px",
  fontFamily: theme.serif,
  fontSize: "clamp(27px, 2.15vw, 36px)",
  lineHeight: 1.18,
  fontWeight: 900,
  letterSpacing: 0,
  maxWidth: 970,
};

const ladderStyle: CSSProperties = {
  display: "grid",
  gap: 16,
  maxWidth: 900,
};

const ladderRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "150px minmax(120px, 1fr) 80px",
  gap: 14,
  alignItems: "center",
  color: theme.text,
  fontSize: 13,
};

const ladderTrackStyle: CSSProperties = {
  height: 11,
  borderRadius: 999,
  background: "#ebe7df",
  overflow: "hidden",
};

const ladderFillStyle: CSSProperties = {
  display: "block",
  height: "100%",
  borderRadius: 999,
};

const blockerStripStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  marginTop: 24,
  padding: "15px 18px",
  borderRadius: 12,
  background: theme.greenBg,
  color: "#103f2f",
  borderLeft: `4px solid ${theme.green}`,
};

const panelLeadStyle: CSSProperties = {
  color: theme.text,
  fontSize: 16,
  lineHeight: 1.5,
  margin: "10px 0 0",
};

const decisionRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) auto",
  gap: 12,
  alignItems: "center",
  padding: "14px 0",
  borderBottom: `1px solid ${theme.softRule}`,
};

const decisionNumberStyle: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontWeight: 900,
  fontSize: 13,
};

const decisionLaneStyle: CSSProperties = {
  color: theme.navy,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const twoColumnStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, .9fr) minmax(0, 1.1fr)",
  gap: 20,
};

const twoColumnWideStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.25fr) minmax(420px, .75fr)",
  gap: 20,
};

const viewTitleStyle: CSSProperties = {
  margin: "12px 0 6px",
  fontFamily: theme.serif,
  fontSize: "clamp(38px, 4vw, 62px)",
  lineHeight: 0.96,
  letterSpacing: 0,
};

const viewCopyStyle: CSSProperties = {
  margin: 0,
  color: theme.text,
  fontSize: 18,
  lineHeight: 1.45,
};

const sectionAnchorTextStyle: CSSProperties = {
  margin: "8px 0 0",
  color: theme.text,
  fontSize: 18,
  lineHeight: 1.45,
  fontWeight: 700,
};

const barHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 8,
};

const barTrackStyle: CSSProperties = {
  width: "100%",
  height: 10,
  borderRadius: 999,
  background: "#ebe7df",
  overflow: "hidden",
};

const barFillStyle: CSSProperties = {
  display: "block",
  height: "100%",
  background: theme.green,
  borderRadius: 999,
};

const proofRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, .8fr) minmax(180px, 1fr) 48px",
  alignItems: "center",
  gap: 18,
  padding: "12px 0",
  borderBottom: `1px solid ${theme.softRule}`,
};

const proofBarWrapStyle: CSSProperties = { minWidth: 160 };

const laneBoardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(260px, 1fr))",
  gap: 18,
};

const laneColumnStyle: CSSProperties = {
  border: "1px solid",
  borderRadius: 18,
  padding: 20,
  minHeight: 360,
};

const laneHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 12,
};

const laneSubStyle: CSSProperties = {
  margin: "8px 0 18px",
  color: theme.text,
  fontSize: 13,
};

const programCardStyle: CSSProperties = {
  background: "rgba(255,255,255,.82)",
  border: `1px solid ${theme.rule}`,
  borderRadius: 12,
  padding: 14,
};

const programTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
};

const aiPillsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
  margin: "22px 0",
};

const miniStatStyle: CSSProperties = {
  border: `1px solid ${theme.rule}`,
  borderRadius: 12,
  padding: 14,
  display: "grid",
  gap: 8,
};

const watchListStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  maxHeight: 480,
  overflow: "auto",
};

const watchRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "32px minmax(0, 1fr) auto",
  gap: 12,
  padding: "14px 0",
  borderTop: `1px solid ${theme.softRule}`,
  alignItems: "center",
};

const matrixCaptionStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  color: theme.muted,
  fontSize: 12,
  marginTop: 8,
};

const evidenceGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(190px, 1fr))",
  gap: 14,
};

const questionCardStyle: CSSProperties = {
  background: theme.panel,
  border: `1px solid ${theme.rule}`,
  borderRadius: 14,
  padding: 18,
};

const traceListStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  marginTop: 18,
};

const traceRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(160px, 260px)",
  gap: 18,
  borderTop: `1px solid ${theme.softRule}`,
  padding: "14px 0",
  color: theme.text,
};

const actionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(280px, 1fr))",
  gap: 16,
};

const actionCardTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "center",
  marginBottom: 18,
};

const smallPanelTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  lineHeight: 1.15,
};

const emptyStateStyle: CSSProperties = {
  padding: 18,
  border: `1px dashed ${theme.rule}`,
  borderRadius: 12,
  color: theme.muted,
  background: "#fbfaf6",
};

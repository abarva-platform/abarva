"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
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
  TowerMartEvidenceLineage,
  TowerMartProgramLane,
  TowerMartRequiredFieldGap,
} from "@/lib/cio-tower/tower-mart-view-model";

type TowerContractView =
  | "command"
  | "value"
  | "lanes"
  | "ai"
  | "actions"
  | "evidence";

type DecisionLane = TowerMartProgramLane["decisionLane"];

const UX = {
  page: "#fbfaf6",
  panel: "#ffffff",
  ink: "#101828",
  ink2: "#3f4a5f",
  muted: "#667085",
  faint: "#eef1f6",
  rule: "#dde3ec",
  ruleStrong: "#cfd8e4",
  navy: "#101b3f",
  blue: "#1169ff",
  sky: "#32b7eb",
  teal: "#207f70",
  mint: "#2aa477",
  mintBg: "#e8f6ef",
  gold: "#b98716",
  amber: "#c47a16",
  amberBg: "#fff3dc",
  red: "#b13b3c",
  redBg: "#fff0f0",
  purple: "#5d5fef",
  purpleBg: "#f0efff",
  serif: "var(--font-serif), Georgia, serif",
  sans: "var(--font-sans), Inter, system-ui, sans-serif",
  mono: "var(--font-mono), ui-monospace, SFMono-Regular, monospace",
};

const VIEWS: Array<{
  key: TowerContractView;
  label: string;
  eyebrow: string;
}> = [
  { key: "command", label: "Command Center", eyebrow: "Posture" },
  { key: "value", label: "Value Proof Funnel", eyebrow: "Funding vs. value" },
  {
    key: "lanes",
    label: "Decision Lanes",
    eyebrow: "Fund / fix / freeze / stop",
  },
  { key: "ai", label: "AI Portfolio", eyebrow: "AI portfolio readiness" },
  {
    key: "actions",
    label: "Recommended Actions",
    eyebrow: "Executive action memo",
  },
  { key: "evidence", label: "Evidence", eyebrow: "Why this is true" },
];

const LANE_META: Record<
  DecisionLane,
  { label: string; color: string; bg: string; border: string; verb: string }
> = {
  fund: {
    label: "Fund",
    color: UX.mint,
    bg: "#e9f8f2",
    border: "#9ed9c5",
    verb: "protect or scale",
  },
  fix: {
    label: "Fix",
    color: UX.amber,
    bg: UX.amberBg,
    border: "#e5c488",
    verb: "fix proof before scaling",
  },
  freeze: {
    label: "Freeze",
    color: UX.navy,
    bg: "#eef3ff",
    border: "#b7c6f3",
    verb: "hold spend",
  },
  stop: {
    label: "Stop",
    color: UX.red,
    bg: UX.redBg,
    border: "#efb3b6",
    verb: "stop until reset",
  },
};

export function TowerCommandCenterContract({
  model,
}: {
  model: TowerMartCommandViewModel;
}) {
  const [activeView, setActiveView] = useState<TowerContractView>("command");
  const command = model.command;
  const laneCounts = useMemo(() => countLanes(model.programLanes), [model]);
  const blockingGaps = model.requiredFieldGaps.filter((gap) => gap.blocking);
  const financeValidated = command.partialFinanceValidatedValueYtd;
  const promisedNotValidated = Math.max(
    command.promisedValueFy26 - financeValidated,
    0,
  );
  const proofStatus =
    command.realizedValueYtdAllowed > 0
      ? "Claimable"
      : financeValidated > 0
        ? "Partial"
        : "Gated";

  return (
    <div
      data-testid="tower-command-center-contract"
      style={{
        minHeight: "100%",
        width: "100%",
        background: UX.page,
        color: UX.ink,
        fontFamily: UX.sans,
      }}
    >
      <div
        style={{
          maxWidth: 1680,
          margin: "0 auto",
          padding: "28px clamp(28px, 4vw, 72px) 36px",
        }}
      >
        <header style={{ marginBottom: 22 }}>
          <div style={statusLineStyle}>
            <span style={greenDotStyle} />
            <b>Active portfolio context</b>
            <span>Every visible figure traces to Tower evidence.</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 24,
              marginTop: 10,
            }}
          >
            <div>
              <div style={eyebrowStyle}>Investment Control Tower</div>
              <h1 style={heroTitleStyle}>{command.tenantName}</h1>
              <p style={heroSubStyle}>
                Funded ahead of proof. Value is the constraint.
              </p>
            </div>
            <div style={heroChipWrapStyle}>
              <HeroChip
                value={formatWhole(model.programLanes.length)}
                label="programs"
              />
              <HeroChip
                value={formatWhole(command.candidateAiOpportunities)}
                label="AI opportunities"
              />
              <HeroChip value={proofStatus} label="value proof" tone="proof" />
            </div>
          </div>
        </header>

        <nav aria-label="Tower views" style={tabBarStyle}>
          {VIEWS.map((view) => {
            const selected = activeView === view.key;
            return (
              <button
                key={view.key}
                type="button"
                onClick={() => setActiveView(view.key)}
                aria-pressed={selected}
                style={{
                  ...tabButtonStyle,
                  color: selected ? UX.ink : UX.muted,
                  borderBottomColor: selected ? UX.sky : "transparent",
                  background: selected ? "#fff" : "transparent",
                }}
              >
                <span>{view.label}</span>
              </button>
            );
          })}
        </nav>

        {activeView === "command" ? (
          <CommandView
            command={command}
            laneCounts={laneCounts}
            actions={model.cxoActions}
            gaps={blockingGaps}
            promisedNotValidated={promisedNotValidated}
          />
        ) : null}
        {activeView === "value" ? (
          <ValueView
            command={command}
            stages={model.valueFunnel}
            programRows={model.programLanes}
          />
        ) : null}
        {activeView === "lanes" ? (
          <DecisionLanesView rows={model.programLanes} />
        ) : null}
        {activeView === "ai" ? (
          <AiPortfolioView command={command} rows={model.aiPortfolio} />
        ) : null}
        {activeView === "actions" ? (
          <ActionsView actions={model.cxoActions} gaps={blockingGaps} />
        ) : null}
        {activeView === "evidence" ? (
          <EvidenceView
            evidence={model.evidenceLineage}
            gaps={model.requiredFieldGaps}
          />
        ) : null}
      </div>
    </div>
  );
}

function CommandView({
  command,
  laneCounts,
  actions,
  gaps,
  promisedNotValidated,
}: {
  command: TowerMartCommandViewModel["command"];
  laneCounts: Record<DecisionLane, number>;
  actions: TowerMartCxoAction[];
  gaps: TowerMartRequiredFieldGap[];
  promisedNotValidated: number;
}) {
  return (
    <section>
      <div style={sectionIntroStyle}>
        <div>
          <div style={eyebrowStyle}>CXO read</div>
          <h2 style={sectionTitleStyle}>What Tower is trying to say</h2>
        </div>
        <p style={sectionCopyStyle}>
          {command.executiveSummary || command.decisionQuestion}
        </p>
      </div>

      <div style={postureGridStyle}>
        <PostureCard title="Spend posture" status="Visible" tone="blue">
          <MetricHero
            value={money(command.totalItBudgetFy26)}
            label="FY26 technology budget"
          />
          <BudgetSplitChart
            run={command.runBudgetFy26}
            change={command.changeBudgetFy26}
          />
          <MetricPair
            left={`Run ${money(command.runBudgetFy26)}`}
            right={`Change ${money(command.changeBudgetFy26)}`}
          />
          <p style={cardNarrativeStyle}>
            A run-heavy posture is not automatically bad. The question is
            whether the run base can fund the evidence and data foundation
            before more AI promises are made.
          </p>
        </PostureCard>

        <PostureCard title="Value posture" status="Gated" tone="amber">
          <MetricHero
            value={money(command.realizedValueYtdAllowed)}
            label="claimable value allowed"
          />
          <ValueStackChart
            promised={command.promisedValueFy26}
            validated={command.partialFinanceValidatedValueYtd}
            claimable={command.realizedValueYtdAllowed}
          />
          <MetricPair
            left={`${money(command.promisedValueFy26)} promised`}
            right={`${money(promisedNotValidated)} needs proof`}
          />
          <p style={cardNarrativeStyle}>
            Promised value is not realized value. Tower keeps the CFO boundary
            visible until usage evidence and finance validation clear.
          </p>
        </PostureCard>

        <PostureCard title="Risk posture" status="Needs owner" tone="red">
          <MetricHero
            value={formatWhole(gaps.length)}
            label="blocking evidence asks"
          />
          <MiniGapList gaps={gaps} />
        </PostureCard>

        <PostureCard
          title="Decision posture"
          status="Act this week"
          tone="green"
        >
          <div style={laneGridStyle}>
            {(Object.keys(LANE_META) as DecisionLane[]).map((lane) => (
              <div key={lane} style={laneMetricStyle}>
                <span style={{ color: LANE_META[lane].color }}>
                  {formatWhole(laneCounts[lane] ?? 0)}
                </span>
                <small>{LANE_META[lane].label}</small>
              </div>
            ))}
          </div>
          <p style={cardNarrativeStyle}>
            Tower is not ranking projects for curiosity. It is separating what
            to protect, what to fix, what to freeze, and what should not get
            another dollar until the gate is real.
          </p>
        </PostureCard>
      </div>

      <div style={weeklyReadStyle}>
        <div style={{ ...eyebrowStyle, color: UX.sky }}>
          This week&apos;s read
        </div>
        <p>
          {money(command.totalItBudgetFy26)} is in view.{" "}
          {money(command.aiTaggedSpendFy26NonAdditive)} is AI-tagged.{" "}
          {money(command.promisedValueFy26)} is promised value.{" "}
          {money(command.realizedValueYtdAllowed)} is claimable. The issue is
          not spend visibility; it is value proof.
        </p>
      </div>

      <div style={actionPreviewGridStyle}>
        {actions.slice(0, 3).map((action) => (
          <ActionCard key={action.actionKey} action={action} />
        ))}
      </div>
    </section>
  );
}

function ValueView({
  command,
  stages,
  programRows,
}: {
  command: TowerMartCommandViewModel["command"];
  stages: TowerMartCommandViewModel["valueFunnel"];
  programRows: TowerMartProgramLane[];
}) {
  const valueRows = programRows
    .filter(
      (row) => row.promisedValueUsd > 0 || row.financeValidatedValueUsd > 0,
    )
    .sort((a, b) => b.promisedValueUsd - a.promisedValueUsd)
    .slice(0, 8);

  return (
    <section>
      <PageHeading
        eyebrow="Funding vs. value realization"
        title="Value Proof Funnel"
        copy="The funnel separates funded spend, promised value, finance-validated value, and claimable value so promised value can never be mistaken for realized value."
      />
      <div style={twoColumnStyle}>
        <Panel title="Proof ladder">
          <ValueFunnelChart stages={stages} />
        </Panel>
        <Panel title="Value proven vs. promised">
          <ProgramValueBars rows={valueRows} />
        </Panel>
      </div>
      <div style={proofBoundaryStyle}>
        <b>Read this as a CFO control:</b>{" "}
        {money(command.realizedValueYtdAllowed)} is claimable today. Anything
        above that is a promise, partial validation, or a hypothesis until
        source evidence says otherwise.
      </div>
    </section>
  );
}

function DecisionLanesView({ rows }: { rows: TowerMartProgramLane[] }) {
  const [mode, setMode] = useState<"table" | "lanes" | "heatmap">("table");
  const grouped = groupByLane(rows);

  return (
    <section>
      <PageHeading
        eyebrow="Initiative health"
        title="Portfolio Decision Lanes"
        copy="Every loaded program is placed into a decision lane from budget ties, value evidence, usage signal, claim status, and open gates."
      />
      <Segmented
        value={mode}
        options={[
          ["table", "Program table"],
          ["lanes", "Kanban lanes"],
          ["heatmap", "Portfolio heatmap"],
        ]}
        onChange={setMode}
      />
      {mode === "table" ? <DecisionProgramTable rows={rows} /> : null}
      {mode === "lanes" ? (
        <div style={laneBoardStyle}>
          {(Object.keys(LANE_META) as DecisionLane[]).map((lane) => (
            <LaneColumn key={lane} lane={lane} rows={grouped[lane]} />
          ))}
        </div>
      ) : null}
      {mode === "heatmap" ? <DecisionHeatmap rows={rows} /> : null}
    </section>
  );
}

function AiPortfolioView({
  command,
  rows,
}: {
  command: TowerMartCommandViewModel["command"];
  rows: TowerMartAiPortfolioItem[];
}) {
  const [filter, setFilter] = useState<
    "all" | "funded" | "embedded" | "candidate" | "governance" | "platform"
  >("all");
  const visible = rows.filter((row) => {
    const spendType = String(row.aiSpendType ?? "").toLowerCase();
    const category = String(row.aiSpendCategory ?? "").toLowerCase();
    if (filter === "funded")
      return row.approvedFundingUsd > 0 || row.aiTaggedSpendUsd > 0;
    if (filter === "embedded") return spendType.includes("embedded");
    if (filter === "candidate")
      return (
        row.fundingStatus === "not_approved" || spendType.includes("candidate")
      );
    if (filter === "governance") return category.includes("governance");
    if (filter === "platform")
      return category.includes("platform") || category.includes("cloud");
    return true;
  });

  return (
    <section>
      <PageHeading
        eyebrow="AI portfolio readiness"
        title="Which AI is real, embedded, or just an idea"
        copy="Tower separates approved and embedded AI spend from candidate ideas, then asks the capital-control question: what can scale with proof, what needs evidence fixed, and what must stay held?"
      />
      <Segmented
        value={filter}
        options={[
          ["all", "All"],
          ["funded", "Funded"],
          ["embedded", "Embedded"],
          ["candidate", "Candidate"],
          ["governance", "Governance"],
          ["platform", "Platform"],
        ]}
        onChange={setFilter}
      />
      <div style={twoColumnWideStyle}>
        <Panel title="Value vs. readiness">
          <AiMatrix rows={visible} />
        </Panel>
        <Panel title="AI spend lens">
          <MetricHero
            value={money(command.aiTaggedSpendFy26NonAdditive)}
            label="non-additive AI-tagged spend"
          />
          <p style={panelLeadStyle}>
            Already inside approved platform, program, governance, and
            enablement spend. Candidate ideas are not approved funding.
          </p>
          <AiCategoryBars rows={rows} />
        </Panel>
      </div>
    </section>
  );
}

function ActionsView({
  actions,
  gaps,
}: {
  actions: TowerMartCxoAction[];
  gaps: TowerMartRequiredFieldGap[];
}) {
  const grouped = actions.reduce<Record<string, TowerMartCxoAction[]>>(
    (acc, action) => {
      const key = action.ownerHint ?? "Executive owner";
      acc[key] = [...(acc[key] ?? []), action];
      return acc;
    },
    {},
  );

  return (
    <section>
      <PageHeading
        eyebrow="Executive action memo"
        title="What must happen next"
        copy="Actions are grouped by owner so Tower becomes an operating cadence, not a static dashboard."
      />
      <div style={ownerActionGridStyle}>
        {Object.entries(grouped).map(([owner, ownerActions]) => (
          <Panel key={owner} title={owner}>
            <div style={{ display: "grid", gap: 12 }}>
              {ownerActions.map((action) => (
                <ActionCard key={action.actionKey} action={action} />
              ))}
            </div>
          </Panel>
        ))}
        {gaps.length > 0 ? (
          <Panel title="Unblocked by evidence">
            <MiniGapList gaps={gaps} />
          </Panel>
        ) : null}
      </div>
    </section>
  );
}

function EvidenceView({
  evidence,
  gaps,
}: {
  evidence: TowerMartEvidenceLineage[];
  gaps: TowerMartRequiredFieldGap[];
}) {
  const sourceCount = new Set(
    evidence.map((row) => row.sourceFile).filter(Boolean),
  ).size;
  const owners = new Set(gaps.map((gap) => gap.ownerHint ?? "Unassigned"));
  return (
    <section>
      <PageHeading
        eyebrow="Evidence, as a business posture"
        title="Why the dashboard is allowed to say this"
        copy="Tower explains what evidence exists, what is missing, who must provide it, and what decision remains blocked."
      />
      <div style={evidenceGridStyle}>
        <QuestionCard
          question="What evidence exists?"
          answer={`${formatWhole(sourceCount)} evidence packages support the displayed budget, program, value, and gap posture.`}
        />
        <QuestionCard
          question="What is missing?"
          answer={`${formatWhole(gaps.length)} evidence asks remain open before Tower can strengthen claims.`}
        />
        <QuestionCard
          question="Who provides it?"
          answer={`${formatWhole(owners.size)} owner group${owners.size === 1 ? "" : "s"} must close the missing proof.`}
        />
        <QuestionCard
          question="What stays blocked?"
          answer="Outcome-proof language stays blocked until source evidence and finance validation explicitly allow it."
        />
      </div>
      <Panel title="Evidence trace">
        <div style={traceListStyle}>
          {evidence.slice(0, 14).map((row) => (
            <div key={row.lineageKey} style={traceRowStyle}>
              <div>
                <b>{row.displayedFact}</b>
                <p>
                  {row.caveat || "Evidence supports the displayed posture."}
                </p>
              </div>
              <span>{row.sourceFile ?? "source pending"}</span>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function BudgetSplitChart({ run, change }: { run: number; change: number }) {
  const data = [{ name: "budget", Run: run, Change: change }];
  return (
    <div style={{ height: 78, marginTop: 18 }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={1}
        minHeight={1}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <XAxis type="number" hide domain={[0, Math.max(run + change, 1)]} />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip formatter={(value) => money(Number(value))} cursor={false} />
          <Bar
            dataKey="Run"
            stackId="budget"
            fill="#ece9df"
            radius={[8, 0, 0, 8]}
          >
            <LabelList
              dataKey="Run"
              formatter={(value) => `Run ${moneyLabel(value)}`}
              position="inside"
              fill={UX.ink}
              fontSize={12}
              fontWeight={800}
            />
          </Bar>
          <Bar
            dataKey="Change"
            stackId="budget"
            fill={UX.teal}
            radius={[0, 8, 8, 0]}
          >
            <LabelList
              dataKey="Change"
              formatter={(value) => `Change ${moneyLabel(value)}`}
              position="inside"
              fill="#fff"
              fontSize={12}
              fontWeight={800}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ValueStackChart({
  promised,
  validated,
  claimable,
}: {
  promised: number;
  validated: number;
  claimable: number;
}) {
  const data = [
    { name: "Promised", value: promised, fill: UX.mint },
    { name: "Validated", value: validated, fill: UX.amber },
    { name: "Claimable", value: claimable, fill: UX.red },
  ];
  return (
    <div style={{ height: 150, marginTop: 14 }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={1}
        minHeight={1}
      >
        <BarChart
          data={data}
          margin={{ top: 8, right: 10, bottom: 12, left: 0 }}
        >
          <CartesianGrid stroke={UX.faint} vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <YAxis hide />
          <Tooltip
            formatter={(value) => money(Number(value))}
            cursor={{ fill: "rgba(15,23,42,.04)" }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((row) => (
              <Cell key={row.name} fill={row.fill} />
            ))}
            <LabelList
              dataKey="value"
              formatter={moneyLabel}
              position="top"
              fill={UX.ink}
              fontSize={12}
              fontWeight={850}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ValueFunnelChart({
  stages,
}: {
  stages: TowerMartCommandViewModel["valueFunnel"];
}) {
  const data = stages.map((stage) => ({
    name: compactLabel(stage.stageLabel),
    value: stage.valueNumeric,
    status: stage.claimStatus,
  }));
  return (
    <div style={{ height: 360 }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={1}
        minHeight={1}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 38, bottom: 8, left: 124 }}
        >
          <CartesianGrid stroke={UX.faint} horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={money}
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={118}
          />
          <Tooltip formatter={(value) => money(Number(value))} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} fill={UX.teal}>
            <LabelList
              dataKey="value"
              formatter={moneyLabel}
              position="right"
              fill={UX.ink}
              fontSize={12}
              fontWeight={850}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProgramValueBars({ rows }: { rows: TowerMartProgramLane[] }) {
  if (rows.length === 0)
    return (
      <EmptyBusinessState text="No promised-value program is available for this view." />
    );
  const data = rows.map((row) => ({
    name: row.programName,
    promised: row.promisedValueUsd,
    validated: row.financeValidatedValueUsd,
    pct:
      row.promisedValueUsd > 0
        ? Math.round(
            (row.financeValidatedValueUsd / row.promisedValueUsd) * 100,
          )
        : 0,
  }));
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {data.map((row) => (
        <div key={row.name}>
          <div style={barHeaderStyle}>
            <b>{row.name}</b>
            <span>{row.pct}% validated</span>
          </div>
          <div style={barTrackStyle}>
            <span
              style={{
                ...barFillStyle,
                width: `${Math.max(3, Math.min(row.pct, 100))}%`,
              }}
            />
          </div>
          <small style={mutedSmallStyle}>
            {money(row.validated)} validated of {money(row.promised)} promised
          </small>
        </div>
      ))}
    </div>
  );
}

function DecisionHeatmap({ rows }: { rows: TowerMartProgramLane[] }) {
  const data = (Object.keys(LANE_META) as DecisionLane[]).map((lane) => {
    const laneRows = rows.filter((row) => row.decisionLane === lane);
    return {
      lane: LANE_META[lane].label,
      spend: laneRows.reduce((sum, row) => sum + row.approvedFundingUsd, 0),
      promised: laneRows.reduce((sum, row) => sum + row.promisedValueUsd, 0),
      fill: LANE_META[lane].color,
    };
  });
  return (
    <Panel title="Lane exposure">
      <div style={{ height: 360 }}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={1}
          minHeight={1}
        >
          <BarChart
            data={data}
            margin={{ top: 12, right: 26, bottom: 10, left: 8 }}
          >
            <CartesianGrid stroke={UX.faint} vertical={false} />
            <XAxis dataKey="lane" tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={money}
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />
            <Tooltip formatter={(value) => money(Number(value))} />
            <Legend />
            <Bar dataKey="spend" name="Funded" radius={[8, 8, 0, 0]}>
              {data.map((row) => (
                <Cell key={row.lane} fill={row.fill} />
              ))}
            </Bar>
            <Bar
              dataKey="promised"
              name="Promised value"
              fill={UX.navy}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function AiMatrix({ rows }: { rows: TowerMartAiPortfolioItem[] }) {
  const plotted = rows
    .slice()
    .sort(
      (a, b) =>
        b.valueScore + b.readinessScore - (a.valueScore + a.readinessScore),
    )
    .slice(0, 16)
    .map((row, index) => ({
      ...row,
      plotId: index + 1,
      z: Math.max(
        row.aiTaggedSpendUsd || row.approvedFundingUsd || row.promisedValueUsd,
        1,
      ),
    }));
  if (plotted.length === 0) {
    return (
      <EmptyBusinessState text="No AI portfolio item is available for this lens." />
    );
  }
  return (
    <>
      <div style={{ height: 420 }}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={1}
          minHeight={1}
        >
          <ScatterChart margin={{ top: 20, right: 26, bottom: 30, left: 22 }}>
            <CartesianGrid stroke={UX.faint} />
            <XAxis
              type="number"
              dataKey="readinessScore"
              name="Readiness"
              domain={[0, 10]}
              tickCount={6}
              tickLine={false}
              axisLine={false}
              label={{
                value: "Readiness",
                position: "insideBottom",
                offset: -14,
              }}
            />
            <YAxis
              type="number"
              dataKey="valueScore"
              name="Value"
              domain={[0, 10]}
              tickCount={6}
              tickLine={false}
              axisLine={false}
              label={{ value: "Value", angle: -90, position: "insideLeft" }}
            />
            <ZAxis dataKey="z" range={[220, 980]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value, name) =>
                name === "z" ? money(Number(value)) : String(value)
              }
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.itemName ?? "AI item"
              }
            />
            <Scatter data={plotted} fill={UX.navy}>
              {plotted.map((row) => (
                <Cell
                  key={row.aiPortfolioKey}
                  fill={LANE_META[row.decisionLane].color}
                />
              ))}
              <LabelList
                dataKey="plotId"
                position="center"
                fill="#fff"
                fontSize={11}
                fontWeight={900}
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div style={legendGridStyle}>
        {plotted.map((row) => (
          <div key={row.aiPortfolioKey} style={legendItemStyle}>
            <span style={{ background: LANE_META[row.decisionLane].color }}>
              {row.plotId}
            </span>
            <b>{row.itemName}</b>
          </div>
        ))}
      </div>
      {rows.length > plotted.length ? (
        <p style={mutedSmallStyle}>
          Showing the top {plotted.length} plotted opportunities. Use the list
          view for the full portfolio.
        </p>
      ) : null}
    </>
  );
}

function AiCategoryBars({ rows }: { rows: TowerMartAiPortfolioItem[] }) {
  const buckets = rows.reduce<Record<string, number>>((acc, row) => {
    const key = humanCategory(
      row.aiSpendCategory ?? row.aiSpendType ?? row.itemKind,
    );
    acc[key] =
      (acc[key] ?? 0) +
      Math.max(row.aiTaggedSpendUsd, row.approvedFundingUsd, 0);
    return acc;
  }, {});
  const data = Object.entries(buckets)
    .map(([name, value]) => ({ name, value }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  if (data.length === 0) {
    return (
      <EmptyBusinessState text="AI spend is not tied to categories yet." />
    );
  }
  return (
    <div style={{ height: 280 }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={1}
        minHeight={1}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 36, bottom: 8, left: 138 }}
        >
          <CartesianGrid stroke={UX.faint} horizontal={false} />
          <XAxis type="number" tickFormatter={money} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={132}
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <Tooltip formatter={(value) => money(Number(value))} />
          <Bar dataKey="value" fill={UX.teal} radius={[0, 8, 8, 0]}>
            <LabelList
              dataKey="value"
              formatter={moneyLabel}
              position="right"
              fill={UX.ink}
              fontSize={11}
              fontWeight={850}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DecisionProgramTable({ rows }: { rows: TowerMartProgramLane[] }) {
  return (
    <Panel title="Program table">
      <div style={{ overflowX: "auto" }}>
        <table style={programTableStyle}>
          <thead>
            <tr>
              {[
                "Program",
                "Lane",
                "Funded",
                "Promised",
                "Proof",
                "Usage",
                "Blocked",
                "Next gate",
              ].map((heading) => (
                <th key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.laneKey}>
                <td>
                  <b>{row.programName}</b>
                  <small>{row.ownerRole ?? "Owner not named"}</small>
                </td>
                <td>
                  <LaneBadge lane={row.decisionLane} />
                </td>
                <td>{money(row.approvedFundingUsd)}</td>
                <td>{money(row.promisedValueUsd)}</td>
                <td>{proofLabel(row)}</td>
                <td>{usageLabel(row)}</td>
                <td>{blockedLabel(row)}</td>
                <td>{nextGate(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function LaneColumn({
  lane,
  rows,
}: {
  lane: DecisionLane;
  rows: TowerMartProgramLane[];
}) {
  const meta = LANE_META[lane];
  return (
    <section
      style={{
        ...laneColumnStyle,
        background: meta.bg,
        borderColor: meta.border,
      }}
    >
      <div style={laneColumnHeadStyle}>
        <h3>{meta.label}</h3>
        <span style={{ color: meta.color }}>
          {formatWhole(rows.length)} programs
        </span>
      </div>
      <p>{meta.verb}.</p>
      <div style={{ display: "grid", gap: 10 }}>
        {rows.slice(0, 6).map((row) => (
          <div key={row.laneKey} style={laneCardStyle}>
            <strong>{row.programName}</strong>
            <span>{money(row.approvedFundingUsd)}</span>
            <small>{nextGate(row)}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniGapList({ gaps }: { gaps: TowerMartRequiredFieldGap[] }) {
  const visible = gaps.slice(0, 4);
  if (visible.length === 0) {
    return (
      <p style={cardNarrativeStyle}>
        No blocking evidence ask is visible for this view. Outcome claims still
        depend on source evidence and finance validation.
      </p>
    );
  }
  return (
    <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
      {visible.map((gap) => (
        <div key={gap.gapKey} style={gapRowStyle}>
          <b>{plainField(gap.requiredField)}</b>
          <span>{gap.ownerHint ?? "Unassigned"}</span>
          <small>{gap.remediationAction}</small>
        </div>
      ))}
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div style={{ margin: "28px 0 22px" }}>
      <div style={eyebrowStyle}>{eyebrow}</div>
      <h2 style={viewTitleStyle}>{title}</h2>
      <p style={viewCopyStyle}>{copy}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={panelStyle}>
      <h3 style={panelTitleStyle}>{title}</h3>
      {children}
    </section>
  );
}

function PostureCard({
  title,
  status,
  tone,
  children,
}: {
  title: string;
  status: string;
  tone: "blue" | "green" | "amber" | "red";
  children: ReactNode;
}) {
  const color =
    tone === "blue"
      ? UX.blue
      : tone === "green"
        ? UX.mint
        : tone === "amber"
          ? UX.amber
          : UX.red;
  return (
    <section style={postureCardStyle}>
      <div style={cardHeaderStyle}>
        <h3>{title}</h3>
        <span
          style={{ color, borderColor: `${color}44`, background: `${color}12` }}
        >
          {status}
        </span>
      </div>
      {children}
    </section>
  );
}

function MetricHero({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div style={metricHeroStyle}>{value}</div>
      <div style={metricLabelStyle}>{label}</div>
    </div>
  );
}

function MetricPair({ left, right }: { left: string; right: string }) {
  return (
    <div style={metricPairStyle}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

function HeroChip({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone?: "proof";
}) {
  return (
    <div style={{ ...heroChipStyle, borderColor: tone ? "#cfdce8" : UX.rule }}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function LaneBadge({ lane }: { lane: DecisionLane }) {
  const meta = LANE_META[lane];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "4px 9px",
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
        fontSize: 12,
        fontWeight: 850,
      }}
    >
      {meta.label}
    </span>
  );
}

function ActionCard({ action }: { action: TowerMartCxoAction }) {
  return (
    <div style={actionCardStyle}>
      <div style={eyebrowStyle}>{action.actionLane}</div>
      <h3>{action.title}</h3>
      <p>{action.actionBody}</p>
      <span>
        {action.moduleHandoff ?? action.ownerHint ?? "Executive owner"}
      </span>
    </div>
  );
}

function QuestionCard({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <div style={questionCardStyle}>
      <div style={eyebrowStyle}>{question}</div>
      <p>{answer}</p>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<[T, string]>;
  onChange: (value: T) => void;
}) {
  return (
    <div style={segmentedStyle}>
      {options.map(([key, label]) => {
        const selected = key === value;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              ...segmentButtonStyle,
              background: selected ? UX.ink : "transparent",
              color: selected ? "#fff" : UX.ink2,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function EmptyBusinessState({ text }: { text: string }) {
  return <p style={{ ...panelLeadStyle, color: UX.muted }}>{text}</p>;
}

function countLanes(
  rows: TowerMartProgramLane[],
): Record<DecisionLane, number> {
  return rows.reduce(
    (acc, row) => {
      acc[row.decisionLane] += 1;
      return acc;
    },
    { fund: 0, fix: 0, freeze: 0, stop: 0 },
  );
}

function groupByLane(
  rows: TowerMartProgramLane[],
): Record<DecisionLane, TowerMartProgramLane[]> {
  return rows.reduce(
    (acc, row) => {
      acc[row.decisionLane].push(row);
      return acc;
    },
    { fund: [], fix: [], freeze: [], stop: [] } as Record<
      DecisionLane,
      TowerMartProgramLane[]
    >,
  );
}

function money(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function moneyLabel(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value)
    ? money(value)
    : "";
}

function formatWhole(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function compactLabel(value: string): string {
  return value
    .replace(/finance-validated/gi, "validated")
    .replace(/realized value allowed/gi, "claimable")
    .replace(/fy26/gi, "")
    .trim();
}

function humanCategory(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace("Ai", "AI");
}

function plainField(value: string): string {
  return value.replace(/_/g, " ");
}

function proofLabel(row: TowerMartProgramLane): string {
  if (String(row.towerClaimAllowed).toLowerCase() === "allowed") {
    return "claimable";
  }
  if (row.financeValidatedValueUsd > 0) return "partial";
  return humanCategory(row.valueClaimStatus || "not claimable");
}

function usageLabel(row: TowerMartProgramLane): string {
  if (row.adoptionRatePct !== null)
    return `${Math.round(row.adoptionRatePct)}% adoption`;
  if (row.usageActual !== null)
    return `${formatWhole(row.usageActual)} ${row.usageMetric ?? "usage"}`;
  return "usage not loaded";
}

function blockedLabel(row: TowerMartProgramLane): string {
  if (String(row.towerClaimAllowed).toLowerCase() === "allowed") return "none";
  if (row.promisedValueUsd > row.financeValidatedValueUsd) {
    return `${money(row.promisedValueUsd - row.financeValidatedValueUsd)} needs proof`;
  }
  return "value claim gated";
}

function nextGate(row: TowerMartProgramLane): string {
  const [firstGate] = row.requiredGates;
  if (firstGate) {
    const candidate =
      firstGate.remediationAction ??
      firstGate.action ??
      firstGate.label ??
      firstGate.field ??
      firstGate.requiredField;
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return row.decisionRationale || "Name owner and confirm evidence.";
}

const statusLineStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: UX.ink2,
  fontSize: 13,
};

const greenDotStyle: CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: 999,
  background: UX.mint,
};

const eyebrowStyle: CSSProperties = {
  fontFamily: UX.mono,
  fontSize: 10,
  letterSpacing: "1.7px",
  textTransform: "uppercase",
  color: UX.gold,
  fontWeight: 900,
};

const heroTitleStyle: CSSProperties = {
  margin: "8px 0 0",
  fontFamily: UX.serif,
  fontSize: 48,
  lineHeight: 0.98,
  letterSpacing: "-0.03em",
  fontWeight: 780,
};

const heroSubStyle: CSSProperties = {
  margin: "10px 0 0",
  color: UX.ink2,
  fontSize: 17,
};

const heroChipWrapStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const heroChipStyle: CSSProperties = {
  border: `1px solid ${UX.rule}`,
  borderRadius: 14,
  background: "#fff",
  padding: "11px 14px",
  minWidth: 120,
  display: "grid",
  gap: 3,
  boxShadow: "0 16px 36px rgba(15,23,42,.06)",
};

const tabBarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  borderBottom: `1px solid ${UX.rule}`,
  marginBottom: 26,
  overflowX: "auto",
};

const tabButtonStyle: CSSProperties = {
  border: "none",
  borderBottom: "3px solid transparent",
  padding: "14px 16px",
  fontWeight: 850,
  fontSize: 14,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const sectionIntroStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(260px, .5fr) minmax(360px, 1fr)",
  gap: 24,
  alignItems: "end",
  marginBottom: 18,
};

const sectionTitleStyle: CSSProperties = {
  margin: "6px 0 0",
  fontFamily: UX.serif,
  fontSize: 34,
  lineHeight: 1.05,
};

const sectionCopyStyle: CSSProperties = {
  margin: 0,
  color: UX.ink2,
  fontSize: 15,
  lineHeight: 1.55,
};

const postureGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 14,
  alignItems: "stretch",
};

const postureCardStyle: CSSProperties = {
  border: `1px solid ${UX.ruleStrong}`,
  borderRadius: 18,
  background: UX.panel,
  padding: 18,
  boxShadow: "0 22px 46px rgba(15,23,42,.07)",
  minHeight: 300,
};

const cardHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const metricHeroStyle: CSSProperties = {
  marginTop: 12,
  fontFamily: UX.serif,
  fontSize: 39,
  lineHeight: 1,
  fontWeight: 850,
};

const metricLabelStyle: CSSProperties = {
  marginTop: 6,
  color: UX.ink2,
  fontSize: 13,
  fontWeight: 760,
};

const cardNarrativeStyle: CSSProperties = {
  margin: "12px 0 0",
  color: UX.ink2,
  fontSize: 13.5,
  lineHeight: 1.5,
};

const metricPairStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontSize: 12.5,
  color: UX.ink2,
  fontWeight: 780,
};

const laneGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  marginTop: 16,
};

const laneMetricStyle: CSSProperties = {
  border: `1px solid ${UX.rule}`,
  borderRadius: 14,
  background: "#fff",
  padding: 12,
  display: "grid",
  gap: 4,
};

const gapRowStyle: CSSProperties = {
  border: `1px solid ${UX.rule}`,
  borderRadius: 12,
  background: "#fff",
  padding: 10,
  display: "grid",
  gap: 4,
  color: UX.ink2,
  fontSize: 12.5,
};

const weeklyReadStyle: CSSProperties = {
  marginTop: 18,
  border: `1px solid rgba(32,127,112,.28)`,
  borderLeft: `4px solid ${UX.mint}`,
  borderRadius: 18,
  background: UX.mintBg,
  padding: "18px 20px",
};

const actionPreviewGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 14,
  marginTop: 18,
};

const viewTitleStyle: CSSProperties = {
  margin: "7px 0 0",
  fontFamily: UX.serif,
  fontSize: 42,
  lineHeight: 1.02,
  letterSpacing: "-0.025em",
};

const viewCopyStyle: CSSProperties = {
  margin: "10px 0 0",
  color: UX.ink2,
  maxWidth: 980,
  fontSize: 16,
  lineHeight: 1.5,
};

const twoColumnStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(360px, .9fr) minmax(500px, 1.1fr)",
  gap: 16,
};

const twoColumnWideStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(540px, 1.25fr) minmax(380px, .75fr)",
  gap: 16,
};

const panelStyle: CSSProperties = {
  border: `1px solid ${UX.ruleStrong}`,
  borderRadius: 18,
  background: UX.panel,
  padding: 20,
  boxShadow: "0 20px 44px rgba(15,23,42,.06)",
};

const panelTitleStyle: CSSProperties = {
  margin: "0 0 16px",
  fontSize: 18,
  fontWeight: 900,
};

const panelLeadStyle: CSSProperties = {
  color: UX.ink2,
  fontSize: 15,
  lineHeight: 1.45,
};

const proofBoundaryStyle: CSSProperties = {
  marginTop: 18,
  border: `1px solid ${UX.ruleStrong}`,
  borderRadius: 16,
  background: "#fff",
  padding: 18,
  color: UX.ink2,
  lineHeight: 1.5,
};

const segmentedStyle: CSSProperties = {
  display: "inline-flex",
  gap: 4,
  padding: 4,
  borderRadius: 999,
  background: "#eef2f7",
  marginBottom: 18,
};

const segmentButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 999,
  padding: "8px 13px",
  fontWeight: 820,
  cursor: "pointer",
};

const programTableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const laneBoardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
  gap: 14,
};

const laneColumnStyle: CSSProperties = {
  border: "1px solid",
  borderRadius: 18,
  padding: 16,
  minHeight: 280,
};

const laneColumnHeadStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 12,
};

const laneCardStyle: CSSProperties = {
  border: `1px solid ${UX.rule}`,
  borderRadius: 14,
  background: "#fff",
  padding: 12,
  display: "grid",
  gap: 6,
};

const barHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontSize: 13.5,
};

const barTrackStyle: CSSProperties = {
  position: "relative",
  height: 10,
  background: "#ebe9e2",
  borderRadius: 999,
  overflow: "hidden",
  margin: "6px 0 4px",
};

const barFillStyle: CSSProperties = {
  display: "block",
  height: "100%",
  background: UX.mint,
  borderRadius: 999,
};

const mutedSmallStyle: CSSProperties = {
  color: UX.muted,
  fontSize: 12,
};

const legendGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
  marginTop: 8,
};

const legendItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "24px 1fr",
  gap: 8,
  alignItems: "center",
  color: UX.ink2,
  fontSize: 12.5,
};

const ownerActionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 16,
};

const actionCardStyle: CSSProperties = {
  border: `1px solid ${UX.rule}`,
  borderRadius: 16,
  background: "#fff",
  padding: 16,
  display: "grid",
  gap: 8,
};

const evidenceGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 14,
  marginBottom: 16,
};

const questionCardStyle: CSSProperties = {
  border: `1px solid ${UX.ruleStrong}`,
  borderRadius: 16,
  background: "#fff",
  padding: 16,
};

const traceListStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

const traceRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 1fr) minmax(160px, .35fr)",
  gap: 14,
  borderBottom: `1px solid ${UX.rule}`,
  paddingBottom: 10,
};

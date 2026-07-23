"use client";

// Tab 4 — AI Portfolio. Four sub-views: Integrated (default), Bubble matrix,
// Spend lens, Initiative table. Transcribed from `viewAI()` (design line ~903).
//
// The type filter chips apply to every sub-view EXCEPT Spend lens, which is a
// whole-portfolio category breakdown — filtering it would misrepresent the
// AI-tagged total. That exception is the design's, and it is deliberate.

import { formatUsdM } from "@/lib/tower/command-center/format";
import type {
  TowerAiKind,
  TowerAiView,
  TowerCommandCenterView,
} from "@/lib/tower/command-center/types";

import {
  AiBubbleMatrixChart,
  bubbleTextAlternative,
} from "../charts/AiBubbleMatrixChart";
import {
  AiSpendLensChart,
  spendLensTextAlternative,
} from "../charts/AiSpendLensChart";
import {
  AI_KIND_HEX,
  AI_KIND_WORD,
  Card,
  Chip,
  SubNav,
  ViewHead,
  cx,
} from "../primitives";
import styles from "../TowerCommandCenter.module.css";

export type AiSubView = "overview" | "bubble" | "lens" | "table";
export type AiFilter = "all" | TowerAiKind;

export const AI_SUB_VIEWS: ReadonlyArray<readonly [AiSubView, string]> = [
  ["overview", "Funded & Embedded"],
  ["bubble", "Usage & Value Proof"],
  ["lens", "Spend Attribution"],
  ["table", "Candidate Pipeline"],
];

const AI_FILTERS: ReadonlyArray<readonly [AiFilter, string]> = [
  ["all", "All"],
  ["funded", "Funded"],
  ["embedded", "Embedded"],
  ["governance", "Governance"],
  ["platform", "Platform"],
];

function applyFilter(
  items: readonly TowerAiView[],
  filter: AiFilter,
): TowerAiView[] {
  return filter === "all" ? [...items] : items.filter((a) => a.kind === filter);
}

// ── pieces ─────────────────────────────────────────────────────────────────

function BubblePanel({
  items,
  sizeMode,
  onOpenAi,
}: {
  items: readonly TowerAiView[];
  sizeMode: "spend" | "constant";
  onOpenAi: (n: number) => void;
}) {
  return (
    <>
      <div className={styles.chartwrap} aria-describedby="tcc-bubble-alt">
        <AiBubbleMatrixChart
          items={items}
          sizeMode={sizeMode}
          onSelect={onOpenAi}
        />
      </div>
      <p id="tcc-bubble-alt" className={styles.srOnly}>
        {bubbleTextAlternative(items, sizeMode)}
      </p>
      <div className={styles.legend}>
        {(["funded", "embedded", "governance", "platform"] as const).map(
          (kind) => (
            <span key={kind}>
              <i style={{ background: AI_KIND_HEX[kind] }} />
              {AI_KIND_WORD[kind]}
            </span>
          ),
        )}
      </div>
    </>
  );
}

function AiLegendList({
  items,
  onOpenAi,
}: {
  items: readonly TowerAiView[];
  onOpenAi: (n: number) => void;
}) {
  return (
    <div className={styles.pool}>
      {[...items]
        .sort((a, b) => a.n - b.n)
        .map((a) => (
          <button
            key={a.id}
            type="button"
            className={cx(styles.poolrow, styles.solid)}
            onClick={() => onOpenAi(a.n)}
          >
            <span
              className={cx(styles.prN, styles.badge)}
              style={{ background: AI_KIND_HEX[a.kind] }}
            >
              {a.n}
            </span>
            <span className={styles.prNm}>
              {a.name}
              <small>
                {a.vendor ?? "No vendor recorded"} · {formatUsdM(a.aiSpendUsd)}{" "}
                · {a.posture}
              </small>
            </span>
          </button>
        ))}
    </div>
  );
}

function CandidatePipelinePanel({ view }: { view: TowerCommandCenterView }) {
  const counts = view.portfolioCounts;
  return (
    <div className={styles.pool}>
      {view.candidates.length === 0 ? (
        <p className={styles.lhSub}>No candidate AI opportunities recorded.</p>
      ) : (
        view.candidates.map((c) => (
          <div
            key={c.id}
            className={styles.poolrow}
            style={{ cursor: "default" }}
          >
            <span className={styles.prN}>{c.n}</span>
            <span className={styles.prNm}>
              {c.name}
              <small>
                Value {c.strategicAttractiveness}/100 · feasibility{" "}
                {c.executionFeasibility}
                /100 · evidence {c.evidenceStrength}/100 · risk{" "}
                {c.dependencyRisk}/100
              </small>
              <small>
                {c.reasonSelected}. {c.reason}
              </small>
            </span>
            <Chip tone="gray" mono>
              {c.classification}
            </Chip>
          </div>
        ))
      )}
      {counts.exclusionReasons.length > 0 ? (
        <p className={styles.lhSub}>{counts.exclusionReasons.join(" · ")}</p>
      ) : null}
    </div>
  );
}

/**
 * Shown in place of the spend lens when `mart_ai_portfolio` carries no per-item
 * spend. Drawing an empty bar chart beneath a "$53.7M AI-tagged" header would
 * assert a breakdown the mart cannot substantiate.
 */
function SpendUnattributed({ aiTagged }: { aiTagged: string }) {
  return (
    <div className={styles.emptyPanel}>
      <h2>AI spend is portfolio-only today</h2>
      <p>
        {aiTagged} is tagged to AI-related spend, but none is currently
        attributable to a specific initiative. This view supports position and
        value-readiness evidence, not spend concentration, until the governed
        attribution mart exists.
      </p>
    </div>
  );
}

// ── the view ───────────────────────────────────────────────────────────────

export function AiPortfolioView({
  view,
  subView,
  onSubView,
  filter,
  onFilter,
  onOpenAi,
}: {
  view: TowerCommandCenterView;
  subView: AiSubView;
  onSubView: (next: AiSubView) => void;
  filter: AiFilter;
  onFilter: (next: AiFilter) => void;
  onOpenAi: (n: number) => void;
}) {
  const filtered = applyFilter(view.ai, filter);
  const showChips = subView === "overview" || subView === "bubble";
  const aiTagged = formatUsdM(view.summary.aiTaggedUsd);
  const sizeMode = view.summary.aiSpendUnattributed ? "constant" : "spend";
  const fundedCount = view.ai.filter((a) => a.kind === "funded").length;
  const embeddedCount = view.ai.filter((a) => a.kind === "embedded").length;
  const candidateRight = `${view.portfolioCounts.displayCandidateCount} shown of ${view.portfolioCounts.totalCandidateCount} candidates`;
  const matrixRight =
    sizeMode === "constant"
      ? "value potential × readiness · constant radius"
      : "value potential × readiness · size = attributed spend";

  let body: React.ReactNode;
  if (subView === "overview") {
    body = (
      <div
        className={styles.ccLower}
        style={{ gridTemplateColumns: "1.22fr 1fr", flex: 1 }}
      >
        <Card
          eyebrow="Funded & embedded portfolio"
          right={matrixRight}
          headId="tcc-ai-bubble"
          bodyStyle={{ display: "flex", flexDirection: "column" }}
        >
          <BubblePanel
            items={filtered}
            sizeMode={sizeMode}
            onOpenAi={onOpenAi}
          />
        </Card>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            minHeight: 0,
          }}
        >
          <Card
            title="AI spend lens"
            right={`${aiTagged} AI-tagged`}
            headId="tcc-ai-lens-mini"
            style={{ flex: 1.1 }}
            bodyStyle={{
              padding: "12px 14px 8px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {view.summary.aiSpendUnattributed ? (
              <SpendUnattributed aiTagged={aiTagged} />
            ) : (
              <div className={styles.chartwrap}>
                <AiSpendLensChart rows={view.spendLens} />
              </div>
            )}
          </Card>
          <Card
            eyebrow="Candidate Pipeline"
            right={candidateRight}
            headId="tcc-ai-pool"
            style={{ flex: 1 }}
            bodyClassName={styles.scroll}
            bodyStyle={{ paddingTop: 12 }}
          >
            <p className={styles.lhSub} style={{ marginBottom: 10 }}>
              {fundedCount === 0
                ? "No funded AI programs are represented. "
                : `${fundedCount} funded AI program${fundedCount === 1 ? " is" : "s are"} represented. `}
              {embeddedCount} embedded or usage-linked capabilit
              {embeddedCount === 1 ? "y carries" : "ies carry"} the current
              value evidence. The broader pool contains{" "}
              {view.portfolioCounts.totalCandidateCount} unfunded candidate
              opportunities.
            </p>
            <CandidatePipelinePanel view={view} />
          </Card>
        </div>
      </div>
    );
  } else if (subView === "bubble") {
    body = (
      <div
        className={styles.ccLower}
        style={{ gridTemplateColumns: "1fr 320px", flex: 1 }}
      >
        <Card
          eyebrow="Usage & value proof"
          right={matrixRight}
          headId="tcc-ai-bubble-full"
          bodyStyle={{ display: "flex", flexDirection: "column" }}
        >
          <BubblePanel
            items={filtered}
            sizeMode={sizeMode}
            onOpenAi={onOpenAi}
          />
        </Card>
        <Card
          title="Initiatives"
          right="numbered on the matrix"
          headId="tcc-ai-legend"
          bodyClassName={styles.scroll}
          bodyStyle={{ padding: "10px 12px" }}
        >
          <AiLegendList items={filtered} onOpenAi={onOpenAi} />
        </Card>
      </div>
    );
  } else if (subView === "lens") {
    body = (
      <Card
        title="AI spend lens by category"
        right={`${aiTagged} AI-tagged · whole portfolio, unfiltered`}
        headId="tcc-ai-lens"
        style={{ flex: 1 }}
        bodyStyle={{
          display: "flex",
          flexDirection: "column",
          padding: "18px 22px",
        }}
      >
        {view.summary.aiSpendUnattributed ? (
          <SpendUnattributed aiTagged={aiTagged} />
        ) : (
          <>
            <div className={styles.chartwrap} aria-describedby="tcc-lens-alt">
              <AiSpendLensChart rows={view.spendLens} />
            </div>
            <p id="tcc-lens-alt" className={styles.srOnly}>
              {spendLensTextAlternative(view.spendLens)}
            </p>
          </>
        )}
        <div className={styles.legend} style={{ marginTop: 12 }}>
          {view.summary.aiSpendUnattributed
            ? null
            : (["funded", "embedded", "governance", "platform"] as const).map(
                (kind) => (
                  <span key={kind}>
                    <i style={{ background: AI_KIND_HEX[kind] }} />
                    {AI_KIND_WORD[kind]}
                  </span>
                ),
              )}
        </div>
      </Card>
    );
  } else {
    body = (
      <Card
        title="Candidate Pipeline"
        right={candidateRight}
        headId="tcc-ai-table"
        style={{ flex: 1 }}
        bodyClassName={styles.scroll}
        bodyStyle={{ paddingTop: 8 }}
      >
        <CandidatePipelinePanel view={view} />
      </Card>
    );
  }

  return (
    <div className={styles.view}>
      <ViewHead
        title="Which AI is real, embedded, or just an idea"
        hint={
          showChips
            ? "Candidates are separated from the default portfolio so unfunded ideas do not overwhelm value evidence"
            : "Spend attribution and candidate pipeline are whole-portfolio views — type filters do not apply"
        }
      >
        <SubNav
          label="AI Portfolio view"
          value={subView}
          options={AI_SUB_VIEWS}
          onChange={onSubView}
        />
      </ViewHead>

      {showChips ? (
        <div
          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
          role="radiogroup"
          aria-label="AI spend type filter"
        >
          {AI_FILTERS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={filter === id}
              className={cx(
                styles.chip,
                filter === id ? styles.cBlue : styles.cGray,
              )}
              onClick={() => onFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {body}
    </div>
  );
}

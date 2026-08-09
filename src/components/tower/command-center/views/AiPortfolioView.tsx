"use client";

// Tab 4 — AI Portfolio. Four sub-views: Integrated (default), Bubble matrix,
// Spend lens, capability inventory. Transcribed from `viewAI()` (design line ~903).
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
  AI_KIND_CHIP_TONE,
  AI_KIND_HEX,
  AI_KIND_WORD,
  Card,
  Chip,
  Dot,
  MiniMeter,
  SubNav,
  ViewHead,
  cx,
} from "../primitives";
import styles from "../TowerCommandCenter.module.css";

export type AiSubView = "overview" | "bubble" | "lens" | "table" | "all";
export type AiFilter = "all" | TowerAiKind;

export const AI_SUB_VIEWS: ReadonlyArray<readonly [AiSubView, string]> = [
  ["overview", "Funded & Embedded"],
  ["bubble", "Usage & Value Proof"],
  ["lens", "Spend Attribution"],
  ["table", "Candidate Pipeline"],
  ["all", "Capability inventory"],
];

const AI_FILTERS: ReadonlyArray<readonly [AiFilter, string]> = [
  ["all", "All"],
  ["funded", "Funded"],
  ["embedded", "Embedded"],
  ["governance", "Governance"],
  ["platform", "Platform"],
];

const AI_MATRIX_DISPLAY_LIMIT = 10;
const AI_VENDOR_DISPLAY_LIMIT = 3;

interface AiVendorAttribution {
  vendor: string;
  spendUsd: number;
  systems: readonly string[];
}

function applyFilter(
  items: readonly TowerAiView[],
  filter: AiFilter,
): TowerAiView[] {
  return filter === "all" ? [...items] : items.filter((a) => a.kind === filter);
}

function topMatrixItems(items: readonly TowerAiView[]): TowerAiView[] {
  return [...items]
    .sort(
      (a, b) =>
        b.valueScore - a.valueScore ||
        b.readinessScore - a.readinessScore ||
        b.financeValidatedUsd - a.financeValidatedUsd ||
        b.promisedUsd - a.promisedUsd ||
        a.name.localeCompare(b.name),
    )
    .slice(0, AI_MATRIX_DISPLAY_LIMIT);
}

export function topVendorAttribution(
  items: readonly TowerAiView[],
  limit = AI_VENDOR_DISPLAY_LIMIT,
): AiVendorAttribution[] {
  const vendors = new Map<
    string,
    { vendor: string; spendUsd: number; systems: Set<string> }
  >();
  for (const item of items) {
    const vendor = item.vendor?.trim();
    if (!vendor || item.aiSpendUsd <= 0) continue;
    const current = vendors.get(vendor) ?? {
      vendor,
      spendUsd: 0,
      systems: new Set<string>(),
    };
    current.spendUsd += item.aiSpendUsd;
    const system = item.system?.trim();
    if (system) current.systems.add(system);
    vendors.set(vendor, current);
  }
  return [...vendors.values()]
    .sort((a, b) => b.spendUsd - a.spendUsd || a.vendor.localeCompare(b.vendor))
    .slice(0, limit)
    .map((entry) => ({
      vendor: entry.vendor,
      spendUsd: entry.spendUsd,
      systems: [...entry.systems]
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 2),
    }));
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
 * Shown in place of the spend lens when the AI portfolio projection carries no per-item
 * spend. Drawing an empty bar chart beneath a "$53.7M AI-tagged" header would
 * assert a breakdown the read model cannot substantiate.
 */
function SpendUnattributed({ aiTagged }: { aiTagged: string }) {
  return (
    <div className={styles.emptyPanel}>
      <h2>AI spend is portfolio-only today</h2>
      <p>
        {aiTagged} is tagged to AI-related spend, but none is currently
        attributable to a specific tool, agent or linked capability. This view
        supports position and value-readiness evidence, not spend concentration,
        until the governed attribution projection exists.
      </p>
    </div>
  );
}

function VendorAttributionStrip({
  vendors,
}: {
  vendors: readonly AiVendorAttribution[];
}) {
  if (vendors.length === 0) {
    return (
      <p className={styles.lhSub}>
        Vendor attribution is not yet populated for the current AI capability
        portfolio.
      </p>
    );
  }
  return (
    <div className={styles.vendorStrip} aria-label="Top attributed AI vendors">
      <div className={styles.vendorStripHead}>
        <span>Top attributed vendors</span>
        <small>from governed AI tool, agent and capability rows</small>
      </div>
      <div className={styles.vendorStripRows}>
        {vendors.map((entry) => (
          <div key={entry.vendor} className={styles.vendorStripRow}>
            <span>
              <b>{entry.vendor}</b>
              {entry.systems.length > 0 ? (
                <small>{entry.systems.join(" / ")}</small>
              ) : null}
            </span>
            <strong>{formatUsdM(entry.spendUsd)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Free-text search across the fields an executive would actually type: the
 * capability name, its vendor, the system it runs in, and its spend category.
 *
 * The matrix and candidate pipeline default to the top 10 by governed policy,
 * which keeps a 232-row portfolio readable but would otherwise put rows 11+
 * out of reach. Search is how you get to a specific capability without
 * scrolling a table of everything, and it applies to every sub-view.
 */
export function applySearch(
  items: readonly TowerAiView[],
  query: string,
): TowerAiView[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...items];
  return items.filter((a) =>
    [a.name, a.vendor, a.system, a.category]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q)),
  );
}

/** The full portfolio table — every row, no policy cap. */
function CapabilityInventoryTable({
  items,
  onOpenAi,
}: {
  items: readonly TowerAiView[];
  onOpenAi: (n: number) => void;
}) {
  if (items.length === 0) {
    return (
      <p className={styles.lhSub}>
        No AI tools, agents or linked capabilities match the current filter or
        search.
      </p>
    );
  }
  return (
    <table className={styles.tbl}>
      <thead>
        <tr>
          <th scope="col">Tool, agent or capability</th>
          <th scope="col">Spend type</th>
          <th scope="col">Vendor</th>
          <th scope="col">System</th>
          <th scope="col" className={styles.num}>
            Value
          </th>
          <th scope="col" className={styles.num}>
            Readiness
          </th>
          <th scope="col" style={{ textAlign: "right" }}>
            Posture
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((a) => (
          <tr key={a.id} className={styles.click} onClick={() => onOpenAi(a.n)}>
            <td>
              <button
                type="button"
                className={styles.rowOpen}
                aria-label={`Open ${a.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAi(a.n);
                }}
              >
                <span className={styles.pname} style={{ fontSize: 14 }}>
                  {a.name}
                </span>
              </button>
            </td>
            <td>
              <Chip tone={AI_KIND_CHIP_TONE[a.kind]} mono>
                {AI_KIND_WORD[a.kind]}
              </Chip>
            </td>
            <td>{a.vendor ?? "—"}</td>
            <td>{a.system ?? "—"}</td>
            <td className={styles.num}>
              <MiniMeter value={a.valueScore} />
            </td>
            <td className={styles.num}>
              <MiniMeter value={a.readinessScore} />
            </td>
            <td
              style={{
                textAlign: "right",
                fontWeight: 600,
                fontSize: 12.5,
                color: "var(--canon-gray-700)",
              }}
            >
              {a.posture}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── the view ───────────────────────────────────────────────────────────────

export function AiPortfolioView({
  view,
  subView,
  onSubView,
  filter,
  onFilter,
  search,
  onSearch,
  onOpenAi,
}: {
  view: TowerCommandCenterView;
  subView: AiSubView;
  onSubView: (next: AiSubView) => void;
  filter: AiFilter;
  onFilter: (next: AiFilter) => void;
  search: string;
  onSearch: (next: string) => void;
  onOpenAi: (n: number) => void;
}) {
  const searched = applySearch(view.ai, search);
  const filtered = applyFilter(searched, filter);
  const matrixItems = topMatrixItems(filtered);
  // Table mode reads the UNCAPPED portfolio, so search + filters can reach
  // every row the mart holds — not just the top 10 the matrix plots.
  const allFiltered = applyFilter(
    applySearch(view.allInitiatives, search),
    filter,
  );
  const showChips =
    subView === "overview" || subView === "bubble" || subView === "all";
  const aiTagged = formatUsdM(view.summary.aiTaggedUsd);
  const sizeMode = view.summary.aiSpendUnattributed ? "constant" : "spend";
  const fundedCount = view.ai.filter((a) => a.kind === "funded").length;
  const embeddedCount = view.ai.filter((a) => a.kind === "embedded").length;
  const topVendors = topVendorAttribution(view.allInitiatives);
  const candidateRight = `${view.portfolioCounts.displayCandidateCount} shown of ${view.portfolioCounts.totalCandidateCount} candidates`;
  const matrixCountRight =
    filtered.length > matrixItems.length
      ? `${matrixItems.length} on matrix · ${filtered.length} in filtered list`
      : `${matrixItems.length} on matrix`;
  const matrixRight =
    sizeMode === "constant"
      ? `${matrixCountRight} · constant radius`
      : `${matrixCountRight} · size = attributed spend`;

  let body: React.ReactNode;
  if (subView === "overview") {
    body = (
      <div
        className={styles.ccLower}
        style={{
          gridTemplateColumns: "minmax(640px, 1.28fr) minmax(360px, 0.72fr)",
          flex: "0 0 auto",
          minHeight: 560,
        }}
      >
        <Card
          eyebrow="Funded programs and embedded capabilities"
          right={matrixRight}
          headId="tcc-ai-bubble"
          bodyStyle={{ display: "flex", flexDirection: "column" }}
        >
          <BubblePanel
            items={matrixItems}
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
              <>
                <div className={styles.chartwrap}>
                  <AiSpendLensChart rows={view.spendLens} />
                </div>
                <VendorAttributionStrip vendors={topVendors} />
              </>
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
              {embeddedCount} embedded tool, agent or usage-linked capabilit
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
            items={matrixItems}
            sizeMode={sizeMode}
            onOpenAi={onOpenAi}
          />
        </Card>
        <Card
          title="Tools, agents and capabilities"
          right={
            filtered.length > matrixItems.length
              ? `${matrixItems.length} numbered on matrix`
              : "numbered on the matrix"
          }
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
            <VendorAttributionStrip vendors={topVendors} />
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
  } else if (subView === "all") {
    body = (
      <Card
        title="Tool, agent and capability inventory"
        right={`${allFiltered.length} of ${view.allInitiatives.length} rows${search.trim() ? " · searched" : ""}`}
        headId="tcc-ai-all"
        style={{ flex: 1 }}
        bodyClassName={styles.scroll}
        bodyStyle={{ paddingTop: 8 }}
      >
        <CapabilityInventoryTable items={allFiltered} onOpenAi={onOpenAi} />
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
    <div className={cx(styles.view, styles.viewScroll)}>
      <ViewHead
        title="AI decision topology"
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

      <div className={styles.zipContractNote}>
        <Dot tone="teal" />
        <span>
          North Star read: compare AI spend scale, proof maturity, readiness,
          funded-program status, embedded tool or agent usage, and candidate
          status before treating usage as outcome value.
        </span>
      </div>

      <div className={styles.evidenceNote}>
        <b>Usage proves activity. It does not prove business value.</b>
        <span>
          Spend, capacity, adoption, usage, outcome evidence, guardrails,
          attestation and claim state are shown as separate gates.
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="search"
          className={styles.searchInput}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search tool, agent, vendor, system or category"
          aria-label="Search AI tools, agents and capabilities"
        />
        {search.trim() ? (
          <span className={styles.vhint}>
            {allFiltered.length} of {view.allInitiatives.length} capabilities
            match
          </span>
        ) : null}
      </div>

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

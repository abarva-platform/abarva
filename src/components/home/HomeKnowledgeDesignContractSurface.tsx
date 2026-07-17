"use client";

import { useMemo, useState } from "react";

import type {
  HomeKnowledgeDataColumn,
  HomeKnowledgeDesignContractPack,
  HomeKnowledgeDimension,
  HomeKnowledgeEvidence,
  HomeKnowledgeGap,
  HomeKnowledgeRecord,
  HomeKnowledgeVisualBlock,
} from "@/lib/home/home-knowledge-design-contract";

type TopTab = "overview" | "gaps" | "usecases" | "proof";
type DimensionTab = "summary" | "data" | "relationships" | "gaps" | "evidence";
type SurfaceMode = "enterprise" | "dimension";

interface HomeKnowledgeDesignContractSurfaceProps {
  pack: HomeKnowledgeDesignContractPack;
  selectedDimension?: string | null;
  selectedTab?: string | null;
  selectedSource?: string | null;
}

const TOP_TABS: Array<{ key: TopTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "gaps", label: "Evidence Gaps" },
  { key: "usecases", label: "Use Cases" },
  { key: "proof", label: "Proof" },
];

const DIMENSION_TABS: Array<{ key: DimensionTab; label: string }> = [
  { key: "summary", label: "Summary" },
  { key: "data", label: "Data" },
  { key: "relationships", label: "Relationships" },
  { key: "gaps", label: "Gaps" },
  { key: "evidence", label: "Evidence" },
];

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function firstString(record: HomeKnowledgeRecord, keys: string[]): string {
  for (const key of keys) {
    const value = asText(record[key]);
    if (value) return value;
  }
  return "";
}

function statusLabel(status: unknown): string {
  const value = asText(status);
  return value ? value.replaceAll("_", " ") : "source-backed";
}

function metricValue(record: HomeKnowledgeRecord, key: string): string {
  return asText(record[key]);
}

function narrativeString(
  pack: HomeKnowledgeDesignContractPack,
  key: string,
): string {
  const value = pack.narrative_sections?.[key];
  return typeof value === "string" ? value : "";
}

function paragraphLines(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function evidenceRefs(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(asText).filter(Boolean);
  return asText(value)
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickInitialDimension(
  dimensions: HomeKnowledgeDimension[],
  selectedDimension?: string | null,
): HomeKnowledgeDimension | null {
  if (!dimensions.length) return null;
  const wanted = selectedDimension?.trim().toLowerCase();
  if (wanted) {
    return (
      dimensions.find(
        (dimension) =>
          dimension.key.toLowerCase() === wanted ||
          dimension.name.toLowerCase() === wanted,
      ) ?? dimensions[0]
    );
  }
  return dimensions[0];
}

function pickInitialTab(selectedTab?: string | null): TopTab {
  const wanted = selectedTab?.trim().toLowerCase();
  if (wanted === "gaps" || wanted === "usecases" || wanted === "proof") {
    return wanted;
  }
  return "overview";
}

function rowTitle(row: HomeKnowledgeRecord): string {
  return (
    firstString(row, [
      "context_item",
      "system_name",
      "data_asset_name",
      "business_name",
      "use_case",
      "function_name",
      "program_name",
      "vendor_name",
      "risk_name",
      "metric_name",
      "name",
      "title",
    ]) || "Context row"
  );
}

export function HomeKnowledgeDesignContractSurface({
  pack,
  selectedDimension,
  selectedTab,
  selectedSource,
}: HomeKnowledgeDesignContractSurfaceProps) {
  const slots = pack.design_slots;
  const dimensions = useMemo(() => slots.DIMS ?? [], [slots.DIMS]);
  const [topTab, setTopTab] = useState<TopTab>(pickInitialTab(selectedTab));
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>(
    selectedDimension ? "dimension" : "enterprise",
  );
  const [activeDimensionKey, setActiveDimensionKey] = useState(
    pickInitialDimension(dimensions, selectedDimension)?.key ?? "",
  );
  const [dimensionTab, setDimensionTab] = useState<DimensionTab>("summary");
  const [navQuery, setNavQuery] = useState("");
  const [tableQuery, setTableQuery] = useState("");
  const [facetValue, setFacetValue] = useState("all");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const activeDimension =
    dimensions.find((dimension) => dimension.key === activeDimensionKey) ??
    dimensions[0];
  const activeData = activeDimension
    ? slots.DATA?.[activeDimension.key]
    : undefined;
  const activeRows = useMemo(() => activeData?.rows ?? [], [activeData?.rows]);
  const activeColumns = activeData?.columns ?? [];
  const activeStory = activeDimension
    ? slots.STORY?.[activeDimension.key]
    : undefined;
  const activeInsight = activeDimension
    ? slots.INSIGHTS?.[activeDimension.key]
    : undefined;
  const activeRelationship = activeDimension
    ? slots.REL?.[activeDimension.key]
    : undefined;
  const activeGaps = activeDimension
    ? (slots.DGAPS?.[activeDimension.key] ?? [])
    : [];
  const activeEvidence = activeDimension
    ? (slots.EVID?.[activeDimension.key] ?? [])
    : [];

  const filteredDimensions = useMemo(() => {
    const query = navQuery.trim().toLowerCase();
    if (!query) return dimensions;
    return dimensions.filter((dimension) =>
      `${dimension.name} ${dimension.summary ?? ""} ${(dimension.covers ?? []).join(" ")}`
        .toLowerCase()
        .includes(query),
    );
  }, [dimensions, navQuery]);

  const facetOptions = useMemo(() => {
    const key = activeData?.facet;
    if (!key) return [];
    return Array.from(
      new Set(activeRows.map((row) => asText(row[key])).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
  }, [activeData?.facet, activeRows]);

  const visibleRows = useMemo(() => {
    const query = tableQuery.trim().toLowerCase();
    const facet = activeData?.facet;
    const rows = activeRows.filter((row) => {
      const matchesQuery = !query || JSON.stringify(row).toLowerCase().includes(query);
      const matchesFacet =
        !facet || facetValue === "all" || asText(row[facet]) === facetValue;
      return matchesQuery && matchesFacet;
    });
    if (!sortKey) return rows;
    return [...rows].sort((a, b) =>
      asText(a[sortKey]).localeCompare(asText(b[sortKey])),
    );
  }, [activeData?.facet, activeRows, facetValue, sortKey, tableQuery]);

  const selectedRow =
    selectedRowIndex === null ? null : visibleRows[selectedRowIndex] ?? null;

  function selectDimension(key: string) {
    setActiveDimensionKey(key);
    setSurfaceMode("dimension");
    setTopTab("overview");
    setDimensionTab("summary");
    setTableQuery("");
    setFacetValue("all");
    setSortKey(null);
    setSelectedRowIndex(null);
  }

  return (
    <div className="nexus-home-contract" data-source={selectedSource ?? ""}>
      <aside className="nkh-rail" aria-label="Knowledge navigation">
        <div className="nkh-rail-section">
          <div className="nkh-rail-label">Knowledge</div>
          <button
            className={`nkh-rail-primary ${
              topTab === "overview" && surfaceMode === "enterprise" ? "is-active" : ""
            }`}
            type="button"
            onClick={() => {
              setSurfaceMode("enterprise");
              setTopTab("overview");
            }}
          >
            <span className="nkh-icon">⌂</span>
            <span>Enterprise Brief</span>
          </button>
        </div>

        <div className="nkh-rail-section">
          <div className="nkh-rail-label">Context</div>
          <label className="nkh-search">
            <span>⌕</span>
            <input
              aria-label="Search enterprise context"
              placeholder="Search systems, vendors, use cases"
              value={navQuery}
              onChange={(event) => setNavQuery(event.target.value)}
            />
          </label>
          <button
            className={`nkh-dim-link ${topTab === "proof" ? "is-active" : ""}`}
            type="button"
            onClick={() => {
              setSurfaceMode("enterprise");
              setTopTab("proof");
            }}
          >
            <span className="nkh-dot">✓</span>
            <span>
              <strong>Context Confidence</strong>
              <small>Trust and readiness</small>
            </span>
            <em>Proof</em>
          </button>
          <div className="nkh-dim-list">
            {filteredDimensions.map((dimension) => (
              <button
                key={dimension.key}
                className={`nkh-dim-link ${
                  activeDimension?.key === dimension.key && topTab === "overview"
                    && surfaceMode === "dimension"
                    ? "is-active"
                    : ""
                }`}
                type="button"
                onClick={() => selectDimension(dimension.key)}
              >
                <span className="nkh-dot">◌</span>
                <span>
                  <strong>{dimension.name}</strong>
                  <small>
                    {dimension.count ?? 0} records · {statusLabel(dimension.status)}
                  </small>
                </span>
                <em>{dimension.count ?? 0}</em>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="nkh-main">
        <header className="nkh-hero">
          <div>
            <div className="nkh-breadcrumb">
              Home <span>›</span> Enterprise Knowledge <span>›</span>{" "}
              {topTab === "overview" && surfaceMode === "dimension" && activeDimension
                ? activeDimension.name
                : pack.tenant_name}
            </div>
            <h1>
              {topTab === "overview" && surfaceMode === "dimension" && activeDimension
                ? activeDimension.name
                : pack.tenant_name}
              {surfaceMode === "enterprise" ? <span className="nkh-demo-pill">Demo</span> : null}
            </h1>
            <p>
              {topTab === "overview" && surfaceMode === "dimension" && activeDimension
                ? activeDimension.summary
                : `Nexus has ${metricValue(slots.FACTS?.[2] ?? {}, "value") || "source-backed"} rows, ${metricValue(slots.FACTS?.[3] ?? {}, "value") || "evidence-backed"} evidence references, and ${dimensions.length} enterprise dimensions for Meridian's Knowledge surface.`}
            </p>
          </div>
          <div className="nkh-status-card">
            <strong>Active Knowledge context</strong>
            <span>Updated {formatDate(pack.generated_at)}</span>
            <span>{pack.validation?.status === "pass" ? "Source-backed" : "Needs review"}</span>
          </div>
        </header>

        <nav className="nkh-tabs" aria-label="Home Knowledge sections">
          {TOP_TABS.map((tab) => (
            <button
              key={tab.key}
              className={topTab === tab.key ? "is-active" : ""}
              type="button"
              onClick={() => setTopTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {topTab === "overview" && surfaceMode === "enterprise" ? (
          <EnterpriseOverview
            decisionCannot={slots.DEC_CANNOT ?? []}
            decisionCan={slots.DEC_CAN ?? []}
            dimensions={dimensions}
            facts={slots.FACTS ?? []}
            pack={pack}
            priorities={slots.PRIORITIES ?? []}
            signals={slots.SIGNALS ?? []}
            summaryBlocks={slots.BRIEF_COLS ?? []}
          />
        ) : null}

        {topTab === "overview" && surfaceMode === "dimension" && activeDimension ? (
          <DimensionView
            columns={activeColumns}
            dimension={activeDimension}
            evidence={activeEvidence}
            facetOptions={facetOptions}
            facetValue={facetValue}
            gaps={activeGaps}
            insight={activeInsight}
            rows={visibleRows}
            selectedRow={selectedRow}
            selectedRowIndex={selectedRowIndex}
            setDimensionTab={setDimensionTab}
            setFacetValue={setFacetValue}
            setSelectedRowIndex={setSelectedRowIndex}
            setSortKey={setSortKey}
            setTableQuery={setTableQuery}
            sortKey={sortKey}
            story={activeStory}
            tab={dimensionTab}
            tableQuery={tableQuery}
            relationship={activeRelationship}
            visualBlocks={slots.VISUAL_BLOCKS?.[activeDimension.key] ?? []}
          />
        ) : null}

        {topTab === "gaps" ? (
          <EvidenceGapsView gaps={slots.GAPS ?? []} nextEvidence={slots.NEXT_EVIDENCE ?? []} />
        ) : null}

        {topTab === "usecases" ? (
          <UseCasesView useCases={slots.USE_CASES ?? []} />
        ) : null}

        {topTab === "proof" ? (
          <ProofView
            dimensions={dimensions}
            evidence={slots.EVIDENCE ?? []}
            facts={slots.FACTS ?? []}
            kpis={slots.KPIS ?? []}
            pack={pack}
            selectedSource={selectedSource}
            table={slots.CONF_TABLE ?? []}
          />
        ) : null}
      </section>

      <button className="nkh-ava" type="button" aria-label="Ask aVa">
        <span>aVa</span>
        Ask aVa
      </button>

      <style>{styles}</style>
    </div>
  );
}

function DimensionView({
  columns,
  dimension,
  evidence,
  facetOptions,
  facetValue,
  gaps,
  insight,
  rows,
  selectedRow,
  selectedRowIndex,
  setDimensionTab,
  setFacetValue,
  setSelectedRowIndex,
  setSortKey,
  setTableQuery,
  sortKey,
  story,
  tab,
  tableQuery,
  relationship,
  visualBlocks,
}: {
  columns: HomeKnowledgeDataColumn[];
  dimension: HomeKnowledgeDimension;
  evidence: HomeKnowledgeEvidence[];
  facetOptions: string[];
  facetValue: string;
  gaps: HomeKnowledgeGap[];
  insight?: { findings?: string[]; breakdown?: { title?: string; rows?: Array<{ label?: string; value?: string; note?: string }> } };
  rows: HomeKnowledgeRecord[];
  selectedRow: HomeKnowledgeRecord | null;
  selectedRowIndex: number | null;
  setDimensionTab: (tab: DimensionTab) => void;
  setFacetValue: (value: string) => void;
  setSelectedRowIndex: (index: number | null) => void;
  setSortKey: (key: string | null) => void;
  setTableQuery: (value: string) => void;
  sortKey: string | null;
  story?: { meaning?: string; observed?: string; matters?: string; supports?: string };
  tab: DimensionTab;
  tableQuery: string;
  relationship?: { chain?: string[]; note?: string };
  visualBlocks: HomeKnowledgeVisualBlock[];
}) {
  return (
    <div className="nkh-section">
      <nav className="nkh-subtabs" aria-label={`${dimension.name} tabs`}>
        {DIMENSION_TABS.map((item) => (
          <button
            key={item.key}
            className={tab === item.key ? "is-active" : ""}
            type="button"
            onClick={() => {
              setDimensionTab(item.key);
              setSelectedRowIndex(null);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "summary" ? (
        <div className="nkh-story-card">
          <div className="nkh-kicker">Executive Summary</div>
          <h2>{dimension.name}</h2>
          <p className="nkh-lede">{story?.meaning ?? dimension.summary}</p>
          <div className="nkh-brief-grid">
            <StoryBlock title="What Nexus knows" items={insight?.findings?.slice(0, 4)} fallback={story?.observed} />
            <StoryBlock title="Why it matters" fallback={story?.matters} />
            <StoryBlock title="Questions this supports" fallback={story?.supports} items={dimension.covers} />
            <StoryBlock
              title="Not yet supported"
              tone="warn"
              items={gaps.slice(0, 3).map((gap) => gap.missing ?? gap.blocks ?? "")}
              fallback="Do not use this dimension for value or execution claims until the missing evidence is validated."
            />
          </div>
          {insight?.breakdown?.rows?.length ? (
            <div className="nkh-breakdown">
              <h3>{insight.breakdown.title ?? "Evidence posture"}</h3>
              <div className="nkh-breakdown-grid">
                {insight.breakdown.rows.map((row, index) => (
                  <div key={`${row.label}-${index}`} className="nkh-mini-card">
                    <strong>{row.value}</strong>
                    <span>{row.label}</span>
                    <p>{row.note}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {visualBlocks.length ? (
            <div className="nkh-visual-stack">
              {visualBlocks.map((block, index) => (
                <VisualBlock key={`${block.title}-${index}`} block={block} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "data" ? (
        <div className="nkh-data-card">
          <div className="nkh-data-tools">
            <label>
              Search rows
              <input
                placeholder={`Search ${dimension.name.toLowerCase()}`}
                value={tableQuery}
                onChange={(event) => {
                  setTableQuery(event.target.value);
                  setSelectedRowIndex(null);
                }}
              />
            </label>
            {facetOptions.length ? (
              <label>
                Filter
                <select
                  value={facetValue}
                  onChange={(event) => {
                    setFacetValue(event.target.value);
                    setSelectedRowIndex(null);
                  }}
                >
                  <option value="all">All</option>
                  {facetOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <span className="nkh-chip">{rows.length} rows shown</span>
          </div>
          <div className="nkh-table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.slice(0, 8).map((column) => (
                    <th key={column.k}>
                      <button
                        type="button"
                        onClick={() => setSortKey(sortKey === column.k ? null : column.k)}
                      >
                        {column.label}
                        {sortKey === column.k ? " ↑" : ""}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={`${rowTitle(row)}-${index}`}
                    className={selectedRowIndex === index ? "is-selected" : ""}
                    onClick={() => setSelectedRowIndex(index)}
                  >
                    {columns.slice(0, 8).map((column) => (
                      <td key={column.k}>
                        {column.pill ? (
                          <span className="nkh-pill">{statusLabel(row[column.k])}</span>
                        ) : (
                          asText(row[column.k]) || "—"
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedRow ? (
            <RowDetail
              columns={columns}
              row={selectedRow}
              onClose={() => setSelectedRowIndex(null)}
            />
          ) : null}
        </div>
      ) : null}

      {tab === "relationships" ? (
        <div className="nkh-story-card">
          <div className="nkh-kicker">Relationship Map</div>
          <h2>{dimension.name} relationships</h2>
          <p>{relationship?.note ?? "Relationship interpretation is advisory until source evidence is validated."}</p>
          <div className="nkh-chain">
            {(relationship?.chain?.length ? relationship.chain : ["Function", "System", "Data", "Vendor", "Risk"]).map((item, index) => (
              <div key={`${item}-${index}`} className="nkh-chain-node">
                <span>{index + 1}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "gaps" ? (
        <div className="nkh-card-grid">
          {gaps.length ? (
            gaps.map((gap, index) => <GapCard key={`${gap.missing}-${index}`} gap={gap} />)
          ) : (
            <EmptyState title="No priority gap surfaced" body="No repeated gap pattern is visible for this dimension in the approved render pack." />
          )}
        </div>
      ) : null}

      {tab === "evidence" ? (
        <div className="nkh-card-grid">
          {evidence.length ? (
            evidence.map((item, index) => <EvidenceCard key={`${item.name}-${index}`} evidence={item} />)
          ) : (
            <EmptyState title="No evidence card surfaced" body="The data rows still carry row-level evidence identifiers where available." />
          )}
        </div>
      ) : null}
    </div>
  );
}

function EnterpriseOverview({
  decisionCannot,
  decisionCan,
  dimensions,
  facts,
  pack,
  priorities,
  signals,
  summaryBlocks,
}: {
  decisionCannot: string[];
  decisionCan: string[];
  dimensions: HomeKnowledgeDimension[];
  facts: HomeKnowledgeRecord[];
  pack: HomeKnowledgeDesignContractPack;
  priorities: HomeKnowledgeRecord[];
  signals: HomeKnowledgeRecord[];
  summaryBlocks: HomeKnowledgeRecord[];
}) {
  const title =
    narrativeString(pack, "enterprise_brief_title") ||
    "Meridian Health System: Governed Foundation Before AI at Scale";
  const summary =
    narrativeString(pack, "enterprise_brief_summary") ||
    "Meridian has source-backed healthcare context for executive orientation, but major AI and analytics decisions still require evidence closure before decision-grade claims.";

  return (
    <div className="nkh-section nkh-enterprise-overview">
      <section className="nkh-at-glance" aria-label="Enterprise at a glance">
        <div className="nkh-section-head">
          <div>
            <div className="nkh-kicker">Enterprise at a glance</div>
            <h2>What Nexus knows about Meridian</h2>
          </div>
          <span>{facts.length} source-backed signals</span>
        </div>
        <div className="nkh-fact-grid">
          {facts.slice(0, 12).map((fact, index) => (
            <article key={`${fact.label}-${index}`} className="nkh-fact-card">
              <span>{asText(fact.label)}</span>
              <strong>{asText(fact.value)}</strong>
              <p>{asText(fact.sub)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="nkh-story-card nkh-boardroom-brief">
        <div className="nkh-kicker">Enterprise Brief</div>
        <h2>{title}</h2>
        <div className="nkh-executive-summary">
          {paragraphLines(summary).map((paragraph, index) => (
            <p key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>
          ))}
        </div>
        <div className="nkh-brief-grid">
          {summaryBlocks.slice(0, 4).map((block, index) => (
            <article key={`${block.label}-${index}`} className="nkh-story-block">
              <h3>{asText(block.label)}</h3>
              <p>{asText(block.text)}</p>
              <EvidenceRefStrip refs={evidenceRefs(block.evidence_refs)} />
            </article>
          ))}
        </div>
      </section>

      <section className="nkh-split-section">
        <div className="nkh-story-card">
          <div className="nkh-kicker">Key Priorities</div>
          <h2>What leadership should sequence first</h2>
          <div className="nkh-priority-list">
            {priorities.slice(0, 5).map((priority, index) => (
              <article key={`${priority.title}-${index}`}>
                <span>{asText(priority.n) || String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{asText(priority.title)}</h3>
                  <p>{asText(priority.detail)}</p>
                  <EvidenceRefStrip refs={evidenceRefs(priority.evidence_refs)} />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="nkh-story-card">
          <div className="nkh-kicker">Leadership Signals</div>
          <h2>What the executive interviews imply</h2>
          <div className="nkh-signal-list">
            {signals.slice(0, 4).map((signal, index) => (
              <article key={`${signal.role}-${index}`}>
                <span>{asText(signal.initials)}</span>
                <div>
                  <strong>{asText(signal.role)}</strong>
                  <p>{asText(signal.quote)}</p>
                  <em>{asText(signal.source)}</em>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="nkh-support-grid">
        <StoryBlock title="This context can support" items={decisionCan.slice(0, 6)} />
        <StoryBlock
          title="Should not yet support"
          tone="warn"
          items={decisionCannot.slice(0, 6)}
        />
      </section>

      <section className="nkh-layer-visual nkh-enterprise-map">
        <div className="nkh-section-head">
          <div>
            <div className="nkh-kicker">Enterprise context powers the platform</div>
            <h2>Business context becomes module-ready decisions</h2>
          </div>
          <span>{dimensions.length} dimensions</span>
        </div>
        <div className="nkh-orbit">
          {dimensions.slice(1, 8).map((dimension) => (
            <div key={dimension.key}>
              <strong>{dimension.name}</strong>
              <span>{dimension.summary}</span>
            </div>
          ))}
          <section>
            <strong>Nexus Knowledge Layer</strong>
            <span>Source-backed facts, gaps, caveats, and relationship candidates.</span>
          </section>
        </div>
      </section>

      <section className="nkh-route-grid" aria-label="Route this knowledge">
        <article>
          <span>Intelligence</span>
          <strong>Ask where Meridian should focus AI investment first</strong>
        </article>
        <article>
          <span>Moves</span>
          <strong>Turn the lakehouse or Agent Assist bet into phase-gated execution</strong>
        </article>
        <article>
          <span>Source</span>
          <strong>Scope platform, managed-services, or vendor decisions after commercial proof</strong>
        </article>
        <article>
          <span>Tower</span>
          <strong>Track value only after baselines and actuals are validated</strong>
        </article>
      </section>
    </div>
  );
}

function StoryBlock({
  fallback,
  items,
  title,
  tone = "ok",
}: {
  fallback?: string;
  items?: string[];
  title: string;
  tone?: "ok" | "warn";
}) {
  const visibleItems = (items ?? []).filter(Boolean);
  return (
    <div className={`nkh-story-block is-${tone}`}>
      <h3>{title}</h3>
      {visibleItems.length ? (
        <ul>
          {visibleItems.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>{fallback}</p>
      )}
    </div>
  );
}

function EvidenceRefStrip({ refs }: { refs: string[] }) {
  if (!refs.length) return null;
  return (
    <div className="nkh-ref-strip" aria-label="Evidence references">
      {refs.slice(0, 5).map((ref) => (
        <em key={ref}>{ref}</em>
      ))}
    </div>
  );
}

function VisualBlock({ block }: { block: HomeKnowledgeVisualBlock }) {
  const data = block.data ?? {};
  const entries = Object.entries(data);

  if (block.type === "dependency_flow") {
    const nodes = Array.isArray(data.nodes) ? data.nodes.map(asText).filter(Boolean) : [];
    const edges = Array.isArray(data.edges) ? data.edges.map(asText).filter(Boolean) : [];
    return (
      <article className="nkh-visual-block">
        <div>
          <span>{block.type}</span>
          <h3>{block.title}</h3>
          <p>{block.subtitle}</p>
        </div>
        <div className="nkh-flow-nodes">
          {nodes.slice(0, 6).map((node, index) => (
            <strong key={`${node}-${index}`}>{node}</strong>
          ))}
        </div>
        {edges.length ? (
          <ul>
            {edges.slice(0, 5).map((edge, index) => (
              <li key={`${edge}-${index}`}>{edge}</li>
            ))}
          </ul>
        ) : null}
      </article>
    );
  }

  if (block.type === "decision_matrix" || block.type === "metric_strip" || block.type === "evidence_bar") {
    const rows = Array.isArray(data.rows)
      ? data.rows
      : Array.isArray(data.metrics)
        ? data.metrics
        : entries.map(([label, value]) => ({ label, value }));
    return (
      <article className="nkh-visual-block">
        <div>
          <span>{block.type}</span>
          <h3>{block.title}</h3>
          <p>{block.subtitle}</p>
        </div>
        <div className="nkh-visual-grid">
          {rows.slice(0, 6).map((row, index) => {
            const record: Record<string, unknown> =
              row && typeof row === "object"
                ? (row as Record<string, unknown>)
                : { value: row };
            return (
              <div key={`${asText(record.label) || index}`}>
                <strong>{asText(record.value ?? record.status ?? record.score)}</strong>
                <span>{asText(record.label ?? record.name ?? record.dimension)}</span>
                <p>{asText(record.note ?? record.subtitle ?? record.description)}</p>
              </div>
            );
          })}
        </div>
      </article>
    );
  }

  return (
    <article className="nkh-visual-block">
      <div>
        <span>{block.type ?? "visual"}</span>
        <h3>{block.title}</h3>
        <p>{block.subtitle}</p>
      </div>
      <div className="nkh-visual-grid">
        {entries.slice(0, 6).map(([label, value]) => (
          <div key={label}>
            <strong>{asText(value)}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function RowDetail({
  columns,
  onClose,
  row,
}: {
  columns: HomeKnowledgeDataColumn[];
  onClose: () => void;
  row: HomeKnowledgeRecord;
}) {
  const refs = evidenceRefs(row.evidence_id ?? row.evidence_refs);
  return (
    <aside className="nkh-drawer" aria-label="Selected row detail">
      <div className="nkh-drawer-head">
        <div>
          <span>Selected row</span>
          <h3>{rowTitle(row)}</h3>
        </div>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="nkh-drawer-grid">
        {columns.map((column) => (
          <div key={column.k}>
            <span>{column.label}</span>
            <strong>{asText(row[column.k]) || "—"}</strong>
          </div>
        ))}
      </div>
      {refs.length ? (
        <div className="nkh-evidence-strip">
          <span>Evidence</span>
          {refs.slice(0, 8).map((ref) => (
            <em key={ref}>{ref}</em>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

function EvidenceGapsView({
  gaps,
  nextEvidence,
}: {
  gaps: HomeKnowledgeRecord[];
  nextEvidence: HomeKnowledgeRecord[];
}) {
  return (
    <div className="nkh-section">
      <div className="nkh-story-card">
        <div className="nkh-kicker">Evidence Gaps</div>
        <h2>What must be validated before decisions become board-grade</h2>
        <p>
          These are the proof gaps that keep the Meridian story honest. They are
          not page instructions; they are evidence requests that block investment,
          value, sourcing, and execution claims.
        </p>
      </div>
      <div className="nkh-card-grid">
        {gaps.map((gap, index) => (
          <div key={`${gap.title}-${index}`} className="nkh-gap-card">
            <span>{asText(gap.type) || "Evidence"}</span>
            <strong>{asText(gap.title)}</strong>
            <p>{asText(gap.blocks)}</p>
            <em>{asText(gap.severity)}</em>
          </div>
        ))}
      </div>
      <div className="nkh-story-card">
        <div className="nkh-kicker">Recommended Next Evidence</div>
        <h2>What Meridian should upload or confirm next</h2>
        <div className="nkh-next-list">
          {nextEvidence.map((item, index) => (
            <div key={`${item.item}-${index}`}>
              <strong>{asText(item.item)}</strong>
              <p>{asText(item.unlocks)}</p>
              <span>{asText(item.owner_hint)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UseCasesView({ useCases }: { useCases: HomeKnowledgeRecord[] }) {
  return (
    <div className="nkh-section">
      <div className="nkh-story-card">
        <div className="nkh-kicker">Candidate Use Cases</div>
        <h2>Top opportunities based on Meridian context</h2>
        <p>
          Nexus prioritizes these use cases because the enterprise context shows
          repeated dependencies across systems, data, governance, operations,
          risk, and value measurement.
        </p>
      </div>
      <div className="nkh-usecase-list">
        {useCases.map((useCase, index) => (
          <article key={`${useCase.name}-${index}`} className="nkh-usecase">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>{asText(useCase.name)}</h3>
              <p>{asText(useCase.value)}</p>
              <dl>
                <div>
                  <dt>Function</dt>
                  <dd>{asText(useCase.fn)}</dd>
                </div>
                <div>
                  <dt>Stage</dt>
                  <dd>{asText(useCase.stage)}</dd>
                </div>
                <div>
                  <dt>Gate</dt>
                  <dd>{asText(useCase.gate)}</dd>
                </div>
              </dl>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ProofView({
  dimensions,
  evidence,
  facts,
  kpis,
  pack,
  selectedSource,
  table,
}: {
  dimensions: HomeKnowledgeDimension[];
  evidence: HomeKnowledgeEvidence[];
  facts: HomeKnowledgeRecord[];
  kpis: HomeKnowledgeRecord[];
  pack: HomeKnowledgeDesignContractPack;
  selectedSource?: string | null;
  table: HomeKnowledgeRecord[];
}) {
  return (
    <div className="nkh-section">
      <div className="nkh-proof-hero">
        <div>
          <div className="nkh-kicker">Context Confidence</div>
          <h2>What Nexus can trust right now</h2>
          <p>
            Meridian has source-backed context across major enterprise dimensions.
            This is strong enough for enterprise orientation and fact-based
            questions. Relationship depth and measured outcomes still need
            validation before cross-domain dependency, sourcing savings, or Tower
            value claims.
          </p>
        </div>
        <div className="nkh-proof-metrics">
          {kpis.slice(0, 5).map((kpi, index) => (
            <div key={`${kpi.label}-${index}`}>
              <strong>{metricValue(kpi, "value")}</strong>
              <span>{metricValue(kpi, "label")}</span>
              <em>{metricValue(kpi, "sub")}</em>
            </div>
          ))}
        </div>
      </div>

      <div className="nkh-layer-visual">
        <h2>Enterprise knowledge layer</h2>
        <p>
          Nexus turns source evidence into governed enterprise context, then
          serves that context to every module with the same trust boundary.
        </p>
        <div className="nkh-orbit">
          {dimensions.slice(1, 8).map((dimension) => (
            <div key={dimension.key}>
              <strong>{dimension.name}</strong>
              <span>{dimension.summary}</span>
            </div>
          ))}
          <section>
            <strong>Enterprise Knowledge Layer</strong>
            <span>Facts, gaps, caveats, and relationship candidates</span>
          </section>
        </div>
      </div>

      <div className="nkh-proof-table">
        <h2>Evidence strength by dimension</h2>
        <table>
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Status</th>
              <th>Evidence note</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row, index) => (
              <tr key={`${row.dim}-${index}`}>
                <td>{asText(row.dim)}</td>
                <td><span className="nkh-pill">{statusLabel(row.status)}</span></td>
                <td>{asText(row.note)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="nkh-proof-table">
        <h2>Render proof</h2>
        <div className="nkh-render-facts">
          {facts.map((fact, index) => (
            <div key={`${fact.label}-${index}`}>
              <span>{asText(fact.label)}</span>
              <strong>{asText(fact.value)}</strong>
              <em>{asText(fact.sub)}</em>
            </div>
          ))}
        </div>
        <p>
          Artifact generated {formatDate(pack.generated_at)} from{" "}
          {selectedSource ?? "the approved Meridian Home Knowledge render pack"}.
          Validation status: {pack.validation?.status ?? "unknown"}.
        </p>
      </div>

      <div className="nkh-card-grid">
        {evidence.slice(0, 12).map((item, index) => (
          <EvidenceCard key={`${item.name}-${index}`} evidence={item} />
        ))}
      </div>
    </div>
  );
}

function GapCard({ gap }: { gap: HomeKnowledgeGap }) {
  return (
    <div className="nkh-gap-card">
      <span>{gap.handoff ?? "Evidence"}</span>
      <strong>{gap.missing}</strong>
      <p>{gap.blocks}</p>
      <em>{gap.needed}</em>
    </div>
  );
}

function EvidenceCard({ evidence }: { evidence: HomeKnowledgeEvidence }) {
  return (
    <div className="nkh-evidence-card">
      <span>{evidence.type ?? "Evidence"} · {evidence.date ?? "Current"}</span>
      <strong>{evidence.name}</strong>
      <p>{evidence.supports}</p>
      <dl>
        <div>
          <dt>Rows</dt>
          <dd>{evidence.rows ?? "—"}</dd>
        </div>
        <div>
          <dt>Facts</dt>
          <dd>{evidence.facts ?? "—"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{statusLabel(evidence.st ?? evidence.status)}</dd>
        </div>
      </dl>
      {evidence.missing ? <em>{evidence.missing}</em> : null}
    </div>
  );
}

function EmptyState({ body, title }: { body: string; title: string }) {
  return (
    <div className="nkh-empty">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function formatDate(value?: string): string {
  if (!value) return "current";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const styles = `
.nexus-home-contract {
  --ink: #071733;
  --muted: #53617d;
  --line: #dfe7f2;
  --soft: #f6f8fb;
  --panel: #ffffff;
  --brand: #0f7cff;
  --teal: #19c6b2;
  --green: #11845b;
  --amber: #a76b05;
  display: grid;
  grid-template-columns: 272px minmax(0, 1fr);
  min-height: calc(100vh - 72px);
  color: var(--ink);
  background: linear-gradient(180deg, #fbfdff 0%, #ffffff 100%);
  font-family: "Source Sans 3", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.nkh-rail {
  position: sticky;
  top: 0;
  align-self: start;
  height: calc(100vh - 72px);
  overflow: auto;
  border-right: 1px solid var(--line);
  background: #f8fafc;
  padding: 24px 14px;
}
.nkh-rail-section + .nkh-rail-section { margin-top: 24px; }
.nkh-rail-label {
  margin: 0 0 12px 10px;
  color: #8792aa;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .16em;
  text-transform: uppercase;
}
.nkh-rail-primary,
.nkh-dim-link {
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--ink);
  display: grid;
  grid-template-columns: 28px 1fr auto;
  gap: 10px;
  align-items: center;
  text-align: left;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
}
.nkh-rail-primary.is-active,
.nkh-dim-link.is-active {
  background: #eaf2ff;
  color: #0a2d66;
}
.nkh-icon,
.nkh-dot {
  display: inline-grid;
  place-items: center;
  color: #536c94;
  font-size: 16px;
}
.nkh-dim-link strong,
.nkh-rail-primary span:last-child {
  display: block;
  font-size: 15px;
  line-height: 1.25;
  font-weight: 800;
}
.nkh-dim-link small {
  display: block;
  margin-top: 3px;
  color: var(--muted);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nkh-dim-link em {
  color: #65728d;
  font-style: normal;
  font-size: 12px;
}
.nkh-search {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #d7dfeb;
  border-radius: 10px;
  background: #fff;
  padding: 9px 10px;
  margin-bottom: 12px;
}
.nkh-search input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  color: var(--ink);
  background: transparent;
}
.nkh-main {
  max-width: 1240px;
  width: 100%;
  margin: 0 auto;
  padding: 36px 40px 88px;
}
.nkh-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 32px;
  align-items: start;
}
.nkh-breadcrumb {
  color: #72809c;
  font-size: 14px;
  font-weight: 700;
}
.nkh-breadcrumb span { margin: 0 10px; color: #9aa6bc; }
.nkh-hero h1 {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 22px 0 12px;
  font-size: 48px;
  line-height: 1.02;
  letter-spacing: 0;
  color: var(--ink);
}
.nkh-demo-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #dceeff;
  color: #0a64c9;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.nkh-hero p {
  max-width: 740px;
  margin: 0;
  color: #41506f;
  font-size: 18px;
  line-height: 1.55;
}
.nkh-status-card {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 18px 40px rgba(7, 23, 51, .08);
  padding: 18px 20px;
}
.nkh-status-card strong {
  display: block;
  margin-bottom: 10px;
  font-size: 15px;
}
.nkh-status-card strong::before {
  content: "";
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 8px;
  border-radius: 50%;
  background: #25a36f;
}
.nkh-status-card span {
  display: block;
  color: #41506f;
  font-size: 13px;
  line-height: 1.7;
}
.nkh-tabs,
.nkh-subtabs {
  display: flex;
  gap: 22px;
  border-bottom: 1px solid var(--line);
  margin-top: 26px;
}
.nkh-tabs button,
.nkh-subtabs button {
  border: 0;
  border-bottom: 3px solid transparent;
  padding: 16px 0 14px;
  color: #52607b;
  background: transparent;
  font-size: 15px;
  font-weight: 850;
  cursor: pointer;
}
.nkh-tabs button.is-active,
.nkh-subtabs button.is-active {
  color: #06214b;
  border-color: var(--brand);
}
.nkh-section {
  margin-top: 34px;
}
.nkh-enterprise-overview {
  display: grid;
  gap: 22px;
}
.nkh-at-glance {
  border-top: 1px solid var(--line);
  padding-top: 28px;
}
.nkh-section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;
}
.nkh-section-head h2 {
  margin: 8px 0 0;
  font-size: 24px;
  line-height: 1.2;
}
.nkh-section-head > span {
  color: #8792aa;
  font-size: 13px;
  font-weight: 850;
}
.nkh-fact-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.nkh-fact-card {
  min-height: 128px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fff;
  padding: 18px;
  box-shadow: 0 16px 32px rgba(7, 23, 51, .04);
}
.nkh-fact-card span {
  display: block;
  color: #8792aa;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.nkh-fact-card strong {
  display: block;
  margin-top: 10px;
  font-size: 24px;
  line-height: 1.15;
}
.nkh-fact-card p {
  margin: 8px 0 0;
  color: #53617d;
  font-size: 13px;
  line-height: 1.35;
}
.nkh-story-card,
.nkh-data-card,
.nkh-proof-hero,
.nkh-layer-visual,
.nkh-proof-table {
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 20px 46px rgba(7, 23, 51, .06);
  padding: 28px;
}
.nkh-boardroom-brief {
  padding: 32px;
}
.nkh-executive-summary {
  max-width: 940px;
  margin-top: 12px;
}
.nkh-executive-summary p {
  margin: 0 0 14px;
  color: #41506f;
  font-size: 18px;
  line-height: 1.58;
}
.nkh-kicker {
  color: #9b6a17;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .18em;
  text-transform: uppercase;
}
.nkh-story-card h2,
.nkh-proof-hero h2,
.nkh-layer-visual h2,
.nkh-proof-table h2 {
  margin: 10px 0 12px;
  font-size: 28px;
  line-height: 1.2;
}
.nkh-lede,
.nkh-story-card > p,
.nkh-proof-hero > div > p,
.nkh-layer-visual > p {
  margin: 0;
  color: #41506f;
  font-size: 18px;
  line-height: 1.58;
}
.nkh-brief-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
}
.nkh-story-block,
.nkh-mini-card,
.nkh-gap-card,
.nkh-evidence-card,
.nkh-empty {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fff;
  padding: 18px;
}
.nkh-story-block.is-warn { border-color: #f2d49d; background: #fffaf2; }
.nkh-story-block h3 {
  margin: 0 0 12px;
  font-size: 15px;
}
.nkh-story-block ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.nkh-story-block li {
  position: relative;
  margin: 0 0 9px;
  padding-left: 20px;
  color: #24344f;
  line-height: 1.45;
}
.nkh-story-block li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: var(--green);
  font-weight: 900;
}
.nkh-story-block.is-warn li::before {
  content: "–";
  color: var(--amber);
}
.nkh-story-block p {
  margin: 0;
  color: #24344f;
  line-height: 1.5;
}
.nkh-breakdown { margin-top: 22px; }
.nkh-breakdown h3 { margin: 0 0 12px; font-size: 18px; }
.nkh-breakdown-grid,
.nkh-proof-metrics,
.nkh-card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.nkh-mini-card strong,
.nkh-proof-metrics strong,
.nkh-render-facts strong {
  display: block;
  font-size: 24px;
}
.nkh-mini-card span,
.nkh-proof-metrics span,
.nkh-render-facts span {
  display: block;
  color: #52617b;
  font-weight: 800;
}
.nkh-mini-card p,
.nkh-gap-card p,
.nkh-evidence-card p {
  margin: 8px 0 0;
  color: #41506f;
  line-height: 1.45;
}
.nkh-ref-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}
.nkh-ref-strip em {
  border-radius: 999px;
  background: #eef5ff;
  color: #34547b;
  padding: 4px 7px;
  font-size: 10px;
  font-style: normal;
  font-weight: 850;
}
.nkh-split-section {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr);
  gap: 20px;
}
.nkh-priority-list,
.nkh-signal-list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}
.nkh-priority-list article,
.nkh-signal-list article {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 14px;
  border-top: 1px solid #edf1f7;
  padding-top: 14px;
}
.nkh-priority-list article > span,
.nkh-signal-list article > span {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #e5f8f4;
  color: #0e7768;
  font-weight: 900;
}
.nkh-priority-list h3,
.nkh-signal-list h3 {
  margin: 0;
  font-size: 16px;
}
.nkh-priority-list p,
.nkh-signal-list p {
  margin: 6px 0 0;
  color: #41506f;
  line-height: 1.5;
}
.nkh-signal-list strong {
  display: block;
  font-size: 14px;
}
.nkh-signal-list em {
  display: block;
  margin-top: 8px;
  color: #7d889f;
  font-size: 12px;
  font-style: normal;
}
.nkh-support-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.nkh-route-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.nkh-route-grid article {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fff;
  padding: 18px;
  box-shadow: 0 16px 34px rgba(7, 23, 51, .04);
}
.nkh-route-grid span {
  display: block;
  margin-bottom: 8px;
  color: #006d5b;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.nkh-route-grid strong {
  display: block;
  font-size: 15px;
  line-height: 1.35;
}
.nkh-visual-stack {
  display: grid;
  gap: 16px;
  margin-top: 22px;
}
.nkh-visual-block {
  border: 1px solid #dce6f4;
  border-radius: 14px;
  background: linear-gradient(180deg, #fbfdff 0%, #fff 100%);
  padding: 20px;
}
.nkh-visual-block > div:first-child > span {
  color: #7d889f;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.nkh-visual-block h3 {
  margin: 6px 0;
  font-size: 18px;
}
.nkh-visual-block p {
  margin: 0;
  color: #53617d;
}
.nkh-visual-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}
.nkh-visual-grid div,
.nkh-flow-nodes strong {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
  padding: 12px;
}
.nkh-visual-grid strong {
  display: block;
  font-size: 18px;
}
.nkh-visual-grid span {
  display: block;
  color: #53617d;
  font-size: 12px;
  font-weight: 850;
}
.nkh-flow-nodes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}
.nkh-visual-block ul {
  margin: 14px 0 0;
  padding-left: 18px;
  color: #41506f;
}
.nkh-data-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
  margin-bottom: 16px;
}
.nkh-data-tools label {
  display: grid;
  gap: 6px;
  color: #66728c;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.nkh-data-tools input,
.nkh-data-tools select {
  min-width: 240px;
  border: 1px solid #d7dfeb;
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--ink);
  background: #fff;
  font-size: 14px;
  text-transform: none;
  letter-spacing: 0;
}
.nkh-chip,
.nkh-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #eef5ff;
  color: #174a8b;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 850;
}
.nkh-table-wrap {
  max-height: 620px;
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 14px;
}
.nkh-table-wrap table,
.nkh-proof-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.nkh-table-wrap th,
.nkh-table-wrap td,
.nkh-proof-table th,
.nkh-proof-table td {
  border-bottom: 1px solid #e9eef6;
  padding: 12px 14px;
  vertical-align: top;
  text-align: left;
}
.nkh-table-wrap th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f7f9fc;
}
.nkh-table-wrap th button {
  border: 0;
  background: transparent;
  color: #5e6b85;
  font: inherit;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
  cursor: pointer;
}
.nkh-table-wrap tr { cursor: pointer; }
.nkh-table-wrap tr.is-selected,
.nkh-table-wrap tbody tr:hover {
  background: #f4f8ff;
}
.nkh-drawer {
  margin-top: 16px;
  border: 1px solid #c8d8f4;
  border-radius: 16px;
  background: #f8fbff;
  padding: 18px;
}
.nkh-drawer-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
.nkh-drawer-head span {
  display: block;
  color: #7b879d;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .1em;
}
.nkh-drawer-head h3 {
  margin: 4px 0 0;
  font-size: 22px;
}
.nkh-drawer-head button {
  align-self: start;
  border: 1px solid #cfd9e8;
  border-radius: 10px;
  background: #fff;
  padding: 8px 12px;
  font-weight: 800;
}
.nkh-drawer-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}
.nkh-drawer-grid div {
  border: 1px solid #e1e8f3;
  border-radius: 12px;
  background: #fff;
  padding: 12px;
}
.nkh-drawer-grid span {
  display: block;
  color: #71809c;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.nkh-drawer-grid strong {
  display: block;
  margin-top: 5px;
  color: #162844;
  line-height: 1.35;
}
.nkh-evidence-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.nkh-evidence-strip span {
  width: 100%;
  color: #71809c;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}
.nkh-evidence-strip em {
  border-radius: 999px;
  background: #fff;
  color: #0c3979;
  padding: 5px 9px;
  font-style: normal;
  font-size: 12px;
  font-weight: 850;
}
.nkh-chain {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}
.nkh-chain-node {
  position: relative;
  flex: 1 1 180px;
  min-height: 104px;
  border: 1px solid #dce6f4;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff, #f7fbff);
  padding: 18px;
}
.nkh-chain-node span {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #dcf8f3;
  color: #087765;
  font-weight: 900;
}
.nkh-chain-node strong {
  display: block;
  margin-top: 14px;
  line-height: 1.3;
}
.nkh-gap-card span,
.nkh-evidence-card span {
  display: block;
  color: #8b6a23;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.nkh-gap-card strong,
.nkh-evidence-card strong,
.nkh-empty strong {
  display: block;
  margin-top: 8px;
  font-size: 18px;
  line-height: 1.3;
}
.nkh-gap-card em,
.nkh-evidence-card em {
  display: block;
  margin-top: 12px;
  color: #8a5b08;
  font-style: normal;
  line-height: 1.35;
}
.nkh-evidence-card dl,
.nkh-usecase dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 14px 0 0;
}
.nkh-evidence-card dt,
.nkh-usecase dt {
  color: #73809a;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.nkh-evidence-card dd,
.nkh-usecase dd {
  margin: 3px 0 0;
  color: #182a46;
}
.nkh-next-list,
.nkh-usecase-list {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}
.nkh-next-list div,
.nkh-usecase {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fff;
  padding: 18px;
}
.nkh-next-list strong,
.nkh-usecase h3 {
  display: block;
  margin: 0;
  font-size: 18px;
}
.nkh-next-list p,
.nkh-usecase p {
  margin: 8px 0;
  color: #40506d;
  line-height: 1.45;
}
.nkh-next-list span {
  color: #0a6a57;
  font-size: 13px;
  font-weight: 850;
}
.nkh-usecase {
  display: grid;
  grid-template-columns: 46px 1fr;
  gap: 16px;
}
.nkh-usecase > span {
  display: inline-grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #061833;
  color: #fff;
  font-weight: 900;
}
.nkh-proof-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(300px, .9fr);
  gap: 24px;
}
.nkh-proof-metrics {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.nkh-proof-metrics div,
.nkh-render-facts div {
  border: 1px solid #dfe7f2;
  border-radius: 14px;
  padding: 16px;
}
.nkh-layer-visual { margin-top: 20px; }
.nkh-orbit {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  align-items: stretch;
  margin-top: 18px;
}
.nkh-orbit > div,
.nkh-orbit > section {
  border: 1px solid #dce8f8;
  border-radius: 16px;
  background: #fbfdff;
  padding: 18px;
}
.nkh-orbit > section {
  display: grid;
  place-items: center;
  text-align: center;
  background: #061833;
  color: #fff;
}
.nkh-orbit strong {
  display: block;
  font-size: 16px;
}
.nkh-orbit span {
  display: block;
  margin-top: 8px;
  color: #53617d;
  line-height: 1.35;
}
.nkh-orbit > section span { color: #d5e2f7; }
.nkh-proof-table { margin-top: 20px; }
.nkh-render-facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0;
}
.nkh-ava {
  position: fixed;
  right: 26px;
  bottom: 24px;
  z-index: 20;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 999px;
  background: #071733;
  color: #fff;
  box-shadow: 0 18px 40px rgba(7, 23, 51, .24);
  padding: 12px 18px;
  font-weight: 900;
}
.nkh-ava span {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #0b61a5;
  color: #52d6ff;
}
@media (max-width: 1100px) {
  .nexus-home-contract { grid-template-columns: 1fr; }
  .nkh-rail { position: static; height: auto; }
  .nkh-main { padding: 28px 22px 96px; }
  .nkh-hero,
  .nkh-proof-hero,
  .nkh-brief-grid,
  .nkh-split-section,
  .nkh-support-grid { grid-template-columns: 1fr; }
  .nkh-card-grid,
  .nkh-breakdown-grid,
  .nkh-fact-grid,
  .nkh-route-grid,
  .nkh-visual-grid,
  .nkh-orbit,
  .nkh-render-facts { grid-template-columns: 1fr; }
}
`;

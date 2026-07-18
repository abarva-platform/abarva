"use client";

import { useMemo, useState } from "react";

import type {
  HomeKnowledgeDataColumn,
  HomeKnowledgeDesignContractPack,
  HomeKnowledgeDimension,
  HomeKnowledgeEvidence,
  HomeKnowledgeGap,
  HomeKnowledgeRecord,
} from "@/lib/home/home-knowledge-design-contract";

type TopTab = "overview" | "gaps" | "usecases" | "proof";
type DimensionTab = "summary" | "data" | "relationships" | "gaps" | "evidence";
type SurfaceMode = "enterprise" | "dimension" | "confidence";

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
  { key: "summary", label: "Overview" },
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

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
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

function sourceStatus(status: unknown): string {
  const value = asText(status);
  if (value === "source-backed") return "Decision-grade";
  if (value === "directional") return "Directional";
  if (value === "needs-evidence") return "Weak";
  if (value === "not-evidenced") return "Not evidenced";
  return statusLabel(status);
}

function statusColor(status: unknown): string {
  const value = asText(status);
  if (value === "source-backed") return "#1f9d63";
  if (value === "directional") return "#c99a2e";
  if (value === "needs-evidence" || value === "not-evidenced") return "#c2703a";
  return "#6b7280";
}

function factValue(
  facts: HomeKnowledgeRecord[],
  label: string,
): HomeKnowledgeRecord | null {
  const wanted = label.toLowerCase();
  return (
    facts.find((fact) => asText(fact.label).toLowerCase() === wanted) ?? null
  );
}

function executiveAtGlanceFacts(
  pack: HomeKnowledgeDesignContractPack,
): HomeKnowledgeRecord[] {
  const facts = pack.design_slots.FACTS ?? [];
  const designOrderedLabels = new Set([
    "Net revenue",
    "Employees",
    "FY26 IT budget",
    "Headquarters",
    "Applications",
    "Vendors",
    "Approved programs",
    "AI candidates",
    "Enterprise risks",
    "Evidence items",
  ]);
  const designFacts = facts.filter((fact) =>
    designOrderedLabels.has(asText(fact.label)),
  );
  return (designFacts.length ? designFacts : facts).slice(0, 10);
}

function enterpriseHeroSummary(pack: HomeKnowledgeDesignContractPack): string {
  const authoredHero = narrativeString(pack, "enterprise_hero_summary");
  if (authoredHero) return authoredHero;
  const facts = pack.design_slots.FACTS ?? [];
  const ehr = factValue(facts, "Core EHR Platform")?.value;
  const analytics = factValue(facts, "Analytics Estate")?.value;
  const target = factValue(facts, "Target Cloud Platform")?.value;
  const risk = factValue(facts, "Managed Services Risk")?.value;
  const fallback = narrativeString(pack, "enterprise_brief_summary")
    .split(/(?<=\.)\s+/)
    .slice(0, 2)
    .join(" ");
  return (
    [
      fallback,
      ehr ? `Clinical core: ${asText(ehr)}.` : "",
      analytics ? `Analytics estate: ${asText(analytics)}.` : "",
      target ? `${asText(target)} is target-state direction.` : "",
      risk ? `Managed-services posture: ${asText(risk)}.` : "",
    ]
      .filter(Boolean)
      .join(" ") || `${pack.tenant_name} Knowledge context is source-backed.`
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
  const [confidenceValue, setConfidenceValue] = useState("all");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const activeDimension =
    dimensions.find((dimension) => dimension.key === activeDimensionKey) ??
    dimensions[0];
  const activeData = activeDimension
    ? slots.DATA?.[activeDimension.key]
    : undefined;
  const activeRows = useMemo(() => activeData?.rows ?? [], [activeData?.rows]);
  const activeColumns = useMemo(
    () => activeData?.columns ?? [],
    [activeData?.columns],
  );
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

  const statusColumnKey = useMemo(() => {
    const statusColumn =
      activeColumns.find((column) => column.pill === "status") ??
      activeColumns.find((column) => /status|confidence|readiness/i.test(column.k));
    return statusColumn?.k ?? null;
  }, [activeColumns]);

  const confidenceOptions = useMemo(() => {
    if (!statusColumnKey) return [];
    return Array.from(
      new Set(
        activeRows
          .map((row) => sourceStatus(row[statusColumnKey]))
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [activeRows, statusColumnKey]);

  const visibleRows = useMemo(() => {
    const query = tableQuery.trim().toLowerCase();
    const facet = activeData?.facet;
    const rows = activeRows.filter((row) => {
      const matchesQuery = !query || JSON.stringify(row).toLowerCase().includes(query);
      const matchesFacet =
        !facet || facetValue === "all" || asText(row[facet]) === facetValue;
      const matchesConfidence =
        !statusColumnKey ||
        confidenceValue === "all" ||
        sourceStatus(row[statusColumnKey]) === confidenceValue;
      return matchesQuery && matchesFacet && matchesConfidence;
    });
    if (!sortKey) return rows;
    return [...rows].sort((a, b) =>
      asText(a[sortKey]).localeCompare(asText(b[sortKey])),
    );
  }, [
    activeData?.facet,
    activeRows,
    confidenceValue,
    facetValue,
    sortKey,
    statusColumnKey,
    tableQuery,
  ]);

  const selectedRow =
    selectedRowIndex === null ? null : visibleRows[selectedRowIndex] ?? null;

  function selectDimension(key: string) {
    setActiveDimensionKey(key);
    setSurfaceMode("dimension");
    setDimensionTab("summary");
    setTableQuery("");
    setFacetValue("all");
    setConfidenceValue("all");
    setSortKey(null);
    setSelectedRowIndex(null);
  }

  function showEnterpriseBrief() {
    setSurfaceMode("enterprise");
    setTopTab("overview");
    setDimensionTab("summary");
    setSelectedRowIndex(null);
  }

  function showContextConfidence() {
    setSurfaceMode("confidence");
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
            onClick={showEnterpriseBrief}
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
            className={`nkh-dim-link ${surfaceMode === "confidence" ? "is-active" : ""}`}
            type="button"
            onClick={showContextConfidence}
          >
            <span className="nkh-dot">✓</span>
            <span>
              <strong>Context Confidence</strong>
              <small>Trust and readiness</small>
            </span>
            <em>Ready</em>
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
              {pack.tenant_name}
              {surfaceMode === "dimension" && activeDimension ? (
                <>
                  <span>›</span> {activeDimension.name}
                </>
              ) : null}
              {surfaceMode === "confidence" ? (
                <>
                  <span>›</span> Context Confidence
                </>
              ) : null}
            </div>
            <h1>
              {pack.tenant_name}
              <span className="nkh-demo-pill">Demo</span>
            </h1>
            <p>{enterpriseHeroSummary(pack)}</p>
          </div>
          <div className="nkh-status-card">
            <strong>Active Knowledge context</strong>
            <span>Updated {formatDate(pack.generated_at)}</span>
            <span>Active context: {pack.validation?.status === "pass" ? "Source-backed" : "Needs review"}</span>
            <span>Planning-grade · not client-certified</span>
          </div>
        </header>

        {surfaceMode === "enterprise" ? (
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
        ) : null}

        {topTab === "overview" && surfaceMode === "enterprise" ? (
          <EnterpriseOverview
            decisionCannot={slots.DEC_CANNOT ?? []}
            decisionCan={slots.DEC_CAN ?? []}
            pack={pack}
            priorities={slots.PRIORITIES ?? []}
            signals={slots.SIGNALS ?? []}
            summaryBlocks={slots.BRIEF_COLS ?? []}
          />
        ) : null}

        {surfaceMode === "dimension" && activeDimension ? (
          <div className="nkh-dimension-mode">
            <button className="nkh-back-link" type="button" onClick={showEnterpriseBrief}>
              ← Back to Enterprise Brief
            </button>
            <div className="nkh-dimension-heading">
              <div>
                <h2>{activeDimension.name}</h2>
                <p>{activeStory?.meaning ?? activeDimension.summary}</p>
              </div>
              <span className={`nkh-state-pill is-${activeDimension.status ?? "source-backed"}`}>
                {sourceStatus(activeDimension.status)}
              </span>
            </div>
            <DimensionView
              columns={activeColumns}
              dimension={activeDimension}
              evidence={activeEvidence}
              confidenceOptions={confidenceOptions}
              confidenceValue={confidenceValue}
              facetOptions={facetOptions}
              facetValue={facetValue}
              gaps={activeGaps}
              insight={activeInsight}
              rows={visibleRows}
              selectedRow={selectedRow}
              selectedRowIndex={selectedRowIndex}
              setDimensionTab={setDimensionTab}
              setConfidenceValue={setConfidenceValue}
              setFacetValue={setFacetValue}
              setSelectedRowIndex={setSelectedRowIndex}
              setSortKey={setSortKey}
              setTableQuery={setTableQuery}
              sortKey={sortKey}
              story={activeStory}
              tab={dimensionTab}
              tableQuery={tableQuery}
              relationship={activeRelationship}
            />
          </div>
        ) : null}

        {surfaceMode === "confidence" ? (
          <ContextConfidenceView
            dimensions={dimensions}
            kpis={slots.KPIS ?? []}
            pack={pack}
            table={slots.CONF_TABLE ?? []}
            onBack={showEnterpriseBrief}
            onOpenDimension={selectDimension}
          />
        ) : null}

        {topTab === "gaps" && surfaceMode === "enterprise" ? (
          <EvidenceGapsView
            gaps={slots.GAPS ?? []}
            nextEvidence={slots.NEXT_EVIDENCE ?? []}
            pack={pack}
          />
        ) : null}

        {topTab === "usecases" && surfaceMode === "enterprise" ? (
          <UseCasesView pack={pack} useCases={slots.USE_CASES ?? []} />
        ) : null}

        {topTab === "proof" && surfaceMode === "enterprise" ? (
          <ProofView
            dimensions={dimensions}
            evidence={slots.EVIDENCE ?? []}
            kpis={slots.KPIS ?? []}
            pack={pack}
            selectedSource={selectedSource}
            table={slots.CONF_TABLE ?? []}
            nextEvidence={slots.NEXT_EVIDENCE ?? []}
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
  confidenceOptions,
  confidenceValue,
  facetOptions,
  facetValue,
  gaps,
  insight,
  rows,
  selectedRow,
  selectedRowIndex,
  setDimensionTab,
  setConfidenceValue,
  setFacetValue,
  setSelectedRowIndex,
  setSortKey,
  setTableQuery,
  sortKey,
  story,
  tab,
  tableQuery,
  relationship,
}: {
  columns: HomeKnowledgeDataColumn[];
  dimension: HomeKnowledgeDimension;
  evidence: HomeKnowledgeEvidence[];
  confidenceOptions: string[];
  confidenceValue: string;
  facetOptions: string[];
  facetValue: string;
  gaps: HomeKnowledgeGap[];
  insight?: { findings?: string[]; breakdown?: { title?: string; rows?: Array<{ label?: string; value?: string; note?: string }> } };
  rows: HomeKnowledgeRecord[];
  selectedRow: HomeKnowledgeRecord | null;
  selectedRowIndex: number | null;
  setDimensionTab: (tab: DimensionTab) => void;
  setConfidenceValue: (value: string) => void;
  setFacetValue: (value: string) => void;
  setSelectedRowIndex: (index: number | null) => void;
  setSortKey: (key: string | null) => void;
  setTableQuery: (value: string) => void;
  sortKey: string | null;
  story?: { meaning?: string; observed?: string; matters?: string; supports?: string };
  tab: DimensionTab;
  tableQuery: string;
  relationship?: { chain?: string[]; note?: string };
}) {
  function exportCsv() {
    const header = columns.map((column) => csvCell(column.label)).join(",");
    const body = rows
      .map((row) =>
        columns.map((column) => csvCell(asText(row[column.k]))).join(","),
      )
      .join("\n");
    const blob = new Blob([[header, body].filter(Boolean).join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${dimension.key || "dimension"}-rows.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

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
        <div>
          <section className="nkh-observed-card">
            <div className="nkh-kicker">What Nexus observed</div>
            <p className="nkh-observed-copy">{story?.observed ?? story?.meaning ?? dimension.summary}</p>
            <div className="nkh-observed-split">
              <div className="is-warn">
                <span>Why it matters</span>
                <p>{story?.matters}</p>
              </div>
              <div className="is-ok">
                <span>Decisions this supports</span>
                <p>{story?.supports}</p>
              </div>
            </div>
          </section>

          {insight?.findings?.length ? (
            <>
              <div className="nkh-kicker nkh-section-kicker">Interesting Facts</div>
              <div className="nkh-interesting-grid">
                {insight.findings.slice(0, 3).map((finding, index) => (
                  <div key={`${finding}-${index}`}>
                    <strong>{String(index + 1).padStart(2, "0")}</strong>
                    <p>{finding}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <div className="nkh-kicker nkh-section-kicker">Dashboard</div>
          <div className="nkh-dashboard-grid">
            <MetricTile label="Records" value={(dimension.count ?? rows.length).toLocaleString()} />
            <MetricTile label="Confidence" value={sourceStatus(dimension.status)} tone={dimension.status} />
            <MetricTile label="Evidence Items" value={String(dimension.evCount ?? evidence.length)} />
            <MetricTile label="Last Refreshed" value="Jul 2026" />
          </div>

          <div className="nkh-dashboard-split">
            {insight?.breakdown?.rows?.length ? (
              <section>
                <h3>{insight.breakdown.title ?? "Evidence posture"}</h3>
                {insight.breakdown.rows.map((row, index) => (
                  <div key={`${row.label}-${index}`} className="nkh-breakdown-row">
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                ))}
              </section>
            ) : null}
            <EvidenceMix rows={rows} columns={columns} />
          </div>
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
                Segment
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
            {confidenceOptions.length ? (
              <label>
                Confidence
                <select
                  value={confidenceValue}
                  onChange={(event) => {
                    setConfidenceValue(event.target.value);
                    setSelectedRowIndex(null);
                  }}
                >
                  <option value="all">All confidence</option>
                  {confidenceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <span className="nkh-chip">
              Showing {rows.length} of {dimension.count ?? rows.length}
            </span>
            <button className="nkh-export" type="button" onClick={exportCsv}>
              Export CSV
            </button>
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
        <div>
          <p className="nkh-tab-intro">
            {relationship?.note ?? "Relationship interpretation is advisory until source evidence is validated."}
          </p>
          <section className="nkh-relationship-card">
            <div className="nkh-chain">
            {(relationship?.chain?.length ? relationship.chain : ["Function", "System", "Data", "Vendor", "Risk"]).map((item, index) => (
              <div key={`${item}-${index}`} className="nkh-chain-node">
                <span>{index + 1}</span>
                <strong>{item}</strong>
              </div>
            ))}
            </div>
          </section>
          <div className="nkh-relationship-note">
            This chain shows how the dimension connects across the enterprise. Open the Relationships dimension to trace any node end-to-end.
          </div>
        </div>
      ) : null}

      {tab === "gaps" ? (
        <div>
          {gaps.length ? (
            <div className="nkh-gap-list">
              {gaps.map((gap, index) => <GapCard key={`${gap.missing}-${index}`} gap={gap} />)}
            </div>
          ) : (
            <EmptyState title="No priority gap surfaced" body="No repeated gap pattern is visible for this dimension in the approved render pack." />
          )}
        </div>
      ) : null}

      {tab === "evidence" ? (
        <div>
          <p className="nkh-tab-intro">
            The source files behind this dimension: what each contributed and what it still leaves open.
          </p>
          {evidence.length ? (
            <div className="nkh-evidence-list">
              {evidence.map((item, index) => <EvidenceCard key={`${item.name}-${index}`} evidence={item} />)}
            </div>
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
  pack,
  priorities,
  signals,
  summaryBlocks,
}: {
  decisionCannot: string[];
  decisionCan: string[];
  pack: HomeKnowledgeDesignContractPack;
  priorities: HomeKnowledgeRecord[];
  signals: HomeKnowledgeRecord[];
  summaryBlocks: HomeKnowledgeRecord[];
}) {
  const title = narrativeString(pack, "enterprise_brief_title");
  const summary = narrativeString(pack, "enterprise_brief_summary");
  const executiveFacts = executiveAtGlanceFacts(pack);

  return (
    <div className="nkh-section nkh-enterprise-overview">
      <section className="nkh-at-glance" aria-label="Enterprise at a glance">
        <div className="nkh-inline-head">
          <div className="nkh-kicker">Enterprise at a glance</div>
          <span>known facts · every metric traceable to evidence</span>
        </div>
        <div className="nkh-fact-grid">
          {executiveFacts.map((fact, index) => (
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
        <div className="nkh-kicker nkh-section-kicker">Key Priorities</div>
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
      </section>

      <section className="nkh-leadership-signals">
        <div className="nkh-inline-head">
          <h2>Leadership Signals</h2>
          <span>from executive interviews · Jul 2026</span>
        </div>
        <div className="nkh-signal-list">
          {signals.slice(0, 3).map((signal, index) => (
            <figure key={`${signal.role}-${index}`}>
              <blockquote>{asText(signal.quote)}</blockquote>
              <figcaption>
                <span>{asText(signal.initials)}</span>
                <div>
                  <strong>{asText(signal.role)}</strong>
                  <em>{asText(signal.source)}</em>
                </div>
              </figcaption>
            </figure>
          ))}
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

      <section className="nkh-handoff-bar" aria-label="Route this knowledge">
        <div>
          <h3>Route this knowledge to a decision</h3>
          <span>Home is the launchpad</span>
        </div>
        <div>
          {[
            ["Analyze in Tower", "Budget & value posture"],
            ["Build a Move", "Program lifecycle & planning"],
            ["Send to Source", "Vendor & contract leverage"],
            ["Ask aVa", "Explain the AI opportunity"],
            ["Request evidence", "Fill the missing gaps"],
          ].map(([label, desc]) => (
            <button key={label} type="button">
              <strong>{label}</strong>
              <span>{desc}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ContextConfidenceView({
  dimensions,
  kpis,
  onBack,
  onOpenDimension,
  pack,
  table,
}: {
  dimensions: HomeKnowledgeDimension[];
  kpis: HomeKnowledgeRecord[];
  onBack: () => void;
  onOpenDimension: (key: string) => void;
  pack: HomeKnowledgeDesignContractPack;
  table: HomeKnowledgeRecord[];
}) {
  const summary = narrativeString(pack, "context_confidence_summary");

  return (
    <div className="nkh-section nkh-confidence-mode">
      <button className="nkh-back-link" type="button" onClick={onBack}>
        ← Back to Enterprise Brief
      </button>
      <p className="nkh-tab-intro">
        How much of the enterprise context is strong enough to decide from. Each dimension is rated decision-grade, directional, weak, or not evidenced. Click any cell to inspect its evidence.
      </p>

      <section className="nkh-confidence-panel">
        <div className="nkh-confidence-head">
          <h2>Context Confidence</h2>
          <span>decision readiness across {dimensions.length} dimensions</span>
          <div>
            {[
              ["source-backed", "Decision-grade"],
              ["directional", "Directional"],
              ["needs-evidence", "Weak"],
              ["not-evidenced", "Not evidenced"],
            ].map(([status, label]) => (
              <em key={status}>
                <i style={{ background: statusColor(status) }} />
                {label}
              </em>
            ))}
          </div>
        </div>
        {summary ? <p className="nkh-confidence-summary-copy">{summary}</p> : null}
        <div className="nkh-kpi-grid">
          {kpis.slice(0, 5).map((kpi, index) => (
            <div key={`${kpi.label}-${index}`} className={`nkh-kpi-card is-${asText(kpi.tone) || "plain"}`}>
              <span>{metricValue(kpi, "label")}</span>
              <strong>{metricValue(kpi, "value")}</strong>
              <p>{metricValue(kpi, "sub")}</p>
            </div>
          ))}
        </div>
        <div className="nkh-confidence-grid" aria-label="Dimension confidence">
          {dimensions.map((dimension) => (
            <button
              key={dimension.key}
              className={`nkh-confidence-cell is-${dimension.status ?? "source-backed"}`}
              type="button"
              onClick={() => onOpenDimension(dimension.key)}
              title={`${dimension.name} · ${sourceStatus(dimension.status)}`}
            >
              <span>{dimension.name}</span>
              <strong>{dimension.pct ?? "—"}</strong>
            </button>
          ))}
        </div>
        <table className="nkh-confidence-table">
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Readiness</th>
              <th>CXO interpretation</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row, index) => (
              <tr key={`${row.dim}-${index}`}>
                <td>{asText(row.dim)}</td>
                <td>
                  <span className={`nkh-state-pill is-${asText(row.status) || "source-backed"}`}>
                    {sourceStatus(row.status)}
                  </span>
                </td>
                <td>{asText(row.note)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function StoryBlock({
  body,
  items,
  title,
  tone = "ok",
}: {
  body?: string;
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
        <p>{body}</p>
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

function MetricTile({
  label,
  tone,
  value,
}: {
  label: string;
  tone?: unknown;
  value: string;
}) {
  return (
    <div className="nkh-dashboard-tile">
      <span>{label}</span>
      <strong style={{ color: tone ? statusColor(tone) : undefined }}>
        {value}
      </strong>
    </div>
  );
}

function EvidenceMix({
  columns,
  rows,
}: {
  columns: HomeKnowledgeDataColumn[];
  rows: HomeKnowledgeRecord[];
}) {
  const statusColumn =
    columns.find((column) => column.pill === "status") ??
    columns.find((column) => /status|confidence|readiness/i.test(column.k));
  if (!statusColumn || !rows.length) return null;
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = asText(row[statusColumn.k]) || "source-backed";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = rows.length;
  const ordered = ["source-backed", "directional", "needs-evidence", "not-evidenced"]
    .filter((key) => counts.has(key))
    .map((key) => {
      const count = counts.get(key) ?? 0;
      return {
        key,
        count,
        pct: Math.round((count / total) * 100),
      };
    });
  return (
    <section className="nkh-evidence-mix">
      <h3>Evidence strength mix</h3>
      {ordered.map((item) => (
        <div key={item.key}>
          <div>
            <span>{sourceStatus(item.key)}</span>
            <em style={{ color: statusColor(item.key) }}>
              {item.count} · {item.pct}%
            </em>
          </div>
          <b>
            <i
              style={{
                background: statusColor(item.key),
                width: `${Math.max(3, item.pct)}%`,
              }}
            />
          </b>
        </div>
      ))}
    </section>
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
  pack,
}: {
  gaps: HomeKnowledgeRecord[];
  nextEvidence: HomeKnowledgeRecord[];
  pack: HomeKnowledgeDesignContractPack;
}) {
  const summary = narrativeString(pack, "evidence_gaps_summary");
  return (
    <div className="nkh-section">
      <p className="nkh-tab-intro">
        {summary ||
          "Where knowledge is incomplete, and the decisions each gap blocks. Nexus does not overclaim before value, ROI, or production readiness can advance."}
      </p>
      <div className="nkh-gap-list">
        {gaps.map((gap, index) => (
          <div key={`${gap.title}-${index}`} className="nkh-gap-card">
            <span>{asText(gap.type) || "Evidence"}</span>
            <strong>{asText(gap.title)}</strong>
            <p>{asText(gap.blocks)}</p>
            <em>{asText(gap.severity)}</em>
            <button type="button">Request evidence</button>
          </div>
        ))}
      </div>
      {nextEvidence.length ? <span className="nkh-hidden-count">{nextEvidence.length}</span> : null}
    </div>
  );
}

function UseCasesView({
  pack,
  useCases,
}: {
  pack: HomeKnowledgeDesignContractPack;
  useCases: HomeKnowledgeRecord[];
}) {
  const summary = narrativeString(pack, "use_cases_summary");
  return (
    <div className="nkh-section">
      <p className="nkh-tab-intro">
        {summary ||
          "The candidate AI portfolio is a longlist for prioritization. No opportunity is production-ready until its evidence gate is cleared."}
      </p>
      <div className="nkh-table-wrap">
        <table>
          <thead>
            <tr>
              <th>AI opportunity</th>
              <th>Function</th>
              <th>Stage</th>
              <th>Est. value</th>
              <th>Gate before scale</th>
            </tr>
          </thead>
          <tbody>
            {useCases.map((useCase, index) => (
              <tr key={`${useCase.name}-${index}`}>
                <td>{asText(useCase.name)}</td>
                <td>{asText(useCase.fn)}</td>
                <td><span className="nkh-pill">{asText(useCase.stage)}</span></td>
                <td>{asText(useCase.value)}</td>
                <td>{asText(useCase.gate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProofView({
  dimensions,
  evidence,
  kpis,
  nextEvidence,
  pack,
  selectedSource,
  table,
}: {
  dimensions: HomeKnowledgeDimension[];
  evidence: HomeKnowledgeEvidence[];
  kpis: HomeKnowledgeRecord[];
  nextEvidence: HomeKnowledgeRecord[];
  pack: HomeKnowledgeDesignContractPack;
  selectedSource?: string | null;
  table: HomeKnowledgeRecord[];
}) {
  const proofSummary = narrativeString(pack, "proof_summary");
  const relationshipVisual = pack.narrative_sections?.proof_relationship_visual as
    | {
        title?: string;
        caption?: string;
        nodes?: string[];
        edges?: string[];
      }
    | undefined;
  return (
    <div className="nkh-section">
      {proofSummary ? <p className="nkh-tab-intro">{proofSummary}</p> : null}
      <div className="nkh-proof-split">
        <section className="nkh-proof-table">
          <h2>Evidence sources</h2>
          <p>
            {evidence.length.toLocaleString()} items across documents, system exports,
            and interviews. Every visible claim above remains traceable.
          </p>
          <div className="nkh-evidence-source-list">
            {evidence.slice(0, 12).map((item, index) => (
              <EvidenceCard key={`${item.name}-${index}`} evidence={item} compact />
            ))}
          </div>
        </section>
        <section className="nkh-next-evidence-panel">
          <div className="nkh-kicker">Recommended Next Evidence</div>
          <p>
            What Meridian should upload or confirm next, and what each item unlocks.
          </p>
          <div className="nkh-next-list">
            {nextEvidence.slice(0, 8).map((item, index) => (
              <div key={`${item.item}-${index}`}>
                <strong>{asText(item.item)}</strong>
                <p>{asText(item.unlocks)}</p>
                <span>{asText(item.owner_hint)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      {relationshipVisual?.title || kpis.length || dimensions.length || selectedSource || table.length ? (
        <span className="nkh-hidden-count">{formatDate(pack.generated_at)}</span>
      ) : null}
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

function EvidenceCard({
  compact = false,
  evidence,
}: {
  compact?: boolean;
  evidence: HomeKnowledgeEvidence;
}) {
  return (
    <div className={`nkh-evidence-card ${compact ? "is-compact" : ""}`}>
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
  --paper: #fbfbf8;
  --paper-line: #eceae2;
  --serif: "Source Serif 4", Georgia, serif;
  --sans: "Source Sans 3", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  display: grid;
  grid-template-columns: 272px minmax(0, 1fr);
  min-height: calc(100vh - 72px);
  color: var(--ink);
  background: var(--paper);
  font-family: var(--sans);
}
.nkh-rail {
  position: sticky;
  top: 0;
  align-self: start;
  height: calc(100vh - 72px);
  overflow: auto;
  border-right: 1px solid var(--paper-line);
  background: #fff;
  padding: 16px 10px 22px;
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
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
}
.nkh-rail-primary.is-active,
.nkh-dim-link.is-active {
  background: #eef4ff;
  color: #0d3975;
  box-shadow: inset 2px 0 0 #2f5fd0;
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
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 26px 40px 80px;
}
.nkh-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 262px;
  gap: 28px;
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
  margin: 18px 0 12px;
  font-family: var(--serif);
  font-size: 40px;
  line-height: 1.05;
  letter-spacing: -.01em;
  color: #15202f;
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
  max-width: 820px;
  margin: 0;
  color: #5a636f;
  font-size: 15px;
  line-height: 1.6;
}
.nkh-status-card {
  border: 1px solid var(--paper-line);
  border-radius: 12px;
  background: #fff;
  box-shadow: none;
  padding: 16px 18px;
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
  gap: 26px;
  border-bottom: 1px solid #e7e5dc;
  margin-top: 26px;
}
.nkh-tabs button,
.nkh-subtabs button {
  border: 0;
  border-bottom: 2.5px solid transparent;
  padding: 0 2px 13px;
  color: #8b93a0;
  background: transparent;
  font-size: 14.5px;
  font-weight: 700;
  cursor: pointer;
}
.nkh-tabs button.is-active,
.nkh-subtabs button.is-active {
  color: #06214b;
  border-color: #2f5fd0;
}
.nkh-section {
  margin-top: 34px;
}
.nkh-dimension-mode,
.nkh-confidence-mode {
  margin-top: 26px;
}
.nkh-back-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin: 0 0 18px;
  border: 0;
  background: transparent;
  color: #2f5fd0;
  cursor: pointer;
  font: 700 13px var(--sans);
  padding: 0;
}
.nkh-back-link:hover { color: #22489f; }
.nkh-dimension-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 8px;
}
.nkh-dimension-heading h2 {
  margin: 0;
  color: #15202f;
  font: 700 28px/1.15 var(--serif);
}
.nkh-dimension-heading p {
  margin: 8px 0 0;
  max-width: 820px;
  color: #3f4a5a;
  font: 500 15px/1.5 var(--sans);
}
.nkh-state-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 4px 10px;
  background: #e9f6ef;
  color: #1f9d63;
  font: 700 11.5px var(--sans);
  white-space: nowrap;
}
.nkh-state-pill::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 2px;
  background: currentColor;
}
.nkh-state-pill.is-directional {
  background: #f9f0d8;
  color: #c99a2e;
}
.nkh-state-pill.is-needs-evidence {
  background: #f7ebe3;
  color: #c2703a;
}
.nkh-state-pill.is-not-evidenced {
  background: #eff0f2;
  color: #7f8894;
}
.nkh-confidence-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
  border: 1px solid var(--paper-line);
  border-radius: 14px;
  background: #fff;
  padding: 28px 30px;
}
.nkh-confidence-hero h2 {
  margin: 10px 0 12px;
  color: #15202f;
  font: 700 27px/1.2 var(--serif);
}
.nkh-confidence-hero p {
  margin: 0;
  color: #4a5462;
  font: 400 15.5px/1.6 var(--sans);
}
.nkh-confidence-summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
.nkh-confidence-summary div {
  border: 1px solid #efeee7;
  border-radius: 12px;
  background: #faf9f5;
  padding: 14px 16px;
}
.nkh-confidence-summary strong {
  display: block;
  color: #15202f;
  font: 700 24px/1 var(--serif);
}
.nkh-confidence-summary span {
  display: block;
  margin-top: 5px;
  color: #6b7280;
  font: 600 12px var(--sans);
}
.nkh-confidence-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(126px, 1fr));
  gap: 9px;
  margin-top: 18px;
}
.nkh-confidence-cell {
  min-height: 66px;
  border: 1px solid rgba(31, 157, 99, .28);
  border-radius: 8px;
  background: #e9f6ef;
  color: #1f9d63;
  cursor: pointer;
  padding: 11px 12px;
  text-align: left;
}
.nkh-confidence-cell.is-directional {
  border-color: rgba(201, 154, 46, .3);
  background: #f9f0d8;
  color: #9a7020;
}
.nkh-confidence-cell.is-needs-evidence,
.nkh-confidence-cell.is-not-evidenced {
  border-color: rgba(194, 112, 58, .32);
  background: #f7ebe3;
  color: #a25024;
}
.nkh-confidence-cell span {
  display: block;
  color: inherit;
  font: 700 12px/1.25 var(--sans);
}
.nkh-confidence-cell strong {
  display: block;
  margin-top: 8px;
  color: inherit;
  font: 700 10px/1 "IBM Plex Mono", ui-monospace, monospace;
}
.nkh-confidence-cell em {
  display: block;
  margin-top: 6px;
  color: inherit;
  opacity: .8;
  font: 600 10px/1.1 var(--sans);
  font-style: normal;
}
.nkh-confidence-kpis {
  margin-top: 18px;
}
.nkh-enterprise-overview {
  display: grid;
  gap: 22px;
}
.nkh-at-glance {
  border-top: 1px solid #e7e5dc;
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
.nkh-section-subtitle {
  margin: 4px 0 0;
  color: #8b93a0;
  font-size: 12.5px;
  font-weight: 700;
}
.nkh-fact-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.nkh-fact-card {
  min-height: 128px;
  border: 1px solid var(--paper-line);
  border-radius: 12px;
  background: #fff;
  padding: 17px 18px;
  box-shadow: none;
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
  font-family: var(--serif);
  font-size: 22px;
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
.nkh-proof-table,
.nkh-next-evidence-panel {
  border: 1px solid var(--paper-line);
  border-radius: 14px;
  background: #fff;
  box-shadow: none;
  padding: 26px;
}
.nkh-boardroom-brief {
  padding: 28px 30px;
}
.nkh-executive-summary {
  max-width: 940px;
  margin-top: 12px;
}
.nkh-executive-summary p {
  margin: 0 0 14px;
  color: #5a636f;
  font-size: 15.5px;
  line-height: 1.6;
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
.nkh-proof-table h2,
.nkh-next-evidence-panel h2 {
  margin: 10px 0 12px;
  font-family: var(--serif);
  font-size: 27px;
  line-height: 1.2;
}
.nkh-lede,
.nkh-story-card > p,
.nkh-proof-hero > div > p,
.nkh-layer-visual > p,
.nkh-next-evidence-panel > p,
.nkh-proof-table > p {
  margin: 0;
  color: #5a636f;
  font-size: 15.5px;
  line-height: 1.6;
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
.nkh-export {
  border: 1px solid #d7dfeb;
  border-radius: 10px;
  background: #fff;
  color: var(--ink);
  cursor: pointer;
  font-weight: 850;
  padding: 10px 14px;
}
.nkh-export:hover { border-color: #1167d8; color: #1167d8; }
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
.nkh-evidence-card.is-compact {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  column-gap: 13px;
  align-items: start;
  border: 0;
  border-bottom: 1px solid #f4f3ee;
  border-radius: 0;
  padding: 12px 4px;
}
.nkh-evidence-card.is-compact span {
  grid-row: span 3;
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #e9ecf9;
  color: #3a4796;
  font: 800 10px "IBM Plex Mono", ui-monospace, monospace;
  letter-spacing: 0;
}
.nkh-evidence-card.is-compact strong {
  margin: 0;
  font: 700 13px var(--sans);
}
.nkh-evidence-card.is-compact p {
  margin-top: 2px;
  color: #8b93a0;
  font-size: 12px;
}
.nkh-evidence-card.is-compact dl,
.nkh-evidence-card.is-compact em {
  display: none;
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
.nkh-proof-split {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, .85fr);
  gap: 18px;
  margin-top: 20px;
}
.nkh-next-evidence-panel {
  align-self: start;
  background: #faf6ec;
  border-color: #ecdfbf;
}
.nkh-evidence-source-list {
  display: flex;
  flex-direction: column;
  margin-top: 16px;
}
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
.nkh-proof-split .nkh-proof-table { margin-top: 0; }
.nkh-render-facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0;
}
.nkh-technical-proof {
  margin-top: 20px;
  border: 1px dashed #d9e1ee;
  border-radius: 12px;
  background: #fbfcfe;
  padding: 14px 16px;
}
.nkh-technical-proof summary {
  cursor: pointer;
  color: #53617d;
  font: 800 12px var(--sans);
}
.nkh-technical-proof > p {
  margin: 12px 0 0;
  color: #65728d;
  font-size: 12.5px;
}
.nkh-inline-head {
  display: flex;
  align-items: baseline;
  gap: 11px;
  margin-bottom: 16px;
}
.nkh-inline-head h2 {
  margin: 0;
  color: #15202f;
  font: 700 21px/1.2 var(--serif);
}
.nkh-inline-head span {
  color: #8b93a0;
  font: 500 12px var(--sans);
}
.nkh-section-kicker {
  margin: 24px 0 13px;
}
.nkh-at-glance {
  border: 1px solid var(--paper-line);
  border-radius: 14px;
  background: #fff;
  padding: 20px 24px;
}
.nkh-fact-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid #f1f0ea;
}
.nkh-fact-card {
  min-height: 0;
  border: 0;
  border-bottom: 1px solid #f4f3ee;
  border-radius: 0;
  padding: 15px 16px 15px 0;
}
.nkh-fact-card strong {
  font-size: 22px;
}
.nkh-boardroom-brief {
  padding: 28px 30px;
}
.nkh-brief-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  border: 1px solid #efeee7;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 26px;
}
.nkh-brief-grid .nkh-story-block {
  border: 0;
  border-right: 1px solid #efeee7;
  border-radius: 0;
  padding: 18px 20px;
}
.nkh-brief-grid .nkh-story-block:last-child {
  border-right: 0;
}
.nkh-brief-grid .nkh-story-block h3 {
  color: #a97b1e;
  font: 800 9.5px var(--sans);
  letter-spacing: .08em;
  text-transform: uppercase;
}
.nkh-priority-list {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-top: 0;
}
.nkh-priority-list article {
  display: block;
  border-top: 2px solid #33417e;
  padding-top: 12px;
}
.nkh-priority-list article > span {
  display: block;
  width: auto;
  height: auto;
  border-radius: 0;
  background: transparent;
  color: #c3c9d8;
  font: 700 15px var(--serif);
  margin-bottom: 8px;
}
.nkh-priority-list h3 {
  font-size: 13px;
  line-height: 1.3;
}
.nkh-priority-list p {
  color: #6b7280;
  font-size: 11.5px;
  line-height: 1.5;
}
.nkh-leadership-signals {
  margin-bottom: 22px;
}
.nkh-signal-list {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 0;
}
.nkh-signal-list figure {
  display: flex;
  flex-direction: column;
  margin: 0;
  border: 1px solid #eceae2;
  border-top: 3px solid #33417e;
  border-radius: 12px;
  background: #fff;
  padding: 20px 22px 18px;
}
.nkh-signal-list blockquote {
  flex: 1;
  margin: 0 0 16px;
  color: #2a3346;
  font: italic 400 16px/1.5 var(--serif);
}
.nkh-signal-list figcaption {
  display: flex;
  align-items: center;
  gap: 11px;
  border-top: 1px solid #f1f0ea;
  padding-top: 14px;
}
.nkh-signal-list figcaption > span {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #33417e;
  color: #fff;
  font: 700 12px var(--sans);
}
.nkh-signal-list strong {
  color: #17202e;
  font: 600 13px var(--sans);
}
.nkh-signal-list em {
  margin-top: 1px;
  color: #8b93a0;
  font-size: 11.5px;
}
.nkh-handoff-bar {
  border-radius: 14px;
  background: #15202f;
  padding: 22px 26px;
}
.nkh-handoff-bar > div:first-child {
  display: flex;
  align-items: baseline;
  gap: 11px;
  margin-bottom: 16px;
}
.nkh-handoff-bar h3 {
  margin: 0;
  color: #fff;
  font: 700 18px var(--serif);
}
.nkh-handoff-bar > div:first-child span {
  color: #8f98b5;
  font-size: 12px;
}
.nkh-handoff-bar > div:last-child {
  display: flex;
  flex-wrap: wrap;
  gap: 11px;
}
.nkh-handoff-bar button {
  min-width: 150px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 10px;
  background: rgba(255,255,255,.06);
  cursor: pointer;
  padding: 13px 16px;
  text-align: left;
}
.nkh-handoff-bar button:hover {
  background: rgba(255,255,255,.11);
}
.nkh-handoff-bar button strong,
.nkh-handoff-bar button span {
  display: block;
}
.nkh-handoff-bar button strong {
  color: #fff;
  font-size: 13px;
}
.nkh-handoff-bar button span {
  margin-top: 4px;
  color: #9aa3c2;
  font-size: 11px;
}
.nkh-observed-card {
  border: 1px solid #eceae2;
  border-radius: 14px;
  background: #fff;
  padding: 24px 26px;
  margin-bottom: 22px;
}
.nkh-observed-copy {
  max-width: 900px;
  margin: 0 0 22px;
  color: #26314a;
  font: 400 18px/1.55 var(--serif);
}
.nkh-observed-split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}
.nkh-observed-split div {
  border-left: 3px solid #1f9d63;
  padding-left: 15px;
}
.nkh-observed-split div.is-warn {
  border-left-color: #c2703a;
}
.nkh-observed-split span {
  display: block;
  margin-bottom: 8px;
  color: #1f9d63;
  font: 800 10px var(--sans);
  letter-spacing: .06em;
  text-transform: uppercase;
}
.nkh-observed-split div.is-warn span {
  color: #c2703a;
}
.nkh-observed-split p {
  margin: 0;
  color: #4a5462;
  font: 400 13.5px/1.55 var(--sans);
}
.nkh-interesting-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 13px;
  margin-bottom: 24px;
}
.nkh-interesting-grid div {
  border: 1px solid #eceae2;
  border-top: 2px solid #33417e;
  border-radius: 12px;
  background: #fff;
  padding: 18px 20px;
}
.nkh-interesting-grid strong {
  display: block;
  margin-bottom: 10px;
  color: #15202f;
  font: 700 24px/1.1 var(--serif);
}
.nkh-interesting-grid p {
  margin: 0;
  color: #4a5462;
  font: 400 13px/1.55 var(--sans);
}
.nkh-dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 13px;
  margin-bottom: 14px;
}
.nkh-dashboard-tile,
.nkh-dashboard-split section {
  border: 1px solid #eceae2;
  border-radius: 12px;
  background: #fff;
  padding: 16px 18px;
}
.nkh-dashboard-tile span {
  display: block;
  margin-bottom: 8px;
  color: #a97b1e;
  font: 800 9.5px var(--sans);
  letter-spacing: .07em;
  text-transform: uppercase;
}
.nkh-dashboard-tile strong {
  color: #17202e;
  font: 700 24px var(--serif);
}
.nkh-dashboard-split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
}
.nkh-dashboard-split h3,
.nkh-evidence-mix h3 {
  margin: 0 0 14px;
  color: #17202e;
  font: 600 14px var(--sans);
}
.nkh-breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f4f3ee;
  padding: 11px 0;
}
.nkh-breakdown-row span {
  color: #5a636f;
  font-size: 13px;
}
.nkh-breakdown-row strong {
  color: #17202e;
  font: 600 14px "IBM Plex Mono", ui-monospace, monospace;
}
.nkh-evidence-mix > div {
  margin-bottom: 14px;
}
.nkh-evidence-mix > div > div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.nkh-evidence-mix span {
  color: #4a5462;
  font-size: 12.5px;
  font-weight: 600;
}
.nkh-evidence-mix em {
  font: 600 12px "IBM Plex Mono", ui-monospace, monospace;
  font-style: normal;
}
.nkh-evidence-mix b {
  display: block;
  height: 8px;
  border-radius: 4px;
  background: #f1f0ea;
  overflow: hidden;
}
.nkh-evidence-mix i {
  display: block;
  height: 8px;
  border-radius: 4px;
}
.nkh-tab-intro {
  max-width: 780px;
  margin: 0 0 20px;
  color: #5a636f;
  font: 400 14.5px/1.6 var(--sans);
}
.nkh-relationship-card {
  border: 1px solid #eceae2;
  border-radius: 12px;
  background: #fff;
  padding: 26px 24px;
  margin-bottom: 16px;
}
.nkh-relationship-note {
  border: 1px solid #dbe1f0;
  border-radius: 10px;
  background: #f3f5fb;
  color: #3a4670;
  padding: 14px 18px;
  font-size: 12.5px;
}
.nkh-gap-list,
.nkh-evidence-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.nkh-gap-list .nkh-gap-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px 18px;
  border-left: 3px solid #c2703a;
}
.nkh-gap-list .nkh-gap-card span,
.nkh-gap-list .nkh-gap-card em {
  display: inline-flex;
  justify-self: start;
  border-radius: 999px;
  padding: 3px 9px;
  color: #a97b1e;
  background: #faf6ec;
  font: 700 10px var(--sans);
}
.nkh-gap-list .nkh-gap-card strong,
.nkh-gap-list .nkh-gap-card p {
  grid-column: 1;
}
.nkh-gap-list .nkh-gap-card button {
  grid-column: 2;
  grid-row: 1 / span 3;
  align-self: center;
  border: 1px solid #ecdfbf;
  border-radius: 8px;
  background: #faf6ec;
  color: #a97b1e;
  cursor: pointer;
  padding: 9px 15px;
  font-weight: 800;
}
.nkh-evidence-list .nkh-evidence-card {
  border-radius: 12px;
  padding: 20px 22px;
}
.nkh-confidence-panel {
  border: 1px solid #eceae2;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
  padding: 0 0 22px;
}
.nkh-confidence-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  border-bottom: 1px solid #f1f0ea;
  padding: 20px 26px;
}
.nkh-confidence-head h2 {
  margin: 0;
  color: #15202f;
  font: 700 20px var(--serif);
}
.nkh-confidence-head > span {
  color: #8b93a0;
  font-size: 12px;
}
.nkh-confidence-head > div {
  display: flex;
  gap: 15px;
  margin-left: auto;
}
.nkh-confidence-head em {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 11.5px;
  font-style: normal;
}
.nkh-confidence-head i {
  width: 11px;
  height: 11px;
  border-radius: 3px;
}
.nkh-confidence-summary-copy {
  margin: 18px 26px 0;
  color: #5a636f;
  font-size: 14.5px;
  line-height: 1.55;
}
.nkh-kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 13px;
  margin: 22px 26px;
}
.nkh-kpi-card {
  border: 1px solid #eceae2;
  border-radius: 13px;
  background: #fff;
  padding: 17px 18px;
}
.nkh-kpi-card.is-green {
  border-color: #cfe9da;
  background: #f2faf5;
}
.nkh-kpi-card.is-amber {
  border-color: #ecdfbf;
  background: #fbf7ee;
}
.nkh-kpi-card span {
  display: block;
  margin-bottom: 12px;
  color: #a97b1e;
  font: 800 9.5px var(--sans);
  letter-spacing: .07em;
  text-transform: uppercase;
}
.nkh-kpi-card strong {
  color: #15202f;
  font: 700 20px/1.15 var(--serif);
}
.nkh-kpi-card p {
  margin: 8px 0 0;
  color: #5a636f;
  font-size: 11.5px;
  line-height: 1.4;
}
.nkh-confidence-grid {
  margin: 0 26px 24px;
}
.nkh-confidence-table {
  width: calc(100% - 52px);
  margin: 0 26px;
  border-collapse: collapse;
}
.nkh-confidence-table th,
.nkh-confidence-table td {
  border-bottom: 1px solid #f4f3ee;
  padding: 13px 12px;
  text-align: left;
}
.nkh-confidence-table th {
  color: #98a0ad;
  font: 800 10px var(--sans);
  letter-spacing: .07em;
  text-transform: uppercase;
}
.nkh-confidence-table td {
  color: #5a636f;
  font-size: 13px;
}
.nkh-confidence-table td:first-child {
  color: #17202e;
  font-weight: 800;
}
.nkh-hidden-count {
  display: none;
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
  .nkh-support-grid,
  .nkh-observed-split,
  .nkh-dashboard-split,
  .nkh-proof-split { grid-template-columns: 1fr; }
  .nkh-card-grid,
  .nkh-breakdown-grid,
  .nkh-fact-grid,
  .nkh-kpi-grid,
  .nkh-priority-list,
  .nkh-signal-list,
  .nkh-interesting-grid,
  .nkh-dashboard-grid,
  .nkh-route-grid,
  .nkh-orbit,
  .nkh-render-facts { grid-template-columns: 1fr; }
}
`;

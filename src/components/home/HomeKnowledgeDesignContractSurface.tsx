"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  HomeKnowledgeDataColumn,
  HomeKnowledgeDataSet,
  HomeKnowledgeDesignContractPack,
  HomeKnowledgeDimension,
  HomeKnowledgeEvidence,
  HomeKnowledgeGap,
  HomeKnowledgeRecord,
} from "@/lib/home/home-knowledge-design-contract";
import {
  dimensionRowsSupportPrimaryVisual,
  resolveHomeDimensionVisualContract,
} from "@/lib/home/home-dimension-visualization-contract";
import type { HomeDimensionCrossLensFilter } from "@/lib/home/home-dimension-visualization-contract";
import {
  deriveHomeRelationshipEdges,
  type HomeRelationshipEdge,
} from "@/lib/home/derive-relationship-edges";

type TopTab = "overview" | "gaps" | "usecases" | "proof";
type DimensionTab = "summary" | "data" | "relationships" | "gaps" | "evidence";
type SurfaceMode = "enterprise" | "dimension" | "confidence";

interface HomeKnowledgeDesignContractSurfaceProps {
  pack: HomeKnowledgeDesignContractPack;
  selectedDimension?: string | null;
  selectedTab?: string | null;
  selectedSource?: string | null;
  /**
   * Edges from the tenant's derived relationship-graph.json, read
   * server-side (see home/page.tsx) since this component is client-only
   * and can't touch the filesystem. When non-empty, preferred over the
   * field-parsing fallback (deriveHomeRelationshipEdges) computed from
   * the pack's own DATA slots — it's the richer, dedicated graph source.
   */
  derivedRelationshipEdges?: HomeRelationshipEdge[];
}

const DIMENSION_TABS: Array<{ key: DimensionTab; label: string }> = [
  { key: "summary", label: "Overview" },
  { key: "data", label: "Data" },
  { key: "relationships", label: "Relationships" },
  { key: "gaps", label: "Gaps" },
  { key: "evidence", label: "Evidence" },
];

const HOME_CHART_COLORS = {
  ink: "#161411",
  ink2: "#34302a",
  ink3: "#6d675f",
  line: "#ded5c8",
  surface: "#fffdf8",
  surface2: "#fbf8f1",
  teal: "#157f74",
  green: "#218553",
  amber: "#a96d16",
  red: "#aa3a32",
};

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

function dataSetFacetKey(
  data: HomeKnowledgeDataSet | undefined,
): string | null {
  const facet = data?.facet;
  if (!facet) return null;
  if (typeof facet === "string") return facet;
  return facet.k ?? null;
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
  if (value === "source-backed") return HOME_CHART_COLORS.teal;
  if (value === "directional") return HOME_CHART_COLORS.amber;
  if (value === "needs-evidence" || value === "not-evidenced") {
    return HOME_CHART_COLORS.red;
  }
  return HOME_CHART_COLORS.ink3;
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

function factText(
  pack: HomeKnowledgeDesignContractPack,
  label: string,
  fallback = "",
): string {
  const value = factValue(pack.design_slots.FACTS ?? [], label)?.value;
  return value === undefined || value === null ? fallback : asText(value);
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

function topDimensions(
  dimensions: HomeKnowledgeDimension[],
  limit = 8,
): HomeKnowledgeDimension[] {
  return [...dimensions]
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, limit);
}

function dimensionShare(
  dimension: HomeKnowledgeDimension,
  dimensions: HomeKnowledgeDimension[],
): number {
  const total = dimensions.reduce((sum, item) => sum + (item.count ?? 0), 0);
  if (!total) return 0;
  return Math.round(((dimension.count ?? 0) / total) * 100);
}

export function HomeKnowledgeDesignContractSurface({
  pack,
  selectedDimension,
  selectedTab,
  selectedSource,
  derivedRelationshipEdges = [],
}: HomeKnowledgeDesignContractSurfaceProps) {
  const slots = pack.design_slots;
  const dimensions = useMemo(() => slots.DIMS ?? [], [slots.DIMS]);
  const relationshipEdges = useMemo(
    () =>
      derivedRelationshipEdges.length
        ? derivedRelationshipEdges
        : deriveHomeRelationshipEdges(slots.DATA ?? {}),
    [derivedRelationshipEdges, slots.DATA],
  );
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
  const [crossFilterValues, setCrossFilterValues] = useState<
    Record<string, string>
  >({});
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
    const key = dataSetFacetKey(activeData);
    if (!key) return [];
    return Array.from(
      new Set(activeRows.map((row) => asText(row[key])).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
  }, [activeData, activeRows]);

  const statusColumnKey = useMemo(() => {
    const statusColumn =
      activeColumns.find((column) => column.pill === "status") ??
      activeColumns.find((column) =>
        /status|confidence|readiness/i.test(column.k),
      );
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

  /**
   * Cross-lens filters beyond the dataset's single built-in `.facet` field
   * and the auto-detected confidence column — driven by
   * HomeDimensionVisualizationContract.crossLensFilters for the active
   * dimension. Each filter only appears once its field has at least one
   * non-empty, non-"Needs evidence" value in the loaded rows — an empty
   * dropdown is worse than no dropdown.
   */
  const activeCrossFilters = useMemo(() => {
    const contract = resolveHomeDimensionVisualContract(activeDimension?.key);
    return contract.crossLensFilters.filter(
      (filter) =>
        filter.key !== dataSetFacetKey(activeData) &&
        filter.key !== statusColumnKey,
    );
  }, [activeData, activeDimension?.key, statusColumnKey]);

  const crossFilterOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    for (const filter of activeCrossFilters) {
      const values = Array.from(
        new Set(
          activeRows
            .map((row) => asText(row[filter.key]))
            .filter(
              (value) => value && value.toLowerCase() !== "needs evidence",
            ),
        ),
      ).sort((a, b) => a.localeCompare(b));
      if (values.length) options[filter.key] = values;
    }
    return options;
  }, [activeCrossFilters, activeRows]);

  const visibleRows = useMemo(() => {
    const query = tableQuery.trim().toLowerCase();
    const facet = dataSetFacetKey(activeData);
    const rows = activeRows.filter((row) => {
      const matchesQuery =
        !query || JSON.stringify(row).toLowerCase().includes(query);
      const matchesFacet =
        !facet || facetValue === "all" || asText(row[facet]) === facetValue;
      const matchesConfidence =
        !statusColumnKey ||
        confidenceValue === "all" ||
        sourceStatus(row[statusColumnKey]) === confidenceValue;
      const matchesCrossFilters = Object.entries(crossFilterValues).every(
        ([key, value]) => value === "all" || asText(row[key]) === value,
      );
      return (
        matchesQuery && matchesFacet && matchesConfidence && matchesCrossFilters
      );
    });
    if (!sortKey) return rows;
    return [...rows].sort((a, b) =>
      asText(a[sortKey]).localeCompare(asText(b[sortKey])),
    );
  }, [
    activeData,
    activeRows,
    confidenceValue,
    crossFilterValues,
    facetValue,
    sortKey,
    statusColumnKey,
    tableQuery,
  ]);

  const selectedRow =
    selectedRowIndex === null ? null : (visibleRows[selectedRowIndex] ?? null);

  function selectDimension(key: string) {
    setActiveDimensionKey(key);
    setSurfaceMode("dimension");
    setDimensionTab("summary");
    setTableQuery("");
    setFacetValue("all");
    setConfidenceValue("all");
    setCrossFilterValues({});
    setSortKey(null);
    setSelectedRowIndex(null);
  }

  function showEnterpriseBrief() {
    setSurfaceMode("enterprise");
    setTopTab("overview");
    setDimensionTab("summary");
    setSelectedRowIndex(null);
  }

  function showEnterpriseSection(tab: TopTab) {
    setSurfaceMode("enterprise");
    setTopTab(tab);
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
              topTab === "overview" && surfaceMode === "enterprise"
                ? "is-active"
                : ""
            }`}
            type="button"
            onClick={showEnterpriseBrief}
          >
            <span className="nkh-icon">⌂</span>
            <span>Enterprise Brief</span>
          </button>
          <button
            className={`nkh-rail-primary ${
              topTab === "gaps" && surfaceMode === "enterprise"
                ? "is-active"
                : ""
            }`}
            type="button"
            onClick={() => showEnterpriseSection("gaps")}
          >
            <span className="nkh-icon">!</span>
            <span>Evidence Gaps</span>
          </button>
          <button
            className={`nkh-rail-primary ${
              topTab === "usecases" && surfaceMode === "enterprise"
                ? "is-active"
                : ""
            }`}
            type="button"
            onClick={() => showEnterpriseSection("usecases")}
          >
            <span className="nkh-icon">◇</span>
            <span>Use Cases</span>
          </button>
          <button
            className={`nkh-rail-primary ${
              topTab === "proof" && surfaceMode === "enterprise"
                ? "is-active"
                : ""
            }`}
            type="button"
            onClick={() => showEnterpriseSection("proof")}
          >
            <span className="nkh-icon">✓</span>
            <span>Source Proof</span>
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
                  activeDimension?.key === dimension.key &&
                  topTab === "overview" &&
                  surfaceMode === "dimension"
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
                    {dimension.count ?? 0} records ·{" "}
                    {statusLabel(dimension.status)}
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
            <span>
              Active context:{" "}
              {pack.validation?.status === "pass"
                ? "Source-backed"
                : "Needs review"}
            </span>
            <span>Planning-grade · not client-certified</span>
          </div>
        </header>

        {topTab === "overview" && surfaceMode === "enterprise" ? (
          <EnterpriseOverview
            decisionCannot={slots.DEC_CANNOT ?? []}
            decisionCan={slots.DEC_CAN ?? []}
            dimensions={dimensions}
            nextEvidence={slots.NEXT_EVIDENCE ?? []}
            onOpenGaps={() => setTopTab("gaps")}
            onSelectDimension={selectDimension}
            pack={pack}
            priorities={slots.PRIORITIES ?? []}
            signals={slots.SIGNALS ?? []}
            summaryBlocks={slots.BRIEF_COLS ?? []}
            useCases={slots.USE_CASES ?? []}
          />
        ) : null}

        {surfaceMode === "dimension" && activeDimension ? (
          <div className="nkh-dimension-mode">
            <button
              className="nkh-back-link"
              type="button"
              onClick={showEnterpriseBrief}
            >
              ← Back to Enterprise Brief
            </button>
            <div className="nkh-dimension-heading">
              <div>
                <h2>{activeDimension.name}</h2>
                <p>{activeStory?.meaning ?? activeDimension.summary}</p>
              </div>
              <span
                className={`nkh-state-pill is-${activeDimension.status ?? "source-backed"}`}
              >
                {sourceStatus(activeDimension.status)}
              </span>
            </div>
            <DimensionView
              columns={activeColumns}
              dataSet={activeData}
              dimension={activeDimension}
              evidence={activeEvidence}
              confidenceOptions={confidenceOptions}
              confidenceValue={confidenceValue}
              facetOptions={facetOptions}
              facetValue={facetValue}
              crossFilters={activeCrossFilters}
              crossFilterOptions={crossFilterOptions}
              crossFilterValues={crossFilterValues}
              gaps={activeGaps}
              insight={activeInsight}
              rows={visibleRows}
              selectedRow={selectedRow}
              selectedRowIndex={selectedRowIndex}
              setDimensionTab={setDimensionTab}
              setConfidenceValue={setConfidenceValue}
              setFacetValue={setFacetValue}
              setCrossFilterValues={setCrossFilterValues}
              setSelectedRowIndex={setSelectedRowIndex}
              setSortKey={setSortKey}
              setTableQuery={setTableQuery}
              sortKey={sortKey}
              story={activeStory}
              tab={dimensionTab}
              tableQuery={tableQuery}
              relationship={activeRelationship}
              relationshipEdges={
                activeDimension?.key === "rel" ? relationshipEdges : []
              }
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

      <style>{styles}</style>
    </div>
  );
}

function DimensionView({
  columns,
  dataSet,
  dimension,
  evidence,
  confidenceOptions,
  confidenceValue,
  facetOptions,
  facetValue,
  crossFilters,
  crossFilterOptions,
  crossFilterValues,
  gaps,
  insight,
  rows,
  selectedRow,
  selectedRowIndex,
  setDimensionTab,
  setConfidenceValue,
  setFacetValue,
  setCrossFilterValues,
  setSelectedRowIndex,
  setSortKey,
  setTableQuery,
  sortKey,
  story,
  tab,
  tableQuery,
  relationship,
  relationshipEdges,
}: {
  columns: HomeKnowledgeDataColumn[];
  dataSet?: HomeKnowledgeDataSet;
  dimension: HomeKnowledgeDimension;
  evidence: HomeKnowledgeEvidence[];
  confidenceOptions: string[];
  confidenceValue: string;
  relationshipEdges: HomeRelationshipEdge[];
  facetOptions: string[];
  facetValue: string;
  crossFilters: HomeDimensionCrossLensFilter[];
  crossFilterOptions: Record<string, string[]>;
  crossFilterValues: Record<string, string>;
  setCrossFilterValues: (
    updater: (previous: Record<string, string>) => Record<string, string>,
  ) => void;
  gaps: HomeKnowledgeGap[];
  insight?: {
    findings?: string[];
    breakdown?: {
      title?: string;
      rows?: Array<{ label?: string; value?: string; note?: string }>;
    };
  };
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
  story?: {
    meaning?: string;
    observed?: string;
    matters?: string;
    supports?: string;
  };
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
            <p className="nkh-observed-copy">
              {story?.observed ?? story?.meaning ?? dimension.summary}
            </p>
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
              <div className="nkh-kicker nkh-section-kicker">
                Interesting Facts
              </div>
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
            <MetricTile
              label="Records"
              value={(dimension.count ?? rows.length).toLocaleString()}
            />
            <MetricTile
              label="Confidence"
              value={sourceStatus(dimension.status)}
              tone={dimension.status}
            />
            <MetricTile
              label="Evidence Items"
              value={String(dimension.evCount ?? evidence.length)}
            />
            <MetricTile label="Last Refreshed" value="Jul 2026" />
          </div>

          <DimensionPrimaryVisual dimensionKey={dimension.key} rows={rows} />

          <div className="nkh-dashboard-split">
            {insight?.breakdown?.rows?.length ? (
              <section>
                <h3>{insight.breakdown.title ?? "Evidence posture"}</h3>
                {insight.breakdown.rows.map((row, index) => (
                  <div
                    key={`${row.label}-${index}`}
                    className="nkh-breakdown-row"
                  >
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
            {crossFilters
              .filter((filter) => crossFilterOptions[filter.key]?.length)
              .map((filter) => (
                <label key={filter.key}>
                  {filter.label}
                  <select
                    value={crossFilterValues[filter.key] ?? "all"}
                    onChange={(event) => {
                      const value = event.target.value;
                      setCrossFilterValues((previous) => ({
                        ...previous,
                        [filter.key]: value,
                      }));
                      setSelectedRowIndex(null);
                    }}
                  >
                    <option value="all">
                      All {filter.label.toLowerCase()}
                    </option>
                    {crossFilterOptions[filter.key].map((option) => (
                      <option key={option} value={option}>
                        {option.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
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
                        onClick={() =>
                          setSortKey(sortKey === column.k ? null : column.k)
                        }
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
                          <span className="nkh-pill">
                            {statusLabel(row[column.k])}
                          </span>
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
            {relationship?.note ??
              "Relationship interpretation is advisory until source evidence is validated."}
          </p>
          <section className="nkh-relationship-card">
            <div className="nkh-chain">
              {(relationship?.chain?.length
                ? relationship.chain
                : ["Function", "System", "Data", "Vendor", "Risk"]
              ).map((item, index) => (
                <div key={`${item}-${index}`} className="nkh-chain-node">
                  <span>{index + 1}</span>
                  <strong>{item}</strong>
                </div>
              ))}
            </div>
          </section>
          <div className="nkh-relationship-note">
            This chain shows how the dimension connects across the enterprise.
            Open the Relationships dimension to trace any node end-to-end.
          </div>
          {relationshipEdges.length ? (
            <RelationshipTopologyGraph edges={relationshipEdges} />
          ) : null}
        </div>
      ) : null}

      {tab === "gaps" ? (
        <div>
          {gaps.length ? (
            <div className="nkh-gap-list">
              {gaps.map((gap, index) => (
                <GapCard key={`${gap.missing}-${index}`} gap={gap} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No priority gap surfaced"
              body="No repeated gap pattern is visible for this dimension in the approved render pack."
            />
          )}
        </div>
      ) : null}

      {tab === "evidence" ? (
        <div>
          <p className="nkh-tab-intro">
            Source inventory behind this dimension: file, load date, row count,
            loader metadata, and what each source supports.
          </p>
          <SourceInventoryTable
            dataSet={dataSet}
            dimension={dimension}
            evidence={evidence}
          />
        </div>
      ) : null}
    </div>
  );
}

function EnterpriseOverview({
  decisionCannot,
  decisionCan,
  dimensions,
  nextEvidence,
  onOpenGaps,
  onSelectDimension,
  pack,
  priorities,
  signals,
  summaryBlocks,
  useCases,
}: {
  decisionCannot: string[];
  decisionCan: string[];
  dimensions: HomeKnowledgeDimension[];
  nextEvidence: HomeKnowledgeRecord[];
  onOpenGaps: () => void;
  onSelectDimension: (key: string) => void;
  pack: HomeKnowledgeDesignContractPack;
  priorities: HomeKnowledgeRecord[];
  signals: HomeKnowledgeRecord[];
  summaryBlocks: HomeKnowledgeRecord[];
  useCases: HomeKnowledgeRecord[];
}) {
  const title = narrativeString(pack, "enterprise_brief_title");
  const summary = narrativeString(pack, "enterprise_brief_summary");
  const executiveFacts = executiveAtGlanceFacts(pack);

  return (
    <div className="nkh-section nkh-enterprise-overview">
      <AiSuccessThesis
        dimensions={dimensions}
        pack={pack}
        useCases={useCases}
      />

      <SixQuestionsLanding
        dimensions={dimensions}
        onSelectDimension={onSelectDimension}
      />

      <ContextHorizon nextEvidence={nextEvidence} onOpenGaps={onOpenGaps} />

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

      <section className="nkh-intel-canvas-card">
        <div className="nkh-canvas-copy">
          <div className="nkh-kicker">Context concentration</div>
          <h2>Where the enterprise story is strongest</h2>
          <p>
            The largest loaded domains show where Nexus can already orient a
            C-suite conversation. Thin or directional domains should become the
            next evidence requests before value, sourcing, or operating-model
            claims are treated as decision-grade.
          </p>
        </div>
        <DimensionVolumeChart dimensions={dimensions} />
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
            <article
              key={`${block.label}-${index}`}
              className="nkh-story-block"
            >
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
              <span>
                {asText(priority.n) || String(index + 1).padStart(2, "0")}
              </span>
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
        <StoryBlock
          title="This context can support"
          items={decisionCan.slice(0, 6)}
        />
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

      <section className="nkh-usecase-preview">
        <div className="nkh-inline-head">
          <h2>Top candidate use cases</h2>
          <span>based on loaded context, not production certification</span>
        </div>
        <UseCasePriorityCards useCases={useCases} compact />
      </section>
    </div>
  );
}

interface SixQuestionCard {
  key: string;
  question: string;
  dimensionKeys: string[];
}

/**
 * "Do not make the page a list of 19 tabs with one chart each. The landing
 * view should open with six visual questions... each dimension becomes a
 * drill-down." Every stat below comes straight from the already-loaded
 * dimension.count/status fields -- no new data, no invented scores. A card
 * only renders once at least one of its mapped dimensions is actually
 * loaded, so a thin/future pack degrades gracefully instead of showing a
 * zeroed-out question.
 */
const SIX_LANDING_QUESTIONS: SixQuestionCard[] = [
  {
    key: "organized",
    question: "How is the enterprise organized?",
    dimensionKeys: ["org", "functions", "workforce"],
  },
  {
    key: "value-flow",
    question: "Where does value flow?",
    dimensionKeys: ["budget", "programs"],
  },
  {
    key: "runs-it",
    question: "What systems and data run it?",
    dimensionKeys: ["apps", "infra", "data", "vendors"],
  },
  {
    key: "transformation",
    question: "Where is transformation occurring?",
    dimensionKeys: ["programs", "ai"],
  },
  {
    key: "risk-evidence",
    question: "Where are risk and evidence weak?",
    dimensionKeys: ["risks", "evidence"],
  },
  {
    key: "opportunity",
    question: "Where are the largest opportunities?",
    dimensionKeys: ["ai", "metrics"],
  },
];

function SixQuestionsLanding({
  dimensions,
  onSelectDimension,
}: {
  dimensions: HomeKnowledgeDimension[];
  onSelectDimension: (key: string) => void;
}) {
  const byKey = new Map(
    dimensions.map((dimension) => [dimension.key, dimension]),
  );

  const cards = SIX_LANDING_QUESTIONS.map((question) => {
    const matched = question.dimensionKeys
      .map((key) => byKey.get(key))
      .filter((dimension): dimension is HomeKnowledgeDimension =>
        Boolean(dimension),
      );
    if (!matched.length) return null;
    const totalRecords = matched.reduce(
      (sum, dimension) => sum + (dimension.count ?? 0),
      0,
    );
    const decisionGrade = matched.filter(
      (dimension) => dimension.status === "source-backed",
    ).length;
    return { ...question, matched, totalRecords, decisionGrade };
  }).filter((card): card is NonNullable<typeof card> => Boolean(card));

  if (!cards.length) return null;

  return (
    <section className="nkh-six-questions" aria-label="Start here">
      <div className="nkh-inline-head">
        <div className="nkh-kicker">Start here</div>
        <span>
          Six questions every CXO conversation starts with — open any card for
          the dimension behind it.
        </span>
      </div>
      <div className="nkh-six-questions-grid">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            className="nkh-six-question-card"
            onClick={() => onSelectDimension(card.matched[0].key)}
          >
            <span className="nkh-six-question-title">{card.question}</span>
            <strong>{card.totalRecords.toLocaleString()} records</strong>
            <span className="nkh-six-question-meta">
              {card.decisionGrade} of {card.matched.length} dimension
              {card.matched.length === 1 ? "" : "s"} decision-grade ·{" "}
              {card.matched.map((dimension) => dimension.name).join(", ")}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/**
 * "Tease a future" — but honestly. Ghost/dashed cards for what's NOT yet
 * loaded, sourced entirely from the pack's own approved NEXT_EVIDENCE slot
 * (curated evidence-gap items with an owner_hint, already rendered
 * elsewhere in the Evidence Gaps tab) — never invented domain names. If a
 * tenant's pack has no NEXT_EVIDENCE entries, this renders nothing rather
 * than guessing what might be missing.
 */
function ContextHorizon({
  nextEvidence,
  onOpenGaps,
}: {
  nextEvidence: HomeKnowledgeRecord[];
  onOpenGaps: () => void;
}) {
  if (!nextEvidence.length) return null;
  const preview = nextEvidence.slice(0, 4);

  return (
    <section className="nkh-context-horizon" aria-label="Context horizon">
      <div className="nkh-inline-head">
        <div className="nkh-kicker">Context horizon</div>
        <span>
          {nextEvidence.length} evidence request
          {nextEvidence.length === 1 ? "" : "s"} would sharpen this picture once
          closed — not loaded yet.
        </span>
      </div>
      <div className="nkh-horizon-grid">
        {preview.map((item, index) => (
          <button
            key={`${asText(item.item)}-${index}`}
            type="button"
            className="nkh-horizon-card"
            onClick={onOpenGaps}
          >
            <span className="nkh-horizon-tag">Not yet loaded</span>
            <strong>{asText(item.item)}</strong>
            <p>{asText(item.unlocks)}</p>
            {item.owner_hint ? <em>{asText(item.owner_hint)}</em> : null}
          </button>
        ))}
      </div>
      {nextEvidence.length > preview.length ? (
        <button type="button" className="nkh-horizon-more" onClick={onOpenGaps}>
          View all {nextEvidence.length} evidence requests →
        </button>
      ) : null}
    </section>
  );
}

function AiSuccessThesis({
  dimensions,
  pack,
  useCases,
}: {
  dimensions: HomeKnowledgeDimension[];
  pack: HomeKnowledgeDesignContractPack;
  useCases: HomeKnowledgeRecord[];
}) {
  const confidence = narrativeString(pack, "context_confidence_summary");
  const gaps = narrativeString(pack, "evidence_gaps_summary");
  const proof = narrativeString(pack, "proof_summary");
  const apps = factText(pack, "Applications", "loaded");
  const evidenceItems = factText(
    pack,
    "Evidence items",
    `${pack.design_slots.EVIDENCE?.length ?? 0}`,
  );
  const aiCandidates = factText(
    pack,
    "AI candidates",
    `${useCases.length || "loaded"}`,
  );
  const risks = factText(pack, "Enterprise risks", "loaded");

  return (
    <section className="nkh-ai-thesis" aria-label="AI success thesis">
      <div className="nkh-ai-thesis-lead">
        <span>AI Success Thesis</span>
        <h2>
          AI value will not scale faster than the context layer can prove the
          work.
        </h2>
        <p>
          For {pack.tenant_name}, the strategic issue is not whether AI use
          cases exist. The issue is whether leadership can connect each use case
          to real systems, owners, data lineage, controls, economics, and
          interview-backed priorities before funding it as a scalable program.
        </p>
        <div
          className="nkh-ai-proofline"
          aria-label="Context layer proof points"
        >
          {[
            ["Context areas", `${dimensions.length}`],
            ["Evidence items", evidenceItems],
            ["Applications", apps],
            ["AI candidates", aiCandidates],
            ["Risk/control signals", risks],
          ].map(([label, value]) => (
            <div key={label}>
              <strong>{value}</strong>
              <em>{label}</em>
            </div>
          ))}
        </div>
      </div>
      <div className="nkh-ai-thesis-grid">
        <article>
          <strong>Executive read</strong>
          <p>
            Home is the investment committee for context: it separates AI bets
            that are ready to explore from market-pattern hypotheses and flags
            which missing facts would make a recommendation unsafe.
          </p>
        </article>
        <article>
          <strong>What the evidence says</strong>
          <p>
            {confidence ||
              "Source-backed context is loaded across the enterprise dimensions."}
          </p>
        </article>
        <article>
          <strong>What blocks scale</strong>
          <p>
            {gaps ||
              "Missing governance, data, ownership, and baseline evidence blocks decision-grade AI scaling."}
          </p>
        </article>
        <article>
          <strong>Decision rule</strong>
          <p>
            {proof ||
              "Use the context layer to orient decisions, identify evidence gaps, and avoid unsupported AI value claims."}
          </p>
        </article>
      </div>
    </section>
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
        How much of the enterprise context is strong enough to decide from. Each
        dimension is rated decision-grade, directional, weak, or not evidenced.
        Click any cell to inspect its evidence.
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
        {summary ? (
          <p className="nkh-confidence-summary-copy">{summary}</p>
        ) : null}
        <ConfidenceBenchmarkStrip dimensions={dimensions} />
        <div className="nkh-kpi-grid">
          {kpis.slice(0, 5).map((kpi, index) => (
            <div
              key={`${kpi.label}-${index}`}
              className={`nkh-kpi-card is-${asText(kpi.tone) || "plain"}`}
            >
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
                  <span
                    className={`nkh-state-pill is-${asText(row.status) || "source-backed"}`}
                  >
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
  const ordered = [
    "source-backed",
    "directional",
    "needs-evidence",
    "not-evidenced",
  ]
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
      {nextEvidence.length ? (
        <span className="nkh-hidden-count">{nextEvidence.length}</span>
      ) : null}
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
      <UseCasePriorityRechart useCases={useCases} />
      <UseCasePriorityCards useCases={useCases} />
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
                <td>
                  <span className="nkh-pill">{asText(useCase.stage)}</span>
                </td>
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
  const relationshipVisual = pack.narrative_sections
    ?.proof_relationship_visual as
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
      <KnowledgeLayerProofVisual
        dimensions={dimensions}
        evidence={evidence}
        nextEvidence={nextEvidence}
        relationshipVisual={relationshipVisual}
      />
      <div className="nkh-proof-split">
        <section className="nkh-proof-table">
          <h2>Evidence sources</h2>
          <p>
            {evidence.length.toLocaleString()} items across documents, system
            exports, and interviews. Every visible claim above remains
            traceable.
          </p>
          <div className="nkh-evidence-source-list">
            {evidence.slice(0, 12).map((item, index) => (
              <EvidenceCard
                key={`${item.name}-${index}`}
                evidence={item}
                compact
              />
            ))}
          </div>
        </section>
        <section className="nkh-next-evidence-panel">
          <div className="nkh-kicker">Recommended Next Evidence</div>
          <p>
            What {pack.tenant_name} should upload or confirm next, and what each
            item unlocks.
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
      {relationshipVisual?.title ||
      kpis.length ||
      dimensions.length ||
      selectedSource ||
      table.length ? (
        <span className="nkh-hidden-count">
          {formatDate(pack.generated_at)}
        </span>
      ) : null}
    </div>
  );
}

function DimensionVolumeChart({
  dimensions,
}: {
  dimensions: HomeKnowledgeDimension[];
}) {
  const visibleDimensions = topDimensions(dimensions, 9);
  const data = visibleDimensions.map((dimension) => ({
    name: dimension.name,
    count: dimension.count ?? 0,
    share: dimensionShare(dimension, dimensions),
    status: dimension.status ?? "source-backed",
    fill: statusColor(dimension.status),
  }));
  return (
    <div
      className="nkh-volume-chart"
      aria-label="Loaded context by dimension"
      data-testid="home-knowledge-dimension-volume-recharts"
    >
      <ResponsiveContainer width="100%" height={314}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 28, bottom: 4, left: 154 }}
          barCategoryGap={10}
        >
          <CartesianGrid horizontal={false} stroke={HOME_CHART_COLORS.line} />
          <XAxis
            type="number"
            tick={{ fill: HOME_CHART_COLORS.ink3, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={154}
            tick={{
              fill: HOME_CHART_COLORS.ink2,
              fontSize: 12,
              fontWeight: 700,
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<HomeChartTooltip valueLabel="Records" />} />
          <Bar
            dataKey="count"
            name="Records"
            radius={[0, 8, 8, 0]}
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Governed categorical cross-tab heatmap — the shared renderer behind
 * `estate_bubble_matrix`, `risk_control_heatmap`, and `value_readiness_matrix`
 * in home-dimension-visualization-contract.ts. Plots two REAL categorical
 * fields against each other (count per cell); never invents a numeric score.
 * Rows whose value for either field is missing or the "Needs evidence"
 * placeholder are excluded from the grid and reported as a pending count
 * instead — that gap is usually the more important story than the grid.
 */
function CategoricalCrossTabHeatmap({
  rows,
  fieldA,
  fieldB,
  title,
}: {
  rows: HomeKnowledgeRecord[];
  fieldA: { key: string; label: string };
  fieldB: { key: string; label: string };
  title: string;
}) {
  const isUnevidenced = (value: string) =>
    !value || value.trim().toLowerCase() === "needs evidence";

  const evidenced = rows.filter(
    (row) =>
      !isUnevidenced(asText(row[fieldA.key])) &&
      !isUnevidenced(asText(row[fieldB.key])),
  );
  const pending = rows.length - evidenced.length;

  const aValues = Array.from(
    new Set(evidenced.map((row) => asText(row[fieldA.key]))),
  ).sort();
  const bValues = Array.from(
    new Set(evidenced.map((row) => asText(row[fieldB.key]))),
  ).sort();

  if (!evidenced.length || !aValues.length || !bValues.length) return null;

  function cellCount(a: string, b: string): number {
    return evidenced.filter(
      (row) => asText(row[fieldA.key]) === a && asText(row[fieldB.key]) === b,
    ).length;
  }

  const maxCount = Math.max(
    1,
    ...aValues.flatMap((a) => bValues.map((b) => cellCount(a, b))),
  );

  function cellFill(count: number): string {
    if (!count) return "transparent";
    const intensity = 0.16 + (count / maxCount) * 0.74;
    return `rgba(21, 127, 116, ${intensity.toFixed(2)})`;
  }

  return (
    <div
      className="nkh-crosstab-heatmap"
      aria-label={title}
      data-testid="home-knowledge-crosstab-heatmap"
    >
      <div className="nkh-crosstab-head">
        <strong>{title}</strong>
        <span>
          {evidenced.length} of {rows.length} rows evidenced for both{" "}
          {fieldA.label.toLowerCase()} and {fieldB.label.toLowerCase()}
          {pending > 0 ? ` · ${pending} pending evidence` : ""}
        </span>
      </div>
      <div
        className="nkh-crosstab-grid"
        style={{
          gridTemplateColumns: `148px repeat(${bValues.length}, minmax(64px, 1fr))`,
        }}
      >
        <div className="nkh-crosstab-corner" />
        {bValues.map((b) => (
          <div key={b} className="nkh-crosstab-col-label">
            {b.replaceAll("_", " ")}
          </div>
        ))}
        {aValues.map((a) => (
          <Fragment key={a}>
            <div className="nkh-crosstab-row-label">
              {a.replaceAll("_", " ")}
            </div>
            {bValues.map((b) => {
              const count = cellCount(a, b);
              return (
                <div
                  key={`${a}-${b}`}
                  className="nkh-crosstab-cell"
                  style={{ background: cellFill(count) }}
                  title={`${a.replaceAll("_", " ")} × ${b.replaceAll("_", " ")}: ${count}`}
                >
                  {count || ""}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

const CROSS_TAB_VISUAL_TYPES = new Set([
  "estate_bubble_matrix",
  "footprint_stacked_bar",
  "risk_control_heatmap",
  "value_readiness_matrix",
]);

/**
 * Looks up this dimension's HomeDimensionVisualizationContract entry and
 * renders its primary visual when the loaded rows actually carry the
 * required fields — otherwise renders nothing, leaving the existing
 * breakdown/EvidenceMix treatment as the only primary content (zero
 * regression for dimensions without a Phase-1 renderer, or whose data
 * doesn't support one yet).
 */
function DimensionPrimaryVisual({
  dimensionKey,
  rows,
}: {
  dimensionKey: string;
  rows: HomeKnowledgeRecord[];
}) {
  const contract = resolveHomeDimensionVisualContract(dimensionKey);
  if (!dimensionRowsSupportPrimaryVisual(contract, rows)) return null;
  if (!CROSS_TAB_VISUAL_TYPES.has(contract.primaryVisual)) return null;

  const [fieldAKey, fieldBKey] = contract.requiredFields;
  const fieldA = {
    key: fieldAKey,
    label:
      contract.crossLensFilters.find((f) => f.key === fieldAKey)?.label ??
      fieldAKey.replaceAll("_", " "),
  };
  const fieldB = {
    key: fieldBKey,
    label:
      contract.crossLensFilters.find((f) => f.key === fieldBKey)?.label ??
      fieldBKey.replaceAll("_", " "),
  };

  return (
    <CategoricalCrossTabHeatmap
      rows={rows}
      fieldA={fieldA}
      fieldB={fieldB}
      title={`${fieldA.label} × ${fieldB.label}`}
    />
  );
}

const TOPOLOGY_MAX_NODES_PER_SIDE = 10;

/**
 * Real bipartite topology graph, not a fabricated force-directed layout.
 * Source entities (apps, vendors, use cases) on the left, the systems/data
 * they connect to on the right, one line per real derived edge. Custom SVG
 * rather than a graph library (no react-flow/xyflow dependency exists in
 * this repo yet, and this shape doesn't need one) — same approach Tower's
 * chat-answer charts already use for custom visuals.
 */
function RelationshipTopologyGraph({
  edges,
}: {
  edges: HomeRelationshipEdge[];
}) {
  if (!edges.length) return null;

  const fromCounts = new Map<string, number>();
  const toCounts = new Map<string, number>();
  for (const edge of edges) {
    fromCounts.set(edge.from, (fromCounts.get(edge.from) ?? 0) + 1);
    toCounts.set(edge.to, (toCounts.get(edge.to) ?? 0) + 1);
  }
  const rank = (counts: Map<string, number>) =>
    Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  const fromRanked = rank(fromCounts);
  const toRanked = rank(toCounts);
  const fromNodes = fromRanked
    .slice(0, TOPOLOGY_MAX_NODES_PER_SIDE)
    .map(([n]) => n);
  const toNodes = toRanked
    .slice(0, TOPOLOGY_MAX_NODES_PER_SIDE)
    .map(([n]) => n);
  const hiddenFrom = fromRanked.length - fromNodes.length;
  const hiddenTo = toRanked.length - toNodes.length;

  const rowHeight = 34;
  const height = Math.max(fromNodes.length, toNodes.length) * rowHeight + 24;
  const width = 720;
  const leftX = 158;
  const rightX = width - 158;

  const fromY = new Map(
    fromNodes.map((node, index) => [
      node,
      20 + index * rowHeight + rowHeight / 2,
    ]),
  );
  const toY = new Map(
    toNodes.map((node, index) => [
      node,
      20 + index * rowHeight + rowHeight / 2,
    ]),
  );

  const visibleEdges = edges.filter(
    (edge) => fromY.has(edge.from) && toY.has(edge.to),
  );

  return (
    <div
      className="nkh-topology-graph"
      aria-label="Enterprise relationship graph"
      data-testid="home-knowledge-relationship-topology"
    >
      <div className="nkh-crosstab-head">
        <strong>How systems actually connect</strong>
        <span>
          {edges.length} evidenced connection{edges.length === 1 ? "" : "s"}{" "}
          derived from loaded integration, vendor, and use-case data
          {hiddenFrom || hiddenTo
            ? ` · showing top ${fromNodes.length} of ${fromRanked.length} sources, ${toNodes.length} of ${toRanked.length} targets`
            : ""}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        style={{ maxHeight: 420 }}
      >
        {visibleEdges.map((edge, index) => {
          const y1 = fromY.get(edge.from)!;
          const y2 = toY.get(edge.to)!;
          const midX = (leftX + rightX) / 2;
          return (
            <path
              key={`${edge.from}-${edge.to}-${index}`}
              d={`M ${leftX + 6} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${rightX - 6} ${y2}`}
              fill="none"
              stroke={HOME_CHART_COLORS.teal}
              strokeOpacity={0.28}
              strokeWidth={1.5}
            >
              <title>{`${edge.from} ${edge.relationship} ${edge.to}`}</title>
            </path>
          );
        })}
        {fromNodes.map((node) => (
          <g key={`from-${node}`}>
            <circle
              cx={leftX}
              cy={fromY.get(node)}
              r={4}
              fill={HOME_CHART_COLORS.ink}
            />
            <text
              x={leftX - 10}
              y={fromY.get(node)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fontWeight={700}
              fill={HOME_CHART_COLORS.ink2}
            >
              {node.length > 26 ? `${node.slice(0, 25)}…` : node}
            </text>
          </g>
        ))}
        {toNodes.map((node) => (
          <g key={`to-${node}`}>
            <circle
              cx={rightX}
              cy={toY.get(node)}
              r={4}
              fill={HOME_CHART_COLORS.amber}
            />
            <text
              x={rightX + 10}
              y={toY.get(node)}
              textAnchor="start"
              dominantBaseline="middle"
              fontSize={11}
              fontWeight={700}
              fill={HOME_CHART_COLORS.ink2}
            >
              {node.length > 26 ? `${node.slice(0, 25)}…` : node}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ConfidenceBenchmarkStrip({
  dimensions,
}: {
  dimensions: HomeKnowledgeDimension[];
}) {
  const buckets = [
    { key: "source-backed", label: "Decision-grade" },
    { key: "directional", label: "Directional" },
    { key: "needs-evidence", label: "Weak" },
    { key: "not-evidenced", label: "Not evidenced" },
  ].map((bucket) => {
    const count = dimensions.filter(
      (dimension) => dimension.status === bucket.key,
    ).length;
    const pct = dimensions.length
      ? Math.round((count / dimensions.length) * 100)
      : 0;
    return { ...bucket, count, pct };
  });
  return (
    <section
      className="nkh-confidence-benchmark"
      aria-label="Decision confidence distribution"
      data-testid="home-knowledge-confidence-recharts"
    >
      <div>
        <span>Decision confidence mix</span>
        <strong>{dimensions.length} dimensions assessed</strong>
      </div>
      <div className="nkh-stacked-rechart">
        <ResponsiveContainer width="100%" height={82}>
          <BarChart
            data={[
              buckets.reduce<Record<string, number | string>>(
                (row, bucket) => {
                  row[bucket.key] = bucket.count;
                  return row;
                },
                { name: "Confidence" },
              ),
            ]}
            layout="vertical"
            margin={{ top: 12, right: 12, bottom: 4, left: 0 }}
          >
            <XAxis type="number" hide domain={[0, dimensions.length]} />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip content={<HomeChartTooltip valueLabel="Dimensions" />} />
            {buckets.map((bucket, index) => (
              <Bar
                key={bucket.key}
                dataKey={bucket.key}
                name={bucket.label}
                stackId="confidence"
                fill={statusColor(bucket.key)}
                radius={
                  index === 0
                    ? [8, 0, 0, 8]
                    : index === buckets.length - 1
                      ? [0, 8, 8, 0]
                      : [0, 0, 0, 0]
                }
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <dl>
        {buckets.map((bucket) => (
          <div key={bucket.key}>
            <dt>
              <i style={{ background: statusColor(bucket.key) }} />
              {bucket.label}
            </dt>
            <dd>{bucket.count}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HomeChartTooltip({
  active,
  label,
  payload,
  valueLabel = "Value",
}: {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    color?: string;
    name?: string | number;
    value?: string | number;
    payload?: Record<string, unknown>;
  }>;
  valueLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload ?? {};
  const title =
    typeof row.name === "string" ? row.name : String(label ?? "Signal");
  return (
    <div className="nkh-chart-tooltip">
      <strong>{title}</strong>
      {payload.map((item) => (
        <span key={`${item.name ?? valueLabel}-${item.value ?? ""}`}>
          <i style={{ background: item.color ?? HOME_CHART_COLORS.teal }} />
          {item.name ?? valueLabel}: <b>{item.value}</b>
        </span>
      ))}
      {typeof row.share === "number" ? (
        <em>{row.share}% of loaded rows</em>
      ) : null}
    </div>
  );
}

function UseCasePriorityCards({
  compact = false,
  useCases,
}: {
  compact?: boolean;
  useCases: HomeKnowledgeRecord[];
}) {
  const visibleUseCases = useCases.slice(0, compact ? 4 : 5);
  if (!visibleUseCases.length) {
    return (
      <EmptyState
        title="No candidate use cases loaded"
        body="Upload or validate use-case context before the opportunity board can rank priorities."
      />
    );
  }
  return (
    <div className={`nkh-usecase-board ${compact ? "is-compact" : ""}`}>
      {visibleUseCases.map((useCase, index) => (
        <article
          key={`${useCase.name}-${index}`}
          className="nkh-usecase-priority"
        >
          <div className="nkh-usecase-rank">
            {String(index + 1).padStart(2, "0")}
          </div>
          <div>
            <span>{asText(useCase.fn) || "Enterprise"}</span>
            <h3>{asText(useCase.name)}</h3>
            <p>
              {asText(useCase.gate) || "Evidence gate must clear before scale."}
            </p>
          </div>
          <dl>
            <div>
              <dt>Stage</dt>
              <dd>{asText(useCase.stage) || "candidate"}</dd>
            </div>
            <div>
              <dt>Value signal</dt>
              <dd>{asText(useCase.value) || "not certified"}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function UseCasePriorityRechart({
  useCases,
}: {
  useCases: HomeKnowledgeRecord[];
}) {
  const data = useCases.slice(0, 5).map((useCase, index) => ({
    name: asText(useCase.name) || `Use case ${index + 1}`,
    score: Math.max(1, 5 - index),
    function: asText(useCase.fn) || "Enterprise",
    gate: asText(useCase.gate) || "Evidence gate required",
    value: asText(useCase.value) || "not certified",
  }));
  if (!data.length) return null;
  return (
    <div
      className="nkh-usecase-rechart"
      aria-label="Top use case priority chart"
      data-testid="home-knowledge-usecase-priority-recharts"
    >
      <ResponsiveContainer width="100%" height={360}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 26, bottom: 4, left: 176 }}
          barCategoryGap={14}
        >
          <CartesianGrid horizontal={false} stroke={HOME_CHART_COLORS.line} />
          <XAxis type="number" hide domain={[0, 5]} />
          <YAxis
            type="category"
            dataKey="name"
            width={176}
            tick={{
              fill: HOME_CHART_COLORS.ink2,
              fontSize: 12,
              fontWeight: 700,
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<HomeChartTooltip valueLabel="Priority score" />} />
          <Bar
            dataKey="score"
            name="Priority score"
            fill={HOME_CHART_COLORS.teal}
            radius={[0, 8, 8, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function KnowledgeLayerProofVisual({
  dimensions,
  evidence,
  nextEvidence,
  relationshipVisual,
}: {
  dimensions: HomeKnowledgeDimension[];
  evidence: HomeKnowledgeEvidence[];
  nextEvidence: HomeKnowledgeRecord[];
  relationshipVisual?: {
    title?: string;
    caption?: string;
    nodes?: string[];
    edges?: string[];
  };
}) {
  const nodes = relationshipVisual?.nodes?.length
    ? relationshipVisual.nodes
    : [
        "Source evidence",
        "Canonical context",
        "Knowledge layer",
        "Module packet",
        "Product action",
      ];
  return (
    <section
      className="nkh-proof-visual"
      aria-label="Enterprise knowledge layer proof diagram"
    >
      <div className="nkh-proof-visual-copy">
        <div className="nkh-kicker">Governed context flow</div>
        <h2>
          {relationshipVisual?.title ||
            "Source evidence becomes module-ready knowledge"}
        </h2>
        <p>
          {relationshipVisual?.caption ||
            "The proof is not a static diagram. It shows the route from loaded evidence through canonical context, relationship caveats, module packets, and the next product action."}
        </p>
      </div>
      <div className="nkh-proof-flow">
        {nodes.slice(0, 5).map((node, index) => (
          <div
            key={`${node}-${index}`}
            className={index === 2 ? "is-core" : ""}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{node}</strong>
            <em>
              {index === 0
                ? `${evidence.length} source cards`
                : index === 1
                  ? `${dimensions.length} dimensions`
                  : index === 2
                    ? "facts · gaps · relationships"
                    : index === 3
                      ? "Home · Intelligence · Moves · Source · Tower"
                      : `${nextEvidence.length} evidence requests`}
            </em>
          </div>
        ))}
      </div>
      <ProofStageRechart
        dimensions={dimensions}
        evidence={evidence}
        nextEvidence={nextEvidence}
      />
    </section>
  );
}

function ProofStageRechart({
  dimensions,
  evidence,
  nextEvidence,
}: {
  dimensions: HomeKnowledgeDimension[];
  evidence: HomeKnowledgeEvidence[];
  nextEvidence: HomeKnowledgeRecord[];
}) {
  const data = [
    { name: "Evidence", value: evidence.length, detail: "source cards" },
    { name: "Dimensions", value: dimensions.length, detail: "context domains" },
    {
      name: "Decision-grade",
      value: dimensions.filter(
        (dimension) => dimension.status === "source-backed",
      ).length,
      detail: "ready domains",
    },
    { name: "Gaps", value: nextEvidence.length, detail: "evidence requests" },
  ];
  return (
    <div
      className="nkh-proof-rechart"
      aria-label="Proof stage coverage chart"
      data-testid="home-knowledge-proof-stage-recharts"
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          margin={{ top: 12, right: 18, bottom: 8, left: 8 }}
        >
          <CartesianGrid vertical={false} stroke={HOME_CHART_COLORS.line} />
          <XAxis
            dataKey="name"
            tick={{
              fill: HOME_CHART_COLORS.ink2,
              fontSize: 11,
              fontWeight: 700,
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: HOME_CHART_COLORS.ink3, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<HomeChartTooltip valueLabel="Count" />} />
          <Bar
            dataKey="value"
            name="Count"
            radius={[8, 8, 0, 0]}
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={
                  index === 0
                    ? HOME_CHART_COLORS.teal
                    : index === 1
                      ? HOME_CHART_COLORS.green
                      : index === 2
                        ? HOME_CHART_COLORS.ink
                        : HOME_CHART_COLORS.amber
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
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
      <span>
        {evidence.type ?? "Evidence"} · {evidence.date ?? "Current"}
      </span>
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

function sourceInventoryRows({
  dataSet,
  dimension,
  evidence,
}: {
  dataSet?: HomeKnowledgeDataSet;
  dimension: HomeKnowledgeDimension;
  evidence: HomeKnowledgeEvidence[];
}): HomeKnowledgeRecord[] {
  const rows: HomeKnowledgeRecord[] = [];

  if (dataSet?.source_file || dataSet?.row_count || dataSet?.refreshed_at) {
    rows.push({
      source: dataSet.source_file ?? `${dimension.name} source file`,
      type: "Canonical input",
      size: "Not captured",
      loaded_at: dataSet.refreshed_at ?? "Not captured",
      loaded_by: "Not captured",
      rows: dataSet.row_count ?? dimension.count ?? dataSet.rows.length,
      status: sourceStatus(dimension.status),
      supports:
        dataSet.source_layer ?? dimension.summary ?? "Dimension source rows",
      gaps: "Use row-level evidence and gaps tabs for validation boundaries",
    });
  }

  for (const item of evidence) {
    rows.push({
      source: item.name ?? "Evidence source",
      type: item.type ?? "Evidence",
      size: "Not captured",
      loaded_at: item.date ?? "Not captured",
      loaded_by: "Not captured",
      rows: item.rows ?? "Not captured",
      status: sourceStatus(item.st ?? item.status),
      supports: item.supports ?? item.facts ?? "Supporting evidence",
      gaps: item.missing ?? "No source-specific gap captured",
    });
  }

  return rows;
}

function SourceInventoryTable({
  dataSet,
  dimension,
  evidence,
}: {
  dataSet?: HomeKnowledgeDataSet;
  dimension: HomeKnowledgeDimension;
  evidence: HomeKnowledgeEvidence[];
}) {
  const rows = sourceInventoryRows({ dataSet, dimension, evidence });

  if (!rows.length) {
    return (
      <EmptyState
        title="No source inventory surfaced"
        body="The loaded rows still carry row-level evidence identifiers where available, but this approved pack did not include file metadata for this dimension."
      />
    );
  }

  return (
    <div className="nkh-source-inventory">
      <table>
        <thead>
          <tr>
            <th>Source / metadata</th>
            <th>What it supports</th>
            <th>Still missing</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${asText(row.source)}-${index}`}>
              <td>
                <strong>{asText(row.source)}</strong>
                <div className="nkh-source-meta">
                  <span>
                    <em>Type</em>
                    {asText(row.type)}
                  </span>
                  <span>
                    <em>Rows</em>
                    {asText(row.rows)}
                  </span>
                  <span>
                    <em>Loaded</em>
                    {formatDate(asText(row.loaded_at))}
                  </span>
                  <span>
                    <em>By</em>
                    {asText(row.loaded_by)}
                  </span>
                  <span>
                    <em>Size</em>
                    {asText(row.size)}
                  </span>
                  <span>
                    <em>Status</em>
                    <i>{asText(row.status)}</i>
                  </span>
                </div>
              </td>
              <td>{asText(row.supports)}</td>
              <td>{asText(row.gaps)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
  --ink: #050b14;
  --navy: #071426;
  --muted: #46536a;
  --quiet: #7b8496;
  --line: #e5e0d6;
  --soft: #f4f1eb;
  --panel: #fffefa;
  --brand: #10213b;
  --teal: #15836b;
  --green: #16734f;
  --amber: #a26412;
  --paper: #f8f6f1;
  --paper-line: #ded8cc;
  --serif: "Source Serif 4", Georgia, serif;
  --sans: "Source Sans 3", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  display: grid;
  grid-template-columns: 264px minmax(0, 1fr);
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
.nkh-six-questions-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}
.nkh-six-question-card {
  text-align: left;
  border: 1px solid #eceae2;
  border-radius: 12px;
  background: #fff;
  padding: 16px 18px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.15s ease;
}
.nkh-six-question-card:hover {
  border-color: #157f74;
}
.nkh-six-question-title {
  font: 700 13px var(--sans);
  color: #6d675f;
}
.nkh-six-question-card strong {
  font: 700 22px var(--serif, serif);
  color: #161411;
}
.nkh-six-question-meta {
  font: 400 11.5px var(--sans);
  color: #6d675f;
}
.nkh-horizon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 14px;
}
.nkh-horizon-card {
  text-align: left;
  border: 1.5px dashed #c9c2b4;
  border-radius: 12px;
  background: transparent;
  padding: 14px 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: inherit;
}
.nkh-horizon-card:hover {
  border-color: #a96d16;
  background: #fbf8f1;
}
.nkh-horizon-tag {
  align-self: flex-start;
  font: 700 9px var(--sans);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #a96d16;
  border: 1px solid #e3d2b0;
  border-radius: 999px;
  padding: 2px 8px;
}
.nkh-horizon-card strong {
  font: 700 13.5px var(--sans);
  color: #34302a;
}
.nkh-horizon-card p {
  margin: 0;
  font: 400 12px/1.45 var(--sans);
  color: #6d675f;
}
.nkh-horizon-card em {
  font: 400 11px var(--sans);
  font-style: normal;
  color: #a1998a;
}
.nkh-horizon-more {
  margin-top: 12px;
  border: none;
  background: none;
  color: #157f74;
  font: 700 12px var(--sans);
  cursor: pointer;
  padding: 0;
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
.nkh-crosstab-heatmap {
  border: 1px solid #eceae2;
  border-radius: 12px;
  background: #fff;
  padding: 16px 18px;
  margin-bottom: 14px;
}
.nkh-crosstab-head {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 14px;
}
.nkh-crosstab-head strong {
  font: 700 14px var(--serif, serif);
  color: #161411;
}
.nkh-crosstab-head span {
  font: 400 12px var(--sans);
  color: #6d675f;
}
.nkh-crosstab-grid {
  display: grid;
  gap: 4px;
  overflow-x: auto;
}
.nkh-crosstab-corner {
  min-width: 148px;
}
.nkh-crosstab-col-label,
.nkh-crosstab-row-label {
  font: 700 10.5px var(--sans);
  letter-spacing: 0.02em;
  color: #34302a;
  text-transform: capitalize;
}
.nkh-crosstab-col-label {
  align-self: end;
  padding-bottom: 6px;
  text-align: center;
}
.nkh-crosstab-row-label {
  display: flex;
  align-items: center;
  padding-right: 10px;
}
.nkh-crosstab-cell {
  min-height: 40px;
  border-radius: 6px;
  border: 1px solid #eceae2;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 700 12px var(--sans);
  color: #161411;
}
.nkh-topology-graph {
  border: 1px solid #eceae2;
  border-radius: 12px;
  background: #fff;
  padding: 16px 18px;
  margin-top: 14px;
}
.nkh-topology-graph svg {
  display: block;
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

/* Intelligence-style editorial system for the Knowledge surface. */
.nkh-rail {
  background: #f7f8fb;
  border-right-color: #d9dee8;
  padding: 18px 12px 24px;
}
.nkh-rail-label {
  color: #8c96aa;
  font-size: 10px;
  letter-spacing: .2em;
}
.nkh-rail-primary,
.nkh-dim-link {
  border-radius: 6px;
  padding: 9px 10px;
}
.nkh-rail-primary.is-active,
.nkh-dim-link.is-active {
  background: #eaf1fb;
  color: #0b2448;
  box-shadow: inset 2px 0 0 #1267c6;
}
.nkh-dim-link strong,
.nkh-rail-primary span:last-child {
  font-size: 14px;
  font-weight: 800;
}
.nkh-dim-link small {
  color: #68758e;
  font-size: 11.5px;
}
.nkh-search {
  border-color: #d7d0c4;
  border-radius: 7px;
  background: #fffefa;
}
.nkh-main {
  max-width: 1640px;
  margin: 0;
  padding: 24px 42px 84px;
}
.nkh-hero {
  grid-template-columns: minmax(0, 1fr) 360px;
  border-bottom: 1px solid var(--paper-line);
  padding-bottom: 24px;
}
.nkh-breadcrumb {
  color: #66758f;
  font-size: 13px;
}
.nkh-hero h1 {
  margin: 13px 0 9px;
  color: #050b14;
  font: 700 38px/1.03 var(--serif);
  letter-spacing: 0;
}
.nkh-hero p {
  max-width: 920px;
  color: #44516a;
  font-size: 14.5px;
  line-height: 1.55;
}
.nkh-demo-pill {
  background: #e4eefb;
  color: #0b4e91;
  border-radius: 999px;
  font-size: 10px;
  padding: 4px 8px;
}
.nkh-status-card {
  border-color: #ded8cc;
  border-radius: 8px;
  background: #fffefa;
  padding: 15px 18px;
  box-shadow: none;
}
.nkh-status-card strong {
  color: #061221;
  font-size: 14px;
}
.nkh-status-card span {
  color: #31415c;
  font-size: 12.5px;
  line-height: 1.7;
}
.nkh-tabs,
.nkh-subtabs {
  gap: 30px;
  margin-top: 22px;
  border-bottom-color: #dfd9ce;
}
.nkh-tabs button,
.nkh-subtabs button {
  color: #5f6a7c;
  font-size: 13px;
  font-weight: 800;
  padding-bottom: 12px;
}
.nkh-tabs button.is-active,
.nkh-subtabs button.is-active {
  color: #071426;
  border-color: #071426;
}
.nkh-section {
  margin-top: 28px;
}
.nkh-kicker {
  color: #86550d;
  font-size: 10px;
  letter-spacing: .22em;
}
.nkh-at-glance,
.nkh-story-card,
.nkh-data-card,
.nkh-proof-hero,
.nkh-layer-visual,
.nkh-proof-table,
.nkh-next-evidence-panel,
.nkh-observed-card,
.nkh-relationship-card,
.nkh-confidence-panel {
  border-color: #ded8cc;
  border-radius: 8px;
  background: #fffefa;
  box-shadow: none;
}
.nkh-at-glance {
  padding: 22px 24px 12px;
}
.nkh-inline-head h2,
.nkh-section-head h2,
.nkh-story-card h2,
.nkh-proof-hero h2,
.nkh-layer-visual h2,
.nkh-proof-table h2,
.nkh-next-evidence-panel h2,
.nkh-dimension-heading h2,
.nkh-confidence-head h2 {
  color: #050b14;
  font-family: var(--serif);
  letter-spacing: 0;
}
.nkh-inline-head span,
.nkh-section-head > span,
.nkh-section-subtitle {
  color: #778196;
}
.nkh-fact-grid {
  border-top-color: #e8e2d7;
}
.nkh-fact-card {
  background: transparent;
  border-bottom-color: #eee9df;
  padding: 16px 22px 16px 0;
}
.nkh-fact-card span,
.nkh-dashboard-tile span,
.nkh-kpi-card span,
.nkh-table-wrap th button,
.nkh-proof-table th,
.nkh-confidence-table th {
  color: #7d879b;
  font-family: var(--sans);
  letter-spacing: .15em;
  text-transform: uppercase;
}
.nkh-fact-card strong {
  color: #050b14;
  font-family: var(--serif);
  font-size: 23px;
  line-height: 1.08;
}
.nkh-fact-card p {
  color: #4f5c73;
}
.nkh-boardroom-brief {
  padding: 30px 32px;
}
.nkh-executive-summary {
  max-width: 1040px;
  columns: 2 380px;
  column-gap: 40px;
}
.nkh-executive-summary p {
  break-inside: avoid;
  color: #31415c;
  font-size: 14.5px;
  line-height: 1.58;
}
.nkh-brief-grid {
  border-color: #e6e0d6;
  border-radius: 7px;
}
.nkh-story-block,
.nkh-mini-card,
.nkh-gap-card,
.nkh-evidence-card,
.nkh-empty {
  border-color: #ded8cc;
  border-radius: 8px;
  background: #fffefa;
  box-shadow: none;
}
.nkh-story-block.is-warn {
  border-color: #e9c98f;
  background: #fff9ed;
}
.nkh-story-block li,
.nkh-story-block p,
.nkh-tab-intro {
  color: #33415b;
}
.nkh-priority-list article {
  border-top-color: #071426;
}
.nkh-priority-list article > span {
  color: #9b9f9a;
}
.nkh-signal-list figure {
  border-color: #ded8cc;
  border-top-color: #071426;
  border-radius: 8px;
  background: #fffefa;
}
.nkh-signal-list blockquote {
  color: #1b273b;
}
.nkh-handoff-bar {
  border-radius: 8px;
  background: #071426;
}
.nkh-handoff-bar button {
  border-radius: 6px;
}
.nkh-data-tools {
  border-bottom: 1px solid #e8e2d7;
  padding-bottom: 14px;
}
.nkh-data-tools label {
  color: #7d879b;
  font-size: 10px;
  letter-spacing: .14em;
}
.nkh-data-tools input,
.nkh-data-tools select,
.nkh-export {
  border-color: #d8d1c5;
  border-radius: 6px;
  background: #fffefa;
}
.nkh-chip,
.nkh-pill {
  border: 1px solid #ded8cc;
  border-radius: 999px;
  background: #f5f1e9;
  color: #33415b;
  font-size: 11.5px;
}
.nkh-export:hover {
  border-color: #071426;
  color: #071426;
}
.nkh-table-wrap {
  border-color: #ded8cc;
  border-radius: 8px;
  background: #fffefa;
  box-shadow: none;
}
.nkh-table-wrap table,
.nkh-proof-table table,
.nkh-confidence-table {
  font-size: 13px;
}
.nkh-table-wrap th,
.nkh-table-wrap td,
.nkh-proof-table th,
.nkh-proof-table td,
.nkh-confidence-table th,
.nkh-confidence-table td {
  border-bottom-color: #ebe6dd;
  padding: 12px 14px;
}
.nkh-table-wrap th {
  background: #f6f3ee;
}
.nkh-table-wrap tbody tr:hover,
.nkh-table-wrap tr.is-selected {
  background: #eef5f0;
}
.nkh-drawer,
.nkh-drawer-grid div {
  border-color: #d8d1c5;
  border-radius: 8px;
  background: #fffefa;
}
.nkh-drawer-head h3 {
  color: #050b14;
  font-family: var(--serif);
}
.nkh-chain {
  gap: 0;
  border: 1px solid #ded8cc;
  border-radius: 8px;
  overflow: hidden;
  background: #fffefa;
}
.nkh-chain-node {
  min-height: 96px;
  border: 0;
  border-right: 1px solid #e9e3d8;
  border-radius: 0;
  background: transparent;
  padding: 18px;
}
.nkh-chain-node:last-child {
  border-right: 0;
}
.nkh-chain-node span {
  border-radius: 999px;
  background: #e3f0ea;
  color: #16734f;
}
.nkh-relationship-note {
  border-color: #d6e6da;
  border-radius: 6px;
  background: #eaf5ef;
  color: #234932;
}
.nkh-observed-card {
  padding: 26px 28px;
}
.nkh-observed-copy {
  max-width: 1100px;
  color: #1d2b43;
  font-size: 18px;
}
.nkh-observed-split div {
  border-left-color: #16734f;
}
.nkh-observed-split div.is-warn {
  border-left-color: #a26412;
}
.nkh-interesting-grid div,
.nkh-dashboard-tile,
.nkh-dashboard-split section,
.nkh-kpi-card,
.nkh-proof-metrics div,
.nkh-render-facts div,
.nkh-usecase,
.nkh-next-list div {
  border-color: #ded8cc;
  border-radius: 8px;
  background: #fffefa;
}
.nkh-interesting-grid div {
  border-top-color: #071426;
}
.nkh-dashboard-tile strong,
.nkh-mini-card strong,
.nkh-proof-metrics strong,
.nkh-render-facts strong,
.nkh-kpi-card strong {
  color: #050b14;
  font-family: var(--serif);
}
.nkh-confidence-panel {
  padding-bottom: 24px;
}
.nkh-confidence-head {
  border-bottom-color: #e8e2d7;
  background: #fffefa;
}
.nkh-confidence-cell {
  border-radius: 6px;
  background: #eaf5ef;
}
.nkh-confidence-cell.is-directional {
  background: #fbf2df;
}
.nkh-confidence-cell.is-needs-evidence,
.nkh-confidence-cell.is-not-evidenced {
  background: #f8ede5;
}
.nkh-gap-list .nkh-gap-card {
  border-left-color: #a26412;
}
.nkh-gap-list .nkh-gap-card span,
.nkh-gap-list .nkh-gap-card em {
  border-radius: 999px;
  background: #fbf2df;
  color: #8e570d;
}
.nkh-next-evidence-panel {
  background: #fbf6ec;
}
.nkh-orbit {
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0;
  border: 1px solid #ded8cc;
  border-radius: 8px;
  overflow: hidden;
  background: #fffefa;
}
.nkh-orbit > div,
.nkh-orbit > section {
  border: 0;
  border-right: 1px solid #e8e2d7;
  border-radius: 0;
  background: transparent;
  padding: 18px 16px;
}
.nkh-orbit > div:last-child,
.nkh-orbit > section:last-child {
  border-right: 0;
}
.nkh-orbit > section {
  background: #071426;
}
.nkh-technical-proof {
  border-color: #d8d1c5;
  border-radius: 6px;
  background: #f7f4ee;
}
.nkh-ava {
  background: #071426;
  box-shadow: 0 16px 34px rgba(7, 20, 38, .22);
}
.nkh-ava span {
  background: #12345b;
  color: #5fd7ff;
}

/* Visible replacement pass: match the Intelligence canvas rather than the
   older Knowledge directory styling. These rules intentionally override the
   earlier compatibility tokens. */
.nexus-home-contract {
  --bg: #f7f4ee;
  --surface: #fffdf8;
  --surface-2: #fbf8f1;
  --surface-3: #eee7dc;
  --ink: #161411;
  --ink-2: #34302a;
  --ink-3: #6d675f;
  --line: #ded5c8;
  --line-2: #ece4d8;
  --line-3: #cfc6b8;
  --teal: #157f74;
  --teal-2: #28b7a7;
  --teal-bg: #e6f4f1;
  --green: #218553;
  --green-bg: #e7f4ec;
  --amber: #a96d16;
  --amber-bg: #fbefd9;
  --red: #aa3a32;
  --red-bg: #f7e4e1;
  --muted: #8d8680;
  --serif: var(--font-fraunces), "Fraunces", Georgia, serif;
  --sans: var(--font-inter), "Inter", ui-sans-serif, system-ui, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 13.5px;
  line-height: 1.5;
}
.nkh-rail {
  background: var(--surface-2);
  border-right-color: var(--line);
}
.nkh-main {
  max-width: none;
  padding: 22px 28px 84px;
}
.nkh-hero {
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 26px;
  border-bottom: 1px solid var(--line);
}
.nkh-breadcrumb,
.nkh-hero p,
.nkh-status-card span,
.nkh-tab-intro {
  color: var(--ink-3);
}
.nkh-hero h1 {
  color: var(--ink);
  font-family: var(--serif);
  font-size: 31px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.08;
}
.nkh-status-card,
.nkh-at-glance,
.nkh-story-card,
.nkh-data-card,
.nkh-proof-table,
.nkh-next-evidence-panel,
.nkh-observed-card,
.nkh-relationship-card,
.nkh-confidence-panel,
.nkh-intel-canvas-card,
.nkh-proof-visual,
.nkh-usecase-preview {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(24, 20, 17, 0.04);
}
.nkh-tabs,
.nkh-subtabs {
  gap: 0;
  border-bottom-color: var(--line);
}
.nkh-tabs button,
.nkh-subtabs button {
  padding: 13px 16px 12px;
  color: var(--ink-3);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}
.nkh-tabs button.is-active,
.nkh-subtabs button.is-active {
  color: var(--ink);
  border-color: var(--teal);
}
.nkh-kicker,
.nkh-fact-card span,
.nkh-dashboard-tile span,
.nkh-kpi-card span,
.nkh-table-wrap th button,
.nkh-proof-table th,
.nkh-confidence-table th {
  color: var(--teal);
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: .12em;
}
.nkh-story-card h2,
.nkh-proof-table h2,
.nkh-next-evidence-panel h2,
.nkh-dimension-heading h2,
.nkh-confidence-head h2,
.nkh-intel-canvas-card h2,
.nkh-proof-visual h2,
.nkh-usecase-preview h2 {
  color: var(--ink);
  font-family: var(--serif);
  font-weight: 700;
  letter-spacing: 0;
}
.nkh-story-card p,
.nkh-executive-summary p,
.nkh-priority-list p,
.nkh-signal-list p,
.nkh-evidence-card p,
.nkh-gap-card p {
  color: var(--ink-2);
}
.nkh-intel-canvas-card {
  display: grid;
  grid-template-columns: minmax(280px, .72fr) minmax(460px, 1fr);
  gap: 30px;
  padding: 24px 26px;
}
.nkh-canvas-copy h2,
.nkh-proof-visual h2 {
  margin: 8px 0 10px;
  font-size: 22px;
  line-height: 1.18;
}
.nkh-canvas-copy p,
.nkh-proof-visual p {
  margin: 0;
  color: var(--ink-3);
  font-size: 13.5px;
  line-height: 1.58;
}
.nkh-volume-chart {
  width: 100%;
  min-height: 314px;
}
.nkh-volume-chart .recharts-wrapper,
.nkh-usecase-rechart .recharts-wrapper,
.nkh-proof-rechart .recharts-wrapper,
.nkh-stacked-rechart .recharts-wrapper {
  font-family: var(--sans);
}
.nkh-confidence-benchmark {
  display: grid;
  grid-template-columns: 220px minmax(220px, 1fr) minmax(320px, .75fr);
  gap: 22px;
  align-items: center;
  margin: 20px 26px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface-2);
  padding: 16px 18px;
}
.nkh-confidence-benchmark span {
  display: block;
  color: var(--teal);
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.nkh-confidence-benchmark strong {
  display: block;
  margin-top: 6px;
  color: var(--ink);
  font-size: 16px;
}
.nkh-stacked-rechart {
  width: 100%;
  height: 82px;
}
.nkh-confidence-benchmark dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
  margin: 0;
}
.nkh-confidence-benchmark div:has(dt) {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.nkh-confidence-benchmark dt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ink-3);
  font-size: 11.5px;
}
.nkh-confidence-benchmark dt i {
  width: 9px;
  height: 9px;
  border-radius: 2px;
}
.nkh-confidence-benchmark dd {
  margin: 0;
  color: var(--ink);
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 800;
}
.nkh-usecase-board {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin: 0 0 22px;
}
.nkh-usecase-rechart {
  width: 100%;
  height: 250px;
  margin: 0 0 18px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface-2);
  padding: 8px 10px;
}
.nkh-usecase-board.is-compact {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 0;
}
.nkh-usecase-priority {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-top: 3px solid var(--ink);
  border-radius: 10px;
  background: var(--surface);
  padding: 16px 17px;
}
.nkh-usecase-rank {
  color: var(--line-3);
  font-family: var(--serif);
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
}
.nkh-usecase-priority span {
  display: block;
  margin: 12px 0 8px;
  color: var(--teal);
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.nkh-usecase-priority h3 {
  margin: 0;
  color: var(--ink);
  font-size: 15px;
  line-height: 1.28;
}
.nkh-usecase-priority p {
  margin: 9px 0 16px;
  color: var(--ink-3);
  font-size: 12.5px;
  line-height: 1.45;
}
.nkh-usecase-priority dl {
  display: grid;
  gap: 7px;
  margin: auto 0 0;
}
.nkh-usecase-priority dt {
  color: var(--ink-3);
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.nkh-usecase-priority dd {
  margin: 2px 0 0;
  color: var(--ink);
  font-size: 12px;
  font-weight: 700;
}
.nkh-usecase-preview {
  padding: 22px 24px;
}
.nkh-proof-visual {
  display: grid;
  grid-template-columns: minmax(280px, .56fr) minmax(520px, 1fr);
  gap: 28px;
  padding: 24px 26px;
  margin-bottom: 20px;
}
.nkh-proof-flow {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface-2);
}
.nkh-proof-rechart {
  min-height: 220px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface-2);
  padding: 8px 10px;
}
.nkh-chart-tooltip {
  max-width: 280px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  box-shadow: 0 18px 36px rgba(24, 20, 17, .12);
  padding: 10px 12px;
  color: var(--ink);
}
.nkh-chart-tooltip strong,
.nkh-chart-tooltip span,
.nkh-chart-tooltip em {
  display: block;
}
.nkh-chart-tooltip strong {
  margin-bottom: 6px;
  font-size: 12.5px;
  line-height: 1.35;
}
.nkh-chart-tooltip span {
  color: var(--ink-2);
  font-size: 11.5px;
  line-height: 1.45;
}
.nkh-chart-tooltip span i {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 6px;
  border-radius: 50%;
}
.nkh-chart-tooltip em {
  margin-top: 6px;
  color: var(--ink-3);
  font-size: 11px;
  font-style: normal;
}
.nkh-proof-flow div {
  min-height: 150px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--line);
  padding: 16px 15px;
}
.nkh-proof-flow div:last-child {
  border-right: 0;
}
.nkh-proof-flow div.is-core {
  background: var(--ink);
}
.nkh-proof-flow span {
  color: var(--teal);
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 900;
}
.nkh-proof-flow .is-core span {
  color: var(--teal-2);
}
.nkh-proof-flow strong {
  margin-top: 16px;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 18px;
  line-height: 1.14;
}
.nkh-proof-flow .is-core strong {
  color: var(--surface);
}
.nkh-proof-flow em {
  margin-top: auto;
  color: var(--ink-3);
  font-size: 11.5px;
  font-style: normal;
  line-height: 1.35;
}
.nkh-proof-flow .is-core em {
  color: #c9d9d5;
}
.nkh-table-wrap table {
  background: var(--surface);
}
.nkh-table-wrap th {
  background: var(--surface-2);
}
.nkh-table-wrap td {
  color: var(--ink-2);
}
.nkh-table-wrap tbody tr:nth-child(even) {
  background: rgba(251, 248, 241, .62);
}
.nkh-table-wrap tbody tr:hover,
.nkh-table-wrap tr.is-selected {
  background: var(--teal-bg);
}
.nkh-ai-thesis {
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(460px, 1.1fr);
  gap: 20px;
  border: 1px solid #d4e4f4;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(10, 78, 147, .08), rgba(28, 169, 116, .08)),
    var(--surface);
  padding: 24px;
  box-shadow: 0 18px 48px rgba(10, 31, 68, .06);
}
.nkh-ai-thesis span {
  display: block;
  color: #1f7a5c;
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 900;
  letter-spacing: .13em;
  text-transform: uppercase;
}
.nkh-ai-thesis h2 {
  margin: 8px 0 12px;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 30px;
  line-height: 1.08;
}
.nkh-ai-thesis p {
  margin: 0;
  color: var(--ink-2);
  font-size: 14.5px;
  line-height: 1.55;
}
.nkh-ai-thesis-lead {
  min-width: 0;
}
.nkh-ai-proofline {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-top: 18px;
}
.nkh-ai-proofline div {
  min-width: 0;
  border: 1px solid rgba(13, 42, 81, .10);
  border-radius: 12px;
  background: rgba(255, 255, 255, .68);
  padding: 10px 11px;
}
.nkh-ai-proofline strong {
  display: block;
  color: var(--ink);
  font-size: 15px;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nkh-ai-proofline em {
  display: block;
  margin-top: 5px;
  color: var(--ink-3);
  font-size: 10.5px;
  font-style: normal;
  font-weight: 800;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.nkh-ai-thesis-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.nkh-ai-thesis-grid article {
  border: 1px solid rgba(13, 42, 81, .10);
  border-radius: 14px;
  background: rgba(255, 255, 255, .74);
  padding: 15px;
}
.nkh-ai-thesis-grid strong {
  display: block;
  margin-bottom: 8px;
  color: var(--ink);
  font-size: 13px;
  font-weight: 900;
}
.nkh-ai-thesis-grid p {
  font-size: 12.5px;
  line-height: 1.48;
}
.nkh-source-inventory {
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
}
.nkh-source-inventory table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
}
.nkh-source-inventory th,
.nkh-source-inventory td {
  border-bottom: 1px solid var(--line);
  padding: 12px 13px;
  text-align: left;
  vertical-align: top;
}
.nkh-source-inventory th {
  background: var(--surface-2);
  color: var(--ink-3);
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .11em;
  text-transform: uppercase;
}
.nkh-source-inventory th:first-child {
  width: 44%;
}
.nkh-source-inventory th:nth-child(2),
.nkh-source-inventory th:nth-child(3) {
  width: 28%;
}
.nkh-source-inventory td {
  color: var(--ink-2);
  font-size: 13px;
  line-height: 1.5;
}
.nkh-source-inventory td:first-child {
  min-width: 330px;
}
.nkh-source-inventory td strong {
  color: var(--ink);
  font-size: 13.5px;
  line-height: 1.35;
}
.nkh-source-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}
.nkh-source-meta span {
  min-width: 0;
  border: 1px solid rgba(13, 42, 81, .09);
  border-radius: 9px;
  background: rgba(255, 255, 255, .72);
  padding: 7px 8px;
  color: var(--ink-2);
  font-size: 11.5px;
  line-height: 1.25;
}
.nkh-source-meta em {
  display: block;
  margin-bottom: 3px;
  color: var(--ink-3);
  font-family: var(--mono);
  font-size: 8.5px;
  font-style: normal;
  font-weight: 900;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.nkh-source-meta i {
  display: inline-flex;
  border-radius: 999px;
  background: #edf8f2;
  color: #1b6d51;
  padding: 2px 7px;
  font-style: normal;
  font-weight: 900;
}
.nkh-source-inventory tr:last-child td {
  border-bottom: 0;
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
  .nkh-ai-thesis,
  .nkh-proof-split { grid-template-columns: 1fr; }
  .nkh-card-grid,
  .nkh-breakdown-grid,
  .nkh-fact-grid,
  .nkh-kpi-grid,
  .nkh-priority-list,
  .nkh-signal-list,
  .nkh-interesting-grid,
	  .nkh-dashboard-grid,
	  .nkh-ai-thesis-grid,
	  .nkh-ai-proofline,
	  .nkh-source-meta,
	  .nkh-intel-canvas-card,
  .nkh-confidence-benchmark,
  .nkh-usecase-board,
  .nkh-usecase-board.is-compact,
  .nkh-proof-visual,
  .nkh-proof-flow,
  .nkh-route-grid,
  .nkh-orbit,
  .nkh-render-facts { grid-template-columns: 1fr; }
}
`;

"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  HomeKnowledgeDataSet,
  HomeKnowledgeDesignContractPack,
  HomeKnowledgeDimension,
  HomeKnowledgeEvidence,
  HomeKnowledgeRecord,
} from "@/lib/home/home-knowledge-design-contract";
import {
  deriveHomeRelationshipEdges,
  type HomeRelationshipEdge,
} from "@/lib/home/derive-relationship-edges";

type SectionKey =
  | "brief"
  | "model"
  | "operating"
  | "relationships"
  | "technology"
  | "change"
  | "evidence"
  | "dimension";

interface HomeExecutiveCockpitProps {
  pack: HomeKnowledgeDesignContractPack;
  selectedDimension?: string | null;
  relationshipEdges?: HomeRelationshipEdge[];
}

const COLORS = {
  ink: "#282520",
  muted: "#68625a",
  faint: "#948d83",
  paper: "#f5f1eb",
  surface: "#fffdf8",
  line: "#ddd3c6",
  lineStrong: "#c8bdae",
  teal: "#1d9e75",
  tealDark: "#0f6e56",
  blue: "#0d6fd1",
  amber: "#b67716",
  red: "#aa3a32",
  black: "#050506",
};

const SECTION_ITEMS: Array<{
  key: SectionKey;
  label: string;
  eyebrow: string;
}> = [
  { key: "brief", label: "Enterprise Brief", eyebrow: "Executive read" },
  { key: "model", label: "Enterprise Model", eyebrow: "Shape" },
  { key: "operating", label: "Operating Model", eyebrow: "How work changes" },
  { key: "relationships", label: "Relationship Graph", eyebrow: "Connections" },
  { key: "technology", label: "Technology & Ecosystem", eyebrow: "Systems" },
  { key: "change", label: "Change Thesis", eyebrow: "Choices" },
  { key: "evidence", label: "Source Proof", eyebrow: "Boundary" },
];

const SECTION_COPY: Record<
  Exclude<SectionKey, "dimension">,
  { index: string; title: string; lead: string }
> = {
  brief: {
    index: "01",
    title: "Home Enterprise Brief",
    lead: "The executive read: what is known about the enterprise, what is still uncertain, and where AI or transformation decisions should focus first.",
  },
  model: {
    index: "02",
    title: "Enterprise model",
    lead: "A business-language view of the enterprise shape before any AI, sourcing, or operating-model decision is treated as board-ready.",
  },
  operating: {
    index: "03",
    title: "Operating model implications",
    lead: "How work, decision rights, and module handoffs need to change if the loaded context is used as the enterprise system of intelligence.",
  },
  relationships: {
    index: "04",
    title: "Enterprise relationship map",
    lead: "Click-path thinking starts here: divisions, functions, systems, priorities and constraints should be visible as one enterprise graph.",
  },
  technology: {
    index: "05",
    title: "Technology and ecosystem",
    lead: "The systems, vendors, platforms, data products, and evidence gaps that shape what can be automated, modernized, sourced, or measured.",
  },
  change: {
    index: "06",
    title: "Change thesis",
    lead: "The practical change strategy implied by the tenant context and by what is happening in the industry.",
  },
  evidence: {
    index: "07",
    title: "Source proof",
    lead: "The business-readable proof layer: what source material supports the context, who owns it, and what is still missing.",
  },
};

const DIMENSION_GROUPS: Array<{
  title: string;
  keys: string[];
}> = [
  {
    title: "Enterprise Structure",
    keys: ["profile", "org", "functions", "workforce"],
  },
  {
    title: "Technology & Data",
    keys: ["apps", "data", "infra", "vendors", "rel"],
  },
  {
    title: "Agenda",
    keys: ["programs", "ai", "risks", "metrics", "budget"],
  },
  {
    title: "Knowledge Boundary",
    keys: ["evidence", "industry", "process", "towers", "source"],
  },
];

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => {
        const text = asText(nested);
        return text ? `${key.replaceAll("_", " ")}: ${text}` : "";
      })
      .filter(Boolean)
      .join("; ");
  }
  return String(value);
}

function firstText(record: HomeKnowledgeRecord | undefined, keys: string[]) {
  for (const key of keys) {
    const text = asText(record?.[key]).trim();
    if (text) return text;
  }
  return "";
}

function sentence(value: unknown, fallback = "") {
  const text = asText(value).replace(/\s+/g, " ").trim();
  return text || fallback;
}

function isRawLabel(value: unknown) {
  const text = asText(value).trim();
  if (!text) return true;
  if (/^fact:/i.test(text)) return true;
  if (/\b(?:MER|FC|SKY|LAK|APX|SA\d*)-[A-Z0-9-]*\d[A-Z0-9-]*\b/i.test(text)) {
    return true;
  }
  if (/^[A-Z]{2,}\d{1,3}-[A-Z0-9-]+-\d+$/i.test(text)) return true;
  if (/^[A-Z]{2,}\d{1,3}-[A-Z0-9-]+$/i.test(text)) return true;
  if (/^(?:APP|SYS|VND|EVID|INT|REL)-\d+$/i.test(text)) return true;
  if (/^[a-z0-9]+(?:_[a-z0-9]+){2,}$/i.test(text)) return true;
  return false;
}

function displayRelationshipLabel(value: string, type?: string) {
  if (!isRawLabel(value)) {
    return value
      .replace(/\s+relationship\s+candidate\b/gi, "")
      .replace(/:\s+No\s+/i, ": missing ")
      .split(":")[0]
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  const normalizedType = asText(type).toLowerCase();
  if (normalizedType.includes("benefit") || normalizedType.includes("value")) {
    return "Expected value outcome";
  }
  if (normalizedType.includes("control") || normalizedType.includes("gate")) {
    return "Evidence gate";
  }
  if (
    normalizedType.includes("priority") ||
    normalizedType.includes("initiative")
  ) {
    return "Strategic priority";
  }
  if (normalizedType.includes("owner") || normalizedType.includes("role")) {
    return "Accountable owner";
  }
  if (
    normalizedType.includes("function") ||
    normalizedType.includes("process")
  ) {
    return "Business function";
  }
  if (normalizedType.includes("interview")) return "Executive interview signal";
  if (normalizedType.includes("use")) return "AI use case";
  if (normalizedType.includes("metric")) return "Outcome measure";
  if (normalizedType.includes("system")) return "Enterprise system";
  if (normalizedType.includes("vendor")) return "Vendor or partner";
  if (normalizedType.includes("risk")) return "Risk or constraint";
  if (normalizedType.includes("data")) return "Data product";
  return "Enterprise context item";
}

function shortLabel(value: string, max = 32) {
  const text = value.trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function statusTone(status?: string | null) {
  const value = asText(status).toLowerCase();
  if (value.includes("source") || value.includes("ready")) return "ready";
  if (value.includes("direction")) return "directional";
  if (value.includes("weak") || value.includes("need")) return "weak";
  return "directional";
}

function statusLabel(status?: string | null) {
  const tone = statusTone(status);
  if (tone === "ready") return "Decision-ready";
  if (tone === "weak") return "Needs evidence";
  return "Directional";
}

function toneColor(status?: string | null) {
  const tone = statusTone(status);
  if (tone === "ready") return COLORS.teal;
  if (tone === "weak") return COLORS.red;
  return COLORS.amber;
}

function businessMetricLabel(dimension: HomeKnowledgeDimension) {
  const labels: Record<string, string> = {
    apps: "Applications",
    vendors: "Vendors",
    data: "Data domains",
    infra: "Platforms",
    programs: "Programs",
    ai: "AI opportunities",
    functions: "Functions",
    workforce: "Roles",
    budget: "Value items",
    metrics: "Outcome measures",
  };
  return labels[dimension.key] ?? dimension.name;
}

function enterpriseFacts(pack: HomeKnowledgeDesignContractPack) {
  const facts = pack.design_slots.FACTS ?? [];
  const byLabel = new Map(
    facts.map((fact) => [asText(fact.label).toLowerCase(), fact]),
  );
  const wanted = [
    "Net revenue",
    "Revenue",
    "Employees",
    "Members",
    "Hospitals",
    "Clinics",
    "IT budget",
    "FY26 IT budget",
    "Applications",
    "Vendors",
    "Integrations",
    "Data domains",
  ];
  const result: Array<{ label: string; value: string; sub?: string }> = [];
  for (const label of wanted) {
    const fact = byLabel.get(label.toLowerCase());
    if (!fact) continue;
    const value = firstText(fact, ["value", "v", "amount"]);
    if (!value) continue;
    result.push({
      label: asText(fact.label) || label,
      value,
      sub: asText(fact.sub),
    });
  }
  if (result.length >= 6) return result.slice(0, 10);

  const dimensions = pack.design_slots.DIMS ?? [];
  for (const dimension of dimensions) {
    if (!dimension.count || result.length >= 10) break;
    if (
      !["apps", "vendors", "data", "infra", "programs", "ai"].includes(
        dimension.key,
      )
    ) {
      continue;
    }
    result.push({
      label: businessMetricLabel(dimension),
      value: new Intl.NumberFormat("en-US").format(dimension.count),
      sub: statusLabel(dimension.status),
    });
  }
  return result;
}

function pickDimension(
  dimensions: HomeKnowledgeDimension[],
  selectedDimension?: string | null,
) {
  const wanted = selectedDimension?.trim().toLowerCase();
  if (!wanted) return dimensions[0] ?? null;
  return (
    dimensions.find(
      (dimension) =>
        dimension.key.toLowerCase() === wanted ||
        dimension.name.toLowerCase() === wanted,
    ) ??
    dimensions[0] ??
    null
  );
}

function rowsForDimension(
  pack: HomeKnowledgeDesignContractPack,
  dimensionKey: string,
): HomeKnowledgeDataSet | undefined {
  return pack.design_slots.DATA?.[dimensionKey];
}

function evidenceForDimension(
  pack: HomeKnowledgeDesignContractPack,
  dimensionKey: string,
): HomeKnowledgeEvidence[] {
  return (
    pack.design_slots.EVID?.[dimensionKey] ?? pack.design_slots.EVIDENCE ?? []
  );
}

function dimensionReadinessScore(dimension: HomeKnowledgeDimension) {
  const tone = statusTone(dimension.status);
  if (tone === "ready") return 82;
  if (tone === "weak") return 34;
  return 58;
}

function dimensionSignalData(
  dimension: HomeKnowledgeDimension,
  dataSet?: HomeKnowledgeDataSet,
  evidence: HomeKnowledgeEvidence[] = [],
) {
  const linkage =
    dimension.key === "rel"
      ? 78
      : Math.min(90, 42 + Math.min(dataSet?.rows?.length ?? 0, 18) * 2);
  const proof = Math.min(88, 36 + Math.min(evidence.length, 7) * 7);
  return [
    { name: "Readiness", value: dimensionReadinessScore(dimension) },
    { name: "Evidence", value: proof },
    { name: "Linkage", value: linkage },
    {
      name: "Actionability",
      value: statusTone(dimension.status) === "weak" ? 38 : 70,
    },
  ];
}

function chartDimensions(dimensions: HomeKnowledgeDimension[]) {
  return dimensions
    .filter((dimension) =>
      [
        "apps",
        "vendors",
        "data",
        "infra",
        "programs",
        "ai",
        "functions",
      ].includes(dimension.key),
    )
    .slice(0, 7)
    .map((dimension) => ({
      name: businessMetricLabel(dimension),
      value: dimension.count ?? 0,
      status: statusLabel(dimension.status),
      fill: toneColor(dimension.status),
    }));
}

function strategicNarratives(
  pack: HomeKnowledgeDesignContractPack,
  type: string,
) {
  return (
    pack.enterprise_brief?.strategicNarratives.filter(
      (item) => item.narrativeType === type,
    ) ?? []
  );
}

function selectUseCaseRows(pack: HomeKnowledgeDesignContractPack) {
  return (pack.design_slots.USE_CASES ?? []).slice(0, 7);
}

function selectedEdges(
  pack: HomeKnowledgeDesignContractPack,
  relationshipEdges?: HomeRelationshipEdge[],
) {
  const fallbackEdges = deriveHomeRelationshipEdges(
    pack.design_slots.DATA ?? {},
  );
  const cleanDerivedEdges = (relationshipEdges ?? []).filter((edge) => {
    const from = displayRelationshipLabel(edge.from, edge.fromType);
    const to = displayRelationshipLabel(edge.to, edge.sourceField);
    const rawText = `${edge.from} ${edge.to}`;
    return (
      from !== to &&
      from.length <= 64 &&
      to.length <= 64 &&
      !/\bcandidate\b/i.test(rawText) &&
      !/\bsource\s+rows?\b|\bactive\s+rows?\b|\bfact:/i.test(rawText)
    );
  });
  const usefulDerivedLabelCount = new Set(
    cleanDerivedEdges.flatMap((edge) => [
      displayRelationshipLabel(edge.from, edge.fromType),
      displayRelationshipLabel(edge.to, edge.sourceField),
    ]),
  ).size;
  const genericDerivedLabelCount = cleanDerivedEdges.filter((edge) =>
    [edge.from, edge.to].some(
      (value) => displayRelationshipLabel(value) === "Enterprise context item",
    ),
  ).length;
  const edges =
    cleanDerivedEdges.length >= 8 &&
    usefulDerivedLabelCount >= 8 &&
    genericDerivedLabelCount <= 2
      ? cleanDerivedEdges
      : fallbackEdges;
  return edges
    .filter(
      (edge) =>
        displayRelationshipLabel(edge.from, edge.fromType) !==
        displayRelationshipLabel(edge.to, edge.sourceField),
    )
    .slice(0, 32);
}

function relationshipNodes(edges: HomeRelationshipEdge[]) {
  const nodes = new Map<
    string,
    { label: string; type: string; x: number; y: number }
  >();
  const center = { label: "Enterprise", type: "enterprise", x: 410, y: 260 };
  nodes.set(center.label, center);

  const endpoints: Array<{ label: string; type: string }> = [];
  for (const edge of edges) {
    endpoints.push({
      label: displayRelationshipLabel(edge.from, edge.fromType),
      type: edge.fromType || "context",
    });
    endpoints.push({
      label: displayRelationshipLabel(edge.to, edge.sourceField),
      type: edge.sourceField || "context",
    });
  }

  const unique = Array.from(
    new Map(endpoints.map((item) => [item.label, item])).values(),
  ).slice(0, 22);
  unique.forEach((item, index) => {
    const angle =
      (Math.PI * 2 * index) / Math.max(unique.length, 1) - Math.PI / 2;
    const radius = index % 3 === 0 ? 230 : index % 3 === 1 ? 185 : 145;
    nodes.set(item.label, {
      ...item,
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  });
  return Array.from(nodes.values());
}

function nodeColor(type: string) {
  const value = type.toLowerCase();
  if (
    value.includes("vendor") ||
    value.includes("system") ||
    value.includes("application")
  ) {
    return COLORS.teal;
  }
  if (value.includes("risk") || value.includes("constraint")) return COLORS.red;
  if (value.includes("use") || value.includes("program")) return COLORS.blue;
  if (value.includes("data") || value.includes("metric")) return COLORS.amber;
  if (value.includes("enterprise")) return COLORS.black;
  return "#68625a";
}

function formatSourceDate(value?: string) {
  if (!value) return "Current";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function businessSourceLabel(value?: string) {
  const text = sentence(value, "Evidence source")
    .replace(
      /\([^)]*\b(?:active\s+rows?|source\s+rows?|loaded\s+rows?|rows?)\b[^)]*\)/gi,
      "",
    )
    .replace(
      /\b\d+\s+(?:active\s+rows?|source\s+rows?|loaded\s+rows?|rows?)\b/gi,
      "",
    )
    .replace(
      /\b(?:active\s+rows?|source\s+rows?|loaded\s+rows?)\b/gi,
      "source-backed evidence",
    )
    .replace(/\b(?:MER|FC|SKY|LAK|APX)-[A-Z0-9-]*\d[A-Z0-9-]*\b/g, "")
    .replace(/\bEVID-\d+\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([),.;:])/g, "$1")
    .trim();
  return text || "Evidence source";
}

function sourceProofRows(evidence: HomeKnowledgeEvidence[]) {
  return evidence.slice(0, 10).map((item) => ({
    name: businessSourceLabel(item.name),
    type: sentence(item.type, "Source"),
    loaded: formatSourceDate(item.date),
    owner: sentence(item.loaded_by || item.source_owner, "Owner not captured"),
    supports: sentence(
      item.supports || item.facts,
      "Supports the context boundary",
    ),
    status: statusLabel(item.st || item.status),
    gap: sentence(item.missing, "No source-specific caveat captured"),
  }));
}

export function HomeExecutiveCockpit({
  pack,
  selectedDimension,
  relationshipEdges,
}: HomeExecutiveCockpitProps) {
  const dimensions = pack.design_slots.DIMS ?? [];
  const [activeSection, setActiveSection] = useState<SectionKey>(
    selectedDimension ? "dimension" : "brief",
  );
  const [activeDimensionKey, setActiveDimensionKey] = useState(
    pickDimension(dimensions, selectedDimension)?.key ?? "",
  );

  const activeDimension =
    dimensions.find((dimension) => dimension.key === activeDimensionKey) ??
    dimensions[0] ??
    null;
  const facts = enterpriseFacts(pack);
  const edges = useMemo(
    () => selectedEdges(pack, relationshipEdges),
    [pack, relationshipEdges],
  );
  const relationshipGraphNodes = useMemo(
    () => relationshipNodes(edges),
    [edges],
  );
  const executive = pack.enterprise_brief?.executiveRead;
  const tier = pack.enterprise_brief?.packTier;
  const industryMovements = strategicNarratives(pack, "industry_movement");
  const newWays = strategicNarratives(pack, "new_way_of_operating");
  const changeTheses = strategicNarratives(pack, "change_thesis");
  const activeDataSet = activeDimension
    ? rowsForDimension(pack, activeDimension.key)
    : undefined;
  const activeEvidence = activeDimension
    ? evidenceForDimension(pack, activeDimension.key)
    : [];
  const activePage =
    activeSection === "dimension" && activeDimension
      ? {
          index: "08",
          title: activeDimension.name,
          lead: sentence(
            activeDimension.summary,
            "Open the dimension to understand the loaded business context, available evidence, implications, and gaps.",
          ),
        }
      : activeSection === "dimension"
        ? SECTION_COPY.brief
        : SECTION_COPY[activeSection];

  const openDimension = (key: string) => {
    setActiveDimensionKey(key);
    setActiveSection("dimension");
  };

  return (
    <div className="hek-shell">
      <aside className="hek-rail" aria-label="Home context explorer">
        <div className="hek-rail-label">
          <i />
          Context Explorer
        </div>
        <button
          className={`hek-primary-nav ${activeSection === "brief" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveSection("brief")}
        >
          Enterprise Brief
        </button>

        <div className="hek-rail-group">
          <span>Explore Knowledge</span>
          {SECTION_ITEMS.slice(1).map((item) => (
            <button
              key={item.key}
              className={activeSection === item.key ? "is-active" : ""}
              type="button"
              onClick={() => setActiveSection(item.key)}
            >
              <b>{item.label}</b>
              <em>{item.eyebrow}</em>
            </button>
          ))}
        </div>

        {DIMENSION_GROUPS.map((group) => {
          const groupDimensions = group.keys
            .map((key) => dimensions.find((dimension) => dimension.key === key))
            .filter((dimension): dimension is HomeKnowledgeDimension =>
              Boolean(dimension),
            );
          if (!groupDimensions.length) return null;
          return (
            <div className="hek-rail-group" key={group.title}>
              <span>{group.title}</span>
              {groupDimensions.map((dimension) => (
                <button
                  key={dimension.key}
                  className={
                    activeSection === "dimension" &&
                    activeDimension?.key === dimension.key
                      ? "is-active"
                      : ""
                  }
                  type="button"
                  onClick={() => openDimension(dimension.key)}
                >
                  <b>{dimension.name}</b>
                  <em>{statusLabel(dimension.status)}</em>
                </button>
              ))}
            </div>
          );
        })}
      </aside>

      <main className="hek-main">
        <header className="hek-page-head">
          <span>
            {activePage.index} · {activePage.title}
          </span>
          <h1>{activePage.title}</h1>
          <p>{activePage.lead}</p>
          <div className="hek-page-status">
            <b>{pack.tenant_name}</b>
            <i />
            <em>{tier?.tierLabel ?? "Planning-grade context"}</em>
            <i />
            <em>Updated {formatSourceDate(pack.generated_at)}</em>
          </div>
        </header>

        {activeSection === "brief" ? (
          <EnterpriseBrief
            executive={executive}
            facts={facts}
            pack={pack}
            tierBody={tier?.tierBody ?? null}
            dimensions={dimensions}
            aiReadiness={pack.enterprise_brief?.aiReadiness ?? []}
          />
        ) : null}

        {activeSection === "model" ? (
          <EnterpriseModel
            dimensions={dimensions}
            facts={facts}
            industryMovements={industryMovements}
            tenantReality={executive?.tenantReality ?? []}
          />
        ) : null}

        {activeSection === "operating" ? (
          <OperatingModel
            newWays={newWays}
            useCaseRows={selectUseCaseRows(pack)}
          />
        ) : null}

        {activeSection === "relationships" ? (
          <RelationshipMap
            edges={edges}
            nodes={relationshipGraphNodes}
            nextEvidence={pack.design_slots.NEXT_EVIDENCE ?? []}
          />
        ) : null}

        {activeSection === "technology" ? (
          <TechnologyEcosystem
            dimensions={dimensions}
            pack={pack}
            onOpenDimension={openDimension}
          />
        ) : null}

        {activeSection === "change" ? (
          <ChangeThesis
            changeTheses={changeTheses}
            useCaseRows={selectUseCaseRows(pack)}
          />
        ) : null}

        {activeSection === "evidence" ? <EvidenceBoundary pack={pack} /> : null}

        {activeSection === "dimension" && activeDimension ? (
          <DimensionCockpit
            dimension={activeDimension}
            dataSet={activeDataSet}
            evidence={activeEvidence}
            implications={
              pack.enterprise_brief?.dimensionModuleImplications.filter(
                (item) => item.dimensionKey === activeDimension.key,
              ) ?? []
            }
            story={pack.design_slots.STORY?.[activeDimension.key]}
            gaps={pack.design_slots.DGAPS?.[activeDimension.key] ?? []}
            edges={activeDimension.key === "rel" ? edges : []}
            relationshipNodes={relationshipGraphNodes}
            nextEvidence={pack.design_slots.NEXT_EVIDENCE ?? []}
          />
        ) : null}
      </main>

      <style jsx global>{`
        .hek-shell {
          min-height: calc(100vh - 64px);
          background: ${COLORS.paper};
          color: ${COLORS.ink};
          display: grid;
          grid-template-columns: 284px minmax(0, 1fr);
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }
        .hek-rail {
          border-right: 1px solid ${COLORS.line};
          padding: 24px 12px 40px;
          position: sticky;
          top: 0;
          align-self: start;
          height: calc(100vh - 64px);
          overflow: auto;
          background: rgba(245, 241, 235, 0.95);
        }
        .hek-rail-label,
        .hek-kicker,
        .hek-section-label {
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 11px;
          font-weight: 800;
          color: #6e7b94;
        }
        .hek-rail-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 8px 14px;
        }
        .hek-rail-label i,
        .hek-page-status i {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: ${COLORS.teal};
          display: inline-block;
        }
        .hek-primary-nav,
        .hek-rail button {
          width: 100%;
          border: 0;
          background: transparent;
          text-align: left;
          cursor: pointer;
          color: ${COLORS.ink};
          font: inherit;
        }
        .hek-primary-nav {
          border-radius: 7px;
          padding: 12px 16px;
          font-weight: 800;
          font-size: 16px;
          margin-bottom: 8px;
        }
        .hek-primary-nav.is-active,
        .hek-rail button.is-active {
          background: #272522;
          color: white;
        }
        .hek-rail-group {
          border-top: 1px solid ${COLORS.line};
          padding: 14px 0 10px;
        }
        .hek-rail-group > span {
          display: block;
          padding: 0 8px 8px;
          color: ${COLORS.faint};
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-weight: 900;
        }
        .hek-rail-group button {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3px;
          border-radius: 7px;
          padding: 9px 14px;
          margin: 1px 0;
        }
        .hek-rail-group button b {
          font-size: 14px;
          line-height: 1.2;
        }
        .hek-rail-group button em {
          font-style: normal;
          font-size: 12px;
          color: ${COLORS.muted};
        }
        .hek-rail-group button.is-active em {
          color: rgba(255, 255, 255, 0.72);
        }
        .hek-main {
          max-width: 980px;
          width: 100%;
          margin: 0;
          padding: 30px 48px 72px;
        }
        .hek-page-head {
          border-bottom: 1px solid ${COLORS.line};
          padding-bottom: 22px;
          margin-bottom: 24px;
        }
        .hek-page-head > span {
          display: block;
          color: ${COLORS.faint};
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .hek-page-head h1,
        .hek-hero h2,
        .hek-page-title,
        .hek-relationship-title {
          font-family: Fraunces, Georgia, serif;
          letter-spacing: 0;
          color: ${COLORS.ink};
        }
        .hek-page-head h1 {
          font-size: clamp(28px, 3vw, 36px);
          line-height: 1.08;
          margin: 0 0 10px;
        }
        .hek-page-head p {
          color: ${COLORS.muted};
          font-size: 15px;
          line-height: 1.55;
          max-width: 74ch;
          margin: 0 0 16px;
        }
        .hek-page-status {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
          color: ${COLORS.muted};
          font-size: 13px;
        }
        .hek-page-status b {
          color: ${COLORS.ink};
        }
        .hek-page-status i {
          width: 5px;
          height: 5px;
        }
        .hek-section {
          margin: 22px 0;
        }
        .hek-hero {
          border: 1px solid ${COLORS.line};
          border-radius: 10px;
          background: ${COLORS.surface};
          padding: 24px;
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.65fr);
          gap: 24px;
        }
        .hek-hero h2 {
          font-size: clamp(24px, 2.4vw, 32px);
          line-height: 1.12;
          margin: 10px 0 14px;
        }
        .hek-copy {
          color: ${COLORS.ink};
          font-size: 16px;
          line-height: 1.6;
        }
        .hek-copy.is-muted {
          color: ${COLORS.muted};
        }
        .hek-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 18px;
        }
        .hek-chip {
          border: 1px solid rgba(29, 158, 117, 0.25);
          background: rgba(29, 158, 117, 0.08);
          color: ${COLORS.tealDark};
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .hek-confidence {
          display: grid;
          place-items: center;
          gap: 12px;
        }
        .hek-donut {
          --pct: 58;
          width: 170px;
          height: 170px;
          border-radius: 999px;
          background: conic-gradient(
            ${COLORS.teal} calc(var(--pct) * 1%),
            #e4e5e4 0
          );
          display: grid;
          place-items: center;
        }
        .hek-donut > div {
          width: 122px;
          height: 122px;
          background: ${COLORS.surface};
          border-radius: 999px;
          display: grid;
          place-items: center;
          text-align: center;
          line-height: 1.1;
        }
        .hek-donut strong {
          font-family: Fraunces, Georgia, serif;
          font-size: 38px;
        }
        .hek-donut span {
          color: ${COLORS.faint};
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 900;
        }
        .hek-fact-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          border: 1px solid ${COLORS.lineStrong};
          border-radius: 14px;
          overflow: hidden;
          margin-top: 26px;
          background: ${COLORS.surface};
        }
        .hek-fact {
          padding: 17px 18px;
          min-height: 92px;
          border-right: 1px solid ${COLORS.line};
          border-bottom: 1px solid ${COLORS.line};
        }
        .hek-fact:nth-child(5n) {
          border-right: 0;
        }
        .hek-fact span {
          display: block;
          color: ${COLORS.muted};
          font-size: 12px;
          font-weight: 800;
        }
        .hek-fact strong {
          display: block;
          font-family: Fraunces, Georgia, serif;
          font-size: 26px;
          line-height: 1;
          margin: 5px 0;
        }
        .hek-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .hek-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        .hek-card {
          background: ${COLORS.surface};
          border: 1px solid ${COLORS.line};
          border-radius: 12px;
          padding: 20px;
          min-width: 0;
        }
        .hek-card h3 {
          margin: 8px 0 10px;
          font-size: 18px;
          line-height: 1.2;
        }
        .hek-card p,
        .hek-card li {
          color: ${COLORS.muted};
          font-size: 14px;
          line-height: 1.5;
        }
        .hek-card ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 8px;
        }
        .hek-card li {
          position: relative;
          padding-left: 15px;
        }
        .hek-card li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0.65em;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: ${COLORS.teal};
        }
        .hek-page-title {
          font-size: 32px;
          line-height: 1.08;
          margin: 0 0 12px;
        }
        .hek-chart-card {
          min-height: 320px;
        }
        .hek-chart {
          height: 260px;
          margin-top: 10px;
        }
        .hek-usecase-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        .hek-usecase {
          border: 1px solid ${COLORS.line};
          border-radius: 12px;
          background: ${COLORS.surface};
          padding: 18px;
          display: grid;
          gap: 10px;
        }
        .hek-usecase span {
          color: ${COLORS.tealDark};
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 900;
        }
        .hek-usecase h3 {
          margin: 0;
          font-size: 16px;
          line-height: 1.25;
        }
        .hek-usecase p {
          margin: 0;
          color: ${COLORS.muted};
          font-size: 13px;
          line-height: 1.45;
        }
        .hek-relationship-visual {
          border: 1px solid ${COLORS.line};
          border-radius: 10px;
          background: ${COLORS.surface};
          padding: 16px;
          overflow: hidden;
        }
        .hek-graph-legend {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin: 8px 0 14px;
          color: ${COLORS.muted};
          font-size: 13px;
        }
        .hek-graph-legend span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }
        .hek-graph-legend i,
        .hek-graph-note i {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          display: inline-block;
          flex: none;
        }
        .hek-graph-note {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          background: ${COLORS.surface};
          border: 1px solid ${COLORS.line};
          border-radius: 10px;
          padding: 14px 16px;
          color: ${COLORS.muted};
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 10px;
        }
        .hek-graph-note i {
          margin-top: 5px;
          background: ${COLORS.teal};
        }
        .hek-graph-svg {
          width: 100%;
          min-height: 570px;
          display: block;
        }
        .hek-node-label {
          font-size: 11px;
          fill: ${COLORS.ink};
        }
        .hek-table {
          width: 100%;
          border-collapse: collapse;
          background: ${COLORS.surface};
          border: 1px solid ${COLORS.line};
          border-radius: 12px;
          overflow: hidden;
          display: table;
        }
        .hek-table th,
        .hek-table td {
          text-align: left;
          padding: 13px 14px;
          border-bottom: 1px solid ${COLORS.line};
          font-size: 13px;
          vertical-align: top;
        }
        .hek-table th {
          color: #62708a;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 10px;
          background: #f8f5ee;
        }
        .hek-table td {
          color: ${COLORS.ink};
          line-height: 1.45;
        }
        .hek-detail-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 18px;
        }
        .hek-signal-bars {
          height: 250px;
        }
        @media (max-width: 1100px) {
          .hek-shell {
            grid-template-columns: 1fr;
          }
          .hek-rail {
            position: relative;
            height: auto;
            border-right: 0;
            border-bottom: 1px solid ${COLORS.line};
          }
          .hek-header,
          .hek-hero,
          .hek-detail-layout {
            grid-template-columns: 1fr;
          }
          .hek-fact-grid,
          .hek-grid-3,
          .hek-usecase-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 720px) {
          .hek-main {
            padding: 22px 16px 44px;
          }
          .hek-fact-grid,
          .hek-grid-2,
          .hek-grid-3,
          .hek-usecase-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function EnterpriseBrief({
  executive,
  facts,
  pack,
  tierBody,
  dimensions,
  aiReadiness,
}: {
  executive?: HomeKnowledgeDesignContractPack["enterprise_brief"] extends infer T
    ? T extends { executiveRead?: infer E }
      ? E
      : never
    : never;
  facts: Array<{ label: string; value: string; sub?: string }>;
  pack: HomeKnowledgeDesignContractPack;
  tierBody?: string | null;
  dimensions: HomeKnowledgeDimension[];
  aiReadiness: NonNullable<
    HomeKnowledgeDesignContractPack["enterprise_brief"]
  >["aiReadiness"];
}) {
  const confidence = Math.max(
    0,
    Math.min(100, Number(executive?.contextConfidencePct ?? 58)),
  );
  const radar = aiReadiness.slice(0, 6).map((item) => ({
    name: shortLabel(item.readinessDimension, 18),
    value: item.scorePct,
  }));
  return (
    <>
      <section className="hek-hero">
        <div>
          <span className="hek-section-label">
            The enterprise in one sentence
          </span>
          <h2>
            {sentence(
              executive?.tensionHeadline ??
                pack.narrative_sections?.enterprise_brief_title,
              "Leadership needs one governed view of the enterprise before AI and transformation decisions scale.",
            )}
          </h2>
          <p className="hek-copy">
            {sentence(
              executive?.oneSentence ??
                pack.narrative_sections?.enterprise_brief_summary,
            )}
          </p>
          <div className="hek-chip-row">
            {(executive?.industryForces ?? []).slice(0, 4).map((force) => (
              <span className="hek-chip" key={force}>
                {force}
              </span>
            ))}
          </div>
        </div>
        <div className="hek-confidence">
          <div
            className="hek-donut"
            style={{ "--pct": confidence } as CSSProperties}
          >
            <div>
              <strong>{confidence}%</strong>
              <span>Context confidence</span>
            </div>
          </div>
          <p className="hek-copy is-muted">
            {sentence(executive?.contextConfidenceNote ?? tierBody)}
          </p>
        </div>
      </section>

      {facts.length ? (
        <section className="hek-fact-grid" aria-label="Enterprise facts">
          {facts.map((fact) => (
            <article className="hek-fact" key={`${fact.label}-${fact.value}`}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
              <span>{fact.sub}</span>
            </article>
          ))}
        </section>
      ) : null}

      <section className="hek-section hek-grid-2">
        <article className="hek-card">
          <span className="hek-section-label">Proven strengths</span>
          <ul>
            {(executive?.strengths ?? []).slice(0, 4).map((item) => (
              <li key={sentence(item.text)}>{sentence(item.text)}</li>
            ))}
          </ul>
        </article>
        <article className="hek-card">
          <span className="hek-section-label">
            Constraints leadership must resolve
          </span>
          <ul>
            {(executive?.constraints ?? []).slice(0, 4).map((item) => (
              <li key={sentence(item.text)}>{sentence(item.text)}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="hek-section hek-grid-2">
        <article className="hek-card hek-chart-card">
          <span className="hek-section-label">Context shape</span>
          <h3>Where the enterprise picture is strongest</h3>
          <div className="hek-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDimensions(dimensions)} layout="vertical">
                <CartesianGrid horizontal={false} stroke="#e8dfd3" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={128}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {chartDimensions(dimensions).map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="hek-card hek-chart-card">
          <span className="hek-section-label">AI readiness</span>
          <h3>Evidence-weighted readiness lens</h3>
          <div className="hek-chart">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar}>
                <PolarGrid stroke="#ddd3c6" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  dataKey="value"
                  stroke={COLORS.teal}
                  fill={COLORS.teal}
                  fillOpacity={0.24}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </>
  );
}

function EnterpriseModel({
  dimensions,
  facts,
  industryMovements,
  tenantReality,
}: {
  dimensions: HomeKnowledgeDimension[];
  facts: Array<{ label: string; value: string; sub?: string }>;
  industryMovements: NonNullable<
    HomeKnowledgeDesignContractPack["enterprise_brief"]
  >["strategicNarratives"];
  tenantReality: string[];
}) {
  return (
    <section className="hek-section">
      <h2 className="hek-page-title">
        The enterprise model, in business terms
      </h2>
      <p className="hek-copy is-muted">
        This view explains the shape of the enterprise before any AI, operating
        model or sourcing decision is treated as board-ready.
      </p>
      <div className="hek-grid-3">
        {facts.slice(0, 6).map((fact) => (
          <article className="hek-card" key={`${fact.label}-${fact.value}`}>
            <span className="hek-section-label">{fact.label}</span>
            <h3>{fact.value}</h3>
            <p>{fact.sub || "Loaded business scale"}</p>
          </article>
        ))}
      </div>
      <div className="hek-section hek-grid-2">
        <article className="hek-card">
          <span className="hek-section-label">Industry movement</span>
          <ul>
            {industryMovements.slice(0, 5).map((item) => (
              <li key={item.title}>
                {item.title}: {item.executiveNarrative}
              </li>
            ))}
          </ul>
        </article>
        <article className="hek-card">
          <span className="hek-section-label">Tenant reality</span>
          <ul>
            {tenantReality.slice(0, 6).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
      <article className="hek-card hek-chart-card">
        <span className="hek-section-label">Enterprise lens</span>
        <h3>Business domains with enough context to reason from</h3>
        <div className="hek-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartDimensions(dimensions)}>
              <CartesianGrid vertical={false} stroke="#e8dfd3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartDimensions(dimensions).map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
                <LabelList dataKey="status" position="top" fontSize={10} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}

function OperatingModel({
  newWays,
  useCaseRows,
}: {
  newWays: NonNullable<
    HomeKnowledgeDesignContractPack["enterprise_brief"]
  >["strategicNarratives"];
  useCaseRows: HomeKnowledgeRecord[];
}) {
  return (
    <section className="hek-section">
      <h2 className="hek-page-title">How the business could run differently</h2>
      <p className="hek-copy is-muted">
        The operating model read blends client context with industry movement,
        then keeps value hypotheses separate from confirmed current state.
      </p>
      <div className="hek-grid-2">
        {newWays.slice(0, 4).map((item) => (
          <article className="hek-card" key={item.title}>
            <span className="hek-section-label">
              {item.classification ?? "Strategic inference"}
            </span>
            <h3>{item.title}</h3>
            <p>{item.executiveNarrative}</p>
            {item.evidenceGate ? (
              <p>
                <strong>Evidence gate:</strong> {item.evidenceGate}
              </p>
            ) : null}
          </article>
        ))}
      </div>
      <section className="hek-section">
        <span className="hek-section-label">Potential moves</span>
        <div className="hek-usecase-grid">
          {useCaseRows.slice(0, 6).map((row) => (
            <article
              className="hek-usecase"
              key={firstText(row, ["key", "name", "title"])}
            >
              <span>
                {firstText(row, ["business_function", "fn", "classification"])}
              </span>
              <h3>{firstText(row, ["name", "title"])}</h3>
              <p>
                {firstText(row, [
                  "client_context_signal",
                  "why_now",
                  "priority_rationale",
                ])}
              </p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function RelationshipMap({
  edges,
  nodes,
  nextEvidence,
}: {
  edges: HomeRelationshipEdge[];
  nodes: Array<{ label: string; type: string; x: number; y: number }>;
  nextEvidence: HomeKnowledgeRecord[];
}) {
  const nodeMap = new Map(nodes.map((node) => [node.label, node]));
  const visibleEdges = edges
    .map((edge) => ({
      from: displayRelationshipLabel(edge.from, edge.fromType),
      to: displayRelationshipLabel(edge.to, edge.sourceField),
      relationship: edge.relationship,
    }))
    .filter((edge) => nodeMap.has(edge.from) && nodeMap.has(edge.to))
    .slice(0, 38);
  return (
    <section className="hek-section">
      <div className="hek-graph-legend" aria-label="Relationship map legend">
        {[
          ["Enterprise", "enterprise"],
          ["Systems", "system"],
          ["Data", "data"],
          ["AI use cases", "use case"],
          ["Constraints", "risk"],
          ["Functions", "function"],
        ].map(([label, type]) => (
          <span key={label}>
            <i style={{ background: nodeColor(type) }} />
            {label}
          </span>
        ))}
      </div>
      <div className="hek-graph-note">
        <i />
        <span>
          Click any node to trace its connections across the enterprise:
          business functions, systems, priorities, risks, evidence gates and the
          constraints that shape AI execution.
        </span>
      </div>
      <div className="hek-relationship-visual">
        <svg
          className="hek-graph-svg"
          viewBox="0 0 820 540"
          role="img"
          aria-label="Enterprise relationship graph"
        >
          {visibleEdges.map((edge, index) => {
            const from = nodeMap.get(edge.from);
            const to = nodeMap.get(edge.to);
            if (!from || !to) return null;
            return (
              <line
                key={`${edge.from}-${edge.to}-${index}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#cfc7ba"
                strokeWidth="1"
              />
            );
          })}
          {nodes.map((node) => (
            <g key={`${node.label}-${node.x}-${node.y}`}>
              <circle
                cx={node.x}
                cy={node.y}
                r={node.type === "enterprise" ? 28 : 10}
                fill={nodeColor(node.type)}
              />
              <text
                className="hek-node-label"
                x={node.x + (node.type === "enterprise" ? 34 : 14)}
                y={node.y + 4}
              >
                {shortLabel(node.label, node.type === "enterprise" ? 18 : 28)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <section className="hek-section hek-grid-3">
        {[
          [
            "Ownership spine",
            "Add accountable owner paths where relationship evidence is still thin.",
          ],
          [
            "System and data lineage",
            "Connect use cases to systems, data products, controls and operational handoffs.",
          ],
          [
            "Value linkage",
            "Tie initiatives to outcomes, KPIs and Tower measures before claiming enterprise impact.",
          ],
        ].map(([title, body]) => (
          <article className="hek-card" key={title}>
            <span className="hek-section-label">Art of the possible</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </section>
      <section className="hek-section">
        <span className="hek-section-label">
          What would make the graph sharper
        </span>
        <div className="hek-usecase-grid">
          {nextEvidence.slice(0, 6).map((item) => (
            <article
              className="hek-usecase"
              key={firstText(item, ["title", "item"])}
            >
              <span>
                {firstText(item, ["owner_hint", "collection_route"]) ||
                  "Evidence request"}
              </span>
              <h3>{firstText(item, ["title", "item"])}</h3>
              <p>{firstText(item, ["narrative", "unlocks"])}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function TechnologyEcosystem({
  dimensions,
  pack,
  onOpenDimension,
}: {
  dimensions: HomeKnowledgeDimension[];
  pack: HomeKnowledgeDesignContractPack;
  onOpenDimension: (key: string) => void;
}) {
  const keys = ["apps", "data", "infra", "vendors"];
  return (
    <section className="hek-section">
      <h2 className="hek-page-title">Technology and ecosystem view</h2>
      <p className="hek-copy is-muted">
        This section shows the current-state technology context aVa should use
        before answering AI strategy, modernization or sourcing questions.
      </p>
      <div className="hek-grid-2">
        {keys.map((key) => {
          const dimension = dimensions.find((item) => item.key === key);
          if (!dimension) return null;
          const dataSet = rowsForDimension(pack, key);
          return (
            <button
              className="hek-card"
              key={key}
              type="button"
              onClick={() => onOpenDimension(key)}
            >
              <span className="hek-section-label">
                {statusLabel(dimension.status)}
              </span>
              <h3>{dimension.name}</h3>
              <p>{sentence(dimension.summary)}</p>
              <div className="hek-signal-bars">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dimensionSignalData(dimension, dataSet)}>
                    <CartesianGrid vertical={false} stroke="#e8dfd3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      fill={toneColor(dimension.status)}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ChangeThesis({
  changeTheses,
  useCaseRows,
}: {
  changeTheses: NonNullable<
    HomeKnowledgeDesignContractPack["enterprise_brief"]
  >["strategicNarratives"];
  useCaseRows: HomeKnowledgeRecord[];
}) {
  return (
    <section className="hek-section">
      <h2 className="hek-page-title">The leadership change thesis</h2>
      <div className="hek-grid-3">
        {changeTheses.slice(0, 6).map((item) => (
          <article className="hek-card" key={item.title}>
            <span className="hek-section-label">Change thesis</span>
            <h3>{item.title}</h3>
            <p>{item.executiveNarrative}</p>
            {item.recommendedNextAction ? (
              <p>
                <strong>Next:</strong> {item.recommendedNextAction}
              </p>
            ) : null}
          </article>
        ))}
      </div>
      <section className="hek-section">
        <table className="hek-table">
          <thead>
            <tr>
              <th>Opportunity</th>
              <th>Why it matters</th>
              <th>Evidence gate</th>
              <th>Module route</th>
            </tr>
          </thead>
          <tbody>
            {useCaseRows.slice(0, 6).map((row) => (
              <tr key={firstText(row, ["key", "name", "title"])}>
                <td>{firstText(row, ["name", "title"])}</td>
                <td>{firstText(row, ["value_thesis", "why_now"])}</td>
                <td>
                  {firstText(row, ["evidence_gate", "readiness_barrier"])}
                </td>
                <td>
                  {firstText(row, ["module_next_step", "classification"])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}

function EvidenceBoundary({ pack }: { pack: HomeKnowledgeDesignContractPack }) {
  const evidence = sourceProofRows(pack.design_slots.EVIDENCE ?? []);
  const next = pack.design_slots.NEXT_EVIDENCE ?? [];
  return (
    <section className="hek-section">
      <h2 className="hek-page-title">Source proof and evidence boundary</h2>
      <p className="hek-copy is-muted">
        This is the business-readable proof layer: what source material supports
        the cockpit, who supplied or owns it where captured, and which evidence
        would make decisions safer.
      </p>
      <table className="hek-table">
        <thead>
          <tr>
            <th>Source material</th>
            <th>Type</th>
            <th>As of</th>
            <th>Owner</th>
            <th>Supports</th>
            <th>Boundary</th>
          </tr>
        </thead>
        <tbody>
          {evidence.map((row) => (
            <tr key={`${row.name}-${row.loaded}`}>
              <td>{row.name}</td>
              <td>{row.type}</td>
              <td>{row.loaded}</td>
              <td>{row.owner}</td>
              <td>{row.supports}</td>
              <td>{row.gap}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="hek-section hek-usecase-grid">
        {next.slice(0, 6).map((item) => (
          <article
            className="hek-usecase"
            key={firstText(item, ["title", "item"])}
          >
            <span>
              {firstText(item, ["owner_hint", "collection_route"]) ||
                "Client to confirm"}
            </span>
            <h3>{firstText(item, ["title", "item"])}</h3>
            <p>{firstText(item, ["narrative", "unlocks"])}</p>
          </article>
        ))}
      </section>
    </section>
  );
}

function DimensionCockpit({
  dimension,
  dataSet,
  evidence,
  implications,
  story,
  gaps,
  edges,
  relationshipNodes: nodes,
  nextEvidence,
}: {
  dimension: HomeKnowledgeDimension;
  dataSet?: HomeKnowledgeDataSet;
  evidence: HomeKnowledgeEvidence[];
  implications: NonNullable<
    HomeKnowledgeDesignContractPack["enterprise_brief"]
  >["dimensionModuleImplications"];
  story?: {
    meaning?: string;
    observed?: string;
    matters?: string;
    supports?: string;
  };
  gaps: Array<{
    missing?: string;
    blocks?: string;
    needed?: string;
    handoff?: string;
  }>;
  edges: HomeRelationshipEdge[];
  relationshipNodes: Array<{
    label: string;
    type: string;
    x: number;
    y: number;
  }>;
  nextEvidence: HomeKnowledgeRecord[];
}) {
  const rows = dataSet?.rows ?? [];
  const proof = sourceProofRows(evidence);
  if (dimension.key === "rel") {
    return (
      <RelationshipMap
        edges={edges}
        nodes={nodes}
        nextEvidence={nextEvidence}
      />
    );
  }
  return (
    <section className="hek-section">
      <h2 className="hek-page-title">{dimension.name}</h2>
      <p className="hek-copy is-muted">
        {sentence(
          story?.meaning ?? story?.observed ?? dimension.summary,
          "This dimension is part of the context layer that frames what aVa, Moves, Source and Tower can safely support.",
        )}
      </p>
      <div className="hek-detail-layout">
        <article className="hek-card hek-chart-card">
          <span className="hek-section-label">Dimension visual</span>
          <h3>Readiness, evidence, linkage and actionability</h3>
          <div className="hek-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dimensionSignalData(dimension, dataSet, evidence)}
              >
                <CartesianGrid vertical={false} stroke="#e8dfd3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill={toneColor(dimension.status)}
                  radius={[8, 8, 0, 0]}
                >
                  <LabelList dataKey="value" position="top" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <aside className="hek-card">
          <span className="hek-section-label">Executive interpretation</span>
          <h3>{statusLabel(dimension.status)}</h3>
          <p>{sentence(story?.matters ?? dimension.summary)}</p>
          {story?.supports ? (
            <p>
              <strong>Supports:</strong> {story.supports}
            </p>
          ) : null}
        </aside>
      </div>
      <section className="hek-section hek-grid-2">
        <article className="hek-card">
          <span className="hek-section-label">Module implications</span>
          <ul>
            {implications.length ? (
              implications.slice(0, 5).map((item) => (
                <li key={`${item.module}-${item.implication}`}>
                  <strong>{item.module}:</strong> {item.implication}
                </li>
              ))
            ) : (
              <li>
                Use this dimension to orient decisions and identify the evidence
                boundary before moving into execution.
              </li>
            )}
          </ul>
        </article>
        <article className="hek-card">
          <span className="hek-section-label">Evidence gaps</span>
          <ul>
            {gaps.length ? (
              gaps
                .slice(0, 5)
                .map((gap) => (
                  <li key={`${gap.missing}-${gap.blocks}`}>
                    {sentence(
                      gap.missing ?? gap.blocks ?? gap.needed ?? gap.handoff,
                    )}
                  </li>
                ))
            ) : (
              <li>
                No dimension-specific gap is called out in the approved pack.
              </li>
            )}
          </ul>
        </article>
      </section>
      {rows.length ? (
        <section className="hek-section">
          <span className="hek-section-label">Business sample</span>
          <table className="hek-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Summary</th>
                <th>Function or category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((row, index) => (
                <tr
                  key={`${firstText(row, ["name", "title", "context_item"])}-${index}`}
                >
                  <td>
                    {firstText(row, [
                      "name",
                      "title",
                      "context_item",
                      "business_name",
                    ])}
                  </td>
                  <td>
                    {firstText(row, [
                      "summary",
                      "description",
                      "business_workflow_or_decision",
                    ])}
                  </td>
                  <td>
                    {firstText(row, [
                      "facet_1",
                      "category",
                      "function_name",
                      "business_function",
                    ])}
                  </td>
                  <td>{statusLabel(firstText(row, ["status"]))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
      {proof.length ? (
        <section className="hek-section">
          <span className="hek-section-label">Source proof</span>
          <table className="hek-table">
            <thead>
              <tr>
                <th>Source material</th>
                <th>As of</th>
                <th>Owner</th>
                <th>Supports</th>
              </tr>
            </thead>
            <tbody>
              {proof.slice(0, 5).map((row) => (
                <tr key={`${row.name}-${row.loaded}`}>
                  <td>{row.name}</td>
                  <td>{row.loaded}</td>
                  <td>{row.owner}</td>
                  <td>{row.supports}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </section>
  );
}

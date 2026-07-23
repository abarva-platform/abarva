"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  HomeKnowledgeDataSet,
  HomeKnowledgeDesignContractPack,
  HomeKnowledgeDimension,
  HomeKnowledgeRecord,
} from "@/lib/home/home-knowledge-design-contract";
import type { HomeRelationshipEdge } from "@/lib/home/derive-relationship-edges";

type ViewKey =
  | "snapshot"
  | "operating"
  | "map"
  | "apps"
  | "data"
  | "vendors"
  | "integrations"
  | "spend"
  | "priorities"
  | "constraints"
  | "programs"
  | "risks"
  | "evidence"
  | "coverage";

interface HomeEnterpriseBriefAppProps {
  pack: HomeKnowledgeDesignContractPack;
  relationshipEdges?: HomeRelationshipEdge[];
  selectedDimension?: string | null;
}

type GraphNodeType =
  | "enterprise"
  | "division"
  | "function"
  | "system"
  | "priority"
  | "constraint"
  | "evidence";

interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

const COLORS = {
  page: "#f3f0ea",
  rail: "#ebe9e2",
  surface: "#fffdf8",
  ink: "#2d2b27",
  muted: "#67625a",
  quiet: "#8b887f",
  line: "#d9d2c8",
  lineStrong: "#c5bdb0",
  blue: "#1268c7",
  teal: "#2ca477",
  tealDark: "#0d7053",
  amber: "#bf7d1d",
  red: "#ad3434",
  black: "#0a0a0b",
};

const VIEW_META: Record<
  ViewKey,
  { index: string; title: string; lead: string; dimKey?: string }
> = {
  snapshot: {
    index: "01",
    title: "Enterprise snapshot",
    lead: "The executive read: what is known about the enterprise, where context is strong, and which decisions should not be over-claimed yet.",
  },
  operating: {
    index: "02",
    title: "Operating model",
    lead: "How the business may need to run differently when AI, data, process, and governance are treated as one change system.",
  },
  map: {
    index: "03",
    title: "Enterprise relationship map",
    lead: "A business-readable graph of the enterprise: functions, systems, priorities, constraints, and proof boundaries in one connected view.",
  },
  apps: {
    index: "04",
    title: "Applications",
    lead: "Where the application estate is understood well enough to shape modernization, AI activation, sourcing, and risk decisions.",
    dimKey: "apps",
  },
  data: {
    index: "05",
    title: "Data domains",
    lead: "The data foundation behind AI execution: domains, systems of record, quality boundaries, and missing lineage.",
    dimKey: "data",
  },
  vendors: {
    index: "06",
    title: "Vendors",
    lead: "The vendor and ecosystem lens: which partners matter, where concentration risk exists, and where Source needs proof.",
    dimKey: "vendors",
  },
  integrations: {
    index: "07",
    title: "Integrations",
    lead: "How systems and data move across the enterprise, and where interface evidence must improve before execution.",
    dimKey: "rel",
  },
  spend: {
    index: "08",
    title: "Spend and value",
    lead: "The financial lens: budget, run/change posture, value signals, and where Tower needs accountable measures.",
    dimKey: "budget",
  },
  priorities: {
    index: "09",
    title: "Strategic priorities",
    lead: "The agenda items that should anchor executive conversation and determine which AI or transformation bets matter first.",
    dimKey: "ai",
  },
  constraints: {
    index: "10",
    title: "Constraints",
    lead: "The evidence gaps, risks, control issues, and operating blockers that should gate confident execution.",
    dimKey: "risks",
  },
  programs: {
    index: "11",
    title: "Programs",
    lead: "The transformation portfolio view: what is in motion, what it depends on, and what should convert into Moves.",
    dimKey: "programs",
  },
  risks: {
    index: "12",
    title: "Risks",
    lead: "The control and readiness posture that should shape what AbarVa can safely recommend, source, execute, and measure.",
    dimKey: "risks",
  },
  evidence: {
    index: "13",
    title: "Evidence",
    lead: "The source proof layer: what file families, interviews, extracts, or templates support the context and who owns the evidence.",
    dimKey: "evidence",
  },
  coverage: {
    index: "14",
    title: "Coverage",
    lead: "Where the knowledge layer is strong enough for decision support, and where it still needs client confirmation.",
  },
};

const NAV_GROUPS: Array<{
  title: string;
  items: Array<{ key: ViewKey; label: string; measure?: string }>;
}> = [
  {
    title: "Enterprise",
    items: [
      { key: "snapshot", label: "Snapshot" },
      { key: "operating", label: "Operating Model" },
      { key: "map", label: "Relationship Map" },
    ],
  },
  {
    title: "Landscape",
    items: [
      { key: "apps", label: "Applications", measure: "apps" },
      { key: "data", label: "Data Domains", measure: "data" },
      { key: "vendors", label: "Vendors", measure: "vendors" },
      { key: "integrations", label: "Integrations", measure: "rel" },
      { key: "spend", label: "Spend", measure: "budget" },
    ],
  },
  {
    title: "Agenda",
    items: [
      { key: "priorities", label: "Strategic Priorities", measure: "ai" },
      { key: "constraints", label: "Constraints", measure: "risks" },
      { key: "programs", label: "Programs", measure: "programs" },
      { key: "risks", label: "Risks", measure: "risks" },
    ],
  },
  {
    title: "Knowledge",
    items: [
      { key: "evidence", label: "Evidence", measure: "evidence" },
      { key: "coverage", label: "Coverage" },
    ],
  },
];

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => {
        const text = asText(nested);
        return text ? `${humanize(key)}: ${text}` : "";
      })
      .filter(Boolean)
      .join("; ");
  }
  return String(value);
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function plain(value: unknown, fallback = "") {
  const text = asText(value).replace(/\s+/g, " ").trim();
  return text || fallback;
}

function firstText(record: HomeKnowledgeRecord | undefined, keys: string[]) {
  for (const key of keys) {
    const value = plain(record?.[key]);
    if (value) return value;
  }
  return "";
}

function shortLabel(value: string, max = 28) {
  const text = value.trim();
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function noMechanics(value: unknown) {
  const text = plain(value)
    .replace(
      /\b(?:row|rows|fact|facts|edge|edges|node|nodes|record|records)\b/gi,
      "item",
    )
    .replace(/\b(?:MER|FC|SKY|LAK|APX|SA\d*)-[A-Z0-9-]*\d[A-Z0-9-]*\b/gi, "")
    .replace(/\b[A-Z]{2,}\d{1,3}-[A-Z0-9-]+-\d+\b/gi, "")
    .replace(/\bfact:/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return text;
}

function formatNumber(value?: number) {
  if (!value) return "";
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value?: string) {
  if (!value) return "Current";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function tone(status?: string | null) {
  const value = plain(status).toLowerCase();
  if (value.includes("source") || value.includes("ready")) return "ready";
  if (
    value.includes("weak") ||
    value.includes("need") ||
    value.includes("gap")
  ) {
    return "weak";
  }
  return "directional";
}

function toneLabel(status?: string | null) {
  const value = tone(status);
  if (value === "ready") return "Decision-ready";
  if (value === "weak") return "Needs evidence";
  return "Directional";
}

function toneColor(status?: string | null) {
  const value = tone(status);
  if (value === "ready") return COLORS.teal;
  if (value === "weak") return COLORS.red;
  return COLORS.amber;
}

function dimensionLabel(key: string) {
  const labels: Record<string, string> = {
    profile: "Enterprise Profile",
    org: "Org Ownership",
    functions: "Business Functions",
    workforce: "Workforce Roles",
    apps: "Applications",
    data: "Data Domains",
    infra: "Infrastructure",
    vendors: "Vendors",
    rel: "Relationships",
    budget: "Spend",
    programs: "Programs",
    ai: "AI Opportunities",
    risks: "Risks",
    metrics: "Measures",
    evidence: "Evidence",
  };
  return labels[key] ?? humanize(key);
}

function byDimension(pack: HomeKnowledgeDesignContractPack, key?: string) {
  if (!key) return undefined;
  return pack.design_slots.DIMS.find((dimension) => dimension.key === key);
}

function dataFor(pack: HomeKnowledgeDesignContractPack, key?: string) {
  if (!key) return undefined;
  return key ? pack.design_slots.DATA?.[key] : undefined;
}

function evidenceFor(pack: HomeKnowledgeDesignContractPack, key?: string) {
  return key
    ? (pack.design_slots.EVID?.[key] ?? pack.design_slots.EVIDENCE ?? [])
    : (pack.design_slots.EVIDENCE ?? []);
}

function metricFacts(pack: HomeKnowledgeDesignContractPack) {
  const facts = pack.design_slots.FACTS ?? [];
  const wanted = [
    "Revenue",
    "Net revenue",
    "Employees",
    "Members",
    "Hospitals",
    "Clinics",
    "IT budget",
    "FY26 IT budget",
  ];
  const mapped = wanted
    .map((label) =>
      facts.find(
        (fact) => plain(fact.label).toLowerCase() === label.toLowerCase(),
      ),
    )
    .filter((fact): fact is HomeKnowledgeRecord => Boolean(fact))
    .map((fact) => ({
      label: plain(fact.label),
      value: firstText(fact, ["value", "amount", "v"]),
      note: noMechanics(fact.sub),
    }))
    .filter((fact) => fact.value);
  if (mapped.length) return mapped.slice(0, 6);
  return (pack.design_slots.DIMS ?? [])
    .filter((dimension) =>
      ["apps", "data", "vendors", "programs", "ai"].includes(dimension.key),
    )
    .slice(0, 5)
    .map((dimension) => ({
      label: dimensionLabel(dimension.key),
      value: formatNumber(dimension.count),
      note: toneLabel(dimension.status),
    }));
}

function readinessChart(pack: HomeKnowledgeDesignContractPack) {
  const readiness = pack.enterprise_brief?.aiReadiness ?? [];
  if (readiness.length) {
    return readiness.slice(0, 6).map((item) => ({
      name: shortLabel(item.readinessDimension, 18),
      value: Math.max(0, Math.min(100, item.scorePct)),
      fill:
        item.tone === "green"
          ? COLORS.teal
          : item.tone === "red"
            ? COLORS.red
            : COLORS.amber,
    }));
  }
  return (pack.design_slots.DIMS ?? []).slice(0, 6).map((dimension) => ({
    name: shortLabel(dimensionLabel(dimension.key), 18),
    value:
      tone(dimension.status) === "ready"
        ? 78
        : tone(dimension.status) === "weak"
          ? 36
          : 58,
    fill: toneColor(dimension.status),
  }));
}

function coverageChart(pack: HomeKnowledgeDesignContractPack) {
  return (pack.design_slots.DIMS ?? []).slice(0, 10).map((dimension) => ({
    name: shortLabel(dimensionLabel(dimension.key), 18),
    value:
      tone(dimension.status) === "ready"
        ? 3
        : tone(dimension.status) === "weak"
          ? 1
          : 2,
    label: toneLabel(dimension.status),
    fill: toneColor(dimension.status),
  }));
}

function landscapeChart(pack: HomeKnowledgeDesignContractPack) {
  return (pack.design_slots.DIMS ?? [])
    .filter((dimension) =>
      ["apps", "data", "vendors", "infra", "programs", "ai", "risks"].includes(
        dimension.key,
      ),
    )
    .slice(0, 7)
    .map((dimension) => ({
      name: shortLabel(dimensionLabel(dimension.key), 18),
      value: dimension.count ?? 0,
      fill: toneColor(dimension.status),
    }));
}

function caseItems(pack: HomeKnowledgeDesignContractPack) {
  return (pack.design_slots.USE_CASES ?? []).slice(0, 7).map((row) => ({
    name: noMechanics(firstText(row, ["name", "title", "use_case"])),
    functionName: noMechanics(
      firstText(row, ["business_function", "function", "fn"]),
    ),
    signal: noMechanics(
      firstText(row, [
        "client_context_signal",
        "why_now",
        "priority_rationale",
        "operating_model_change",
      ]),
    ),
    status: noMechanics(firstText(row, ["status", "stage", "readiness"])),
  }));
}

function strategicNarratives(
  pack: HomeKnowledgeDesignContractPack,
  narrativeType: string,
) {
  return (
    pack.enterprise_brief?.strategicNarratives
      .filter((item) => item.narrativeType === narrativeType)
      .slice(0, 5) ?? []
  );
}

function sourceRows(pack: HomeKnowledgeDesignContractPack, key?: string) {
  return evidenceFor(pack, key)
    .slice(0, 10)
    .map((source) => ({
      name: noMechanics(source.name || "Evidence source"),
      type: noMechanics(source.type || "Source"),
      loaded: formatDate(source.date),
      owner: noMechanics(
        source.loaded_by || source.source_owner || "Owner not captured",
      ),
      supports: noMechanics(
        source.supports || source.facts || "Supports the context boundary",
      ),
      size: noMechanics(source.size || source.fields || "Coverage not stated"),
      gap: noMechanics(source.missing || "No source-specific caveat captured"),
    }));
}

function dimensionSample(dataSet?: HomeKnowledgeDataSet) {
  const rows = dataSet?.rows ?? [];
  const columns = dataSet?.columns ?? [];
  const usefulColumns = columns
    .filter((column) => {
      const key = column.k.toLowerCase();
      return !/(^id$|uuid|source|row|record|fact|edge|node|tenant)/i.test(key);
    })
    .slice(0, 5);
  return {
    columns: usefulColumns,
    rows: rows.slice(0, 6),
  };
}

function nodeColor(type: GraphNodeType | string) {
  if (type === "enterprise") return COLORS.black;
  if (type === "division") return COLORS.blue;
  if (type === "function") return "#5f5f59";
  if (type === "system") return COLORS.teal;
  if (type === "priority") return COLORS.amber;
  if (type === "constraint") return COLORS.red;
  return "#3f7ec8";
}

function safeNodeLabel(value: string, fallback: string) {
  const cleaned = noMechanics(value).split(":")[0].trim();
  if (!cleaned) return fallback;
  if (/^[A-Z0-9-]{6,}$/i.test(cleaned)) return fallback;
  return cleaned;
}

function edgeNodeType(
  edge: HomeRelationshipEdge,
  side: "from" | "to",
): GraphNodeType {
  const value =
    side === "from"
      ? `${edge.fromType} ${edge.sourceDimension}`
      : `${edge.to} ${edge.relationship} ${edge.sourceDimension}`;
  const normalized = value.toLowerCase();
  if (/(vendor|supplier|contract)/.test(normalized)) return "system";
  if (/(system|application|platform|tool|cloud|data)/.test(normalized))
    return "system";
  if (/(program|initiative|priority|use case|ai)/.test(normalized))
    return "priority";
  if (/(risk|gap|constraint|control|blocked|missing)/.test(normalized)) {
    return "constraint";
  }
  if (/(division|business unit|portfolio)/.test(normalized)) return "division";
  return "function";
}

function buildGraph(
  pack: HomeKnowledgeDesignContractPack,
  relationshipEdges: HomeRelationshipEdge[] = [],
): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const center: GraphNode = {
    id: "enterprise",
    label: pack.tenant_name.replace(/\s+(Demo|System|Holdings)$/i, ""),
    type: "enterprise",
    x: 410,
    y: 270,
  };
  const evidenceEdges = relationshipEdges
    .map((edge) => ({
      from: safeNodeLabel(edge.from, ""),
      to: safeNodeLabel(edge.to, ""),
      fromType: edgeNodeType(edge, "from"),
      toType: edgeNodeType(edge, "to"),
    }))
    .filter((edge) => edge.from && edge.to && edge.from !== edge.to)
    .slice(0, 36);

  if (evidenceEdges.length) {
    const nodes = [center];
    const nodeByLabel = new Map<string, GraphNode>([
      [center.label.toLowerCase(), center],
    ]);
    const getNode = (label: string, type: GraphNodeType) => {
      const key = label.toLowerCase();
      const existing = nodeByLabel.get(key);
      if (existing) return existing;
      const node: GraphNode = {
        id: `${type}-${nodes.length}`,
        label,
        type,
        x: 0,
        y: 0,
      };
      nodes.push(node);
      nodeByLabel.set(key, node);
      return node;
    };
    const edges: GraphEdge[] = [];
    evidenceEdges.forEach((edge) => {
      const from = getNode(edge.from, edge.fromType);
      const to = getNode(edge.to, edge.toType);
      edges.push({ from: from.id, to: to.id });
      if (
        !edges.some((item) => item.from === "enterprise" && item.to === from.id)
      ) {
        edges.push({ from: "enterprise", to: from.id });
      }
    });
    const positioned = nodes.map((node, index) => {
      if (index === 0) return node;
      const angle =
        ((index - 1) / Math.max(nodes.length - 1, 1)) * Math.PI * 2 -
        Math.PI / 2;
      const radius =
        index % 4 === 0
          ? 248
          : index % 4 === 1
            ? 205
            : index % 4 === 2
              ? 165
              : 125;
      return {
        ...node,
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      };
    });
    return { nodes: positioned, edges };
  }

  const buckets: Array<{ type: GraphNodeType; labels: string[] }> = [
    {
      type: "division",
      labels: (dataFor(pack, "org")?.rows ?? [])
        .map((row) =>
          firstText(row, [
            "division",
            "business_unit",
            "portfolio_company",
            "name",
            "title",
          ]),
        )
        .filter(Boolean),
    },
    {
      type: "function",
      labels: (dataFor(pack, "functions")?.rows ?? [])
        .map((row) =>
          firstText(row, ["function", "name", "business_function", "title"]),
        )
        .filter(Boolean),
    },
    {
      type: "system",
      labels: (dataFor(pack, "apps")?.rows ?? [])
        .map((row) =>
          firstText(row, [
            "application",
            "system",
            "name",
            "platform",
            "title",
          ]),
        )
        .filter(Boolean),
    },
    {
      type: "priority",
      labels: [
        ...caseItems(pack).map((item) => item.name),
        ...(pack.design_slots.PRIORITIES ?? []).map((row) =>
          firstText(row, ["priority", "name", "title"]),
        ),
      ].filter(Boolean),
    },
    {
      type: "constraint",
      labels: [
        ...(pack.design_slots.NEXT_EVIDENCE ?? []).map((row) =>
          firstText(row, ["needed", "title", "name", "missing"]),
        ),
        ...(pack.design_slots.GAPS ?? []).map((row) =>
          firstText(row, ["gap", "missing", "title", "name"]),
        ),
      ].filter(Boolean),
    },
  ];

  const nodes = [center];
  for (const bucket of buckets) {
    const unique = Array.from(
      new Set(bucket.labels.map((label) => safeNodeLabel(label, ""))),
    )
      .filter(Boolean)
      .slice(
        0,
        bucket.type === "priority" || bucket.type === "constraint" ? 5 : 4,
      );
    unique.forEach((label) => {
      const id = `${bucket.type}-${nodes.length}`;
      nodes.push({ id, label, type: bucket.type, x: 0, y: 0 });
    });
  }
  const positioned = nodes.map((node, index) => {
    if (index === 0) return node;
    const angle =
      ((index - 1) / Math.max(nodes.length - 1, 1)) * Math.PI * 2 - Math.PI / 2;
    const radius = index % 3 === 0 ? 240 : index % 3 === 1 ? 190 : 145;
    return {
      ...node,
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  });
  const edges: GraphEdge[] = positioned
    .filter((node) => node.id !== "enterprise")
    .map((node) => ({ from: "enterprise", to: node.id }));
  const systems = positioned
    .filter((node) => node.type === "system")
    .slice(0, 4);
  const priorities = positioned
    .filter((node) => node.type === "priority")
    .slice(0, 4);
  const constraints = positioned
    .filter((node) => node.type === "constraint")
    .slice(0, 4);
  systems.forEach((system, index) => {
    const priority = priorities[index % Math.max(priorities.length, 1)];
    const constraint = constraints[index % Math.max(constraints.length, 1)];
    if (priority) edges.push({ from: system.id, to: priority.id });
    if (constraint)
      edges.push({ from: priority?.id ?? system.id, to: constraint.id });
  });
  return { nodes: positioned, edges };
}

function initialView(selectedDimension?: string | null): ViewKey {
  const key = selectedDimension?.trim().toLowerCase();
  if (!key) return "snapshot";
  const match = Object.entries(VIEW_META).find(
    ([, meta]) => meta.dimKey === key,
  );
  return (match?.[0] as ViewKey | undefined) ?? "snapshot";
}

export function HomeEnterpriseBriefApp({
  pack,
  relationshipEdges = [],
  selectedDimension,
}: HomeEnterpriseBriefAppProps) {
  const [view, setView] = useState<ViewKey>(initialView(selectedDimension));
  const meta = VIEW_META[view];
  const graph = useMemo(
    () => buildGraph(pack, relationshipEdges),
    [pack, relationshipEdges],
  );
  const dimension = byDimension(pack, meta.dimKey);
  const dataSet = dataFor(pack, meta.dimKey);
  const evidence = sourceRows(pack, meta.dimKey);
  const facts = metricFacts(pack);
  const executive = pack.enterprise_brief?.executiveRead;
  const tier = pack.enterprise_brief?.packTier;

  return (
    <div className="heb-shell" data-testid="home-enterprise-brief-app">
      <aside className="heb-rail" aria-label="Context Explorer">
        <div className="heb-rail-label">
          <i />
          Context Explorer
        </div>
        {NAV_GROUPS.map((group) => (
          <nav className="heb-nav-group" key={group.title}>
            <span>{group.title}</span>
            {group.items.map((item) => {
              const active = item.key === view;
              return (
                <button
                  className={active ? "is-active" : ""}
                  key={item.key}
                  type="button"
                  onClick={() => setView(item.key)}
                >
                  <b>{item.label}</b>
                </button>
              );
            })}
          </nav>
        ))}
        <p className="heb-rail-note">
          The Enterprise Brief is the executive read. Open any item to inspect
          the context behind it.
        </p>
      </aside>

      <main className="heb-main">
        <header className="heb-page-head">
          <span>
            {meta.index} · {meta.title}
          </span>
          <h1>{meta.title}</h1>
          <p>{meta.lead}</p>
          <div className="heb-status">
            <b>{pack.tenant_name}</b>
            <i />
            <em>{tier?.tierLabel ?? "Planning-grade context"}</em>
            <i />
            <em>Updated {formatDate(pack.generated_at)}</em>
          </div>
        </header>

        {view === "snapshot" ? (
          <SnapshotView
            pack={pack}
            executive={executive}
            facts={facts}
            coverage={coverageChart(pack)}
            readiness={readinessChart(pack)}
          />
        ) : null}

        {view === "operating" ? (
          <OperatingView
            narratives={strategicNarratives(pack, "new_way_of_operating")}
            useCases={caseItems(pack)}
          />
        ) : null}

        {view === "map" ? (
          <RelationshipMapView
            graph={graph}
            nextEvidence={pack.design_slots.NEXT_EVIDENCE ?? []}
          />
        ) : null}

        {view === "coverage" ? (
          <CoverageView pack={pack} chart={coverageChart(pack)} />
        ) : null}

        {view === "evidence" ? (
          <EvidenceView sources={sourceRows(pack)} />
        ) : null}

        {!["snapshot", "operating", "map", "coverage", "evidence"].includes(
          view,
        ) ? (
          <DimensionView
            pack={pack}
            dimension={dimension}
            dataSet={dataSet}
            sources={evidence}
            view={view}
          />
        ) : null}
      </main>

      <style jsx global>{`
        .heb-shell {
          min-height: calc(100vh - 64px);
          display: grid;
          grid-template-columns: 238px minmax(0, 1fr);
          background: ${COLORS.page};
          color: ${COLORS.ink};
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }
        .heb-rail {
          background: ${COLORS.rail};
          border-right: 1px solid ${COLORS.line};
          padding: 20px 10px 32px;
          position: sticky;
          top: 0;
          align-self: start;
          height: calc(100vh - 64px);
          overflow: auto;
        }
        .heb-rail-label,
        .heb-section-label,
        .heb-page-head > span {
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 800;
          color: #758198;
        }
        .heb-rail-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 7px 14px;
        }
        .heb-rail-label i,
        .heb-status i,
        .heb-map-note i {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: ${COLORS.teal};
          flex: none;
        }
        .heb-nav-group {
          border-top: 1px solid ${COLORS.line};
          padding: 12px 0;
        }
        .heb-nav-group > span {
          display: block;
          padding: 0 7px 7px;
          color: ${COLORS.quiet};
          font-size: 9.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 800;
        }
        .heb-nav-group button {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          align-items: center;
          border: 0;
          border-left: 3px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: ${COLORS.ink};
          padding: 6px 9px 6px 8px;
          margin: 1px 0;
          cursor: pointer;
          text-align: left;
          font: inherit;
        }
        .heb-nav-group button.is-active {
          background: rgba(255, 255, 255, 0.72);
          border-left-color: ${COLORS.blue};
          box-shadow: inset 0 0 0 1px rgba(18, 104, 199, 0.08);
          color: ${COLORS.ink};
        }
        .heb-nav-group b {
          font-size: 13px;
          font-weight: 600;
          line-height: 1.2;
        }
        .heb-nav-group em {
          color: ${COLORS.muted};
          font-style: normal;
          font-size: 11px;
        }
        .heb-nav-group button.is-active em {
          color: ${COLORS.blue};
        }
        .heb-rail-note {
          border-top: 1px solid ${COLORS.line};
          margin: 14px 7px 0;
          padding-top: 16px;
          color: ${COLORS.muted};
          font-size: 11.5px;
          line-height: 1.45;
        }
        .heb-main {
          width: min(100%, 980px);
          padding: 30px 48px 72px;
        }
        .heb-page-head {
          border-bottom: 1px solid ${COLORS.line};
          margin-bottom: 24px;
          padding-bottom: 22px;
        }
        .heb-page-head > span {
          display: block;
          margin-bottom: 14px;
        }
        .heb-page-head h1,
        .heb-hero h2,
        .heb-title {
          font-family: Fraunces, Georgia, serif;
          color: ${COLORS.ink};
          letter-spacing: 0;
        }
        .heb-page-head h1 {
          font-size: clamp(28px, 3vw, 36px);
          line-height: 1.08;
          margin: 0 0 10px;
        }
        .heb-page-head p {
          margin: 0 0 14px;
          max-width: 74ch;
          color: ${COLORS.muted};
          font-size: 15px;
          line-height: 1.55;
        }
        .heb-status {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
          color: ${COLORS.muted};
          font-size: 13px;
        }
        .heb-status i {
          width: 5px;
          height: 5px;
        }
        .heb-status b {
          color: ${COLORS.ink};
        }
        .heb-section {
          margin: 22px 0;
        }
        .heb-hero,
        .heb-card,
        .heb-table-card,
        .heb-map-card {
          background: ${COLORS.surface};
          border: 1px solid ${COLORS.line};
          border-radius: 10px;
        }
        .heb-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) 260px;
          gap: 24px;
          padding: 24px;
        }
        .heb-hero h2 {
          font-size: clamp(24px, 2.4vw, 32px);
          line-height: 1.12;
          margin: 10px 0 12px;
        }
        .heb-copy {
          color: ${COLORS.ink};
          font-size: 15px;
          line-height: 1.55;
        }
        .heb-muted {
          color: ${COLORS.muted};
        }
        .heb-pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 18px;
        }
        .heb-pill {
          border: 1px solid rgba(44, 164, 119, 0.24);
          background: rgba(44, 164, 119, 0.09);
          color: ${COLORS.tealDark};
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 10px;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          font-weight: 800;
        }
        .heb-confidence {
          display: grid;
          place-items: center;
          gap: 12px;
        }
        .heb-donut {
          --pct: 55;
          width: 154px;
          height: 154px;
          border-radius: 999px;
          background: conic-gradient(
            ${COLORS.teal} calc(var(--pct) * 1%),
            #e3e2dd 0
          );
          display: grid;
          place-items: center;
        }
        .heb-donut > div {
          width: 112px;
          height: 112px;
          display: grid;
          place-items: center;
          text-align: center;
          border-radius: 999px;
          background: ${COLORS.surface};
        }
        .heb-donut strong {
          font-family: Fraunces, Georgia, serif;
          font-size: 32px;
          line-height: 1;
        }
        .heb-donut span {
          color: ${COLORS.quiet};
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 800;
        }
        .heb-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .heb-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        .heb-card {
          padding: 18px;
          min-width: 0;
        }
        .heb-card h3 {
          margin: 7px 0 8px;
          font-size: 16px;
          line-height: 1.25;
        }
        .heb-card p,
        .heb-card li {
          margin: 0;
          color: ${COLORS.muted};
          font-size: 13px;
          line-height: 1.45;
        }
        .heb-card ul {
          list-style: none;
          display: grid;
          gap: 8px;
          margin: 8px 0 0;
          padding: 0;
        }
        .heb-card li {
          position: relative;
          padding-left: 14px;
        }
        .heb-card li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0.65em;
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: ${COLORS.teal};
        }
        .heb-facts {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border: 1px solid ${COLORS.line};
          border-radius: 10px;
          overflow: hidden;
          background: ${COLORS.surface};
        }
        .heb-fact {
          min-height: 78px;
          padding: 15px 16px;
          border-right: 1px solid ${COLORS.line};
          border-bottom: 1px solid ${COLORS.line};
        }
        .heb-fact:nth-child(3n) {
          border-right: 0;
        }
        .heb-fact span {
          display: block;
          color: ${COLORS.quiet};
          font-size: 11px;
          font-weight: 700;
        }
        .heb-fact strong {
          display: block;
          font-family: Fraunces, Georgia, serif;
          font-size: 22px;
          line-height: 1;
          margin: 5px 0;
        }
        .heb-chart {
          height: 280px;
          min-width: 0;
        }
        .heb-map-card {
          padding: 12px;
        }
        .heb-map-note {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border: 1px solid ${COLORS.line};
          border-radius: 10px;
          padding: 13px 15px;
          margin-bottom: 10px;
          background: ${COLORS.surface};
          color: ${COLORS.muted};
          font-size: 14px;
          line-height: 1.45;
        }
        .heb-map-note i {
          margin-top: 5px;
        }
        .heb-legend {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin: 4px 0 14px;
          color: ${COLORS.muted};
          font-size: 13px;
        }
        .heb-legend span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }
        .heb-legend i {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          display: inline-block;
        }
        .heb-graph {
          width: 100%;
          min-height: 540px;
          display: block;
        }
        .heb-node-label {
          font-size: 11px;
          fill: ${COLORS.ink};
        }
        .heb-table {
          width: 100%;
          border-collapse: collapse;
          background: ${COLORS.surface};
          border: 1px solid ${COLORS.line};
          border-radius: 10px;
          overflow: hidden;
          display: table;
        }
        .heb-table th,
        .heb-table td {
          padding: 12px 13px;
          border-bottom: 1px solid ${COLORS.line};
          text-align: left;
          vertical-align: top;
          font-size: 13px;
          line-height: 1.42;
        }
        .heb-table th {
          color: #5b6980;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          background: #f7f5f0;
        }
        .heb-table td {
          color: ${COLORS.ink};
        }
        .heb-table tr:last-child td {
          border-bottom: 0;
        }
        .heb-small {
          color: ${COLORS.muted};
          font-size: 12px;
          line-height: 1.45;
        }
        .heb-empty {
          border: 1px dashed ${COLORS.lineStrong};
          border-radius: 10px;
          padding: 18px;
          color: ${COLORS.muted};
          background: rgba(255, 253, 248, 0.62);
        }
        @media (max-width: 980px) {
          .heb-shell {
            grid-template-columns: 1fr;
          }
          .heb-rail {
            position: relative;
            height: auto;
          }
          .heb-main {
            padding: 24px 18px 48px;
          }
          .heb-hero,
          .heb-grid-2,
          .heb-grid-3,
          .heb-facts {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function SnapshotView({
  pack,
  executive,
  facts,
  coverage,
  readiness,
}: {
  pack: HomeKnowledgeDesignContractPack;
  executive?: NonNullable<
    HomeKnowledgeDesignContractPack["enterprise_brief"]
  >["executiveRead"];
  facts: Array<{ label: string; value: string; note?: string }>;
  coverage: Array<{ name: string; value: number; label: string; fill: string }>;
  readiness: Array<{ name: string; value: number; fill: string }>;
}) {
  const confidence = Math.max(
    0,
    Math.min(100, Number(executive?.contextConfidencePct ?? 58)),
  );
  return (
    <>
      <section className="heb-hero">
        <div>
          <span className="heb-section-label">
            The enterprise in one sentence
          </span>
          <h2>
            {noMechanics(
              executive?.tensionHeadline ??
                pack.narrative_sections?.enterprise_brief_title ??
                "Leadership needs one governed enterprise view before AI and transformation decisions scale.",
            )}
          </h2>
          <p className="heb-copy">
            {noMechanics(
              executive?.oneSentence ??
                pack.narrative_sections?.enterprise_brief_summary ??
                pack.narrative_sections?.enterprise_hero_summary,
            )}
          </p>
          <div className="heb-pill-row">
            {(executive?.industryForces ?? []).slice(0, 4).map((force) => (
              <span className="heb-pill" key={force}>
                {noMechanics(force)}
              </span>
            ))}
          </div>
        </div>
        <div className="heb-confidence">
          <div
            className="heb-donut"
            style={{ "--pct": confidence } as CSSProperties}
          >
            <div>
              <strong>{confidence}%</strong>
              <span>Context quality</span>
            </div>
          </div>
          <p className="heb-small">
            {noMechanics(executive?.contextConfidenceNote) ||
              "Use this as a planning-grade read until accountable owners confirm the evidence."}
          </p>
        </div>
      </section>

      {facts.length ? (
        <section
          className="heb-section heb-facts"
          aria-label="Enterprise metrics"
        >
          {facts.map((fact) => (
            <article className="heb-fact" key={`${fact.label}-${fact.value}`}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
              <small>{fact.note}</small>
            </article>
          ))}
        </section>
      ) : null}

      <section className="heb-section heb-grid-2">
        <article className="heb-card">
          <span className="heb-section-label">What is strong</span>
          <ul>
            {(executive?.strengths ?? []).slice(0, 5).map((item) => (
              <li key={plain(item.text)}>{noMechanics(item.text)}</li>
            ))}
          </ul>
        </article>
        <article className="heb-card">
          <span className="heb-section-label">What gates AI success</span>
          <ul>
            {(executive?.constraints ?? []).slice(0, 5).map((item) => (
              <li key={plain(item.text)}>{noMechanics(item.text)}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="heb-section heb-grid-2">
        <article className="heb-card">
          <span className="heb-section-label">Knowledge coverage</span>
          <div className="heb-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={coverage}
                layout="vertical"
                margin={{ left: 8, right: 26 }}
              >
                <CartesianGrid horizontal={false} stroke="#e8dfd3" />
                <XAxis type="number" domain={[0, 3]} hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={128}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {coverage.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="label" position="right" fontSize={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="heb-card">
          <span className="heb-section-label">AI readiness</span>
          <div className="heb-chart">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={readiness}>
                <PolarGrid stroke="#ded8cd" />
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

function OperatingView({
  narratives,
  useCases: rows,
}: {
  narratives: NonNullable<
    HomeKnowledgeDesignContractPack["enterprise_brief"]
  >["strategicNarratives"];
  useCases: ReturnType<typeof caseItems>;
}) {
  return (
    <>
      <section className="heb-section heb-grid-2">
        {narratives.slice(0, 4).map((item) => (
          <article className="heb-card" key={item.title}>
            <span className="heb-section-label">
              {noMechanics(item.classification) || "Strategic inference"}
            </span>
            <h3>{noMechanics(item.title)}</h3>
            <p>{noMechanics(item.executiveNarrative)}</p>
          </article>
        ))}
      </section>
      <section className="heb-section">
        <span className="heb-section-label">Priority use cases</span>
        <div className="heb-grid-3">
          {rows.slice(0, 6).map((item) => (
            <article className="heb-card" key={item.name}>
              <span className="heb-section-label">
                {item.functionName || item.status}
              </span>
              <h3>{item.name}</h3>
              <p>{item.signal}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function RelationshipMapView({
  graph,
  nextEvidence,
}: {
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  nextEvidence: HomeKnowledgeRecord[];
}) {
  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));
  return (
    <>
      <div className="heb-legend" aria-label="Relationship map legend">
        {[
          ["Enterprise", "enterprise"],
          ["Divisions", "division"],
          ["Functions", "function"],
          ["Systems", "system"],
          ["Priorities", "priority"],
          ["Constraints", "constraint"],
        ].map(([label, type]) => (
          <span key={label}>
            <i style={{ background: nodeColor(type) }} />
            {label}
          </span>
        ))}
      </div>
      <div className="heb-map-note">
        <i />
        <span>
          Click any node to trace the decision path across functions, systems,
          priorities and constraints. The graph is meant to reveal what else the
          client should add to make AI execution less speculative.
        </span>
      </div>
      <section className="heb-map-card">
        <svg
          className="heb-graph"
          viewBox="0 0 820 540"
          role="img"
          aria-label="Enterprise relationship map"
        >
          {graph.edges.map((edge, index) => {
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
                stroke="#cbc4b9"
                strokeWidth="1"
              />
            );
          })}
          {graph.nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={node.type === "enterprise" ? 29 : 10}
                fill={nodeColor(node.type)}
              />
              <text
                className="heb-node-label"
                x={node.x + (node.type === "enterprise" ? 36 : 14)}
                y={node.y + 4}
              >
                {shortLabel(node.label, node.type === "enterprise" ? 18 : 30)}
              </text>
            </g>
          ))}
        </svg>
      </section>
      <section className="heb-section heb-grid-3">
        {[
          [
            "Owner paths",
            "Add explicit accountable owners for each critical path.",
          ],
          [
            "System lineage",
            "Connect use cases to systems, data products, controls and handoffs.",
          ],
          [
            "Value linkage",
            "Tie initiatives to measurable outcomes before claiming enterprise impact.",
          ],
        ].map(([title, body]) => (
          <article className="heb-card" key={title}>
            <span className="heb-section-label">Art of the possible</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </section>
      {nextEvidence.length ? (
        <section className="heb-section">
          <span className="heb-section-label">
            What would make this sharper
          </span>
          <div className="heb-grid-2">
            {nextEvidence.slice(0, 4).map((item) => (
              <article
                className="heb-card"
                key={plain(item.title || item.needed || item.name)}
              >
                <h3>
                  {noMechanics(firstText(item, ["title", "needed", "name"]))}
                </h3>
                <p>
                  {noMechanics(
                    firstText(item, ["why", "reason", "impact", "description"]),
                  )}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function DimensionView({
  pack,
  dimension,
  dataSet,
  sources,
  view,
}: {
  pack: HomeKnowledgeDesignContractPack;
  dimension?: HomeKnowledgeDimension;
  dataSet?: HomeKnowledgeDataSet;
  sources: ReturnType<typeof sourceRows>;
  view: ViewKey;
}) {
  const sample = dimensionSample(dataSet);
  const chart = landscapeChart(pack);
  const story = dimension?.key
    ? pack.design_slots.STORY?.[dimension.key]
    : undefined;
  const gaps = dimension?.key
    ? (pack.design_slots.DGAPS?.[dimension.key] ?? [])
    : [];
  return (
    <>
      <section className="heb-section heb-grid-2">
        <article className="heb-card">
          <span className="heb-section-label">Executive interpretation</span>
          <h3>{dimension?.name ?? VIEW_META[view].title}</h3>
          <p>
            {noMechanics(
              story?.meaning || story?.observed || dimension?.summary,
            ) ||
              "This dimension is available for exploration, but the generated brief has not yet authored a strong executive interpretation."}
          </p>
        </article>
        <article className="heb-card">
          <span className="heb-section-label">Why it matters</span>
          <p>
            {noMechanics(story?.matters || story?.supports) ||
              "This is where Home should connect context to Intelligence, Moves, Source and Tower decisions."}
          </p>
        </article>
      </section>
      <section className="heb-section heb-card">
        <span className="heb-section-label">Dimension visual</span>
        <div className="heb-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ left: 8, right: 20 }}>
              <CartesianGrid vertical={false} stroke="#e8dfd3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chart.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      {sample.rows.length && sample.columns.length ? (
        <section className="heb-section">
          <span className="heb-section-label">Business sample</span>
          <table className="heb-table">
            <thead>
              <tr>
                {sample.columns.map((column) => (
                  <th key={column.k}>{column.label || humanize(column.k)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sample.rows.map((row, index) => (
                <tr key={index}>
                  {sample.columns.map((column) => (
                    <td key={column.k}>{noMechanics(row[column.k])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="heb-section heb-empty">
          More client-provided detail is needed before this dimension can show a
          useful business sample.
        </section>
      )}
      <section className="heb-section heb-grid-2">
        <article className="heb-card">
          <span className="heb-section-label">Evidence gaps</span>
          {gaps.length ? (
            <ul>
              {gaps.slice(0, 5).map((gap) => (
                <li key={plain(gap.missing || gap.blocks || gap.needed)}>
                  {noMechanics(gap.missing || gap.blocks || gap.needed)}
                </li>
              ))}
            </ul>
          ) : (
            <p>No dimension-specific gap has been authored yet.</p>
          )}
        </article>
        <article className="heb-card">
          <span className="heb-section-label">Source proof</span>
          {sources.slice(0, 3).map((source) => (
            <p key={source.name}>
              <strong>{source.name}</strong>: {source.supports}
            </p>
          ))}
        </article>
      </section>
    </>
  );
}

function CoverageView({
  pack,
  chart,
}: {
  pack: HomeKnowledgeDesignContractPack;
  chart: ReturnType<typeof coverageChart>;
}) {
  return (
    <>
      <section className="heb-section heb-card">
        <span className="heb-section-label">Decision coverage</span>
        <div className="heb-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chart}
              layout="vertical"
              margin={{ left: 12, right: 34 }}
            >
              <CartesianGrid horizontal={false} stroke="#e8dfd3" />
              <XAxis type="number" domain={[0, 3]} hide />
              <YAxis
                dataKey="name"
                type="category"
                width={136}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {chart.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
                <LabelList dataKey="label" position="right" fontSize={10} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="heb-section heb-grid-2">
        <article className="heb-card">
          <span className="heb-section-label">Loaded boundary</span>
          <ul>
            {(pack.enterprise_brief?.executiveRead?.strengths ?? [])
              .slice(0, 5)
              .map((item) => (
                <li key={plain(item.text)}>{noMechanics(item.text)}</li>
              ))}
          </ul>
        </article>
        <article className="heb-card">
          <span className="heb-section-label">Client confirmation needed</span>
          <ul>
            {(pack.enterprise_brief?.packTier?.tierConditions ?? [])
              .slice(0, 5)
              .map((item) => (
                <li key={plain(item.text)}>{noMechanics(item.text)}</li>
              ))}
          </ul>
        </article>
      </section>
    </>
  );
}

function EvidenceView({ sources }: { sources: ReturnType<typeof sourceRows> }) {
  return (
    <section className="heb-section">
      <table className="heb-table">
        <thead>
          <tr>
            <th>Source material</th>
            <th>Type</th>
            <th>Loaded</th>
            <th>Owner</th>
            <th>Supports</th>
            <th>Gap</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => (
            <tr key={`${source.name}-${source.loaded}`}>
              <td>{source.name}</td>
              <td>{source.type}</td>
              <td>{source.loaded}</td>
              <td>{source.owner}</td>
              <td>{source.supports}</td>
              <td>{source.gap}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

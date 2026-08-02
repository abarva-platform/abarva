"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  HomeEnterpriseBriefReadModel,
  HomeKnowledgeDataSet,
  HomeKnowledgeDesignContractPack,
  HomeKnowledgeDimension,
  HomeKnowledgeRecord,
  HomeKnowledgeStory,
} from "@/lib/home/home-knowledge-design-contract";
import type { HomeRelationshipEdge } from "@/lib/home/derive-relationship-edges";

type ViewKey =
  // Special views — dedicated hand-built components, not the generic DimensionView.
  | "snapshot"
  | "operating"
  | "map"
  | "coverage"
  // Executive Brief
  | "enterprise_thesis"
  | "leadership_agenda"
  | "proven_strengths"
  | "structural_constraints"
  | "interview_signals"
  // Enterprise Structure
  | "profile"
  | "divisions"
  | "front_middle_back"
  | "functions"
  | "capabilities"
  | "org"
  | "decision_rights"
  | "workforce"
  | "geography"
  // Work & Value
  | "value_streams"
  | "business_processes"
  | "journeys"
  | "opev"
  | "service_delivery"
  | "spend"
  | "programs"
  // Technology & Data
  | "apps"
  | "data"
  | "integrations"
  | "infra"
  | "architecture_dependencies"
  | "tech_lifecycle"
  | "data_quality_lineage"
  | "identity_semantic"
  // Vendors & Economics
  | "vendors"
  | "ms"
  // Change & Transformation
  | "priorities"
  | "metrics"
  | "industry"
  | "lenses"
  // Risk & Trust
  | "risks"
  | "evidence";

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

type EnterpriseExecutiveRead = NonNullable<
  HomeEnterpriseBriefReadModel["executiveRead"]
>;

export const COLORS = {
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

// Mirrors scripts/knowledge/build-home-knowledge-v4-review-pack.mjs's
// expandedDimensionCatalog (38 real dimension-family keys) — kept in sync by
// hand, same reasoning as the retired Home V4 visual contract. Every
// catalog concept gets its own ViewKey/dimKey here, even though most have no
// generated content yet on the V2 pipeline this page reads (DimensionView's
// existing fallback — "available for exploration, but ... not yet authored"
// — handles that honestly; nothing here is fabricated to fill a gap.
const VIEW_META: Record<ViewKey, { title: string; dimKey?: string }> = {
  snapshot: { title: "Enterprise snapshot" },
  operating: { title: "Operating model" },
  map: { title: "Enterprise relationship map" },
  coverage: { title: "Coverage" },

  enterprise_thesis: {
    title: "Enterprise Thesis",
    dimKey: "enterprise_thesis",
  },
  leadership_agenda: {
    title: "Leadership Agenda",
    dimKey: "leadership_agenda",
  },
  proven_strengths: { title: "Proven Strengths", dimKey: "proven_strengths" },
  structural_constraints: {
    title: "Structural Constraints",
    dimKey: "structural_constraints",
  },
  interview_signals: {
    title: "Interview Signals",
    dimKey: "interview_signals",
  },

  profile: { title: "Enterprise Profile", dimKey: "profile" },
  divisions: { title: "Divisions & Business Units", dimKey: "divisions" },
  front_middle_back: {
    title: "Front / Middle / Back Office",
    dimKey: "front_middle_back",
  },
  functions: { title: "Business Functions", dimKey: "functions" },
  capabilities: { title: "Business Capabilities", dimKey: "capabilities" },
  org: { title: "Organization Ownership", dimKey: "org" },
  decision_rights: { title: "Decision Rights", dimKey: "decision_rights" },
  workforce: { title: "Workforce & Roles", dimKey: "workforce" },
  geography: { title: "Geography & Legal Entities", dimKey: "geography" },

  value_streams: { title: "Value Streams", dimKey: "value_streams" },
  business_processes: {
    title: "Business Processes",
    dimKey: "business_processes",
  },
  journeys: { title: "Member / Customer Journeys", dimKey: "journeys" },
  opev: { title: "Operational Evidence", dimKey: "opev" },
  service_delivery: {
    title: "Service Delivery Model",
    dimKey: "service_delivery",
  },
  spend: { title: "IT Budget, Spend & Value", dimKey: "budget" },
  programs: { title: "Programs & Initiatives", dimKey: "programs" },

  apps: { title: "Applications & Systems", dimKey: "apps" },
  data: { title: "Data Domains", dimKey: "data" },
  integrations: { title: "Integrations", dimKey: "integrations" },
  infra: { title: "Infrastructure & Platforms", dimKey: "infra" },
  architecture_dependencies: {
    title: "Architecture Dependencies",
    dimKey: "architecture_dependencies",
  },
  tech_lifecycle: { title: "Technology Lifecycle", dimKey: "tech_lifecycle" },
  data_quality_lineage: {
    title: "Data Quality & Lineage",
    dimKey: "data_quality_lineage",
  },
  identity_semantic: {
    title: "Identity & Semantic Foundations",
    dimKey: "identity_semantic",
  },

  vendors: { title: "Vendors & Contracts", dimKey: "vendors" },
  ms: { title: "Managed Services", dimKey: "ms" },

  priorities: { title: "AI & Automation Use Cases", dimKey: "ai" },
  metrics: { title: "Metrics & Outcomes", dimKey: "metrics" },
  industry: { title: "Industry Patterns", dimKey: "industry" },
  lenses: { title: "Context Confidence", dimKey: "lenses" },

  risks: { title: "Risks & Controls", dimKey: "risks" },
  evidence: { title: "Evidence Sources", dimKey: "evidence" },
};

const SECTION_TABS: Array<{
  key: ViewKey;
  label: string;
  badge: string;
}> = [
  { key: "snapshot", label: "Executive Read", badge: "01" },
  { key: "operating", label: "Enterprise Model", badge: "02" },
  { key: "coverage", label: "Operating Model", badge: "03" },
  { key: "map", label: "Relationship Graph", badge: "GRAPH" },
  { key: "apps", label: "Technology & Ecosystem", badge: "04" },
  { key: "priorities", label: "Change Thesis", badge: "05" },
  { key: "evidence", label: "Strategic Agenda", badge: "06" },
];

type ExplorerIcon =
  | "brief"
  | "compass"
  | "structure"
  | "value"
  | "technology"
  | "vendors"
  | "change"
  | "risk";

const NAV_GROUPS: Array<{
  title: string;
  icon: ExplorerIcon;
  eyebrow?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  items: Array<{
    key: ViewKey;
    label: string;
    measure?: string;
    tone?: "green" | "amber" | "red" | "blue" | "muted";
  }>;
}> = [
  // Restored to the full 38-dimension catalog 2026-07-24 (see
  // scripts/knowledge/build-home-knowledge-v4-review-pack.mjs's
  // expandedDimensionCatalog, the single source of truth for these keys) —
  // superseding the 2026-07-24 dedup that collapsed distinct enterprise
  // concepts down to 14 items for lack of a dedicated renderer. Every item
  // here is a real, individually-addressable concept (own ViewKey, own
  // dimKey) rendered through the shared DimensionView; concepts without
  // generated content yet show DimensionView's existing honest fallback
  // ("available for exploration, but ... not yet authored"), not fabricated
  // content. Progressive disclosure (collapsed by default except the first
  // two groups) keeps the surface calm without deleting real concepts.
  {
    title: "Enterprise Brief",
    icon: "brief",
    defaultOpen: true,
    items: [{ key: "snapshot", label: "Enterprise Brief", tone: "green" }],
  },
  {
    title: "Executive Brief",
    icon: "compass",
    eyebrow: "Explore Knowledge",
    collapsible: true,
    defaultOpen: true,
    items: [
      { key: "enterprise_thesis", label: "Enterprise Thesis", tone: "green" },
      { key: "leadership_agenda", label: "Leadership Agenda", tone: "green" },
      { key: "proven_strengths", label: "Proven Strengths", tone: "green" },
      {
        key: "structural_constraints",
        label: "Structural Constraints",
        tone: "red",
      },
      { key: "interview_signals", label: "Interview Signals", tone: "amber" },
      { key: "coverage", label: "Coverage", tone: "amber" },
    ],
  },
  {
    title: "Enterprise Structure",
    icon: "structure",
    collapsible: true,
    items: [
      { key: "operating", label: "Operating Model", tone: "green" },
      { key: "profile", label: "Enterprise Profile", tone: "green" },
      { key: "divisions", label: "Divisions & Business Units", tone: "green" },
      {
        key: "front_middle_back",
        label: "Front / Middle / Back Office",
        tone: "amber",
      },
      { key: "functions", label: "Business Functions", tone: "green" },
      { key: "capabilities", label: "Business Capabilities", tone: "muted" },
      { key: "org", label: "Organization Ownership", tone: "amber" },
      { key: "decision_rights", label: "Decision Rights", tone: "muted" },
      { key: "workforce", label: "Workforce & Roles", tone: "amber" },
      { key: "geography", label: "Geography & Legal Entities", tone: "amber" },
    ],
  },
  {
    title: "Work & Value",
    icon: "value",
    collapsible: true,
    items: [
      { key: "value_streams", label: "Value Streams", tone: "amber" },
      { key: "business_processes", label: "Business Processes", tone: "muted" },
      { key: "journeys", label: "Member / Customer Journeys", tone: "muted" },
      { key: "opev", label: "Operational Evidence", tone: "muted" },
      {
        key: "service_delivery",
        label: "Service Delivery Model",
        tone: "muted",
      },
      {
        key: "spend",
        label: "IT Budget, Spend & Value",
        measure: "budget",
        tone: "amber",
      },
      {
        key: "programs",
        label: "Programs & Initiatives",
        measure: "programs",
        tone: "amber",
      },
    ],
  },
  {
    title: "Technology & Data",
    icon: "technology",
    collapsible: true,
    items: [
      {
        key: "apps",
        label: "Applications & Systems",
        measure: "apps",
        tone: "green",
      },
      { key: "data", label: "Data Domains", measure: "data", tone: "amber" },
      { key: "integrations", label: "Integrations", tone: "amber" },
      { key: "infra", label: "Infrastructure & Platforms", tone: "muted" },
      {
        key: "architecture_dependencies",
        label: "Architecture Dependencies",
        tone: "muted",
      },
      { key: "tech_lifecycle", label: "Technology Lifecycle", tone: "amber" },
      {
        key: "data_quality_lineage",
        label: "Data Quality & Lineage",
        tone: "amber",
      },
      {
        key: "identity_semantic",
        label: "Identity & Semantic Foundations",
        tone: "muted",
      },
      { key: "map", label: "Relationship Map", tone: "muted" },
    ],
  },
  {
    title: "Vendors & Economics",
    icon: "vendors",
    collapsible: true,
    items: [
      {
        key: "vendors",
        label: "Vendors & Contracts",
        measure: "vendors",
        tone: "green",
      },
      { key: "ms", label: "Managed Services", tone: "muted" },
    ],
  },
  {
    title: "Change & Transformation",
    icon: "change",
    collapsible: true,
    items: [
      {
        key: "priorities",
        label: "AI & Automation Use Cases",
        measure: "ai",
        tone: "green",
      },
      { key: "metrics", label: "Metrics & Outcomes", tone: "muted" },
      { key: "industry", label: "Industry Patterns", tone: "muted" },
      { key: "lenses", label: "Context Confidence", tone: "muted" },
    ],
  },
  {
    title: "Risk & Trust",
    icon: "risk",
    collapsible: true,
    items: [
      {
        key: "risks",
        label: "Risks & Controls",
        measure: "risks",
        tone: "red",
      },
      {
        key: "evidence",
        label: "Evidence Sources",
        measure: "evidence",
        tone: "green",
      },
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

// A dimension may only ever show evidence explicitly linked to IT --
// EVID[key] is that per-dimension bucket. It must never fall back to the
// pack-wide EVIDENCE list when a dimension has no bucket of its own: that
// list backs the separate, whole-tenant "Evidence Sources" tab (the no-key
// call below), and silently substituting it here presented real citations
// (e.g. "AWS Analytics Foundation") as if they specifically supported
// dimensions they have no connection to (e.g. "Enterprise Thesis").
function evidenceFor(pack: HomeKnowledgeDesignContractPack, key?: string) {
  if (!key) return pack.design_slots.EVIDENCE ?? [];
  return pack.design_slots.EVID?.[key] ?? [];
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
    "Applications",
    "Vendors",
    "Integrations",
    "Data domains",
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
  const dimensionFacts = [
    ["Applications", "apps"],
    ["Vendors", "vendors"],
    ["Integrations", "rel"],
    ["Data domains", "data"],
  ]
    .map(([label, key]) => {
      const existing = mapped.find(
        (fact) => fact.label.toLowerCase() === label.toLowerCase(),
      );
      if (existing) return null;
      const dimension = byDimension(pack, key);
      if (!dimension?.count) return null;
      return {
        label,
        value: formatNumber(dimension.count),
        note: dimensionLabel(key),
      };
    })
    .filter((fact): fact is { label: string; value: string; note: string } =>
      Boolean(fact),
    );
  if (mapped.length || dimensionFacts.length) {
    return [...mapped, ...dimensionFacts].slice(0, 10);
  }
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

function tenantDescriptor(pack: HomeKnowledgeDesignContractPack) {
  const facts = pack.design_slots.FACTS ?? [];
  const profile = dataFor(pack, "profile")?.rows?.[0];
  const fromFacts = firstText(
    facts.find((fact) => /industry|sector|archetype/i.test(plain(fact.label))),
    ["value", "amount", "v"],
  );
  return (
    noMechanics(
      firstText(profile, [
        "industry",
        "sector",
        "business_model",
        "company_type",
        "description",
      ]) || fromFacts,
    ) || "Enterprise context"
  );
}

function tenantLocation(pack: HomeKnowledgeDesignContractPack) {
  const profile = dataFor(pack, "profile")?.rows?.[0];
  return (
    noMechanics(
      firstText(profile, [
        "headquarters",
        "hq_location",
        "location",
        "city",
        "region",
      ]),
    ) || "Planning context"
  );
}

function factValue(
  facts: Array<{ label: string; value: string; note?: string }>,
  pattern: RegExp,
) {
  return facts.find((fact) => pattern.test(fact.label))?.value ?? "";
}

function snapshotMetricGrid(
  pack: HomeKnowledgeDesignContractPack,
  facts: Array<{ label: string; value: string; note?: string }>,
) {
  const candidates = [
    { label: "Revenue", value: factValue(facts, /revenue/i) },
    { label: "Employees", value: factValue(facts, /employees/i) },
    { label: "Members", value: factValue(facts, /members/i) },
    { label: "Hospitals", value: factValue(facts, /hospitals/i) },
    { label: "Clinics", value: factValue(facts, /clinics/i) },
    {
      label: "IT budget",
      value: factValue(facts, /(it budget|technology budget)/i),
    },
    {
      label: "Applications",
      value:
        factValue(facts, /applications/i) ||
        formatNumber(byDimension(pack, "apps")?.count),
    },
    {
      label: "Vendors",
      value:
        factValue(facts, /vendors/i) ||
        formatNumber(byDimension(pack, "vendors")?.count),
    },
    {
      label: "Integrations",
      value:
        factValue(facts, /integrations/i) ||
        formatNumber(byDimension(pack, "rel")?.count),
    },
    {
      label: "Data domains",
      value:
        factValue(facts, /data domains/i) ||
        formatNumber(byDimension(pack, "data")?.count),
    },
  ].filter((fact) => fact.value);
  return candidates.slice(0, 10);
}

function splitReality(executive?: EnterpriseExecutiveRead) {
  const industry = executive?.industryForces;
  const reality = executive?.tenantReality;
  return {
    industry: (industry?.length ? industry : []).slice(0, 5),
    reality: (reality?.length ? reality : []).slice(0, 5),
  };
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

function authoredVisualType(story?: HomeKnowledgeStory) {
  const type = story?.visual_specification?.visual_type?.trim();
  return type || "executive_scorecard";
}

function dimensionVisualChart(
  dimension?: HomeKnowledgeDimension,
  dataSet?: HomeKnowledgeDataSet,
) {
  const rows = dataSet?.rows ?? [];
  const categoryKey =
    dataSet?.columns?.find((column) =>
      /(function|category|domain|owner|status|criticality|stage|type)/i.test(
        column.k,
      ),
    )?.k ?? "status";
  const buckets = new Map<
    string,
    { label: string; value: number; tone: string }
  >();
  for (const row of rows.slice(0, 80)) {
    const raw =
      firstText(row, [
        categoryKey,
        "business_function",
        "system_category",
        "criticality",
        "stage",
        "status",
      ]) || toneLabel(String(dimension?.status ?? ""));
    const label = shortLabel(noMechanics(raw) || "Context", 24);
    const existing = buckets.get(label) ?? {
      label,
      value: 0,
      tone:
        firstText(row, ["status", "confidence", "criticality"]) ||
        dimension?.status ||
        "",
    };
    existing.value += 1;
    buckets.set(label, existing);
  }
  const ranked = Array.from(buckets.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const max = Math.max(1, ...ranked.map((item) => item.value));
  const values = ranked.map((item) => ({
    name: item.label,
    value: Math.max(12, Math.round((item.value / max) * 100)),
    label: item.value === max ? "strongest signal" : "",
    fill: toneColor(item.tone),
  }));
  // No real data rows for this dimension -- return empty rather than the
  // old single-bar "Directional" stub, which rendered identically across
  // every under-generated dimension and looked like a real coverage signal.
  // The caller shows an honest empty state instead of a chart.
  return values;
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
    industryPattern: noMechanics(firstText(row, ["industry_pattern"])),
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
      // No generic reassurance when the source itself doesn't state what it
      // supports -- an unstated relationship must render as unstated, not
      // as a vague claim of support the source never actually made.
      supports:
        source.supports || source.facts
          ? noMechanics(source.supports || source.facts)
          : null,
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

// Minimal monochrome line icons, one per explorer group — a second,
// independent scan axis alongside the existing tone-dot color (icon =
// concept category, color = data-maturity). Inline SVG, no icon-library
// dependency; single-color strokes so they sit quietly under the locked
// Georgia/DM Sans system rather than compete with it.
const EXPLORER_ICON_PATHS: Record<ExplorerIcon, string> = {
  brief:
    "M4 2.5h6l2 2v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5ZM9 2.5v2.5h2.5 M5.5 7.5h5 M5.5 9.5h5 M5.5 11.5h3",
  compass:
    "M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z M10 6l-1.4 3.3L5.3 10.7 6.7 7.4 10 6Z",
  structure:
    "M8 1.5v3M4.5 8h7M2.5 4.5h11v3h-11z M3 11h3v3H3z M6.5 11h3v3h-3z M10 11h3v3h-3z",
  value:
    "M8 1.5v13 M4.5 4.5c0-1 1-1.5 3.5-1.5s3.5.7 3.5 1.7-1.3 1.5-3.5 1.8-3.5.9-3.5 1.9 1 1.6 3.5 1.6 3.5-.5 3.5-1.5",
  technology: "M2.5 3.5h11v7h-11z M6 13.5h4 M8 10.5v3 M5 6h1.5 M5 8h3",
  vendors:
    "M2.5 5.5 8 2l5.5 3.5v6L8 15l-5.5-3.5z M8 8l5.5-3.5M8 8v7M8 8 2.5 5.5",
  change:
    "M3 8a5 5 0 0 1 8.5-3.5L13 3M13 3v3h-3 M13 8a5 5 0 0 1-8.5 3.5L3 13M3 13v-3h3",
  risk: "M8 1.5 14 4v4c0 4-2.5 6-6 6.5C4.5 14 2 12 2 8V4z M8 5.5v3.5 M8 10.5h.01",
};

function ExplorerGroupIcon({ icon }: { icon: ExplorerIcon }) {
  return (
    <svg
      className="heb-nav-group-icon"
      viewBox="0 0 16 16"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={EXPLORER_ICON_PATHS[icon]} />
    </svg>
  );
}

export function HomeEnterpriseBriefApp({
  pack,
  relationshipEdges = [],
  selectedDimension,
}: HomeEnterpriseBriefAppProps) {
  const [view, setView] = useState<ViewKey>(initialView(selectedDimension));
  const [activeNavId, setActiveNavId] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      NAV_GROUPS.map((g) => [g.title, g.defaultOpen ?? false]),
    ),
  );
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
        {NAV_GROUPS.map((group) => {
          const isOpen = openGroups[group.title] ?? false;
          return (
            <nav className="heb-nav-group" key={group.title}>
              {group.eyebrow ? <small>{group.eyebrow}</small> : null}
              <button
                type="button"
                className="heb-nav-group-head"
                aria-expanded={isOpen}
                onClick={() =>
                  setOpenGroups((prev) => ({ ...prev, [group.title]: !isOpen }))
                }
              >
                <em
                  className={isOpen ? "heb-disclosure open" : "heb-disclosure"}
                >
                  ▶
                </em>
                <ExplorerGroupIcon icon={group.icon} />
                {group.title}
              </button>
              {isOpen
                ? group.items.map((item) => {
                    const navId = `${group.title}:${item.label}`;
                    const active = activeNavId
                      ? activeNavId === navId
                      : item.key === view && group.title === "Enterprise Brief";
                    return (
                      <button
                        className={[
                          active ? "is-active" : "",
                          item.tone ? `tone-${item.tone}` : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        key={navId}
                        type="button"
                        onClick={() => {
                          setView(item.key);
                          setActiveNavId(navId);
                        }}
                      >
                        <i aria-hidden="true" />
                        <b>{item.label}</b>
                      </button>
                    );
                  })
                : null}
            </nav>
          );
        })}
        <p className="heb-rail-note">
          The Enterprise Brief is the executive read. Open any item to inspect
          the context behind it.
        </p>
      </aside>

      <main className="heb-main">
        <header className="heb-page-head">
          <h1>{pack.tenant_name}</h1>
          <p className="heb-tenant-meta">
            <b>{tenantDescriptor(pack)}</b>
            <i />
            <span>{tenantLocation(pack)}</span>
          </p>
          <div
            className="heb-section-tabs"
            role="tablist"
            aria-label="Home sections"
          >
            {SECTION_TABS.map((tab) => (
              <button
                className={view === tab.key ? "is-active" : ""}
                key={`${tab.key}-${tab.label}`}
                type="button"
                onClick={() => {
                  setView(tab.key);
                  setActiveNavId(null);
                }}
              >
                <span>{tab.label}</span>
                <em>{tab.badge}</em>
              </button>
            ))}
          </div>
        </header>

        <div className="heb-current-section">
          <div className="heb-status">
            <b>{pack.tenant_name}</b>
            <i />
            <em>{tier?.tierLabel ?? "Planning-grade context"}</em>
            <i />
            <em>Updated {formatDate(pack.generated_at)}</em>
          </div>
        </div>

        {view === "snapshot" ? (
          <SnapshotView pack={pack} executive={executive} facts={facts} />
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
          grid-template-columns: 264px minmax(0, 1fr);
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
          padding: 17px 10px 32px;
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
          padding: 0 8px 15px;
          color: #6c778b;
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
          padding: 10px 0;
        }
        .heb-nav-group:first-of-type {
          border-top: 0;
          padding-top: 0;
        }
        .heb-nav-group small {
          display: block;
          padding: 0 8px 6px;
          color: #a29b91;
          font-size: 9px;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          font-weight: 800;
        }
        .heb-nav-group button.heb-nav-group-head {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          padding: 4px 8px 7px;
          border: 0;
          background: transparent;
          cursor: pointer;
          color: ${COLORS.quiet};
          font: inherit;
          font-size: 9px;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          font-weight: 800;
          text-align: left;
        }
        .heb-nav-group-icon {
          color: #807a70;
          flex: none;
        }
        .heb-disclosure {
          display: inline-block;
          font-style: normal;
          font-size: 7px;
          color: #a29b91;
          flex: none;
          transition: transform 0.12s ease;
          transform: rotate(0deg);
        }
        .heb-disclosure.open {
          transform: rotate(90deg);
        }
        .heb-nav-group button {
          width: 100%;
          display: grid;
          grid-template-columns: 10px minmax(0, 1fr);
          align-items: center;
          border: 0;
          border-left: 3px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: ${COLORS.ink};
          column-gap: 8px;
          padding: 6px 9px 6px 7px;
          margin: 1px 0;
          cursor: pointer;
          text-align: left;
          font: inherit;
        }
        .heb-nav-group button:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        .heb-nav-group button.is-active {
          background: rgba(255, 255, 255, 0.72);
          border-left-color: ${COLORS.blue};
          box-shadow: inset 0 0 0 1px rgba(18, 104, 199, 0.08);
          color: ${COLORS.ink};
        }
        .heb-nav-group:first-of-type button.is-active {
          background: #2f2f2c;
          color: #fffdf8;
          border-left-color: ${COLORS.teal};
          box-shadow: none;
        }
        .heb-nav-group button > i {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #b9b4aa;
          justify-self: center;
        }
        .heb-nav-group button.tone-green > i {
          background: ${COLORS.teal};
        }
        .heb-nav-group button.tone-amber > i {
          background: ${COLORS.amber};
        }
        .heb-nav-group button.tone-red > i {
          background: ${COLORS.red};
        }
        .heb-nav-group button.tone-blue > i {
          background: ${COLORS.blue};
        }
        .heb-nav-group b {
          font-size: 12.5px;
          font-weight: 600;
          line-height: 1.2;
          white-space: normal;
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
          width: min(100%, 1280px);
          padding: 22px 36px 48px;
        }
        .heb-page-head {
          border-bottom: 1px solid ${COLORS.line};
          margin-bottom: 14px;
          padding-bottom: 0;
        }
        .heb-page-head h1,
        .heb-hero h2,
        .heb-title {
          font-family: Fraunces, Georgia, serif;
          color: ${COLORS.ink};
          letter-spacing: 0;
        }
        .heb-page-head h1 {
          font-size: clamp(30px, 3vw, 40px);
          line-height: 1;
          margin: 0 0 6px;
        }
        .heb-page-head p {
          margin: 0 0 12px;
          max-width: 74ch;
          color: ${COLORS.muted};
          font-size: 14px;
          line-height: 1.4;
        }
        .heb-tenant-meta {
          display: flex;
          align-items: center;
          gap: 11px;
          color: ${COLORS.muted};
          font-size: 13px;
        }
        .heb-tenant-meta b {
          color: ${COLORS.ink};
          font-weight: 700;
        }
        .heb-tenant-meta i {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: ${COLORS.lineStrong};
        }
        .heb-section-tabs {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px 16px;
          overflow: visible;
          padding-bottom: 0;
          border-bottom: 0;
        }
        .heb-section-tabs button {
          appearance: none;
          border: 0;
          border-bottom: 2px solid transparent;
          background: transparent;
          color: ${COLORS.muted};
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 0 8px;
          white-space: nowrap;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
        }
        .heb-section-tabs button.is-active {
          color: ${COLORS.ink};
          border-bottom-color: ${COLORS.black};
        }
        .heb-section-tabs em {
          border-radius: 4px;
          background: #eeeae1;
          color: ${COLORS.quiet};
          padding: 2px 4px;
          font-style: normal;
          font-size: 8px;
          letter-spacing: 0.08em;
          font-weight: 900;
        }
        .heb-current-section {
          margin-bottom: 12px;
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
          margin: 18px 0;
        }
        .heb-read-intro {
          margin: 18px 0 18px;
        }
        .heb-brief-legend {
          border-top: 1px solid ${COLORS.line};
          padding-top: 16px;
          margin-bottom: 22px !important;
        }
        .heb-brief-legend a {
          color: ${COLORS.muted};
          text-decoration: underline;
          text-underline-offset: 4px;
          font-weight: 700;
        }
        .heb-thesis {
          font-family: Fraunces, Georgia, serif;
          color: ${COLORS.ink};
          letter-spacing: 0;
          font-size: clamp(27px, 2.45vw, 36px);
          line-height: 1.08;
          max-width: 1040px;
          margin: 12px 0 12px;
        }
        .heb-context-line {
          display: flex;
          align-items: center;
          gap: 14px;
          color: ${COLORS.muted};
          font-size: 13px;
          margin: 0;
        }
        .heb-context-line b {
          color: ${COLORS.ink};
        }
        .heb-metric-table {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          border: 1px solid ${COLORS.line};
          border-radius: 9px;
          overflow: hidden;
          background: ${COLORS.surface};
        }
        .heb-metric-table .heb-fact {
          min-height: 66px;
          padding: 12px 14px;
          border-right: 1px solid ${COLORS.line};
          border-bottom: 1px solid ${COLORS.line};
        }
        .heb-metric-table .heb-fact:nth-child(5n) {
          border-right: 0;
        }
        .heb-metric-table .heb-fact:nth-last-child(-n + 5) {
          border-bottom: 0;
        }
        .heb-metric-table strong {
          display: block;
          font-family: Fraunces, Georgia, serif;
          font-size: 23px;
          line-height: 1;
          margin: 0 0 6px;
        }
        .heb-metric-table span {
          display: block;
          color: ${COLORS.muted};
          font-size: 11px;
          font-weight: 800;
        }
        .heb-tension-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 14px;
        }
        .heb-tension-grid article {
          background: ${COLORS.surface};
          border: 1px solid ${COLORS.line};
          border-radius: 9px;
          padding: 18px 20px;
        }
        .heb-tension-grid h3 {
          margin: 0 0 14px;
          color: ${COLORS.quiet};
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 900;
        }
        .heb-tension-grid ul,
        .heb-proof-lanes ul,
        .heb-sequence-grid ul {
          display: grid;
          gap: 10px;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .heb-tension-grid li {
          color: ${COLORS.ink};
          font-size: 14px;
          line-height: 1.45;
          position: relative;
          padding-left: 22px;
        }
        .heb-tension-grid li::before {
          content: "→";
          position: absolute;
          left: 0;
          color: ${COLORS.lineStrong};
          font-weight: 700;
        }
        .heb-tension-grid article:nth-child(2) li::before {
          content: "•";
        }
        .heb-takeaway {
          margin: 22px 0 28px;
          background: ${COLORS.black};
          color: #fffdf8;
          border-radius: 9px;
          padding: 20px 24px;
        }
        .heb-takeaway span {
          display: block;
          color: ${COLORS.amber};
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 900;
          margin-bottom: 10px;
        }
        .heb-takeaway p {
          margin: 0;
          font-family: Fraunces, Georgia, serif;
          font-size: 21px;
          line-height: 1.18;
          max-width: 940px;
        }
        .heb-proof-lanes {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .heb-section-label.green {
          color: ${COLORS.teal};
        }
        .heb-section-label.red {
          color: ${COLORS.red};
        }
        .heb-proof-lanes li {
          background: ${COLORS.surface};
          border: 1px solid ${COLORS.line};
          border-left: 3px solid ${COLORS.teal};
          border-radius: 7px;
          padding: 12px 14px;
          color: ${COLORS.ink};
          font-size: 13.5px;
          line-height: 1.42;
        }
        .heb-proof-lanes article:nth-child(2) li {
          border-left-color: ${COLORS.red};
        }
        .heb-confidence-strip {
          display: grid;
          grid-template-columns: 66px minmax(0, 1fr);
          align-items: center;
          gap: 20px;
          margin: 28px 0 34px;
          border: 1px solid ${COLORS.line};
          border-radius: 9px;
          background: ${COLORS.surface};
          padding: 16px 20px;
        }
        .heb-confidence-strip > strong {
          font-family: Fraunces, Georgia, serif;
          font-size: 31px;
          line-height: 1;
        }
        .heb-progress {
          height: 7px;
          border-radius: 999px;
          background: #e9e5dc;
          margin: 8px 0 7px;
          overflow: hidden;
        }
        .heb-progress i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: ${COLORS.teal};
        }
        .heb-confidence-strip p {
          margin: 0;
          color: ${COLORS.muted};
          font-size: 12.5px;
          line-height: 1.45;
        }
        .heb-sequence-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 14px;
        }
        .heb-sequence-grid article {
          background: ${COLORS.surface};
          border: 1px solid ${COLORS.line};
          border-radius: 9px;
          padding: 18px;
        }
        .heb-sequence-grid h3 {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin: 0 0 14px;
          border-radius: 999px;
          background: rgba(44, 164, 119, 0.13);
          color: ${COLORS.tealDark};
          padding: 5px 9px;
          font-size: 10px;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          font-weight: 900;
        }
        .heb-sequence-grid article.tone-blue h3 {
          background: rgba(18, 104, 199, 0.11);
          color: ${COLORS.blue};
        }
        .heb-sequence-grid article.tone-amber h3 {
          background: rgba(191, 125, 29, 0.12);
          color: ${COLORS.amber};
        }
        .heb-sequence-grid li {
          color: ${COLORS.ink};
          font-size: 13.5px;
          line-height: 1.45;
          position: relative;
          padding-left: 18px;
        }
        .heb-sequence-grid li::before {
          content: "—";
          position: absolute;
          left: 0;
          color: ${COLORS.lineStrong};
        }
        .heb-full-read {
          margin-top: 34px;
          border-top: 1px solid ${COLORS.line};
          padding-top: 24px;
          max-width: 820px;
        }
        .heb-full-read p {
          color: ${COLORS.ink};
          font-size: 16px;
          line-height: 1.56;
          margin: 14px 0 0;
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
        .heb-metric-table .heb-fact strong {
          font-size: 27px;
          margin: 0 0 7px;
        }
        .heb-metric-table .heb-fact span {
          color: ${COLORS.muted};
          font-size: 11px;
          font-weight: 800;
        }
        .heb-chart {
          height: 280px;
          min-width: 0;
        }
        .heb-chart-compact {
          height: 220px;
          margin-top: 12px;
        }
        .heb-chart-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          margin: 0;
          border: 1px dashed ${COLORS.lineStrong};
          border-radius: 10px;
          padding: 18px;
          color: ${COLORS.muted};
          background: rgba(255, 253, 248, 0.62);
          font-size: 13px;
          text-align: center;
        }
        .heb-visual-head {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: flex-start;
          margin-top: 7px;
        }
        .heb-visual-head h3 {
          margin: 0 0 5px;
          font-family: Fraunces, Georgia, serif;
          font-size: 20px;
          line-height: 1.1;
          color: ${COLORS.ink};
        }
        .heb-visual-head p {
          margin: 0;
          color: ${COLORS.muted};
          font-size: 13px;
          line-height: 1.45;
          max-width: 78ch;
        }
        .heb-visual-head > span {
          flex: none;
          border: 1px solid ${COLORS.line};
          border-radius: 999px;
          padding: 5px 9px;
          color: ${COLORS.quiet};
          background: #fff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .heb-visual-notes {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          border-top: 1px solid ${COLORS.line};
          padding-top: 12px;
          margin-top: 8px;
        }
        .heb-visual-notes span {
          border: 1px solid rgba(44, 164, 119, 0.22);
          border-radius: 999px;
          background: rgba(44, 164, 119, 0.08);
          color: ${COLORS.tealDark};
          padding: 6px 9px;
          font-size: 11px;
          font-weight: 700;
        }
        .heb-mini-relationship {
          width: 100%;
          height: 100%;
          display: block;
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
          .heb-facts,
          .heb-metric-table,
          .heb-tension-grid,
          .heb-proof-lanes,
          .heb-sequence-grid,
          .heb-confidence-strip {
            grid-template-columns: 1fr;
          }
          .heb-metric-table .heb-fact,
          .heb-metric-table .heb-fact:nth-child(5n),
          .heb-metric-table .heb-fact:nth-last-child(-n + 5) {
            border-right: 0;
            border-bottom: 1px solid ${COLORS.line};
          }
          .heb-metric-table .heb-fact:last-child {
            border-bottom: 0;
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
}: {
  pack: HomeKnowledgeDesignContractPack;
  executive?: NonNullable<
    HomeKnowledgeDesignContractPack["enterprise_brief"]
  >["executiveRead"];
  facts: Array<{ label: string; value: string; note?: string }>;
}) {
  const confidence = Math.max(
    0,
    Math.min(100, Number(executive?.contextConfidencePct ?? 58)),
  );
  const tension = splitReality(executive);
  const metrics = snapshotMetricGrid(pack, facts);
  const horizons = executive?.horizons?.length
    ? executive.horizons
    : [
        {
          horizon: "Act now",
          tone: "blue",
          items: [
            "Validate one bounded workflow change",
            "Name owners and establish baselines",
            "Close immediate governance gaps",
          ],
        },
        {
          horizon: "Build next",
          tone: "amber",
          items: [
            "Certified data and identity spine",
            "Semantic model and governed domains",
            "Integration and operational telemetry",
          ],
        },
        {
          horizon: "Scale later",
          tone: "green",
          items: [
            "Cross-domain agents",
            "Autonomous decisions",
            "Enterprise value optimization",
          ],
        },
      ];
  const fullNarrative =
    noMechanics(pack.narrative_sections?.enterprise_brief_summary) ||
    noMechanics(pack.narrative_sections?.enterprise_hero_summary) ||
    noMechanics(executive?.oneSentence);
  const secondNarrative =
    noMechanics(pack.narrative_sections?.proof_summary) ||
    noMechanics(executive?.dataFoundationSummary) ||
    "The useful next move is to turn context into confirmed operating evidence, so leadership can act on the whole enterprise rather than disconnected facts.";
  return (
    <>
      <section className="heb-read-intro">
        <div className="heb-legend heb-brief-legend">
          {[
            ["Proven strength", COLORS.teal],
            ["Structural constraint", COLORS.red],
            ["Strategic option", COLORS.blue],
            ["Evidence required", COLORS.amber],
          ].map(([label, color]) => (
            <span key={label}>
              <i style={{ background: color }} />
              {label}
            </span>
          ))}
          <a href="#about-this-cockpit">About this cockpit</a>
        </div>
        <span className="heb-section-label">
          The enterprise in one sentence
        </span>
        <h2 className="heb-thesis">
          {noMechanics(
            executive?.tensionHeadline ??
              pack.narrative_sections?.enterprise_brief_title ??
              executive?.oneSentence ??
              "Leadership needs one governed enterprise view before AI and transformation decisions scale.",
          )}
        </h2>
        <p className="heb-context-line">
          <b>{tenantDescriptor(pack)}</b>
          <span>{tenantLocation(pack)}</span>
        </p>
      </section>

      {metrics.length ? (
        <section
          className="heb-section heb-metric-table"
          aria-label="Enterprise metrics"
        >
          {metrics.map((fact) => (
            <article className="heb-fact" key={`${fact.label}-${fact.value}`}>
              <strong>{fact.value}</strong>
              <span>{fact.label}</span>
            </article>
          ))}
        </section>
      ) : null}

      <section className="heb-section">
        <span className="heb-section-label">The strategic tension</span>
        <div className="heb-tension-grid">
          <article>
            <h3>Industry is moving to</h3>
            <ul>
              {(tension.industry.length
                ? tension.industry
                : [
                    "AI-enabled workflow redesign",
                    "Agent-assisted service",
                    "Governed enterprise data products",
                    "Continuous finance and controls",
                    "Decision automation with human accountability",
                  ]
              )
                .slice(0, 5)
                .map((item) => (
                  <li key={item}>{noMechanics(item)}</li>
                ))}
            </ul>
          </article>
          <article>
            <h3>{pack.tenant_name.split(" ")[0]} today</h3>
            <ul>
              {(tension.reality.length
                ? tension.reality
                : (executive?.constraints ?? []).map((item) => item.text ?? "")
              )
                .filter(Boolean)
                .slice(0, 5)
                .map((item) => (
                  <li key={item}>{noMechanics(item)}</li>
                ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="heb-takeaway" aria-label="The takeaway">
        <span>The takeaway</span>
        <p>
          {noMechanics(executive?.oneSentence) ||
            "AI ambition is ahead of the enterprise context foundation required to scale it safely."}
        </p>
      </section>

      <section className="heb-section heb-proof-lanes">
        <article>
          <span className="heb-section-label green">Proven strengths</span>
          <ul>
            {(executive?.strengths ?? []).slice(0, 5).map((item) => (
              <li key={plain(item.text)}>{noMechanics(item.text)}</li>
            ))}
          </ul>
        </article>
        <article>
          <span className="heb-section-label red">Structural constraints</span>
          <ul>
            {(executive?.constraints ?? []).slice(0, 5).map((item) => (
              <li key={plain(item.text)}>{noMechanics(item.text)}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="heb-confidence-strip">
        <strong>{confidence}%</strong>
        <div>
          <span className="heb-section-label">Context confidence</span>
          <div className="heb-progress">
            <i style={{ width: `${confidence}%` }} />
          </div>
          <p>
            {noMechanics(executive?.contextConfidenceNote) ||
              "Enterprise structure and systems are evidenced; realized value and operating performance still need confirmation."}
          </p>
        </div>
      </section>

      <section className="heb-section">
        <span className="heb-section-label">
          The defensible leadership sequence
        </span>
        <div className="heb-sequence-grid">
          {horizons.slice(0, 3).map((horizon) => (
            <article
              className={`tone-${horizon.tone ?? "green"}`}
              key={horizon.horizon}
            >
              <h3>{noMechanics(horizon.horizon)}</h3>
              <ul>
                {(horizon.items ?? []).slice(0, 4).map((item) => (
                  <li key={item}>{noMechanics(item)}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="heb-section heb-full-read" id="about-this-cockpit">
        <span className="heb-section-label">In full</span>
        <p>{fullNarrative}</p>
        <p>{secondNarrative}</p>
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
              {item.industryPattern ? (
                <p>
                  <strong>Industry:</strong> {item.industryPattern}
                </p>
              ) : null}
              <p>
                <strong>Client context:</strong> {item.signal}
              </p>
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
  const story = dimension?.key
    ? pack.design_slots.STORY?.[dimension.key]
    : undefined;
  const visual = story?.visual_specification;
  const visualType = authoredVisualType(story);
  const chart = dimensionVisualChart(dimension, dataSet);
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
        <span className="heb-section-label">
          {visualType === "relationship_graph"
            ? "Primary graph"
            : "Primary Recharts visual"}
        </span>
        <div className="heb-visual-head">
          <div>
            <h3>
              {noMechanics(visual?.answer_first_title) ||
                `${dimension?.name ?? VIEW_META[view].title} decision view`}
            </h3>
            <p>
              {noMechanics(visual?.conclusion_to_prove) ||
                "The visual should help leadership see where context is strong enough to act and where evidence still gates confidence."}
            </p>
          </div>
          <span>{visualType.replaceAll("_", " ")}</span>
        </div>
        <div className="heb-chart heb-chart-compact">
          {visualType === "relationship_graph" ? (
            <MiniRelationshipVisual chart={chart} />
          ) : chart.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chart}
                layout="vertical"
                margin={{ left: 12, right: 30, top: 6, bottom: 6 }}
              >
                <CartesianGrid horizontal={false} stroke="#e8dfd3" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}/100`, "Coverage signal"]}
                />
                <Bar dataKey="value" radius={[0, 7, 7, 0]}>
                  {chart.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="label" position="right" fontSize={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            // No real data rows exist for this dimension -- an honest empty
            // state, not the old single hardcoded "Directional" bar that
            // rendered identically regardless of dimension.
            <p className="heb-chart-empty">
              No dataset rows are available yet to chart for this dimension.
            </p>
          )}
        </div>
        {visual?.annotations?.length ? (
          <div className="heb-visual-notes">
            {visual.annotations.slice(0, 3).map((annotation) => (
              <span key={annotation}>{noMechanics(annotation)}</span>
            ))}
          </div>
        ) : null}
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
          {sources.length ? (
            sources.slice(0, 3).map((source) => (
              <p key={source.name}>
                <strong>{source.name}</strong>:{" "}
                {source.supports ??
                  "No explicit relationship stated for this source."}
              </p>
            ))
          ) : (
            <p>No dimension-specific evidence has been linked yet.</p>
          )}
        </article>
      </section>
    </>
  );
}

function MiniRelationshipVisual({
  chart,
}: {
  chart: Array<{ name: string; value: number; fill: string }>;
}) {
  const center = { x: 310, y: 104 };
  const nodes = chart.slice(0, 6).map((item, index) => {
    const angle =
      (-130 + index * (260 / Math.max(1, chart.length - 1))) * (Math.PI / 180);
    return {
      ...item,
      x: center.x + Math.cos(angle) * 210,
      y: center.y + Math.sin(angle) * 78,
    };
  });
  return (
    <svg
      className="heb-mini-relationship"
      viewBox="0 0 640 220"
      role="img"
      aria-label="Compact relationship graph"
    >
      {nodes.map((node) => (
        <line
          key={`edge-${node.name}`}
          x1={center.x}
          y1={center.y}
          x2={node.x}
          y2={node.y}
          stroke="#d8d1c5"
          strokeWidth="1.2"
        />
      ))}
      <circle cx={center.x} cy={center.y} r="28" fill={COLORS.black} />
      <text
        x={center.x}
        y={center.y + 4}
        textAnchor="middle"
        fill="#fffdf8"
        fontSize="11"
        fontWeight="700"
      >
        Context
      </text>
      {nodes.map((node) => (
        <g key={node.name}>
          <circle cx={node.x} cy={node.y} r="13" fill={node.fill} />
          <text x={node.x + 18} y={node.y + 4} className="heb-node-label">
            {shortLabel(node.name, 22)}
          </text>
        </g>
      ))}
    </svg>
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

// AgentAnswer — the universal answer contract for the Shared Context Brain.
//
// Branding (founder decision 2026-06-20): the single agent voice across all
// surfaces is "Ava"; the brain she reasons over is "Consilium", a faculty of
// ~210 named virtual industry experts. Ava is one voice, but an answer may be
// composed by several Consilium experts — those contributors surface by name
// in trace/audit views (the "unified voice + named specialists" model). Hence
// `contributingExperts` below, not just a single `expertId`.
//
// W0 keystone (docs/build/SHARED_CONTEXT_BRAIN_BUILD_PLAN.md). This is the
// ONE output shape every surface emits: Home, Intelligence, Tower, Source,
// Moves. It generalizes the Source engine's typed output
// (`SourceAnswerEngineOutput`) and adds the structured render channels the
// 2026-06-20 audit found missing everywhere — tables, charts, graphs — so an
// answer can render prose, a table, a bar chart, a relationship graph, or a
// next-action list depending on the question.
//
// Grounding doctrine (founder decision 2026-06-20): CONFIDENT SYNTHESIS.
// The engine answers from domain expertise even when tenant evidence is thin;
// it marks HOW it knows via `groundingMode` and hedges via `limits`, but it
// does NOT refuse on thin evidence. The ONLY hard block is cross-tenant
// leakage (`crossTenantBlocked`). The citation gate stays observe-only.

/** The product surface a given answer was produced for. */
export type AgentSurface =
  | "home"
  | "intelligence"
  | "tower"
  | "source"
  | "moves";

/** How the engine arrived at the answer — drives the honesty language. */
export type GroundingMode =
  /** Grounded in the tenant's own committed facts/evidence. */
  | "tenant-evidence"
  /** Grounded in the industry corpus / expert pack, not the tenant's data. */
  | "industry-pattern"
  /** A blend — some claims from tenant data, some from industry patterns. */
  | "mixed";

export type AnswerConfidence = "low" | "medium" | "high";

/** Where a single citation points. Mirrors ContextBundle provenance classes. */
export type CitationSourceClass =
  | "tenant-fact"
  | "tenant-chunk"
  | "graph"
  | "corpus-pattern"
  | "worldview"
  | "expert-pack";

/** One citable source. Citations are DATA, not inline prose markers. */
export interface AnswerCitation {
  /** Stable id referenced by tables/charts/graphs via `citationIds`. */
  id: string;
  /** Human label, e.g. "F11, row 14" or "Healthcare RevCycle Expert". */
  label: string;
  sourceClass: CitationSourceClass;
  /** The underlying record/pattern/pack id when applicable. */
  recordId?: string;
  /** Short verbatim excerpt supporting the citation. */
  excerpt?: string;
  /** External link when the source is a public document. */
  url?: string;
  confidence?: AnswerConfidence;
}

export type TableColumnFormat =
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "date";

export interface AnswerTableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: TableColumnFormat;
}

/** A structured table — rendered by the typed <DataTable> (W4). */
export interface AnswerTable {
  id: string;
  title?: string;
  columns: AnswerTableColumn[];
  rows: Array<Record<string, string | number | null>>;
  note?: string;
  /** Citations backing the figures in this table. */
  citationIds?: string[];
}

/**
 * Chart kinds map 1:1 onto the existing board-grade SVG builders in
 * `expert-kernel/exports/board-grade/svg-charts.ts` — the renderer (W4)
 * dispatches on `kind` and feeds `data` to the named `builder`.
 */
export type AnswerChartKind =
  | "bar"
  | "stacked-bar"
  | "line"
  | "waterfall"
  | "value-bridge"
  | "tornado"
  | "range-bar"
  | "heatmap"
  | "swimlane"
  | "cost-stack";

export interface AnswerChart {
  id: string;
  kind: AnswerChartKind;
  title?: string;
  /** Shape validated per `kind` by the renderer recipe (W4). */
  data: unknown;
  /** The svg-charts builder function to invoke, e.g. "investmentWaterfall". */
  builder?: string;
  citationIds?: string[];
}

export interface AnswerGraphNode {
  id: string;
  label: string;
  /** e.g. "application" | "vendor" | "business-function". */
  kind?: string;
}

export interface AnswerGraphEdge {
  from: string;
  to: string;
  label?: string;
  kind?: string;
}

/** A relationship graph — rendered by the existing SVG node/edge components. */
export interface AnswerGraph {
  id: string;
  title?: string;
  nodes: AnswerGraphNode[];
  edges: AnswerGraphEdge[];
  citationIds?: string[];
}

export interface RecommendedAction {
  id: string;
  label: string;
  rationale?: string;
  /** Optional handoff target, e.g. "open-in-source" | "open-in-tower". */
  handoff?: string;
  citationIds?: string[];
}

export type AnswerBasisKind =
  | "tenant_fact"
  | "industry_pattern"
  | "benchmark"
  | "expert_inference"
  | "gap"
  | "source_coverage"
  | "conflict"
  | "simple_derived_metric";

/**
 * Explicit honesty layer. Renderers use this to show HOW Ava knows something
 * without inferring it from prose or expert chips.
 */
export interface AnswerBasis {
  kind: AnswerBasisKind;
  label: string;
  citationIds?: string[];
  note?: string;
}

/** A Consilium expert that contributed to the answer (shown by name in trace). */
export interface ExpertRef {
  /** ExpertPack identity id, e.g. "xp.healthcare.revenue-cycle". */
  id: string;
  /** Human label, e.g. "Healthcare Revenue Cycle Expert". */
  name: string;
}

/**
 * The universal answer. Every channel is always present (possibly empty) so
 * consumers render deterministically — never `undefined`-guard a channel.
 */
export interface AgentAnswer {
  engineVersion: "agent-answer/v1";
  surface: AgentSurface;
  /** The lead ExpertPack, when one was summoned (null = no specific expert). */
  expertId: string | null;
  /**
   * All Consilium experts that contributed, surfaced by name in trace/audit.
   * Always present (possibly empty). The lead expert (`expertId`) is included
   * here too when set — this is the full named-specialist roster for the answer.
   */
  contributingExperts: ExpertRef[];

  /** Narrative answer — now ONE channel among many, not the whole answer. */
  prose: string;
  tables: AnswerTable[];
  charts: AnswerChart[];
  graphs: AnswerGraph[];
  citations: AnswerCitation[];

  /** What the engine does NOT have proof for (the "no-proof" honesty channel). */
  gaps: string[];
  recommendedActions: RecommendedAction[];

  /** How the answer was grounded — drives hedge language. */
  groundingMode: GroundingMode;
  confidence: AnswerConfidence;
  /** Hedges/limits per confident-synthesis doctrine (NOT a refusal). */
  limits: string[];
  /** Tenant facts, corpus patterns, expert inference, and gaps separated. */
  basis?: AnswerBasis[];

  /**
   * The ONLY hard block. True when the cross-tenant fence replaced the answer
   * because a foreign tenant identity was detected. Everything else answers.
   */
  crossTenantBlocked: boolean;
}

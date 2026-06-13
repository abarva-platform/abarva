// =============================================================================
// Source-label mapping — internal evidence ids → human-readable citations.
// -----------------------------------------------------------------------------
// Client-facing deliverables must NEVER expose raw internal source identifiers
// (document_extract:*, tower_*, enterprise_context_*, chunk_id, fact_key,
// source_segment_id, raw table names). This module converts internal ids into
// clean, human-readable citation titles + a numbered Source Register, and
// provides the forbidden-tag detector used by the quality gate.
// Generic: known ids are mapped; unknown ids are humanized deterministically.
// =============================================================================

export interface SourceLabel {
  /** Human-readable title shown in the document, e.g. "Stakeholder Map". */
  title: string;
  /** Source type, e.g. "Document evidence", "Current-state dataset". */
  type: string;
  /** Evidence family / domain, e.g. "Decision rights / governance". */
  family: string;
}

export interface SourceRegisterEntry extends SourceLabel {
  /** 1-based citation number used as [n] in the body. */
  ref: number;
  /** The internal id — kept ONLY for the internal trace appendix, never body. */
  internalId: string;
  confidence: "high" | "medium" | "low";
  notes: string;
}

// Curated map for the known evidence families. Confidence defaults to medium
// (representative/synthetic current-state); callers may override.
const KNOWN: Record<string, SourceLabel & { notes: string }> = {
  tower_dora_metrics: {
    title: "Engineering Delivery Baseline (DORA Metrics)",
    type: "Current-state dataset",
    family: "Engineering delivery performance",
    notes:
      "Pre-intervention delivery baseline (lead time, deploy frequency, change-failure, MTTR).",
  },
  tower_cmdb_cis: {
    title: "Application & Systems Inventory",
    type: "Current-state dataset",
    family: "IT systems landscape",
    notes: "Systems in scope; basis for platform and data-constraint analysis.",
  },
  tower_workforce: {
    title: "IT / Engineering Organization Evidence",
    type: "Current-state dataset",
    family: "Workforce & organization",
    notes: "Engineering population eligible for AI-assisted workflows.",
  },
  tower_itsm_records: {
    title: "Service Management & Delivery Quality (ITSM)",
    type: "Current-state dataset",
    family: "Delivery quality / ITSM",
    notes: "Incidents, changes, MTTR and change-success picture.",
  },
  tower_ai_tool_usage: {
    title: "AI Tooling Adoption Evidence",
    type: "Current-state dataset",
    family: "AI tooling adoption",
    notes: "Current AI dev-tool penetration and observed benefits/gaps.",
  },
  "document_extract:stakeholder_map": {
    title: "Stakeholder & Decision-Rights Map",
    type: "Document evidence (reviewed)",
    family: "Decision rights / governance",
    notes:
      "Human-reviewed intake document; basis for sponsor and gate analysis.",
  },
  "document_extract:value_kpi_baseline": {
    title: "Value & KPI Baseline",
    type: "Document evidence (reviewed)",
    family: "Value & KPI baseline",
    notes: "KPI baseline schema and value framing for success metrics.",
  },
  "document_extract:product_platform_operating_model": {
    title: "Product / Platform Operating Model",
    type: "Document evidence (reviewed)",
    family: "Operating model",
    notes: "Team topology, funding and platform/product split.",
  },
  "method:leverage_ranking": {
    title: "AbarVa Leverage-Ranking Analysis",
    type: "AbarVa method",
    family: "Prioritization analysis",
    notes: "Applicability × readiness × upside ranking of starting points.",
  },
  "method:workpackage_roadmap_estimate": {
    title: "AbarVa Roadmap & Estimate Model",
    type: "AbarVa method",
    family: "Roadmap & investment",
    notes: "Work-package-based indicative phasing and cost range.",
  },
  "method:maturity_scoring": {
    title: "AbarVa Maturity Assessment",
    type: "AbarVa method",
    family: "Maturity analysis",
    notes: "Five-dimension current-state maturity scoring.",
  },
  "diagnose_intake:attested": {
    title: "Diagnose Intake (attested)",
    type: "Attested stakeholder intake",
    family: "Diagnose discovery session",
    notes:
      "Answers captured in the governed Diagnose intake and attested by the responding stakeholder.",
  },
  "design_intake:attested": {
    title: "Design Intake (attested)",
    type: "Attested stakeholder intake",
    family: "Design / solution-approach session",
    notes:
      "Architecture and approach decisions captured in the governed Design intake and attested by the responding stakeholder.",
  },
};

const PREFIX_FAMILY: Array<{ test: RegExp; type: string; family: string }> = [
  {
    test: /^document_extract:/,
    type: "Document evidence (reviewed)",
    family: "Document-derived evidence",
  },
  {
    test: /^tower_/,
    type: "Current-state dataset",
    family: "Current-state evidence",
  },
  {
    test: /^enterprise_context_/,
    type: "Context evidence",
    family: "Enterprise context",
  },
  { test: /^method:/, type: "AbarVa method", family: "Analytical method" },
  { test: /^archetype:/, type: "AbarVa archetype", family: "Engagement model" },
];

function titleCase(s: string): string {
  return s
    .replace(/[_:]+/g, " ")
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bDora\b/i, "DORA")
    .replace(/\bKpi\b/i, "KPI")
    .replace(/\bCmdb\b/i, "CMDB")
    .replace(/\bItsm\b/i, "ITSM")
    .replace(/\bAi\b/g, "AI")
    .trim();
}

/** Resolve an internal source id to a human-readable label (deterministic). */
export function resolveSourceLabel(internalId: string): SourceLabel {
  const known = KNOWN[internalId];
  if (known)
    return { title: known.title, type: known.type, family: known.family };
  const prefix = PREFIX_FAMILY.find((p) => p.test.test(internalId));
  const bare = internalId.replace(/^[a-z_]+:/i, "");
  return {
    title: titleCase(bare) || "Supporting Evidence",
    type: prefix?.type ?? "Supporting evidence",
    family: prefix?.family ?? "Supporting evidence",
  };
}

/**
 * Build a numbered Source Register from the distinct internal ids cited by a
 * deliverable, plus a citation map (internalId → [n]) used to rewrite body text.
 */
export function buildSourceRegister(
  internalIds: string[],
  confidenceById: Record<string, "high" | "medium" | "low"> = {},
): { register: SourceRegisterEntry[]; citationMap: Record<string, number> } {
  const distinct = Array.from(new Set(internalIds.filter(Boolean)));
  const register: SourceRegisterEntry[] = [];
  const citationMap: Record<string, number> = {};
  distinct.forEach((id, i) => {
    const ref = i + 1;
    citationMap[id] = ref;
    const label = resolveSourceLabel(id);
    register.push({
      ref,
      internalId: id,
      title: label.title,
      type: label.type,
      family: label.family,
      confidence: confidenceById[id] ?? "medium",
      notes: KNOWN[id]?.notes ?? "Supporting evidence for this deliverable.",
    });
  });
  return { register, citationMap };
}

// ── Forbidden-tag detection (the quality gate's hard rule) ───────────────────

export const FORBIDDEN_TAG_PATTERNS: Array<{ id: string; re: RegExp }> = [
  { id: "document_extract", re: /document_extract\s*:/i },
  { id: "tower_table", re: /\btower_[a-z0-9_]+/i },
  { id: "enterprise_context", re: /\benterprise_context_[a-z0-9_]+/i },
  { id: "chunk_id", re: /\bchunk_id\b/i },
  { id: "fact_key", re: /\bfact_key\b/i },
  { id: "source_segment_id", re: /\bsource_segment_id\b/i },
  { id: "method_tag", re: /\bmethod\s*:\s*[a-z_]+/i },
  { id: "archetype_tag", re: /\barchetype\s*:\s*[a-z_]+/i },
  { id: "section_tag", re: /\bsection\s*:\s*[A-Za-z]/ },
];

/** Returns the internal tags found in a client-facing string (empty = clean). */
export function findForbiddenTags(text: string): string[] {
  const hits: string[] = [];
  for (const p of FORBIDDEN_TAG_PATTERNS) {
    const m = text.match(p.re);
    if (m) hits.push(m[0]);
  }
  return Array.from(new Set(hits));
}

/**
 * Replace any inline internal source ids in body text with [n] citations using
 * the citation map. Also strips leftover "(source: ...)" / "[source: ...]"
 * wrappers. Defense-in-depth so the body never leaks a raw id.
 */
export function applyCitationsToBody(
  body: string,
  citationMap: Record<string, number>,
): string {
  let out = body;
  // Longest ids first so document_extract:value_kpi_baseline isn't half-matched.
  const ids = Object.keys(citationMap).sort((a, b) => b.length - a.length);
  for (const id of ids) {
    const ref = citationMap[id];
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // "(source: id)" / "[source: id]" / bare id → [n]
    out = out.replace(
      new RegExp(`[\\[(]\\s*sources?:\\s*${esc}\\s*[\\])]`, "gi"),
      `[${ref}]`,
    );
    out = out.replace(new RegExp(esc, "g"), `[${ref}]`);
  }
  // Collapse any remaining "(source: Something)" that didn't map.
  out = out.replace(/[\[(]\s*sources?:\s*([^)\]]+)[\])]/gi, (_m, s) => {
    const label = resolveSourceLabel(String(s).trim());
    return `(${label.title})`;
  });
  return out;
}

// Matches any raw internal source id that must never reach a client surface:
// the `tower_*` / `enterprise_context_*` table namespaces and the
// `document_extract:` / `method:` / `archetype:` prefixed ids.
const INTERNAL_ID_RE =
  /\b(?:tower_[a-z0-9_]+|enterprise_context_[a-z0-9_]+)\b|\b(?:document_extract|method|archetype):[a-z0-9_]+/gi;

/**
 * Final rendering pass: replace any raw internal source id left in a body with
 * its human-readable label. Defense-in-depth for paths that inject `[source: id]`
 * inline (the narrative generator, the deterministic markdown renderers) rather
 * than numbered `[n]` citations — so a leaked `tower_*` / `document_extract:*` /
 * `method:*` tag can never reach a client document. Idempotent on clean text.
 */
export function scrubInternalSourceTags(text: string): string {
  return text.replace(INTERNAL_ID_RE, (m) => resolveSourceLabel(m).title);
}

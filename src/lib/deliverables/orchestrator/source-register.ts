// Source register + clean evidence rendering.
//
// The governed bundle upstream carries opaque provenance handles (ledger ids,
// chunk ids, fact keys). Those must NEVER appear in the document body. This module
// turns governed candidates into:
//   - a clean, human-readable, citation-numbered evidence list for the prompt, and
//   - a Source Register the deliverable exposes (label + family + confidence + as-of).
//
// It also provides the leak scanner the quality gate uses to block any document that
// leaks an internal id/tag into the body.

import type { GovernedEvidenceItem, SourceRegisterEntry } from "./types";

/** Raw governed candidate as it arrives from buildValidatedAgentContextBundle. */
export interface GovernedCandidateLike {
  label: string;
  statement: string;
  evidenceFamily: string;
  confidence: "high" | "medium" | "low";
  asOf?: string;
  disclosureTier?: "vendor_facing" | "internal_only" | "aggregate_only";
  /** opaque internal handles — kept out of the body. */
  provenanceRef: string;
}

export interface SourceRegisterBuild {
  evidence: GovernedEvidenceItem[]; // citation-numbered, clean
  register: SourceRegisterEntry[]; // what the document exposes
}

/**
 * Build a stable, citation-numbered clean evidence set + the matching source
 * register. Citation numbers are assigned by the given order (stable, 1-based).
 * If `audienceIsVendorFacing`, internal_only items are excluded entirely (so an
 * issued RFP never leaks incumbent spend/names) — they remain available for the
 * internal pack via a separate call.
 */
// ── Source-label hygiene ────────────────────────────────────────────────────
// Internal source ids must never appear in a client-facing register. This maps
// known internal ids to human-readable source names; anything unmapped is
// de-identified heuristically (strip internal prefixes, drop trailing ids,
// Title Case). Callers should label evidence with these names; the register
// builder also applies it defensively so a raw id can never leak.
const SOURCE_LABEL_MAP: Readonly<Record<string, string>> = {
  "document_extract:stakeholder_map": "Stakeholder Map",
  "document_extract:value_kpi_baseline": "Value and KPI Baseline",
  tower_dora_metrics: "Engineering Delivery Baseline / DORA Metrics",
  tower_cmdb_cis: "Application and Systems Inventory",
  tower_workforce: "IT / Engineering Organization Evidence",
};

const INTERNAL_PREFIX_RE =
  /^(?:document_extract:|tower_|enterprise_context_(?:records|facts|sources)_?|source_segment_|chunk[:_]|fact_|generated_artifact:|phase_capture:|program_evidence:)/i;
const TRAILING_ID_RE =
  /[\s_-]*(?:[0-9a-f]{8}-[0-9a-f-]{20,}|\d{3,}|[0-9a-f]{12,})$/i;

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) =>
      w.length <= 3 && /^[A-Z]+$/.test(w)
        ? w
        : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}

/** Map an internal/raw source id to a clean, client-safe source name. */
export function humanizeSourceLabel(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "Source";
  const exact =
    SOURCE_LABEL_MAP[value] ?? SOURCE_LABEL_MAP[value.toLowerCase()];
  if (exact) return exact;
  // If it already looks human (has spaces, no internal markers), keep it.
  if (
    /\s/.test(value) &&
    !INTERNAL_PREFIX_RE.test(value) &&
    !value.includes(":")
  ) {
    return value;
  }
  const stripped = value
    .replace(INTERNAL_PREFIX_RE, "")
    .replace(TRAILING_ID_RE, "")
    .replace(/[:_]+/g, " ")
    .trim();
  // A bare numeric/too-short remnant is an id fragment, not a name.
  if (!stripped || /^\d+$/.test(stripped) || stripped.length < 2)
    return "Source";
  return titleCase(stripped);
}

/** Map an internal/raw source family to a clean, client-safe source family. */
export function humanizeSourceFamily(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "Evidence";
  const exact =
    SOURCE_LABEL_MAP[value] ?? SOURCE_LABEL_MAP[value.toLowerCase()];
  if (exact) return exact;
  const stripped = value
    .replace(INTERNAL_PREFIX_RE, "")
    .replace(TRAILING_ID_RE, "")
    .replace(/[:_]+/g, " ")
    .trim();
  if (!stripped || /^\d+$/.test(stripped) || stripped.length < 2)
    return "Evidence";
  return titleCase(stripped);
}

export function buildSourceRegister(
  candidates: GovernedCandidateLike[],
  opts: { audienceIsVendorFacing?: boolean } = {},
): SourceRegisterBuild {
  const visible = opts.audienceIsVendorFacing
    ? candidates.filter(
        (c) => (c.disclosureTier ?? "vendor_facing") !== "internal_only",
      )
    : candidates;

  const evidence: GovernedEvidenceItem[] = visible.map((c, i) => ({
    citationNumber: i + 1,
    label: humanizeSourceLabel(c.label),
    statement: c.statement,
    evidenceFamily: humanizeSourceFamily(c.evidenceFamily),
    confidence: c.confidence,
    asOf: c.asOf,
    disclosureTier: c.disclosureTier ?? "vendor_facing",
    provenanceRef: c.provenanceRef,
  }));

  const register: SourceRegisterEntry[] = evidence.map((e) => ({
    citationNumber: e.citationNumber,
    label: e.label,
    evidenceFamily: e.evidenceFamily,
    confidence: e.confidence,
    asOf: e.asOf,
  }));

  return { evidence, register };
}

/** Render the clean evidence list for injection into a prompt (no internal ids). */
export function renderEvidenceForPrompt(
  evidence: GovernedEvidenceItem[],
): string {
  if (evidence.length === 0)
    return "(no governed evidence available — treat ALL client facts as missing)";
  return evidence
    .map((e) => {
      const meta = [e.confidence, e.asOf].filter(Boolean).join(", ");
      return `[${e.citationNumber}] ${e.label}: ${e.statement}${meta ? ` (${meta})` : ""}`;
    })
    .join("\n");
}

/**
 * Patterns that must never appear in a rendered document body. These catch leaked
 * internal identifiers and un-rendered orchestration tags.
 */
const INTERNAL_LEAK_PATTERNS: { name: string; re: RegExp }[] = [
  {
    name: "uuid",
    re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  },
  {
    name: "ledger_id",
    re: /\b(?:evidence_ledger_id|ledger_id|chunk_id|fact_key|object_id|record_id|source_segment_id)\b/i,
  },
  { name: "table_ref", re: /\benterprise_context_(?:records|facts|sources)\b/ },
  { name: "document_extract", re: /\bdocument_extract:/i },
  { name: "tower_ref", re: /\btower_[a-z][a-z0-9_]+\b/i },
  { name: "generated_artifact", re: /\bgenerated_artifact:/i },
  { name: "provenance_ref", re: /\bprov(?:enance)?[-_]?ref\b/i },
  { name: "orchestration_tag", re: /<<[A-Z_]+>>|\{\{[a-z_]+\}\}/ },
  {
    name: "internal_status",
    re: /\b(?:agent_ready|committed_not_indexed|promotion_candidate)\b/,
  },
];

/** Returns the names of any internal leak patterns found in the body text. */
export function scanForInternalLeaks(body: string): string[] {
  const hits = new Set<string>();
  for (const p of INTERNAL_LEAK_PATTERNS) if (p.re.test(body)) hits.add(p.name);
  return [...hits];
}

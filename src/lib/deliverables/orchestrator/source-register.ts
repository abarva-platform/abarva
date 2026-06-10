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

import type { GovernedEvidenceItem, SourceRegisterEntry } from './types';

/** Raw governed candidate as it arrives from buildValidatedAgentContextBundle. */
export interface GovernedCandidateLike {
  label: string;
  statement: string;
  evidenceFamily: string;
  confidence: 'high' | 'medium' | 'low';
  asOf?: string;
  disclosureTier?: 'vendor_facing' | 'internal_only' | 'aggregate_only';
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
export function buildSourceRegister(
  candidates: GovernedCandidateLike[],
  opts: { audienceIsVendorFacing?: boolean } = {},
): SourceRegisterBuild {
  const visible = opts.audienceIsVendorFacing
    ? candidates.filter((c) => (c.disclosureTier ?? 'vendor_facing') !== 'internal_only')
    : candidates;

  const evidence: GovernedEvidenceItem[] = visible.map((c, i) => ({
    citationNumber: i + 1,
    label: c.label,
    statement: c.statement,
    evidenceFamily: c.evidenceFamily,
    confidence: c.confidence,
    asOf: c.asOf,
    disclosureTier: c.disclosureTier ?? 'vendor_facing',
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
export function renderEvidenceForPrompt(evidence: GovernedEvidenceItem[]): string {
  if (evidence.length === 0) return '(no governed evidence available — treat ALL client facts as missing)';
  return evidence
    .map((e) => {
      const meta = [e.confidence, e.asOf].filter(Boolean).join(', ');
      return `[${e.citationNumber}] ${e.label}: ${e.statement}${meta ? ` (${meta})` : ''}`;
    })
    .join('\n');
}

/**
 * Patterns that must never appear in a rendered document body. These catch leaked
 * internal identifiers and un-rendered orchestration tags.
 */
const INTERNAL_LEAK_PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'uuid', re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i },
  { name: 'ledger_id', re: /\b(?:evidence_ledger_id|ledger_id|chunk_id|fact_key|object_id|record_id)\b/i },
  { name: 'table_ref', re: /\benterprise_context_(?:records|facts|sources)\b/ },
  { name: 'provenance_ref', re: /\bprov(?:enance)?[-_]?ref\b/i },
  { name: 'orchestration_tag', re: /<<[A-Z_]+>>|\{\{[a-z_]+\}\}/ },
  { name: 'internal_status', re: /\b(?:agent_ready|committed_not_indexed|promotion_candidate)\b/ },
];

/** Returns the names of any internal leak patterns found in the body text. */
export function scanForInternalLeaks(body: string): string[] {
  const hits = new Set<string>();
  for (const p of INTERNAL_LEAK_PATTERNS) if (p.re.test(body)) hits.add(p.name);
  return [...hits];
}

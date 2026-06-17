// Decomposed generation helpers (Slice 0).
//
// The orchestrator generates each planned section in its own bounded-parallel call, then
// assembles the RenderableDeliverable in code — so total length scales with section COUNT,
// not a single call's output ceiling (truncation becomes structurally impossible). These
// helpers are pure and unit-tested without the model.
//
// IMPORTANT: repairUncitedFigures MUST mirror the quality gate's regexes exactly
// (quality-validator.ts `countUnsupportedClaims`) so a section the gate would block for an
// uncited figure is deterministically repaired to a surfaced placeholder — never fabricated.

import 'server-only';

import type {
  DeliverableIntelligenceRequest,
  GovernedEvidenceItem,
  RenderableDeliverable,
  RenderableSection,
  RenderableTable,
  SourceRegisterEntry,
} from './types';

/** Bounded-concurrency map that preserves input order. */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  const cap = Math.max(1, Math.min(limit, items.length || 1));
  let next = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i] as T, i);
    }
  }
  await Promise.all(Array.from({ length: cap }, () => worker()));
  return out;
}

// Mirror of quality-validator.ts countUnsupportedClaims — keep in lockstep.
const FACT_LIKE = /(\$\s?\d|\b\d{1,3}(?:,\d{3})+\b|\b\d+%|\bFY?20\d\d\b|\b\d{4}-\d{2}-\d{2}\b)/;
const SUPPORTED = /\[\d+\]|\[ASSUMPTION TO VALIDATE|\[CLIENT TO COMPLETE|\[EVIDENCE MISSING/;

/**
 * Deterministically surface any client-fact-looking figure (number/$/%/date) that lacks a
 * [n] citation, an approved assumption, or a placeholder — by tagging the sentence
 * `[CLIENT TO COMPLETE]`. Conservative: it never removes or invents a figure, it only marks
 * an ungrounded one as needing client input, which is exactly what the governance demands
 * (surface gaps, never fabricate). This is what keeps a decomposed section past the gate.
 */
export function repairUncitedFigures(markdown: string): string {
  if (!markdown) return markdown;
  const sentences = markdown.split(/(?<=[.!?])\s+/);
  let changed = false;
  const repaired = sentences.map((s) => {
    if (FACT_LIKE.test(s) && !SUPPORTED.test(s)) {
      changed = true;
      return s.replace(/\s*$/, ' [CLIENT TO COMPLETE]');
    }
    return s;
  });
  return changed ? repaired.join(' ') : markdown;
}

/** A one-line summary of a section for the synthesis pass (titles + a clipped body). */
export function summariseSection(s: RenderableSection): { title: string; summary: string } {
  return { title: s.title, summary: s.bodyMarkdown.replace(/\s+/g, ' ').slice(0, 400) };
}

/**
 * Build the source register from the UNION of evidence actually cited across the sections —
 * the quality gate blocks when `requiresSourceRegister` and the register is empty.
 */
export function buildSourceRegister(
  evidence: readonly GovernedEvidenceItem[],
  sections: readonly RenderableSection[],
): SourceRegisterEntry[] {
  const used = new Set<number>();
  for (const s of sections) for (const n of s.citationsUsed ?? []) used.add(n);
  return evidence
    .filter((e) => used.has(e.citationNumber))
    .map((e) => ({
      citationNumber: e.citationNumber,
      label: e.label,
      evidenceFamily: e.evidenceFamily,
      confidence: e.confidence,
      asOf: e.asOf,
    }));
}

/** The doc-level fields the synthesis pass returns (the structured artifacts the gate checks). */
export interface SynthesisResult {
  title?: string;
  subtitle?: string;
  recommendation?: string;
  nextActions?: string[];
  tables?: RenderableTable[];
  clientCompleteChecklist?: RenderableDeliverable['clientCompleteChecklist'];
}

/**
 * Assemble the final RenderableDeliverable in code from the per-section drafts + the synthesis
 * result. No monolithic render call → no single-blob ceiling. Falls back to the request's own
 * client-complete items so the "gaps exist but no checklist" gate never trips spuriously.
 */
export function assembleDeliverable(
  req: DeliverableIntelligenceRequest,
  sections: RenderableSection[],
  synth: SynthesisResult,
  evidence: readonly GovernedEvidenceItem[],
): RenderableDeliverable {
  const checklist =
    synth.clientCompleteChecklist && synth.clientCompleteChecklist.length > 0
      ? synth.clientCompleteChecklist
      : (req.clientCompleteItems ?? []);
  return {
    title: (synth.title && synth.title.trim()) || `${req.deliverableType.replace(/_/g, ' ')} — ${req.initiativeDisplayName}`,
    subtitle: synth.subtitle,
    clientDisplayName: req.clientDisplayName,
    initiativeDisplayName: req.initiativeDisplayName,
    generatedSections: sections,
    tables: synth.tables ?? [],
    exhibits: [],
    sourceRegister: buildSourceRegister(evidence, sections),
    assumptions: req.approvedAssumptions ?? [],
    clientCompleteChecklist: checklist,
    recommendation: synth.recommendation ?? '',
    nextActions: synth.nextActions ?? [],
  };
}

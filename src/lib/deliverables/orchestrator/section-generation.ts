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
  DeliverableArtifactBrief,
  GovernedEvidenceItem,
  RenderableDeliverable,
  RenderableExhibit,
  RenderableSection,
  RenderableTable,
  SourceRegisterEntry,
} from './types';
import { deliverableKeyForOrchestratorType } from '@/lib/deliverables/quality/deliverable-key-map';
import { DELIVERABLE_PROFILES } from '@/lib/deliverables/profiles/registry';

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

export interface UnsupportedFigureClaim {
  sectionKey: string;
  sectionTitle: string;
  claim: string;
  treatment: 'assumption_to_validate' | 'open_input_required';
}

export function extractUnsupportedFigureClaims(markdown: string): string[] {
  if (!markdown) return [];
  return markdown
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => FACT_LIKE.test(s) && !SUPPORTED.test(s));
}

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
      return s.replace(
        /\s*$/,
        ' [ASSUMPTION TO VALIDATE: numeric/date/value claim requires client confirmation or cited source before it is treated as committed.]',
      );
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

function honestTitle(req: DeliverableIntelligenceRequest, synth: SynthesisResult): string {
  const fallback = `${req.deliverableType.replace(/_/g, ' ')} — ${req.initiativeDisplayName}`;
  const modelTitle = synth.title && synth.title.trim() ? synth.title.trim() : fallback;
  if (req.module !== 'moves') return modelTitle;
  switch (req.deliverableType) {
    case 'business_case':
      return `Business Case Readiness Memo — ${req.initiativeDisplayName}`;
    case 'estimate_model':
    case 'financial_model':
      return `Financial Model Input Register — ${req.initiativeDisplayName}`;
    case 'value_measurement_contract':
      return `Value Measurement Contract — Measurement Framework`;
    default:
      return modelTitle;
  }
}

function openInputsTable(
  req: DeliverableIntelligenceRequest,
  unsupportedClaims: readonly UnsupportedFigureClaim[],
): RenderableTable | null {
  const rows: string[][] = [];
  for (const m of req.missingEvidence ?? []) {
    rows.push([
      m.label,
      m.whyItMatters,
      m.completionPath,
      'Open input',
    ]);
  }
  for (const c of unsupportedClaims) {
    rows.push([
      c.sectionTitle,
      c.claim,
      c.treatment === 'assumption_to_validate'
        ? 'Confirm the assumption or replace it with a cited source.'
        : 'Provide supporting source evidence before asserting this as fact.',
      c.treatment === 'assumption_to_validate'
        ? 'Labeled assumption in draft'
        : 'Open input required',
    ]);
  }
  if (rows.length === 0) return null;
  return {
    key: 'open_inputs_required',
    title: 'Open Inputs Required',
    columns: ['Area', 'Input needed', 'How to close', 'Treatment in this artifact'],
    rows,
    targetFormat: 'docx',
  };
}

function expectedExhibitsForProfile(req: DeliverableIntelligenceRequest, brief?: DeliverableArtifactBrief): RenderableExhibit[] {
  const byKey = new Map<string, RenderableExhibit>();
  for (const ex of brief?.expectedExhibits ?? []) {
    byKey.set(ex.key, {
      key: ex.key,
      title: ex.title,
      kind: ex.kind,
      description: ex.purpose,
      targetFormat: ex.preferredFormat,
    });
  }
  const deliverableKey = deliverableKeyForOrchestratorType(req.deliverableType);
  if (deliverableKey) {
    const profile = DELIVERABLE_PROFILES[deliverableKey];
    for (const key of profile.requiredExhibits) {
      if (!byKey.has(key)) {
        byKey.set(key, {
          key,
          title: key.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
          kind: key.includes('roadmap') || key.includes('calendar') ? 'timeline' : key.includes('map') || key.includes('flow') ? 'flow' : 'matrix',
          description: `Profile-required view for ${profile.title}; populated from cited evidence, assumptions, and open inputs.`,
          targetFormat: profile.defaultFormat === 'xlsx' ? 'xlsx' : 'docx',
        });
      }
    }
  }
  return [...byKey.values()];
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
  options: {
    brief?: DeliverableArtifactBrief;
    unsupportedClaims?: readonly UnsupportedFigureClaim[];
  } = {},
): RenderableDeliverable {
  const openInputs = openInputsTable(req, options.unsupportedClaims ?? []);
  const tables = [...(synth.tables ?? [])];
  if (openInputs && !tables.some((t) => t.key === openInputs.key)) {
    tables.push(openInputs);
  }
  const checklist =
    synth.clientCompleteChecklist && synth.clientCompleteChecklist.length > 0
      ? synth.clientCompleteChecklist
      : (req.clientCompleteItems ?? []);
  return {
    title: honestTitle(req, synth),
    subtitle: synth.subtitle,
    clientDisplayName: req.clientDisplayName,
    initiativeDisplayName: req.initiativeDisplayName,
    generatedSections: sections,
    tables,
    exhibits: expectedExhibitsForProfile(req, options.brief),
    sourceRegister: buildSourceRegister(evidence, sections),
    assumptions: req.approvedAssumptions ?? [],
    clientCompleteChecklist: checklist,
    recommendation: synth.recommendation ?? '',
    nextActions: synth.nextActions ?? [],
  };
}

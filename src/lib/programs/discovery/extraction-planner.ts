// =============================================================================
// Discovery Intake — extraction planner (S3)
// -----------------------------------------------------------------------------
// Pure router: take an already-parsed `ExtractedProgramEvidence` (from the
// evidence-ingestion pipeline) and route its structured candidates into
// `DiscoveryShape` fields — each carrying upload provenance + a review-pending
// state — and emit a RECEIPT that NAMES EVERY STAGE: staged → parsed → extracted
// → routed → review.
//
// The contract (per the Admin ingestion-quality lane): "extracted" never means
// "uploaded". The receipt exposes exactly what happened at each stage, which
// fields were populated, what's review-pending, and what stayed evidence-only —
// nothing is faked into a field, and no downstream stage is claimed if it didn't
// run. No DB, no parsing, no LLM here — file parse + persistence are S3b.
// =============================================================================

import type { ExtractedProgramEvidence } from '../evidence-ingestion';
import {
  captureField,
  emptyDiscoveryShape,
  type DiscoveryShape,
  type LandscapeFact,
  type Confidence,
} from './discovery-intake';
import {
  readDiscoveryShapeFromCharter,
  embedDiscoveryShapeInCharter,
} from './charter-transformers';

export type StageStatus = 'done' | 'partial' | 'skipped' | 'failed';

export interface ExtractionStage {
  stage: 'staged' | 'parsed' | 'extracted' | 'routed' | 'review';
  status: StageStatus;
  detail: string;
}

export interface RoutedField {
  field: keyof DiscoveryShape;
  count: number;
  review: 'confirmed' | 'review_pending';
  provenance: string;
}

export interface ExtractionReceipt {
  sourceFile: string;
  evidenceType: string;
  parseMethod: string;
  warnings: string[];
  /** Every stage, named — done / partial / skipped / failed. */
  stages: ExtractionStage[];
  /** Fields that received values. */
  routed: RoutedField[];
  reviewPendingCount: number;
  /** Candidates kept as evidence only — NOT routed to a field (never faked in). */
  unmapped: string[];
  summary: string;
}

function domainForEvidenceType(t: string): string {
  switch (t) {
    case 'architecture_inventory':
      return 'architecture';
    case 'baseline_evidence':
      return 'baseline';
    default:
      return t;
  }
}

function confidenceBand(n: number): Confidence {
  if (n >= 0.8) return 'high';
  if (n >= 0.5) return 'medium';
  return 'low';
}

/**
 * Route a parsed evidence item into a DiscoveryShape and produce its receipt.
 * Pure + deterministic — the same inputs always yield the same shape + receipt.
 */
export function planDiscoveryExtraction(
  evidence: ExtractedProgramEvidence,
  shape: DiscoveryShape,
  opts: { sourceFile: string },
): { shape: DiscoveryShape; receipt: ExtractionReceipt } {
  const s = evidence.extractedStructured;
  const { sourceFile } = opts;

  // ---- route: baseline candidates → landscape facts (upload → review-pending) ----
  const domain = domainForEvidenceType(evidence.evidenceType);
  const newFacts: LandscapeFact[] = s.baseline_candidates.map((c) => ({
    domain,
    system: c,
    source: 'upload' as const,
    review: 'review_pending' as const,
  }));

  let nextShape = shape;
  const routed: RoutedField[] = [];
  if (newFacts.length > 0) {
    const merged = [...(shape.landscape.value ?? []), ...newFacts];
    nextShape = {
      ...shape,
      landscape: captureField(shape.landscape, merged, 'upload', {
        provenance: sourceFile,
        confidence: confidenceBand(evidence.confidence),
      }),
    };
    routed.push({
      field: 'landscape',
      count: newFacts.length,
      review: 'review_pending',
      provenance: sourceFile,
    });
  }

  // ---- unmapped: candidates kept as evidence only (reported, never faked in) ----
  const unmapped: string[] = [
    ...s.decisions.map((d) => `decision: ${d}`),
    ...s.action_items.map((a) => `action: ${a}`),
    ...s.risks.map((r) => `risk: ${r}`),
  ];

  const totalExtracted =
    s.baseline_candidates.length + s.decisions.length + s.action_items.length + s.risks.length;
  const parseOk =
    s.parse_method !== '' && s.parse_method !== 'none' && s.parse_method !== 'failed';

  const stages: ExtractionStage[] = [
    { stage: 'staged', status: 'done', detail: `${sourceFile} received` },
    {
      stage: 'parsed',
      status: parseOk ? 'done' : 'failed',
      detail: `parse_method=${s.parse_method || 'none'}${s.warnings.length ? ` · ${s.warnings.length} warning(s)` : ''}`,
    },
    {
      stage: 'extracted',
      status: totalExtracted > 0 ? 'done' : 'partial',
      detail: `${totalExtracted} candidate(s)`,
    },
    {
      stage: 'routed',
      status: newFacts.length > 0 ? 'done' : 'skipped',
      detail: `${newFacts.length} routed to landscape; ${unmapped.length} kept as evidence only`,
    },
    {
      stage: 'review',
      status: newFacts.length > 0 ? 'done' : 'skipped',
      detail: `${newFacts.length} field value(s) review-pending`,
    },
  ];

  const receipt: ExtractionReceipt = {
    sourceFile,
    evidenceType: evidence.evidenceType,
    parseMethod: s.parse_method || 'none',
    warnings: s.warnings,
    stages,
    routed,
    reviewPendingCount: newFacts.length,
    unmapped,
    summary:
      `Extracted ${totalExtracted} candidate(s) from ${sourceFile}; routed ${newFacts.length} ` +
      `to landscape (review-pending); ${unmapped.length} kept as evidence only.`,
  };

  return { shape: nextShape, receipt };
}

/**
 * Orchestration (S3b): apply a parsed evidence item to a Move's charter JSONB.
 * Reads the current DiscoveryShape from the charter (or starts empty), routes
 * the evidence through `planDiscoveryExtraction`, and embeds the updated shape
 * back — returning the new charter + the receipt. Pure: the route (S3c) does the
 * load/parse/persist around this; this is the deterministic, testable middle.
 */
export function applyEvidenceToCharter(
  charter: Record<string, unknown> | null,
  evidence: ExtractedProgramEvidence,
  opts: { sourceFile: string },
): { charter: Record<string, unknown>; receipt: ExtractionReceipt } {
  const currentShape = readDiscoveryShapeFromCharter(charter) ?? emptyDiscoveryShape();
  const { shape, receipt } = planDiscoveryExtraction(evidence, currentShape, opts);
  const updatedCharter = embedDiscoveryShapeInCharter(charter ?? {}, shape);
  return { charter: updatedCharter, receipt };
}

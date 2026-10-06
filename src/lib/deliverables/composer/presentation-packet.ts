/**
 * The frozen presentation packet: the only thing the composer is given.
 *
 * Content-addressed, so "which inputs produced this deck" has an answer that
 * survives the run. Reproducibility for this pipeline is defined as *the same
 * stored composer source over the same stored packet reconstructs the deck* —
 * not *re-run the model and expect the same bytes*. Once generated, the model's
 * output is a governed input and is versioned like one.
 *
 * Nothing writable goes in. No credentials, no connection strings, no real
 * client identity — the cover name only.
 */

import { createHash } from 'node:crypto';
import type { RenderableDeliverable } from '../orchestrator/types';
import type { DerivedFigure, LedgerEntry } from './number-ledger';

export interface PresentationPacket {
  artifactVersionId: string;
  artifactType: string;
  moveId: string;
  tenantKey: string;
  audience: string[];
  decisionSupported: string;
  clientDisplayName: string;
  initiativeDisplayName: string;
  title: string;
  subtitle?: string;
  recommendation: string;
  nextActions: string[];
  sections: { factId: string; title: string; bodyMarkdown: string; citationsUsed: number[] }[];
  tables: { key: string; title: string; columns: string[]; rows: string[][] }[];
  exhibits: { key: string; title: string; kind: string; description: string; data?: unknown }[];
  figures: LedgerEntry[];
  assumptions: { key: string; statement: string }[];
  evidenceGaps: string[];
  sources: { citationNumber: number; label: string; asOf?: string }[];
  calendarYears: number[];
  calendarDates: string[];
  theme: { version: string };
  slideGuidance: { min: number; max: number; purpose: string };
}

export interface FrozenPacket {
  packet: PresentationPacket;
  packetHash: string;
  canonicalJson: string;
}

/**
 * Stable stringify: object keys sorted at every depth.
 *
 * A hash over JSON.stringify's insertion order would change when an upstream map
 * is rebuilt in a different order, and an audit trail whose identity depends on
 * that is not an audit trail.
 */
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(',')}}`;
}

export interface FreezeInput {
  document: RenderableDeliverable;
  ledger: LedgerEntry[];
  artifactVersionId: string;
  artifactType: string;
  moveId: string;
  tenantKey: string;
  audience: string[];
  decisionSupported: string;
  slideGuidance: { min: number; max: number; purpose: string };
  themeVersion: string;
}

const YEAR = /\b(19|20)\d{2}\b/g;
const ISO_DATE = /\b(?:19|20)\d{2}-\d{2}-\d{2}\b/g;

export function freezePresentationPacket(input: FreezeInput): FrozenPacket {
  const { document: doc } = input;

  // Years the governed artifact already carries. The lineage gate exempts a bare
  // year only if it is one of these — otherwise "by 2031" is an invented date
  // wearing the clothes of calendar scaffolding.
  const calendarYears = new Set<number>();
  const calendarDates = new Set<string>();
  const harvest = (text: string) => {
    for (const m of text.matchAll(ISO_DATE)) calendarDates.add(m[0]);
    for (const m of text.matchAll(YEAR)) calendarYears.add(Number(m[0]));
  };
  doc.generatedSections.forEach((s) => harvest(s.bodyMarkdown));
  doc.tables.forEach((t) => t.rows.forEach((r) => r.forEach(harvest)));
  input.ledger.forEach((f) => f.formattedVariants.forEach(harvest));

  const packet: PresentationPacket = {
    artifactVersionId: input.artifactVersionId,
    artifactType: input.artifactType,
    moveId: input.moveId,
    tenantKey: input.tenantKey,
    audience: input.audience,
    decisionSupported: input.decisionSupported,
    clientDisplayName: doc.clientDisplayName,
    initiativeDisplayName: doc.initiativeDisplayName,
    title: doc.title,
    ...(doc.subtitle !== undefined ? { subtitle: doc.subtitle } : {}),
    recommendation: doc.recommendation,
    nextActions: doc.nextActions,
    sections: doc.generatedSections.map((s) => ({
      factId: s.key,
      title: s.title,
      bodyMarkdown: s.bodyMarkdown,
      citationsUsed: s.citationsUsed,
    })),
    tables: doc.tables.map((t) => ({
      key: t.key,
      title: t.title,
      columns: t.columns,
      rows: t.rows,
    })),
    exhibits: doc.exhibits.map((e) => ({
      key: e.key,
      title: e.title,
      kind: e.kind,
      description: e.description,
      ...(e.data !== undefined ? { data: e.data } : {}),
    })),
    figures: input.ledger,
    assumptions: doc.assumptions.map((a) => ({ key: a.key, statement: a.statement })),
    evidenceGaps: doc.clientCompleteChecklist.map((c) => c.label ?? String(c)),
    sources: doc.sourceRegister.map((s) => ({
      citationNumber: s.citationNumber,
      label: s.label,
      ...(s.asOf !== undefined ? { asOf: s.asOf } : {}),
    })),
    calendarYears: [...calendarYears].sort((a, b) => a - b),
    calendarDates: [...calendarDates].sort(),
    theme: { version: input.themeVersion },
    slideGuidance: input.slideGuidance,
  };

  const canonicalJson = canonicalize(packet);
  return {
    packet,
    canonicalJson,
    packetHash: createHash('sha256').update(canonicalJson).digest('hex'),
  };
}

export function sha256(buffer: Buffer | string): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/** One slide of the model's plan. Intent, never coordinates. */
export interface SlideStoryPlanEntry {
  slideId: string;
  title: string;
  purpose: string;
  decisionContribution: string;
  sourceFactIds: string[];
  figureIds: string[];
  visualIntent: string;
  slideType: 'cover' | 'divider' | 'content' | 'appendix';
  designation: 'core' | 'appendix';
}

export interface ComposerOutput {
  slideStoryPlan: SlideStoryPlanEntry[];
  derivedFigures: DerivedFigure[];
  pythonSource: string;
}

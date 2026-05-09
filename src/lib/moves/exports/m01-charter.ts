// Moves exports · M01 Charter document renderer — stub.
//
// Produces a DOCX Charter document for a strategic Move at the M01
// approval gate. Uses the same shared infrastructure as Source's
// narrative renderers (src/lib/exports-shared/) so Moves and Source
// share a single docx pipeline.
//
// Status: stub with placeholder section content. The Moves substrate
// schema is not yet defined; every section below is a TODO marker
// for the substrate-binding work that will land alongside Slice M.1
// (first real Move artifact end-to-end).
//
// Slice 8.1.2 — rewritten to use Source's v3 helpers after the
// exports-shared bases were unified on the Source pattern.

import 'server-only';

import { Document, Packer } from 'docx';

import {
  ORDERED_NUMBERING_CONFIG,
  bodyParagraph,
  bodyRun,
  coverSubtitleParagraph,
  coverTitleParagraph,
  eyebrowParagraph,
  heading1,
  heading2,
} from '@/lib/exports-shared/docx-base';
import { buildKeyValueTable } from '@/lib/exports-shared/structured-docx-base';

// ── Spec types ────────────────────────────────────────────────────────────

/**
 * Top-level envelope for M01 Charter document generation.
 *
 * TODO: fill from Move substrate — replace placeholder fields with
 * typed references to the Move substrate schema when it is defined.
 */
export interface M01CharterSpec {
  /** Display string shown in the document eyebrow. */
  eyebrow: string;
  /** Tenant key (broker key, e.g. 'apex-retail'). */
  tenantKey: string;
  /** Move identifier (e.g. 'M01'). */
  moveId: string;
  /** Document title rendered on the cover page. */
  documentTitle: string;
  /** ISO 8601 generated-at. */
  generatedAt: string;
  /** Move sponsor name + role. */
  sponsor: string;
}

// ── Builder ───────────────────────────────────────────────────────────────

/**
 * Build the M01 Charter Document. Pure (spec → Document); the route
 * serializes via docx.Packer.toBuffer.
 *
 * TODO: every section below currently uses placeholder content. Replace
 * with real Move-substrate-bound content once the substrate ships.
 */
export function buildM01CharterDocument(spec: M01CharterSpec): Document {
  return new Document({
    creator: 'AbarVa · Sentinel',
    title: `${spec.documentTitle} · ${spec.moveId}`,
    description: `M01 Charter for Move ${spec.moveId}.`,
    numbering: ORDERED_NUMBERING_CONFIG,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children: [
          // Cover
          eyebrowParagraph(spec.eyebrow),
          coverTitleParagraph(spec.documentTitle),
          coverSubtitleParagraph(`Tenant: ${spec.tenantKey}`),
          coverSubtitleParagraph(`Move ID: ${spec.moveId}`),
          coverSubtitleParagraph(`Sponsor: ${spec.sponsor}`),
          coverSubtitleParagraph(`Generated: ${spec.generatedAt}`),
          // Section 1
          heading1('1 · Value hypothesis'),
          bodyParagraph([
            bodyRun(
              'TODO: fill from Move substrate — cohort × current pain × behavior change × value direction × causal mechanism.',
            ),
          ]),
          // Section 2
          heading1('2 · KPI baseline'),
          buildKeyValueTable({
            rows: [
              { label: 'Primary KPI', value: 'TODO: bind to substrate' },
              { label: 'Baseline value', value: 'TODO: bind to substrate' },
              { label: 'Target value', value: 'TODO: bind to substrate' },
              { label: 'Measurement cadence', value: 'TODO: bind to substrate' },
            ],
            labelWidth: 35,
          }),
          // Section 3
          heading1('3 · Scope boundary'),
          heading2('In scope'),
          bodyParagraph([
            bodyRun('TODO: in-scope bullet list from substrate.'),
          ]),
          heading2('Out of scope'),
          bodyParagraph([
            bodyRun('TODO: out-of-scope bullet list from substrate.'),
          ]),
          // Section 4
          heading1('4 · Named dissenter'),
          bodyParagraph([
            bodyRun('TODO: named dissenter from substrate.'),
          ]),
          // Section 5
          heading1('5 · Kill criterion'),
          bodyParagraph([
            bodyRun(
              'TODO: kill criterion (specific signal that triggers a stop) from substrate.',
            ),
          ]),
          // Section 6
          heading1('6 · Succession owner'),
          bodyParagraph([
            bodyRun(
              'TODO: succession owner (named individual who carries the move if the sponsor leaves) from substrate.',
            ),
          ]),
          // Section 7
          heading1('7 · Sign-off'),
          buildKeyValueTable({
            rows: [
              { label: 'Sponsor', value: spec.sponsor },
              { label: 'Date', value: spec.generatedAt.slice(0, 10) },
              { label: 'Signature', value: '' },
            ],
            labelWidth: 30,
            editableValues: true,
          }),
        ],
      },
    ],
  });
}

/** Convenience: build + serialize. */
export async function renderM01CharterDocx(spec: M01CharterSpec): Promise<Buffer> {
  const doc = buildM01CharterDocument(spec);
  return Packer.toBuffer(doc) as unknown as Promise<Buffer>;
}

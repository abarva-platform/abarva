// Source · DeliverableSpec dispatcher (Slice 8.2).
//
// Adapter layer that lets callers render Source artifacts via the
// SourceDeliverableSpec envelope (matching the Programs pattern) while
// reusing all the existing renderer + payload code from Slices 2-7.
//
// Why an adapter (vs. rewriting every renderer to take the new spec):
//   - Existing renderers are battle-tested in 10+ artifacts × 4
//     formats × prod verification. Rewriting their signatures is
//     mechanical churn with regression risk.
//   - The adapter lets us migrate kinds one at a time. Slice 8.2
//     wires `scope-memo`; Slice 8.3 wires the remaining 10 kinds.
//   - The eventual goal of Slice 8.5 is to inline the renderers into
//     the dispatch cases (delete the legacy payload binders + per-
//     format wrappers). The adapter is a stepping-stone, not the
//     final shape.
//
// Today's coverage (Slice 8.2):
//   - kind: 'scope-memo' × format: docx | html | pdf
//
// Returns a `DeliverableRenderResult` matching the Programs pipeline
// shape so a future unified Source route can return one type for any
// artifact × format combination.

import 'server-only';

import { Packer } from 'docx';

import type { DeliverableFormat } from '@/lib/programs/exports/types';
import type { SourceDeliverableSpec, SourceDeliverableKind } from './types';
import { routeFormat } from './format-router';

import {
  buildNarrativeDocx,
  SCOPE_MEMO_DOCX_CONFIG,
  type NarrativeDocxConfig,
  type NarrativeDocxPayload,
} from './renderers/narrative-docx';
import { buildNarrativeHtml } from './renderers/narrative-html';

import { DOCX_CONTENT_TYPE } from '@/lib/exports-shared/docx-base';
import { HTML_CONTENT_TYPE } from './renderers/narrative-html';
// PDF content type inlined so the dispatcher's static import graph
// stays free of @react-pdf/renderer (pure ESM; breaks jest under CJS).
const PDF_CONTENT_TYPE = 'application/pdf';

/** Result returned by every adapter call — matches Programs' shape. */
export interface SourceDeliverableRenderResult {
  format: DeliverableFormat;
  buffer: Buffer;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

/**
 * Per-kind narrow payload type. Slice 8.2 starts with scope-memo;
 * subsequent slices add the rest. The legacy NarrativeDocxPayload is
 * what each narrative renderer accepts under the hood — these narrow
 * types are the spec.payload shape callers use.
 */
export interface ScopeMemoPayload {
  /** Event code (e.g. MERI-CLOUD-2026). */
  eventCode: string;
  /** Event name — used as the cover title. */
  eventName: string;
  /** Free-form issued-by block; optional. */
  issuedBy?: string;
  /** Markdown body — authored or canonical-scaffold. */
  body: string;
  /** True when body came from authored content; false = canonical scaffold. */
  bodyIsAuthored: boolean;
}

/**
 * Convenience type alias for the `scope-memo` kind. Future kinds get
 * their own narrow alias here as Slice 8.3 progresses.
 *
 * Re-declares all SourceDeliverableSpec fields explicitly so the
 * payload narrowing satisfies the assignment constraint when callers
 * pass a ScopeMemoSpec where a SourceDeliverableSpec is expected.
 */
export interface ScopeMemoSpec {
  kind: 'scope-memo';
  tenantKey: string;
  sourceEventId: string;
  title: string;
  subtitle?: string;
  generatedAt?: string;
  authors?: string[];
  brandSubtitle?: string;
  variant?: string;
  payload: ScopeMemoPayload;
}

/**
 * Render a SourceDeliverableSpec to bytes + content-type + filename.
 * Uses `routeFormat` to pick the format if `requestedFormat` is unset.
 */
export async function renderSourceDeliverable(
  spec: SourceDeliverableSpec,
  requestedFormat?: DeliverableFormat,
): Promise<SourceDeliverableRenderResult> {
  const format = routeFormat(spec.kind, requestedFormat);

  switch (spec.kind) {
    case 'scope-memo':
      return renderScopeMemo(spec as unknown as ScopeMemoSpec, format);
    default:
      throw new Error(
        `Source dispatcher does not yet handle kind "${spec.kind}". ` +
          `Slice 8.2 covers scope-memo only; Slice 8.3 adds the rest.`,
      );
  }
}

// ── Per-kind adapters ──────────────────────────────────────────────────────

async function renderScopeMemo(
  spec: ScopeMemoSpec,
  format: DeliverableFormat,
): Promise<SourceDeliverableRenderResult> {
  const legacyPayload = scopeMemoSpecToLegacyPayload(spec);
  const config: NarrativeDocxConfig = SCOPE_MEMO_DOCX_CONFIG;
  const filenameDate = (spec.generatedAt ?? new Date().toISOString()).slice(0, 10);
  const filename = `d05_scope_memo__${spec.payload.eventCode}__${filenameDate}.${format}`;

  switch (format) {
    case 'docx': {
      const doc = buildNarrativeDocx(legacyPayload, config);
      const buffer = (await Packer.toBuffer(doc)) as unknown as Buffer;
      return makeResult('docx', buffer, filename, DOCX_CONTENT_TYPE);
    }
    case 'html': {
      const html = buildNarrativeHtml(legacyPayload, config);
      const buffer = Buffer.from(html, 'utf8');
      return makeResult('html', buffer, filename, HTML_CONTENT_TYPE);
    }
    case 'pdf': {
      // PDF goes through dynamic import to keep @react-pdf/renderer
      // (pure ESM) out of the dispatcher's static import graph —
      // otherwise jest can't load the dispatch module at all.
      const { buildNarrativePdf } = await import('./renderers/narrative-pdf');
      const { pdf: reactPdf } = await import('@react-pdf/renderer');
      const element = buildNarrativePdf(legacyPayload, config);
      const stream = await reactPdf(element).toBuffer();
      const chunks: Buffer[] = [];
      for await (const chunk of stream as AsyncIterable<Buffer | string>) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const buffer = Buffer.concat(chunks);
      return makeResult('pdf', buffer, filename, PDF_CONTENT_TYPE);
    }
    default:
      throw new Error(`scope-memo does not support format "${format}"`);
  }
}

// ── Spec → legacy-payload converters ───────────────────────────────────────

function scopeMemoSpecToLegacyPayload(spec: ScopeMemoSpec): NarrativeDocxPayload {
  return {
    tenantName: spec.tenantKey,
    eventCode: spec.payload.eventCode,
    eventName: spec.payload.eventName,
    issuedBy: spec.payload.issuedBy,
    generatedAt: spec.generatedAt ?? new Date().toISOString(),
    body: spec.payload.body,
    bodyIsAuthored: spec.payload.bodyIsAuthored,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function makeResult(
  format: DeliverableFormat,
  buffer: Buffer,
  filename: string,
  contentType: string,
): SourceDeliverableRenderResult {
  return {
    format,
    buffer,
    filename,
    contentType,
    sizeBytes: buffer.byteLength,
  };
}

// SourceDeliverableKind reference to keep the import tied to the type
// system — narrows future kinds back into this dispatcher.
const _kindRef: SourceDeliverableKind = 'scope-memo';
void _kindRef;

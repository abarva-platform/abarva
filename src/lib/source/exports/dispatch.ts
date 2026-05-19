// Source · DeliverableSpec dispatcher (Slices 8.2 + 8.3).
//
// Adapter layer that lets callers render Source artifacts via the
// SourceDeliverableSpec envelope (matching the Programs pattern) while
// reusing the existing renderer + payload code from Slices 2-7.
//
// The dispatcher covers all 11 SourceDeliverableKinds:
//
//   Narrative kinds (4)         × format: docx | html | pdf
//     scope-memo / rfp-package / decision-brief / selection-memo
//   Structured-data kinds (7)   × format: xlsx | docx | pdf
//     app-inventory / response-checklist / scorecard /
//     pricing-template / pricing-comparison / trap-log /
//     bafo-question-pack
//
// Slice G7 closed the format-parity gap: every structured artifact
// now renders a readable docx + pdf alongside its xlsx working
// surface, so a board pack never has to embed a spreadsheet.
//
// Returns a `SourceDeliverableRenderResult` matching the Programs
// `DeliverableRenderResult` shape so the unified route in Slice 8.4
// can return one type for any artifact × format combination.

import 'server-only';

import { Packer } from 'docx';
import type { Workbook } from 'exceljs';

import type { DeliverableFormat } from '@/lib/programs/exports/types';
import type { SourceDeliverableSpec, SourceDeliverableKind } from './types';
import { routeFormat } from './format-router';

// ── Renderer imports ──────────────────────────────────────────────────────

import {
  buildNarrativeDocx,
  SCOPE_MEMO_DOCX_CONFIG,
  RFP_PACK_DOCX_CONFIG,
  DECISION_BRIEF_DOCX_CONFIG,
  SELECTION_MEMO_DOCX_CONFIG,
  type NarrativeDocxConfig,
  type NarrativeDocxPayload,
} from './renderers/narrative-docx';
import { buildNarrativeHtml } from './renderers/narrative-html';

import {
  buildAppInventoryWorkbook,
  type AppInventoryPayload,
} from './renderers/app-inventory';
import { buildAppInventoryDocx } from './renderers/app-inventory-docx';

import {
  buildResponseChecklistWorkbook,
  type ResponseChecklistPayload,
} from './renderers/response-checklist';
import { buildResponseChecklistDocx } from './renderers/response-checklist-docx';

import {
  buildScorecardWorkbook,
  type ScorecardPayload,
} from './renderers/scorecard';
import { buildScorecardDocx } from './renderers/scorecard-docx';

import {
  buildPricingTemplateWorkbook,
  type PricingTemplatePayload,
} from './renderers/pricing-template';
import { buildPricingTemplateDocx } from './renderers/pricing-template-docx';
import {
  buildPricingComparisonWorkbook,
  type PricingComparisonPayload,
} from './renderers/pricing-comparison';
import { buildPricingComparisonDocx } from './renderers/pricing-comparison-docx';
import {
  buildTrapLogWorkbook,
  type TrapLogPayload,
} from './renderers/trap-log';
import { buildTrapLogDocx } from './renderers/trap-log-docx';
import {
  buildBafoQuestionPackWorkbook,
  type BafoQuestionPackPayload,
} from './renderers/bafo-question-pack';
import { buildBafoQuestionPackDocx } from './renderers/bafo-question-pack-docx';

import { DOCX_CONTENT_TYPE } from '@/lib/exports-shared/docx-base';
import { HTML_CONTENT_TYPE } from './renderers/narrative-html';
import { XLSX_CONTENT_TYPE } from '@/lib/exports-shared/xlsx-base';
// PDF content type inlined so the dispatcher's static import graph
// stays free of @react-pdf/renderer (pure ESM; breaks jest under CJS).
const PDF_CONTENT_TYPE = 'application/pdf';

// ── Result shape ──────────────────────────────────────────────────────────

/** Result returned by every adapter call — matches Programs' shape. */
export interface SourceDeliverableRenderResult {
  format: DeliverableFormat;
  buffer: Buffer;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

// ── Per-kind narrow payload types ─────────────────────────────────────────

/** Common fields every Source narrative kind carries. */
interface NarrativeBasePayload {
  eventCode: string;
  eventName: string;
  issuedBy?: string;
  body: string;
  bodyIsAuthored: boolean;
}

export type ScopeMemoPayload = NarrativeBasePayload;
export type RfpPackagePayload = NarrativeBasePayload;
export type DecisionBriefPayload = NarrativeBasePayload;
export type SelectionMemoPayload = NarrativeBasePayload;

/**
 * Per-kind spec aliases. Each is structurally identical to
 * SourceDeliverableSpec but narrows kind + payload.
 */
export interface ScopeMemoSpec extends BaseSourceSpec {
  kind: 'scope-memo';
  payload: ScopeMemoPayload;
}
export interface RfpPackageSpec extends BaseSourceSpec {
  kind: 'rfp-package';
  payload: RfpPackagePayload;
}
export interface DecisionBriefSpec extends BaseSourceSpec {
  kind: 'decision-brief';
  payload: DecisionBriefPayload;
}
export interface SelectionMemoSpec extends BaseSourceSpec {
  kind: 'selection-memo';
  payload: SelectionMemoPayload;
}
export interface AppInventorySpec extends BaseSourceSpec {
  kind: 'app-inventory';
  payload: AppInventoryPayload;
}
export interface ResponseChecklistSpec extends BaseSourceSpec {
  kind: 'response-checklist';
  payload: ResponseChecklistPayload;
}
export interface ScorecardSpec extends BaseSourceSpec {
  kind: 'scorecard';
  payload: ScorecardPayload;
}
export interface PricingTemplateSpec extends BaseSourceSpec {
  kind: 'pricing-template';
  payload: PricingTemplatePayload;
}
export interface PricingComparisonSpec extends BaseSourceSpec {
  kind: 'pricing-comparison';
  payload: PricingComparisonPayload;
}
export interface TrapLogSpec extends BaseSourceSpec {
  kind: 'trap-log';
  payload: TrapLogPayload;
}
export interface BafoQuestionPackSpec extends BaseSourceSpec {
  kind: 'bafo-question-pack';
  payload: BafoQuestionPackPayload;
}

interface BaseSourceSpec {
  tenantKey: string;
  sourceEventId: string;
  title: string;
  subtitle?: string;
  generatedAt?: string;
  authors?: string[];
  brandSubtitle?: string;
  variant?: string;
}

// ── Top-level dispatcher ──────────────────────────────────────────────────

/**
 * Render a SourceDeliverableSpec to bytes + content-type + filename.
 * Uses `routeFormat` to pick the format if `requestedFormat` is unset.
 */
export async function renderSourceDeliverable(
  spec: SourceDeliverableSpec,
  requestedFormat?: DeliverableFormat,
): Promise<SourceDeliverableRenderResult> {
  const format = routeFormat(spec.kind, requestedFormat);
  const filename = filenameFor(spec, format);
  const generatedAt = spec.generatedAt ?? new Date().toISOString();

  switch (spec.kind) {
    // Narrative kinds — share the same renderer set, differ only by config
    case 'scope-memo':
      return renderNarrative(spec, SCOPE_MEMO_DOCX_CONFIG, format, filename, generatedAt);
    case 'rfp-package':
      return renderNarrative(spec, RFP_PACK_DOCX_CONFIG, format, filename, generatedAt);
    case 'decision-brief':
      return renderNarrative(spec, DECISION_BRIEF_DOCX_CONFIG, format, filename, generatedAt);
    case 'selection-memo':
      return renderNarrative(spec, SELECTION_MEMO_DOCX_CONFIG, format, filename, generatedAt);

    // Structured-data kinds — xlsx (canonical data surface) + docx + pdf
    // (readable renderings of the same content).
    case 'app-inventory':
      return renderAppInventory(spec as unknown as AppInventorySpec, format, filename);
    case 'response-checklist':
      return renderResponseChecklist(spec as unknown as ResponseChecklistSpec, format, filename);
    case 'scorecard':
      return renderScorecard(spec as unknown as ScorecardSpec, format, filename);
    case 'pricing-template':
      return renderPricingTemplate(spec as unknown as PricingTemplateSpec, format, filename);
    case 'pricing-comparison':
      return renderPricingComparison(spec as unknown as PricingComparisonSpec, format, filename);
    case 'trap-log':
      return renderTrapLog(spec as unknown as TrapLogSpec, format, filename);
    case 'bafo-question-pack':
      return renderBafoQuestionPack(spec as unknown as BafoQuestionPackSpec, format, filename);

    default: {
      const _exhaustive: never = spec.kind;
      throw new Error(`Unknown SourceDeliverableKind: ${_exhaustive}`);
    }
  }
}

// ── Narrative renderer (4 kinds: scope-memo / rfp-package / decision-brief / selection-memo) ─

async function renderNarrative(
  spec: SourceDeliverableSpec,
  config: NarrativeDocxConfig,
  format: DeliverableFormat,
  filename: string,
  generatedAt: string,
): Promise<SourceDeliverableRenderResult> {
  const payload = spec.payload as unknown as NarrativeBasePayload;
  const legacyPayload: NarrativeDocxPayload = {
    tenantName: spec.tenantKey,
    eventCode: payload.eventCode,
    eventName: payload.eventName,
    issuedBy: payload.issuedBy,
    generatedAt,
    body: payload.body,
    bodyIsAuthored: payload.bodyIsAuthored,
  };

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
      // Dynamic import keeps @react-pdf/renderer (ESM) out of the
      // dispatcher's static import graph so jest can load this module.
      const { buildNarrativePdf } = await import('./renderers/narrative-pdf');
      const { pdf: reactPdf } = await import('@react-pdf/renderer');
      const element = buildNarrativePdf(legacyPayload, config);
      const stream = await reactPdf(element).toBuffer();
      const chunks: Buffer[] = [];
      for await (const chunk of stream as AsyncIterable<Buffer | string>) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      return makeResult('pdf', Buffer.concat(chunks), filename, PDF_CONTENT_TYPE);
    }
    default:
      throw new Error(`Narrative kind does not support format "${format}"`);
  }
}

// ── Structured-data renderers (xlsx + docx + pdf) ──────────────────────────

async function renderAppInventory(
  spec: AppInventorySpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === 'xlsx') {
    return renderXlsxOnly(buildAppInventoryWorkbook(spec.payload), format, filename);
  }
  if (format === 'docx') {
    return docxResult(buildAppInventoryDocx(spec.payload), filename);
  }
  if (format === 'pdf') {
    const { buildAppInventoryPdf } = await import('./renderers/app-inventory-pdf');
    return pdfResult(buildAppInventoryPdf(spec.payload), filename);
  }
  throw new Error(`app-inventory does not support format "${format}"`);
}

async function renderResponseChecklist(
  spec: ResponseChecklistSpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === 'xlsx') {
    return renderXlsxOnly(buildResponseChecklistWorkbook(spec.payload), format, filename);
  }
  if (format === 'docx') {
    return docxResult(buildResponseChecklistDocx(spec.payload), filename);
  }
  if (format === 'pdf') {
    const { buildResponseChecklistPdf } = await import('./renderers/response-checklist-pdf');
    return pdfResult(buildResponseChecklistPdf(spec.payload), filename);
  }
  throw new Error(`response-checklist does not support format "${format}"`);
}

async function renderScorecard(
  spec: ScorecardSpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === 'xlsx') {
    return renderXlsxOnly(buildScorecardWorkbook(spec.payload), format, filename);
  }
  if (format === 'docx') {
    return docxResult(buildScorecardDocx(spec.payload), filename);
  }
  if (format === 'pdf') {
    const { buildScorecardPdf } = await import('./renderers/scorecard-pdf');
    return pdfResult(buildScorecardPdf(spec.payload), filename);
  }
  throw new Error(`scorecard does not support format "${format}"`);
}

async function renderPricingTemplate(
  spec: PricingTemplateSpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === 'xlsx') {
    return renderXlsxOnly(buildPricingTemplateWorkbook(spec.payload), format, filename);
  }
  if (format === 'docx') {
    return docxResult(buildPricingTemplateDocx(spec.payload), filename);
  }
  if (format === 'pdf') {
    const { buildPricingTemplatePdf } = await import('./renderers/pricing-template-pdf');
    return pdfResult(buildPricingTemplatePdf(spec.payload), filename);
  }
  throw new Error(`pricing-template does not support format "${format}"`);
}

async function renderPricingComparison(
  spec: PricingComparisonSpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === 'xlsx') {
    return renderXlsxOnly(buildPricingComparisonWorkbook(spec.payload), format, filename);
  }
  if (format === 'docx') {
    return docxResult(buildPricingComparisonDocx(spec.payload), filename);
  }
  if (format === 'pdf') {
    const { buildPricingComparisonPdf } = await import('./renderers/pricing-comparison-pdf');
    return pdfResult(buildPricingComparisonPdf(spec.payload), filename);
  }
  throw new Error(`pricing-comparison does not support format "${format}"`);
}

async function renderTrapLog(
  spec: TrapLogSpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === 'xlsx') {
    return renderXlsxOnly(buildTrapLogWorkbook(spec.payload), format, filename);
  }
  if (format === 'docx') {
    return docxResult(buildTrapLogDocx(spec.payload), filename);
  }
  if (format === 'pdf') {
    const { buildTrapLogPdf } = await import('./renderers/trap-log-pdf');
    return pdfResult(buildTrapLogPdf(spec.payload), filename);
  }
  throw new Error(`trap-log does not support format "${format}"`);
}

async function renderBafoQuestionPack(
  spec: BafoQuestionPackSpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === 'xlsx') {
    return renderXlsxOnly(buildBafoQuestionPackWorkbook(spec.payload), format, filename);
  }
  if (format === 'docx') {
    return docxResult(buildBafoQuestionPackDocx(spec.payload), filename);
  }
  if (format === 'pdf') {
    const { buildBafoQuestionPackPdf } = await import('./renderers/bafo-question-pack-pdf');
    return pdfResult(buildBafoQuestionPackPdf(spec.payload), filename);
  }
  throw new Error(`bafo-question-pack does not support format "${format}"`);
}

// ── docx + pdf serialization helpers ───────────────────────────────────────

async function docxResult(
  doc: import('docx').Document,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  const buffer = (await Packer.toBuffer(doc)) as unknown as Buffer;
  return makeResult('docx', buffer, filename, DOCX_CONTENT_TYPE);
}

/**
 * Serialize a react-pdf element to bytes. @react-pdf/renderer is pure
 * ESM; we dynamic-import it here so the dispatcher's static import
 * graph stays CJS-loadable under jest.
 */
async function pdfResult(
  element: import('react').ReactElement<import('@react-pdf/renderer').DocumentProps>,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  const { pdf: reactPdf } = await import('@react-pdf/renderer');
  const stream = await reactPdf(element).toBuffer();
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return makeResult('pdf', Buffer.concat(chunks), filename, PDF_CONTENT_TYPE);
}

// ── xlsx common path ──────────────────────────────────────────────────────

async function renderXlsxOnly(
  workbook: Workbook,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format !== 'xlsx') {
    throw new Error(`This kind only supports xlsx, got "${format}"`);
  }
  const arrayBuf = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuf as ArrayBuffer);
  return makeResult('xlsx', buffer, filename, XLSX_CONTENT_TYPE);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function filenameFor(
  spec: SourceDeliverableSpec,
  format: DeliverableFormat,
): string {
  const dateStamp = (spec.generatedAt ?? new Date().toISOString()).slice(0, 10);
  const codeSegment = artifactCodeForKind(spec.kind);
  return `${codeSegment}__${spec.sourceEventId}__${dateStamp}.${format}`;
}

function artifactCodeForKind(kind: SourceDeliverableKind): string {
  switch (kind) {
    case 'scope-memo': return 'd05_scope_memo';
    case 'rfp-package': return 'd09_rfp_pack';
    case 'decision-brief': return 'd24_decision_brief';
    case 'selection-memo': return 'd27_selection_memo';
    case 'app-inventory': return 'd04_app_inv';
    case 'response-checklist': return 'd11_response_checklist';
    case 'scorecard': return 'd16_scorecard';
    case 'pricing-template': return 'd19_pricing_workbook';
    case 'pricing-comparison': return 'd19_pricing_comparison';
    case 'trap-log': return 'd20_trap_log';
    case 'bafo-question-pack': return 'd22_bafo_question_pack';
  }
}

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

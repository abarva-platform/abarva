// Source · xlsx + docx exports · public surface
//
// Server-only registry mapping artifact codes to their xlsx and docx
// renderers. Slice 2a-c shipped the xlsx surface (d04 / d11 / d16 / d19
// + d19c comparison). Slice 3 adds the docx surface, starting with d05
// Scope Memo.

import 'server-only';

import type ExcelJS from 'exceljs';
import type { Document as DocxDocument } from 'docx';

import {
  buildPricingTemplateWorkbook,
  type PricingTemplatePayload,
} from './renderers/pricing-template';
import {
  DECISION_BRIEF_DOCX_CONFIG,
  RFP_PACK_DOCX_CONFIG,
  SCOPE_MEMO_DOCX_CONFIG,
  SELECTION_MEMO_DOCX_CONFIG,
  buildNarrativeDocx,
  type NarrativeDocxPayload,
} from './renderers/narrative-docx';
import { buildAppInventoryDocx } from './renderers/app-inventory-docx';
import { buildResponseChecklistDocx } from './renderers/response-checklist-docx';
import { buildScorecardDocx } from './renderers/scorecard-docx';
// Re-export the scope-memo type alias for backwards compat — the
// payload shape is identical to NarrativeDocxPayload.
import type { ScopeMemoDocxPayload } from './renderers/scope-memo-docx';
import {
  DECISION_BRIEF_HTML_CONFIG,
  RFP_PACK_HTML_CONFIG,
  SCOPE_MEMO_HTML_CONFIG,
  SELECTION_MEMO_HTML_CONFIG,
  buildNarrativeHtml,
  type NarrativeHtmlConfig,
  type NarrativeHtmlPayload,
} from './renderers/narrative-html';
import {
  DECISION_BRIEF_PDF_CONFIG,
  RFP_PACK_PDF_CONFIG,
  SCOPE_MEMO_PDF_CONFIG,
  SELECTION_MEMO_PDF_CONFIG,
  buildNarrativePdf,
  type NarrativePdfConfig,
  type NarrativePdfPayload,
} from './renderers/narrative-pdf';
import {
  buildPricingComparisonWorkbook,
  type PricingComparisonPayload,
} from './renderers/pricing-comparison';
import {
  buildAppInventoryWorkbook,
  type AppInventoryPayload,
} from './renderers/app-inventory';
import {
  buildResponseChecklistWorkbook,
  type ResponseChecklistPayload,
} from './renderers/response-checklist';
import {
  buildScorecardWorkbook,
  type ScorecardPayload,
} from './renderers/scorecard';

export { XLSX_CONTENT_TYPE } from './renderers/xlsx-base';
export { DOCX_CONTENT_TYPE } from './renderers/docx-base';
export { HTML_CONTENT_TYPE } from './renderers/narrative-html';
export { PDF_CONTENT_TYPE } from './renderers/pdf-base';

/**
 * Codes for which Source has an xlsx generator. Surfaces in the UI as
 * the set of artifacts that show a "Download xlsx template" button.
 */
export const XLSX_GENERATABLE_CODES = new Set([
  'd04_app_inv',
  'd11_response_checklist',
  'd16_scorecard',
  'd19_pricing_workbook',
]);

/**
 * Artifact codes for which a "comparison" mode is available — i.e. a
 * second xlsx that aggregates vendor submissions side-by-side. Today
 * only d19 (pricing). Surfaces a separate "Download comparison xlsx"
 * anchor in the canvas alongside the standard template anchor.
 */
export const XLSX_COMPARISON_CODES = new Set(['d19_pricing_workbook']);

/**
 * Codes for which Source has a docx renderer. Surfaces a "Download
 * docx" anchor on the artifact card. Slice 3.x shipped narrative
 * artifacts (d05/d09/d24/d27); Slice 5 adds the structured-data
 * artifacts (d04/d11/d16) — same payload binders as their xlsx
 * counterparts; renderers translate to docx tables + sections.
 */
export const DOCX_GENERATABLE_CODES = new Set([
  'd04_app_inv',
  'd05_scope_memo',
  'd09_rfp_pack',
  'd11_response_checklist',
  'd16_scorecard',
  'd24_decision_brief',
  'd27_selection_memo',
]);

/**
 * Codes for which Source has an HTML renderer. Slice 4.1 covers the
 * same narrative artifacts as docx so the buyer can share a viewable
 * link in addition to the downloadable docx file.
 */
export const HTML_GENERATABLE_CODES = new Set([
  'd05_scope_memo',
  'd09_rfp_pack',
  'd24_decision_brief',
  'd27_selection_memo',
]);

/**
 * Codes for which Source has a PDF renderer. Slice 4.2 covers the same
 * narrative artifacts so every long-form deliverable has a print-ready
 * PDF available for sharing / archiving.
 */
export const PDF_GENERATABLE_CODES = new Set([
  'd05_scope_memo',
  'd09_rfp_pack',
  'd24_decision_brief',
  'd27_selection_memo',
]);

export function isXlsxGeneratable(artifactCode: string): boolean {
  return XLSX_GENERATABLE_CODES.has(artifactCode);
}

export function hasXlsxComparison(artifactCode: string): boolean {
  return XLSX_COMPARISON_CODES.has(artifactCode);
}

export function isDocxGeneratable(artifactCode: string): boolean {
  return DOCX_GENERATABLE_CODES.has(artifactCode);
}

export function isHtmlGeneratable(artifactCode: string): boolean {
  return HTML_GENERATABLE_CODES.has(artifactCode);
}

export function isPdfGeneratable(artifactCode: string): boolean {
  return PDF_GENERATABLE_CODES.has(artifactCode);
}

export interface RenderXlsxArgs {
  artifactCode: string;
  payload: unknown;
  /**
   * Variant. `template` is the buyer-issued empty template (default).
   * `comparison` aggregates vendor submissions (currently d19 only).
   */
  variant?: 'template' | 'comparison';
}

/**
 * Build the xlsx workbook for an artifact code. The route serializes
 * the workbook to bytes; this stays pure.
 */
export async function renderArtifactXlsx(
  args: RenderXlsxArgs,
): Promise<ExcelJS.Workbook> {
  const variant = args.variant ?? 'template';
  if (variant === 'comparison') {
    if (args.artifactCode !== 'd19_pricing_workbook') {
      throw new Error(
        `No comparison generator wired for ${args.artifactCode}. ` +
          `Supported: ${Array.from(XLSX_COMPARISON_CODES).join(', ')}.`,
      );
    }
    return buildPricingComparisonWorkbook(
      args.payload as PricingComparisonPayload,
    );
  }
  switch (args.artifactCode) {
    case 'd19_pricing_workbook':
      return buildPricingTemplateWorkbook(
        args.payload as PricingTemplatePayload,
      );
    case 'd04_app_inv':
      return buildAppInventoryWorkbook(args.payload as AppInventoryPayload);
    case 'd11_response_checklist':
      return buildResponseChecklistWorkbook(
        args.payload as ResponseChecklistPayload,
      );
    case 'd16_scorecard':
      return buildScorecardWorkbook(args.payload as ScorecardPayload);
    default:
      throw new Error(
        `No xlsx generator wired for ${args.artifactCode}. ` +
          `Supported codes: ${Array.from(XLSX_GENERATABLE_CODES).join(', ')}.`,
      );
  }
}

export interface RenderDocxArgs {
  artifactCode: string;
  payload: unknown;
}

/**
 * Build a docx Document for an artifact code. The route serializes via
 * docx.Packer.toBuffer; this stays pure.
 */
export async function renderArtifactDocx(
  args: RenderDocxArgs,
): Promise<DocxDocument> {
  switch (args.artifactCode) {
    // Narrative artifacts — markdown body → docx via the walker.
    case 'd05_scope_memo':
      return buildNarrativeDocx(args.payload as NarrativeDocxPayload, SCOPE_MEMO_DOCX_CONFIG);
    case 'd09_rfp_pack':
      return buildNarrativeDocx(args.payload as NarrativeDocxPayload, RFP_PACK_DOCX_CONFIG);
    case 'd24_decision_brief':
      return buildNarrativeDocx(args.payload as NarrativeDocxPayload, DECISION_BRIEF_DOCX_CONFIG);
    case 'd27_selection_memo':
      return buildNarrativeDocx(args.payload as NarrativeDocxPayload, SELECTION_MEMO_DOCX_CONFIG);
    // Structured-data artifacts — typed payload (same as xlsx) →
    // docx via per-artifact section/table renderers.
    case 'd04_app_inv':
      return buildAppInventoryDocx(args.payload as AppInventoryPayload);
    case 'd11_response_checklist':
      return buildResponseChecklistDocx(args.payload as ResponseChecklistPayload);
    case 'd16_scorecard':
      return buildScorecardDocx(args.payload as ScorecardPayload);
    default:
      throw new Error(
        `No docx generator wired for ${args.artifactCode}. ` +
          `Supported codes: ${Array.from(DOCX_GENERATABLE_CODES).join(', ')}.`,
      );
  }
}

export interface RenderHtmlArgs {
  artifactCode: string;
  payload: unknown;
}

/**
 * Build the HTML string for an artifact code. The route returns the
 * string with a text/html content-type; this stays pure.
 */
export function renderArtifactHtml(args: RenderHtmlArgs): string {
  const payload = args.payload as NarrativeHtmlPayload;
  switch (args.artifactCode) {
    case 'd05_scope_memo':
      return buildNarrativeHtml(payload, SCOPE_MEMO_HTML_CONFIG);
    case 'd09_rfp_pack':
      return buildNarrativeHtml(payload, RFP_PACK_HTML_CONFIG);
    case 'd24_decision_brief':
      return buildNarrativeHtml(payload, DECISION_BRIEF_HTML_CONFIG);
    case 'd27_selection_memo':
      return buildNarrativeHtml(payload, SELECTION_MEMO_HTML_CONFIG);
    default:
      throw new Error(
        `No HTML generator wired for ${args.artifactCode}. ` +
          `Supported codes: ${Array.from(HTML_GENERATABLE_CODES).join(', ')}.`,
      );
  }
}

export interface RenderPdfArgs {
  artifactCode: string;
  payload: unknown;
}

/**
 * Build a React element representing a PDF document for an artifact
 * code. The route serializes via @react-pdf/renderer's `pdf().toBuffer()`.
 * Pure: returns a React element, no I/O.
 */
export function renderArtifactPdf(args: RenderPdfArgs): import('react').ReactElement<import('@react-pdf/renderer').DocumentProps> {
  const payload = args.payload as NarrativePdfPayload;
  switch (args.artifactCode) {
    case 'd05_scope_memo':
      return buildNarrativePdf(payload, SCOPE_MEMO_PDF_CONFIG);
    case 'd09_rfp_pack':
      return buildNarrativePdf(payload, RFP_PACK_PDF_CONFIG);
    case 'd24_decision_brief':
      return buildNarrativePdf(payload, DECISION_BRIEF_PDF_CONFIG);
    case 'd27_selection_memo':
      return buildNarrativePdf(payload, SELECTION_MEMO_PDF_CONFIG);
    default:
      throw new Error(
        `No PDF generator wired for ${args.artifactCode}. ` +
          `Supported codes: ${Array.from(PDF_GENERATABLE_CODES).join(', ')}.`,
      );
  }
}

export type {
  AppInventoryPayload,
  NarrativeHtmlConfig,
  NarrativeHtmlPayload,
  NarrativePdfConfig,
  NarrativePdfPayload,
  PricingComparisonPayload,
  PricingTemplatePayload,
  ResponseChecklistPayload,
  ScopeMemoDocxPayload,
  ScorecardPayload,
};

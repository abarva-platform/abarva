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
  buildScopeMemoDocx,
  type ScopeMemoDocxPayload,
} from './renderers/scope-memo-docx';
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
 * docx" anchor on the artifact card. Slice 3 starts with d05; future
 * slices add d09 / d24 / d27.
 */
export const DOCX_GENERATABLE_CODES = new Set([
  'd05_scope_memo',
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
    case 'd05_scope_memo':
      return buildScopeMemoDocx(args.payload as ScopeMemoDocxPayload);
    default:
      throw new Error(
        `No docx generator wired for ${args.artifactCode}. ` +
          `Supported codes: ${Array.from(DOCX_GENERATABLE_CODES).join(', ')}.`,
      );
  }
}

export type {
  AppInventoryPayload,
  PricingComparisonPayload,
  PricingTemplatePayload,
  ResponseChecklistPayload,
  ScopeMemoDocxPayload,
  ScorecardPayload,
};

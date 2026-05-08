// Source · xlsx exports · public surface
//
// Server-only registry mapping artifact codes to their xlsx renderers.
// Slice 2 ships d19a (Pricing Template) only; future slices add d16
// scorecard, d04 app inventory, d11 response checklist.

import 'server-only';

import type ExcelJS from 'exceljs';

import {
  buildPricingTemplateWorkbook,
  type PricingTemplatePayload,
} from './renderers/pricing-template';

export { XLSX_CONTENT_TYPE } from './renderers/xlsx-base';

/**
 * Codes for which Source has an xlsx generator. Surfaces in the UI as
 * the set of artifacts that show a "Download xlsx template" button.
 */
export const XLSX_GENERATABLE_CODES = new Set([
  'd19_pricing_workbook',
]);

export function isXlsxGeneratable(artifactCode: string): boolean {
  return XLSX_GENERATABLE_CODES.has(artifactCode);
}

export interface RenderXlsxArgs {
  artifactCode: string;
  payload: unknown;
}

/**
 * Build the xlsx workbook for an artifact code. The route serializes
 * the workbook to bytes; this stays pure.
 */
export async function renderArtifactXlsx(
  args: RenderXlsxArgs,
): Promise<ExcelJS.Workbook> {
  switch (args.artifactCode) {
    case 'd19_pricing_workbook':
      return buildPricingTemplateWorkbook(
        args.payload as PricingTemplatePayload,
      );
    default:
      throw new Error(
        `No xlsx generator wired for ${args.artifactCode}. ` +
          `Supported codes: ${Array.from(XLSX_GENERATABLE_CODES).join(', ')}.`,
      );
  }
}

export type { PricingTemplatePayload };

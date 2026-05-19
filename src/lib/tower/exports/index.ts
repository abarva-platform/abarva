// Tower · outcome / measurement report exports · public surface
//
// G8 — the Control Tower surface previously produced nothing
// downloadable. This module is the single entry point for the Tower
// outcome-report DOCX (narrative) and XLSX (metrics tables) renderers,
// mirroring src/lib/source/exports/index.ts.

import 'server-only';

import type ExcelJS from 'exceljs';
import type { Document as DocxDocument } from 'docx';

import { buildTowerOutcomeReportDocx } from './outcome-report-docx';
import { buildTowerOutcomeReportWorkbook } from './outcome-report-xlsx';
import type { TowerOutcomeReportPayload } from './outcome-report-payload';

export { DOCX_CONTENT_TYPE } from '@/lib/exports-shared/docx-base';
export { XLSX_CONTENT_TYPE } from '@/lib/exports-shared/xlsx-base';

export type {
  TowerOutcomeReportInput,
  TowerOutcomeReportPayload,
  TowerOutcomeKpiInput,
} from './outcome-report-payload';
export { buildTowerOutcomeReportPayload } from './outcome-report-payload';

/** Build the narrative outcome-report Document. Pure. */
export function renderTowerOutcomeReportDocx(
  payload: TowerOutcomeReportPayload,
): DocxDocument {
  return buildTowerOutcomeReportDocx(payload);
}

/** Build the measurement / metrics workbook. Pure. */
export function renderTowerOutcomeReportXlsx(
  payload: TowerOutcomeReportPayload,
): ExcelJS.Workbook {
  return buildTowerOutcomeReportWorkbook(payload);
}

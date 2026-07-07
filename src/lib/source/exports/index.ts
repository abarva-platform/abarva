// Source · xlsx + docx exports · public surface
//
// Server-only registry mapping artifact codes to their xlsx and docx
// renderers. Slice 2a-c shipped the xlsx surface (d04 / d11 / d16 / d19
// + d19c comparison). Slice 3 adds the docx surface, starting with d05
// Scope Memo.

import "server-only";

import type ExcelJS from "exceljs";
import type { Document as DocxDocument } from "docx";

import {
  buildPricingTemplateWorkbook,
  type PricingTemplatePayload,
} from "./renderers/pricing-template";
import {
  DECISION_BRIEF_DOCX_CONFIG,
  DEMAND_CHALLENGE_DOCX_CONFIG,
  RFP_PACK_DOCX_CONFIG,
  SCOPE_MEMO_DOCX_CONFIG,
  SELECTION_MEMO_DOCX_CONFIG,
  SOURCING_APPROACH_DOCX_CONFIG,
  STRATEGY_MEMO_DOCX_CONFIG,
  VENDOR_RESPONSE_PACK_DOCX_CONFIG,
  VENDOR_RISK_PACK_DOCX_CONFIG,
  buildNarrativeDocx,
  type NarrativeDocxPayload,
} from "./renderers/narrative-docx";
import { buildAppInventoryDocx } from "./renderers/app-inventory-docx";
import { buildResponseChecklistDocx } from "./renderers/response-checklist-docx";
import { buildScorecardDocx } from "./renderers/scorecard-docx";
import { buildPricingTemplateDocx } from "./renderers/pricing-template-docx";
import { buildTrapLogDocx } from "./renderers/trap-log-docx";
import { buildBafoQuestionPackDocx } from "./renderers/bafo-question-pack-docx";
// Re-export the scope-memo type alias for backwards compat — the
// payload shape is identical to NarrativeDocxPayload.
import type { ScopeMemoDocxPayload } from "./renderers/scope-memo-docx";
import {
  DECISION_BRIEF_HTML_CONFIG,
  PRICING_WORKBOOK_SUMMARY_HTML_CONFIG,
  RFP_PACK_HTML_CONFIG,
  SCOPE_MEMO_HTML_CONFIG,
  SELECTION_MEMO_HTML_CONFIG,
  STRATEGY_MEMO_HTML_CONFIG,
  VENDOR_RESPONSE_PACK_HTML_CONFIG,
  buildNarrativeHtml,
  type NarrativeHtmlConfig,
  type NarrativeHtmlPayload,
} from "./renderers/narrative-html";
import {
  DECISION_BRIEF_PDF_CONFIG,
  DEMAND_CHALLENGE_PDF_CONFIG,
  RFP_PACK_PDF_CONFIG,
  SCOPE_MEMO_PDF_CONFIG,
  SELECTION_MEMO_PDF_CONFIG,
  SOURCING_APPROACH_PDF_CONFIG,
  STRATEGY_MEMO_PDF_CONFIG,
  VENDOR_RESPONSE_PACK_PDF_CONFIG,
  VENDOR_RISK_PACK_PDF_CONFIG,
  buildNarrativePdf,
  type NarrativePdfConfig,
  type NarrativePdfPayload,
} from "./renderers/narrative-pdf";
import { buildAppInventoryPdf } from "./renderers/app-inventory-pdf";
import { buildResponseChecklistPdf } from "./renderers/response-checklist-pdf";
import { buildScorecardPdf } from "./renderers/scorecard-pdf";
import { buildPricingTemplatePdf } from "./renderers/pricing-template-pdf";
import { buildTrapLogPdf } from "./renderers/trap-log-pdf";
import { buildBafoQuestionPackPdf } from "./renderers/bafo-question-pack-pdf";
import {
  buildPricingComparisonWorkbook,
  type PricingComparisonPayload,
} from "./renderers/pricing-comparison";
import {
  buildAppInventoryWorkbook,
  type AppInventoryPayload,
} from "./renderers/app-inventory";
import {
  buildResponseChecklistWorkbook,
  type ResponseChecklistPayload,
} from "./renderers/response-checklist";
import {
  buildScorecardWorkbook,
  type ScorecardPayload,
} from "./renderers/scorecard";
import {
  buildTrapLogWorkbook,
  type TrapLogPayload,
} from "./renderers/trap-log";
import {
  buildBafoQuestionPackWorkbook,
  type BafoQuestionPackPayload,
} from "./renderers/bafo-question-pack";
import {
  buildMarketScanWorkbook,
  type MarketScanPayload,
} from "./renderers/market-scan";
import { buildMarketScanDocx } from "./renderers/market-scan-docx";
import { buildMarketScanPdf } from "./renderers/market-scan-pdf";
import {
  buildTcoIcebergWorkbook,
  type TcoIcebergPayload,
} from "./renderers/tco-iceberg";
import { buildTcoIcebergDocx } from "./renderers/tco-iceberg-docx";
import { buildTcoIcebergPdf } from "./renderers/tco-iceberg-pdf";
import {
  buildAiClauseGapWorkbook,
  type AiClauseGapPayload,
} from "./renderers/ai-clause-gap";
import { buildAiClauseGapDocx } from "./renderers/ai-clause-gap-docx";
import { buildAiClauseGapPdf } from "./renderers/ai-clause-gap-pdf";
import { buildAiClauseGapHtml } from "./renderers/ai-clause-gap-html";
import {
  buildRenewalDecisionWorkbook,
  type RenewalDecisionPayload,
} from "./renderers/renewal-decision";
import { buildRenewalDecisionDocx } from "./renderers/renewal-decision-docx";
import { buildRenewalDecisionPdf } from "./renderers/renewal-decision-pdf";

export { XLSX_CONTENT_TYPE } from "@/lib/exports-shared/xlsx-base";
export { DOCX_CONTENT_TYPE } from "@/lib/exports-shared/docx-base";
export { HTML_CONTENT_TYPE } from "./renderers/narrative-html";
export { PDF_CONTENT_TYPE } from "@/lib/exports-shared/pdf-base";

/**
 * Codes for which Source has an xlsx generator. Surfaces in the UI as
 * the set of artifacts that show a "Download xlsx template" button.
 */
export const XLSX_GENERATABLE_CODES = new Set([
  "d04_app_inv",
  "d11_response_checklist",
  "d16_scorecard",
  "d19_pricing_workbook",
  "d20_trap_log",
  "d22_bafo_question_pack",
  // Lifecycle-coverage wave — 4 structured artifacts with xlsx as their
  // canonical working surface.
  "dx2_market_scan",
  "dx4_tco_iceberg",
  "dx6a_ai_clause_gap",
  "dx7_renewal_decision",
]);

/**
 * Artifact codes for which a "comparison" mode is available — i.e. a
 * second xlsx that aggregates vendor submissions side-by-side. Today
 * only d19 (pricing). Surfaces a separate "Download comparison xlsx"
 * anchor in the canvas alongside the standard template anchor.
 */
export const XLSX_COMPARISON_CODES = new Set(["d19_pricing_workbook"]);

/**
 * Codes for which Source has a docx renderer. Surfaces a "Download
 * docx" anchor on the artifact card. Slice 3.x shipped narrative
 * artifacts (d05/d09/d24/d27); Slice 5 added the structured-data
 * artifacts (d04/d11/d16). Slice G7 closes the parity gap — d19
 * (pricing), d20 (trap log) and d22 (BAFO) now ship a readable docx
 * rendering alongside their canonical xlsx working surface.
 */
export const DOCX_GENERATABLE_CODES = new Set([
  "d01_strategy_memo",
  "d04_app_inv",
  "d05_scope_memo",
  "d09_rfp_pack",
  "d11_response_checklist",
  "d13_vendor_responses",
  "d16_scorecard",
  "d19_pricing_workbook",
  "d20_trap_log",
  "d22_bafo_question_pack",
  "d24_decision_brief",
  "d27_selection_memo",
  // Lifecycle-coverage wave — all 7 new artifacts produce docx.
  "dx0_demand_challenge",
  "dx1_sourcing_approach",
  "dx2_market_scan",
  "dx4_tco_iceberg",
  "dx6a_ai_clause_gap",
  "dx6b_vendor_risk_pack",
  "dx7_renewal_decision",
]);

/**
 * Codes for which Source has an HTML renderer. Slice 4.1 covers the
 * same narrative artifacts as docx so the buyer can share a viewable
 * link in addition to the downloadable docx file.
 */
export const HTML_GENERATABLE_CODES = new Set([
  "d01_strategy_memo",
  "d05_scope_memo",
  "d09_rfp_pack",
  "d13_vendor_responses",
  "d19_pricing_workbook",
  "d24_decision_brief",
  "d27_selection_memo",
  // Lifecycle-coverage wave — only the AI Clause Gap ships as a
  // shareable HTML link; the other lifecycle artifacts have no HTML
  // share use case yet.
  "dx6a_ai_clause_gap",
]);

/**
 * Codes for which Source has a PDF renderer. Slice 4.2 shipped the
 * narrative artifacts (d05/d09/d24/d27). Slice G7 closes the parity
 * gap — every structured artifact (d04/d11/d16/d19/d20/d22) now ships
 * a print-ready PDF rendering of the same content its xlsx carries,
 * so a board pack never has to embed a spreadsheet.
 */
export const PDF_GENERATABLE_CODES = new Set([
  "d01_strategy_memo",
  "d04_app_inv",
  "d05_scope_memo",
  "d09_rfp_pack",
  "d11_response_checklist",
  "d13_vendor_responses",
  "d16_scorecard",
  "d19_pricing_workbook",
  "d20_trap_log",
  "d22_bafo_question_pack",
  "d24_decision_brief",
  "d27_selection_memo",
  // Lifecycle-coverage wave — every new artifact has a PDF surface.
  "dx0_demand_challenge",
  "dx1_sourcing_approach",
  "dx2_market_scan",
  "dx4_tco_iceberg",
  "dx6a_ai_clause_gap",
  "dx6b_vendor_risk_pack",
  "dx7_renewal_decision",
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
  variant?: "template" | "comparison";
}

/**
 * Build the xlsx workbook for an artifact code. The route serializes
 * the workbook to bytes; this stays pure.
 */
export async function renderArtifactXlsx(
  args: RenderXlsxArgs,
): Promise<ExcelJS.Workbook> {
  const variant = args.variant ?? "template";
  if (variant === "comparison") {
    if (args.artifactCode !== "d19_pricing_workbook") {
      throw new Error(
        `No comparison generator wired for ${args.artifactCode}. ` +
          `Supported: ${Array.from(XLSX_COMPARISON_CODES).join(", ")}.`,
      );
    }
    return buildPricingComparisonWorkbook(
      args.payload as PricingComparisonPayload,
    );
  }
  switch (args.artifactCode) {
    case "d19_pricing_workbook":
      return buildPricingTemplateWorkbook(
        args.payload as PricingTemplatePayload,
      );
    case "d04_app_inv":
      return buildAppInventoryWorkbook(args.payload as AppInventoryPayload);
    case "d11_response_checklist":
      return buildResponseChecklistWorkbook(
        args.payload as ResponseChecklistPayload,
      );
    case "d16_scorecard":
      return buildScorecardWorkbook(args.payload as ScorecardPayload);
    case "d20_trap_log":
      return buildTrapLogWorkbook(args.payload as TrapLogPayload);
    case "d22_bafo_question_pack":
      return buildBafoQuestionPackWorkbook(
        args.payload as BafoQuestionPackPayload,
      );
    case "dx2_market_scan":
      return buildMarketScanWorkbook(args.payload as MarketScanPayload);
    case "dx4_tco_iceberg":
      return buildTcoIcebergWorkbook(args.payload as TcoIcebergPayload);
    case "dx6a_ai_clause_gap":
      return buildAiClauseGapWorkbook(args.payload as AiClauseGapPayload);
    case "dx7_renewal_decision":
      return buildRenewalDecisionWorkbook(
        args.payload as RenewalDecisionPayload,
      );
    default:
      throw new Error(
        `No xlsx generator wired for ${args.artifactCode}. ` +
          `Supported codes: ${Array.from(XLSX_GENERATABLE_CODES).join(", ")}.`,
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
    case "d01_strategy_memo":
      return buildNarrativeDocx(
        args.payload as NarrativeDocxPayload,
        STRATEGY_MEMO_DOCX_CONFIG,
      );
    case "d05_scope_memo":
      return buildNarrativeDocx(
        args.payload as NarrativeDocxPayload,
        SCOPE_MEMO_DOCX_CONFIG,
      );
    case "d09_rfp_pack":
      return buildNarrativeDocx(
        args.payload as NarrativeDocxPayload,
        RFP_PACK_DOCX_CONFIG,
      );
    case "d13_vendor_responses":
      return buildNarrativeDocx(
        args.payload as NarrativeDocxPayload,
        VENDOR_RESPONSE_PACK_DOCX_CONFIG,
      );
    case "d24_decision_brief":
      return buildNarrativeDocx(
        args.payload as NarrativeDocxPayload,
        DECISION_BRIEF_DOCX_CONFIG,
      );
    case "d27_selection_memo":
      return buildNarrativeDocx(
        args.payload as NarrativeDocxPayload,
        SELECTION_MEMO_DOCX_CONFIG,
      );
    case "dx0_demand_challenge":
      return buildNarrativeDocx(
        args.payload as NarrativeDocxPayload,
        DEMAND_CHALLENGE_DOCX_CONFIG,
      );
    case "dx1_sourcing_approach":
      return buildNarrativeDocx(
        args.payload as NarrativeDocxPayload,
        SOURCING_APPROACH_DOCX_CONFIG,
      );
    case "dx6b_vendor_risk_pack":
      return buildNarrativeDocx(
        args.payload as NarrativeDocxPayload,
        VENDOR_RISK_PACK_DOCX_CONFIG,
      );
    // Structured-data artifacts — typed payload (same as xlsx) →
    // docx via per-artifact section/table renderers.
    case "d04_app_inv":
      return buildAppInventoryDocx(args.payload as AppInventoryPayload);
    case "d11_response_checklist":
      return buildResponseChecklistDocx(
        args.payload as ResponseChecklistPayload,
      );
    case "d16_scorecard":
      return buildScorecardDocx(args.payload as ScorecardPayload);
    case "d19_pricing_workbook":
      return buildPricingTemplateDocx(args.payload as PricingTemplatePayload);
    case "d20_trap_log":
      return buildTrapLogDocx(args.payload as TrapLogPayload);
    case "d22_bafo_question_pack":
      return buildBafoQuestionPackDocx(args.payload as BafoQuestionPackPayload);
    case "dx2_market_scan":
      return buildMarketScanDocx(args.payload as MarketScanPayload);
    case "dx4_tco_iceberg":
      return buildTcoIcebergDocx(args.payload as TcoIcebergPayload);
    case "dx6a_ai_clause_gap":
      return buildAiClauseGapDocx(args.payload as AiClauseGapPayload);
    case "dx7_renewal_decision":
      return buildRenewalDecisionDocx(args.payload as RenewalDecisionPayload);
    default:
      throw new Error(
        `No docx generator wired for ${args.artifactCode}. ` +
          `Supported codes: ${Array.from(DOCX_GENERATABLE_CODES).join(", ")}.`,
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
    case "d01_strategy_memo":
      return buildNarrativeHtml(payload, STRATEGY_MEMO_HTML_CONFIG);
    case "d05_scope_memo":
      return buildNarrativeHtml(payload, SCOPE_MEMO_HTML_CONFIG);
    case "d09_rfp_pack":
      return buildNarrativeHtml(payload, RFP_PACK_HTML_CONFIG);
    case "d13_vendor_responses":
      return buildNarrativeHtml(payload, VENDOR_RESPONSE_PACK_HTML_CONFIG);
    case "d19_pricing_workbook":
      return buildNarrativeHtml(payload, PRICING_WORKBOOK_SUMMARY_HTML_CONFIG);
    case "d24_decision_brief":
      return buildNarrativeHtml(payload, DECISION_BRIEF_HTML_CONFIG);
    case "d27_selection_memo":
      return buildNarrativeHtml(payload, SELECTION_MEMO_HTML_CONFIG);
    case "dx6a_ai_clause_gap":
      // AI Clause Gap is structured but ships an HTML rendering too —
      // share-link friendly for legal-counsel review without xlsx.
      return buildAiClauseGapHtml(args.payload as AiClauseGapPayload);
    default:
      throw new Error(
        `No HTML generator wired for ${args.artifactCode}. ` +
          `Supported codes: ${Array.from(HTML_GENERATABLE_CODES).join(", ")}.`,
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
export function renderArtifactPdf(
  args: RenderPdfArgs,
): import("react").ReactElement<import("@react-pdf/renderer").DocumentProps> {
  switch (args.artifactCode) {
    // Narrative artifacts — markdown body → react-pdf via the walker.
    case "d01_strategy_memo":
      return buildNarrativePdf(
        args.payload as NarrativePdfPayload,
        STRATEGY_MEMO_PDF_CONFIG,
      );
    case "d05_scope_memo":
      return buildNarrativePdf(
        args.payload as NarrativePdfPayload,
        SCOPE_MEMO_PDF_CONFIG,
      );
    case "d09_rfp_pack":
      return buildNarrativePdf(
        args.payload as NarrativePdfPayload,
        RFP_PACK_PDF_CONFIG,
      );
    case "d13_vendor_responses":
      return buildNarrativePdf(
        args.payload as NarrativePdfPayload,
        VENDOR_RESPONSE_PACK_PDF_CONFIG,
      );
    case "d24_decision_brief":
      return buildNarrativePdf(
        args.payload as NarrativePdfPayload,
        DECISION_BRIEF_PDF_CONFIG,
      );
    case "d27_selection_memo":
      return buildNarrativePdf(
        args.payload as NarrativePdfPayload,
        SELECTION_MEMO_PDF_CONFIG,
      );
    case "dx0_demand_challenge":
      return buildNarrativePdf(
        args.payload as NarrativePdfPayload,
        DEMAND_CHALLENGE_PDF_CONFIG,
      );
    case "dx1_sourcing_approach":
      return buildNarrativePdf(
        args.payload as NarrativePdfPayload,
        SOURCING_APPROACH_PDF_CONFIG,
      );
    case "dx6b_vendor_risk_pack":
      return buildNarrativePdf(
        args.payload as NarrativePdfPayload,
        VENDOR_RISK_PACK_PDF_CONFIG,
      );
    // Structured-data artifacts — typed payload (same as xlsx) →
    // react-pdf via per-artifact section/table renderers.
    case "d04_app_inv":
      return buildAppInventoryPdf(args.payload as AppInventoryPayload);
    case "d11_response_checklist":
      return buildResponseChecklistPdf(
        args.payload as ResponseChecklistPayload,
      );
    case "d16_scorecard":
      return buildScorecardPdf(args.payload as ScorecardPayload);
    case "d19_pricing_workbook":
      return buildPricingTemplatePdf(args.payload as PricingTemplatePayload);
    case "d20_trap_log":
      return buildTrapLogPdf(args.payload as TrapLogPayload);
    case "d22_bafo_question_pack":
      return buildBafoQuestionPackPdf(args.payload as BafoQuestionPackPayload);
    case "dx2_market_scan":
      return buildMarketScanPdf(args.payload as MarketScanPayload);
    case "dx4_tco_iceberg":
      return buildTcoIcebergPdf(args.payload as TcoIcebergPayload);
    case "dx6a_ai_clause_gap":
      return buildAiClauseGapPdf(args.payload as AiClauseGapPayload);
    case "dx7_renewal_decision":
      return buildRenewalDecisionPdf(args.payload as RenewalDecisionPayload);
    default:
      throw new Error(
        `No PDF generator wired for ${args.artifactCode}. ` +
          `Supported codes: ${Array.from(PDF_GENERATABLE_CODES).join(", ")}.`,
      );
  }
}

export type {
  AiClauseGapPayload,
  AppInventoryPayload,
  BafoQuestionPackPayload,
  MarketScanPayload,
  NarrativeHtmlConfig,
  NarrativeHtmlPayload,
  NarrativePdfConfig,
  NarrativePdfPayload,
  PricingComparisonPayload,
  PricingTemplatePayload,
  RenewalDecisionPayload,
  ResponseChecklistPayload,
  ScopeMemoDocxPayload,
  ScorecardPayload,
  TcoIcebergPayload,
  TrapLogPayload,
};

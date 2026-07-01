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

import "server-only";

import { Packer } from "docx";
import type { Workbook } from "exceljs";

import type { DeliverableFormat } from "@/lib/programs/exports/types";
import type { SourceDeliverableSpec, SourceDeliverableKind } from "./types";
import { routeFormat } from "./format-router";
import { eventCodeFromSpec } from "./metadata";
import {
  AI_DECISION_SUPPORT_WATERMARK,
  HUMAN_DECISION_ATTESTATION_TEXT,
} from "@/lib/ai-liability/human-decision-controls";

// ── Renderer imports ──────────────────────────────────────────────────────

import {
  buildNarrativeDocx,
  STRATEGY_MEMO_DOCX_CONFIG,
  SCOPE_MEMO_DOCX_CONFIG,
  RFP_PACK_DOCX_CONFIG,
  VENDOR_RESPONSE_PACK_DOCX_CONFIG,
  PRICING_WORKBOOK_SUMMARY_DOCX_CONFIG,
  DECISION_BRIEF_DOCX_CONFIG,
  SELECTION_MEMO_DOCX_CONFIG,
  DEMAND_CHALLENGE_DOCX_CONFIG,
  SOURCING_APPROACH_DOCX_CONFIG,
  VENDOR_RISK_PACK_DOCX_CONFIG,
  type NarrativeDocxConfig,
  type NarrativeDocxPayload,
} from "./renderers/narrative-docx";
import { buildNarrativeHtml } from "./renderers/narrative-html";
import {
  buildMarketScanWorkbook,
  type MarketScanPayload,
} from "./renderers/market-scan";
import { buildMarketScanDocx } from "./renderers/market-scan-docx";
import {
  buildTcoIcebergWorkbook,
  type TcoIcebergPayload,
} from "./renderers/tco-iceberg";
import { buildTcoIcebergDocx } from "./renderers/tco-iceberg-docx";
import {
  buildAiClauseGapWorkbook,
  type AiClauseGapPayload,
} from "./renderers/ai-clause-gap";
import { buildAiClauseGapDocx } from "./renderers/ai-clause-gap-docx";
import { buildAiClauseGapHtml } from "./renderers/ai-clause-gap-html";
import {
  buildRenewalDecisionWorkbook,
  type RenewalDecisionPayload,
} from "./renderers/renewal-decision";
import { buildRenewalDecisionDocx } from "./renderers/renewal-decision-docx";

import {
  buildAppInventoryWorkbook,
  type AppInventoryPayload,
} from "./renderers/app-inventory";
import { buildAppInventoryDocx } from "./renderers/app-inventory-docx";

import {
  buildResponseChecklistWorkbook,
  type ResponseChecklistPayload,
} from "./renderers/response-checklist";
import { buildResponseChecklistDocx } from "./renderers/response-checklist-docx";

import {
  buildScorecardWorkbook,
  type ScorecardPayload,
} from "./renderers/scorecard";
import { buildScorecardDocx } from "./renderers/scorecard-docx";

import {
  buildPricingTemplateWorkbook,
  type PricingTemplatePayload,
} from "./renderers/pricing-template";
import { buildPricingTemplateDocx } from "./renderers/pricing-template-docx";
import {
  buildPricingComparisonWorkbook,
  type PricingComparisonPayload,
} from "./renderers/pricing-comparison";
import { buildPricingComparisonDocx } from "./renderers/pricing-comparison-docx";
import {
  buildTrapLogWorkbook,
  type TrapLogPayload,
} from "./renderers/trap-log";
import { buildTrapLogDocx } from "./renderers/trap-log-docx";
import {
  buildBafoQuestionPackWorkbook,
  type BafoQuestionPackPayload,
} from "./renderers/bafo-question-pack";
import { buildBafoQuestionPackDocx } from "./renderers/bafo-question-pack-docx";

import { DOCX_CONTENT_TYPE } from "@/lib/exports-shared/docx-base";
import { HTML_CONTENT_TYPE } from "./renderers/narrative-html";
import { XLSX_CONTENT_TYPE } from "@/lib/exports-shared/xlsx-base";
// PDF content type inlined so the dispatcher's static import graph
// stays free of @react-pdf/renderer (pure ESM; breaks jest under CJS).
const PDF_CONTENT_TYPE = "application/pdf";

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
  tenantName?: string;
  eventCode: string;
  eventName: string;
  issuedBy?: string;
  generatedAt?: string;
  body: string;
  bodyIsAuthored: boolean;
}

export type ScopeMemoPayload = NarrativeBasePayload;
export type StrategyMemoPayload = NarrativeBasePayload;
export type RfpPackagePayload = NarrativeBasePayload;
export type VendorResponsePackPayload = NarrativeBasePayload;
export type DecisionBriefPayload = NarrativeBasePayload;
export type SelectionMemoPayload = NarrativeBasePayload;

/**
 * Per-kind spec aliases. Each is structurally identical to
 * SourceDeliverableSpec but narrows kind + payload.
 */
export interface StrategyMemoSpec extends BaseSourceSpec {
  kind: "strategy-memo";
  payload: StrategyMemoPayload;
}
export interface ScopeMemoSpec extends BaseSourceSpec {
  kind: "scope-memo";
  payload: ScopeMemoPayload;
}
export interface RfpPackageSpec extends BaseSourceSpec {
  kind: "rfp-package";
  payload: RfpPackagePayload;
}
export interface VendorResponsePackSpec extends BaseSourceSpec {
  kind: "vendor-response-pack";
  payload: VendorResponsePackPayload;
}
export interface DecisionBriefSpec extends BaseSourceSpec {
  kind: "decision-brief";
  payload: DecisionBriefPayload;
}
export interface SelectionMemoSpec extends BaseSourceSpec {
  kind: "selection-memo";
  payload: SelectionMemoPayload;
}
export interface AppInventorySpec extends BaseSourceSpec {
  kind: "app-inventory";
  payload: AppInventoryPayload;
}
export interface ResponseChecklistSpec extends BaseSourceSpec {
  kind: "response-checklist";
  payload: ResponseChecklistPayload;
}
export interface ScorecardSpec extends BaseSourceSpec {
  kind: "scorecard";
  payload: ScorecardPayload;
}
export interface PricingTemplateSpec extends BaseSourceSpec {
  kind: "pricing-template";
  payload: PricingTemplatePayload;
}
export interface PricingComparisonSpec extends BaseSourceSpec {
  kind: "pricing-comparison";
  payload: PricingComparisonPayload;
}
export interface TrapLogSpec extends BaseSourceSpec {
  kind: "trap-log";
  payload: TrapLogPayload;
}
export interface BafoQuestionPackSpec extends BaseSourceSpec {
  kind: "bafo-question-pack";
  payload: BafoQuestionPackPayload;
}
export interface DemandChallengeSpec extends BaseSourceSpec {
  kind: "demand-challenge";
  payload: NarrativeBasePayload;
}
export interface SourcingApproachSpec extends BaseSourceSpec {
  kind: "sourcing-approach";
  payload: NarrativeBasePayload;
}
export interface VendorRiskPackSpec extends BaseSourceSpec {
  kind: "vendor-risk-pack";
  payload: NarrativeBasePayload;
}
export interface MarketScanSpec extends BaseSourceSpec {
  kind: "market-scan";
  payload: MarketScanPayload;
}
export interface TcoIcebergSpec extends BaseSourceSpec {
  kind: "tco-iceberg";
  payload: TcoIcebergPayload;
}
export interface AiClauseGapSpec extends BaseSourceSpec {
  kind: "ai-clause-gap";
  payload: AiClauseGapPayload;
}
export interface RenewalDecisionSpec extends BaseSourceSpec {
  kind: "renewal-decision";
  payload: RenewalDecisionPayload;
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
    case "strategy-memo":
      return renderNarrative(
        spec,
        STRATEGY_MEMO_DOCX_CONFIG,
        format,
        filename,
        generatedAt,
      );
    case "scope-memo":
      return renderNarrative(
        spec,
        SCOPE_MEMO_DOCX_CONFIG,
        format,
        filename,
        generatedAt,
      );
    case "rfp-package":
      return renderNarrative(
        spec,
        RFP_PACK_DOCX_CONFIG,
        format,
        filename,
        generatedAt,
      );
    case "vendor-response-pack":
      return renderNarrative(
        spec,
        VENDOR_RESPONSE_PACK_DOCX_CONFIG,
        format,
        filename,
        generatedAt,
      );
    case "decision-brief":
      return renderNarrative(
        spec,
        DECISION_BRIEF_DOCX_CONFIG,
        format,
        filename,
        generatedAt,
      );
    case "selection-memo":
      return renderNarrative(
        spec,
        SELECTION_MEMO_DOCX_CONFIG,
        format,
        filename,
        generatedAt,
      );

    // Structured-data kinds — xlsx (canonical data surface) + docx + pdf
    // (readable renderings of the same content).
    case "app-inventory":
      return renderAppInventory(
        spec as unknown as AppInventorySpec,
        format,
        filename,
      );
    case "response-checklist":
      return renderResponseChecklist(
        spec as unknown as ResponseChecklistSpec,
        format,
        filename,
      );
    case "scorecard":
      return renderScorecard(
        spec as unknown as ScorecardSpec,
        format,
        filename,
      );
    case "pricing-template":
      return renderPricingTemplate(
        spec as unknown as PricingTemplateSpec,
        format,
        filename,
      );
    case "pricing-comparison":
      return renderPricingComparison(
        spec as unknown as PricingComparisonSpec,
        format,
        filename,
      );
    case "trap-log":
      return renderTrapLog(spec as unknown as TrapLogSpec, format, filename);
    case "bafo-question-pack":
      return renderBafoQuestionPack(
        spec as unknown as BafoQuestionPackSpec,
        format,
        filename,
      );

    // Lifecycle-coverage wave — narrative kinds reuse the narrative
    // renderer set; the 4 structured kinds get their own dispatch.
    case "demand-challenge":
      return renderNarrative(
        spec,
        DEMAND_CHALLENGE_DOCX_CONFIG,
        format,
        filename,
        generatedAt,
      );
    case "sourcing-approach":
      return renderNarrative(
        spec,
        SOURCING_APPROACH_DOCX_CONFIG,
        format,
        filename,
        generatedAt,
      );
    case "vendor-risk-pack":
      return renderNarrative(
        spec,
        VENDOR_RISK_PACK_DOCX_CONFIG,
        format,
        filename,
        generatedAt,
      );
    case "market-scan":
      return renderMarketScan(
        spec as unknown as MarketScanSpec,
        format,
        filename,
      );
    case "tco-iceberg":
      return renderTcoIceberg(
        spec as unknown as TcoIcebergSpec,
        format,
        filename,
      );
    case "ai-clause-gap":
      return renderAiClauseGap(
        spec as unknown as AiClauseGapSpec,
        format,
        filename,
      );
    case "renewal-decision":
      return renderRenewalDecision(
        spec as unknown as RenewalDecisionSpec,
        format,
        filename,
      );

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
    tenantName: payload.tenantName ?? spec.tenantKey,
    eventCode: payload.eventCode,
    eventName: payload.eventName,
    issuedBy: payload.issuedBy,
    generatedAt: payload.generatedAt ?? generatedAt,
    body: withAiDecisionSupportExportNote(payload.body),
    bodyIsAuthored: payload.bodyIsAuthored,
  };

  switch (format) {
    case "docx": {
      const doc = buildNarrativeDocx(legacyPayload, config);
      const buffer = (await Packer.toBuffer(doc)) as unknown as Buffer;
      return makeResult("docx", buffer, filename, DOCX_CONTENT_TYPE);
    }
    case "html": {
      const html = buildNarrativeHtml(legacyPayload, config);
      const buffer = Buffer.from(html, "utf8");
      return makeResult("html", buffer, filename, HTML_CONTENT_TYPE);
    }
    case "pdf": {
      // Dynamic import keeps @react-pdf/renderer (ESM) out of the
      // dispatcher's static import graph so jest can load this module.
      const { buildNarrativePdf } = await import("./renderers/narrative-pdf");
      const { pdf: reactPdf } = await import("@react-pdf/renderer");
      const element = buildNarrativePdf(legacyPayload, config);
      const stream = await reactPdf(element).toBuffer();
      const chunks: Buffer[] = [];
      for await (const chunk of stream as AsyncIterable<Buffer | string>) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      return makeResult(
        "pdf",
        Buffer.concat(chunks),
        filename,
        PDF_CONTENT_TYPE,
      );
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
  if (format === "xlsx") {
    return renderXlsxOnly(
      buildAppInventoryWorkbook(spec.payload),
      format,
      filename,
    );
  }
  if (format === "docx") {
    return docxResult(buildAppInventoryDocx(spec.payload), filename);
  }
  if (format === "pdf") {
    const { buildAppInventoryPdf } =
      await import("./renderers/app-inventory-pdf");
    return pdfResult(buildAppInventoryPdf(spec.payload), filename);
  }
  throw new Error(`app-inventory does not support format "${format}"`);
}

async function renderResponseChecklist(
  spec: ResponseChecklistSpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === "xlsx") {
    return renderXlsxOnly(
      buildResponseChecklistWorkbook(spec.payload),
      format,
      filename,
    );
  }
  if (format === "docx") {
    return docxResult(buildResponseChecklistDocx(spec.payload), filename);
  }
  if (format === "pdf") {
    const { buildResponseChecklistPdf } =
      await import("./renderers/response-checklist-pdf");
    return pdfResult(buildResponseChecklistPdf(spec.payload), filename);
  }
  throw new Error(`response-checklist does not support format "${format}"`);
}

async function renderScorecard(
  spec: ScorecardSpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === "xlsx") {
    return renderXlsxOnly(
      buildScorecardWorkbook(spec.payload),
      format,
      filename,
    );
  }
  if (format === "docx") {
    return docxResult(buildScorecardDocx(spec.payload), filename);
  }
  if (format === "pdf") {
    const { buildScorecardPdf } = await import("./renderers/scorecard-pdf");
    return pdfResult(buildScorecardPdf(spec.payload), filename);
  }
  throw new Error(`scorecard does not support format "${format}"`);
}

async function renderPricingTemplate(
  spec: PricingTemplateSpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === "xlsx") {
    return renderXlsxOnly(
      buildPricingTemplateWorkbook(spec.payload),
      format,
      filename,
    );
  }
  if (format === "docx") {
    return docxResult(buildPricingTemplateDocx(spec.payload), filename);
  }
  if (format === "pdf") {
    const { buildPricingTemplatePdf } =
      await import("./renderers/pricing-template-pdf");
    return pdfResult(buildPricingTemplatePdf(spec.payload), filename);
  }
  if (format === "html") {
    const payload = pricingTemplateNarrativePayload(spec.payload);
    const html = buildNarrativeHtml(payload, PRICING_WORKBOOK_SUMMARY_DOCX_CONFIG);
    return makeResult(
      "html",
      Buffer.from(html, "utf8"),
      filename,
      HTML_CONTENT_TYPE,
    );
  }
  throw new Error(`pricing-template does not support format "${format}"`);
}

async function renderPricingComparison(
  spec: PricingComparisonSpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === "xlsx") {
    return renderXlsxOnly(
      buildPricingComparisonWorkbook(spec.payload),
      format,
      filename,
    );
  }
  if (format === "docx") {
    return docxResult(buildPricingComparisonDocx(spec.payload), filename);
  }
  if (format === "pdf") {
    const { buildPricingComparisonPdf } =
      await import("./renderers/pricing-comparison-pdf");
    return pdfResult(buildPricingComparisonPdf(spec.payload), filename);
  }
  throw new Error(`pricing-comparison does not support format "${format}"`);
}

async function renderTrapLog(
  spec: TrapLogSpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === "xlsx") {
    return renderXlsxOnly(buildTrapLogWorkbook(spec.payload), format, filename);
  }
  if (format === "docx") {
    return docxResult(buildTrapLogDocx(spec.payload), filename);
  }
  if (format === "pdf") {
    const { buildTrapLogPdf } = await import("./renderers/trap-log-pdf");
    return pdfResult(buildTrapLogPdf(spec.payload), filename);
  }
  throw new Error(`trap-log does not support format "${format}"`);
}

async function renderBafoQuestionPack(
  spec: BafoQuestionPackSpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === "xlsx") {
    return renderXlsxOnly(
      buildBafoQuestionPackWorkbook(spec.payload),
      format,
      filename,
    );
  }
  if (format === "docx") {
    return docxResult(buildBafoQuestionPackDocx(spec.payload), filename);
  }
  if (format === "pdf") {
    const { buildBafoQuestionPackPdf } =
      await import("./renderers/bafo-question-pack-pdf");
    return pdfResult(buildBafoQuestionPackPdf(spec.payload), filename);
  }
  throw new Error(`bafo-question-pack does not support format "${format}"`);
}

async function renderMarketScan(
  spec: MarketScanSpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === "xlsx") {
    return renderXlsxOnly(
      buildMarketScanWorkbook(spec.payload),
      format,
      filename,
    );
  }
  if (format === "docx") {
    return docxResult(buildMarketScanDocx(spec.payload), filename);
  }
  if (format === "pdf") {
    const { buildMarketScanPdf } = await import("./renderers/market-scan-pdf");
    return pdfResult(buildMarketScanPdf(spec.payload), filename);
  }
  throw new Error(`market-scan does not support format "${format}"`);
}

async function renderTcoIceberg(
  spec: TcoIcebergSpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === "xlsx") {
    return renderXlsxOnly(
      buildTcoIcebergWorkbook(spec.payload),
      format,
      filename,
    );
  }
  if (format === "docx") {
    return docxResult(buildTcoIcebergDocx(spec.payload), filename);
  }
  if (format === "pdf") {
    const { buildTcoIcebergPdf } = await import("./renderers/tco-iceberg-pdf");
    return pdfResult(buildTcoIcebergPdf(spec.payload), filename);
  }
  throw new Error(`tco-iceberg does not support format "${format}"`);
}

async function renderAiClauseGap(
  spec: AiClauseGapSpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === "xlsx") {
    return renderXlsxOnly(
      buildAiClauseGapWorkbook(spec.payload),
      format,
      filename,
    );
  }
  if (format === "docx") {
    return docxResult(buildAiClauseGapDocx(spec.payload), filename);
  }
  if (format === "html") {
    const html = buildAiClauseGapHtml(spec.payload);
    const buffer = Buffer.from(html, "utf8");
    return makeResult("html", buffer, filename, HTML_CONTENT_TYPE);
  }
  if (format === "pdf") {
    const { buildAiClauseGapPdf } =
      await import("./renderers/ai-clause-gap-pdf");
    return pdfResult(buildAiClauseGapPdf(spec.payload), filename);
  }
  throw new Error(`ai-clause-gap does not support format "${format}"`);
}

async function renderRenewalDecision(
  spec: RenewalDecisionSpec,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format === "xlsx") {
    return renderXlsxOnly(
      buildRenewalDecisionWorkbook(spec.payload),
      format,
      filename,
    );
  }
  if (format === "docx") {
    return docxResult(buildRenewalDecisionDocx(spec.payload), filename);
  }
  if (format === "pdf") {
    const { buildRenewalDecisionPdf } =
      await import("./renderers/renewal-decision-pdf");
    return pdfResult(buildRenewalDecisionPdf(spec.payload), filename);
  }
  throw new Error(`renewal-decision does not support format "${format}"`);
}

// ── docx + pdf serialization helpers ───────────────────────────────────────

async function docxResult(
  doc: import("docx").Document,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  const buffer = (await Packer.toBuffer(doc)) as unknown as Buffer;
  return makeResult("docx", buffer, filename, DOCX_CONTENT_TYPE);
}

/**
 * Serialize a react-pdf element to bytes. @react-pdf/renderer is pure
 * ESM; we dynamic-import it here so the dispatcher's static import
 * graph stays CJS-loadable under jest.
 */
async function pdfResult(
  element: import("react").ReactElement<
    import("@react-pdf/renderer").DocumentProps
  >,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  const { pdf: reactPdf } = await import("@react-pdf/renderer");
  const stream = await reactPdf(element).toBuffer();
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return makeResult("pdf", Buffer.concat(chunks), filename, PDF_CONTENT_TYPE);
}

// ── xlsx common path ──────────────────────────────────────────────────────

async function renderXlsxOnly(
  workbook: Workbook,
  format: DeliverableFormat,
  filename: string,
): Promise<SourceDeliverableRenderResult> {
  if (format !== "xlsx") {
    throw new Error(`This kind only supports xlsx, got "${format}"`);
  }
  addAiDecisionSupportWorksheet(workbook);
  const arrayBuf = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuf as ArrayBuffer);
  return makeResult("xlsx", buffer, filename, XLSX_CONTENT_TYPE);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function filenameFor(
  spec: SourceDeliverableSpec,
  format: DeliverableFormat,
): string {
  const dateStamp = (spec.generatedAt ?? new Date().toISOString()).slice(0, 10);
  const codeSegment = artifactCodeForKind(spec.kind);
  const eventSegment = eventCodeFromSpec(spec, spec.sourceEventId);
  return `${codeSegment}__${eventSegment}__${dateStamp}.${format}`;
}

function artifactCodeForKind(kind: SourceDeliverableKind): string {
  switch (kind) {
    case "strategy-memo":
      return "d01_strategy_memo";
    case "scope-memo":
      return "d05_scope_memo";
    case "rfp-package":
      return "d09_rfp_pack";
    case "vendor-response-pack":
      return "d13_vendor_responses";
    case "decision-brief":
      return "d24_decision_brief";
    case "selection-memo":
      return "d27_selection_memo";
    case "app-inventory":
      return "d04_app_inv";
    case "response-checklist":
      return "d11_response_checklist";
    case "scorecard":
      return "d16_scorecard";
    case "pricing-template":
      return "d19_pricing_workbook";
    case "pricing-comparison":
      return "d19_pricing_comparison";
    case "trap-log":
      return "d20_trap_log";
    case "bafo-question-pack":
      return "d22_bafo_question_pack";
    case "demand-challenge":
      return "dx0_demand_challenge";
    case "sourcing-approach":
      return "dx1_sourcing_approach";
    case "market-scan":
      return "dx2_market_scan";
    case "tco-iceberg":
      return "dx4_tco_iceberg";
    case "ai-clause-gap":
      return "dx6a_ai_clause_gap";
    case "vendor-risk-pack":
      return "dx6b_vendor_risk_pack";
    case "renewal-decision":
      return "dx7_renewal_decision";
  }
}

function withAiDecisionSupportExportNote(body: string): string {
  const note = [
    "",
    "---",
    AI_DECISION_SUPPORT_WATERMARK,
    HUMAN_DECISION_ATTESTATION_TEXT,
  ].join("\n");
  return body.includes(AI_DECISION_SUPPORT_WATERMARK)
    ? body
    : `${body.trimEnd()}${note}`;
}

function pricingTemplateNarrativePayload(
  payload: PricingTemplatePayload,
): NarrativeDocxPayload {
  const assumptionLines =
    payload.assumptions.length > 0
      ? payload.assumptions
          .map((assumption) => {
            const rationale = assumption.rationale
              ? ` — ${assumption.rationale}`
              : "";
            return `- **${assumption.key}:** ${assumption.value}${rationale}`;
          })
          .join("\n")
      : "- No locked assumptions are present yet.";
  const lineItemLines =
    payload.lineItems.length > 0
      ? payload.lineItems
          .map((item) => {
            const note = item.note ? ` — ${item.note}` : "";
            return `- **${item.id}:** ${item.category} · ${item.description} · ${item.annualQuantity.toLocaleString()} ${item.unit}${note}`;
          })
          .join("\n")
      : "- No scope-derived pricing line items are present yet.";
  const escalatorPct = `${(payload.escalator * 100).toFixed(2)}%`;
  const body = [
    "# Pricing workbook summary",
    "",
    "This HTML view is the buyer-readable companion to the d19 pricing workbook. The xlsx remains the governed vendor-editable surface for unit prices, formulas, and TCO rollup.",
    "",
    "## Locked assumptions",
    assumptionLines,
    "",
    "## Scope-derived pricing lines",
    lineItemLines,
    "",
    "## TCO schedule",
    `- Horizon: **${payload.tcoYears} years**`,
    `- Annual escalator: **${escalatorPct}**`,
    "- Year 1 holds at the steady-state base; later years apply the escalator in the workbook.",
    "",
    "## Review rule",
    "Finance should treat the HTML as a review summary and the xlsx as the authoritative pricing artifact. Any realized savings claim still requires CFO or value-office attestation.",
  ].join("\n");

  return {
    tenantName: payload.tenantName,
    eventCode: payload.eventCode,
    eventName: payload.eventName,
    issuedBy: payload.issuedBy,
    generatedAt: payload.generatedAt,
    body,
    bodyIsAuthored: true,
  };
}

function addAiDecisionSupportWorksheet(workbook: Workbook): void {
  if (workbook.getWorksheet("AI Decision Support")) return;
  const sheet = workbook.addWorksheet("AI Decision Support");
  sheet.columns = [
    { header: "Control", key: "control", width: 28 },
    { header: "Text", key: "text", width: 110 },
  ];
  sheet.addRow({ control: "Watermark", text: AI_DECISION_SUPPORT_WATERMARK });
  sheet.addRow({
    control: "Human attestation",
    text: HUMAN_DECISION_ATTESTATION_TEXT,
  });
  sheet.addRow({
    control: "Use limitation",
    text: "This workbook supports review and approval by the client decision owner. It is not an autonomous approval, award, renewal, funding, legal, employment, clinical, credit, or insurance determination.",
  });
  sheet.getRow(1).font = { bold: true };
  sheet.eachRow((row) => {
    row.alignment = { wrapText: true, vertical: "top" };
  });
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

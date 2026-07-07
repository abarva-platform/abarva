// Source · narrative docx renderer
//
// Generic renderer for any long-form narrative artifact. Slice 3.1
// shipped this as scope-memo-docx.ts; Slice 3.2 generalizes it so d09
// (RFP), d24 (Decision Brief), d27 (Selection Memo) — all narrative
// markdown bodies — share the same cover-page + body-walker + footer
// template without code duplication.
//
// The shape of each narrative artifact is identical:
//   1. Cover block (eyebrow / display title / event metadata / scaffold
//      warning when bodyIsAuthored=false)
//   2. Body (markdown → docx via the shared markdown-to-docx walker)
//   3. Footer paragraph + page header/footer
//
// The only thing that varies per artifact is the eyebrow text, the
// header label, and the confidentiality note — all of which come in
// via NarrativeDocxConfig.

import "server-only";

import { Document, Footer, Header, Paragraph, TextRun } from "docx";

import {
  ORDERED_NUMBERING_CONFIG,
  SOURCE_DOCX,
  bodyParagraph,
  bodyRun,
  boldRun,
  coverSubtitleParagraph,
  coverTitleParagraph,
  eyebrowParagraph,
} from "@/lib/exports-shared/docx-base";
import { markdownToDocxBlocks } from "@/lib/exports-shared/markdown-to-docx";

/** Payload all narrative renderers consume. */
export interface NarrativeDocxPayload {
  tenantName: string;
  eventCode: string;
  eventName: string;
  /** Free-form owner / sponsor block from event intake. Optional. */
  issuedBy?: string;
  /** ISO 8601 generated-at timestamp. */
  generatedAt: string;
  /** Markdown body. */
  body: string;
  /** True when the body is authored content; false = canonical scaffold. */
  bodyIsAuthored: boolean;
}

/** Per-artifact config that customizes the cover + headers. */
export interface NarrativeDocxConfig {
  /** Artifact code (e.g. "d09_rfp_pack") — used in document.title. */
  artifactCode: string;
  /** Display label shown in the page header (e.g. "d09 RFP Package"). */
  headerLabel: string;
  /** Eyebrow line above the cover title (e.g. "d09 · RFP Package · {tenant}"). */
  eyebrowFor: (tenantName: string) => string;
  /** Subtitle prefix for document.title (e.g. "RFP Package"). */
  documentTitle: string;
  /** Confidentiality / distribution caveat shown in the page footer. */
  confidentialityNote: string;
}

/** Build a narrative docx Document. Pure: payload+config → Document. */
export function buildNarrativeDocx(
  payload: NarrativeDocxPayload,
  config: NarrativeDocxConfig,
): Document {
  const cover = buildCoverBlock(payload, config);
  const bodyBlocks = markdownToDocxBlocks(payload.body || "");
  const footerNote = bodyParagraph([
    bodyRun(
      `AbarVa Source · ${payload.eventCode} · generated ${payload.generatedAt}`,
      { color: SOURCE_DOCX.MUTED_COLOR, size: 18 },
    ),
  ]);

  return new Document({
    creator: "AbarVa Source",
    title: `${config.documentTitle} · ${payload.eventCode}`,
    description: `${config.headerLabel} for sourcing event ${payload.eventCode}.`,
    numbering: ORDERED_NUMBERING_CONFIG,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: payload.tenantName,
                    font: SOURCE_DOCX.BODY_FONT,
                    size: 18,
                    color: SOURCE_DOCX.MUTED_COLOR,
                  }),
                  new TextRun({
                    text: `   ·   ${payload.eventCode}   ·   ${config.headerLabel}`,
                    font: SOURCE_DOCX.BODY_FONT,
                    size: 18,
                    color: SOURCE_DOCX.MUTED_COLOR,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: config.confidentialityNote,
                    font: SOURCE_DOCX.BODY_FONT,
                    size: 16,
                    color: SOURCE_DOCX.MUTED_COLOR,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [...cover, ...bodyBlocks, footerNote],
      },
    ],
  });
}

function buildCoverBlock(
  payload: NarrativeDocxPayload,
  config: NarrativeDocxConfig,
): Paragraph[] {
  const blocks: Paragraph[] = [];
  blocks.push(eyebrowParagraph(config.eyebrowFor(payload.tenantName)));
  blocks.push(coverTitleParagraph(payload.eventName));
  blocks.push(coverSubtitleParagraph(`Event code: ${payload.eventCode}`));
  if (payload.issuedBy) {
    blocks.push(coverSubtitleParagraph(`Issued by: ${payload.issuedBy}`));
  }
  blocks.push(coverSubtitleParagraph(`Generated: ${payload.generatedAt}`));
  if (!payload.bodyIsAuthored) {
    blocks.push(
      bodyParagraph([
        boldRun("Awaiting authoring — body has not been authored yet. ", {
          color: SOURCE_DOCX.WARNING_COLOR,
        }),
        bodyRun(
          `The content below is the canonical ${config.headerLabel} outline; replace with the actual authored content before circulating.`,
          { color: SOURCE_DOCX.MUTED_COLOR },
        ),
      ]),
    );
  }
  return blocks;
}

// ── Per-artifact configs ───────────────────────────────────────────────────

export const STRATEGY_MEMO_DOCX_CONFIG: NarrativeDocxConfig = {
  artifactCode: "d01_strategy_memo",
  headerLabel: "d01 Sourcing Strategy Memo",
  eyebrowFor: (tenant) => `d01 · Sourcing Strategy Memo · ${tenant}`,
  documentTitle: "Sourcing Strategy Memo",
  confidentialityNote:
    "Confidential — internal sourcing-strategy memo; share with sponsor + procurement panel only",
};

export const SCOPE_MEMO_DOCX_CONFIG: NarrativeDocxConfig = {
  artifactCode: "d05_scope_memo",
  headerLabel: "d05 Scope Memo",
  eyebrowFor: (tenant) => `d05 · Scope Memo · ${tenant}`,
  documentTitle: "Scope Memo",
  confidentialityNote: "Confidential — distribute only to procurement panel",
};

export const RFP_PACK_DOCX_CONFIG: NarrativeDocxConfig = {
  artifactCode: "d09_rfp_pack",
  headerLabel: "d09 RFP Package",
  eyebrowFor: (tenant) => `d09 · RFP Package · ${tenant}`,
  documentTitle: "RFP Package",
  confidentialityNote:
    "Confidential vendor RFP — do not redistribute outside the named bidder panel",
};

export const VENDOR_RESPONSE_PACK_DOCX_CONFIG: NarrativeDocxConfig = {
  artifactCode: "d13_vendor_responses",
  headerLabel: "d13 Vendor Response Pack",
  eyebrowFor: (tenant) => `d13 · Vendor Response Pack · ${tenant}`,
  documentTitle: "Vendor Response Pack",
  confidentialityNote:
    "Confidential vendor response pack — buyer-side comparison and completeness review only",
};

export const PRICING_WORKBOOK_SUMMARY_DOCX_CONFIG: NarrativeDocxConfig = {
  artifactCode: "d19_pricing_workbook",
  headerLabel: "d19 Pricing Workbook Summary",
  eyebrowFor: (tenant) => `d19 · Pricing Workbook Summary · ${tenant}`,
  documentTitle: "Pricing Workbook Summary",
  confidentialityNote:
    "Confidential pricing normalization summary — use the xlsx workbook for vendor-editable pricing inputs",
};

export const DECISION_BRIEF_DOCX_CONFIG: NarrativeDocxConfig = {
  artifactCode: "d24_decision_brief",
  headerLabel: "d24 Decision Brief",
  eyebrowFor: (tenant) => `d24 · Decision Brief · ${tenant}`,
  documentTitle: "Decision Brief",
  confidentialityNote:
    "Executive review only — pre-decision; not for vendor distribution",
};

export const SELECTION_MEMO_DOCX_CONFIG: NarrativeDocxConfig = {
  artifactCode: "d27_selection_memo",
  headerLabel: "d27 Selection Memo",
  eyebrowFor: (tenant) => `d27 · Selection Memo · ${tenant}`,
  documentTitle: "Selection Memo",
  confidentialityNote:
    "Confidential — final selection memo; release after sponsor sign-off only",
};

// ── Lifecycle-coverage wave configs ────────────────────────────────────────
// Stage 0 — demand challenge (the "should we even source this?" verdict)
export const DEMAND_CHALLENGE_DOCX_CONFIG: NarrativeDocxConfig = {
  artifactCode: "dx0_demand_challenge",
  headerLabel: "Demand Challenge",
  eyebrowFor: (tenant) => `Stage 0 · Demand Challenge · ${tenant}`,
  documentTitle: "Demand Challenge",
  confidentialityNote:
    "Confidential — internal demand-challenge verdict; precedes any vendor engagement",
};

// Stage 1 — sourcing approach (RFI vs RFP, commercial model, SI lane)
export const SOURCING_APPROACH_DOCX_CONFIG: NarrativeDocxConfig = {
  artifactCode: "dx1_sourcing_approach",
  headerLabel: "Sourcing Approach",
  eyebrowFor: (tenant) => `Stage 1 · Sourcing Approach · ${tenant}`,
  documentTitle: "Sourcing Approach",
  confidentialityNote:
    "Confidential — sourcing-approach recommendation; share with sponsor + procurement panel only",
};

// Stage 6 — vendor risk pack (security / financial / concentration / 4P)
export const VENDOR_RISK_PACK_DOCX_CONFIG: NarrativeDocxConfig = {
  artifactCode: "dx6b_vendor_risk_pack",
  headerLabel: "Vendor Risk Pack",
  eyebrowFor: (tenant) => `Stage 6 · Vendor Risk Pack · ${tenant}`,
  documentTitle: "Vendor Risk Pack",
  confidentialityNote:
    "Confidential — vendor risk pack; distribute to risk + compliance + sponsor only",
};

// Source · evidence input template (blank XLSX intake form)
//
// A required-input row on the simple Source front asks the user for one piece
// of evidence (an incumbent contract, a ticket-volume export, a vendor pricing
// sheet, …). Many enterprise users have the data but no idea what shape to hand
// over. This builds a blank, pre-shaped workbook for a single requirement:
//   • a Cover sheet explaining what we need, why, and where it comes from, and
//   • an Intake sheet with the columns / prompts to fill in.
//
// The filename embeds the requirement's canonical reconcile token (see
// templateFilenameTokenForRequirement), so when the filled-in file is uploaded
// through the existing artifacts/upload route it matches straight back to this
// requirement — no extra step for the user.

import "server-only";

import ExcelJS from "exceljs";

import type { SourceEvidenceRequirement } from "@/lib/source/canonical-specs";
import { templateFilenameTokenForRequirement } from "@/lib/source/canvas-substrate/upload-sync";
import {
  SOURCE_XLSX,
  XLSX_CONTENT_TYPE,
  applyHeaderRow,
  buildCoverSheet,
  safeCell,
} from "@/lib/exports-shared/xlsx-base";

export { XLSX_CONTENT_TYPE };

export interface InputTemplateEventMeta {
  /** Human event code shown on the cover (e.g. SRC-2026-014). */
  eventCode: string;
  /** Event name shown on the cover. */
  eventName: string;
  /** Client/company display name (never the internal tenant key). */
  companyName: string;
  /** ISO timestamp; passed in so the generator stays deterministic/testable. */
  generatedAtIso: string;
}

/**
 * Per-requirement intake columns. Most requirements are narrative ("paste what
 * you have"); the few structured ones get a real column shape so the upload is
 * immediately useful. Falls back to a single guidance column.
 */
const INTAKE_COLUMNS: Record<string, string[]> = {
  "EVID-SRC-SCOPE-APP-INV": [
    "Application name",
    "Vendor",
    "Business capability",
    "Users",
    "Annual run cost",
    "In scope? (Y/N)",
    "Notes",
  ],
  "EVID-SRC-SCOPE-ORG": [
    "Role / team",
    "Headcount (FTE)",
    "Location",
    "In scope? (Y/N)",
    "Notes",
  ],
  "EVID-SRC-SCOPE-TICKET-HISTORY": [
    "Month",
    "Ticket volume",
    "P1/P2 count",
    "Avg time to resolve",
    "System",
    "Notes",
  ],
  "EVID-SRC-PRICE-VENDOR-PRICING": [
    "Line item",
    "Unit",
    "Quantity",
    "Unit price",
    "Annual cost",
    "Notes",
  ],
  "EVID-SRC-EVAL-RATER-SCORES": [
    "Vendor",
    "Criterion",
    "Score (1-5)",
    "Rationale",
  ],
  "EVID-SRC-DEC-RISK-REGISTER": [
    "Risk",
    "Likelihood",
    "Impact",
    "Mitigation",
    "Owner",
  ],
  "EVID-SRC-TRAN-MILESTONES": [
    "Milestone",
    "Target date",
    "Owner",
    "Dependency",
    "Status",
  ],
};

const DEFAULT_INTAKE_COLUMNS = ["What you have", "Details", "Source / date", "Notes"];

function intakeColumnsFor(requirementId: string): string[] {
  return INTAKE_COLUMNS[requirementId] ?? DEFAULT_INTAKE_COLUMNS;
}

/**
 * Deterministic, reconcile-safe filename for a requirement template. The token
 * (e.g. "incumbent", "ticket", "pricing") guarantees the filled-in upload maps
 * back to this requirement. We still emit a name if the requirement has no
 * token — the upload simply won't auto-link, which is the honest outcome.
 */
export function inputTemplateFilename(
  requirement: SourceEvidenceRequirement,
): string {
  // The token must be the ONLY reconcile-keyword-bearing part of the name — the
  // stage word ("responses" contains "response") and the literal "template"
  // (itself a keyword for EVID-SRC-RFP-LEGAL-TEMPLATE) would collide with sibling
  // requirements in the same stage and silently misattach the upload. "intake"
  // carries no keyword, so it is a safe, human-readable suffix.
  const token = templateFilenameTokenForRequirement(requirement.requirementId);
  if (!token) return `source-${requirement.stage}-intake.xlsx`;
  return `source-${token}-intake.xlsx`;
}

/** Build the blank intake workbook for one evidence requirement. */
export async function buildInputTemplateWorkbook(args: {
  requirement: SourceEvidenceRequirement;
  event: InputTemplateEventMeta;
}): Promise<Buffer> {
  const { requirement, event } = args;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AbarVa Source";
  workbook.created = new Date(event.generatedAtIso);

  buildCoverSheet(workbook, {
    title: `Input template · ${requirement.label}`,
    eventCode: event.eventCode,
    eventName: event.eventName,
    tenantName: event.companyName,
    instructions: [
      `What we need: ${requirement.description}`,
      `Why it matters: ${requirement.unlocks}`,
      `Where it usually lives: ${requirement.sourceLabel}`,
      `Readiness target: ${requirement.minimumState}.`,
      "Fill in the Intake sheet (or paste an export over it), then upload this",
      "file on the same step. It will attach to this item automatically — keep",
      `the word "${templateFilenameTokenForRequirement(requirement.requirementId) ?? requirement.stage}" in the filename.`,
      "No data to share? Use “Just tell me” on the step instead.",
    ],
    generatedAt: event.generatedAtIso,
  });

  const intake = workbook.addWorksheet("Intake", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  const columns = intakeColumnsFor(requirement.requirementId);
  intake.columns = columns.map((header) => ({
    header,
    width: Math.max(18, Math.min(48, header.length + 8)),
  }));
  applyHeaderRow(intake.getRow(1));

  // A few empty banded rows so the grid is obviously fillable, not a blank void.
  for (let i = 0; i < 12; i += 1) {
    const row = intake.addRow(columns.map(() => ""));
    if (i % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: SOURCE_XLSX.BAND_FILL },
        };
      });
    }
  }
  // Guard the first body cell against accidental formula coercion on paste.
  intake.getCell("A2").value = safeCell("");

  const out = await workbook.xlsx.writeBuffer();
  return Buffer.from(out);
}

// =============================================================================
// Deliverable quality gate — blocks ugly / internal / ungrounded artifacts.
// -----------------------------------------------------------------------------
// validateDeliverableQuality runs before any export. It hard-FAILS on internal
// tag leakage, missing source register, unsupported claims, missing required
// sections/tables, missing client-to-complete items, or a missing title/version/
// date block. It WARNS on thin structure (too few tables, no RACI/risk/value/
// phase-gate table, low confidence). A deliverable is only "board-grade" if it
// passes (no errors).
// =============================================================================

import { findForbiddenTags, type SourceRegisterEntry } from "./source-labels";

export interface DeliverableForValidation {
  title: string;
  version?: string | null;
  date?: string | null;
  /** Client-facing body markdown — must be free of internal tags. */
  bodyMarkdown: string;
  sourceRegister: SourceRegisterEntry[];
  /** Section headings that must be present (from the section contract). */
  requiredSections: string[];
  /** Section headings that must contain a table. */
  requiredTableSections?: string[];
  clientCompleteItems?: string[];
  openItems?: string[];
  unsupportedClaims?: string[];
  /** Declared body font pt (formatting metadata) — must be ≥ 10.5. */
  bodyFontPt?: number;
}

export interface QualityReport {
  pass: boolean;
  errors: string[];
  warnings: string[];
  qualityScore: number;
  checks: Record<string, boolean>;
}

function hasHeading(body: string, heading: string): boolean {
  const needle = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const lines = body.split("\n");
  return lines.some((l) => {
    if (!/^#{1,4}\s/.test(l) && !/^\*\*/.test(l)) return false;
    const norm = l
      .replace(/^#{1,4}\s*/, "")
      .replace(/\*\*/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    return norm.includes(needle) || needle.includes(norm);
  });
}

/** Does the section (by heading) contain a markdown table below it? */
function sectionHasTable(body: string, heading: string): boolean {
  const lines = body.split("\n");
  const needle = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  let inSection = false;
  for (const l of lines) {
    if (/^#{1,4}\s/.test(l)) {
      const norm = l
        .replace(/^#{1,4}\s*/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
      if (inSection) {
        // reached the next heading without a table
        if (!(norm.includes(needle) || needle.includes(norm)))
          inSection = false;
      }
      if (norm.includes(needle) || needle.includes(norm)) inSection = true;
      continue;
    }
    if (inSection && /^\s*\|.*\|/.test(l)) return true;
  }
  return false;
}

function countTables(body: string): number {
  // A markdown table has a header separator row like | --- | --- |
  return (body.match(/^\s*\|[\s:-]*\|[\s:|-]*$/gm) || []).length;
}

export function validateDeliverableQuality(
  d: DeliverableForValidation,
): QualityReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checks: Record<string, boolean> = {};

  // 1) HARD: no internal tags in the client-facing body.
  const tags = findForbiddenTags(d.bodyMarkdown);
  checks.noInternalTags = tags.length === 0;
  if (tags.length) {
    errors.push(
      `Internal source tags leaked into the client body: ${tags.join(", ")}. Use [n] citations + the Source Register.`,
    );
  }

  // 2) HARD: source register present and the body references it with [n].
  checks.hasSourceRegister = d.sourceRegister.length > 0;
  if (!d.sourceRegister.length) {
    errors.push(
      "Missing Source Register — every deliverable must include one.",
    );
  } else {
    const usesNumeric = /\[\d+\]/.test(d.bodyMarkdown);
    checks.usesNumericCitations = usesNumeric;
    if (!usesNumeric) {
      errors.push(
        "Body does not use numeric [n] citations tied to the Source Register.",
      );
    }
  }

  // 3) HARD: no unsupported claims.
  checks.noUnsupportedClaims = !d.unsupportedClaims?.length;
  if (d.unsupportedClaims?.length) {
    errors.push(
      `${d.unsupportedClaims.length} unsupported claim(s) present — deliverables must be cited or flagged.`,
    );
  }

  // 4) HARD: required sections present.
  const missingSections = d.requiredSections.filter(
    (s) => !hasHeading(d.bodyMarkdown, s),
  );
  checks.allSectionsPresent = missingSections.length === 0;
  if (missingSections.length) {
    errors.push(`Missing required sections: ${missingSections.join("; ")}.`);
  }

  // 5) HARD: required tables present in their sections.
  const missingTables = (d.requiredTableSections ?? []).filter(
    (s) => !sectionHasTable(d.bodyMarkdown, s),
  );
  checks.allRequiredTablesPresent = missingTables.length === 0;
  if (missingTables.length) {
    errors.push(
      `Sections missing a required table: ${missingTables.join("; ")}.`,
    );
  }

  // 6) HARD: title/version/date block.
  checks.hasTitleVersionDate = Boolean(d.title && d.version && d.date);
  if (!checks.hasTitleVersionDate) {
    errors.push("Missing title/version/date block.");
  }

  // 7) HARD: client-to-complete items when evidence gaps exist.
  const hasGaps = (d.openItems?.length ?? 0) > 0;
  const hasClientItems =
    (d.clientCompleteItems?.length ?? 0) > 0 ||
    /\[CLIENT TO (COMPLETE|CONFIRM)[^\]]*\]/i.test(d.bodyMarkdown) ||
    /\[(VALUE TEAM|LEGAL\/PROCUREMENT)[^\]]*\]/i.test(d.bodyMarkdown);
  checks.clientCompleteWhenGaps = !hasGaps || hasClientItems;
  if (hasGaps && !hasClientItems) {
    errors.push(
      "Evidence gaps exist but no client-to-complete items / placeholders are present.",
    );
  }

  // 8) HARD: body font readable.
  checks.fontReadable = (d.bodyFontPt ?? 11) >= 10.5;
  if ((d.bodyFontPt ?? 11) < 10.5) {
    errors.push(`Body font ${d.bodyFontPt}pt is below the 10.5pt minimum.`);
  }

  // ── WARNINGS (quality, not blocking) ──
  const tableCount = countTables(d.bodyMarkdown);
  if (tableCount < 4)
    warnings.push(
      `Only ${tableCount} tables — board-grade charters carry several.`,
    );
  for (const want of [
    ["RACI", /raci|decision[- ]rights|stakeholder/i],
    ["risk", /risk/i],
    ["value", /value/i],
    ["phase gate", /phase|gate/i],
  ] as const) {
    const present = d.requiredSections.some((s) => want[1].test(s));
    if (!present) warnings.push(`No ${want[0]} table/section in the contract.`);
  }
  const lowConf = d.sourceRegister.filter((s) => s.confidence === "low").length;
  if (lowConf) warnings.push(`${lowConf} source(s) at low confidence.`);

  const score = Math.max(0, 100 - errors.length * 18 - warnings.length * 4);

  return {
    pass: errors.length === 0,
    errors,
    warnings,
    qualityScore: score,
    checks,
  };
}

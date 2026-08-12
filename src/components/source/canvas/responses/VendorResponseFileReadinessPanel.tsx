"use client";

import type { CSSProperties } from "react";
import type {
  SourceVendorResponseCompleteness,
  SourceVendorResponseCompletenessRecord,
  SourceVendorTemplateStatus,
} from "@/lib/source/vendor-response-types";
import type {
  VendorResponseExhibitKind,
  VendorResponseProfile,
  VendorResponseProfileSet,
} from "@/lib/source/proposal-intelligence";
import {
  VENDOR_RESPONSE_FILE_FAMILIES,
  type VendorResponseFileFamily as FileFamily,
  type VendorResponseFileRequirement as Requirement,
} from "@/lib/source/vendor-response-upload-package-policy";
import { CANVAS } from "../canvas-tokens";

type ReadinessTone = "done" | "review" | "missing" | "neutral";

interface FileReadinessRow extends FileFamily {
  vendorId: string;
  vendorName: string;
  uploadTone: ReadinessTone;
  uploadLabel: string;
  parseTone: ReadinessTone;
  parseLabel: string;
  citationCount: number;
  doneTone: ReadinessTone;
  doneLabel: string;
  nextAction: string;
}

const FILE_FAMILIES: readonly FileFamily[] = VENDOR_RESPONSE_FILE_FAMILIES;

/** Which vendor-level blockers belong to which file family row. */
const BLOCKER_PATTERNS: Record<string, RegExp> = {
  main_proposal: /executive response|scope confirmation|main proposal/i,
  pricing_template: /pricing/i,
  sla_response: /sla|service level/i,
  staffing_model: /delivery model|staffing/i,
  transition_plan: /transition/i,
  exceptions: /assumption|exclusion|exception/i,
  proof_exhibits: /evidence|reference/i,
};

export function VendorResponseFileReadinessPanel({
  readiness,
  profileSet,
}: {
  readiness?: SourceVendorResponseCompleteness;
  profileSet?: VendorResponseProfileSet | null;
}) {
  const profilesByVendorId = new Map(
    (profileSet?.profiles ?? []).map((profile) => [
      simplifyVendorKey(profile.vendorId),
      profile,
    ]),
  );
  const rows = (readiness?.records ?? []).flatMap((record) =>
    FILE_FAMILIES.map((family) =>
      buildFileReadinessRow(
        family,
        record,
        profilesByVendorId.get(simplifyVendorKey(record.vendorId)),
      ),
    ),
  );
  const requiredRows = rows.filter((row) => row.requirement === "Required");
  const requiredDone = requiredRows.filter(
    (row) => row.doneTone === "done",
  ).length;
  const requiredOpen = requiredRows.length - requiredDone;
  const vendorCount = readiness?.records.length ?? 0;
  const minimumFilesPerVendor = FILE_FAMILIES.filter(
    (family) => family.requirement === "Required",
  ).length;
  // Per-row counts overlap by design — the main proposal row counts every
  // reference for that vendor and the other rows count their own subsets — so
  // summing them would report more cited items than exist. Count distinct
  // references across the vendors on this ledger instead.
  const citationCount = countDistinctCitations(
    readiness?.records ?? [],
    profilesByVendorId,
  );

  return (
    <section
      data-testid="source-vendor-response-file-readiness"
      style={CARD}
      aria-label="Vendor response file readiness"
    >
      <div style={HEADER}>
        <div>
          <div style={EYEBROW}>File readiness</div>
          <h3 style={TITLE}>What exactly must be uploaded for each vendor?</h3>
          <p style={COPY}>
            This is the scoring-readiness ledger, not the raw file cabinet. It
            separates the minimum required upload package from proposal content
            sections that can arrive inside the main proposal or as exhibits. A
            75-100 page proposal is acceptable when the parser can find and cite
            the requested sections.
          </p>
          <div style={MINIMUM_PACKAGE}>
            <strong>
              Minimum package: {minimumFilesPerVendor} required files per vendor
            </strong>
            <span>
              Load one main proposal package plus one pricing workbook for each
              invited vendor. SLA, staffing, transition, exceptions, and proof
              exhibits strengthen scoring and BAFO leverage, but they are not
              separate required uploads unless the buyer marks them required.
            </span>
          </div>
        </div>
        <div style={SUMMARY_GRID} aria-label="File readiness summary">
          <Metric
            label="Vendors"
            value={String(vendorCount)}
            tone={vendorCount > 0 ? "done" : "review"}
          />
          <Metric
            label="Required done"
            value={`${requiredDone}/${requiredRows.length || 0}`}
            tone="done"
          />
          <Metric
            label="Open required"
            value={String(requiredOpen)}
            tone={requiredOpen > 0 ? "missing" : "done"}
          />
          <Metric
            label="Cited items"
            value={String(citationCount)}
            tone={citationCount > 0 ? "done" : "review"}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={EMPTY}>
          <strong>No vendor response files are loaded yet.</strong>
          <span>
            Start with one main proposal package and one pricing workbook for
            each invited vendor. Add SLA, staffing, transition, exceptions, and
            proof exhibits only when they are separate files or needed for BAFO
            leverage.
          </span>
        </div>
      ) : (
        <div style={TABLE_WRAP}>
          <table style={TABLE}>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: "left" }}>Vendor</th>
                <th style={{ ...TH, textAlign: "left" }}>File to load</th>
                <th style={TH}>Need</th>
                <th style={{ ...TH, textAlign: "left" }}>Source</th>
                <th style={{ ...TH, textAlign: "left" }}>Owner</th>
                <th style={TH}>Formats</th>
                <th style={TH}>Upload</th>
                <th style={TH}>Parse</th>
                <th style={TH}>Evidence</th>
                <th style={TH}>Done</th>
                <th style={{ ...TH, textAlign: "left" }}>Next action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.vendorId}-${row.key}`}>
                  <td style={TD_VENDOR}>
                    <strong>{row.vendorName}</strong>
                  </td>
                  <td style={TD_FILE}>
                    <strong>{row.label}</strong>
                  </td>
                  <td style={TD_CENTER}>
                    <span
                      style={{
                        ...REQUIREMENT_BADGE,
                        ...REQUIREMENT_TONE[row.requirement],
                      }}
                    >
                      {row.requirement}
                    </span>
                  </td>
                  <td style={TD_TEXT}>{row.sourceSystem}</td>
                  <td style={TD_TEXT}>{row.ownerRole}</td>
                  <td style={TD_CENTER}>
                    <span style={FORMAT}>{row.formats}</span>
                  </td>
                  <td style={TD_CENTER}>
                    <StatusChip tone={row.uploadTone} label={row.uploadLabel} />
                  </td>
                  <td style={TD_CENTER}>
                    <StatusChip tone={row.parseTone} label={row.parseLabel} />
                  </td>
                  <td style={TD_CENTER}>
                    <span style={EVIDENCE}>
                      {row.citationCount > 0
                        ? `${row.citationCount} cited`
                        : "No cite"}
                    </span>
                  </td>
                  <td style={TD_CENTER}>
                    <StatusChip tone={row.doneTone} label={row.doneLabel} />
                  </td>
                  <td style={TD_ACTION}>{row.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={FOOTNOTE}>
        Required upload means a file must exist before parser-backed scoring can
        start. Conditional means the content must be citable somewhere in the
        proposal package; upload a separate exhibit only when the vendor sent it
        separately or the buyer needs it for leverage.
      </div>
    </section>
  );
}

function buildFileReadinessRow(
  family: FileFamily,
  record: SourceVendorResponseCompletenessRecord,
  profile?: VendorResponseProfile,
): FileReadinessRow {
  const citations = citationCountFor(family.key, profile);
  const upload = uploadStateFor(family.key, record, profile);
  const parse = parseStateFor(family.key, record, profile, citations);
  const doneTone = doneToneFor(family.requirement, upload.tone, parse.tone);

  return {
    ...family,
    vendorId: record.vendorId,
    vendorName: record.vendorName,
    uploadTone: upload.tone,
    uploadLabel: upload.label,
    parseTone: parse.tone,
    parseLabel: parse.label,
    citationCount: citations,
    doneTone,
    doneLabel:
      doneTone === "done" ? "Done" : doneTone === "missing" ? "Open" : "Review",
    nextAction: nextActionFor(family, record, upload.tone, parse.tone),
  };
}

function uploadStateFor(
  key: string,
  record: SourceVendorResponseCompletenessRecord,
  profile?: VendorResponseProfile,
): { tone: ReadinessTone; label: string } {
  if (key === "main_proposal") {
    if (record.responseStatus === "submitted")
      return { tone: "done", label: "Received" };
    if (record.responseStatus === "in_progress")
      return { tone: "review", label: "Partial" };
    return { tone: "missing", label: "Upload" };
  }
  if (key === "pricing_template") {
    return templateUploadState(record.pricingTemplateStatus);
  }
  if (key === "transition_plan") {
    return templateUploadState(record.transitionPlanStatus);
  }
  if (key === "sla_response") {
    if (hasExhibit(profile, "sla_commitments"))
      return { tone: "done", label: "Received" };
    return missingSectionState(record, /sla|service level/i, "Received");
  }
  if (key === "staffing_model") {
    if (hasExhibit(profile, "staffing_location_model"))
      return { tone: "done", label: "Received" };
    return missingSectionState(
      record,
      /staffing|delivery|location/i,
      "Received",
    );
  }
  if (key === "exceptions") {
    if (
      record.assumptions.length > 0 ||
      record.exclusions.length > 0 ||
      hasExhibit(profile, "commercial_exceptions") ||
      hasExhibit(profile, "assumptions_exclusions")
    ) {
      return { tone: "done", label: "Logged" };
    }
    return { tone: "review", label: "Confirm" };
  }
  if (
    record.evidenceStatus === "Parsed" ||
    (profile?.evidenceProvided.length ?? 0) > 0
  ) {
    return { tone: "done", label: "Received" };
  }
  return { tone: "neutral", label: "Optional" };
}

function parseStateFor(
  key: string,
  record: SourceVendorResponseCompletenessRecord,
  profile: VendorResponseProfile | undefined,
  citations: number,
): { tone: ReadinessTone; label: string } {
  const uploaded = uploadStateFor(key, record, profile);
  if (uploaded.tone === "missing") return { tone: "missing", label: "Missing" };
  if (record.evidenceStatus === "Low Confidence") {
    return { tone: "review", label: "Low confidence" };
  }
  if (citations > 0) return { tone: "done", label: "Parsed" };
  if (record.evidenceStatus === "Parsed") {
    return { tone: "review", label: "No citation" };
  }
  if (uploaded.tone === "neutral")
    return { tone: "neutral", label: "Not needed" };
  return { tone: "review", label: "Needs parse" };
}

function doneToneFor(
  requirement: Requirement,
  uploadTone: ReadinessTone,
  parseTone: ReadinessTone,
): ReadinessTone {
  if (requirement === "Optional" && uploadTone === "neutral") return "neutral";
  if (uploadTone === "done" && parseTone === "done") return "done";
  if (uploadTone === "missing" || parseTone === "missing") return "missing";
  return "review";
}

function nextActionFor(
  family: FileFamily,
  record: SourceVendorResponseCompletenessRecord,
  uploadTone: ReadinessTone,
  parseTone: ReadinessTone,
): string {
  if (uploadTone === "missing") return `Upload ${family.label.toLowerCase()}.`;
  if (parseTone === "missing")
    return `Load ${family.label.toLowerCase()} before parsing.`;
  if (parseTone === "review")
    return `Review ${family.label.toLowerCase()} extraction.`;
  if (family.requirement === "Required") {
    // Only surface a vendor-level blocker on the row it actually concerns.
    // Showing the first blocker on every required row attributed, for example,
    // an incomplete transition plan to the main proposal package.
    const pattern = BLOCKER_PATTERNS[family.key];
    const blocker = pattern
      ? record.blockers.find((item) => pattern.test(item))
      : undefined;
    if (blocker) return blocker;
  }
  if (family.requirement === "Optional") {
    return "Use only if it strengthens leverage or proof.";
  }
  return "Ready for scoring evidence.";
}

function templateUploadState(status: SourceVendorTemplateStatus): {
  tone: ReadinessTone;
  label: string;
} {
  if (status === "complete") return { tone: "done", label: "Received" };
  if (status === "incomplete") return { tone: "review", label: "Partial" };
  if (status === "not_applicable") return { tone: "neutral", label: "N/A" };
  return { tone: "missing", label: "Upload" };
}

function missingSectionState(
  record: SourceVendorResponseCompletenessRecord,
  pattern: RegExp,
  fallback: string,
): { tone: ReadinessTone; label: string } {
  if (record.missingSections.some((section) => pattern.test(section))) {
    return { tone: "missing", label: "Upload" };
  }
  if (record.responseStatus === "submitted")
    return { tone: "done", label: fallback };
  if (record.responseStatus === "in_progress")
    return { tone: "review", label: "Partial" };
  return { tone: "missing", label: "Upload" };
}

function citationCountFor(
  key: string,
  profile?: VendorResponseProfile,
): number {
  if (!profile) return 0;
  if (key === "main_proposal") {
    return unique([
      ...profile.extractionCards.map((card) => card.evidenceReference),
      ...profile.exhibits.map((exhibit) => exhibit.evidenceReference),
    ]).length;
  }
  if (key === "pricing_template") {
    return countByCardsAndExhibits(profile, ["pricing"], ["pricing_workbook"]);
  }
  if (key === "sla_response") {
    return countByCardsAndExhibits(profile, ["sla"], ["sla_commitments"]);
  }
  if (key === "staffing_model") {
    return countByCardsAndExhibits(
      profile,
      ["staffing"],
      ["staffing_location_model"],
    );
  }
  if (key === "transition_plan") {
    return countByCardsAndExhibits(
      profile,
      ["transition"],
      ["transition_milestones"],
    );
  }
  if (key === "exceptions") {
    return countByCardsAndExhibits(
      profile,
      ["assumption", "exception"],
      ["assumptions_exclusions", "commercial_exceptions"],
    );
  }
  return unique([
    ...profile.evidenceProvided,
    ...profile.extractionCards.map((card) => card.evidenceReference),
  ]).length;
}

function countByCardsAndExhibits(
  profile: VendorResponseProfile,
  cardTypes: VendorResponseProfile["extractionCards"][number]["type"][],
  exhibitKinds: VendorResponseExhibitKind[],
): number {
  return unique([
    ...profile.extractionCards
      .filter((card) => cardTypes.includes(card.type))
      .map((card) => card.evidenceReference),
    ...profile.exhibits
      .filter((exhibit) => exhibitKinds.includes(exhibit.kind))
      .map((exhibit) => exhibit.evidenceReference),
  ]).length;
}

function hasExhibit(
  profile: VendorResponseProfile | undefined,
  kind: VendorResponseExhibitKind,
): boolean {
  return Boolean(
    profile?.exhibits.some(
      (exhibit) => exhibit.kind === kind && exhibit.status !== "missing",
    ),
  );
}

function countDistinctCitations(
  records: readonly SourceVendorResponseCompletenessRecord[],
  profilesByVendorId: Map<string, VendorResponseProfile>,
): number {
  const references: Array<string | null> = [];
  for (const record of records) {
    const profile = profilesByVendorId.get(simplifyVendorKey(record.vendorId));
    if (!profile) continue;
    // Namespace by vendor so two vendors citing "Exhibit A" count separately.
    for (const card of profile.extractionCards) {
      if (card.evidenceReference) {
        references.push(`${record.vendorId}::${card.evidenceReference}`);
      }
    }
    for (const exhibit of profile.exhibits) {
      if (exhibit.evidenceReference) {
        references.push(`${record.vendorId}::${exhibit.evidenceReference}`);
      }
    }
  }
  return unique(references).length;
}

function unique(values: Array<string | null>): string[] {
  const seen = new Set<string>();
  return values
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim())
    .filter((value) => {
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

function simplifyVendorKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function StatusChip({ tone, label }: { tone: ReadinessTone; label: string }) {
  return (
    <span style={{ ...CHIP, ...TONE[tone] }}>
      <span style={CHIP_MARK}>{tone === "done" ? "✓" : ""}</span>
      <span>{label}</span>
    </span>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: ReadinessTone;
}) {
  return (
    <div style={{ ...METRIC, ...TONE[tone] }}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 14,
  display: "grid",
  gap: 12,
};

const HEADER: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 18,
  alignItems: "start",
};

const EYEBROW: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  fontWeight: 700,
};

const TITLE: CSSProperties = {
  margin: "4px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 23,
  lineHeight: 1.1,
  color: CANVAS.INK,
};

const COPY: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
  maxWidth: 820,
};

const MINIMUM_PACKAGE: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "#fbfaf6",
  color: CANVAS.INK_SOFT,
  display: "grid",
  gap: 4,
  marginTop: 10,
  maxWidth: 820,
  padding: "9px 10px",
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
};

const SUMMARY_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(86px, 1fr))",
  gap: 6,
};

const METRIC: CSSProperties = {
  border: "1px solid",
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: "8px 9px",
  display: "grid",
  gap: 2,
  minWidth: 86,
  fontSize: CANVAS.T_MICRO_SMALL,
};

const TABLE_WRAP: CSSProperties = {
  overflowX: "auto",
};

const TABLE: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1180,
};

const TH: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.RULE}`,
  padding: "8px 8px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  textAlign: "center",
  verticalAlign: "bottom",
};

const TD_VENDOR: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "9px 8px",
  color: CANVAS.INK,
  minWidth: 130,
};

const TD_FILE: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "9px 8px",
  color: CANVAS.INK,
  minWidth: 172,
};

const TD_TEXT: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "9px 8px",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.35,
  minWidth: 132,
};

const TD_CENTER: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "9px 7px",
  textAlign: "center",
  verticalAlign: "middle",
};

const TD_ACTION: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "9px 8px",
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.35,
  minWidth: 210,
};

const REQUIREMENT_BADGE: CSSProperties = {
  border: "1px solid",
  borderRadius: 999,
  padding: "3px 7px",
  display: "inline-flex",
  width: "fit-content",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const REQUIREMENT_TONE: Record<Requirement, CSSProperties> = {
  Required: {
    color: CANVAS.BLOCKED,
    borderColor: CANVAS.BLOCKED,
    background: "rgba(163,45,45,0.06)",
  },
  Conditional: {
    color: CANVAS.WAITING,
    borderColor: CANVAS.WAITING,
    background: "rgba(186,117,23,0.06)",
  },
  Optional: {
    color: CANVAS.INK_MUTED,
    borderColor: CANVAS.RULE,
    background: CANVAS.SURFACE_HOVER,
  },
};

const CHIP: CSSProperties = {
  border: "1px solid",
  borderRadius: 999,
  padding: "3px 7px",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  minWidth: 82,
  justifyContent: "center",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  fontWeight: 800,
};

const CHIP_MARK: CSSProperties = {
  display: "inline-grid",
  placeItems: "center",
  width: 12,
  height: 12,
  borderRadius: 999,
  lineHeight: 1,
};

const FORMAT: CSSProperties = {
  color: CANVAS.INK_SOFT,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.04em",
};

const EVIDENCE: CSSProperties = {
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
};

const TONE: Record<ReadinessTone, CSSProperties> = {
  done: {
    color: CANVAS.ACTIVE,
    borderColor: CANVAS.ACTIVE,
    background: "rgba(29,158,117,0.06)",
  },
  review: {
    color: CANVAS.WAITING,
    borderColor: CANVAS.WAITING,
    background: "rgba(186,117,23,0.06)",
  },
  missing: {
    color: CANVAS.BLOCKED,
    borderColor: CANVAS.BLOCKED,
    background: "rgba(163,45,45,0.06)",
  },
  neutral: {
    color: CANVAS.INK_MUTED,
    borderColor: CANVAS.RULE,
    background: CANVAS.SURFACE_HOVER,
  },
};

const EMPTY: CSSProperties = {
  border: `1px dashed ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.SURFACE_HOVER,
  padding: 12,
  display: "grid",
  gap: 4,
  color: CANVAS.INK,
};

const FOOTNOTE: CSSProperties = {
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  paddingTop: 9,
  color: CANVAS.INK_MUTED,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

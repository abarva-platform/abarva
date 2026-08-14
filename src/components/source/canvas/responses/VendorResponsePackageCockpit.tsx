"use client";

import type { CSSProperties } from "react";
import type {
  SourceVendorResponseCompleteness,
  SourceVendorResponseCompletenessRecord,
  SourceVendorTemplateStatus,
} from "@/lib/source/vendor-response-types";
import type {
  VendorResponseProfile,
  VendorResponseProfileSet,
} from "@/lib/source/proposal-intelligence";
import {
  VENDOR_RESPONSE_ACCEPTED_FORMATS,
  VENDOR_RESPONSE_FILE_FAMILIES,
  VENDOR_RESPONSE_REQUIRED_FILE_COUNT,
  type VendorResponseFileRequirement,
} from "@/lib/source/vendor-response-upload-package-policy";
import { CANVAS } from "../canvas-tokens";

type PackageCellState =
  | "received"
  | "partial"
  | "missing"
  | "needs_review"
  | "not_ready";
type ProposalHealthState = "ready" | "conditional" | "blocked";

interface PackageComponent {
  key: string;
  label: string;
  state: PackageCellState;
  detail: string;
}

interface PackageRequirement {
  label: string;
  requirement: VendorResponseFileRequirement;
  detail: string;
}

// Derived from the single Responses-stage upload policy so this strip and the
// file-readiness ledger below it can never disagree about what is required.
const PACKAGE_REQUIREMENTS: PackageRequirement[] =
  VENDOR_RESPONSE_FILE_FAMILIES.map((family) => ({
    label: family.label,
    requirement: family.requirement,
    detail: family.shortDetail,
  }));

const COMPONENTS: Array<{
  key: string;
  label: string;
  detailFor: (
    record: SourceVendorResponseCompletenessRecord,
    profile?: VendorResponseProfile,
  ) => Pick<PackageComponent, "state" | "detail">;
}> = [
  {
    key: "response",
    label: "Response",
    detailFor: (record, profile) => {
      if (record.responseStatus === "submitted") {
        return {
          state: "received",
          detail: profile?.narrativePageEquivalent ?? "Received",
        };
      }
      if (record.responseStatus === "in_progress") {
        return { state: "partial", detail: "In progress" };
      }
      return { state: "missing", detail: "Not received" };
    },
  },
  {
    key: "pricing",
    label: "Pricing",
    detailFor: (record) => statusToPackageState(record.pricingTemplateStatus),
  },
  {
    key: "sla",
    label: "SLA",
    detailFor: (record, profile) => {
      const exhibit = profile?.exhibits.find(
        (item) => item.kind === "sla_commitments",
      );
      if (exhibit) return exhibitToPackageState(exhibit.status, exhibit.issue);
      const missing = record.missingSections.some((section) =>
        /sla/i.test(section),
      );
      return missing
        ? { state: "missing", detail: "SLA section missing" }
        : { state: "received", detail: "Section present" };
    },
  },
  {
    key: "staffing",
    label: "Staffing",
    detailFor: (record, profile) => {
      const exhibit = profile?.exhibits.find(
        (item) => item.kind === "staffing_location_model",
      );
      if (exhibit) return exhibitToPackageState(exhibit.status, exhibit.issue);
      const missing = record.missingSections.some((section) =>
        /staffing|delivery/i.test(section),
      );
      return missing
        ? { state: "missing", detail: "Staffing support missing" }
        : { state: "received", detail: "Section present" };
    },
  },
  {
    key: "transition",
    label: "Transition",
    detailFor: (record) => statusToPackageState(record.transitionPlanStatus),
  },
  {
    key: "exceptions",
    label: "Exceptions",
    detailFor: (record, profile) => {
      const exhibit = profile?.exhibits.find(
        (item) => item.kind === "commercial_exceptions",
      );
      if (exhibit) return exhibitToPackageState(exhibit.status, exhibit.issue);
      if (record.assumptions.length === 0 || record.exclusions.length === 0) {
        return { state: "needs_review", detail: "Assumptions gap" };
      }
      return { state: "received", detail: "Logged" };
    },
  },
  {
    key: "evidence",
    label: "Evidence",
    detailFor: (record, profile) => {
      const exhibit = profile?.exhibits.find(
        (item) => item.kind === "evidence_index",
      );
      if (exhibit) return exhibitToPackageState(exhibit.status, exhibit.issue);
      if (record.evidenceStatus === "Parsed") {
        return { state: "received", detail: "Parsed" };
      }
      if (record.evidenceStatus === "Low Confidence") {
        return { state: "needs_review", detail: "Low confidence" };
      }
      return { state: "partial", detail: record.evidenceStatus };
    },
  },
];

export function VendorResponsePackageCockpit({
  readiness,
  profileSet,
}: {
  readiness?: SourceVendorResponseCompleteness;
  profileSet?: VendorResponseProfileSet | null;
}) {
  const records = readiness?.records ?? [];
  const profilesByVendorId = new Map(
    (profileSet?.profiles ?? []).map((profile) => [
      simplifyVendorKey(profile.vendorId),
      profile,
    ]),
  );
  const rows = records.map((record) =>
    buildRow(
      record,
      profilesByVendorId.get(simplifyVendorKey(record.vendorId)),
    ),
  );
  const readyCount = rows.filter(
    (row) => row.proposalHealthState === "ready",
  ).length;
  const conditionalCount = rows.filter(
    (row) => row.proposalHealthState === "conditional",
  ).length;
  const blockedCount = rows.filter(
    (row) => row.proposalHealthState === "blocked",
  ).length;

  return (
    <section
      data-testid="source-vendor-response-package-cockpit"
      style={CARD}
      aria-label="Vendor response package cockpit"
    >
      <div style={HEADER}>
        <div>
          <div style={EYEBROW}>Responses package cockpit</div>
          <h3 style={TITLE}>
            What vendors submitted, what parsed, what can be scored
          </h3>
          <p style={COPY}>
            Each vendor response is treated as a package. Main proposal,
            pricing, SLA, staffing, transition, exceptions, and evidence
            readiness stay separate so a long PDF never becomes a false green
            check.
          </p>
        </div>
        <div style={SUMMARY_GRID} aria-label="Proposal health summary">
          <Metric label="Ready" value={String(readyCount)} tone="good" />
          <Metric
            label="Conditional"
            value={String(conditionalCount)}
            tone="warn"
          />
          <Metric label="Blocked" value={String(blockedCount)} tone="bad" />
        </div>
      </div>

      <PackageRequirementStrip />

      {rows.length === 0 ? (
        <div style={EMPTY}>
          <strong>No vendor packages are bound yet.</strong>
          <span>
            Upload response packages by vendor before evaluation. Source should
            show received, parsed, needs-review, and blocked states before any
            scoring begins.
          </span>
        </div>
      ) : (
        <div style={TABLE_WRAP}>
          <table style={TABLE}>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: "left" }}>Vendor</th>
                {COMPONENTS.map((component) => (
                  <th key={component.key} style={TH}>
                    {component.label}
                  </th>
                ))}
                <th style={TH}>Proposal health</th>
                <th style={{ ...TH, textAlign: "left" }}>
                  Next leverage action
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.vendorId}>
                  <td style={TD_VENDOR}>
                    <strong>{row.vendorName}</strong>
                    <span>{row.receiptLabel}</span>
                  </td>
                  {row.components.map((component) => (
                    <td key={component.key} style={TD_CENTER}>
                      <PackageCell component={component} />
                    </td>
                  ))}
                  <td style={TD_CENTER}>
                    <span
                      style={{
                        ...PILL,
                        ...HEALTH_TONE[row.proposalHealthState],
                      }}
                    >
                      {row.proposalHealthLabel}
                    </span>
                    <span style={TD_NOTE}>{row.proposalHealthDetail}</span>
                  </td>
                  <td style={TD_ACTION}>
                    <strong>{row.leverageAction}</strong>
                    <span>{row.evidenceBoundary}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={FOOTNOTE}>
        Proposal health is a first-pass readiness view. It does not claim full
        long-form proposal extraction unless parsed, vendor-isolated evidence is
        available and cited.
      </div>
    </section>
  );
}

function PackageRequirementStrip() {
  return (
    <div
      style={REQUIREMENT_STRIP}
      aria-label="Vendor response package requirements"
    >
      <div style={REQUIREMENT_INTRO}>
        <span style={EYEBROW}>Upload package</span>
        <strong>
          {VENDOR_RESPONSE_REQUIRED_FILE_COUNT} required files per vendor
        </strong>
        <span>
          Conditional content may arrive inside the main proposal. Accepted
          formats: {VENDOR_RESPONSE_ACCEPTED_FORMATS}.
        </span>
      </div>
      <div style={REQUIREMENT_GRID}>
        {PACKAGE_REQUIREMENTS.map((item) => (
          <div key={item.label} style={REQUIREMENT_ITEM}>
            <span
              style={{
                ...REQUIREMENT_BADGE,
                ...REQUIREMENT_TONE[item.requirement],
              }}
            >
              {item.requirement}
            </span>
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildRow(
  record: SourceVendorResponseCompletenessRecord,
  profile?: VendorResponseProfile,
) {
  const components = COMPONENTS.map((component) => ({
    key: component.key,
    label: component.label,
    ...component.detailFor(record, profile),
  }));
  const missingCount = components.filter((component) =>
    ["missing", "not_ready"].includes(component.state),
  ).length;
  const reviewCount = components.filter((component) =>
    ["partial", "needs_review"].includes(component.state),
  ).length;
  const hasRequiredGap =
    record.missingSections.length > 0 ||
    record.blockers.length > 0 ||
    record.pricingTemplateStatus !== "complete";
  const proposalHealthState: ProposalHealthState =
    record.comparabilityStatus === "blocked" ||
    record.comparabilityStatus === "not_comparable" ||
    hasRequiredGap ||
    missingCount > 0 ||
    profile?.readyForEvaluation === "no"
      ? "blocked"
      : record.comparabilityStatus === "partially_comparable" ||
          reviewCount > 0 ||
          profile?.readyForEvaluation === "conditional"
        ? "conditional"
        : "ready";
  const unsupportedClaims = profile?.unsupportedClaims.length ?? 0;
  const proposalHealthDetail =
    unsupportedClaims > 0
      ? `${unsupportedClaims} unsupported claim${unsupportedClaims === 1 ? "" : "s"}`
      : record.missingSections.length > 0
        ? `${record.missingSections.length} missing section${record.missingSections.length === 1 ? "" : "s"}`
        : "No major package gap";
  const leverageAction =
    profile?.clarificationQuestions[0] ??
    record.recommendedNextAction ??
    "Keep clarifications open until scoring is locked.";

  return {
    vendorId: record.vendorId,
    vendorName: record.vendorName,
    receiptLabel:
      record.receivedAt && record.responseStatus === "submitted"
        ? `Received ${formatDate(record.receivedAt)}`
        : record.responseStatus.replaceAll("_", " "),
    components,
    proposalHealthState,
    proposalHealthLabel:
      proposalHealthState === "ready"
        ? "Ready"
        : proposalHealthState === "conditional"
          ? "Conditional"
          : "Do not score",
    proposalHealthDetail,
    leverageAction,
    evidenceBoundary:
      profile?.syntheticDemo === true
        ? "Demo profile: prove with parsed vendor files before client scoring."
        : "Use only cited package evidence for scoring and BAFO.",
  };
}

function statusToPackageState(
  status: SourceVendorTemplateStatus,
): Pick<PackageComponent, "state" | "detail"> {
  if (status === "complete") return { state: "received", detail: "Complete" };
  if (status === "incomplete")
    return { state: "partial", detail: "Incomplete" };
  if (status === "missing" || status === "not_started") {
    return { state: "missing", detail: "Missing" };
  }
  return { state: "not_ready", detail: "Not applicable" };
}

function exhibitToPackageState(
  status: "complete" | "partial" | "missing",
  issue: string | null,
): Pick<PackageComponent, "state" | "detail"> {
  if (status === "complete" && !issue) {
    return { state: "received", detail: "Complete" };
  }
  if (status === "complete" && issue) {
    return { state: "needs_review", detail: issue };
  }
  if (status === "partial") {
    return { state: "partial", detail: issue ?? "Partial" };
  }
  return { state: "missing", detail: issue ?? "Missing" };
}

function simplifyVendorKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function formatDate(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(parsed));
}

function PackageCell({ component }: { component: PackageComponent }) {
  return (
    <span style={{ ...CELL, ...CELL_STATE[component.state] }}>
      <span style={CELL_DOT} aria-hidden="true" />
      <span>{labelForState(component.state)}</span>
      <small style={CELL_DETAIL}>{component.detail}</small>
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
  tone: "good" | "warn" | "bad";
}) {
  return (
    <div style={{ ...METRIC, ...METRIC_TONE[tone] }}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function labelForState(state: PackageCellState): string {
  if (state === "received") return "OK";
  if (state === "partial") return "Partial";
  if (state === "needs_review") return "Review";
  if (state === "not_ready") return "N/A";
  return "Missing";
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 14,
  display: "grid",
  gap: 12,
  minWidth: 0,
};

const HEADER: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 240px)",
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

const SUMMARY_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(74px, 1fr))",
  gap: 6,
  minWidth: 0,
};

const METRIC: CSSProperties = {
  border: "1px solid",
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: "8px 9px",
  display: "grid",
  gap: 2,
  minWidth: 74,
};

const METRIC_TONE: Record<"good" | "warn" | "bad", CSSProperties> = {
  good: {
    color: CANVAS.ACTIVE,
    borderColor: CANVAS.ACTIVE,
    background: "rgba(29,158,117,0.06)",
  },
  warn: {
    color: CANVAS.WAITING,
    borderColor: CANVAS.WAITING,
    background: "rgba(186,117,23,0.06)",
  },
  bad: {
    color: CANVAS.BLOCKED,
    borderColor: CANVAS.BLOCKED,
    background: "rgba(163,45,45,0.06)",
  },
};

const REQUIREMENT_STRIP: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.SURFACE_HOVER,
  padding: 12,
  display: "grid",
  gridTemplateColumns: "minmax(0, 190px) minmax(0, 1fr)",
  gap: 12,
  alignItems: "stretch",
  minWidth: 0,
};

const REQUIREMENT_INTRO: CSSProperties = {
  borderRight: `1px solid ${CANVAS.HAIRLINE}`,
  paddingRight: 12,
  display: "grid",
  alignContent: "center",
  gap: 4,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
};

const REQUIREMENT_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))",
  gap: 8,
  minWidth: 0,
};

const REQUIREMENT_ITEM: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: "8px 9px",
  display: "grid",
  alignContent: "start",
  gap: 5,
  color: CANVAS.INK,
  fontSize: 11,
  lineHeight: 1.25,
  minHeight: 96,
};

const REQUIREMENT_BADGE: CSSProperties = {
  border: "1px solid",
  borderRadius: 999,
  padding: "2px 6px",
  width: "fit-content",
  fontFamily: CANVAS.MONO,
  fontSize: 8,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const REQUIREMENT_TONE: Record<
  PackageRequirement["requirement"],
  CSSProperties
> = {
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

const TABLE_WRAP: CSSProperties = {
  overflowX: "auto",
  minWidth: 0,
};

const TABLE: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1080,
};

const TH: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.RULE}`,
  padding: "8px 9px",
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
  padding: "10px 9px",
  color: CANVAS.INK,
  display: "grid",
  gap: 3,
  minWidth: 180,
};

const TD_CENTER: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "10px 7px",
  textAlign: "center",
  verticalAlign: "top",
};

const TD_ACTION: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "10px 9px",
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
  display: "grid",
  gap: 4,
  minWidth: 260,
};

const TD_NOTE: CSSProperties = {
  display: "block",
  marginTop: 4,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_MICRO_SMALL,
  lineHeight: 1.35,
};

const CELL: CSSProperties = {
  border: "1px solid",
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: "7px 8px",
  display: "grid",
  gap: 3,
  justifyItems: "center",
  minWidth: 92,
  maxWidth: 136,
  margin: "0 auto",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  fontWeight: 800,
};

const CELL_DOT: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: 999,
  background: "currentColor",
};

const CELL_DETAIL: CSSProperties = {
  maxWidth: 112,
  color: "inherit",
  fontFamily: CANVAS.SANS,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0,
  lineHeight: 1.25,
  textTransform: "none",
  overflowWrap: "anywhere",
};

const CELL_STATE: Record<PackageCellState, CSSProperties> = {
  received: {
    color: CANVAS.ACTIVE,
    borderColor: CANVAS.ACTIVE,
    background: "rgba(29,158,117,0.06)",
  },
  partial: {
    color: CANVAS.WAITING,
    borderColor: CANVAS.WAITING,
    background: "rgba(186,117,23,0.06)",
  },
  needs_review: {
    color: CANVAS.WAITING,
    borderColor: CANVAS.WAITING,
    background: "rgba(186,117,23,0.06)",
  },
  missing: {
    color: CANVAS.BLOCKED,
    borderColor: CANVAS.BLOCKED,
    background: "rgba(163,45,45,0.06)",
  },
  not_ready: {
    color: CANVAS.INK_MUTED,
    borderColor: CANVAS.RULE,
    background: CANVAS.SURFACE_HOVER,
  },
};

const PILL: CSSProperties = {
  display: "inline-flex",
  border: "1px solid",
  borderRadius: 999,
  padding: "3px 8px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 800,
};

const HEALTH_TONE: Record<"ready" | "conditional" | "blocked", CSSProperties> =
  {
    ready: {
      color: CANVAS.ACTIVE,
      borderColor: CANVAS.ACTIVE,
      background: "rgba(29,158,117,0.06)",
    },
    conditional: {
      color: CANVAS.WAITING,
      borderColor: CANVAS.WAITING,
      background: "rgba(186,117,23,0.06)",
    },
    blocked: {
      color: CANVAS.BLOCKED,
      borderColor: CANVAS.BLOCKED,
      background: "rgba(163,45,45,0.06)",
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

"use client";

import type { CSSProperties } from "react";
import type { VendorResponseParseReport } from "@/lib/source/proposal-intelligence";
import { CANVAS } from "../canvas-tokens";

type Tone = "done" | "review" | "blocked" | "neutral";

interface IngestionStep {
  label: string;
  status: string;
  tone: Tone;
  owner: string;
  output: string;
  nextAction: string;
}

export function VendorResponseIngestionPathPanel({
  parseReports,
}: {
  parseReports?: VendorResponseParseReport[];
}) {
  const reports = parseReports ?? [];
  const summary = buildSummary(reports);
  const steps = buildSteps(reports, summary);

  return (
    <section
      data-testid="source-vendor-response-ingestion-path"
      style={CARD}
      aria-label="Vendor response ingestion path"
    >
      <div style={HEADER}>
        <div>
          <div style={EYEBROW}>Long response intake</div>
          <h3 style={TITLE}>How 75-100 page proposals become score evidence</h3>
          <p style={COPY}>
            Source does not treat an uploaded file as score evidence by itself.
            The package must stay vendor-isolated, parse into section findings,
            produce citations, and clear score holdbacks before it can feed
            Evaluation, BAFO, CXO decision, or value proof.
          </p>
        </div>
        <div style={SUMMARY_GRID}>
          <Metric
            label="Vendor packages"
            value={String(summary.vendors)}
            tone="neutral"
          />
          <Metric
            label="Parser citations"
            value={String(summary.citations)}
            tone={summary.citations > 0 ? "done" : "review"}
          />
          <Metric
            label="Score ready"
            value={`${summary.readyToScore}/${summary.vendors || 0}`}
            tone={
              summary.vendors > 0 && summary.readyToScore === summary.vendors
                ? "done"
                : "review"
            }
          />
        </div>
      </div>

      <div style={STEP_TABLE}>
        <div style={STEP_HEAD}>Step</div>
        <div style={STEP_HEAD}>Status</div>
        <div style={STEP_HEAD}>Owner</div>
        <div style={STEP_HEAD}>Output</div>
        <div style={STEP_HEAD}>Next action</div>
        {steps.map((step) => (
          <IngestionStepRow key={step.label} step={step} />
        ))}
      </div>

      <div style={FOOTNOTE}>
        AI is not the parser. Parser output is only usable when the file is
        isolated to the vendor, mapped to requested sections, and backed by
        citations with visible holdbacks for missing or weak evidence.
      </div>
    </section>
  );
}

function buildSummary(reports: VendorResponseParseReport[]) {
  return {
    vendors: reports.length,
    parsedDocuments: reports.reduce(
      (sum, report) => sum + report.parsedDocumentCount,
      0,
    ),
    citations: reports.reduce((sum, report) => sum + report.citationCount, 0),
    blockers: reports.reduce(
      (sum, report) =>
        sum +
        report.missingInputs.filter((input) => input.severity === "blocker")
          .length,
      0,
    ),
    holdbacks: reports.reduce(
      (sum, report) =>
        sum +
        report.missingInputs.filter((input) => input.severity === "holdback")
          .length,
      0,
    ),
    isolationBlocks: reports.filter(
      (report) => report.vendorIsolationStatus === "violation_detected",
    ).length,
    readyToScore: reports.filter(
      (report) => report.scoreReadiness === "ready_to_score",
    ).length,
    answeredSections: reports.reduce(
      (sum, report) =>
        sum +
        report.sectionFindings.filter(
          (finding) => finding.status === "answered",
        ).length,
      0,
    ),
    weakSections: reports.reduce(
      (sum, report) =>
        sum +
        report.sectionFindings.filter((finding) => finding.status === "weak")
          .length,
      0,
    ),
    missingSections: reports.reduce(
      (sum, report) =>
        sum +
        report.sectionFindings.filter((finding) => finding.status === "missing")
          .length,
      0,
    ),
  };
}

function buildSteps(
  reports: VendorResponseParseReport[],
  summary: ReturnType<typeof buildSummary>,
): IngestionStep[] {
  const hasReports = reports.length > 0;
  const allRequiredRolesReady =
    hasReports &&
    reports.every((report) =>
      report.fileRoleReadiness
        .filter((role) => role.required)
        .every((role) => role.uploaded && role.parsed),
    );
  const anyNotParseable = reports.some(
    (report) => report.status === "not_parseable",
  );
  const allParsed =
    hasReports &&
    reports.every(
      (report) =>
        report.status === "parsed" || report.status === "parsed_with_gaps",
    );

  return [
    {
      label: "Vendor package intake",
      status: allRequiredRolesReady
        ? "Required files loaded"
        : hasReports
          ? "Required files incomplete"
          : "Awaiting packages",
      tone: allRequiredRolesReady ? "done" : hasReports ? "review" : "neutral",
      owner: "Vendor response lead",
      output: "Main proposal and pricing workbook per vendor",
      nextAction: allRequiredRolesReady
        ? "Move to parser readiness."
        : "Load one main proposal and one pricing workbook for each vendor.",
    },
    {
      label: "Vendor isolation",
      status:
        summary.isolationBlocks > 0
          ? `${summary.isolationBlocks} blocked`
          : hasReports
            ? "Vendor scoped"
            : "Not started",
      tone:
        summary.isolationBlocks > 0
          ? "blocked"
          : hasReports
            ? "done"
            : "neutral",
      owner: "Source steward",
      output: "Tenant, event, vendor, and response version boundary",
      nextAction:
        summary.isolationBlocks > 0
          ? "Remove rival-vendor documents from the package."
          : "Keep each vendor package separate through scoring.",
    },
    {
      label: "Parse and section map",
      status: anyNotParseable
        ? "Parse blocked"
        : allParsed
          ? `${summary.parsedDocuments} docs parsed`
          : "Parser waiting",
      tone: anyNotParseable ? "blocked" : allParsed ? "done" : "review",
      owner: "Parsing pipeline",
      output: `${summary.answeredSections} answered, ${summary.weakSections} weak, ${summary.missingSections} missing sections`,
      nextAction: anyNotParseable
        ? "Upload parseable PDF, DOCX, XLSX, or CSV files."
        : "Review weak and missing sections before scoring.",
    },
    {
      label: "Citation inventory",
      status:
        summary.citations > 0
          ? `${summary.citations} citations`
          : "No citations",
      tone: summary.citations > 0 ? "done" : "review",
      owner: "Evidence reviewer",
      output: "Section-level citations with file and locator",
      nextAction:
        summary.citations > 0
          ? "Use citations in evaluator notes and BAFO asks."
          : "Do not score claims until citations are available.",
    },
    {
      label: "Score gate",
      status:
        summary.readyToScore === reports.length && reports.length > 0
          ? "Ready to score"
          : `${summary.blockers} blockers, ${summary.holdbacks} holdbacks`,
      tone:
        summary.readyToScore === reports.length && reports.length > 0
          ? "done"
          : summary.blockers > 0
            ? "blocked"
            : "review",
      owner: "Evaluation lead",
      output: "AI suggested score posture with human-owned final score",
      nextAction:
        summary.blockers > 0 || summary.holdbacks > 0
          ? "Close required evidence gaps or accept visible caveats."
          : "Proceed to evaluator scoring.",
    },
    {
      label: "Decision outputs",
      status: hasReports ? "Ready for decision proof" : "Waiting on parsing",
      tone: hasReports ? "done" : "neutral",
      owner: "Procurement and sponsor",
      output: "BAFO asks, CXO conditions, and value proof guardrails",
      nextAction: hasReports
        ? "Review Decision proof before moving to Evaluation."
        : "Parse vendor packages before generating leverage or value proof.",
    },
  ];
}

function IngestionStepRow({ step }: { step: IngestionStep }) {
  return (
    <>
      <div style={STEP_CELL}>
        <strong>{step.label}</strong>
      </div>
      <div style={STEP_CELL}>
        <StatusChip tone={step.tone} label={step.status} />
      </div>
      <div style={STEP_CELL}>{step.owner}</div>
      <div style={STEP_CELL}>{step.output}</div>
      <div style={STEP_ACTION}>{step.nextAction}</div>
    </>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div style={{ ...METRIC, ...TONE_STYLE[tone] }}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusChip({ tone, label }: { tone: Tone; label: string }) {
  return <span style={{ ...CHIP, ...TONE_STYLE[tone] }}>{label}</span>;
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 14,
  display: "grid",
  gap: 14,
};

const HEADER: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(250px, 380px)",
  gap: 14,
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
  margin: "6px 0 0",
  fontSize: CANVAS.T_BODY,
  lineHeight: 1.5,
  color: CANVAS.INK_MUTED,
};

const SUMMARY_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
};

const METRIC: CSSProperties = {
  borderRadius: CANVAS.RADIUS_TIGHT,
  border: `1px solid ${CANVAS.RULE}`,
  padding: 10,
  display: "grid",
  gap: 4,
  fontSize: CANVAS.T_MICRO,
  textTransform: "uppercase",
  fontFamily: CANVAS.MONO,
  color: CANVAS.INK_MUTED,
};

const STEP_TABLE: CSSProperties = {
  display: "grid",
  // The status column holds a nowrap pill; at 118px the longest label
  // ("READY FOR DECISION PROOF", 162px) overflowed into the owner column.
  gridTemplateColumns:
    "minmax(150px, 0.85fr) minmax(178px, 0.75fr) minmax(130px, 0.75fr) minmax(210px, 1.2fr) minmax(230px, 1.2fr)",
  borderTop: `1px solid ${CANVAS.RULE}`,
  borderLeft: `1px solid ${CANVAS.RULE}`,
  overflowX: "auto",
};

const STEP_HEAD: CSSProperties = {
  padding: "8px 10px",
  borderRight: `1px solid ${CANVAS.RULE}`,
  borderBottom: `1px solid ${CANVAS.RULE}`,
  background: "#F8F7F4",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: CANVAS.INK_MUTED,
};

const STEP_CELL: CSSProperties = {
  padding: "9px 10px",
  borderRight: `1px solid ${CANVAS.RULE}`,
  borderBottom: `1px solid ${CANVAS.RULE}`,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.35,
  color: CANVAS.INK,
};

const STEP_ACTION: CSSProperties = {
  ...STEP_CELL,
  color: CANVAS.INK_SOFT,
};

const CHIP: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 24,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 999,
  padding: "3px 8px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const TONE_STYLE = {
  done: { background: "#ECFDF3", borderColor: "#A7F3D0" },
  review: { background: "#FFF7ED", borderColor: "#FED7AA" },
  blocked: { background: "#FEF2F2", borderColor: "#FECACA" },
  neutral: { background: "#F8F7F4", borderColor: CANVAS.RULE },
} satisfies Record<Tone, CSSProperties>;

const FOOTNOTE: CSSProperties = {
  borderTop: `1px solid ${CANVAS.RULE}`,
  paddingTop: 10,
  color: CANVAS.INK_MUTED,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

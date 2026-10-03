import "server-only";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  type DocumentProps,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";

import {
  chapterDepth,
  type EstateRecordTypes,
} from "@/components/home/v4/chapter-page-content";
import type { Finding, TableSpec } from "@/components/home/v4/page-tables";
import {
  enterpriseContextExportAbsence,
  enterpriseContextExportSection,
  type EnterpriseContextAbsence,
} from "./enterprise-context";
import type { HomeEnterpriseContext } from "@/lib/home/preview/ecl-enterprise-context";
import {
  homeNarrativeStatusLabel,
  homePriorInterpretationLabel,
  homeRecordSourceLabel,
  homeSourceCoverageGapLabel,
  homeSourceCoverageLabel,
  homeSourceDateCoverageLabel,
  homeSourceFileReviewLabel,
} from "@/lib/home/preview/record-source";
import type {
  ChapterView,
  HomeRecordRenderSource,
  HomeReviewBundle,
  TechObjectType,
  TechRecordType,
} from "@/lib/home/preview/types";

type ExportFormat = "html" | "pdf";

export interface HomeWalkthroughExportInput {
  bundle: HomeReviewBundle;
  recordSource: HomeRecordRenderSource;
  tenantLabel: string;
  format: ExportFormat;
}

const RECORD_TYPE_ORDER: TechObjectType[] = [
  "application_system",
  "vendor_contract",
  "infrastructure_platform",
  "data_asset_or_integration",
  "metric_outcome",
  "risk_control",
  "program_initiative",
  "organization_ownership",
  "ai_use_case",
  "executive_interview",
  "relationship_edge",
];

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function markerScope(recordSource: HomeRecordRenderSource): string {
  return recordSource.kind === "ecl_serving_projection"
    ? "Serving-row marker; governed facts are counted separately from the exported record families above."
    : "Record-source marker for the exported Home bundle.";
}

function mixedNarrative(recordSource: HomeRecordRenderSource): boolean {
  return (
    recordSource.kind === "ecl_serving_projection" &&
    recordSource.contextVersion?.coherence !== "coherent"
  );
}

function text(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatCompiledDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));
}

function recordType(
  bundle: HomeReviewBundle,
  objectType: TechObjectType,
): TechRecordType | undefined {
  return bundle.technologyEstate?.recordTypes.find(
    (type) => type.objectType === objectType,
  );
}

function estateFromBundle(bundle: HomeReviewBundle): EstateRecordTypes {
  return {
    asOf: bundle.contextVersion?.dataAsOf ?? undefined,
    applications: recordType(bundle, "application_system")?.rows,
    vendors: recordType(bundle, "vendor_contract")?.rows,
    infrastructure: recordType(bundle, "infrastructure_platform")?.rows,
    data: recordType(bundle, "data_asset_or_integration")?.rows,
    metrics: recordType(bundle, "metric_outcome")?.rows,
    risks: recordType(bundle, "risk_control")?.rows,
    programs: recordType(bundle, "program_initiative")?.rows,
    organization: recordType(bundle, "organization_ownership")?.rows,
    ai: recordType(bundle, "ai_use_case")?.rows,
    interviews: recordType(bundle, "executive_interview")?.rows,
    relationships: recordType(bundle, "relationship_edge")?.rows,
  };
}

function tableHtml(table: TableSpec): string {
  const head = table.columns
    .map((column) => `<th>${escapeHtml(column)}</th>`)
    .join("");
  const rows = table.rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
    )
    .join("");
  const total = table.total
    ? `<tr class="total">${table.total.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
    : "";
  return `<section class="table-block">
    <h4>${escapeHtml(table.caption)}</h4>
    <table><thead><tr>${head}</tr></thead><tbody>${rows}${total}</tbody></table>
    ${table.note ? `<p class="note">${escapeHtml(table.note)}</p>` : ""}
  </section>`;
}

function findingHtml(finding: Finding): string {
  return `<li>
    <strong>${escapeHtml(finding.claim)}</strong>
    <span>Owner: ${escapeHtml(finding.owner)}</span>
    <span>Basis: ${escapeHtml(finding.because)}</span>
    ${
      finding.trace
        ? `<span>Rule; source mapping pending: ${escapeHtml(finding.trace.rule)}. One row means ${escapeHtml(finding.trace.grain)}.</span>`
        : ""
    }
  </li>`;
}

function familySummaryHtml(bundle: HomeReviewBundle): string {
  const types = bundle.technologyEstate?.recordTypes ?? [];
  const rows = RECORD_TYPE_ORDER.map((objectType) =>
    types.find((type) => type.objectType === objectType),
  )
    .filter((type): type is TechRecordType => Boolean(type))
    .map(
      (type) =>
        `<tr><td>${escapeHtml(type.label)}</td><td>${type.rows.length.toLocaleString()}</td></tr>`,
    )
    .join("");
  return `<section class="block">
    <h2>Evidence Families</h2>
    <table><thead><tr><th>Family</th><th>Rows</th></tr></thead><tbody>${rows}</tbody></table>
  </section>`;
}

function exhibitSummary(bundle: HomeReviewBundle) {
  const applications = recordType(bundle, "application_system");
  const data = recordType(bundle, "data_asset_or_integration");
  const infrastructure = recordType(bundle, "infrastructure_platform");
  return [
    {
      label: "Architecture",
      summary: `${(applications?.rows.length ?? 0).toLocaleString()} applications and ${(infrastructure?.rows.length ?? 0).toLocaleString()} platforms in the exported Home record.`,
    },
    {
      label: "Data flow",
      summary: `${(data?.rows.length ?? 0).toLocaleString()} data asset and integration records available for the exhibit; this is not a count of verified flows.`,
    },
    {
      label: "Record browser",
      summary:
        "All family counts above come from the same technology estate bundle as the rendered page.",
    },
  ];
}

function architectureSummaryHtml(bundle: HomeReviewBundle): string {
  return `<section class="block">
    <h2>Current-State Exhibits</h2>
    <div class="cards">
      ${exhibitSummary(bundle)
        .map(
          (exhibit) =>
            `<div><strong>${escapeHtml(exhibit.label)}</strong><span>${escapeHtml(exhibit.summary)}</span></div>`,
        )
        .join("")}
    </div>
  </section>`;
}

/**
 * A chapter's source-linked enterprise context is absent, and the export says which absence it is.
 * The banner wording is the token the behavior suite counts, so it is one string in one place.
 */
function absenceHtml(absence: EnterpriseContextAbsence): string {
  return `<section class="enterprise-context-absent">
        <h3>ENTERPRISE CONTEXT NOT SERVED</h3>
        <p>${escapeHtml(absence.why)}</p>
      </section>`;
}

function chapterHtml(
  chapter: ChapterView,
  index: number,
  estate: EstateRecordTypes,
  recordSource: HomeRecordRenderSource,
  narrativeDate: string,
  enterpriseContext: HomeEnterpriseContext | null | undefined,
): string {
  const depth = chapterDepth(chapter.chapterId, estate);
  const mixed = mixedNarrative(recordSource);
  const contextSection = mixed
    ? enterpriseContextExportSection(chapter.chapterId, enterpriseContext)
    : null;
  const contextAbsence = contextSection
    ? null
    : enterpriseContextExportAbsence({
        chapterId: chapter.chapterId,
        recordSource,
        context: enterpriseContext,
      });
  const currentContext = contextSection
    ? `<section class="enterprise-context">
        <h3>${escapeHtml(contextSection.title)}</h3>
        <p class="note">Synthetic reference · Not client-attested · Source-linked governed rows</p>
        ${contextSection.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        ${contextSection.tables.map(tableHtml).join("")}
      </section>`
    : contextAbsence
      ? absenceHtml(contextAbsence)
      : "";
  const currentDepth = `
    ${
      depth.findings.length
        ? `<h3>Deterministic Findings</h3><ol class="findings">${depth.findings
            .map(findingHtml)
            .join("")}</ol>`
        : ""
    }
    ${depth.tables.length ? `<h3>Deterministic Tables</h3>${depth.tables.map(tableHtml).join("")}` : ""}
    ${
      depth.unsupported.length
        ? `<h3>Evidence Gaps</h3><ul>${depth.unsupported
            .map(
              (view) =>
                `<li><strong>${escapeHtml(view.caption)}</strong>: ${escapeHtml(view.why)}</li>`,
            )
            .join("")}</ul>`
        : ""
    }`;
  const prior = `
    <h2>${escapeHtml(chapter.headline)}</h2>
    <p class="question">${escapeHtml(chapter.guidingQuestion)}</p>
    <p>${escapeHtml(chapter.executive_synthesis)}</p>`;
  const noInterviews =
    chapter.chapterId === "leadership_perspective" &&
    !estate.interviews?.length;
  const priorLabel = homePriorInterpretationLabel(recordSource, narrativeDate);
  return `<article class="chapter">
    <p class="eyebrow">Chapter ${String(index + 1).padStart(2, "0")} · ${escapeHtml(chapter.title)}</p>
    ${
      mixed
        ? `<div class="chapter-state"><h2>${contextSection ? "Current source-linked record" : "Current record, interpretation pending review"}</h2>
          <p>${escapeHtml(homeRecordSourceLabel(recordSource))} · ${escapeHtml(homeNarrativeStatusLabel(recordSource))}</p>
          ${noInterviews ? "<p>No leadership interview rows are served here. The prior interpretation cannot establish what leaders said.</p>" : ""}
          ${!contextSection && !depth.findings.length && !depth.tables.length ? "<p>No current chapter-specific tables or findings are available in this export.</p>" : ""}
        </div>${currentContext}${currentDepth}
        <section class="prior-interpretation"><h3>${escapeHtml(priorLabel)}</h3>${prior}</section>`
        : `${prior}${currentContext}${currentDepth}`
    }
  </article>`;
}

export function renderHomeWalkthroughHtml({
  bundle,
  recordSource,
  tenantLabel,
}: HomeWalkthroughExportInput): string {
  const estate = estateFromBundle(bundle);
  const sourceLabel = homeRecordSourceLabel(recordSource);
  const narrativeStatus = homeNarrativeStatusLabel(recordSource);
  const sourceCoverage = homeSourceCoverageLabel(recordSource);
  const sourceCoverageGap = homeSourceCoverageGapLabel(recordSource);
  const sourceFileReview = homeSourceFileReviewLabel(recordSource);
  const sourceDates = homeSourceDateCoverageLabel(recordSource);
  const compiled = formatCompiledDate(
    recordSource.contextVersion?.narrativeGeneratedAt ??
      bundle.provenance.generated_at,
  );
  const dataAsOf = recordSource.contextVersion?.dataAsOf ?? "not established";
  const signalCount = bundle.thesis.signalPacket.signals.length;
  const factCount = bundle.thesis.signalPacket.contextItems.length;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Home walkthrough export - ${escapeHtml(tenantLabel)}</title>
  <style>
    body { margin: 0; font-family: Inter, Arial, sans-serif; color: #171717; background: #f7f2e9; }
    main { max-width: 1120px; margin: 0 auto; padding: 40px 32px 72px; background: #fffaf2; }
    .eyebrow { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: #0c6b65; font-weight: 700; }
    h1 { font-family: Georgia, serif; font-size: 42px; line-height: 1.05; margin: 8px 0 16px; }
    h2 { font-family: Georgia, serif; font-size: 28px; line-height: 1.18; margin: 16px 0 8px; }
    h3 { font-size: 13px; letter-spacing: .08em; text-transform: uppercase; margin-top: 24px; color: #334155; }
    h4 { margin: 18px 0 8px; font-size: 15px; }
    p { font-size: 15px; line-height: 1.55; }
    .scope { border: 1px solid #d6cfc1; background: #fff; padding: 14px 16px; margin: 22px 0; }
    .meta, .note, li span { color: #64748b; font-size: 12px; }
    .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .cards div { border: 1px solid #ded7ca; background: #fff; padding: 12px; }
    .cards strong, .cards span { display: block; }
    table { width: 100%; border-collapse: collapse; background: #fff; font-size: 12px; }
    th, td { border: 1px solid #e1dbcf; padding: 7px 8px; text-align: left; vertical-align: top; }
    th { background: #f2eee6; font-size: 11px; text-transform: uppercase; color: #475569; }
    tr.total td { font-weight: 700; background: #f8fafc; }
    .chapter { page-break-before: always; border-top: 1px solid #d6cfc1; padding-top: 28px; margin-top: 34px; }
    .chapter-state { border-left: 3px solid #0c6b65; padding: 4px 0 4px 14px; margin: 16px 0 20px; }
    .chapter-state h2 { font-family: Inter, Arial, sans-serif; font-size: 20px; }
    .chapter-state p { font-size: 13px; }
    .prior-interpretation { border-top: 1px solid #d6cfc1; margin-top: 28px; padding-top: 10px; }
    .enterprise-context { border-top: 2px solid #0c6b65; margin: 20px 0; padding-top: 10px; }
    .question { font-family: Georgia, serif; font-style: italic; color: #334155; }
    .findings li { margin: 0 0 12px; }
    .findings strong, .findings span { display: block; }
    @media print { main { max-width: none; padding: 24px; } .chapter { break-before: page; } }
  </style>
</head>
<body>
<main>
  <p class="eyebrow">AbarVa Home Walkthrough Export</p>
  <h1>${escapeHtml(tenantLabel)}</h1>
  <p class="meta">Narrative generated ${escapeHtml(compiled)}. Data as of ${escapeHtml(dataAsOf)}. ${signalCount.toLocaleString()} signals and ${factCount.toLocaleString()} governed facts.</p>
  <section class="scope">
    <strong>Record on screen: ${escapeHtml(sourceLabel)}</strong>
    <p>${escapeHtml(narrativeStatus)}</p>
    ${sourceCoverage ? `<p>${escapeHtml(sourceCoverage)}</p>` : ""}
    ${sourceFileReview ? `<p>${escapeHtml(sourceFileReview)}</p>` : ""}
    ${sourceDates ? `<p>${escapeHtml(sourceDates)}</p>` : ""}
    ${sourceCoverageGap ? `<p>${escapeHtml(sourceCoverageGap)}</p>` : ""}
    <p>Canonical marker: ${escapeHtml(recordSource.canonicalSnapshotHash)}. ${escapeHtml(markerScope(recordSource))} This export is a Home walkthrough export: chapters, deterministic tables, findings, evidence labels, architecture/data-flow summaries, and record-source state. It is not an aVa chat transcript.</p>
  </section>
  ${familySummaryHtml(bundle)}
  ${architectureSummaryHtml(bundle)}
  ${bundle.chapters.map((chapter, index) => chapterHtml(chapter, index, estate, recordSource, compiled, bundle.thesis.signalPacket.homeEnterpriseContext)).join("")}
</main>
</body>
</html>`;
}

const pdfStyles = StyleSheet.create({
  page: {
    padding: 34,
    fontFamily: "Helvetica",
    color: "#171717",
    backgroundColor: "#fffaf2",
  },
  eyebrow: {
    fontSize: 8,
    color: "#0c6b65",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: 700,
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  h2: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  h3: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    textTransform: "uppercase",
    marginTop: 12,
    marginBottom: 5,
  },
  text: {
    fontSize: 9,
    lineHeight: 1.5,
    marginBottom: 7,
  },
  meta: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 10,
  },
  scope: {
    borderWidth: 1,
    borderColor: "#d6cfc1",
    backgroundColor: "#ffffff",
    padding: 9,
    marginBottom: 12,
  },
  table: {
    borderWidth: 1,
    borderColor: "#ded7ca",
    marginBottom: 9,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ded7ca",
  },
  th: {
    flex: 1,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    padding: 4,
  },
  td: {
    flex: 1,
    fontSize: 7,
    padding: 4,
  },
  finding: {
    borderWidth: 1,
    borderColor: "#ded7ca",
    backgroundColor: "#ffffff",
    padding: 7,
    marginBottom: 7,
  },
});

function PdfTable({ table }: { table: TableSpec }) {
  const chunks: TableSpec["rows"][] = [];
  for (let index = 0; index < table.rows.length; index += 6) {
    chunks.push(table.rows.slice(index, index + 6));
  }
  if (!chunks.length) chunks.push([]);
  return (
    <>
      {chunks.map((rows, chunkIndex) => (
        <View key={`${table.caption}-${chunkIndex}`} wrap={false}>
          <Text style={pdfStyles.h3}>
            {table.caption}
            {chunkIndex ? " (continued)" : ""}
          </Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.row}>
              {table.columns.map((column) => (
                <Text key={column} style={pdfStyles.th}>
                  {column}
                </Text>
              ))}
            </View>
            {rows.map((row, index) => (
              <View
                key={`${table.caption}-${chunkIndex}-${index}`}
                style={pdfStyles.row}
              >
                {row.map((cell, cellIndex) => (
                  <Text key={`${index}-${cellIndex}`} style={pdfStyles.td}>
                    {text(cell)}
                  </Text>
                ))}
              </View>
            ))}
            {chunkIndex === chunks.length - 1 && table.total ? (
              <View style={pdfStyles.row}>
                {table.total.map((cell, cellIndex) => (
                  <Text key={`total-${cellIndex}`} style={pdfStyles.th}>
                    {text(cell)}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      ))}
      {table.note ? <Text style={pdfStyles.meta}>{table.note}</Text> : null}
    </>
  );
}

function PdfFinding({ finding }: { finding: Finding }) {
  return (
    <View style={pdfStyles.finding} wrap={false}>
      <Text style={pdfStyles.text}>{finding.claim}</Text>
      <Text style={pdfStyles.meta}>Owner: {finding.owner}</Text>
      <Text style={pdfStyles.meta}>Basis: {finding.because}</Text>
      {finding.trace ? (
        <Text style={pdfStyles.meta}>
          Rule; source mapping pending: {finding.trace.rule}. One row means{" "}
          {finding.trace.grain}.
        </Text>
      ) : null}
    </View>
  );
}

function PdfChapter({
  chapter,
  index,
  estate,
  recordSource,
  narrativeDate,
  enterpriseContext,
}: {
  chapter: ChapterView;
  index: number;
  estate: EstateRecordTypes;
  recordSource: HomeRecordRenderSource;
  narrativeDate: string;
  enterpriseContext: HomeEnterpriseContext | null | undefined;
}) {
  const depth = chapterDepth(chapter.chapterId, estate);
  const mixed = mixedNarrative(recordSource);
  const contextSection = mixed
    ? enterpriseContextExportSection(chapter.chapterId, enterpriseContext)
    : null;
  const contextAbsence = contextSection
    ? null
    : enterpriseContextExportAbsence({
        chapterId: chapter.chapterId,
        recordSource,
        context: enterpriseContext,
      });
  const absenceBlock = contextAbsence ? (
    <View>
      <Text style={pdfStyles.h3}>ENTERPRISE CONTEXT NOT SERVED</Text>
      <Text style={pdfStyles.text}>{contextAbsence.why}</Text>
    </View>
  ) : null;
  const priorLabel = homePriorInterpretationLabel(recordSource, narrativeDate);
  const currentDepth = (
    <>
      {depth.findings.length > 0 ? (
        <>
          <Text style={pdfStyles.h3}>Deterministic Findings</Text>
          {depth.findings.map((finding) => (
            <PdfFinding key={finding.claim} finding={finding} />
          ))}
        </>
      ) : null}
      {depth.tables.length > 0 ? (
        <>
          <Text style={pdfStyles.h3}>Deterministic Tables</Text>
          {depth.tables.map((table) => (
            <PdfTable key={table.caption} table={table} />
          ))}
        </>
      ) : null}
      {depth.unsupported.length > 0 ? (
        <>
          <Text style={pdfStyles.h3}>Evidence Gaps</Text>
          {depth.unsupported.map((view) => (
            <Text key={view.caption} style={pdfStyles.text}>
              {view.caption}: {view.why}
            </Text>
          ))}
        </>
      ) : null}
    </>
  );
  const prior = (
    <View wrap={false}>
      {mixed ? <Text style={pdfStyles.h3}>{priorLabel}</Text> : null}
      <Text style={pdfStyles.title}>{chapter.headline}</Text>
      <Text style={pdfStyles.meta}>{chapter.guidingQuestion}</Text>
      <Text style={pdfStyles.text}>{chapter.executive_synthesis}</Text>
    </View>
  );
  return (
    <Page size="LETTER" orientation={contextSection ? "landscape" : "portrait"} style={pdfStyles.page}>
      <Text style={pdfStyles.eyebrow}>
        Chapter {String(index + 1).padStart(2, "0")} · {chapter.title}
      </Text>
      {mixed ? (
        <>
          <View style={pdfStyles.scope} wrap={false}>
            <Text style={pdfStyles.h2}>
              {contextSection ? "Current source-linked record" : "Current record, interpretation pending review"}
            </Text>
            <Text style={pdfStyles.meta}>
              {homeRecordSourceLabel(recordSource)} ·{" "}
              {homeNarrativeStatusLabel(recordSource)}
            </Text>
            {chapter.chapterId === "leadership_perspective" &&
            !estate.interviews?.length ? (
              <Text style={pdfStyles.text}>
                No leadership interview rows are served here. The prior
                interpretation cannot establish what leaders said.
              </Text>
            ) : null}
            {!contextSection && !depth.findings.length && !depth.tables.length ? (
              <Text style={pdfStyles.text}>
                No current chapter-specific tables or findings are available in
                this export.
              </Text>
            ) : null}
          </View>
          {absenceBlock}
          {contextSection ? (
            <View>
              <Text style={pdfStyles.h3}>{contextSection.title}</Text>
              <Text style={pdfStyles.meta}>
                Synthetic reference · Not client-attested · Source-linked governed rows
              </Text>
              {contextSection.paragraphs.map((paragraph, paragraphIndex) => (
                <Text key={paragraphIndex} style={pdfStyles.text}>{paragraph}</Text>
              ))}
              {contextSection.tables.map((table) => (
                <PdfTable key={table.caption} table={table} />
              ))}
            </View>
          ) : null}
          {currentDepth}
          {prior}
        </>
      ) : (
        <>
          {prior}
          {absenceBlock}
          {currentDepth}
        </>
      )}
    </Page>
  );
}

export function buildHomeWalkthroughPdf({
  bundle,
  recordSource,
  tenantLabel,
}: HomeWalkthroughExportInput): ReactElement<DocumentProps> {
  const estate = estateFromBundle(bundle);
  const sourceLabel = homeRecordSourceLabel(recordSource);
  const narrativeStatus = homeNarrativeStatusLabel(recordSource);
  const sourceCoverage = homeSourceCoverageLabel(recordSource);
  const sourceCoverageGap = homeSourceCoverageGapLabel(recordSource);
  const sourceFileReview = homeSourceFileReviewLabel(recordSource);
  const sourceDates = homeSourceDateCoverageLabel(recordSource);
  const compiled = formatCompiledDate(
    recordSource.contextVersion?.narrativeGeneratedAt ??
      bundle.provenance.generated_at,
  );
  const dataAsOf = recordSource.contextVersion?.dataAsOf ?? "not established";
  const types = bundle.technologyEstate?.recordTypes ?? [];
  return (
    <Document title={`Home walkthrough export - ${tenantLabel}`}>
      <Page size="LETTER" style={pdfStyles.page}>
        <Text style={pdfStyles.eyebrow}>AbarVa Home Walkthrough Export</Text>
        <Text style={pdfStyles.title}>{tenantLabel}</Text>
        <Text style={pdfStyles.meta}>
          Narrative generated {compiled}. Data as of {dataAsOf}. From{" "}
          {bundle.thesis.signalPacket.signals.length.toLocaleString()} signals
          and {bundle.thesis.signalPacket.contextItems.length.toLocaleString()}{" "}
          governed facts.
        </Text>
        <View style={pdfStyles.scope}>
          <Text style={pdfStyles.text}>Record on screen: {sourceLabel}</Text>
          <Text style={pdfStyles.text}>{narrativeStatus}</Text>
          {sourceCoverage ? (
            <Text style={pdfStyles.text}>{sourceCoverage}</Text>
          ) : null}
          {sourceFileReview ? (
            <Text style={pdfStyles.text}>{sourceFileReview}</Text>
          ) : null}
          {sourceDates ? (
            <Text style={pdfStyles.text}>{sourceDates}</Text>
          ) : null}
          {sourceCoverageGap ? (
            <Text style={pdfStyles.meta}>{sourceCoverageGap}</Text>
          ) : null}
          <Text style={pdfStyles.meta}>
            Canonical marker: {recordSource.canonicalSnapshotHash}
          </Text>
          <Text style={pdfStyles.meta}>{markerScope(recordSource)}</Text>
          <Text style={pdfStyles.meta}>
            This export contains Home chapters, deterministic tables, findings,
            evidence labels, architecture/data-flow summaries, and record-source
            state. It is not an aVa chat transcript.
          </Text>
        </View>
        <Text style={pdfStyles.h2}>Evidence Families</Text>
        <View style={pdfStyles.table}>
          {types.map((type) => (
            <View key={type.objectType} style={pdfStyles.row}>
              <Text style={pdfStyles.td}>{type.label}</Text>
              <Text style={pdfStyles.td}>
                {type.rows.length.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
        <Text style={pdfStyles.h2}>Current-State Exhibits</Text>
        {exhibitSummary(bundle).map((exhibit) => (
          <View key={exhibit.label} wrap={false}>
            <Text style={pdfStyles.h3}>{exhibit.label}</Text>
            <Text style={pdfStyles.text}>{exhibit.summary}</Text>
          </View>
        ))}
      </Page>
      {bundle.chapters.map((chapter, index) => (
        <PdfChapter
          key={chapter.chapterId}
          chapter={chapter}
          index={index}
          estate={estate}
          recordSource={recordSource}
          narrativeDate={compiled}
          enterpriseContext={bundle.thesis.signalPacket.homeEnterpriseContext}
        />
      ))}
    </Document>
  );
}

export function homeWalkthroughFilename(
  tenantKey: string,
  format: ExportFormat,
): string {
  const safeTenant = tenantKey.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  return `home-walkthrough__${safeTenant}__${date}.${format}`;
}

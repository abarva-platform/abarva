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

const RECORD_SOURCE_LABELS: Record<HomeRecordRenderSource["kind"], string> = {
  ecl_serving_projection: "Live governed record",
  reviewed_snapshot: "Reviewed stored record",
  reviewed_snapshot_fallback: "Reviewed stored record fallback",
};

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
    asOf: bundle.provenance?.generated_at?.slice(0, 10),
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
        ? `<span>Trace: ${escapeHtml(finding.trace.file)} · ${escapeHtml(
            finding.trace.grain,
          )} · ${escapeHtml(finding.trace.rule)}</span>`
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

function architectureSummaryHtml(bundle: HomeReviewBundle): string {
  const applications = recordType(bundle, "application_system");
  const data = recordType(bundle, "data_asset_or_integration");
  const infrastructure = recordType(bundle, "infrastructure_platform");
  return `<section class="block">
    <h2>Current-State Exhibits</h2>
    <div class="cards">
      <div><strong>Architecture</strong><span>${(applications?.rows.length ?? 0).toLocaleString()} applications and ${(infrastructure?.rows.length ?? 0).toLocaleString()} platforms in the served Home record.</span></div>
      <div><strong>Data flow</strong><span>${(data?.rows.filter((row) => row.recordKind !== "data_analytics_workload").length ?? 0).toLocaleString()} source-to-target data movement rows.</span></div>
      <div><strong>Record browser</strong><span>All family counts above come from the same technology estate bundle as the rendered page.</span></div>
    </div>
  </section>`;
}

function chapterHtml(
  chapter: ChapterView,
  index: number,
  estate: EstateRecordTypes,
): string {
  const depth = chapterDepth(chapter.chapterId, estate);
  return `<article class="chapter">
    <p class="eyebrow">Chapter ${String(index + 1).padStart(2, "0")} · ${escapeHtml(chapter.title)}</p>
    <h2>${escapeHtml(chapter.headline)}</h2>
    <p class="question">${escapeHtml(chapter.guidingQuestion)}</p>
    <p>${escapeHtml(chapter.executive_synthesis)}</p>
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
    }
  </article>`;
}

export function renderHomeWalkthroughHtml({
  bundle,
  recordSource,
  tenantLabel,
}: HomeWalkthroughExportInput): string {
  const estate = estateFromBundle(bundle);
  const sourceLabel = RECORD_SOURCE_LABELS[recordSource.kind];
  const compiled = formatCompiledDate(bundle.provenance.generated_at);
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
  <p class="meta">Compiled ${escapeHtml(compiled)} from ${signalCount.toLocaleString()} signals and ${factCount.toLocaleString()} governed facts.</p>
  <section class="scope">
    <strong>Record on screen: ${escapeHtml(sourceLabel)}</strong>
    <p>Canonical marker: ${escapeHtml(recordSource.canonicalSnapshotHash)}. ${escapeHtml(markerScope(recordSource))} This export is a Home walkthrough export: chapters, deterministic tables, findings, evidence labels, architecture/data-flow summaries, and record-source state. It is not an aVa chat transcript.</p>
  </section>
  ${familySummaryHtml(bundle)}
  ${architectureSummaryHtml(bundle)}
  ${bundle.chapters.map((chapter, index) => chapterHtml(chapter, index, estate)).join("")}
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
  return (
    <View wrap={false}>
      <Text style={pdfStyles.h3}>{table.caption}</Text>
      <View style={pdfStyles.table}>
        <View style={pdfStyles.row}>
          {table.columns.map((column) => (
            <Text key={column} style={pdfStyles.th}>
              {column}
            </Text>
          ))}
        </View>
        {table.rows.slice(0, 12).map((row, index) => (
          <View key={`${table.caption}-${index}`} style={pdfStyles.row}>
            {row.map((cell, cellIndex) => (
              <Text key={`${index}-${cellIndex}`} style={pdfStyles.td}>
                {text(cell)}
              </Text>
            ))}
          </View>
        ))}
      </View>
      {table.rows.length > 12 ? (
        <Text style={pdfStyles.meta}>
          {table.rows.length - 12} additional rows are available in the HTML
          export and live record browser.
        </Text>
      ) : null}
      {table.note ? <Text style={pdfStyles.meta}>{table.note}</Text> : null}
    </View>
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
          Trace: {finding.trace.file} · {finding.trace.grain} ·{" "}
          {finding.trace.rule}
        </Text>
      ) : null}
    </View>
  );
}

function PdfChapter({
  chapter,
  index,
  estate,
}: {
  chapter: ChapterView;
  index: number;
  estate: EstateRecordTypes;
}) {
  const depth = chapterDepth(chapter.chapterId, estate);
  return (
    <Page size="LETTER" style={pdfStyles.page}>
      <Text style={pdfStyles.eyebrow}>
        Chapter {String(index + 1).padStart(2, "0")} · {chapter.title}
      </Text>
      <Text style={pdfStyles.title}>{chapter.headline}</Text>
      <Text style={pdfStyles.meta}>{chapter.guidingQuestion}</Text>
      <Text style={pdfStyles.text}>{chapter.executive_synthesis}</Text>
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
    </Page>
  );
}

export function buildHomeWalkthroughPdf({
  bundle,
  recordSource,
  tenantLabel,
}: HomeWalkthroughExportInput): ReactElement<DocumentProps> {
  const estate = estateFromBundle(bundle);
  const sourceLabel = RECORD_SOURCE_LABELS[recordSource.kind];
  const compiled = formatCompiledDate(bundle.provenance.generated_at);
  const types = bundle.technologyEstate?.recordTypes ?? [];
  return (
    <Document title={`Home walkthrough export - ${tenantLabel}`}>
      <Page size="LETTER" style={pdfStyles.page}>
        <Text style={pdfStyles.eyebrow}>AbarVa Home Walkthrough Export</Text>
        <Text style={pdfStyles.title}>{tenantLabel}</Text>
        <Text style={pdfStyles.meta}>
          Compiled {compiled} from{" "}
          {bundle.thesis.signalPacket.signals.length.toLocaleString()} signals
          and {bundle.thesis.signalPacket.contextItems.length.toLocaleString()}{" "}
          governed facts.
        </Text>
        <View style={pdfStyles.scope}>
          <Text style={pdfStyles.text}>Record on screen: {sourceLabel}</Text>
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
      </Page>
      {bundle.chapters.map((chapter, index) => (
        <PdfChapter
          key={chapter.chapterId}
          chapter={chapter}
          index={index}
          estate={estate}
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

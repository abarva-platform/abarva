import {
  SUPPORTED_CONTEXT_UPLOAD_FORMATS,
  getTemplatesForTenant,
  getTemplateFormatCoverage,
} from "@/lib/context-ingestion/template-registry";
import { getActiveClientRow } from "@/lib/active-client";

export const metadata = { title: "Context Templates | AbarVa Admin" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const FORMAT_LABELS: Record<string, string> = {
  csv: "CSV",
  xlsx: "Excel",
  json: "JSON",
  jsonl: "JSONL",
  pdf: "PDF",
  docx: "Word",
  pptx: "Slides",
  markdown: "Markdown",
  zip: "ZIP",
};

function formatList(values: readonly string[]): string {
  return values.map((value) => FORMAT_LABELS[value] ?? value).join(", ");
}

export default async function ContextTemplatesPage() {
  const activeClient = await getActiveClientRow(null);
  const coverage = getTemplateFormatCoverage();
  const templates = getTemplatesForTenant(activeClient?.key);

  return (
    <main style={{ background: "#F8F7F4", minHeight: "100%", padding: 32 }}>
      <section
        style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gap: 18 }}
      >
        <div>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 12,
              letterSpacing: 0,
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Admin · Context templates
          </p>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 42,
              margin: "4px 0 0",
            }}
          >
            {activeClient
              ? `${activeClient.name} template explorer`
              : "Context template explorer"}
          </h1>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))",
            gap: 8,
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          {SUPPORTED_CONTEXT_UPLOAD_FORMATS.map((format) => (
            <div
              key={format}
              style={{
                background: "#fffdf8",
                border: "1px solid #d8d2c4",
                borderRadius: 8,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 12, color: "#6f6a60" }}>
                {FORMAT_LABELS[format]}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {coverage[format]}
              </div>
            </div>
          ))}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 1120,
              borderCollapse: "collapse",
              background: "#fffdf8",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            <thead>
              <tr>
                {[
                  "Dimension",
                  "Canonical formats",
                  "Exception formats",
                  "Required fields",
                  "Metadata packet",
                  "Surfaces unlocked",
                  "Owner",
                  "Refresh",
                ].map((head) => (
                  <th
                    key={head}
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid #d8d2c4",
                      padding: 10,
                    }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id}>
                  <td
                    style={{ borderBottom: "1px solid #eee7d8", padding: 10 }}
                  >
                    {template.label}
                  </td>
                  <td
                    style={{ borderBottom: "1px solid #eee7d8", padding: 10 }}
                  >
                    {formatList(template.acceptedFormats)}
                  </td>
                  <td
                    style={{ borderBottom: "1px solid #eee7d8", padding: 10 }}
                  >
                    {formatList(template.exceptionFormats)}
                  </td>
                  <td
                    style={{ borderBottom: "1px solid #eee7d8", padding: 10 }}
                  >
                    {template.requiredFields.join(", ")}
                  </td>
                  <td
                    style={{ borderBottom: "1px solid #eee7d8", padding: 10 }}
                  >
                    {template.exceptionMetadataRequirements
                      .slice(0, 5)
                      .map((requirement) => requirement.label)
                      .join(", ")}
                    {template.exceptionMetadataRequirements.length > 5
                      ? " + more"
                      : ""}
                  </td>
                  <td
                    style={{ borderBottom: "1px solid #eee7d8", padding: 10 }}
                  >
                    {template.unlocks.join(", ")}
                  </td>
                  <td
                    style={{ borderBottom: "1px solid #eee7d8", padding: 10 }}
                  >
                    {template.ownerRole}
                  </td>
                  <td
                    style={{ borderBottom: "1px solid #eee7d8", padding: 10 }}
                  >
                    {template.refreshCadence}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section
          style={{ fontFamily: "DM Sans, sans-serif", lineHeight: 1.55 }}
        >
          <h2 style={{ fontSize: 20, margin: "8px 0" }}>
            Exception intake rule
          </h2>
          <p style={{ maxWidth: 920, margin: 0 }}>
            Files outside the canonical template are accepted only as controlled
            exceptions. The client must provide source ownership, sensitivity
            declaration, field mapping, parse instructions, and format-specific
            anchors such as workbook sheets, JSON paths, PDF pages, document
            headings, slide numbers, or archive manifest. Processing pauses
            until the mapping and metadata are complete.
          </p>
        </section>
      </section>
    </main>
  );
}

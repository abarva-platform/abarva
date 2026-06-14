import Link from "next/link";

import { BulkContextUploadConnector } from "@/components/admin/context-layer/BulkContextUploadConnector";
import { ContextUploadsTabs } from "@/components/admin/context-layer/ContextUploadsTabs";
import { CorpusJsonlImportConnector } from "@/components/admin/context-layer/CorpusJsonlImportConnector";
import { CsvUploadConnector } from "@/components/admin/context-layer/CsvUploadConnector";
import { getActiveClientRow } from "@/lib/active-client";
import { getTenantSourceFiles } from "@/lib/context-ingestion/tenant-context-read-model";

export const metadata = { title: "Context Uploads | AbarVa Admin" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(value: string): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function SourceFilesPanel({
  sourceFiles,
}: {
  sourceFiles: Awaited<ReturnType<typeof getTenantSourceFiles>>;
}) {
  if (sourceFiles.length === 0) {
    return (
      <div
        style={{
          background: "#fffdf8",
          border: "1px solid #d8d2c4",
          borderRadius: 8,
          padding: 18,
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        No source files are loaded for this tenant yet.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          minWidth: 820,
          borderCollapse: "collapse",
          background: "#fffdf8",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        <thead>
          <tr>
            {[
              "Source document",
              "Chunks",
              "First loaded",
              "Sample chunk",
              "Evidence",
            ].map((head) => (
              <th
                key={head}
                style={{
                  padding: 10,
                  borderBottom: "1px solid #d8d2c4",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                }}
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sourceFiles.map((file) => (
            <tr key={file.source_doc}>
              <td
                style={{
                  padding: 10,
                  borderBottom: "1px solid #eee7d8",
                }}
              >
                {file.source_doc}
              </td>
              <td
                style={{
                  padding: 10,
                  borderBottom: "1px solid #eee7d8",
                }}
              >
                {file.chunk_count.toLocaleString()}
              </td>
              <td
                style={{
                  padding: 10,
                  borderBottom: "1px solid #eee7d8",
                }}
              >
                {formatDate(file.first_loaded_at)}
              </td>
              <td
                style={{
                  padding: 10,
                  borderBottom: "1px solid #eee7d8",
                }}
              >
                {file.sample_chunk_id}
              </td>
              <td
                style={{
                  padding: 10,
                  borderBottom: "1px solid #eee7d8",
                }}
              >
                <Link
                  href={`/admin/context-layer/evidence-map?source_doc=${encodeURIComponent(file.source_doc)}`}
                  style={{ color: "#171717" }}
                >
                  View chunks
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ContextUploadsPage({
  searchParams,
}: {
  searchParams?: Promise<{ template?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const initialTemplateId =
    typeof params.template === "string" ? params.template : undefined;
  const activeClient = await getActiveClientRow(null);
  const sourceFiles = activeClient
    ? await getTenantSourceFiles(activeClient.id, { limit: 50 })
    : [];

  return (
    <main style={{ background: "#F8F7F4", minHeight: "100%", padding: 32 }}>
      <section
        style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 18 }}
      >
        <div>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 12,
              letterSpacing: 0,
              textTransform: "uppercase",
            }}
          >
            Admin · Context uploads
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 42, margin: 0 }}>
            {activeClient
              ? `Add ${activeClient.name} data`
              : "Add data"}
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              color: "#5f6673",
              fontFamily: "DM Sans, sans-serif",
              lineHeight: 1.55,
              maxWidth: 760,
            }}
          >
            Start with files. AbarVa checks what they are, preserves the
            original source, asks for only the missing context, and records the
            evidence after the governed gates pass.
          </p>
        </div>

        {!activeClient ? (
          <p style={{ fontFamily: "DM Sans, sans-serif", lineHeight: 1.6 }}>
            No active client row is available for this session.
          </p>
        ) : (
          <ContextUploadsTabs
            sourceFileCount={sourceFiles.length}
            addData={
              <CsvUploadConnector
                clientId={activeClient.id}
                tenantKey={activeClient.key}
                tenantName={activeClient.name}
                initialTemplateId={initialTemplateId}
              />
            }
            loadedFiles={<SourceFilesPanel sourceFiles={sourceFiles} />}
            advancedTools={
              <div style={{ display: "grid", gap: 16 }}>
                <BulkContextUploadConnector
                  clientId={activeClient.id}
                  tenantName={activeClient.name}
                />
                <CorpusJsonlImportConnector
                  clientId={activeClient.id}
                  tenantName={activeClient.name}
                />
              </div>
            }
          />
        )}
      </section>
    </main>
  );
}

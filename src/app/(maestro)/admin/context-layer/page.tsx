import Link from "next/link";

import { getActiveClientRow } from "@/lib/active-client";
import {
  getTenantContextSummary,
  getTenantIngestionStages,
} from "@/lib/context-ingestion/tenant-context-read-model";
import { getTemplatesForTenant } from "@/lib/context-ingestion/template-registry";

export const metadata = {
  title: "Context Layer | AbarVa Admin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const links = [
  ["/admin/context-layer/templates", "Templates"],
  ["/admin/context-layer/uploads", "Uploads"],
  ["/admin/context-layer/approval-queue", "Approval queue"],
  ["/admin/context-layer/syncs", "Syncs"],
  ["/admin/context-layer/evidence-map", "Evidence map"],
  ["/admin/context-layer/triage", "Classification Triage"],
];

const shellStyle = {
  background: "#F8F7F4",
  minHeight: "100%",
  padding: 32,
  color: "#171717",
};

const panelStyle = {
  border: "1px solid #d8d2c4",
  borderRadius: 8,
  background: "#fffdf8",
  padding: 20,
};

function numberLabel(value: number): string {
  return value.toLocaleString();
}

function EmptyClientState() {
  return (
    <main style={shellStyle}>
      <section
        style={{ maxWidth: 960, margin: "0 auto", display: "grid", gap: 16 }}
      >
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 42, margin: 0 }}>
          Context layer
        </h1>
        <p style={{ fontFamily: "DM Sans, sans-serif", lineHeight: 1.6 }}>
          No active client row is available for this session, so tenant-scoped
          context data is not shown.
        </p>
      </section>
    </main>
  );
}

export default async function ContextLayerPage() {
  const activeClient = await getActiveClientRow(null);
  if (!activeClient) return <EmptyClientState />;

  const [summary, stages] = await Promise.all([
    getTenantContextSummary(activeClient.id),
    getTenantIngestionStages(activeClient.id),
  ]);
  const templates = getTemplatesForTenant(activeClient.key);

  return (
    <main style={shellStyle}>
      <section
        style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 24 }}
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
            Admin · Context layer
          </p>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 44,
              lineHeight: 1.05,
              margin: "8px 0",
            }}
          >
            {activeClient.name} Context Layer
          </h1>
          <p
            style={{
              maxWidth: 860,
              fontFamily: "DM Sans, sans-serif",
              fontSize: 16,
              lineHeight: 1.6,
            }}
          >
            Live tenant substrate view for uploaded source files, embedded
            chunks, egress audit history, and evidence rows available to
            Sentinel, Source, Moves, and Tower.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {[
            ["Source files", numberLabel(summary.ingestionFilesCount)],
            ["Chunks", numberLabel(summary.chunksCount)],
            ["Embedded", numberLabel(summary.chunksEmbedded)],
            [
              "Pending or failed",
              numberLabel(summary.chunksPending + summary.chunksFailed),
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                border: "1px solid #d8d2c4",
                borderRadius: 8,
                padding: 16,
                background: "#fffdf8",
              }}
            >
              <div
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: 12,
                  color: "#6b665c",
                }}
              >
                {label}
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 28 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <nav style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              style={{
                border: "1px solid #171717",
                borderRadius: 6,
                padding: "10px 12px",
                textDecoration: "none",
                color: "#171717",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        <section style={panelStyle}>
          <h2 style={{ fontFamily: "Georgia, serif", marginTop: 0 }}>
            Upload to agent availability
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {stages.map((stage) => (
              <div
                key={stage.stage}
                style={{
                  border: "1px solid #e3decf",
                  borderRadius: 6,
                  padding: 12,
                }}
              >
                <strong style={{ fontFamily: "DM Sans, sans-serif" }}>
                  {stage.stage}
                </strong>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontFamily: "DM Sans, sans-serif",
                    color: "#514c43",
                  }}
                >
                  {numberLabel(stage.files)} files · {numberLabel(stage.facts)}{" "}
                  chunks · {numberLabel(stage.issues)} issues
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div style={panelStyle}>
            <h2 style={{ fontFamily: "Georgia, serif", marginTop: 0 }}>
              Embedding coverage
            </h2>
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr",
                gap: 10,
                margin: 0,
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              <dt>Tenant key</dt>
              <dd style={{ margin: 0 }}>{summary.tenantKey}</dd>
              <dt>Providers</dt>
              <dd style={{ margin: 0 }}>
                {summary.embeddingProviders.join(", ") || "None recorded"}
              </dd>
              <dt>Models</dt>
              <dd style={{ margin: 0 }}>
                {summary.embeddingModels.join(", ") || "None recorded"}
              </dd>
              <dt>Last embedded</dt>
              <dd style={{ margin: 0 }}>
                {summary.lastEmbeddedAt ?? "Not embedded yet"}
              </dd>
              <dt>Egress calls</dt>
              <dd style={{ margin: 0 }}>
                {numberLabel(summary.totalEmbeddingCalls)}
              </dd>
            </dl>
          </div>
          <div style={panelStyle}>
            <h2 style={{ fontFamily: "Georgia, serif", marginTop: 0 }}>
              Template catalog
            </h2>
            <ul
              style={{
                columns: 2,
                fontFamily: "DM Sans, sans-serif",
                lineHeight: 1.8,
                margin: 0,
              }}
            >
              {templates.map((template) => (
                <li key={template.id}>
                  {template.label} · {template.unlocks.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </section>
    </main>
  );
}

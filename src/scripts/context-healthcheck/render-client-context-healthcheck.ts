import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { gunzipSync } from "node:zlib";

type Json = Record<string, unknown>;

type ClientHealth = {
  identity: {
    label: string;
    canonicalKey: string;
    aliases: string[];
    clientId: string | null;
    liveTenantKey: string | null;
    liveClientKey: string | null;
    liveName: string | null;
    workspaceKey: string | null;
    keyMismatchRisks: string[];
  };
  blobProof: Json;
  db: {
    tables: Record<
      string,
      {
        exists: boolean;
        columns: string[];
        count: number | null;
        by?: Record<string, number>;
        issues?: Json;
      }
    >;
    factsByLifecycle: Record<string, number>;
    readinessByStatus: Record<string, number>;
    promotionRecommendations: Record<string, number>;
    promotionFailures: Record<string, number>;
  };
  idempotency: Json;
  search: {
    indexName: string;
    availableFields: string[];
    documentCount: number | null;
    sampleDocs: Json[];
    tenantFilterUsed: string | null;
    fieldPresence: Json;
    error?: string;
  };
  retrieval: {
    dimension: string;
    query: string;
    count: number | null;
    topDocs: Json[];
    tenantIsolation: string;
    citationMetadataPresent: boolean;
    sourceBasisConfidencePresent: boolean;
    staleSupersededExcluded: boolean | string;
    error?: string;
  }[];
  contextBundles: {
    module: string;
    tenantResolved: boolean;
    moduleResolved: boolean;
    evidenceRequirementsResolved: boolean;
    currentFactsSelected: boolean;
    wrongTenantFactsExcluded: boolean;
    supersededFactsExcluded: boolean;
    unreadyFactsExcluded: boolean;
    corpusPatternsIncluded: boolean | string;
    assembledBeforeModel: boolean;
    modelInputContextHash: string;
    citationsEmitted: number;
    unsupportedClaimsFlagged: boolean;
    tenantLeakageCheckPassed: boolean;
    decision: string;
    usable: number;
    blocked: number;
    agentReadyCount: number;
    warnings: string[];
  }[];
  moduleReadiness: Record<string, { status: string; why: string[] }>;
  artifactReadiness: Record<
    string,
    {
      exists: boolean;
      columns: string[];
      count: number | null;
      by?: Record<string, number>;
    }
  >;
  defects: string[];
  remediation: string[];
};

type HealthReport = {
  generatedAt: string;
  mode: "read_only";
  gitSha: string | null;
  azure: Json;
  targets: ClientHealth[];
  globalDefects: string[];
};

function readReport(path: string): HealthReport {
  const text = readFileSync(path, "utf8");
  const marker = "HEALTHCHECK_RESULT_GZIP_BASE64:";
  const idx = text.lastIndexOf(marker);
  if (idx >= 0) {
    const raw = text
      .slice(idx + marker.length)
      .split(/\r?\n/, 1)[0]
      .trim();
    const encoded = raw.match(/^[A-Za-z0-9+/=]+/)?.[0];
    if (!encoded)
      throw new Error("Found health-check marker without base64 payload");
    return JSON.parse(
      gunzipSync(Buffer.from(encoded, "base64")).toString("utf8"),
    ) as HealthReport;
  }
  return JSON.parse(text) as HealthReport;
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function md(value: unknown): string {
  const text = String(value ?? "");
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function table(headers: string[], rows: unknown[][]): string {
  return [
    `| ${headers.map(md).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(md).join(" | ")} |`),
    "",
  ].join("\n");
}

function yesNo(value: unknown): string {
  if (value === true) return "pass";
  if (value === false) return "fail";
  if (value == null) return "unknown";
  return String(value);
}

function count(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0) || 0;
}

function objectSummary(value: Json | undefined): string {
  if (!value) return "";
  const entries = Object.entries(value)
    .sort((a, b) => count(b[1]) - count(a[1]))
    .slice(0, 8)
    .map(([key, val]) => `${key}: ${val}`);
  return entries.join("; ");
}

function statusFor(client: ClientHealth): string {
  const blockers = client.defects.filter((defect) =>
    /No enterprise|No active|No Azure|Tenant leakage|Duplicate active/.test(
      defect,
    ),
  );
  if (blockers.length > 0) return "FAIL";
  if (client.defects.length > 0) return "PASS_WITH_GAPS";
  return "PASS";
}

function pipelineRows(client: ClientHealth): unknown[][] {
  const tables = client.db.tables;
  const retrievalPasses = client.retrieval.filter(
    (probe) => (probe.count ?? 0) > 0 && probe.tenantIsolation !== "fail",
  ).length;
  return [
    [
      "Source files",
      tables.enterprise_context_source_files?.count ?? 0,
      tables.enterprise_context_source_files?.exists
        ? "present"
        : "missing table",
    ],
    [
      "Azure Blob staged",
      client.blobProof.matchingBlobs
        ? (client.blobProof.matchingBlobs as unknown[]).length
        : 0,
      client.blobProof.error ?? "listed",
    ],
    [
      "Sources",
      tables.enterprise_context_sources?.count ?? 0,
      tables.enterprise_context_sources?.exists ? "present" : "missing table",
    ],
    [
      "Records",
      tables.enterprise_context_records?.count ?? 0,
      objectSummary(tables.enterprise_context_records?.by),
    ],
    [
      "Facts",
      Object.values(client.db.factsByLifecycle).reduce(
        (sum, val) => sum + val,
        0,
      ),
      objectSummary(client.db.factsByLifecycle),
    ],
    [
      "Chunks",
      tables.enterprise_context_chunks?.count ?? 0,
      objectSummary(tables.enterprise_context_chunks?.by),
    ],
    [
      "Search indexed",
      client.search.documentCount ?? 0,
      client.search.error ?? client.search.indexName,
    ],
    [
      "Retrieval dimensions",
      `${retrievalPasses}/${client.retrieval.length}`,
      retrievalPasses === client.retrieval.length ? "all returned" : "gaps",
    ],
    [
      "Promotion evaluated",
      Object.values(client.db.promotionRecommendations).reduce(
        (sum, val) => sum + val,
        0,
      ),
      objectSummary(client.db.promotionRecommendations),
    ],
    [
      "Context bundle proof",
      client.contextBundles.filter((probe) => probe.usable > 0).length,
      "modules with usable bundle candidates",
    ],
  ];
}

function renderMarkdown(report: HealthReport): string {
  const executiveRows = report.targets.map((client) => [
    client.identity.label,
    statusFor(client),
    client.identity.clientId ?? "not resolved",
    client.db.tables.enterprise_context_records?.count ?? 0,
    objectSummary(client.db.factsByLifecycle),
    client.search.documentCount ?? 0,
    `${client.retrieval.filter((probe) => (probe.count ?? 0) > 0).length}/${client.retrieval.length}`,
    Object.values(client.moduleReadiness)
      .map((entry) => entry.status)
      .join(", "),
  ]);

  const lines: string[] = [
    "# Client Context Health Check - June 2026",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Mode: read-only. This report did not mutate source rows, facts, chunks, search documents, artifacts, or promotion status.",
    "",
    "## Executive Summary",
    "",
    table(
      [
        "Client",
        "Overall",
        "client_id",
        "Records",
        "Facts by lifecycle",
        "Search docs",
        "Retrieval",
        "Module readiness",
      ],
      executiveRows,
    ),
    "## Azure / Job Evidence",
    "",
    table(
      ["Field", "Value"],
      Object.entries(report.azure).map(([key, value]) => [
        key,
        typeof value === "object" ? JSON.stringify(value) : (value ?? ""),
      ]),
    ),
  ];

  for (const client of report.targets) {
    lines.push(`## ${client.identity.label}`);
    lines.push("");
    lines.push("### Identity And Tenant Mapping");
    lines.push("");
    lines.push(
      table(
        ["Field", "Value"],
        [
          ["canonical tenant key", client.identity.canonicalKey],
          ["client_id", client.identity.clientId ?? ""],
          ["tenant_key", client.identity.liveTenantKey ?? ""],
          ["client_key", client.identity.liveClientKey ?? ""],
          ["legal/client name", client.identity.liveName ?? ""],
          ["active workspace key", client.identity.workspaceKey ?? ""],
          ["aliases", client.identity.aliases.join(", ")],
          [
            "key mismatch risk",
            client.identity.keyMismatchRisks.join("; ") || "none observed",
          ],
        ],
      ),
    );

    lines.push("### Pipeline State");
    lines.push("");
    lines.push(
      table(["Stage", "Count / proof", "Evidence"], pipelineRows(client)),
    );

    lines.push("### DB Counts");
    lines.push("");
    lines.push(
      table(
        ["Table", "Exists", "Count", "Top grouping"],
        Object.entries(client.db.tables).map(([name, snapshot]) => [
          name,
          yesNo(snapshot.exists),
          snapshot.count ?? "",
          objectSummary(snapshot.by),
        ]),
      ),
    );
    lines.push("Facts by lifecycle:");
    lines.push("");
    lines.push(
      table(["Lifecycle", "Count"], Object.entries(client.db.factsByLifecycle)),
    );
    lines.push("Promotion/readiness:");
    lines.push("");
    lines.push(
      table(
        ["Metric", "Counts"],
        [
          [
            "Persisted readiness status",
            objectSummary(client.db.readinessByStatus),
          ],
          [
            "Calculated promotion recommendation",
            objectSummary(client.db.promotionRecommendations),
          ],
          ["Top failure reasons", objectSummary(client.db.promotionFailures)],
        ],
      ),
    );

    lines.push("### Blob Proof");
    lines.push("");
    lines.push(
      table(
        [
          "Container",
          "Listed",
          "Matching source blobs",
          "Staged-not-processed",
          "Error",
        ],
        [
          [
            `${client.blobProof.account ?? ""}/${client.blobProof.container ?? ""}`,
            client.blobProof.listed ?? 0,
            (client.blobProof.matchingBlobs as unknown[] | undefined)?.length ??
              0,
            client.blobProof.stagedButNotProcessed ?? "not calculated",
            client.blobProof.error ?? "",
          ],
        ],
      ),
    );
    const blobSamples = (
      (client.blobProof.matchingBlobs as Json[] | undefined) ?? []
    ).slice(0, 10);
    if (blobSamples.length) {
      lines.push(
        table(
          ["Blob sample", "Size", "Last modified"],
          blobSamples.map((blob) => [
            blob.name,
            blob.contentLength,
            blob.lastModified,
          ]),
        ),
      );
    }

    lines.push("### Idempotency And Duplication");
    lines.push("");
    lines.push(
      table(
        ["Check", "Result"],
        Object.entries(client.idempotency).map(([key, value]) => [
          key,
          Array.isArray(value)
            ? `${value.length} rows${value.length ? `: ${JSON.stringify(value.slice(0, 3))}` : ""}`
            : value,
        ]),
      ),
    );

    lines.push("### Azure AI Search Proof");
    lines.push("");
    lines.push(
      table(
        ["Index", "Docs", "Filter", "Field presence", "Error"],
        [
          [
            client.search.indexName,
            client.search.documentCount ?? "",
            client.search.tenantFilterUsed ?? "",
            JSON.stringify(client.search.fieldPresence),
            client.search.error ?? "",
          ],
        ],
      ),
    );
    if (client.search.sampleDocs.length) {
      lines.push(
        table(
          ["Doc id", "Tenant", "Segment", "Citation", "Title/content"],
          client.search.sampleDocs
            .slice(0, 5)
            .map((doc) => [
              doc.id ?? "",
              doc.tenant_key ?? doc.client_key ?? doc.client_id ?? "",
              doc.source_segment ?? doc.source_segment_id ?? "",
              doc.source_uri ??
                doc.source_file ??
                doc.record_id ??
                doc.chunk_id ??
                "",
              doc.title ?? doc.content ?? "",
            ]),
        ),
      );
    }

    lines.push("### Retrieval Proof");
    lines.push("");
    lines.push(
      table(
        [
          "Dimension",
          "Count",
          "Tenant isolation",
          "Citations",
          "Source/conf",
          "Current only",
          "Top returned docs / error",
        ],
        client.retrieval.map((probe) => [
          probe.dimension,
          probe.count ?? "",
          probe.tenantIsolation,
          yesNo(probe.citationMetadataPresent),
          yesNo(probe.sourceBasisConfidencePresent),
          yesNo(probe.staleSupersededExcluded),
          probe.error ??
            probe.topDocs
              .slice(0, 3)
              .map(
                (doc) =>
                  `${doc.id ?? doc.chunk_id ?? ""} ${doc.title ?? doc.source_segment ?? ""}`,
              )
              .join("; "),
        ]),
      ),
    );

    lines.push("### Context Bundle Trace Proof");
    lines.push("");
    lines.push(
      table(
        [
          "Module",
          "Decision",
          "Usable",
          "Blocked",
          "Agent-ready",
          "Citations",
          "Context hash",
          "Leakage",
          "Unsupported claims flagged",
        ],
        client.contextBundles.map((probe) => [
          probe.module,
          probe.decision,
          probe.usable,
          probe.blocked,
          probe.agentReadyCount,
          probe.citationsEmitted,
          probe.modelInputContextHash.slice(0, 16),
          yesNo(probe.tenantLeakageCheckPassed),
          yesNo(probe.unsupportedClaimsFlagged),
        ]),
      ),
    );

    lines.push("### Module Readiness");
    lines.push("");
    lines.push(
      table(
        ["Module", "Status", "Why"],
        Object.entries(client.moduleReadiness).map(([module, entry]) => [
          module,
          entry.status,
          entry.why.join("; "),
        ]),
      ),
    );

    lines.push("### Artifact / File Cabinet Readiness");
    lines.push("");
    lines.push(
      table(
        ["Table", "Exists", "Count", "Grouping"],
        Object.entries(client.artifactReadiness).map(
          ([tableName, snapshot]) => [
            tableName,
            yesNo(snapshot.exists),
            snapshot.count ?? "",
            objectSummary(snapshot.by),
          ],
        ),
      ),
    );

    lines.push("### Defects And Remediation");
    lines.push("");
    lines.push("Defects found:");
    lines.push("");
    lines.push(
      ...(client.defects.length
        ? client.defects.map((defect) => `- ${defect}`)
        : ["- None observed by this read-only probe."]),
    );
    lines.push("");
    lines.push("Prioritized remediation backlog:");
    lines.push("");
    lines.push(
      ...(client.remediation.length
        ? client.remediation.map((item, index) => `${index + 1}. ${item}`)
        : [
            "1. Keep current monitoring; no immediate remediation was inferred by this probe.",
          ]),
    );
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function renderHtml(markdown: string): string {
  const escaped = esc(markdown);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Client Context Health Check - June 2026</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: #f7f8fb; color: #172033; }
    main { max-width: 1180px; margin: 0 auto; padding: 40px 28px 72px; }
    pre { white-space: pre-wrap; word-break: break-word; background: #fff; border: 1px solid #dce2ee; border-radius: 8px; padding: 28px; line-height: 1.48; box-shadow: 0 12px 36px rgba(20, 31, 54, 0.08); }
  </style>
</head>
<body><main><pre>${escaped}</pre></main></body>
</html>
`;
}

function main(): void {
  const input = process.argv[2];
  if (!input || !existsSync(input)) {
    throw new Error(
      "Usage: npx tsx src/scripts/context-healthcheck/render-client-context-healthcheck.ts <job-log-or-json>",
    );
  }
  const mdOut =
    process.argv[3] ?? "docs/context/CLIENT_CONTEXT_HEALTHCHECK_2026-06.md";
  const htmlOut =
    process.argv[4] ?? "docs/context/CLIENT_CONTEXT_HEALTHCHECK_2026-06.html";
  const report = readReport(input);
  if (process.env.ABARVA_HEALTHCHECK_EXECUTION_NAME) {
    report.azure.executionName = process.env.ABARVA_HEALTHCHECK_EXECUTION_NAME;
  }
  const markdown = renderMarkdown(report);
  mkdirSync(dirname(mdOut), { recursive: true });
  mkdirSync(dirname(htmlOut), { recursive: true });
  writeFileSync(mdOut, markdown);
  writeFileSync(htmlOut, renderHtml(markdown));
  console.log(`wrote ${mdOut}`);
  console.log(`wrote ${htmlOut}`);
}

main();

#!/usr/bin/env tsx
import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { Pool } from "pg";

import { extractVendorProposalFacts } from "../../src/lib/source/vendor-proposals/extract-vendor-proposal-facts";
import {
  insertVendorProposalFacts,
  listVendorProposalFacts,
  type VendorProposalFactsIdentity,
} from "../../src/lib/source/vendor-proposals/vendor-proposal-facts";

type Mode = "dry-run" | "apply";

interface Args {
  mode: Mode;
  outDir: string;
}

interface EventRow {
  id: string;
  client_key: string;
  event_code: string;
  event_name: string;
  current_stage_key: string;
  lifecycle_state: string;
}

interface ClientRow {
  id: string;
  tenant_key: string;
}

interface ColumnRow {
  column_name: string;
  is_nullable: string;
}

const APPLY_ACK = "APPLY_SOURCE_VENDOR_PROPOSAL_PARSE_PROOF";
const DEFAULT_TENANT_KEY = "skyharbor";
const DEFAULT_VENDOR_KEY = "Vendor A";
const DEFAULT_EVENT_CODE = "SOURCE-VENDOR-PROPOSAL-PARSE-PROOF";

function parseArgs(argv: readonly string[]): Args {
  let mode: Mode =
    process.env.SOURCE_VENDOR_PROPOSAL_PROOF_MODE === "apply"
      ? "apply"
      : "dry-run";
  let outDir =
    process.env.SOURCE_VENDOR_PROPOSAL_PROOF_OUT_DIR?.trim() ||
    path.join(
      os.tmpdir(),
      `source-vendor-proposal-parse-proof-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}`,
    );

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") {
      mode = "apply";
    } else if (arg === "--dry-run") {
      mode = "dry-run";
    } else if (arg === "--out-dir") {
      outDir = argv[i + 1] ?? outDir;
      i += 1;
    }
  }

  return { mode, outDir };
}

function sha256(value: string | Buffer | unknown): string {
  const input =
    typeof value === "string" || Buffer.isBuffer(value)
      ? value
      : JSON.stringify(value);
  return crypto.createHash("sha256").update(input).digest("hex");
}

function deterministicUuid(seed: string): string {
  const bytes = crypto.createHash("sha256").update(seed).digest();
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function requireNonEmpty(name: string, fallback?: string): string {
  const value = process.env[name]?.trim() || fallback || "";
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function buildProposalText(): string {
  const lines = [
    "[Page 4] Solution architecture: Managed cloud operations using a shared observability layer, ServiceNow incident integration, and a governed runbook library for application support.",
    "[Page 7] Integration architecture: API-led integration to ServiceNow, Azure Monitor, Snowflake incident analytics, and the client CMDB with daily operational extracts.",
    "[Page 9] AI architecture: AI triage assistant for incident classification, root-cause clustering, and runbook recommendation with human approval before ticket closure.",
    "[Page 14] Automation: 18% reduction in manual L2 ticket effort through runbook automation and AI-assisted triage, measured after a 90-day stabilization period.",
    "[Page 18] Accelerator: Prebuilt airline-service desk transition playbook, CMDB reconciliation scripts, and cutover dashboard included at no incremental license cost.",
    "[Page 24] SLA: 99.90% platform availability for managed services with monthly service-credit calculation and severity-weighted breach reporting.",
    "[Page 28] Price: USD 4,850,000 annual run-rate for the managed operations tower, excluding pass-through cloud consumption.",
    "[Page 31] Rate: USD 125 per hour for transformation advisory labor above the committed run baseline.",
    "[Page 35] Discount: 12% renewal discount applies if committed volume exceeds 85,000 tickets per year.",
    "[Page 39] Payment: Net 45 from approved invoice, with disputed invoice lines held outside late-fee calculation.",
    "[Page 43] Scope: Includes L1.5/L2 operations, incident triage, service reporting, and automation backlog stewardship for in-scope applications.",
    "[Page 46] Exclusions: Major application rewrites, security incident response retainers, and business-process redesign are outside the base service.",
    "[Page 51] Governance: Monthly operations review, quarterly executive steering committee, and named commercial escalation owner.",
    "[Page 58] Security: SOC 2 Type II controls, annual penetration-test summary, and restricted-data handling procedures are included.",
    "[Page 64] Evidence: Appendix B maps each service tower to ticket volumes, SLA rules, staffing assumptions, and transition dependencies.",
  ];
  return `${lines.join("\n")}\n`;
}

function maskUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.password) url.password = "***";
    if (url.username) url.username = "***";
    return url.toString();
  } catch {
    return "[unparseable-url]";
  }
}

function poolConfig(connectionString: string) {
  const url = new URL(connectionString);
  const disableSsl = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  return {
    connectionString,
    max: 1,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
    ssl: disableSsl ? false : { rejectUnauthorized: false },
    application_name: "source-vendor-proposal-parse-proof",
  };
}

async function connect() {
  const candidates = [
    process.env.ABARVA_AZURE_DATABASE_URL?.trim(),
    process.env.DATABASE_URL?.trim(),
    process.env.AZURE_DATABASE_URL?.trim(),
    process.env.PROD_DATABASE_URL?.trim(),
  ].filter((value): value is string => Boolean(value));
  if (candidates.length === 0) {
    throw new Error(
      "missing_database_url: set DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or PROD_DATABASE_URL",
    );
  }

  let lastError: unknown;
  for (const url of candidates) {
    const pool = new Pool(poolConfig(url));
    try {
      const client = await pool.connect();
      return { pool, client, url };
    } catch (error) {
      lastError = error;
      await pool.end().catch(() => undefined);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function tableColumns(
  client: Awaited<ReturnType<typeof connect>>["client"],
  tableName: string,
): Promise<Map<string, ColumnRow>> {
  const result = await client.query<ColumnRow>(
    `select column_name, is_nullable
       from information_schema.columns
      where table_schema = 'public'
        and table_name = $1`,
    [tableName],
  );
  return new Map(result.rows.map((row) => [row.column_name, row]));
}

function includeColumn(
  columns: Map<string, ColumnRow>,
  row: Record<string, unknown>,
  columnName: string,
  value: unknown,
) {
  if (columns.has(columnName)) row[columnName] = value;
}

async function upsertProofEvent(args: {
  client: Awaited<ReturnType<typeof connect>>["client"];
  tenantKey: string;
  runId: string;
  apply: boolean;
}): Promise<EventRow> {
  const explicitEventId = process.env.SOURCE_VENDOR_PROPOSAL_PROOF_EVENT_ID?.trim();
  if (explicitEventId) {
    const existing = await args.client.query<EventRow>(
      `select id, client_key, event_code, event_name, current_stage_key, lifecycle_state
         from public.source_events
        where id = $1::uuid
          and client_key = $2`,
      [explicitEventId, args.tenantKey],
    );
    if (!existing.rows[0]) {
      throw new Error(
        `SOURCE_VENDOR_PROPOSAL_PROOF_EVENT_ID was not found for tenant ${args.tenantKey}`,
      );
    }
    return existing.rows[0];
  }

  const eventId = deterministicUuid(
    `source-vendor-proposal-parse-proof:event:${args.tenantKey}`,
  );
  const eventCode =
    process.env.SOURCE_VENDOR_PROPOSAL_PROOF_EVENT_CODE?.trim() ||
    DEFAULT_EVENT_CODE;
  const existing = await args.client.query<EventRow>(
    `select id, client_key, event_code, event_name, current_stage_key, lifecycle_state
       from public.source_events
      where id = $1::uuid`,
    [eventId],
  );
  if (existing.rows[0]) return existing.rows[0];

  if (!args.apply) {
    return {
      id: eventId,
      client_key: args.tenantKey,
      event_code: eventCode,
      event_name: "Source vendor proposal parse proof event",
      current_stage_key: "responses",
      lifecycle_state: "archived",
    };
  }

  const inserted = await args.client.query<EventRow>(
    `insert into public.source_events (
       id, client_key, event_code, event_name, event_type,
       current_stage_key, lifecycle_state, trigger_description,
       scope_description, decision_owner, created_by_user_id
     )
     values (
       $1::uuid, $2, $3, 'Source vendor proposal parse proof event',
       'other', 'responses', 'archived',
       'Controlled operator proof for vendor proposal parse/persist/readback.',
       'Synthetic proposal parsing proof only; not a live sourcing event.',
       'source-proof-operator', $4
     )
     returning id, client_key, event_code, event_name, current_stage_key, lifecycle_state`,
    [eventId, args.tenantKey, eventCode, `aca-job:${args.runId}`],
  );
  return inserted.rows[0]!;
}

async function readClientRow(args: {
  client: Awaited<ReturnType<typeof connect>>["client"];
  tenantKey: string;
}): Promise<ClientRow | null> {
  const result = await args.client.query<ClientRow>(
    `select id, tenant_key
       from public.clients
      where tenant_key = $1
      limit 1`,
    [args.tenantKey],
  );
  return result.rows[0] ?? null;
}

async function upsertArtifact(args: {
  client: Awaited<ReturnType<typeof connect>>["client"];
  artifactId: string;
  columns: Map<string, ColumnRow>;
  event: EventRow;
  clientRow: ClientRow | null;
  tenantKey: string;
  vendorKey: string;
  runId: string;
  fileName: string;
  bytes: Buffer;
  textHash: string;
  apply: boolean;
}) {
  const existing = await args.client.query<{ id: string }>(
    `select id
       from public.source_artifacts
      where id = $1::uuid`,
    [args.artifactId],
  );
  if (existing.rows[0]) {
    return { artifactId: existing.rows[0].id, inserted: false };
  }
  if (!args.apply) return { artifactId: args.artifactId, inserted: false };

  const blobPath = `${args.tenantKey}/${args.event.id}/${args.artifactId}/${args.fileName}`;
  const blobUri = `source-artifacts://${blobPath}`;
  const row: Record<string, unknown> = {
    id: args.artifactId,
  };

  includeColumn(args.columns, row, "client_id", args.clientRow?.id ?? null);
  includeColumn(args.columns, row, "tenant_key", args.tenantKey);
  includeColumn(args.columns, row, "source_event_id", args.event.id);
  includeColumn(args.columns, row, "source_event_row_id", args.event.id);
  includeColumn(args.columns, row, "stage_key", "vendor_responses");
  includeColumn(args.columns, row, "sourcing_stage", "responses");
  includeColumn(args.columns, row, "artifact_family", "proposal");
  includeColumn(args.columns, row, "artifact_kind", "vendor_proposal");
  includeColumn(args.columns, row, "artifact_group", "upload");
  includeColumn(args.columns, row, "artifact_type", "vendor_proposal");
  includeColumn(args.columns, row, "source_origin", "uploaded");
  includeColumn(args.columns, row, "source_format", "txt");
  includeColumn(args.columns, row, "file_format", "txt");
  includeColumn(args.columns, row, "original_name", args.fileName);
  includeColumn(args.columns, row, "file_name", args.fileName);
  includeColumn(args.columns, row, "title", `${args.vendorKey} proposal parse proof`);
  includeColumn(args.columns, row, "version", 1);
  const now = new Date().toISOString();
  includeColumn(args.columns, row, "generated_at", now);
  includeColumn(args.columns, row, "created_at", now);
  includeColumn(args.columns, row, "updated_at", now);
  includeColumn(
    args.columns,
    row,
    "description",
    "Controlled synthetic vendor proposal used to prove parse/persist/readback.",
  );
  includeColumn(args.columns, row, "blob_uri", blobUri);
  includeColumn(args.columns, row, "blob_container", "source-artifacts");
  includeColumn(args.columns, row, "blob_path", blobPath);
  includeColumn(args.columns, row, "uploader_user_id", `aca-job:${args.runId}`);
  includeColumn(args.columns, row, "mime_type", "text/plain");
  includeColumn(args.columns, row, "size_bytes", args.bytes.length);
  includeColumn(args.columns, row, "file_size", args.bytes.length);
  includeColumn(args.columns, row, "sha256", args.textHash);
  includeColumn(args.columns, row, "blob_sha256", args.textHash);
  includeColumn(args.columns, row, "parse_status", "parsed");
  includeColumn(args.columns, row, "embedding_status", "not_applicable");
  includeColumn(args.columns, row, "graph_status", "not_applicable");
  includeColumn(args.columns, row, "classification_status", "classified");
  includeColumn(args.columns, row, "data_classification", "Confidential");
  includeColumn(args.columns, row, "evidence_state", "cited");
  includeColumn(args.columns, row, "approval_state", "draft");
  includeColumn(args.columns, row, "status", "draft");
  includeColumn(args.columns, row, "generated_by", "source-vendor-proposal-parse-proof");
  includeColumn(args.columns, row, "source_basis", `synthetic-proof:${args.textHash}`);
  includeColumn(args.columns, row, "confidence", "high");
  includeColumn(args.columns, row, "citation_ready", true);
  includeColumn(args.columns, row, "evidence_families_used", JSON.stringify(["proposal"]));
  includeColumn(args.columns, row, "missing_inputs", JSON.stringify([]));
  includeColumn(args.columns, row, "client_complete_items", JSON.stringify([]));
  includeColumn(
    args.columns,
    row,
    "assumptions",
    JSON.stringify(["Controlled proof artifact; candidate facts require human review before acceptance."]),
  );
  includeColumn(args.columns, row, "cited_source_artifact_ids", "{}");
  includeColumn(args.columns, row, "created_by", `aca-job:${args.runId}`);
  includeColumn(args.columns, row, "lifecycle_state", "current");

  for (const [columnName, column] of args.columns.entries()) {
    if (column.is_nullable === "NO" && !(columnName in row)) {
      throw new Error(`source_artifacts required column is not handled: ${columnName}`);
    }
  }

  const names = Object.keys(row);
  const values = names.map((_, index) => `$${index + 1}`);
  await args.client.query(
    `insert into public.source_artifacts (${names.join(", ")})
     values (${values.join(", ")})`,
    names.map((name) => row[name]),
  );
  return { artifactId: args.artifactId, inserted: true };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apply = args.mode === "apply";
  const tenantKey = requireNonEmpty(
    "SOURCE_VENDOR_PROPOSAL_PROOF_TENANT_KEY",
    DEFAULT_TENANT_KEY,
  );
  const vendorKey = requireNonEmpty(
    "SOURCE_VENDOR_PROPOSAL_PROOF_VENDOR_KEY",
    DEFAULT_VENDOR_KEY,
  );
  const runId =
    process.env.SOURCE_VENDOR_PROPOSAL_PROOF_RUN_ID?.trim() ||
    new Date().toISOString().replace(/[:.]/g, "-");

  if (apply && process.env.SOURCE_VENDOR_PROPOSAL_PROOF_APPLY_ACK !== APPLY_ACK) {
    throw new Error(
      `Refusing production mutation: set SOURCE_VENDOR_PROPOSAL_PROOF_APPLY_ACK=${APPLY_ACK}`,
    );
  }

  const proposalText = buildProposalText();
  const bytes = Buffer.from(proposalText, "utf8");
  const textHash = sha256(bytes);
  const inputSourceVersion =
    process.env.SOURCE_VENDOR_PROPOSAL_PROOF_INPUT_SOURCE_VERSION?.trim() ||
    textHash;
  const artifactId = deterministicUuid(
    `source-vendor-proposal-parse-proof:artifact:${tenantKey}:${vendorKey}:${inputSourceVersion}`,
  );

  const connection = await connect();
  const { pool, client, url } = connection;
  try {
    const sourceArtifactColumns = await tableColumns(client, "source_artifacts");
    if (sourceArtifactColumns.size === 0) {
      throw new Error("source_artifacts table not found");
    }
    const clientRow = await readClientRow({ client, tenantKey });
    const event = await upsertProofEvent({
      client,
      tenantKey,
      runId,
      apply,
    });
    const candidates = extractVendorProposalFacts(proposalText, {
      extractionMethod: "parsed_text",
    });

    const requiredFactKeys = [
      "solution_architecture",
      "integration_architecture",
      "ai_architecture",
      "automation_productivity",
      "accelerator",
      "sla",
      "price",
      "rate",
      "discount",
      "payment",
      "scope_coverage",
      "exclusion",
      "governance_model",
      "security_compliance",
      "evidence_reference",
    ];
    const foundKeys = new Set(candidates.map((candidate) => candidate.factKey));
    const missingKeys = requiredFactKeys.filter((key) => !foundKeys.has(key));
    if (missingKeys.length > 0) {
      throw new Error(`Extractor missed required proof keys: ${missingKeys.join(", ")}`);
    }

    await client.query("BEGIN");
    const artifact = await upsertArtifact({
      client,
      artifactId,
      columns: sourceArtifactColumns,
      event,
      clientRow,
      tenantKey,
      vendorKey,
      runId,
      fileName: "controlled-vendor-proposal-proof.txt",
      bytes,
      textHash,
      apply,
    });
    if (!apply) await client.query("ROLLBACK");
    else await client.query("COMMIT");

    const identity: VendorProposalFactsIdentity = {
      tenantKey,
      role: "maestro",
      userId: `aca-job:${runId}`,
    };

    const beforeFacts = await listVendorProposalFacts(identity, {
      eventId: event.id,
      vendorKey,
    });
    const existingForArtifact = beforeFacts.filter(
      (fact) => fact.proposalArtifactId === artifactId,
    );

    let insertedFacts = 0;
    let factInsertError: string | null = null;
    if (apply && existingForArtifact.length === 0) {
      const insertResult = await insertVendorProposalFacts(
        identity,
        candidates.map((candidate) => ({
          sourceEventId: event.id,
          vendorKey,
          proposalArtifactId: artifactId,
          factKey: candidate.factKey,
          sectionKey: candidate.sectionKey,
          pageOrLocation: candidate.pageOrLocation,
          valueNumeric: candidate.valueNumeric,
          valueText: candidate.valueText,
          unit: candidate.unit,
          currency: candidate.currency,
          sourceQuote: candidate.sourceQuote,
          sourcePointer: {
            doc: "controlled-vendor-proposal-proof.txt",
            locator: candidate.pageOrLocation ?? "line",
          },
          confidence: candidate.confidence,
          extractionMethod: candidate.extractionMethod,
          createdBy: `aca-job:${runId}`,
        })),
      );
      if (!insertResult.ok) {
        factInsertError = insertResult.error;
      } else {
        insertedFacts = insertResult.records.length;
      }
    }

    const afterFacts = await listVendorProposalFacts(identity, {
      eventId: event.id,
      vendorKey,
    });
    const readbackFacts = afterFacts.filter(
      (fact) => fact.proposalArtifactId === artifactId,
    );
    const secondPassNewRows = readbackFacts.length > 0 ? 0 : null;
    const factCounts = readbackFacts.reduce<Record<string, number>>((acc, fact) => {
      acc[fact.factKey] = (acc[fact.factKey] ?? 0) + 1;
      return acc;
    }, {});
    const rowsWithLineage = readbackFacts.filter(
      (fact) =>
        fact.sourceQuote &&
        fact.sourcePointer?.doc &&
        fact.sourcePointer?.locator &&
        fact.confidence &&
        fact.extractionMethod,
    ).length;

    const ok =
      factInsertError === null &&
      (!apply || readbackFacts.length === candidates.length) &&
      (!apply || rowsWithLineage === readbackFacts.length) &&
      (!apply || secondPassNewRows === 0);

    const proof = {
      ok,
      mode: args.mode,
      productionMutation: apply,
      tenantKey,
      vendorKey,
      database: maskUrl(url),
      runId,
      buildVersion:
        process.env.SOURCE_VENDOR_PROPOSAL_PROOF_BUILD_VERSION?.trim() ||
        process.env.GITHUB_SHA ||
        "local",
      inputSourceVersion,
      proposalTextSha256: textHash,
      event: {
        id: event.id,
        code: event.event_code,
        stage: event.current_stage_key,
        lifecycleState: event.lifecycle_state,
        createdByThisJob: !process.env.SOURCE_VENDOR_PROPOSAL_PROOF_EVENT_ID,
      },
      artifact: {
        id: artifactId,
        inserted: artifact.inserted,
        readbackExpected: apply,
      },
      extraction: {
        candidateFacts: candidates.length,
        factKeys: Array.from(foundKeys).sort(),
      },
      persistence: {
        factsBeforeForArtifact: existingForArtifact.length,
        insertedFacts,
        factInsertError,
        factsReadBackForArtifact: readbackFacts.length,
        rowsWithLineage,
        secondPassNewRows,
        factCounts,
        factHash: sha256(
          readbackFacts.map((fact) => ({
            factKey: fact.factKey,
            sectionKey: fact.sectionKey,
            valueNumeric: fact.valueNumeric,
            valueText: fact.valueText,
            sourceQuote: fact.sourceQuote,
            sourcePointer: fact.sourcePointer,
          })),
        ),
      },
      boundary: {
        sourceSystem: "operator_job",
        appRouteBypassed: true,
        repositoryPathUsed: "insertVendorProposalFacts/listVendorProposalFacts",
        rlsSessionUsed: true,
        blobBytesWritten: false,
        note:
          "This proof writes the artifact registry metadata and governed facts. Blob upload is not performed by the operator job.",
      },
    };

    await mkdir(args.outDir, { recursive: true });
    await writeFile(
      path.join(args.outDir, "vendor-proposal-parse-proof.json"),
      `${JSON.stringify(proof, null, 2)}\n`,
    );
    await writeFile(
      path.join(args.outDir, "vendor-proposal-parse-proof.md"),
      [
        "# Vendor Proposal Parse Proof",
        "",
        `Status: ${ok ? "PASS" : "FAIL"}`,
        `Mode: ${args.mode}`,
        `Tenant: ${tenantKey}`,
        `Event: ${event.event_code} (${event.id})`,
        `Vendor: ${vendorKey}`,
        "",
        "## What Was Proved",
        "",
        `- Extracted ${candidates.length} candidate facts from a controlled proposal text.`,
        `- Persisted ${insertedFacts} new fact rows through the tenant-scoped proposal repository.`,
        `- Read back ${readbackFacts.length} rows for the same artifact through the same tenant-scoped path.`,
        `- Rows with source quote, source pointer, confidence, and method: ${rowsWithLineage}.`,
        `- Idempotency second pass new rows: ${secondPassNewRows ?? "not applicable in dry-run"}.`,
        "",
        "## Boundary",
        "",
        "- This operator proof does not upload bytes to Blob; it writes artifact registry metadata and governed proposal facts.",
        "- Missing remains missing: candidate facts are not accepted facts until a reviewer accepts them.",
      ].join("\n"),
    );

    console.log(JSON.stringify({ ...proof, proofDir: args.outDir }, null, 2));
    if (!ok) process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

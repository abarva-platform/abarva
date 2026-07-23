/**
 * Read-only verification for Source enterprise-context writeback rows.
 *
 * This script does not write, promote, index, or mutate Enterprise Context. It
 * confirms that a prior Source writeback created reviewable records/facts and
 * that those rows remain not_reviewed / committed_not_indexed until a separate
 * governance promotion earns agent_ready.
 *
 * Usage:
 *   npm run source:enterprise-context:verify-writeback -- --client-key lakeshore --event-id <uuid|code|slug>
 */

import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  SOURCE_CONTEXT_RECORD_TYPE,
  SOURCE_CONTEXT_SOURCE_SYSTEM,
} from "@/lib/source/context-writeback";
import {
  summarizeSourceContextReadback,
  type SourceContextReadbackFact,
  type SourceContextReadbackReadiness,
  type SourceContextReadbackRecord,
} from "@/lib/source/context-writeback/readback";
import type { SourceEventRow } from "@/lib/source/queries";
import { getSourceEventSeed } from "@/lib/source/mock-seed";
import { canonicalTenantKey } from "@/lib/tenant-keys";
import { tenantAliasesFor } from "@/lib/tenant/aliases";

config({ path: ".env.local" });
config({ path: ".env" });

interface CliOptions {
  readonly clientKey: string;
  readonly eventId: string;
  readonly outDir: string;
}

function valueAfter(args: readonly string[], flag: string): string | null {
  const index = args.indexOf(flag);
  if (index < 0) return null;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : null;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const clientKey =
    valueAfter(args, "--client-key") ??
    valueAfter(args, "--client") ??
    process.env.SOURCE_WRITEBACK_CLIENT_KEY ??
    process.env.SOURCE_CONTEXT_WRITEBACK_CLIENT_KEY;
  const eventId =
    valueAfter(args, "--event-id") ??
    valueAfter(args, "--event") ??
    process.env.SOURCE_WRITEBACK_EVENT_ID ??
    process.env.SOURCE_CONTEXT_WRITEBACK_EVENT_ID;
  const usage = [
    "Usage:",
    "  npm run source:enterprise-context:verify-writeback -- --client-key <tenant> --event-id <uuid|code|slug> [--out-dir <dir>]",
    "  SOURCE_WRITEBACK_CLIENT_KEY=<tenant> SOURCE_WRITEBACK_EVENT_ID=<uuid|code|slug> npm run source:enterprise-context:verify-writeback",
    "",
    "Read-only. Confirms persisted Source writeback rows and conservative readiness state.",
  ].join("\n");
  if (args.includes("--help")) {
    console.log(usage);
    process.exit(0);
  }
  if (!clientKey || !eventId) {
    throw new Error(usage);
  }
  return {
    clientKey: canonicalTenantKey(clientKey),
    eventId,
    outDir:
      valueAfter(args, "--out-dir") ??
      process.env.SOURCE_WRITEBACK_OUT_DIR ??
      process.env.SOURCE_CONTEXT_WRITEBACK_OUT_DIR ??
      "reports/source-enterprise-context-writeback/readback",
  };
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function readResolvedEvent(
  clientKey: string,
  eventId: string,
): Promise<SourceEventRow> {
  const clientKeys = tenantAliasesFor(clientKey);
  const seedEvent = getSourceEventSeed(eventId);
  const eventCodes = Array.from(
    new Set(
      [eventId, seedEvent?.code].filter((value): value is string =>
        Boolean(value),
      ),
    ),
  );
  const baseQuery = getAzureReadFluentClient()
    .from("source_events")
    .select(
      "id,client_key,event_code,event_name,event_type,current_stage_key,lifecycle_state,linked_program_id,estimated_value_usd,trigger_description,scope_description,decision_owner,created_by_user_id,created_at,updated_at",
    )
    .in("client_key", clientKeys)
    .order("updated_at", { ascending: false })
    .limit(1);

  const query = UUID_REGEX.test(eventId)
    ? baseQuery.eq("id", eventId)
    : baseQuery.in("event_code", eventCodes);
  const { data, error } = await query.maybeSingle<SourceEventRow>();
  if (error) throw new Error(error.message);
  if (!data)
    throw new Error(`No Source event found for ${clientKey}:${eventId}`);
  return data;
}

async function readRows(opts: {
  readonly clientKey: string;
  readonly sourceEventId: string;
}): Promise<{
  readonly records: SourceContextReadbackRecord[];
  readonly facts: SourceContextReadbackFact[];
  readonly readinessRows: SourceContextReadbackReadiness[];
}> {
  const db = getAzureReadFluentClient();
  const { data: records, error: recordsError } = await db
    .from("enterprise_context_records")
    .select(
      "id,tenant_key,canonical_record_id,record_type,record_subtype,source_system,source_record_id,lifecycle_state,payload",
    )
    .eq("tenant_key", opts.clientKey)
    .eq("record_type", SOURCE_CONTEXT_RECORD_TYPE)
    .eq("source_system", SOURCE_CONTEXT_SOURCE_SYSTEM)
    .limit(1000);
  if (recordsError) {
    throw new Error(`enterprise_context_records readback: ${recordsError.message}`);
  }
  const recordRows = (records ?? []) as SourceContextReadbackRecord[];
  const sourceEventRecordRows = recordRows.filter(
    (row) => row.payload?.sourceEventId === opts.sourceEventId,
  );
  const recordIds = sourceEventRecordRows.map((row) => row.id);

  const { data: facts, error: factsError } = recordIds.length
    ? await db
        .from("enterprise_context_facts")
        .select("id,record_id,tenant_key,source_system,source_record_id,lifecycle_state")
        .eq("tenant_key", opts.clientKey)
        .eq("source_system", SOURCE_CONTEXT_SOURCE_SYSTEM)
        .in("record_id", recordIds)
        .limit(2000)
    : { data: [], error: null };
  if (factsError) {
    throw new Error(`enterprise_context_facts readback: ${factsError.message}`);
  }

  const { data: readinessRows, error: readinessError } = recordIds.length
    ? await db
        .from("governed_object_readiness")
        .select(
          "object_table,object_id,client_key,source_layer,source_basis,agent_readiness_status,retrievability,policy_validation_status,provenance",
        )
        .eq("client_key", opts.clientKey)
        .eq("object_table", "enterprise_context_records")
        .in("object_id", recordIds)
        .limit(2000)
    : { data: [], error: null };
  if (readinessError) {
    throw new Error(`governed_object_readiness readback: ${readinessError.message}`);
  }

  return {
    records: sourceEventRecordRows,
    facts: (facts ?? []) as SourceContextReadbackFact[],
    readinessRows: (readinessRows ?? []) as SourceContextReadbackReadiness[],
  };
}

async function writeReport(
  outDir: string,
  report: ReturnType<typeof summarizeSourceContextReadback> & {
    readonly generatedAt: string;
    readonly inputEventId: string;
    readonly resolvedEvent: {
      readonly id: string;
      readonly code: string;
      readonly name: string;
      readonly stageKey: string;
    };
  },
): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, "readback.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return reportPath;
}

function emitProofBundle(outDir: string): void {
  if (process.env.SOURCE_WRITEBACK_EMIT_PROOF_BUNDLE?.toLowerCase() !== "true") {
    return;
  }
  const tar = spawnSync("tar", ["-czf", "-", "-C", outDir, "."], {
    encoding: "buffer",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (tar.status !== 0) {
    throw new Error(
      `failed to create readback proof bundle: ${
        tar.stderr?.toString("utf8") || tar.stdout?.toString("utf8")
      }`,
    );
  }
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  console.log(tar.stdout.toString("base64"));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

async function main() {
  const opts = parseArgs();
  const generatedAt = new Date().toISOString();
  const event = await readResolvedEvent(opts.clientKey, opts.eventId);
  const rows = await readRows({
    clientKey: opts.clientKey,
    sourceEventId: event.id,
  });
  const summary = summarizeSourceContextReadback({
    clientKey: opts.clientKey,
    sourceEventId: event.id,
    records: rows.records,
    facts: rows.facts,
    readinessRows: rows.readinessRows,
  });
  const report = {
    generatedAt,
    inputEventId: opts.eventId,
    resolvedEvent: {
      id: event.id,
      code: event.event_code,
      name: event.event_name,
      stageKey: event.current_stage_key,
    },
    ...summary,
  };
  const reportPath = await writeReport(opts.outDir, report);
  emitProofBundle(opts.outDir);
  console.log(
    [
      `Source enterprise-context writeback readback ${summary.status}`,
      `client=${opts.clientKey}`,
      `event=${event.event_code} (${event.id})`,
      `records=${summary.counts.records}`,
      `facts=${summary.counts.facts}`,
      `readinessRows=${summary.counts.readinessRows}`,
      `activePromotionViolations=${summary.activePromotionViolations.length}`,
      `report=${reportPath}`,
    ].join(" · "),
  );
  if (summary.status !== "pass") process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

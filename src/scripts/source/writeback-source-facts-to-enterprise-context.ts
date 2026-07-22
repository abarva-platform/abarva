/**
 * Plan or apply Source fact writeback into the enterprise context layer.
 *
 * Default mode is a dry run: it resolves one tenant-scoped Source event, reads
 * its typed `source_event_facts`, builds the enterprise-context writeback plan,
 * and writes a proof report without mutating data. Use `--apply` only from the
 * approved ACA operator-job lane so private Azure/Postgres mutation remains
 * auditable and VNet-scoped.
 *
 * Usage:
 *   npm run source:enterprise-context:writeback -- --client-key apex-retail --event-id apex-retail-ams-outsourcing-2026
 *   npm run source:enterprise-context:writeback -- --client-key apex-retail --event-id apex-retail-ams-outsourcing-2026 --apply
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { canonicalTenantKey } from "@/lib/tenant-keys";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import type { SourceEventFactRow } from "@/lib/source/facts/fact-types";
import { getSourceEventSeed } from "@/lib/source/mock-seed";
import type { SourceEventRow } from "@/lib/source/queries";
import { tenantAliasesFor } from "@/lib/tenant/aliases";
import {
  buildSourceContextWritebackPlan,
  writeSourceFactsToEnterpriseContext,
} from "@/lib/source/context-writeback";

config({ path: ".env.local" });
config({ path: ".env" });

interface CliOptions {
  readonly clientKey: string;
  readonly eventId: string;
  readonly apply: boolean;
  readonly outDir: string;
}

interface ProofReport {
  readonly generatedAt: string;
  readonly mode: "dry_run" | "apply";
  readonly clientKey: string;
  readonly inputEventId: string;
  readonly resolvedEvent: {
    readonly id: string;
    readonly code: string;
    readonly name: string;
    readonly stageKey: string;
  };
  readonly factsRead: number;
  readonly eligibleRecords: number;
  readonly eligibleFacts: number;
  readonly readinessRows: number;
  readonly skippedFacts: ReturnType<
    typeof buildSourceContextWritebackPlan
  >["skippedFacts"];
  readonly writeResult?: Awaited<
    ReturnType<typeof writeSourceFactsToEnterpriseContext>
  >;
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
  const apply =
    args.includes("--apply") ||
    process.env.SOURCE_WRITEBACK_APPLY === "true" ||
    process.env.SOURCE_CONTEXT_WRITEBACK_APPLY === "true";
  if (!clientKey || !eventId || args.includes("--help")) {
    throw new Error(
      [
        "Usage:",
        "  npm run source:enterprise-context:writeback -- --client-key <tenant> --event-id <uuid|code|slug> [--apply] [--out-dir <dir>]",
        "  SOURCE_WRITEBACK_CLIENT_KEY=<tenant> SOURCE_WRITEBACK_EVENT_ID=<uuid|code|slug> npm run source:enterprise-context:writeback",
        "",
        "Default is dry-run. Use --apply only through the approved ACA operator-job lane.",
      ].join("\n"),
    );
  }
  return {
    clientKey: canonicalTenantKey(clientKey),
    eventId,
    apply,
    outDir:
      valueAfter(args, "--out-dir") ??
      process.env.SOURCE_WRITEBACK_OUT_DIR ??
      process.env.SOURCE_CONTEXT_WRITEBACK_OUT_DIR ??
      "reports/source-enterprise-context-writeback/latest",
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

async function readFacts(eventId: string): Promise<SourceEventFactRow[]> {
  const { data, error } = await getAzureReadFluentClient()
    .from("source_event_facts")
    .select(
      "id,source_event_id,client_key,fact_key,entity_kind,entity_ref,value_numeric,value_text,unit,source_method,source_citation,confidence,captured_at,is_stale",
    )
    .eq("source_event_id", eventId)
    .order("captured_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as SourceEventFactRow[];
}

async function writeReport(
  outDir: string,
  report: ProofReport,
): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, "result.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return reportPath;
}

async function main() {
  const opts = parseArgs();
  const generatedAt = new Date().toISOString();
  const event = await readResolvedEvent(opts.clientKey, opts.eventId);
  const facts = await readFacts(event.id);
  const sourceEvent = {
    id: event.id,
    code: event.event_code,
    name: event.event_name,
    clientKey: event.client_key,
    stageKey: event.current_stage_key,
  };
  const plan = buildSourceContextWritebackPlan({
    event: sourceEvent,
    facts,
    committedAt: generatedAt,
  });
  const writeResult = opts.apply
    ? await writeSourceFactsToEnterpriseContext({
        event: sourceEvent,
        facts,
        committedAt: generatedAt,
      })
    : undefined;

  const report: ProofReport = {
    generatedAt,
    mode: opts.apply ? "apply" : "dry_run",
    clientKey: opts.clientKey,
    inputEventId: opts.eventId,
    resolvedEvent: {
      id: event.id,
      code: event.event_code,
      name: event.event_name,
      stageKey: event.current_stage_key,
    },
    factsRead: facts.length,
    eligibleRecords: plan.records.length,
    eligibleFacts: plan.factDrafts.length,
    readinessRows: plan.readinessDrafts.length,
    skippedFacts: plan.skippedFacts,
    writeResult,
  };
  const reportPath = await writeReport(opts.outDir, report);
  console.log(
    [
      `Source enterprise-context writeback ${report.mode}`,
      `event=${event.event_code} (${event.id})`,
      `factsRead=${report.factsRead}`,
      `eligible=${report.eligibleFacts}`,
      `skipped=${report.skippedFacts.length}`,
      writeResult
        ? `writeStatus=${writeResult.status}`
        : "writeStatus=not_applied",
      `report=${reportPath}`,
    ].join(" · "),
  );
  if (writeResult?.status === "failed") process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

/**
 * Read-only verification for Moves learning writeback rows.
 *
 * This script does not write, promote, index, or mutate Enterprise Context. It
 * confirms that a prior apply created reviewable candidates and that those
 * candidates remain not_reviewed / committed_not_indexed until a separate
 * governance promotion happens.
 *
 * Usage:
 *   npm run moves:enterprise-context:verify-writeback -- --client-key arcturus --move-id <uuid>
 */

import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { config } from "dotenv";
import { canonicalTenantKey } from "@/lib/tenant-keys";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  MOVES_LEARNING_RECORD_TYPE,
  MOVES_LEARNING_SOURCE_SYSTEM,
} from "@/lib/programs/learning-writeback";
import {
  summarizeMovesLearningReadback,
  type MovesLearningReadbackFact,
  type MovesLearningReadbackReadiness,
  type MovesLearningReadbackRecord,
} from "@/lib/programs/learning-writeback/readback";

config({ path: ".env.local" });
config({ path: ".env" });

interface CliOptions {
  readonly clientKey: string;
  readonly moveId: string;
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
    process.env.MOVES_WRITEBACK_CLIENT_KEY;
  const moveId =
    valueAfter(args, "--move-id") ??
    valueAfter(args, "--move") ??
    process.env.MOVES_WRITEBACK_MOVE_ID;
  if (!clientKey || !moveId || args.includes("--help")) {
    throw new Error(
      [
        "Usage:",
        "  npm run moves:enterprise-context:verify-writeback -- --client-key <tenant> --move-id <uuid> [--out-dir <dir>]",
        "",
        "Read-only. Confirms persisted Moves learning candidates and readiness state.",
      ].join("\n"),
    );
  }
  return {
    clientKey: canonicalTenantKey(clientKey),
    moveId,
    outDir:
      valueAfter(args, "--out-dir") ??
      process.env.MOVES_WRITEBACK_OUT_DIR ??
      "reports/moves-enterprise-context-writeback/readback",
  };
}

async function readRows(opts: {
  clientKey: string;
  moveId: string;
}): Promise<{
  readonly records: MovesLearningReadbackRecord[];
  readonly facts: MovesLearningReadbackFact[];
  readonly readinessRows: MovesLearningReadbackReadiness[];
}> {
  const db = getAzureReadFluentClient();
  const { data: records, error: recordsError } = await db
    .from("enterprise_context_records")
    .select(
      "id,tenant_key,canonical_record_id,record_type,record_subtype,source_system,source_record_id,lifecycle_state,payload",
    )
    .eq("tenant_key", opts.clientKey)
    .eq("record_type", MOVES_LEARNING_RECORD_TYPE)
    .eq("source_system", MOVES_LEARNING_SOURCE_SYSTEM)
    .limit(1000);
  if (recordsError) throw new Error(`enterprise_context_records readback: ${recordsError.message}`);
  const recordRows = (records ?? []) as MovesLearningReadbackRecord[];
  const recordIds = recordRows.map((row) => row.id);

  const { data: facts, error: factsError } = recordIds.length
    ? await db
        .from("enterprise_context_facts")
        .select("id,record_id,tenant_key,source_system,source_record_id,lifecycle_state")
        .eq("tenant_key", opts.clientKey)
        .eq("source_system", MOVES_LEARNING_SOURCE_SYSTEM)
        .in("record_id", recordIds)
        .limit(2000)
    : { data: [], error: null };
  if (factsError) throw new Error(`enterprise_context_facts readback: ${factsError.message}`);

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
    records: recordRows,
    facts: (facts ?? []) as MovesLearningReadbackFact[],
    readinessRows: (readinessRows ?? []) as MovesLearningReadbackReadiness[],
  };
}

async function writeReport(
  outDir: string,
  report: ReturnType<typeof summarizeMovesLearningReadback> & {
    readonly generatedAt: string;
  },
): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, "readback.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return reportPath;
}

function emitProofBundle(outDir: string): void {
  if (process.env.MOVES_WRITEBACK_EMIT_PROOF_BUNDLE?.toLowerCase() !== "true") {
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
  const rows = await readRows(opts);
  const summary = summarizeMovesLearningReadback({
    clientKey: opts.clientKey,
    moveId: opts.moveId,
    records: rows.records,
    facts: rows.facts,
    readinessRows: rows.readinessRows,
  });
  const report = { generatedAt, ...summary };
  const reportPath = await writeReport(opts.outDir, report);
  emitProofBundle(opts.outDir);
  console.log(
    [
      `Moves enterprise-context writeback readback ${summary.status}`,
      `client=${opts.clientKey}`,
      `move=${opts.moveId}`,
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

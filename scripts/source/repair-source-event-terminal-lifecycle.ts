import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { Client } from "pg";

import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

const PROOF_BEGIN = "__SEMANTIC2_PROOF_TGZ_BEGIN__";
const PROOF_END = "__SEMANTIC2_PROOF_TGZ_END__";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function databaseUrl(): string {
  return (
    process.env.ABARVA_AZURE_DATABASE_URL ??
    process.env.AZURE_DATABASE_URL ??
    process.env.DATABASE_URL ??
    ""
  );
}

function assertOperatorContract(): void {
  if (process.env.SOURCE_EVENT_TERMINAL_REPAIR_APPLY_APPROVED !== "true") {
    throw new Error(
      "SOURCE_EVENT_TERMINAL_REPAIR_APPLY_APPROVED=true is required.",
    );
  }
  if (process.env.ACA_JOB_NAME !== "job-abarva-private-operator-eus") {
    throw new Error(
      "Terminal lifecycle repair must run through the governed private ACA operator job.",
    );
  }
  if (
    !/^sha256:[0-9a-f]{64}$/i.test(
      process.env.ABARVA_OPERATOR_IMAGE_DIGEST ?? "",
    )
  ) {
    throw new Error("A digest-pinned ACA operator image is required.");
  }
}

function emitProofBundle(outDir: string): void {
  const tarPath = path.join(
    os.tmpdir(),
    `source-terminal-lifecycle-${Date.now()}.tgz`,
  );
  const result = spawnSync("tar", ["-czf", tarPath, "-C", outDir, "."], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || "Could not create terminal lifecycle proof bundle.");
  }
  console.log(PROOF_BEGIN);
  console.log(fs.readFileSync(tarPath).toString("base64"));
  console.log(PROOF_END);
}

async function main(): Promise<void> {
  assertOperatorContract();

  const eventId = required("SOURCE_EVENT_ID");
  const tenantKey = required("SOURCE_EVENT_TENANT_KEY");
  const runId = required("SOURCE_EVENT_TERMINAL_REPAIR_RUN_ID");
  const buildVersion = required("SOURCE_EVENT_TERMINAL_REPAIR_BUILD_VERSION");
  const inputSourceVersion = required(
    "SOURCE_EVENT_TERMINAL_REPAIR_INPUT_SOURCE_VERSION",
  );
  const idempotencyKey = required(
    "SOURCE_EVENT_TERMINAL_REPAIR_IDEMPOTENCY_KEY",
  );
  const releaseRecord = required("SOURCE_EVENT_TERMINAL_REPAIR_RELEASE_RECORD");
  const url = databaseUrl();
  if (!url) throw new Error("An Azure Postgres connection string is required.");

  const startedAt = new Date().toISOString();
  const outDir = path.resolve(
    process.env.SOURCE_EVENT_TERMINAL_REPAIR_PROOF_DIR?.trim() ||
      `/tmp/source-terminal-lifecycle-${runId}`,
  );
  fs.mkdirSync(outDir, { recursive: true });

  const client = new Client(
    postgresClientOptions(url, "source-event-terminal-lifecycle-repair"),
  );
  await client.connect();

  try {
    await client.query("begin");
    const beforeResult = await client.query<{
      id: string;
      client_key: string;
      current_stage_key: string;
      lifecycle_state: string;
    }>(
      `select id, client_key, current_stage_key, lifecycle_state
         from public.source_events
        where id = $1 and client_key = $2
        for update`,
      [eventId, tenantKey],
    );
    const before = beforeResult.rows[0];
    if (!before) {
      throw new Error("No event exists for the requested event and tenant keys.");
    }
    if (before.current_stage_key !== "value") {
      throw new Error(
        `Terminal-stage guard failed: expected value, found ${before.current_stage_key}.`,
      );
    }

    const approvalResult = await client.query<{ approval_count: string }>(
      `select count(*)::text as approval_count
         from public.source_event_approvals
        where event_id = $1
          and stage_key = 'value'
          and action = 'admin_review'`,
      [eventId],
    );
    const approvalCount = Number(approvalResult.rows[0]?.approval_count ?? "0");
    if (approvalCount < 1) {
      throw new Error(
        "Terminal approval guard failed: no Value approval record exists.",
      );
    }

    const alreadyApplied = before.lifecycle_state === "completed";
    if (!alreadyApplied && before.lifecycle_state !== "active") {
      throw new Error(
        `Optimistic lifecycle guard failed: expected active, found ${before.lifecycle_state}.`,
      );
    }
    if (!alreadyApplied) {
      const update = await client.query(
        `update public.source_events
            set lifecycle_state = 'completed', updated_at = now()
          where id = $1
            and client_key = $2
            and current_stage_key = 'value'
            and lifecycle_state = 'active'`,
        [eventId, tenantKey],
      );
      if (update.rowCount !== 1) {
        throw new Error("Terminal lifecycle repair did not affect one row.");
      }
    }

    const afterResult = await client.query<{
      current_stage_key: string;
      lifecycle_state: string;
    }>(
      `select current_stage_key, lifecycle_state
         from public.source_events
        where id = $1 and client_key = $2`,
      [eventId, tenantKey],
    );
    const after = afterResult.rows[0];
    if (
      after?.current_stage_key !== "value" ||
      after.lifecycle_state !== "completed"
    ) {
      throw new Error("Terminal lifecycle readback did not pass.");
    }

    await client.query("commit");

    const proof = {
      event: "source_event_terminal_lifecycle_repair",
      runId,
      idempotencyKey,
      tenantKey,
      eventId,
      buildVersion,
      inputSourceVersion,
      releaseRecord,
      operatorIdentity: process.env.GITHUB_ACTOR ?? "aca-private-operator",
      gitSha: process.env.GITHUB_SHA ?? null,
      imageDigest: process.env.ABARVA_OPERATOR_IMAGE_DIGEST,
      startedAt,
      finishedAt: new Date().toISOString(),
      alreadyApplied,
      approvalEvidence: { stageKey: "value", approvalCount },
      before: {
        currentStageKey: before.current_stage_key,
        lifecycleState: before.lifecycle_state,
      },
      after: {
        currentStageKey: after.current_stage_key,
        lifecycleState: after.lifecycle_state,
      },
      qualityGate: {
        status: "PASS",
        checks: [
          "tenant_owner",
          "terminal_stage",
          "terminal_approval_exists",
          "optimistic_lifecycle",
          "readback",
        ],
      },
    };
    fs.writeFileSync(
      path.join(outDir, "summary.json"),
      `${JSON.stringify(proof, null, 2)}\n`,
    );
    console.log(JSON.stringify(proof));
    emitProofBundle(outDir);
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

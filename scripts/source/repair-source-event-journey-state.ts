import fs from "node:fs";
import path from "node:path";

import { Client } from "pg";

import { SOURCE_STAGE_ORDER } from "../../src/lib/source/constants";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

const MOTIONS = new Set(["competitive_rfp", "contract_optimization"]);

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

function assertOperatorContract() {
  if (process.env.SOURCE_EVENT_JOURNEY_REPAIR_APPLY_APPROVED !== "true") {
    throw new Error(
      "SOURCE_EVENT_JOURNEY_REPAIR_APPLY_APPROVED=true is required.",
    );
  }
  if (process.env.ACA_JOB_NAME !== "job-abarva-private-operator-eus") {
    throw new Error(
      "Journey repair must run through the governed private ACA operator job.",
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

async function main() {
  assertOperatorContract();

  const eventId = required("SOURCE_EVENT_ID");
  const tenantKey = required("SOURCE_EVENT_TENANT_KEY");
  const expectedStage = required("SOURCE_EVENT_EXPECTED_CURRENT_STAGE");
  const targetStage = required("SOURCE_EVENT_TARGET_STAGE");
  const targetMotion = required("SOURCE_EVENT_TARGET_MOTION");
  const runId = required("SOURCE_EVENT_JOURNEY_REPAIR_RUN_ID");
  const idempotencyKey = required(
    "SOURCE_EVENT_JOURNEY_REPAIR_IDEMPOTENCY_KEY",
  );
  const url = databaseUrl();

  if (!url) throw new Error("An Azure Postgres connection string is required.");
  if (!SOURCE_STAGE_ORDER.includes(expectedStage as never)) {
    throw new Error(`Unsupported expected stage: ${expectedStage}`);
  }
  if (!SOURCE_STAGE_ORDER.includes(targetStage as never)) {
    throw new Error(`Unsupported target stage: ${targetStage}`);
  }
  if (!MOTIONS.has(targetMotion)) {
    throw new Error(`Unsupported target sourcing motion: ${targetMotion}`);
  }

  const client = new Client(
    postgresClientOptions(url, "source-event-journey-repair"),
  );
  await client.connect();

  try {
    await client.query("begin");
    const beforeResult = await client.query<{
      id: string;
      client_key: string;
      current_stage_key: string;
      sourcing_motion: string | null;
    }>(
      `select id, client_key, current_stage_key, sourcing_motion
         from public.source_events
        where id = $1 and client_key = $2
        for update`,
      [eventId, tenantKey],
    );
    const before = beforeResult.rows[0];
    if (!before)
      throw new Error(
        "No event exists for the requested event and tenant keys.",
      );

    const alreadyApplied =
      before.current_stage_key === targetStage &&
      before.sourcing_motion === targetMotion;
    if (!alreadyApplied && before.current_stage_key !== expectedStage) {
      throw new Error(
        `Optimistic stage check failed: expected ${expectedStage}, found ${before.current_stage_key}.`,
      );
    }

    if (!alreadyApplied) {
      const update = await client.query(
        `update public.source_events
            set current_stage_key = $1,
                sourcing_motion = $2,
                updated_at = now()
          where id = $3
            and client_key = $4
            and current_stage_key = $5`,
        [targetStage, targetMotion, eventId, tenantKey, expectedStage],
      );
      if (update.rowCount !== 1)
        throw new Error("Journey repair update did not affect one row.");
    }

    const afterResult = await client.query<{
      id: string;
      client_key: string;
      current_stage_key: string;
      sourcing_motion: string | null;
    }>(
      `select id, client_key, current_stage_key, sourcing_motion
         from public.source_events
        where id = $1 and client_key = $2`,
      [eventId, tenantKey],
    );
    const after = afterResult.rows[0];
    const pass =
      after?.current_stage_key === targetStage &&
      after.sourcing_motion === targetMotion;
    if (!pass)
      throw new Error(
        "Journey repair readback did not match the requested target state.",
      );

    await client.query("commit");

    const proof = {
      event: "source_event_journey_repair",
      runId,
      idempotencyKey,
      tenantKey,
      eventId,
      alreadyApplied,
      before: {
        currentStageKey: before.current_stage_key,
        sourcingMotion: before.sourcing_motion,
      },
      after: {
        currentStageKey: after.current_stage_key,
        sourcingMotion: after.sourcing_motion,
      },
      qualityGate: {
        status: "PASS",
        checks: ["tenant_owner", "optimistic_stage", "readback"],
      },
    };

    const proofDir = process.env.SOURCE_EVENT_JOURNEY_REPAIR_PROOF_DIR?.trim();
    if (proofDir) {
      fs.mkdirSync(proofDir, { recursive: true });
      fs.writeFileSync(
        path.join(proofDir, "summary.json"),
        `${JSON.stringify(proof, null, 2)}\n`,
      );
    }
    console.log(JSON.stringify(proof));
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

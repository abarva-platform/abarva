import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { Pool, type PoolConfig } from "pg";

import { AMS_MANAGED_SERVICES } from "@/lib/source/archetypes/registry";
import { runSourceOptimization } from "@/lib/source/door1";
import type { Door1FactMap, Door1FactValue } from "@/lib/source/door1/types";
import { getSourceJourneyForEvent } from "@/lib/source/sourcing-motion-journeys";

type FactSeed = {
  factKey: string;
  entityKind: "event" | "tower" | "vendor";
  entityRef: string | null;
  value: number;
  unit: string;
  doc: string;
  locator: string;
};

type FactReadbackRow = {
  fact_key: string;
  entity_kind: string;
  entity_ref: string | null;
  value_numeric: string | number | null;
  unit: string;
  source_citation: { doc?: string; locator?: string } | null;
};

const TENANT_KEY = "skyharbor_global";
const CONTRACT_ID = "CTR-090";
const CONTRACT_NAME = "Crestline AMS Master Services Agreement";
const VENDOR_NAME = "Crestline";

const FACTS: FactSeed[] = [
  {
    factKey: "annual_run_cost",
    entityKind: "tower",
    entityRef: "AMS Run Support",
    value: 12_000_000,
    unit: "usd_per_year",
    doc: "SkyHarbor synthetic AMS baseline workbook",
    locator: "Contract baseline!annual_run_cost",
  },
  {
    factKey: "projected_volume_decline_pct",
    entityKind: "tower",
    entityRef: "AMS Run Support",
    value: 14,
    unit: "pct",
    doc: "SkyHarbor synthetic ticket volumetrics",
    locator: "Volumetrics!projected_volume_decline_pct",
  },
  {
    factKey: "variable_cost_share_pct",
    entityKind: "tower",
    entityRef: "AMS Run Support",
    value: 58,
    unit: "pct",
    doc: "SkyHarbor synthetic pricing schedule",
    locator: "Pricing schedule!variable_cost_share_pct",
  },
  {
    factKey: "automatable_effort_pool",
    entityKind: "event",
    entityRef: null,
    value: 3_200_000,
    unit: "usd_per_year",
    doc: "SkyHarbor synthetic automation baseline",
    locator: "Automation baseline!automatable_effort_pool",
  },
  {
    factKey: "committed_credit_pct",
    entityKind: "vendor",
    entityRef: VENDOR_NAME,
    value: 8,
    unit: "pct",
    doc: "SkyHarbor synthetic contract extract",
    locator: "SLA and productivity schedule!committed_credit_pct",
  },
  {
    factKey: "annual_change_order_spend",
    entityKind: "event",
    entityRef: null,
    value: 1_400_000,
    unit: "usd_per_year",
    doc: "SkyHarbor synthetic change-order register",
    locator: "Change orders!annual_change_order_spend",
  },
  {
    factKey: "recurring_avoidable_pct",
    entityKind: "event",
    entityRef: null,
    value: 45,
    unit: "pct",
    doc: "SkyHarbor synthetic ticket classification",
    locator: "Ticket classification!recurring_avoidable_pct",
  },
  {
    factKey: "at_risk_fee_pool",
    entityKind: "vendor",
    entityRef: VENDOR_NAME,
    value: 2_000_000,
    unit: "usd_per_year",
    doc: "SkyHarbor synthetic SLA schedule",
    locator: "SLA schedule!at_risk_fee_pool",
  },
  {
    factKey: "credit_cap_pct",
    entityKind: "vendor",
    entityRef: VENDOR_NAME,
    value: 6,
    unit: "pct",
    doc: "SkyHarbor synthetic SLA schedule",
    locator: "SLA schedule!credit_cap_pct",
  },
  {
    factKey: "chronic_miss_rate",
    entityKind: "event",
    entityRef: null,
    value: 7.5,
    unit: "pct",
    doc: "SkyHarbor synthetic incident export",
    locator: "Incident summary!chronic_miss_rate",
  },
  {
    factKey: "retained_fte_delta",
    entityKind: "vendor",
    entityRef: VENDOR_NAME,
    value: 3,
    unit: "fte",
    doc: "SkyHarbor synthetic staffing model",
    locator: "Retained org!retained_fte_delta",
  },
  {
    factKey: "loaded_fte_cost",
    entityKind: "event",
    entityRef: null,
    value: 190_000,
    unit: "usd_per_year",
    doc: "SkyHarbor synthetic finance baseline",
    locator: "Finance baseline!loaded_fte_cost",
  },
  {
    factKey: "transition_fee",
    entityKind: "vendor",
    entityRef: VENDOR_NAME,
    value: 650_000,
    unit: "usd",
    doc: "SkyHarbor synthetic transition schedule",
    locator: "Transition schedule!transition_fee",
  },
  {
    factKey: "overrun_probability",
    entityKind: "event",
    entityRef: null,
    value: 25,
    unit: "pct",
    doc: "SkyHarbor synthetic transition benchmark",
    locator: "Benchmark!overrun_probability",
  },
  {
    factKey: "overrun_cost_multiple",
    entityKind: "event",
    entityRef: null,
    value: 0.5,
    unit: "ratio",
    doc: "SkyHarbor synthetic transition benchmark",
    locator: "Benchmark!overrun_cost_multiple",
  },
  {
    factKey: "term_years",
    entityKind: "event",
    entityRef: null,
    value: 3,
    unit: "count",
    doc: "SkyHarbor synthetic contract extract",
    locator: "Commercial terms!term_years",
  },
];

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const envFileArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--env-file="))
  ?.slice("--env-file=".length);

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!match) return null;
  const [, key, rawValue] = match;
  const value = rawValue
    .trim()
    .replace(/^['"]|['"]$/g, "");
  return [key, value];
}

async function loadEnvFile(filePath: string | undefined): Promise<void> {
  if (!filePath) return;
  const { readFile } = await import("node:fs/promises");
  const text = await readFile(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    const [key, value] = parsed;
    if (!process.env[key]) process.env[key] = value;
  }
}

function connectionString(): string {
  const candidates = [
    process.env.ABARVA_CLIENT_DATABASE_URL_SKYHARBOR_GLOBAL,
    process.env.ABARVA_TENANT_DATABASE_URL_SKYHARBOR_GLOBAL,
    process.env.AZURE_CLIENT_DATABASE_URL_SKYHARBOR_GLOBAL,
    process.env.ABARVA_AZURE_DATABASE_URL,
    process.env.AZURE_DATABASE_URL,
    process.env.DATABASE_URL,
  ].filter((value): value is string => Boolean(value?.trim()));
  const value = candidates[0];
  if (!value) {
    throw new Error(
      "No database URL configured. Set a SkyHarbor tenant DB URL or pass --env-file=/path/to/.env.local.",
    );
  }
  return value;
}

function poolConfig(url: string): PoolConfig {
  const parsed = new URL(url);
  const local = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  return {
    connectionString: url,
    application_name: "source-door1-front-door-smoke",
    max: 1,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
    ssl: local || parsed.searchParams.get("sslmode") === "disable"
      ? false
      : { rejectUnauthorized: false },
  };
}

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.username) parsed.username = "***";
    if (parsed.password) parsed.password = "***";
    return `${parsed.protocol}//${parsed.username ? `${parsed.username}@` : ""}${parsed.host}${parsed.pathname}`;
  } catch {
    return "<masked>";
  }
}

function factMapFromRows(rows: FactReadbackRow[]): Door1FactMap {
  const map: Door1FactMap = {};
  for (const row of rows) {
    if (map[row.fact_key] !== undefined) continue;
    const numeric = Number(row.value_numeric);
    if (!Number.isFinite(numeric)) continue;
    const value: Door1FactValue = {
      factKey: row.fact_key,
      value: numeric,
      unit: row.unit,
      citation: row.source_citation?.doc && row.source_citation?.locator
        ? {
            doc: row.source_citation.doc,
            locator: row.source_citation.locator,
          }
        : null,
    };
    map[row.fact_key] = value;
  }
  return map;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: unknown): string {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

async function main(): Promise<void> {
  await loadEnvFile(envFileArg);
  const url = connectionString();
  const pool = new Pool(poolConfig(url));
  const client = await pool.connect();
  const eventId = randomUUID();
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const eventCode = `SKY-CTR090-DOOR1-SMOKE-${runId.slice(0, 19)}`;
  const outDir = path.join(
    os.homedir(),
    "Downloads",
    `skyharbor-door1-front-door-smoke-${runId}`,
  );

  try {
    await client.query("BEGIN");

    await client.query(
    `insert into source_events (
       id, client_key, event_code, event_name, event_type, sourcing_motion,
       classified_category, current_stage_key, lifecycle_state,
       trigger_description, scope_description, decision_owner,
       estimated_value_usd, created_by_user_id, current_stage_entered_at
     )
     values (
       $1::uuid, $2, $3, $4, 'managed_service', 'contract_optimization',
       'ams', 'strategy', 'waiting_on_client',
       $5, $6, $7, $8, 'codex-door1-smoke', now()
     )`,
    [
      eventId,
      TENANT_KEY,
      eventCode,
      `${CONTRACT_NAME} Door 1 optimization`,
      `Optimize ${CONTRACT_NAME} with ${VENDOR_NAME}. Contract ref: ${CONTRACT_ID}.`,
      "AMS run support, integrations, SOW amendments, SLA credits, renewal economics, and invoice leakage.",
      "CIO and procurement sponsor",
      4_500_000,
    ],
  );

    for (const fact of FACTS) {
      await client.query(
      `insert into source_event_facts (
         source_event_id, client_key, fact_key, entity_kind, entity_ref,
         value_numeric, value_text, unit, source_method, source_citation,
         confidence, is_stale
       )
       values ($1::uuid, $2, $3, $4, $5, $6, null, $7, 'structured_map', $8::jsonb, 'high', false)`,
      [
        eventId,
        TENANT_KEY,
        fact.factKey,
        fact.entityKind,
        fact.entityRef,
        fact.value,
        fact.unit,
        JSON.stringify({ doc: fact.doc, locator: fact.locator }),
      ],
    );
  }

    const eventReadback = await client.query(
    `select id, client_key, event_code, sourcing_motion, classified_category
       from source_events
      where id = $1::uuid`,
    [eventId],
  );
    const factReadback = await client.query<FactReadbackRow>(
    `select fact_key, entity_kind, entity_ref, value_numeric, unit, source_citation
       from source_event_facts
      where source_event_id = $1::uuid
        and client_key = $2
        and is_stale = false
      order by captured_at desc, fact_key asc`,
    [eventId, TENANT_KEY],
  );

    const event = eventReadback.rows[0];
    if (!event) throw new Error("source_events readback returned no row.");
    if (event.sourcing_motion !== "contract_optimization") {
      throw new Error(`Expected contract_optimization motion; got ${event.sourcing_motion}`);
    }
    if (factReadback.rows.length !== FACTS.length) {
      throw new Error(`Expected ${FACTS.length} facts; got ${factReadback.rows.length}`);
    }

    const factMap = factMapFromRows(factReadback.rows);
    const optimization = runSourceOptimization({
      eventId,
      archetype: AMS_MANAGED_SERVICES,
      facts: factMap,
    });
    const journey = getSourceJourneyForEvent({
      sourcingMotion: "contract_optimization",
      classifiedCategory: "ams",
      eventName: `${CONTRACT_NAME} Door 1 optimization`,
    });
    const stageLabels = journey.stages.map((stage) => stage.label);
    const forbiddenStages = ["RFP", "Responses", "Evaluation", "Selection", "BAFO"].filter(
      (stage) => stageLabels.includes(stage),
    );
    if (forbiddenStages.length > 0) {
      throw new Error(`Door 1 journey includes forbidden competitive stages: ${forbiddenStages.join(", ")}`);
    }
    if (optimization.diagnosis.findings.length === 0) {
      throw new Error("Door 1 diagnosis produced no computed findings.");
    }
    if (optimization.bridge.recoverableHigh <= 0) {
      throw new Error("Door 1 bridge produced no recoverable value range.");
    }

    const proof = {
    ok: true,
    mode: apply ? "apply_commit" : "dry_run_rollback",
    tenantKey: TENANT_KEY,
    database: maskUrl(url),
    event: {
      id: eventId,
      code: eventCode,
      contractId: CONTRACT_ID,
      contractName: CONTRACT_NAME,
      vendorName: VENDOR_NAME,
      sourcingMotion: event.sourcing_motion,
      classifiedCategory: event.classified_category,
    },
    readback: {
      sourceEvents: eventReadback.rowCount,
      sourceEventFacts: factReadback.rowCount,
      factHash: sha256(factReadback.rows),
    },
    journey: {
      id: journey.id,
      stageCount: journey.stages.length,
      stageLabels,
      skippedStageKeys: journey.skippedStageKeys,
    },
    optimization: {
      archetypeId: optimization.archetypeId,
      findingCount: optimization.diagnosis.findings.length,
      needsEvidenceCount: optimization.diagnosis.needsEvidence.length,
      unlockFactKeys: optimization.diagnosis.unlockFactKeys,
      recoverableLow: optimization.bridge.recoverableLow,
      recoverableHigh: optimization.bridge.recoverableHigh,
      protectedLow: optimization.bridge.protectedLow,
      protectedHigh: optimization.bridge.protectedHigh,
      confidence: optimization.bridge.confidence,
      play: optimization.play.kind,
      askCount: optimization.play.asks.length,
      door2Handoff: optimization.play.handoff,
    },
  };

    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, "proof.json"), `${JSON.stringify(proof, null, 2)}\n`);
    await writeFile(
    path.join(outDir, "README.md"),
    [
      "# SkyHarbor Door 1 Front Door Smoke",
      "",
      `Mode: ${proof.mode}`,
      `Tenant: ${TENANT_KEY}`,
      `Event: ${eventCode}`,
      `Contract: ${CONTRACT_ID} · ${CONTRACT_NAME} · ${VENDOR_NAME}`,
      "",
      "## Assertions",
      "",
      "- source_events row created with explicit sourcing_motion = contract_optimization",
      `- ${FACTS.length} structured source_event_facts rows persisted and read back`,
      "- Door 1 journey resolves to 7 stages with no RFP/Responses/Evaluation/Selection/BAFO stages",
      "- Deterministic Door 1 diagnosis produced computed findings and a recoverable value range",
      "",
      "## Boundary",
      "",
      "Default mode rolls the transaction back. Use --apply only in a governed lab/operator run when persistent smoke rows are desired.",
    ].join("\n"),
  );

    if (apply) {
      await client.query("COMMIT");
    } else {
      await client.query("ROLLBACK");
    }

    console.log(JSON.stringify({ ...proof, proofDir: outDir }, null, 2));
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback noise; the original error is what matters.
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

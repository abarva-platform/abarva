#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const DEFAULT_TENANTS = [
  "apex-retail",
  "first-capital",
  "lakeshore-holdings",
  "meridian-health",
  "skyharbor-air",
];

const tenants = (process.env.V4_EMBED_TENANTS ?? DEFAULT_TENANTS.join(","))
  .split(",")
  .map((tenant) => tenant.trim())
  .filter(Boolean);

const batchSize = process.env.EMBEDDING_BATCH_SIZE ?? "100";
const maxBatches = process.env.EMBEDDING_MAX_BATCHES ?? "100";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required.");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: "postgres-only",
      tenants,
      batchSize,
      maxBatches,
      startedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);

for (const tenant of tenants) {
  console.log(`\n=== embedding pending chunks for ${tenant} ===`);
  const result = spawnSync(
    "npm",
    [
      "run",
      "embed:pending-chunks",
      "--",
      "--postgres-only",
      "--tenant",
      tenant,
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        EMBEDDING_BATCH_SIZE: batchSize,
        EMBEDDING_MAX_BATCHES: maxBatches,
      },
    },
  );

  if (result.status !== 0) {
    throw new Error(`Embedding failed for ${tenant} with exit ${result.status}`);
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: "postgres-only",
      tenants,
      completedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);

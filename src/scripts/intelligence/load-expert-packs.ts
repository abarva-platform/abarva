import process from "node:process";

import { Client } from "pg";

import { EXPERT_PACKS } from "@/lib/intelligence/expert-pack/registry";
import {
  EXPERT_PACK_UPSERT_SQL,
  expertPackRowParams,
  toExpertPackStoreRow,
  validateExpertPackForStore,
} from "@/lib/intelligence/expert-pack/store";
import { postgresClientOptions } from "@/scripts/postgres-client-options";

interface Options {
  dryRun: boolean;
  packId: string | null;
  allowInvalid: boolean;
  databaseUrl: string | null;
}

function parseArgs(argv: string[]): Options {
  let dryRun = false;
  let packId: string | null = null;
  let allowInvalid = false;
  let databaseUrl =
    process.env.ABARVA_AZURE_DATABASE_URL ??
    process.env.AZURE_DATABASE_URL ??
    process.env.DATABASE_URL ??
    null;

  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--allow-invalid") allowInvalid = true;
    else if (arg.startsWith("--pack-id="))
      packId = arg.slice("--pack-id=".length);
    else if (arg.startsWith("--database-url="))
      databaseUrl = arg.slice("--database-url=".length);
    else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { dryRun, packId, allowInvalid, databaseUrl };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const selected = options.packId
    ? EXPERT_PACKS.filter((pack) => pack.identity.id === options.packId)
    : EXPERT_PACKS;

  if (selected.length === 0) {
    throw new Error(`No ExpertPack matched --pack-id=${options.packId}`);
  }

  const rows = [];
  const invalid = [];
  for (const pack of selected) {
    const validation = validateExpertPackForStore(pack);
    if (!validation.pass) {
      invalid.push({ pack, validation });
      continue;
    }
    rows.push(toExpertPackStoreRow(pack));
  }

  console.log(
    [
      `expert-packs selected=${selected.length}`,
      `valid=${rows.length}`,
      `invalid=${invalid.length}`,
      `dryRun=${options.dryRun ? "yes" : "no"}`,
    ].join(" "),
  );

  for (const row of rows) {
    console.log(
      [
        "ready",
        row.pack_id,
        `kind=${row.kind}`,
        `industry=${row.industry ?? "-"}`,
        `function=${row.function_key ?? "-"}`,
        `crossCutting=${row.cross_cutting_domain ?? "-"}`,
        `hash=${row.pack_hash.slice(0, 12)}`,
      ].join(" "),
    );
  }

  for (const item of invalid) {
    const { pack, validation } = item;
    console.error(
      `invalid ${pack.identity?.id ?? "(missing id)"} ${validation.gateResult.blockerCount} blocker(s)`,
    );
    for (const finding of validation.gateResult.findings
      .filter((f) => f.severity === "blocker")
      .slice(0, 8)) {
      console.error(`  - ${finding.rule}: ${finding.detail}`);
    }
  }

  if (invalid.length > 0 && !options.allowInvalid) {
    throw new Error(
      "ExpertPack loader rejected one or more packs. Fix the pack or rerun with --allow-invalid for diagnostics only.",
    );
  }

  if (options.dryRun) return;

  if (!options.databaseUrl) {
    throw new Error(
      "Missing ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL. Run inside the private VNet for live loading.",
    );
  }

  const client = new Client(
    postgresClientOptions(options.databaseUrl, "load-expert-packs"),
  );
  await client.connect();
  try {
    await client.query("begin");
    for (const row of rows) {
      await client.query(EXPERT_PACK_UPSERT_SQL, expertPackRowParams(row));
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }

  console.log(`upserted=${rows.length}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

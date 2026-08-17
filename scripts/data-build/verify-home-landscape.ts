#!/usr/bin/env npx tsx
/**
 * Product readback for the landscape projection.
 *
 * The projector already asserts, inside its own transaction, that it wrote what it claims. That
 * proves the write. It does not prove the *product* can read it, and those are different claims:
 * the projector counts by build version and generator, while Home selects the newest pack for a
 * tenant by `artifact_type` and orders dimensions by `sort_order`. A pack written correctly under
 * the wrong artifact type, or dimensions written without a usable sort order, would satisfy the
 * projector's readback and still render an empty surface.
 *
 * So this runs the product's query — not a variant of it — and asserts on what comes back. It is
 * read-only and safe to run at any time.
 *
 * Usage:
 *   npx tsx scripts/data-build/verify-home-landscape.ts [--tenant <key>]...
 *
 * Exit 0 when every tenant in scope returns a pack whose dimensions carry both counts and names.
 * Exit 1 otherwise, naming which tenant and which assertion failed.
 */

import { Client } from "pg";

const TENANT_ARGS: string[] = [];
process.argv.forEach((a, i) => {
  if (a === "--tenant") TENANT_ARGS.push(process.argv[i + 1]);
});
const TENANTS = TENANT_ARGS.length ? TENANT_ARGS : ["meridian-health", "skyharbor-air"];

interface DimensionRow {
  pack_version: string;
  created_at: string | null;
  dimension_key: string;
  display_name: string;
  record_count: number;
  evidence_count: number;
  confidence_status: string;
  metadata: Record<string, unknown> | null;
}

async function main(): Promise<number> {
  const connectionString =
    process.env.ABARVA_AZURE_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("ABARVA_AZURE_DATABASE_URL or DATABASE_URL is required");

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const failures: string[] = [];
  const report: Record<string, unknown> = {};

  try {
    for (const tenantKey of TENANTS) {
      // Byte-for-byte the query in src/lib/home/landscape-read-adapter.ts. Any drift between the
      // two makes this verification worthless, which is why it is duplicated rather than
      // approximated.
      const { rows } = await client.query<DimensionRow>(
        `select p.pack_version,
                p.created_at,
                d.dimension_key,
                d.display_name,
                d.record_count,
                d.evidence_count,
                d.confidence_status,
                d.metadata
           from public.home_knowledge_dimensions d
           join public.home_knowledge_packs p on p.id = d.pack_id
          where d.tenant_key = $1
            and p.artifact_type = 'NexusHomeLandscapeV1'
            and p.id = (
              select id from public.home_knowledge_packs
               where tenant_key = $1 and artifact_type = 'NexusHomeLandscapeV1'
               order by created_at desc
               limit 1
            )
          order by d.sort_order`,
        [tenantKey],
      );

      const withNames = rows.filter((r) => {
        const samples = (r.metadata as { sampleEntities?: unknown })?.sampleEntities;
        return Array.isArray(samples) && samples.length > 0;
      });
      const populated = rows.filter((r) => Number(r.record_count) > 0);

      report[tenantKey] = {
        dimensionsReturned: rows.length,
        buildVersion: rows[0]?.pack_version ?? null,
        generatedAt: rows[0]?.created_at ?? null,
        populatedDimensions: populated.length,
        dimensionsCarryingNames: withNames.length,
        totalRecords: rows.reduce((n, r) => n + Number(r.record_count ?? 0), 0),
        totalEvidence: rows.reduce((n, r) => n + Number(r.evidence_count ?? 0), 0),
        notSupplied: rows.filter((r) => r.confidence_status === "not_available").map((r) => r.dimension_key),
        sample: withNames.slice(0, 4).map((r) => ({
          dimension: r.dimension_key,
          records: Number(r.record_count),
          names: ((r.metadata as { sampleEntities?: string[] }).sampleEntities ?? []).slice(0, 3),
        })),
      };

      if (rows.length === 0) {
        failures.push(`${tenantKey}: the product query returns no rows — the surface would render "not available"`);
        continue;
      }
      // A populated dimension that carries no names is the exact failure a count-only check misses:
      // the surface renders fully and says nothing.
      if (withNames.length < populated.length) {
        failures.push(
          `${tenantKey}: ${populated.length - withNames.length} populated dimensions carry no named samples`,
        );
      }
    }
  } finally {
    await client.end();
  }

  console.log(JSON.stringify({ tenantScope: TENANTS, report, failures }, null, 2));
  if (failures.length > 0) {
    console.error(`verify-home-landscape FAILED:\n  ${failures.join("\n  ")}`);
    return 1;
  }
  console.log("verify-home-landscape PASSED: every tenant returns a readable pack with named samples");
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error("verify-home-landscape failed:", error);
    process.exit(1);
  });

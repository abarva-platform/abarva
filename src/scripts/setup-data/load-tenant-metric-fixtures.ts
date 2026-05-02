import { config as loadEnv } from "dotenv";
import path from "node:path";
import {
  getAllTenantMetricObservations,
  normalizeTenantMetricTenantKey,
  persistTenantMetricObservations,
  summarizeTenantMetricReadiness,
} from "@/lib/intelligence";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv({ path: "/Users/anand/Projects/nexus/.env.local" });
loadEnv();

const args = new Set(process.argv.slice(2));
const dryRun = !args.has("--no-dry-run");
const requestedTenant = [...args]
  .find((arg) => arg.startsWith("--tenant="))
  ?.replace("--tenant=", "");

function groupByTenant() {
  const grouped = new Map<
    string,
    ReturnType<typeof getAllTenantMetricObservations>
  >();
  for (const observation of getAllTenantMetricObservations()) {
    const tenantKey = normalizeTenantMetricTenantKey(observation.tenantKey);
    if (
      requestedTenant &&
      tenantKey !== normalizeTenantMetricTenantKey(requestedTenant)
    )
      continue;
    grouped.set(tenantKey, [...(grouped.get(tenantKey) ?? []), observation]);
  }
  return grouped;
}

async function main() {
  const grouped = groupByTenant();
  if (grouped.size === 0) {
    console.log(
      "No tenant metric fixtures matched the requested tenant filter.",
    );
    return;
  }

  for (const [tenantKey, observations] of grouped) {
    const summary = summarizeTenantMetricReadiness(tenantKey);
    const uploadBatchId = `demo-fixture:${tenantKey}:2026-05-02`;
    console.log(
      JSON.stringify(
        {
          tenantKey,
          uploadBatchId,
          dryRun,
          total: observations.length,
          measured: summary.measured,
          measurementGaps: summary.measurementGaps,
          programIds: summary.programIds,
        },
        null,
        2,
      ),
    );

    if (dryRun) continue;

    const result = await persistTenantMetricObservations({
      tenantKey,
      clientId: tenantKey,
      documentName: "Demo current-state KPI reference metrics",
      fileName: `demo-current-state-kpis-${tenantKey}.yaml`,
      observations,
      rejectedRows: [],
      uploadBatchId,
      uploadedBy: "codex-demo-fixture-loader",
      sourcePayload: {
        ingestionSource: "demo_fixture_loader",
        loadedAt: new Date().toISOString(),
      },
    });

    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

import { config as loadEnv } from "dotenv";
import path from "node:path";
import {
  getSetupAiInitiatives,
  normalizeSetupAiInitiativeTenantKey,
  persistSetupAiInitiatives,
  summarizeSetupAiInitiatives,
} from "@/lib/setup";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv({ path: "/Users/anand/Projects/nexus/.env.local" });
loadEnv();

const args = new Set(process.argv.slice(2));
const dryRun = !args.has("--no-dry-run");
const requestedTenant = [...args]
  .find((arg) => arg.startsWith("--tenant="))
  ?.replace("--tenant=", "");
const tenants = ["apex-retail", "meridian-health", "first-capital"];

async function main() {
  for (const tenant of tenants) {
    const tenantKey = normalizeSetupAiInitiativeTenantKey(tenant);
    if (
      requestedTenant &&
      tenantKey !== normalizeSetupAiInitiativeTenantKey(requestedTenant)
    )
      continue;
    const initiatives = getSetupAiInitiatives(tenantKey);
    const summary = summarizeSetupAiInitiatives(tenantKey, initiatives);
    const uploadBatchId = `demo-fixture:${tenantKey}:setup-ai-initiatives:2026-05-02`;
    console.log(JSON.stringify({ ...summary, uploadBatchId, dryRun }, null, 2));
    if (dryRun) continue;
    const result = await persistSetupAiInitiatives({
      tenantKey,
      clientId: tenantKey,
      documentName: "Demo AI initiatives registry",
      fileName: `demo-setup-ai-initiatives-${tenantKey}.yaml`,
      initiatives,
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

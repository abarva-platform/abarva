import {
  listContextInsightsForTenant,
  runInsightEvaluation,
} from "@/lib/intelligence/insight-engine";
import { getContextReadModelForTenant } from "@/lib/intelligence/context-read-model";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

function readArg(name: string): string | null {
  const prefix = `--${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length).trim() || null;
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1]?.trim() || null;
  return null;
}

async function main() {
  const tenantKey = canonicalTenantKey(
    readArg("tenant") ?? process.env.TENANT_KEY ?? "skyharbor-air",
  );
  const before = await listContextInsightsForTenant(tenantKey);
  const summary = await getContextReadModelForTenant(tenantKey);
  const receipt = await runInsightEvaluation(tenantKey);
  const after = await listContextInsightsForTenant(tenantKey);

  const output = {
    tenantKey,
    beforeInsightCount: before.insights.length,
    afterInsightCount: after.insights.length,
    factsActive: summary.factsActive,
    dimensionsLoaded: summary.dimensionsLoaded,
    evaluation: receipt,
    errors: [
      ...before.errors.map((error) => `before:${error}`),
      ...summary.errors.map((error) => `summary:${error}`),
      ...receipt.errors.map((error) => `evaluation:${error}`),
      ...after.errors.map((error) => `after:${error}`),
    ],
    headlines: after.insights.slice(0, 10).map((insight) => ({
      headline: insight.headline,
      ruleId: insight.ruleId,
      confidence: insight.confidence,
      freshnessStatus: insight.freshnessStatus,
      lifecycleState: insight.lifecycleState,
    })),
  };

  console.log(JSON.stringify(output, null, 2));
  if (output.errors.length > 0) process.exit(1);
  if (output.afterInsightCount === 0) process.exit(2);
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});

// PR-P1 · Read-only promotion eligibility PREVIEW (DB glue).
//
// Reads the governed_object_readiness sidecar (SELECT only — NO writes, NO
// promotion), runs the pure `evaluatePromotion` over every row, aggregates +
// renders via the pure `promotion-preview-render` module. Two modes:
//   --emit json   print chunked JSON markers (for headless/operator-job capture)
//   (default)     write rendered markdown to --out (default the docs path)
import "server-only";
import { Pool } from "pg";
import { writeFileSync } from "node:fs";
import {
  evaluatePromotion,
  type ReadinessRow,
} from "@/lib/governance/promotion-evaluator";
import {
  buildPreviewData,
  renderPreviewMarkdown,
  type PreviewData,
} from "@/lib/governance/promotion-preview-render";

const READINESS_COLUMNS =
  "object_table, object_id, client_key, tenant_id, source_layer, agent_readiness_status, retrievability, classification, source_basis, confidence_level, applicable_agents, cited_render_verified_at, policy_validation_status, provenance";

function emitChunks(d: PreviewData): void {
  console.log("___PROMO_AGG___" + JSON.stringify({ total: d.total, byTenant: d.byTenant, byObjectType: d.byObjectType, byRecommendation: d.byRecommendation, byTenantRecommendation: d.byTenantRecommendation, failureReasons: d.failureReasons, skyharbor: d.skyharbor }));
  console.log("___PROMO_PROMOTE___" + JSON.stringify(d.topPromote));
  console.log("___PROMO_BLOCK___" + JSON.stringify(d.topBlocked));
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const emitJson = argv.includes("--emit") && argv[argv.indexOf("--emit") + 1] === "json";
  const outIdx = argv.indexOf("--out");
  const out = outIdx >= 0 ? argv[outIdx + 1]! : "docs/governance/AGENT_READY_PROMOTION_PREVIEW_2026-05-09.md";
  const generatedAt = process.env.PREVIEW_GENERATED_AT ?? new Date().toISOString();

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  try {
    const res = await pool.query<ReadinessRow>(`SELECT ${READINESS_COLUMNS} FROM public.governed_object_readiness`);
    const evals = res.rows.map((r) => evaluatePromotion({ ...r, applicable_agents: r.applicable_agents ?? [] }));
    const data = buildPreviewData(evals);
    if (emitJson) {
      emitChunks(data);
    } else {
      writeFileSync(out, renderPreviewMarkdown(data, generatedAt));
      console.log(`wrote ${out} (${data.total} rows, no writes to source data)`);
    }
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.log("___PROMO_ERR___" + JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
    process.exit(1);
  });
}

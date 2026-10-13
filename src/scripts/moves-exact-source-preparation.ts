import "server-only";
import { readFileSync,writeFileSync,readdirSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { Pool,type PoolClient } from "pg";
import { ExactSourceCohortSchema,prepareExactSourcePlan,isDeclaredSyntheticSourceTenant } from "@/lib/programs/evidence-readiness/exact-source-preparation";
import { readExactSourceIndexDocuments } from "@/lib/azure-search/tenant-context-retriever";
import { scopedIndexRowDiff } from "./moves-exact-source-index-adapter";
export { applyApprovedExactSourceIndex } from "./moves-exact-source-index-adapter";
import { readExactSourceSnapshot,type ExactSourceQuery } from "@/lib/programs/evidence-readiness/exact-source-reader";
import type { DatasetManifest } from "@/lib/governance/dataset-manifest";

/** Default operator entry produces a read-only plan; it exposes no apply mode. */
export async function prepareMoveSourceReadOnlyPlan(args:{cohortFile:string;cohortFileSha256:string;out:string;root?:string}) {
  const root=args.root??process.cwd();
  const bytes=readFileSync(args.cohortFile);
  if (createHash("sha256").update(bytes).digest("hex")!==args.cohortFileSha256) throw new Error("source_cohort_file_changed");
  const cohort=ExactSourceCohortSchema.parse(JSON.parse(bytes.toString("utf8")));
  const registry=JSON.parse(readFileSync(path.join(root,"datasets/tenant-inputs/tenant-input-registry.json"),"utf8")) as {activeTenants?:Array<{tenantKey?:string}>};
  if (!isDeclaredSyntheticSourceTenant(registry,cohort.clientKey)) throw new Error("source_registry_identity_unavailable");
  const dir=path.join(root,"docs/governance/dataset-manifests");
  const manifests=readdirSync(dir).filter(file=>file.endsWith(".json")).map(file=>JSON.parse(readFileSync(path.join(dir,file),"utf8")) as DatasetManifest).filter(manifest=>manifest.dataset_id===cohort.datasetId);
  if (manifests.length!==1) throw new Error("source_manifest_unbound");
  const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});
  let client:PoolClient|undefined;
  let open=false;
  try {
    client=await pool.connect();
    const connected=client;
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY"); open=true;
    await client.query("SET LOCAL statement_timeout = '30s'");
    const db:ExactSourceQuery={query:async(sql,values)=>({rows:(await connected.query(sql,values)).rows})};
    const snapshot=await readExactSourceSnapshot(db,cohort);
    const plan=prepareExactSourcePlan(cohort,snapshot,manifests[0]);
    const indexRowDiff=scopedIndexRowDiff(plan,await readExactSourceIndexDocuments({ids:plan.documents.map(document=>document.id)}));
    await client.query("ROLLBACK"); open=false;
    writeFileSync(args.out,`${JSON.stringify({checkedAt:new Date().toISOString(),cohortFileSha256:args.cohortFileSha256,readOnly:true,rollbackConfirmed:true,productWrites:0,indexWrites:0,plan,indexRowDiff},null,2)}\n`,{mode:0o600,flag:"wx"});
    return {sources:plan.sources.length,eligible:plan.sources.filter(source=>source.eligible).length,deferred:plan.sources.filter(source=>!source.eligible).length,documents:plan.documents.length,sourceSetHash:plan.sourceSetHash};
  } finally {
    try { if (open && client) await client.query("ROLLBACK"); }
    finally { client?.release(); await pool.end(); }
  }
}

if (process.argv[1]?.endsWith("moves-exact-source-preparation.ts")) {
  const arg=(name:string)=>{const index=process.argv.indexOf(name);if(index<0||!process.argv[index+1])throw new Error(`Required ${name}`);return process.argv[index+1];};
  if (process.argv.includes("--apply") || process.argv.includes("--index")) throw new Error("source_mutation_not_released");
  prepareMoveSourceReadOnlyPlan({cohortFile:arg("--cohort-file"),cohortFileSha256:arg("--cohort-file-sha256"),out:arg("--out")}).then(summary=>process.stdout.write(`${JSON.stringify(summary)}\n`)).catch(error=>{process.stderr.write(`${error instanceof Error?error.message:"source_plan_failed"}\n`);process.exitCode=1;});
}

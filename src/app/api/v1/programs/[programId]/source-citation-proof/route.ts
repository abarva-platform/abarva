import { NextRequest } from "next/server";
import { z } from "zod";
import { requireTenancy,tenancyErrorResponse } from "../../_auth";
import { azureRead } from "@/lib/data-plane/azureRead";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { proveReviewedSourceCitation } from "@/lib/knowledge/context-broker";
import { resolveSourceProofCohort,readExactSourceSnapshot,type ExactSourceQuery } from "@/lib/programs/evidence-readiness/exact-source-reader";
import { prepareExactSourcePlan,renderSourceCitationProof,isDeclaredSyntheticSourceTenant } from "@/lib/programs/evidence-readiness/exact-source-preparation";
import sourceManifest from "@/../docs/governance/dataset-manifests/moves-reviewed-source-preparation-v1.json";
import tenantRegistry from "@/../datasets/tenant-inputs/tenant-input-registry.json";
import type { DatasetManifest } from "@/lib/governance/dataset-manifest";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const input=z.object({programId:z.string().uuid(),evidenceId:z.string().uuid(),revision:z.string().regex(/^[0-9a-f]{64}$/)});
const db:ExactSourceQuery={query:async(sql,values)=>({rows:await azureRead.query(sql,values,{missingTable:"throw"})})};

export async function GET(req:NextRequest,{params}:{params:Promise<{programId:string}>}) {
  try {
    const parsed=input.safeParse({...(await params),evidenceId:req.nextUrl.searchParams.get("evidenceId"),revision:req.nextUrl.searchParams.get("revision")});
    if (!parsed.success) return Response.json({error:"source_proof_input_invalid"},{status:400});
    const ctx=await requireTenancy();
    if (!ctx.clientKey || !ctx.clerkUserId || !z.string().uuid().safeParse(ctx.userId).success) return Response.json({error:"source_proof_identity_unavailable"},{status:403});
    if (!isDeclaredSyntheticSourceTenant(tenantRegistry,canonicalTenantKey(ctx.clientKey)!)) return Response.json({error:"source_proof_tenant_not_released"},{status:403});
    const cohort=await resolveSourceProofCohort(db,{clientId:ctx.clientId,clientKey:canonicalTenantKey(ctx.clientKey)!,nativeTenantKey:ctx.clientKey,moveId:parsed.data.programId,evidenceId:parsed.data.evidenceId,personId:ctx.userId,clerkId:ctx.clerkUserId});
    const plan=prepareExactSourcePlan(cohort,await readExactSourceSnapshot(db,cohort),sourceManifest as DatasetManifest);
    const source=plan.sources[0];
    if (source.admissionSource.binding.source_revision_sha256!==parsed.data.revision) return Response.json({error:"source_proof_revision_changed"},{status:409});
    const proof=await proveReviewedSourceCitation(source);
    const fresh=prepareExactSourcePlan(cohort,await readExactSourceSnapshot(db,cohort),sourceManifest as DatasetManifest);
    if (fresh.sourceSetHash!==plan.sourceSetHash || proof.sourceRevision!==parsed.data.revision) return Response.json({error:"source_proof_revision_changed"},{status:409});
    if (req.headers.get("accept")?.includes("application/json")) return Response.json({proof,sourceSetHash:plan.sourceSetHash,modelReadinessGranted:false},{headers:{"cache-control":"private, no-store"}});
    return new Response(renderSourceCitationProof(source,plan.sourceSetHash),{headers:{"content-type":"text/html; charset=utf-8","cache-control":"private, no-store","content-security-policy":"default-src 'none'; frame-ancestors 'none'; base-uri 'none'","x-content-type-options":"nosniff","x-source-proof-mode":"non-model"}});
  } catch (error) {
    const message=error instanceof Error?error.message:"source_proof_unavailable";
    if (message.startsWith("source_")) return Response.json({error:message},{status:message==="source_future_phase"?403:503,headers:{"cache-control":"private, no-store"}});
    return tenancyErrorResponse(error);
  }
}

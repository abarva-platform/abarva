jest.mock("server-only",()=>({}));
jest.mock("@/lib/auth/tenancy",()=>({requireTenancy:jest.fn(),tenancyErrorResponse:()=>Response.json({error:"unauthenticated"},{status:401})}));
jest.mock("@/lib/data-plane/azureRead",()=>({azureRead:{query:jest.fn()}}));
jest.mock("@/lib/knowledge/context-broker",()=>({proveReviewedSourceCitation:jest.fn()}));
jest.mock("@/lib/programs/evidence-readiness/exact-source-reader",()=>({resolveSourceProofCohort:jest.fn(),readExactSourceSnapshot:jest.fn()}));
jest.mock("@/lib/programs/evidence-readiness/exact-source-preparation",()=>({prepareExactSourcePlan:jest.fn(),renderSourceCitationProof:jest.fn(()=>"<main>Source verification</main>"),isDeclaredSyntheticSourceTenant:jest.fn(()=>true)}));
import { NextRequest } from "next/server";
import { requireTenancy } from "@/lib/auth/tenancy";
import { proveReviewedSourceCitation } from "@/lib/knowledge/context-broker";
import { resolveSourceProofCohort,readExactSourceSnapshot } from "@/lib/programs/evidence-readiness/exact-source-reader";
import { prepareExactSourcePlan,renderSourceCitationProof,isDeclaredSyntheticSourceTenant } from "@/lib/programs/evidence-readiness/exact-source-preparation";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { GET } from "../route";
const id="00000000-0000-4000-8000-000000000001",evidence="00000000-0000-4000-8000-000000000002",revision="a".repeat(64);
const ctx={clientId:id,clientKey:CANONICAL_TENANT_KEYS[0],userId:"00000000-0000-4000-8000-000000000003",clerkUserId:"user_fixture"};
const request=(query=`evidenceId=${evidence}&revision=${revision}`,json=false)=>new NextRequest(`http://localhost/api/v1/programs/${id}/source-citation-proof?${query}`,{headers:json?{accept:"application/json"}:{}});
const params={params:Promise.resolve({programId:id})};
const plan={sourceSetHash:"b".repeat(64),sources:[{eligible:true,admissionSource:{binding:{source_revision_sha256:revision}}}]};
describe("source citation proof route",()=>{
  beforeEach(()=>{
    jest.clearAllMocks();jest.mocked(requireTenancy).mockResolvedValue(ctx);
    jest.mocked(resolveSourceProofCohort).mockResolvedValue({} as never);jest.mocked(readExactSourceSnapshot).mockResolvedValue({} as never);
    jest.mocked(prepareExactSourcePlan).mockReturnValue(plan as never);jest.mocked(proveReviewedSourceCitation).mockResolvedValue({sourceRevision:revision} as never);jest.mocked(isDeclaredSyntheticSourceTenant).mockReturnValue(true);
  });
  it("renders a private non-model proof after authenticated scope and a fresh source comparison",async()=>{
    const response=await GET(request(),params);expect(response.status).toBe(200);expect(response.headers.get("cache-control")).toBe("private, no-store");expect(response.headers.get("x-source-proof-mode")).toBe("non-model");
    expect(resolveSourceProofCohort).toHaveBeenCalledWith(expect.anything(),expect.objectContaining({clientId:ctx.clientId,clientKey:ctx.clientKey,moveId:id,evidenceId:evidence,personId:ctx.userId}));
    expect(readExactSourceSnapshot).toHaveBeenCalledTimes(2);expect(renderSourceCitationProof).toHaveBeenCalledTimes(1);
  });
  it("returns proof metadata without granting readiness",async()=>{
    const response=await GET(request(undefined,true),params);expect((await response.json()).modelReadinessGranted).toBe(false);expect(renderSourceCitationProof).not.toHaveBeenCalled();
  });
  it("refuses invalid inputs before source reads",async()=>{
    expect((await GET(request("evidenceId=wrong"),params)).status).toBe(400);expect(readExactSourceSnapshot).not.toHaveBeenCalled();
  });
  it("refuses unauthenticated and unavailable native identity",async()=>{
    jest.mocked(requireTenancy).mockRejectedValueOnce(new Error("unauthenticated"));expect((await GET(request(),params)).status).toBe(401);
    jest.mocked(requireTenancy).mockResolvedValueOnce({...ctx,userId:"clerk:user_fixture"});expect((await GET(request(),params)).status).toBe(403);expect(readExactSourceSnapshot).not.toHaveBeenCalled();
  });
  it("refuses undeclared tenants and future-phase sources before retrieval",async()=>{
    jest.mocked(isDeclaredSyntheticSourceTenant).mockReturnValueOnce(false);expect((await GET(request(),params)).status).toBe(403);
    jest.mocked(resolveSourceProofCohort).mockRejectedValueOnce(new Error("source_future_phase"));expect((await GET(request(),params)).status).toBe(403);expect(proveReviewedSourceCitation).not.toHaveBeenCalled();
  });
  it("refuses changed revisions before retrieval and drift after retrieval",async()=>{
    jest.mocked(prepareExactSourcePlan).mockReturnValueOnce({...plan,sources:[{admissionSource:{binding:{source_revision_sha256:"c".repeat(64)}}}]} as never);
    expect((await GET(request(),params)).status).toBe(409);expect(proveReviewedSourceCitation).not.toHaveBeenCalled();
    jest.mocked(prepareExactSourcePlan).mockReturnValueOnce(plan as never).mockReturnValueOnce({...plan,sourceSetHash:"c".repeat(64)} as never);
    expect((await GET(request(),params)).status).toBe(409);expect(renderSourceCitationProof).not.toHaveBeenCalled();
  });
  it("reports read failure as unavailable, never as successful absence",async()=>{
    jest.mocked(readExactSourceSnapshot).mockRejectedValueOnce(new Error("source_original_blob_unreadable"));expect((await GET(request(),params)).status).toBe(503);expect(proveReviewedSourceCitation).not.toHaveBeenCalled();
  });
});

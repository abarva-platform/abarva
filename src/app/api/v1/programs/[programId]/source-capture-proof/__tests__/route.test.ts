jest.mock("server-only",()=>({}));
jest.mock("@/lib/auth/tenancy",()=>({requireTenancy:jest.fn(),tenancyErrorResponse:()=>Response.json({error:"unauthenticated"},{status:401})}));
jest.mock("@/lib/data-plane/azureRead",()=>({azureRead:{query:jest.fn()}}));
jest.mock("@/lib/auth/program-access-policy",()=>({loadUserProgramAccessPolicy:jest.fn()}));
jest.mock("@/lib/knowledge/context-broker",()=>({proveReviewedSourceCitation:jest.fn()}));
jest.mock("@/lib/programs/evidence-readiness/phase-capture-preparation",()=>({...jest.requireActual("@/lib/programs/evidence-readiness/phase-capture-preparation"),readPhaseCaptureSnapshot:jest.fn(),preparePhaseCapturePlan:jest.fn()}));
jest.mock("@/lib/programs/evidence-readiness/exact-source-preparation",()=>({isDeclaredSyntheticSourceTenant:jest.fn(()=>true)}));
import {NextRequest} from "next/server";
import {requireTenancy} from "@/lib/auth/tenancy";
import {azureRead} from "@/lib/data-plane/azureRead";
import {loadUserProgramAccessPolicy} from "@/lib/auth/program-access-policy";
import {proveReviewedSourceCitation} from "@/lib/knowledge/context-broker";
import {readPhaseCaptureSnapshot,preparePhaseCapturePlan} from "@/lib/programs/evidence-readiness/phase-capture-preparation";
import {isDeclaredSyntheticSourceTenant} from "@/lib/programs/evidence-readiness/exact-source-preparation";
import {CANONICAL_TENANT_KEYS} from "@/config/tenants/CANONICAL_TENANTS";
import {GET} from "../route";
const id="00000000-0000-4000-8000-000000000001",moduleId="00000000-0000-4000-8000-000000000002",revision="a".repeat(64);
const ctx={clientId:id,clientKey:CANONICAL_TENANT_KEYS[0],userId:"00000000-0000-4000-8000-000000000003",clerkUserId:"user_fixture"};
const request=(suffix="",json=false)=>new NextRequest(`https://app.abarva.ai/api/v1/programs/${id}/source-capture-proof?moduleId=${moduleId}&revision=${revision}${suffix}`,{headers:json?{accept:"application/json"}:{}});
const params={params:Promise.resolve({programId:id})};
const plan={sourceSetHash:"b".repeat(64),sources:[{quote:"<script>untrusted answer</script>",locator:"Saved answer",downloadPath:"/exact-source",originalBytes:'{"value":"saved"}\n',citationDocumentId:"source-id"}]};
describe("saved source citation proof route",()=>{
  beforeEach(()=>{
    jest.clearAllMocks();jest.mocked(requireTenancy).mockResolvedValue(ctx);
    jest.mocked(isDeclaredSyntheticSourceTenant).mockReturnValue(true);
    jest.mocked(loadUserProgramAccessPolicy).mockResolvedValue({canApproveGates:true,canViewFinancialData:true,programIdsAllowed:null} as never);
    jest.mocked(azureRead.query).mockResolvedValue([{current_phase:3,phase_number:3}]);
    jest.mocked(readPhaseCaptureSnapshot).mockResolvedValue({} as never);
    jest.mocked(preparePhaseCapturePlan).mockReturnValue(plan as never);
    jest.mocked(proveReviewedSourceCitation).mockResolvedValue({sourceRevision:revision} as never);
  });
  it("renders escaped private non-model proof after retrieval and a fresh source comparison",async()=>{
    const response=await GET(request(),params),html=await response.text();
    expect(response.status).toBe(200);expect(response.headers.get("cache-control")).toBe("private, no-store");expect(html).toContain("&lt;script&gt;");expect(html).not.toContain("<script>");expect(readPhaseCaptureSnapshot).toHaveBeenCalledTimes(2);
    expect(loadUserProgramAccessPolicy).toHaveBeenCalledWith(ctx,{programId:id});
  });
  it("downloads the exact saved snapshot without granting retrieval or readiness",async()=>{
    const response=await GET(request("&download=1"),params);expect(response.status).toBe(200);expect(await response.text()).toBe(plan.sources[0].originalBytes);expect(proveReviewedSourceCitation).not.toHaveBeenCalled();
  });
  it.each(["gate","finance","scope","tenant"])("refuses missing %s access before source reads",async kind=>{
    if(kind==="tenant")jest.mocked(isDeclaredSyntheticSourceTenant).mockReturnValue(false);
    else jest.mocked(loadUserProgramAccessPolicy).mockResolvedValue({canApproveGates:kind!=="gate",canViewFinancialData:kind!=="finance",programIdsAllowed:kind==="scope"?[]:null} as never);
    expect((await GET(request(),params)).status).toBe(403);expect(readPhaseCaptureSnapshot).not.toHaveBeenCalled();
  });
  it("refuses absent native source and index failures",async()=>{
    jest.mocked(azureRead.query).mockResolvedValueOnce([]);expect((await GET(request(),params)).status).toBe(404);
    jest.mocked(proveReviewedSourceCitation).mockRejectedValueOnce(new Error("source_index_unavailable"));expect((await GET(request(),params)).status).toBe(503);
  });
  it("refuses source drift and returns JSON proof without readiness",async()=>{
    jest.mocked(preparePhaseCapturePlan).mockReturnValueOnce(plan as never).mockReturnValueOnce({...plan,sourceSetHash:"c".repeat(64)} as never);expect((await GET(request(),params)).status).toBe(409);
    const response=await GET(request("",true),params);expect((await response.json()).modelReadinessGranted).toBe(false);
  });
});

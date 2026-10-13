jest.mock("server-only",()=>({}));
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { readExactSourceIndexDocuments,queryTenantContext } from "@/lib/azure-search/tenant-context-retriever";
import { proveReviewedSourceCitation } from "../source-citation-proof";
import type { PreparedSource } from "@/lib/programs/evidence-readiness/exact-source-preparation";

const tenant=CANONICAL_TENANT_KEYS[0];
const document={"@search.action":"upload" as const,id:"fixture_id",tenant_key:tenant,client_id:"client",record_id:"move:evidence:P0",chunk_id:"move-source:fixture",source_segment:"move_reviewed_source",body:"Exact source quote.",title:"Source",source_uri:"/original",lifecycle_state:"active"};
const source={eligible:true,documents:[document],citationDocumentId:document.id,quote:document.body,locator:"Page 1",downloadPath:"/original",expected:{evidenceId:"evidence",artifactId:"artifact",reviewId:"review",artifactVersion:1,phase:0,filename:"source.txt",sourceSha256:"a".repeat(64),reviewUpdatedAt:"2026-10-12T00:00:00Z",ledgerExtractionSha256:"b".repeat(64)},admissionSource:{objectTable:"program_evidence_items",objectId:"evidence",clientKey:tenant,tenantId:"client",sourceLayer:"uploaded_evidence",sourceFile:"/original",changedAt:"2026-10-12T00:00:00Z",citations:["Page 1"],binding:{version:1,move_id:"move",phase:0,source_revision_sha256:"a".repeat(64)}}} satisfies PreparedSource;
const response=(value:unknown)=>({ok:true,status:200,json:async()=>({value})}) as Response;

describe("non-model source citation proof",()=>{
  beforeEach(()=>{process.env.AZURE_SEARCH_ADMIN_KEY="fixture-key";});
  afterEach(()=>{delete process.env.AZURE_SEARCH_ADMIN_KEY;});
  it("returns proof only after exact scoped membership and content verification",async()=>{
    const read=jest.fn(async()=>[document]);const proof=await proveReviewedSourceCitation(source,read);
    expect(read).toHaveBeenCalledWith({ids:[document.id],scope:{clientKey:tenant,clientId:"client",recordId:document.record_id}});
    expect(proof).toMatchObject({mode:"non-model",quote:document.body,downloadPath:"/original"});expect("agentReadiness" in proof).toBe(false);
  });
  it.each(["future","quote","tenant","body","missing"])("refuses %s proof",async(kind)=>{
    const read=jest.fn(async()=>kind==="missing"?[]:[{...document,...(kind==="tenant"?{client_id:"other"}:{}),...(kind==="body"?{body:"changed"}:{})}]);
    await expect(proveReviewedSourceCitation({...source,...(kind==="future"?{eligible:false}:{}),...(kind==="quote"?{quote:"changed"}:{})},read)).rejects.toThrow();
    if(kind==="future"||kind==="quote")expect(read).not.toHaveBeenCalled();
  });
  it("uses exact document IDs and all declared scope fields without degrading schema errors",async()=>{
    const fetchImpl=jest.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{void input;void init;return response([document]);});
    await readExactSourceIndexDocuments({ids:[document.id],scope:{clientKey:tenant,clientId:"client",recordId:document.record_id},fetchImpl});
    const init=fetchImpl.mock.calls[0][1] as RequestInit;const body=JSON.parse(String(init.body));
    for(const clause of ["search.in(id",`tenant_key eq '${tenant}'`,"client_id eq 'client'","record_id eq 'move:evidence:P0'","lifecycle_state eq 'active'"])expect(body.filter).toContain(clause);
    const fail=jest.fn(async()=>({ok:false,status:400}) as Response);await expect(readExactSourceIndexDocuments({ids:[document.id],fetchImpl:fail})).rejects.toThrow("source_index_read_failed:400");expect(fail).toHaveBeenCalledTimes(1);
  });
  it("refuses incomplete or paginated membership reads",async()=>{
    await expect(readExactSourceIndexDocuments({ids:[document.id],fetchImpl:jest.fn(async()=>({ok:true,json:async()=>({value:[],"@odata.nextLink":"next"})}) as Response)})).rejects.toThrow("source_index_read_incomplete");
    await expect(readExactSourceIndexDocuments({ids:[],fetchImpl:jest.fn()})).rejects.toThrow("source_index_ids_invalid");
  });
  it("keeps preparation documents out of normal agent retrieval even if the provider returns them",async()=>{
    const fetchImpl=jest.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{void input;void init;return response([document]);});
    expect(await queryTenantContext({tenantClientKey:tenant,query:"hello",fetchImpl})).toEqual([]);
    expect(JSON.parse(String((fetchImpl.mock.calls[0][1] as RequestInit).body)).filter).toContain("source_segment ne 'move_reviewed_source'");
  });
});

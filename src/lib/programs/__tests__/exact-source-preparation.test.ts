jest.mock("server-only",()=>({}));
import { createHash } from "node:crypto";
import { mkdtempSync,writeFileSync,rmSync,existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import manifestJson from "@/../docs/governance/dataset-manifests/moves-reviewed-source-preparation-v1.json";
import type { DatasetManifest } from "@/lib/governance/dataset-manifest";
import { prepareExactSourcePlan,reviewedLedgerDigest,losslessReviewTimestamp,renderSourceCitationProof,verifyExactIndexedDocuments,isDeclaredSyntheticSourceTenant,type ExactSourceCohort,type ExactSourceSnapshot } from "../evidence-readiness/exact-source-preparation";
import { readExactSourceSnapshot } from "../evidence-readiness/exact-source-reader";
import { applyApprovedExactSourceIndex,scopedIndexRowDiff } from "@/scripts/moves-exact-source-index-adapter";

const uuid=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
const clientKey=CANONICAL_TENANT_KEYS[0];
const manifest=manifestJson as DatasetManifest;
const time="2026-10-12 10:00:00.123456+00";
function fixture() {
  const cohort:ExactSourceCohort={version:1,datasetId:"moves_reviewed_source_preparation_v1",clientKey,nativeTenantKey:clientKey,clientId:uuid(1),moveId:uuid(2),expectedCurrentPhase:1,operatorPersonId:uuid(3),operatorClerkId:"user_fixture",expectedReadiness:"absent",sources:[]};
  const snapshot:ExactSourceSnapshot={move:{id:cohort.moveId,client_id:cohort.clientId,current_phase:1,deleted_at:null,archived_at:null},person:{id:cohort.operatorPersonId,graph_node_id:"clerk:user_fixture"},rows:[],history:[],readiness:[],readComplete:true};
  const bytes:Buffer[]=[];
  for(let i=0;i<8;i++) {
    const phase=i<3?0:2;const quote=`Approved café source passage ${i}.`;
    const original=Buffer.from(quote);bytes.push(original);const hash=createHash("sha256").update(original).digest("hex");
    const reviewed={version:1,summary:"Reviewed synthetic summary.",structured:{decisions:[],risks:[],baselineCandidates:[],actionItems:[],observations:[],assumptions:[],openQuestions:[],citations:[{quote,locator:"Page 1"}]}};
    const expected={evidenceId:uuid(100+i),artifactId:uuid(200+i),reviewId:uuid(300+i),artifactVersion:1,phase,filename:`source-${i}.txt`,sourceSha256:hash,reviewUpdatedAt:time,ledgerExtractionSha256:reviewedLedgerDigest(reviewed)};
    cohort.sources.push(expected);
    snapshot.rows.push({evidence:{id:expected.evidenceId,tenant_key:clientKey,program_id:cohort.moveId,attachment_id:null,phase,evidence_type:"document",title:"Source",summary:"Summary",extracted_text:quote,extracted_structured:{},confidence:0.7,created_at:time},review:{id:expected.reviewId,tenant_key:clientKey,program_id:cohort.moveId,evidence_id:expected.evidenceId,family_key:"fixture",phase,decision:"approved",reviewed_by_user_id:cohort.operatorPersonId,reviewed_at:time,updated_at:time,source_ref:{move_artifact_id:expected.artifactId,reviewed_extraction:reviewed}},artifact:{artifact_id:expected.artifactId,tenant_id:cohort.clientId,tenant_key:clientKey,move_id:cohort.moveId,phase,version:1,blob_sha256:hash,blob_path:`fixtures/${i}`,lifecycle_state:"current",metadata:{sha256:hash,storage:"azure_blob"},updated_at:time,file_name:expected.filename},reviewUpdatedAtDbText:time,originalBlobSha256:hash});
    snapshot.history.push({artifact_id:expected.artifactId,tenant_id:cohort.clientId,move_id:cohort.moveId,file_name:expected.filename,version:1,lifecycle_state:"current",supersedes_artifact_id:null,superseded_by_artifact_id:null});
  }
  return {cohort,snapshot,bytes};
}

describe("exact source preparation",()=>{
  it("starts the real operator entry and refuses a changed input before data access",()=>{
    const dir=mkdtempSync(path.join(tmpdir(),"source-entry-refusal-"));
    try {
      const file=path.join(dir,"cohort.json"),out=path.join(dir,"plan.json");writeFileSync(file,"{}\n");
      const root=path.resolve(__dirname,"../../../..");
      const result=spawnSync(process.platform==="win32"?"npm.cmd":"npm",["run","ops:moves-source-plan","--","--cohort-file",file,"--cohort-file-sha256","0".repeat(64),"--out",out],{cwd:root,encoding:"utf8",timeout:15000,env:{...process.env,PATH:`${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH??""}`}});
      expect(result.error).toBeUndefined();expect(result.status).toBe(1);expect(result.stderr.trim()).toBe("source_cohort_file_changed");expect(existsSync(out)).toBe(false);
    } finally {rmSync(dir,{recursive:true,force:true});}
  });
  it("plans three current sources and defers five future sources without earning readiness",()=>{
    const {cohort,snapshot}=fixture();const plan=prepareExactSourcePlan(cohort,snapshot,manifest);
    expect(plan.sources.filter(source=>source.eligible)).toHaveLength(3);
    expect(plan.sources.filter(source=>!source.eligible)).toHaveLength(5);
    expect(plan.documents.every(doc=>doc.agent_readiness_status==="not_reviewed" && doc.confidence_level==="unverified")).toBe(true);
    expect(plan.documents.every(doc=>plan.sources.filter(source=>source.eligible).some(source=>source.documents.some(owned=>owned.id===doc.id)))).toBe(true);
    expect(plan.readinessWrites).toEqual([]);expect(plan.modelCalls).toBe(0);expect(plan.phaseWrites).toBe(0);
    expect(plan.rollback.ownedIndexIds).toEqual([]);
    expect(prepareExactSourcePlan(cohort,snapshot,manifest).sourceSetHash).toBe(plan.sourceSetHash);
  });
  it("matches independently generated Python ASCII encoding and keeps microseconds",()=>{
    expect(reviewedLedgerDigest({version:1,summary:"Café 🧭 \x7f",structured:{quote:"line\nquoted"}})).toBe("2548936be6826ba9da1da380324ec302fd57d179d39f44134f705fce20e050bc");
    expect(losslessReviewTimestamp(time)).toBe("2026-10-12T10:00:00.123456Z");
    expect(losslessReviewTimestamp("2026-10-12T05:00:00.123456-05:00")).toBe(losslessReviewTimestamp(time));
    expect(()=>reviewedLedgerDigest({version:1,value:1.2})).toThrow("ledger_numeric_encoding_unestablished");
  });
  it.each(["client","move-owner","move-phase","move","phase","review","timestamp","ledger","blob","version","history","actor","missing","readiness","quote","sensitive"])("refuses changed or unbound %s",kind=>{
    const {cohort,snapshot}=fixture();const row=snapshot.rows[0];
    if(kind==="client")row.artifact.tenant_id=uuid(999);
    if(kind==="move-owner")snapshot.move.client_id=uuid(999);
    if(kind==="move-phase")snapshot.move.current_phase=2;
    if(kind==="ledger")cohort.sources[0].ledgerExtractionSha256="f".repeat(64);
    if(kind==="move")row.evidence.program_id=uuid(999);
    if(kind==="phase")row.evidence.phase=2;
    if(kind==="review")row.review.decision="pending";
    if(kind==="timestamp")row.reviewUpdatedAtDbText="2026-10-12 10:00:00.123457+00";
    if(kind==="blob")row.originalBlobSha256="f".repeat(64);
    if(kind==="version")row.artifact.version=2;
    if(kind==="history")snapshot.history.push({...snapshot.history[0],artifact_id:uuid(999)});
    if(kind==="actor")snapshot.person.graph_node_id="clerk:user_other";
    if(kind==="missing")delete row.evidence.extracted_structured;
    if(kind==="readiness")snapshot.readiness.push({object_id:cohort.sources[0].evidenceId});
    if(kind==="quote")row.evidence.extracted_text="Unrelated original text";
    if(kind==="sensitive")row.artifact.metadata={sha256:cohort.sources[0].sourceSha256,storage:"azure_blob",classification:"phi"};
    expect(()=>prepareExactSourcePlan(cohort,snapshot,manifest)).toThrow();
  });
  it("requires declared synthetic registry classification",()=>{
    const registry={activeTenants:CANONICAL_TENANT_KEYS.map(tenantKey=>({tenantKey,packets:[{classification:"synthetic-demo",status:"active-input"}]}))};
    expect(isDeclaredSyntheticSourceTenant(registry,clientKey)).toBe(true);
    expect(isDeclaredSyntheticSourceTenant({activeTenants:[{tenantKey:clientKey,packets:[{classification:"client-private",status:"active-input"}]}]},clientKey)).toBe(false);
  });
  it("verifies actual indexed membership/content and rejects duplicates, missing fields and wrong tenants",()=>{
    const f=fixture();const plan=prepareExactSourcePlan(f.cohort,f.snapshot,manifest);const actual=plan.documents.map(document=>Object.fromEntries(Object.entries(document).filter(([key])=>key!=="@search.action")));
    expect(()=>verifyExactIndexedDocuments(plan.documents,actual)).not.toThrow();
    for(const mutated of [actual.slice(1),[...actual,actual[0]],actual.map((doc,i)=>i===0?{...doc,client_id:uuid(999)}:doc),actual.map((doc,i)=>i===0?{...doc,body:"changed"}:doc)])expect(()=>verifyExactIndexedDocuments(plan.documents,mutated)).toThrow();
    const missing=structuredClone(actual);delete missing[0].body;expect(()=>verifyExactIndexedDocuments(plan.documents,missing)).toThrow();
  });
  it("accepts Azure timestamp spelling for the same instant and rejects real drift",()=>{
    const f=fixture();const plan=prepareExactSourcePlan(f.cohort,f.snapshot,manifest);
    const actual=plan.documents.map(document=>({...document,last_seen_at:"2026-10-12T10:00:00.1230000Z"}));
    expect(()=>verifyExactIndexedDocuments(plan.documents,actual)).not.toThrow();
    expect(()=>verifyExactIndexedDocuments(plan.documents,actual.map(document=>({...document,last_seen_at:"2026-10-12T05:00:00.1230000-05:00"})))).not.toThrow();
    for(const last_seen_at of ["2026-10-12T10:00:00.1230001Z","2026-10-12T10:00:00.1240000Z","2026-02-30T10:00:00.123Z","invalid",null])expect(()=>verifyExactIndexedDocuments(plan.documents,actual.map(document=>({...document,last_seen_at})))).toThrow("source_index_content_or_scope_changed");
    expect(()=>verifyExactIndexedDocuments(plan.documents,actual.map(document=>({...document,body:"changed"})))).toThrow("source_index_content_or_scope_changed");
  });
  it("renders a literal escaped citation and exact original-file link, never future evidence",()=>{
    const f=fixture();const plan=prepareExactSourcePlan(f.cohort,f.snapshot,manifest);const source=plan.sources[0];
    const html=renderSourceCitationProof({...source,quote:"<script>alert(1)</script>"},plan.sourceSetHash);
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");expect(html).not.toContain("<script>");expect(html).toContain(source.downloadPath.replace(/&/g,"&amp;"));
    expect(()=>renderSourceCitationProof(plan.sources[3],plan.sourceSetHash)).toThrow("source_future_phase");
    expect(()=>renderSourceCitationProof({...source,downloadPath:"https://other.example/file"},plan.sourceSetHash)).toThrow("source_link_unbound");
  });
  it("describes prospective missing documents, preserves existing matches and refuses collision content",()=>{
    const f=fixture();const plan=prepareExactSourcePlan(f.cohort,f.snapshot,manifest);
    expect(scopedIndexRowDiff(plan,[]).proposedMissingDocuments).toEqual(plan.documents);
    expect(scopedIndexRowDiff(plan,plan.documents).proposedMissingDocuments).toEqual([]);
    expect(()=>scopedIndexRowDiff(plan,[{...plan.documents[0],client_id:uuid(999)}])).toThrow();
    expect(scopedIndexRowDiff(plan,[]).readinessWrites).toEqual([]);
    expect(scopedIndexRowDiff(plan,[]).rollback.ownedIds).toEqual([]);
    expect(scopedIndexRowDiff(plan,[]).creationGuaranteed).toBe(false);
  });
  it("refuses index execution before any source read or upload when load approval is absent",async()=>{
    const f=fixture();const plan=prepareExactSourcePlan(f.cohort,f.snapshot,manifest);const replan=jest.fn(),readBefore=jest.fn(),upload=jest.fn();
    await expect(applyApprovedExactSourceIndex({plan,manifest,releaseRecord:"docs/releases/records/2026-10-12-moves-exact-source-preparation.md",replan,readBefore,upload})).rejects.toThrow("source_index_load_not_approved");
    expect(replan).not.toHaveBeenCalled();expect(readBefore).not.toHaveBeenCalled();expect(upload).not.toHaveBeenCalled();
  });
  it("refuses even approved index execution before an upload can replace a raced row",async()=>{
    const f=fixture();const plan=prepareExactSourcePlan(f.cohort,f.snapshot,manifest);const record="docs/releases/records/2026-10-12-moves-exact-source-preparation.md";
    const approved={...manifest,expected_object_count:3,load_approval:{approved_by:"Taylor Morgan",approved_at:"2026-10-12",assessment_id:f.cohort.moveId,move_id:f.cohort.moveId,source_set_hash:plan.sourceSetHash,release_record:record}} satisfies DatasetManifest;
    const upload=jest.fn(async(docs:typeof plan.documents)=>({value:docs.map(doc=>({key:doc.id,status:true,statusCode:200}))}));
    const replan=jest.fn(async()=>plan),readBefore=jest.fn(async()=>[]);
    await expect(applyApprovedExactSourceIndex({plan,manifest:approved,releaseRecord:record,replan,readBefore,upload})).rejects.toThrow("source_index_write_capability_unreleased");
    expect(replan).not.toHaveBeenCalled();expect(readBefore).not.toHaveBeenCalled();expect(upload).not.toHaveBeenCalled();expect(plan.rollback.ownedIndexIds).toEqual([]);
  });
  it("reads an exact scoped snapshot and hashes original bytes, propagating failed reads",async()=>{
    const f=fixture();const responses=[{rows:[f.snapshot.move]},{rows:[f.snapshot.person]},{rows:f.snapshot.rows.map(row=>({evidence:row.evidence,review:row.review,artifact:row.artifact,review_updated_at_db_text:row.reviewUpdatedAtDbText}))},{rows:f.snapshot.history},{rows:[]}];
    const query=jest.fn(async()=>responses.shift()!);const download=jest.fn(async(_ctx:unknown,artifactId:string)=>({ok:true as const,file:{bytes:f.bytes[f.cohort.sources.findIndex(source=>source.artifactId===artifactId)],fileName:"source.txt",fileFormat:"txt"}}));
    expect((await readExactSourceSnapshot({query},f.cohort,download)).rows).toHaveLength(8);
    expect(query.mock.calls).toHaveLength(5);expect(download).toHaveBeenCalledTimes(8);
    await expect(readExactSourceSnapshot({query:jest.fn().mockRejectedValue(new Error("read_failed"))},f.cohort,download)).rejects.toThrow("read_failed");
  });
});

jest.mock("server-only", () => ({}));
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import manifestJson from "@/../docs/governance/dataset-manifests/moves-phase-capture-preparation-v1.json";
import type { DatasetManifest } from "@/lib/governance/dataset-manifest";
import { moveSourceRevision } from "../move-agent-admission";
import { CAPTURE_DATASET_ID, preparePhaseCapturePlan, readPhaseCaptureSnapshot, type PhaseCaptureCohort } from "../evidence-readiness/phase-capture-preparation";
import { buildExactSourceReadinessRows } from "../evidence-readiness/exact-source-readiness";
import type { NativeSourceRow } from "../evidence-readiness/exact-source-preparation";
const uuid=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
const manifest=manifestJson as DatasetManifest;
const time="2026-10-17T10:00:00.000Z";
function fixture() {
  const row:NativeSourceRow={id:uuid(1),module_key:"phase_3_design",module_name:"Design",phase_number:3,module_order:1,status:"completed",state_jsonb:{value:"Synthetic design answer; production baseline unverified.",label:"Design"},started_at:time,completed_at:time,created_at:time,engagement_id:uuid(2)};
  const cohort:PhaseCaptureCohort={version:1,datasetId:CAPTURE_DATASET_ID,clientKey:CANONICAL_TENANT_KEYS[0],nativeTenantKey:CANONICAL_TENANT_KEYS[0],clientId:uuid(3),moveId:uuid(2),expectedCurrentPhase:3,operatorPersonId:uuid(4),operatorClerkId:"user_fixture",sources:[{moduleId:uuid(1),phase:3,sourceRevision:moveSourceRevision(row)}]};
  const snapshot={move:{id:cohort.moveId,client_id:cohort.clientId,current_phase:3},rows:[row],readiness:[] as NativeSourceRow[],actorVerified:true as const};
  return {cohort,snapshot};
}
describe("saved phase source preparation",()=>{
  it("binds the same selected native revision used by the evidence consumer",()=>{
    const f=fixture(),plan=preparePhaseCapturePlan(f.cohort,f.snapshot,manifest);
    expect(plan.sources[0].admissionSource.binding.source_revision_sha256).toBe(moveSourceRevision(f.snapshot.rows[0]));
    const dates=structuredClone(f.snapshot);dates.rows[0].created_at=new Date(time);
    expect(preparePhaseCapturePlan(f.cohort,dates,manifest).sourceSetHash).toBe(plan.sourceSetHash);
    expect(plan.documents.every(d=>d.agent_readiness_status==="not_reviewed"&&d.confidence_level==="unverified")).toBe(true);
    expect(JSON.parse(plan.sources[0].originalBytes)).toEqual(f.snapshot.rows[0]);
  });
  it.each(["value","phase","move","status","missing","duplicate","actor","readiness","manifest"])("refuses changed %s",kind=>{
    const f=fixture();let m=manifest;
    if(kind==="value")f.snapshot.rows[0].state_jsonb={value:"changed"};
    if(kind==="phase")f.cohort.sources[0].phase=4;
    if(kind==="move")f.snapshot.rows[0].engagement_id=uuid(9);
    if(kind==="status")f.snapshot.rows[0].status="pending";
    if(kind==="missing")delete f.snapshot.rows[0].completed_at;
    if(kind==="duplicate")f.cohort.sources.push(f.cohort.sources[0]);
    if(kind==="actor")Object.assign(f.snapshot,{actorVerified:false});
    if(kind==="readiness")f.snapshot.readiness.push({object_id:uuid(1)});
    if(kind==="manifest")m={...manifest,retrieval_proof_required:false};
    expect(()=>preparePhaseCapturePlan(f.cohort,f.snapshot,m)).toThrow();
  });
  it("builds canonical readiness only with exact indexed, rendered and downloaded capture proof",()=>{
    const f=fixture(),plan=preparePhaseCapturePlan(f.cohort,f.snapshot,manifest),s=plan.sources[0];
    const receipt={objectId:s.admissionSource.objectId,sourceRevision:s.admissionSource.binding.source_revision_sha256,indexDocumentId:s.citationDocumentId,proofUrl:`https://app.abarva.ai${s.proofPath}`,renderedQuote:s.quote,renderedLocator:s.locator,downloadPath:s.downloadPath,downloadSha256:s.expected.sourceSha256,downloadStatus:200,observedAt:"2026-10-17T12:00:00.000Z",rendered:true,screenshotSha256:"a".repeat(64)};
    const args={plan,manifest,receipts:[receipt],indexed:plan.documents,indexedAt:"2026-10-17T11:00:00.000Z",now:"2026-10-17T13:00:00.000Z",runId:"fixture",proofUri:"https://fixture.blob.core.windows.net/proof/receipt.json",proofSha256:"b".repeat(64)};
    const rows=buildExactSourceReadinessRows(args);
    expect(rows[0]).toMatchObject({object_table:"program_modules",source_layer:"move",confidence_level:"unverified",agent_readiness_status:"agent_ready"});
    f.snapshot.readiness=rows;
    expect(()=>preparePhaseCapturePlan(f.cohort,f.snapshot,manifest,true)).not.toThrow();
    expect(()=>buildExactSourceReadinessRows({...args,receipts:[{...receipt,downloadSha256:"c".repeat(64)}]})).toThrow();
    expect(()=>buildExactSourceReadinessRows({...args,indexed:[]})).toThrow();
    f.snapshot.readiness[0].provenance={move_source_binding:{...s.admissionSource.binding,phase:2}};
    expect(()=>preparePhaseCapturePlan(f.cohort,f.snapshot,manifest,true)).toThrow();
  });
  it("rejects a native tenant mismatch before reading any source",async()=>{
    const f=fixture();const db={query:jest.fn().mockResolvedValue({rows:[{...f.snapshot.move,deleted_at:null,archived_at:null,tenant_key:"unbound",slug:f.cohort.clientKey}]})};
    await expect(readPhaseCaptureSnapshot(db,f.cohort,async()=>true)).rejects.toThrow("source_capture_move_changed");expect(db.query).toHaveBeenCalledTimes(1);
  });
});

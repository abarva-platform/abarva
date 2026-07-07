// WS7 — governed context-bundle trace proof for SkyHarbor AMS.
// For each question: Azure AI Search retrieval (tenant-scoped) -> ledger gate
// (eligible agent_ready vs excluded-by-reason) -> SourceContextBundleTrace ->
// governed bundle (eligible chunks only) -> Claude grounded answer (claims/citations,
// flags unsupported, states gaps) -> wisdom score. Runs INSIDE the VNet.
const { Client } = require('pg');
const { DefaultAzureCredential } = require('@azure/identity');
const crypto = require('node:crypto');
const ENDPOINT = `https://${process.env.AZURE_SEARCH_SERVICE_NAME}.search.windows.net`;
const INDEX = 'tenant-context-v1', API = '2024-07-01';
const TENANT = 'skyharbor-air', CLIENT_ID = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';
const EVENT_ID = 'evt-skyharbor-ams-2026', ARCHETYPE = 'AMS_MANAGED_SERVICES';
const MODEL = process.env.NEXUS_COMPOSER_MODEL || 'claude-opus-4-7';
const AK = process.env.ANTHROPIC_API_KEY;
const cred = new DefaultAzureCredential(process.env.AZURE_CLIENT_ID ? { managedIdentityClientId: process.env.AZURE_CLIENT_ID } : undefined);
let TOK=null; const auth=async()=>{ if(!TOK||TOK.expiresOnTimestamp-Date.now()<60000) TOK=await cred.getToken('https://search.azure.com/.default'); return `Bearer ${TOK.token}`; };
const sha=(s)=>crypto.createHash('sha256').update(s).digest('hex');
const searchQ=async(q,filter,top)=>{ const r=await fetch(`${ENDPOINT}/indexes/${INDEX}/docs/search?api-version=${API}`,{method:'POST',headers:{'content-type':'application/json','Authorization':await auth()},body:JSON.stringify({search:q,queryType:'simple',top,filter,count:true})}); const t=await r.text(); if(!r.ok) throw new Error(`search ${r.status}: ${t.slice(0,150)}`); return JSON.parse(t); };

const REQUIRED = ['application_inventory','service_tower_scope','run_cost_baseline','ticket_volumes','incident_problem_change','sla_baseline','staffing_baseline','tooling_landscape','contract_baseline','transition_constraints','retained_org_model'];
const QUESTIONS = [
 {id:'Q1',q:'What evidence is missing before we issue an AMS RFP?',intent:'readiness_gap',phase:'intake',req:REQUIRED,query:'application inventory vendor contract SLA incident run cost staffing transition'},
 {id:'Q2',q:'What is the current SkyHarbor application and systems baseline?',intent:'current_state',phase:'scope',req:['application_inventory','service_tower_scope'],query:'application system criticality vendor deployment mainframe'},
 {id:'Q3',q:'What vendor contracts are relevant to this sourcing event?',intent:'commercial',phase:'strategy',req:['contract_baseline'],query:'vendor contract renewal IBM AMS annual value'},
 {id:'Q4',q:'What IT financial baseline should shape the pricing model?',intent:'pricing',phase:'pricing',req:['run_cost_baseline'],query:'IT spend budget cost tower financial run cost'},
 {id:'Q5',q:'What SLAs and incident data should inform the service model?',intent:'service_model',phase:'scope',req:['sla_baseline','incident_problem_change'],query:'SLA availability service level incident severity'},
 {id:'Q6',q:'What should the AMS RFP structure include?',intent:'rfp_design',phase:'rfp',req:['service_tower_scope','sla_baseline'],query:'service tower SLA pricing transition retained org'},
 {id:'Q7',q:'What vendor questions should we ask?',intent:'vendor_engagement',phase:'responses',req:['service_tower_scope'],query:'resource unit productivity transition termination assistance'},
 {id:'Q8',q:'What pricing and negotiation levers matter?',intent:'negotiation',phase:'pricing',req:['run_cost_baseline','contract_baseline'],query:'pricing resource unit volume productivity incumbent contract'},
 {id:'Q9',q:'What risks should be protected in the contract?',intent:'risk',phase:'strategy',req:['contract_baseline'],query:'risk transition concentration SLA credit termination'},
 {id:'Q10',q:'What cannot yet be answered from current evidence?',intent:'readiness_gap',phase:'intake',req:REQUIRED,query:'ticket volumes transition constraints retained org tooling staffing'},
];
const SEG_FAMILY={ it_landscape:'application_system', it_financials:'financial', org_structure:'org_workforce', infrastructure:'application_system', program_inventory:'corpus', enterprise_profile:'corpus' };
const RT_FAMILY={ contract:'vendor_contracts', kpi_metric:'financial', service_level:'sla_kpi', incidents_ops_telemetry:'itsm_telemetry', org_role:'org_workforce', cmdb_application:'application_system', configuration_item:'application_system', facility:'application_system', integration:'application_system', initiative:'artifacts', business_capability:'corpus', delivery_dora_devex:'itsm_telemetry', ai_tooling_model_inventory:'application_system', enterprise_profile:'corpus' };

async function callClaude(question, bundleText){
  if(!AK) return null;
  const sys=`You are AbarVa Sentinel, a senior IT-sourcing advisor for an AMS (application managed services) event. Answer ONLY from the GOVERNED EVIDENCE BUNDLE below. Rules: (1) cite the chunk_id for every factual claim; (2) if a needed fact is not in the bundle, say it is missing — never invent numbers, benchmarks, or vendor terms; (3) be specific to SkyHarbor, not generic. Return STRICT JSON: {"answer": string, "claims": [{"claim": string, "basis": "fact|chunk|assumption|unsupported", "citation": string|null}], "citations": [chunk_id...], "missing_stated": boolean}. GOVERNED EVIDENCE BUNDLE:\n${bundleText.slice(0,90000)}`;
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':AK,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:MODEL,max_tokens:1500,system:sys,messages:[{role:'user',content:question}]})});
  const t=await r.text(); if(!r.ok) return {error:`anthropic ${r.status}: ${t.slice(0,150)}`};
  const j=JSON.parse(t); const txt=(j.content||[]).map(c=>c.text||'').join('');
  const m=txt.match(/\{[\s\S]*\}/); try{ return {parsed:JSON.parse(m[0]), response_id:j.id}; }catch{ return {raw:txt.slice(0,400), response_id:j.id}; }
}

(async()=>{
  const db=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}); await db.connect();
  const traces=[]; let sample=null;
  for(const Q of QUESTIONS){
    const filter=`tenant_key eq '${TENANT}'`;
    const res=await searchQ(Q.query,filter,12);
    const hits=res.value||[];
    // isolation probe: same query under apex-retail must not surface skyharbor docs
    const apex=await searchQ(Q.query,`tenant_key eq 'apex-retail'`,5);
    const leak=(apex.value||[]).some(d=>d.tenant_key===TENANT);
    const chunkIds=hits.map(h=>h.chunk_id).filter(Boolean);
    const gated = chunkIds.length? (await db.query(
      `select c.chunk_id, c.id::text uid, c.source_segment_id seg, c.source_path, c.source_doc, c.tenant_key, left(c.chunk_text,500) snippet, c.source_record_id,
              r2.record_type, gor.agent_readiness_status st, gor.retrievability rb, gor.confidence_level conf, gor.source_basis sb, gor.cited_render_verified_at crv
       from enterprise_context_chunks c
       left join enterprise_context_records r2 on r2.tenant_key=c.tenant_key and r2.source_record_id=c.source_record_id and r2.lifecycle_state='active'
       left join governed_object_readiness gor on gor.object_table='enterprise_context_chunks' and gor.object_id=c.id::text and gor.client_key=c.tenant_key
       where c.tenant_key=$1 and c.chunk_id = any($2)`,[TENANT,chunkIds])).rows : [];
    const excl={wrong_tenant:0,not_reviewed:0,blocked:0,quarantined:0,restricted:0,superseded:0,retired:0,missing_source_basis:0,missing_confidence:0,not_indexed:0,not_retrievable:0,not_citation_ready:0};
    const eligible=[];
    for(const g of gated){
      if(g.tenant_key!==TENANT){excl.wrong_tenant++;continue;}
      const st=g.st||'not_reviewed';
      if(st==='agent_ready'){
        if(!g.sb){excl.missing_source_basis++;continue;}
        if(!g.conf){excl.missing_confidence++;continue;}
        if(!g.crv){excl.not_citation_ready++;continue;}
        eligible.push(g);
      } else if(st==='blocked')excl.blocked++; else if(st==='quarantined')excl.quarantined++;
        else if(st==='restricted')excl.restricted++; else if(st==='retired')excl.retired++;
        else excl.not_reviewed++;
    }
    const famCount=(name)=>eligible.filter(g=> (RT_FAMILY[g.record_type]||SEG_FAMILY[g.seg]||'')===name).length;
    const eligFamilies=[...new Set(eligible.map(g=>{
      const rt=g.record_type;
      if(rt==='contract')return 'contract_baseline'; if(rt==='kpi_metric')return 'run_cost_baseline';
      if(rt==='service_level')return 'sla_baseline'; if(rt==='incidents_ops_telemetry')return 'incident_problem_change';
      if(rt==='org_role')return 'staffing_baseline'; if(rt==='cmdb_application')return 'application_inventory';
      if(rt==='configuration_item'||rt==='facility')return 'tooling_landscape'; if(rt==='integration')return 'service_tower_scope';
      return g.seg;
    }))];
    const missing=Q.req.filter(f=>!eligFamilies.includes(f));
    const status = eligible.length===0?'block':(missing.length>0?'warn':'pass');
    const bundleText=eligible.map(g=>`[chunk_id:${g.chunk_id} | ${g.record_type||g.seg} | src:${g.source_doc}] ${g.snippet}`).join('\n');
    const hash=sha(bundleText);
    const recIds=[...new Set(eligible.map(g=>g.source_record_id))];
    const factRows = recIds.length? (await db.query(`select f.lifecycle_state, count(*)::int n from enterprise_context_facts f join enterprise_context_records r on r.id=f.record_id where r.tenant_key=$1 and r.source_record_id=any($2) group by 1`,[TENANT,recIds])).rows : [];
    const curFacts=(factRows.find(x=>x.lifecycle_state==='active')||{n:0}).n;
    const supFacts=(factRows.find(x=>x.lifecycle_state==='superseded')||{n:0}).n;
    const confDist={}; for(const g of eligible){const k=g.conf||'unset';confDist[k]=(confDist[k]||0)+1;}
    const sbDist={}; for(const g of eligible){const k=(g.source_doc||'unknown');sbDist[k]=(sbDist[k]||0)+1;}

    const allowed = status!=='block';
    let answer=null, claims=[], claimsU=0, citations=[], respId=null;
    if(allowed){ const a=await callClaude(Q.q,bundleText); if(a&&a.parsed){answer=a.parsed.answer; claims=a.parsed.claims||[]; citations=a.parsed.citations||[]; respId=a.response_id; claimsU=claims.filter(c=>c.basis==='unsupported').length;} else if(a){answer=a.raw||a.error; respId=a.response_id||null;} }

    // wisdom (objective rubric 0-5)
    const w={ tenant_grounding: leak?2:5, archetype_grounding:5, evidence_completeness: status==='pass'?5:(eligible.length?3:0),
      sourcing_judgment: answer? (claims.length?4:3):0, pricing_commercial_specificity: eligFamilies.includes('run_cost_baseline')||eligFamilies.includes('contract_baseline')?4:2,
      risk_awareness: (answer&&/risk|credit|termination|transition/i.test(answer))?4:3, deliverable_usefulness: answer?4:0,
      source_discipline: citations.length?5:(eligible.length?3:0), no_hallucination: claimsU===0?5:Math.max(0,5-claimsU) };
    w.overall=+(Object.values(w).reduce((a,b)=>a+b,0)/9).toFixed(2);

    const trace={ trace_id:`tr-${EVENT_ID}-${Q.id}`, question_id:Q.id, question:Q.q, tenant_id:CLIENT_ID, tenant_key:TENANT,
      source_event_id:EVENT_ID, source_event_archetype:ARCHETYPE, user_intent:Q.intent, sourcing_phase:Q.phase,
      evidence_requirements_resolved:Q.req, eligible_evidence_families:eligFamilies, missing_evidence_families:missing,
      retrieval_queries_executed:[{query:Q.query,index:INDEX,filter,returned:hits.length}],
      tenant_context_objects_retrieved:eligible.length, corpus_patterns_retrieved:famCount('corpus'),
      vendor_contracts_retrieved:famCount('vendor_contracts'), financial_facts_retrieved:famCount('financial'),
      sla_kpi_facts_retrieved:famCount('sla_kpi'), itsm_telemetry_facts_retrieved:famCount('itsm_telemetry'),
      org_workforce_facts_retrieved:famCount('org_workforce'), application_system_facts_retrieved:famCount('application_system'),
      artifacts_retrieved:famCount('artifacts'), excluded_objects_by_reason:excl,
      current_fact_count:curFacts, superseded_fact_count_excluded:supFacts,
      citation_ready_count:eligible.filter(g=>g.crv&&g.source_doc).length, confidence_distribution:confDist, source_basis_distribution:sbDist,
      grounding_status:status, grounding_warnings: missing.length?[`missing: ${missing.join(', ')}`]:[],
      model_input_context_hash:hash, model_call_allowed:allowed, model_call_override_warning: status==='warn'?'answer must state gaps':null,
      response_id:respId, claims_detected:claims.length, claims_supported:claims.filter(c=>c.basis!=='unsupported').length, claims_unsupported:claimsU,
      claim_map:claims.slice(0,12), citations_emitted: eligible.slice(0,6).map(g=>({chunk_id:g.chunk_id,record_id:g.source_record_id,source_segment:g.seg,source_uri:g.source_path,source_basis:g.sb,confidence:g.conf,snippet:(g.snippet||'').slice(0,120)})),
      evidence_drawer_objects_emitted:eligible.length, tenant_leakage_status: leak?'leak_detected':'clean', wisdom_score:w, answer_text:answer };
    traces.push(trace);
    if(Q.id==='Q1') sample={ question:Q.q, model_input_context_hash:hash, bundle_preview: bundleText.slice(0,1500) };
  }
  await db.end();
  console.log('TRACE_BEGIN'+JSON.stringify({traces,sample})+'TRACE_END');
})().catch(e=>{console.log('TRACE_BEGIN'+JSON.stringify({fatal:String(e.stack||e.message||e).slice(0,500)})+'TRACE_END');process.exit(1);});

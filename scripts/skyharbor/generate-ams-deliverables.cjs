// WS8 — best-in-class AMS deliverables for SkyHarbor, generated ONLY from governed
// evidence (agent_ready, tenant-scoped, Azure AI Search). Each deliverable follows
// the AMS_MANAGED_SERVICES archetype DNA, is citation-backed (chunk_id), and marks
// missing evidence explicitly — never invents benchmarks/vendor terms. Runs in VNet.
const { Client } = require('pg');
const { DefaultAzureCredential } = require('@azure/identity');
const ENDPOINT=`https://${process.env.AZURE_SEARCH_SERVICE_NAME}.search.windows.net`, INDEX='tenant-context-v1', API='2024-07-01';
const TENANT='skyharbor-air', MODEL=process.env.NEXUS_COMPOSER_MODEL||'claude-opus-4-7', AK=process.env.ANTHROPIC_API_KEY;
const cred=new DefaultAzureCredential(process.env.AZURE_CLIENT_ID?{managedIdentityClientId:process.env.AZURE_CLIENT_ID}:undefined);
let TOK=null; const auth=async()=>{ if(!TOK||TOK.expiresOnTimestamp-Date.now()<60000) TOK=await cred.getToken('https://search.azure.com/.default'); return `Bearer ${TOK.token}`; };
const sq=async(q,top)=>{ const r=await fetch(`${ENDPOINT}/indexes/${INDEX}/docs/search?api-version=${API}`,{method:'POST',headers:{'content-type':'application/json','Authorization':await auth()},body:JSON.stringify({search:q,queryType:'simple',top,filter:`tenant_key eq '${TENANT}'`})}); const t=await r.text(); if(!r.ok) throw new Error(`search ${r.status}:${t.slice(0,120)}`); return (JSON.parse(t).value)||[]; };

// AMS archetype DNA (mirror of src/lib/source/archetypes/registry.ts AMS_MANAGED_SERVICES)
const RFP_SECTIONS=['Executive overview','Scope of services by tower','Current-state context (volumes, cost, SLA)','SLA/KPI schedule + credits','Resource-unit & pricing schedule','Productivity & automation commitments','Transition & knowledge-transfer','Retained-organization & governance','Security / compliance','Commercial terms (rate card, COLA, audit rights)','Response instructions & evaluation criteria'];
const VENDOR_TOPICS=['Tower delivery model','Resource units & shift coverage','Automation/productivity commitments','SLA + credits regime','Transition & knowledge transfer','Termination assistance'];
const LEVERS=['Volume-band pricing (rfp)','Productivity glide-path with credits (bafo)','Incumbent dissatisfaction / multi-bidder tension (pre_rfp)','Termination assistance + exit rates (final_contracting)'];
const RISKS=['transition risk','concentration risk','productivity-shortfall risk','retained-org capability gap','offshore quality risk'];

async function claude(system,user,maxtok){
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':AK,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:MODEL,max_tokens:maxtok||2200,system,messages:[{role:'user',content:user}]})});
  const t=await r.text(); if(!r.ok) return `(model error ${r.status}: ${t.slice(0,120)})`;
  const j=JSON.parse(t); return (j.content||[]).map(c=>c.text||'').join('');
}

(async()=>{
  const db=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}); await db.connect();
  // assemble a broad GOVERNED bundle: retrieve across families, keep only agent_ready
  const queries={vendor:'vendor contract renewal IBM AMS annual value',financial:'IT spend budget cost tower run cost',sla:'SLA availability service level credit breach',apps:'application criticality vendor deployment system',infra:'mainframe server cloud asset Teradata',org:'SVP VP director role staffing',incidents:'incident severity root cause change'};
  const bundle={}; const allChunkIds=new Set();
  for(const [fam,q] of Object.entries(queries)){
    const hits=await sq(q,8); const ids=hits.map(h=>h.chunk_id).filter(Boolean);
    if(!ids.length){bundle[fam]=[];continue;}
    const g=(await db.query(`select c.chunk_id, r2.record_type, c.source_doc, left(c.chunk_text,420) snippet, gor.agent_readiness_status st
      from enterprise_context_chunks c
      left join enterprise_context_records r2 on r2.tenant_key=c.tenant_key and r2.source_record_id=c.source_record_id and r2.lifecycle_state='active'
      left join governed_object_readiness gor on gor.object_table='enterprise_context_chunks' and gor.object_id=c.id::text and gor.client_key=c.tenant_key
      where c.tenant_key=$1 and c.chunk_id=any($2)`,[TENANT,ids])).rows.filter(x=>x.st==='agent_ready');
    g.forEach(x=>allChunkIds.add(x.chunk_id));
    bundle[fam]=g;
  }
  const fmt=(fam)=> (bundle[fam]||[]).map(g=>`[${g.chunk_id} | ${g.record_type||''} | ${g.source_doc}] ${g.snippet}`).join('\n');
  const BUNDLE_ALL=Object.keys(bundle).map(f=>`## ${f} evidence\n${fmt(f)}`).join('\n\n').slice(0,70000);
  const have={vendor:bundle.vendor.length,financial:bundle.financial.length,sla:bundle.sla.length,apps:bundle.apps.length,infra:bundle.infra.length,org:bundle.org.length,incidents:bundle.incidents.length};
  // missing AMS families (no agent_ready evidence retrieved): ticket_volumes, transition_constraints, retained_org_model are not in v2 → expect missing
  const missingFamilies=['ticket_volumes (L1/L2/L3 volumes)','transition_constraints','retained_org_model','tooling_landscape (productivity baseline)'];

  const RULES=`Hard rules: use ONLY the governed evidence bundle; cite the [chunk_id] for every factual claim; if a needed input is not in the bundle, write "EVIDENCE MISSING: <what>" — never invent numbers, benchmarks, vendor rates, or SLA targets; be specific to SkyHarbor; write like a senior IT-sourcing partner, not generic LLM text. Known missing AMS evidence families (state these where relevant): ${missingFamilies.join('; ')}.`;
  const out={ generated_at:new Date().toISOString(), evidence_counts:have, missing_families:missingFamilies, bundle_chunk_count:allChunkIds.size, deliverables:{} };

  out.deliverables['01_event_brief']=await claude(`You are AbarVa Sentinel, senior IT-sourcing advisor. ${RULES}`,
    `Write a concise AMS Sourcing Event Brief for SkyHarbor Air (an ~$80B airline). Cover: objective, scope summary (towers/estate), incumbent/vendor landscape, why now, decision owners, and a one-line evidence-readiness verdict. Bundle:\n${BUNDLE_ALL}`,1600);
  out.deliverables['02_strategy_memo']=await claude(`You are a McKinsey-grade sourcing-transformation partner. ${RULES}`,
    `Write an AMS Sourcing Strategy Memo for SkyHarbor. Cover: retain-vs-outsource posture by tower, should-cost orientation (only if run-cost evidence exists, else EVIDENCE MISSING), productivity glide-path stance, transition posture, and the recommended buying motion. Bundle:\n${BUNDLE_ALL}`,2000);
  out.deliverables['03_rfp_draft']=await claude(`You are drafting a tower-structured AMS RFP. Follow EXACTLY these sections: ${RFP_SECTIONS.join(' | ')}. For each section, fill from evidence with [chunk_id] citations; where the section needs data not in the bundle, write "EVIDENCE BLOCKED: <family>" and do not fabricate. ${RULES}`,
    `Draft the SkyHarbor AMS RFP, section by section per the required structure. Bundle:\n${BUNDLE_ALL}`,3500);
  out.deliverables['04_vendor_guide']=await claude(`You are preparing a vendor discussion guide. Organize by these topics: ${VENDOR_TOPICS.join(' | ')}. ${RULES}`,
    `Write the SkyHarbor AMS Vendor Discussion Guide: for each topic, the questions to ASK, what to probe, and what NOT to reveal yet. Bundle:\n${BUNDLE_ALL}`,1800);
  out.deliverables['05_pricing_negotiation']=await claude(`You are a commercial deal architect. Use these archetype levers (timing in parens): ${LEVERS.join('; ')}. ${RULES} Especially: do NOT invent market benchmarks or rate cards — if absent, say EVIDENCE MISSING.`,
    `Write the SkyHarbor AMS Pricing & Negotiation Intelligence Memo: current spend/contract baseline (cited), the pricing model to demand, the lever plan sequenced by timing, and BAFO asks. Bundle:\n${BUNDLE_ALL}`,2200);
  out.deliverables['06_exec_recommendation']=await claude(`You are briefing the CIO. ${RULES} State confidence and what is NOT yet answerable.`,
    `Write a SkyHarbor AMS Executive Recommendation draft: the recommendation, the evidence it rests on (cited), the key risks (${RISKS.join(', ')}), and an explicit "Not yet decidable until we obtain:" list tied to the missing evidence families. Bundle:\n${BUNDLE_ALL}`,2000);

  console.log('DELIV_BEGIN'+JSON.stringify(out)+'DELIV_END'); await db.end();
})().catch(e=>{console.log('DELIV_BEGIN'+JSON.stringify({fatal:String(e.stack||e.message||e).slice(0,500)})+'DELIV_END');process.exit(1);});

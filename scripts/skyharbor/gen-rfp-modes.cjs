// RFP completeness + intake engine: regenerate the SkyHarbor AMS RFP applying the
// 4-mode model. Computes coverage from governed_object_readiness, drives Opus 4.8 to
// produce: AUTO-GOVERNED (cited facts) + AUTO-TEMPLATE (rich boilerplate) sections,
// ELICIT blocks (the scoped Nexus questions), CLIENT-COMPLETE guided placeholders, and
// a completeness scorecard. Emits the standalone intake question pack too.
const { Client } = require('pg');
const { DefaultAzureCredential } = require('@azure/identity');
const ENDPOINT=`https://${process.env.AZURE_SEARCH_SERVICE_NAME}.search.windows.net`, INDEX='tenant-context-v1', API='2024-07-01';
const TENANT='skyharbor-air', MODEL=process.env.NEXUS_COMPOSER_MODEL||'claude-opus-4-8', AK=process.env.ANTHROPIC_API_KEY;
const cred=new DefaultAzureCredential(process.env.AZURE_CLIENT_ID?{managedIdentityClientId:process.env.AZURE_CLIENT_ID}:undefined);
let TK=null; const auth=async()=>{ if(!TK||TK.expiresOnTimestamp-Date.now()<60000) TK=await cred.getToken('https://search.azure.com/.default'); return `Bearer ${TK.token}`; };
const sq=async(q,top)=>{ const r=await fetch(`${ENDPOINT}/indexes/${INDEX}/docs/search?api-version=${API}`,{method:'POST',headers:{'content-type':'application/json','Authorization':await auth()},body:JSON.stringify({search:q,queryType:'simple',top,filter:`tenant_key eq '${TENANT}'`})}); const t=await r.text(); if(!r.ok)throw new Error('search '+r.status); return (JSON.parse(t).value)||[]; };
async function claude(sys,user,mt){ const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':AK,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:MODEL,max_tokens:mt,system:sys,messages:[{role:'user',content:user}]})}); const t=await r.text(); if(!r.ok)return '(model error '+r.status+': '+t.slice(0,200)+')'; return (JSON.parse(t).content||[]).map(c=>c.text||'').join(''); }
const M=(n)=>'$'+(Number(n)/1e6).toFixed(1)+'M';
// section matrix: mode + intake/client prompts
const SECTIONS=[
 {n:1,title:'Instructions to Bidders & Submission',mode:'AUTO-TEMPLATE+ELICIT',intake:['RFP timeline: issue date, Q&A close, response due, orals, award, transition start','Sourcing lead contact + submission portal']},
 {n:2,title:'Executive Overview & Objectives',mode:'AUTO-GOVERNED+ELICIT',intake:['Top 3 strategic objectives for this AMS event and the burning-platform driver']},
 {n:3,title:'Scope of Services by Tower',mode:'AUTO-GOVERNED+ELICIT',intake:['Per tower: in-scope / out-of-scope / retained in-house','Single-tower vs multi-tower vs single-prime award intent']},
 {n:4,title:'Current-State Context (Volumes, Cost, SLA)',mode:'AUTO-GOVERNED+ELICIT',intake:['12-month ticket/incident/change volumes by tower and priority (L1/L2/L3; P1-P4)','First-contact-resolution rate by tower']},
 {n:5,title:'SLA / KPI Schedule & Credits',mode:'AUTO-GOVERNED+CLIENT-COMPLETE',client:'Target SLA levels per critical service + at-risk credit % + earn-back and chronic-breach policy (client/legal decision)'},
 {n:6,title:'Resource-Unit & Pricing Schedule',mode:'AUTO-TEMPLATE+ELICIT',intake:['Staffing baseline (FTE by tower, onshore/offshore mix)','Resource-unit volumes per tower','Budget ceiling / not-to-exceed (optional)']},
 {n:7,title:'Productivity & Automation Commitments',mode:'ELICIT',intake:['Required productivity glide-path Y1-Y3 (%) and gainshare stance']},
 {n:8,title:'Transition & Knowledge Transfer',mode:'ELICIT',intake:['Transition constraints: blackout windows, parallel-run requirement, KT expectations, incumbent-cooperation terms, target go-live']},
 {n:9,title:'Retained Organization & Governance',mode:'ELICIT+CLIENT-COMPLETE',intake:['Functions retained in-house (governance, architecture, vendor mgmt) + target retained headcount'],client:'Governance operating model & cadence (client decision)'},
 {n:10,title:'Security & Compliance',mode:'CLIENT-COMPLETE+AUTO-TEMPLATE',client:'Required frameworks (SOC2/ISO/airline-specific), data residency, background-check standard (client/security decision)'},
 {n:11,title:'Commercial Terms / Sample Agreement',mode:'AUTO-TEMPLATE+CLIENT-COMPLETE',client:'Liquidated damages, audit rights, exit/termination-assistance, data-protection terms — legal sign-off required'},
 {n:12,title:'Response Instructions & Evaluation Criteria',mode:'AUTO-TEMPLATE+CLIENT-COMPLETE',client:'Final evaluation criteria weights, disqualifiers, and minimum qualifications (client decision)'},
 {n:13,title:'Mandatory Forms & Exhibits',mode:'AUTO-TEMPLATE+CLIENT-COMPLETE',client:'Diversity/subcontracting policy (HUB/MBE/WBE) and required certifications'},
 {n:14,title:'Current-State Exhibits (Inventory, Software, Volumes)',mode:'AUTO-GOVERNED+ELICIT',intake:['Transaction/utilization volume summaries per platform (if available)']},
];
(async()=>{
  const db=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}); await db.connect();
  const pivot=async(rt)=>(await db.query(`select r.id, jsonb_object_agg(f.fact_key,f.fact_value->>'value') fields from enterprise_context_records r join enterprise_context_facts f on f.record_id=r.id and f.lifecycle_state='active' where r.tenant_key=$1 and r.record_type=$2 and r.lifecycle_state='active' group by r.id`,[TENANT,rt])).rows.map(x=>x.fields);
  // coverage = agent_ready record_types
  const cov=(await db.query(`select distinct r.record_type from enterprise_context_records r join governed_object_readiness g on g.object_table='enterprise_context_records' and g.object_id=r.id::text and g.client_key=$1 and g.agent_readiness_status='agent_ready' where r.tenant_key=$1`,[TENANT])).rows.map(x=>x.record_type);
  const ven=(await pivot('contract')).map(v=>({vendor:v.vendor_name,annual:+(v.annual_value_usd||0),renewal:v.renewal_date,scope:v.scope})).sort((a,b)=>b.annual-a.annual);
  const sla=(await pivot('service_level')).map(s=>({tower:s.tower,metric:s.metric,target:s.target,actual:s.actual,credit:+(s.credit_at_risk_usd||0)})).sort((a,b)=>b.credit-a.credit);
  const apps=await pivot('cmdb_application'); const org=await pivot('org_role');
  const ex={vt:ven.reduce((a,b)=>a+b.annual,0),vn:ven.length,top:ven.slice(0,8),towers:[...new Set(sla.map(s=>s.tower))].filter(Boolean),
    sla_credit:sla.reduce((a,b)=>a+b.credit,0),sla_n:sla.length,sla_top:sla.slice(0,10),app_n:apps.length,app_run:apps.reduce((a,b)=>a+(+(b.annual_run_cost_usd||0)),0),
    crit:apps.reduce((m,a)=>{m[a.criticality]=(m[a.criticality]||0)+1;return m;},{}),org_lvl:org.reduce((m,o)=>{m[o.level]=(m[o.level]||0)+1;return m;},{})};
  ex.ams=ven.filter(v=>/AMS|managed service|modernization/i.test(v.scope||'')).reduce((a,b)=>a+b.annual,0);
  // governed bundle + register
  const reg=[],bun=[];
  for(const q of ['vendor contract IBM AMS','SLA availability credit','application criticality run cost','IT spend application management','mainframe server cloud','SVP director staffing','incident severity change']){
    const hits=await sq(q,5); const ids=hits.map(h=>h.chunk_id).filter(Boolean); if(!ids.length)continue;
    const g=(await db.query(`select c.chunk_id,r2.record_type,c.source_doc,left(c.chunk_text,240) snip,gor.agent_readiness_status st from enterprise_context_chunks c left join enterprise_context_records r2 on r2.tenant_key=c.tenant_key and r2.source_record_id=c.source_record_id and r2.lifecycle_state='active' left join governed_object_readiness gor on gor.object_table='enterprise_context_chunks' and gor.object_id=c.id::text and gor.client_key=c.tenant_key where c.tenant_key=$1 and c.chunk_id=any($2)`,[TENANT,ids])).rows.filter(x=>x.st==='agent_ready');
    for(const x of g){ if(!reg.find(r=>r.chunk_id===x.chunk_id)){reg.push({n:reg.length+1,chunk_id:x.chunk_id,doc:x.source_doc,type:x.record_type}); bun.push(`[${reg.length}] (${x.record_type}|${x.source_doc}) ${x.snip}`);}}
  }
  const venMd='| Vendor | Annual | Renewal | Scope |\n|---|---|---|---|\n'+ex.top.map(v=>`| ${v.vendor} | ${M(v.annual)} | ${v.renewal} | ${(v.scope||'').slice(0,32)} |`).join('\n');
  const slaMd='| Tower | Metric | Target | Actual | Credit |\n|---|---|---|---|---|\n'+ex.sla_top.map(s=>`| ${s.tower} | ${s.metric} | ${s.target} | ${s.actual} | ${M(s.credit)} |`).join('\n');
  const EX=`Coverage (agent_ready record types): ${cov.join(', ')}.\nGOVERNED FACTS:\n- Vendors: ${M(ex.vt)} across ${ex.vn}; AMS-anchor ${M(ex.ams)}.\n${venMd}\n- SLA: ${ex.sla_n} SLAs, ${M(ex.sla_credit)} credit-at-risk.\n${slaMd}\n- Apps: ${ex.app_n} (crit ${JSON.stringify(ex.crit)}), run ${M(ex.app_run)}. Towers: ${ex.towers.join(', ')}.\n- Org: ${JSON.stringify(ex.org_lvl)}.`;
  const sectionDirectives=SECTIONS.map(s=>`${s.n}. ${s.title} — MODE: ${s.mode}.${s.intake?' ELICIT questions: '+s.intake.join(' | '):''}${s.client?' CLIENT-COMPLETE: '+s.client:''}`).join('\n');

  const SYS=`You are AbarVa Sentinel + Nexus, a McKinsey-grade IT-sourcing partner assembling an ISSUABLE AMS RFP for SkyHarbor Air (~$80B airline), modeled on real public-sector outsourcing RFPs (City of Chicago mainframe outsourcing; UT Health). Output clean MARKDOWN. Apply the FOUR-MODE model per section EXACTLY:
- AUTO-GOVERNED: write from the GOVERNED FACTS only; cite [n]; reproduce the relevant exhibit table; never invent client numbers.
- AUTO-TEMPLATE: write rich, professional STANDARD boilerplate (instructions, definitions, standard T&Cs scaffolding, response format, form structures) — this is template content, not client data; begin such sections with '_(Standard template — client to review.)_'.
- ELICIT: do NOT fabricate. Emit a block titled '> 📋 **NEXUS INTAKE — required to finalize this section:**' then the listed questions as bullets, plus a 1-2 line note on how the answer will shape the section. You MAY draft a skeleton labelled '(draft pending intake)'.
- CLIENT-COMPLETE: emit '> ✍️ **CLIENT TO COMPLETE:**' then the specific decision/prompt, plus a template skeleton the client fills. Do not invent the client's policy.
Lead each section with a one-line so-what. Be specific to SkyHarbor. No raw chunk_ids in prose.`;
  const USER=`Assemble the RFP with these sections IN ORDER, each applying its MODE:\n${sectionDirectives}\n\n${EX}\n\nEVIDENCE (cite [n]):\n${bun.join('\n').slice(0,45000)}`;
  const body=await claude(SYS,USER,8000);

  // deterministic completeness scorecard + intake pack
  const tally={auto_governed:0,auto_template:0,elicit:0,client_complete:0};
  SECTIONS.forEach(s=>{ if(/AUTO-GOVERNED/.test(s.mode))tally.auto_governed++; if(/AUTO-TEMPLATE/.test(s.mode))tally.auto_template++; if(/ELICIT/.test(s.mode))tally.elicit++; if(/CLIENT-COMPLETE/.test(s.mode))tally.client_complete++; });
  const intake_pack=SECTIONS.filter(s=>s.intake).map(s=>({section:s.n+'. '+s.title,questions:s.intake}));
  const client_items=SECTIONS.filter(s=>s.client).map(s=>({section:s.n+'. '+s.title,decision:s.client}));
  console.log('RM_BEGIN'+JSON.stringify({model:MODEL,generated_at:new Date().toISOString(),coverage:cov,tally,sections:SECTIONS.map(s=>({n:s.n,title:s.title,mode:s.mode})),intake_pack,client_items,source_register:reg,rfp_markdown:body,exhibits:ex})+'RM_END');
  await db.end();
})().catch(e=>{console.log('RM_BEGIN'+JSON.stringify({fatal:String(e.stack||e.message||e).slice(0,500)})+'RM_END');process.exit(1);});

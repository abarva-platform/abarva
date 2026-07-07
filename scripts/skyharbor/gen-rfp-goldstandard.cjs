// Flagship: SkyHarbor AMS RFP to gold standard. Computes real exhibits from governed
// facts (SLA schedule, vendor baseline, app estate, IT financials, pricing template),
// assembles governed bundle, drives Claude to partner-grade prose against the LOCKED
// RFP TOC with [n] appendix citations + EVIDENCE-BLOCKED for gaps. Outputs JSON the
// local renderer turns into DOCX (canonical) + XLSX companions + PDF + HTML.
const { Client } = require('pg');
const { DefaultAzureCredential } = require('@azure/identity');
const ENDPOINT=`https://${process.env.AZURE_SEARCH_SERVICE_NAME}.search.windows.net`, INDEX='tenant-context-v1', API='2024-07-01';
const TENANT='skyharbor-air', MODEL=process.env.NEXUS_COMPOSER_MODEL||'claude-opus-4-7', AK=process.env.ANTHROPIC_API_KEY;
const cred=new DefaultAzureCredential(process.env.AZURE_CLIENT_ID?{managedIdentityClientId:process.env.AZURE_CLIENT_ID}:undefined);
let TK=null; const auth=async()=>{ if(!TK||TK.expiresOnTimestamp-Date.now()<60000) TK=await cred.getToken('https://search.azure.com/.default'); return `Bearer ${TK.token}`; };
const sq=async(q,top)=>{ const r=await fetch(`${ENDPOINT}/indexes/${INDEX}/docs/search?api-version=${API}`,{method:'POST',headers:{'content-type':'application/json','Authorization':await auth()},body:JSON.stringify({search:q,queryType:'simple',top,filter:`tenant_key eq '${TENANT}'`})}); const t=await r.text(); if(!r.ok)throw new Error(`search ${r.status}`); return (JSON.parse(t).value)||[]; };
async function claude(sys,user,mt){ const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':AK,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:MODEL,max_tokens:mt,system:sys,messages:[{role:'user',content:user}]})}); const t=await r.text(); if(!r.ok)return `(model error ${r.status}: ${t.slice(0,150)})`; return (JSON.parse(t).content||[]).map(c=>c.text||'').join(''); }
const fmtUSD=(n)=>'$'+(Number(n)/1e6).toFixed(1)+'M';

(async()=>{
  const db=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}); await db.connect();
  const pivot=async(rt)=>(await db.query(
    `select r.id, jsonb_object_agg(f.fact_key, f.fact_value->>'value') fields
     from enterprise_context_records r join enterprise_context_facts f on f.record_id=r.id and f.lifecycle_state='active'
     where r.tenant_key=$1 and r.record_type=$2 and r.lifecycle_state='active' group by r.id`,[TENANT,rt])).rows.map(x=>x.fields);
  const ex={};
  // SLA schedule
  const sla=await pivot('service_level');
  ex.sla=sla.map(s=>({tower:s.tower||s.service_name,metric:s.metric,target:s.target,actual:s.actual,breaches:+(s.breach_count||0),credit:+(s.credit_at_risk_usd||0)}))
    .sort((a,b)=>b.credit-a.credit);
  ex.sla_credit_total=ex.sla.reduce((a,b)=>a+b.credit,0);
  // vendor baseline
  const ven=(await pivot('contract')).map(v=>({vendor:v.vendor_name,annual:+(v.annual_value_usd||0),renewal:v.renewal_date,exit:v.exit_terms,scope:v.scope})).sort((a,b)=>b.annual-a.annual);
  ex.vendor_top=ven.slice(0,10); ex.vendor_total=ven.reduce((a,b)=>a+b.annual,0); ex.vendor_count=ven.length;
  ex.ams_anchor=ven.filter(v=>/AMS|managed service|modernization/i.test(v.scope||'')).slice(0,6);
  ex.ams_addressable=ex.ams_anchor.reduce((a,b)=>a+b.annual,0);
  // app estate
  const apps=await pivot('cmdb_application');
  const by=(k)=>{const m={};apps.forEach(a=>{const v=a[k]||'?';m[v]=(m[v]||0)+1;});return m;};
  ex.app_count=apps.length; ex.app_by_crit=by('criticality'); ex.app_by_func=by('business_function'); ex.app_by_deploy=by('deployment_model');
  ex.app_run_cost=apps.reduce((a,b)=>a+(+(b.annual_run_cost_usd||0)),0);
  // IT financials (AMS-relevant = Application Mgmt tower lines, FY2026)
  const fin=await pivot('kpi_metric');
  ex.fin_appmgmt=fin.filter(f=>/Application Mgmt/i.test(f.segment||'')&&/FY2026/i.test(f.period||'')).map(f=>({segment:f.segment,value:+(f.value||0)}));
  ex.fin_appmgmt_total=ex.fin_appmgmt.reduce((a,b)=>a+b.value,0);
  // org spans
  const org=await pivot('org_role'); const ol={};org.forEach(o=>{ol[o.level]=(ol[o.level]||0)+1;}); ex.org_by_level=ol;
  // pricing template = towers from SLA + app functions
  ex.towers=[...new Set(ex.sla.map(s=>s.tower))].filter(Boolean);

  // governed bundle (agent_ready) for prose grounding + source register
  const bundle=[]; const reg=[];
  for(const q of ['vendor contract IBM AMS','SLA availability credit','application criticality vendor','IT spend application management','mainframe server cloud','SVP director staffing','incident severity change']){
    const hits=await sq(q,6); const ids=hits.map(h=>h.chunk_id).filter(Boolean); if(!ids.length)continue;
    const g=(await db.query(`select c.chunk_id, r2.record_type, c.source_doc, left(c.chunk_text,300) snip, gor.agent_readiness_status st
      from enterprise_context_chunks c left join enterprise_context_records r2 on r2.tenant_key=c.tenant_key and r2.source_record_id=c.source_record_id and r2.lifecycle_state='active'
      left join governed_object_readiness gor on gor.object_table='enterprise_context_chunks' and gor.object_id=c.id::text and gor.client_key=c.tenant_key
      where c.tenant_key=$1 and c.chunk_id=any($2)`,[TENANT,ids])).rows.filter(x=>x.st==='agent_ready');
    for(const x of g){ if(!reg.find(r=>r.chunk_id===x.chunk_id)){ reg.push({n:reg.length+1,chunk_id:x.chunk_id,doc:x.source_doc,type:x.record_type}); bundle.push(`[${reg.length}] (${x.record_type}|${x.source_doc}) ${x.snip}`);}}
  }
  const BUNDLE=bundle.join('\n').slice(0,60000);

  // pre-built exhibit markdown for injection
  const slaMd='| Tower | Metric | Target | Actual | Breaches | Credit-at-risk |\n|---|---|---|---|---|---|\n'+ex.sla.slice(0,12).map(s=>`| ${s.tower} | ${s.metric} | ${s.target} | ${s.actual} | ${s.breaches} | ${fmtUSD(s.credit)} |`).join('\n');
  const venMd='| Vendor | Annual | Renewal | Scope |\n|---|---|---|---|\n'+ex.vendor_top.map(v=>`| ${v.vendor} | ${fmtUSD(v.annual)} | ${v.renewal} | ${(v.scope||'').slice(0,40)} |`).join('\n');
  const appMd='Criticality: '+Object.entries(ex.app_by_crit).map(([k,v])=>`${k} ${v}`).join(', ')+`. Total run cost ${fmtUSD(ex.app_run_cost)} across ${ex.app_count} apps.`;

  const EXHIBITS=`EXHIBIT A — SLA breach economics (top towers by credit-at-risk; total ${fmtUSD(ex.sla_credit_total)} across ${ex.sla.length} SLAs):\n${slaMd}\n\nEXHIBIT B — Incumbent vendor baseline (top 10 of ${ex.vendor_count}; total contracted ${fmtUSD(ex.vendor_total)}; AMS-anchor scope ${fmtUSD(ex.ams_addressable)}):\n${venMd}\n\nEXHIBIT C — Application estate: ${appMd}\nEXHIBIT D — FY26 Application-Mgmt budget lines total ${fmtUSD(ex.fin_appmgmt_total)} (software/license + run; AMS labor line not separately tagged — EVIDENCE MISSING).\nEXHIBIT E — Org spans: ${Object.entries(ex.org_by_level).map(([k,v])=>`${k} ${v}`).join(', ')}.\nTowers in scope: ${ex.towers.join(', ')}.`;

  const SYS=`You are a McKinsey-grade IT-sourcing partner drafting a tower-structured AMS RFP for SkyHarbor Air (~$80B airline). Output clean MARKDOWN, partner quality. RULES: (1) Follow the LOCKED section order exactly with '## N. Title' headings. (2) Lead each section with the so-what, then specifics. (3) Use ONLY the provided EXHIBITS (real computed numbers) and EVIDENCE for facts — never invent rates, benchmarks, ticket volumes, or SLA targets not given; where an input is absent write '**EVIDENCE MISSING:** <what is needed>'. (4) Cite evidence with bracket numbers [n] that map to the EVIDENCE register; put data in the exhibit tables where provided (reproduce the tables in the relevant section). (5) Do NOT put raw chunk_ids in prose. (6) Be specific to SkyHarbor (towers, incumbents, SLA gaps) — not generic. Write like a document that issues to bidders.`;
  const TOC=['Instructions to bidders','Executive overview & objectives','Scope of services by tower','Current-state context (volumes, cost, SLA)','Service-level (SLA/KPI) schedule & credits','Resource-unit & pricing schedule','Productivity & automation commitments','Transition & knowledge transfer','Retained organization & governance','Security & compliance','Commercial terms','Response instructions & evaluation criteria','Appendices (application inventory, SLA schedule, pricing template, glossary)'];
  const USER=`Draft the SkyHarbor AMS RFP. Sections in this exact order:\n${TOC.map((t,i)=>`${i+1}. ${t}`).join('\n')}\n\nEXHIBITS (use the real numbers; reproduce relevant tables in the matching sections):\n${EXHIBITS}\n\nEVIDENCE (cite as [n]):\n${BUNDLE}`;
  const rfp_markdown=await claude(SYS,USER,7000);

  const out={ generated_at:new Date().toISOString(), exhibits:ex, source_register:reg, rfp_markdown,
    pricing_template:{towers:ex.towers, columns:['Tower','Resource unit','Volume band','Unit rate (Yr1)','Unit rate (Yr2)','Productivity %','Notes']},
    sla_schedule:ex.sla };
  console.log('RFP_BEGIN'+JSON.stringify(out)+'RFP_END'); await db.end();
})().catch(e=>{console.log('RFP_BEGIN'+JSON.stringify({fatal:String(e.stack||e.message||e).slice(0,500)})+'RFP_END');process.exit(1);});

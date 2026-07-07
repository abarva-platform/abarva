// Strategy Memo + Executive Recommendation to gold standard, from governed evidence.
// Reuses RFP exhibit SQL + governed bundle; claude-opus-4-7 drafts partner-grade prose
// against the LOCKED TOCs. Outputs JSON -> local renderer makes DOCX + PPTX.
const { Client } = require('pg');
const { DefaultAzureCredential } = require('@azure/identity');
const ENDPOINT=`https://${process.env.AZURE_SEARCH_SERVICE_NAME}.search.windows.net`, INDEX='tenant-context-v1', API='2024-07-01';
const TENANT='skyharbor-air', MODEL=process.env.NEXUS_COMPOSER_MODEL||'claude-opus-4-7', AK=process.env.ANTHROPIC_API_KEY;
const cred=new DefaultAzureCredential(process.env.AZURE_CLIENT_ID?{managedIdentityClientId:process.env.AZURE_CLIENT_ID}:undefined);
let TK=null; const auth=async()=>{ if(!TK||TK.expiresOnTimestamp-Date.now()<60000) TK=await cred.getToken('https://search.azure.com/.default'); return `Bearer ${TK.token}`; };
const sq=async(q,top)=>{ const r=await fetch(`${ENDPOINT}/indexes/${INDEX}/docs/search?api-version=${API}`,{method:'POST',headers:{'content-type':'application/json','Authorization':await auth()},body:JSON.stringify({search:q,queryType:'simple',top,filter:`tenant_key eq '${TENANT}'`})}); const t=await r.text(); if(!r.ok)throw new Error('search '+r.status); return (JSON.parse(t).value)||[]; };
async function claude(sys,user,mt){ const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':AK,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:MODEL,max_tokens:mt,system:sys,messages:[{role:'user',content:user}]})}); const t=await r.text(); if(!r.ok)return '(model error '+r.status+': '+t.slice(0,150)+')'; return (JSON.parse(t).content||[]).map(c=>c.text||'').join(''); }
const M=(n)=>'$'+(Number(n)/1e6).toFixed(1)+'M';
(async()=>{
  const db=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}); await db.connect();
  const pivot=async(rt)=>(await db.query(`select r.id, jsonb_object_agg(f.fact_key,f.fact_value->>'value') fields from enterprise_context_records r join enterprise_context_facts f on f.record_id=r.id and f.lifecycle_state='active' where r.tenant_key=$1 and r.record_type=$2 and r.lifecycle_state='active' group by r.id`,[TENANT,rt])).rows.map(x=>x.fields);
  const ven=(await pivot('contract')).map(v=>({vendor:v.vendor_name,annual:+(v.annual_value_usd||0),renewal:v.renewal_date,scope:v.scope})).sort((a,b)=>b.annual-a.annual);
  const sla=(await pivot('service_level')).map(s=>({tower:s.tower,actual:s.actual,credit:+(s.credit_at_risk_usd||0)}));
  const apps=await pivot('cmdb_application'); const org=await pivot('org_role');
  const ex={vendor_total:ven.reduce((a,b)=>a+b.annual,0),vendor_count:ven.length,top:ven.slice(0,8),
    ams_anchor:ven.filter(v=>/AMS|managed service|modernization/i.test(v.scope||'')),
    sla_credit:sla.reduce((a,b)=>a+b.credit,0),sla_n:sla.length,
    app_count:apps.length,app_run:apps.reduce((a,b)=>a+(+(b.annual_run_cost_usd||0)),0),
    towers:[...new Set(sla.map(s=>s.tower))].filter(Boolean),org_levels:{}};
  org.forEach(o=>{ex.org_levels[o.level]=(ex.org_levels[o.level]||0)+1;});
  ex.ams_addressable=ex.ams_anchor.reduce((a,b)=>a+b.annual,0);
  // governed bundle + register
  const reg=[],bun=[];
  for(const q of ['vendor contract IBM AMS managed services','SLA availability credit breach','application criticality run cost','IT spend application management budget','mainframe cloud infrastructure','SVP director org staffing']){
    const hits=await sq(q,6); const ids=hits.map(h=>h.chunk_id).filter(Boolean); if(!ids.length)continue;
    const g=(await db.query(`select c.chunk_id,r2.record_type,c.source_doc,left(c.chunk_text,260) snip,gor.agent_readiness_status st from enterprise_context_chunks c left join enterprise_context_records r2 on r2.tenant_key=c.tenant_key and r2.source_record_id=c.source_record_id and r2.lifecycle_state='active' left join governed_object_readiness gor on gor.object_table='enterprise_context_chunks' and gor.object_id=c.id::text and gor.client_key=c.tenant_key where c.tenant_key=$1 and c.chunk_id=any($2)`,[TENANT,ids])).rows.filter(x=>x.st==='agent_ready');
    for(const x of g){ if(!reg.find(r=>r.chunk_id===x.chunk_id)){reg.push({n:reg.length+1,chunk_id:x.chunk_id,doc:x.source_doc,type:x.record_type}); bun.push(`[${reg.length}] (${x.record_type}|${x.source_doc}) ${x.snip}`);}}
  }
  const BUN=bun.join('\n').slice(0,55000);
  const venMd='| Vendor | Annual | Renewal | Scope |\n|---|---|---|---|\n'+ex.top.map(v=>`| ${v.vendor} | ${M(v.annual)} | ${v.renewal} | ${(v.scope||'').slice(0,34)} |`).join('\n');
  const EX=`KEY NUMBERS (computed from governed facts — use these, cite [n] for narrative claims):\n- Contracted vendor spend: ${M(ex.vendor_total)} across ${ex.vendor_count} contracts; AMS-anchor scope ${M(ex.ams_addressable)}.\n- SLA regime: ${ex.sla_n} SLAs, ${M(ex.sla_credit)} credit-at-risk; infrastructure availability missing 99.9% in most towers.\n- Estate: ${ex.app_count} apps, ${M(ex.app_run)} annual run cost. Towers: ${ex.towers.join(', ')}.\n- Org: ${Object.entries(ex.org_levels).map(([k,v])=>k+' '+v).join(', ')}.\n- Top incumbents:\n${venMd}`;

  const RULES=`Use ONLY these KEY NUMBERS and the EVIDENCE; never invent benchmarks, savings %, or vendor rates not derivable from them — where you state a savings range, frame it explicitly as an ASSUMPTION to validate (e.g. 'assume 8-15% on AMS-anchor scope'), not a market benchmark. Cite [n] (maps to a source register). No raw chunk_ids. Specific to SkyHarbor. Partner-grade, thesis-first.`;

  const stratSys=`You are a McKinsey sourcing-transformation partner writing the AMS Sourcing Strategy Memo for SkyHarbor Air. Output clean MARKDOWN with '## N. Title' sections in this LOCKED order: 1. Executive thesis 2. Situation 3. Complication 4. Value at stake 5. Strategic options 6. Recommended path & buying motion 7. Approach & sequencing 8. Risks & mitigations 9. Next steps. Lead section 1 with a 3-sentence thesis (the answer). In 'Value at stake', size the prize as a $ range on the ${M(ex.ams_addressable)} AMS-anchor / ${M(ex.vendor_total)} total with STATED assumptions. In 'Strategic options', give a retain/outsource view by tower and compete-vs-renegotiate per major incumbent (note IBM renews 2027-12-31, Accenture 2027-03-31). ${RULES}`;
  const strategy_markdown=await claude(stratSys,`${EX}\n\nEVIDENCE:\n${BUN}`,4500);

  const execSys=`You are briefing the SkyHarbor CIO/CFO/Board. Produce an Executive Recommendation as SLIDES in MARKDOWN: each slide is '## <slide title>' followed by 3-6 tight bullets ('- ...'). LOCKED slides: 1. Recommendation (the ask) 2. Value case (risk-adjusted, $ range with assumption) 3. Options considered & rationale 4. Risks & contract protections 5. Evidence basis & confidence 6. What is NOT yet decidable (tie to missing evidence: ticket volumes, AMS labor line, transition constraints, retained-org) 7. Decision & next steps. Board altitude: crisp, quantified, no fluff. ${RULES}`;
  const execrec_slides=await claude(execSys,`${EX}\n\nEVIDENCE:\n${BUN}`,2800);

  console.log('SE_BEGIN'+JSON.stringify({generated_at:new Date().toISOString(),exhibits:ex,source_register:reg,strategy_markdown,execrec_slides})+'SE_END');
  await db.end();
})().catch(e=>{console.log('SE_BEGIN'+JSON.stringify({fatal:String(e.stack||e.message||e).slice(0,500)})+'SE_END');process.exit(1);});

// ISSUED (vendor-facing) AMS RFP — disclosure-tiered, F100 legal/comms depth, 4-mode.
// HARD RULE: discloses scope, required SLA TARGETS, AGGREGATE estate/volumes/environment,
// and the pricing TEMPLATE to bid. NEVER discloses incumbent vendor names, contract $,
// total spend, credit-at-risk, should-cost, or leverage (those stay in the internal pack).
const { Client } = require('pg');
const { DefaultAzureCredential } = require('@azure/identity');
const ENDPOINT=`https://${process.env.AZURE_SEARCH_SERVICE_NAME}.search.windows.net`, INDEX='tenant-context-v1', API='2024-07-01';
const TENANT='skyharbor-air', MODEL=process.env.NEXUS_COMPOSER_MODEL||'claude-opus-4-8', AK=process.env.ANTHROPIC_API_KEY;
const cred=new DefaultAzureCredential(process.env.AZURE_CLIENT_ID?{managedIdentityClientId:process.env.AZURE_CLIENT_ID}:undefined);
let TK=null; const auth=async()=>{ if(!TK||TK.expiresOnTimestamp-Date.now()<60000) TK=await cred.getToken('https://search.azure.com/.default'); return `Bearer ${TK.token}`; };
async function claude(sys,user,mt){ const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':AK,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:MODEL,max_tokens:mt,system:sys,messages:[{role:'user',content:user}]})}); const t=await r.text(); if(!r.ok)return '(model error '+r.status+': '+t.slice(0,200)+')'; return (JSON.parse(t).content||[]).map(c=>c.text||'').join(''); }
// F100 issued-RFP section set with modes + disclosure
const SECTIONS=[
 {n:1,title:'Confidentiality Notice & Legal Disclaimers',mode:'AUTO-TEMPLATE'},
 {n:2,title:'Introduction & Background',mode:'AUTO-GOVERNED+ELICIT',intake:['Public-safe company background paragraph & the strategic objective for this RFP']},
 {n:3,title:'Communications Protocol & Single Point of Contact',mode:'AUTO-TEMPLATE+ELICIT',intake:['Designated contact + submission portal; Q&A close date; no-contact/blackout dates']},
 {n:4,title:'Procurement Timeline & Milestones',mode:'ELICIT',intake:['Issue, Q&A close, response due, orals, award, transition-start dates']},
 {n:5,title:'Instructions to Bidders & Proposal Format',mode:'AUTO-TEMPLATE',},
 {n:6,title:'Scope of Services by Tower',mode:'AUTO-GOVERNED+ELICIT',intake:['Per tower: in-scope / out-of-scope / retained in-house; single- vs multi-tower award intent']},
 {n:7,title:'Current-State Context (de-identified, aggregate)',mode:'AUTO-GOVERNED+ELICIT',intake:['12-month ticket/incident volumes by tower & priority (L1/L2/L3; P1-P4)']},
 {n:8,title:'Service-Level Requirements (target SLAs & credit framework)',mode:'AUTO-GOVERNED+CLIENT-COMPLETE',client:'Final target SLA levels, at-risk credit %, earn-back & chronic-breach policy (client/legal)'},
 {n:9,title:'Resource-Unit & Pricing Schedule (to bid)',mode:'AUTO-TEMPLATE+ELICIT',intake:['Staffing baseline (FTE by tower, onshore/offshore mix); resource-unit volumes']},
 {n:10,title:'Productivity & Automation Requirements',mode:'ELICIT',intake:['Required productivity glide-path Y1-Y3 (%) and gainshare stance']},
 {n:11,title:'Transition & Knowledge Transfer Requirements',mode:'ELICIT',intake:['Transition constraints: blackout windows, parallel-run, KT, incumbent-cooperation, go-live']},
 {n:12,title:'Retained Organization & Governance Model',mode:'ELICIT+CLIENT-COMPLETE',intake:['Functions retained in-house + target retained headcount'],client:'Governance operating model & cadence'},
 {n:13,title:'Security, Compliance & Data Protection',mode:'CLIENT-COMPLETE+AUTO-TEMPLATE',client:'Required frameworks (SOC2/ISO/PCI/airline), data residency, background-check standard, DPA terms'},
 {n:14,title:'Business Continuity & Disaster Recovery',mode:'AUTO-TEMPLATE+CLIENT-COMPLETE',client:'RTO/RPO requirements per tier'},
 {n:15,title:'Commercial Terms & Sample Agreement',mode:'AUTO-TEMPLATE+CLIENT-COMPLETE',client:'Liability cap, indemnification, insurance limits, audit rights, exit/termination assistance, IP, governing law — legal sign-off'},
 {n:16,title:'Subcontracting & Supplier Diversity',mode:'CLIENT-COMPLETE',client:'Diversity/subcontracting targets & certifications required'},
 {n:17,title:'Evaluation Methodology & Criteria',mode:'AUTO-TEMPLATE+CLIENT-COMPLETE',client:'Final criteria weights, disqualifiers, minimum qualifications'},
 {n:18,title:'Mandatory Forms & Exhibits',mode:'AUTO-TEMPLATE',},
 {n:19,title:'Definitions & Glossary',mode:'AUTO-TEMPLATE'},
];
(async()=>{
  const db=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}); await db.connect();
  const pivot=async(rt)=>(await db.query(`select r.id, jsonb_object_agg(f.fact_key,f.fact_value->>'value') fields from enterprise_context_records r join enterprise_context_facts f on f.record_id=r.id and f.lifecycle_state='active' where r.tenant_key=$1 and r.record_type=$2 and r.lifecycle_state='active' group by r.id`,[TENANT,rt])).rows.map(x=>x.fields);
  const apps=await pivot('cmdb_application'); const sla=await pivot('service_level'); const infra=await pivot('configuration_item'); const inc=await pivot('incidents_ops_telemetry');
  const cnt=(arr,k)=>arr.reduce((m,a)=>{const v=a[k]||'?';m[v]=(m[v]||0)+1;return m;},{});
  // AGGREGATE, vendor-facing ONLY — no $ , no vendor names
  const estate={total_apps:apps.length, by_criticality:cnt(apps,'criticality'), by_deployment:cnt(apps,'deployment_model'), by_function:cnt(apps,'business_function')};
  const towers=[...new Set(sla.map(s=>s.tower))].filter(Boolean);
  // required SLA TARGETS only (distinct metric->target); NOT actuals/credits
  const targets={}; sla.forEach(s=>{ if(s.metric&&s.target) targets[s.metric]=s.target; });
  const env={by_asset_class:cnt(infra,'asset_class')}; // platforms/tech, de-identified
  const incidents={by_severity:cnt(inc,'severity'), total:inc.length};
  const EX=`AGGREGATE CURRENT-STATE (vendor-facing, de-identified — NO spend, NO vendor names):
- Application estate: ${estate.total_apps} apps. By criticality: ${JSON.stringify(estate.by_criticality)}. By deployment: ${JSON.stringify(estate.by_deployment)}.
- Service towers (${towers.length}): ${towers.join(', ')}.
- Required SLA targets (going-forward requirements): ${JSON.stringify(targets)}.
- Infrastructure/environment (technology, de-identified): ${JSON.stringify(env.by_asset_class)}.
- Ops volume signal: ${incidents.total} incidents in sample by severity ${JSON.stringify(incidents.by_severity)}.`;
  const sectionDirectives=SECTIONS.map(s=>`${s.n}. ${s.title} — MODE: ${s.mode}.${s.intake?' ELICIT: '+s.intake.join(' | '):''}${s.client?' CLIENT-COMPLETE: '+s.client:''}`).join('\n');
  const SYS=`You are AbarVa Sentinel + Nexus drafting an ISSUABLE, Fortune-100-grade AMS Request for Proposal for SkyHarbor Air, to be sent to external bidders. Output professional MARKDOWN.
CRITICAL DISCLOSURE RULE (non-negotiable): This document goes to VENDORS. You must NOT disclose incumbent vendor names, any contract values, total IT/AMS spend, SLA credit-at-risk amounts, should-cost, savings targets, or any negotiating leverage. Refer to incumbents only generically ("the incumbent(s)", "current providers"). State required FUTURE SLA targets, not incumbent performance history. Use only the AGGREGATE current-state provided (counts, towers, targets, technology) so bidders can size — never spend.
FOUR-MODE model per section: AUTO-GOVERNED = from the AGGREGATE facts (no $); AUTO-TEMPLATE = rich professional standard boilerplate, begin with '_(Standard template — client/legal to review.)_'; ELICIT = '> 📋 **NEXUS INTAKE — required to finalize:**' + the listed questions + '(draft pending intake)' skeleton; CLIENT-COMPLETE = '> ✍️ **CLIENT TO COMPLETE:**' + the decision + a template skeleton.
Depth: this must read like a real F100/government RFP — thorough legal, communications protocol, evaluation methodology, commercial/contract terms, security & compliance. Each section starts with a one-line purpose. Professional, neutral, issuable tone (not an advisory memo).`;
  const USER=`Draft the ISSUED AMS RFP, sections in order, each applying its MODE:\n${sectionDirectives}\n\n${EX}`;
  const body=await claude(SYS,USER,8000);
  const tally={auto_governed:0,auto_template:0,elicit:0,client_complete:0};
  SECTIONS.forEach(s=>{if(/AUTO-GOVERNED/.test(s.mode))tally.auto_governed++;if(/AUTO-TEMPLATE/.test(s.mode))tally.auto_template++;if(/ELICIT/.test(s.mode))tally.elicit++;if(/CLIENT-COMPLETE/.test(s.mode))tally.client_complete++;});
  const intake_pack=SECTIONS.filter(s=>s.intake).map(s=>({section:s.n+'. '+s.title,questions:s.intake}));
  const client_items=SECTIONS.filter(s=>s.client).map(s=>({section:s.n+'. '+s.title,decision:s.client}));
  console.log('ISS_BEGIN'+JSON.stringify({model:MODEL,generated_at:new Date().toISOString(),disclosure:'vendor_facing_aggregate_only',tally,sections:SECTIONS.map(s=>({n:s.n,title:s.title,mode:s.mode})),intake_pack,client_items,rfp_markdown:body,aggregate_exhibits:{estate,towers,targets,env,incidents}})+'ISS_END');
  await db.end();
})().catch(e=>{console.log('ISS_BEGIN'+JSON.stringify({fatal:String(e.stack||e.message||e).slice(0,500)})+'ISS_END');process.exit(1);});

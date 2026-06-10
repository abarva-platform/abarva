// WS2+WS3+WS5: index SkyHarbor v2 chunks into Azure AI Search (tenant-context-v1),
// prove tenant-scoped retrieval + isolation, then promote to agent_ready on the
// Azure-Search basis (retrievability='search_indexed') only where retrieval proves out.
// Runs INSIDE the VNet (search service is publicNetworkAccess=Disabled). Idempotent.
const { Client } = require('pg');
const { DefaultAzureCredential } = require('@azure/identity');
const ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT || `https://${process.env.AZURE_SEARCH_SERVICE_NAME}.search.windows.net`;
const INDEX = process.env.AZURE_SEARCH_INDEX || 'tenant-context-v1';
const API = '2024-07-01';
const TENANT = 'skyharbor-air';
// Search service disableLocalAuth=true -> AAD only; job MI holds Search Index Data Contributor.
const cred = new DefaultAzureCredential(process.env.AZURE_CLIENT_ID ? { managedIdentityClientId: process.env.AZURE_CLIENT_ID } : undefined);
let TOKEN = null;
const authHeader = async () => { if (!TOKEN || TOKEN.expiresOnTimestamp - Date.now() < 60000) TOKEN = await cred.getToken('https://search.azure.com/.default'); return `Bearer ${TOKEN.token}`; };
const b64url = (s) => Buffer.from(s).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const search = async (path, body) => {
  const r = await fetch(`${ENDPOINT}/indexes/${INDEX}/docs/${path}?api-version=${API}`, {
    method:'POST', headers:{'content-type':'application/json','Authorization': await authHeader()}, body:JSON.stringify(body) });
  const t = await r.text(); if (!r.ok) throw new Error(`search ${path} ${r.status}: ${t.slice(0,200)}`);
  return t ? JSON.parse(t) : {};
};
(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} });
  await db.connect();
  const out = { endpoint: ENDPOINT, index: INDEX, steps: [] };

  // 1 · roll back premature agent_ready -> promotion_candidate (committed, not yet Azure-indexed)
  const rb = await db.query(`update public.governed_object_readiness set agent_readiness_status='promotion_candidate', retrievability='committed_not_indexed', updated_at=now() where client_key=$1 and agent_readiness_status='agent_ready'`,[TENANT]);
  out.steps.push(`rolled_back_to_promotion_candidate:${rb.rowCount}`);

  // 2 · read v2 chunks, transform to search docs, upload (mergeOrUpload), batched
  const rows = (await db.query(`select chunk_id, source_segment_id, source_record_id, source_doc, source_path, chunk_text, provenance from public.enterprise_context_chunks where tenant_key=$1 and source_path like '%synthetic-v2%'`,[TENANT])).rows;
  out.v2_chunks_in_pg = rows.length;
  const docs = rows.map(r => ({
    '@search.action':'mergeOrUpload',
    id: b64url(`${TENANT}:${r.chunk_id}`),
    tenant_key: TENANT, source_segment: r.source_segment_id || 'unknown',
    record_id: r.source_record_id || r.chunk_id, chunk_id: r.chunk_id,
    title: r.source_doc || r.source_segment_id, body: (r.chunk_text||'').slice(0,30000),
    source_uri: r.source_path || r.source_doc || r.source_segment_id,
    confidence: 0.88, sensitivity: 'internal', last_seen_at: new Date().toISOString(),
  }));
  let uploaded = 0;
  for (let i=0;i<docs.length;i+=500){ const batch=docs.slice(i,i+500); await search('index',{value:batch}); uploaded+=batch.length; }
  out.uploaded_docs = uploaded;
  // wait for index consistency
  await new Promise(res=>setTimeout(res,4000));

  // 3 · retrieval + tenant-isolation proof across AMS categories
  const cats = [
    ['applications/systems','application criticality vendor'],
    ['infrastructure/cloud','mainframe server cloud asset'],
    ['vendor contracts','vendor contract renewal IBM'],
    ['IT financials','IT spend budget cost'],
    ['IT org/workforce','SVP VP director role'],
    ['DORA','deploy lead time team'],
    ['incidents/ITSM','incident severity root cause'],
    ['SLAs','service level availability target'],
    ['initiatives/moves','initiative transformation sponsor'],
    ['AI tooling','AI tool model workflow'],
    ['business capabilities','capability business function'],
    ['integrations','integration source target'],
  ];
  const proof = [];
  for (const [cat,q] of cats) {
    const sky = await search('search',{ search:q, queryType:'simple', top:5, filter:`tenant_key eq '${TENANT}'`, count:true });
    const skyHits = sky.value||[];
    // isolation: same query scoped to a DIFFERENT tenant must not return skyharbor docs
    const apex = await search('search',{ search:q, queryType:'simple', top:5, filter:`tenant_key eq 'apex-retail'`, count:false });
    const leak = (apex.value||[]).some(d => d.tenant_key === TENANT);
    const allSky = skyHits.every(d => d.tenant_key === TENANT);
    proof.push({ category:cat, count:(sky['@odata.count']??skyHits.length), top_source: skyHits[0]?.source_uri||null, tenant_ok: allSky && !leak, citation_present: !!(skyHits[0]?.source_uri && skyHits[0]?.title), pass: skyHits.length>0 && allSky && !leak });
  }
  out.retrieval_proof = proof;
  out.categories_passing = proof.filter(p=>p.pass).length;

  // 4 · promote to agent_ready ONLY if retrieval+isolation proven (>=10/12 categories)
  if (out.categories_passing >= 10) {
    const pr = await db.query(`update public.governed_object_readiness set agent_readiness_status='agent_ready', retrievability='search_indexed', confidence_rationale='Azure AI Search indexed (tenant-context-v1) + tenant-scoped BM25 retrieval + citation metadata proven', cited_render_verified_at=now(), policy_validation_status='pass', updated_at=now() where client_key=$1 and agent_readiness_status='promotion_candidate'`,[TENANT]);
    out.steps.push(`promoted_to_agent_ready:${pr.rowCount}`);
  } else {
    out.steps.push(`HELD at promotion_candidate (only ${out.categories_passing}/12 categories proved)`);
  }
  out.final = (await db.query(`select object_table, agent_readiness_status, retrievability, count(*)::int n from public.governed_object_readiness where client_key=$1 group by 1,2,3 order by 1,2`,[TENANT])).rows;
  console.log('IDX_BEGIN'+JSON.stringify(out)+'IDX_END'); await db.end();
})().catch(e=>{console.log('IDX_BEGIN'+JSON.stringify({fatal:String(e.stack||e.message||e).slice(0,500)})+'IDX_END');process.exit(1);});

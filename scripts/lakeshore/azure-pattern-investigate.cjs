/* Investigate Lakeshore pattern corpus: do treasury/Kyriba patterns exist, and
 * what is PAT-LSH-D18-00479? Runs in VNet (MI for Search; DB for genome_patterns). */
(async () => {
  const pg = require('pg');
  const { ManagedIdentityCredential } = require('@azure/identity');
  const cred = new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID);
  const L = (k, v) => console.log('PI ' + k + ' ' + JSON.stringify(v).slice(0, 900));
  const E = (k, e) => console.log('PIERR ' + k + ' ' + String((e && e.message) || e).slice(0, 200));
  const EP = (process.env.AZURE_SEARCH_ENDPOINT || 'https://srch-abarva-context-lab-eastus.search.windows.net').replace(/\/$/, '');
  const INDEX = process.env.LAKESHORE_CORPUS_SEARCH_INDEX || 'lakeshore-patterns-v1';

  // ---- Azure AI Search: schema + treasury/kyriba queries + id lookup ----
  try {
    const tok = (await cred.getToken('https://search.azure.com/.default')).token;
    const hdr = { 'content-type': 'application/json', authorization: 'Bearer ' + tok };
    const schema = await (await fetch(`${EP}/indexes/${INDEX}?api-version=2024-07-01`, { headers: hdr })).json();
    const fields = (schema.fields || []).map((f) => f.name);
    L('search_fields', fields);
    const total = await (await fetch(`${EP}/indexes/${INDEX}/docs/$count?api-version=2024-07-01`, { headers: hdr })).text();
    L('search_total', total);
    const sel = fields.filter((f) => /pattern_id|title|name|domain|vertical|function|tenant|category|code/i.test(f)).join(',') || 'pattern_id,title';
    for (const q of ['Kyriba treasury', 'corporate treasury payments factory', 'cash liquidity management', 'bank connectivity ISO20022', 'treasury management system']) {
      const r = await fetch(`${EP}/indexes/${INDEX}/docs/search?api-version=2024-07-01`, { method: 'POST', headers: hdr, body: JSON.stringify({ search: q, top: 4, count: true, select: sel }) });
      const j = await r.json();
      L('q:' + q, { count: j['@odata.count'], hits: (j.value || []).map((x) => ({ id: x.pattern_id || x.code || x.id, title: (x.title || x.name || '').slice(0, 70), score: Math.round((x['@search.score'] || 0) * 100) / 100 })) });
    }
    // lookup the specific pattern
    const look = await fetch(`${EP}/indexes/${INDEX}/docs/search?api-version=2024-07-01`, { method: 'POST', headers: hdr, body: JSON.stringify({ search: 'PAT-LSH-D18-00479', top: 3, select: sel }) });
    L('lookup_00479', ((await look.json()).value || []).map((x) => ({ id: x.pattern_id || x.code || x.id, title: (x.title || x.name || '').slice(0, 90) })));
  } catch (e) { E('search', e); }

  // ---- Postgres genome_patterns ----
  try {
    const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await c.connect();
    const exists = (await c.query("select to_regclass('public.genome_patterns') t")).rows[0].t;
    L('genome_table', exists);
    if (exists) {
      const cols = (await c.query("select column_name from information_schema.columns where table_name='genome_patterns' order by ordinal_position")).rows.map((r) => r.column_name);
      L('genome_cols', cols);
      L('genome_total', (await c.query("select count(*)::int n from genome_patterns")).rows[0].n);
      // domain/vertical distribution if such a column exists
      const domCol = cols.find((c2) => /vertical|domain|industry|function|category|pack/i.test(c2));
      if (domCol) L('genome_by_' + domCol, (await c.query(`select "${domCol}" d, count(*)::int n from genome_patterns group by 1 order by n desc limit 15`)).rows);
      const nameCol = cols.find((c2) => /name|title/i.test(c2)) || 'name';
      const codeCol = cols.find((c2) => /^code$|pattern_id|slug/i.test(c2)) || 'code';
      L('genome_treasury_kyriba_count', (await c.query(`select count(*)::int n from genome_patterns where "${nameCol}" ilike '%treasury%' or "${nameCol}" ilike '%kyriba%' or "${nameCol}" ilike '%payment%'`)).rows[0].n);
      L('genome_treasury_samples', (await c.query(`select "${codeCol}" code, "${nameCol}" name from genome_patterns where "${nameCol}" ilike '%treasury%' or "${nameCol}" ilike '%kyriba%' limit 8`)).rows);
      L('genome_00479', (await c.query(`select "${codeCol}" code, "${nameCol}" name from genome_patterns where "${codeCol}"='PAT-LSH-D18-00479'`)).rows);
      // is there a lakeshore tenant/source filter column?
      const lshCol = cols.find((c2) => /tenant|client|source_key|vertical/i.test(c2));
      if (lshCol) L('genome_lakeshore_scope', (await c.query(`select "${lshCol}" s, count(*)::int n from genome_patterns group by 1 order by n desc limit 12`)).rows);
    }
    await c.end();
  } catch (e) { E('genome', e); }
  console.log('PI_DONE');
  setInterval(() => {}, 1 << 30);
})().catch((e) => { console.log('PI_FATAL ' + String((e && e.message) || e).slice(0, 300)); setInterval(() => {}, 1 << 30); });

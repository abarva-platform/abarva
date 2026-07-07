/*
 * Read-only corpus DB + Azure Search verification. Runs in the private Azure
 * VNet runtime (managed identity; Postgres resolves privately). NO mutations,
 * NO secrets printed. Confirms which DB the runtime reads and the live pattern
 * inventory, to settle whether PAT-LSH-D18-00479 is real or phantom.
 */
(async () => {
  const pg = require('pg');
  const { ManagedIdentityCredential } = require('@azure/identity');
  const cred = new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID);
  const L = (k, v) => console.log('CV ' + k + ' ' + JSON.stringify(v).slice(0, 950));
  const E = (k, e) => console.log('CVERR ' + k + ' ' + String((e && e.message) || e).slice(0, 220));

  // Parse host/db from a connection string WITHOUT exposing credentials.
  const safe = (u) => {
    if (!u) return null;
    try { const x = new URL(u); return { host: x.hostname, port: x.port || '5432', db: (x.pathname || '').replace(/^\//, '') }; }
    catch { return { unparsed: true }; }
  };
  L('env_presence', {
    DATABASE_URL: !!process.env.DATABASE_URL, DATABASE_URL_target: safe(process.env.DATABASE_URL),
    ABARVA_AZURE_DATABASE_URL: !!process.env.ABARVA_AZURE_DATABASE_URL, ABARVA_AZURE_DATABASE_URL_target: safe(process.env.ABARVA_AZURE_DATABASE_URL),
    ALLOW_LEGACY_SUPABASE_CORPUS: process.env.ALLOW_LEGACY_SUPABASE_CORPUS || null,
  });

  // The corpus helper (post-#3231) prefers ABARVA_AZURE_DATABASE_URL, else DATABASE_URL.
  const conn = process.env.ABARVA_AZURE_DATABASE_URL || process.env.DATABASE_URL;
  L('corpus_conn_source', process.env.ABARVA_AZURE_DATABASE_URL ? 'ABARVA_AZURE_DATABASE_URL' : 'DATABASE_URL(fallback)');

  const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const idn = (await c.query("select current_database() db, current_user usr, inet_server_addr()::text addr, inet_server_port() port, version() ver")).rows[0];
  L('db_identity', { db: idn.db, user: idn.usr, server_addr: idn.addr, port: idn.port, version: (idn.ver || '').slice(0, 40) });
  L('search_path', (await c.query("show search_path")).rows[0].search_path);
  L('databases_on_server', (await c.query("select datname from pg_database where datistemplate=false order by datname")).rows.map((r) => r.datname));

  // corpus_patterns
  const cpExists = (await c.query("select to_regclass('public.corpus_patterns') t")).rows[0].t;
  L('corpus_patterns_table', cpExists);
  if (cpExists) {
    L('corpus_patterns_total', (await c.query("select count(*)::int n from corpus_patterns")).rows[0].n);
    const cols = (await c.query("select column_name from information_schema.columns where table_name='corpus_patterns'")).rows.map((r) => r.column_name);
    const nameCol = cols.find((x) => /name|title/i.test(x)) || 'name';
    const codeCol = cols.find((x) => /^code$|pattern_id|slug|^id$/i.test(x)) || 'id';
    L('corpus_patterns_treasury', (await c.query(`select count(*)::int n from corpus_patterns where "${nameCol}" ilike '%treasury%' or "${nameCol}" ilike '%kyriba%' or "${nameCol}" ilike '%payment%'`)).rows[0].n);
    L('corpus_patterns_00479', (await c.query(`select "${codeCol}" code, "${nameCol}" name from corpus_patterns where "${codeCol}"::text='PAT-LSH-D18-00479'`).catch(() => ({ rows: ['query-failed'] }))).rows);
  }

  // genome_patterns
  const gExists = (await c.query("select to_regclass('public.genome_patterns') t")).rows[0].t;
  L('genome_patterns_table', gExists);
  if (gExists) {
    L('genome_total', (await c.query("select count(*)::int n from genome_patterns")).rows[0].n);
    L('genome_by_vertical', (await c.query("select vertical, count(*)::int n from genome_patterns group by 1 order by n desc")).rows);
    L('genome_lakeshore_holdco', (await c.query("select count(*)::int n from genome_patterns where vertical ilike '%holdco%' or vertical ilike '%diversified%'")).rows[0].n);
    L('genome_treasury_kyriba', (await c.query("select count(*)::int n from genome_patterns where name ilike '%treasury%' or name ilike '%kyriba%' or name ilike '%payment%' or code ilike '%TMS%'")).rows[0].n);
    L('genome_00479', (await c.query("select code, name from genome_patterns where code='PAT-LSH-D18-00479'")).rows);
    L('genome_lsh_tms_all', (await c.query("select code, left(name,70) name from genome_patterns where code ilike 'LSH-TMS%' order by code")).rows);
    L('genome_kyriba_best', (await c.query("select code, left(name,70) name from genome_patterns where (name ilike '%kyriba%' or name ilike '%bank connect%' or name ilike '%payment%') order by code limit 5")).rows);
  }
  await c.end();

  // Azure Search cross-check
  try {
    const tok = (await cred.getToken('https://search.azure.com/.default')).token;
    const EP = (process.env.AZURE_SEARCH_ENDPOINT || 'https://srch-abarva-context-lab-eastus.search.windows.net').replace(/\/$/, '');
    const hdr = { authorization: 'Bearer ' + tok, 'content-type': 'application/json' };
    const idxList = ((await (await fetch(`${EP}/indexes?api-version=2024-07-01&$select=name`, { headers: hdr })).json()).value || []).map((x) => x.name);
    L('search_indexes', idxList);
    for (const idx of ['lakeshore-patterns-v1', 'corpus-global', 'industry-corpus-v1']) {
      if (!idxList.includes(idx)) continue;
      const cnt = await (await fetch(`${EP}/indexes/${idx}/docs/$count?api-version=2024-07-01`, { headers: hdr })).text();
      L('search_count:' + idx, cnt);
    }
    const q = await (await fetch(`${EP}/indexes/lakeshore-patterns-v1/docs/search?api-version=2024-07-01`, { method: 'POST', headers: hdr, body: JSON.stringify({ search: 'Kyriba treasury modernization rollout', top: 5, count: true, select: 'pattern_id,title,domain' }) })).json();
    L('search_kyriba_sample', { count: q['@odata.count'], hits: (q.value || []).map((x) => ({ id: x.pattern_id, title: (x.title || '').slice(0, 70) })) });
    const look = await (await fetch(`${EP}/indexes/lakeshore-patterns-v1/docs/search?api-version=2024-07-01`, { method: 'POST', headers: hdr, body: JSON.stringify({ search: '"PAT-LSH-D18-00479"', searchMode: 'all', top: 3, select: 'pattern_id,title' }) })).json();
    L('search_00479_exact', (look.value || []).map((x) => x.pattern_id));
  } catch (e) { E('search', e); }

  console.log('CV_DONE');
  setInterval(() => {}, 1 << 30);
})().catch((e) => { console.log('CV_FATAL ' + String((e && e.message) || e).slice(0, 300)); setInterval(() => {}, 1 << 30); });

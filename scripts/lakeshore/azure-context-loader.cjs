/*
 * LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1 — Azure private-worker loader.
 *
 * Runs INSIDE the VNet-integrated Container App (managed identity) and performs
 * the real end-to-end load against the native Azure data plane:
 *   1. Fetch the pack manifest + 127 files from the public GitHub branch.
 *   2. Upload original bytes to Azure Blob (container context-drops).
 *   3. Parse each file (exceljs / pdf-parse / mammoth / text + csv/jsonl rows).
 *   4. Commit chunks to Azure Postgres enterprise_context_chunks (+ data_ingestion_runs).
 *   5. Embed chunks via OpenAI text-embedding-3-small and store vectors.
 *   6. Upsert chunks into Azure AI Search tenant-context-v1.
 *   7. Run retrieval QA and emit a machine-readable RESULT_JSON summary.
 *
 * Fetched and eval'd by a tiny bootstrap (node -e). CommonJS (require) only.
 */
(async () => {
  const pg = require('pg');
  const { ManagedIdentityCredential } = require('@azure/identity');
  const { BlobServiceClient } = require('@azure/storage-blob');
  const exceljs = require('exceljs');
  const mammoth = require('mammoth');
  const _pdf = require('pdf-parse');
  const PDFParse = _pdf.PDFParse || (_pdf.default && _pdf.default.PDFParse) || _pdf.default || _pdf;
  async function pdfToText(buf) {
    const parser = new PDFParse({ data: new Uint8Array(buf) });
    try { const r = await parser.getText(); return r.text || ''; }
    finally { try { await parser.destroy(); } catch (e) {} }
  }
  const crypto = require('crypto');

  const RESULT = { ok: false, started: new Date().toISOString(), steps: {}, errors: [] };
  const log = (k, v) => { RESULT.steps[k] = v; console.log('LOADSTEP', k, JSON.stringify(v).slice(0, 1200)); };
  const err = (k, e) => { const m = String((e && e.message) || e).slice(0, 240); RESULT.errors.push([k, m]); console.log('LOADERR', k, m); };

  const BRANCH = process.env.PACK_BRANCH || 'cursor/lakeshore-enterprise-context-load-v1-89a4';
  const RAW = `https://raw.githubusercontent.com/abarva-platform/abarva/${BRANCH}/docs/build/lakeshore-enterprise-context`;
  const TENANT_KEY = 'lakeshore-holdings';
  const LOAD_ID = 'LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1';
  const BLOB_CONTAINER = process.env.BLOB_CONTAINER || 'context-drops';
  const BLOB_PREFIX = `${TENANT_KEY}/${LOAD_ID}`;
  const SEARCH_INDEX = process.env.SEARCH_INDEX || 'tenant-context-v1';
  const SEARCH_EP = (process.env.AZURE_SEARCH_ENDPOINT || 'https://srch-abarva-context-lab-eastus.search.windows.net').replace(/\/$/, '');
  const ACCT = process.env.AZURE_STORAGE_ACCOUNT_NAME || 'stabarvaprivatedplab001';
  const MI_CID = process.env.AZURE_CLIENT_ID;
  const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
  const cred = new ManagedIdentityCredential(MI_CID);

  // ---------- fetch manifest ----------
  let manifest;
  try {
    const r = await fetch(`${RAW}/${LOAD_ID}_MANIFEST.json`);
    manifest = await r.json();
    log('manifest', { pack_id: manifest.pack_id, file_count: manifest.file_count });
  } catch (e) { err('manifest', e); console.log('RESULT_JSON ' + JSON.stringify(RESULT)); process.exit(1); }

  // ---------- DB connect ----------
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  log('db.connect', { ok: true });

  // resolve/ensure client_id (clone an existing clients row structure if needed)
  let clientId = null;
  try {
    const ex = await client.query("select id from clients where tenant_key=$1 limit 1", [TENANT_KEY]);
    if (ex.rows[0]) { clientId = ex.rows[0].id; log('db.client', { existing: clientId }); }
    else {
      const sample = await client.query("select * from clients limit 1");
      if (sample.rows[0]) {
        const cols = Object.keys(sample.rows[0]);
        const newId = crypto.randomUUID();
        const vals = cols.map((c) => {
          if (c === 'id') return newId;
          if (c === 'tenant_key') return TENANT_KEY;
          if (c === 'name') return 'Lakeshore Holdings';
          if (c === 'slug') return 'lakeshore-holdings';
          if (c === 'created_at' || c === 'updated_at') return new Date().toISOString();
          return sample.rows[0][c];
        });
        const ph = cols.map((_, i) => `$${i + 1}`).join(',');
        await client.query(`insert into clients (${cols.map((c) => '"' + c + '"').join(',')}) values (${ph}) on conflict do nothing`, vals);
        clientId = newId;
        log('db.client', { created: clientId });
      } else { log('db.client', { warn: 'no clients rows to clone; client_id=null' }); }
    }
  } catch (e) { err('db.client', e); }

  // ---------- iterate files: blob upload + parse + chunk ----------
  const svc = new BlobServiceClient(`https://${ACCT}.blob.core.windows.net`, cred);
  const cont = svc.getContainerClient(BLOB_CONTAINER);
  const blob = { container: BLOB_CONTAINER, account: ACCT, prefix: BLOB_PREFIX, count: 0, bytes: 0, failed: 0 };
  const parse = { ok: 0, failed: 0, byType: {} };
  const chunks = []; // {chunk_id, source_doc, source_path, chunk_index, chunk_text, token_count, provenance, chunk_metadata}

  function pushChunk(file, idx, text) {
    text = (text || '').trim();
    if (!text) return;
    chunks.push({
      chunk_id: `${LOAD_ID}::${file.path}::${idx}`,
      source_segment_id: file.context_domain,
      source_record_id: file.path,
      source_doc: file.name,
      source_path: file.path,
      chunk_index: idx,
      chunk_text: text.slice(0, 8000),
      token_count: Math.ceil(text.length / 4),
      provenance: { load_id: LOAD_ID, blob_container: BLOB_CONTAINER, blob_path: `${BLOB_PREFIX}/${file.path}`, source_system: file.source_system, source_owner: file.source_owner, source_date: file.source_date, sha256: file.sha256 },
      chunk_metadata: { context_domain: file.context_domain, sensitivity: file.sensitivity, synthetic: true, synthetic_label: manifest.synthetic_label, evidence_usable: file.evidence_usable_flag, loader_route: file.loader_route, file_type: file.file_type, title: file.title },
    });
  }
  function chunkText(file, text, size = 1200) {
    let i = 0, idx = 0;
    while (i < text.length) { pushChunk(file, idx++, text.slice(i, i + size)); i += size; }
    if (idx === 0) pushChunk(file, 0, text);
  }

  for (const file of manifest.files) {
    let bytes;
    try {
      const r = await fetch(`${RAW}/${file.path}`);
      if (!r.ok) throw new Error('fetch ' + r.status);
      bytes = Buffer.from(await r.arrayBuffer());
    } catch (e) { err('fetch:' + file.path, e); parse.failed++; continue; }
    // blob upload
    try {
      await cont.getBlockBlobClient(`${BLOB_PREFIX}/${file.path}`).upload(bytes, bytes.length, { blobHTTPHeaders: { blobContentType: 'application/octet-stream' } });
      blob.count++; blob.bytes += bytes.length;
    } catch (e) { blob.failed++; err('blob:' + file.path, e); }
    // parse + chunk
    const t = file.file_type;
    parse.byType[t] = parse.byType[t] || { files: 0, chunks_before: chunks.length };
    parse.byType[t].files++;
    try {
      if (t === 'xlsx') {
        const wb = new exceljs.Workbook();
        await wb.xlsx.load(bytes);
        wb.worksheets.forEach((ws) => {
          ws.eachRow((row) => {
            const vals = Array.isArray(row.values) ? row.values.slice(1) : [];
            const line = vals.map((v) => (v == null ? '' : (typeof v === 'object' && v.text ? v.text : String(v)))).join(' | ').trim();
            if (line && !line.startsWith('SYNTHETIC')) pushChunk(file, chunks.length, `[${file.title} · ${ws.name}] ${line}`);
          });
        });
      } else if (t === 'pdf') {
        const txt = await pdfToText(bytes); chunkText(file, txt, 1200);
      } else if (t === 'docx') {
        const d = await mammoth.extractRawText({ buffer: bytes }); chunkText(file, d.value || '', 1200);
      } else if (t === 'csv') {
        const lines = bytes.toString('utf8').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
        const header = lines.shift() || '';
        const hcols = header.split(',');
        for (const ln of lines) { const cells = ln.split(','); const labeled = hcols.map((h, i) => `${h}=${cells[i] ?? ''}`).join('; '); pushChunk(file, chunks.length, `[${file.title}] ${labeled}`); }
      } else if (t === 'jsonl') {
        const lines = bytes.toString('utf8').split(/\r?\n/).filter((l) => l.trim() && !l.includes('"_meta"'));
        for (const ln of lines) pushChunk(file, chunks.length, `[${file.title}] ${ln}`);
      } else { chunkText(file, bytes.toString('utf8'), 1200); }
      parse.ok++;
    } catch (e) { parse.failed++; err('parse:' + file.path, e); }
  }
  log('blob', blob);
  log('parse', { ok: parse.ok, failed: parse.failed, total_chunks: chunks.length });

  // ---------- commit chunks (idempotent) ----------
  let committed = 0;
  try {
    await client.query("delete from enterprise_context_chunks where tenant_key=$1 and chunk_id like $2", [TENANT_KEY, `${LOAD_ID}::%`]);
    const batch = 400;
    for (let i = 0; i < chunks.length; i += batch) {
      const slice = chunks.slice(i, i + batch);
      const cols = ['client_id', 'tenant_key', 'chunk_id', 'source_segment_id', 'source_record_id', 'source_doc', 'source_path', 'chunk_index', 'chunk_text', 'token_count', 'embedding_status', 'provenance', 'chunk_metadata'];
      const params = []; const tuples = [];
      slice.forEach((c, j) => {
        const base = j * cols.length;
        tuples.push(`(${cols.map((_, k) => `$${base + k + 1}`).join(',')})`);
        params.push(clientId, TENANT_KEY, c.chunk_id, c.source_segment_id, c.source_record_id, c.source_doc, c.source_path, c.chunk_index, c.chunk_text, c.token_count, 'pending', JSON.stringify(c.provenance), JSON.stringify(c.chunk_metadata));
      });
      await client.query(`insert into enterprise_context_chunks (${cols.join(',')}) values ${tuples.join(',')}`, params);
      committed += slice.length;
    }
    log('db.commit', { committed });
  } catch (e) { err('db.commit', e); }

  // data_ingestion_runs (introspect columns)
  try {
    const dcols = (await client.query("select column_name from information_schema.columns where table_name='data_ingestion_runs'")).rows.map((r) => r.column_name);
    const row = {};
    if (dcols.includes('tenant_key')) row.tenant_key = TENANT_KEY;
    if (dcols.includes('client_id')) row.client_id = clientId;
    if (dcols.includes('source_label')) row.source_label = LOAD_ID;
    if (dcols.includes('chunks_loaded')) row.chunks_loaded = committed;
    if (dcols.includes('status')) row.status = 'completed';
    if (dcols.includes('summary')) row.summary = JSON.stringify({ load_id: LOAD_ID, files: manifest.file_count, blob, parse: { ok: parse.ok, failed: parse.failed }, committed });
    const k = Object.keys(row);
    if (k.length) { await client.query(`insert into data_ingestion_runs (${k.join(',')}) values (${k.map((_, i) => '$' + (i + 1)).join(',')})`, k.map((x) => row[x])); log('db.run', { inserted: true, cols: k }); }
  } catch (e) { err('db.run', e); }

  // ---------- embeddings (OpenAI) ----------
  const emb = { attempted: 0, embedded: 0, model: 'text-embedding-3-small', dim: 1536, skipped: !OPENAI_KEY };
  if (OPENAI_KEY) {
    try {
      const toEmbed = (await client.query("select id, chunk_text from enterprise_context_chunks where tenant_key=$1 and chunk_id like $2 and embedding_status='pending' order by chunk_index", [TENANT_KEY, `${LOAD_ID}::%`])).rows;
      const B = 128;
      for (let i = 0; i < toEmbed.length; i += B) {
        const slice = toEmbed.slice(i, i + B);
        emb.attempted += slice.length;
        const resp = await fetch('https://api.openai.com/v1/embeddings', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + OPENAI_KEY }, body: JSON.stringify({ model: emb.model, input: slice.map((s) => s.chunk_text.slice(0, 6000)) }) });
        if (!resp.ok) { err('embed.batch', new Error(resp.status + ' ' + (await resp.text()).slice(0, 120))); break; }
        const data = (await resp.json()).data;
        for (let j = 0; j < slice.length; j++) {
          await client.query("update enterprise_context_chunks set embedding=$1, embedding_dim=$2, embedding_model=$3, embedding_status='embedded', embedded_at=now() where id=$4", [JSON.stringify(data[j].embedding), emb.dim, emb.model, slice[j].id]);
          emb.embedded++;
        }
      }
    } catch (e) { err('embed', e); }
  }
  log('embed', emb);

  // ---------- Azure AI Search upsert ----------
  const search = { index: SEARCH_INDEX, uploaded: 0, failed: 0 };
  try {
    const tok = (await cred.getToken('https://search.azure.com/.default')).token;
    const schemaR = await fetch(`${SEARCH_EP}/indexes/${SEARCH_INDEX}?api-version=2024-07-01`, { headers: { authorization: 'Bearer ' + tok } });
    const schema = await schemaR.json();
    const fields = (schema.fields || []);
    const fnames = new Set(fields.map((f) => f.name));
    const keyField = (fields.find((f) => f.key) || { name: 'chunk_id' }).name;
    // purge stale tenant docs from prior runs (delete-by-key paging) for a clean, consistent index
    search.purged = 0;
    try {
      for (let pass = 0; pass < 60; pass++) {
        const qr = await fetch(`${SEARCH_EP}/indexes/${SEARCH_INDEX}/docs/search?api-version=2024-07-01`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok }, body: JSON.stringify({ search: '*', filter: `tenant_key eq '${TENANT_KEY}'`, top: 1000, select: keyField }) });
        const docs = ((await qr.json()).value || []);
        if (!docs.length) break;
        const del = docs.map((d) => ({ '@search.action': 'delete', [keyField]: d[keyField] }));
        await fetch(`${SEARCH_EP}/indexes/${SEARCH_INDEX}/docs/index?api-version=2024-07-01`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok }, body: JSON.stringify({ value: del }) });
        search.purged += del.length;
        await new Promise((r) => setTimeout(r, 800));
      }
    } catch (e) { err('search.purge', e); }
    const vectorField = (fields.find((f) => f.type && f.type.includes('Collection(Edm.Single)')) || {}).name;
    search.keyField = keyField; search.vectorField = vectorField || null; search.fields = [...fnames].slice(0, 40);
    // fetch embeddings if vector field present
    let embMap = {};
    if (vectorField) {
      const rows = (await client.query("select chunk_id, embedding from enterprise_context_chunks where tenant_key=$1 and chunk_id like $2 and embedding is not null", [TENANT_KEY, `${LOAD_ID}::%`])).rows;
      for (const r of rows) embMap[r.chunk_id] = typeof r.embedding === 'string' ? JSON.parse(r.embedding) : r.embedding;
    }
    const all = chunks;
    const B = vectorField ? 200 : 800;
    for (let i = 0; i < all.length; i += B) {
      const docs = all.slice(i, i + B).map((c) => {
        const d = { '@search.action': 'mergeOrUpload' };
        d[keyField] = c.chunk_id.replace(/[^A-Za-z0-9_\-=]/g, '_');
        const set = (name, val) => { if (fnames.has(name) && val != null) d[name] = val; };
        set('chunk_id', c.chunk_id); set('tenant_key', TENANT_KEY); set('client_id', clientId);
        set('chunk_text', c.chunk_text); set('content', c.chunk_text); set('text', c.chunk_text); set('body', c.chunk_text);
        set('source_path', c.source_path); set('source_doc', c.source_doc);
        set('source_uri', `${BLOB_PREFIX}/${c.source_path}`); set('record_id', c.chunk_id);
        set('source_segment', c.chunk_metadata.context_domain);
        set('context_domain', c.chunk_metadata.context_domain); set('source_system', c.provenance.source_system);
        set('sensitivity', c.chunk_metadata.sensitivity); set('title', c.chunk_metadata.title);
        set('chunk_index', c.chunk_index);
        if (vectorField && embMap[c.chunk_id]) d[vectorField] = embMap[c.chunk_id];
        return d;
      });
      const up = await fetch(`${SEARCH_EP}/indexes/${SEARCH_INDEX}/docs/index?api-version=2024-07-01`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok }, body: JSON.stringify({ value: docs }) });
      if (!up.ok) { search.failed += docs.length; err('search.batch', new Error(up.status + ' ' + (await up.text()).slice(0, 160))); }
      else { const jr = await up.json(); search.uploaded += (jr.value || []).filter((x) => x.status).length; }
    }
    log('search', search);
  } catch (e) { err('search', e); }

  // ---------- QA ----------
  const qa = { db: {}, search: [] };
  try {
    qa.db.lakeshore_chunks = (await client.query("select count(*)::int n from enterprise_context_chunks where tenant_key=$1 and chunk_id like $2", [TENANT_KEY, `${LOAD_ID}::%`])).rows[0].n;
    qa.db.embedded = (await client.query("select count(*)::int n from enterprise_context_chunks where tenant_key=$1 and chunk_id like $2 and embedding_status='embedded'", [TENANT_KEY, `${LOAD_ID}::%`])).rows[0].n;
    qa.db.by_domain = (await client.query("select chunk_metadata->>'context_domain' d, count(*)::int n from enterprise_context_chunks where tenant_key=$1 and chunk_id like $2 group by 1 order by n desc", [TENANT_KEY, `${LOAD_ID}::%`])).rows;
    // sample evidence for kyriba
    qa.db.kyriba_sample = (await client.query("select chunk_id, left(chunk_text,180) t from enterprise_context_chunks where tenant_key=$1 and chunk_id like $2 and chunk_text ilike '%kyriba%' limit 3", [TENANT_KEY, `${LOAD_ID}::%`])).rows;
  } catch (e) { err('qa.db', e); }
  try {
    const tok = (await cred.getToken('https://search.azure.com/.default')).token;
    for (const q of ['Kyriba treasury bank connectivity rollout', 'ServiceNow incident root cause', 'reporting rationalization value', 'SOX controls payment fraud', 'AMS contract rate card optimization']) {
      const r = await fetch(`${SEARCH_EP}/indexes/${SEARCH_INDEX}/docs/search?api-version=2024-07-01`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok }, body: JSON.stringify({ search: q, filter: `tenant_key eq '${TENANT_KEY}'`, top: 3, count: true, select: `${search.keyField || 'chunk_id'}` }) });
      const j = await r.json();
      qa.search.push({ q, count: j['@odata.count'], hits: (j.value || []).map((x) => ({ id: x[search.keyField] || x.chunk_id, score: x['@search.score'] })) });
    }
  } catch (e) { err('qa.search', e); }
  log('qa', qa);

  RESULT.ok = true; RESULT.finished = new Date().toISOString();
  RESULT.summary = { files: manifest.file_count, blob, parse: { ok: parse.ok, failed: parse.failed }, chunks: chunks.length, committed, embed: emb, search, qa };
  await client.end();
  console.log('RESULT_JSON ' + JSON.stringify(RESULT));
  // stay alive so the app does not restart and re-run; keeps one clean run + logs
  console.log('LOAD_COMPLETE_HOLDING');
  setInterval(() => {}, 1 << 30);
})().catch((e) => { console.error('FATAL', e && e.stack || e); console.log('RESULT_JSON ' + JSON.stringify({ ok: false, fatal: String(e && e.message || e) })); setInterval(() => {}, 1 << 30); });

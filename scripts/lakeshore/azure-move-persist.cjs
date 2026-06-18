/*
 * Lakeshore Kyriba Move — Azure persistence worker (Option B).
 *
 * Runs INSIDE the VNet Container App (managed identity) and makes the Move REAL
 * in the AbarVa product data plane:
 *   1. Create/reuse the Lakeshore Kyriba `engagements` row in abarva_control
 *      (cloning an existing engagement's column shape to satisfy NOT-NULL/FKs).
 *   2. Upload every Move artifact (html/pdf/docx/pptx/xlsx) to Azure Blob.
 *   3. Insert `generated_artifacts` rows (html/pdf/docx/pptx — xlsx kept in Blob,
 *      excluded by the table's output_format CHECK) so the signed-in Moves UI
 *      can surface them, tenant-scoped by client_id.
 *   4. Verify counts and print compact result lines.
 *
 * Fetched + eval'd by the app bootstrap. CommonJS only.
 */
(async () => {
  const pg = require('pg');
  const crypto = require('crypto');
  const { ManagedIdentityCredential } = require('@azure/identity');
  const { BlobServiceClient } = require('@azure/storage-blob');

  const L = (k, v) => console.log('MP ' + k + ' ' + JSON.stringify(v).slice(0, 800));
  const E = (k, e) => console.log('MPERR ' + k + ' ' + String((e && e.message) || e).slice(0, 300));

  const BRANCH = 'cursor/lakeshore-enterprise-context-load-v1-89a4';
  const RAW = `https://raw.githubusercontent.com/abarva-platform/abarva/${BRANCH}/docs/build/lakeshore-enterprise-context/move-artifacts/board-grade`;
  const TENANT_KEY = 'lakeshore-holdings';
  const MOVE_NAME = 'Lakeshore Enterprise Finance & Treasury Modernization: Kyriba Rollout, Corporate Controls, Reporting Rationalization, Vendor Optimization & Value Realization';
  const ACCT = 'stabarvaprivatedplab001';
  const CONTAINER = 'context-drops';
  const PREFIX = 'moves/lakeshore-kyriba';
  const RENDERED_BY = 'lakeshore-kyriba-move-persist';
  const cred = new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID);

  // artifact id -> { label, formats }
  const PLAN = {
    'lakeshore-kyriba-01-charter-skeleton': { label: 'Charter Skeleton', phase: 1, formats: ['html', 'docx', 'pdf'] },
    'lakeshore-kyriba-02-discover-brief': { label: 'Discover Brief', phase: 2, formats: ['html', 'docx', 'pdf'] },
    'lakeshore-kyriba-03-solution-architecture': { label: 'Solution Architecture Pack', phase: 3, formats: ['html', 'pptx', 'pdf'] },
    'lakeshore-kyriba-04-costed-business-case': { label: 'Costed Business Case', phase: 4, formats: ['html', 'pptx', 'pdf', 'xlsx'] },
    'lakeshore-kyriba-05-estimate-model': { label: 'Estimate & Financial Model', phase: 4, formats: ['html', 'xlsx', 'pdf'] },
    'lakeshore-kyriba-06-cfo-pack': { label: 'CFO Pack', phase: 4, formats: ['html', 'pptx', 'pdf'] },
    'lakeshore-kyriba-07-mobilize-packet': { label: 'Mobilize & Go-Decision Packet', phase: 5, formats: ['html', 'docx', 'pdf'] },
    'lakeshore-kyriba-08-master-dossier': { label: 'Master Move Dossier', phase: 5, formats: ['html', 'pdf', 'pptx'] },
  };
  const GA_FORMATS = new Set(['html', 'pdf', 'docx', 'pptx']); // table CHECK excludes xlsx
  const ghPath = (aid, fmt) => (fmt === 'html' ? `${RAW}/${aid}.html` : `${RAW}/exports/${aid}.${fmt}`);

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  L('db', { ok: true });

  // ensure the product table exists (faithful to migration 20260524162000; omits optional egress FK)
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS public.generated_artifacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id TEXT NOT NULL,
      artifact_type TEXT NOT NULL CHECK (artifact_type IN ('move_board_pack','source_board_pack','pilot_evidence_package','watchlist_review_pack','dossier_board_pack')),
      source_artifact_ref TEXT NOT NULL,
      render_engine TEXT NOT NULL CHECK (render_engine IN ('gamma','internal','gamma_with_internal_fallback')),
      output_format TEXT NOT NULL CHECK (output_format IN ('pptx','pdf','html','docx')),
      blob_url TEXT NOT NULL,
      blob_sha256 TEXT NOT NULL,
      quality_score NUMERIC CHECK (quality_score IS NULL OR quality_score BETWEEN 0 AND 10),
      evidence_ledger_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
      generation_egress_audit UUID,
      rendered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      rendered_by TEXT NOT NULL,
      superseded_by UUID,
      quarantine_reason TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    )`);
    await client.query("CREATE INDEX IF NOT EXISTS generated_artifacts_lookup_idx ON public.generated_artifacts (client_id, artifact_type, source_artifact_ref, rendered_at DESC)");
    L('ensure_table', { generated_artifacts: 'ok' });
  } catch (e) { E('ensure_table', e); }

  // ---- resolve tenant ----
  const clientRow = (await client.query("select id from clients where tenant_key=$1 limit 1", [TENANT_KEY])).rows[0];
  const clientUuid = clientRow ? clientRow.id : null;
  L('client', { tenant_key: TENANT_KEY, client_uuid: clientUuid });

  // ---- create / reuse engagement (clone column shape) ----
  let moveId = null;
  try {
    const existing = (await client.query("select id from engagements where name=$1 limit 1", [MOVE_NAME])).rows[0];
    if (existing) { moveId = existing.id; L('engagement', { reused: moveId }); }
    else {
      const sample = (await client.query("select * from engagements limit 1")).rows[0];
      if (!sample) throw new Error('no template engagement to clone');
      const cols = Object.keys(sample);
      moveId = crypto.randomUUID();
      const charter = { functionPackKey: 'finance_treasury_alm', problem: 'Diversified ~$8.4B holding modernizing finance & treasury on Kyriba: release trapped cash, harden controls, rationalize reporting, optimize vendors.' };
      const baseline = [
        { metric_name: 'Financial-forecast accuracy', value: 78, unit: 'percent', source: 'FP&A', as_of: '2026-05-31' },
        { metric_name: 'Planning and close cycle time', value: 8.5, unit: 'days', source: 'Close baseline', as_of: '2026-05-31' },
        { metric_name: 'Return on equity (ROE)', value: 11.8, unit: 'percent', source: 'P&L baseline', as_of: '2026-03-31' },
        { metric_name: 'Cost of funds', value: 4.6, unit: 'percent', source: 'Debt & FX', as_of: '2026-03-31' },
      ];
      const overrides = {
        id: moveId, name: MOVE_NAME, current_phase: 5, status: 'active',
        charter: JSON.stringify(charter), function_pack_key: 'finance_treasury_alm',
        function_pack_confidence: 0.8, industry_code: 'FINSERV',
        baseline_metrics: JSON.stringify(baseline), gates_passed: JSON.stringify([0, 1, 2, 3, 4, 5]),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      if (cols.includes('client_id') && clientUuid) overrides.client_id = clientUuid;
      if (cols.includes('tenant_key')) overrides.tenant_key = TENANT_KEY;
      if (cols.includes('slug')) overrides.slug = 'lakeshore-kyriba-enterprise-modernization';
      if (cols.includes('lifecycle_state')) overrides.lifecycle_state = 'approved';
      const vals = cols.map((c) => (c in overrides ? overrides[c] : sample[c]));
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await client.query(`insert into engagements (${cols.map((c) => '"' + c + '"').join(',')}) values (${ph})`, vals);
      L('engagement', { created: moveId, phase: 5, pack: 'finance_treasury_alm' });
    }
  } catch (e) { E('engagement', e); }

  // ---- blob + generated_artifacts ----
  const svc = new BlobServiceClient(`https://${ACCT}.blob.core.windows.net`, cred);
  const cont = svc.getContainerClient(CONTAINER);
  const result = { blobs: 0, blobBytes: 0, ga_rows: 0, xlsx_blob_only: 0, byFormat: {} };

  // idempotent: clear prior rows from this worker for this move
  try { await client.query("delete from generated_artifacts where rendered_by=$1 and client_id=$2", [RENDERED_BY, TENANT_KEY]); } catch (e) { E('ga.clear', e); }

  // discover generated_artifacts columns to insert defensively
  const gaCols = new Set((await client.query("select column_name from information_schema.columns where table_name='generated_artifacts'")).rows.map((r) => r.column_name));

  for (const [aid, spec] of Object.entries(PLAN)) {
    for (const fmt of spec.formats) {
      let bytes;
      try {
        const r = await fetch(ghPath(aid, fmt));
        if (!r.ok) throw new Error('fetch ' + r.status);
        bytes = Buffer.from(await r.arrayBuffer());
      } catch (e) { E('fetch:' + aid + '.' + fmt, e); continue; }
      const blobPath = `${PREFIX}/${aid}.${fmt}`;
      const sha = crypto.createHash('sha256').update(bytes).digest('hex');
      try {
        await cont.getBlockBlobClient(blobPath).upload(bytes, bytes.length);
        result.blobs++; result.blobBytes += bytes.length;
      } catch (e) { E('blob:' + blobPath, e); continue; }
      result.byFormat[fmt] = (result.byFormat[fmt] || 0) + 1;
      if (!GA_FORMATS.has(fmt)) { result.xlsx_blob_only++; continue; }
      // insert generated_artifacts row
      try {
        const row = {
          id: crypto.randomUUID(), client_id: TENANT_KEY, artifact_type: 'move_board_pack',
          source_artifact_ref: `move:${moveId}:${aid}`, render_engine: 'internal', output_format: fmt,
          blob_url: `https://${ACCT}.blob.core.windows.net/${CONTAINER}/${blobPath}`, blob_sha256: sha,
          rendered_by: RENDERED_BY,
          metadata: JSON.stringify({
            title: spec.label, phase: spec.phase, artifactId: aid, blobPath,
            move: 'lakeshore-kyriba', renderedHtml: fmt === 'html' ? bytes.toString('utf8') : undefined,
          }),
        };
        const keys = Object.keys(row).filter((k) => gaCols.has(k));
        await client.query(
          `insert into generated_artifacts (${keys.join(',')}) values (${keys.map((_, i) => '$' + (i + 1)).join(',')})`,
          keys.map((k) => row[k]),
        );
        result.ga_rows++;
      } catch (e) { E('ga.insert:' + aid + '.' + fmt, e); }
    }
  }
  L('persist', result);

  // ---- verify ----
  try {
    const ga = (await client.query("select output_format, count(*)::int n from generated_artifacts where rendered_by=$1 group by output_format order by output_format", [RENDERED_BY])).rows;
    const move = (await client.query("select id, name, current_phase, function_pack_key from engagements where id=$1", [moveId])).rows[0] || null;
    L('verify', { move, generated_artifacts_by_format: ga });
  } catch (e) { E('verify', e); }

  await client.end();
  console.log('MP_DONE move=' + moveId);
  setInterval(() => {}, 1 << 30);
})().catch((e) => { console.log('MP_FATAL ' + String((e && e.stack) || e).slice(0, 400)); setInterval(() => {}, 1 << 30); });

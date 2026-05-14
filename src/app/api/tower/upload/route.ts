import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { getCurrentPerson } from '@/lib/auth/maestro';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { classifyUploadContent, type TowerDataType } from '@/lib/tower/classify';
import { ingestPortfolioCsv } from '@/lib/tower/ingest-portfolio';
import {
  evaluateSensitiveUpload,
  sensitiveUploadRejectedResponse,
} from '@/lib/security/sensitive-upload-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MAX_BYTES = 25 * 1024 * 1024; // 25MB — Tower files can be larger than chat docs
const TOWER_BUCKET = 'tower-uploads';

export async function POST(req: NextRequest) {
  // SEC-P1-1 fix (audit 2026-05-13): previously this route required a
  // signed-in person but never asserted that `form.get('clientId')`
  // matched the caller's tenant. It passed the raw clientId straight into
  // `uploaded_files.client_id` and Pinecone via ingestPortfolioCsv — i.e.,
  // a Meridian user could upload to an Apex tenant just by setting the
  // form field. Now we require tenancy and enforce match before touching
  // storage or DB.
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err) as NextResponse;
  }

  const person = await getCurrentPerson();
  if (!person) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const clientId = (form.get('clientId') as string | null)?.trim();
  if (!file || !clientId) {
    return NextResponse.json({ error: 'file and clientId required' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `file exceeds ${MAX_BYTES} bytes` }, { status: 413 });
  }

  if (clientId !== ctx.clientId) {
    return NextResponse.json({ error: 'forbidden_cross_tenant' }, { status: 403 });
  }

  const sb = getServerSupabase();

  // 1. Classify data protection posture before storage or ingestion.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const dataProtection = evaluateSensitiveUpload({
    filename: file.name,
    mimeType: file.type,
    bytes,
    declaredClassification: form.get('dataClassification'),
  });
  if (dataProtection.decision === 'quarantine') {
    return sensitiveUploadRejectedResponse(dataProtection) as NextResponse;
  }

  // 2. Store to Supabase Storage (bucket must exist — see migration notes)
  const now = new Date();
  const storagePath = `${clientId}/${now.getUTCFullYear()}/${String(
    now.getUTCMonth() + 1,
  ).padStart(2, '0')}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadErr } = await sb.storage.from(TOWER_BUCKET).upload(storagePath, bytes, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (uploadErr) {
    return NextResponse.json(
      { error: `storage upload failed: ${uploadErr.message}` },
      { status: 500 },
    );
  }

  // 3. Record file metadata — status: classifying
  const { data: fileRow, error: insertErr } = await sb
    .from('uploaded_files')
    .insert({
      client_id: clientId,
      uploaded_by_person_id: person.id,
      file_name: file.name,
      file_size_bytes: file.size,
      storage_path: storagePath,
      mime_type: file.type || null,
      ingestion_status: 'classifying',
    })
    .select()
    .single();
  if (insertErr || !fileRow) {
    return NextResponse.json(
      { error: `metadata insert failed: ${insertErr?.message ?? 'unknown'}` },
      { status: 500 },
    );
  }
  const fileId = (fileRow as { id: string }).id;

  // 4. Classify + parse synchronously (simpler for v1, UI waits for result)
  const sampleText = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 2048));
  const classifier = await classifyUploadContent({
    filename: file.name,
    mimeType: file.type || null,
    sample: sampleText,
  });

  let ingestResult: {
    rows_total?: number;
    rows_ingested?: number;
    rows_failed?: number;
    notes?: string[];
  } = {};
  let finalStatus: 'parsed' | 'needs_mapping' | 'failed' = 'needs_mapping';

  try {
    if (classifier.data_type === 'portfolio' && classifier.confidence >= 0.5) {
      const csvText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      const res = await ingestPortfolioCsv({ clientId, fileId, csvText });
      ingestResult = res;
      finalStatus = res.rows_ingested > 0 ? 'parsed' : 'failed';
    }
    // Other data types classified but not parsed in this pack — flagged needs_mapping
  } catch (err) {
    console.error('[tower-upload-parse]', err);
    finalStatus = 'failed';
    ingestResult.notes = [err instanceof Error ? err.message : 'parse failed'];
  }

  await sb
    .from('uploaded_files')
    .update({
      data_type: classifier.data_type,
      classification_confidence: classifier.confidence,
      ingestion_status: finalStatus,
      rows_total: ingestResult.rows_total ?? null,
      rows_ingested: ingestResult.rows_ingested ?? null,
      rows_failed: ingestResult.rows_failed ?? null,
      parser_notes: {
        classifier,
        ingest: ingestResult,
      },
      parsed_at: finalStatus === 'parsed' ? new Date().toISOString() : null,
    })
    .eq('id', fileId);

  return NextResponse.json({
    file_id: fileId,
    data_type: classifier.data_type as TowerDataType,
    classification_confidence: classifier.confidence,
    status: finalStatus,
    rows_total: ingestResult.rows_total ?? null,
    rows_ingested: ingestResult.rows_ingested ?? null,
    message:
      finalStatus === 'parsed'
        ? `Ingested ${ingestResult.rows_ingested} ${classifier.data_type} rows.`
        : classifier.data_type === 'engagement_doc'
          ? 'This looks like an engagement document — route through /data/new?clientId=X for Pinecone indexing.'
          : classifier.data_type === 'portfolio'
            ? 'Portfolio detected but no rows ingested. Check file format.'
            : `Classified as ${classifier.data_type} (confidence ${classifier.confidence.toFixed(2)}). Parser not yet wired — manual mapping required. See Pack 11.`,
    notes: ingestResult.notes ?? [],
    dataProtection,
  });
}

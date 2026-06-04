import { NextRequest, NextResponse } from 'next/server';

import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { loadCorpusJsonlImport, type CorpusImportCommitMode } from '@/lib/context-ingestion/corpus-jsonl-import';
import { validatePilotUploadAttestation } from '@/lib/context-ingestion/upload-attestation';
import {
  evaluateSensitiveUpload,
  sensitiveUploadRejectedResponse,
} from '@/lib/security/sensitive-upload-guard';
import { canonicalTenantKey } from '@/lib/tenant/aliases';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024;

function formString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseCommitMode(value: string | null): CorpusImportCommitMode {
  return value === 'commit' ? 'commit' : 'validate_only';
}

export async function POST(request: NextRequest) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error) as NextResponse;
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_multipart' }, { status: 400 });
  }

  const clientId = formString(formData, 'clientId');
  if (!clientId) {
    return NextResponse.json({ error: 'clientId required' }, { status: 400 });
  }
  if (clientId !== tenancy.clientId) {
    return NextResponse.json(
      { error: 'forbidden_cross_tenant' },
      { status: 403 },
    );
  }
  if (!tenancy.clientKey) {
    return NextResponse.json({ error: 'tenant_key_required' }, { status: 403 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file required' }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith('.jsonl')) {
    return NextResponse.json(
      {
        error: 'unsupported_file_type',
        detail: 'Corpus imports require a .jsonl file.',
      },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `file exceeds ${MAX_BYTES} bytes` },
      { status: 413 },
    );
  }

  const attestation = validatePilotUploadAttestation({
    accepted: formData.get('operatorAttestationAccepted'),
    version: formData.get('operatorAttestationVersion'),
    authorityConfirmed: formData.get('operatorDataAuthorityConfirmed'),
    dataUseConfirmed: formData.get('operatorDataUseConfirmed'),
    sensitiveDataConfirmed: formData.get('operatorSensitiveDataConfirmed'),
    note: formData.get('operatorAttestationNote'),
  });
  if ('error' in attestation) {
    return NextResponse.json(attestation, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const dataProtection = evaluateSensitiveUpload({
    filename: file.name,
    mimeType: file.type || 'application/x-ndjson',
    bytes,
    declaredClassification: formData.get('dataClassification'),
  });
  if (dataProtection.decision === 'quarantine') {
    return sensitiveUploadRejectedResponse(dataProtection) as NextResponse;
  }

  const jsonlText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  try {
    const result = await loadCorpusJsonlImport({
      clientId: tenancy.clientId,
      tenantKey: canonicalTenantKey(tenancy.clientKey),
      uploadedBy: tenancy.userId,
      fileName: file.name,
      jsonlText,
      commitMode: parseCommitMode(formString(formData, 'commitMode')),
      defaultVertical: formString(formData, 'defaultVertical'),
      attestation,
    });

    return NextResponse.json(
      {
        ...result,
        attestation,
        dataProtection,
      },
      { status: result.persistence.status === 'inserted' ? 200 : 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith('corpus_jsonl_') ? 400 : 500;
    return NextResponse.json(
      {
        error: status === 400 ? 'corpus_import_invalid' : 'corpus_import_failed',
        detail: message,
      },
      { status },
    );
  }
}

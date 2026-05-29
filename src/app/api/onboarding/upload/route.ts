import type { NextRequest } from 'next/server';

import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { asOnboardingSupabaseClient, parseApexP18Zip, createOnboardingSession, resolveApexClientId } from '@/lib/onboarding/apex-p18-pack-ingestion';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<Response> {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'invalid_multipart' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: 'missing_file' }, { status: 400 });
  }
  if (!file.name.endsWith('.zip')) {
    return Response.json({ error: 'unsupported_file_type', detail: 'Packet 18 onboarding accepts a ZIP data pack.' }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const parsed = await parseApexP18Zip(bytes);
    const supabase = asOnboardingSupabaseClient(getAzureWriteFluentClient());
    const clientId = await resolveApexClientId(supabase);
    const session = await createOnboardingSession({
      client: supabase,
      parsed,
      originalFilename: file.name,
      uploadedBy: tenancy.userId,
      clientId,
    });

    return Response.json({
      ok: parsed.validationSummary.valid,
      sessionId: session.id,
      status: session.status,
      tenantKey: session.tenantKey,
      rowCounts: session.rowCounts,
      validationSummary: session.validationSummary,
      confirmUrl: `/admin/onboarding/${session.id}/confirm`,
    }, { status: parsed.validationSummary.valid ? 200 : 422 });
  } catch (error) {
    return Response.json({
      error: 'onboarding_parse_failed',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 400 });
  }
}

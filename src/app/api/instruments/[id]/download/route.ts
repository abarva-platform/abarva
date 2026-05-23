import { NextRequest } from 'next/server';
import { renderInstrument } from '@/lib/instruments/render';
import type { InstrumentFormat } from '@/lib/instruments/types';
import { errorResponse, fail, requireInstrumentCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const FORMATS: InstrumentFormat[] = ['csv', 'md', 'json', 'docx', 'sql', 'interactive_form'];

function parseFormat(value: string | null): InstrumentFormat | null {
  return FORMATS.includes(value as InstrumentFormat) ? value as InstrumentFormat : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireInstrumentCtx();
  if (ctx instanceof Response) return ctx;
  const url = new URL(request.url);
  const format = parseFormat(url.searchParams.get('format'));
  if (!format) return fail('bad_request', 'Expected format csv, md, json, docx, sql, or interactive_form.', 400);
  const version = Number(url.searchParams.get('version') ?? 0) || undefined;
  const { id } = await params;
  try {
    const rendered = await renderInstrument(id, version, ctx.clientId, format);
    const body = typeof rendered.bytes === 'string'
      ? rendered.bytes
      : new Uint8Array(rendered.bytes);
    return new Response(body, {
      headers: {
        'Content-Type': rendered.contentType,
        'Content-Disposition': `attachment; filename="${rendered.filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

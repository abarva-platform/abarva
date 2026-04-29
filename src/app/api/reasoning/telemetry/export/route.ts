// GET /api/reasoning/telemetry/export?format=csv|json[&limit=N][&pretty=1]
//
// Streams the most-recent synthesis telemetry events as a downloadable CSV
// or JSON file. Operators use this to feed telemetry into spreadsheets or
// to grab a one-off snapshot for offline analysis. Reads only the in-memory
// ring buffer — no mutation, no auth (admin-only surface gates upstream).

import { getRecentSynthesisEvents } from '@/lib/reasoning/synthesis-telemetry';
import {
  eventsToCsv,
  eventsToJson,
} from '@/lib/reasoning/synthesis-telemetry-export';
// Side-effect import: shares backend init with the read endpoint.
import '@/lib/reasoning/telemetry-init';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 5000;

function parseLimit(raw: string | null): number {
  if (raw === null) return DEFAULT_LIMIT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function timestampSlug(): string {
  // Compact, file-system-safe timestamp for the download filename.
  // Example: "2026-04-28T12-34-56".
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get('format');
  const limit = parseLimit(url.searchParams.get('limit'));
  const pretty = url.searchParams.get('pretty') === '1';

  if (format !== 'csv' && format !== 'json') {
    return jsonError("format must be 'csv' or 'json'", 400);
  }

  const events = getRecentSynthesisEvents(limit);
  const stamp = timestampSlug();

  if (format === 'csv') {
    const body = eventsToCsv(events);
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="telemetry-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  const body = eventsToJson(events, { pretty });
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="telemetry-${stamp}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}

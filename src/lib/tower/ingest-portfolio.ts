import Papa from 'papaparse';
import { getServerSupabase } from '@/lib/supabase-server';

const VALID_STAGES = [
  'idea',
  'qualify',
  'design',
  'evidence',
  'review',
  'execute',
  'realize',
  'stalled',
] as const;

function normalizeStage(input: string | undefined): (typeof VALID_STAGES)[number] {
  if (!input) return 'idea';
  const v = input.trim().toLowerCase();
  return (VALID_STAGES as readonly string[]).includes(v)
    ? (v as (typeof VALID_STAGES)[number])
    : 'idea';
}

function splitList(input: string | undefined): string[] {
  if (!input) return [];
  return input
    .split(/[;,|]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Fuzzy column lookup: find a header in headers[] whose lowercased form
// contains any of the candidates. Returns the matched value for a row, or '' .
function pickCol(row: Record<string, string>, candidates: string[]): string {
  const headers = Object.keys(row);
  for (const cand of candidates) {
    const match = headers.find((h) => h.trim().toLowerCase().includes(cand));
    if (match) return String(row[match] ?? '').trim();
  }
  return '';
}

export interface PortfolioIngestResult {
  rows_total: number;
  rows_ingested: number;
  rows_failed: number;
  notes: string[];
}

export async function ingestPortfolioCsv(args: {
  clientId: string;
  fileId: string;
  csvText: string;
}): Promise<PortfolioIngestResult> {
  const parsed = Papa.parse<Record<string, string>>(args.csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = parsed.data ?? [];
  const notes: string[] = [];
  if (parsed.errors.length > 0) {
    notes.push(`csv errors: ${parsed.errors.slice(0, 3).map((e) => e.message).join('; ')}`);
  }

  const sb = getServerSupabase();
  let ingested = 0;
  let failed = 0;

  for (const row of rows) {
    const name = pickCol(row, ['name', 'use case']);
    if (!name) {
      failed += 1;
      continue;
    }

    const payload = {
      client_id: args.clientId,
      name,
      description: pickCol(row, ['description', 'summary']) || null,
      business_unit: pickCol(row, ['business unit', 'bu', 'department', 'team']) || null,
      domain: pickCol(row, ['domain', 'function', 'area']) || null,
      stage: normalizeStage(pickCol(row, ['stage', 'status', 'phase'])),
      systems: splitList(pickCol(row, ['systems', 'system', 'tools', 'platform'])),
      ai_type: pickCol(row, ['ai type', 'ai_type', 'type', 'model type']) || null,
      scope: pickCol(row, ['scope', 'reach']) || null,
      vendor: pickCol(row, ['vendor', 'provider']) || null,
      external_id: pickCol(row, ['external id', 'id', 'key', 'ticket']) || null,
      source: 'manual_upload' as const,
      source_file_id: args.fileId,
    };

    const { error } = await sb.from('use_cases').insert(payload);
    if (error) {
      failed += 1;
      notes.push(`row "${name}": ${error.message}`);
    } else {
      ingested += 1;
    }
  }

  return {
    rows_total: rows.length,
    rows_ingested: ingested,
    rows_failed: failed,
    notes,
  };
}

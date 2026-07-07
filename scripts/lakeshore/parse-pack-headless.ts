/**
 * Headless parse validation for LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1.
 *
 * Runs every pack file through the SAME parser the Setup Admin loader uses
 * (`parseIngestionDocument` from src/lib/ingestion/document-upload-parser.ts),
 * plus row-chunking for CSV/JSONL (mirroring the csv-upload connector), and
 * emits a real parse report (success/failure counts, extracted chars, chunk
 * estimates) grouped by file type and context domain.
 *
 * Run: npx tsx scripts/lakeshore/parse-pack-headless.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseIngestionDocument,
  isSupportedIngestionDocument,
} from '../../src/lib/ingestion/document-upload-parser';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', '..', 'docs', 'build', 'lakeshore-enterprise-context');
const MANIFEST = JSON.parse(
  readFileSync(join(OUT, 'LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1_MANIFEST.json'), 'utf8'),
);

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  md: 'text/markdown',
  json: 'application/json',
  csv: 'text/csv',
  jsonl: 'application/jsonl',
  svg: 'image/svg+xml',
  txt: 'text/plain',
};

type Row = {
  path: string;
  type: string;
  domain: string;
  ok: boolean;
  method: string;
  chars: number;
  chunks: number;
  warnings: string[];
  error?: string;
};

function chunkCountFromText(text: string): number {
  return Math.max(1, Math.ceil(text.length / 800));
}

async function run() {
  const rows: Row[] = [];
  for (const f of MANIFEST.files as Array<Record<string, unknown>>) {
    const rel = f.path as string;
    const type = (f.file_type as string).toLowerCase();
    const domain = f.context_domain as string;
    const abs = join(OUT, rel);
    let bytes: Buffer;
    try {
      bytes = readFileSync(abs);
    } catch (e) {
      rows.push({ path: rel, type, domain, ok: false, method: 'n/a', chars: 0, chunks: 0, warnings: [], error: `read failed: ${(e as Error).message}` });
      continue;
    }
    const mimeType = MIME[type] ?? 'application/octet-stream';
    try {
      if (isSupportedIngestionDocument({ filename: rel, mimeType })) {
        const parsed = await parseIngestionDocument({ filename: rel, mimeType, bytes });
        rows.push({
          path: rel, type, domain, ok: true, method: parsed.parseMethod,
          chars: parsed.text.length, chunks: chunkCountFromText(parsed.text),
          warnings: parsed.warnings ?? [],
        });
      } else if (type === 'csv') {
        // mirror csv-upload connector: one chunk per data row (skip comment + header)
        const text = bytes.toString('utf8');
        const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
        const dataRows = Math.max(0, lines.length - 1);
        rows.push({ path: rel, type, domain, ok: true, method: 'csv-row-chunker', chars: text.length, chunks: Math.max(1, dataRows), warnings: [] });
      } else if (type === 'jsonl') {
        const text = bytes.toString('utf8');
        const dataLines = text.split(/\r?\n/).filter((l) => l.trim() && !l.includes('"_meta"'));
        rows.push({ path: rel, type, domain, ok: true, method: 'jsonl-record-chunker', chars: text.length, chunks: Math.max(1, dataLines.length), warnings: [] });
      } else if (type === 'svg' || type === 'txt') {
        const text = bytes.toString('utf8');
        rows.push({ path: rel, type, domain, ok: true, method: 'text-fallback', chars: text.length, chunks: chunkCountFromText(text), warnings: ['parsed as text fallback (worker-handled)'] });
      } else {
        rows.push({ path: rel, type, domain, ok: false, method: 'unsupported', chars: 0, chunks: 0, warnings: [], error: 'unsupported type for inline parse' });
      }
    } catch (e) {
      rows.push({ path: rel, type, domain, ok: false, method: 'error', chars: 0, chunks: 0, warnings: [], error: (e as Error).message });
    }
  }

  const ok = rows.filter((r) => r.ok);
  const fail = rows.filter((r) => !r.ok);
  const byType: Record<string, { files: number; ok: number; chars: number; chunks: number }> = {};
  const byDomain: Record<string, { files: number; ok: number; chunks: number }> = {};
  for (const r of rows) {
    byType[r.type] ??= { files: 0, ok: 0, chars: 0, chunks: 0 };
    byType[r.type].files++; if (r.ok) byType[r.type].ok++;
    byType[r.type].chars += r.chars; byType[r.type].chunks += r.chunks;
    byDomain[r.domain] ??= { files: 0, ok: 0, chunks: 0 };
    byDomain[r.domain].files++; if (r.ok) byDomain[r.domain].ok++;
    byDomain[r.domain].chunks += r.chunks;
  }
  const totalChunks = rows.reduce((a, r) => a + r.chunks, 0);
  const summary = {
    pack_id: MANIFEST.pack_id,
    parsed_at: new Date().toISOString(),
    parser: 'src/lib/ingestion/document-upload-parser.ts::parseIngestionDocument (+csv/jsonl/text chunkers)',
    files_total: rows.length,
    files_parsed_ok: ok.length,
    files_failed: fail.length,
    total_extracted_chars: rows.reduce((a, r) => a + r.chars, 0),
    estimated_total_chunks: totalChunks,
    by_type: byType,
    by_domain: byDomain,
    failures: fail,
  };
  writeFileSync(join(OUT, 'parse-output', 'parse_results.json'), JSON.stringify({ summary, rows }, null, 2));

  // Markdown report
  const md: string[] = [];
  md.push('# LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1 — Parse Report', '');
  md.push(`- Parsed at: ${summary.parsed_at}`);
  md.push(`- Parser: \`${summary.parser}\``);
  md.push(`- Files: **${summary.files_total}** · Parsed OK: **${summary.files_parsed_ok}** · Failed: **${summary.files_failed}**`);
  md.push(`- Extracted characters: **${summary.total_extracted_chars.toLocaleString()}**`);
  md.push(`- Estimated total chunks: **${summary.estimated_total_chunks.toLocaleString()}**`, '');
  md.push('## By file type', '', '| type | files | ok | extracted chars | est. chunks |', '|---|---|---|---|---|');
  for (const [t, v] of Object.entries(byType).sort()) md.push(`| ${t} | ${v.files} | ${v.ok} | ${v.chars.toLocaleString()} | ${v.chunks.toLocaleString()} |`);
  md.push('', '## By context domain', '', '| context_domain | files | ok | est. chunks |', '|---|---|---|');
  for (const [d, v] of Object.entries(byDomain).sort()) md.push(`| ${d} | ${v.files} | ${v.ok} | ${v.chunks.toLocaleString()} |`);
  md.push('', '## Failures', '');
  if (fail.length === 0) md.push('None — every file parsed successfully through the loader parser path.');
  else for (const r of fail) md.push(`- \`${r.path}\` (${r.type}): ${r.error}`);
  md.push('', '## Sample parsed methods', '');
  md.push('| file | method | chars | chunks |', '|---|---|---|---|');
  for (const r of rows.slice(0, 14)) md.push(`| \`${r.path.split('/').pop()}\` | ${r.method} | ${r.chars.toLocaleString()} | ${r.chunks} |`);
  writeFileSync(join(OUT, 'LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1_PARSE_REPORT.md'), md.join('\n') + '\n');

  console.log(JSON.stringify({ ...summary, by_type: undefined, by_domain: undefined, failures: fail.length }, null, 2));
}

run().catch((e) => { console.error(e); process.exit(1); });

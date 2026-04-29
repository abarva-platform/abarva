// GET /api/admin/evidence-quality-export
//
// Returns a CSV download of all evidence items across all fixture instances
// with their quality scores. No auth on this route — the admin layout gates
// access upstream. Reads only from static fixture data; no I/O or mutation.

import { scoreEvidenceItem, type EvidenceLikeItem } from '@/lib/reasoning/evidence-quality';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import type { EvidenceItem } from '@/lib/source/source-event-instance';
import type { ProgramEvidenceItem } from '@/lib/programs/program-instance';

export const dynamic = 'force-dynamic';

interface CsvRow {
  instanceId: string;
  instanceName: string;
  instanceType: string;
  evidenceId: string;
  description: string;
  uploadedAt: string;
  score: string;
  grade: string;
  reasons: string;
}

function sourceItemToLike(item: EvidenceItem): EvidenceLikeItem {
  return {
    text: [item.value, item.source].filter(Boolean).join(' — '),
    uploadedAt: item.recordedAt,
  };
}

function programItemToLike(item: ProgramEvidenceItem): EvidenceLikeItem {
  return {
    citation: item.citation,
    uploadedAt: item.uploadedAt,
    uploadedBy: item.uploadedBy,
  };
}

function csvEscape(value: string): string {
  // RFC 4180: fields containing commas, double-quotes, or newlines must be
  // enclosed in double quotes; double-quotes within are doubled.
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowsToCsv(rows: CsvRow[]): string {
  const headers: (keyof CsvRow)[] = [
    'instanceId',
    'instanceName',
    'instanceType',
    'evidenceId',
    'description',
    'uploadedAt',
    'score',
    'grade',
    'reasons',
  ];

  const lines: string[] = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  return lines.join('\r\n');
}

function timestampSlug(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

export function GET(): Response {
  const nowMs = Date.now();
  const rows: CsvRow[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    for (const item of inst.evidence) {
      const liked = sourceItemToLike(item);
      const scored = scoreEvidenceItem(liked, nowMs);
      rows.push({
        instanceId: inst.id,
        instanceName: inst.name,
        instanceType: 'source',
        evidenceId: item.id,
        description: `[${item.kind}] ${item.field}: ${item.value}`,
        uploadedAt: item.recordedAt ?? '',
        score: scored.score.toFixed(2),
        grade: scored.grade,
        reasons: scored.reasons.join('; '),
      });
    }
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    for (const item of inst.evidence) {
      const liked = programItemToLike(item);
      const scored = scoreEvidenceItem(liked, nowMs);
      rows.push({
        instanceId: inst.id,
        instanceName: inst.name,
        instanceType: 'program',
        evidenceId: item.id,
        description: item.citation,
        uploadedAt: item.uploadedAt ?? '',
        score: scored.score.toFixed(2),
        grade: scored.grade,
        reasons: scored.reasons.join('; '),
      });
    }
  }

  const csv = rowsToCsv(rows);
  const stamp = timestampSlug();

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="evidence-quality-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}

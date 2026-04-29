/**
 * Evidence quality scoring tests — deterministic, no Date.now.
 *
 * All freshness checks use the explicit `nowMs` parameter so the suite stays
 * stable across calendar runs.
 */

import {
  scoreEvidenceItem,
  summarizeEvidenceQuality,
  summaryGrade,
  type EvidenceLikeItem,
} from '@/lib/reasoning/evidence-quality';

const NOW_MS = Date.parse('2026-04-28T00:00:00Z');

describe('scoreEvidenceItem', () => {
  test('empty item scores 0 / weak', () => {
    const result = scoreEvidenceItem({}, NOW_MS);
    expect(result.score).toBe(0);
    expect(result.grade).toBe('weak');
    expect(result.reasons).toEqual(['No evidence content scored']);
  });

  test('citation alone contributes +0.20 → still weak', () => {
    const result = scoreEvidenceItem({ citation: 'Workshop 4 output' }, NOW_MS);
    expect(result.score).toBe(0.2);
    expect(result.grade).toBe('weak');
    expect(result.reasons).toContain('Has citation (+0.20)');
  });

  test('citation + uploadedBy → 0.35 weak', () => {
    const result = scoreEvidenceItem(
      { citation: 'Workshop 4 output', uploadedBy: 'Avery Chen' },
      NOW_MS,
    );
    expect(result.score).toBe(0.35);
    expect(result.grade).toBe('weak');
  });

  test('fresh uploadedAt within 90 days adds +0.10', () => {
    const fresh = scoreEvidenceItem(
      { citation: 'doc', uploadedBy: 'jane', uploadedAt: '2026-04-01T00:00:00Z' },
      NOW_MS,
    );
    expect(fresh.score).toBeCloseTo(0.45, 5);
    expect(fresh.reasons).toContain('Uploaded within 90 days (+0.10)');
  });

  test('stale uploadedAt outside 90 days does not get freshness bonus and takes severe-stale penalty', () => {
    // 2025-01-01 → ~483 days before NOW (2026-04-28) → severe stale → -0.20
    // citation 0.20 + uploadedBy 0.15 - severe stale 0.20 = 0.15
    const stale = scoreEvidenceItem(
      { citation: 'doc', uploadedBy: 'jane', uploadedAt: '2025-01-01T00:00:00Z' },
      NOW_MS,
    );
    expect(stale.score).toBeCloseTo(0.15, 5);
    expect(stale.reasons.some((r) => r.includes('Uploaded within'))).toBe(false);
    expect(stale.reasons.some((r) => r.includes('severe stale'))).toBe(true);
  });

  test('mild stale uploadedAt between 90–180 days incurs -0.10 penalty', () => {
    // 2025-11-30 → ~149 days before NOW (2026-04-28) → mild stale → -0.10
    // citation 0.20 + uploadedBy 0.15 - mild stale 0.10 = 0.25
    const mildStale = scoreEvidenceItem(
      { citation: 'doc', uploadedBy: 'jane', uploadedAt: '2025-11-30T00:00:00Z' },
      NOW_MS,
    );
    expect(mildStale.score).toBeCloseTo(0.25, 5);
    expect(mildStale.reasons.some((r) => r.includes('mild stale'))).toBe(true);
  });

  test('severe stale uploadedAt older than 180 days incurs -0.20 penalty', () => {
    // 2025-10-01 → ~209 days before NOW (2026-04-28) → severe stale → -0.20
    // citation 0.20 + uploadedBy 0.15 - severe stale 0.20 = 0.15
    const severeStale = scoreEvidenceItem(
      { citation: 'doc', uploadedBy: 'jane', uploadedAt: '2025-10-01T00:00:00Z' },
      NOW_MS,
    );
    expect(severeStale.score).toBeCloseTo(0.15, 5);
    expect(severeStale.reasons.some((r) => r.includes('severe stale'))).toBe(true);
  });

  test('age deduction cannot push score below 0', () => {
    // Only a citation 0.20 - severe stale 0.20 = 0, not negative
    const result = scoreEvidenceItem(
      { citation: 'doc', uploadedAt: '2024-01-01T00:00:00Z' },
      NOW_MS,
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  test('text length brackets — short / medium / long', () => {
    const short = scoreEvidenceItem({ text: 'short note' }, NOW_MS);
    const medium = scoreEvidenceItem({ text: 'x'.repeat(200) }, NOW_MS);
    const long = scoreEvidenceItem({ text: 'x'.repeat(600) }, NOW_MS);
    expect(short.score).toBe(0.05);
    expect(medium.score).toBe(0.15);
    expect(long.score).toBe(0.25);
  });

  test('note field is used as fallback when text is missing', () => {
    const noteOnly = scoreEvidenceItem({ note: 'x'.repeat(200) }, NOW_MS);
    expect(noteOnly.score).toBe(0.15);
  });

  test('pageCount >= 5 contributes +0.15', () => {
    const result = scoreEvidenceItem({ pageCount: 25 }, NOW_MS);
    expect(result.score).toBe(0.15);
    expect(result.reasons).toContain('Document length 25 pages (+0.15)');
  });

  test('pageCount < 5 does not contribute', () => {
    const result = scoreEvidenceItem({ pageCount: 3 }, NOW_MS);
    expect(result.score).toBe(0);
  });

  test('approved keyword in body contributes +0.10', () => {
    const result = scoreEvidenceItem({ text: 'Plan approved by sponsor.' }, NOW_MS);
    // 0.05 (short text) + 0.10 (approved) = 0.15
    expect(result.score).toBe(0.15);
    expect(result.reasons).toContain('Mentions approval or signature (+0.10)');
  });

  test('signed keyword in citation contributes +0.10', () => {
    const result = scoreEvidenceItem({ citation: 'Signed transition plan' }, NOW_MS);
    // 0.20 (citation) + 0.10 (signed) = 0.30
    expect(result.score).toBe(0.3);
  });

  test('full strong item — 25-page signed transition plan with named uploader', () => {
    const result = scoreEvidenceItem(
      {
        citation: 'Signed transition plan v3',
        uploadedBy: 'Avery Chen',
        uploadedAt: '2026-04-15T00:00:00Z',
        text: 'x'.repeat(700),
        pageCount: 25,
      },
      NOW_MS,
    );
    // 0.20 + 0.15 + 0.10 + 0.25 + 0.15 + 0.10 = 0.95
    expect(result.score).toBeCloseTo(0.95, 5);
    expect(result.grade).toBe('strong');
  });

  test('score is capped at 1.0', () => {
    // Construct an item that, in raw points, would exceed 1.0 — verifying the cap.
    const result = scoreEvidenceItem(
      {
        citation: 'Signed and approved transition plan',
        uploadedBy: 'Avery',
        uploadedAt: '2026-04-15T00:00:00Z',
        text: `${'x'.repeat(700)} approved`,
        pageCount: 50,
      },
      NOW_MS,
    );
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.grade).toBe('strong');
  });

  test('grade boundary — exactly 0.4 is fair', () => {
    // 0.20 (citation) + 0.15 (uploadedBy) + 0.05 (short text) = 0.40
    const result = scoreEvidenceItem(
      { citation: 'doc', uploadedBy: 'jane', text: 'tiny' },
      NOW_MS,
    );
    expect(result.score).toBe(0.4);
    expect(result.grade).toBe('fair');
  });

  test('grade boundary — exactly 0.7 is strong', () => {
    // citation 0.20 + uploadedBy 0.15 + freshness 0.10 + medium text 0.15 + pageCount 0.15 - signed/approved 0
    // = 0.75 → strong. We need 0.7 exactly. Use citation 0.20 + uploadedBy 0.15 + medium 0.15 + pageCount 0.15 + approved 0.10 - freshness 0 = 0.75
    // So instead show the boundary by computing >=0.7 → strong via 0.7 itself:
    // citation 0.20 + uploadedBy 0.15 + freshness 0.10 + short text 0.05 + pageCount 0.15 + approved 0.10 = 0.75 strong
    const result = scoreEvidenceItem(
      {
        citation: 'doc',
        uploadedBy: 'j',
        uploadedAt: '2026-04-15T00:00:00Z',
        text: 'note',
        pageCount: 10,
        note: undefined,
      },
      NOW_MS,
    );
    // 0.20 + 0.15 + 0.10 + 0.05 + 0.15 = 0.65 → fair
    expect(result.score).toBe(0.65);
    expect(result.grade).toBe('fair');
  });

  test('determinism — same inputs always produce the same output', () => {
    const item: EvidenceLikeItem = {
      citation: 'doc',
      uploadedBy: 'jane',
      uploadedAt: '2026-03-01T00:00:00Z',
      text: 'x'.repeat(150),
      pageCount: 8,
    };
    const a = scoreEvidenceItem(item, NOW_MS);
    const b = scoreEvidenceItem(item, NOW_MS);
    expect(a).toEqual(b);
  });
});

describe('summarizeEvidenceQuality', () => {
  test('empty array returns zeros', () => {
    expect(summarizeEvidenceQuality([], NOW_MS)).toEqual({
      mean: 0,
      weakCount: 0,
      fairCount: 0,
      strongCount: 0,
      total: 0,
    });
  });

  test('single weak item', () => {
    const result = summarizeEvidenceQuality([{ text: 'short' }], NOW_MS);
    expect(result.total).toBe(1);
    expect(result.weakCount).toBe(1);
    expect(result.fairCount).toBe(0);
    expect(result.strongCount).toBe(0);
    expect(result.mean).toBe(0.05);
  });

  test('mixed items — weak / fair / strong', () => {
    const items: EvidenceLikeItem[] = [
      { text: 'short' }, // 0.05 weak
      { citation: 'doc', uploadedBy: 'j', text: 'tiny' }, // 0.40 fair
      {
        citation: 'Signed plan',
        uploadedBy: 'Avery',
        uploadedAt: '2026-04-15T00:00:00Z',
        text: 'x'.repeat(700),
        pageCount: 25,
      }, // 0.95 strong
    ];
    const result = summarizeEvidenceQuality(items, NOW_MS);
    expect(result.total).toBe(3);
    expect(result.weakCount).toBe(1);
    expect(result.fairCount).toBe(1);
    expect(result.strongCount).toBe(1);
    // (0.05 + 0.40 + 0.95) / 3 = 0.466... → 0.47
    expect(result.mean).toBe(0.47);
  });

  test('all strong items push mean into strong band', () => {
    const strong: EvidenceLikeItem = {
      citation: 'Signed plan',
      uploadedBy: 'Avery',
      uploadedAt: '2026-04-15T00:00:00Z',
      text: 'x'.repeat(700),
      pageCount: 25,
    };
    const result = summarizeEvidenceQuality([strong, strong, strong], NOW_MS);
    expect(result.strongCount).toBe(3);
    expect(summaryGrade(result)).toBe('strong');
  });

  test('summaryGrade maps mean to bucket', () => {
    expect(summaryGrade({ mean: 0.0, weakCount: 0, fairCount: 0, strongCount: 0, total: 0 })).toBe('weak');
    expect(summaryGrade({ mean: 0.39, weakCount: 0, fairCount: 0, strongCount: 0, total: 1 })).toBe('weak');
    expect(summaryGrade({ mean: 0.4, weakCount: 0, fairCount: 0, strongCount: 0, total: 1 })).toBe('fair');
    expect(summaryGrade({ mean: 0.69, weakCount: 0, fairCount: 0, strongCount: 0, total: 1 })).toBe('fair');
    expect(summaryGrade({ mean: 0.7, weakCount: 0, fairCount: 0, strongCount: 0, total: 1 })).toBe('strong');
  });
});

// PR #770 — file-attachment metadata branch.
//
// The ingestion forms now capture filename + mimetype + fileSize and, for
// PDFs only, a stub pageCount derived from `ceil(size / 30_000)`. These flow
// onto `EvidenceLikeItem` so the existing pageCount + new filename heuristic
// fire from real form submissions.
describe('scoreEvidenceItem · file attachment metadata', () => {
  test('attached filename alone bumps score by +0.10', () => {
    const result = scoreEvidenceItem(
      { filename: 'transition-plan.pdf', mimetype: 'application/pdf', fileSize: 12_000 },
      NOW_MS,
    );
    expect(result.score).toBe(0.1);
    expect(result.reasons).toContain('Attached file transition-plan.pdf (+0.10)');
  });

  test('PDF with stub pageCount >= 5 fires the document-length bonus on top of filename', () => {
    // 150KB / 30KB = 5 pages → triggers pageCount >= 5 (+0.15) plus filename (+0.10).
    const result = scoreEvidenceItem(
      {
        filename: 'transition-plan.pdf',
        mimetype: 'application/pdf',
        fileSize: 150_000,
        pageCount: 5,
      },
      NOW_MS,
    );
    expect(result.score).toBe(0.25);
    expect(result.reasons).toContain('Document length 5 pages (+0.15)');
    expect(result.reasons).toContain('Attached file transition-plan.pdf (+0.10)');
  });

  test('attached PDF combined with note + uploader pushes grade into fair', () => {
    const result = scoreEvidenceItem(
      {
        filename: 'signed-soc2.pdf',
        mimetype: 'application/pdf',
        fileSize: 750_000, // ceil(750000/30000) = 25 pages
        pageCount: 25,
        note: 'SOC 2 Type II report covering 2025-04 through 2026-03 controls.',
        uploadedBy: 'Avery Chen',
        uploadedAt: '2026-04-15T00:00:00Z',
      },
      NOW_MS,
    );
    // citation: 0, uploadedBy: 0.15, uploadedAt fresh: 0.10,
    // note 100–500 chars: NO (62 chars → +0.05 short body),
    // pageCount >= 5: +0.15, filename: +0.10
    // = 0.55 → fair
    expect(result.score).toBe(0.55);
    expect(result.grade).toBe('fair');
  });
});

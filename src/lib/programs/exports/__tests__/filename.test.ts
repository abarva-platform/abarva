// EXPORT-1 · filename.ts unit tests.
//
// Covers:
//   • Sanitization of unsafe filename characters.
//   • Lowercased extension.
//   • Length cap at 200 chars.
//   • UTC yyyymmdd date stamp.

import { buildExportFilename } from '@/lib/programs/exports/filename';

describe('buildExportFilename', () => {
  it('produces the canonical {slug}-{kind}-{yyyymmdd}.{ext} pattern', () => {
    const out = buildExportFilename({
      title: 'Program Charter Apex Retail',
      kind: 'program-charter',
      format: 'docx',
      generatedAt: new Date(Date.UTC(2026, 3, 29)), // 2026-04-29
    });
    expect(out).toBe('program-charter-apex-retail-program-charter-20260429.docx');
  });

  it('replaces unsafe filesystem characters with dashes', () => {
    const out = buildExportFilename({
      title: 'Q2/Charter:Apex*Retail?"<test>|file\\name',
      kind: 'program-charter',
      format: 'docx',
      generatedAt: new Date(Date.UTC(2026, 0, 1)),
    });
    // Each unsafe char is replaced; runs collapse to single dash.
    expect(out).not.toMatch(/[/\\:*?"<>|]/);
    expect(out).toMatch(/^q2-charter-apex-retail-test-file-name-program-charter-20260101\.docx$/);
  });

  it('lowercases the extension regardless of input case', () => {
    const out = buildExportFilename({
      title: 'Roadmap',
      kind: 'roadmap',
      format: 'html',
      generatedAt: new Date(Date.UTC(2026, 5, 15)),
    });
    expect(out.endsWith('.html')).toBe(true);
    expect(out).toBe('roadmap-roadmap-20260615.html');
  });

  it('uses UTC for yyyymmdd to avoid TZ-induced drift', () => {
    // 2026-12-31 23:30 UTC is 2027-01-01 in local-timezone east of UTC,
    // and 2026-12-31 in UTC. Locking to UTC keeps the stamp deterministic.
    const out = buildExportFilename({
      title: 'Year End',
      kind: 'outcome-report',
      format: 'docx',
      generatedAt: new Date(Date.UTC(2026, 11, 31, 23, 30, 0)),
    });
    expect(out).toMatch(/-20261231\./);
  });

  it('caps length at 200 characters even for long titles', () => {
    const longTitle = 'a'.repeat(500);
    const out = buildExportFilename({
      title: longTitle,
      kind: 'program-charter',
      format: 'docx',
      generatedAt: new Date(Date.UTC(2026, 3, 29)),
    });
    expect(out.length).toBeLessThanOrEqual(200);
    expect(out.endsWith('-program-charter-20260429.docx')).toBe(true);
  });

  it('falls back to "deliverable" when sanitized title is empty', () => {
    const out = buildExportFilename({
      title: '???///',
      kind: 'meeting-notes',
      format: 'docx',
      generatedAt: new Date(Date.UTC(2026, 3, 29)),
    });
    expect(out).toBe('deliverable-meeting-notes-20260429.docx');
  });

  it('collapses runs of unsafe chars and trims edge dashes', () => {
    const out = buildExportFilename({
      title: '   ///Hello   World///   ',
      kind: 'meeting-notes',
      format: 'docx',
      generatedAt: new Date(Date.UTC(2026, 3, 29)),
    });
    expect(out).toBe('hello-world-meeting-notes-20260429.docx');
  });

  it('defaults generatedAt to now() when omitted', () => {
    const out = buildExportFilename({
      title: 'Now',
      kind: 'roadmap',
      format: 'html',
    });
    expect(out).toMatch(/^now-roadmap-\d{8}\.html$/);
  });
});

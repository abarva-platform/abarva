import {
  evidenceForUnsupportedAttachment,
  extractProgramEvidenceFromText,
} from '../evidence-ingestion';

describe('program evidence ingestion', () => {
  it('extracts structured meeting signals from uploaded notes text', () => {
    const evidence = extractProgramEvidenceFromText({
      filename: 'P1 baseline workshop meeting notes.md',
      mimeType: 'text/markdown',
      text: [
        'Attendees: Sarah Chen, Rick Stewart, Finance Lead',
        'Decision: DORA baseline will be the hard P1 exit criterion.',
        'Action: Rick Stewart to provide lead time and deployment frequency by Friday.',
        'Risk: Data platform team is already committed to another roadmap.',
        'Baseline: Deployment frequency is currently weekly.',
      ].join('\n'),
    });

    expect(evidence.evidenceType).toBe('meeting_notes');
    expect(evidence.extractedStructured.attendees).toEqual([
      'Sarah Chen',
      'Rick Stewart',
      'Finance Lead',
    ]);
    expect(evidence.extractedStructured.decisions[0]).toContain('DORA baseline');
    expect(evidence.extractedStructured.action_items[0]).toContain('Rick Stewart');
    expect(evidence.extractedStructured.risks[0]).toContain('Data platform');
    expect(evidence.extractedStructured.baseline_candidates[0]).toContain('Deployment frequency');
    expect(evidence.extractedStructured.parse_method).toBe('markdown-line-parser');
  });

  it('creates metadata-only evidence for unsupported binary attachments', () => {
    const evidence = evidenceForUnsupportedAttachment({
      filename: 'architecture inventory.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    expect(evidence.evidenceType).toBe('uploaded_artifact');
    expect(evidence.extractedText).toBeNull();
    expect(evidence.extractedStructured.parse_method).toBe('metadata-only');
    expect(evidence.extractedStructured.warnings[0]).toContain('Structured parsing unavailable');
  });
});

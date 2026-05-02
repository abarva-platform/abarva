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

  it('extracts structured signals from section-based workshop notes', () => {
    const evidence = extractProgramEvidenceFromText({
      filename: 'P1 discovery workshop notes.txt',
      mimeType: 'text/plain',
      text: [
        'Attendees: Ethan Brooks, Priya Mehta, Lena Ortiz',
        'Decisions:',
        '- Scope first cohort to digital banking product analytics.',
        '- Do not include core replacement execution in this program.',
        'Baseline candidates:',
        '- Analytics request-to-insight cycle time.',
        '- Payments/fraud signal latency.',
        'Actions:',
        '- Rachel Kim to provide analytics cycle-time and lineage extract.',
        '- James Park to provide payments/fraud signal latency sample.',
        'Risks:',
        '- Program could drift into core replacement.',
        '- Exact financial impact remains restricted.',
      ].join('\n'),
    });

    expect(evidence.evidenceType).toBe('meeting_notes');
    expect(evidence.extractedStructured.decisions).toEqual([
      'Scope first cohort to digital banking product analytics.',
      'Do not include core replacement execution in this program.',
    ]);
    expect(evidence.extractedStructured.baseline_candidates).toEqual([
      'Analytics request-to-insight cycle time.',
      'Payments/fraud signal latency.',
    ]);
    expect(evidence.extractedStructured.action_items).toEqual([
      'Rachel Kim to provide analytics cycle-time and lineage extract.',
      'James Park to provide payments/fraud signal latency sample.',
    ]);
    expect(evidence.extractedStructured.risks).toEqual([
      'Program could drift into core replacement.',
      'Exact financial impact remains restricted.',
    ]);
  });

  it('extracts baseline and decision bullets from natural consulting headings', () => {
    const evidence = extractProgramEvidenceFromText({
      filename: 'P1 baseline attestation.txt',
      mimeType: 'text/plain',
      text: [
        'Attendees: Ethan Brooks, Priya Mehta, Lena Ortiz',
        'Sponsor decision:',
        '- Priya Mehta approves PROCEED to P2 Synthesis once this addendum is saved.',
        'Attested baseline metrics:',
        '- Analytics request-to-insight cycle time: 21 business days current baseline.',
        '- Data lineage completeness: 62% current baseline.',
        'Risks:',
        '- Model-risk evidence may be incomplete before charter.',
      ].join('\n'),
    });

    expect(evidence.extractedStructured.decisions).toEqual([
      'Priya Mehta approves PROCEED to P2 Synthesis once this addendum is saved.',
    ]);
    expect(evidence.extractedStructured.baseline_candidates).toEqual([
      'Analytics request-to-insight cycle time: 21 business days current baseline.',
      'Data lineage completeness: 62% current baseline.',
    ]);
    expect(evidence.extractedStructured.risks).toEqual([
      'Model-risk evidence may be incomplete before charter.',
    ]);
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

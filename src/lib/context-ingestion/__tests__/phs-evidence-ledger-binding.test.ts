import { buildPHSEvidenceLedgerInputs } from '../phs-evidence-ledger-binding';

describe('PHS evidence ledger binding', () => {
  it('maps evidence-register rows into citation-grade evidence ledger inputs', () => {
    const inputs = buildPHSEvidenceLedgerInputs({
      clientId: 'client-meridian',
      uploadedBy: 'user-1',
      uploadId: 'csv:meridian-health:evidence',
      fileName: 'phs-evidence-register.csv',
      rows: [
        {
          citation_key: 'PHS-STARS-2026',
          title: 'Stars baseline',
          source_type: 'public',
          owner: 'Data steward',
          evidence_date: '2026-06-05',
          sensitivity: 'public',
          confidence: 'high',
          summary: 'CMS Stars baseline for the PHS strategy demo.',
          usable_by_surface: 'moves,admin,tower',
          source_url: 'https://example.test/stars',
          storage_path: '',
          source_quote: '3.0 Stars baseline',
        },
      ],
    });

    expect(inputs).toEqual([
      expect.objectContaining({
        clientId: 'client-meridian',
        surface: 'moves',
        artifactType: 'citation',
        artifactRef: 'PHS-STARS-2026',
        sourceType: 'document_extract',
        freshnessAt: '2026-06-05',
        confidence: 0.9,
        ownerRole: 'Data steward',
        createdBy: 'user-1',
        sourceRef: expect.objectContaining({
          citation_key: 'PHS-STARS-2026',
          source_doc: 'phs-evidence-register.csv',
          source_row: 2,
          usable_by_surface: ['moves', 'admin', 'tower'],
        }),
      }),
    ]);
  });
});

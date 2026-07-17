import { evaluateSensitiveUpload } from '../sensitive-upload-guard';

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function pdfBytes(text: string): Uint8Array {
  return bytes(`%PDF-1.4
1 0 obj
<< /Length 44 >>
stream
BT
(${text}) Tj
ET
endstream
endobj
%%EOF`);
}

describe('sensitive upload guard', () => {
  it('allows aggregate confidential business context', () => {
    const result = evaluateSensitiveUpload({
      filename: 'fy26-kpi-summary.csv',
      mimeType: 'text/csv',
      bytes: bytes('metric,value\nstore_margin_gap,4.2\ncloud_run_rate,117800000\n'),
      declaredClassification: 'confidential_business',
    });

    expect(result.decision).toBe('allow');
    expect(result.storageAllowed).toBe(true);
    expect(result.indexingAllowed).toBe(true);
    expect(result.declaredClassification).toBe('confidential_business');
  });

  it('allows de-identified healthcare operations evidence for member-service workflows', () => {
    const result = evaluateSensitiveUpload({
      filename: 'agent-assist-process-baseline.md',
      mimeType: 'text/markdown',
      bytes: bytes(
        'Member service agents review claims status, benefits, eligibility, prior authorization, CRM history, and knowledge-base guidance. No member identifiers are included.',
      ),
      declaredClassification: 'confidential_business',
    });

    expect(result.decision).toBe('allow');
    expect(result.suspectedPhi).toBe(false);
    expect(result.matchedRules.map((rule) => rule.ruleId)).not.toContain(
      'phi.mrn',
    );
  });

  it('quarantines declared regulated PHI/PII even without pattern hits', () => {
    const result = evaluateSensitiveUpload({
      filename: 'clinical-notes.csv',
      mimeType: 'text/csv',
      bytes: bytes('condition,count\nsepsis,12\n'),
      declaredClassification: 'regulated_phi_pii_suspected',
    });

    expect(result.decision).toBe('quarantine');
    expect(result.storageAllowed).toBe(false);
    expect(result.evidenceExtractionAllowed).toBe(false);
  });

  it('quarantines direct patient identifiers before storage or indexing', () => {
    const result = evaluateSensitiveUpload({
      filename: 'hcc-review.csv',
      mimeType: 'text/csv',
      bytes: bytes('Patient ID: MH123456\nDOB: 01/03/1972\nrisk_gap,0.14\n'),
      declaredClassification: 'confidential_business',
    });

    expect(result.decision).toBe('quarantine');
    expect(result.suspectedPhi).toBe(true);
    expect(result.matchedRules.map((rule) => rule.ruleId)).toEqual(
      expect.arrayContaining(['phi.mrn', 'phi.dob']),
    );
  });

  it('quarantines high-risk financial identifiers', () => {
    const result = evaluateSensitiveUpload({
      filename: 'banking-detail.txt',
      mimeType: 'text/plain',
      bytes: bytes('customer routing number: 021000021\naccount number: 987654321012\n'),
      declaredClassification: 'restricted_financial',
    });

    expect(result.decision).toBe('quarantine');
    expect(result.suspectedFinancialIdentifiers).toBe(true);
    expect(result.indexingAllowed).toBe(false);
  });

  it('does not quarantine business contact emails by themselves', () => {
    const result = evaluateSensitiveUpload({
      filename: 'vendor-renewal-notes.md',
      mimeType: 'text/markdown',
      bytes: bytes('Owner: cfo@example.com\nRenewal: Salesforce Commerce Cloud\n'),
      declaredClassification: 'confidential_business',
    });

    expect(result.decision).toBe('allow');
    expect(result.suspectedPii).toBe(true);
    expect(result.matchedRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: 'pii.email', severity: 'medium' }),
      ]),
    );
  });

  it('allows harmless PDFs even when compressed-looking raw bytes resemble identifiers', () => {
    const noisyPdf = new Uint8Array([
      ...bytes('%PDF-1.7\n'),
      0, 1, 2, 3, 255, 254, 253,
      ...bytes('4111111111111111 2125551212 4111111111111111'),
      8, 9, 10, 11,
      ...bytes('\n%%EOF'),
    ]);

    const result = evaluateSensitiveUpload({
      filename: 'contract-control-workshop.pdf',
      mimeType: 'application/pdf',
      bytes: noisyPdf,
      declaredClassification: 'confidential_business',
    });

    expect(result.decision).toBe('allow');
    expect(result.matchedRules).toEqual([]);
  });

  it('quarantines sensitive text when it is extractable from a PDF text object', () => {
    const result = evaluateSensitiveUpload({
      filename: 'sensitive-contract-note.pdf',
      mimeType: 'application/pdf',
      bytes: pdfBytes('Escalation note includes SSN 123-45-6789'),
      declaredClassification: 'confidential_business',
    });

    expect(result.decision).toBe('quarantine');
    expect(result.matchedRules.map((rule) => rule.ruleId)).toContain('pii.ssn');
  });

  it('does not scan Office archive bytes as plain text', () => {
    const noisyDocxBytes = new Uint8Array([
      ...bytes('PK\u0003\u0004'),
      ...bytes('4111111111111111 2125551212'),
      0, 4, 8, 12,
    ]);

    const result = evaluateSensitiveUpload({
      filename: 'legal-contract-intake-final.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      bytes: noisyDocxBytes,
      declaredClassification: 'confidential_business',
    });

    expect(result.decision).toBe('allow');
    expect(result.matchedRules).toEqual([]);
  });
});

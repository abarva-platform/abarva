import { evaluateSensitiveUpload } from '../sensitive-upload-guard';

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
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
});

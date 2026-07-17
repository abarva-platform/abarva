import {
  scanPreIngestSensitiveText,
  toPresidioCompatibleEntities,
} from "../preingest-sensitive-scanner";

describe("pre-ingest sensitive scanner", () => {
  it("detects PHI-style patient identifiers as quarantine findings", () => {
    const result = scanPreIngestSensitiveText(
      "Patient ID: MH123456\nDOB: 01/03/1972\nrisk_gap,0.14",
    );

    expect(result).toMatchObject({
      suspectedPhi: true,
      suspectedPii: true,
      requiresQuarantine: true,
    });
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "phi.mrn",
          entityType: "MEDICAL_RECORD_NUMBER",
          action: "quarantine",
          recognizer: "deterministic-pattern",
        }),
        expect.objectContaining({
          ruleId: "phi.dob",
          entityType: "DATE_OF_BIRTH",
          action: "quarantine",
        }),
      ]),
    );
  });

  it("does not treat healthcare operations language as a patient identifier", () => {
    const result = scanPreIngestSensitiveText(
      "Member service agents review claims status, benefits, eligibility, prior authorization, CRM history, and knowledge-base guidance. No member identifiers are included.",
    );

    expect(result.suspectedPhi).toBe(false);
    expect(result.requiresQuarantine).toBe(false);
    expect(result.findings.map((finding) => finding.ruleId)).not.toContain(
      "phi.mrn",
    );
  });

  it("detects SSN and financial identifiers before evidence extraction", () => {
    const result = scanPreIngestSensitiveText(
      "SSN 123-45-6789\nrouting number: 021000021\ncard: 4111 1111 1111 1111",
    );

    expect(result.requiresQuarantine).toBe(true);
    expect(result.suspectedFinancialIdentifiers).toBe(true);
    expect(result.findings.map((finding) => finding.ruleId)).toEqual(
      expect.arrayContaining([
        "pii.ssn",
        "financial.routing_or_account",
        "financial.card",
      ]),
    );
  });

  it("flags business contact details without forcing quarantine", () => {
    const result = scanPreIngestSensitiveText(
      "Owner: cfo@example.com\nPhone: 312-555-0199\nRenewal: Salesforce",
    );

    expect(result.suspectedPii).toBe(true);
    expect(result.requiresQuarantine).toBe(false);
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "pii.email", action: "flag" }),
        expect.objectContaining({ ruleId: "pii.phone", action: "flag" }),
      ]),
    );
  });

  it("emits Presidio-compatible entity names and scores", () => {
    const result = scanPreIngestSensitiveText(
      "DOB: 1972-01-03\nSSN 123-45-6789",
    );

    expect(toPresidioCompatibleEntities(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entity_type: "DATE_OF_BIRTH",
          score: expect.any(Number),
          count: 1,
        }),
        expect.objectContaining({
          entity_type: "US_SSN",
          score: expect.any(Number),
          count: 1,
        }),
      ]),
    );
  });
});

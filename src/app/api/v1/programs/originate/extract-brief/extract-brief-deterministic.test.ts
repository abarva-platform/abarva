import { extractDeterministicBriefFields } from "./route";

describe("extractDeterministicBriefFields", () => {
  it("fills the Move scaffold from an explicitly labeled Kyriba treasury brief", () => {
    const fields = extractDeterministicBriefFields(`USER: Create a strategic Move for Lakeshore Holdings' Kyriba treasury rollout.
Lakeshore Holdings is a diversified private holding company; its portfolio companies roll up to $7.12B in revenue.
Corporate IT budget is $36.5M and total direct IT budget is $190.6M.
The business problem is treasury visibility and payment-control risk across banks, SAP feeds, signers, payment formats, and SOX evidence.
Sponsor candidate: CFO and Treasurer, with CIO support.
Scope: treasury operations, bank connectivity, SAP finance feeds, payment controls, and control evidence; out of scope: changing the ERP core in this move.
Evidence family: finance systems, treasury operations, risk and controls, vendor/contracts, data readiness.
Value hypothesis: faster cash visibility, lower manual reconciliation effort, cleaner payment-control evidence, and better board confidence.
Foundation readiness: Kyriba rollout is underway, but data lineage, bank connectivity inventory, signer controls, and SOX evidence need validation.`);

    expect(fields).toEqual({
      "problem-statement":
        "Create a strategic Move for Lakeshore Holdings' Kyriba treasury rollout. The business problem is treasury visibility and payment-control risk across banks, SAP feeds, signers, payment formats, and SOX evidence.",
      archetype: "Treasury modernization and finance-controls move.",
      "sponsor-candidate": "CFO and Treasurer, with CIO support.",
      "scope-boundary":
        "treasury operations, bank connectivity, SAP finance feeds, payment controls, and control evidence; out of scope: changing the ERP core in this move.",
      "evidence-family":
        "finance systems, treasury operations, risk and controls, vendor/contracts, data readiness.",
      "value-hypothesis":
        "faster cash visibility, lower manual reconciliation effort, cleaner payment-control evidence, and better board confidence.",
      "foundation-readiness":
        "Kyriba rollout is underway, but data lineage, bank connectivity inventory, signer controls, and SOX evidence need validation.",
    });
  });

  it("extracts inline labeled fields from a one-paragraph executive prompt", () => {
    const fields = extractDeterministicBriefFields(
      `USER: Create a strategic Move for Lakeshore Holdings' Kyriba treasury rollout. Lakeshore Holdings is a diversified private holding company; its portfolio companies roll up to $7.12B in revenue. Corporate IT budget is $36.5M and total direct IT budget is $190.6M. The business problem is treasury visibility and payment-control risk across banks, SAP feeds, signers, payment formats, and SOX evidence. Sponsor candidate: CFO and Treasurer, with CIO support. Scope: treasury operations, bank connectivity, SAP finance feeds, payment controls, and control evidence; out of scope: changing the ERP core in this move. Evidence family: finance systems, treasury operations, risk and controls, vendor/contracts, data readiness. Value hypothesis: faster cash visibility, lower manual reconciliation effort, cleaner payment-control evidence, and better board confidence. Foundation readiness: Kyriba rollout is underway, but data lineage, bank connectivity inventory, signer controls, and SOX evidence need validation.`,
    );

    expect(fields["sponsor-candidate"]).toBe(
      "CFO and Treasurer, with CIO support.",
    );
    expect(fields["scope-boundary"]).toBe(
      "treasury operations, bank connectivity, SAP finance feeds, payment controls, and control evidence; out of scope: changing the ERP core in this move.",
    );
    expect(fields["evidence-family"]).toBe(
      "finance systems, treasury operations, risk and controls, vendor/contracts, data readiness.",
    );
    expect(fields["value-hypothesis"]).toBe(
      "faster cash visibility, lower manual reconciliation effort, cleaner payment-control evidence, and better board confidence.",
    );
    expect(fields["foundation-readiness"]).toBe(
      "Kyriba rollout is underway, but data lineage, bank connectivity inventory, signer controls, and SOX evidence need validation.",
    );
    expect(fields.archetype).toBe(
      "Treasury modernization and finance-controls move.",
    );
  });
});

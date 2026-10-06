import { contractFromAward, type AwardDecision } from "./contract-from-award";

const award: AwardDecision = {
  tenantKey: "meridian-health",
  eventId: "9edaaf34-1e7f-4ccf-bc77-5f576de90ae2",
  eventCode: "MERI-IN-SCOPE-FOR-2026-BC9FACB8",
  vendorId: "SYN-SUP-AMS-001",
  vendorLegalName: "Fictional Aster Ridge Managed Services LLC",
  contractName: "IT infrastructure and service-desk managed services",
  currency: "USD",
  approvedBy: "user-cio",
  approvedAt: "2026-12-15T16:04:00.000Z",
};

const ok = (r: ReturnType<typeof contractFromAward>) => {
  if (!r.ok) throw new Error(`expected ok, refused: ${r.refusals.join("; ")}`);
  return r.row;
};

describe("contractFromAward", () => {
  it("carries the originating event onto the contract row", () => {
    const row = ok(contractFromAward(award));
    expect(row.sourceEventId).toBe(award.eventId);
    expect(row.vendorId).toBe("SYN-SUP-AMS-001");
    expect(row.contractName).toBe(award.contractName);
    expect(row.tenantKey).toBe("meridian-health");
  });

  it("refuses an award whose supplier identity is unresolved", () => {
    const r = contractFromAward({ ...award, vendorId: null });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.refusals).toContain("The winning supplier has no resolved canonical identity");
  });

  it("refuses an award with no named approver", () => {
    const r = contractFromAward({ ...award, approvedBy: "   " });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.refusals).toContain("The award has no named approver");
  });

  it("refuses rather than inventing a contract name", () => {
    const r = contractFromAward({ ...award, contractName: "" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.refusals).toContain("The award has no contract name");
  });

  it("is idempotent under replay: the same award yields the same contract id", () => {
    expect(ok(contractFromAward(award)).contractId).toBe(
      ok(contractFromAward({ ...award, approvedAt: "2027-01-02T09:00:00.000Z" })).contractId,
    );
  });

  it("gives a different contract id to a different winning supplier", () => {
    // The negative control for idempotency: if the id ignored its inputs it
    // would be stable here too, and the replay test above would prove nothing.
    expect(ok(contractFromAward(award)).contractId).not.toBe(
      ok(contractFromAward({ ...award, vendorId: "SYN-SUP-AMS-002" })).contractId,
    );
  });

  it("gives a different contract id to the same supplier on a different event", () => {
    expect(ok(contractFromAward(award)).contractId).not.toBe(
      ok(contractFromAward({ ...award, eventId: "00000000-0000-4000-8000-000000000001" })).contractId,
    );
  });

  it("reports every refusal at once rather than only the first", () => {
    const r = contractFromAward({ ...award, vendorId: null, approvedBy: "", contractName: "" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.refusals).toHaveLength(3);
  });
});

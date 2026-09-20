import {
  evaluateRfxPackageRelease,
  type RfxPackage,
  type RfxRecipient,
  type RfxReleaseInput,
} from "@/lib/source/rfx-delivery/rfx-package-release-authority";

/**
 * Stage 06 names eight facts a supplier package must record — disclosure
 * scope, authentication, expiry, revocation, receipt proof, do-not-contact
 * enforcement, canonical entity binding, and audit events — and puts real
 * supplier contact behind a separate human gate.
 *
 * These cases exist because seven of those eight are only meaningful when
 * their absence refuses. A package that discloses an unnamed scope to an
 * unauthenticated recipient with no expiry is not a package with some fields
 * left blank; it is an open door. So each case removes one fact and pins the
 * refusal, and the last two pin the boundary: a release is not a receipt,
 * and nothing in the module can transmit.
 */

const CONTACT: RfxRecipient = {
  recipientId: "r1",
  legalEntityId: "e1",
  contactId: "c1",
  contactName: "A. Buyer",
  contactEmail: "a.buyer@example.test",
  contactPolicy: "contact_allowed",
};

function pkg(overrides: Partial<RfxPackage> = {}): RfxPackage {
  return {
    packageId: "pkg-1",
    tenantKey: "t1",
    eventId: "evt-1",
    disclosureScope: {
      classification: "rfp_requirements",
      includedArtifactIds: ["art-1"],
    },
    authentication: { method: "magic_link", expiresAt: "2026-10-01T00:00:00Z" },
    expiresAt: "2026-10-01T00:00:00Z",
    recipients: [CONTACT],
    receipts: [],
    ...overrides,
  };
}

function input(overrides: Partial<RfxReleaseInput> = {}): RfxReleaseInput {
  return {
    package: pkg(),
    supplierContactPolicies: { e1: "contact_allowed" },
    asOf: "2026-09-19T00:00:00Z",
    ...overrides,
  };
}

describe("stage 06 RFx package release authority", () => {
  it("clears a complete package for the human release gate, and no further", () => {
    const decision = evaluateRfxPackageRelease(input());

    expect(decision.state).toBe("ready_for_human_release");
    expect(decision.defects).toEqual([]);
    expect(decision.recipients[0]?.releasable).toBe(true);
    // The furthest state reachable. There is no "sent", by design.
    expect(decision.auditEvent.externallyTransmitted).toBe(false);
  });

  it("refuses a package that does not say what it discloses", () => {
    const decision = evaluateRfxPackageRelease(
      input({
        package: pkg({
          disclosureScope: { classification: "", includedArtifactIds: ["art-1"] },
        }),
      }),
    );

    expect(decision.state).toBe("blocked");
    expect(decision.defects.join(" ")).toContain("No disclosure scope");
  });

  it("refuses a package whose declared scope names no artifacts", () => {
    // A classification on its own is a label. Without the artifact ids
    // there is nothing to say the package actually carries.
    const decision = evaluateRfxPackageRelease(
      input({
        package: pkg({
          disclosureScope: {
            classification: "rfp_requirements",
            includedArtifactIds: [],
          },
        }),
      }),
    );

    expect(decision.state).toBe("blocked");
    expect(decision.defects.join(" ")).toContain("names no artifacts");
  });

  it("refuses a package with no recipient authentication", () => {
    const decision = evaluateRfxPackageRelease(
      input({ package: pkg({ authentication: { method: "none" } }) }),
    );

    expect(decision.state).toBe("blocked");
    expect(decision.defects.join(" ")).toContain("authentication");
  });

  it("refuses a package with no usable expiry rather than treating it as open-ended", () => {
    const decision = evaluateRfxPackageRelease(
      input({ package: pkg({ expiresAt: "" }) }),
    );

    expect(decision.state).toBe("blocked");
    expect(decision.defects.join(" ")).toContain("never stops being open");
  });

  it("reports a stale package as expired", () => {
    const decision = evaluateRfxPackageRelease(
      input({ asOf: "2026-11-01T00:00:00Z" }),
    );

    expect(decision.state).toBe("expired");
  });

  it("does not let expiry mask a package that was never well-formed", () => {
    // Re-issuing with a later date would "fix" an expired package. It must
    // not fix one that never declared what it discloses.
    const decision = evaluateRfxPackageRelease(
      input({
        package: pkg({
          disclosureScope: { classification: "", includedArtifactIds: [] },
        }),
        asOf: "2026-11-01T00:00:00Z",
      }),
    );

    expect(decision.state).toBe("blocked");
  });

  it("refuses when the clock it is asked to judge against is unreadable", () => {
    // Without this the expiry comparison is simply skipped, and a package
    // evaluated against a nonsense timestamp reads as in date.
    const decision = evaluateRfxPackageRelease(input({ asOf: "not-a-time" }));

    expect(decision.state).toBe("blocked");
    expect(decision.defects.join(" ")).toContain("evaluation time is unreadable");
  });

  it("reports a revoked package as revoked even while it is still in date", () => {
    const decision = evaluateRfxPackageRelease(
      input({
        package: pkg({
          revokedAt: "2026-09-10T00:00:00Z",
          revokedReason: "Scope withdrawn",
        }),
      }),
    );

    expect(decision.state).toBe("revoked");
    expect(decision.auditEvent.releasableRecipientIds).toEqual([]);
  });

  it("refuses an individual contact marked do-not-contact at a supplier that is otherwise open", () => {
    // The separation the decision asks for. Enforcing policy only at the
    // legal entity would approach this person.
    const decision = evaluateRfxPackageRelease(
      input({
        package: pkg({
          recipients: [
            CONTACT,
            { ...CONTACT, recipientId: "r2", contactId: "c2", contactPolicy: "do_not_contact" },
          ],
        }),
      }),
    );

    expect(decision.state).toBe("ready_for_human_release");
    const refused = decision.recipients.find((r) => r.recipientId === "r2");
    expect(refused?.releasable).toBe(false);
    expect(refused?.refusals.join(" ")).toContain("named contact is marked do-not-contact");
    expect(decision.auditEvent.releasableRecipientIds).toEqual(["r1"]);
    expect(decision.auditEvent.refusedRecipientIds).toEqual(["r2"]);
  });

  it("refuses every contact at a supplier marked do-not-contact", () => {
    const decision = evaluateRfxPackageRelease(
      input({ supplierContactPolicies: { e1: "do_not_contact" } }),
    );

    expect(decision.state).toBe("blocked");
    expect(decision.recipients[0]?.refusals.join(" ")).toContain("supplier is marked do-not-contact");
  });

  it("treats a supplier with no policy on record as not approachable", () => {
    // An absent policy is not permission.
    const decision = evaluateRfxPackageRelease(
      input({ supplierContactPolicies: {} }),
    );

    expect(decision.state).toBe("blocked");
    expect(decision.recipients[0]?.refusals.join(" ")).toContain("No supplier contact policy");
  });

  it("refuses a recipient that is not bound to both an entity and a named contact", () => {
    const decision = evaluateRfxPackageRelease(
      input({ package: pkg({ recipients: [{ ...CONTACT, contactId: "" }] }) }),
    );

    expect(decision.state).toBe("blocked");
    expect(decision.recipients[0]?.refusals.join(" ")).toContain("legal entity and a named contact");
  });

  it("does not manufacture a receipt by clearing a recipient for release", () => {
    // Released is not received. The whole value of receipt proof is that it
    // comes from the recipient.
    const cleared = evaluateRfxPackageRelease(input());
    expect(cleared.state).toBe("ready_for_human_release");
    expect(cleared.recipients[0]?.receiptState).toBe("no_receipt");

    const received = evaluateRfxPackageRelease(
      input({
        package: pkg({
          receipts: [
            { recipientId: "r1", receivedAt: "2026-09-18T00:00:00Z", evidenceSha256: "deadbeef" },
          ],
        }),
      }),
    );
    expect(received.recipients[0]?.receiptState).toBe("receipt_recorded");
  });

  it("ignores a receipt carrying no evidence hash", () => {
    const decision = evaluateRfxPackageRelease(
      input({
        package: pkg({
          receipts: [
            { recipientId: "r1", receivedAt: "2026-09-18T00:00:00Z", evidenceSha256: "" },
          ],
        }),
      }),
    );

    expect(decision.recipients[0]?.receiptState).toBe("no_receipt");
  });

  it("emits an audit event on a refusal, not only on a clearance", () => {
    // A gate that records only its approvals cannot show what it stopped.
    const decision = evaluateRfxPackageRelease(
      input({ supplierContactPolicies: { e1: "do_not_contact" } }),
    );

    expect(decision.auditEvent).toEqual({
      packageId: "pkg-1",
      tenantKey: "t1",
      eventId: "evt-1",
      evaluatedAt: "2026-09-19T00:00:00Z",
      state: "blocked",
      releasableRecipientIds: [],
      refusedRecipientIds: ["r1"],
      externallyTransmitted: false,
    });
  });

  it("exposes nothing that could transmit a package", () => {
    const decision = evaluateRfxPackageRelease(input());

    const values = [
      ...Object.values(decision),
      ...Object.values(decision.auditEvent),
      ...decision.recipients.flatMap((r) => Object.values(r)),
    ];
    expect(values.filter((v) => typeof v === "function")).toEqual([]);
  });
});

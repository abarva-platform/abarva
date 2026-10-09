// What the gate attestation ledger's sign-off column is allowed to assert.
//
// The sign-off columns on an artifact row have one null shape standing for
// three facts — the projection holds no record, the projection read failed, or
// nothing read it — and only the first of those licenses the ledger's
// "No sign-off version is tracked for this document yet." These cases pin the
// classifier that separates them, and in particular pin that NOTHING but a
// read the route itself reported healthy may state a signed-off count.

import {
  describeGateSignOffReadback,
  type GateSignOffReadbackState,
} from "@/lib/programs/gate-sign-off-readback";

describe("describeGateSignOffReadback", () => {
  it("states a count only when the route reported the projection healthy", () => {
    const readback = describeGateSignOffReadback({
      completed: true,
      loadFailed: false,
      deliverableSignOffStatus: "available",
    });
    expect(readback.state).toBe<GateSignOffReadbackState>("available");
    expect(readback.canStateSignedCount).toBe(true);
    expect(readback.countLabel).toBeNull();
    expect(readback.warning).toBeNull();
  });

  it("keeps the on-record wording for a healthy read that found no record", () => {
    const readback = describeGateSignOffReadback({
      completed: true,
      loadFailed: false,
      deliverableSignOffStatus: "available",
    });
    expect(readback.noRecordLabel).toBe("On record");
    expect(readback.noRecordNote).toMatch(/No sign-off version is tracked/i);
  });

  it("treats an un-run read as unread: no count, no record claim, no warning", () => {
    const readback = describeGateSignOffReadback({ completed: false });
    expect(readback.state).toBe<GateSignOffReadbackState>("unread");
    expect(readback.canStateSignedCount).toBe(false);
    expect(readback.countLabel).toBe("Sign-off state not read");
    // A warning here would fire on every initial paint.
    expect(readback.warning).toBeNull();
    expect(readback.noRecordNote).toMatch(/has not been read/i);
    // And it must not read as a negative about the document.
    expect(readback.noRecordNote).not.toMatch(
      /No sign-off version is tracked/i,
    );
  });

  it("treats an absent input as unread rather than as a successful read", () => {
    // A host that declares nothing has not read the projection. Defaulting the
    // other way is what let the server-rendered artifact list, which carries
    // no sign-off columns at all, report every gate document as unsigned.
    expect(
      describeGateSignOffReadback({}).state,
    ).toBe<GateSignOffReadbackState>("unread");
    expect(describeGateSignOffReadback({}).canStateSignedCount).toBe(false);
  });

  it("warns when the route reported its own sign-off sub-read failed", () => {
    const readback = describeGateSignOffReadback({
      completed: true,
      loadFailed: false,
      deliverableSignOffStatus: "unavailable",
    });
    expect(readback.state).toBe<GateSignOffReadbackState>("unavailable");
    expect(readback.canStateSignedCount).toBe(false);
    expect(readback.countLabel).toBe("Sign-off state unavailable");
    expect(readback.warning).toMatch(/could not be read/i);
    // The warning has to deny the negative reading explicitly, because the
    // ledger rows beside it look exactly like genuinely unsigned ones.
    expect(readback.warning).toMatch(/unknown, not negative/i);
    expect(readback.noRecordNote).toMatch(
      /not a statement that it is unsigned/i,
    );
  });

  it("outranks a healthy status with a failed load", () => {
    // The status describes a response. A load that did not complete has no
    // response to describe, so a stale "available" must not survive it.
    const readback = describeGateSignOffReadback({
      completed: true,
      loadFailed: true,
      deliverableSignOffStatus: "available",
    });
    expect(readback.state).toBe<GateSignOffReadbackState>("unknown");
    expect(readback.canStateSignedCount).toBe(false);
    expect(readback.warning).toMatch(/could not be refreshed/i);
  });

  it("treats a completed read that says nothing as unknown, not available", () => {
    // A route that stops sending the field cannot make the ledger assert
    // health it was never told about.
    for (const status of [undefined, null, "", "ok", "AVAILABLE", 1, {}]) {
      const readback = describeGateSignOffReadback({
        completed: true,
        loadFailed: false,
        deliverableSignOffStatus: status,
      });
      expect(readback.state).toBe<GateSignOffReadbackState>("unknown");
      expect(readback.canStateSignedCount).toBe(false);
      expect(readback.warning).not.toBeNull();
    }
  });

  it("gives every state that cannot state a count something to show instead", () => {
    const inputs = [
      { completed: false },
      {},
      { completed: true, loadFailed: true },
      { completed: true, deliverableSignOffStatus: "unavailable" },
      { completed: true, deliverableSignOffStatus: "mystery" },
    ];
    for (const input of inputs) {
      const readback = describeGateSignOffReadback(input);
      expect(readback.canStateSignedCount).toBe(false);
      expect(readback.countLabel).toBeTruthy();
      // None of these may reuse the healthy sentence.
      expect(readback.noRecordNote).not.toMatch(
        /No sign-off version is tracked/i,
      );
      expect(readback.noRecordLabel).not.toBe("On record");
    }
  });

  it("gives the healthy state nothing to show in place of the count", () => {
    const readback = describeGateSignOffReadback({
      completed: true,
      deliverableSignOffStatus: "available",
    });
    expect(readback.countLabel).toBeNull();
  });

  it("gives each state a badge distinct from its own section pill", () => {
    // The badge sits inside the section the pill heads, so identical text makes
    // the badge uninformative — and makes a test reading one of them pass on
    // the other.
    const inputs = [
      { completed: false },
      { completed: true, loadFailed: true },
      { completed: true, deliverableSignOffStatus: "unavailable" },
      { completed: true, deliverableSignOffStatus: "available" },
    ];
    for (const input of inputs) {
      const readback = describeGateSignOffReadback(input);
      expect(readback.noRecordLabel).not.toBe(readback.countLabel);
    }
  });

  it("gives each not-read state its own badge, so one cannot pass for another", () => {
    expect(
      describeGateSignOffReadback({ completed: false }).noRecordLabel,
    ).toBe("Not read");
    expect(
      describeGateSignOffReadback({ completed: true, loadFailed: true })
        .noRecordLabel,
    ).toBe("Read failed");
    expect(
      describeGateSignOffReadback({
        completed: true,
        deliverableSignOffStatus: "unavailable",
      }).noRecordLabel,
    ).toBe("Record unreadable");
    const labels = [
      describeGateSignOffReadback({ completed: false }).noRecordLabel,
      describeGateSignOffReadback({ completed: true, loadFailed: true })
        .noRecordLabel,
      describeGateSignOffReadback({
        completed: true,
        deliverableSignOffStatus: "unavailable",
      }).noRecordLabel,
      describeGateSignOffReadback({
        completed: true,
        deliverableSignOffStatus: "available",
      }).noRecordLabel,
    ];
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("distinguishes a lost read from a read that never ran", () => {
    const unread = describeGateSignOffReadback({ completed: false });
    const unknown = describeGateSignOffReadback({
      completed: true,
      loadFailed: true,
    });
    expect(unread.state).not.toBe(unknown.state);
    expect(unread.warning).toBeNull();
    expect(unknown.warning).not.toBeNull();
    expect(unread.countLabel).not.toBe(unknown.countLabel);
  });
});

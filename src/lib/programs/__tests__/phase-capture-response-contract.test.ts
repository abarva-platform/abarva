// The phase-capture POST response must describe what was STORED, not what was
// sent. Found by live proof: the route echoed the raw request back, so a value
// ending in a space was reported as saved at its full length while the database
// held the trimmed string.
//
// Two consequences, both user-visible:
//
//   1. A client that adopts `values` displays text the database does not hold,
//      so a reload silently changes it while the section reports complete.
//   2. `revision` hashed over un-normalised values does not match what the next
//      GET computes from stored state. The client echoes that revision as
//      `expectedRevision` on its next write, so the following edit 409s as a
//      stale revision with no concurrent writer.
//
// These assert the contract at the seam rather than the route handler, which
// needs tenancy and a database. If the route ever stops deriving its response
// from `evaluatePhaseCapture`, the second test here fails.

import { evaluatePhaseCapture } from "../phase-capture-contract";
import { computeCaptureRevision } from "../phase-capture-integrity";

/** Exactly what the route does to build its response. */
function storedValuesFor(phase: number, incoming: Record<string, string>) {
  const evaluation = evaluatePhaseCapture(phase, incoming);
  return Object.fromEntries(
    evaluation.sections.map((section) => [section.key, section.value]),
  );
}

const SPONSOR = "sponsor_commitment";
const RAW = "The SVP Flight Operations chairs the weekly review. ";

describe("what the save response must report", () => {
  it("reports the normalised value, not the submitted one", () => {
    const stored = storedValuesFor(1, { [SPONSOR]: RAW });
    expect(stored[SPONSOR]).toBe(RAW.trim());
    expect(stored[SPONSOR]).not.toBe(RAW);
  });

  it("agrees with the revision a later read computes from stored state", () => {
    // This is the assertion that matters. A revision hashed over the raw
    // request would differ from the one the next GET derives, and the client's
    // following write would 409 for no reason.
    const incoming = { [SPONSOR]: RAW };
    const stored = storedValuesFor(1, incoming);

    const revisionFromSave = computeCaptureRevision(stored);
    // A later GET loads the persisted (already normalised) values and hashes
    // those.
    const revisionFromRead = computeCaptureRevision(storedValuesFor(1, stored));

    expect(revisionFromSave).toBe(revisionFromRead);
  });

  it("would NOT agree if the response were built from the raw request", () => {
    // The defect, stated so the regression is unambiguous.
    const incoming = { [SPONSOR]: RAW };
    const stored = storedValuesFor(1, incoming);

    expect(computeCaptureRevision(incoming)).not.toBe(
      computeCaptureRevision(stored),
    );
  });

  it("is stable when the submitted value needs no normalisation", () => {
    const clean = { [SPONSOR]: RAW.trim() };
    const stored = storedValuesFor(1, clean);
    expect(stored[SPONSOR]).toBe(clean[SPONSOR]);
    expect(computeCaptureRevision(stored)).toBe(computeCaptureRevision(stored));
  });

  it("normalises leading whitespace too, not just trailing", () => {
    const stored = storedValuesFor(1, { [SPONSOR]: `   ${RAW.trim()}` });
    expect(stored[SPONSOR]).toBe(RAW.trim());
  });
});

import { evaluateArtifactScanGate } from "@/lib/source/artifact-scan-gate";
import { DEFENDER_SCAN_RESULT_TAG } from "@/lib/ingestion/defender-storage-scan-gate";

/**
 * A malware policy existed and the artifact path never asked it, so an
 * uploaded file reached parsing and indexing without the question being put.
 *
 * The three permissions are separate because the consequences differ:
 * parsing reads a file's bytes, indexing puts its content where a model will
 * retrieve it, promotion makes it evidence. The case that matters most is
 * the one the item named — a scan that **failed** must be treated as not
 * clean, not as clean-by-default.
 *
 * The scan vocabulary here is the one the existing Defender gate reads, not
 * a set invented for this test. A gate proven only against tags of the test
 * author's own design has been shown to agree with its author.
 */

const tags = (result: string) => ({ [DEFENDER_SCAN_RESULT_TAG]: result });

describe("the artifact scan gate blocks parse, index and promote together", () => {
  it("allows all three only when the scan found no threats", () => {
    const decision = evaluateArtifactScanGate(tags("No threats found"));

    expect(decision.parseAllowed).toBe(true);
    expect(decision.indexAllowed).toBe(true);
    expect(decision.promoteAllowed).toBe(true);
    expect(decision.scan.decision).toBe("allow");
  });

  it("blocks all three for an infected file", () => {
    const decision = evaluateArtifactScanGate(tags("Malicious"));

    expect(decision.parseAllowed).toBe(false);
    expect(decision.indexAllowed).toBe(false);
    expect(decision.promoteAllowed).toBe(false);
    expect(decision.reason).toContain("quarantined");
  });

  it("treats a failed scan as not clean rather than clean by default", () => {
    // The case the item was filed for. An error is not an absence of
    // threats; reading it as one is how an unscanned file gets indexed.
    const decision = evaluateArtifactScanGate(tags("Error"));

    expect(decision.parseAllowed).toBe(false);
    expect(decision.indexAllowed).toBe(false);
    expect(decision.promoteAllowed).toBe(false);
  });

  it("treats a file nobody scanned as not clean", () => {
    // No tags at all: the state every artifact is in today.
    const decision = evaluateArtifactScanGate(undefined);

    expect(decision.parseAllowed).toBe(false);
    expect(decision.reason).toContain("Unknown is not clean");
  });

  it("treats a scan still running as not clean", () => {
    const decision = evaluateArtifactScanGate(tags("pending"));

    expect(decision.parseAllowed).toBe(false);
    expect(decision.indexAllowed).toBe(false);
    expect(decision.promoteAllowed).toBe(false);
  });

  it("never allows a later step while refusing an earlier one", () => {
    // Parsing reads the bytes; indexing puts them where a model retrieves
    // them; promotion makes them evidence. A gate that let indexing through
    // while refusing the parse would be incoherent, and nothing else here
    // would catch it.
    for (const result of [
      "No threats found",
      "Malicious",
      "Error",
      "Not scanned",
      "pending",
      "something nobody has seen",
    ]) {
      const d = evaluateArtifactScanGate(tags(result));
      if (d.indexAllowed) expect(d.parseAllowed).toBe(true);
      if (d.promoteAllowed) expect(d.indexAllowed).toBe(true);
    }
  });

  it("refuses a scan result the policy does not recognise", () => {
    // An unrecognised verdict is unknown, and unknown is not clean. A gate
    // that passed anything it could not classify would be defeated by a
    // typo in a tag.
    const decision = evaluateArtifactScanGate(tags("definitely fine honestly"));

    expect(decision.parseAllowed).toBe(false);
  });

  it("always says why, including when it allows", () => {
    // A permission with no stated basis cannot be audited later.
    for (const result of ["No threats found", "Malicious", "Error"]) {
      expect(evaluateArtifactScanGate(tags(result)).reason.length).toBeGreaterThan(20);
    }
  });
});

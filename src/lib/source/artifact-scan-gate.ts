import {
  evaluateDefenderStorageScanTags,
  type DefenderStorageScanGateResult,
} from "@/lib/ingestion/defender-storage-scan-gate";

/**
 * Whether an uploaded artifact may be parsed, indexed or promoted.
 *
 * A malware policy already exists and the artifact path never asked it. This
 * asks it — and asks the **existing** one rather than writing another.
 *
 * There were already two before this file. `evaluateDefenderStorageScanTags`
 * reads the scan tags Defender writes and is wired to landing-zone
 * ingestion; `evaluatePilotMalwareGate` in the pilot security policy is
 * consumed by nothing but its own test. This composes the first, because it
 * is the one with a proven path behind it. Adding a third decision function
 * for the artifact path would have made the count three.
 *
 * The three permissions are separate because the consequences differ.
 * Parsing reads a file's bytes. Indexing puts its content where a model will
 * retrieve it. Promotion makes it evidence. A file that must not be parsed
 * must certainly not be indexed, so the gate never allows a later step while
 * refusing an earlier one — asserted, not assumed.
 */

export type ArtifactScanDecision = {
  parseAllowed: boolean;
  indexAllowed: boolean;
  promoteAllowed: boolean;
  /** Always populated, including when everything is allowed. */
  reason: string;
  /** The underlying scan verdict, so a surface can say which state it is in. */
  scan: DefenderStorageScanGateResult;
};

const REFUSE_ALL = (reason: string, scan: DefenderStorageScanGateResult): ArtifactScanDecision => ({
  parseAllowed: false,
  indexAllowed: false,
  promoteAllowed: false,
  reason,
  scan,
});

/**
 * Judge an artifact's recorded scan tags.
 *
 * `tags` is what was captured about the scan, which for an artifact nobody
 * scanned is nothing at all. That case reaches `retry` from the Defender
 * evaluator and is refused here — **absent is not clean**, and the item this
 * closes was filed because a file reached parsing and indexing without the
 * policy ever being asked.
 */
export function evaluateArtifactScanGate(
  tags: Record<string, unknown> | undefined,
): ArtifactScanDecision {
  const scan = evaluateDefenderStorageScanTags(tags);

  if (scan.decision === "allow") {
    return {
      parseAllowed: true,
      indexAllowed: true,
      promoteAllowed: true,
      reason: "Malware scan found no threats, so parsing, indexing and promotion may proceed.",
      scan,
    };
  }

  if (scan.decision === "quarantine") {
    return REFUSE_ALL(
      `Malware scan returned ${scan.scanResult}: ${scan.message} Keep the file quarantined and ` +
        "block parsing, indexing and promotion.",
      scan,
    );
  }

  // `retry` covers a scan that has not happened and one still running. Both
  // are unknown, and unknown is not clean — a scan that failed or never ran
  // must not read as a pass, which is the whole defect this closes.
  return REFUSE_ALL(
    `Malware scan result is ${scan.scanResult}: ${scan.reason} Unknown is not clean, so parsing, ` +
      "indexing and promotion stay blocked until a scan result exists.",
    scan,
  );
}

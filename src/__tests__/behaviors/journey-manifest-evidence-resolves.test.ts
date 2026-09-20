import fs from "node:fs";
import path from "node:path";

import {
  buildIntelligenceDeterministicJourneyManifest,
  describeJourneyEvidenceDefects,
  isRepoPathEvidence,
} from "@/lib/qa/intelligence-deterministic-journey";

/**
 * This manifest recorded deterministic route and component coverage, and its
 * own suite passed through the deletion of three of the four files it cited,
 * because it only ever asserted the manifest's *shape*. A QA claim whose
 * evidence path is never resolved is a claim about nothing.
 *
 * The rule has to distinguish a repo path from a marker token. `canvas=summary`
 * and `no live retrieval` are not files and never could be; demanding they
 * resolve would be a gate nobody could pass, and gates like that get switched
 * off. So the resolver reads only path-shaped entries, and this suite pins
 * both halves of that distinction.
 */

const REPO_ROOT = path.resolve(__dirname, "../../..");
const onDisk = (repoPath: string) => fs.existsSync(path.join(REPO_ROOT, repoPath));

describe("the journey manifest's evidence must resolve", () => {
  it("resolves every cited path against the real repository", () => {
    // The case that would have caught the original defect. It reads the
    // filesystem rather than a stub, because a resolver that only ever sees
    // an injected predicate proves nothing about this repository.
    const defects = describeJourneyEvidenceDefects(
      buildIntelligenceDeterministicJourneyManifest(),
      onDisk,
    );

    expect(defects).toEqual([]);
  });

  it("finds this test file, so the resolver is looking in the right place", () => {
    // A negative control for the control. If REPO_ROOT were wrong, every
    // path would be absent and the case above would fail loudly — but if the
    // predicate were accidentally `() => true`, it would pass silently.
    expect(onDisk("src/lib/qa/intelligence-deterministic-journey.ts")).toBe(true);
    expect(onDisk("src/lib/qa/this-file-does-not-exist.ts")).toBe(false);
  });

  it("reports a cited path that does not resolve", () => {
    const manifest = buildIntelligenceDeterministicJourneyManifest();
    const defects = describeJourneyEvidenceDefects(manifest, () => false);

    expect(defects.length).toBeGreaterThan(0);
    expect(defects.every((d) => d.reason === "path_does_not_resolve")).toBe(true);
  });

  it("does not ask a marker token to resolve", () => {
    expect(isRepoPathEvidence("canvas=summary")).toBe(false);
    expect(isRepoPathEvidence("no live retrieval")).toBe(false);
    expect(isRepoPathEvidence("SentinelPatternDetail")).toBe(false);
    expect(isRepoPathEvidence("provenance_ribbon")).toBe(false);

    expect(isRepoPathEvidence("src/lib/qa/intelligence-deterministic-journey.ts")).toBe(true);
    expect(isRepoPathEvidence("src/app/(maestro)/intelligence/page.tsx")).toBe(true);
  });

  it("refuses to let a retired checkpoint cite a live file", () => {
    // A removed subject that names a resolvable path starts looking
    // supported again, which is exactly how this manifest drifted.
    const manifest = buildIntelligenceDeterministicJourneyManifest();
    const retired = manifest.checkpoints.find((c) => c.subjectState === "removed");
    expect(retired).toBeDefined();

    const tampered = {
      ...manifest,
      checkpoints: manifest.checkpoints.map((c) =>
        c.id === retired!.id
          ? { ...c, evidence: [...c.evidence, "src/lib/qa/intelligence-deterministic-journey.ts"] }
          : c,
      ),
    };

    const defects = describeJourneyEvidenceDefects(tampered, onDisk);
    expect(defects).toHaveLength(1);
    expect(defects[0]?.reason).toBe("removed_subject_cites_a_live_path");
  });

  it("says out loud how much of the journey is gone", () => {
    // The manifest carried eleven checkpoints. Nine of them covered
    // surfaces the sunset removed, leaving the landing route and the
    // determinism guard. Shrinking the list silently would have hidden
    // that; this is the number staying visible.
    const manifest = buildIntelligenceDeterministicJourneyManifest();
    const removed = manifest.checkpoints.filter((c) => c.subjectState === "removed");

    expect(manifest.checkpoints).toHaveLength(11);
    expect(removed).toHaveLength(9);
    expect(removed.every((c) => Boolean(c.removedNote?.trim()))).toBe(true);
    expect(manifest.caveats.join(" ")).toContain("are not coverage");
  });
});

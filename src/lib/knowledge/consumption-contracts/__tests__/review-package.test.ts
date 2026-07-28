/**
 * Review package presentation contract — shape invariants the UI relies on.
 * (Presentation only; this never generates or approves a package.)
 */

import type { ReviewPackageSummaryV1 } from "..";
import { EXAMPLE_REVIEW_PACKAGE } from "../../fixtures/review-package-example";

describe("ReviewPackageSummaryV1 example", () => {
  const pkg: ReviewPackageSummaryV1 = EXAMPLE_REVIEW_PACKAGE;

  it("is a dry-run package: approval required, apply not authorized, no proposed accepts", () => {
    expect(pkg.humanApprovalRequired).toBe(true);
    expect(pkg.applyAuthorized).toBe(false);
    expect(pkg.counts.proposedDecisions.accept).toBe(0);
    expect(pkg.hardStop).toContain("dry_run_only");
  });

  it("class counts sum to the total", () => {
    const sum = Object.values(pkg.byReviewClass).reduce((a, b) => a + b, 0);
    expect(sum).toBe(pkg.counts.total);
  });

  it("demonstrates the refined distribution: not everything is individual review", () => {
    expect(pkg.byReviewClass.auto_accept_eligible).toBeGreaterThan(0);
    expect(pkg.byReviewClass.batch_review_required).toBeGreaterThan(0);
    // individual review still exists for judgment-dependent candidates
    expect(pkg.byReviewClass.individual_review_required).toBeGreaterThan(0);
  });

  it("every batch carries governed dimensions and at least one sample", () => {
    for (const b of pkg.batches) {
      expect(b.dimensions.domain).toBeTruthy();
      expect(b.dimensions.evidenceCompleteness).toBeTruthy();
      expect(b.dimensions.relationshipImpact).toBeTruthy();
      expect(b.representativeSamples.length).toBeGreaterThan(0);
    }
  });

  it("carries provenance: package + manifest hashes, policy version, validation run", () => {
    expect(pkg.packageContentHash).toBeTruthy();
    expect(pkg.candidateManifestHash).toBeTruthy();
    expect(pkg.policyVersion).toMatch(/knowledge-review-decision-policy/);
    expect(pkg.validationRunRef).toBeTruthy();
  });
});

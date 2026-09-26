/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { RecordBand } from "../bands";
import { claimSource, sourceForIds } from "../source-label";
import { ClaimCard } from "@/components/home/preview/ClaimCard";
import { resolveEvidence } from "@/components/home/preview/evidence-resolver";
import {
  HOME_PREVIEW_TENANT_KEYS,
  getHomeReviewBundle,
} from "@/lib/home/preview/golden-snapshot";
import type {
  EnterpriseSignalPacket,
  GroundedClaim,
} from "@/lib/home/preview/types";

/**
 * Raw internal evidence identifiers must not reach the executive surface. That property had a
 * guard before this suite existed, in the Home layer-boundary contract, and the guard could not
 * see the leak: it asserted that a doc comment was present in `source-label.ts` and that one
 * particular wrong spelling of the leak was absent. Replacing the governed summary with a join of
 * the cited identifiers under any other spelling left it green, and rewording the doc comment
 * turned it red while behaviour was untouched — wrong in both directions.
 *
 * So nothing below reads a source file. These cases call the resolution the surface calls, render
 * the two components that print it, and assert what a reader would see. A leak fails them whichever
 * way it is spelled, because the identifier itself is what they look for.
 *
 * Every loop asserts how many times it ran. An assertion that passes over an empty population is
 * the same failure in a different costume, and the first draft of this suite had one: its
 * reference-leak check iterated the evidence references of a claim that had none.
 *
 * Owner: T-481, row 2 of the T-479 draw. Rows 1, 13 and 18 of that draw, and the two remaining
 * byte-scan cases in the layer-boundary contract, are still open under the same item.
 */

/**
 * The shape every internal evidence key in this substrate takes: a `sig_`/`ctx_` prefix and an
 * underscore-separated tail. Asserted alongside the exact cited ids rather than instead of them —
 * the exact ids catch a leak of the evidence a surface cites, and this catches a leak of a key that
 * surface never named.
 */
const INTERNAL_EVIDENCE_KEY = /\b(?:sig|ctx)_[a-z0-9]+(?:_[a-z0-9]+)*/i;

/** A reader-facing count is honest about absence; an empty string is not. */
const READER_FACING_SUMMARY =
  /(No cited evidence yet|\d[\d,]* (?:governed|cited) references?)/;

interface ReviewedTenant {
  tenantKey: string;
  signalPacket: EnterpriseSignalPacket;
  claimsWithEvidence: GroundedClaim[];
}

/* The tenant list comes from the module that declares it, never a literal here. */
const reviewedTenants: ReviewedTenant[] = HOME_PREVIEW_TENANT_KEYS.map(
  (tenantKey) => {
    const bundle = getHomeReviewBundle(tenantKey);
    if (!bundle) throw new Error(`no golden bundle for ${tenantKey}`);
    return {
      tenantKey,
      signalPacket: bundle.thesis.signalPacket,
      claimsWithEvidence: bundle.chapters
        .flatMap((chapter) => chapter.key_insights ?? [])
        .filter((claim) => claim.evidence_ids.length > 0),
    };
  },
);

/** The first claim whose cited evidence resolves to source references, so the branch that prints
 * them actually renders. Returns null when this tenant has none, which the caller must assert. */
function claimWhoseEvidenceCarriesReferences(
  tenant: ReviewedTenant,
): GroundedClaim | null {
  for (const claim of tenant.claimsWithEvidence) {
    const resolved = resolveEvidence(claim.evidence_ids, tenant.signalPacket);
    if (resolved.some((item) => (item.evidenceRefs ?? []).length > 0)) {
      return claim;
    }
  }
  return null;
}

describe("the executive Home surface keeps raw evidence identifiers off the page", () => {
  it("has evidence-citing claims to assert over, for every reviewed tenant", () => {
    expect(reviewedTenants).toHaveLength(HOME_PREVIEW_TENANT_KEYS.length);
    for (const tenant of reviewedTenants) {
      expect(tenant.claimsWithEvidence.length).toBeGreaterThan(0);
      expect(
        tenant.claimsWithEvidence.flatMap((claim) => claim.evidence_ids).length,
      ).toBeGreaterThan(0);
    }
  });

  it("returns a reader-facing count for a claim, never the identifiers it cites", () => {
    let asserted = 0;
    for (const tenant of reviewedTenants) {
      for (const claim of tenant.claimsWithEvidence) {
        const source = claimSource(claim, tenant.signalPacket);
        for (const id of claim.evidence_ids) {
          expect(source.ids).not.toContain(id);
        }
        expect(source.ids).not.toMatch(INTERNAL_EVIDENCE_KEY);
        expect(source.ids).toMatch(READER_FACING_SUMMARY);
        asserted += 1;
      }
    }
    expect(asserted).toBeGreaterThan(0);
  });

  it("returns the same reader-facing count for an exhibit, which cites evidence without being a claim", () => {
    let asserted = 0;
    for (const tenant of reviewedTenants) {
      const cited = tenant.claimsWithEvidence
        .flatMap((claim) => claim.evidence_ids)
        .slice(0, 12);
      expect(cited.length).toBeGreaterThan(0);
      const source = sourceForIds(cited, tenant.signalPacket);
      for (const id of cited) {
        expect(source.ids).not.toContain(id);
      }
      expect(source.ids).not.toMatch(INTERNAL_EVIDENCE_KEY);
      expect(source.ids).toMatch(READER_FACING_SUMMARY);
      asserted += 1;
    }
    expect(asserted).toBe(reviewedTenants.length);
  });

  it("says an unmapped citation needs source mapping without printing the identifier", () => {
    let asserted = 0;
    for (const tenant of reviewedTenants) {
      const unmapped = "sig_not_in_this_packet_999";

      const resolved = resolveEvidence([unmapped], tenant.signalPacket);
      expect(resolved).toHaveLength(1);
      expect(resolved[0].unresolved).toBe(true);
      // Missing is not zero: it must still say something, and not the key.
      expect(resolved[0].statement.length).toBeGreaterThan(20);
      expect(resolved[0].statement).not.toContain(unmapped);
      expect(resolved[0].statement).not.toMatch(INTERNAL_EVIDENCE_KEY);

      const source = sourceForIds([unmapped], tenant.signalPacket);
      expect(source.hasUnresolved).toBe(true);
      expect(source.ids).toContain("need source mapping");
      expect(source.ids).not.toContain(unmapped);
      expect(source.ids).not.toMatch(INTERNAL_EVIDENCE_KEY);
      asserted += 1;
    }
    expect(asserted).toBe(reviewedTenants.length);
  });

  it("renders no cited identifier anywhere a reader of the record band can see it", () => {
    let asserted = 0;
    for (const tenant of reviewedTenants) {
      const claims = tenant.claimsWithEvidence.slice(0, 6);
      const cited = claims.flatMap((claim) => claim.evidence_ids);
      expect(cited.length).toBeGreaterThan(0);

      const { container, unmount } = render(
        <RecordBand claims={claims} signalPacket={tenant.signalPacket} />,
      );
      const visible = container.textContent ?? "";

      // The band rendered its claims, so what follows is absence from a page with content on it.
      expect(visible).toContain(claims[0].statement);
      for (const id of cited) {
        expect(visible).not.toContain(id);
      }
      expect(visible).not.toMatch(INTERNAL_EVIDENCE_KEY);
      expect(visible).toMatch(READER_FACING_SUMMARY);
      unmount();
      asserted += 1;
    }
    expect(asserted).toBe(reviewedTenants.length);
  });

  it("renders no cited identifier in the expanded evidence list of a claim card", () => {
    let asserted = 0;
    for (const tenant of reviewedTenants) {
      /* Deliberately a claim whose evidence carries source references, so the branch that prints
       * those references is on the page. What this case does NOT assert is the reference values
       * themselves: they are register values a claim may legitimately name in its own prose, and
       * pinning the shape they are summarised in would pin a design choice rather than a control.
       * The property here is the internal key, and only that. */
      const claim = claimWhoseEvidenceCarriesReferences(tenant);
      expect(claim).not.toBeNull();
      const resolved = resolveEvidence(claim!.evidence_ids, tenant.signalPacket);
      expect(
        resolved.filter((item) => (item.evidenceRefs ?? []).length > 0).length,
      ).toBeGreaterThan(0);

      const { container, unmount } = render(
        <ClaimCard claim={claim!} signalPacket={tenant.signalPacket} />,
      );
      fireEvent.click(
        screen.getByRole("button", { name: /why do we believe this/i }),
      );
      const visible = container.textContent ?? "";

      // Expanded, so the evidence list is on the page rather than collapsed away.
      expect(visible).toContain(resolved[0].statement);
      for (const id of claim!.evidence_ids) {
        expect(visible).not.toContain(id);
      }
      expect(visible).not.toMatch(INTERNAL_EVIDENCE_KEY);
      unmount();
      asserted += 1;
    }
    expect(asserted).toBe(reviewedTenants.length);
  });
});

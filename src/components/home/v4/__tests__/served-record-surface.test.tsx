/**
 * @jest-environment jsdom
 */

/**
 * The surface, rendered from the path the product actually serves.
 *
 * Every other suite here renders the stored copy of the record. The served view is built by a
 * different function, from different rows, and it writes its own chapter text when no statements
 * have been published for a chapter. Two build-state strings reached the live page through that
 * path while the stored-copy tests stayed green, because no fixture could reach the branch that
 * produced them.
 *
 * So this suite renders the served path and holds it to the same rules.
 */
import "@testing-library/jest-dom";
// Must precede the served-path builder import below; see the module for why.
import "../test-support/text-encoder-polyfill";

import { render } from "@testing-library/react";

import {
  buildHomeReviewBundleFromEclProjectionRows,
  type HomeProjectionRow,
} from "@/lib/home/preview/ecl-projection-bundle";
import type { HomeReviewBundle } from "@/lib/home/preview/types";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import { HomeV4App } from "../HomeV4App";
import { isGeneratorDeferral } from "../cxo-language";

jest.mock("@/components/home/preview/HomeAvaChat", () => ({
  HomeAvaChat: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

/** One row, enough for the builder to produce a bundle whose chapters have no published claims. */
function servedBundle(): HomeReviewBundle {
  const base = getHomeReviewBundle("meridian-health");
  if (!base) throw new Error("stored copy missing");
  const rows: HomeProjectionRow[] = [
    {
      page_key: "applications_systems",
      row_key: "app-1",
      row_type: "application_system",
      title: "Claims Administration Platform",
      summary: null,
      display_payload_json: {
        application_name: "Claims Administration Platform",
        business_function: "Health Plan Operations",
        hosting_model: "on_premise",
        lifecycle_state: "current",
      },
    } as HomeProjectionRow,
  ];
  return buildHomeReviewBundleFromEclProjectionRows(
    base,
    rows,
    "assessment-test",
  );
}

function open(hash: string) {
  window.location.hash = hash;
  return render(
    <HomeV4App bundle={servedBundle()} tenantKey="meridian-health" />,
  );
}

describe("the served path", () => {
  it("writes chapter text that the deferral gate recognises", () => {
    // If the gate stops matching what this generator writes, the headline reaches the reader.
    const deferred = servedBundle().chapters.filter((c) =>
      isGeneratorDeferral(c.headline),
    );
    expect(deferred.length).toBeGreaterThan(0);
  });

  it.each([
    "executive_brief",
    "our_business",
    "strategy_value_creation",
    "leadership_perspective",
    "what_needs_attention",
  ])("shows no build state on %s", (chapterId) => {
    const { container } = open(chapterId);
    document.querySelectorAll("style").forEach((n) => n.remove());
    const text = container.textContent ?? "";
    for (const pattern of [
      /deferred pending/i,
      /not ready for executive/i,
      /CXO readout/i,
      /verified chapter claims/i,
      /projection counts/i,
      /\bprojection\b/i,
      /grounded statements/i,
    ]) {
      expect(text).not.toMatch(pattern);
    }
  });

  it("never leads a chapter with a build state", () => {
    for (const chapter of servedBundle().chapters) {
      const { container, unmount } = open(chapter.chapterId);
      expect(container.querySelector("h1")?.textContent ?? "").not.toMatch(
        /deferred pending|not ready for executive/i,
      );
      unmount();
    }
  });
});

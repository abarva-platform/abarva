import { renderToStaticMarkup } from "react-dom/server";

import { GovernedVisual } from "../visuals/GovernedVisual";
import type { VisualOpportunity } from "@/lib/home/preview/types";

function visual(overrides: Partial<VisualOpportunity> = {}): VisualOpportunity {
  return {
    visual_type: "horizontal_bar",
    title: "Vendor spend concentration",
    purpose: "Show where third-party spend concentrates.",
    dataset_ref: "vendor_spend_concentration",
    key_message: "A handful of vendors carry most of the spend.",
    evidence_ids: ["sig_concentration_001"],
    priority: "high",
    ...overrides,
  };
}

/**
 * The governed contract's actual invariant -- never silently drop an exhibit -- only matters if
 * it's tested at the boundary cases: an unresolvable dataset_ref, an unconfigured (but real)
 * dataset, and an unrecognized visual_type. All three must render something a reviewer can see
 * and act on, not an empty div.
 */
describe("GovernedVisual", () => {
  it("renders a known visual_type against a configured dataset without throwing", () => {
    const datasets = { vendor_spend_concentration: [{ vendor: "Epic", spend: 86_184_000, sharePct: 17.4 }] };
    expect(() => renderToStaticMarkup(<GovernedVisual visual={visual()} visualDatasets={datasets} />)).not.toThrow();
  });

  it("shows an explicit error rather than nothing when dataset_ref doesn't resolve", () => {
    const html = renderToStaticMarkup(<GovernedVisual visual={visual({ dataset_ref: "does_not_exist" })} visualDatasets={{}} />);
    expect(html).toContain("does not exist");
  });

  it("falls back to a labeled table -- not a blank card -- for a dataset_ref with no field config", () => {
    const datasets = { some_future_dataset: [{ name: "Program A", pct: 40 }, { name: "Program B", pct: 12 }] };
    const html = renderToStaticMarkup(
      <GovernedVisual visual={visual({ dataset_ref: "some_future_dataset", visual_type: "capability_map" })} visualDatasets={datasets} />,
    );
    expect(html).toContain("Program A");
    expect(html).toContain("<table");
  });

  it("shows an honest empty-state note rather than a blank card for an empty dataset", () => {
    const html = renderToStaticMarkup(
      <GovernedVisual visual={visual({ dataset_ref: "empty_dataset" })} visualDatasets={{ empty_dataset: [] }} />,
    );
    expect(html).toContain("no rows to show");
  });

  it("renders the title and purpose for every visual regardless of chart outcome", () => {
    const html = renderToStaticMarkup(
      <GovernedVisual visual={visual({ title: "A Distinctive Title", purpose: "A distinctive purpose." })} visualDatasets={{}} />,
    );
    expect(html).toContain("A Distinctive Title");
    expect(html).toContain("A distinctive purpose.");
  });
});

// value_tree is a declared exhibit payload kind; the SVG dispatch now draws it
// as a driver tree (root -> branches -> children) instead of returning nothing.

import { renderDeliverableHtml } from "../renderers";
import { goodDocument } from "../__fixtures__/ams-rfp";
import type { RenderableDeliverable } from "../types";

function withExhibit(
  data: RenderableDeliverable["exhibits"][number]["data"],
): RenderableDeliverable {
  const doc = goodDocument();
  doc.exhibits = [
    {
      key: "value_bridge",
      title: "Where the value comes from",
      kind: "chart",
      description: "Value tree.",
      targetFormat: "pptx",
      ...(data ? { data } : {}),
    },
  ];
  return doc;
}

describe("value_tree exhibit", () => {
  it("draws the root, branches and children as an SVG", () => {
    const html = renderDeliverableHtml(
      withExhibit({
        kind: "value_tree",
        root: { label: "Total annual value", value: "$8.0M" },
        branches: [
          {
            label: "Labour productivity",
            value: "$4.2M",
            children: [{ label: "Faster handling", value: "$2.6M" }],
          },
          { label: "Cost avoidance", value: "$2.3M" },
        ],
      }),
    );
    expect(html).toContain("exhibit-svg");
    expect(html).toContain("Total annual value");
    expect(html).toContain("Labour productivity");
    expect(html).toContain("Faster handling");
    expect(html).toContain("Cost avoidance");
  });

  it("draws nothing for a value_tree with no branches (no invented diagram)", () => {
    const html = renderDeliverableHtml(
      withExhibit({
        kind: "value_tree",
        root: { label: "Total annual value", value: "$8.0M" },
        branches: [],
      }),
    );
    // The figure/svg for this exhibit is not emitted when there is nothing to draw.
    expect(html).not.toContain("Total annual value");
  });
});

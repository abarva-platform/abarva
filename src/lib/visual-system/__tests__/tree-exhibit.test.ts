import { issueTree, type TreeNode } from "../tree-exhibit";

const tree: TreeNode = {
  label: "Examination is the cost driver",
  children: [
    { label: "Manual document review", children: [{ label: "No OCR pipeline" }, { label: "Dual-key checks", isGap: true }] },
    { label: "Reconciliation effort" },
  ],
};

describe("issueTree (tree exhibit — closes the IssueTree/RootCauseTree/ValueTree/DecisionTree gap)", () => {
  it("renders well-formed SVG with a title", () => {
    const svg = issueTree(tree, { title: "Issue tree" });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg).toContain("Issue tree");
  });

  it("marks gap branches with a GAP tag (gap-honest)", () => {
    const svg = issueTree(tree);
    expect(svg).toContain("GAP");
    expect(svg).toContain("stroke-dasharray"); // dashed gap node
  });

  it("is deterministic — identical input yields identical output", () => {
    expect(issueTree(tree)).toBe(issueTree(tree));
  });

  it("handles a single-node tree without throwing", () => {
    const svg = issueTree({ label: "Only the root" });
    expect(svg.startsWith("<svg")).toBe(true);
  });

  it("escapes angle brackets in labels", () => {
    const svg = issueTree({ label: "a < b & c > d" });
    expect(svg).toContain("&lt;");
    expect(svg).toContain("&amp;");
    expect(svg).not.toContain("a < b");
  });
});

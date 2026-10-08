import JSZip from "jszip";
import { goodDocument } from "../__fixtures__/ams-rfp";
import { inspectDeck } from "../deck-inspection";
import { judgeRenderedDeck } from "../deck-quality";
import { renderDeliverableHtml, renderDeliverablePptx } from "../renderers";

describe("PPTX composition", () => {
  it("renders every declared flow edge when a flow has more than six nodes", () => {
    const doc = goodDocument();
    const nodes = Array.from({ length: 7 }, (_, index) => ({
      id: `n${index}`,
      label: `Step ${index}`,
    }));
    const edges = nodes
      .slice(0, -1)
      .map((node, index) => ({ from: node.id, to: nodes[index + 1]!.id }));
    doc.exhibits = [
      {
        key: "long_flow",
        title: "Long flow",
        kind: "flow",
        description: "Declared flow",
        targetFormat: "pptx",
        data: { kind: "flow", nodes, edges },
      },
    ];
    const html = renderDeliverableHtml(doc);
    expect(html.match(/data-declared-edge=/g) ?? []).toHaveLength(edges.length);
    expect(html).toContain("Step 6");
    doc.exhibits[0]!.data = {
      kind: "flow",
      nodes,
      edges: [...edges, { from: "n6", to: "absent" }],
    };
    expect(() => renderDeliverableHtml(doc)).toThrow(/flow_edge_invalid/);
  });

  it("pairs a governed message with its exhibit, splits dense points, and embeds every exhibit", async () => {
    const doc = goodDocument();
    doc.generatedSections = [];
    doc.tables = [];
    doc.exhibits.push({
      key: "declared_flow",
      title: "Declared handoff flow",
      kind: "flow",
      description: "Only the declared handoff is drawn.",
      targetFormat: "pptx",
      data: {
        kind: "flow",
        nodes: [
          { id: "intake", label: "Intake" },
          { id: "review", label: "Review" },
        ],
        edges: [{ from: "intake", to: "review" }],
      },
    });
    doc.deckSlides = [
      {
        title: "Scope decision",
        governingMessage:
          "The scoped service model requires a reviewed handoff.",
        points: [
          "First point.",
          "Second point.",
          "Third point.",
          "Fourth point.",
          "Fifth point.",
        ],
        exhibitKey: "tower_scope_map",
      },
    ];

    const buffer = await renderDeliverablePptx(doc);
    const zip = await JSZip.loadAsync(buffer);
    const media = Object.keys(zip.files).filter((name) =>
      /^ppt\/media\/.*\.png$/i.test(name),
    );
    expect(media).toHaveLength(doc.exhibits.length);
    const slideNames = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort(
        (a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]),
      );
    expect(slideNames).toHaveLength(5);
    const slides = await Promise.all(
      slideNames.map((name) => zip.file(name)!.async("string")),
    );
    expect(slides[1]).toContain(
      "The scoped service model requires a reviewed handoff",
    );
    expect(slides[1]).toContain("Service Tower Scope Map");
    expect(slides[1]).toContain("Third point");
    expect(slides[1]).not.toContain("Fourth point");
    expect(slides[2]).toContain("Fourth point");
    expect(slides[3]).toContain("Declared handoff flow");

    const verdict = judgeRenderedDeck(await inspectDeck(buffer));
    expect(
      verdict.findings.filter(
        (finding) =>
          finding.kind === "off_canvas" ||
          finding.kind === "canvas" ||
          finding.kind === "empty_canvas",
      ),
    ).toEqual([]);
  });

  it("draws only declared flow and architecture connections", () => {
    const doc = goodDocument();
    doc.exhibits = [
      {
        key: "handoff",
        title: "Handoff",
        kind: "flow",
        description: "Two scoped nodes.",
        targetFormat: "pptx",
        data: {
          kind: "flow",
          nodes: [
            { id: "a", label: "A" },
            { id: "b", label: "B" },
          ],
          edges: [],
        },
      },
      {
        key: "architecture",
        title: "Architecture",
        kind: "logical_architecture",
        description: "Two declared lanes.",
        targetFormat: "pptx",
        data: {
          kind: "logical_architecture",
          lanes: [
            { label: "Experience", items: ["Portal"] },
            { label: "Agents", items: ["Runtime"] },
          ],
          edges: [],
        },
      },
    ];
    const without = renderDeliverableHtml(doc);
    expect(without).not.toContain('data-declared-edges="true"');
    expect(without).not.toMatch(
      /stroke-width="2" marker-end="url\(#arrow-exhibit-1\)"/,
    );

    const flow = doc.exhibits[0]!.data;
    const architecture = doc.exhibits[1]!.data;
    if (flow?.kind !== "flow" || architecture?.kind !== "logical_architecture")
      throw new Error("fixture drift");
    flow.edges = [{ from: "b", to: "a", label: "reviewed" }];
    architecture.edges = [{ from: "Experience", to: "Agents" }];
    const withEdges = renderDeliverableHtml(doc);
    expect(withEdges).toContain('data-declared-edges="true"');
    expect((withEdges.match(/data-declared-edge=/g) ?? [])).toHaveLength(2);
    expect(withEdges).toMatch(
      /stroke-width="2" marker-end="url\(#arrow-exhibit-1\)"/,
    );
    architecture.edges.push({ from: "Agents", to: "Agents", label: "internal" });
    expect((renderDeliverableHtml(doc).match(/data-declared-edge=/g) ?? [])).toHaveLength(3);
  });
});

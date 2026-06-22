import { parseAgentResponseParts } from "../response-parts";

describe("parseAgentResponseParts", () => {
  it("keeps normal markdown as markdown", () => {
    expect(parseAgentResponseParts("| A | B |\n|---|---|\n| x | y |")).toEqual([
      { type: "markdown", text: "| A | B |\n|---|---|\n| x | y |" },
    ]);
  });

  it("extracts compact bar chart directives", () => {
    const parts = parseAgentResponseParts(
      'Read this.\n```abarva-chart\n{"type":"bar","title":"Risk by vendor","data":[{"label":"A","value":3},{"label":"B","value":7}]}\n```\nDone.',
    );

    expect(parts).toHaveLength(3);
    expect(parts[1]).toMatchObject({
      type: "chart",
      chart: {
        type: "bar",
        title: "Risk by vendor",
        data: [
          { label: "A", value: 3 },
          { label: "B", value: 7 },
        ],
      },
    });
  });

  it("leaves invalid chart blocks as markdown", () => {
    const text = "```abarva-chart\nnot json\n```";
    expect(parseAgentResponseParts(text)).toEqual([{ type: "markdown", text }]);
  });
});

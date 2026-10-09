import { planArchitectureDeck } from "../architecture-deck-plan";
import { compactArchitectureDeckSlides } from "../architecture-deck-story";
import type { ArchitectureDeckPage } from "../architecture-deck-composition";
import type { ArchitectureVisualExhibit } from "@/lib/visual-system/architecture-html-renderer";

const visual = (id: string): ArchitectureVisualExhibit => ({
  id: id as ArchitectureVisualExhibit["id"],
  title: id,
  soWhat: "Grounded design implication",
  decisionImplication: "Conditional review",
  svg: "<svg />",
});
const pages = (count: number, prefix: string): ArchitectureDeckPage[] => [
  { kind: "divider", eyebrow: prefix, title: `${prefix} section` },
  ...Array.from({ length: count }, (_, i) => ({
    kind: "standalone" as const,
    visual: visual(`${prefix}_${i}`),
  })),
];

describe("architecture pre-render page planner", () => {
  it("counts both divider bands as zero pages and tables inside the six-page narrative ceiling", () => {
    const plan = planArchitectureDeck({
      narrativePages: 4,
      tablePages: 2,
      body: pages(8, "body"),
      appendix: pages(8, "reference"),
      flowEdges: 19,
    });
    expect(plan).toMatchObject({
      cover: 1,
      narrativeTable: 6,
      architectureBody: 8,
      closing: 1,
      core: 16,
      referenceAppendix: 8,
      total: 24,
      overflow: 0,
    });
  });

  it("refuses early with exact counts and flow cause when narrative and tables exceed the core", () => {
    expect(() =>
      planArchitectureDeck({
        narrativePages: 6,
        tablePages: 2,
        body: pages(8, "body"),
        appendix: pages(8, "reference"),
        flowEdges: 19,
      }),
    ).toThrow(
      /DECK PLAN REFUSED.*narrative_table=8.*architecture_body=8.*core=18.*total=26.*physical_limit=27.*E=19 requiring ceil\(E\/12\)=2/,
    );
  });

  it("allows three reference overflow pages, warns, and refuses a twelfth", () => {
    const plan = planArchitectureDeck({
      narrativePages: 6,
      tablePages: 0,
      body: pages(8, "body"),
      appendix: pages(11, "reference"),
    });
    expect(plan.total).toBe(27);
    expect(plan.warning).toContain("OVERFLOW");
    expect(() =>
      planArchitectureDeck({
        narrativePages: 6,
        tablePages: 0,
        body: pages(8, "body"),
        appendix: pages(12, "reference"),
      }),
    ).toThrow(/total=28.*overflow=1/);
  });
});

describe("architecture authored story compaction", () => {
  it("retains every original statement, citation and the matched exhibit in notes", () => {
    const slides = Array.from({ length: 9 }, (_, i) => ({
      key: `source-${i}`,
      title: `Source beat ${i}`,
      governingMessage: `Grounded message ${i}`,
      points: [`Point ${i}`],
      speakerNotes: `Caveat ${i}`,
      citationsUsed: [i + 1],
      ...(i === 4 ? { exhibitKey: "governed_exhibit" } : {}),
    }));
    const result = compactArchitectureDeckSlides(slides, 5);
    expect(result).toHaveLength(5);
    expect(
      result.filter((slide) => slide.exhibitKey === "governed_exhibit"),
    ).toHaveLength(1);
    const combined = result
      .map((slide) =>
        [
          slide.governingMessage,
          ...(slide.points ?? []),
          slide.speakerNotes,
        ].join("\n"),
      )
      .join("\n");
    for (let i = 0; i < 9; i += 1) {
      expect(combined).toContain(`Grounded message ${i}`);
      expect(combined).toContain(`Caveat ${i}`);
    }
    expect(
      new Set(result.flatMap((slide) => slide.citationsUsed ?? [])),
    ).toEqual(new Set(Array.from({ length: 9 }, (_, i) => i + 1)));
  });
});

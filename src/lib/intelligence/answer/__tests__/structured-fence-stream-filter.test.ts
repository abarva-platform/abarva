import { createStructuredFenceStreamFilter } from "@/lib/intelligence/answer/structured-fence-stream-filter";

describe("createStructuredFenceStreamFilter", () => {
  it("removes governed decision-table fences even when the marker is split across chunks", () => {
    const filter = createStructuredFenceStreamFilter();
    const chunks = [
      "Agent assist leads. ``",
      "`decision",
      '-table\n{"title":"x","rows":[{"initiative":"Agent Assist"}]}\n',
      "``` Next, certify the data feed.",
    ];

    const visible = chunks.map((chunk) => filter.push(chunk)).join("") + filter.flush();

    expect(visible).toBe("Agent assist leads.  Next, certify the data feed.");
    expect(visible).not.toContain("decision-table");
    expect(visible).not.toContain('"rows"');
    expect(visible).not.toContain("```");
  });

  it("removes chart and followups fences without removing surrounding prose", () => {
    const filter = createStructuredFenceStreamFilter();
    const visible =
      filter.push("Start. ```chart\n{\"type\":\"bar\"}\n``` Middle. ") +
      filter.push("```followups\n[\"Q1\"]\n``` End.") +
      filter.flush();

    expect(visible).toBe("Start.  Middle.  End.");
    expect(visible).not.toContain("chart");
    expect(visible).not.toContain("followups");
  });
});

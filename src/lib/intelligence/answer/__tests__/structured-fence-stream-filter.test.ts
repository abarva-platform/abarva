import { createStructuredFenceStreamFilter } from "@/lib/intelligence/answer/structured-fence-stream-filter";
import { stripGovernedArtifactPayloadsFromText } from "@/lib/intelligence/answer/structured-fence-stream-filter";

describe("createStructuredFenceStreamFilter", () => {
  it("removes governed decision-table fences even when the marker is split across chunks", () => {
    const filter = createStructuredFenceStreamFilter();
    const chunks = [
      "Agent assist leads. ``",
      "`decision",
      '-table\n{"title":"x","rows":[{"initiative":"Agent Assist"}]}\n',
      "``` Next, certify the data feed.",
    ];

    const visible =
      chunks.map((chunk) => filter.push(chunk)).join("") + filter.flush();

    expect(visible).toBe("Agent assist leads.  Next, certify the data feed.");
    expect(visible).not.toContain("decision-table");
    expect(visible).not.toContain('"rows"');
    expect(visible).not.toContain("```");
  });

  it("removes chart and followups fences without removing surrounding prose", () => {
    const filter = createStructuredFenceStreamFilter();
    const visible =
      filter.push('Start. ```chart\n{"type":"bar"}\n``` Middle. ') +
      filter.push('```followups\n["Q1"]\n``` End.') +
      filter.flush();

    expect(visible).toBe("Start. Middle. End.");
    expect(visible).not.toContain("chart");
    expect(visible).not.toContain("followups");
  });

  it("removes malformed near-fence artifact JSON from streaming text", () => {
    const filter = createStructuredFenceStreamFilter();
    const chunks = [
      "All scores are directional. ``decision-table ",
      '{"title":"Ranking","records":[{"initiative":"Clinical Documentation Assist","valueScore":82}]}',
      ' chart {"type":"horizontal-bar","title":"Value","xKey":"initiative","yKey":"valueScore","data":[{"initiative":"Clinical Doc","valueScore":82}]}',
      " The sequencing logic: start with clinical documentation.",
      ' `followups ["What proof is missing?"] ``',
    ];

    const visible =
      chunks.map((chunk) => filter.push(chunk)).join("") + filter.flush();

    expect(visible).toContain("All scores are directional.");
    expect(visible).toContain(
      "The sequencing logic: start with clinical documentation.",
    );
    expect(visible).not.toContain("decision-table");
    expect(visible).not.toContain('"records"');
    expect(visible).not.toContain('"type":"horizontal-bar"');
    expect(visible).not.toContain("followups");
  });

  it("strips malformed near-fence artifact JSON from final packet prose", () => {
    const visible = stripGovernedArtifactPayloadsFromText(
      'Recommendation first. ``decision-table {"title":"Ranking","records":[{"initiative":"Clinical Documentation Assist","valueScore":82}]} chart {"type":"horizontal-bar","title":"Value","xKey":"initiative","yKey":"valueScore","data":[{"initiative":"Clinical Doc","valueScore":82}]} ` Follow the EHR workflow first. `followups ["What proof is missing?"] ``',
    );

    expect(visible).toBe(
      "Recommendation first. Follow the EHR workflow first.",
    );
  });
});

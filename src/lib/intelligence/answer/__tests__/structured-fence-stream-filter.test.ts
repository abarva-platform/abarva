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

  it("holds a bare chart marker when the JSON payload arrives in the next chunk", () => {
    const filter = createStructuredFenceStreamFilter();
    const chunks = [
      "Move: fund the evidence-backed anchors. chart ",
      '{"type":"horizontal-bar","title":"Value","xKey":"initiative",',
      '"yKey":"valueScore","data":[{"initiative":"Cash-flow insights","valueScore":91}]}',
      " Evidence boundary: validate before board use.",
    ];

    const visible =
      chunks.map((chunk) => filter.push(chunk)).join("") + filter.flush();

    expect(visible).toBe(
      "Move: fund the evidence-backed anchors.  Evidence boundary: validate before board use.",
    );
    expect(visible).not.toContain("chart");
    expect(visible).not.toContain('"type":"horizontal-bar"');
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

  it("strips markdown-rendered chart language labels plus orphan JSON", () => {
    const visible = stripGovernedArtifactPayloadsFromText(
      'Fund payment integrity first.chart{"type":"bar","title":"Value minus complexity","subtitle":"Directional scores","xKey":"initiative","yKey":"score","data":[{"initiative":"Payment integrity","score":45},{"initiative":"Clinical+claims lakehouse","score":-30}]}```Evidence boundary: validate production baselines.',
    );

    expect(visible).toBe(
      "Fund payment integrity first.Evidence boundary: validate production baselines.",
    );
    expect(visible).not.toContain("chart");
    expect(visible).not.toContain('"type":"bar"');
    expect(visible).not.toContain("```");
  });

  it("strips bare multiline chart payloads from final packet prose", () => {
    const visible = stripGovernedArtifactPayloadsFromText(
      'Wire fraud is the near-term bet.\nchart\n{"type":"horizontal-bar","title":"FS Demo — AI Use Case Value Scores vs. Complexity Scores","xKey":"use_case","yKey":"valueScore","unit":"score","data":[{"use_case":"Wire fraud interdiction","valueScore":95},{"use_case":"Servicing copilot","valueScore":74}]}\n```\nEvidence boundary: validate the scores.',
    );

    expect(visible).toBe(
      "Wire fraud is the near-term bet.\nEvidence boundary: validate the scores.",
    );
    expect(visible).not.toContain("chart");
    expect(visible).not.toContain('"type":"horizontal-bar"');
    expect(visible).not.toContain("```");
  });
});

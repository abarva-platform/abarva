import {
  parseDiagnosisFacts,
  serializeDiagnosisFacts,
  isStructuredFactsValue,
  factsToBaselineMetrics,
  factsToPromptText,
  type DiagnosisFact,
} from "../diagnosis-facts";

const facts: DiagnosisFact[] = [
  { metric: "Intake cycle time", value: "18.4 days", source: "Intake work queue" },
  { metric: "Missing-field rate", value: "42%", source: "Quality report" },
];

describe("diagnosis-facts", () => {
  it("round-trips structured facts through serialize/parse", () => {
    const json = serializeDiagnosisFacts(facts);
    expect(isStructuredFactsValue(json)).toBe(true);
    expect(parseDiagnosisFacts(json)).toEqual(facts);
  });

  it("drops fully-empty rows on serialize", () => {
    const json = serializeDiagnosisFacts([
      ...facts,
      { metric: "", value: "", source: "" },
    ]);
    expect(parseDiagnosisFacts(json)).toHaveLength(2);
  });

  it("empty input → no facts, empty serialization", () => {
    expect(parseDiagnosisFacts("")).toEqual([]);
    expect(parseDiagnosisFacts(null)).toEqual([]);
    expect(serializeDiagnosisFacts([])).toBe("");
    expect(isStructuredFactsValue("")).toBe(false);
  });

  it("legacy free text becomes a single source-less fact (nothing lost)", () => {
    const parsed = parseDiagnosisFacts("cycle time is ~18 days, needs validation");
    expect(parsed).toHaveLength(1);
    expect(parsed[0].value).toMatch(/cycle time/);
    expect(parsed[0].source).toBe("");
    expect(isStructuredFactsValue("cycle time is ~18 days")).toBe(false);
  });

  it("invalid JSON falls back to free text rather than throwing", () => {
    const parsed = parseDiagnosisFacts("[not valid json");
    expect(parsed).toHaveLength(1);
    expect(parsed[0].value).toBe("[not valid json");
  });

  it("factsToBaselineMetrics: metric → value [source], skips empty metrics", () => {
    expect(factsToBaselineMetrics(facts)).toEqual({
      "Intake cycle time": "18.4 days [Intake work queue]",
      "Missing-field rate": "42% [Quality report]",
    });
    expect(
      factsToBaselineMetrics([{ metric: "", value: "x", source: "y" }]),
    ).toEqual({});
    expect(
      factsToBaselineMetrics([{ metric: "M", value: "5", source: "" }]),
    ).toEqual({ M: "5" });
  });

  it("factsToPromptText renders readable bulleted facts", () => {
    const text = factsToPromptText(facts);
    expect(text).toContain("Intake cycle time: 18.4 days (source: Intake work queue)");
  });
});

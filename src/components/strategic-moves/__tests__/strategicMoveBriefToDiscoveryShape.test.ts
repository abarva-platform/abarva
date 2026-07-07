import { strategicMoveBriefToDiscoveryShape } from "../strategicMoveBriefToDiscoveryShape";

const EMPTY = {
  "problem-statement": "",
  archetype: "",
  "sponsor-candidate": "",
  "scope-boundary": "",
  "evidence-family": "",
  "value-hypothesis": "",
  "foundation-readiness": "",
};

describe("strategicMoveBriefToDiscoveryShape", () => {
  it("projects the captured scaffold fields into discovery dimensions (chat source)", () => {
    const shape = strategicMoveBriefToDiscoveryShape({
      ...EMPTY,
      "problem-statement": "Reduce avoidable readmissions",
      archetype: "Optimize",
      "sponsor-candidate": "CMO",
      "value-hypothesis": "$4M annual",
    });
    expect(shape.problem.value).toBe("Reduce avoidable readmissions");
    expect(shape.problem.sources).toContain("chat");
    expect(shape.archetype.value).toBe("Optimize");
    expect(shape.sponsor.value).toBe("CMO");
    expect(shape.valueHypothesis.value).toBe("$4M annual");
  });

  it("leaves dimensions empty when the scaffold is empty (no fabrication)", () => {
    const shape = strategicMoveBriefToDiscoveryShape({ ...EMPTY });
    expect(shape.problem.value).toBeNull();
    expect(shape.sponsor.value).toBeNull();
    expect(shape.valueHypothesis.value).toBeNull();
    expect(shape.archetype.value).toBeNull();
  });

  it("ignores fields without a clean discovery home (scope/evidence/foundation)", () => {
    const shape = strategicMoveBriefToDiscoveryShape({
      ...EMPTY,
      "scope-boundary": "Inpatient only",
      "evidence-family": "Clinical",
      "foundation-readiness": "No lakehouse yet",
    });
    // none of these map to a dimension → shape stays empty, nothing invented
    expect(shape.problem.value).toBeNull();
    expect(shape.archetype.value).toBeNull();
  });
});

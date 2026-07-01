import {
  buildIndustrialCioBackofficePromptAddendum,
  buildIndustrialCioBackofficeSource,
  isIndustrialCioBackofficeQuestion,
  isIndustrialTenantKey,
} from "../industrial-cio-backoffice-source";

describe("Industrial CIO back-office ask source", () => {
  it("recognizes Industrial Demo, Lakeshore, and Morgan Street tenant aliases", () => {
    expect(isIndustrialTenantKey("lakeshore-industries")).toBe(true);
    expect(isIndustrialTenantKey("Industrial Demo")).toBe(true);
    expect(isIndustrialTenantKey("Morgan Street")).toBe(true);
    expect(isIndustrialTenantKey("skyharbor-air")).toBe(false);
  });

  it("recognizes Morgan Street CIO back-office questions without matching unrelated prompts", () => {
    expect(
      isIndustrialCioBackofficeQuestion(
        "How should Morgan Street stand up the value office?",
      ),
    ).toBe(true);
    expect(
      isIndustrialCioBackofficeQuestion(
        "Which treasury and finance automations should we fund first?",
      ),
    ).toBe(true);
    expect(
      isIndustrialCioBackofficeQuestion(
        "Should HR and legal be in the shared services AI roadmap?",
      ),
    ).toBe(true);
    expect(
      isIndustrialCioBackofficeQuestion(
        "Summarize the last conversation in one sentence.",
      ),
    ).toBe(false);
  });

  it("builds a high-priority tenant source only for Industrial readiness questions", () => {
    const source = buildIndustrialCioBackofficeSource(
      "Which shared services AI use cases should the CIO fund first?",
      ["lakeshore-industries"],
    );

    expect(source).toMatchObject({
      type: "TENANT",
      id: "industrial-cio-backoffice-readiness",
      name: "Industrial Demo CIO Shared Services value-office context",
      confidence: 0.91,
    });
    expect(source?.detail).toContain("Morgan Street goal");
    expect(source?.detail).toContain("Kyriba");
    expect(source?.detail).toContain("Finance-attested baseline");
    expect(source?.detail).toContain(
      "HR and Legal source-system/process evidence",
    );
    expect(source?.detail).not.toContain("SkyHarbor");

    expect(
      buildIndustrialCioBackofficeSource(
        "Which shared services AI use cases should the CIO fund first?",
        ["skyharbor-air"],
      ),
    ).toBeNull();
    expect(
      buildIndustrialCioBackofficeSource("What is blocking IROPS scale?", [
        "lakeshore-industries",
      ]),
    ).toBeNull();
  });

  it("adds a prompt addendum that asks Claude to own assumptions and right-canvas tabs", () => {
    const addendum = buildIndustrialCioBackofficePromptAddendum(
      "How should the CIO launch the Morgan Street value office?",
      ["industrial demo"],
    );

    expect(addendum).toContain("INDUSTRIAL CIO / MORGAN STREET DEMO MODE");
    expect(addendum).toContain("user-visible advisor identity is aVa");
    expect(addendum).toContain("Treasury and Finance as the Phase 1 proof");
    expect(addendum).toContain("HR and Legal need source evidence");
    expect(addendum).toContain("planning assumptions");
    expect(addendum).toContain("Decision, Visual, Evidence, Assumptions");
  });
});

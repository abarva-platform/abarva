import { checkMovesAvaBannedLanguage } from "../banned-language";

describe("checkMovesAvaBannedLanguage", () => {
  it("passes clean, compliant text", () => {
    const result = checkMovesAvaBannedLanguage(
      "This Move is at P2 Discover & Diagnose. Two of five gate criteria are met. Next action: upload the vendor contract register.",
    );
    expect(result.pass).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("flags Claude-deflection language", () => {
    const result = checkMovesAvaBannedLanguage("You could ask Claude for a better answer.");
    expect(result.pass).toBe(false);
    expect(result.violations.some((v) => v.category === "model_deflection")).toBe(true);
  });

  it("flags raw internal IDs and schema/table names", () => {
    const withUuid = checkMovesAvaBannedLanguage(
      "Move 908c9bf8-e745-45dc-9ad8-3d493a2a1c8a is on track.",
    );
    expect(withUuid.pass).toBe(false);
    expect(withUuid.violations.some((v) => v.category === "internal_leak")).toBe(true);

    const withTable = checkMovesAvaBannedLanguage(
      "This is recorded in the program_evidence_items table.",
    );
    expect(withTable.pass).toBe(false);
    expect(withTable.violations.some((v) => v.category === "internal_leak")).toBe(true);
  });

  it("flags claims that chat approved, advanced, or promoted something", () => {
    const approved = checkMovesAvaBannedLanguage("I've approved the gate for you.");
    expect(approved.violations.some((v) => v.category === "workflow_bypass_claim")).toBe(true);

    const advanced = checkMovesAvaBannedLanguage("I've advanced the phase to P3.");
    expect(advanced.violations.some((v) => v.category === "workflow_bypass_claim")).toBe(true);

    const promoted = checkMovesAvaBannedLanguage("This evidence has been promoted to enterprise context.");
    expect(promoted.violations.some((v) => v.category === "workflow_bypass_claim")).toBe(true);
  });
});

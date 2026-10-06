import { cellTone, CELL_TONE_HEX } from "@/lib/deliverables/shared/cell-tone";

describe("cellTone", () => {
  it("reads clear risk/status values as critical", () => {
    for (const v of ["High", "critical", "FAIL", "At risk", "Red", "blocked", "overdue"]) {
      expect(cellTone(v)).toBe("critical");
    }
  });

  it("reads clear healthy values as good", () => {
    for (const v of ["Low", "pass", "On track", "Complete", "green", "approved", "Ready"]) {
      expect(cellTone(v)).toBe("good");
    }
  });

  it("reads middling values as warn", () => {
    for (const v of ["Medium", "in progress", "partial", "amber", "pending", "watch"]) {
      expect(cellTone(v)).toBe("warn");
    }
  });

  it("is neutral for free text and blanks", () => {
    for (const v of ["CIO", "Phased KT", "", "   ", "see appendix", "n/a"]) {
      expect(cellTone(v)).toBe("neutral");
    }
  });

  it("matches whole words only — 'highlight' is not 'high'", () => {
    expect(cellTone("highlight the plan")).toBe("neutral");
    expect(cellTone("lower the cost")).toBe("neutral"); // not 'low'
    expect(cellTone("high risk")).toBe("critical");
  });

  it("every tone has a readable text colour; only neutral has no fill", () => {
    expect(CELL_TONE_HEX.neutral.fill).toBeNull();
    for (const t of ["critical", "warn", "good"] as const) {
      expect(CELL_TONE_HEX[t].fill).toMatch(/^[0-9A-F]{6}$/i);
      expect(CELL_TONE_HEX[t].text).toMatch(/^[0-9A-F]{6}$/i);
    }
  });
});

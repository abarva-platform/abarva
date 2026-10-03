import {
  CLEAN_DEMO_MOVES,
  type DemoMove,
} from "../clean-demo-moves";
import { demoSafeClientText } from "@/lib/client-config";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const movesText = (m: DemoMove): string =>
  [
    m.name,
    m.thesis,
    m.valueStance,
    m.displayCode,
    ...m.systems,
    ...m.dataDomains,
    ...m.openEvidence,
    ...(m.charter ? Object.values(m.charter) : []),
  ].join(" ");

describe("Meridian clean demo moves", () => {
  it("is a small, focused demo set (5 moves), each labelled synthetic", () => {
    expect(CLEAN_DEMO_MOVES).toHaveLength(5);
    for (const m of CLEAN_DEMO_MOVES) {
      expect(m.synthetic).toBe(true);
    }
  });

  it("carries no builder vocabulary, test-run ids, or placeholder scaffolding on any field", () => {
    for (const m of CLEAN_DEMO_MOVES) {
      const text = movesText(m);
      expect(text).not.toMatch(/E2E\s*\d+/i);
      expect(text).not.toMatch(/\bROLE-\d+/i);
      expect(text).not.toMatch(/authority_matrix\.csv/i);
      expect(text).not.toMatch(/\bExpert Kernel\b|\bDomain Function Pack\b/i);
      expect(text).not.toMatch(/\bsynthetic role-level\b/i);
      // Client-facing names survive the demo-safe sanitizer unchanged (nothing
      // to strip), which is the sign they read as real content.
      expect(demoSafeClientText(m.name)).toBe(m.name);
      // Display code is a human reference, not a raw tenant slug.
      expect(m.displayCode).not.toMatch(/HEALTHCARE_IDN/);
    }
  });

  it("stays honest: early phases only, and never asserts fabricated funded value", () => {
    for (const m of CLEAN_DEMO_MOVES) {
      // Candidates in early shaping — never staged into Design/Roadmap/Mobilize.
      expect(m.entryPhase).toBeGreaterThanOrEqual(0);
      expect(m.entryPhase).toBeLessThanOrEqual(2);
      // The value stance is explicitly unvalidated / not funded — no "$Nm funded".
      expect(m.valueStance).toMatch(
        /to be validated|not funded|candidate|no funded value/i,
      );
      expect(m.valueStance).not.toMatch(/\$\s?\d/);
      // Every move names its open evidence honestly.
      expect(m.openEvidence.length).toBeGreaterThan(0);
    }
  });

  it("gives every chartered move all six P1 inputs in plain language", () => {
    for (const m of CLEAN_DEMO_MOVES) {
      if (m.entryPhase >= 1 && m.charter) {
        for (const v of Object.values(m.charter)) {
          expect(typeof v).toBe("string");
          expect(v.length).toBeGreaterThan(40);
        }
      }
    }
  });

  it("names and ids match the interview-derived candidate opportunities", () => {
    const view = JSON.parse(
      readFileSync(
        join(
          process.cwd(),
          "datasets/tenant-inputs/meridian-health/derived/module-context/moves-context-view.json",
        ),
        "utf8",
      ),
    ) as {
      candidate_move_opportunities: Array<{
        initiative_link: string;
        candidate_name: string;
      }>;
    };
    const byId = new Map(
      view.candidate_move_opportunities.map((c) => [c.initiative_link, c.candidate_name]),
    );
    for (const m of CLEAN_DEMO_MOVES) {
      expect(byId.has(m.initiativeLink)).toBe(true);
      expect(byId.get(m.initiativeLink)).toBe(m.name);
    }
  });
});

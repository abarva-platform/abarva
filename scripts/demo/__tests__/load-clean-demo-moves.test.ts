import {
  engagementPayload,
  graphNodeId,
  TEST_MOVE_PATTERNS,
} from "../load-clean-demo-moves";
import { CLEAN_DEMO_MOVES } from "../clean-demo-moves";

describe("clean demo moves loader", () => {
  it("never seeds a fabricated funded value and never asserts gate approvals", () => {
    for (const move of CLEAN_DEMO_MOVES) {
      const p = engagementPayload(move);
      expect(p.value_projected_low_usd).toBeNull();
      expect(p.value_projected_high_usd).toBeNull();
      expect(p.value_verified_status).toBe("pending");
      // Shaping candidate — never 'approved'/funded.
      expect(p.lifecycle_state).toBe("shaping");
      expect(p.origin_source).toBe("intelligence_candidate");
      // Gate/evidence honesty is owned by the evidence/phase workstream.
      expect(p.gates_passed).toEqual([]);
    }
  });

  it("seeds the move at its entry phase with sponsor and display code", () => {
    for (const move of CLEAN_DEMO_MOVES) {
      const p = engagementPayload(move);
      expect(p.current_phase).toBe(move.entryPhase);
      expect(p.display_code).toBe(move.displayCode);
      expect(p.sponsor).toMatchObject({
        name: move.sponsor.name,
        role: move.sponsor.role,
      });
      expect(p.name).toBe(move.name);
    }
  });

  it("carries the six charter inputs for chartered moves", () => {
    for (const move of CLEAN_DEMO_MOVES) {
      if (!move.charter) continue;
      const scaffold = (engagementPayload(move).charter as { scaffold: Record<string, unknown> }).scaffold;
      for (const key of [
        "scope_boundary",
        "success_criteria",
        "stakeholder_map",
        "decision_rights",
        "evidence_plan",
        "sponsor_and_progress_preference",
      ]) {
        expect(typeof scaffold[key]).toBe("string");
      }
    }
  });

  it("keeps sponsor contacts informational and all progress emails disabled", () => {
    for (const move of CLEAN_DEMO_MOVES.filter((entry) => entry.charter)) {
      expect(move.charter?.sponsorAndProgressPreference).toMatch(/not (?:an )?approvers?/i);
      expect(move.charter?.sponsorAndProgressPreference).toMatch(/email preference is not configured/i);
      expect(move.charter?.decisionRights).toMatch(/authorized workspace user records/i);
      expect(move.charter?.sponsorAndProgressPreference).not.toMatch(/phase-gate decisions sit with the sponsor/i);
    }
  });

  it("gives every move a stable, unique graph node id", () => {
    const ids = CLEAN_DEMO_MOVES.map(graphNodeId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^eng_demo_clean_/);
  });

  it("archives the test-named moves but never the clean ones", () => {
    const matches = (name: string) => TEST_MOVE_PATTERNS.some((re) => re.test(name));
    expect(matches("Synthetic Agent Assist Claude E2E 1002")).toBe(true);
    expect(matches("Member Service Agent Assist Transformation E2E 7")).toBe(true);
    for (const move of CLEAN_DEMO_MOVES) {
      expect(matches(move.name)).toBe(false);
    }
  });
});

import {
  WORKSHOP_TEMPLATES,
  getMovePhasePlaybook,
  listPlaybookPhases,
  type WorkshopTemplateKind,
} from "../move-phase-playbook";
import { renderDesignSessionPackHtml } from "../design-session-pack";
import { AI_PDLC_SESSION_OVERRIDES } from "../ai-pdlc-design-sessions";

describe("move-phase-playbook — richer session/workshop content", () => {
  it("every default phase (P1-P5) has real alignment points, facilitation notes, and workshop templates", () => {
    for (const phase of [1, 2, 3, 4, 5] as const) {
      const playbook = getMovePhasePlaybook(phase);
      expect(playbook).toBeTruthy();
      for (const session of playbook!.sessions) {
        expect(session.alignmentPoints?.length ?? 0).toBeGreaterThan(0);
        expect(session.alignmentPoints![0].betweenRoles).toHaveLength(2);
        expect(session.alignmentPoints![0].question.length).toBeGreaterThan(10);

        expect(session.facilitation).toBeTruthy();
        expect(session.facilitation!.opening.length).toBeGreaterThan(10);
        expect(session.facilitation!.closing.length).toBeGreaterThan(10);
        expect(session.facilitation!.probeIfWeak.length).toBeGreaterThan(0);
        expect(session.facilitation!.disagreementSignals.length).toBeGreaterThan(0);
        expect(session.facilitation!.parkingLotRule.length).toBeGreaterThan(10);

        expect(session.workshopTemplates?.length ?? 0).toBeGreaterThan(0);
        for (const kind of session.workshopTemplates!) {
          expect(WORKSHOP_TEMPLATES[kind]).toBeTruthy();
        }
      }
    }
  });

  it("P1's parking-lot rule explicitly defers solution design to P3 (phase discipline holds for the new content too)", () => {
    const p1 = getMovePhasePlaybook(1)!;
    expect(p1.sessions[0].facilitation!.parkingLotRule).toMatch(/P3/);
  });

  it("P3's alignment points cover the architect/security tension named in the original design conversation", () => {
    const p3 = getMovePhasePlaybook(3)!;
    const roles = p3.sessions[0].alignmentPoints!.flatMap((a) => a.betweenRoles);
    expect(roles).toContain("Enterprise architect");
    expect(roles).toContain("Security/risk");
  });

  it("WORKSHOP_TEMPLATES defines all 8 canonical templates with real columns", () => {
    const expectedKinds: WorkshopTemplateKind[] = [
      "decision_log",
      "open_issue_log",
      "assumption_register",
      "evidence_request_tracker",
      "stakeholder_alignment_matrix",
      "option_scoring",
      "action_register",
      "approval_page",
    ];
    for (const kind of expectedKinds) {
      const spec = WORKSHOP_TEMPLATES[kind];
      expect(spec).toBeTruthy();
      expect(spec.columns.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("listPlaybookPhases still returns all 5 phases (no regression to the existing resolver)", () => {
    expect(listPlaybookPhases()).toEqual([1, 2, 3, 4, 5]);
  });

  it("an archetype override (AI-PDLC, no new fields yet) still resolves and renders without crashing", () => {
    const playbook = getMovePhasePlaybook(3, AI_PDLC_SESSION_OVERRIDES);
    expect(playbook!.sessions.length).toBeGreaterThan(1); // AI-PDLC already overrides with multiple sessions
    // renderer must gracefully omit alignment/facilitation sections when absent,
    // not throw and not render an empty-but-visible section
    const html = renderDesignSessionPackHtml(playbook!, "Test Move");
    expect(html).toMatch(/<!doctype html>/i);
    expect(html).not.toMatch(/Alignment needed/); // no alignmentPoints on these sessions
    expect(html).not.toMatch(/Facilitator notes/); // no facilitation on these sessions
  });
});

describe("renderDesignSessionPackHtml — new sections", () => {
  it("renders facilitation notes, alignment points, and the workshop template appendix for a default playbook", () => {
    const playbook = getMovePhasePlaybook(1)!;
    const html = renderDesignSessionPackHtml(playbook, "Test Move");
    expect(html).toMatch(/Facilitator notes/);
    expect(html).toMatch(/Open with:/);
    expect(html).toMatch(/Alignment needed/);
    expect(html).toMatch(/Sponsor.*↔.*Finance partner|Finance partner.*↔.*Sponsor/);
    expect(html).toMatch(/Workshop Template Appendix/);
    expect(html).toMatch(/Decision Log/);
  });

  it("de-duplicates the workshop template appendix across sessions sharing the same template kind", () => {
    const playbook = getMovePhasePlaybook(4)!; // uses decision_log, action_register, assumption_register
    const html = renderDesignSessionPackHtml(playbook, "Test Move");
    const decisionLogHeadingCount = (html.match(/<h3>Decision Log<\/h3>/g) ?? []).length;
    expect(decisionLogHeadingCount).toBe(1);
  });
});

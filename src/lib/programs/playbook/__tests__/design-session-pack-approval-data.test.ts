// Product approvals have one authority: an authorized workspace user.
// Workshop exports must not revive historical role-specific approval rows.
import { renderDesignSessionPackHtml } from "../design-session-pack";
import type { MovePhasePlaybook, MovePhaseSession } from "../move-phase-playbook";

function session(overrides: Partial<MovePhaseSession> = {}): MovePhaseSession {
  return {
    id: "s1",
    label: "Test session",
    objective: "Decide something.",
    participants: ["Sponsor"],
    discussionGuide: ["Discuss."],
    frameworks: [],
    captureTemplate: ["Decision"],
    homework: ["Read the brief."],
    gate: { criterion: "Aligned.", alignedBy: "Sponsor", severity: "hard" },
    feedsDeliverables: ["business_case"],
    workshopTemplates: ["approval_page"],
    ...overrides,
  };
}

function playbook(sessions: MovePhaseSession[]): MovePhasePlaybook {
  return { phase: 4, label: "P4 Test", intent: "Test intent.", sessions };
}

describe("renderDesignSessionPackHtml — authorized-user approval boundary", () => {
  it("renders a blank product-approval record for the authorized workspace user", () => {
    const html = renderDesignSessionPackHtml(playbook([session()]), "Test Move");
    expect(html).toMatch(/Product Approval Record/);
    expect(html).toMatch(/Authorized workspace approver/);
    expect(html).toMatch(/Rationale/);
    expect(html).toMatch(/<td>&nbsp;<\/td>/);
    expect(html).not.toMatch(/signed by Sponsor/i);
  });

  it("does not project historical role-approval decisions into a client workshop pack", () => {
    const html = renderDesignSessionPackHtml(playbook([session()]), "Test Move");
    expect(html).not.toMatch(/Business approver|Finance approver/);
    expect(html).toMatch(/Authorized workspace approver/);
    expect(html).not.toMatch(/signed by Sponsor/i);
  });

  it("keeps unrelated workshop templates blank and independent", () => {
    const html = renderDesignSessionPackHtml(
      playbook([session({ workshopTemplates: ["approval_page", "decision_log"] })]),
      "Test Move",
    );
    const decisionLogSection = html.slice(html.indexOf("Decision Log"));
    expect(decisionLogSection).toMatch(/<td>&nbsp;<\/td>/);
  });
});

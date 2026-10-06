jest.mock("server-only", () => ({}));

import {
  buildMoveProgressMessage,
  selectMoveProgressRecipients,
} from "../move-progress-notifications";

describe("Moves sponsor progress notifications", () => {
  it("emails only listed sponsor contacts with an explicit phase-update opt-in", () => {
    expect(
      selectMoveProgressRecipients(
        [
          { user_id: "actor", role: "sponsor", notify_on: ["phase_gate"] },
          { user_id: "sponsor-1", role: "Sponsor", notify_on: ["phase_gate"] },
          { user_id: "sponsor-1", role: "sponsor", notify_on: ["phase_gate"] },
          { user_id: "co-sponsor", role: "Co-sponsor", notify_on: ["phase_gate"] },
          { user_id: "sponsor-2", role: "sponsor", notify_on: ["approval"] },
          { user_id: "observer", role: "observer", notify_on: ["phase_gate"] },
        ],
      ),
    ).toEqual(["actor", "sponsor-1", "co-sponsor"]);
  });

  it("clearly marks the email as informational and requests no sponsor approval", () => {
    const message = buildMoveProgressMessage({
      moveName: "Synthetic contact-center assessment",
      fromPhase: 2,
      toPhase: 3,
      workspaceUrl: "https://app.abarva.ai/strategic-moves/move-1/phase/3",
    });

    expect(message.subject).toContain("P2 approved");
    expect(message.text).toContain("progress update only");
    expect(message.text).toContain("no sponsor approval or signature is requested");
    expect(message.text).toContain("/phase/3");
  });
});

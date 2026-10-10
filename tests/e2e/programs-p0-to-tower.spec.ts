/**
 * One signed-in, stateful Moves gate walk across P0–P5 to Tower. An ACA fixture
 * job must prepare the disposable Move's captures, reviewed evidence, and
 * signed outputs before each run. This suite does not mock approvals or writes.
 */
import { expect, test } from "@playwright/test";
import {
  approveReadyMovesGate,
  missingMovesGatePrereqs,
  openSignedInMove,
} from "./_helpers/moves-gate-walk";

const moveId = process.env.E2E_MOVES_P0_ID;
const missing = missingMovesGatePrereqs(moveId);

test.describe("Moves continuous P0 to Tower", () => {
  test.skip(missing.length > 0, `Missing lab fixture inputs: ${missing.join(", ")}`);

  test("each governed gate persists its next phase before the Tower handoff", async ({
    page,
  }) => {
    await openSignedInMove(page, moveId!, 0);
    for (let phase = 0; phase <= 5; phase += 1) {
      // This gate suite asserts the capture flow; step-page tenants use the legacy hatch.
      await page.goto(`/strategic-moves/${moveId}/phase/${phase}?legacy=1`, {
        waitUntil: "domcontentloaded",
      });
      const result = await approveReadyMovesGate(page, moveId!, phase);
      if (phase === 5) {
        expect(result.terminalHandoff).toBe(true);
        expect(result.nextAction).toBe("open_tower_handoff");
      }
    }

    await page.goto(`/strategic-moves/${moveId}/phase/5?legacy=1`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("body")).toContainText("Tower handoff complete");
    await page.goto("/tower", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("tower-main-submenu")).toBeVisible();
  });
});

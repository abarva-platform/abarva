/**
 * The terminal Moves gate records phase 6, then exposes the Tower handoff.
 * This is independent of the /engagements chat flow, which ends at Verify.
 */
import { expect, test } from "@playwright/test";
import {
  approveReadyMovesGate,
  missingMovesGatePrereqs,
  openSignedInMove,
} from "./_helpers/moves-gate-walk";

const moveId = process.env.E2E_MOVES_P5_ID;
const missing = missingMovesGatePrereqs(moveId);

test.describe("Moves P5 to Tower", () => {
  test.skip(missing.length > 0, `Missing lab fixture inputs: ${missing.join(", ")}`);

  test("terminal approval persists the phase it reports and opens Tower", async ({
    page,
  }) => {
    await openSignedInMove(page, moveId!, 5);
    const approved = await approveReadyMovesGate(page, moveId!, 5);
    expect(approved.terminalHandoff).toBe(true);
    expect(approved.nextAction).toBe("open_tower_handoff");

    await page.goto(`/strategic-moves/${moveId}/phase/5`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("body")).toContainText("Tower handoff complete");
    await page.goto("/tower", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("tower-main-submenu")).toBeVisible();
    await expect(page.getByTestId("tower-source-handoff-panel")).toBeVisible();
  });
});

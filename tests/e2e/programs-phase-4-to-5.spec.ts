/**
 * Moves capture workspace, not the separate /engagements chat phase vocabulary.
 * The lab fixture is disposable, at P4, and carries real reviewed gate inputs.
 */
import { expect, test } from "@playwright/test";
import {
  approveReadyMovesGate,
  missingMovesGatePrereqs,
  openSignedInMove,
} from "./_helpers/moves-gate-walk";

const moveId = process.env.E2E_MOVES_P4_ID;
const missing = missingMovesGatePrereqs(moveId);

test.describe("Moves P4 to P5", () => {
  test.skip(missing.length > 0, `Missing lab fixture inputs: ${missing.join(", ")}`);

  test("approved P4 gate persists P5 and opens the handoff workspace", async ({
    page,
  }) => {
    await openSignedInMove(page, moveId!, 4);
    await approveReadyMovesGate(page, moveId!, 4);

    await page.goto(`/strategic-moves/${moveId}/phase/5`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("body")).toContainText("Mobilization Handoff");
    await expect(page.locator("body")).toContainText("Tower Outcome Ledger");
  });
});

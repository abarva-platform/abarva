// Slice 0 — the live click-through harness for the Moves deliverable redo.
//
// Threads the live use case (Meridian Health · "Unify clinical + claims on
// Databricks") through the move workflow and scores each generated artifact
// against the golden bar. Re-run after EVERY slice — this is the anti-
// "click-failure" muscle.
//
// Runs against the deployed app. Requires:
//   E2E_BASE_URL                 (e.g. https://app.abarva.ai)
//   E2E_MOVE_ID                  (the Meridian clinical+claims move)
//   plus an authenticated storage state (Clerk session) via E2E_STORAGE_STATE.
// Skips cleanly when those are absent so CI stays green.

import { test, expect } from "@playwright/test";
import { meetsGoldenBar } from "@/lib/deliverables/golden-bar";

const BASE = process.env.E2E_BASE_URL;
const MOVE_ID = process.env.E2E_MOVE_ID;
const ready = Boolean(BASE && MOVE_ID && process.env.E2E_STORAGE_STATE);

test.describe("Moves deliverable redo — live click-through", () => {
  test.skip(!ready, "set E2E_BASE_URL + E2E_MOVE_ID + E2E_STORAGE_STATE to run");

  test("the move surface drives capture → gate → generate without click failure", async ({ page }) => {
    await page.goto(`${BASE}/strategic-moves/${MOVE_ID}`);
    await expect(page.getByText(/Strategic Moves/i)).toBeVisible();
    // Phase rail + Documents tab present (the surfaces the redo touches).
    await page.getByRole("link", { name: /Documents/i }).click();
    await expect(page).toHaveURL(/tab=documents/);
  });

  // Per-slice acceptance: as each slice lands, fetch the generated artifact's
  // HTML and assert it meets the golden bar. (Wired to the artifact view/export
  // endpoint once Slice 2 renders Claude-authored HTML.)
  test("a generated Target Architecture meets the golden bar", async ({ page, request }) => {
    test.skip(!process.env.E2E_ARTIFACT_URL, "set E2E_ARTIFACT_URL once Slice 2 renders HTML");
    const res = await request.get(process.env.E2E_ARTIFACT_URL!);
    const html = await res.text();
    const bar = meetsGoldenBar(html, "target_state_architecture");
    expect(bar.hasDataGap, "no [DATA GAP] — context must be bound").toBe(false);
    expect(bar.proseOnly, "must be visual, not prose-only").toBe(false);
    expect(bar.pass, `golden bar: ${bar.reasons.join("; ")}`).toBe(true);
  });
});

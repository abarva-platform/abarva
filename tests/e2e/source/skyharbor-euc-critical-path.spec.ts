/**
 * Source critical-path E2E — the user's crawl, encoded.
 *
 * Origin: the 2026-06-11 testing retrospective — every shipped bug lived on a seam the
 * author tested via API but users reach via UI. This spec walks the seams a client CXO
 * actually clicks, against the deployed env (BASE_URL), signed in as SkyHarbor.
 *
 * Read-mostly by design: it asserts surface presence + route contracts (including the
 * rationale-required 422) without mutating event state, so it is safe on shared envs.
 * Deep mutation flows (upload → ladder, approve-with-gaps → record) run in the manual
 * package (SOURCE_E2E_TESTING_PACKAGE.html) until a dedicated test event is provisioned.
 */
import { test, expect } from "@playwright/test";
import { signInAs, sourcePersonaStorageState } from "./_auth";

const SKYH_EVENT = "85104cf5-94c1-4101-b07d-5a7ac765eb0b"; // Legacy app support consolidation (seeded)

test.describe("Source critical path (SkyHarbor)", () => {
  test.use({ storageState: sourcePersonaStorageState("skyharbor-vp-itops") });

  test.beforeAll(async ({ browser }) => {
    // primes .auth storage state on first run
    const page = await browser.newPage();
    await signInAs(page, "skyharbor-vp-itops");
    await page.close();
  });

  test("Approvals inbox renders with plain-English items and one action per row", async ({
    page,
  }) => {
    await page.goto("/source/approvals");
    await expect(
      page.getByRole("heading", { name: /waiting on you|Nothing waiting/i }),
    ).toBeVisible();
    // every listed item carries exactly one primary action link
    const rows = page.locator("a", {
      hasText: /Review & approve|Approve now|Review & decide/,
    });
    if ((await rows.count()) > 0) {
      await expect(rows.first()).toHaveAttribute("href", /\/source\/events\//);
    }
  });

  test("Event canvas renders the stage rail and workspace tabs", async ({
    page,
  }) => {
    await page.goto(`/source/events/${SKYH_EVENT}?stage=strategy`);
    await expect(
      page.getByText("Strategy", { exact: false }).first(),
    ).toBeVisible();
    for (const tab of ["Document", "Gate", "Evidence", "Log"]) {
      await expect(
        page.getByRole("tab", { name: new RegExp(tab) }).first(),
      ).toBeVisible();
    }
    // governance banner — agents propose, humans approve
    await expect(page.getByText(/HUMAN APPROVAL REQUIRED/i)).toBeVisible();
  });

  test("Upload document affordance exists on the EVENT DOCUMENTS shelf (not just the chat paperclip)", async ({
    page,
  }) => {
    await page.goto(`/source/events/${SKYH_EVENT}?stage=strategy`);
    await expect(
      page.getByTestId("source-upload-event-document"),
    ).toBeVisible();
  });

  test("Gate decision route refuses approve-with-gaps without a rationale (422)", async ({
    page,
  }) => {
    await page.goto("/source/approvals"); // ensures session cookies on context
    const res = await page.request.post(
      `/api/v1/source/events/${SKYH_EVENT}/gate-decision`,
      {
        data: {
          stageKey: "rfp_design",
          satisfiedRequirementKeys: [
            "rfp_sections_drafted",
            "pricing_template",
          ],
          action: "approve_with_gaps",
          // no rationale — must be refused, never silently approved
        },
      },
    );
    expect(res.status()).toBe(422);
    const body = (await res.json()) as { error?: string; detail?: string };
    expect(body.error).toBe("invalid_decision");
    expect(String(body.detail)).toMatch(/rationale/i);
  });

  test("Evidence tab shows the upload checklist and readiness states", async ({
    page,
  }) => {
    await page.goto(`/source/events/${SKYH_EVENT}?stage=strategy`);
    await page
      .getByRole("tab", { name: /Evidence/ })
      .first()
      .click();
    await expect(page.getByText(/Evidence checklist/i).first()).toBeVisible();
    await expect(page.getByText(/Required ready/i).first()).toBeVisible();
    await expect(
      page.getByRole("table", { name: /Evidence required/i }),
    ).toBeVisible();
    await expect(page.getByText(/Upload/i).first()).toBeVisible();
    await expect(page.getByText(/Readiness/i).first()).toBeVisible();
  });
});

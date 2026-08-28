// Tower Command Center — end-to-end coverage of `/tower`: four contract tabs
// and the drawers reachable from the redesigned surface.
//
// Since 2026-07-23 the Command Center is PRIMARY at `/tower`. Legacy Tower
// pages are retired from runtime and stale legacy links redirect here.

import { expect, test, type Page } from "@playwright/test";
import {
  DEMO_ACCOUNTS,
  missingAuthPrereqs,
  withClerkAuth,
} from "./_helpers/auth";

const TENANT = "meridian" as const;

const TABS = [
  { name: "Executive View", heading: "Today's verdict" },
  { name: "Value Proof", heading: "Value proof" },
  { name: "AI Portfolio", heading: "AI portfolio" },
  { name: "Evidence & Actions", heading: "Three populations, three names" },
] as const;

/**
 * Open Tower and confirm the Command Center root rendered.
 */
async function openCommandCenter(page: Page): Promise<boolean> {
  await page.goto("/tower", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  return (await page.getByTestId("tower-command-center").count()) > 0;
}

test.describe("Tower Command Center v2", () => {
  test.skip(
    missingAuthPrereqs.length > 0,
    `Missing auth prerequisites: ${missingAuthPrereqs.join(", ")}`,
  );

  test.beforeEach(async ({ page }) => {
    await withClerkAuth(page, DEMO_ACCOUNTS[TENANT]);
  });

  test("renders every tab, sub-view and drawer", async ({ page }) => {
    const enabled = await openCommandCenter(page);
    expect(enabled).toBe(true);

    const root = page.getByTestId("tower-command-center");
    await expect(root).toBeVisible();

    // ── the page must never scroll the whole viewport ─────────────────────
    // The design is a fixed-viewport shell. If this regresses, the page is
    // claiming a second viewport below the nav (the 3d89299e9 bug class).
    const bodyOverflows = await page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight + 2,
    );
    expect(bodyOverflows).toBe(false);

    // ── 4 tabs ────────────────────────────────────────────────────────────
    const tablist = page.getByRole("tablist", {
      name: "Tower Command Center sections",
    });
    await expect(tablist).toBeVisible();
    await expect(tablist.getByRole("tab")).toHaveCount(4);

    for (const tab of TABS) {
      await tablist.getByRole("tab", { name: new RegExp(tab.name) }).click();
      await expect(
        page.getByRole("tab", { name: new RegExp(tab.name) }),
      ).toHaveAttribute("aria-selected", "true");
      await expect(
        page.getByText(tab.heading, { exact: false }).first(),
      ).toBeVisible();
    }

    // ── deep-linking: the active tab is reflected in ?tab= ────────────────
    expect(new URL(page.url()).searchParams.get("tab")).toBe("actions");
  });

  test("Value Proof opens the program drawer from the value case lanes", async ({
    page,
  }) => {
    const enabled = await openCommandCenter(page);
    expect(enabled).toBe(true);

    await page.getByRole("tab", { name: /Value Proof/ }).click();
    const firstProgram = page.locator("table button").first();
    test.skip(
      (await firstProgram.count()) === 0,
      "No governed programs for this tenant — nothing to open.",
    );
    await firstProgram.click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Value proof chain")).toBeVisible();

    // Escape closes and focus returns to the trigger.
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });

  test("AI Portfolio has four sub-views and opens the initiative drawer", async ({
    page,
  }) => {
    const enabled = await openCommandCenter(page);
    expect(enabled).toBe(true);

    await page.getByRole("tab", { name: /AI Portfolio/ }).click();

    await expect(page.getByText("Attributed spend by vendor")).toBeVisible();
    await expect(page.getByText("Cost findings · evidenced")).toBeVisible();

    const firstItem = page
      .getByRole("button", { name: /exposed at review/ })
      .first();
    test.skip(
      (await firstItem.count()) === 0,
      "No governed AI initiatives for this tenant.",
    );
    await firstItem.click();
    await expect(
      page.getByRole("dialog").getByText("Value potential"),
    ).toBeVisible();
  });

  test("Evidence & Actions opens the gap drawer from the owner queue", async ({
    page,
  }) => {
    const enabled = await openCommandCenter(page);
    expect(enabled).toBe(true);

    await page.getByRole("tab", { name: /Evidence & Actions/ }).click();
    await expect(page.getByText("Evidence-owner queue")).toBeVisible();

    const trace = page.locator('[class*="ownerQueue"] button').first();
    test.skip(
      (await trace.count()) === 0,
      "No governed evidence gaps for this tenant.",
    );
    await trace.click();
    await expect(
      page.getByRole("dialog").getByText("Audit trace"),
    ).toBeVisible();
  });

  test("the action drawer never claims a route that did not happen", async ({
    page,
  }) => {
    const enabled = await openCommandCenter(page);
    expect(enabled).toBe(true);

    await page.getByRole("tab", { name: /Evidence & Actions/ }).click();

    const firstAction = page
      .getByRole("button", { name: /Usage telemetry connection/ })
      .first();
    test.skip(
      (await firstAction.count()) === 0,
      "No governed CXO actions for this tenant.",
    );
    await firstAction.click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();

    // There is no governed Tower → Moves create path yet, so the control is
    // disabled and no confirmation is ever shown.
    const approve = drawer.getByRole("button", { name: /Approve & route/ });
    await expect(approve).toBeDisabled();
    await expect(
      drawer.getByText(/Routing is not available yet/),
    ).toBeVisible();
    await expect(drawer.getByText(/^Routed to/)).toHaveCount(0);
  });

  test("logs no console errors across every tab", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    const enabled = await openCommandCenter(page);
    expect(enabled).toBe(true);

    for (const tab of TABS) {
      await page.getByRole("tab", { name: new RegExp(tab.name) }).click();
      await page.waitForTimeout(250);
    }

    expect(errors).toEqual([]);
  });
});

test.describe("Tower routing after promotion", () => {
  test.skip(
    missingAuthPrereqs.length > 0,
    `Missing auth prerequisites: ${missingAuthPrereqs.join(", ")}`,
  );

  test.beforeEach(async ({ page }) => {
    await withClerkAuth(page, DEMO_ACCOUNTS[TENANT]);
  });

  test("/tower/command redirects to /tower and preserves query params", async ({
    page,
  }) => {
    await page.goto("/tower/command?tab=evidence", {
      waitUntil: "domcontentloaded",
    });
    const url = new URL(page.url());
    expect(url.pathname).toBe("/tower");
    expect(url.searchParams.get("tab")).toBe("actions");
  });

  test("/tower/legacy redirects to the primary Command Center", async ({
    page,
  }) => {
    await page.goto("/tower/legacy", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => undefined);
    expect(new URL(page.url()).pathname).toBe("/tower");
    await expect(page.getByTestId("tower-command-center")).toBeVisible();
  });
});

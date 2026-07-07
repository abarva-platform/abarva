import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicRoutes = [
  { name: "home", path: "/" },
  { name: "sign-in", path: "/sign-in" },
] as const;

for (const route of publicRoutes) {
  test(`${route.name} has no WCAG 2.1 AA axe violations`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", /.+/);
    await expect(page.locator("body")).not.toContainText("host_invalid");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

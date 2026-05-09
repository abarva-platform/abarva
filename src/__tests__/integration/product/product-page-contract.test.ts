import { readFileSync } from "fs";
import { join } from "path";
import { PRODUCT_TABS } from "@/lib/product/product-page-content";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Product page contract", () => {
  const pageSource = read("src/app/(maestro)/product/page.tsx");
  const topBarSource = read("src/components/shell/AppTopBar.tsx");
  const maestroChromeSource = read("src/components/chrome/MaestroChrome.tsx");
  const productPageSource = read("src/components/product/ProductPage.tsx");
  const productMarketingPageSource = read(
    "src/components/product/ProductMarketingPage.tsx",
  );
  const contentSource = read("src/lib/product/product-page-content.ts");

  it("is an authenticated AppShell surface, not a standalone marketing page", () => {
    expect(pageSource).toContain("currentUser");
    expect(pageSource).toContain('redirect("/sign-in")');
    expect(pageSource).toContain("AppShell");
    expect(pageSource).toContain('surface="product"');
    expect(pageSource).not.toContain("AbarvaNav");
  });

  it("adds Product as a signed-in top-nav item without module gating", () => {
    expect(topBarSource).toContain('key: "product"');
    expect(topBarSource).toContain('label: "Product"');
    expect(topBarSource).toContain('href: "/product"');
    expect(topBarSource).toContain('pathname === "/product"');

    const productBlock = topBarSource.slice(
      topBarSource.indexOf('key: "product"'),
      topBarSource.indexOf("];", topBarSource.indexOf('key: "product"')),
    );
    expect(productBlock).not.toContain("module:");
  });

  it("bypasses legacy MaestroChrome to avoid duplicate navigation", () => {
    expect(maestroChromeSource).toContain("/learn");
    expect(maestroChromeSource).toContain("/product");
  });

  it("binds the signed-in Product spotlight to the active client", () => {
    expect(pageSource).toContain("getActiveClientKey");
    expect(pageSource).toContain("getActiveClientRow");
    expect(pageSource).toContain("canonicalClientDisplayName");
    expect(pageSource).toContain("spotlight={{");
    expect(productMarketingPageSource).toContain(
      "See it on {spotlight.clientShortName}",
    );
    expect(productMarketingPageSource).toContain(
      "Open Intelligence on {spotlight.clientShortName}",
    );
    expect(productMarketingPageSource).not.toContain("See it on Meridian");
    expect(productMarketingPageSource).not.toContain(
      "Open Intelligence on Meridian",
    );
  });

  it("ships the five required Atrium product tabs", () => {
    expect(PRODUCT_TABS.map((tab) => tab.label)).toEqual([
      "Architecture",
      "Knowledge layer",
      "Data plane & security",
      "Lifecycle & discipline",
      "Scalability & vision",
    ]);
    for (const tab of PRODUCT_TABS) {
      expect(tab.proofPoints.length).toBeGreaterThanOrEqual(3);
      expect(tab.applicationSteps.length).toBeGreaterThanOrEqual(4);
      expect(tab.valueTranslation.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("supports mature Atrium interaction affordances", () => {
    expect(productPageSource).toContain("handleTabKeyDown");
    expect(productPageSource).toContain('event.key === "ArrowRight"');
    expect(productPageSource).toContain('event.key === "ArrowLeft"');
    expect(productPageSource).toContain('role="tablist"');
    expect(productPageSource).toContain('role="tabpanel"');
    expect(productPageSource).toContain(
      "tabIndex={activeKey === tab.key ? 0 : -1}",
    );
    expect(productPageSource).toContain('aria-live="polite"');
    expect(productPageSource).toContain("Atlas state model");
    expect(productPageSource).toContain("prefers-reduced-motion: reduce");
  });

  it("keeps page copy inside the handoff guardrails", () => {
    const pageCopySource = `${contentSource}\n${productPageSource}`;
    const forbiddenPatterns = [
      /\bAzure\b/i,
      /\bAWS\b/i,
      /\bGCP\b/i,
      /\bPostgres\b/i,
      /\bPinecone\b/i,
      /\bNext\.js\b/i,
      /\bVercel\b/i,
      /\bApex\b/i,
      /\bMeridian\b/i,
      /\bFirst Capital\b/i,
      /\binvestor\b/i,
      /\bfunding\b/i,
      /\bpricing\b/i,
      /\bscreenshot/i,
    ];

    for (const pattern of forbiddenPatterns) {
      expect(pageCopySource).not.toMatch(pattern);
    }
  });
});

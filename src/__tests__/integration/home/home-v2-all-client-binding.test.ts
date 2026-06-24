import { existsSync, readFileSync } from "node:fs";

import { ALL_CLIENTS } from "@/lib/client-config";
import {
  buildHomeV2DataScript,
  HOME_V2_CLIENT_PACKS,
  homeV2SectionIds,
  resolveHomeV2ClientPack,
} from "@/lib/home-v2/data";

const HOME_PAGE = "src/app/(maestro)/home/page.tsx";
const HOME_FRAME_ROUTE = "src/app/api/home/v2-frame/route.ts";
const HOME_DATA_ROUTE = "src/app/api/home/v2-data/route.ts";
const HOME_V2_DATA = "src/lib/home-v2/data.ts";
const HOME_V2_HTML = "public/home-v2/index.html";
const HOME_V2_APP = "public/home-v2/app.js";

describe("Home v2 all-client Context Explorer binding", () => {
  const pageSource = readFileSync(HOME_PAGE, "utf8");
  const frameRoute = readFileSync(HOME_FRAME_ROUTE, "utf8");
  const dataRoute = readFileSync(HOME_DATA_ROUTE, "utf8");
  const dataSource = readFileSync(HOME_V2_DATA, "utf8");
  const homeHtml = readFileSync(HOME_V2_HTML, "utf8");
  const homeApp = readFileSync(HOME_V2_APP, "utf8");

  it("mounts the React Home KNOW surface under the canonical app navigation toolbar", () => {
    expect(pageSource).toContain("<AppShell");
    expect(pageSource).toContain('surface="home"');
    expect(pageSource).toContain("<HomeSurface");
    expect(pageSource).toContain("searchParams");
    expect(pageSource).toContain("getActiveClientRow(requestedClient)");
    expect(pageSource).not.toContain('src="/api/home/v2-frame"');
    expect(pageSource).not.toContain('title="AbarVa Home Context Explorer"');
    expect(pageSource).not.toContain("ImpactInsightsHome");
  });

  it("serves Home v2 frame assets through stable public URLs", () => {
    expect(frameRoute).toContain("rewriteHomeV2AssetUrls");
    expect(frameRoute).toContain("/home-v2/$1");
    expect(existsSync("public/brand/abarva-logo-inverse.svg")).toBe(true);
  });

  it("binds the authenticated Home frame to the active client only", () => {
    expect(frameRoute).toContain("getActiveClientRow()");
    expect(dataRoute).toContain("getActiveClientRow()");
    expect(frameRoute).not.toContain("searchParams");
    expect(dataRoute).not.toContain("searchParams");
    expect(frameRoute).not.toContain("requestedClient");
    expect(dataRoute).not.toContain("requestedClient");
    expect(frameRoute).not.toContain("catch(() => null)");
    expect(dataRoute).not.toContain("catch(() => null)");
    expect(frameRoute).toContain("buildHomeV2DataScript");
    expect(dataRoute).toContain("buildHomeV2DataScript");
  });

  it("maps every configured client to an explicit Home v2 data pack", () => {
    expect(HOME_V2_CLIENT_PACKS.map((pack) => pack.key).sort()).toEqual(
      ALL_CLIENTS.map((client) => client.id).sort(),
    );

    for (const client of ALL_CLIENTS) {
      const pack = resolveHomeV2ClientPack(client.id, client.name);
      expect(pack.key).toBe(client.id);
      expect(existsSync(`datasets/${pack.datasetDir}`)).toBe(true);
    }

    expect(() =>
      resolveHomeV2ClientPack("unknown-client", "Unknown Client"),
    ).toThrow("home_v2_client_pack_not_configured");
  });

  it("keeps the 19-dimension Context Explorer schema stable for all clients", () => {
    expect(homeV2SectionIds()).toEqual([
      "profile",
      "business",
      "workforce",
      "customers",
      "capabilities",
      "applications",
      "infrastructure",
      "data",
      "integrations",
      "security",
      "vendors",
      "budget",
      "ai",
      "initiatives",
      "change",
      "risk",
      "operations",
      "policies",
      "benchmarks",
    ]);
    expect(dataSource).toContain("SECTION_SCHEMAS");
    expect(dataSource).toContain("datasets/${client.datasetDir}");
  });

  it("builds tenant-specific Home v2 data scripts for every configured client", async () => {
    for (const client of ALL_CLIENTS) {
      const pack = resolveHomeV2ClientPack(client.id, client.name);
      const result = await buildHomeV2DataScript({
        clientKey: client.id,
        tenantName: client.name,
      });
      expect(result.tenantName).toBe(pack.tenantName);
      expect(result.root).toBe(`datasets/${pack.datasetDir}`);
      expect(result.footer).toContain(pack.tenantName);
      expect(result.script).toContain(`"source":"datasets/${pack.datasetDir}"`);
      expect(result.script).toContain('"dimensions":19');
      expect(result.script).toContain("const SECTIONS =");
      expect(result.script).toContain("function routeToDim(q)");
    }
  });

  it("answers Meridian Epic spend questions with row-level budget evidence", async () => {
    const result = await buildHomeV2DataScript({
      clientKey: "meridian",
      tenantName: "Meridian Health System",
    });

    expect(result.script).toContain('"askFacts"');
    expect(result.script).toContain("Epic and Clinical Systems");
    expect(result.script).toContain("run budget $116.6M");
    expect(result.script).toContain("change budget $58.3M");
    expect(result.script).toContain("AI/data budget $20.7M");
    expect(result.script).toContain("vendor share 43%");
    expect(result.script).toContain("Epic: annual contract value $1.2M");
    expect(result.script).toContain("renewal 2026-07-05");
    expect(result.script).toContain(
      "commercial risk: renewal before evidence gate",
    );
    expect(result.script).toContain(
      "family-4-financial-commercial/F12_it-budget-financials.csv",
    );
    expect(result.script).toContain(
      "family-4-financial-commercial/F11_vendors-contracts-licenses.csv",
    );
  });

  it("removes First Capital static copy from the reusable Home v2 frame", () => {
    expect(homeHtml).toContain("<!-- ABARVA_HOME_V2_DATA -->");
    expect(homeHtml).toContain("/home-v2/app.js");
    expect(homeHtml).not.toContain("First Capital Financial");
    expect(homeApp).not.toContain("First Capital Financial");
    expect(homeApp).toContain("window.ABARVA_HOME_V2_BINDING");
    expect(homeApp).toContain("META.source");
    expect(homeApp).toContain("answerForAsk");
    expect(homeApp).toContain("bestAskFacts");
    expect(homeApp).toContain("labelHits * 3");
    expect(homeApp).toContain("costIntent");
  });
});

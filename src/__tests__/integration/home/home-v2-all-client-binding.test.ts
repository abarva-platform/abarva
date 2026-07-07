import { existsSync, readFileSync } from "node:fs";

const HOME_PAGE = "src/app/(maestro)/home/page.tsx";
const HOME_FRAME_ROUTE = "src/app/api/home/v2-frame/route.ts";
const HOME_DATA_ROUTE = "src/app/api/home/v2-data/route.ts";
const HOME_V2_DATA = "src/lib/home-v2/data.ts";
const HOME_V2_PUBLIC_DIR = "public/home-v2";
const FEATURE_REGISTRY = "src/lib/features/registry.ts";
const HOME_SURFACE = "src/components/home/HomeSurface.tsx";
const RETIRED_ENTERPRISE_HOME = "src/components/home/EnterpriseLandscapeHome.tsx";
const RETIRED_ENTERPRISE_HOME_CSS = "src/components/home/EnterpriseLandscapeHome.module.css";
const HOME_ASK = "src/components/home/know/HomeKnowAsk.tsx";
const HOME_ENGINE = "src/lib/home/know/home-know-engine.ts";

describe("Home KNOW runtime has no legacy Home v2 fallback", () => {
  const pageSource = readFileSync(HOME_PAGE, "utf8");
  const registrySource = readFileSync(FEATURE_REGISTRY, "utf8");
  const surfaceSource = readFileSync(HOME_SURFACE, "utf8");
  const askSource = readFileSync(HOME_ASK, "utf8");
  const engineSource = readFileSync(HOME_ENGINE, "utf8");

  it("mounts the React Home KNOW surface directly under the canonical app shell", () => {
    expect(pageSource).toContain("<AppShell");
    expect(pageSource).toContain('surface="home"');
    expect(pageSource).toContain("<HomeSurface");
    expect(pageSource).toContain("getActiveClientRow(requestedClient)");
    expect(pageSource).not.toContain("v2-frame");
    expect(pageSource).not.toContain("iframe");
    expect(pageSource).not.toContain("ImpactInsightsHome");
  });

  it("removes the old static Home frame, data endpoint, public assets, and mapper", () => {
    expect(existsSync(HOME_FRAME_ROUTE)).toBe(false);
    expect(existsSync(HOME_DATA_ROUTE)).toBe(false);
    expect(existsSync(HOME_V2_DATA)).toBe(false);
    expect(existsSync(HOME_V2_PUBLIC_DIR)).toBe(false);
    expect(existsSync(RETIRED_ENTERPRISE_HOME)).toBe(false);
    expect(existsSync(RETIRED_ENTERPRISE_HOME_CSS)).toBe(false);
  });

  it("removes the rollout flag that could switch Home back to the old surface", () => {
    expect(registrySource).not.toContain("home_react_surface");
    expect(registrySource).not.toContain("ABARVA_FEATURE_HOME_REACT_SURFACE_TENANTS");
    expect(pageSource).not.toContain("isFeatureEnabled");
  });

  it("keeps Home ask on the Home KNOW endpoint and not the old browser answer code", () => {
    expect(surfaceSource).toContain("/api/home/know/ask");
    expect(surfaceSource).toContain('data-testid="home-context-explorer"');
    expect(surfaceSource).toContain('data-testid="home-context-detail"');
    expect(surfaceSource).toContain('data-testid="home-context-rail"');
    expect(askSource).toContain("/api/home/know/ask");
    expect(askSource).toContain("AvaAskMark");
    expect(pageSource).not.toContain("EnterpriseLandscapeHome");
    expect(pageSource).not.toContain("getEnterpriseLandscapeViewModel");
    expect(`${pageSource}\n${surfaceSource}\n${askSource}`).not.toContain("answerForAsk");
    expect(`${pageSource}\n${surfaceSource}\n${askSource}`).not.toContain("bestAskFacts");
  });

  it("blocks mechanical answer templates from Home KNOW prose", () => {
    expect(engineSource).toContain("validateHomeKnowResponse");
    expect(engineSource).toContain("templatePrefix");
    expect(engineSource).not.toContain("Read: I can't give that exact value");
    expect(engineSource).not.toContain("Evidence: the related context");
  });
});

import {
  isMeridianTowerRuntimeTenant,
  isTowerV3ContextRuntimeEnabled,
} from "../tower-v3-runtime-flag";

function env(value?: string): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    ...(value ? { ENABLE_TOWER_V3_CONTEXT_RUNTIME: value } : {}),
  } as NodeJS.ProcessEnv;
}

describe("Tower v3 runtime flag", () => {
  it("is disabled by default", () => {
    expect(isTowerV3ContextRuntimeEnabled(env())).toBe(false);
    expect(isTowerV3ContextRuntimeEnabled(env("false"))).toBe(false);
  });

  it("enables only on explicit true", () => {
    expect(isTowerV3ContextRuntimeEnabled(env("true"))).toBe(true);
  });

  it("limits the selected runtime proof to Meridian / Healthcare Demo aliases", () => {
    expect(isMeridianTowerRuntimeTenant("meridian-health")).toBe(true);
    expect(isMeridianTowerRuntimeTenant("Meridian")).toBe(true);
    expect(isMeridianTowerRuntimeTenant("Healthcare Demo")).toBe(true);
    expect(isMeridianTowerRuntimeTenant("skyharbor-air")).toBe(false);
    expect(isMeridianTowerRuntimeTenant("lakeshore-holdings")).toBe(false);
  });
});

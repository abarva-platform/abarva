import firstCapitalConfig from "./first-capital.mjs";
import meridianHealthConfig from "./meridian-health.mjs";
import skyharborAirConfig from "./skyharbor-air.mjs";

export const tenantV6Configs = {
  "first-capital": firstCapitalConfig,
  financial: firstCapitalConfig,
  "meridian-health": meridianHealthConfig,
  skyharbor: skyharborAirConfig,
  "skyharbor-air": skyharborAirConfig,
};

export const tenantV6CanonicalConfigs = [
  meridianHealthConfig,
  skyharborAirConfig,
  firstCapitalConfig,
];

export function getTenantV6Config(tenantKey) {
  return tenantV6Configs[tenantKey] ?? null;
}

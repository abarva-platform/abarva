import firstCapitalConfig from "./first-capital.mjs";
import meridianHealthConfig from "./meridian-health.mjs";
import skyharborAirConfig from "./skyharbor-air.mjs";

export const tenantV3Configs = {
  "first-capital": firstCapitalConfig,
  financial: firstCapitalConfig,
  "meridian-health": meridianHealthConfig,
  skyharbor: skyharborAirConfig,
  "skyharbor-air": skyharborAirConfig,
};

export const tenantV3CanonicalConfigs = [
  meridianHealthConfig,
  skyharborAirConfig,
  firstCapitalConfig,
];

export function getTenantV3Config(tenantKey) {
  return tenantV3Configs[tenantKey] ?? null;
}

export const tenantV6Configs = tenantV3Configs;
export const tenantV6CanonicalConfigs = tenantV3CanonicalConfigs;
export const getTenantV6Config = getTenantV3Config;

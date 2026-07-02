const ENABLED_VALUES = new Set(["1", "true", "yes", "on", "enabled", "blocking"]);
const DISABLED_VALUES = new Set(["1", "true", "yes", "on", "disabled", "off"]);

function normalizedEnv(name: string): string {
  return process.env[name]?.trim().toLowerCase() ?? "";
}

export function isBlockingIntelligenceRepairEnabled(): boolean {
  const explicitDisable = normalizedEnv("INTELLIGENCE_DISABLE_BLOCKING_REPAIR");
  if (DISABLED_VALUES.has(explicitDisable)) return false;

  const mode = normalizedEnv("INTELLIGENCE_LIVE_REPAIR_MODE");
  return ENABLED_VALUES.has(mode);
}


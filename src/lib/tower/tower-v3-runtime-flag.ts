export function isTowerV3ContextRuntimeEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ENABLE_TOWER_V3_CONTEXT_RUNTIME === "true";
}

export function isMeridianTowerRuntimeTenant(value: string | null | undefined): boolean {
  const normalized = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  return (
    normalized === "meridian-health" ||
    normalized === "meridian" ||
    normalized === "healthcare-demo"
  );
}

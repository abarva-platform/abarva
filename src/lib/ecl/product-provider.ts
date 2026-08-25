export type EclProductProviderMode = "ecl_projection_db" | "legacy";

const ECL_PROVIDER_VALUES = new Set([
  "ecl",
  "ecl_projection",
  "ecl_projection_db",
  "serving",
]);

const LEGACY_PROVIDER_VALUES = new Set([
  "legacy",
  "pre_ecl",
  "pre-ecl",
]);

function normalized(value: string | null | undefined): string | null {
  const text = value?.trim().toLowerCase();
  return text ? text : null;
}

function configuredDefaultProvider(): EclProductProviderMode {
  return LEGACY_PROVIDER_VALUES.has(
    normalized(process.env.ECL_PRODUCT_DEFAULT_PROVIDER) ?? "",
  )
    ? "legacy"
    : "ecl_projection_db";
}

export function resolveEclProductProvider(
  requestedProvider?: string | null,
): EclProductProviderMode {
  const requested = normalized(requestedProvider);
  if (requested && ECL_PROVIDER_VALUES.has(requested)) return "ecl_projection_db";

  const allowLegacyQuery =
    process.env.ECL_PRODUCT_ALLOW_LEGACY_QUERY_OVERRIDE === "true";
  if (requested && LEGACY_PROVIDER_VALUES.has(requested) && allowLegacyQuery) {
    return "legacy";
  }

  return configuredDefaultProvider();
}

export function isEclProductProvider(
  provider: EclProductProviderMode,
): boolean {
  return provider === "ecl_projection_db";
}

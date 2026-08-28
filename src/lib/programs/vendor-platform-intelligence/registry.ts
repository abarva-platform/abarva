import { MEDEANALYTICS_PROFILE_V1 } from "./profiles/medeanalytics";
import type { VendorPlatformProfile } from "./types";

export const MANAGED_ANALYTICS_PLATFORM_ARCHETYPE =
  "MANAGED_ANALYTICS_PLATFORM" as const;

export const VENDOR_PLATFORM_PROFILE_REGISTRY: Record<
  string,
  VendorPlatformProfile
> = {
  [MEDEANALYTICS_PROFILE_V1.vendorId]: MEDEANALYTICS_PROFILE_V1,
};

export function getVendorPlatformProfile(
  vendorId: string,
): VendorPlatformProfile | undefined {
  return VENDOR_PLATFORM_PROFILE_REGISTRY[vendorId.toLowerCase()];
}

export function listVendorPlatformProfiles(): VendorPlatformProfile[] {
  return Object.values(VENDOR_PLATFORM_PROFILE_REGISTRY);
}

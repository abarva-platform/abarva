// Tenant display-name registry for the /admin/pilot/[tenantKey] page.
// Single source of truth so the dashboard header matches the canonical
// brand the user sees on /home. Keyed by the same tenant_key strings
// the tenant-bootstrap script accepts.

export const CANONICAL_TENANTS_DISPLAY_NAMES: Record<string, string> = {
  apexretail: "Apex Retail Group",
  meridian: "Meridian Health System",
  arcturus: "FS Demo",
};

import fs from "node:fs";
import path from "node:path";

import { parseCsv } from "@/lib/enterprise-data/source-adapters/csv-source-adapter";
import { ENTERPRISE_PROFILE_FOUNDATION_SOURCE } from "./enterprise-profile-foundation";

export interface EnterpriseProfileReadModel {
  tenantKey: string;
  clientDisplayName: string;
  legalName: string;
  industry: string;
  subIndustry: string | null;
  headquarters: string | null;
  revenueUsd: number | null;
  revenueBasis: string | null;
  employeeCount: number | null;
  employeeCountBasis: string | null;
  globalLocations: string[];
  businessModel: string | null;
  businessSegments: string[];
  missionStatement: string | null;
  visionStatement: string | null;
  leadershipRoles: string[];
  strategicPriorities: string[];
  sourceFile: string | null;
  sourceAsOfDate: string | null;
  sourceValidationStatus: string | null;
  knownGaps: string[];
}

const APP_TO_ENTERPRISE_TENANT: Record<string, string> = {
  apexretail: "apex-retail",
  "apex-retail": "apex-retail",
  firstcapital: "first-capital",
  arcturus: "first-capital",
  "first-capital": "first-capital",
  "first-capital-financial": "first-capital",
  lakeshore: "lakeshore-holdings",
  "lakeshore-holdings": "lakeshore-holdings",
  "lakeshore-industries": "lakeshore-holdings",
  meridian: "meridian-health",
  "meridian-health": "meridian-health",
  skyharbor: "skyharbor-air",
  "skyharbor-air": "skyharbor-air",
};

let cachedProfiles:
  | {
      repoRoot: string;
      profiles: Map<string, EnterpriseProfileReadModel>;
    }
  | null = null;

export function getEnterpriseProfileReadModel(
  tenantKey: string | null | undefined,
  options: { repoRoot?: string } = {},
): EnterpriseProfileReadModel | null {
  const normalized = normalizeEnterpriseProfileTenantKey(tenantKey);
  if (!normalized) return null;
  return loadEnterpriseProfiles(options.repoRoot ?? process.cwd()).get(normalized) ?? null;
}

export function normalizeEnterpriseProfileTenantKey(
  tenantKey: string | null | undefined,
): string | null {
  const normalized = tenantKey?.trim().toLowerCase();
  if (!normalized) return null;
  return APP_TO_ENTERPRISE_TENANT[normalized] ?? normalized;
}

export function formatEnterpriseRevenue(value: number | null): string | null {
  if (value === null || !Number.isFinite(value) || value <= 0) return null;
  if (Math.abs(value) >= 1_000_000_000) {
    return `$${trimCompact(value / 1_000_000_000)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `$${trimCompact(value / 1_000_000)}M`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatEnterpriseEmployeeCount(value: number | null): string | null {
  if (value === null || !Number.isFinite(value) || value <= 0) return null;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function loadEnterpriseProfiles(repoRoot: string): Map<string, EnterpriseProfileReadModel> {
  if (cachedProfiles?.repoRoot === repoRoot) return cachedProfiles.profiles;
  const sourcePath = path.resolve(repoRoot, ENTERPRISE_PROFILE_FOUNDATION_SOURCE);
  const profiles = new Map<string, EnterpriseProfileReadModel>();
  if (!fs.existsSync(sourcePath)) {
    cachedProfiles = { repoRoot, profiles };
    return profiles;
  }

  const parsed = parseCsv(fs.readFileSync(sourcePath, "utf8"));
  for (const row of parsed.rows) {
    const tenantKey = normalizeEnterpriseProfileTenantKey(row.tenant_key);
    if (!tenantKey) continue;
    profiles.set(tenantKey, {
      tenantKey,
      clientDisplayName: requiredText(row.client_display_name) ?? tenantKey,
      legalName: requiredText(row.legal_name) ?? requiredText(row.client_display_name) ?? tenantKey,
      industry: requiredText(row.industry) ?? "Not available",
      subIndustry: requiredText(row.sub_industry),
      headquarters: requiredText(row.headquarters),
      revenueUsd: parseNumber(row.revenue_usd),
      revenueBasis: requiredText(row.revenue_basis),
      employeeCount: parseNumber(row.employee_count),
      employeeCountBasis: requiredText(row.employee_count_basis),
      globalLocations: splitList(row.global_locations),
      businessModel: requiredText(row.business_model),
      businessSegments: splitList(row.business_segments),
      missionStatement: requiredText(row.mission_statement),
      visionStatement: requiredText(row.vision_statement),
      leadershipRoles: splitList(row.leadership_roles),
      strategicPriorities: splitList(row.strategic_priorities),
      sourceFile: requiredText(row.source_file),
      sourceAsOfDate: requiredText(row.source_as_of_date),
      sourceValidationStatus: requiredText(row.source_validation_status),
      knownGaps: splitList(row.known_gaps),
    });
  }

  cachedProfiles = { repoRoot, profiles };
  return profiles;
}

function requiredText(value: unknown): string | null {
  const text = String(value ?? "").trim();
  if (!text || /^(needs evidence|unknown|not_loaded|tbd|n\/a|sample)$/i.test(text)) {
    return null;
  }
  return text;
}

function splitList(value: unknown): string[] {
  const text = requiredText(value);
  if (!text) return [];
  return text
    .split(/\s*\|\s*/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseNumber(value: unknown): number | null {
  const normalized = String(value ?? "").trim().replace(/[$,\s]/g, "");
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function trimCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Math.abs(value) >= 10 ? 1 : 2,
  }).format(value);
}

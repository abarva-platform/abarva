import { azureRead } from "@/lib/data-plane/azureRead";

import { CONSERVATIVE_TENANT_AI_POLICY } from "./policy";
import type { TenantAiPolicy } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface TenantClientPolicyRow {
  id: string;
  ai_policy: unknown;
}

export function isTenantUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

export function tenantLookupCandidates(tenantIdOrKey: string): string[] {
  const key = normalized(tenantIdOrKey);
  if (!key) return [];
  const candidates = new Set<string>([key, key.replace(/-/g, "")]);

  switch (key) {
    case "apexretail":
    case "apex-retail":
      candidates.add("apexretail");
      candidates.add("apex-retail");
      candidates.add("apex retail");
      break;
    case "meridian":
    case "meridian-health":
      candidates.add("meridian");
      candidates.add("meridian-health");
      candidates.add("meridian health");
      break;
    case "arcturus":
    case "firstcapital":
    case "first-capital":
    case "first-capital-bank":
      candidates.add("arcturus");
      candidates.add("firstcapital");
      candidates.add("first-capital");
      candidates.add("first capital");
      candidates.add("first capital bank");
      break;
    case "skyharbor":
    case "skyharbor-air":
      candidates.add("skyharbor");
      candidates.add("skyharbor-air");
      candidates.add("skyharbor air");
      break;
    case "lakeshore":
    case "lakeshore-holdings":
      candidates.add("lakeshore");
      candidates.add("lakeshore-holdings");
      candidates.add("lakeshore holdings");
      break;
    default:
      break;
  }

  return Array.from(candidates);
}

export function isTenantAiPolicy(value: unknown): value is TenantAiPolicy {
  if (!value || typeof value !== "object") return false;
  const policy = value as Partial<TenantAiPolicy>;
  return (
    typeof policy.allowExternalAI === "boolean" &&
    typeof policy.allowClaude === "boolean" &&
    typeof policy.allowGamma === "boolean" &&
    typeof policy.maxDataClass === "string" &&
    typeof policy.requireRedaction === "boolean" &&
    typeof policy.requireHumanApprovalForExports === "boolean" &&
    typeof policy.promptResponseRetentionDays === "number"
  );
}

export async function resolveTenantClientPolicyRow(
  tenantIdOrKey: string,
): Promise<TenantClientPolicyRow | null> {
  const trimmed = tenantIdOrKey.trim();
  if (!trimmed) return null;

  if (isTenantUuid(trimmed)) {
    return await azureRead.maybeSingle<TenantClientPolicyRow>({
      table: "clients",
      columns: ["id", "ai_policy"],
      where: { id: trimmed },
    });
  }

  const candidates = tenantLookupCandidates(trimmed);
  const rows = await azureRead.query<TenantClientPolicyRow>(
    `
      select id, ai_policy
        from clients c
       where lower(coalesce(c.tenant_key, '')) = any($1::text[])
          or lower(coalesce(c.slug, '')) = any($1::text[])
          or lower(coalesce(to_jsonb(c)->>'key', '')) = any($1::text[])
          or lower(coalesce(to_jsonb(c)->>'client_key', '')) = any($1::text[])
          or lower(coalesce(c.name, '')) = any($1::text[])
       order by
         case
           when lower(coalesce(c.tenant_key, '')) = $2 then 0
           when lower(coalesce(c.slug, '')) = $2 then 1
           when lower(coalesce(to_jsonb(c)->>'key', '')) = $2 then 2
           when lower(coalesce(to_jsonb(c)->>'client_key', '')) = $2 then 3
           when lower(coalesce(c.name, '')) = $2 then 4
           else 5
         end,
         c.name
       limit 1
    `,
    [candidates, normalized(trimmed)],
  );
  return rows[0] ?? null;
}

export async function resolveTenantClientUuid(
  tenantIdOrKey: string,
): Promise<string> {
  if (isTenantUuid(tenantIdOrKey)) return tenantIdOrKey;
  const row = await resolveTenantClientPolicyRow(tenantIdOrKey);
  return row?.id ?? tenantIdOrKey;
}

export function policyFromResolvedRow(
  row: TenantClientPolicyRow | null,
): TenantAiPolicy {
  return isTenantAiPolicy(row?.ai_policy)
    ? row.ai_policy
    : CONSERVATIVE_TENANT_AI_POLICY;
}

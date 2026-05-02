import { NextRequest, NextResponse } from "next/server";
import {
  applySetupAiInitiativeFinancialFirewall,
  filterSetupAiInitiatives,
  getSetupAiInitiatives,
  isSetupAiInitiativeArchetype,
  isSetupAiInitiativeStatus,
  listPersistedSetupAiInitiatives,
  normalizeSetupAiInitiativeTenantKey,
  parseSetupAiInitiativeList,
  summarizeSetupAiInitiatives,
} from "@/lib/setup";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function truthy(value: string | null): boolean {
  return value === "true" || value === "1" || value === "yes";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tenantKey = normalizeSetupAiInitiativeTenantKey(
    url.searchParams.get("tenantKey") ?? url.searchParams.get("clientId"),
  );
  if (!tenantKey)
    return NextResponse.json(
      { error: "Missing tenantKey or clientId" },
      { status: 400 },
    );
  const filters = {
    status: parseSetupAiInitiativeList(
      url.searchParams.get("status"),
      isSetupAiInitiativeStatus,
    ),
    archetype: parseSetupAiInitiativeList(
      url.searchParams.get("archetype"),
      isSetupAiInitiativeArchetype,
    ),
    updatedSince: url.searchParams.get("updated_since"),
    includeProgramLinks: truthy(url.searchParams.get("include_program_links")),
    financialVisibility: truthy(url.searchParams.get("financialVisibility")),
  };
  const persisted = await listPersistedSetupAiInitiatives({
    tenantKey,
    financialVisibility: filters.financialVisibility,
  }).catch(() => ({
    status: "skipped_no_database_url" as const,
    tenantKey,
    privateSchema: null,
    initiatives: [],
  }));
  const fromPrivate =
    persisted.status === "private_db" && persisted.initiatives.length > 0;
  const baseRecords = fromPrivate
    ? persisted.initiatives
    : getSetupAiInitiatives(tenantKey).map((record) =>
        applySetupAiInitiativeFinancialFirewall(
          record,
          filters.financialVisibility,
        ),
      );
  const initiatives = filterSetupAiInitiatives(baseRecords, filters);
  return NextResponse.json({
    tenantKey,
    source: fromPrivate ? "private_db" : "fixture_fallback",
    privateSchema: persisted.privateSchema,
    filters: {
      status: filters.status ?? [],
      archetype: filters.archetype ?? [],
      updatedSince: filters.updatedSince,
      includeProgramLinks: filters.includeProgramLinks,
      financialVisibility: filters.financialVisibility,
    },
    summary: summarizeSetupAiInitiatives(tenantKey, initiatives),
    initiatives,
  });
}

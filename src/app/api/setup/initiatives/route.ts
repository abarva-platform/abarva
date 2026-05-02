import { NextRequest, NextResponse } from "next/server";
import {
  applySetupAiInitiativeFinancialFirewall,
  filterSetupAiInitiatives,
  getSetupAiInitiatives,
  isSetupAiInitiativeArchetype,
  isSetupAiInitiativeStatus,
  listPersistedSetupAiInitiatives,
  looksLikeSetupAiInitiativesUpload,
  normalizeSetupAiInitiativeTenantKey,
  parseSetupAiInitiativesCsv,
  parseSetupAiInitiativeList,
  persistSetupAiInitiatives,
  summarizeSetupAiInitiatives,
  type SetupAiInitiativeRecord,
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

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const financialVisibility = truthy(
    url.searchParams.get("financialVisibility"),
  );
  const contentType = request.headers.get("content-type") ?? "";
  let tenantKey = normalizeSetupAiInitiativeTenantKey(
    url.searchParams.get("tenantKey"),
  );
  let documentName = "Setup AI Initiatives intake";
  let fileName = "setup-ai-initiatives.json";
  let initiatives: readonly SetupAiInitiativeRecord[] = [];
  let rejectedRows: unknown[] = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    tenantKey = normalizeSetupAiInitiativeTenantKey(
      (formData.get("tenantKey") as string | null) ??
        (formData.get("clientId") as string | null) ??
        tenantKey,
    );
    documentName =
      (formData.get("documentName") as string | null) ?? documentName;
    const file = formData.get("file") as File | null;
    if (!file)
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    fileName = file.name;
    if (!looksLikeSetupAiInitiativesUpload(file.name, documentName)) {
      return NextResponse.json(
        { error: "File does not look like a Setup AI Initiatives upload" },
        { status: 400 },
      );
    }
    let parsed;
    try {
      parsed = parseSetupAiInitiativesCsv(
        new TextDecoder().decode(await file.arrayBuffer()),
        tenantKey,
        { financialVisibility },
      );
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid Setup AI Initiatives upload",
        },
        { status: 400 },
      );
    }
    initiatives = parsed.accepted;
    rejectedRows = [...parsed.rejected];
  } else {
    const body = (await request.json().catch(() => null)) as {
      tenantKey?: string;
      clientId?: string;
      documentName?: string;
      fileName?: string;
      initiatives?: SetupAiInitiativeRecord[];
    } | null;
    if (!body)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    tenantKey = normalizeSetupAiInitiativeTenantKey(
      body.tenantKey ?? body.clientId ?? tenantKey,
    );
    documentName = body.documentName ?? documentName;
    fileName = body.fileName ?? fileName;
    initiatives = (body.initiatives ?? []).map((initiative) => ({
      ...initiative,
      tenantKey,
      clientId: tenantKey,
      source: "manual_entry",
    }));
  }

  if (!tenantKey)
    return NextResponse.json(
      { error: "Missing tenantKey or clientId" },
      { status: 400 },
    );
  if (initiatives.length === 0 && rejectedRows.length === 0)
    return NextResponse.json(
      { error: "No Setup AI Initiatives rows supplied" },
      { status: 400 },
    );

  const persistence = await persistSetupAiInitiatives({
    tenantKey,
    clientId: tenantKey,
    documentName,
    fileName,
    initiatives,
    uploadedBy: "setup-ai-initiatives-api",
    sourcePayload: { ingestionSource: "setup_ai_initiatives_api" },
  });

  return NextResponse.json({
    tenantKey,
    acceptedCount: initiatives.length,
    rejectedCount: rejectedRows.length,
    rejectedRows,
    acceptedInitiativeIds: initiatives.map(
      (initiative) => initiative.initiativeId,
    ),
    persistence,
  });
}

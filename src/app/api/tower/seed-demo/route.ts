import { NextRequest, NextResponse } from "next/server";
import { seedDemoData, removeDemoData } from "@/scripts/demo-data/generate";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import type { TenancyCtx } from "@/lib/programs/types.db";

export const runtime = "nodejs";

// SECURITY (audit 2026-05-22, P2-7): seeding / removing Tower demo data
// is a bulk write+delete across the tenant. The route previously
// enforced tenant membership but no role. Require client-admin rights.
async function requireTowerAdmin(
  ctx: TenancyCtx,
): Promise<NextResponse | null> {
  const policy = await loadUserProgramAccessPolicy(ctx).catch(() => null);
  if (
    policy?.accessLevel === "client_admin" ||
    policy?.canAdminUsers === true
  ) {
    return null;
  }
  return NextResponse.json(
    {
      error: "forbidden",
      detail:
        "Seeding or removing Tower demo data requires client-admin rights.",
    },
    { status: 403 },
  );
}
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err) as NextResponse;
  }

  const roleDenied = await requireTowerAdmin(ctx);
  if (roleDenied) return roleDenied;

  const body = (await req.json().catch(() => ({}))) as {
    clientId?: string;
    industry?: "HEALTHCARE_IDN" | "FINSERV" | "RETAIL" | "DIVERSIFIED";
    orgSize?: "small" | "mid" | "enterprise";
    aiMaturity?: "early" | "scaling" | "mature";
  };

  if (!body.clientId || !body.industry || !body.orgSize || !body.aiMaturity) {
    return NextResponse.json(
      { error: "clientId, industry, orgSize, aiMaturity all required" },
      { status: 400 },
    );
  }

  if (body.clientId !== ctx.clientId) {
    return NextResponse.json(
      { error: "forbidden_cross_tenant" },
      { status: 403 },
    );
  }

  try {
    const summary = await seedDemoData({
      clientId: body.clientId,
      industry: body.industry,
      orgSize: body.orgSize,
      aiMaturity: body.aiMaturity,
    });
    return NextResponse.json({ summary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err) as NextResponse;
  }

  const roleDenied = await requireTowerAdmin(ctx);
  if (roleDenied) return roleDenied;

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId");
  if (!clientId)
    return NextResponse.json({ error: "clientId required" }, { status: 400 });

  if (clientId !== ctx.clientId) {
    return NextResponse.json(
      { error: "forbidden_cross_tenant" },
      { status: 403 },
    );
  }

  try {
    const result = await removeDemoData(clientId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}

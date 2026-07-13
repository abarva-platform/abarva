import { NextResponse } from "next/server";

import { resolveAdminTenant } from "@/lib/admin/admin-tenant";
import { getSetupInventorySnapshot } from "@/lib/admin/setup-data-broker";
import { buildAdminSetupControlReadModel } from "@/lib/admin/setup-control";
import { getTenantSourceFiles } from "@/lib/context-ingestion/tenant-context-read-model";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { getClientOption } from "@/lib/client-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;

export async function GET() {
  try {
    const tenant = await resolveAdminTenant();
    const brokerTenantKey = clientKeyToInventorySubstrateKey(tenant.clientKey);
    const [snapshot, sourceFiles] = await Promise.all([
      getSetupInventorySnapshot(brokerTenantKey).catch(() => null),
      getTenantSourceFiles(tenant.clientId).catch(() => []),
    ]);

    const response = buildAdminSetupControlReadModel({
      tenantKey: tenant.clientKey,
      displayName: tenant.tenantName,
      coverName: getClientOption(tenant.clientKey).name,
      snapshot,
      sourceFiles,
    });

    return NextResponse.json(response, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "admin_setup_control_unavailable",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

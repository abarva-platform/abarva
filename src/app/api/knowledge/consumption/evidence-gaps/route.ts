import type { NextRequest } from "next/server";
import { handleConsumption } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleConsumption(req, ({ reader, tenantKey, body }) =>
    reader.getEvidenceAndGaps({
      tenantKey,
      domainKey: (body.domainKey as string | null | undefined) ?? null,
    }),
  );
}

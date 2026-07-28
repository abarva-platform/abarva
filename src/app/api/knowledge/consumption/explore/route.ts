import type { NextRequest } from "next/server";
import type { KnowledgeLens } from "@/lib/knowledge/consumption-contracts";
import { handleConsumption } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleConsumption(req, ({ reader, tenantKey, body }) =>
    reader.exploreEntities({
      tenantKey,
      domainKey: (body.domainKey as string | null | undefined) ?? null,
      search: typeof body.search === "string" ? body.search : undefined,
      lens: body.lens as KnowledgeLens | undefined,
      page: typeof body.page === "number" ? body.page : 1,
      pageSize: typeof body.pageSize === "number" ? body.pageSize : 25,
    }),
  );
}

import type { NextRequest } from "next/server";
import type { KnowledgeLens, ReceivingModule } from "@/lib/knowledge/consumption-contracts";
import { handleConsumption } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleConsumption(req, ({ reader, tenantKey, body }) =>
    reader.previewModuleHandoff({
      tenantKey,
      knowledgeBaselineRef: String(body.knowledgeBaselineRef ?? ""),
      receivingModule: (body.receivingModule as ReceivingModule | undefined) ?? "moves",
      selectedEntityRefs: Array.isArray(body.selectedEntityRefs) ? (body.selectedEntityRefs as string[]) : [],
      filters: (body.filters as Record<string, string[]> | undefined) ?? {},
      lens: body.lens as KnowledgeLens | undefined,
      insightRef: (body.insightRef as string | null | undefined) ?? null,
    }),
  );
}

import type { NextRequest } from "next/server";
import type { KnowledgeMode } from "@/lib/knowledge/consumption-contracts";
import { handleConsumption } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleConsumption(req, ({ reader, tenantKey, body }) =>
    reader.getSuggestedQuestions({
      tenantKey,
      mode: (body.mode as KnowledgeMode | undefined) ?? "brief",
      focalEntityRefs: Array.isArray(body.focalEntityRefs) ? (body.focalEntityRefs as string[]) : undefined,
    }),
  );
}

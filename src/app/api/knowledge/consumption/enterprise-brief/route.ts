import type { NextRequest } from "next/server";
import type { DepthLevel, KnowledgeLens } from "@/lib/knowledge/consumption-contracts";
import { handleConsumption } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleConsumption(req, ({ reader, tenantKey, body }) =>
    reader.getEnterpriseBrief({
      tenantKey,
      depth: body.depth as DepthLevel | undefined,
      lens: body.lens as KnowledgeLens | undefined,
      currentTargetScope: (body.currentTargetScope as "current" | "target" | "both" | undefined) ?? "current",
    }),
  );
}

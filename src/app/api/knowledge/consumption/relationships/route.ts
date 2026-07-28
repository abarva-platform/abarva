import type { NextRequest } from "next/server";
import type { RelationshipDirection } from "@/lib/knowledge/consumption-contracts";
import { handleConsumption } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleConsumption(req, ({ reader, tenantKey, body }) =>
    reader.getRelationships({
      tenantKey,
      knowledgeBaselineRef: String(body.knowledgeBaselineRef ?? ""),
      focalEntityRefs: Array.isArray(body.focalEntityRefs) ? (body.focalEntityRefs as string[]) : [],
      direction: (body.direction as RelationshipDirection | undefined) ?? "both",
      hopDepth: body.hopDepth === 2 ? 2 : 1,
      currentTargetScope: (body.currentTargetScope as "current" | "target" | "both" | undefined) ?? "current",
      authorityMinimum: (body.authorityMinimum as "accepted" | "published" | undefined) ?? "accepted",
      maxNodes: typeof body.maxNodes === "number" ? body.maxNodes : 40,
      maxEdges: typeof body.maxEdges === "number" ? body.maxEdges : 60,
      includeCandidates: body.includeCandidates === true,
    }),
  );
}

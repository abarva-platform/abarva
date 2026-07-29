/**
 * aVa reasoning endpoint — the SEPARATE reasoning path. It authenticates +
 * resolves the tenant server-side, builds the aVa packet from the request
 * context, and returns an ephemeral AvaAnswer.
 *
 * This increment uses the deterministic (non-model) reasoning provider, which
 * honors the contract: it answers only from evidence in the packet and refuses
 * rather than estimating. Production wiring to the audited Anthropic egress path
 * (src/lib/integrations/ai-egress: callModel + assertVisibleAnswerContract) is
 * the documented follow-on — it drops in behind the same AvaReasoningProvider
 * interface with no client change.
 */

import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import type {
  AvaIntent,
  AvaKnowledgePacket,
  AvaReasoningProvider,
  DepthLevel,
  KnowledgeLens,
  KnowledgeMode,
} from "@/lib/knowledge/consumption-contracts";
import { DeterministicAvaReasoningProvider } from "@/lib/knowledge/consumption-client";
import { AiEgressAvaReasoningProvider } from "@/lib/knowledge/consumption-server/ava-egress-provider";
import { bindAvaPacketToActiveConsumptionEnvelope } from "@/lib/knowledge/consumption-server/ava-packet-binding";
import { getTenantScopedConsumptionReader } from "@/lib/knowledge/consumption-server";
import { assertVisibleAnswerContract } from "@/lib/agent/visible-answer-contract";
import { isFoundationPreviewTenantKey } from "@/lib/auth/foundation-preview-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let tenantKey: string;
  try {
    const ctx = await requireTenancy();
    tenantKey = canonicalTenantKey(ctx.clientKey ?? "");
    if (!tenantKey) throw new Error("no_client");
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      return Response.json({ error: "unauthenticated" }, { status: 401 });
    }
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  let packet: AvaKnowledgePacket = {
    tenantKey,
    knowledgeBaselineRef: String(body.knowledgeBaselineRef ?? "none"),
    domainPublicationVersions: (body.domainPublicationVersions as Record<string, string>) ?? {},
    consumptionProjectionVersions: { contract: "phase3c2d-consumption-contracts-v1.0.0" },
    cubeSemanticModelVersion: null,
    mode: (body.mode as KnowledgeMode | undefined) ?? "brief",
    lens: (body.lens as KnowledgeLens | undefined) ?? "none",
    depth: (body.depth as DepthLevel | undefined) ?? "executive",
    currentTargetScope: (body.currentTargetScope as "current" | "target" | "both" | undefined) ?? "current",
    focalEntityRefs: Array.isArray(body.focalEntityRefs) ? (body.focalEntityRefs as string[]) : [],
    activeFilters: (body.activeFilters as Record<string, string[]>) ?? {},
    // The permission boundary is the SERVER-resolved tenant; aVa cannot widen it.
    permissionBoundaryRef: `tenant:${tenantKey}`,
    executivePerspectiveRefs: [],
    acceptedFactRefs: Array.isArray(body.acceptedFactRefs) ? (body.acceptedFactRefs as string[]) : [],
    relationshipEdgeRefs: [],
    metricQueryHashes: [],
    evidenceRefs: Array.isArray(body.evidenceRefs) ? (body.evidenceRefs as string[]) : [],
    knownGapRefs: Array.isArray(body.knownGapRefs) ? (body.knownGapRefs as string[]) : [],
    blockedSourceRefs: [],
  };

  if (isFoundationPreviewTenantKey(tenantKey)) {
    try {
      const enterpriseBrief = await getTenantScopedConsumptionReader(tenantKey)
        .getEnterpriseBrief({ tenantKey });
      packet = bindAvaPacketToActiveConsumptionEnvelope(packet, enterpriseBrief);
    } catch (err) {
      return Response.json(
        {
          error: "ava_baseline_unavailable",
          detail: String((err as Error)?.message ?? err),
        },
        { status: 409 },
      );
    }
  }

  try {
    // Production path = audited ai-egress. Deterministic ONLY when the model
    // path is genuinely unavailable (no ANTHROPIC_API_KEY) or as a test stub.
    const egress = new AiEgressAvaReasoningProvider();
    const ava: AvaReasoningProvider = egress.isAvailable()
      ? egress
      : new DeterministicAvaReasoningProvider();
    const answer = await ava.ask({
      intent: (body.intent as AvaIntent | undefined) ?? "explain",
      question: String(body.question ?? ""),
      packet,
    });

    // Visible-answer contract: never return model prose that leaks non-user-facing
    // language. Applies to answered/partial sections only (refusals carry no prose).
    for (const section of answer.sections) {
      const contract = assertVisibleAnswerContract(section.body);
      if (!contract.passed) {
        return Response.json(
          {
            error: "visible_answer_contract_failed",
            detail: "aVa blocked this answer before display because it exposed non-user-facing language.",
            version: contract.version,
            violations: contract.violations,
          },
          { status: 422 },
        );
      }
    }

    return Response.json(answer, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return Response.json(
      { error: "ava_failed", detail: String((err as Error)?.message ?? err) },
      { status: 500 },
    );
  }
}

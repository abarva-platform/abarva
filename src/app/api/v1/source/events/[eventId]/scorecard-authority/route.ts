import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { getActiveClientRow } from "@/lib/active-client";
import { getSourcingEventForResolvedClient } from "@/lib/source/queries";
import { readAcceptedCandidatesForEvent } from "@/lib/source/candidate-suppliers/event-candidate-authority-repository";
import { normalizeSourceStageKey } from "@/lib/source/constants";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { buildScorecardAuthorityView } from "@/lib/source/proposal-intelligence/scorecard-authority";
import {
  approveScorecardCriterion,
  createScorecardCriterion,
  lockEvaluatorScore,
  readSourceScorecardAuthorityRecords,
  recordEvaluatorScore,
  retireDraftCriterion,
} from "@/lib/source/proposal-intelligence/scorecard-authority-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ eventId: string }> };

const nonempty = z.string().trim().min(1).max(500);
const criterionRef = z.object({
  criterionId: nonempty,
  criterionVersion: nonempty,
});
const writeAction = z.discriminatedUnion("action", [
  criterionRef.extend({
    action: z.literal("create_criterion"),
    label: nonempty,
    weight: z.number().finite().positive().max(100),
  }),
  criterionRef.extend({ action: z.literal("approve_criterion") }),
  criterionRef.extend({ action: z.literal("retire_criterion") }),
  criterionRef.extend({
    action: z.literal("record_score"),
    vendorId: nonempty,
    score: z.number().finite().min(0).max(10),
    evidenceReference: nonempty,
    overrideReason: z.string().trim().max(2000).optional(),
  }),
  criterionRef.extend({
    action: z.literal("lock_score"),
    vendorId: nonempty,
  }),
]);

export async function GET(_request: NextRequest, { params }: RouteCtx) {
  let tenancy: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const activeClient = await getActiveClientRow().catch(() => null);
  if (!activeClient) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const { eventId } = await params;
  const event = await getSourcingEventForResolvedClient(eventId, {
    activeClientKey: activeClient.key,
    activeClientName: activeClient.name ?? activeClient.key,
    tenancy,
  }).catch(() => null);
  if (!event || event.id !== eventId) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const records = await readSourceScorecardAuthorityRecords(
    eventId,
    activeClient.key,
  );
  if (records.kind === "unavailable") {
    return Response.json(
      { error: "authority_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const stage = normalizeSourceStageKey(event.currentStageKey);
  const atEvaluation = stage === "evaluation" || stage === "bafo";
  const [access, actor] = atEvaluation
    ? await Promise.all([
        loadUserSourceAccessPolicy(tenancy, {
          activeClientKey: activeClient.key,
          sourceEventId: eventId,
        }).catch(() => null),
        getCurrentUser().catch(() => null),
      ])
    : [null, null];
  const canWrite = Boolean(
    atEvaluation &&
      canonicalTenantKey(activeClient.key) === canonicalTenantKey(tenancy.clientKey) &&
      access?.canApproveSourceStages &&
      (access.sourceEventIdsAllowed === null ||
        access.sourceEventIdsAllowed?.includes(eventId)) &&
      actor?.personId?.trim() &&
      actor.name?.trim(),
  );
  const candidates = canWrite
    ? await readAcceptedCandidatesForEvent({ clientKey: activeClient.key, eventId })
    : null;

  return Response.json(
    {
      eventId,
      clientKey: activeClient.key,
      canWrite,
      supplierOptions: candidates?.registryAvailable
        ? candidates.acceptedCandidates.map((row) => ({
            id: row.supplierId,
            name: row.legalName,
          }))
        : [],
      lockableScores: canWrite
        ? records.scores
            .filter(
              (row) =>
                row.evaluatorId === actor?.personId &&
                row.lockState === "unlocked",
            )
            .map((row) => ({
              vendorId: row.vendorId,
              criterionId: row.criterionId,
              criterionVersion: row.criterionVersion,
            }))
        : [],
      authority: buildScorecardAuthorityView({
        tenantKey: activeClient.key,
        sourceEventId: eventId,
        criteria: records.criteria,
        scores: records.scores,
      }),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest, { params }: RouteCtx) {
  let tenancy: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const { eventId } = await params;
  const [activeClient, actor] = await Promise.all([
    getActiveClientRow().catch(() => null),
    getCurrentUser().catch(() => null),
  ]);
  if (
    !activeClient ||
    canonicalTenantKey(activeClient.key) !== canonicalTenantKey(tenancy.clientKey)
  ) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const event = await getSourcingEventForResolvedClient(eventId, {
    activeClientKey: activeClient.key,
    activeClientName: activeClient.name ?? activeClient.key,
    tenancy,
  }).catch(() => null);
  if (!event || event.id !== eventId) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const access = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);
  if (
    !access?.canApproveSourceStages ||
    (access.sourceEventIdsAllowed !== null &&
      !access.sourceEventIdsAllowed.includes(eventId))
  ) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  if (!actor?.personId?.trim() || !actor.name?.trim()) {
    return Response.json({ error: "named_reviewer_required" }, { status: 409 });
  }
  const stage = normalizeSourceStageKey(event.currentStageKey);
  if (stage !== "evaluation" && stage !== "bafo") {
    return Response.json({ error: "evaluation_stage_required" }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const parsed = writeAction.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_scorecard_action" }, { status: 400 });
  }

  const base = {
    clientKey: activeClient.key,
    eventId,
    criterionId: parsed.data.criterionId,
    criterionVersion: parsed.data.criterionVersion,
  };
  const identity = {
    actorId: actor.personId.trim(),
    actorName: actor.name.trim(),
  };
  let result;
  if (parsed.data.action === "create_criterion") {
    result = await createScorecardCriterion({
      ...base,
      label: parsed.data.label,
      weight: parsed.data.weight,
    });
  } else if (parsed.data.action === "approve_criterion") {
    result = await approveScorecardCriterion({ ...base, ...identity });
  } else if (parsed.data.action === "retire_criterion") {
    result = await retireDraftCriterion(base);
  } else {
    const vendorId = parsed.data.vendorId;
    const candidates = await readAcceptedCandidatesForEvent({
      clientKey: activeClient.key,
      eventId,
    });
    const candidate = candidates.registryAvailable
      ? candidates.acceptedCandidates.find(
          (row) => row.supplierId === vendorId,
        )
      : null;
    if (!candidate) {
      return Response.json(
        { error: "accepted_supplier_required" },
        { status: 409 },
      );
    }
    result =
      parsed.data.action === "record_score"
        ? await recordEvaluatorScore({
            ...base,
            ...identity,
            vendorId: candidate.supplierId,
            vendorName: candidate.legalName,
            score: parsed.data.score,
            evidenceReference: parsed.data.evidenceReference,
            overrideReason: parsed.data.overrideReason ?? null,
          })
        : await lockEvaluatorScore({
            ...base,
            ...identity,
            vendorId: candidate.supplierId,
          });
  }

  if (!result.ok) {
    return Response.json(
      { error: result.code },
      { status: result.code === "authority_unavailable" ? 503 : result.code === "write_failed" ? 500 : 409 },
    );
  }
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

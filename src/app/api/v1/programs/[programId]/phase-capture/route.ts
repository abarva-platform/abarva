// GET/POST /api/v1/programs/:programId/phase-capture
//
// Signed-in phase capture path for real Strategic Moves. This writes the
// durable capture state that artifact generation already checks through
// assertPhaseReadyForGeneration: completed program_modules rows by phase.
// It does not approve a gate and does not generate artifacts.
//
// PHASE CAPTURE EVIDENCE INTEGRITY (fixed here): this route used to call
// `ensurePhaseGateDeliverable` once every required capture section was
// filled in, auto-creating a real, gate-satisfying `deliverables_v2` row
// (e.g. `design_spec`, `requirements_traceability` — both genuinely
// registered deliverable types, see completeDeliverable.ts's
// ALLOWED_PROGRAM_DELIVERABLE_TYPES and governance.ts's alias lists) whose
// entire content was just the user's raw capture-field text, concatenated
// into markdown sections. That row was left `in_review`, one call away from
// being flipped to `signed_off` by the generic sign-off route
// (deliverables/:deliverableId/sign-off/route.ts), which — before this fix
// — accepted ANY in_review/draft row for ANY authorized approver with no
// check on how the content was produced. That is a second, independent path
// to the same class of incident already fixed in
// `phase-gate-approval/route.ts` (PR #5158): a hard gate check finding real,
// signed-off deliverable evidence that was never actually reviewed,
// generated, or authored as a deliberate artifact.
//
// Fix: this route no longer creates any `deliverables_v2` row at all.
// Capture text persists only as `program_modules` state (notes/draft
// evidence for the workspace and for `phaseCaptureText` free-text checks in
// governance.ts) — it can inform generation and free-text fallbacks, but it
// can never itself become a signable gate artifact. Real gate deliverables
// are created only by real generation (the orchestrator) or by deliberate
// human/agent authorship (`completeDeliverable`/`draftArtifact`, which
// require an explicit acceptance moment and tag real provenance). The
// generic sign-off route now also independently rejects unrecognized
// deliverable types and capture-derived provenance as defense-in-depth (see
// its own PHASE CAPTURE EVIDENCE INTEGRITY comment).

import { NextRequest } from "next/server";
import {
  requireTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/programs/_auth";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { getModuleState, getProgramById } from "@/lib/programs/queries";
import { writeProgramAuditLogBestEffort } from "@/lib/programs/audit-log";
import {
  listApprovedPhaseEvidence,
  type ApprovedPhaseEvidenceReference,
} from "@/lib/programs/approved-phase-evidence";
import {
  computeCaptureRevision,
  diffCaptureValues,
  findPlaceholderValues,
} from "@/lib/programs/phase-capture-integrity";
import {
  evaluatePhaseCapture,
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";
import {
  resolveConfirmedSolutionRoute,
  stampSolutionRouteReviewer,
} from "@/lib/programs/solution-route-assessment";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import {
  createP1CharterBasisRecord,
  isP1CharterEvidenceFamily,
  missingP1CaptureSections,
  parseP1CharterBasisInput,
  p1CharterBasisInputFromRecord,
  p1CharterEvidenceFamilyForSection,
  readP1CharterBasisRecord,
  type P1CharterBasisInput,
} from "@/lib/programs/p1-charter-evidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePhase(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 5) return null;
  return parsed;
}

function readModuleValue(
  moduleState: Record<string, unknown> | null | undefined,
): string {
  const value = moduleState?.value;
  return typeof value === "string" ? value : "";
}

async function loadCaptureSnapshot(
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
  phase: number,
): Promise<{
  modules: Awaited<ReturnType<typeof getModuleState>>;
  values: Record<string, string>;
  p1BasisBySection: Record<string, P1CharterBasisInput>;
  businessChangeAssessment: string;
  routeValidation: string;
  approvedEvidenceReferences: ApprovedPhaseEvidenceReference[];
  approvedP1EvidenceReferences: ApprovedPhaseEvidenceReference[];
  confirmedSolutionRoute: ReturnType<typeof resolveConfirmedSolutionRoute>;
}> {
  const modules = await getModuleState(ctx, programId);
  const moduleValue = (capturePhase: number, key: string) => {
    const row = modules.find(
      (entry) => entry.moduleKey === phaseCaptureModuleKey(capturePhase, key),
    );
    return readModuleValue(row?.state);
  };
  const businessChangeAssessment = moduleValue(1, "business_change_assessment");
  const routeValidation = moduleValue(2, "solution_route_validation");
  const [approvedEvidenceReferences, approvedP1EvidenceReferences] =
    await Promise.all([
      listApprovedPhaseEvidence(ctx, programId, 2),
      listApprovedPhaseEvidence(ctx, programId, 1),
    ]);
  const confirmedSolutionRoute = resolveConfirmedSolutionRoute({
    businessChangeAssessment,
    routeValidation,
    approvedEvidenceReferences: approvedEvidenceReferences.map(
      (item) => item.evidenceId,
    ),
  });
  const values: Record<string, string> = {};
  const p1BasisBySection: Record<string, P1CharterBasisInput> = {};
  for (const section of getPhaseCaptureSections(
    phase,
    confirmedSolutionRoute,
  )) {
    values[section.key] = moduleValue(phase, section.key);
    if (phase === 1 && isP1CharterEvidenceFamily(section.evidenceFamily)) {
      const row = modules.find(
        (entry) => entry.moduleKey === phaseCaptureModuleKey(1, section.key),
      );
      const record = readP1CharterBasisRecord(
        row?.state,
        section.key,
        values[section.key],
      );
      const input = p1CharterBasisInputFromRecord(record);
      const sourceStillApproved =
        input?.kind !== "approved_evidence" ||
        approvedP1EvidenceReferences.some(
          (reference) =>
            reference.evidenceId === input.evidenceId &&
            reference.familyKey === section.evidenceFamily,
        );
      if (input && sourceStillApproved) p1BasisBySection[section.key] = input;
    }
  }
  return {
    modules,
    values,
    p1BasisBySection,
    businessChangeAssessment,
    routeValidation,
    approvedEvidenceReferences,
    approvedP1EvidenceReferences,
    confirmedSolutionRoute,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId } = await params;
    const phase = parsePhase(req.nextUrl.searchParams.get("phase"));
    if (phase === null) {
      return Response.json(
        { error: "bad_request", detail: "phase must be an integer in [0,5]" },
        { status: 400 },
      );
    }

    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });

    const snapshot = await loadCaptureSnapshot(ctx, programId, phase);
    const evaluation = evaluatePhaseCapture(phase, snapshot.values, {
      businessChangeAssessment: snapshot.businessChangeAssessment,
      approvedEvidenceReferences: snapshot.approvedEvidenceReferences.map(
        (item) => item.evidenceId,
      ),
      confirmedSolutionRoute: snapshot.confirmedSolutionRoute,
    });
    return Response.json({
      ok: true,
      programId,
      phase,
      currentPhase: program.currentPhase,
      capture: evaluation,
      // The authoritative values, flat, plus the revision a client must echo
      // back on write. Surfaced so a page can render persisted state directly
      // instead of synthesizing it — the defect this route now guards against.
      values: snapshot.values,
      revision: computeCaptureRevision(
        snapshot.values,
        phase === 1 ? snapshot.p1BasisBySection : undefined,
      ),
      ...(snapshot.confirmedSolutionRoute
        ? { confirmedSolutionRoute: snapshot.confirmedSolutionRoute }
        : {}),
      ...(phase === 1
        ? { p1BasisBySection: snapshot.p1BasisBySection }
        : {}),
      approvedEvidenceReferences: snapshot.approvedEvidenceReferences,
      approvedP1EvidenceReferences: snapshot.approvedP1EvidenceReferences,
      savePath: `/api/v1/programs/${programId}/phase-capture`,
      approvalPath: `/api/v1/programs/${programId}/phase-gate-approval`,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[GET /api/v1/programs/:programId/phase-capture]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId } = await params;
    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });

    const body = (await req.json().catch(() => ({}))) as {
      phase?: number;
      items?: Record<string, unknown>;
      sections?: Record<string, unknown>;
      complete?: boolean;
      /** Revision the client loaded. A mismatch means the write is stale. */
      expectedRevision?: string;
      p1BasisBySection?: Record<string, unknown>;
    };
    const phase = parsePhase(
      body.phase === undefined
        ? String(program.currentPhase ?? 0)
        : String(body.phase),
    );
    if (phase === null) {
      return Response.json(
        { error: "bad_request", detail: "phase must be an integer in [0,5]" },
        { status: 400 },
      );
    }

    const incoming: Record<string, unknown> = {
      ...(body.sections ?? body.items ?? {}),
    };
    if (phase === 2 && "solution_route_validation" in incoming) {
      incoming.solution_route_validation = stampSolutionRouteReviewer(
        incoming.solution_route_validation,
        ctx.email ?? ctx.userId,
      );
    }
    const currentSnapshot = await loadCaptureSnapshot(
      ctx,
      programId,
      phase,
    ).catch(() => ({
      modules: [],
      values: {},
      p1BasisBySection: {} as Record<string, P1CharterBasisInput>,
      businessChangeAssessment: "",
      routeValidation: "",
      approvedEvidenceReferences: [],
      approvedP1EvidenceReferences: [],
      confirmedSolutionRoute: null,
    }));
    const currentValues = currentSnapshot.values;
    const currentRevision = computeCaptureRevision(
      currentValues,
      phase === 1 ? currentSnapshot.p1BasisBySection : undefined,
    );

    // GUARD 1 — revision fence. A client that loaded revision R may only write
    // against revision R. If the persisted state has moved on, the write is
    // stale by definition and is rejected rather than applied over newer data.
    // Optional so existing non-Move callers keep working; clients that send it
    // get the protection.
    if (
      typeof body.expectedRevision === "string" &&
      body.expectedRevision !== currentRevision
    ) {
      return Response.json(
        {
          error: "stale_revision",
          phase,
          expectedRevision: body.expectedRevision,
          currentRevision,
          revision: currentRevision,
          values: currentValues,
          ...(phase === 1
            ? { p1BasisBySection: currentSnapshot.p1BasisBySection }
            : {}),
          capture: evaluatePhaseCapture(phase, currentValues, {
            businessChangeAssessment: currentSnapshot.businessChangeAssessment,
            approvedEvidenceReferences:
              currentSnapshot.approvedEvidenceReferences.map(
                (item) => item.evidenceId,
              ),
            confirmedSolutionRoute: currentSnapshot.confirmedSolutionRoute,
          }),
          detail:
            "This page was loaded before the capture state changed. Reload the authoritative values and re-apply the edit.",
        },
        { status: 409 },
      );
    }

    // GUARD 2 — placeholder rejection. Known synthetic draft text must never be
    // persisted as an authoritative client answer, whatever sends it. This is
    // the floor that survives an old browser tab replaying the original bug.
    const placeholders = findPlaceholderValues(incoming);
    if (placeholders.length > 0) {
      return Response.json(
        {
          error: "placeholder_value_rejected",
          phase,
          rejected: placeholders.map((p) => p.key),
          detail:
            "Synthetic placeholder text cannot be saved as phase capture. Send the authoritative persisted value or a real edit.",
        },
        { status: 422 },
      );
    }

    // Only sections that actually changed are written. A no-edit save therefore
    // performs no write at all — which is the point: the destructive path was a
    // read-into-browser-then-POST-it-all-back round-trip, and removing the write
    // removes the opportunity to get it wrong.
    const changedSections = diffCaptureValues(currentValues, incoming);
    const hasEdits = changedSections.length > 0;

    const mergedValues = { ...currentValues, ...incoming };
    const updatedBusinessChangeAssessment =
      phase === 1
        ? (mergedValues.business_change_assessment ?? "")
        : currentSnapshot.businessChangeAssessment;
    const updatedRouteValidation =
      phase === 2
        ? (mergedValues.solution_route_validation ?? "")
        : currentSnapshot.routeValidation;
    const confirmedSolutionRoute = resolveConfirmedSolutionRoute({
      businessChangeAssessment: updatedBusinessChangeAssessment,
      routeValidation: updatedRouteValidation,
      approvedEvidenceReferences:
        currentSnapshot.approvedEvidenceReferences.map(
          (item) => item.evidenceId,
        ),
    });
    const evaluation = evaluatePhaseCapture(phase, mergedValues, {
      businessChangeAssessment: currentSnapshot.businessChangeAssessment,
      approvedEvidenceReferences:
        currentSnapshot.approvedEvidenceReferences.map(
          (item) => item.evidenceId,
        ),
      confirmedSolutionRoute,
    });
    // The normalised values the write loop below actually persists. This is
    // what the response must report — see the comment on the return.
    const storedValues: Record<string, string> = Object.fromEntries(
      evaluation.sections.map((section) => [section.key, section.value]),
    );
    const incomingP1Basis: Record<string, unknown> =
      body.p1BasisBySection ?? {};
    const p1BasisInputs: Record<string, P1CharterBasisInput | null> = {};
    const basisKeys = new Set<string>();
    if (phase === 1) {
      const p1SectionKeys = new Set(
        evaluation.sections
          .filter((section) => isP1CharterEvidenceFamily(section.evidenceFamily))
          .map((section) => section.key),
      );
      if (Object.keys(incomingP1Basis).some((key) => !p1SectionKeys.has(key))) {
        return Response.json(
          {
            error: "invalid_p1_basis_field",
            detail: "Basis was supplied for an unknown P1 field.",
          },
          { status: 400 },
        );
      }
      for (const section of evaluation.sections) {
        if (!isP1CharterEvidenceFamily(section.evidenceFamily)) continue;
        const key = section.key;
        const hasIncomingBasis = Object.prototype.hasOwnProperty.call(
          incomingP1Basis,
          key,
        );
        const valueChanged = changedSections.some((item) => item.key === key);
        if (hasIncomingBasis) {
          basisKeys.add(key);
          const parsed =
            incomingP1Basis[key] === null
              ? null
              : parseP1CharterBasisInput(incomingP1Basis[key]);
          if (incomingP1Basis[key] !== null && !parsed) {
            return Response.json(
              {
                error: "invalid_p1_basis",
                field: key,
                detail:
                  "Choose an approved source, a workspace-user statement, or an assumption with an owner and P2 validation plan.",
              },
              { status: 422 },
            );
          }
          p1BasisInputs[key] = parsed;
        } else if (valueChanged) {
          p1BasisInputs[key] = null;
        } else {
          p1BasisInputs[key] = currentSnapshot.p1BasisBySection[key] ?? null;
        }
      }
    }
    const nextBasisRecords: Record<string, Record<string, unknown> | null> = {};
    const priorByModuleKey = new Map(
      currentSnapshot.modules.map((module) => [module.moduleKey, module]),
    );
    if (phase === 1) {
      const now = new Date().toISOString();
      for (const section of evaluation.sections) {
        if (!isP1CharterEvidenceFamily(section.evidenceFamily)) continue;
        const key = section.key;
        const input = p1BasisInputs[key] ?? null;
        const prior = priorByModuleKey.get(phaseCaptureModuleKey(1, key));
        const priorRecord = readP1CharterBasisRecord(
          prior?.state,
          key,
          storedValues[key] ?? "",
        );
        if (!input) {
          nextBasisRecords[key] = null;
          continue;
        }
        if (input.kind === "approved_evidence") {
          const family = p1CharterEvidenceFamilyForSection(key);
          const approved = currentSnapshot.approvedP1EvidenceReferences.some(
            (reference) =>
              reference.evidenceId === input.evidenceId &&
              reference.familyKey === family?.id,
          );
          if (!approved) {
            return Response.json(
              {
                error: "invalid_p1_basis_source",
                field: key,
                detail:
                  "Select an approved P1 source linked to this field, or classify the entry as a workspace statement or assumption.",
              },
              { status: 422 },
            );
          }
        }
        const sameBasis =
          !basisKeys.has(key) &&
          priorRecord &&
          JSON.stringify(p1CharterBasisInputFromRecord(priorRecord)) ===
            JSON.stringify(input);
        nextBasisRecords[key] = sameBasis
          ? {
              ...(prior?.state?.p1_charter_basis as Record<string, unknown>),
            }
          : createP1CharterBasisRecord({
              input,
              sectionKey: key,
              value: storedValues[key] ?? "",
              userId: ctx.userId,
              email: ctx.email,
              recordedAt: now,
            });
      }
    }
    const markComplete = body.complete === true;

    if (markComplete && !evaluation.complete) {
      return Response.json(
        {
          error: "capture_incomplete",
          phase,
          missing: evaluation.missing,
          capture: evaluation,
          detail:
            "Required capture sections must be completed before phase capture can be marked complete.",
        },
        { status: 409 },
      );
    }

    const requireCharterBasis = isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_charter_basis_v1",
    );
    if (markComplete && phase === 1 && requireCharterBasis) {
      type CandidateModule = {
        moduleKey: string;
        status: string;
        state: Record<string, unknown> | null;
      };
      const candidateModules: CandidateModule[] = currentSnapshot.modules.map(
        (module) => {
          const section = evaluation.sections.find(
            (item) =>
              phaseCaptureModuleKey(1, item.key) === module.moduleKey,
          );
          if (!section) {
            return {
              moduleKey: module.moduleKey,
              status: module.status,
              state: module.state ?? null,
            };
          }
          const basisRecord = nextBasisRecords[section.key];
          const state: Record<string, unknown> = {
            ...(module.state ?? {}),
            value: storedValues[section.key] ?? "",
          };
          if (basisRecord) state.p1_charter_basis = basisRecord;
          else delete state.p1_charter_basis;
          return {
            moduleKey: module.moduleKey,
            status: "completed",
            state,
          };
        },
      );
      for (const section of evaluation.sections) {
        const moduleKey = phaseCaptureModuleKey(1, section.key);
        if (candidateModules.some((module) => module.moduleKey === moduleKey)) {
          continue;
        }
        candidateModules.push({
          moduleKey,
          status: "completed",
          state: {
            value: storedValues[section.key] ?? "",
            ...(nextBasisRecords[section.key]
              ? { p1_charter_basis: nextBasisRecords[section.key] }
              : {}),
          },
        });
      }
      const missingBasis = missingP1CaptureSections(
        evaluation.sections,
        candidateModules,
        currentSnapshot.approvedP1EvidenceReferences,
        { requireBasis: true },
      );
      if (missingBasis.length > 0) {
        return Response.json(
          {
            error: "p1_basis_incomplete",
            phase,
            missing: missingBasis,
            detail:
              "Classify every Charter entry as an approved source, a workspace-user statement, or an assumption with an owner and P2 validation plan.",
          },
          { status: 409 },
        );
      }
    }

    const sb = getAzureWriteFluentClient();
    const nowIso = new Date().toISOString();
    const moduleKeys = evaluation.sections.map((section) =>
      phaseCaptureModuleKey(phase, section.key),
    );
    const { data: existingRows, error: existingError } = await sb
      .from("program_modules")
      .select("id, module_key, status, state_jsonb")
      .eq("engagement_id", programId)
      .in("module_key", moduleKeys);
    if (existingError) throw existingError;
    const existingByKey = new Map(
      (
        (existingRows as Array<{
          id: string;
          module_key: string;
          status: string;
          state_jsonb: Record<string, unknown> | null;
        }> | null) ?? []
      ).map((row) => [row.module_key, row]),
    );

    const changedKeys = new Set(changedSections.map((c) => c.key));
    const hasBasisEdits = basisKeys.size > 0;
    for (const [order, section] of evaluation.sections.entries()) {
      const existing = existingByKey.get(phaseCaptureModuleKey(phase, section.key));
      const basisChanged = basisKeys.has(section.key);
      // Untouched sections are skipped entirely unless this call is also
      // marking the phase complete, which legitimately changes their status.
      if (!changedKeys.has(section.key) && !basisChanged && !markComplete) continue;
      const moduleKey = phaseCaptureModuleKey(phase, section.key);
      const status =
        markComplete && section.complete
          ? "completed"
          : section.complete
            ? "in_progress"
            : "not_started";
      const state: Record<string, unknown> = {
        ...(existing?.state_jsonb ?? {}),
        capture_section_key: section.key,
        label: section.label,
        description: section.description,
        value: section.value,
        completed_from_phase_capture_path: markComplete && section.complete,
        updated_at: nowIso,
      };
      if (phase === 1 && isP1CharterEvidenceFamily(section.evidenceFamily)) {
        if (nextBasisRecords[section.key]) {
          state.p1_charter_basis = nextBasisRecords[section.key];
        } else {
          delete state.p1_charter_basis;
        }
      }
      if (existing) {
        const update: Record<string, unknown> = {
          module_name: section.label,
          phase_number: phase,
          module_order: order,
          status,
          state_jsonb: state,
          ...(status === "completed" ? { completed_at: nowIso } : {}),
          ...(status === "in_progress" ? { started_at: nowIso } : {}),
        };
        const { error } = await sb
          .from("program_modules")
          .update(update)
          .eq("id", existing.id)
          .eq("engagement_id", programId);
        if (error) throw error;
      } else {
        const { error } = await sb.from("program_modules").insert({
          engagement_id: programId,
          module_key: moduleKey,
          module_name: section.label,
          phase_number: phase,
          module_order: order,
          status,
          state_jsonb: state,
          started_at: nowIso,
          completed_at: status === "completed" ? nowIso : null,
        });
        if (error) throw error;
      }
    }

    // The phase-0 charter mirror is the most dangerous write in this route:
    // `engagements.charter` is the authoritative origination record and the
    // rehydration source of last resort. Only mirror when a capture value
    // actually changed — a no-edit save must never touch it.
    if (phase === 0 && hasEdits) {
      const knownEvidence =
        evaluation.sections.find((s) => s.key === "known_evidence")?.value ??
        "";
      const charter = {
        ...(program.charter ?? {}),
        business_trigger:
          evaluation.sections.find((s) => s.key === "business_trigger")
            ?.value ?? "",
        problem_statement:
          evaluation.sections.find((s) => s.key === "problem_statement")
            ?.value ?? "",
        affected_function_process:
          evaluation.sections.find((s) => s.key === "affected_function_process")
            ?.value ?? "",
        value_hypothesis:
          evaluation.sections.find((s) => s.key === "initial_value_hypothesis")
            ?.value ?? "",
        sponsor_candidate:
          evaluation.sections.find((s) => s.key === "stakeholder_owner_view")
            ?.value ?? "",
        scope_boundary:
          evaluation.sections.find((s) => s.key === "affected_function_process")
            ?.value ?? "",
        evidence_family: knownEvidence,
        known_evidence: knownEvidence,
        missing_evidence_open_questions:
          evaluation.sections.find(
            (s) => s.key === "missing_evidence_open_questions",
          )?.value ?? "",
        recommendation_to_advance:
          evaluation.sections.find((s) => s.key === "recommendation_to_advance")
            ?.value ?? "",
        phase_capture_completed_at: markComplete ? nowIso : null,
      };
      const { error } = await sb
        .from("engagements")
        .update({
          charter,
          problem_statement:
            charter.problem_statement || program.problemStatement,
          target_outcome: charter.value_hypothesis || program.targetOutcome,
          updated_at: nowIso,
        })
        .eq("id", programId)
        .eq("client_id", ctx.clientId);
      if (error) throw error;
    }

    await writeProgramAuditLogBestEffort(ctx, {
      programId,
      engagementId: programId,
      action: markComplete
        ? "phase_capture_completed"
        : hasEdits || hasBasisEdits
          ? "phase_capture_saved"
          : "phase_capture_validated_no_change",
      fromState: null,
      toState: `P${phase}`,
      rationale: markComplete
        ? `Phase ${phase} capture completed through signed-in capture path.`
        : hasEdits || hasBasisEdits
          ? `Phase ${phase} capture saved (${changedSections.length} field value(s) changed; ${basisKeys.size} basis classification(s) submitted) through signed-in capture path.`
          : `Phase ${phase} capture validated with no changes; no values written.`,
      evidenceRefs: moduleKeys,
    });

    // No deliverables_v2 row is created here — see the file-level "PHASE
    // CAPTURE EVIDENCE INTEGRITY" comment above. Real gate deliverables come
    // only from generation or deliberate authorship; capture text is
    // durable evidence for the workspace and for generation context, never
    // itself a signable gate artifact.
    return Response.json({
      ok: true,
      programId,
      phase,
      persisted: hasEdits || hasBasisEdits || markComplete,
      changedFields: changedSections.map((c) => c.key),
      // Report what was STORED, not what was sent.
      //
      // evaluatePhaseCapture normalises every value (it trims), and it is the
      // evaluation's values that the write loop above persists. Echoing the
      // raw request back made this response lie in two ways:
      //
      //   1. A client that adopted `values` displayed text the database did
      //      not hold, so a reload silently changed it while the section still
      //      reported complete.
      //   2. `revision` was hashed over the un-normalised values, so it did
      //      not match the revision the next GET computes from stored state.
      //      The client echoes this on its next write as `expectedRevision`,
      //      so the following edit would 409 as a stale revision even though
      //      nobody else had touched the row.
      //
      // Both disappear once the response is derived from the evaluation.
      revision: computeCaptureRevision(
        storedValues,
        phase === 1
          ? Object.fromEntries(
              Object.entries(nextBasisRecords).flatMap(([key, record]) => {
                if (!record) return [];
                const parsed = readP1CharterBasisRecord(
                  { p1_charter_basis: record },
                  key,
                  storedValues[key] ?? "",
                );
                const input = p1CharterBasisInputFromRecord(parsed);
                return input ? [[key, input]] : [];
              }),
            )
          : undefined,
      ),
      values: storedValues,
      ...(phase === 1
        ? {
            p1BasisBySection: Object.fromEntries(
              Object.entries(nextBasisRecords).flatMap(([key, record]) => {
                if (!record) return [];
                const parsed = readP1CharterBasisRecord(
                  { p1_charter_basis: record },
                  key,
                  storedValues[key] ?? "",
                );
                const input = p1CharterBasisInputFromRecord(parsed);
                return input ? [[key, input]] : [];
              }),
            ),
          }
        : {}),
      savedFields: evaluation.sections
        .filter((section) => section.complete)
        .map((section) => section.key),
      allSaved: evaluation.complete,
      capture: evaluation,
      confirmedSolutionRoute,
      generationEligibility: {
        captureComplete: evaluation.complete,
        gateApprovalRequired: true,
        nextAction: evaluation.complete
          ? "Generate the phase's required deliverables, then approve the phase gate."
          : "Complete all required capture sections.",
      },
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[POST /api/v1/programs/:programId/phase-capture]", err);
    return Response.json(
      { error: "internal_error", message: (err as Error).message },
      { status: 500 },
    );
  }
}

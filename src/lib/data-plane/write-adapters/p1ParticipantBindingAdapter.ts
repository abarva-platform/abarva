import "server-only";
import { withAzureWriteTransaction } from "@/lib/data-plane/postgresCompat";
import { resolveP0ReviewedCaptureConnection } from "./p0ReviewedCaptureCorrectionAdapter";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { canonicalTenantKey } from "@/lib/tenant-keys";
import { isDeclaredSyntheticDemoTenant } from "@/lib/tenant/synthetic-tenant-declaration";
import { p0CorrectionRecordRevision as revision } from "@/lib/programs/p0-reviewed-capture-correction";
import {
  P1ParticipantBindingRefusal,
  type P1ParticipantBindingCommand,
  type P1ParticipantBindingPreview,
} from "@/lib/programs/p1-participant-binding";
import type { TenancyCtx } from "@/lib/programs/types.db";

type Row = Record<string, unknown>;
type Query = (
  sql: string,
  params: unknown[],
) => Promise<{ rows: Row[]; rowCount: number | null }>;
const ACTION = "p1_existing_participant_bindings_confirmed";
const uuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
function refuse(code: string, detail: string, status = 409): never {
  throw new P1ParticipantBindingRefusal(code, detail, status);
}

export function p1ParticipantBindingEnabled(ctx: TenancyCtx): boolean {
  return Boolean(
    ctx.clientId &&
    ctx.userId &&
    ctx.clientKey &&
    isDeclaredSyntheticDemoTenant(canonicalTenantKey(ctx.clientKey)) &&
    isFeatureEnabled(ctx, "moves_step_pages_v3") &&
    isFeatureEnabled(ctx, "moves_step_pages_p0p1_v1") &&
    isFeatureEnabled(ctx, "moves_extended_intake_fields_v1"),
  );
}

async function readPacket(
  query: Query,
  ctx: TenancyCtx,
  moveId: string,
  lock: boolean,
) {
  const suffix = lock ? " FOR UPDATE" : "";
  const program = (
    await query(
      `SELECT * FROM engagements WHERE id = $1 AND client_id = $2${suffix}`,
      [moveId, ctx.clientId],
    )
  ).rows[0];
  if (!program || program.id !== moveId || program.client_id !== ctx.clientId)
    refuse(
      "participant_binding_move_unavailable",
      "This Move could not be read for contact confirmation.",
      404,
    );
  const participants = (
    await query(
      `SELECT * FROM engagement_participants WHERE engagement_id = $1 ORDER BY id${suffix}`,
      [moveId],
    )
  ).rows;
  const ids = [
    ...new Set(
      participants.map((row) => row.person_id || row.user_id).filter(uuid),
    ),
  ];
  const people = ids.length
    ? (
        await query(
          `SELECT * FROM persons WHERE id = ANY($1::uuid[]) ORDER BY id${suffix}`,
          [ids],
        )
      ).rows
    : [];
  const memberships = ids.length
    ? (
        await query(
          `SELECT * FROM person_client_memberships WHERE client_id = $1 AND person_id = ANY($2::uuid[]) ORDER BY person_id${suffix}`,
          [ctx.clientId, ids],
        )
      ).rows
    : [];
  const policy = await loadUserProgramAccessPolicy(ctx);
  const protectedRows: Record<string, Row[]> = {};
  // Capture all historical and source bindings, not only a selected field.
  for (const [key, sql, params] of [
    [
      "snapshots",
      "SELECT * FROM phase_snapshots WHERE engagement_id = $1 ORDER BY id",
      [moveId],
    ],
    [
      "deliverables",
      "SELECT * FROM deliverables_v2 WHERE engagement_id = $1 ORDER BY id",
      [moveId],
    ],
    [
      "versions",
      "SELECT v.* FROM deliverable_versions v WHERE v.deliverable_id IN (SELECT id FROM deliverables_v2 WHERE engagement_id = $1) ORDER BY v.id",
      [moveId],
    ],
    [
      "requests",
      "SELECT * FROM program_approval_requests WHERE program_id = $1 ORDER BY id",
      [moveId],
    ],
    [
      "modules",
      "SELECT * FROM program_modules WHERE engagement_id = $1 ORDER BY id",
      [moveId],
    ],
    [
      "evidence",
      "SELECT * FROM program_evidence_items WHERE program_id = $1 AND tenant_key = $2 ORDER BY id",
      [moveId, ctx.clientKey],
    ],
    [
      "reviews",
      "SELECT * FROM program_evidence_reviews WHERE program_id = $1 AND tenant_key = $2 ORDER BY id",
      [moveId, ctx.clientKey],
    ],
    [
      "artifacts",
      "SELECT * FROM move_artifacts WHERE move_id = $1 AND tenant_id = $2 ORDER BY artifact_id",
      [moveId, ctx.clientId],
    ],
  ] as Array<[string, string, unknown[]]>) {
    protectedRows[key] = (await query(sql + suffix, params)).rows;
  }
  const audits = (
    await query(
      "SELECT * FROM program_audit_log WHERE program_id = $1 AND tenant_key = $2 AND action = $3 ORDER BY created_at DESC, id DESC",
      [moveId, ctx.clientKey, ACTION],
    )
  ).rows;
  return {
    program,
    participants,
    people,
    memberships,
    policy,
    protectedRows,
    audits,
  };
}
type Packet = Awaited<ReturnType<typeof readPacket>>;

function pointers(program: Row) {
  return {
    sponsorPersonId:
      typeof program.sponsor_person_id === "string"
        ? program.sponsor_person_id
        : null,
    leadPersonId:
      typeof program.maestro_person_id === "string"
        ? program.maestro_person_id
        : null,
  };
}
function preservation(packet: Packet): string {
  // The existing engagement trigger advances updated_at on any UPDATE.
  // Every business field is preserved; this generated timestamp is not one.
  const { sponsor_person_id, maestro_person_id, updated_at, ...program } =
    packet.program;
  void sponsor_person_id;
  void maestro_person_id;
  void updated_at;
  return revision({
    program,
    participants: packet.participants,
    people: packet.people,
    memberships: packet.memberships,
    policy: packet.policy,
    protectedRows: packet.protectedRows,
  });
}
function buildPreview(
  packet: Packet,
  ctx: TenancyCtx,
  moveId: string,
): P1ParticipantBindingPreview {
  const current = pointers(packet.program);
  const policy = packet.policy;
  const choices: P1ParticipantBindingPreview["choices"] = [];
  for (const participant of packet.participants) {
    const id = participant.person_id || participant.user_id;
    const person = packet.people.find((row) => row.id === id);
    if (
      participant.engagement_id !== moveId ||
      !uuid(id) ||
      !person ||
      !person.graph_node_id ||
      typeof person.graph_node_id !== "string" ||
      !person.graph_node_id.startsWith("clerk:") ||
      (Array.isArray(person.personal_threads) &&
        person.personal_threads.includes("origination_placeholder")) ||
      packet.participants.filter((row) => (row.person_id || row.user_id) === id)
        .length !== 1
    )
      continue;
    const actor =
      person.graph_node_id === `clerk:${ctx.clerkUserId}` &&
      (id === ctx.userId || ctx.userId === ctx.clerkUserId);
    if (id === ctx.userId && !actor) continue;
    choices.push({
      personId: id,
      name:
        typeof person.name === "string" ? person.name : "Declared participant",
      role:
        typeof participant.role === "string"
          ? participant.role
          : "Declared participant",
      attribution:
        actor && ctx.syntheticE2eOperator === true
          ? "delegated_automated"
          : "declared_participant",
    });
  }
  const canConfirm =
    policy.canApproveGates &&
    policy.clientId === ctx.clientId &&
    policy.userId === ctx.userId &&
    (policy.programIdsAllowed === null ||
      policy.programIdsAllowed.includes(moveId));
  const p0Snapshots = packet.protectedRows.snapshots.filter(
    (row) => row.phase_number === 0,
  );
  const approvedSnapshot =
    p0Snapshots.length === 1 && p0Snapshots[0].approval_status === "approved";
  const signed = packet.protectedRows.deliverables.filter((row) =>
    ["origination_brief", "program_seed_brief", "program_seed"].includes(
      String(row.deliverable_type_key),
    ),
  );
  const signedV1 =
    signed.length === 1 &&
    signed[0].status === "signed_off" &&
    signed[0].current_version === 1 &&
    signed[0].signed_off_version === 1 &&
    signed[0].requires_revalidation === false &&
    packet.protectedRows.versions.some(
      (row) => row.deliverable_id === signed[0].id && row.version === 1,
    );
  const available =
    packet.program.current_phase === 1 &&
    !packet.program.archived_at &&
    !packet.program.deleted_at &&
    approvedSnapshot &&
    signedV1;
  const audit = packet.audits[0];
  const confirmed =
    available &&
    choices.some((row) => row.personId === current.sponsorPersonId) &&
    choices.some((row) => row.personId === current.leadPersonId) &&
    audit?.to_state === JSON.stringify(current) &&
    typeof audit.id === "string";
  const preservationRevision = preservation(packet);
  return {
    moveId,
    status: available ? "available" : "unavailable",
    current,
    choices,
    revision: revision({ scope: [ctx.clientId, ctx.userId, moveId], packet }),
    preservationRevision,
    canConfirm: Boolean(canConfirm && available),
    confirmed: Boolean(confirmed),
    auditId: confirmed ? String(audit.id) : null,
    ...(!available
      ? {
          reason:
            "Current P1 and the preserved signed P0 bindings could not be verified.",
        }
      : {}),
  };
}

function connection(ctx: TenancyCtx) {
  if (!p1ParticipantBindingEnabled(ctx))
    refuse(
      "participant_binding_not_available",
      "Contact confirmation is not available here.",
      404,
    );
  const url = resolveP0ReviewedCaptureConnection(ctx);
  if (!url)
    refuse(
      "participant_binding_unavailable",
      "The contact confirmation data plane is unavailable.",
      503,
    );
  return url;
}

/** A preview uses one scoped READ ONLY transaction and never appoints anyone. */
export async function readP1ParticipantBinding(
  ctx: TenancyCtx,
  moveId: string,
) {
  return withAzureWriteTransaction(
    connection(ctx),
    async (query) => {
      await query("SET TRANSACTION READ ONLY", []);
      return buildPreview(
        await readPacket(query, ctx, moveId, false),
        ctx,
        moveId,
      );
    },
    { includeReads: true },
  );
}

/** Appoint existing declared contacts without changing any participant rights. */
export async function confirmP1ParticipantBinding(
  ctx: TenancyCtx,
  moveId: string,
  command: P1ParticipantBindingCommand,
) {
  const url = connection(ctx);
  if (
    !uuid(command.sponsorPersonId) ||
    !uuid(command.leadPersonId) ||
    !uuid(command.requestId) ||
    typeof command.expectedRevision !== "string" ||
    !/^[a-f0-9]{64}$/.test(command.expectedRevision) ||
    typeof command.rationale !== "string" ||
    !command.rationale.trim() ||
    command.rationale.length > 2000
  )
    refuse(
      "participant_binding_command_required",
      "Choose both existing participants and record a rationale against the current preview.",
      400,
    );
  return withAzureWriteTransaction(
    url,
    async (query) => {
      const before = await readPacket(query, ctx, moveId, true);
      const preview = buildPreview(before, ctx, moveId);
      if (!preview.canConfirm)
        refuse(
          "participant_binding_permission_refused",
          "Current P1 contact confirmation permission and signed bindings could not be verified.",
          403,
        );
      const desired = {
        sponsorPersonId: command.sponsorPersonId,
        leadPersonId: command.leadPersonId,
      };
      const commandRevision = revision({
        actorId: ctx.userId,
        moveId,
        clientId: ctx.clientId,
        command,
      });
      const requestRef = `request:${command.requestId}`;
      const previous = before.audits.find(
        (audit) =>
          Array.isArray(audit.evidence_refs) &&
          audit.evidence_refs.includes(requestRef),
      );
      if (previous) {
        if (
          !Array.isArray(previous.evidence_refs) ||
          !previous.evidence_refs.includes(`command:${commandRevision}`) ||
          !previous.evidence_refs.includes(
            `preserved:${preview.preservationRevision}`,
          ) ||
          previous.actor_id !== ctx.userId ||
          previous.to_state !== JSON.stringify(desired) ||
          !preview.confirmed ||
          preview.auditId !== previous.id
        )
          refuse(
            "participant_binding_request_conflict",
            "This confirmation request has changed or its stored binding is no longer current.",
          );
        return {
          ok: true,
          persisted: true,
          auditId: previous.id,
          preservedBindings: true,
          p1ParticipantBinding: preview,
        };
      }
      if (preview.revision !== command.expectedRevision)
        refuse(
          "participant_binding_stale_revision",
          "The participant or protected records changed. Reload the contact preview before confirming.",
        );
      if (
        ![command.sponsorPersonId, command.leadPersonId].every((id) =>
          preview.choices.some((person) => person.personId === id),
        )
      )
        refuse(
          "participant_binding_identity_refused",
          "Select only existing declared participants from the current Move preview.",
        );
      const updated = await query(
        "UPDATE engagements SET sponsor_person_id = $1, maestro_person_id = $2 WHERE id = $3 AND client_id = $4 AND current_phase = 1 RETURNING *",
        [command.sponsorPersonId, command.leadPersonId, moveId, ctx.clientId],
      );
      if (
        updated.rowCount !== 1 ||
        revision(pointers(updated.rows[0] ?? {})) !== revision(desired)
      )
        refuse(
          "participant_binding_readback_failed",
          "The contact confirmation could not be read back.",
        );
      const audit = await query(
        "INSERT INTO program_audit_log (tenant_key, program_id, engagement_id, actor_id, actor_role, action, from_state, to_state, rationale, evidence_refs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::text[]) RETURNING id",
        [
          ctx.clientKey,
          moveId,
          moveId,
          ctx.userId,
          ctx.role ?? ctx.tenantRole ?? null,
          ACTION,
          preview.revision,
          JSON.stringify(desired),
          command.rationale.trim(),
          [
            requestRef,
            `command:${commandRevision}`,
            `preserved:${preview.preservationRevision}`,
          ],
        ],
      );
      if (audit.rowCount !== 1 || typeof audit.rows[0]?.id !== "string")
        refuse(
          "participant_binding_audit_failed",
          "The required contact confirmation audit could not be recorded.",
        );
      const after = await readPacket(query, ctx, moveId, false);
      const readback = buildPreview(after, ctx, moveId);
      if (
        preservation(after) !== preview.preservationRevision ||
        !readback.confirmed ||
        readback.auditId !== audit.rows[0].id ||
        revision(readback.current) !== revision(desired)
      )
        refuse(
          "participant_binding_preservation_failed",
          "The protected records or confirmed contacts changed. The confirmation is refused.",
        );
      return {
        ok: true,
        persisted: true,
        auditId: audit.rows[0].id,
        preservedBindings: true,
        p1ParticipantBinding: readback,
      };
    },
    { includeReads: true },
  );
}

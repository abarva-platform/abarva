import "server-only";

// Move assumptions register — the server-side store.
//
// Every read and every write is fenced twice: by the tenant (all of this
// tenant's own keys, `tenantAliasesFor`) and by the Move (`program_id`). A new
// row is written only after the Move is confirmed to belong to the caller's
// client. Callers still authorize the Move for the signed-in person first
// (`getProgramById` / the per-Move access policy); this fence is what keeps a
// mis-authorized call from reaching another tenant's rows anyway.
//
// Concurrency: every change is guarded by the row's `revision` — the write
// matches only the revision the person was looking at, so a stale screen is
// refused with `stale_revision` instead of silently overwriting. New register
// IDs are allocated as max+1 per (Move, area) and retried on a unique
// violation (23505), so two people adding rows at once both get an ID and
// neither gets the other's.
//
// History: each change appends one `move_assumption_events` row. The data
// plane has no multi-statement transaction here, so the event is written after
// the change lands; if it fails, `RegisterHistoryWriteError` says the change
// DID land and carries the stored row, rather than reading as "nothing
// happened" and inviting a second, duplicate change.
//
// Read errors are thrown, never folded into an empty register: an empty list
// would read as "this Move has no assumptions", which is a verdict, not a
// failure.

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { tenantAliasesFor } from "@/lib/tenant/aliases";
import {
  ASSUMPTION_COLUMNS,
  INITIAL_STATUS_BY_ORIGIN,
  assumptionFromRow,
  formatRegisterId,
  patchToRow,
  planEdit,
  planTransition,
  validateNewAssumption,
  type ActorKind,
  type AssumptionEdit,
  type AssumptionRecord,
  type AssumptionStatus,
  type ModelRefusal,
  type AssumptionPatch,
  type NewAssumptionInput,
  type TransitionRequest,
} from "./model";

const ASSUMPTIONS_TABLE = "move_assumptions";
const EVENTS_TABLE = "move_assumption_events";
const UNIQUE_VIOLATION = "23505";

/** How many times a new register ID is re-allocated after losing a race. */
export const MAX_ID_ALLOCATION_ATTEMPTS = 5;

export type RegisterActor = { kind: ActorKind; userId: string };

export type StoreRefusal =
  | ModelRefusal
  | { code: "unknown_program" }
  | { code: "unknown_assumption" }
  | { code: "stale_revision"; currentRevision: number | null }
  | { code: "id_allocation_conflict" }
  | { code: "unknown_supersede_target" };

type GuardedPlan =
  | { ok: true; patch: AssumptionPatch; to: AssumptionStatus }
  | { ok: false; refusal: StoreRefusal };

export type RegisterWriteResult =
  | { ok: true; record: AssumptionRecord }
  | { ok: false; refusal: StoreRefusal };

export type SupersedeResult =
  | { ok: true; record: AssumptionRecord; replacement: AssumptionRecord }
  | {
      ok: false;
      refusal: StoreRefusal;
      /**
       * The replacement row, when it was stored before the refusal. It is a
       * valid open register row; retry the supersede pointing at it
       * (`transitionAssumption` with `supersededBy: replacement.id`) rather
       * than creating another.
       */
      replacement: AssumptionRecord | null;
    };

export type AssumptionEventType =
  | "created"
  | "edited"
  | "accepted"
  | "rejected"
  | "confirmed"
  | "corrected"
  | "superseded";

const EVENT_TYPE_BY_STATUS: Readonly<
  Partial<Record<AssumptionStatus, AssumptionEventType>>
> = {
  open: "accepted",
  rejected: "rejected",
  confirmed: "confirmed",
  corrected: "corrected",
  superseded: "superseded",
};

/** The change landed, but its history event did not. Carries the stored row. */
export class RegisterHistoryWriteError extends Error {
  readonly landed: AssumptionRecord;
  readonly historyError: unknown;
  constructor(landed: AssumptionRecord, historyError: unknown) {
    super(
      `The register change to ${landed.registerId} was saved (revision ${landed.revision}), ` +
        "but its history event was not recorded.",
    );
    this.name = "RegisterHistoryWriteError";
    this.landed = landed;
    this.historyError = historyError;
  }
}

function tenantKeysFor(ctx: TenancyCtx): string[] {
  return ctx.clientKey ? tenantAliasesFor(ctx.clientKey) : [];
}

function isUniqueViolation(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    (error as { code?: unknown }).code === UNIQUE_VIOLATION
  );
}

function recordOrThrow(row: unknown): AssumptionRecord {
  const record = assumptionFromRow((row ?? {}) as Record<string, unknown>);
  if (!record) {
    throw new Error(
      "move_assumptions returned a row outside the register vocabulary",
    );
  }
  return record;
}

/** This Move's whole register (every status), oldest ID first per area. */
export async function listAssumptions(
  ctx: TenancyCtx,
  programId: string,
): Promise<AssumptionRecord[]> {
  const tenantKeys = tenantKeysFor(ctx);
  if (tenantKeys.length === 0 || !programId) return [];
  const { data, error } = await getAzureWriteFluentClient()
    .from(ASSUMPTIONS_TABLE)
    .select(ASSUMPTION_COLUMNS)
    .in("tenant_key", tenantKeys)
    .eq("program_id", programId)
    .order("area", { ascending: true })
    .order("seq", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown[]).map(recordOrThrow);
}

async function readAssumption(
  tenantKeys: string[],
  programId: string,
  assumptionId: string,
): Promise<AssumptionRecord | null> {
  const { data, error } = await getAzureWriteFluentClient()
    .from(ASSUMPTIONS_TABLE)
    .select(ASSUMPTION_COLUMNS)
    .in("tenant_key", tenantKeys)
    .eq("program_id", programId)
    .eq("id", assumptionId)
    .maybeSingle();
  if (error) throw error;
  return data ? recordOrThrow(data) : null;
}

async function programBelongsToClient(
  ctx: TenancyCtx,
  programId: string,
): Promise<boolean> {
  if (!ctx.clientId) return false;
  const { data, error } = await getAzureWriteFluentClient()
    .from("engagements")
    .select("id")
    .eq("id", programId)
    .eq("client_id", ctx.clientId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function highestSeq(
  tenantKeys: string[],
  programId: string,
  area: string,
): Promise<number> {
  const { data, error } = await getAzureWriteFluentClient()
    .from(ASSUMPTIONS_TABLE)
    .select("seq")
    .in("tenant_key", tenantKeys)
    .eq("program_id", programId)
    .eq("area", area)
    .order("seq", { ascending: false })
    .limit(1);
  if (error) throw error;
  const rows = (data ?? []) as Array<{ seq?: unknown }>;
  const seq = Number(rows[0]?.seq ?? 0);
  return Number.isFinite(seq) ? seq : 0;
}

function snapshot(record: AssumptionRecord): Record<string, unknown> {
  // The tenant key is the row's fence, not part of what changed.
  const copy: Record<string, unknown> = { ...record };
  delete copy.tenantKey;
  return copy;
}

async function appendEvent(
  record: AssumptionRecord,
  event: {
    type: AssumptionEventType;
    from: AssumptionStatus | null;
    before: AssumptionRecord | null;
    actor: RegisterActor;
  },
): Promise<void> {
  try {
    const { error } = await getAzureWriteFluentClient()
      .from(EVENTS_TABLE)
      .insert({
        tenant_key: record.tenantKey,
        program_id: record.programId,
        assumption_id: record.id,
        event_type: event.type,
        from_status: event.from,
        to_status: record.status,
        revision: record.revision,
        before: event.before ? snapshot(event.before) : null,
        after: snapshot(record),
        actor_user_id: event.actor.userId,
        actor_kind: event.actor.kind,
      });
    if (error) throw error;
  } catch (cause) {
    throw new RegisterHistoryWriteError(record, cause);
  }
}

/**
 * Add a row to a Move's register. The status comes from the origin, never the
 * caller: a person's own row is open at once; an aVa proposal waits for a
 * person. aVa can only add `ava_proposal` rows.
 */
export async function createAssumption(
  ctx: TenancyCtx,
  programId: string,
  input: NewAssumptionInput,
  actor: RegisterActor,
): Promise<RegisterWriteResult> {
  const validation = validateNewAssumption(input, actor);
  if (!validation.ok) return validation;
  const tenantKey = ctx.clientKey;
  const tenantKeys = tenantKeysFor(ctx);
  if (!tenantKey || tenantKeys.length === 0 || !programId) {
    return { ok: false, refusal: { code: "unknown_program" } };
  }
  if (!(await programBelongsToClient(ctx, programId))) {
    return { ok: false, refusal: { code: "unknown_program" } };
  }

  const db = getAzureWriteFluentClient();
  for (let attempt = 0; attempt < MAX_ID_ALLOCATION_ATTEMPTS; attempt += 1) {
    const seq = (await highestSeq(tenantKeys, programId, input.area)) + 1;
    const { data, error } = await db
      .from(ASSUMPTIONS_TABLE)
      .insert({
        tenant_key: tenantKey,
        program_id: programId,
        area: input.area,
        seq,
        register_id: formatRegisterId(input.area, seq),
        statement: input.statement.trim(),
        why_it_matters: input.whyItMatters ?? null,
        working_figure: input.workingFigure ?? null,
        working_value: input.workingValue ?? null,
        unit: input.unit ?? null,
        source: input.source.trim(),
        confidence: input.confidence,
        owner_role: input.ownerRole.trim(),
        owner_name: input.ownerName ?? null,
        owner_person_id: input.ownerPersonId ?? null,
        status: INITIAL_STATUS_BY_ORIGIN[input.origin],
        origin: input.origin,
        raised_phase: input.raisedPhase ?? null,
        raised_step_id: input.raisedStepId ?? null,
        evidence_ids: input.evidenceIds ?? [],
        charter_section_key: input.charterSectionKey ?? null,
        charter_value_revision: input.charterValueRevision ?? null,
        revision: 1,
        created_by_user_id: actor.userId,
      })
      .select(ASSUMPTION_COLUMNS)
      .single();
    if (error) {
      if (isUniqueViolation(error)) continue;
      throw error;
    }
    const record = recordOrThrow(data);
    await appendEvent(record, {
      type: "created",
      from: null,
      before: null,
      actor,
    });
    return { ok: true, record };
  }
  return { ok: false, refusal: { code: "id_allocation_conflict" } };
}

/**
 * Apply a planned change to one row, guarded by the revision the caller saw.
 * Reads first so a stale revision, an unknown row and a refused change each
 * get their own refusal; the write re-checks the revision so a race between
 * the read and the write is still refused.
 */
async function applyGuardedChange(
  ctx: TenancyCtx,
  programId: string,
  assumptionId: string,
  expectedRevision: number,
  plan: (current: AssumptionRecord) => GuardedPlan | Promise<GuardedPlan>,
  eventType: (
    current: AssumptionRecord,
    to: AssumptionStatus,
  ) => AssumptionEventType,
  actor: RegisterActor,
): Promise<RegisterWriteResult> {
  const tenantKeys = tenantKeysFor(ctx);
  if (tenantKeys.length === 0 || !programId || !assumptionId) {
    return { ok: false, refusal: { code: "unknown_assumption" } };
  }
  const current = await readAssumption(tenantKeys, programId, assumptionId);
  if (!current) return { ok: false, refusal: { code: "unknown_assumption" } };
  if (current.revision !== expectedRevision) {
    return {
      ok: false,
      refusal: { code: "stale_revision", currentRevision: current.revision },
    };
  }
  const planned = await plan(current);
  if (!planned.ok) return planned;

  const { data, error } = await getAzureWriteFluentClient()
    .from(ASSUMPTIONS_TABLE)
    .update({
      ...patchToRow(planned.patch),
      revision: expectedRevision + 1,
      updated_at: new Date().toISOString(),
    })
    .in("tenant_key", tenantKeys)
    .eq("program_id", programId)
    .eq("id", assumptionId)
    .eq("revision", expectedRevision)
    .select(ASSUMPTION_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const now = await readAssumption(tenantKeys, programId, assumptionId);
    if (!now) return { ok: false, refusal: { code: "unknown_assumption" } };
    return {
      ok: false,
      refusal: { code: "stale_revision", currentRevision: now.revision },
    };
  }
  const record = recordOrThrow(data);
  await appendEvent(record, {
    type: eventType(current, planned.to),
    from: current.status,
    before: current,
    actor,
  });
  return { ok: true, record };
}

/** Edit a row's content. Only before it is answered; area never changes. */
export function editAssumption(
  ctx: TenancyCtx,
  programId: string,
  assumptionId: string,
  expectedRevision: number,
  edit: AssumptionEdit,
  actor: RegisterActor,
): Promise<RegisterWriteResult> {
  return applyGuardedChange(
    ctx,
    programId,
    assumptionId,
    expectedRevision,
    (current) => planEdit(current, edit, actor),
    () => "edited",
    actor,
  );
}

/**
 * Move a row along the register's lifecycle. A supersede here points at an
 * EXISTING row of the same Move; `supersedeAssumption` creates the
 * replacement and supersedes in one call.
 */
export function transitionAssumption(
  ctx: TenancyCtx,
  programId: string,
  assumptionId: string,
  expectedRevision: number,
  request: TransitionRequest,
  actor: RegisterActor,
): Promise<RegisterWriteResult> {
  const tenantKeys = tenantKeysFor(ctx);
  return applyGuardedChange(
    ctx,
    programId,
    assumptionId,
    expectedRevision,
    async (current): Promise<GuardedPlan> => {
      const planned = planTransition(
        current,
        request,
        actor,
        new Date().toISOString(),
      );
      if (!planned.ok || request.action !== "supersede") return planned;
      const target = await readAssumption(
        tenantKeys,
        programId,
        request.supersededBy,
      );
      if (!target)
        return { ok: false, refusal: { code: "unknown_supersede_target" } };
      return planned;
    },
    (_current, to) => EVENT_TYPE_BY_STATUS[to] ?? "edited",
    actor,
  );
}

/**
 * Replace a row with a NEW row (new register ID, same area) and mark the old
 * one superseded by it. Every refusal that can be known before writing is
 * checked first. If the old row moves between the check and the final write,
 * the refusal says so AND returns the replacement that was stored, so the
 * caller retries against it instead of creating a second one.
 */
export async function supersedeAssumption(
  ctx: TenancyCtx,
  programId: string,
  assumptionId: string,
  expectedRevision: number,
  replacement: Omit<NewAssumptionInput, "area" | "origin">,
  actor: RegisterActor,
): Promise<SupersedeResult> {
  const tenantKeys = tenantKeysFor(ctx);
  if (tenantKeys.length === 0 || !programId || !assumptionId) {
    return {
      ok: false,
      refusal: { code: "unknown_assumption" },
      replacement: null,
    };
  }
  const current = await readAssumption(tenantKeys, programId, assumptionId);
  if (!current) {
    return {
      ok: false,
      refusal: { code: "unknown_assumption" },
      replacement: null,
    };
  }
  if (current.revision !== expectedRevision) {
    return {
      ok: false,
      refusal: { code: "stale_revision", currentRevision: current.revision },
      replacement: null,
    };
  }
  // Same checks the final write will make, with a placeholder target, so a
  // refused supersede stores nothing.
  const precheck = planTransition(
    current,
    { action: "supersede", supersededBy: `${current.id}:replacement` },
    actor,
    new Date().toISOString(),
  );
  if (!precheck.ok)
    return { ok: false, refusal: precheck.refusal, replacement: null };

  const created = await createAssumption(
    ctx,
    programId,
    { ...replacement, area: current.area, origin: "team" },
    actor,
  );
  if (!created.ok)
    return { ok: false, refusal: created.refusal, replacement: null };

  const superseded = await transitionAssumption(
    ctx,
    programId,
    assumptionId,
    expectedRevision,
    { action: "supersede", supersededBy: created.record.id },
    actor,
  );
  if (!superseded.ok) {
    return {
      ok: false,
      refusal: superseded.refusal,
      replacement: created.record,
    };
  }
  return { ok: true, record: superseded.record, replacement: created.record };
}

export type CharterUpsertResult =
  | { ok: true; record: AssumptionRecord; created: boolean }
  | { ok: false; refusal: StoreRefusal };

async function readByCharterSection(
  tenantKeys: string[],
  programId: string,
  charterSectionKey: string,
): Promise<AssumptionRecord | null> {
  const { data, error } = await getAzureWriteFluentClient()
    .from(ASSUMPTIONS_TABLE)
    .select(ASSUMPTION_COLUMNS)
    .in("tenant_key", tenantKeys)
    .eq("program_id", programId)
    .eq("charter_section_key", charterSectionKey)
    .maybeSingle();
  if (error) throw error;
  return data ? recordOrThrow(data) : null;
}

/**
 * The register row for one carried-forward P1 charter section: the row that
 * already stands for it, or a new one. Keyed on `charter_section_key`, which
 * the migration makes unique per Move
 * (`uq_move_assumptions_program_charter_section`).
 *
 * An existing row is returned AS IS, never overwritten: the P1 basis stays the
 * declaration and the register owns the resolution, so a re-declared charter
 * answer must not silently rewrite (or re-open) a row someone has answered.
 * Whether that row is now stale is the caller's reading
 * (`charter-bridge.ts`), not a write.
 *
 * Two callers racing on the same section: the loser's insert hits the
 * charter-section unique index, which `createAssumption` reads as a lost ID
 * race and eventually refuses; the row the winner stored is then read back
 * and returned with `created: false`.
 */
export async function upsertCharterAssumption(
  ctx: TenancyCtx,
  programId: string,
  input: NewAssumptionInput,
  actor: RegisterActor,
): Promise<CharterUpsertResult> {
  const charterSectionKey = input.charterSectionKey?.trim() ?? "";
  if (input.origin !== "charter_carry_forward") {
    return { ok: false, refusal: { code: "invalid_input", field: "origin" } };
  }
  if (!charterSectionKey) {
    return {
      ok: false,
      refusal: { code: "invalid_input", field: "charterSectionKey" },
    };
  }
  const tenantKeys = tenantKeysFor(ctx);
  if (tenantKeys.length === 0 || !programId) {
    return { ok: false, refusal: { code: "unknown_program" } };
  }
  const existing = await readByCharterSection(
    tenantKeys,
    programId,
    charterSectionKey,
  );
  if (existing) return { ok: true, record: existing, created: false };

  const created = await createAssumption(
    ctx,
    programId,
    { ...input, charterSectionKey },
    actor,
  );
  if (created.ok) return { ok: true, record: created.record, created: true };
  if (created.refusal.code === "id_allocation_conflict") {
    const raced = await readByCharterSection(
      tenantKeys,
      programId,
      charterSectionKey,
    );
    if (raced) return { ok: true, record: raced, created: false };
  }
  return created;
}

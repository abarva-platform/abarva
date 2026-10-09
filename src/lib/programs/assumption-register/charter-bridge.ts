import "server-only";

// Move assumptions register — the bridge from the P1 charter basis.
//
// P1 lets a charter answer stand on an assumption, with an owner and a plan for
// validating it in Discover (`p1_charter_basis`). With
// `moves_assumption_register_v1` on, each such answer gets ONE register row
// (origin `charter_carry_forward`, confidence 1, raised in phase 1, owner from
// the basis — as the owner ROLE when it reads like one, otherwise kept in
// `owner_name` behind a role-only placeholder; see `charterOwnerFields`), so it is answered, corrected or superseded where every
// other working figure is.
//
// Division of ownership:
//   - the P1 basis stays the DECLARATION. Nothing here edits capture state;
//   - the register owns the RESOLUTION. A charter assumption whose register row
//     is answered (directly, or through the row that superseded it) is
//     resolved, and the P2 carry-forward band stops listing it as open.
//
// Staleness is a READING, not a write. The row pins `charter_value_revision`
// (the same revision the basis pins). When the charter answer is edited, the
// pin no longer matches and the row is reported stale — until someone answers
// it after the answer's current basis was declared. The row is never rewritten
// to the new wording: an answered row would otherwise silently become an
// answer to a question nobody asked it.
//
// Where it runs: the phase page, server-side, once the Move is past the
// charter (current phase 2+), and only for a viewer who may change the
// register. It is idempotent on `charter_section_key` — a page load after the
// first writes nothing — so a steady-state load is one register read. See the
// release record for why page load and not the P1 capture save.

import { computeCaptureRevision } from "@/lib/programs/phase-capture-integrity";
import {
  P1_CHARTER_EVIDENCE_FAMILIES,
  readP1CharterBasisRecord,
} from "@/lib/programs/p1-charter-evidence";
import type { TenancyCtx } from "@/lib/programs/types.db";
import type {
  AssumptionArea,
  AssumptionRecord,
  NewAssumptionInput,
} from "./model";
import {
  CHARTER_OWNER_ROLE_PLACEHOLDER,
  looksLikePersonalName,
} from "./owner-role";
import { canWriteRegister } from "./register-route-access";
import {
  RegisterHistoryWriteError,
  listAssumptions,
  upsertCharterAssumption,
} from "./store";

type CharterSectionKey =
  (typeof P1_CHARTER_EVIDENCE_FAMILIES)[number]["sectionKey"];

/**
 * The register area each charter section's assumption lands in. A `Record`
 * over the canonical section keys, so a new charter section without an area
 * is a compile error.
 */
export const CHARTER_SECTION_AREA: Readonly<
  Record<CharterSectionKey, AssumptionArea>
> = {
  sponsor_commitment: "delivery",
  scope_boundary: "delivery",
  success_criteria: "value",
  stakeholder_map: "adoption",
  decision_rights: "delivery",
  evidence_plan: "data",
  business_change_assessment: "adoption",
};

/** Charter assumptions start at the lowest confidence: nothing stands behind them yet. */
export const CHARTER_ASSUMPTION_CONFIDENCE = 1 as const;
/** The phase the charter is captured in. */
export const CHARTER_RAISED_PHASE = 1 as const;

interface CharterCaptureModuleState {
  moduleKey: string;
  status?: string;
  state?: Record<string, unknown> | null;
}

/** A charter answer P1 left standing on an assumption, as the register reads it. */
export interface DeclaredCharterAssumption {
  sectionKey: CharterSectionKey;
  label: string;
  answer: string;
  owner: string;
  validationPlan: string;
  /** The revision of the charter answer the basis was declared against. */
  valueRevision: string;
  recordedByUserId: string;
  recordedAt: string;
}

function sectionModule(
  modules: readonly CharterCaptureModuleState[],
  sectionKey: string,
): CharterCaptureModuleState | undefined {
  return modules.find((entry) => entry.moduleKey === `phase_1_${sectionKey}`);
}

function currentAnswer(module: CharterCaptureModuleState | undefined): string {
  const raw = module?.state?.value;
  return typeof raw === "string" ? raw : "";
}

/**
 * Every charter answer standing on an assumption against its CURRENT wording,
 * in canonical charter order — the same acceptance rule the carry-forward and
 * P1 itself apply (`readP1CharterBasisRecord`).
 */
export function declaredCharterAssumptions(
  modules: readonly CharterCaptureModuleState[],
): DeclaredCharterAssumption[] {
  const declared: DeclaredCharterAssumption[] = [];
  for (const family of P1_CHARTER_EVIDENCE_FAMILIES) {
    const answer = currentAnswer(sectionModule(modules, family.sectionKey));
    const record = readP1CharterBasisRecord(
      sectionModule(modules, family.sectionKey)?.state,
      family.sectionKey,
      answer,
    );
    if (record?.kind !== "assumption") continue;
    declared.push({
      sectionKey: family.sectionKey,
      label: family.label,
      answer,
      owner: record.owner,
      validationPlan: record.p2ValidationPlan,
      valueRevision: record.valueRevision,
      recordedByUserId: record.recordedByUserId,
      recordedAt: record.recordedAt,
    });
  }
  return declared;
}

/**
 * The owner columns for a charter row. The P1 basis asks for an owner, not a
 * role, so the value may be a person. `owner_role` reaches generation prompts
 * and must never carry a person: a value the shared owner-role check
 * (`looksLikePersonalName`) flags moves to `owner_name`, and the row carries a
 * role-only placeholder until the team sets a real role (`ownerNeedsRole`).
 */
export function charterOwnerFields(owner: string): {
  ownerRole: string;
  ownerName: string | null;
  ownerNeedsRole: boolean;
} {
  const trimmed = owner.trim();
  if (trimmed && !looksLikePersonalName(trimmed)) {
    return { ownerRole: trimmed, ownerName: null, ownerNeedsRole: false };
  }
  return {
    ownerRole: CHARTER_OWNER_ROLE_PLACEHOLDER,
    ownerName: trimmed || null,
    ownerNeedsRole: true,
  };
}

/** The register row a declared charter assumption becomes. */
export function charterRegisterInput(
  declared: DeclaredCharterAssumption,
): NewAssumptionInput {
  const owner = charterOwnerFields(declared.owner);
  return {
    area: CHARTER_SECTION_AREA[declared.sectionKey],
    statement: declared.answer.trim()
      ? `${declared.label}: ${declared.answer.trim()}`
      : declared.label,
    whyItMatters: `Validation plan from the charter: ${declared.validationPlan}`,
    source: `P1 charter, ${declared.label}, declared as an assumption`,
    confidence: CHARTER_ASSUMPTION_CONFIDENCE,
    ownerRole: owner.ownerRole,
    ownerName: owner.ownerName,
    origin: "charter_carry_forward",
    raisedPhase: CHARTER_RAISED_PHASE,
    charterSectionKey: declared.sectionKey,
    charterValueRevision: declared.valueRevision,
  };
}

/** Rows still standing in the register's life; a superseded or rejected row is done. */
const LIVE_STATUSES = new Set(["proposed", "open", "confirmed", "corrected"]);
const ANSWERED_STATUSES = new Set(["confirmed", "corrected"]);
/** A supersede chain longer than this is malformed; it resolves nothing. */
const MAX_SUPERSEDE_HOPS = 20;

/**
 * Where a row's answer lives: the row itself, or the row at the end of its
 * supersede chain. Null when that row is unanswered or the chain is broken.
 */
function answeredEnd(
  record: AssumptionRecord,
  byId: ReadonlyMap<string, AssumptionRecord>,
): AssumptionRecord | null {
  let current: AssumptionRecord | undefined = record;
  for (let hop = 0; current && hop <= MAX_SUPERSEDE_HOPS; hop += 1) {
    if (ANSWERED_STATUSES.has(current.status)) return current;
    if (current.status !== "superseded" || !current.supersededBy) return null;
    current = byId.get(current.supersededBy);
  }
  return null;
}

export interface CharterRegisterStanding {
  /** Declared charter assumptions with no register row yet. */
  missing: DeclaredCharterAssumption[];
  /** Register rows whose charter answer has changed since they were raised (and not answered since). */
  staleAssumptionIds: string[];
  /** Charter sections whose current assumption the register has answered. */
  resolvedSectionKeys: string[];
}

/**
 * What the register says about the charter's assumptions. Pure.
 *
 * A row is STALE when its pinned `charterValueRevision` differs from the
 * revision of the charter answer as it reads now, unless its answer was given
 * at or after the current basis was declared — that answer was given with the
 * current wording in front of the team.
 *
 * A section is RESOLVED when its row (or the row that superseded it) is
 * answered and the row is not stale: an answer about the previous wording
 * does not resolve the current one.
 */
export function charterRegisterStanding(
  modules: readonly CharterCaptureModuleState[],
  records: readonly AssumptionRecord[],
): CharterRegisterStanding {
  const declared = declaredCharterAssumptions(modules);
  const declaredByKey = new Map(declared.map((row) => [row.sectionKey, row]));
  const byId = new Map(records.map((record) => [record.id, record]));
  const charterRows = new Map<string, AssumptionRecord>();
  for (const record of records) {
    if (record.charterSectionKey)
      charterRows.set(record.charterSectionKey, record);
  }

  const staleAssumptionIds: string[] = [];
  const resolvedSectionKeys: string[] = [];
  for (const [sectionKey, record] of charterRows) {
    const current = declaredByKey.get(sectionKey as CharterSectionKey);
    const currentRevision = computeCaptureRevision({
      [sectionKey]: currentAnswer(sectionModule(modules, sectionKey)),
    });
    const end = answeredEnd(record, byId);
    const answeredSinceDeclared =
      !!current &&
      !!end?.answeredAt &&
      Date.parse(end.answeredAt) >= Date.parse(current.recordedAt);
    const stale =
      record.charterValueRevision !== currentRevision && !answeredSinceDeclared;
    if (stale && LIVE_STATUSES.has(record.status)) {
      staleAssumptionIds.push(record.id);
    }
    if (current && end && !stale) resolvedSectionKeys.push(sectionKey);
  }

  return {
    missing: declared.filter((row) => !charterRows.has(row.sectionKey)),
    staleAssumptionIds,
    resolvedSectionKeys,
  };
}

export type CharterBridgeOutcome =
  | {
      status: "ok";
      /** Rows this call added to the register. */
      created: number;
      /** Declared charter assumptions still without a register row (viewer cannot write, or the write was refused). */
      unbridgedSectionKeys: string[];
      staleAssumptionIds: string[];
      resolvedSectionKeys: string[];
    }
  | {
      /**
       * The register or the charter could not be read. Nothing about the
       * charter's standing is known, so the carry-forward reads as it did
       * before the register existed and no row is flagged either way.
       */
      status: "unavailable";
    };

/**
 * Bring the register up to date with the charter's declared assumptions, then
 * read their standing. Idempotent: a section that already has a row is never
 * written again.
 *
 * `write: false` reads only — a viewer who cannot change the register never
 * causes a write by opening the page; their missing sections are reported as
 * unbridged.
 */
export async function bridgeCharterAssumptions(args: {
  ctx: TenancyCtx;
  programId: string;
  modules: readonly CharterCaptureModuleState[];
  write: boolean;
}): Promise<CharterBridgeOutcome> {
  let records: AssumptionRecord[];
  try {
    records = await listAssumptions(args.ctx, args.programId);
  } catch {
    return { status: "unavailable" };
  }
  const standing = charterRegisterStanding(args.modules, records);
  if (!args.write || standing.missing.length === 0) {
    return {
      status: "ok",
      created: 0,
      unbridgedSectionKeys: standing.missing.map((row) => row.sectionKey),
      staleAssumptionIds: standing.staleAssumptionIds,
      resolvedSectionKeys: standing.resolvedSectionKeys,
    };
  }

  let created = 0;
  const unbridged: string[] = [];
  for (const declared of standing.missing) {
    try {
      const result = await upsertCharterAssumption(
        args.ctx,
        args.programId,
        charterRegisterInput(declared),
        // Attributed to the person who declared the assumption in P1, not to
        // whoever happened to open the page.
        { kind: "person", userId: declared.recordedByUserId },
      );
      if (!result.ok) {
        unbridged.push(declared.sectionKey);
        continue;
      }
      if (result.created) created += 1;
      records.push(result.record);
    } catch (err) {
      // The row landed; only its history event did not.
      if (err instanceof RegisterHistoryWriteError) {
        created += 1;
        records.push(err.landed);
        continue;
      }
      unbridged.push(declared.sectionKey);
    }
  }
  const after = charterRegisterStanding(args.modules, records);
  return {
    status: "ok",
    created,
    unbridgedSectionKeys: unbridged,
    staleAssumptionIds: after.staleAssumptionIds,
    resolvedSectionKeys: after.resolvedSectionKeys,
  };
}

/**
 * Whether opening the phase page may write charter rows: only once the Move is
 * past the charter (current phase 2+), and only for a viewer who may change
 * this Move's register. While P1 is being drafted a basis is declared, edited
 * and re-declared freely, and each version would otherwise mint a row that
 * goes stale on the next edit. A failed policy read (`null`) never writes.
 */
export function charterBridgeMayWrite(input: {
  currentPhase: number;
  policy: {
    accessLevel: string;
    programIdsAllowed: readonly string[] | null;
  } | null;
  programId: string;
}): boolean {
  return (
    input.currentPhase >= 2 &&
    input.policy !== null &&
    canWriteRegister(input.policy, input.programId)
  );
}

/** What the phase page hands the register panel. */
export interface CharterBridgeMount {
  programId: string;
  staleAssumptionIds: string[];
  charterUnavailable: boolean;
  unbridgedCharterCount: number;
}

/**
 * The panel's view of one bridge run. Only a write that was attempted and
 * refused counts as unbridged: a section not written because the charter is
 * still open or the viewer is read-only is not a failure.
 */
export function charterBridgeMount(
  programId: string,
  outcome: CharterBridgeOutcome,
  wrote: boolean,
): CharterBridgeMount {
  if (outcome.status !== "ok") {
    return {
      programId,
      staleAssumptionIds: [],
      charterUnavailable: true,
      unbridgedCharterCount: 0,
    };
  }
  return {
    programId,
    staleAssumptionIds: outcome.staleAssumptionIds,
    charterUnavailable: false,
    unbridgedCharterCount: wrote ? outcome.unbridgedSectionKeys.length : 0,
  };
}

import {
  readCharterAssumptionResolutionRecord,
  type CharterAssumptionResolutionRecord,
} from "@/lib/programs/charter-assumption-resolution";
import {
  P1_CHARTER_EVIDENCE_FAMILIES,
  readP1CharterBasisRecord,
} from "@/lib/programs/p1-charter-evidence";

/**
 * What a charter answer is still worth once Discover has closed
 * (`moves_charter_standing_after_discover_v1`).
 *
 * P1 lets a person answer a charter field from an assumption, naming an owner
 * and the plan for validating it. P2 inherits those assumptions and can record
 * what Discover found. From P3 onward both reads stop: the carry-forward is
 * scoped to P2, and the resolution read is scoped to P2, so every later phase
 * reads a charter answer with no idea whether anyone ever checked it. P3 routes
 * a solution off it, P4 builds a business case on it, P5 mobilises against it.
 *
 * This module is the read that outlives Discover. It reports the charter
 * answers a later phase should not quote flat, and it reports them as two
 * distinct standings, because they are two different problems:
 *
 * - `unvalidated` — the field was answered from an assumption and Discover
 *   never resolved it. Nobody has said the answer is wrong; nobody has said it
 *   is right either, and the phase whose job was to check has closed.
 * - `known_wrong` — Discover resolved it as CORRECTED, and the charter still
 *   carries the wording Discover judged wrong. See below for why that is
 *   sound rather than a guess.
 *
 * Pure on purpose: no React, no flag lookup, no fetch, no write. The caller
 * resolves the flags and supplies the already-loaded module rows.
 *
 * ## Why `known_wrong` is an inference the data actually supports
 *
 * A resolution carries the revision of the answer it was recorded against, and
 * `readCharterAssumptionResolutionRecord` returns it only while that revision
 * still matches the answer on the row. So a `corrected` resolution that is
 * READABLE at all proves the answer is byte-identical to the one Discover
 * judged wrong — had anyone rewritten it, the resolution would have stopped
 * reading and the field would carry no basis and no resolution. The standing
 * is therefore derived from the same staleness pin the rest of the family
 * uses, not from a comparison this module invents.
 *
 * ## Why this refuses to report anything without the resolution read
 *
 * At P2 a carried assumption is a to-do: listing one Discover has already
 * closed is over-inclusive and mildly annoying. At P3 the same row is a
 * VERDICT about work that is over — "nobody validated this" — and saying that
 * about an answer Discover confirmed is a false statement about work that was
 * really done, rendered in the one place a reader would trust it. There is no
 * safe degraded mode: without the resolution read this module cannot tell a
 * surviving assumption from a resolved one, so it reports nothing at all
 * rather than reporting the wrong thing confidently.
 */

/** Why a later phase should not quote this charter answer flat. */
export type PostDiscoverCharterStanding =
  /** Answered from an assumption; Discover closed without resolving it. */
  | "unvalidated"
  /** Discover corrected it, and the charter still carries the wrong wording. */
  | "known_wrong";

interface PostDiscoverCharterRowBase {
  /** The P1 capture section key the basis was declared against. */
  sectionKey: string;
  /** The charter field's canonical label, as P1 shows it. */
  label: string;
  /** The answer the charter currently carries. */
  answer: string;
  /** Who owned validating it, as named when the basis was declared. */
  owner: string;
  /** When the basis was declared, ISO-8601. */
  recordedAt: string;
}

/** An assumption that outlived Discover without ever being resolved. */
export interface UnvalidatedCharterAnswer extends PostDiscoverCharterRowBase {
  standing: "unvalidated";
  /**
   * What P1 planned Discover would do. Named for what it is: a plan nobody
   * carried out. A later surface must not render it as work performed.
   */
  plannedValidation: string;
}

/** An answer Discover found wrong, still standing in the charter as written. */
export interface KnownWrongCharterAnswer extends PostDiscoverCharterRowBase {
  standing: "known_wrong";
  /** What Discover found, as recorded on the resolution. */
  correction: string;
  /** When Discover resolved it, ISO-8601. */
  resolvedAt: string;
}

export type PostDiscoverCharterAnswer =
  UnvalidatedCharterAnswer | KnownWrongCharterAnswer;

interface CharterCaptureModuleState {
  moduleKey: string;
  status: string;
  state?: Record<string, unknown> | null;
}

/**
 * The surface is reachable only from P3 onward, and only when the tenant can
 * read resolutions.
 *
 * P2 is excluded because `charterAssumptionCarryForwardActive` owns it: there
 * an open assumption is live work with an owner and a plan, and showing the
 * same field twice under two different framings on one phase would be a worse
 * answer than either. The `resolutionReadEnabled` conjunct is the refusal
 * described in this module's header, not a convenience.
 */
export function charterStandingAfterDiscoverActive(input: {
  /** `moves_charter_standing_after_discover_v1`, resolved for the tenant. */
  flagEnabled: boolean;
  /** `moves_charter_assumption_resolution_v1`, resolved for the tenant. */
  resolutionReadEnabled: boolean;
  phaseNumber: number;
}): boolean {
  return (
    input.flagEnabled && input.resolutionReadEnabled && input.phaseNumber >= 3
  );
}

function standingFor(
  resolution: CharterAssumptionResolutionRecord | null,
): PostDiscoverCharterStanding | null {
  if (!resolution) return "unvalidated";
  // `confirmed` — Discover checked it and the answer stands. `superseded` —
  // approved evidence now covers it. Neither is a caveat a later phase needs.
  if (resolution.outcome === "corrected") return "known_wrong";
  return null;
}

/**
 * The charter answers a phase after Discover should carry a caveat on, in
 * canonical charter order.
 *
 * `null` and `[]` are deliberately different, matching the rest of the family:
 * `null` means the surface is not active and the host renders nothing, which
 * is how flag-off reads byte-for-byte as today. `[]` means the surface IS
 * active and every charter answer either came from approved evidence, was
 * asserted outright, or had its assumption resolved cleanly — a real and
 * reportable all-clear, not an absence of information.
 *
 * A field appears only while `readP1CharterBasisRecord` still accepts its
 * stored basis against the answer the row currently carries. An answer edited
 * after its basis was declared therefore drops out entirely: it no longer has
 * a declared basis at all, so this module knows nothing about it and says
 * nothing about it, rather than inheriting a judgement about older wording.
 */
export function charterStandingAfterDiscover(input: {
  active: boolean;
  modules: readonly CharterCaptureModuleState[];
}): PostDiscoverCharterAnswer[] | null {
  if (!input.active) return null;
  const rows: PostDiscoverCharterAnswer[] = [];
  for (const family of P1_CHARTER_EVIDENCE_FAMILIES) {
    const moduleRow = input.modules.find(
      (entry) => entry.moduleKey === `phase_1_${family.sectionKey}`,
    );
    if (!moduleRow) continue;
    const rawValue = moduleRow.state?.value;
    const answer = typeof rawValue === "string" ? rawValue : "";
    const basis = readP1CharterBasisRecord(
      moduleRow.state,
      family.sectionKey,
      answer,
    );
    if (basis?.kind !== "assumption") continue;
    const resolution = readCharterAssumptionResolutionRecord(
      moduleRow.state,
      family.sectionKey,
      answer,
    );
    const standing = standingFor(resolution);
    if (standing === null) continue;
    const base = {
      sectionKey: family.sectionKey,
      label: family.label,
      answer,
      owner: basis.owner,
      recordedAt: basis.recordedAt,
    };
    if (standing === "known_wrong") {
      // `standingFor` returns `known_wrong` only off a readable resolution.
      const resolved = resolution as CharterAssumptionResolutionRecord;
      rows.push({
        ...base,
        standing: "known_wrong",
        correction: resolved.note,
        resolvedAt: resolved.resolvedAt,
      });
      continue;
    }
    rows.push({
      ...base,
      standing: "unvalidated",
      plannedValidation: basis.p2ValidationPlan,
    });
  }
  return rows;
}

/**
 * The standing against one charter field, or `null` when it carries none.
 *
 * The point of the lookup is the point of use: P4 quoting the charter's value
 * claim needs to know about THAT field, not to render a portfolio panel. It
 * takes the already-computed list so a surface cannot accidentally run a
 * second, differently-configured read beside the one it is displaying.
 */
export function charterStandingForSection(
  rows: readonly PostDiscoverCharterAnswer[] | null,
  sectionKey: string,
): PostDiscoverCharterAnswer | null {
  if (!rows) return null;
  return rows.find((row) => row.sectionKey === sectionKey) ?? null;
}

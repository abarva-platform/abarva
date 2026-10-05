import type { P1CharterBasisInput } from "./p1-charter-evidence";

/**
 * The link between fill-from-notes (`moves_capture_notes_v1`) and the per-field
 * charter basis (`moves_charter_basis_v1`).
 *
 * Both halves already exist. The notes panel classifies a note-derived fill as
 * a workspace assertion and says so in words, but until now it did not write
 * that basis into the `p1_charter_basis` map the charter control reads — so a
 * person inserting from notes on P1 filled the value and then declared the
 * basis again, by hand, for a field whose provenance was already known.
 *
 * This module is the decision alone, kept pure and separate from both surfaces
 * so each branch can be pinned on its own. It is deliberately conservative:
 *
 * - it NEVER overwrites a basis the person already declared. An approved-evidence
 *   basis must not be silently downgraded to an assertion, and an assumption
 *   must not lose its owner and its Discover validation plan, just because text
 *   was pasted into the field afterwards.
 * - it records only `workspace_assertion`. Notes a consultant typed after a
 *   conversation are their account of it; an insert can never produce approved
 *   evidence, and it must not guess at an assumption's owner.
 * - with the basis surface off it decides nothing, so the notes panel behaves
 *   byte-for-byte as it does today.
 */
export type NotesInsertBasisReason =
  /** A basis was not recorded: the charter basis surface is not active here. */
  | "basis_surface_off"
  /** A basis was not recorded: this field's answer carries no charter basis. */
  | "not_a_charter_field"
  /** A basis was not recorded: the person already declared one for this field. */
  | "basis_already_declared"
  /** A basis WAS recorded, as the person's own assertion. */
  | "recorded_assertion";

export interface NotesInsertBasisDecision {
  /** The basis to record for this insert, or null when this insert records none. */
  basis: P1CharterBasisInput | null;
  /** Why — drives both the panel's wording and the release record's claim. */
  reason: NotesInsertBasisReason;
}

export interface NotesInsertBasisArgs {
  /** Canonical phase-capture section key the insert is writing into. */
  sectionKey: string;
  /**
   * True when the per-field charter basis control is rendering for this phase
   * — i.e. `moves_charter_basis_v1` is on for the tenant AND this is P1.
   */
  basisSurfaceActive: boolean;
  /** Section keys whose answers carry a charter basis on this phase. */
  charterBasisSectionKeys: ReadonlySet<string>;
  /** The basis already recorded against this field, if any. */
  existingBasis: P1CharterBasisInput | null | undefined;
}

/**
 * Decide what basis, if any, an insert-from-notes records on a field.
 *
 * The four branches are ordered by how much they are allowed to assume, widest
 * first, so a caller reading the reason gets the narrowest true statement.
 */
export function basisForNotesInsert(
  args: NotesInsertBasisArgs,
): NotesInsertBasisDecision {
  if (!args.basisSurfaceActive) {
    return { basis: null, reason: "basis_surface_off" };
  }
  if (!args.charterBasisSectionKeys.has(args.sectionKey)) {
    return { basis: null, reason: "not_a_charter_field" };
  }
  if (args.existingBasis) {
    return { basis: null, reason: "basis_already_declared" };
  }
  return { basis: { kind: "workspace_assertion" }, reason: "recorded_assertion" };
}

/**
 * The section keys on this phase where an insert WOULD record a basis — what
 * the notes panel needs so its per-proposal wording is true of that field
 * rather than true in general.
 */
export function notesInsertBasisRecordingKeys(args: {
  basisSurfaceActive: boolean;
  charterBasisSectionKeys: ReadonlySet<string>;
  basisBySection: Readonly<Record<string, P1CharterBasisInput>>;
}): readonly string[] {
  if (!args.basisSurfaceActive) return [];
  return [...args.charterBasisSectionKeys].filter(
    (key) =>
      basisForNotesInsert({
        sectionKey: key,
        basisSurfaceActive: true,
        charterBasisSectionKeys: args.charterBasisSectionKeys,
        existingBasis: args.basisBySection[key] ?? null,
      }).basis !== null,
  );
}

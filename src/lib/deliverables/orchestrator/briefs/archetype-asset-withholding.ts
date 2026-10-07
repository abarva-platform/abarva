// Which deliverable types do NOT receive the archetype pack's exhibits and
// tables, and why each one is withheld.
//
// `composeBrief` (artifact-brief-registry.ts) joins a declared STRUCTURE with
// an archetype PACK. The pack's exhibits and tables are what make the same
// deliverable type look different for one use case than another, so the
// default is that a structure receives them. A few deliverables must not:
// they are approval instruments or facilitation documents, and a deck's
// exhibits in those is content the artifact is not for.
//
// This lived as a two-literal inline expression inside `composeBrief`
// (`!== "charter" && !== "design_workshop_guide"`). Two problems with that
// shape, both of which bite as soon as a third type needs withholding. The
// reason for each exclusion was recorded nowhere, so a later reader could not
// tell a deliberate withholding from an accident; and the condition read as a
// property of `composeBrief` rather than of the deliverable, so the question
// "does this artifact carry the archetype's exhibits?" had no answer anyone
// could look up or test.
//
// So the set is declared here with a stated reason per entry. Adding a type is
// a declaration, and removing one reads as a change.

/** A deliverable type the archetype pack's exhibits and tables are withheld from. */
export interface ArchetypeAssetWithholding {
  deliverableType: string;
  /** Why this artifact does not carry a use case's exhibits or tables. */
  reason: string;
}

/**
 * The withheld set, by deliverable type as PRODUCTION asks for it — i.e. the
 * orchestrator spelling that `orchestratorDeliverableType` resolves a registry
 * key to, which is what `composeBrief` is handed.
 */
export const ARCHETYPE_ASSET_WITHHELD: readonly ArchetypeAssetWithholding[] = [
  {
    deliverableType: "charter",
    reason:
      "A P1 approval instrument. It authorizes and bounds Discovery and states the hypothesis; it is not a place to assert the client facts a use case's exhibits present, and its own sections instruct the model not to carry P2 findings.",
  },
  {
    deliverableType: "design_workshop_guide",
    reason:
      "A P2 facilitation document — a session plan and an evidence ask, not a readout. It grounds its carry-forward sections in the archetype's evidence families, which is a separate question from whether it carries a deck's exhibits.",
  },
  {
    deliverableType: "mobilization_workshop_guide",
    reason:
      "A P4 facilitation document, withheld for the same reason as its P2 precedent: it plans the mobilization sessions and names what must be produced in them. The exhibits belong to the roadmap and business case it prepares sessions about.",
  },
  {
    deliverableType: "execution_kickoff_guide",
    reason:
      "A P5 facilitation document for the first execution cadence. It carries the approved handoff's commitments forward and sets the review rhythm; the exhibits belong to the handoff package and value-measurement contract it reads from.",
  },
] as const;

const WITHHELD_TYPES: ReadonlySet<string> = new Set(
  ARCHETYPE_ASSET_WITHHELD.map((entry) => entry.deliverableType),
);

/**
 * True when the archetype pack's exhibits and tables must NOT be joined into
 * this deliverable's brief. A structure's OWN `expectedExhibits` and
 * `expectedTables` are properties of the artifact type and are unaffected.
 */
export function withholdsArchetypeAssets(deliverableType: string): boolean {
  return WITHHELD_TYPES.has(deliverableType);
}

/** The stated reason, for a surface that needs to explain the withholding. */
export function archetypeAssetWithholdingReason(
  deliverableType: string,
): string | null {
  return (
    ARCHETYPE_ASSET_WITHHELD.find(
      (entry) => entry.deliverableType === deliverableType,
    )?.reason ?? null
  );
}

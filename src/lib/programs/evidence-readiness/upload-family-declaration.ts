import type {
  MoveEvidenceNeedPacket,
  MoveEvidenceNeedPriority,
} from "./move-evidence-need-packet";

/**
 * What an evidence upload on a Move phase surface may declare it covers.
 *
 * A declared family is the only statement of identity the coverage reader
 * trusts: `evaluateDiscoveryEvidenceReadiness` takes the declaration when
 * there is one and falls back to keyword inference when there is not. For
 * archetypes whose families carry no keyword list, that fallback decides a
 * family on an exact id-as-words or full-label phrase match, so an undeclared
 * file is as likely to be filed under the wrong family as under none.
 *
 * Declaring routes review and nothing else. Coverage still counts only
 * evidence a human has approved (`loadDiscoveryEvidenceReadiness` reads
 * `decision = 'approved'`), so offering the declaration cannot clear a gate,
 * advance a phase, or stand in for review.
 */
export interface EvidenceUploadFamilyOption {
  id: string;
  label: string;
}

export interface EvidenceUploadDeclarationState {
  /**
   * The families a file uploaded from this surface may declare, each once, in
   * the order the Move's need packets name them.
   */
  options: EvidenceUploadFamilyOption[];
  /**
   * Required families this surface asks the user to supply while offering no
   * way to declare them. Non-empty is a dead end: the instruction on screen
   * cannot be carried out from the control beside it, and every file uploaded
   * there falls to inference instead.
   */
  undeclarableRequiredFamilyIds: string[];
}

type NeedPacketIdentity = Pick<
  MoveEvidenceNeedPacket,
  "familyId" | "evidenceSlot"
> & { priority?: MoveEvidenceNeedPriority };

/**
 * The declarable families for a Move, deduplicated by family id.
 *
 * Packets are 1:1 with the blueprint's evidence families, but a family can be
 * named by more than one packet when several artifacts are blocked on it, so
 * the first mention wins and later ones are dropped rather than repeated in
 * the picker.
 */
export function declarableEvidenceUploadFamilies(
  needPackets: ReadonlyArray<NeedPacketIdentity>,
): EvidenceUploadFamilyOption[] {
  const seen = new Set<string>();
  const options: EvidenceUploadFamilyOption[] = [];
  for (const packet of needPackets) {
    if (!packet.familyId || seen.has(packet.familyId)) continue;
    seen.add(packet.familyId);
    options.push({ id: packet.familyId, label: packet.evidenceSlot });
  }
  return options;
}

/**
 * Whether an upload surface can declare every required family it asks for.
 *
 * `offeredFamilyIds` is what the surface actually renders in its picker, not
 * what the Move needs — a surface that is handed no options, or hides the
 * picker, offers none of them.
 */
export function evidenceUploadDeclarationState(input: {
  needPackets: ReadonlyArray<NeedPacketIdentity>;
  offeredFamilyIds?: ReadonlyArray<string>;
}): EvidenceUploadDeclarationState {
  const options = declarableEvidenceUploadFamilies(input.needPackets);
  const offered = new Set(
    input.offeredFamilyIds ?? options.map((option) => option.id),
  );
  const undeclarableRequiredFamilyIds: string[] = [];
  const counted = new Set<string>();
  for (const packet of input.needPackets) {
    if (!packet.familyId || counted.has(packet.familyId)) continue;
    if (packet.priority !== "required") continue;
    counted.add(packet.familyId);
    if (!offered.has(packet.familyId)) {
      undeclarableRequiredFamilyIds.push(packet.familyId);
    }
  }
  return { options, undeclarableRequiredFamilyIds };
}

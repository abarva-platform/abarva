// Which deliverables "belong to" a Move phase — the single source of truth for
// per-phase deliverable/artifact counting in the phase workspace.
//
// History: surfaces counted per-phase deliverables three different ways — a
// brittle `p{n}_` naming convention (the phase workspace), the single
// `PHASE_WORKFLOW[n].deliverableTypeKey` gate key, and the registry's full
// `PHASE_CANONICAL_KEYS[n]` set (the Documents panel). They disagreed (a
// generated charter counted 0 on the workspace but 1 in the File Cabinet; P3/P4
// undercounted because they have several canonical deliverables, not one gate
// deliverable). This helper makes every surface agree by matching against the
// canonical key SET for the phase (`PHASE_CANONICAL_KEYS`), with the legacy
// `p{n}_` / `_p{n}` convention kept as a back-compat fallback.

/**
 * True when a deliverable `typeKey` belongs to phase `phaseNum`.
 *
 * @param phaseDeliverableKeys the canonical deliverable type keys for the phase
 *   (pass `PHASE_CANONICAL_KEYS[phaseNum]`). A single string is also accepted
 *   for callers that only have the phase's gate deliverable key.
 */
export function deliverableBelongsToPhase(
  typeKey: string,
  phaseNum: number,
  phaseDeliverableKeys?: readonly string[] | string | null,
): boolean {
  if (!typeKey) return false;
  const keys = Array.isArray(phaseDeliverableKeys)
    ? phaseDeliverableKeys
    : phaseDeliverableKeys
      ? [phaseDeliverableKeys as string]
      : [];
  if (keys.includes(typeKey)) return true;
  return (
    typeKey.startsWith(`p${phaseNum}_`) || typeKey.includes(`_p${phaseNum}`)
  );
}

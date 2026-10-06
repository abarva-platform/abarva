// How a brief's exhibits and tables are JOINED from the two catalogs.
//
// `composeBrief` builds every non-bespoke brief from two independent
// declarations: a DELIVERABLE STRUCTURE (what this artifact type always needs,
// regardless of use case) and an ARCHETYPE PACK (what this use case needs,
// regardless of artifact type). Both may name exhibits, and — since a
// deliverable type may now declare tables too — both may name tables.
//
// The join rule lives here rather than inline in `composeBrief` for two
// reasons:
//
//  1. The exhibit join and the table join must not drift. They were written
//     months apart and already had drifted: exhibits concatenated both sides
//     while tables ignored the structure entirely, which is the asymmetry this
//     module exists to remove.
//  2. Both sides are becoming OPERATOR-AUTHORED. `loadArchetypePackCatalog`
//     validates a configured pack's shape but cannot know which keys a
//     structure already declares, so a configured pack is free to name
//     `estimate_basis_buildup` and collide with the structure that declares it.
//     A duplicate key is not harmless: `quality-validator` prints
//     `N of M received` straight off the expectation array's length, so a
//     duplicate inflates M and the shortfall can never close, and the greedy
//     one-to-one match then names an exhibit that WAS delivered as missing.
//
// The rule is the same for both asset kinds: concatenate structure-first, then
// keep the FIRST entry per key. Structure-first because the artifact type's own
// contract is the more specific claim — a Requirements Traceability document
// needs its traceability matrix whichever use case it is written for — and
// because it preserves the ordering the prompt and the retrieval query builder
// already see.
//
// Collisions are reported as well as resolved (`assetKeyCollisions`) so an
// operator who configures a colliding pack can be told, rather than having one
// of their two declarations silently disappear.

export interface KeyedArtifactAsset {
  key: string;
}

/**
 * Join two declarations of the same asset kind, structure first, keeping the
 * first entry per key.
 *
 * Returns a new array; neither input is mutated. Entries with a blank key are
 * kept as-is and never deduplicated against each other — a missing key is a
 * contract defect for the schemas to refuse, and silently collapsing two
 * key-less assets into one would hide it.
 */
export function composeArtifactAssets<T extends KeyedArtifactAsset>(
  fromStructure: readonly T[],
  fromArchetypePack: readonly T[],
): T[] {
  const seen = new Set<string>();
  const composed: T[] = [];
  for (const asset of [...fromStructure, ...fromArchetypePack]) {
    const key = asset.key?.trim() ?? "";
    if (!key) {
      composed.push(asset);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    composed.push(asset);
  }
  return composed;
}

/**
 * The keys both sides declared, in structure order. Empty for every shipped
 * structure × pack pair; non-empty only once one side is configured.
 */
export function assetKeyCollisions(
  fromStructure: readonly KeyedArtifactAsset[],
  fromArchetypePack: readonly KeyedArtifactAsset[],
): string[] {
  const packKeys = new Set(
    fromArchetypePack.map((a) => a.key?.trim() ?? "").filter(Boolean),
  );
  const collisions: string[] = [];
  for (const asset of fromStructure) {
    const key = asset.key?.trim() ?? "";
    if (key && packKeys.has(key) && !collisions.includes(key))
      collisions.push(key);
  }
  return collisions;
}

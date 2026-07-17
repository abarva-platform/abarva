# Move Context Extract Invalidation

The Move Context Extract can be reused only when its stored freshness metadata still matches the current approved evidence posture.

Freshness now includes:

- `evidenceFingerprint`
- `attachedEvidenceCount`
- `acceptedEvidenceCount`
- `latestEvidenceUpdatedAt`
- `blueprintId`
- `blueprintVersion`
- `sourceMode`

If approved evidence changes, review timestamps change, source mode changes, or the selected blueprint changes, the current extract is treated as stale and a new File Cabinet artifact is created. The prior artifact id is preserved in metadata as `previousMoveContextExtract`.

This prevents the observed failure where Approve & Build reused an old extract with `attachedEvidenceItems = []` after evidence existed elsewhere in the Move.


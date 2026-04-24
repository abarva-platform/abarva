# Build Slice Manifests

This folder is reserved for per-slice planning packets.

The machine-readable source of truth for the first ten slices is:

```text
docs/build/build-slices.json
```

Use this folder when a slice needs a fuller human-readable plan, review packet, or post-merge verification note.

Recommended file naming:

```text
S0_REPO_GUARDRAILS_AND_PR_PACKET.md
S1_CONTEXT_BUNDLE_CONTRACTS.md
S2_CONTEXT_SCORING_CLASSIFIER.md
```

Each slice packet should include:

- Slice ID and goal.
- Allowed files.
- Forbidden files.
- Dependencies.
- Acceptance criteria.
- Validation commands.
- Risks and rollback notes.
- Final verification checklist.

Do not use this folder for broad product strategy or unrelated planning docs.

# 2026-08-29-meridian-package-regenerate — Regenerate the Meridian package with the widened canonical

## Release ID

`2026-08-29-meridian-package-regenerate`

## Status

`candidate`

## Plain-English Summary

`2026-08-29-tower-case-attribute-widening` (PR #7016) changed the generator so the canonical
projection stops discarding attributes the products need. This regenerates the committed package
with that generator, so the checked-in files match the code that produces them.

Exactly two data files change, and only by gaining columns:

- `canonical_ai_use_cases.csv` gains `gating_constraint`, `cost_to_build_low_usd`,
  `cost_to_build_high_usd`, `business_sponsor_role`.
- `canonical_tools.csv` gains `control_blocker`, `business_owner_role`.

No existing column, row count or value changes. The two manifests update their hashes to match.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 1 package (committed artifact):** regenerated. Row counts unchanged — 42 use cases,
  13 tools, 987 canonical objects in total.
- No application code changes.

## Client Applicability

- All clients: no runtime change. This updates a committed synthetic package for one tenant.
- Feature flag: none.

## Changes Included

- `.../layer_3_canonical/canonical_ai_use_cases.csv`
- `.../layer_3_canonical/canonical_tools.csv`
- `.../package_manifest.json`, `.../proof_manifest.json`

## QA / Validation

- `node scripts/tower/generate-meridian-layer1-source.mjs` → completed, wrote the package.
- `node scripts/tower/validate-meridian-layer1-source.mjs` → all checks PASS, zero failures.
  (The generator clears the validation outputs as it writes; re-running the validator restores
  them, which is why both scripts run in sequence.)
- Column presence verified directly on the emitted CSVs: `gating_constraint` at position 19 of
  the use-case file, `control_blocker` at position 14 of the tool file.
- Diff confined to the four files above; no other package file changed.
- `node scripts/release-check.mjs --base origin/main --head HEAD` → passes with this record.

## Rollout Plan

Merge to `main` by squash. No runtime effect on its own. The regenerated package becomes visible in
a product only after the Layer 3 and Layer 4 governed ACA jobs are re-run for the tenant and the
readback passes.

## Deployment Authority

- Repo-owned deploy workflow: unchanged.
- Shared runtime mutators: none. No `az` command in this release.
- Data-plane jobs: Layer 3 then Layer 4, through the governed operator job, with readback and the
  semantic count gate. **Not performed by this release** — it needs the named operator approval the
  data-build job rule requires.
- Live signed-in proof required: after those jobs, a capture showing a real `gating_constraint` on
  a case.

## Rollback Plan

Revert the squash commit to restore the previous package files. No schema or runtime change; the
loaders read whatever columns the package carries, and older columns are unaffected.

## Audit Evidence

- The four-file diff.
- Generator and validator output.

## Known Gaps

- Not live-proven; `candidate`.
- **The data plane is untouched.** Azure still holds the pre-widening canonical rows until the
  Layer 3 and Layer 4 jobs run.
- Only the Meridian package is regenerated. Any other tenant package built by a different generator
  keeps its current columns.

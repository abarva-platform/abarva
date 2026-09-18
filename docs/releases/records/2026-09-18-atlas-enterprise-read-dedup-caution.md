# 2026-09-18-atlas-enterprise-read-dedup-caution — Atlas carries the data-quality caution through lead de-duplication

## Release ID

`2026-09-18-atlas-enterprise-read-dedup-caution`

## Status

`candidate`

## Plain-English Summary

When the Tower advisor leads an answer with the derived enterprise read, it also prints that
artifact's own data-quality caution — the artifact's statement of what it is unsure about, for
example that an application inventory is only partly attested. Printing the read's headline while
dropping that caution quotes the read more confidently than the read claims to be.

A de-duplication branch exists so the headline is not printed twice when the answer producer has
already emitted it. That branch returned the answer completely unchanged, so it dropped the caution
as well — on exactly the answers that lead with the read, which are the ones that most need it.

Only the headline is the duplicate. The caution now survives de-duplication: it is appended once,
scrubbed by the same autonomous-decision sanitiser as every other line the orchestrator authors,
and it is not restated when the answer already carries it. When the read declares no caution, the
de-duplicated answer is returned byte-identical, as before.

## Layer Impact

Release lane: `global-control-lane` — shared advisor answer behaviour for all clients, not
feature-gated.

- **Layer 4 (Products — Tower):** the Atlas advisor answer text. A governed disclosure that was
  silently omitted on one branch now renders. No change to any metric, value or calculation —
  Tower read models still own every number; this is narrative governance only.
- Layers 1–3 unchanged. No schema, loader, adapter or canonical-model change.

## Client Applicability

- All clients: yes — any tenant whose Atlas answer leads with a derived enterprise read that
  declares a data-quality caution.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The behaviour is unconditional, like the caution on the non-de-duplicated
  branch it now matches.

## Changes Included

- `src/lib/atlas/orchestrator.ts` — `enrichWithEnterpriseRead` sanitises the caution once, and the
  de-duplication branch carries it instead of returning early. Doc comment records why.
- `src/lib/atlas/__tests__/orchestrator-enterprise-read-enrichment.test.ts` — four tests over the
  de-duplication branch.

## QA / Validation

Behavioural, driving the real `runAtlasTurnDetailed`. `@/lib/ai-liability/human-decision-controls`
is deliberately left unmocked, so the real sanitiser runs.

- **Suite before → after:** 2 failed / 9 passed (11 total) before the fix → 0 failed / 11 passed
  after. The two that failed are the two requiring the fix; the other two new tests pass on the
  unfixed code by design — they are the guardrails that an over-broad fix would break.
- **Mutation checks — four, each caught:**
  1. de-duplication branch restored to its unchanged early return → 2 failed.
  2. caution no longer passed through the sanitiser → 1 failed.
  3. already-present check removed, so the caution is restated → 1 failed.
  4. caution line emitted when the read declares none → 1 failed.
- **Scope baseline, same scope both times:** `npx jest src/lib/atlas` — 2 failing / 239 passing
  (241) on clean `main`; 2 failing / 243 passing (245) after. The same two pre-existing failures
  (`orchestrator-governed-tower.test.ts`, plus one suite that fails to run) before and after,
  confirmed by stashing the change and re-running. Not caused here and not addressed here.
- **Typecheck:** `rm -f tsconfig.tsbuildinfo && NODE_OPTIONS=--max-old-space-size=6144 npx tsc
  --noEmit --pretty false` → **exit 0**, 0 diagnostics. Build-info removed before the run, and the exit code
  judged, not a grep over the output.
- **Lint:** `npx eslint` over both changed files → exit 0, no findings.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds the image and shifts traffic. No
migration, no data build, no flag, no job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by that workflow; recorded below once the run completes.
- ACA runtime invariant: to be proven after deploy — Container App template image must equal the
  100%-traffic revision image, digest-pinned.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — a signed-in Tower answer that leads with a derived
  enterprise read carrying a declared caution.

## Rollback Plan

Revert the PR and let the deploy workflow redeploy, or shift ACA traffic back to the prior
digest-pinned revision. Application-layer only, so rollback is immediate and carries no data
constraint.

## Audit Evidence

- PR and its CI run.
- `src/lib/atlas/__tests__/orchestrator-enterprise-read-enrichment.test.ts` — the four
  de-duplication cases and the mutation results above.
- Post-merge: deploy run id, image digest, revision name and health.

## Known Gaps

- Signed-in acceptance is **owed**, not done. It is a read-only check and safe to run, but it needs
  a signed-in session and a tenant whose current derived enterprise read declares a caution; no
  human was present on this run to drive it. Status is `merged`, then `deployed` — not
  `live-proven`.
- Placement is a judgement call: the caution is appended after the answer rather than spliced
  beside the headline, which the producer wrote and whose shape the orchestrator cannot assume. The
  control is that the caution is present exactly once; where it sits was not dictated by the
  requirement.
- The lead's recommended move is still dropped in the de-duplication branch. That is a
  recommendation, not a governance disclosure, and was left as-is rather than widened into this
  change.

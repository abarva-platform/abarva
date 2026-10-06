# 2026-10-03-home-narrative-decimal-integrity — Home narrative guard no longer splits a decimal figure

## Release ID

`2026-10-03-home-narrative-decimal-integrity`

## Status

`candidate`

## Plain-English Summary

The executive cockpit prints generated narrative. On the way out, that narrative passes through a
guard whose job is to drop any sentence that conflicts with the records currently loaded. The guard
worked by cutting the text into sentences, discarding the conflicting ones, and re-joining what was
left with a single space.

Its sentence-cutter treated every period as the end of a sentence, including the period inside a
number. So a figure like a percentage, a currency magnitude or a bare ratio was cut in half, and the
re-join put a space in the middle of the number. An executive read a figure with a space inside it,
while the guard reported that it had run successfully.

There were two consequences, and only the first was visible.

1. **A corrupted figure on the landing surface.** Measured over the published narrative for both
   reviewed tenants, the text on disk contains no broken figure and the guard introduced **45** of
   them.

2. **A correctness failure in the guard itself.** A conflicting statement cut in half is judged as
   two half-sentences. The half that matches the guard's rule is dropped and the other half survives
   into the rendered narrative — so the guard could leave a fragment of exactly the claim it exists
   to remove. This was found by the new suite, not by reading the code, and it is the more serious
   of the two.

The fix is in the step that cuts, not at display time: a period ends a sentence unless it sits
directly between two digits. Repairing this at display time was considered and rejected — it would
have left the pipeline still producing broken text and every other consumer of that text (export,
copy to clipboard, model prompt) still holding the broken form, which is the laundering this
surface already has a control against.

The sentence-cutter now lives in one module. A byte-identical copy on the Home answer path, which
re-joined the same way and had the same two failure modes, now uses it.

## Layer Impact

Release lane: **`global-control-lane`** — shared app behaviour for all clients, not feature-gated.

- **Layer 4 (Products — Home).** Presentation and narrative-integrity only. No metric, value or
  count is computed, re-derived or altered; this change can only stop characters being inserted into
  or removed from already-published text.
- **Layer 3 (Canonical model).** Untouched. No schema, loader, projection, migration or read model
  changes.

## Client Applicability

- All clients: yes — any tenant whose Home narrative renders through the guard.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This corrects an existing always-on code path.

## Changes Included

- `src/lib/home/preview/narrative-sentences.ts` (new) — the single decimal-safe sentence tokenizer,
  plus a shared definition of "broken decimal" so the code and its test do not each invent one.
- `src/lib/home/preview/stale-claim-guard.ts` — the proven defective path; now uses the shared
  tokenizer.
- `src/lib/home/preview/ava-answer.ts` — three call sites carrying a byte-identical copy of the old
  tokenizer, all re-joining with a space; now use the shared one.
- `src/__tests__/behaviors/home-narrative-decimal-integrity.test.ts` (new) — behavioural suite.

No migration, no route change, no workflow change, no dependency change.

## QA / Validation

**Red first, over the real path.** The suite drives the real guard, not a mock, and loads the real
published narrative for both reviewed tenants rather than a crafted fixture.

- Reproduction before any edit: the three figure shapes named in the defect, fed through the guard's
  own tokenizer, emitted every one of the five broken strings that had been observed signed in,
  character for character.
- Corpus measurement, both directions: broken figures in the published narrative **before** the
  guard `0`; **after** the guard `45` (19 + 26 across the two reviewed tenants). The baseline is read
  from disk, so a surviving break cannot be attributed to the generator.
- Suite: **7 failed / 6 passed before → 15 passed / 0 failed after.** Two cases were added after the
  first mutation sweep (below), taking the count from 13 to 15.
- The suite guards itself: one case asserts the published corpus actually contains decimal figures,
  so the zero-broken assertion cannot pass vacuously on a corpus with nothing to break.
- The suite also asserts the guard **still decides at sentence granularity** — a stale sentence is
  dropped and its neighbours kept. A fix that simply stopped splitting would satisfy every
  figure-integrity assertion while silently disabling the guard.

**Mutation proof — six mutations, six caught** (failures out of 15):

| Mutation | Caught |
|---|---|
| M1 restore the original tokenizer | 10 failed |
| M2 drop the preceding-digit lookbehind | 2 failed |
| M3 the lazy fix — never split at all | 6 failed |
| M4 unwire the guard from the shared tokenizer | 8 failed |
| M5 drop the trailing-digit lookahead | 1 failed |
| M6 stop trimming the split sentences | 3 failed |

**M2 survived the first sweep and that is recorded on purpose.** With only 13 cases, narrowing the
rule from "a period between two digits" to "a period before a digit" passed everything. A surviving
mutation means either the test is blind or the guard is redundant, so the discriminating case was
established by execution before deciding which: with the lookbehind, `"…concentrated.4 of 12
contracts are unavailable…"` splits into two sentences; without it, the boundary disappears and the
whole thing becomes one sentence. That is not cosmetic — it is the same failure as consequence (2)
above, since a conflicting claim beginning with a digit would then be swallowed into its neighbour
and escape the filter. The guard is therefore necessary, and two cases now prove it at both the unit
and the behavioural level.

**Scope baseline, same scopes, measured on a clean checkout of the same base commit:**

| Scope | Failing before | Failing after |
|---|---|---|
| `src/lib/home/preview` | 0 (191 passing) | 0 (191 passing) |
| `src/components/home/v4` | 0 (467 passing) | 0 (467 passing) |
| `src/__tests__/behaviors` | 0 (1905 passing) | 0 (1920 passing — the 15 added here) |

- Typecheck: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` after deleting
  `tsconfig.tsbuildinfo` — **exit 0**, zero diagnostics. The build-info is removed first because a
  stale one has previously both invented and hidden diagnostics on this repository.
- Scoped ESLint over the four changed files — exit 0, no findings.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see Audit Evidence.

**Rebase note.** A Home pull request merged to `main` during this work and touched one of the same
files. The branch was rebased onto it, all three edited call sites were re-verified as present
afterwards, and every number above was re-measured on the rebased base rather than carried forward
from the pre-rebase run.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow then builds and deploys the
resulting commit. No migration to apply, no flag to set, no worker job to run.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, triggered by the squash merge.
- Shared runtime mutators: none. This change contains no Azure command, no workflow edit, no env or
  flag change, and no image reference.
- Approved image digest: produced by the deploy workflow for the merge commit; recorded below once
  the run completes.
- ACA runtime invariant: to be proven after the deploy — Container App template image, the
  100%-traffic revision image and the required worker job images must all equal the approved digest.
- Worker image invariant: unchanged by this release; asserted as part of the invariant check.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes, and it is not claimed here.** Correcting the figures is
  provable in code and over the published corpus; that the corrected figures render to a signed-in
  executive is a separate proof lane and is owed. This record says `deployed`, never `live-proven`.

## Rollback Plan

Revert the squash commit and let the deploy workflow redeploy the previous commit. There is no
migration, no data write and no persisted state, so the revert is complete and carries no
constraint. The behavioural change is confined to one tokenizer: reverting restores the previous
text exactly, including the defect.

## Audit Evidence

- Pull request and its CI checks, including the behaviour-coverage gate.
- `scripts/release-check.mjs` output for this record.
- The new suite's own output, which prints the corpus counts it asserts, so the 45-to-0 measurement
  is reproducible from a test run rather than taken on trust from this document.
- The deploy workflow run for the merge commit, and the runtime-invariant read of template digest
  against the 100%-traffic revision digest.

## Known Gaps

- **Signed-in proof is owed, not claimed.** See Deployment Authority.
- **One further copy of the old tokenizer remains, deliberately untouched.** `sentenceList` in
  `src/components/home/HomeSurface.tsx` carries the same pattern. It never re-joins, so it cannot
  insert a space; it selects a single sentence, so its failure mode is a *truncated* figure rather
  than a spaced one. It was left alone because that component, and both components in its import
  chain, are listed in `docs/architecture/unreachable-components.json` and the chain has no route
  entry — so it corrupts nothing today, and importing from or mounting a dead file to satisfy a
  tidiness goal is a move this repository has been bitten by before. A successor item is filed in the
  execution backlog recording the mechanism, so the repair is attached to whatever decision mounts or
  deletes that component rather than performed blind now.
- The guard's rule set itself is unchanged. Which statements count as conflicting is out of scope
  here; this release only ensures the guard judges whole sentences.

# 2026-09-19-agent-identifier-placeholder — One placeholder for a scrubbed identifier, on both passes

## Release ID

`2026-09-19-agent-identifier-placeholder`

## Status

`candidate`

## Plain-English Summary

When an agent answer mentions an internal record id, the product removes the id and
puts a short phrase in its place so a reader is not shown raw plumbing. That removal
happens twice on every answer: once on the text a reader watches arrive token by
token, and once on the settled answer that replaces it a moment later. The two passes
are written in two different modules, and for one class of identifier they had been
using two different phrases.

The result was visible, not theoretical. The same sentence read

- while arriving: `… is overdue on record the referenced record.`
- once settled:   `… is overdue on record the referenced item.`

so the wording changed under the reader for no reason they could see. Every other
identifier class already agreed; this one had drifted because each module carried its
own copy of the phrase.

Both modules now read the phrase from one exported constant, so they cannot disagree
again. Nothing about which identifiers are removed changed — only the words put in
their place, and only on the streaming pass, which now says what the settled pass has
been saying.

## Layer Impact

- `global-control-lane`. Shared answer-shaping behaviour for every agent surface, not
  gated by a flag and not client-specific.
- No data plane: no schema, migration, projection, loader, adapter or stored value is
  touched, and no tenant row is read or written by this change.
- Layer 4 (products) only, and only in how an already-scrubbed sentence is worded.
  Layer 3 canonical objects are not involved.

## Client Applicability

- All clients: yes — this is shared answer shaping with no per-client branch.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is unconditional and the behaviour it replaces was
  also unconditional.

## Changes Included

- `src/lib/answer/shared-response-shaper.ts` — exports
  `UNMAPPED_IDENTIFIER_PLACEHOLDER` and builds its own follow-up cleanup expressions
  from it, so a future rename cannot leave those expressions matching the old wording.
- `src/lib/agent/output-discipline/response-contract.ts` — imports that constant
  instead of carrying a second literal.
- `src/__tests__/behaviors/agent-identifier-placeholder-consistency.test.ts` — new.
  Drives both real shapers and asserts they agree, plus three guardrails saying what
  they have to agree on.
- `src/lib/agent/__tests__/response-shape.test.ts` — the assertion that had been red on
  `main` is updated in place, with the reason written beside it rather than the case
  deleted.

## QA / Validation

Every command below was judged by its exit code, and `tsconfig.tsbuildinfo` was removed
before the typecheck.

**The defect, measured before any edit** on clean `origin/main` `ce99d7312`, by calling
the two real shapers on one input rather than by reading the source: settled returned
`"…on record the referenced item."`, streaming returned `"…on record the referenced
record."`. The other classes were measured in the same pass and already agreed
(`the referenced portfolio signal`, `the cited pattern`).

**New suite, identical six cases either side: 1 failed / 5 passed before → 0 failed /
6 passed after.**

**Six mutations of the real modules, each restored byte-identical afterwards:**

| # | Mutation | Result |
|---|---|---|
| 1 | The contract repair goes back to its own literal | 1 failed / 5 passed — caught |
| 2 | The shaper hard-codes a different phrase for the id class only | 1 / 5 — caught |
| 3 | The contract repair stops removing the id | 2 / 4 — caught by the leak and readability guardrails |
| 4 | The shaper stops removing the id | **6 passed — survived, reported below** |
| 5 | Both replace the id with an empty string | 2 / 4 — agreement holds, readability does not |
| 6 | The shared constant is renamed, so both change together | 6 passed — **survives by design**; the suite pins the agreement, not either phrase |

Mutation 4 is a real survivor and is not being written around. The two removals overlap
on this class: on the settled pass the contract repair runs after the shaper, so with
the shaper's removal gone the contract's still catches the id, both passes still agree
and nothing leaks. The suite reports the truth — the invariant it guards is unbroken by
that mutation. A test that failed there would be asserting which layer does the work
rather than what a reader sees, and the layering question is recorded as follow-up work
instead.

Mutation 6 is the check that this is not a literal pin: renaming the phrase in the one
place both modules read is a legitimate change and the suite permits it, while any
divergence fails.

**Scope baseline, same command either side** — `npx jest src/lib/agent src/lib/answer
src/__tests__/behaviors`: **8 suites / 20 tests failing before → 7 suites / 19 tests
failing after.** The remaining seven are the before list with `response-shape.test.ts`
removed, unchanged otherwise; all seven are pre-existing and unrelated (tenant editorial
naming, context bundle resolution, prompt guardrails, intelligence tools, voice
doctrine). Passing 1142 → 1149.

**`response-shape.test.ts` on its own: 1 failed / 45 passed → 46 passed.**

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit 0, no
  output, build-info removed first.
- `npx eslint` over the four changed paths — exit 0, no output.
- `npm run release:check` — recorded in the pull request.

The new suite lives in `src/__tests__/behaviors`, which the behaviour coverage job runs
on every pull request, so it is checked rather than merely present. The suite it repairs
does not run in any workflow, which is why the assertion sat red; that is a known open
item and is not addressed here.

## Rollout Plan

Squash merge to `main`. The repo-owned Azure Container Apps deploy workflow builds the
image from the merge commit and shifts traffic; no manual Azure command, no flag, no
migration and no data build is involved.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to
  `main`. No other path is used.
- Shared runtime mutators: none. No `az containerapp update`, no environment variable,
  secret, scale or flag change.
- Approved image digest: produced by the workflow from the merge commit; recorded in the
  pull request after the run completes.
- ACA runtime invariant: to be proven after the deploy run — Container App template
  image equal to the 100%-traffic revision image, digest-pinned, revision Healthy.
- Worker image invariant: both non-manual delivery worker jobs to be read back on the
  same digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes, and owed.** The change alters wording a reader
  sees in a streamed agent answer, so the proof that belongs to it is a signed-in
  session watching an answer arrive and settle. Not attempted here: it means asking a
  live question against a shared lab tenant with no human present to authorize the turn.
  Until that is done the status is `deployed`, not `live-proven`.

## Rollback Plan

Revert the merge commit and let the repo-owned workflow redeploy. The change is four
files, two of them tests, with no stored state, so a revert restores the previous
wording exactly and nothing has to be migrated back.

## Audit Evidence

- Pull request, with the before/after suite counts and the six-mutation table above.
- The behaviour coverage job log, showing
  `agent-identifier-placeholder-consistency.test.ts` executing.
- Deploy workflow run keyed to the merge commit, plus the Container App template and
  100%-traffic revision digests read back independently.
- `docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md` for the layer boundaries
  this change stays inside.

## Known Gaps

- **Signed-in acceptance is owed**, as stated under Deployment Authority. Nothing here
  claims it.
- **Mutation 4 survived**, and the reason is a real overlap rather than a weak test: the
  two passes both remove this identifier class, so either alone keeps the sentence
  clean. Which layer should own the removal is a question this change did not answer and
  did not want to answer under the cover of a wording fix.
- **The repaired suite still runs in no workflow.** `src/lib/agent/__tests__` is outside
  every scoped jest script and every workflow, which is why an assertion sat red on
  `main`. The new suite was put where a job will run it; widening the scope of what CI
  sees is a larger open item and is untouched here.
- **The follow-up cleanup expressions were not extended to the streaming pass.** The
  shaper removes a stranded parenthesis or dash left behind by its own replacement; the
  contract repair does not. That asymmetry predates this change, is unrelated to the
  wording drift, and widening it would have meant changing what the streaming pass emits
  beyond making it agree.

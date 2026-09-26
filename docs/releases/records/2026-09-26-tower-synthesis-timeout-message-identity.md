# 2026-09-26-tower-synthesis-timeout-message-identity — Tower synthesis timeout notice is checked against the visible-answer contract

## Release ID

`2026-09-26-tower-synthesis-timeout-message-identity`

## Status

`candidate`

## Plain-English Summary

When Tower asks the model for a synthesis and the upstream stalls, the route gives up after a
fixed timeout and shows the reader a plain sentence instead of leaving the screen stuck on the
agent's "thinking…" state. A test alongside that route pins the sentence so a later refactor
cannot quietly swap it for a generic error string.

That test had one case asserting the sentence contained the word `Atlas`. On 2026-06-27, commit
`bdbfff54b` — "fix(home,tower): enforce visible answer contract (#4037)" — rewrote the sentence
to use the product's current user-facing agent name, as part of a change whose whole purpose was
that legacy internal agent branding must not reach a reader. The test was never updated, so it
has been red on that one case ever since, and its expectation had become an instruction to
reintroduce exactly what #4037 removed. Anyone "fixing" the red case by making it pass on its own
terms would have put the old branding back into a user-facing message.

This change corrects the case. It no longer matches a brand literal at all. It asks the two
authorities the repository already owns: the Tower constant that states the agent's name, and
`assertVisibleAnswerContract`, the same checker production runs over visible output, whose
branding rule is the executable form of the sentence "the user-facing identity is aVa". A timeout
notice is prose a reader sees, so the case now requires it to satisfy that contract in full — a
raw record id or a stock closing would be as wrong there as in an answer.

No product behaviour changes. The route, its constants and the message a reader sees are
byte-identical before and after.

## Layer Impact

Release lane: `global-control-lane`. The change is shared app/control-plane material — a Tower
test and a repository-wide CI baseline — and is not gated behind a flag or scoped to a client.
It ships to every client in the sense that it ships in the same image, and to none of them in the
sense that no client-visible behaviour differs.

- **Layer 4 (Products — Tower):** test-only. The route under test is unchanged; what changed is
  what the suite beside it is allowed to accept.
- No change to layers 1–3. No tenant data, adapter, canonical model, schema or migration is
  touched.

## Client Applicability

- All clients: no behavioural change; the rendered timeout notice is identical.
- Specific clients: none.
- Internal only: yes in effect — this is a CI/test-integrity change.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/tower/synthesis/route-fix-c.test.ts` — the timeout-message case now asserts through
  `assertVisibleAnswerContract` and `TOWER_LEAD_AGENT` instead of matching a retired brand literal,
  with the attribution to `bdbfff54b` (#4037) recorded in the suite itself. The assertions are
  ordered so each one is the first to fail for a distinct defect, because jest abandons a case at
  its first failed expectation and an assertion that is always pre-empted proves nothing.
- `docs/ci/tower-test-baseline.json` — the suite's `knownFailing` entry is removed. The ratchet
  fails a run when a baselined suite improves while the baseline still allows the old failure, so
  leaving the entry would have turned the Tower gate red on the correction.

Deliberately out of scope: the suite's fourth case reads `route.ts` as source text and asserts
substrings. That is a separate, filed piece of work about byte-scanning cases, and it is left
untouched here.

## QA / Validation

Measured against a clean checkout of `origin/main` `a8179cfa7` in a separate worktree — not a
stash — over the same scope, and the exit code was judged rather than the output grepped.

**The suite itself**

- Before, on unmodified `main`: `1 failed, 3 passed, 4 total`. The failure was
  `Expected pattern: /Atlas/` against `"aVa could not complete that response in time. …"`.
- After: `4 passed, 4 total`.

**The Tower ratchet, whole scope, both trees**

- Before (clean worktree at `a8179cfa7`): `9 failed, 1795 passed, 1804 total`; `7 failing suites
  (baseline 7)`; exit 0.
- After: `8 failed, 1796 passed, 1804 total`; `6 failing suites (baseline 6)`; exit 0.
- Exactly one test moved from failing to passing and no other suite moved. The total is unchanged
  because the case count is unchanged — the same four tests run, one of them now passes — so the
  `floor` and `totalTests` fields needed no edit.

**Mutation checks — seven applied, seven caught.** Each was confirmed to change behaviour before
its result was scored, and each is recorded with the assertion that caught it, so no assertion in
the case is left unproven:

1. Restore the pre-#4037 wording (`"Atlas couldn't complete …"`) → caught by the branding clause.
2. Replace the message with `"Request failed."` → caught by the agent-identity check.
3. Name a different agent (`"Tower could not complete …"`) → caught by the agent-identity check.
4. Keep the current wording but embed a raw record id → caught by the whole-contract assertion.
5. Change `TOWER_LEAD_AGENT` itself → caught by the agent-identity check, which proves the case
   reads the constant rather than carrying a second copy of the name.
6. Force `assertVisibleAnswerContract` to report `passed: false` with no violations → caught by
   the `passed` assertion, which is therefore not decoration.
7. Delete the branding rule from the checker *and* restore the old wording → still caught, by the
   agent-identity check. Reported rather than hidden: the two assertions cover each other, which
   is why both are kept.

**Other gates**

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` after deleting
  `tsconfig.tsbuildinfo`: exit 0, no diagnostics.
- `npx eslint src/app/api/tower/synthesis/route-fix-c.test.ts`: exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: recorded on the pull request.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow builds and deploys on merge as
it does for any commit; nothing in this change requires it to, because no runtime file is touched.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: whatever the main deploy workflow produces for the merge commit; this
  change does not pin or alter one.
- ACA runtime invariant: to be read back from the deploy run for the merge SHA and recorded in the
  execution pulse, as for any merge.
- Worker image invariant: unaffected — no worker job input changes.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing a signed-in user can see differs. The route, the
  exported constants and the rendered message are byte-identical before and after; what changed is
  a test file and a CI baseline entry.

## Rollback Plan

Revert the squash commit. There is no runtime state, no migration and no flag to unwind; a revert
restores the previous test expectation and the previous baseline entry together, which is the only
pairing that keeps the Tower ratchet green.

## Audit Evidence

- The pull request for this change, with the before/after suite and ratchet numbers and the seven
  mutation results quoted above.
- `bdbfff54b` (`git show bdbfff54b -- src/app/api/tower/synthesis/route.ts`) is the commit that
  rewrote the constant; its diff on that line is the evidence for the attribution.
- `src/lib/agent/visible-answer-contract.ts` is the contract the corrected case now asks.
- `docs/ci/tower-test-baseline.json` before and after shows `knownFailing` going from seven
  entries to six.

## Known Gaps

- The fourth case in the same suite still reads `route.ts` as source text and asserts substrings.
  It is untouched here on purpose; replacing byte-scanning cases with behavioural ones is separate,
  already-filed work, and folding an unmeasured change into a measured one is how a pull request
  stops being reviewable.
- Mutation 7 shows the branding clause and the agent-identity check overlap: removing the rule from
  the checker is still caught, but by the other assertion. That overlap is deliberate and stated
  rather than trimmed, because each assertion is independently first-to-fail for a defect the other
  does not see.

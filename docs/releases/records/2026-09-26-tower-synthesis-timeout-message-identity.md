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

One runtime line changed, and it was not in the first draft of this change. The route used to
spell the agent's name as a literal inside the message. Importing the Tower constant into the test
alone made that constant reached *only* by a test, which the repository's own orphan gate correctly
refuses — a test written for code nothing calls. The honest repair ran the other way: the route now
builds the message from `TOWER_LEAD_AGENT`, so the name is declared once instead of copied twice.
That is also the mechanism of the original defect, removed rather than worked around — two copies
of one name, and a rename that moved only one of them.

**No product behaviour changes.** The rendered string is byte-identical: the constant holds exactly
the name the literal spelled. Nothing else in the route is touched.

## Layer Impact

Release lane: `global-control-lane`. The change is shared app/control-plane material — a Tower
test and a repository-wide CI baseline — and is not gated behind a flag or scoped to a client.
It ships to every client in the sense that it ships in the same image, and to none of them in the
sense that no client-visible behaviour differs.

- **Layer 4 (Products — Tower):** one runtime line in the synthesis route, which now derives the
  agent's name from the Tower constant instead of repeating it as a literal. The string a reader
  receives is unchanged. Everything else is the suite beside it and two generated CI baselines.
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
- `src/app/api/tower/synthesis/route.ts` — `TOWER_SYNTHESIS_TIMEOUT_MESSAGE` is built from
  `TOWER_LEAD_AGENT` rather than spelling the name a second time. Rendered output is unchanged.
- `docs/ci/tower-test-baseline.json` — the suite's `knownFailing` entry is removed. The ratchet
  fails a run when a baselined suite improves while the baseline still allows the old failure, so
  leaving the entry would have turned the Tower gate red on the correction.
- `docs/architecture/orphaned-lib-modules.json` — regenerated with the gate's own
  `npm run audit:lib-orphans -- --update`. Exactly one membership line moves:
  `src/lib/tower/constants.ts` leaves the `unreferenced` list, because the route now reaches it.
  The recorded counts also move, and not all of that movement is from this change — the committed
  figures had drifted behind `main` (scanned 2962 → 2973, tooling entry points 2029 → 2037, test
  2613 → 2632), and a regeneration re-records the true numbers rather than preserving stale ones.
  Attributable to this change: product-reached 2170 → 2171 and unreferenced 133 → 132.

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
3. Let the message drift off the declared name (`"Tower could not complete …"`) → caught by the
   agent-identity check.
4. Keep the current wording but embed a raw record id → caught by the whole-contract assertion.
5. Set `TOWER_LEAD_AGENT` to the retired name → caught by the branding clause. Worth reading
   carefully, because the single declaration changed which assertion fires: the route now takes its
   name from that constant, so a forbidden name entered there reaches the reader and the contract
   sees it. A rename to some *other* legitimate name moves both sides together and this case stays
   green, which is the point of one declaration rather than a hole in the test — a rename is not a
   defect. What is a defect is the message drifting away from the declared name, and mutations 2
   and 3 are what prove that is caught.
6. Force `assertVisibleAnswerContract` to report `passed: false` with no violations → caught by
   the `passed` assertion, which is therefore not decoration.
7. Delete the branding rule from the checker *and* restore the old wording → still caught, by the
   agent-identity check. Reported rather than hidden: the two assertions cover each other, which
   is why both are kept.

**The gate that caught the first draft, and what it changed**

The first draft imported `TOWER_LEAD_AGENT` into the test only. CI's "Agent context broker boundary"
job failed on `npm run audit:lib-orphans` with `~ src/lib/tower/constants.ts: unreferenced ->
testOnly`, whose own message reads "unreferenced -> testOnly means a test was written for code
nothing calls". It was right, and the repair was to give the constant a product consumer rather than
to re-record the baseline around it. After the route change the same audit reports `No change
against the baseline`, exit 0, with the module counted as product-reached.

Because the route changed, every measurement here was taken again on the final tree rather than
carried over from the draft: the tower ratchet still reports `1796/1804 tests, 6 failing suites
(baseline 6)`, exit 0, and the mutation table above is the re-run.

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
- Live signed-in proof required: **no.** Nothing a signed-in user can see differs. One runtime
  line changed and it is a refactor of how the same string is assembled: `TOWER_LEAD_AGENT` holds
  exactly the name the removed literal spelled, so the rendered message is byte-identical. Stated
  as a limit rather than a certainty: this is an argument from the two values being equal, checked
  in both the suite and by direct comparison, not from having driven the timeout path signed in.

## Rollback Plan

Revert the squash commit. There is no runtime state, no migration and no flag to unwind. A revert
restores the route's literal, the previous test expectation and both baseline entries together,
which is the only combination that keeps the Tower ratchet and the orphan audit green — reverting
any one of them alone would turn a gate red.

## Audit Evidence

- The pull request for this change, with the before/after suite and ratchet numbers and the seven
  mutation results quoted above.
- `bdbfff54b` (`git show bdbfff54b -- src/app/api/tower/synthesis/route.ts`) is the commit that
  rewrote the constant; its diff on that line is the evidence for the attribution.
- `src/lib/agent/visible-answer-contract.ts` is the contract the corrected case now asks.
- `docs/ci/tower-test-baseline.json` before and after shows `knownFailing` going from seven
  entries to six.
- The CI job that failed the first draft, `npm run audit:lib-orphans` under "Agent context broker
  boundary", and the same command passing on the final tree.

## Known Gaps

- The fourth case in the same suite still reads `route.ts` as source text and asserts substrings.
  It is untouched here on purpose; replacing byte-scanning cases with behavioural ones is separate,
  already-filed work, and folding an unmeasured change into a measured one is how a pull request
  stops being reviewable.
- Mutation 7 shows the branding clause and the agent-identity check overlap: removing the rule from
  the checker is still caught, but by the other assertion. That overlap is deliberate and stated
  rather than trimmed, because each assertion is independently first-to-fail for a defect the other
  does not see.
- `TOWER_PRODUCT_NAME`, the other export in `src/lib/tower/constants.ts`, still has no consumer.
  The module as a whole is now product-reached, so no gate reports it, and wiring an unrelated
  constant into a surface is not something this change should decide on its way past.

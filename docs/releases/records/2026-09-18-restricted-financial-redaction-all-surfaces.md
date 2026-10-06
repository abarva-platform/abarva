# 2026-09-18-restricted-financial-redaction-all-surfaces — Restricted-financial redaction runs on every agent surface

## Release ID

`2026-09-18-restricted-financial-redaction-all-surfaces`

## Status

`candidate`

## Plain-English Summary

When a user is not entitled to see exact financial values, the agent chat route
replaces money amounts in the streamed answer with `[restricted financial value]`
before the text reaches the browser. That replacement was being skipped on one
surface.

The skip came from a surface-name branch in the route's output sink. The helper
behind it was documented as preventing a *prose optimizer* from rewriting
model-authored text — but no prose optimizer exists on this route, so the branch
had only one real effect: it turned off the restricted-financial firewall for
that surface. A user whose access policy says they may not see exact budgets,
spend or contract values received them verbatim.

This change makes redaction unconditional. Entitlement — and nothing else —
decides what is removed. The entitled-user path is unchanged: the streamer
already passes entitled users through untouched, so nobody loses a number they
were allowed to see. The helper that carried the branch had no remaining callers
and no behaviour matching its documentation, so it and its unit test are removed
rather than left as dead code with a false comment.

## Layer Impact

Release lane: **`global-control-lane`** — shared control-plane behaviour on the
agent chat route, applying to all clients and not feature-gated. No
`client-data-lane` work is involved: nothing tenant-scoped is read, written,
seeded or ingested by this change.

- **Layer 4 (Products):** the agent chat route that serves Intelligence and the
  other agent surfaces. Output only — no read-path, retrieval or data change.
- **Layers 1–3 unchanged.** No intake, adapter, canonical-model, schema or
  tenant-data change. Nothing is loaded, migrated or re-indexed.

## Client Applicability

- All clients: yes — this is shared control-plane behaviour and is not
  feature-gated.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The control is unconditional by design; a flag here would
  reintroduce the defect it repairs.

## Changes Included

- `src/app/api/chat/agent/route.ts` — removed the surface-name branch from the
  streamed-output sink (`writer.write`) and from `flushRestrictedFinancialTail`,
  so both the per-delta redaction and the end-of-stream flush run on every
  surface. Added a comment recording why the branch must not come back.
- `src/lib/agent/display-text.ts`, `src/lib/agent/__tests__/display-text.test.ts`
  — deleted. The module's single export had no callers left after the branch was
  removed, and its documented purpose (prose optimization) is not implemented
  anywhere in the repo. The unit test is removed because the function it covers
  is gone, not because it failed.
- `src/app/api/chat/agent/__tests__/restricted-financial-redaction.test.ts` — new
  behavioural suite (7 tests).
- `src/app/api/chat/agent/__tests__/agent-visible-stream-controls.test.ts` —
  dropped the now-dead direct/non-direct parameterisation. Every assertion in
  that suite is retained; only the removed branch's axis is gone.

## QA / Validation

**The test drives the real handler.** The redaction sink lives inside the
route's `ReadableStream` start handler, so a unit test of the sanitizer proves
nothing about whether the route reaches it. The new suite extracts the real
`start` body from `route.ts`, transpiles it, and executes it with the real
`createRestrictedFinancialTextStreamer` and a real restricted access policy. It
covers both branches the acceptance criteria asks for: a restricted user (value
redacted) and an entitled user (value preserved).

**Authored before the fix, and red for the right reason:** 5 failed, 2 passed.
The five failures were the leak itself — a restricted user receiving `$22.1K`,
`$4.8 million` and `$310,000` verbatim on the affected surface. The two passes
were the unaffected control surface and the entitled-user case. After the fix:
**7 passed**. With the sibling stream-controls suite: **11 passed**.

**Mutation checks — each applied, observed, then reverted:**

| Mutation | Result |
|---|---|
| Reinstate a surface-name bypass in `writer.write` | 5 failed, 2 passed |
| Make `flushRestrictedFinancialTail` a no-op | 1 failed, 6 passed |
| Remove the entitlement check in both places it lives | 1 failed, 6 passed |

A fourth mutation (removing only the streamer's entitlement fast path) left the
suite green and is recorded here as an **equivalent mutant**, not a gap: the
sanitizer performs the same entitlement check, so removing one of the two alone
changes no behaviour. The third mutation above removes both and is caught.

**Regression baseline, same scope both runs** (`src/app/api/chat/agent/**/__tests__`
+ `src/lib/agent/**/__tests__`), clean `origin/main` versus this branch:
**30 failing before, 30 failing after**; 889 passing before, 891 after. The 12
red suites in that scope are pre-existing and unrelated to this change.

**Typecheck:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
— **exit code 0**, zero diagnostics. (Exit code judged directly; a bare
`npx tsc --noEmit` exits 134 on this host with no diagnostics, which reads as a
false clean when piped to a filter.)

**Lint:** `npx eslint` on all three changed source files — clean, exit 0.

**Not verified:** no signed-in check on a deployed build has been performed for
this change. It is owed before this record moves past `candidate`.

## Rollout Plan

Squash-merge to `main`. The repo-owned ACA main deploy workflow builds the image
and shifts traffic; no manual Azure command is involved. No migration, no data
build, no flag flip, no worker job. The change is effective for a request as
soon as the serving revision carries it.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only
  authority shifting shared web traffic for this change.
- Shared runtime mutators: none. No ad-hoc `az containerapp update`, no
  `az acr build`, no revision-weight change from this branch.
- Approved image digest: assigned by the deploy workflow on merge; recorded in
  the pulse entry once the run completes.
- ACA runtime invariant: Container App template image digest must equal the
  100%-traffic revision digest, verified on the newest deploy run at or after the
  merge SHA.
- Worker image invariant: unaffected — no worker job image changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — a restricted-entitlement user on the
  affected surface should see `[restricted financial value]` where an exact
  amount previously appeared.

## Rollback Plan

Revert the squash commit and let the deploy workflow ship the prior image, or
reassign 100% ingress traffic to the previous healthy ACA revision by its pinned
digest. No migration to unwind and no data written, so rollback is a pure image
swap. Note that rolling back restores the bypass and the leak with it, so prefer
a forward fix unless the revert is for an unrelated failure.

## Known Gaps

- **No signed-in acceptance yet.** Nothing here is `live-proven`. The suite
  proves the control runs in the route's real stream handler; it does not prove
  the deployed revision carries it. A signed-in check by a restricted-entitlement
  user on the affected surface is owed before this record leaves `candidate`.
- **Redaction is pattern-based, not semantic.** The sanitizer matches money
  tokens, financial-adjacent numerics and restricted source ids by regular
  expression. A value written entirely in words ("four point eight million") or
  an unusual notation is not matched. That limitation predates this change and
  is unchanged by it; this release repairs *where* the firewall runs, not *what*
  it recognises.
- **One non-catching mutation is recorded above as an equivalent mutant.**
  Removing the streamer's entitlement fast path alone changes no behaviour
  because the sanitizer repeats the check. The duplication is intentional
  defence in depth, but it means no single-line mutation isolates that path.
- **The removed helper's historical references remain.** Two 2026-07 release
  records still name `src/lib/agent/display-text.ts` in their QA command lines.
  Those are historical records of what was run at the time and are deliberately
  left as written.

## Audit Evidence

- PR URL and CI run for this branch.
- The red-before numbers above are reproducible: check out the parent commit,
  apply only the new test file, and run it.
- Mutation results reproducible by re-applying each mutation in the table.
- Deploy run, image digest and ACA runtime invariant — recorded on merge.
- Signed-in acceptance on the deployed SHA — owed, not yet captured.

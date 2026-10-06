# 2026-09-22-unresolved-client-fallback-guards — Surfaces that refuse can now say the tenant is unresolved

## Release ID

`2026-09-22-unresolved-client-fallback-guards`

## Status

`candidate`

## Plain-English Summary

A shared helper answers "what is this tenant called?". It is declared as able to
return "nothing resolved", but it never actually did: its last step resolved
anything unrecognised through a default-account lookup that has no empty branch.
So every `?? <fallback>` written against it in the codebase was unreachable —
40 of them, across 36 files.

For most of those surfaces that is harmless: the reader is already inside the
tenant, and the default is the established answer. For six it was not. A
record-not-served page, an admin signals page, a configuration page that says
whose approval gates you are editing, the tenant name the AI assistant is told
it is answering for, and the client name on every delivery-programme card could
each name an account the request had never resolved — including on the exact
path where the tenant lookup had just failed.

All 40 call sites are now classified in a checked-in record. The six that
refuse, guard or attribute are repointed at the strict form of the helper and
each is proved by rendering or invoking it with the tenant unresolved. The
other 34 are left alone deliberately, with the reason written down.

Two further findings came out of the work and are recorded rather than smoothed
over. The programme-card helper's own comment states that defaulting to a
specific tenant was removed as a cross-tenant name leak; delegating to the
lenient helper had quietly reinstated it. And repairing that exposed a second
unreachable branch in the same four lines — an empty stored name is not nullish,
so the neutral dash could not fire for it either, and the card rendered an empty
string. Both are fixed and both are pinned by a test case.

## Layer Impact

**Release lane: `global-control-lane`.** Shared app behaviour for all clients,
not feature-gated: the changed branch is a refusal path that any tenant can
reach when a tenant read fails or resolves to nothing.

- **Layer 4 (Products)** — Home, Source, Moves, Admin and the agent answer path.
  Each changed surface renders a neutral phrase instead of an account name when,
  and only when, nothing resolves. Behaviour for a resolved tenant is unchanged,
  and a case pins that on every surface so the repair is not a blanket mute.
- **Layer 3 (Canonical model)** — unchanged. No schema, no migration, no loader,
  no read model. `getClientOption`'s default and the lenient helper's return type
  are both deliberately untouched.

## Client Applicability

- All clients: yes — the changed branch is reached only when a tenant read fails
  or resolves to nothing, which is not client-specific.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/home/v4/HomeRecordNotServed.tsx` — record-not-served surface.
- `src/app/(maestro)/admin/cross-program-signals/page.tsx` — admin signals page.
- `src/app/(maestro)/source/setup/page.tsx` — configuration surface.
- `src/app/api/chat/agent/active-tenant-name.ts` — **new**;
  `resolveTurnTenantName` and `UNRESOLVED_ACTIVE_TENANT_NAME`.
- `src/app/api/chat/agent/route.ts` — two call sites collapsed into that helper,
  one repointed. The dead request-body fallback under the first is removed — see
  Known Gaps.
- `src/lib/programs/client-name.ts` — **new**; `canonicalProgramClientName`
  moved out of `transformers.ts` and repaired, including the empty-name branch.
- `src/lib/programs/transformers.ts` — imports it; no other change.
- `src/__tests__/behaviors/unresolved-client-fallback-guards.test.tsx` — new.
- `src/__tests__/behaviors/agent-turn-unresolved-tenant-name.test.ts` — new.
- `docs/governance/unresolved-client-fallback-classification.md` — the record of
  all 40 call sites and the verdict on each.

## QA / Validation

- **Red first, on unmodified product code.** The two new suites were run against
  the tree before any product change: **8 failed / 4 passed**. Every failure was
  for the right reason — the default account's display name arriving where a
  neutral phrase belongs. The 4 that passed are the resolved-tenant regression
  cases and one already-working branch.
- **After the repair: 16 passed / 0 failed** over the same two suites.
- **Mutation proof: 8 mutations, 8 caught, 0 escapes.** Each repair reverted to
  the lenient helper in turn (6); the record-not-served surface muted
  unconditionally, to prove the regression case can fail (1); the nullish
  empty-name hole restored (1). A ninth mutation re-added a request-supplied
  tenant name to the agent helper and was caught.
- **No source-text assertions.** The agent route's case exercises the exported
  helper's behaviour. The existing suites for that route assert the text of
  `route.ts`; a test that greps a route for a symbol cannot tell a running
  control from a comment, so none was added.
- **`Behavior coverage floor` measured on both sides of the same scope.**
  Baseline, with the two new suites held out: **98 suites / 820 tests, 0
  failures**, 91.41% statements / 63.70% functions / 69.99% branches, exit 0.
  After: **100 suites / 836 tests, 0 failures**, 91.02% / 63.48% / 70.41%,
  exit 0 judged by exit code.
- **A first version of this change failed that required gate, and the failure is
  recorded rather than smoothed over.** The two cases originally imported
  `route.ts` and `transformers.ts` directly to reach two pure functions, which
  put 6,118 statements and 98 functions of unexercised code into the floor's
  coverage denominator and took it to 78.12% / 17.43%. Both helpers were moved
  into small modules of their own; the gate then passed. The limit this leaves
  on the proof is stated in the classification record.
- TypeScript, ESLint and `scripts/release-check.mjs` — see PR.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys the
image; no migration, no job, no flag, no environment change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the deploy run for the merge SHA.
- ACA runtime invariant: to be proved from the deploy run's own
  `runtime-invariant-proof.json` after merge; not claimed here.
- Worker image invariant: unchanged by this release; proved by the same artifact.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no, and the reason is stated rather than
  skipped.** Every changed branch is reached only when the tenant read fails or
  resolves to nothing. A signed-in session by definition resolves its tenant, so
  a signed-in pass would exercise the unchanged path and prove nothing. The
  failure case is driven directly by the rendering and invocation tests, and by
  mutation.

## Rollback Plan

Revert the PR and redeploy. No migration, no data written, no stored state
changed, so a revert restores prior behaviour exactly.

## Audit Evidence

- PR URL and CI run — see PR.
- The two new suites, and their red-first and mutation numbers, recorded above.
- `docs/governance/unresolved-client-fallback-classification.md` for the verdict
  on each of the 40 call sites.

## Known Gaps

- **Three guard-class call sites are classified but not repaired**, filed as
  U-513: two consent surfaces and one turn-creation route. Each needs a harness
  this change does not build, and the route's resolved name is not only
  displayed — its first token scopes a candidate list — so an unproven repair
  there is not a repair. They are named in the classification record.
- **The removed request-body fallback in the agent route is a deliberate
  narrowing.** It was unreachable, so removing it changes no observable
  behaviour; but repointing the call above it without removing it would have
  made a request-supplied tenant name live on exactly the path where
  server-side resolution had failed, which is the class of defect the
  2026-05-13 audit closed for this prompt block.
- The 34 remaining dead `??` expressions are left in place. Deleting them is a
  36-file diff with no behavioural content; the classification record is the
  note that they are dead.

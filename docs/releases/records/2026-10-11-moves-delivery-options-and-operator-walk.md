# 2026-10-11-moves-delivery-options-and-operator-walk — Saved delivery comparison

## Release ID

`2026-10-11-moves-delivery-options-and-operator-walk`

## Status

Candidate. No runtime or signed-in acceptance is claimed.

## Release Lane

`experimental`

## Plain-English Summary

P3 can save two delivery pods against one shared bottom-up scope, price both
through the existing cost foundation, and record the selected option and its
reason. The current selected approval supplies the estimate read by P4.
Member-specific location and provider terms now survive storage and reach the
existing rate resolver. Counts and unit hours are shared; rates are never tuned
in the page.

A synthetic browser walk uses a dedicated automated identity and a fresh Move.
Codex reviews the actual page, drafts and downloaded bytes at each checkpoint
before it performs the next actions. Followability scores come from those
reviews. Missing reviews, stale review scope and unreviewed document sign-offs
stop the run. Test discovery is not a completed browser walk.

## Layer Impact

Release lane: `experimental`.

- Layer 3: the existing Move phase record gains optional delivery options and
  selection provenance. No new tenant dataset, ingestion adapter or schema.
- Layer 4: the flagged P3 page shows engine previews and current selection.
  Existing pricing, figure visibility, register references and approval rules
  remain authoritative. The runner operates through product UI controls.

## Client Applicability

- All clients: no automatic enrollment.
- Specific clients: the synthetic demo tenant enrolled by the registry.
- Internal only: dedicated operator browser tooling.
- Public/demo only: synthetic acceptance evidence.
- Feature flag: `moves_delivery_options_v1`, tenant policy. Existing records
  without options retain their current single-pod approval contract.

## Changes Included

- ROM persistence, member delivery terms, comparison and selection guards.
- P3 UI, server-resolved feature flag and generated product manual.
- Dedicated operator authentication helper and 29-step browser review runner.
  Email-identified creation uses Clerk's documented per-user BAPI option;
  it does not change global sign-in settings or supply a synthetic phone.
- Existing ROM model and component suites extended with selection checks.

## QA / Validation

- Actual-main reconciliation: merged `2fd90ff0f5fbb8b8b3c4cf4c4c122e9a117f5b36`
  into the published candidate without rebasing. Both feature-key declarations
  survive the merge. The manual and tenancy census were regenerated, and the
  fetched main census was regenerated from the actual tree: 2,829 covered Jest
  files, with no new Jest test files added by this candidate. The browser suite
  is outside that census. No coverage value was tuned to avoid a collision.
- Reconciled ROM suites: pass, 70 tests. Targeted ESLint: pass. Library orphan,
  route reachability and export reachability checks: pass, no new findings.
  Node 24 typecheck: pass. All 11 release gates: pass. Generated manual,
  coverage and tenancy census checks: pass. Browser discovery: pass, one test.
  Current-head CI and the final fetched-ref collision guard remain pending
  until the reconciled candidate is pushed and checked.
- Origination response-contract regression: pass. The runner binds the exact
  `engagementId` returned by the product before asynchronous navigation
  settles, and rejects a malformed or protected identifier. Ignoring that
  response field was killed by the regression; source SHA-256 was restored.
  Node 24 typecheck and targeted lint after this repair: pass. Browser discovery
  is two tests: this contract test and the separately authorized write walk.

- ROM model and P3 component suites: 70 tests passed at candidate validation.
  They cover stale previews, missing selection reasons, equal effort hours,
  persisted member terms, selected approval, changes to either option and
  changes to register values and repriced comparison figures, plus the visible
  selection controls, flag-off absence and the unchanged five-column member form. Seven guard mutations were killed; the original source
  hash was restored after each mutation.
- Node 24 TypeScript check passed. Release check: all 11 gates passed.
  Generated manual and the genuine coverage census are current. Targeted lint
  passed after removing an unused runner import. These gates are rerun after
  main reconciliation and recorded for the pushed candidate.
- Playwright discovery: one operator walk discovered. Dedicated operator
  Clerk sign-in passed in a fresh browser with exact identity/profile and an
  active session without pending tasks. This is identity proof only; no
  Move walk, data apply, gate approval or artifact acceptance is inferred.
  Forward phase and step navigation uses visible controls; URL visits are
  separately recorded as persisted-page readbacks. Downloaded documents need
  an actual byte-bound review before sign-off.
- Visual check passed for a temporary render of the real P3 component at
  1440 and 390 pixels in light and dark, with no horizontal overflow. The
  temporary test was deleted. The comparison is an added section in the pod
  row, using the existing cards and control styles; there is no A/B mock.
  A pending choice keeps that row visible and supplies the next action.

## Rollout Plan

Squash merge only after current-head CI and a fresh every-open-Moves-PR coverage
collision scan, including drafts. The repo-owned main ACA workflow builds and
deploys the merged SHA. Verify runtime invariant and then the dedicated
operator's signed-in product behavior. Last Moves merge deadline is
2026-10-13 03:00 UTC; deployment freeze is 2026-10-13 11:00 UTC. Bind any seed apply to a separately
validated fresh Move and exact approved rows. Never apply a fallback seed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this candidate or browser runner.
- Approved image digest: the repo-owned deploy's digest for the merged SHA.
- ACA runtime invariant: template and 100% serving revision must match.
- Worker image invariant: both required workers must match that digest.
- Feature/env flag update path: registry reviewed in the PR and main deploy.
- Live signed-in proof required: dedicated operator identity, tenant and
  assigned-Move access fences, persisted A/B selection, current selected ROM,
  all reachable steps, final full journey, and actual output bytes.

## Rollback Plan

Remove synthetic enrollment from `moves_delivery_options_v1` or revert the
candidate through a PR and repo-owned deploy. Preserve stored options,
approvals and audit history. Do not rebuild signed documents or reset Moves.

## Audit Evidence

PR diff, exact-head CI, focused suite output, generated census/manual checks,
repo-owned runtime proof and private operator walk report with screenshot and
artifact hashes. Credentials and private approvals never enter public evidence.

## Known Gaps

The dedicated operator was created and its exact identity/profile was read
back in a private Clerk-only job. The scoped product identity and governed seed
tooling releases are merged; account creation and code inclusion alone are not
signed-in product proof. The fresh Move, seed apply, approved selected estimate, completed
29-step run, final read-only walk and output visual acceptance remain unproven.
The reference-deck workstream owns the delivery comparison slide and K3 review;
this candidate does not supply model-ready inputs or infer deck acceptance.

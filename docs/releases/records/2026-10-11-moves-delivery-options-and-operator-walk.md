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

- Actual main `0b7cee8c4b58ec87b5a3582f577c9f2b95f41656` was merged
  without rebasing, including the required step-page response release. The
  manual and both censuses were genuinely regenerated. Coverage is 2,831
  from that tree. Committed main still records 2,830; the additional already-merged
  source suite is now counted by the genuine regeneration. This candidate adds no Jest file;
  its browser suite is outside that census. No coverage value was tuned.
- Reconciled ROM, host, routing, evidence and phase suites: pass, 445 tests
  across six suites. Targeted lint: pass. Library orphan, route reachability
  and export reachability checks: pass, no new findings. Node 24 typecheck: pass. All 11 release gates: pass on the reconciled
  candidate. Browser discovery: pass, four tests.
- Browser response, identity and visible-input contracts: pass, three tests. The runner binds
  the exact origination response identifier before asynchronous navigation.
  Identity checks wait for frontend hydration after a full navigation, then
  require the exact automated user and approved grants. Different identities,
  widened admin grants and unavailable identity reads refuse the run.
  A reviewed placeholder selector handles the observed unlabeled text area;
  it requires an exact, unique, visible input and records that selector basis.
- Response-field omission, hydration-wait omission and placeholder-selector
  omission mutations: killed; the exact source bytes were restored and the
  passing contracts repeated.
  The seven unchanged ROM guard mutations and four viewport/theme component
  renders were captured before this reconciliation and remain historical
  local evidence, separate from current runtime acceptance.
- Browser discovery includes four tests: three contracts and the
  separately authorized write walk. Signed-in identity and account
  onboarding preparation do not establish a completed Move journey.
  Each document sign-off still requires review bound to downloaded bytes.
- Complete exact-head CI and a fresh actual fetched-ref coverage guard for
  every open Moves PR, including drafts and shared-census contenders, remain
  required immediately before squash merge. Historical absent censuses are
  recorded as absent, never as zero. No auto-merge is armed while pending.

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

# 2026-10-03-moves-regeneration-title-stacking — Stop stacking the regenerated-title suffix

## Release ID

`2026-10-03-moves-regeneration-title-stacking`

## Status

`candidate`

## Plain-English Summary

When a Move deliverable is regenerated from review feedback, its title gets the
suffix "— regenerated from review feedback". That suffix was appended to the
deliverable's current title, so regenerating an already-regenerated deliverable
appended it again — the client-facing name grew longer every time ("… —
regenerated from review feedback — regenerated from review feedback …"). This
applies the suffix to the base title instead, so it appears exactly once no
matter how many times a deliverable is regenerated.

## Layer Impact

Release lane: `global-control-lane` — shared Moves deliverable behavior for all
clients, not feature-gated.

- `PRODUCTS` (Moves): the review-regeneration title/filename only. No change to
  the deliverable content, evidence, gates, or any other behavior.

No change to the canonical model, source adapters, or client intake.

## Client Applicability

- All clients: yes — any Move deliverable regenerated from review feedback.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag:
  none.

## Changes Included

- `src/lib/programs/deliverables/review-regeneration.ts`: strip an existing
  "— regenerated from review feedback" suffix from the base title before
  re-applying it (and derive the file name from the same base), so the suffix
  never stacks.
- Tests: the suffix is applied exactly once, and re-regenerating an
  already-regenerated artifact does not stack it (version still advances).

## QA / Validation

- `npx jest src/lib/programs/deliverables src/app/api/v1/programs` — 33 suites /
  241 tests pass, including the artifact-route tests that assert the suffix.
- Scoped `tsc`: no type errors. `eslint`: clean.
- `npm run release:check --base origin/main --head HEAD`: all gates pass.

## Rollout Plan

Merge to main via squash. No runtime rollout step of its own: it takes effect in
the web image the repo-owned ACA main deploy workflow builds from the merge SHA.
No migration, no flag, no env change. Deliverables regenerated after deploy get a
single suffix; existing stored titles are unchanged by this PR.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (on merge
  to main).
- Shared runtime mutators: none introduced.
- Approved image digest: the digest the main deploy workflow produces for the
  merge SHA.
- ACA runtime invariant: unchanged; no env/flag/scale/secret change.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: regenerate a deliverable twice after deploy and
  confirm the title carries the suffix only once.

## Rollback Plan

Revert the PR and redeploy from the reverted SHA through the main deploy workflow.
No migration or data change to unwind.

## Audit Evidence

- PR URL: (added on open).
- CI run on the PR.
- Local test + lint + scoped typecheck output above.

## Known Gaps

- Titles already stacked on existing stored deliverables are not rewritten by
  this PR (it prevents future stacking); a one-time title-normalisation is a
  separate data step if desired.

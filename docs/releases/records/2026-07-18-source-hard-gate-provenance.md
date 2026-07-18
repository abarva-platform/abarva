# 2026-07-18-source-hard-gate-provenance — Source Hard-Gate Evidence Provenance

## Release ID

`2026-07-18-source-hard-gate-provenance`

## Status

`candidate` — code slice is locally validated; merge and deploy require explicit Anand approval.

## Plain-English Summary

Source hard gates no longer clear from a client-stated free-text evidence placeholder alone. If evidence has no uploaded or processed source artifact behind it, a hard gate requires that evidence to be explicitly upgraded to `Usable Evidence` before it can satisfy the canonical requirement. Soft gates keep the existing rank-only behavior.

## Layer Impact

Source governance/read model: tightens `evaluateCriterionMetReadiness` so hard criteria distinguish verified/uploaded evidence from client-stated placeholders.

Application behavior: gate-marking and stage-promotion checks that depend on `evaluateCriterionMetReadiness` may now surface `required_evidence_unverified` instead of allowing a hard criterion to be marked met.

Release lane: `global-control-lane`, because Source hard-gate governance is shared behavior for all clients who use the canonical Source gate path.

## Client Applicability

All clients: applies to canonical Source hard-gate readiness checks.

Specific clients: none.

Internal only: no.

Public/demo only: no.

Feature flag: none.

## Changes Included

- `src/lib/source/source-governance-enforcement.ts`: blocks hard criteria when required evidence is only client-stated and has not reached `Usable Evidence`.
- `src/lib/source/__tests__/source-governance-enforcement.test.ts`: covers client-stated hard-gate blocking, explicit review pass-through, soft-gate non-regression, and uploaded/processed evidence pass-through.

## QA / Validation

- Pass: `npx jest src/lib/source/__tests__/source-governance-enforcement.test.ts --runInBand`
- Pass: `npx eslint src/lib/source/source-governance-enforcement.ts src/lib/source/__tests__/source-governance-enforcement.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Fail, pre-existing and identical on clean `origin/main`: `npx jest src/lib/source --runInBand`. Candidate result: 10 failed suites / 30 failed tests / 2,110 passed tests. Clean `origin/main` baseline: same 10 failed suites / same 30 failed tests / 2,106 passed tests. The candidate adds 4 passing governance tests and no new Source directory failures.
- Blocked: local signed-in browser crawl on the candidate worktree. `http://localhost:3010/source` redirects to `/responsible-ai/acknowledgment`; the page reports `The acknowledgment ledger is unavailable. Access remains paused until the system can record the acceptance evidence.` This prevents exercising the changed gate logic in-browser without changing unrelated acknowledgment controls.
- Regression context only, not candidate acceptance proof: production signed-in FS Demo crawl reached `https://app.abarva.ai/source/events/dcd31955-e1ac-416b-8c3b-52b83e8650de`, confirmed the real Source canvas renders Scope hard gates plus the existing context strip (`Requirement coverage 0 / 8`, `Readiness 0 / 4`, `Artifacts 0 / 5`, `Evidence 4 sources`, `Gates 0 / 5`). Production is still running `main`, not this unmerged candidate, so this does not prove the new hard-gate provenance behavior.

## Rollout Plan

After approval, merge through PR to `main`; the repo-owned Azure Container Apps main deploy workflow will build and deploy the exact merge SHA. No migration, data load, feature flag, or manual operator job is required.

## Deployment Authority

Repo-owned deploy workflow: required for runtime rollout after merge approval.

Shared runtime mutators: none in this slice.

Approved image digest: pending until the repo-owned deploy workflow builds the merge SHA.

ACA runtime invariant: required after deployment before claiming live runtime.

Worker image invariant: no worker impact expected.

Feature/env flag update path: none.

Live signed-in proof required: yes — mandatory before acceptance, but not before opening a draft PR.

## Rollback Plan

Revert the governance/test changes and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- Focused governance test output.
- This release record.
- Pending PR URL and browser proof artifact.

## Known Gaps

`gate-auto-assessment.ts` is intentionally not touched in this slice. Its `EVIDENCE_GATE_MAP`-driven auto-assessment path may still auto-mark a criterion `met` from a client-stated answer alone; that known engine-duplication gap is deferred to Source Slice 2b.

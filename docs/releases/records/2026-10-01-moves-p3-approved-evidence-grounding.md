# P3 Option Confidence Uses Approved Prior-Phase Evidence

## Release ID

`2026-10-01-moves-p3-approved-evidence-grounding`

## Status

`candidate`

## Plain-English Summary

P3 option comparisons now use the prior phase's signed-off gate deliverable as their source evidence. Unvalidated evidence, unresolved readiness gaps, or an unavailable approved source prevent a high-confidence recommendation. The comparison identifies its evidence source and carries prior-phase limitations into its open questions and not-ready conditions.

## Layer Impact

- **global-control-lane:** Shared Moves P3 behavior for all client workspaces after deployment.
- **Products:** Moves P3 option summaries and confidence labels reflect approved prior-phase evidence rather than the current phase's own outputs.
- **Canonical model:** No schema or canonical-object changes. Existing signed-off deliverable version metadata remains authoritative.
- **Source adapters:** No changes.
- **Client intake:** No changes.

## Client Applicability

- All clients: Moves P3 behavior after the release is deployed.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Read P2 gate artifact signals independently from current-phase carry-forward signals.
- Require the approved `signed_off_version` for prior-phase evidence used by P3; do not substitute an unsigned latest draft.
- Preserve extracted source labels and readiness limits in the P3 design inputs.
- Cap option confidence when readiness is unmeasured, prior-phase evidence is unavailable, or evidence is explicitly unvalidated, synthetic, stale, pending, conflicting, or not approved.
- Add regression tests for phase-source selection, approved-version selection, and confidence limits.

## QA / Validation

- `npx jest --runInBand --silent src/lib/programs/phase-templates/__tests__ src/lib/deliverables/__tests__/deliverable-content-signals.test.ts src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 12 suites, 165 tests passed.
- `npm run typecheck` — clean.
- Targeted ESLint for all changed TypeScript files — clean.
- Mutation checks confirmed tests fail when the unverified-evidence confidence guard, P2 phase selection, or signed-off-version SQL predicate is removed.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pending rerun after this record is added.
- Live signed-in verification — pending deployment; not claimed by this record.

## Rollout Plan

Merge through the protected-main pull-request process. The repository-owned ACA main deploy workflow builds and deploys the merged commit. Verify the exact commit's deployment run, digest-pinned web and worker image invariant, and signed-in P3 behavior before marking this release live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the repo-owned deployment workflow.
- Approved image digest: Pending the exact merged-commit workflow run.
- ACA runtime invariant: Pending deployment verification.
- Worker image invariant: Pending deployment verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; verify P3 displays the approved P2 source and does not present unvalidated synthetic evidence as a high-confidence recommendation.

## Rollback Plan

Revert the application change through a follow-up protected-main pull request and deploy that commit through the repo-owned ACA workflow. No database migration or data repair is required.

## Audit Evidence

- Pull request and CI run: Pending.
- Exact merged commit deployment run and ACA image digests: Pending.
- Signed-in P3 verification: Pending.
- Local test, typecheck, lint, and mutation results are recorded above.

## Known Gaps

No deployed or signed-in proof exists until the merged commit is deployed and verified. Confidence and evidence extraction remain bounded by the content and headings present in the approved deliverable.

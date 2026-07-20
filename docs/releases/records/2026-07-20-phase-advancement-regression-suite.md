# 2026-07-20-phase-advancement-regression-suite — Fill remaining Phase Advancement Control test gaps

## Release ID

`2026-07-20-phase-advancement-regression-suite`

## Status

`candidate`

## Plain-English Summary

Final item of the Phase Advancement Control and Override Governance program (MEMBER AI ASSIST
incident audit follow-up). The user's spec required regression coverage for 8 named scenarios:
pending generation, failed generation, missing deliverable, incomplete approvals, normal gate
failure, unauthorized override, authorized override, and misleading override labeling.

An audit against the actual merged `main` (after PRs #5158, #5159, #5160) found 5 of the 8 already
covered by tests written in those three PRs (missing deliverable, incomplete approvals, normal
gate failure, and — for `phase-gate-approval/route.ts` — unauthorized-permission rejection and
misleading-label soft-carry cases). Three gaps remained, all in `advance/route.ts` and
`governance.ts`, which had no test proving:

1. **Pending generation** — a `deliverables_v2` row that exists but is still `in_review` (not yet
   signed off) blocks the hard check the same way a missing row does.
2. **Failed generation** — a row with status `error` blocks the hard check rather than being
   silently treated as present-and-fine.
3. **Unauthorized override** (`advance/route.ts`) — `bypassGate: true` from a caller without
   `canApproveGates` is rejected with 403.
4. **Authorized override never bypasses a hard fail** (`advance/route.ts`) — even a caller WITH
   `canApproveGates` sending `bypassGate: true` still gets `gate_blocked` 409 when a hard check
   fails, proving no working hard-override capability exists in this route regardless of caller
   authority.
5. **Misleading override labeling** (`advance/route.ts`) — a soft-carry-only advance (no hard
   fails, one unmet soft check) returns `gateDecision.softGapsCarried: true` and
   `gateDecision.hardGateOverride: null`, never a bare "override" flag — mirroring the same
   assertion PR #5160 already added for `phase-gate-approval/route.ts`.

All 5 gaps are now filled. This release is test-only; no production code changed.

## Layer Impact

- **global-control-lane**: test-only change to shared Strategic Moves governance/route test
  suites. No runtime behavior changes for any tenant.

## Client Applicability

- All clients: N/A (test-only)
- Feature flag: None

## Changes Included

- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts`: 2 new tests — P3 architecture
  deliverable with `status: 'in_review'` (pending generation) and `status: 'error'` (failed
  generation), both proving `design_approved` stays a hard failure.
- `src/app/api/v1/programs/[programId]/advance/__tests__/route.test.ts`: 3 new tests —
  unauthorized `bypassGate` rejection (403), authorized `bypassGate` still blocked by a hard fail
  (409), and soft-carry-only advance correctly labeled `softGapsCarried`/`hardGateOverride` (never
  "override").

## QA / Validation

- `npx jest src/lib/programs/__tests__/governance-evaluate-gates.test.ts` — 20/20 passed (18
  existing + 2 new).
- `npx jest "src/app/api/v1/programs/[programId]/advance/__tests__/route.test.ts"` — 8/8 passed (5
  existing + 3 new).
- Broad sweep (`src/lib/programs/__tests__`, `src/app/api/v1/programs/[programId]`,
  `src/__tests__/integration/programs`) shows the same 21 pre-existing, unrelated failing suites as
  the post-#5160 baseline — zero new failures introduced.
- `npx eslint` on both changed files — 0 errors.
- `git diff --check` — clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass (after this record was
  added).
- No live phase transition was run against production data, per the standing constraint from the
  incident follow-up.

## Rollout Plan

Standard PR → CI → squash merge to `main`. Test-only change; the ACA deploy workflow will still
build and deploy a new image (per repo convention that every merge to `main` deploys), but no
runtime behavior differs from the prior deployed image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged by this PR)
- Shared runtime mutators: none
- Approved image digest: set by the deploy workflow at merge time; verified post-deploy
- ACA runtime invariant: verified post-deploy
- Worker image invariant: not applicable
- Feature/env flag update path: not applicable
- Live signed-in proof required: yes, read-only health check only (no phase transition — test-only
  change, no behavior to prove beyond confirming the deploy succeeded)

## Rollback Plan

Revert this PR. Test-only change; a revert simply removes the 5 new tests with no other effect.

## Audit Evidence

- This release record.
- PR (to be opened) with the diff and CI run link.
- Companion fixes: `docs/releases/records/2026-07-20-phase-gate-fabrication-fix.md` (PR #5158),
  `docs/releases/records/2026-07-20-decouple-build-queue-approve.md` (PR #5159),
  `docs/releases/records/2026-07-20-honest-override-labeling.md` (PR #5160).

## Known Gaps

- This completes the 8-scenario regression list from the Phase Advancement Control spec. The one
  remaining item from that program is task #104: an additive-only MEMBER AI ASSIST remediation
  record documenting the disputed P4 phase integrity — tracked as its own follow-on, not bundled
  into this test-only PR.
- The stale-type-key free-text loophole found in `phase-capture/route.ts` (see the fabrication-fix
  record's Known Gaps) and the deliberate decision NOT to build a new hard-gate override capability
  (see the honest-override-labeling record's Known Gaps) both remain open, flagged, separate items.

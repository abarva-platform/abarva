# 2026-09-18-program-gate-approval-behavior — Prove the program gate approval modal refuses an unaccountable advance

## Release ID

`2026-09-18-program-gate-approval-behavior`

## Status

`candidate`

## Plain-English Summary

Approving a gate on the program detail screen moves a program past criteria that
have not been met. The screen already required the person doing it to tick a
responsibility statement and write a rationale of real length before the button
would fire. Nothing proved that requirement still worked.

The catalog check over this surface looks for three symbol names in the file. A
name can survive a change that removes the behaviour behind it, and every other
test over this 6,957-line file reads it as plain text rather than running it.

This change adds a test that mounts the real page, opens the gate section the
way a user opens it, drives the real approval modal, and asserts that the
advance request is not sent until both halves of the control are satisfied — and
that the rationale sent is the one the human typed. It also wires that test into
the control-catalog CI job, so it runs on every pull request.

No product code changed. The control was already correct; what was missing was
the proof that it stays correct.

## Layer Impact

`global-control-lane`. Test and CI only — no canonical-model, adapter, intake or
product read path is touched. The one product file involved
(`src/components/programs/ProgramDetailPage.tsx`) is read by the new test and is
not modified.

## Client Applicability

- All clients: no behaviour change; the control being pinned is already live for
  everyone who can reach the program detail route.
- Specific clients: none.
- Internal only: the CI job and the control catalog entry.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/components/programs/__tests__/ProgramDetailPage.gate-approval.controls.test.tsx`
  — new behavioural suite, 8 cases, mounts the real `ProgramDetailPage`.
- `docs/security/ai-surface-control-catalog.json` — the `program-gate-approval`
  human-approval-gate control moves from `behavioralTest.status: "none"` to a
  named test path.
- `.github/workflows/ai-surface-control-catalog.yml` — one step added to the
  existing required job, so the suite runs rather than merely existing.

## QA / Validation

**The suite, on unmodified product code:** 8 passed / 8 total. The control was
already sound, so a red-first run was not available for the control itself; the
proof that the suite can fail is the mutation set below, which is the check that
matters for a coverage change.

**Five mutations of the real control, each caught:**

| Mutation | Result |
|---|---|
| `canSubmitHumanApproval` given `acceptedResponsibility: true` unconditionally | 1 failed / 7 passed |
| the rationale minimum dropped to `minChars: 0` | 3 failed / 5 passed |
| the approve button's `canApprove && !isLoading` guard removed from `onClick` and `disabled` | 5 failed / 3 passed |
| the POST body sends a fixed string instead of the typed rationale | 1 failed / 7 passed |
| the `HumanApprovalGate` block replaced by a bare textarea and checkbox | 1 failed / 7 passed |

The product file was restored from a byte copy after each mutation and
`git diff` over it is empty.

**The catalog gate itself was mutation-checked**, not assumed: with the catalog
naming the new test but the workflow step removed, `npm run
audit:ai-surface-controls` exits **1** with
`behavioral test … is never run by .github/workflows/ai-surface-control-catalog.yml
— a test that does not run proves nothing`. With the step present it exits **0**.

**Catalog coverage:** 25 of 37 controls before → **26 of 37** after. Of the 11
still uncovered, 8 sit on surfaces no route reaches and are excluded from that
count by the audit; the 3 remaining reachable ones are the shared response
renderer's `citation` display and the Atlas drawer's `ai-label` and
`citation-gap`.

**Scope baseline, same command either side.** `npx jest src/components/programs`:
**2 suites / 3 tests failing before → 2 suites / 3 tests failing after**, with a
byte-identical failing-suite list (`ProgramOriginationWorkspace`,
`StewardChat.attachments`, both pre-existing and unrelated). Passing 108 → 116.

`npx eslint` on the new file: exit 0, no output.
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with
`tsconfig.tsbuildinfo` removed first: **exit 0**.

## Rollout Plan

Merge to main. The repo-owned ACA deploy workflow builds and deploys on merge as
it does for every commit; this change contributes no runtime difference, since
the only non-test edits are a catalog JSON field and a CI workflow step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: whatever the main deploy produces for the merge commit;
  this change does not pin or override an image.
- ACA runtime invariant: to be read back after merge — template image must equal
  the 100%-traffic revision image, digest-pinned.
- Worker image invariant: untouched.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**. No rendered output, route response or
  stored value differs before and after; the only product file involved is read
  by the test and not modified. The proof that belongs to this change is the
  mutation set and the CI job, both recorded above.

## Rollback Plan

Revert the commit. The suite and the workflow step disappear together, the
catalog field returns to `status: "none"`, and the audit stays green because it
only requires a wiring when a test path is declared. No migration, no data, no
runtime state.

## Audit Evidence

- The new suite and its mutation table above.
- The `AI surface control catalog` CI job on the pull request, which must show
  the new step executing (`PASS
  src/components/programs/__tests__/ProgramDetailPage.gate-approval.controls.test.tsx`),
  not merely present.
- `npm run audit:ai-surface-controls` output, before and after, quoted above.

## Known Gaps

- **Signed-in acceptance is not applicable here** and is stated rather than
  waved through: nothing a browser session can observe changes.
- The catalog's `catalogClaimCoverage` block has no row for this surface, so its
  15-covered / 22-deferred split is unchanged. That block is a separate mapping
  from the per-control `behavioralTest` field and was left alone.
- Three reachable controls remain without a behavioural test, named above. The
  eight on unreachable surfaces are blocked on the open question of whether
  those surfaces should be mounted or retired, which is not a call this change
  makes.
- The suite hoists `initialNexusArtifacts` into a module constant. That prop is
  a `useEffect` dependency with a `[]` default, so an inline literal re-fires the
  effect on every render. The only caller is a server component whose prop
  identity is stable per request, so this is a test-harness detail and not a
  live defect — recorded because the next person to mount this page from a
  client component will meet it.

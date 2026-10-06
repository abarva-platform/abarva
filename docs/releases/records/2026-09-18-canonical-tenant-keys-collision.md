# 2026-09-18-canonical-tenant-keys-collision - One Symbol, Two Answers

## Release ID

`2026-09-18-canonical-tenant-keys-collision`

## Status

`candidate`

## Plain-English Summary

`AGENTS.md` is mandatory on this: *"Tenants come from code
(`CANONICAL_TENANT_KEYS`), never a hand-typed list. No tenant exceptions in any
scanner/validator/report/test."*

**`CANONICAL_TENANT_KEYS` is exported from two modules, with different
contents.**

| Module | Keys |
|---|---|
| `src/lib/tenant/aliases.ts` | **6** |
| `src/config/tenants/CANONICAL_TENANTS.ts` | **2** |

The narrow list is a strict subset: every key it holds is in the wide one, and
four keys are in the wide list only. The members are enumerated in the test, and
in the two modules themselves, rather than restated here.

The rule names a symbol that resolves to two different answers depending on the
import path. A caller that follows it correctly may be iterating two tenants or
six, and nothing tells them which.

This does not pick a winner — that is a product decision. It pins the divergence
and its consequences in a test that runs in CI, so the disagreement is a
visible, failing-on-change fact rather than something each reader rediscovers.

## Layer Impact

Test only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Why it matters — the consumers are split

Both lists are in live use, and the split is not along a tidy boundary.

Using the **narrow** (2-key) list:

- `src/lib/auth/operator-persona-provisioning.ts` — `ensureOperatorPersonProvisioned`
  returns `null` when the tenant is not in it, so no persons row and no
  membership is created. Fail-closed and silent. Four of the six tenants in the
  other list would be refused.
- `src/scripts/governance/inventory-scan.ts` and `readiness-backfill.ts` — the
  governance framework `AGENTS.md` declares mandatory enumerates two tenants.
- `src/app/(maestro)/admin/data-layer-explorer/page.tsx`.

Using the **wide** (6-key) list:

- `src/app/api/admin/parallel-run-invariants/route.ts`
- `src/scripts/tower/materialize-all-tenants.ts`

Whether four tenants are out of scope on purpose or by accident is exactly the
open question. Nothing here changes that behavior.

The divergence is also in the type system: the config export's element type is a
two-member literal union, so TypeScript refuses to even ask whether a key from
the wider list is in it. The test widens deliberately and says why.

## Changes Included

- `src/__tests__/behaviors/canonical-tenant-keys-collision.test.ts`: two cases
  pinning the divergence and naming the consumers on each side.

It is in `behaviors/` rather than `unit/` on purpose: **`src/__tests__/unit` is
named by no workflow and no npm script** — twelve suites that run nowhere, three
of them currently failing. `src/__tests__/behaviors` is executed in CI by
`scripts/ci/check-behavior-coverage.mjs`.

## QA / Validation

- Behavior gate (`npm run coverage:behavior-gate`, the command CI runs):
  **exit 0**, 16 suites, 197 tests — 15 suites and 195 tests before. Status:
  **pass**.
- Both lists and every consumer above read directly from the tree, not inferred.
  Status: **pass**.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` after deleting
  `tsconfig.tsbuildinfo`: **exit 0**. Its initial run failed on the
  literal-union mismatch described above, which is the finding rather than an
  obstacle to it.
  Status: **pass**.
- ESLint: **exit 0**. `release-check`: **exit 0**. Both captured as exit
  statuses, not read off a pipe. Status: **pass**.
- Signed-in acceptance: **not applicable** — no product behavior changes.

## Rollout Plan

Squash-merge after required checks pass. No deploy required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: None.

## Rollback Plan

Revert through a new PR. No runtime effect either way.

## Audit Evidence

PR link, the behavior-gate result, and the two module definitions.

## Known Gaps

- **The collision is not resolved.** Which list is canonical is a product
  decision with real consequences for who can be provisioned and which tenants
  the governance framework covers.
- The test asserts current behavior, so it will keep passing if someone changes
  one list without reconciling them — it fails only when the two agree. It pins
  the member lists explicitly to limit that.
- `src/__tests__/unit` (12 suites, 3 failing) and `tests/unit` (14 suites, one of
  which `test:nav` runs locally) are named by no workflow. Not wired here: the
  three failures need triage before that directory can gate anything.
- The provisioning consequence is read from the code path, not proven against a
  signed-in session for an affected tenant.

# 2026-09-19-ci-gate-registry-invoked-predicate — A longer script name no longer vouches for a shorter one

## Release ID

`2026-09-19-ci-gate-registry-invoked-predicate`

## Status

`released`

## Plain-English Summary

The repository keeps a register of every audit script and what it is for. The one
consequence that register enforces is that a script marked as a pull-request gate must
really be run by a CI workflow — because a gate nobody runs reports to no one.

The test deciding "is it run" was a plain text search for `npm run <name>` in the workflow
files. npm script names nest with colons, so `audit:example` is the opening of
`audit:example:guard`. A workflow that ran only the guard therefore satisfied the search
for the bare script as well, and the register accepted it as wired.

Three scripts were passing that way, and none of them ran in any workflow. They are the
reporting modes of three scanners whose gating modes — the `--fail` and `--check`
variants — are wired and do run. So no gate was actually missing from CI; the register was
counting three reporting tools as gates and reporting a larger number of gates than the
repository has. The honest count of pull-request gates is 18, not 21.

The search now requires the name to end where the workflow says it ends, the three
entries are reclassified as reports with the reason each one cannot fail, and a behavioral
suite runs the real checker against small fixture repositories so that neither the prefix
shortcut nor an over-tightened replacement can return unnoticed.

## Layer Impact

Release lane: `global-control-lane`. Repository CI tooling only.

- **Layer 1 (client intake), Layer 2 (source adapters), Layer 3 (canonical model), Layer 4
  (products):** no impact. No tenant data, no adapter, no canonical object, no product
  surface, route or component is touched by this change.
- **Control plane / CI:** `scripts/audit/ci-gate-registry-check.mjs` decides whether a
  declared gate is wired. Its verdict changes for three entries, and the register is
  corrected to match.

## Client Applicability

- All clients: no change. Nothing in the runtime, the data plane or any product surface is
  affected.
- Specific clients: none.
- Internal only: yes — repository CI tooling and its register.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/ci-gate-registry-check.mjs` — the invoked-by-workflow predicate matches a
  script name only where the name ends, for the workflow text and for composite script
  bodies alike. The one-level composite hop is unchanged and its limit is now written down
  beside it; that direction is a false negative, which is the safe way for this to be wrong.
- `docs/architecture/ci-gate-registry.json` — `audit:runtime-supabase-imports`,
  `audit:vercel-production-runtime` and `audit:control-plane-purity` move from `pr-gate` to
  `report`, each with the reason its bare mode has no failure path and the name of the
  wired mode that does gate.
- `src/__tests__/behaviors/ci-gate-registry-invoked-predicate.test.ts` — new behavioral
  suite, eight cases.

## QA / Validation

**The suite drives the real checker.** The checker resolves its own repository root from
its file location, so each case builds a scratch tree — a byte-copy of the checker at the
path it expects, a `package.json`, one workflow and a register — and runs it there. The
copy is made at test time, so a mutation of the real script is a mutation of what runs.

- **Before / after, same eight cases:** 3 failed / 5 passed → **0 failed / 8 passed**.
- **Both directions are pinned.** Three cases assert the prefix no longer counts, including
  the mirror case where the register wrongly told an author to promote a quarantined entry
  it believed was already running. Four assert that every legitimate route still counts: the
  exact name, the name with trailing arguments, the entry file run directly, and a composite
  the workflow runs. A predicate tightened until it says no to everything is not a repair.
- **Five mutations of the fix, each caught:** removing the end-of-name lookahead (3 failed —
  the same three as the pre-fix baseline); restoring the exact original substring test at the
  workflow level (2 failed); the predicate hard-wired true (4 failed); hard-wired false
  (7 failed); and one register entry put back to `pr-gate` (1 failed, the real-repository
  case). File byte-restored after each.
- `node scripts/audit/ci-gate-registry-check.mjs` — passes, 209 scripts: 18 pr-gate,
  3 quarantined, 3 report, 185 unclassified.
- Scope baseline, same command either side: `npx jest src/__tests__/behaviors` —
  **0 failing before, 0 failing after**; 22 suites / 246 tests → 23 suites / 254 tests.
- `npm run coverage:behavior-gate` — exit 0, observed lines 93.66 against a floor of 90.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with
  `tsconfig.tsbuildinfo` removed first — **exit 0**, no diagnostics.
- `npx eslint` over both changed files — exit 0, no output.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — exit 0.

## Rollout Plan

Merge to main. No runtime rollout: this is CI tooling and a register, neither of which is
shipped in the web image. The repo-owned Azure Container Apps deploy workflow will build
and deploy the merge commit as it does for any merge, and the runtime invariant is proven
afterwards as standard practice, but nothing in this change alters the running product.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No Azure command is run by this change.
- Approved image digest: unchanged by this release; the post-merge digest is recorded as
  evidence, not as a target this change sets.
- ACA runtime invariant: verified after merge as standard practice — template image equals
  the 100%-traffic revision image, digest-pinned.
- Worker image invariant: unchanged; no worker job template is touched.
- Feature/env flag update path: not applicable, no flag.
- Live signed-in proof required: **no**. No route, component, agent surface or data path
  changes, so there is nothing a signed-in session could observe.

## Rollback Plan

Revert the merge commit. The register and the checker return together; the three entries
revert to `pr-gate` along with the predicate that accepted them, so the pair stays
consistent either way. No migration, no data change, nothing to undo in Azure.

## Audit Evidence

- The pull request and its checks, including the `Behavior coverage floor` job log showing
  the new suite executing rather than merely declared.
- `docs/architecture/ci-gate-registry.json` — the three reclassified entries and the reason
  on each.
- The mutation results in QA / Validation above, reproducible by making the same five edits.
- The pre-fix baseline, reproducible by removing the lookahead in `endsWithScriptName`.

## Known Gaps

- **185 scripts remain `unclassified`.** This change corrects three entries that were
  actively wrong; it does not reduce the backlog of undecided ones.
- **The entry-file route is still a plain path match.** Two npm scripts that share one entry
  file and differ only by flags — a `--check` gate and a `--baseline` writer, for example —
  cannot be told apart by it, so a workflow running the file directly would vouch for both.
  No workflow does that today, so no entry is affected; it is reported rather than fixed
  here, because distinguishing them means comparing arguments and that is a different change.
- **The composite hop is one level deep.** A composite that runs a composite that runs the
  script is not followed. Unchanged by this release, now stated in the code.
- **Three gates remain quarantined** and this change neither wires nor triages them.

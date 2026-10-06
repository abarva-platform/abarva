# 2026-09-18-candidate-invisibility-guard-vacuous-checks - A Check Passing On A Deleted File

## Release ID

`2026-09-18-candidate-invisibility-guard-vacuous-checks`

## Status

`candidate`

## Plain-English Summary

The candidate invisibility guard exists to keep candidate-tenant rows off default
runtime reads — what a signed-in user sees must be active tenant truth, not a
candidate build. It reported **2 failures**, which reads as six of its eight
checks protecting something.

They were not. **Only 2 of the 8 checks were testing live code.**

Four of the checks name files that no longer exist. A fifth names a component no
route mounts. And three of those five were reported as **passing**, because:

```js
function readRel(file) {            // returns "" when the file is gone
  return existsSync(abs) ? readFileSync(abs, "utf8") : "";
}
function activePointerQuery(text) {
  if (!text.includes("tenant_pack_runs")) return true;   // "" satisfies this
  ...
}
```

A deleted file reads as an empty string, the empty string does not mention
`tenant_pack_runs`, and the check concludes there is nothing unsafe here — green.
The guard was greenest exactly where its subject had been removed.

This change makes a check with no live subject report `VACUOUS` and fail. The
guard now says `2 of 8 checks are testing live code`.

## Layer Impact

Audit tooling only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## What is actually still protected

This matters and is easy to overstate. The two live checks are the repo-wide
scans, and **they work**: a mutation that reintroduced a `tenant_pack_runs` read
with no active-pointer join was caught by `no-default-latest-loaded-runtime-read`
without any per-file check being involved.

So the general protection — no unguarded loaded/validated read anywhere in `src`
— is intact. What is gone is every per-surface assertion:

| Check | State |
|---|---|
| `no-runtime-current-pack-view` | live, passing |
| `no-default-latest-loaded-runtime-read` | live, passing |
| `default-home-route-no-preview-unless-flagged` | live, **failing** — the Home route now renders `HomePreviewAppRoot` off an ECL projection bundle and has no `candidatePreviewEnabled` |
| `default-active-pointer-home-browser` | vacuous — file deleted |
| `home-know-active-pointer` | vacuous — file deleted |
| `intelligence-dossier-active-pointer` | vacuous — file deleted |
| `tower-projection-active-pointer` | vacuous — file deleted |
| `candidate-preview-labels-visible` | vacuous — component mounted by no route |

The four deleted files went in `#6514`, which removed eight files verified to
have zero importers. That was correct work; the guard was simply never updated to
follow it. `intelligence_v7.active_tenant_contract_versions` now appears nowhere
in `src` at all.

## Changes Included

- `scripts/audit/candidate-invisibility-guard.mjs`: a check whose named file is
  missing, or whose named component no route mounts, is reported `VACUOUS` and
  counted as a failure. Uses the shared route-reachability walk. The failure
  output names every check and prints how many are testing live code.
- `docs/architecture/ci-gate-registry.json`: this gate's quarantine reason
  replaced with the triage result.
- `reports/candidate-invisibility-guard/`: regenerated.

## QA / Validation

Three mutations, each applied and reverted:

| Mutation | Result |
|---|---|
| A deleted guarded file comes back carrying the active-pointer join | that check goes vacuous → **PASS**; live count 2 → 3 |
| The same file comes back reading `tenant_pack_runs` with **no** join | that check goes vacuous → **FAIL**, and the repo-wide scan independently fails too (3 failures) |
| A live guarded file is deleted | its check goes FAIL → **VACUOUS**, not a silent pass |

Mutation one shows vacuous-detection is about the subject, not a blanket
failure. Mutation two shows the live repo-wide protection still catches a real
unguarded read. Mutation three shows the defect this change fixes.
Status: **pass**.

- `npm run audit:candidate-invisibility`: **exit 1**, as expected — it is a
  quarantined gate and this change makes it fail more honestly, not less.
  Status: **fail, intended** (1 failure, 5 vacuous, `2 of 8 checks are testing
  live code`).
- `npm run audit:ci-gate-registry`: **exit 0**. Status: **pass**.
- ESLint on the guard: **exit 0**. `release-check`: **exit 0**. Both captured as
  exit statuses, not read off a pipe. Status: **pass**.
- No TypeScript changed.
- Signed-in acceptance: **not applicable** — no product behavior changes.

## Rollout Plan

Squash-merge after required checks pass. The gate stays quarantined — it is not
wired into a workflow, so its exit 1 blocks nothing. No deploy required.

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

PR link, the three mutation results, and the guard's own report under
`reports/candidate-invisibility-guard/`.

## Known Gaps

- **The five dead checks are not rewritten.** Doing that means deciding what
  candidate invisibility means on the ECL projection path the Home route reads
  today, which is design work, not audit work. Until then the per-surface
  assurance is absent and now says so.
- Only this one guard was examined. The same `readRel`-returns-empty-string shape
  may exist in other audit scripts; nothing here sweeps for it.
- `VACUOUS` is detected from a missing file or an unmounted component. A check
  whose file exists and is mounted but whose assertion no longer describes
  anything meaningful still reads as a pass.

# 2026-09-18-legacy-audit-failure-counts - Twenty-Six Failures, Three Problems

## Release ID

`2026-09-18-legacy-audit-failure-counts`

## Status

`candidate`

## Plain-English Summary

The last two quarantined gates reported **26 failures between them** —
`audit:legacy-context-retirement` 7 and `audit:legacy-dataset-sunset` 19. That
number is what a reader would size the work from.

They are roughly **three distinct problems**, and one of them accounts for 20 of
the 26.

| Gate | Reported | Distinct | Why the gap |
|---|---|---|---|
| `legacy-context-retirement` | 7 | 5 | two rows are appended to two report sections and counted twice |
| `legacy-dataset-sunset` | 19 | 1 | one missing input pack, counted once per file |

Of the retirement audit's 5, **three read a file deleted in `#6514`** — the same
dead V7 read path already found in the candidate invisibility guard. This change
reports those as `VACUOUS` rather than as failures, and stops the double-count.
The audit now says: **2 failures, 3 checks with no live subject.**

## Layer Impact

Audit tooling only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## The three distinct problems

**1. One tenant has no `standard-2026-07-v3` input pack** — this is 19 of the
sunset audit's 19 rows and 1 of the retirement audit's 5. The tenant carries a
`v2026-08-governed-intake/` directory instead. Whether that is a tenant behind
the standard or a standard behind the tenants is a data decision, not an audit
one, and is left open.

**2. Three checks read `src/lib/home/v7-context-browser.ts`**, deleted in `#6514`
as verified dead code. `readFileSafe` returns `""` for it, so they reported as
policy violations when the policy has no subject. Same root cause as the
candidate invisibility guard triaged earlier today. Now `VACUOUS`.

**3. `home-approved-artifact-fallback-present` is a genuine failure with the same
root cause.** The Home route no longer calls `getLocalCxoRuntimeBrowser`; it
reads an ECL projection bundle. Unlike the three above, its module still exists,
so a file-existence test cannot catch it — but nothing outside its own test
imports that module either. It presents as a failure and is really the same
architecture change.

## What this deliberately does not change

**The hard-coded tenant list.** Both audits open with:

```js
const TENANTS = ["meridian-health", "skyharbor-air", "first-capital"];
```

`AGENTS.md` is explicit: *"Tenants come from code (`CANONICAL_TENANT_KEYS`), never
a hand-typed list. No tenant exceptions in any scanner/validator/report/test."*
Two of the six tenants in `src/lib/tenant/aliases.ts` are never checked by either
audit.

This is not fixed here for two reasons. Expanding the list is a scope decision
that would change what these gates demand of tenants nobody has decided are in
scope. And **`CANONICAL_TENANT_KEYS` is exported twice from different modules
with different contents** — six keys in `src/lib/tenant/aliases.ts`, two in
`src/config/tenants/CANONICAL_TENANTS.ts`. The rule names a symbol that resolves
to two different answers, so "use the canonical list" has no single meaning until
that is settled. Recorded rather than guessed at.

## Changes Included

- `scripts/audit/legacy-context-retirement.mjs`: checks whose named file no longer
  exists report `VACUOUS` with the reason; `requiredReplacementRows()` no longer
  appended to two sections; the failure output names every row.

## QA / Validation

- `npm run audit:legacy-context-retirement`: **exit 1**, as expected for a
  quarantined gate. Output is now `2 failure(s), 3 check(s) with no live subject`
  against the previous `7 failure(s)`, with each row named. Status: **fail,
  intended**.
- Every distinct failure verified by hand against the tree: the deleted file
  confirmed absent and its deletion commit read; the tenant's directory listing
  compared against the two tenants that pass; `getLocalCxoRuntimeBrowser`
  confirmed absent from the Home route and its module confirmed to have no
  non-test importer. Status: **pass**.
- `npm run audit:legacy-dataset-sunset`: **exit 1**, unchanged by this release —
  all 19 rows are the one missing input pack. Status: **fail, pre-existing**.
- ESLint: **exit 0** (one pre-existing unused-variable warning, untouched).
  `release-check`: **exit 0**. Both captured as exit statuses, not read off a
  pipe. Status: **pass**.
- No TypeScript changed.
- Signed-in acceptance: **not applicable** — no product behavior changes.

## Rollout Plan

Squash-merge after required checks pass. Both gates stay quarantined — neither is
wired into a workflow, so their exit 1 blocks nothing. No deploy required.

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

PR link, the audit's before and after output, and the reports under
`reports/legacy-context-retirement/` and `reports/legacy-dataset-sunset/`.

## Known Gaps

- **The sunset audit still reports 19 rows for one problem.** Per-file rows are
  informative; the headline count is not. Grouping it was left alone rather than
  restructuring a second audit in the same change.
- The retirement audit's report headline and its exit-code count are computed
  from **different row sets** — `writeSummary` includes language rows, the exit
  path filters by mode — so the two can disagree. They agree today because no
  language row is failing. Not fixed here.
- The three vacuous checks are not rewritten against the current read path. Same
  open design question as the candidate invisibility guard.
- Neither audit is wired into CI, so none of this is enforced yet.

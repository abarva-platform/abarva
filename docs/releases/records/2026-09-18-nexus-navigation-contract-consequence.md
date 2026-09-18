# 2026-09-18-nexus-navigation-contract-consequence - A Contract A Right Answer Fails

## Release ID

`2026-09-18-nexus-navigation-contract-consequence`

## Status

`candidate`

## Plain-English Summary

Second of the four gates quarantined by the gate registry. `audit:nexus-navigation`
had three failures. **All three are stale expectations, and all three come from
one correct PR two days ago.**

`#7721` split the Source nav entry into "Source Optimize" and "Source New", and —
because a sixth item needed more room — moved the responsive breakpoint from
900px to 1050px. Both changes were deliberate. The contract asserted the old
label set and the literal string `@media (max-width: 900px)`, so it began failing
the moment the nav became correct. Nobody saw, because the audit runs in no
workflow.

The label expectations are corrected. The CSS assertion is replaced with one that
states the consequence instead of the number, and the gate is un-quarantined and
wired.

## Layer Impact

Audit tooling and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## The three failures

| Failure | Verdict |
|---|---|
| `Missing canonical nav label: Knowledge` | stale — Knowledge left the global nav; the registry's own header comment names the canonical set without it |
| `Missing canonical nav label: Source` | stale — `label: "Source"` became `label: "Source Optimize"` and `label: "Source New"` in `#7721` |
| `must retain the approved compact mobile menu treatment` | stale — the treatment is entirely intact; only the breakpoint literal moved, in the same PR |

The compact menu was verified present and correct: `.desktopLinks` shows by
default and hides at 1050px, `.mobileMenu` hides by default and appears at 1050px.

## Why the CSS check was the real problem

It required the string `@media (max-width: 900px)`. A correct change to the
breakpoint failed it. **A check that a right answer breaks is a check people learn
to loosen** — and loosening it to "some media query exists" would have made it
prove nothing.

What actually has to hold is not a number: exactly one of the two link sets is
visible at any width. Desktop links show by default and hide at some breakpoint;
the mobile menu hides by default and appears at **the same** one. Any gap leaves a
window with no navigation, or with two. The check now parses the stylesheet for
those four facts and compares the breakpoints to each other rather than to a
constant.

Knowledge is also now asserted as *absent* from the global nav, alongside the
existing assertion for Learn — so its removal is a stated decision rather than a
silence.

## Changes Included

- `scripts/audit/nexus-navigation-contract.mjs`: corrected label set; retired-item
  assertions; consequence-based responsive check.
- `.github/workflows/architecture-boundary.yml`: runs it.
- `docs/architecture/ci-gate-registry.json`: `quarantined` → `pr-gate`.

## QA / Validation

Six mutations, each applied and reverted. The one that matters most is the one
that must **not** fail:

| Mutation | Result |
|---|---|
| Breakpoint moved 1050 → 900 for **both** rules (a legitimate design change) | **passes** — the old contract failed exactly this |
| Mobile menu appears at 760px while desktop links hide at 1050px | caught, naming both numbers |
| The compact mobile menu is never revealed | caught |
| The compact mobile menu shows at desktop widths too | caught |
| A canonical nav label is renamed | caught |
| Knowledge returns as a global nav item | caught |

Status: **pass**.

- `npm run audit:nexus-navigation`: **exit 0**. Status: **pass**.
- `npm run audit:ci-gate-registry`: **exit 0** — 18 pr-gate, 3 quarantined, 185
  unclassified. Status: **pass**.
- Every other step of the `architecture-boundary` job run locally: **exit 0**.
  Status: **pass**.
- ESLint: **exit 0**. `release-check`: **exit 0**. Both captured as exit statuses,
  not read off a pipe. Status: **pass**.
- No TypeScript changed.
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

PR link and the six mutation results above.

## Known Gaps

- The responsive check reads the stylesheet, not a rendered page. A rule defeated
  by specificity elsewhere, or a component that never applies the class, would
  still satisfy it. Proving it at the pixel needs a rendered viewport test.
- The canonical label set is a list in the audit that has to be changed alongside
  the registry. That is deliberate — deriving it from the registry would let a
  code change redefine the approved set — but it means a legitimate nav change
  touches two files, and the audit is the one people will forget.
- Two gates remain quarantined: `audit:legacy-context-retirement` (7 failures) and
  `audit:legacy-dataset-sunset` (19). Neither is triaged here.

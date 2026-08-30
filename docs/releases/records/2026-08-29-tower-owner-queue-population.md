# Tower — the owner queue counts cases, not rollouts

## Release ID

`2026-08-29-tower-owner-queue-population`

## Status

`candidate`

## Plain-English Summary

Decisions → By owner groups work by sponsor under the columns Sponsor · **Cases** · Investment ·
Sponsor-stated · Open proof items. It iterated the whole portfolio with no filter, so the thirteen
tool rollouts were counted as cases.

A rollout carries a business owner, which is why it landed under a sponsor. It carries no
investment, no sponsor-stated value and no finance status, so each one added a row that contributed
nothing but the count. And `hasOpenProof` returns true for anything without a benefit claim — which
a rollout never has — so every one of them also became an open proof item.

The effect on the two numbers a sponsor would read:

| | Shown | Actual |
| --- | --- | --- |
| Cases (column total) | 55 | **42** |
| Open proof items (column total) | 47 | **34** |

Both now count business cases only. The headline's denominator was also taken from the unfiltered
portfolio while its numerator came from the filtered rows; it now comes from the same population as
the rows.

## Layer Impact

Lane: `global-control-lane`. Tower product surface only — one panel. No reader, loader, type or
data change. `financeStatus` is written on case payloads only, so its presence is what separates
the two populations; that separator was established when `finance_status` was given its own key and
is reused here rather than re-derived.

## Client Applicability

**All clients.** Every tenant reading Decisions → By owner. Not flagged, not tenant-scoped. Tenants
whose projection carries no tool rollouts see no change at all.

## Changes Included

- `views/QueueOwnerPanel.tsx` — skip rows with no finance status; take the denominator from the
  same rows; say "cases" where it means cases.
- `__tests__/case-attribute-widening.test.ts` — two guards.
- `__tests__/mechanical-panels.test.tsx` — the assertion pinned the old noun; updated, counts
  unchanged.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 29/29, two new guards |
| Tower suites | PASS against baseline — 517 pass / 21 fail across 6 suites; failing set diffed against `origin/main` and **identical** |
| `tsc --noEmit` | PASS — clean |
| `eslint` | PASS — clean |
| Live signed-in proof | NOT RUN — pending deploy. See Known Gaps. |

## Rollout Plan

Ships with the next `main` deploy through the repo-owned ACA main deploy workflow. No flag, no env
change, no data build.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`, digest-pinned. No ad-hoc `az` command
and no shared-traffic mutation from this branch.

## Rollback Plan

Revert the commit. One panel, no stored value changed.

## Known Gaps

- **Not yet live-proven.** The column totals should read 42 and 34 after deploy.
- **`hasOpenProof` still opens every case with no benefit claim, foundation cases included.** The
  verdict tab states the opposite rule in as many words — "Foundation rows carry no direct value.
  Their $0 is a recorded fact, not missing data." A foundation case that asserts no value owes no
  value proof, so counting it as an open proof item contradicts the page's own stated rule. Left
  unchanged deliberately: deciding it needs a view on whether a foundation's proof obligation is
  different in kind, not a code change made in passing.
- The "What must happen next" tab badge reads 34 from `view.actions.length` and matches nothing
  rendered on the tab — its default sub-tab shows 3 sequenced decisions. That the badge and this
  panel's corrected queue now both read 34 is a coincidence of this dataset, not a relationship.

## Audit Evidence

Found by reading the deployed page at revision `ca-abarva-web-lab-eastus--m4a97e6af`: the Cases
column summed to 55 against a 42-case portfolio, and Open proof items summed to 47.
`AI Portfolio Operations Lead` appeared as a sponsor with 3 cases, $0 investment and no value —
which is the generator's default `business_owner_role` for a tool rollout.

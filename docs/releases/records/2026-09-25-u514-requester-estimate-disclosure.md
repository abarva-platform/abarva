# 2026-09-25-u514-requester-estimate-disclosure — Qualify the requester-declared value estimate on both Source approval surfaces

## Release ID

`2026-09-25-u514-requester-estimate-disclosure`

## Status

`candidate`

## Plain-English Summary

`source_events.estimated_value_usd` is a number the requester types into intake. Nothing validates it
before an approver sees it — it is not read from a contract, an invoice or the value ledger. Four
Source surfaces render that number. Two of them told the reader where it came from; two printed it
bare, so on the approvals inbox and on the event approval page a self-declared figure sat beside the
event code and the stage label, which are facts, and read exactly like a measured one.

This change puts the qualifier on the two surfaces that lacked it. The wording is not new: the two
intake surfaces already carried the two phrasings, and they were the only occurrences of that wording
anywhere in `src/`. They are moved into one small repo-owned module and all four surfaces now import
it, so the four cannot drift apart and a fifth surface has something to import rather than a sentence
to re-type. No wording changed on either intake surface.

Which phrasing goes where follows the shape of the surface rather than taste. A card or a
dot-separated metadata line takes `Requester estimate: $4.2M · Not validated`; a single free-text
field read as a sentence takes `Requester estimate: $4.2M (not validated)`. The event approval page's
`Value or savings target` fact uses the field form deliberately: the intake originate surface writes
that exact string into that same field, so the page's own fallback had to match it or one field would
read two ways depending on which writer filled it.

The change is conditional, not blanket. A value target the intake captured in its own words is left
exactly as written and does not acquire the label.

## Layer Impact

Release lane: `global-control-lane`. This is shared app behavior for every client, not gated by a
flag and not scoped to one tenant's data.

- **Layer 4 — Products (Source).** Presentation only. Two surfaces gain a provenance qualifier around
  a figure they already rendered.
- **Layer 3 — Canonical model.** Unchanged. No column, no read model, no value is computed or
  altered; the same number is rendered with the label the product already used for it.

## Client Applicability

- All clients: yes — every tenant whose Source events carry a requester-declared estimate.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The qualifier is unconditional wherever the declared figure is the source of
  the rendered value.

## Changes Included

- `src/lib/source/requester-estimate-label.ts` — new. The single wording authority, with both existing
  forms and the reason each one exists.
- `src/app/(maestro)/source/approvals/page.tsx` — the inbox metadata line now renders the card form
  instead of the bare figure.
- `src/app/(maestro)/source/events/[eventId]/approval/page.tsx` — the `Value or savings target`
  captured fact labels the declared-figure fallback with the field form; the intake-authored branch is
  untouched.
- `src/components/source/new-workspace/SourceNewRequestFirstPage.tsx` — same rendered text, now read
  from the shared module.
- `src/components/source/SourceOriginatePage.tsx` — same written text, now read from the shared module.
- `src/app/(maestro)/source/__tests__/requester-estimate-disclosure.test.tsx` — new suite, 5 cases.

## QA / Validation

**Every assertion is made against rendered DOM**, not against the file's bytes. Both page components
are invoked and their output is rendered; the byte-scan equivalent is the check this backlog keeps
finding green over surfaces that render nothing of the kind.

Clean baseline from a separate `origin/main` worktree at `2ccef7d29`, same scope, same command:

| | suites | tests | failing |
|---|---|---|---|
| before (clean `origin/main`, 7 suites — new file absent) | 7 | 68 | 7 |
| after (8 suites) | 8 | 73 | 7 |

The 7 failures are the **same 7 by name**, all in
`src/__tests__/integration/source/source-originate-page.test.ts`, and they fail identically on clean
`origin/main` — diffed by test name, not by count. They are pre-existing and are filed separately as
item U-515; this change neither causes nor repairs them.

Red first, before the fix: **2 failed, 3 passed** of the 5 new cases, each failing on the defect —
`"SRC-0042 · Intake · $4.2M"` and `"Value or savings target$4.2M"`. After the fix: **5 passed**.

Five deliberate mutations, five killed, each by the assertion that should have fired:

| # | mutation | result |
|---|---|---|
| 1 | inbox renders the bare figure again | inbox case fails — `"SRC-0042 · Intake · $4.2M"` |
| 2 | approval-page fallback renders the bare figure again | fact case fails — `"Value or savings target$4.2M"` |
| 3 | label applied unconditionally, over the intake-authored branch too | the *absence* case fails — `"…Requester estimate: Hold contracted annual value flat…"` |
| 4 | card form keeps the label, drops `Not validated` | inbox case fails on the qualifier alone |
| 5b | an unrelated reachable Source surface is made to render the label | false-positive case fails |

Mutation 5 was run in both directions on purpose. **5a** put the literal
`"Requester estimate: … · Not validated"` into `SourceValueLedger.tsx` as an unrendered constant: all
5 cases still passed, which is the control proving these assertions read the DOM rather than the file.
**5b** then rendered that same constant and the false-positive case failed. `SourceValueLedger` was
restored byte-identical afterwards and is not part of this change.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, no
  diagnostics. Judged on the exit code: a bare `npx tsc --noEmit` exits 134 on this host with no
  output, which greps as clean.
- `npx eslint` over all six touched files — 0 errors, 0 warnings.

**Surface census, as the item asked.** Four surfaces render this field: the two above, plus
`SourceNewRequestFirstPage.tsx` and `SourceOriginatePage.tsx`, which already qualified it. This change
covers the 2 that did not and leaves the other 2 reading exactly as before. Two further files mention
the column without rendering it and are correctly untouched: `events/[eventId]/page.tsx` selects it in
SQL only, and `RenewalCockpitActionBar.tsx` writes into it (see Known Gaps).

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys. No migration, no data
build, no flag, no worker change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none. No `az` command is run by hand for this release.
- Approved image digest: recorded on the deploy line appended to the register after the run completes.
- ACA runtime invariant: to be proven after deploy — Container App template image, 100%-traffic
  revision image and required worker job images all equal the approved digest.
- Worker image invariant: unchanged by this release.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes, and it is OWED, not claimed.** These are two signed-in Source
  surfaces. An unattended run cannot perform that check, so this record does not assert it.

## Rollback Plan

Revert the squash commit. Presentation-only, no schema and no persisted value, so the revert is
complete and immediate — the surfaces return to rendering the bare figure.

## Audit Evidence

- The pull request and its CI run.
- The new suite, which is the executable statement of the control and fails when either surface
  reverts.
- The before/after baseline and the five mutation results in this record.

## Known Gaps

- **The signed-in acceptance is owed**, per Deployment Authority above.
- **The provenance label describes the column, not the writer.** `RenewalCockpitActionBar.tsx:271`
  creates a Source event from the renewal cockpit and writes `currentAnnualSpendUsd` — a contract-read
  figure — into `estimated_value_usd`. A row created that way will now be labelled "Requester
  estimate", which is wrong about the *provenance* while remaining right about the *column*. Neither
  approval surface can distinguish the two, because the column carries no provenance of its own. Filed
  as item U-516; fixing it needs a provenance field, not a wording change, and doing it here would
  have been a data-model change inside a labelling item.
- **A separate finding, filed not fixed:** `events/[eventId]/approval/page.tsx` calls
  `formatSourceFinancialValue(value, true)` with the permission flag hard-coded, so this page shows
  exact financial values to a user whose policy restricts them. Filed as item U-517. Untouched here
  because it is an authorization defect, not a disclosure-wording one, and it predates this change.

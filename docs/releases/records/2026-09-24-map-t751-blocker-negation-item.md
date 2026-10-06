# 2026-09-24-map-t751-blocker-negation-item — place one filed item on the structure map

## Release ID

`2026-09-24-map-t751-blocker-negation-item`

## Status

`candidate`

## Plain-English Summary

One line, placing item `T-751` on the execution board's structure map.

The map declares structure only — it carries no status — and the board can only place an item it
finds there. An item in the backlog and in no map entry is reported as unmapped and is offered to
nobody: it appears in no bucket of the generated work queue, claimable or blocked. Filing an item
without mapping it therefore files an invisible one, which is the same failure mode as the
reader defect repaired earlier today under `T-750`.

`T-751` was filed in the same session as a follow-on finding and is deliberately **not claimed**;
this change only makes it visible to whoever does take it.

## Layer Impact

Release lane: **`internal-admin`**. AbarVa-only operator tooling.

- **Layer 4 (products):** none. No route, component, prompt, read model, migration or tenant
  record. No application code imports `scripts/exec/*`.
- **Control/tooling:** one entry appended to the platform track of the structure map. No
  generator logic changes.

## Client Applicability

**Internal only** — the recipients are AbarVa operators, and no client receives this change. No
tenant, cover name or client-scoped artifact is read or written, and no client-facing surface
changes.

## Changes Included

- `scripts/exec/source-stage-map.json` — appends `"T-751"` to `platformTrack.items`.

## QA / Validation

- The file parses as JSON, and the diff is a single added line (`1 file changed, 1 insertion(+)`),
  so the existing formatting is untouched.
- `node scripts/exec/build-source-board.mjs` refuses to run when the map repeats an item
  reference, and `T-751` appears once.
- Before this change the board reported `T-751` in its `not placed on the map` list and the
  generated queue offered it in no bucket. Both were read directly, not assumed.
- `node scripts/exec/build-source-board.test.mjs` and the sibling execution-toolchain suites are
  unaffected by a map entry; the board suite was run and passes.

## Rollout Plan

Merge to `main`. No runtime rollout: one line in an operator data file read by CLI generators.
The next board run picks it up.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime image behaviour changes.
- ACA runtime invariant: to be read from the merge-keyed deploy run's own
  `runtime-invariant-proof.json` plus an independent read-only Azure read, and recorded in the
  claim register.
- Worker image invariant: unchanged by this diff.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing here is reachable from a product route.

## Rollback Plan

Revert the single commit. The line disappears and `T-751` returns to the unmapped list; no state
to unwind.

## Audit Evidence

- The pull request for this record, its checks, and the squash SHA.
- The board's `not placed on the map` line before and after, quoted in the PR body.

## Known Gaps

- **Eleven other ids remain unmapped** and are offered to nobody: `C-501`–`C-506`, `D-044`,
  `D-511`, `T-749`, `U-503`, `U-504`. They belong to other agents' filings and are not adopted
  here — mapping another lane's item would be a claim on it. The board names all of them on every
  run and fails the run while any remain, which is that control working.
- **The Client Applicability gate matches on fixed phrases**, and the first wording of that
  section here — "the recipients are internal AbarVa operators only, and no client receives this
  change" — was refused for containing none of them, although it states the answer more precisely
  than the accepted `not applicable` does. The wording above was changed so the phrase the gate
  looks for and the sentence's meaning are the same thing rather than a keyword added to satisfy
  it. Noted, not filed: the gate is doing useful work and its phrase list is a separate judgement.
- **The item this places is filed, not solved.** `T-751` asks for the blocker population to be
  measured before its rule is touched, and nothing in this change measures it.

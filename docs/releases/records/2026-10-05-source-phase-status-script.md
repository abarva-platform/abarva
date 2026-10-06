# Source — a phase status report anyone can run

## Release ID

2026-10-05-source-phase-status-script

## Status

Merged — not deployed and not live-proven by this record.

## Plain-English Summary

Status for the Source journey was being produced by hand, from ad-hoc searches, and written into a
document that went stale the moment anything merged. Twice this week a status claim was wrong because
the search behind it was wrong, not because the product had changed.

`npm run source:phase-status` prints what exists, measured from a named git ref. Every number is a
count of files or declarations in the tree. There are no percentages and no judgements about how
nearly done anything is — those are exactly the figures that drift from the code and then get quoted.

It reads `origin/main` by default and takes `--ref` for any branch, so the question it answers is
about a commit rather than whatever happens to be in a working tree.

## Layer Impact

Release lane: **internal-admin**.

A reporting script and an npm entry. No product code, no schema, no route, no runtime behaviour.

## Client Applicability

**Internal only.** No client receives this and none is affected. It is a reporting tool for the
team, run from a terminal; it ships no runtime artefact and touches nothing a client can reach.

## Changes Included

- `scripts/source/source-phase-status.mjs` — the report.
- `package.json` — `source:phase-status` entry.

## QA / Validation

| Check | Status |
|---|---|
| Runs against `origin/main` | PASS |
| Runs against an arbitrary ref (`--ref`) | PASS |
| `--json` output | PASS |
| Controls fire on known positives | PASS — `source.vendor` 7, executed-NDA writer 1 |
| Negative control stays zero | PASS — nonsense pattern 0 |
| Broken control halts the report | PASS — exit **1**, board suppressed |
| Healthy run | PASS — exit **0** |
| ESLint | PASS — exit 0 |

**The controls are the point.** A probe that cannot fire reports zero for everything, and a board of
all zeros reads exactly like a product nobody built. The script refuses to print if a control
disagrees with reality, and exits non-zero so it can gate rather than merely inform.

Two defects were caught while building it, both in the probes rather than the product:

1. `accepted_by_user_id` matched two authority migrations that have nothing to do with evidence
   state, so an unmerged column read as present. Now anchored to the index name, which exists only
   if the columns do.
2. The exit code was first read through a pipe, which reports the exit of `tail` rather than of the
   script. Verified directly afterwards: 1 on a broken control, 0 when healthy.

Each probe was also checked in both directions where a branch made that possible — the evidence
acceptance probe reads 0 on `main` and 1 on the branch that adds the column, and the award probe
reads 0 on `main` and 1 on the branch that adds the table. A zero that cannot become a one is not a
measurement.

## Rollout Plan

Merge to `main`. Nothing deploys; the script is run on demand from a terminal.

## Deployment Authority

Not applicable — no runtime artefact.

## Rollback Plan

Revert the commit. Nothing depends on the script.

## Audit Evidence

- Control results are printed on every run, above the board, so a reader can see the instrument was
  checked before reading its output.
- A dash in the board is a measured zero, stated as such in the footer, so absence is never read as
  "not investigated".

## Known Gaps

- The probes cover capability presence, not whether any of it has been exercised against data. A
  phase can read as built and never have run.
- Phase grouping follows the six-phase operator model, which is a proposal and not a structure the
  product enforces.
- Nothing runs this in CI. It informs; it does not yet gate.

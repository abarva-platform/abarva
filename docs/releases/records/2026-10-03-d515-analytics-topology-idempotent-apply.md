# 2026-10-03-d515-analytics-topology-idempotent-apply — Make the analytics-topology generator idempotent and terminator-preserving

## Release ID

`2026-10-03-d515-analytics-topology-idempotent-apply`

## Status

`candidate`

## Plain-English Summary

`scripts/data-refresh/generate-analytics-topology.mjs` builds the missing analytics layer for a
synthetic tenant's integration inventory: it reads the operational data flows a tenant already
records and adds the feeds and publication hops that carry them into the warehouse, cloud and BI
platforms the estate declares.

Its own header promised that running it twice produced identical output. That was true of the set
of rows it *generates* and not of the file it *writes*: the generated rows were appended to
everything already in the file, including the rows an earlier run had put there. So a second
`--apply` added a second copy of every feed and every publication hop. On the generator's own test
fixture, nine rows became fifteen with only nine distinct names.

The duplicate rows were caught downstream rather than silently kept — after the id minter ran, the
tenant identity-ledger gate refused the file for duplicate ids — so this is a defect in the
generator, not a data-quality escape. Nothing reached a product surface.

Separately, the generator rewrote the file with Unix line endings whatever the input used, while the
id minter that runs immediately after it has preserved the input's line endings since an earlier
change. A tenant file taken in with Windows line endings therefore flipped on every generator run,
which turns a few-row change into a whole-file diff and hides the real edit from a reviewer.

Both are now fixed. A row this generator already wrote is kept exactly as it stands rather than
regenerated, and the file keeps the line endings it arrived with. A second `--apply` on an
already-generated tenant leaves the file byte-for-byte unchanged.

## Layer Impact

**Release lane: `internal-admin`.** This is an AbarVa-only operator capability — a data-authoring
script run by hand against repository-held synthetic intake. It is not `client-data-lane`: no
tenant schema, RLS, seed, ingestion or retrieval path changes, and the release writes no tenant
file. It is not `global-control-lane`: nothing in the app or control plane reads this script, and
no request path reaches it.

- **Layer 1 — client intake.** The intake CSV this generator writes
  (`05_data_assets_integrations.csv`) is no longer rewritten by a repeat run. No column, row or
  value changes for any tenant: on the one tenant that has been generated, a re-run now reports 133
  generated rows already present and 0 newly appended.
- **Layer 2 — source adapters.** Unchanged.
- **Layer 3 — canonical model.** Protected rather than changed. Keeping the existing rows instead of
  rebuilding them preserves the canonical object ids the owning minter has already recorded in the
  tenant's identity ledger; a rebuild would blank an id the ledger declares, which the ledger gate
  reads as a lost object.
- **Layer 4 — products.** No product surface changes. This is an authoring-time generator that runs
  by hand against repository-held synthetic intake, never in a request path.

## Client Applicability

- All clients: no.
- Specific clients: none. No tenant data is modified by this change; the fix is to the authoring
  tool, and it was verified against the synthetic airline tenant with a dry run that writes nothing.
- Internal only: yes — an operator-run data-authoring script and its test suite.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/data-refresh/generate-analytics-topology.mjs`
  - Rows the generator previously wrote are recognised by the `source_file` marker it stamps, and a
    generated row whose key is already present is not emitted a second time. Identity is
    `data_asset_name`, which is the key column the template ontology declares for a `data_asset` and
    the key the minter's ledger uses.
  - The existing row is **kept**, not rebuilt. This is the load-bearing half: a rebuilt row carries a
    blank `data_asset_id`.
  - The file's line terminator is detected from the bytes read and reused on write, by the same
    majority rule the owning minter in `scripts/data/assign-stable-identity.mjs` already applies.
  - The run summary now distinguishes rows already present from rows newly appended, so a no-op run
    reports itself as one instead of printing a generated count that did not reach the file.
  - The header's "running it twice produces identical output" is restated as the stronger claim the
    code now holds, with the narrower one it used to make named as the defect.
- `scripts/data-refresh/generate-analytics-topology.test.mjs` — four new cases, run in CI by
  `npm run check:identity-ledger` (`.github/workflows/tenant-identity-ledger.yml`).

## QA / Validation

Baseline measured over the same scope on the merge base, `26a2ed5c68`:

| scope | before | after |
|---|---|---|
| `npm run check:identity-ledger` | 19 pass / 0 fail | 23 pass / 0 fail |
| `node --test scripts/data-refresh/generate-analytics-topology.test.mjs` | 3 pass / 0 fail | 7 pass / 0 fail |
| ledger gate, both registered tenants | PASS / PASS | PASS / PASS |

**Red first.** The three cases that describe the defect were written before the fix and run against
the unmodified generator: `3 pass / 3 fail`. Against the fix: `7 pass / 0 fail`. The failing three
were re-run against the unmodified generator *after* one of their assertions was corrected, so the
red result belongs to the assertions that shipped and not to an earlier draft of them.

A fourth case, `an LF input stays LF`, is **not** red on the pre-change generator — that generator
wrote LF unconditionally and satisfied it by accident. It is included because the CRLF case alone
leaves the opposite direction unguarded, and its necessity is established by mutation M4 below
rather than by the baseline.

**Mutation proof.** Each mutation was confirmed to change the file before the suite was run, so a
no-op edit cannot be mistaken for a surviving guard. Each turns red exactly the case that owns it:

| # | mutation | result |
|---|---|---|
| M1 | skip removed — emit the generated set unconditionally | 5 pass / 2 fail — byte-identity, and the minted-file gate case |
| M2 | rebuild instead of keep — drop the existing generated rows and re-emit them | 6 pass / 1 fail — the minted-file gate case |
| M3 | terminator fixed to `\n` | 6 pass / 1 fail — the CRLF case |
| M4 | terminator fixed to `\r\n` | 6 pass / 1 fail — the LF case |

M2 is why the minted-file case exists: with no minted ids in the file, a rebuild is byte-identical
and the byte-identity case alone stays green. M4 is why the LF case exists; no other case in the
file catches it.

Also run: `npx eslint` on both changed files, exit 0. `NODE_OPTIONS=--max-old-space-size=6144 npx
tsc --noEmit --pretty false`, judged by exit code. `node scripts/release-check.mjs --base
origin/main --head HEAD`.

Dry run against the one already-generated tenant (no `--apply`, so it writes nothing):
632 rows already in the file, 133 of them from an earlier run of this generator, 133 generated,
**133 already present, 0 newly appended**. Before this change the same second run would have
appended 133 duplicate rows.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys as usual. There is no
runtime behaviour to roll out: this script is an operator-run authoring tool and is not reachable
from any request path. No migration, no flag, no environment variable, no worker job change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. This release contains no `az containerapp` call, no image
  reference, no scale, secret, env var or traffic change.
- Approved image digest: whatever digest the main deploy workflow produces for the squash SHA; this
  release neither pins nor changes one.
- ACA runtime invariant: to be read after merge — Container App template image, 100%-traffic
  revision image and both required worker images equal, and the revision Healthy.
- Worker image invariant: as above; no worker job definition changes here.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no.** Nothing this change touches is reachable from a product
  surface; the evidence that matters is the CI suite and the ledger gate, both listed above.

## Rollback Plan

Revert the single squash commit. There is nothing to undo beyond the two files: no tenant file is
written by this release, no schema changes, no migration to replay, and no runtime state to
restore. A revert returns the generator to appending duplicates on a repeat `--apply`, which the
identity-ledger gate would again refuse — so the pre-change behaviour remains detectable rather than
silent.

## Audit Evidence

- The pull request for this release record and its two files, with the before/after and mutation
  numbers above restated in the PR body.
- CI run of `.github/workflows/tenant-identity-ledger.yml` on the PR head: the four new cases are
  inside `npm run check:identity-ledger`, so their presence in CI is checkable from the job log
  rather than asserted here.
- The main deploy workflow run at or after the squash SHA, and the ACA digest read taken from it.
- The claim and release lines for item D-515 in the execution register, which carry the same
  numbers.

## Known Gaps

- The repeat-`--apply` defect is fixed at the generator. The one tenant already generated carries no
  duplicate rows — the dry run above reports 133 of 133 generated rows already present and 0 to
  append — so no tenant data repair is owed by this item.
- The skip is keyed on `data_asset_name`. A row whose name is edited by hand after generation would
  be regenerated alongside the edited copy rather than recognised as the same object. That is the
  same assumption the owning minter's ledger already makes about this key column, so it is recorded
  here as a shared assumption and not introduced by this change.
- Generated rows are recognised by the `source_file` marker this generator stamps. A row with that
  marker stripped is invisible to the skip. No such row exists in any tenant file today; the
  condition is stated so that a later reader does not have to rediscover it.

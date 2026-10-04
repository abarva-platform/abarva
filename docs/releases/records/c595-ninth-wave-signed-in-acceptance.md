# 2026-10-04-c595-ninth-wave-signed-in-acceptance — Ninth-wave signed-in walk

## Release ID

`2026-10-04-c595-ninth-wave-signed-in-acceptance`

## Status

`released`

## Release Lane

`internal-admin` — an acceptance record and this release record. No client
surface, route, component, read model or tenant-visible behaviour changes.

## Plain-English Summary

Nine merges were deployed with a client-visible surface, no signed-in verdict
anywhere, and no open item that owned them. They were not found by reading a
list — they were what remained after the previous wave's ancestor sweep
dispositioned everything else. This records what a signed-in reader actually saw
on the serving build, as one dated block in the acceptance matrix: one row per
surface, each marked **pass / fail / blocked**.

The sweep was **re-derived rather than inherited**, which is what the item asked
for and what it was worth: it now returns 54 first-parent merges against the 51
the previous wave swept. The three that are new were checked rather than
assumed — each touches zero non-test product files, so none adds residue.

**Three of the seven walked merges are proven; two are not, and the record says
so rather than rounding up.** The Home enterprise-context work is blocked on a
data condition no walk can clear — the context the surface needs is served as
`null` on every tenant that surface serves, including the one reaching the live
projection — and the export half is blocked on an action this acceptance
forbids. Neither is reported as a pass.

Documentation only. No route, component, test, workflow or configuration file
changed, and the walk itself performed **no write** — no upload, no template
published, no motion accepted, no NDA sent, no approval submitted, no stage
advanced, no export generated, no file downloaded.

## Layer Impact

Layer 4 surfaces were **read**, not modified. Layers 1–3 are untouched: no
intake tab, adapter, canonical object, schema, migration or tenant dataset was
read or written. One finding in the block is *about* layer 3 — the enterprise
context the Home surface reads is absent — but it is recorded as residue for the
data-plane lane, not acted on here.

## Client Applicability

- All clients: none
- Specific clients: none
- Internal only: yes — an acceptance record and this release record
- Public/demo only: none
- Feature flag: none

## Changes Included

- `docs/acceptance/signed-in-wave-acceptance-matrix.md` — new dated block,
  "2026-10-04 ninth wave — walked on serving SHA `a756bfc0ef`"
- `docs/releases/records/c595-ninth-wave-signed-in-acceptance.md` — this file

Merges given a verdict row: #8891 `f192d5c900`, #8920 `6ef989aced`,
#8921 `4298a32aea`, #8924 `daad26ec50`, #8926 `84b2aa3d47`, #8938 `1ba24079b1`,
#8941 `1ca13f73a9`. Recorded `blocked` by construction against `C-581`:
#8930 `9b8c8b67a3`, #8935 `db785a383d`.

## QA / Validation

The walk is the validation, and it is recorded surface by surface in the matrix
block rather than summarised here. Three rows **pass** (one of them on the half a
read can reach, blocked on the half that would need a write), three are
**blocked** with the precondition and the party who can clear it named, and one
merge pair is disposed of as reaching no rendered surface.

Findings worth naming outside the rows:

- **The Home enterprise context is served as `null` on every tenant the surface
  serves.** Established from both sides rather than from one empty page: the
  default preview tenant falls back to the reviewed snapshot, while the other
  reaches the live projection — and still renders none of the seven context
  headings, 0 of 7, while the frame around them is mounted on all seven. The
  server payload confirms it: the context key serializes once with a `null`
  value, and the four dependency-proof keys appear zero times in a 3.0 MB
  payload. The builder returns `null` unless five conditions hold over cited
  projection rows; which one is unmet is not a question a surface can answer.
- **The reading tool censors the walk's own verdict based on the variable name
  the walker chose.** The previous wave found that this tool's output redaction
  can manufacture a defect out of page content. It reproduces here, and it is
  worse than recorded: a literal `42` written by the walker, with no page input
  at all, is returned as a redaction placeholder under a key named
  `authorityPresent`, while a literal `7` under `plainNumber` passes. Same page,
  same expressions, different key names, different answers — with a negative
  control proving the scrubber is not simply always-on. A row written as
  `authorityRecorded: false` would read back as blocked and invite exactly the
  wrong verdict. Every affected reading in this block was re-run under a neutral
  key before being written down.

- **The residue is filed as `D-517`, and the id nearly was not.** Three claim
  lines today reported that no successor could be filed, reading the queue's
  exhausted `C-500`–`C-599` and `T-500`–`T-599` rows. Those rows are correct;
  the inference was not. The `X-600` band holding 57 free C ids belongs to
  Codex, so taking one would re-create the collision the disjoint-range rule
  exists to prevent. The finding is a data-plane condition, so it is a lane D
  item, and Claude's own `D-500`–`D-599` band has 83 free. The band table
  answers per lane *and* per agent.

Repository validation on the branch:

- `node scripts/release-check.mjs --base origin/main --head HEAD`
- Required GitHub contexts on the pull request

No code changed, so no test baseline applies and none is quoted.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow runs on merge as it does for
any change. This record carries no runtime behaviour, so `deployed` is its
ceiling for client effect; the deploy is noted for completeness only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none — this change mutates no Azure resource
- Approved image digest: not applicable; no image is built or pinned by this change
- ACA runtime invariant: read **read-only** twice to bracket the walk, at
  14:53:16Z and 15:00:24Z, and unchanged across both: template image
  `acrabarvalab001.azurecr.io/abarva/web@sha256:ca854803a00764918314befae9ace1e847e7e2f0a4682f7f6a6fb830219f7a2f`,
  identical to the image on the sole 100%-traffic revision
  `ca-abarva-web-lab-eastus--ma756bfc0` (`active: true`, `Healthy`, `Running`,
  created 14:41:37Z). No deploy landed inside the walk.
- Worker image invariant: not asserted by this change
- Feature/env flag update path: none
- Live signed-in proof required: this record **is** that proof, for the merges
  named above to the extent each row states, and for no others. Two of the nine
  are explicitly **not** proven and their rows say why.

## Rollback Plan

Revert the commit. Two documentation files; no migration, no runtime state, no
client-visible effect.

## Audit Evidence

- The matrix block itself — every verdict carries what was observed, and every
  `blocked` row names the precondition and who may clear it
- The ancestor sweep table — 54 merges, each with a disposition
- The redaction probe table, including its negative control
- The two read-only `az containerapp show` / `az containerapp revision show`
  readbacks quoted in the block
- The pull request for this change, and its required checks

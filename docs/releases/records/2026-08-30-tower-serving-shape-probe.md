# Tower — a read-only probe for the serving path's real shape

## Release ID

`2026-08-30-tower-serving-shape-probe`

## Status

`candidate`

## Plain-English Summary

Adds `npm run ops:probe-tower-serving-shape`, a read-only diagnostic that prints the deployed shape
of the Tower serving path. It changes no product behaviour and nothing calls it — it exists to be
run as an ACA Job.

It is here because two attempts to fix one cell failed, and the repository cannot explain why.

The AI portfolio table renders `$0` for the thirteen tool rollouts, where the truth is that no cost
was recorded. Two fixes shipped and neither changed the render, and after each one every artifact
in the repo still said it should have worked: the loader writes no cost key into a rollout's
display payload, the serving view is `select * from serving.tower_ai_rows(...)` whose payload is
`to_jsonb(p)`, and `nullableNum` maps JSON null to null correctly. The deployed revision was
confirmed to be serving the new image, so it is not a stale deploy.

The reason the repo cannot settle it is the second finding below: **no migration in this repository
creates any of the four `ecl_projection` tables Tower reads.** The only DDL is a draft under
`docs/architecture/sql-drafts/`. So the deployed schema — including whether
`monthly_cost_usd` is nullable or `NOT NULL DEFAULT 0`, which is exactly the question — is not
knowable from source.

The probe answers six things: the real DDL of the four tables; whether a rollout's cost is stored
NULL or 0; which keys a rollout's `display_payload_json` carries; whether any funding key appears
anywhere on the row; what the serving view hands the reader; and the JSON type of the top-level
`monthly_cost_usd`.

## Layer Impact

Lane: `internal-admin`. This lane covers AbarVa-only operations capability; no product lane is
touched. No layer changes. A new operator script and one npm entry. No product
surface reads it, no route exposes it, and it is not wired into any workflow.

## Client Applicability

**Internal only.** No client-visible behaviour changes. The probe prints shape — column names,
types, key names, null-ness and counts — and never a payload value, so its output is safe to paste
into a public artifact and contains no tenant data.

## Changes Included

- `scripts/ops/probe-tower-serving-shape.mjs` — the probe.
- `package.json` — `ops:probe-tower-serving-shape`.
- This record.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `node --check` | PASS — syntax clean |
| Mutating-statement scan | PASS — zero occurrences of insert/update/delete/drop/alter/truncate |
| `package.json` parse | PASS — still valid JSON |
| Execution against the data plane | NOT RUN — that is the next step, as an ACA Job |

Every statement is a `SELECT` against `information_schema` or a projection table.

## Rollout Plan

Merge so the next `main` image carries the script, then run it as an ACA Job against the lab data
plane with `npm run ops:aca-job`, digest-pinned, with
`--secret-env DATABASE_URL=azure-postgres-control-database-url`. Read the job's saved
`04-logs.txt` rather than `az containerapp job logs show`.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`. The probe itself runs through the
governed ACA Job wrapper. No ad-hoc `az` command mutates anything, and the job is read-only.

## Rollback Plan

Delete the script and the npm entry. Nothing depends on it.

## Known Gaps

- **`az containerapp exec` was tried first and cannot work from an agent shell.** The CLI always
  opens an interactive session — `tty.setcbreak` on non-terminal stdin raises `termios.error (19)`
  — and it exits `0` with the traceback on stderr, so a piped invocation looks like it returned
  nothing at all. `AGENTS.md` names `exec` as the allowed read-only break-glass path; in practice a
  read-only probe needs this Job pathway, and that document is worth amending.
- The probe reads the lab data plane only.
- It reports the schema; it does not reconcile it. Writing the missing migrations needs its output
  first, and then a decision about how to adopt an existing unversioned schema safely.

## Audit Evidence

`grep` for `create table if not exists ecl_projection.<name>` across `supabase/migrations/` returns
zero results for `tower_ai_portfolio`, `tower_command_center`, `tower_value_chain` and
`tower_evidence_queue`. The draft DDL declares `monthly_cost_usd numeric` (nullable); the sibling
`tower_ai_tool_usage` migrations declare the same column `NOT NULL DEFAULT 0`. The revision serving
100% of traffic was confirmed as the image built from the second failed fix before this record was
written.

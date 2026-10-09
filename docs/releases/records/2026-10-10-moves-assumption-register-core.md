# 2026-10-10 — Moves assumptions register: storage and domain rules

## Release ID

`2026-10-10-moves-assumption-register-core`

## Status

`candidate`

## Plain-English Summary

The first of five changes that build a Move-level **assumptions register**.
A Move's value and delivery documents rest on figures that are not yet
evidence. The register makes each one a record with a stable ID that
documents can cite, so a working figure is always shown as a labelled
assumption and never as a fact.

Each register row has:
- an ID made of an area letter and a number: V (value), D (data),
  DL (delivery) or A (adoption), for example V3. Documents cite it as `[A:V3]`;
- the statement, why it matters, and the working figure;
- where the figure came from, and the ROLE that owns it;
- a confidence of 1, 3 or 5 (low, medium, high);
- a status: proposed, open, confirmed, corrected, superseded or rejected.

The rules this change puts in place:
- aVa may only propose a row. A person accepts or rejects it, answers it
  (confirm or correct), or supersedes it. aVa can never move or edit a row.
- A person's own row is open at once. Anything a machine raised waits as
  proposed until a person accepts it.
- An answer must name its source. A correction must state the right answer.
- A row can be edited only while it is proposed or open.
- An ID is never reused. A correction keeps its ID. A supersede creates a
  new row with a new ID and points the old row at it.
- Every change is kept in an append-only history.
- Two people changing the same row at once cannot overwrite each other. The
  second change is refused as out of date.

This change adds the storage, the domain rules and the server store only.
There are no routes, no screen and no document generation reading the register
yet, so nothing a user sees changes, even with the flag on.

## Layer Impact

- Release lane: `client-data-lane`, feature-flagged. It adds client-scoped
  schema (two new tables with row-level security) and a tenant-fenced store.
- Layer 3, canonical model: adds the register as a canonical object. Each row
  has an ID and belongs to one Move and one tenant. No existing table changes,
  no rows are backfilled, and nothing is inferred from existing data.
- Layer 4, products: no product surface reads the register in this change.
  The generation contract's assumption type gains optional fields only, so
  every existing producer is unchanged.
- Layers 1 and 2: no intake or adapter changes.
- Governance: the register is declared as a Move-scoped dataset. Each row
  projects to a governed context object that the policy evaluates to `warn`.
  It never claims agent readiness.

## Client Applicability

- All clients: no behaviour change. The new tables are empty until the later
  routes write to them.
- Specific clients: the synthetic demo tenant has the flag on. Nothing reads
  the flag yet.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_assumption_register_v1` (tenant policy, synthetic demo
  tenant only).

## Changes Included

- `supabase/migrations/20261010120000_move_assumption_register.sql` (new):
  - `move_assumptions`, with CHECKs for the vocabularies and the confidence
    scale;
  - the register ID is derived from area and number in the database itself;
  - an answered row must name its source and time, a correction must state its
    answer, and a superseded row must point at its replacement;
  - an aVa proposal can reach the working register only with a recorded
    acceptance;
  - unique register IDs per Move, and one row per carried-forward charter
    section;
  - `move_assumption_events`, the append-only history: one event per revision,
    and authenticated update and delete are denied;
  - row-level security on both tables: service role full access, and
    authenticated read of the reader's own tenant only. The SQL is additive
    and re-runnable.
- `src/lib/programs/assumption-register/model.ts` (new, pure):
  - types, the ID scheme, and the transition table with typed refusals;
  - edit rules, and the 1/3/5 to low/medium/high mapping;
  - citation parsing (`[A:V3]`) and row mapping;
  - the generation view, which carries the owner role and never a personal
    name;
  - the governed-object projection, and the filter for rows that may enter
    agent context.
- `src/lib/programs/assumption-register/store.ts` (new, server-only):
  - list, create, edit, transition and supersede;
  - every read and write is fenced by all of this tenant's keys and the Move
    id;
  - a new row is written only for a Move the caller's client owns;
  - every change is guarded by revision, and new IDs are retried on a unique
    violation, a bounded number of times;
  - each change appends one history event. A failed history write says the
    change landed;
  - a read error is thrown, never shown as an empty register.
- `src/lib/deliverables/orchestrator/types.ts`: optional register fields on
  the approved-assumption type.
- `src/lib/features/registry.ts`: the new flag. The Nexus manual is
  regenerated from it.
- `src/scripts/verify-azure-postgres-schema.ts` and
  `src/scripts/verify-moves-current-state-schema.ts`: the two tables join the
  required Moves schema readback.
- `docs/governance/dataset-manifests/moves-assumption-register-v1.json` (new):
  the dataset declaration (Move registry scope, confidential, Move-scoped
  prompt context, retrieval proof required). It is a declaration only; it
  approves no load and no serving.
- Two new test suites under `src/lib/programs/__tests__/`, and the regenerated
  test CI coverage census.

## QA / Validation

- New suites pass. The model suite has 135 tests and the store suite has 33.
  - Model: every status and action pair against the decided edge list. aVa is
    refused on every edge. Answer source and correction answer are required.
    Edits are limited to proposed and open. The suite covers ID prefixes, round
    trips, sequence max+1 over every status, and citation parsing with
    near-misses. It checks the confidence mapping, row mapping, the generation
    view, and the governed projection under the real policy (`warn`, never
    agent ready, unknown tenant blocked). It also checks that the migration's
    CHECK lists match the model.
  - Store, against an in-memory client: the tenant fence across both of the
    tenant's keys, and refusal of another tenant's row with the same Move id.
    It covers the Move ownership check before a write, the revision guard
    before and during a write, and the unique-violation retry with its bound.
    An ID held by a superseded or rejected row is never reused. A supersede
    makes a new ID and names the replacement on a late refusal. The suite also
    checks history events and the history-failure error.
- Mutation checks: pass. 74 mutations were applied one at a time and 73 failed
  a test. The survivor swaps the order of `DL` and `D` in the ID pattern. That
  is behaviour-neutral by construction, because every use of the pattern is
  anchored. The code comment now says so.
- Affected suites: pass. The programs library, features, governance,
  orchestrator and decision-model suites ran 296 suites and 4,358 tests.
- Migration-scanning suites: pass (admin migrations, RLS lockdown, per-user RLS
  and enum sweep; 259 tests).
- `npm run typecheck`: pass. ESLint on the changed files: pass. New files
  follow Prettier. The two verifier scripts keep their existing single-quote
  style.
- `node scripts/audit-migrations.mjs`: pass, with no finding for the new
  migration. The runner's destructive-pattern scan finds nothing in it.
- `npm run migration:seals:check`: pass.
- `npm run audit:enum-reachability`: pass.
- `npm run check:export-reachability`: pass.
- `npm run validate:context-corpus`: pass, all checks, manifests included. The
  new manifest gives one warning: its approver names a role, not a person.
  Several existing manifests give the same warning.
- `npm run docs:nexus-manual:check`: pass.
- Test CI coverage census: pass. Both new test files are swept, and covered
  test files went from 2,766 to 2,768.
- Migration replay against a database: not run. The migration was not applied
  to any database from this change. CI's fresh-Postgres replay
  (`azure-l5-reset-replay.yml`) replays it on the pull request.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. The migration does not
apply on merge. It is applied only through the governed migration lane,
`.github/workflows/db-migration-lab.yml`, in explicit `apply` mode after its
approval gates. That lane's schema readback and Moves current-state readback
then confirm both tables. The flag is on for the synthetic demo tenant, but
nothing reads it until the routes change (the second of the five).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow. The schema is applied
  only through `.github/workflows/db-migration-lab.yml`.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: verify the required worker images match the
  approved digest.
- Feature/env flag update path: code registry (`includeTenants`).
- Live signed-in proof required: none for this change, because no surface
  reads the register. After the migration lane applies it, record the lane run
  and its schema readback here.

## Rollback Plan

Revert through a pull request. The application code is unreachable from any
route, so reverting it changes no behaviour. The migration is additive. If it
has been applied, leave the empty tables in place rather than dropping them,
and repair forward with a new migration if the schema needs to change. Once
the migration is applied it must be sealed, and the sealed file must not be
edited.

## Audit Evidence

- Pull request and CI results, including the fresh-Postgres migration replay.
- The suites and mutation results above.
- After apply: the migration lane run, its schema readback and its Moves
  current-state readback.

## Known Gaps

- The migration is not applied to any database by this change. It is applied
  through the governed migration lane. Until then the register cannot store
  anything, and `db:azure:verify` and `db:verify:moves-current-state-schema`
  report the two tables as missing. That includes the tenant-copy job, which
  runs the schema verifier. Apply the migration before the next run of either.
- After apply, the migration must be sealed in
  `docs/releases/migration-seals.json`.
- No routes, aVa tool, screen, charter bridge, document generation or
  validator enforcement read or write the register yet. They are the next four
  changes.
- The data plane has no multi-statement transaction here. A change and its
  history event are two writes. A failed event write is reported as
  "change saved, history not recorded" and is not retried automatically.
- The dataset manifest's approver is recorded as a product-owner authorization
  (a role), not a named person. No load or serving approval is claimed.

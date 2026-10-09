# 2026-10-10 — Moves assumptions register: storage, domain rules, routes and the aVa propose tool

## Release ID

`2026-10-10-moves-assumption-register-routes`

## Status

`candidate`

This record covers the whole release: the storage and domain rules and the
routes and aVa tool ship as one pull request. The storage change's own record,
`2026-10-10-moves-assumption-register-core.md`, stays in place as the detail
for that half.

## Plain-English Summary

The first two of five changes that build a Move-level **assumptions
register**, shipped together as one release. A Move's value and delivery
documents rest on figures that are not yet evidence. The register makes each
one a record with a stable ID that documents can cite, so a working figure is
always shown as a labelled assumption and never as a fact.

Each register row has:
- an ID made of an area letter and a number: V (value), D (data),
  DL (delivery) or A (adoption), for example V3. Documents cite it as `[A:V3]`;
- the statement, why it matters, and the working figure;
- where the figure came from, and the ROLE that owns it;
- a confidence of 1, 3 or 5 (low, medium, high);
- a status: proposed, open, confirmed, corrected, superseded or rejected.

The rules:
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

What this release adds on top of the storage and rules:
- **The register API** for a Move: list the register, add a row, edit a row,
  and record a decision (accept, reject, answer or supersede). A row added
  through the API is always a team row; the request cannot set where a row
  came from or its status.
- **Who may do what.** Anyone who can open the Move can read its register. Only
  a Move member who is not view-only can change it. Every refusal says, in a
  sentence, what was or was not saved and what to do next.
- **Figures are withheld** from a viewer whose access does not include
  financial data: every figure is removed and the text fields are passed
  through the shared restricted-financial filter.
- **aVa's propose tool** (`propose_assumption`) in the Moves chat. It can only
  add a proposed row, and it requires a statement, the working figure, a
  source, an owner role (it refuses something that reads like a person's
  name) and a confidence of 1, 3 or 5.

There is still no screen and no document generation reading the register, so
with the flag on the only thing a user can see is aVa proposing an assumption
in the Moves chat.

## Layer Impact

- Release lane: `client-data-lane`, feature-flagged. It adds client-scoped
  schema (two new tables with row-level security), a tenant-fenced store, and
  Move-scoped routes over it.
- Layer 3, canonical model: adds the register as a canonical object. Each row
  has an ID and belongs to one Move and one tenant. No existing table changes,
  no rows are backfilled, and nothing is inferred from existing data.
- Layer 4, products: Moves gains the register API and one aVa tool. No screen
  reads the register yet. The generation contract's assumption type gains
  optional fields only, so every existing producer is unchanged.
- Layers 1 and 2: no intake or adapter changes.
- Governance: the register is declared as a Move-scoped dataset. Each row
  projects to a governed context object that the policy evaluates to `warn`.
  It never claims agent readiness. aVa writes to it only as proposals.

## Client Applicability

- All clients: no behaviour change. With the flag off every register route
  refuses with `register_not_enabled` and the aVa tool proposes nothing.
- Specific clients: the synthetic demo tenant has the flag on.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_assumption_register_v1` (tenant policy, synthetic demo
  tenant only).

## Changes Included

Storage and domain rules:
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
- `src/lib/programs/assumption-register/model.ts` (new, pure): types, the ID
  scheme, the transition table with typed refusals, edit rules, the 1/3/5 to
  low/medium/high mapping, citation parsing (`[A:V3]`), row mapping, the
  generation view (owner role, never a personal name), the governed-object
  projection, and the filter for rows that may enter agent context.
- `src/lib/programs/assumption-register/store.ts` (new, server-only): list,
  create, edit, transition and supersede. Every read and write is fenced by all
  of this tenant's keys and the Move id; a new row is written only for a Move
  the caller's client owns; every change is guarded by revision; new IDs are
  retried on a unique violation, a bounded number of times; each change appends
  one history event, and a failed history write says the change landed; a read
  error is thrown, never shown as an empty register.
- `src/lib/deliverables/orchestrator/types.ts`: optional register fields on
  the approved-assumption type.
- `src/scripts/verify-azure-postgres-schema.ts` and
  `src/scripts/verify-moves-current-state-schema.ts`: the two tables join the
  required Moves schema readback.
- `docs/governance/dataset-manifests/moves-assumption-register-v1.json` (new):
  the dataset declaration (Move registry scope, confidential, Move-scoped
  prompt context, retrieval proof required). It approves no load and no
  serving.

Routes and the aVa tool:
- `src/app/api/v1/programs/[programId]/assumptions/route.ts` (new): `GET` the
  register, `POST` a team row (origin `team`, opened at once).
- `src/app/api/v1/programs/[programId]/assumptions/[assumptionId]/route.ts`
  (new): `PATCH` an edit, guarded by `expectedRevision`.
- `src/app/api/v1/programs/[programId]/assumptions/[assumptionId]/decision/route.ts`
  (new): `POST` accept, reject, answer (`outcome` confirmed or corrected) or
  supersede (to an existing row, or with a new replacement row).
- `src/lib/programs/assumption-register/assumption-register-refusal.ts` (new,
  pure): the refusal codes (`forbidden`, `stale_revision`,
  `invalid_transition`, `answer_source_required`, `unknown_assumption`,
  `register_not_enabled`, `bad_request`, plus `id_allocation_conflict`,
  `register_read_failed`, `register_write_unconfirmed` and
  `supersede_incomplete`), their HTTP statuses, and one authored sentence per
  refusal that states what did or did not land. What can still be done to a
  row is read from the transition table, so the sentence cannot drift from the
  rules. A Move that cannot be read keeps the shared cause-blind 404 body.
- `src/lib/programs/assumption-register/register-request.ts` (new, pure):
  request parsing (the body never sets `origin` or `status`; the area never
  changes on an edit) and the viewer projection that withholds figures.
- `src/lib/programs/assumption-register/register-route-access.ts` (new,
  server-only): the flag, Move and per-Move access ladder every route runs,
  and the answers for a write that landed (including one whose history entry
  failed).
- `src/lib/agent/tools/program/proposeAssumption.ts` (new): the
  `propose_assumption` tool on the Move and Moves phase surfaces. It writes
  origin `ava_proposal` with actor kind `ava`, so the row is always proposed,
  and it reaches the store only through `createAssumption`.
- `src/app/api/chat/agent/route.ts`: registers the tool, as every other agent
  tool is registered.
- `src/lib/features/registry.ts`: the flag, with its summary describing this
  release. The Nexus manual is regenerated from it.
- Tests: two model and store suites under `src/lib/programs/__tests__/`, the
  route suite `src/app/api/v1/programs/[programId]/assumptions/__tests__/route.test.ts`,
  the tool suite `src/lib/agent/tools/__tests__/proposeAssumption.test.ts`, and
  the model-facing schema check now imports the new tool.
- `.github/workflows/ai-surface-control-catalog.yml`: a directory step runs the
  register route suites in the required job. The tool suite is already swept
  by that job's `src/lib/agent/tools/__tests__` directory step.
- The regenerated test CI coverage census.

## QA / Validation

- Storage and domain suites (unchanged from the storage change): the model
  suite has 135 tests and the store suite has 33. They cover every status and
  action pair, the ID scheme, the tenant fence, the revision guard, the ID
  retry, supersede, history, and the governed projection. 74 mutations, 73
  killed; the survivor (the order of `DL` and `D` in the anchored ID pattern)
  is behaviour-neutral by construction.
- Route suite: 98 tests. The flag, the unreadable Move (shared 404
  body), a viewer and a member outside the Move's grants (403), each write as
  a client admin, the read and mutation route families, every decision
  (accept, reject, answer confirmed, answer corrected, supersede to an existing
  row, supersede with a new row) and every refusal with its exact sentence. A
  stale revision is a 409 that writes nothing. Figures are withheld from a
  viewer without financial visibility. The body cannot set `origin` or
  `status`. A write whose history entry failed is reported as saved, and a
  supersede whose replacement landed names the replacement. The store stand-in
  applies the real domain model, so the transition cases run the real rules.
- Tool suite: 33 tests. A proposal is always origin `ava_proposal`,
  actor `ava` and status proposed, whatever status or origin the input
  carries; every required field is refused by name before anything is
  written; personal names (two or three capitalised words with no role word,
  an email address, an honorific) are refused as owners and roles are
  accepted; the flag, the Move read and the write policy hold; and the tool
  imports only `createAssumption` from the store.
- Mutation checks: pass. 100 mutations over the routes, the refusal, request and access modules and the tool were applied one at a time, each restored from an in-memory copy; 99 failed a test. The survivor maps the store's `actor_not_permitted` refusal to `forbidden`; it is unreachable from these routes, which always act as a person, so it is behaviour-neutral by construction. Earlier survivors were closed by new cases (a row superseded by itself, an unknown answer outcome, the revision passed through on an edit) or by removing a redundant check.
- `src/lib/agent/tools/__tests__` (all suites, including the model-facing
  schema check over every registered tool): pass, 14 suites and 130 tests.
- Affected suites: pass. The register model and store suites, the features suites, the register route suite, the agent tool and agent suites and the chat agent route suites ran 63 suites and 1,115 tests.
- `npm run typecheck`: pass. ESLint on the changed files: pass with no errors
  or warnings. New files follow Prettier.
- `node scripts/audit/route-reachability-check.mjs`: pass (no new unreachable
  components or exports). `npm run check:export-reachability`: pass.
- `npm run audit:lib-orphans`: no change against the baseline. The model and
  store are now reached through the routes, and the tool through the agent
  route.
- `npm run docs:nexus-manual:check`: pass.
- Test CI coverage census: pass. Test files went from 2,932 to 2,934 and covered test files from 2,768 to 2,770: exactly the two new suites. The route suite is covered by the new required-job directory step (and by `unit-suites.yml`'s broad v1 argument); the tool suite by the required job's `src/lib/agent/tools/__tests__` directory step. `node scripts/quality/check-named-suite-requiredness.mjs` and `npm run audit:ai-surface-controls`: pass.
- Migration replay against a database: not run. The migration was not applied
  to any database from this change. CI's fresh-Postgres replay
  (`azure-l5-reset-replay.yml`) replays it on the pull request.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. The migration does not
apply on merge. It is applied only through the governed migration lane,
`.github/workflows/db-migration-lab.yml`, in explicit `apply` mode after its
approval gates. That lane's schema readback and Moves current-state readback
then confirm both tables. Until it is applied, the register routes for the
synthetic demo tenant answer reads with `register_read_failed` and writes with
`register_write_unconfirmed`, and the aVa tool answers `proposal_unconfirmed`;
nothing else changes. Apply the migration before walking the register in the
demo tenant.

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
- Live signed-in proof required: after the migration lane applies the schema,
  a signed-in demo-tenant walk that lists the register, adds a team row,
  answers it, and asks aVa to propose an assumption that then appears as
  proposed. Record the lane run and the walk here. Until then this release is
  `deployed`, not `live-proven`.

## Rollback Plan

Revert through a pull request, or turn the flag off for the demo tenant in the
code registry; with the flag off every register route refuses and the aVa tool
proposes nothing. The migration is additive. If it has been applied, leave the
tables in place rather than dropping them, and repair forward with a new
migration if the schema needs to change. Once the migration is applied it must
be sealed, and the sealed file must not be edited.

## Audit Evidence

- Pull request and CI results, including the fresh-Postgres migration replay
  and the required job's register route step.
- The suites and mutation results above.
- After apply: the migration lane run, its schema readback and its Moves
  current-state readback, and the signed-in walk.

## Known Gaps

- The migration is not applied to any database by this change. It is applied
  through the governed migration lane. Until then the register cannot store
  anything, and `db:azure:verify` and `db:verify:moves-current-state-schema`
  report the two tables as missing. That includes the tenant-copy job, which
  runs the schema verifier. Apply the migration before the next run of either.
- After apply, the migration must be sealed in
  `docs/releases/migration-seals.json`.
- No screen, charter bridge, document generation or validator enforcement
  reads the register yet. They are the next three changes.
- The data plane has no multi-statement transaction here. A change and its
  history event are two writes. A failed event write is reported as
  "change saved, history not recorded" and is not retried automatically. A
  supersede with a new replacement is three writes; if the replacement lands
  and the supersede does not, the refusal names the replacement so the
  supersede can be finished against it.
- Figures are withheld for every area (value, data, delivery and adoption)
  from a viewer without financial visibility, not only for value figures. The
  canonical client-admin demo accounts resolve without financial visibility,
  so they will see the register with figures withheld.
- The owner-role check in the aVa tool is a heuristic: it refuses an email
  address, an honorific, or two or three capitalised words with no role or
  function word. A personal name written another way could pass it, and an
  unusual role written like a name could be refused (the refusal asks for the
  role).
- The dataset manifest's approver is recorded as a product-owner authorization
  (a role), not a named person. No load or serving approval is claimed.

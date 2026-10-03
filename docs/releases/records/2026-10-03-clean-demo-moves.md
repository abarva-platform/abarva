# 2026-10-03-clean-demo-moves — Clean demo Move set for a demo tenant

## Release ID

`2026-10-03-clean-demo-moves`

## Status

`candidate`

## Plain-English Summary

The signed-in Moves demo board currently shows test-named moves ("Synthetic Agent
Assist Claude E2E 1002") and placeholder charter content ("ROLE-01 …
authority_matrix.csv") that read as internal test scaffolding. This adds a
reviewable content spec for a clean, realistic five-move portfolio to show a
client instead — grounded in the demo tenant's interview-derived candidate
opportunities, and honest about state (early phases only, no fabricated funded
value, open evidence named).

This change is **code only — it does not touch the database.** Putting these on
the live board is a separate, coordinated operator data-build (an ACA job), done
together with the workstream that is actively advancing that tenant's
evidence/phase state.

## Layer Impact

Release lane: `public-demo` — a client-demo artifact. No runtime behavior change
until a coordinated load.

- No product-code layer changes. The spec lives under `scripts/demo/` and is
  consumed only by a future coordinated loader.

No change to the canonical model, source adapters, product UI, or client intake.

## Client Applicability

- All clients: no.
- Public/demo only: yes — the demo tenant's Moves board, once loaded.
- Feature flag: none (the content is inert until loaded).

## Changes Included

- `scripts/demo/clean-demo-moves.ts`: typed content spec for five demo moves
  (governed data foundation, call center optimization, payment integrity,
  end-to-end cost transparency, member service agent assist), with grounded
  systems/data/evidence and full P1 charter content for the chartered moves.
  Every object is labelled `synthetic`.
- `scripts/demo/README-clean-demo-moves.md`: what it is, the grounding and
  honesty boundary, and the coordinated-apply contract (ACA job, idempotent
  upsert by `initiativeLink`, reuse the existing seed machinery).
- `scripts/demo/__tests__/clean-demo-moves.test.ts`: validates the set.

## QA / Validation

- `npx jest scripts/demo/__tests__/clean-demo-moves.test.ts` — 5 tests pass:
  exactly five synthetic-labelled moves; no builder vocab / test-run ids /
  placeholder scaffolding on any field; early phases only and no fabricated
  funded value; every chartered move carries all six P1 inputs; names and ids
  match the derived candidate opportunities in the source artifact.
- Scoped `tsc`: no type errors. `eslint`: clean.
- `npm run release:check --base origin/main --head HEAD`: all gates pass.

## Rollout Plan

Merge to main via squash. **No runtime rollout.** The spec is inert until a
coordinated ACA data-build job loads it, which is a separate step done with the
evidence/phase workstream.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` carries the
  file to the image, but the file has no runtime effect.
- Data load: a separate ACA data-build job (per `docs/ops/aca-data-build-job-rule.md`),
  coordinated with the evidence/phase workstream (see PR #8907). Not run here,
  and never as a solo mutation.
- Live signed-in proof required: after the coordinated load — five moves on the
  board, realistic names, honest early phases, no placeholder charter text.

## Rollback Plan

Revert the PR (removes the inert spec). If the content has been loaded, the
coordinated job's rollback window / idempotency key (per the data-build job rule)
is the unwind path; this PR itself changes no runtime state.

## Audit Evidence

- PR URL: (added on open).
- CI run on the PR.
- The spec's grounding source is the candidate-opportunity artifact referenced in
  `scripts/demo/README-clean-demo-moves.md`.

## Known Gaps

- The live board is not changed by this PR; the clean set appears only after the
  coordinated load.
- The cost-transparency move is seeded at Originate with no charter content yet
  (correct for that phase); the other four carry full charter content.

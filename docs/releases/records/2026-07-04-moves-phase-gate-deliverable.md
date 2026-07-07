# 2026-07-04-moves-phase-gate-deliverable — Create the phase gate deliverable on capture so Approve can advance a Move

## Release ID

`2026-07-04-moves-phase-gate-deliverable`

## Status

`candidate`

## Plain-English Summary

Follow-on to `2026-07-04-moves-phase-capture-key-alignment`. With the capture key drift fixed, the Strategic Moves phase workspace can now Save all required inputs — but the next step, **Approve**, stayed dead: it is gated on a phase "gate deliverable" (the Charter for P1, Discovery Report for P2, etc.) that nothing ever created. The Save route persisted capture fields but hardcoded `recordCreated: false` and never returned a `deliverableId`, while the client's Approve button only enables once it has one. So a Move still could not advance past its gate through the primary UI.

This change makes the signed-in phase-capture **Save** create-or-find the phase gate deliverable (in `in_review`, ready to sign off) once every required section is captured, and return `deliverableId` + `allSaved` + `recordCreated`. The client's existing Save → Approve → Generate sequence now works end to end: Save → gate deliverable exists → Approve signs it off → the `*_signed_off` hard gate check passes → the Move advances.

## Layer Impact

- `global-control-lane`: shared Strategic Moves phase progression for all clients. Adds a governed write (the phase gate deliverable) to the signed-in `POST /api/v1/programs/:id/phase-capture` route and a reusable `ensurePhaseGateDeliverable` mutation. Idempotent and non-destructive — an existing (including `signed_off`) deliverable is returned untouched, so re-saving never resets approval or bumps versions.

## Client Applicability

- All clients: yes — every tenant using the Strategic Moves phase workspace (P1–P5).
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none (restores the intended primary-flow behavior).

## Changes Included

- `src/lib/programs/mutations.ts` — new `ensurePhaseGateDeliverable(ctx, programId, { deliverableTypeKey, title, content? })`: FK-safe (`ensureDeliverableType`), create-or-find, creates a new record directly in `in_review`, returns `{ deliverableId, status, created }`. Never mutates an existing row.
- `src/app/api/v1/programs/[programId]/phase-capture/route.ts` — when `evaluation.complete` for phases 1–5, calls the helper and returns `allSaved`, `recordCreated`, `deliverableId` (best-effort: a record-creation failure surfaces `recordError` but never fails the capture write). Adds the `PHASE_GATE_DELIVERABLE` phase→type map (mirrors client `PHASE_WORKFLOW` + governance `*_signed_off` checks).
- `src/lib/programs/__tests__/ensure-phase-gate-deliverable.test.ts` (new) — asserts a fresh gate deliverable is created in `in_review`, typed, and owned; and that an existing (e.g. `signed_off`) record is returned untouched with no insert.

## QA / Validation

- `npx tsc --noEmit -p tsconfig.json` → **0 errors**.
- `npx jest ensure-phase-gate-deliverable` → **2 passed**.
- `npx eslint` on changed files → clean.
- Live pre-fix evidence (`app.abarva.ai`, Lakeshore Move `908c9bf8…`, P1, post key-alignment fix): Save returned `savedFields:[all 6]`, `missing:[]`, but `recordCreated:false` and no `deliverableId`; the Move had no `charter` deliverable, so Approve stayed disabled.
- Live post-fix proof: **pending deploy** — after this deploys, Save on a complete P1 must return `recordCreated:true` + `deliverableId`, Approve must enable and sign off the charter, and the Move must advance P1→P2. Localhost cannot reach the private Postgres, so proof is only observable on the deployed ACA revision.

## Rollout Plan

Merge to `main` → ACA image build from the merged SHA → deploy to `ca-abarva-web-lab-eastus` (auto via "ACA main deploy") → new revision to 100% traffic → verify `app.abarva.ai` P1 Save → Approve → advance live. No migration, no env/flag change.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy" (auto on push to `main`); runbook `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: adds a `deliverables_v2` + `deliverable_versions` write on the phase-capture path (governed, tenant-fenced via `assertProgramTenancy`).
- Approved image digest: recorded at deploy time.
- ACA runtime invariant: web revision only; no worker/job image change.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — P1 Save creates the charter, Approve enables and signs off, Move advances.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision (`m75a76d5a`). The change only adds a create-or-find write; reverting stops new gate deliverables being created on Save. Any gate deliverables already created remain valid `deliverables_v2` rows (no destructive migration, nothing to unwind).

## Audit Evidence

- PR URL: (added on open)
- CI: `tsc` clean + jest 2 passed + eslint clean.
- Pre-fix live capture response on Move `908c9bf8-e745-45dc-9ad8-3d493a2a1c8a` (P1): `recordCreated:false`, no `deliverableId`.
- Post-deploy: live signed-in screenshot of P1 Save → Approve (charter `signed_off`) → P1→P2 advance.

## Known Gaps

- Post-deploy live proof pending (see QA / Validation).
- The board-grade charter **generation** (Generate step) remains evidence-gated by design ("Final build blocked by required evidence") — unaffected by this change. Approve signs off the gate record; Generate enriches it. Advancement does not require the generated artifact.
- P2 advancement additionally requires evidence-driven hard checks (discovery notes ingested, baseline attested) beyond the signed-off report — expected governed behavior, not addressed here.

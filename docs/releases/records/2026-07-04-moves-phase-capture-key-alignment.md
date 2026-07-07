# 2026-07-04-moves-phase-capture-key-alignment — Fix Moves P1–P5 capture Save (workspace ↔ contract key drift)

## Release ID

`2026-07-04-moves-phase-capture-key-alignment`

## Status

`candidate`

## Plain-English Summary

In the Strategic Moves workspace, each phase (Charter P1 through Mobilize P5) asks the user to capture a set of inputs, then Save → Approve → Generate. The Save button was silently doing nothing: it persisted **zero** fields, so "Approve" never enabled and **no Move could advance past its phase gate** through the primary workflow.

Root cause: the workspace's capture cards had drifted away from the canonical `phase-capture-contract.ts`. The cards sent keys like `sponsor`, `success_metrics`, `scope`, while the server route only accepts the contract keys `sponsor_commitment`, `success_criteria`, `scope_boundary`, etc. With **zero key overlap on every phase**, every Save was a no-op (`savedFields: []`, `recordCreated: false`). It was masked because the P0→P1 charter carry pre-fills 4 cards through a different write path, so the cards *looked* populated.

The fix makes the workspace **derive its P1–P5 capture cards directly from the canonical contract**, so each card's id *is* the exact server field key — the card set, labels, and keys are now one source of truth and can't drift again. The pre-fill map and structured-field pre-fill were re-keyed to the canonical keys so the P0→P1 carry still populates cards. A regression test locks the invariant.

## Layer Impact

- `global-control-lane`: shared Strategic Moves workspace behavior (`StrategicMovePhaseClient`) for all clients. Corrects the client/server capture-key contract so the Save → Approve → Generate gate sequence functions. No schema, data-plane, or contract change — the server contract was already correct; the client was conformed to it.

## Client Applicability

State exactly who receives the change.

- All clients: yes — every tenant using the Strategic Moves phase workspace (P1–P5).
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none (not gated — this restores baseline correctness of the primary workflow).

## Changes Included

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`
  - P1–P5 `PHASE_CANVAS_SECTIONS` now derived from `getPhaseCaptureSections(phase)` (ids = canonical contract keys); P0 read-only cards unchanged.
  - `SECTION_CHARTER_KEYS` and `sectionCapturedContent` re-keyed to canonical P1 keys so the P0→P1 charter carry still pre-fills cards.
  - Corrected the stale comment that asserted the naive `hyphen→underscore` id transform "matches PHASE_CAPTURE.fields" (it did not).
- `src/lib/programs/__tests__/phase-capture-workspace-alignment.test.ts` (new) — regression guard: canonical keys satisfy `evaluatePhaseCapture` for P1–P5; the historical drifted P1 ids do **not** (encodes the exact bug); P3–P5 share the generic binder.

## QA / Validation

- `npx tsc --noEmit -p tsconfig.json` → **0 errors**.
- `npx jest phase-capture-workspace-alignment phase-capture-contract` → **11 passed** (7 new).
- Live reproduction (pre-fix, `app.abarva.ai`, Lakeshore Move `908c9bf8…`, P1): real Save button and a direct `POST /api/v1/programs/{id}/phase-capture` both returned `savedFields: []`, `recordCreated: false` with the client keys; the route echoed the canonical keys (`sponsor_commitment`, `scope_boundary`, `success_criteria`, `stakeholder_map`, `decision_rights`, `evidence_plan`) as the accepted set — confirming the mismatch.
- Live post-fix proof: **pending deploy** (localhost cannot reach the private Azure Postgres; the Save/Approve/gate path is only observable on a DB-connected ACA revision). Re-run: fill P1 cards → Save → expect `allSaved: true` + `recordCreated: true` → Approve enables → advance P1→P2.

## Rollout Plan

Merge to `main` → ACA image build from the merged SHA → deploy to `ca-abarva-web-lab-eastus` → shift 100% traffic to the new revision → verify `app.abarva.ai` P1 Save/Approve live. No migration, no env/flag change.

## Deployment Authority

- Repo-owned deploy workflow: standard ACA lane (`docs/runbooks/azure-container-apps-deploy.md`).
- Shared runtime mutators: none.
- Approved image digest: to be recorded at deploy time.
- ACA runtime invariant: web revision only; no worker/job image change.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — P1 Save persists all required fields and Approve enables on a real Move.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision (`f6ad695aa`). No data migration to unwind — this change only alters which keys the client sends; reverting restores the prior (broken-but-inert) behavior. No persisted data is corrupted by either direction.

## Audit Evidence

- PR URL: (to be added on open)
- CI: `tsc` clean + jest 11 passed (above).
- Live pre-fix evidence: `phase-capture` responses with `savedFields: []` on Move `908c9bf8-e745-45dc-9ad8-3d493a2a1c8a` (P1), captured during the 2026-07-04 dry-run.
- Post-deploy: live signed-in screenshot of P1 Save → Approve → P2 advance.

## Known Gaps

- Post-deploy live proof is pending (see QA / Validation).
- Separate, lower-severity observation from the same dry-run (out of scope here): the phase-workspace coaching chat (`/api/chat/agent`) does not receive the Move's persisted capture context on follow-up turns, so aVa can ask for a sponsor/scope the read-model already shows. Not a record-blocker (capture/approve/advance are deterministic buttons); tracked separately.
